/**
 * Pure status/message helpers for the submission Google Doc client pathway.
 */

export const SUBMISSION_DOC_STATUS = Object.freeze({
  IDLE: "idle",
  PREPARING: "preparing",
  READY: "ready",
  UPDATE_SUCCEEDED: "update_succeeded",
  MISSING_ESSAY: "missing_essay",
  TEXT_ERROR: "text_error",
  API_FAILED: "api_failed",
  EXISTING_DOCUMENT_UNAVAILABLE: "existing_document_unavailable",
  NO_EMAIL: "no_email",
});

export const SUBMISSION_DOC_OPERATION_MESSAGES = Object.freeze({
  created: "Your Google Doc is ready. Open it to continue formatting.",
  updated:
    "Your latest essay is now in the same Google Doc. Review your APA formatting before downloading the PDF.",
  recreated:
    "We created a new Google Doc because the previous one was unavailable. Review your APA formatting before downloading the PDF.",
});

/**
 * Status messages. Prefer server `operation` for success copy.
 * `hadExistingDoc` only affects preparing/failed copy before the server responds.
 */
export function getSubmissionDocStatusMessage(
  status,
  { hadExistingDoc = false, operation = null, serverMessage = null } = {}
) {
  if (
    status === SUBMISSION_DOC_STATUS.READY ||
    status === SUBMISSION_DOC_STATUS.UPDATE_SUCCEEDED
  ) {
    if (operation && SUBMISSION_DOC_OPERATION_MESSAGES[operation]) {
      return SUBMISSION_DOC_OPERATION_MESSAGES[operation];
    }
  }

  switch (status) {
    case SUBMISSION_DOC_STATUS.PREPARING:
      return hadExistingDoc
        ? "Updating your Google Doc with your latest essay…"
        : "Creating your Google Doc…";
    case SUBMISSION_DOC_STATUS.READY:
      return SUBMISSION_DOC_OPERATION_MESSAGES.created;
    case SUBMISSION_DOC_STATUS.UPDATE_SUCCEEDED:
      return SUBMISSION_DOC_OPERATION_MESSAGES.updated;
    case SUBMISSION_DOC_STATUS.MISSING_ESSAY:
      return "We could not find your finished essay yet. Go back to Module 7, finish revising, then try again.";
    case SUBMISSION_DOC_STATUS.TEXT_ERROR:
      return "We hit a problem while loading your essay. Refresh the page and try again. If it keeps happening, tell your teacher.";
    case SUBMISSION_DOC_STATUS.EXISTING_DOCUMENT_UNAVAILABLE:
      return (
        serverMessage ||
        "Your existing Google Doc could not be opened or updated. Tell your teacher so they can reset the document link, then create it again."
      );
    case SUBMISSION_DOC_STATUS.API_FAILED:
      return hadExistingDoc
        ? "We could not update your Google Doc. Check your connection and try Update again."
        : "We could not create your Google Doc. Check your connection and try Create again.";
    case SUBMISSION_DOC_STATUS.NO_EMAIL:
      return "Sign in again, then prepare your Google Doc.";
    default:
      return "";
  }
}

export function reasonFromSubmissionDocOperation(operation) {
  if (operation === "updated" || operation === "recreated") {
    return SUBMISSION_DOC_STATUS.UPDATE_SUCCEEDED;
  }
  return SUBMISSION_DOC_STATUS.READY;
}
