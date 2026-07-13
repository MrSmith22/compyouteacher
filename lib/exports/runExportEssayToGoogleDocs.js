/**
 * Injectable create/update orchestration for the submission Google Doc.
 * Production wiring (Google + Supabase) lives in exportEssayToGoogleDocs.ts.
 */

import {
  ExistingDocumentUnavailableError,
  SUBMISSION_DOC_OPERATIONS,
  buildReplaceGoogleDocBodyRequests,
  getGoogleDocBodyEndIndex,
  resolveSubmissionDocPlan,
} from "./submissionGoogleDocHelpers.js";

export function isNotFoundOrInaccessible(err) {
  const status = err?.code || err?.status || err?.response?.status;
  if (status === 404 || status === 403 || status === "404" || status === "403") {
    return true;
  }
  const message = String(err?.message || err || "").toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("404") ||
    message.includes("forbidden") ||
    message.includes("403") ||
    message.includes("insufficient permissions")
  );
}

export async function replaceDocumentBody(deps, documentId, text) {
  const document = await deps.getDocument(documentId);
  const endIndex = getGoogleDocBodyEndIndex(document);
  const requests = buildReplaceGoogleDocBodyRequests({ endIndex, text });
  await deps.batchUpdate(documentId, requests);
  const confirmed = await deps.getDocument(documentId);
  const confirmedId =
    typeof confirmed?.documentId === "string" ? confirmed.documentId : documentId;
  if (confirmedId && confirmedId !== documentId) {
    throw new Error("Document ID changed unexpectedly after update");
  }
  return { endIndex, requestCount: requests.length };
}

/**
 * @param {{
 *   email: string,
 *   text: string,
 *   deps: {
 *     getExportedDocRow: Function,
 *     upsertExportedDoc: Function,
 *     createDocument: Function,
 *     getDocument: Function,
 *     batchUpdate: Function,
 *     shareDocument: Function,
 *     getWebViewLink: Function,
 *   },
 * }} params
 */
export async function runExportEssayToGoogleDocs({ email, text, deps }) {
  if (!text?.trim() || !email?.trim()) {
    throw new Error("Missing text or email");
  }

  const existingRow = await deps.getExportedDocRow(email.trim());
  const plan = resolveSubmissionDocPlan(existingRow);

  if (plan.mode === "update" && plan.documentId) {
    try {
      await replaceDocumentBody(deps, plan.documentId, text);

      const webViewLink =
        plan.webViewLink || (await deps.getWebViewLink(plan.documentId));

      await deps.upsertExportedDoc({
        user_email: email.trim(),
        document_id: plan.documentId,
        web_view_link: webViewLink,
      });

      return {
        documentId: plan.documentId,
        webViewLink,
        operation: SUBMISSION_DOC_OPERATIONS.UPDATED,
      };
    } catch (err) {
      if (
        err instanceof ExistingDocumentUnavailableError ||
        isNotFoundOrInaccessible(err)
      ) {
        throw new ExistingDocumentUnavailableError(
          "Your existing Google Doc could not be opened or updated. Tell your teacher so they can reset the document link, then create it again."
        );
      }
      throw err;
    }
  }

  const created = await deps.createDocument("APA Final Essay");
  const documentId = created.documentId;

  await replaceDocumentBody(deps, documentId, text);
  await deps.shareDocument(documentId, email.trim());
  const webViewLink = await deps.getWebViewLink(documentId);

  await deps.upsertExportedDoc({
    user_email: email.trim(),
    document_id: documentId,
    web_view_link: webViewLink,
  });

  return {
    documentId,
    webViewLink,
    operation: SUBMISSION_DOC_OPERATIONS.CREATED,
  };
}
