/**
 * WP-030 — Centralized submission Google Doc recovery model.
 * Pure: maps verification/export states to student actions and copy.
 */

import { SUBMISSION_DOC_VERIFICATION_STATUS } from "./submissionDocVerification.js";
import { SUBMISSION_DOC_STATUS } from "./submissionGoogleDocClientMessages.js";

export const SUBMISSION_DOC_RECOVERY_ACTIONS = Object.freeze({
  UPDATE: "update",
  CREATE: "create",
  CREATE_NEW: "create_new",
  OPEN: "open",
  RETRY_CHECK: "retry_check",
  CONTINUE: "continue",
  FINISH_ESSAY: "finish_essay",
});

export const SUBMISSION_DOC_RECOVERY_STATES = Object.freeze({
  VERIFIED: "verified",
  MISMATCH: "mismatch",
  MISSING_DOCUMENT: "missing_document",
  EXISTING_DOCUMENT_UNAVAILABLE: "existing_document_unavailable",
  VERIFICATION_ERROR: "verification_error",
  API_FAILED: "api_failed",
  MISSING_ESSAY: "missing_essay",
  UPDATE_SUCCEEDED: "update_succeeded",
  REPLACEMENT_CREATED: "replacement_created",
  CHECKING: "checking",
  IDLE: "idle",
});

/**
 * Resolve a single recovery state id from verification + export status.
 * @param {{ requireSessionWrite?: boolean }} options
 *   When true (Module 8 WP-002), revisit verification alone cannot become VERIFIED
 *   for progression until this-session write sets contentVerified.
 */
export function resolveSubmissionDocRecoveryStateId({
  verificationStatus = null,
  exportStatus = null,
  hasUrl = false,
  contentVerified = false,
  operation = null,
  requireSessionWrite = false,
} = {}) {
  if (
    exportStatus === SUBMISSION_DOC_STATUS.MISSING_ESSAY ||
    verificationStatus === SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_ESSAY
  ) {
    return SUBMISSION_DOC_RECOVERY_STATES.MISSING_ESSAY;
  }

  if (
    exportStatus === SUBMISSION_DOC_STATUS.EXISTING_DOCUMENT_UNAVAILABLE ||
    verificationStatus ===
      SUBMISSION_DOC_VERIFICATION_STATUS.DOCUMENT_UNAVAILABLE
  ) {
    return SUBMISSION_DOC_RECOVERY_STATES.EXISTING_DOCUMENT_UNAVAILABLE;
  }

  if (operation === "replacement_created" && contentVerified) {
    return SUBMISSION_DOC_RECOVERY_STATES.REPLACEMENT_CREATED;
  }

  if (
    (operation === "updated" || operation === "created") &&
    contentVerified
  ) {
    return operation === "updated"
      ? SUBMISSION_DOC_RECOVERY_STATES.UPDATE_SUCCEEDED
      : SUBMISSION_DOC_RECOVERY_STATES.VERIFIED;
  }

  if (contentVerified) {
    return SUBMISSION_DOC_RECOVERY_STATES.VERIFIED;
  }

  // Module 8: a matching live Doc still needs an explicit this-session Update.
  if (
    requireSessionWrite &&
    hasUrl &&
    verificationStatus === SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED
  ) {
    return SUBMISSION_DOC_RECOVERY_STATES.IDLE;
  }

  if (verificationStatus === SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED) {
    return SUBMISSION_DOC_RECOVERY_STATES.VERIFIED;
  }

  if (verificationStatus === SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH) {
    return SUBMISSION_DOC_RECOVERY_STATES.MISMATCH;
  }

  if (
    verificationStatus === SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_DOCUMENT ||
    (!hasUrl &&
      verificationStatus !==
        SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR)
  ) {
    if (!hasUrl) return SUBMISSION_DOC_RECOVERY_STATES.MISSING_DOCUMENT;
  }

  if (
    verificationStatus ===
      SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR ||
    exportStatus === SUBMISSION_DOC_STATUS.API_FAILED ||
    exportStatus === SUBMISSION_DOC_STATUS.TEXT_ERROR
  ) {
    return verificationStatus ===
      SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR
      ? SUBMISSION_DOC_RECOVERY_STATES.VERIFICATION_ERROR
      : SUBMISSION_DOC_RECOVERY_STATES.API_FAILED;
  }

  if (verificationStatus === SUBMISSION_DOC_VERIFICATION_STATUS.CHECKING) {
    return SUBMISSION_DOC_RECOVERY_STATES.CHECKING;
  }

  if (!hasUrl) return SUBMISSION_DOC_RECOVERY_STATES.MISSING_DOCUMENT;

  return SUBMISSION_DOC_RECOVERY_STATES.IDLE;
}

/**
 * Full recovery plan for UI rendering.
 */
