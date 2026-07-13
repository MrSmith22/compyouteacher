/**
 * WP-028 — Single client create/update pathway for the submission Google Doc.
 * Server write remains exportEssayToGoogleDocs via /api/export-to-docs.
 * Success messaging and activity logs use the server's reported `operation`.
 */

import { getFinalTextForExport } from "@/lib/supabase/helpers/studentDrafts";
import { getExportedDocLink } from "@/lib/supabase/helpers/studentExports";
import { logActivity } from "@/lib/logActivity";
import {
  SUBMISSION_DOC_STATUS,
  getSubmissionDocStatusMessage,
  reasonFromSubmissionDocOperation,
} from "@/lib/exports/submissionGoogleDocClientMessages";

export {
  SUBMISSION_DOC_STATUS,
  getSubmissionDocStatusMessage,
} from "@/lib/exports/submissionGoogleDocClientMessages";

/**
 * Hydrate the persisted submission document link (exported_docs).
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
 * One authoritative client create/update for the submission Google Doc.
 * Callers own UI state (Module 8 session verification, Module 9 step unlock).
 *
 * @param {{
 *   userEmail: string,
 *   module: 8 | 9,
 *   hadExistingDoc?: boolean,
 *   openInNewTab?: boolean,
 * }} params
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
      sourceModule: null,
      status: null,
      details: null,
      usedModule6Fallback: false,
      popupBlocked: false,
      wrote: false,
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
      sourceModule: exportRes.sourceModule ?? null,
      status: exportRes.status,
      details: exportRes.details ?? null,
      usedModule6Fallback: false,
      popupBlocked: false,
      wrote: false,
    };
  }

  const usedModule6Fallback = exportRes.sourceModule === 6;

  const res = await fetch("/api/export-to-docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: exportRes.text, email: userEmail }),
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
      sourceModule: exportRes.sourceModule,
      status: exportRes.status,
      details: exportRes.details ?? null,
      usedModule6Fallback,
      popupBlocked: false,
      wrote: false,
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
      sourceModule: exportRes.sourceModule,
      status: exportRes.status,
      details: exportRes.details ?? null,
      usedModule6Fallback,
      popupBlocked: false,
      wrote: false,
    };
  }

  const operation = result.operation;
  const reason = reasonFromSubmissionDocOperation(operation);

  await logActivity(userEmail, "export_to_docs", {
    module,
    url: result.url,
    document_id: result.documentId || null,
    operation,
    sourceModule: exportRes.sourceModule,
    status: exportRes.status,
    details: exportRes.details,
    updated_existing: operation === "updated",
  });

  let popupBlocked = false;
  if (openInNewTab && typeof window !== "undefined") {
    const win = window.open(result.url, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      popupBlocked = true;
    }
  }

  return {
    ok: true,
    reason,
    message: getSubmissionDocStatusMessage(reason, { operation }),
    url: result.url,
    documentId: result.documentId || null,
    operation,
    sourceModule: exportRes.sourceModule,
    status: exportRes.status,
    details: exportRes.details ?? null,
    usedModule6Fallback,
    popupBlocked,
    wrote: true,
  };
}
