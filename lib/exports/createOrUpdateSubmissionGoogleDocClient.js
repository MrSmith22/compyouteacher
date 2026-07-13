/**
 * WP-028/WP-029/WP-030 — Shared client create/update/replacement + verification.
 * Server write: /api/export-to-docs (session-bound).
 * Revisit verify: /api/verify-submission-doc (session-bound).
 */

import { getFinalTextForExport } from "@/lib/supabase/helpers/studentDrafts";
import { getExportedDocLink } from "@/lib/supabase/helpers/studentExports";
import { logActivity } from "@/lib/logActivity";
import {
  SUBMISSION_DOC_STATUS,
  getSubmissionDocStatusMessage,
  reasonFromSubmissionDocOperation,
} from "@/lib/exports/submissionGoogleDocClientMessages";
import {
  SUBMISSION_DOC_VERIFICATION_STATUS,
  getSubmissionDocVerificationMessage,
  SUBMISSION_DOC_VERIFICATION_EXPLAIN,
  SUBMISSION_DOC_MISMATCH_RECOVERY,
} from "@/lib/exports/submissionDocVerification";
import { buildSubmissionDocSuccessConfirmation } from "@/lib/exports/submissionDocSuccessConfirmation";

export {
  SUBMISSION_DOC_STATUS,
  getSubmissionDocStatusMessage,
} from "@/lib/exports/submissionGoogleDocClientMessages";

export {
  SUBMISSION_DOC_VERIFICATION_STATUS,
  getSubmissionDocVerificationMessage,
  SUBMISSION_DOC_VERIFICATION_EXPLAIN,
  SUBMISSION_DOC_MISMATCH_RECOVERY,
};

function safeVerificationLogPayload(verification, module, operation = null) {
  if (!verification) return { module };
  return {
    module,
    status: verification.status,
    operation: operation || null,
    expected_paragraph_count: verification.expectedParagraphCount ?? null,
    matched_paragraph_count: verification.matchedParagraphCount ?? null,
    first_missing_paragraph_index:
      verification.firstMissingParagraphIndex ?? null,
    expected_word_count: verification.expectedWordCount ?? null,
    document_word_count: verification.documentWordCount ?? null,
    document_id: verification.documentId || null,
  };
}

function safeRecoveryLogPayload({
  module,
  recoveryAction,
  verificationStatus = null,
  operation = null,
  hadExistingDoc = false,
  code = null,
} = {}) {
  return {
    module,
    recovery_action: recoveryAction || null,
    verification_status: verificationStatus || null,
    operation: operation || null,
    had_existing_link: !!hadExistingDoc,
    code: code || null,
  };
}

/**
 * Hydrate the persisted submission document link (exported_docs).
 * Does not verify content — call verifySubmissionGoogleDocContent separately.
 */
export async function hydrateSubmissionGoogleDoc({ userEmail }) {
  if (!userEmail) {
    return { ok: false, url: null, error: "no_email" };
  }
  const { data, error } = await getExportedDocLink({ userEmail });
  if (error) {
    return { ok: false, url: null, error: error.message || "hydrate_failed" };
  }
  const url = data?.web_view_link || null;
  return { ok: true, url, error: null };
}

/**
 * Session-bound revisit verification (server resolves essay + document_id).
 * Never exports / mutates the Google Doc.
 */
export async function verifySubmissionGoogleDocContent({
  userEmail,
  module,
  logStarted = true,
}) {
  if (!userEmail) {
    return {
      status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
      verified: false,
      documentId: null,
      url: null,
      message: getSubmissionDocVerificationMessage(
        SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR
      ),
    };
  }

  if (logStarted) {
    await logActivity(
      userEmail,
      "submission_doc_verification_started",
      { module }
    );
  }

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const abortTimer =
    controller && typeof setTimeout !== "undefined"
      ? setTimeout(() => controller.abort(), 60_000)
      : null;

  try {
    const res = await fetch("/api/verify-submission-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: controller?.signal,
    });
    const result = await res.json().catch(() => ({}));
    const status =
      result?.status || SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR;
    const verified =
      !!result?.verified &&
      status === SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED;

    if (verified) {
      await logActivity(
        userEmail,
        "submission_doc_verified",
        safeVerificationLogPayload(result, module)
      );
    } else if (status === SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH) {
      await logActivity(
        userEmail,
        "submission_doc_mismatch",
        safeVerificationLogPayload(result, module)
      );
    } else {
      await logActivity(
        userEmail,
        "submission_doc_verification_failed",
        safeVerificationLogPayload({ ...result, status }, module)
      );
    }

    return {
      ...result,
      status,
      verified,
      message: getSubmissionDocVerificationMessage(status),
    };
  } catch {
    await logActivity(userEmail, "submission_doc_verification_failed", {
      module,
      status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
    });
    return {
      status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
      verified: false,
      documentId: null,
      url: null,
      message: getSubmissionDocVerificationMessage(
        SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR
      ),
    };
  } finally {
    if (abortTimer) clearTimeout(abortTimer);
  }
}

