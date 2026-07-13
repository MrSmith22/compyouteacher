/**
 * Injectable create/update/replacement orchestration for the submission Google Doc.
 * Production wiring (Google + Supabase) lives in exportEssayToGoogleDocs.ts.
 */

import {
  ExistingDocumentUnavailableError,
  SUBMISSION_DOC_OPERATIONS,
  buildReplaceGoogleDocBodyRequests,
  getGoogleDocBodyEndIndex,
  resolveSubmissionDocPlan,
} from "./submissionGoogleDocHelpers.js";
import {
  compareEssayToGoogleDocText,
  extractGoogleDocPlainText,
  toSafeVerificationResult,
  SUBMISSION_DOC_VERIFICATION_STATUS,
} from "./submissionDocVerification.js";
import { isGoogleOperationTimeoutError } from "./googleOperationTimeout.js";

export function isNotFoundOrInaccessible(err) {
  if (isGoogleOperationTimeoutError(err)) return false;
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
  return { endIndex, requestCount: requests.length, confirmed };
}

function verifyWrittenDocument({ document, documentId, url, essayText }) {
  try {
    if (!document || typeof document !== "object") {
      return toSafeVerificationResult(
        {
          status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
          verified: false,
          expectedParagraphCount: 0,
          matchedParagraphCount: 0,
          firstMissingParagraphIndex: null,
          expectedWordCount: 0,
          documentWordCount: 0,
          checkedAt: new Date().toISOString(),
        },
        { documentId, url }
      );
    }
    const documentText = extractGoogleDocPlainText(document);
    return toSafeVerificationResult(
      compareEssayToGoogleDocText({ essayText, documentText }),
      { documentId, url }
    );
  } catch {
    return toSafeVerificationResult(
      {
        status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
        verified: false,
        expectedParagraphCount: 0,
        matchedParagraphCount: 0,
        firstMissingParagraphIndex: null,
        expectedWordCount: 0,
        documentWordCount: 0,
        checkedAt: new Date().toISOString(),
      },
      { documentId, url }
    );
  }
}

/**
 * Create a brand-new Google Doc, write essay, share, verify, then upsert pointer.
 * When replacing an existing row, never mutate the pointer before verification succeeds.
 * Never deletes the previous Drive document.
 *
 * @param {{ forceCreate?: boolean }} options
 *   forceCreate: skip update-in-place; create a new Doc. When an existing row exists,
 *   operation is replacement_created and the pointer updates only after verify.
 */
export async function runExportEssayToGoogleDocs({
  email,
  text,
  deps,
  forceCreate = false,
}) {
  if (!text?.trim() || !email?.trim()) {
    throw new Error("Missing text or email");
  }

  const studentEmail = email.trim();
  const existingRow = await deps.getExportedDocRow(studentEmail);
  const plan = resolveSubmissionDocPlan(existingRow);
  const hadExistingPointer = Boolean(plan.documentId);

  if (!forceCreate && plan.mode === "update" && plan.documentId) {
    try {
      const replaced = await replaceDocumentBody(
        deps,
        plan.documentId,
        text
      );

      const permissions = await deps.shareDocument(
        plan.documentId,
        studentEmail
      );

      const webViewLink =
        plan.webViewLink || (await deps.getWebViewLink(plan.documentId));

      const verification = verifyWrittenDocument({
        document: replaced.confirmed,
        documentId: plan.documentId,
        url: webViewLink,
        essayText: text,
      });

      await deps.upsertExportedDoc({
        user_email: studentEmail,
        document_id: plan.documentId,
        web_view_link: webViewLink,
      });

      // WP-032: stable ISO completion time from successful server-side finish.
      const completedAt = verification.verified
        ? new Date().toISOString()
        : null;

      return {
        documentId: plan.documentId,
        webViewLink,
        operation: SUBMISSION_DOC_OPERATIONS.UPDATED,
        permissions: permissions || null,
        verification,
        completedAt,
        previousDocumentId: plan.documentId,
        pointerReplaced: false,
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

  // Create path (first-time or explicit replacement). Never deletes old Drive files.
  const previousDocumentId = plan.documentId || null;
  const created = await deps.createDocument("APA Final Essay");
  const documentId = created.documentId;

  const replaced = await replaceDocumentBody(deps, documentId, text);
  const permissions = await deps.shareDocument(documentId, studentEmail);
  const webViewLink = await deps.getWebViewLink(documentId);

  const verification = verifyWrittenDocument({
    document: replaced.confirmed,
    documentId,
    url: webViewLink,
    essayText: text,
  });

  // Replacement: only swap the saved pointer after the new Doc verifies.
  // First create: always upsert. Replacement with failed verify: keep old pointer.
  const isReplacement = forceCreate && hadExistingPointer;
  if (isReplacement && !verification.verified) {
    const err = new Error(
      "The new Google Doc did not verify. Your previous document link was kept."
    );
    err.code = "replacement_verification_failed";
    err.previousDocumentId = previousDocumentId;
    err.verification = verification;
    err.pointerPreserved = true;
    throw err;
  }

  await deps.upsertExportedDoc({
    user_email: studentEmail,
    document_id: documentId,
    web_view_link: webViewLink,
  });

  // WP-032: stable ISO completion time from successful server-side finish.
  const completedAt = verification.verified
    ? new Date().toISOString()
    : null;

  return {
    documentId,
    webViewLink,
    operation: isReplacement
      ? SUBMISSION_DOC_OPERATIONS.REPLACEMENT_CREATED
      : SUBMISSION_DOC_OPERATIONS.CREATED,
    permissions: permissions || null,
    verification,
    completedAt,
    previousDocumentId,
    pointerReplaced: isReplacement,
  };
}
