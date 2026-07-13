/**
 * WP-028/WP-029 — Shared client create/update + verification pathway.
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

  try {
    const res = await fetch("/api/verify-submission-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const result = await res.json().catch(() => ({}));
    const status =
      result?.status || SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR;
    const verified = !!result?.verified && status === SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED;

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
  }
}

/**
 * One authoritative client create/update for the submission Google Doc.
 */
export async function createOrUpdateSubmissionGoogleDoc({
  userEmail,
  module,
  hadExistingDoc = false,
  openInNewTab = true,
}) {
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

  const exportRes = await getFinalTextForExport({ userEmail });

  await logActivity(userEmail, "export_to_docs_attempt", {
    module,
    status: exportRes.status,
    sourceModule: exportRes.sourceModule,
    details: exportRes.details,
    had_existing_doc: hadExistingDoc,
  });

  if (exportRes.status !== "ok" || !exportRes.text?.trim()) {
    const reason =
      exportRes.status === "missing"
        ? SUBMISSION_DOC_STATUS.MISSING_ESSAY
        : SUBMISSION_DOC_STATUS.TEXT_ERROR;
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

  const res = await fetch("/api/export-to-docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const result = await res.json().catch(() => ({}));

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

  if (!res.ok || !result?.url || !result?.operation) {
    await logActivity(userEmail, "export_to_docs_failed", {
      module,
      status: "api_failed",
      had_existing_doc: hadExistingDoc,
    });
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

  await logActivity(userEmail, "export_to_docs", {
    module,
    url: result.url,
    document_id: result.documentId || null,
    operation,
    sourceModule: result.sourceModule ?? exportRes.sourceModule,
    status: exportRes.status,
    details: exportRes.details,
    updated_existing: operation === "updated",
    content_verified: contentVerified,
    verification_status: verification?.status || null,
  });

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
    sourceModule: result.sourceModule ?? exportRes.sourceModule,
    status: exportRes.status,
    details: exportRes.details ?? null,
    usedModule6Fallback,
    popupBlocked,
    wrote: true,
  };
}
