/**
 * Pure helpers for Google Docs body replacement ranges (WP-028 update-in-place).
 *
 * Google Docs always keeps a trailing newline that cannot be deleted.
 * Body text starts at index 1. A nearly empty document typically has endIndex 2.
 */

export const SUBMISSION_DOC_OPERATIONS = Object.freeze({
  CREATED: "created",
  UPDATED: "updated",
  RECREATED: "recreated",
});

export const SUBMISSION_DOC_ERROR_CODES = Object.freeze({
  EXISTING_DOCUMENT_UNAVAILABLE: "existing_document_unavailable",
  MISSING_TEXT_OR_EMAIL: "missing_text_or_email",
});

/**
 * Resolve the end index of the document body from a Docs API document resource.
 * @param {{ body?: { content?: Array<{ endIndex?: number }> } } | null | undefined} document
 */
export function getGoogleDocBodyEndIndex(document) {
  const content = document?.body?.content;
  if (!Array.isArray(content) || content.length === 0) {
    return 2;
  }
  let endIndex = 1;
  for (const element of content) {
    if (typeof element?.endIndex === "number") {
      endIndex = Math.max(endIndex, element.endIndex);
    }
  }
  return Math.max(endIndex, 2);
}

/**
 * Build batchUpdate requests that replace the essay body while preserving the
 * mandatory trailing newline.
 *
 * @param {{ endIndex: number, text: string }} params
 * @returns {Array<object>}
 */
export function buildReplaceGoogleDocBodyRequests({ endIndex, text }) {
  const safeText = typeof text === "string" ? text : "";
  const end = Number(endIndex);
  const requests = [];

  // Delete existing content before the final newline when there is any.
  // Range endIndex is exclusive; endIndex - 1 leaves the trailing newline.
  if (Number.isFinite(end) && end > 2) {
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: 1,
          endIndex: end - 1,
        },
      },
    });
  }

  requests.push({
    insertText: {
      location: { index: 1 },
      text: safeText,
    },
  });

  return requests;
}

/**
 * Decide whether the export should create or update from a stored row.
 * @param {{ document_id?: string | null, web_view_link?: string | null } | null | undefined} row
 */
export function resolveSubmissionDocPlan(row) {
  const documentId =
    typeof row?.document_id === "string" ? row.document_id.trim() : "";
  const webViewLink =
    typeof row?.web_view_link === "string" ? row.web_view_link.trim() : "";
  if (documentId) {
    return {
      mode: "update",
      documentId,
      webViewLink: webViewLink || null,
    };
  }
  return {
    mode: "create",
    documentId: null,
    webViewLink: null,
  };
}

export function isExistingDocumentUnavailableError(err) {
  return (
    err?.code === SUBMISSION_DOC_ERROR_CODES.EXISTING_DOCUMENT_UNAVAILABLE ||
    err?.name === "ExistingDocumentUnavailableError"
  );
}

export class ExistingDocumentUnavailableError extends Error {
  constructor(message = "Existing submission Google Doc is unavailable.") {
    super(message);
    this.name = "ExistingDocumentUnavailableError";
    this.code = SUBMISSION_DOC_ERROR_CODES.EXISTING_DOCUMENT_UNAVAILABLE;
  }
}