/**
 * One authoritative client create/update/replacement for the submission Google Doc.
 * @param {{ forceCreate?: boolean, recoveryAction?: string|null }} options
 *   forceCreate — explicit "Create a new Google Doc" recovery (never silent).
 */
export async function createOrUpdateSubmissionGoogleDoc({
  userEmail,
  module,
  hadExistingDoc = false,
  openInNewTab = true,
  forceCreate = false,
  recoveryAction = null,
}) {
  const recovery = forceCreate
    ? "create_new"
    : recoveryAction || (hadExistingDoc ? "update" : "create");

  if (!userEmail) {
    return {
      ok: false,
      reason: SUBMISSION_DOC_STATUS.NO_EMAIL,
      message: getSubmissionDocStatusMessage(SUBMISSION_DOC_STATUS.NO_EMAIL),
      url: null,
      documentId: null,
      operation: null,
      verification: null,
      sourceModule: null,
      status: null,
      details: null,
      usedModule6Fallback: false,
      popupBlocked: false,
      wrote: false,
      contentVerified: false,
    };
  }

  await logActivity(
    userEmail,
    "submission_doc_recovery_started",
    safeRecoveryLogPayload({
      module,
      recoveryAction: recovery,
      hadExistingDoc,
    })
  );

  const exportRes = await getFinalTextForExport({ userEmail });

  await logActivity(userEmail, "export_to_docs_attempt", {
    module,
    status: exportRes.status,
    sourceModule: exportRes.sourceModule,
    details: exportRes.details,
    had_existing_doc: hadExistingDoc,
    force_create: !!forceCreate,
    recovery_action: recovery,
  });

  if (exportRes.status !== "ok" || !exportRes.text?.trim()) {
    const reason =
      exportRes.status === "missing"
        ? SUBMISSION_DOC_STATUS.MISSING_ESSAY
        : SUBMISSION_DOC_STATUS.TEXT_ERROR;
    await logActivity(
      userEmail,
      "submission_doc_recovery_failed",
      safeRecoveryLogPayload({
        module,
        recoveryAction: recovery,
        verificationStatus: reason,
        hadExistingDoc,
        code: reason,
      })
    );
    return {
      ok: false,
      reason,
      message: getSubmissionDocStatusMessage(reason, { hadExistingDoc }),
      url: null,
      documentId: null,
      operation: null,
      verification: null,
      sourceModule: exportRes.sourceModule ?? null,
      status: exportRes.status,
      details: exportRes.details ?? null,
      usedModule6Fallback: false,
      popupBlocked: false,
      wrote: false,
      contentVerified: false,
    };
  }

  const usedModule6Fallback = exportRes.sourceModule === 6;

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const clientTimeoutMs = 60_000;
  let timedOut = false;
  const abortTimer =
    controller && typeof setTimeout !== "undefined"
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, clientTimeoutMs)
      : null;

  let res;
  let result = {};
  try {
    res = await fetch("/api/export-to-docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forceCreate: !!forceCreate }),
      signal: controller?.signal,
    });
    result = await res.json().catch(() => ({}));
  } catch (err) {
    const aborted =
      timedOut ||
      err?.name === "AbortError" ||
      (typeof err?.message === "string" &&
        err.message.toLowerCase().includes("abort"));
    await logActivity(userEmail, "export_to_docs_failed", {
      module,
      status: aborted ? "google_operation_timeout" : "api_failed",
      had_existing_doc: hadExistingDoc,
      code: aborted ? "google_operation_timeout" : "api_failed",
    });
    await logActivity(
      userEmail,
      "submission_doc_recovery_failed",
      safeRecoveryLogPayload({
        module,
        recoveryAction: recovery,
        verificationStatus:
          SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
        hadExistingDoc,
        code: aborted ? "google_operation_timeout" : "api_failed",
      })
    );
    return {
      ok: false,
      reason: SUBMISSION_DOC_STATUS.API_FAILED,
      message: aborted
        ? "We could not finish updating your Google Doc right now. This may be a temporary connection problem. Retry the check before creating a new document."
        : getSubmissionDocStatusMessage(SUBMISSION_DOC_STATUS.API_FAILED, {
            hadExistingDoc,
          }),
      url: null,
      documentId: null,
      operation: null,
      verification: {
        status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
        verified: false,
      },
      sourceModule: exportRes.sourceModule,
      status: exportRes.status,
      details: exportRes.details ?? null,
      usedModule6Fallback,
      popupBlocked: false,
      wrote: false,
      contentVerified: false,
      temporaryFailure: true,
    };
  } finally {
    if (abortTimer) clearTimeout(abortTimer);
  }

  if (
    res.status === 504 ||
    result?.code === "google_operation_timeout" ||
    result?.code === "temporary_service_failure"
  ) {
    await logActivity(userEmail, "export_to_docs_failed", {
      module,
      status: result?.code || "temporary_service_failure",
      had_existing_doc: hadExistingDoc,
      code: result?.code || "temporary_service_failure",
    });
    await logActivity(
      userEmail,
      "submission_doc_recovery_failed",
      safeRecoveryLogPayload({
        module,
        recoveryAction: recovery,
        verificationStatus:
          SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
        hadExistingDoc,
        code: result?.code || "temporary_service_failure",
      })
    );
    return {
      ok: false,
      reason: SUBMISSION_DOC_STATUS.API_FAILED,
      message:
        result?.error ||
        "We could not finish updating your Google Doc right now. This may be a temporary connection problem.",
      url: null,
      documentId: null,
      operation: null,
      verification: result?.verification || {
        status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
        verified: false,
      },
      sourceModule: exportRes.sourceModule,
      status: exportRes.status,
      details: exportRes.details ?? null,
      usedModule6Fallback,
      popupBlocked: false,
      wrote: false,
      contentVerified: false,
      temporaryFailure: true,
    };
  }

  if (
    res.status === 409 ||
    result?.code === "existing_document_unavailable"
  ) {
    await logActivity(userEmail, "export_to_docs_failed", {
      module,
      status: "existing_document_unavailable",
      had_existing_doc: hadExistingDoc,
      code: result?.code || "existing_document_unavailable",
    });
    await logActivity(
      userEmail,
      "submission_doc_recovery_failed",
      safeRecoveryLogPayload({
        module,
        recoveryAction: recovery,
        verificationStatus:
          SUBMISSION_DOC_STATUS.EXISTING_DOCUMENT_UNAVAILABLE,
        hadExistingDoc,
        code: result?.code || "existing_document_unavailable",
      })
    );
    return {
      ok: false,
      reason: SUBMISSION_DOC_STATUS.EXISTING_DOCUMENT_UNAVAILABLE,
      message: getSubmissionDocStatusMessage(
        SUBMISSION_DOC_STATUS.EXISTING_DOCUMENT_UNAVAILABLE,
        { hadExistingDoc, serverMessage: result?.error }
      ),
      url: null,
      documentId: null,
      operation: null,
      verification: null,
      sourceModule: exportRes.sourceModule,
      status: exportRes.status,
      details: exportRes.details ?? null,
      usedModule6Fallback,
      popupBlocked: false,
      wrote: false,
      contentVerified: false,
    };
  }

  if (result?.code === "replacement_verification_failed") {
    await logActivity(
      userEmail,
      "submission_doc_recovery_failed",
      safeRecoveryLogPayload({
        module,
        recoveryAction: recovery,
        verificationStatus: result?.verification?.status || null,
        hadExistingDoc,
        code: "replacement_verification_failed",
      })
    );
    return {
      ok: false,
      reason: SUBMISSION_DOC_STATUS.API_FAILED,
      message:
        result?.error ||
        "The new Google Doc did not verify. Your previous document link was kept.",
      url: null,
      documentId: null,
      operation: null,
      verification: result?.verification || null,
      sourceModule: exportRes.sourceModule,
      status: exportRes.status,
      details: exportRes.details ?? null,
      usedModule6Fallback,
      popupBlocked: false,
      wrote: false,
      contentVerified: false,
      pointerPreserved: true,
    };
  }

  if (!res.ok || !result?.url || !result?.operation) {
    await logActivity(userEmail, "export_to_docs_failed", {
      module,
      status: "api_failed",
      had_existing_doc: hadExistingDoc,
    });
    await logActivity(
      userEmail,
      "submission_doc_recovery_failed",
      safeRecoveryLogPayload({
        module,
        recoveryAction: recovery,
        hadExistingDoc,
        code: "api_failed",
      })
    );
    return {
      ok: false,
      reason: SUBMISSION_DOC_STATUS.API_FAILED,
      message: getSubmissionDocStatusMessage(SUBMISSION_DOC_STATUS.API_FAILED, {
        hadExistingDoc,
      }),
      url: null,
      documentId: null,
      operation: null,
      verification: null,
      sourceModule: exportRes.sourceModule,
      status: exportRes.status,
      details: exportRes.details ?? null,
      usedModule6Fallback,
      popupBlocked: false,
      wrote: false,
      contentVerified: false,
    };
  }

  const operation = result.operation;
  const verification = result.verification || null;
  const contentVerified = !!verification?.verified;
  const reason = reasonFromSubmissionDocOperation(operation);
  // Rich trust confirmation only after verified content (WP-032).
  const confirmation = contentVerified
    ? result.confirmation ||
      buildSubmissionDocSuccessConfirmation({
        operation,
        verification,
        completedAt: result.completedAt,
      })
    : null;

  await logActivity(userEmail, "export_to_docs", {
    module,
    url: result.url,
    document_id: result.documentId || null,
    operation,
    sourceModule: result.sourceModule ?? exportRes.sourceModule,
    status: exportRes.status,
    details: exportRes.details,
    updated_existing: operation === "updated",
    replacement_created: operation === "replacement_created",
    content_verified: contentVerified,
    verification_status: verification?.status || null,
    completed_at: confirmation?.completedAt || null,
    word_count: confirmation?.wordCount ?? null,
  });

  await logActivity(
    userEmail,
    "submission_doc_recovery_succeeded",
    safeRecoveryLogPayload({
      module,
      recoveryAction: recovery,
      verificationStatus: verification?.status || null,
      operation,
      hadExistingDoc,
    })
  );

  if (contentVerified) {
    await logActivity(
      userEmail,
      "submission_doc_verified",
      safeVerificationLogPayload(verification, module, operation)
    );
  } else if (
    verification?.status === SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH
  ) {
    await logActivity(
      userEmail,
      "submission_doc_mismatch",
      safeVerificationLogPayload(verification, module, operation)
    );
  } else if (verification) {
    await logActivity(
      userEmail,
      "submission_doc_verification_failed",
      safeVerificationLogPayload(verification, module, operation)
    );
  }

  let popupBlocked = false;
  if (openInNewTab && typeof window !== "undefined") {
    const win = window.open(result.url, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      popupBlocked = true;
    }
  }

  const exportMessage = getSubmissionDocStatusMessage(reason, { operation });
  const verifyMessage = contentVerified
    ? getSubmissionDocVerificationMessage(
        SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED
      )
    : verification
      ? getSubmissionDocVerificationMessage(verification.status)
      : "";

  return {
    ok: true,
    reason,
    message: [exportMessage, verifyMessage].filter(Boolean).join(" "),
    url: result.url,
    documentId: result.documentId || null,
    operation,
    verification,
    contentVerified,
    confirmation,
    completedAt: confirmation?.completedAt || null,
    sourceModule: result.sourceModule ?? exportRes.sourceModule,
    status: exportRes.status,
    details: exportRes.details ?? null,
    usedModule6Fallback,
    popupBlocked,
    wrote: true,
    previousDocumentId: result.previousDocumentId || null,
    pointerReplaced: !!result.pointerReplaced,
  };
}

export async function logSubmissionDocReplacementCancelled({
  userEmail,
  module,
  hadExistingDoc = false,
}) {
  if (!userEmail) return;
  await logActivity(
    userEmail,
    "submission_doc_replacement_cancelled",
    safeRecoveryLogPayload({
      module,
      recoveryAction: "create_new",
      hadExistingDoc,
    })
  );
}