export function getSubmissionDocRecoveryPlan({
  verificationStatus = null,
  exportStatus = null,
  hasUrl = false,
  contentVerified = false,
  operation = null,
  requireSessionWrite = false,
} = {}) {
  const state = resolveSubmissionDocRecoveryStateId({
    verificationStatus,
    exportStatus,
    hasUrl,
    contentVerified,
    operation,
    requireSessionWrite,
  });

  const base = {
    state,
    allowProgression: false,
    requireReplacementConfirmation: false,
    showSecondaryDisclosure: false,
    teacherEscalation: false,
    primaryAction: null,
    secondaryActions: [],
    title: "",
    explanation: "",
    supportingCopy: "",
  };

  switch (state) {
    case SUBMISSION_DOC_RECOVERY_STATES.VERIFIED:
    case SUBMISSION_DOC_RECOVERY_STATES.UPDATE_SUCCEEDED:
    case SUBMISSION_DOC_RECOVERY_STATES.REPLACEMENT_CREATED:
      return {
        ...base,
        allowProgression: true,
        showSecondaryDisclosure: true,
        primaryAction: SUBMISSION_DOC_RECOVERY_ACTIONS.CONTINUE,
        secondaryActions: [
          SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN,
          SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE,
          SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW,
        ].filter((action) =>
          action === SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN ? hasUrl : true
        ),
        title:
          state === SUBMISSION_DOC_RECOVERY_STATES.REPLACEMENT_CREATED
            ? "Your new Google Doc is ready"
            : "Verified: this Google Doc contains your latest essay",
        explanation:
          "We checked the writing in your Google Doc against the essay you finished in Comp-YouTeacher.",
        supportingCopy:
          state === SUBMISSION_DOC_RECOVERY_STATES.UPDATE_SUCCEEDED ||
          state === SUBMISSION_DOC_RECOVERY_STATES.REPLACEMENT_CREATED
            ? "Review your APA formatting before downloading the PDF."
            : "",
      };

    case SUBMISSION_DOC_RECOVERY_STATES.MISMATCH:
      return {
        ...base,
        primaryAction: SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE,
        secondaryActions: [
          ...(hasUrl ? [SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN] : []),
          SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK,
          SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW,
        ],
        requireReplacementConfirmation: true, // only when Create-new is chosen
        title: "We found that your Google Doc does not match your latest essay",
        explanation:
          "Updating places your latest essay into the same document. Review your APA formatting afterward.",
        supportingCopy:
          "Create a new Google Doc only if Update cannot fix the problem.",
      };

    case SUBMISSION_DOC_RECOVERY_STATES.MISSING_DOCUMENT:
      return {
        ...base,
        primaryAction: SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE,
        secondaryActions: [],
        title: "Create your Google Doc",
        explanation:
          "Your finished essay will be placed into a Google Doc. This is the paper you will format in APA style.",
        supportingCopy: "",
      };

    case SUBMISSION_DOC_RECOVERY_STATES.EXISTING_DOCUMENT_UNAVAILABLE:
      return {
        ...base,
        primaryAction: SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW,
        secondaryActions: [
          SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK,
          ...(hasUrl ? [SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN] : []),
        ],
        requireReplacementConfirmation: true,
        teacherEscalation: true,
        title: "We could not open or update the Google Doc connected to your essay",
        explanation:
          "Create a new Google Doc so Comp-YouTeacher has a working submission document. The old file will stay in Drive.",
        supportingCopy:
          "APA formatting from the old document will not transfer.",
      };

    case SUBMISSION_DOC_RECOVERY_STATES.VERIFICATION_ERROR:
    case SUBMISSION_DOC_RECOVERY_STATES.API_FAILED:
      return {
        ...base,
        primaryAction: SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK,
        secondaryActions: [
          ...(hasUrl ? [SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN] : []),
        ],
        teacherEscalation: true,
        title: "We could not check your Google Doc right now",
        explanation:
          "This may be a temporary connection problem. Retry the check before creating a new document.",
        supportingCopy: "Tell your teacher if Retry does not help.",
      };

    case SUBMISSION_DOC_RECOVERY_STATES.MISSING_ESSAY:
      return {
        ...base,
        primaryAction: SUBMISSION_DOC_RECOVERY_ACTIONS.FINISH_ESSAY,
        secondaryActions: [],
        title: "Finish your essay first",
        explanation:
          "We could not find your finished essay yet. Go back to Module 7, finish revising, then try again.",
        supportingCopy: "",
      };

    case SUBMISSION_DOC_RECOVERY_STATES.CHECKING:
      return {
        ...base,
        title: "Checking that your latest essay is in this Google Doc…",
        explanation: "",
        supportingCopy: "",
      };

    default:
      return {
        ...base,
        primaryAction: hasUrl
          ? SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE
          : SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE,
        secondaryActions: hasUrl
          ? [
              SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN,
              SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW,
            ]
          : [],
        showSecondaryDisclosure: !!hasUrl,
        requireReplacementConfirmation: true,
        title: hasUrl
          ? "Confirm your Google Doc has your latest essay"
          : "Create your Google Doc",
        explanation: hasUrl
          ? "Update it now so the document matches the essay you finished."
          : "Your finished essay will be placed into a Google Doc.",
        supportingCopy: "",
      };
  }
}

export const SUBMISSION_DOC_REPLACEMENT_CONFIRMATION = Object.freeze({
  title: "Create a new Google Doc?",
  bullets: [
    "Use this only if the current document will not open or update.",
    "Your latest essay will be placed in a new document.",
    "The old Google Doc will remain in Drive.",
    "APA formatting from the old document will not transfer.",
    "The new document will become the submission document connected to Comp-YouTeacher.",
  ],
  confirmLabel: "Create new Google Doc",
  cancelLabel: "Keep current Google Doc",
});

export const SUBMISSION_DOC_RECOVERY_DISCLOSURE_LABEL =
  "Having trouble with your Google Doc?";

export function getRecoveryActionLabel(action, { busy = false } = {}) {
  switch (action) {
    case SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE:
      return busy ? "Updating your Google Doc…" : "Update Google Doc";
    case SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE:
      return busy ? "Creating your Google Doc…" : "Create your Google Doc";
    case SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW:
      return busy ? "Creating a new Google Doc…" : "Create a new Google Doc";
    case SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN:
      return "Open current Google Doc";
    case SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK:
      return busy ? "Checking…" : "Retry check";
    case SUBMISSION_DOC_RECOVERY_ACTIONS.CONTINUE:
      return "Continue";
    case SUBMISSION_DOC_RECOVERY_ACTIONS.FINISH_ESSAY:
      return "Go to Module 7";
    default:
      return "";
  }
}
