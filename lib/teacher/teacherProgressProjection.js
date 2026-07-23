/**
 * WP-099 — Pure teacher progress projection (versioned).
 * Maps durable artifact metadata + receipt facts → journey stage, status, attention.
 * No DB I/O. Never treats quiz/checklist/activity-count/final_ready as submission truth.
 */

import {
  WRITING_JOURNEY_STAGES,
  getJourneyStageForModule,
} from "../ui/writingJourneyStages.js";

export const TEACHER_PROGRESS_PROJECTION_VERSION = 1;

/** @typedef {'not_started'|'in_progress'|'ready_for_next'|'submitted'|'needs_attention'} TeacherOverallStatus */

/** @typedef {'progression_ahead_of_artifact'|'receipt_metadata_incomplete'|'malformed_artifact'|'assignment_config_failure'|'prepare_claim_without_doc'} TeacherAttentionCode */

export const TEACHER_OVERALL_STATUSES = Object.freeze([
  "not_started",
  "in_progress",
  "ready_for_next",
  "submitted",
  "needs_attention",
]);

export const TEACHER_ATTENTION_CODES = Object.freeze({
  PROGRESSION_AHEAD_OF_ARTIFACT: "progression_ahead_of_artifact",
  RECEIPT_METADATA_INCOMPLETE: "receipt_metadata_incomplete",
  MALFORMED_ARTIFACT: "malformed_artifact",
  ASSIGNMENT_CONFIG_FAILURE: "assignment_config_failure",
  PREPARE_CLAIM_WITHOUT_DOC: "prepare_claim_without_doc",
});

const STAGE_ORDER = WRITING_JOURNEY_STAGES.map((s) => s.id);

/**
 * @param {string|null|undefined} stageId
 * @returns {number}
 */
function stageIndex(stageId) {
  if (!stageId) return -1;
  return STAGE_ORDER.indexOf(stageId);
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isTruthyFlag(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

/**
 * Durable final-PDF receipt (WP-080 truth). Presence of row + identifying fields.
 * @param {object|null|undefined} receipt
 */
export function hasDurableFinalPdfReceipt(receipt) {
  if (!receipt || typeof receipt !== "object") return false;
  const hasPointer =
    Boolean(receipt.storagePath) ||
    Boolean(receipt.fileName) ||
    Boolean(receipt.pdfUrl) ||
    Boolean(receipt.hasReceiptRow);
  return hasPointer;
}

/**
 * Receipt claimed but metadata incomplete / mismatched.
 * @param {object|null|undefined} receipt
 */
export function isReceiptMetadataIncomplete(receipt) {
  if (!receipt || typeof receipt !== "object") return false;
  if (!isTruthyFlag(receipt.claimedSubmitted) && !isTruthyFlag(receipt.hasReceiptRow)) {
    return false;
  }
  const hasPath = Boolean(receipt.storagePath) || Boolean(receipt.pdfUrl);
  const hasName = Boolean(receipt.fileName);
  const hasBytes =
    receipt.byteSize != null && Number(receipt.byteSize) > 0;
  if (isTruthyFlag(receipt.claimedSubmitted) && !hasPath && !hasName) return true;
  if (isTruthyFlag(receipt.hasReceiptRow) && !hasPath && !hasName) return true;
  if (isTruthyFlag(receipt.hasReceiptRow) && hasPath && receipt.byteSize === 0) return true;
  if (isTruthyFlag(receipt.metadataMismatch)) return true;
  return Boolean(hasPath && receipt.byteSize != null && !hasBytes && receipt.byteSize !== null);
}

/**
 * Highest stage earned from durable artifacts (not current_module, not activity count).
 * @param {object} artifacts
 * @returns {string|null}
 */
export function deriveHighestEarnedStageId(artifacts = {}) {
  const a = artifacts || {};
  // Submit stage earned only by durable receipt — handled separately.
  if (isTruthyFlag(a.hasRevisedText)) return "revise";
  if (isTruthyFlag(a.hasDraft) || isTruthyFlag(a.draftLocked)) return "draft";
  if (isTruthyFlag(a.outlineFinalized) || isTruthyFlag(a.hasOutline)) return "plan";
  if (isTruthyFlag(a.hasPlans)) return "plan";
  if (isTruthyFlag(a.hasThesis) && isTruthyFlag(a.hasProofPlan)) return "develop_argument";
  if (isTruthyFlag(a.hasThesis) || isTruthyFlag(a.hasProofPlan)) return "develop_argument";
  if (isTruthyFlag(a.sourcesReady) && isTruthyFlag(a.directionReady)) return "read_and_notice";
  if (isTruthyFlag(a.sourcesReady) || isTruthyFlag(a.directionReady)) return "read_and_notice";
  if (
    isTruthyFlag(a.understandComplete) ||
    isTruthyFlag(a.vocabTransferReady) ||
    isTruthyFlag(a.legacyQuizComplete)
  ) {
    return "understand";
  }
  return null;
}

/**
 * Current work stage for display: prepare/submit when Doc/APA in play; else earned + orientation.
 * @param {object} input
 */
export function deriveCurrentWorkStageId(input = {}) {
  const artifacts = input.artifacts || {};
  const receipt = input.receipt || null;
  if (hasDurableFinalPdfReceipt(receipt)) return "submit";

  if (isTruthyFlag(artifacts.hasGoogleDoc) || isTruthyFlag(artifacts.guidedApaComplete)) {
    if (isTruthyFlag(artifacts.guidedApaComplete) && isTruthyFlag(artifacts.hasGoogleDoc)) {
      return "submit";
    }
    return "prepare";
  }

  const earned = deriveHighestEarnedStageId(artifacts);
  const orientationModule = Number(input.currentModule);
  const orientationStage = Number.isFinite(orientationModule)
    ? getJourneyStageForModule(orientationModule)
    : null;

  if (!earned && !orientationStage) return null;
  if (!earned) return orientationStage?.id || null;
  if (!orientationStage) return earned;

  // Orientation may point at next work; never invent earned stages from orientation alone beyond display.
  const earnedIdx = stageIndex(earned);
  const orientIdx = stageIndex(orientationStage.id);
  if (orientIdx > earnedIdx + 1) {
    // Jumping far ahead of artifacts → attention handled elsewhere; show orientation for current work label.
    return orientationStage.id;
  }
  if (orientIdx > earnedIdx) return orientationStage.id;
  return earned;
}

/**
 * Compact roster-safe artifact trail (booleans / labels only — never prose/URLs).
 * @param {object} artifacts
 * @param {object|null} receipt
 */
export function buildArtifactTrail(artifacts = {}, receipt = null) {
  const a = artifacts || {};
  return Object.freeze([
    Object.freeze({
      id: "understand",
      label: "Understand",
      present: Boolean(
        a.understandComplete || a.vocabTransferReady || a.legacyQuizComplete
      ),
    }),
    Object.freeze({
      id: "read_and_notice",
      label: "Read and notice",
      present: Boolean(a.sourcesReady && a.directionReady),
    }),
    Object.freeze({
      id: "develop_argument",
      label: "Develop an argument",
      present: Boolean(a.hasThesis && a.hasProofPlan),
    }),
    Object.freeze({
      id: "plan",
      label: "Plan",
      present: Boolean(a.hasPlans || a.outlineFinalized || a.hasOutline),
    }),
    Object.freeze({
      id: "draft",
      label: "Draft",
      present: Boolean(a.hasDraft),
    }),
    Object.freeze({
      id: "revise",
      label: "Revise",
      present: Boolean(a.hasRevisedText),
    }),
    Object.freeze({
      id: "prepare",
      label: "Prepare",
      present: Boolean(a.hasGoogleDoc),
    }),
    Object.freeze({
      id: "submit",
      label: "Submit",
      present: hasDurableFinalPdfReceipt(receipt),
    }),
  ]);
}

/**
 * Explicit attention reasons only (no inactivity / quiz / ordinary incomplete).
 * @param {object} input
 * @returns {Array<{ code: string, message: string, safeAction: string }>}
 */
export function deriveAttentionReasons(input = {}) {
  const artifacts = input.artifacts || {};
  const receipt = input.receipt || null;
  const reasons = [];

  if (isTruthyFlag(input.assignmentConfigFailure)) {
    reasons.push({
      code: TEACHER_ATTENTION_CODES.ASSIGNMENT_CONFIG_FAILURE,
      message: "Assignment configuration needs repair for this student.",
      safeAction: "retry_configuration",
    });
  }

  if (isTruthyFlag(artifacts.malformedArtifact) || isTruthyFlag(artifacts.futureVersionArtifact)) {
    reasons.push({
      code: TEACHER_ATTENTION_CODES.MALFORMED_ARTIFACT,
      message: "A saved writing artifact needs recovery before progress can be trusted.",
      safeAction: "contact_support",
    });
  }

  if (isReceiptMetadataIncomplete(receipt)) {
    reasons.push({
      code: TEACHER_ATTENTION_CODES.RECEIPT_METADATA_INCOMPLETE,
      message: "Submission receipt metadata is incomplete or mismatched.",
      safeAction: "inspect_receipt",
    });
  }

  if (
    isTruthyFlag(artifacts.prepareCompleteClaimed) &&
    !isTruthyFlag(artifacts.hasGoogleDoc)
  ) {
    reasons.push({
      code: TEACHER_ATTENTION_CODES.PREPARE_CLAIM_WITHOUT_DOC,
      message: "Prepare was marked complete, but no Google Doc pointer is saved.",
      safeAction: "inspect_doc_mismatch",
    });
  }

  // Effective stage for gap checks includes prepare/submit work (Doc / APA),
  // so ready-to-submit students are not flagged as "ahead of artifacts".
  let effectiveEarned = deriveHighestEarnedStageId(artifacts);
  if (isTruthyFlag(artifacts.hasGoogleDoc) || isTruthyFlag(artifacts.guidedApaComplete)) {
    effectiveEarned = isTruthyFlag(artifacts.guidedApaComplete)
      ? "submit"
      : "prepare";
  }
  if (hasDurableFinalPdfReceipt(receipt) && !isReceiptMetadataIncomplete(receipt)) {
    effectiveEarned = "submit";
  }

  const orientationModule = Number(input.currentModule);
  const orientationStage = Number.isFinite(orientationModule)
    ? getJourneyStageForModule(orientationModule)
    : null;
  if (orientationStage && effectiveEarned) {
    const gap = stageIndex(orientationStage.id) - stageIndex(effectiveEarned);
    if (gap > 1) {
      reasons.push({
        code: TEACHER_ATTENTION_CODES.PROGRESSION_AHEAD_OF_ARTIFACT,
        message: "Progress position is ahead of required saved writing work.",
        safeAction: "reopen_step",
      });
    }
  } else if (
    orientationStage &&
    !effectiveEarned &&
    stageIndex(orientationStage.id) > 0
  ) {
    reasons.push({
      code: TEACHER_ATTENTION_CODES.PROGRESSION_AHEAD_OF_ARTIFACT,
      message: "Progress position is ahead of required saved writing work.",
      safeAction: "reopen_step",
    });
  }

  return reasons;
}

/**
 * Overall teacher status taxonomy.
 * Precedence: durable receipt → submitted; attention → needs_attention; else earned progress.
 * @param {object} input
 * @returns {TeacherOverallStatus}
 */
export function deriveOverallStatus(input = {}) {
  const artifacts = input.artifacts || {};
  const receipt = input.receipt || null;
  const attention = deriveAttentionReasons(input);

  // Receipt wins Submitted even if other signals conflict — unless receipt metadata is broken.
  if (hasDurableFinalPdfReceipt(receipt) && !isReceiptMetadataIncomplete(receipt)) {
    return "submitted";
  }

  if (attention.length > 0) {
    return "needs_attention";
  }

  const earned = deriveHighestEarnedStageId(artifacts);
  const hasDoc = isTruthyFlag(artifacts.hasGoogleDoc);
  const hasApa = isTruthyFlag(artifacts.guidedApaComplete);

  if (!earned && !hasDoc && !hasApa) {
    return "not_started";
  }

  // Ready for next: stage complete and waiting on next work (e.g. revised + no Doc yet → ready to prepare)
  if (isTruthyFlag(artifacts.hasRevisedText) && !hasDoc) {
    return "ready_for_next";
  }
  if (hasDoc && hasApa && !hasDurableFinalPdfReceipt(receipt)) {
    return "ready_for_next";
  }
  if (
    isTruthyFlag(artifacts.understandComplete) &&
    !isTruthyFlag(artifacts.sourcesReady) &&
    !isTruthyFlag(artifacts.directionReady)
  ) {
    // completed understand only — still in progress toward next
  }

  return "in_progress";
}

/**
 * Human-readable current-work label for roster.
 * @param {object} input
 */
export function deriveCurrentWorkLabel(input = {}) {
  const status = deriveOverallStatus(input);
  if (status === "submitted") return "Submitted";
  if (status === "not_started") return "Not started";
  const stageId = deriveCurrentWorkStageId(input);
  const stage = WRITING_JOURNEY_STAGES.find((s) => s.id === stageId);
  if (!stage) return "Not started";
  if (status === "ready_for_next") {
    if (stageId === "revise" || (input.artifacts?.hasRevisedText && !input.artifacts?.hasGoogleDoc)) {
      return "Ready to prepare";
    }
    if (stageId === "submit" || stageId === "prepare") {
      return "Ready to submit";
    }
    return `Ready for ${stage.label}`;
  }
  if (status === "needs_attention") return `Needs attention · ${stage.label}`;
  return stage.label;
}

/**
 * Project one student into the teacher roster read-model row.
 * Roster-safe: no prose, private URLs, notes, or quiz bodies.
 *
 * @param {{
 *   studentId: string,
 *   displayName?: string|null,
 *   email?: string|null,
 *   assignmentId?: string|null,
 *   currentModule?: number|null,
 *   latestUpdateAt?: string|null,
 *   artifacts?: object,
 *   receipt?: object|null,
 *   assignmentConfigFailure?: boolean,
 *   historical?: object,
 * }} input
 */
export function projectTeacherStudentProgress(input = {}) {
  const artifacts = input.artifacts || {};
  const receipt = input.receipt || null;
  const attentionReasons = deriveAttentionReasons(input);
  const overallStatus = deriveOverallStatus(input);
  const currentWorkStageId = deriveCurrentWorkStageId(input);
  const highestEarnedStageId = deriveHighestEarnedStageId(artifacts);
  const trail = buildArtifactTrail(artifacts, receipt);
  const submitted = overallStatus === "submitted";

  return Object.freeze({
    projectionVersion: TEACHER_PROGRESS_PROJECTION_VERSION,
    studentId: String(input.studentId || ""),
    displayName: input.displayName != null ? String(input.displayName) : null,
    email: input.email != null ? String(input.email) : null,
    assignmentId: input.assignmentId != null ? String(input.assignmentId) : null,
    overallStatus,
    currentWorkStageId,
    highestEarnedStageId,
    currentWorkLabel: deriveCurrentWorkLabel(input),
    latestUpdateAt: input.latestUpdateAt || null,
    artifactTrail: trail,
    receiptStatus: Object.freeze({
      submitted,
      submittedAt: receipt?.submittedAt || null,
      hasDurableReceipt: hasDurableFinalPdfReceipt(receipt),
    }),
    hasGoogleDoc: Boolean(artifacts.hasGoogleDoc),
    attentionReasons: Object.freeze(attentionReasons.map((r) => Object.freeze({ ...r }))),
    needsAttention: attentionReasons.length > 0 && overallStatus === "needs_attention",
    // Orientation / freshness only — never completion authority
    orientationModule:
      input.currentModule != null && Number.isFinite(Number(input.currentModule))
        ? Number(input.currentModule)
        : null,
    // Historical metadata flags only (never scores as readiness)
    historical: Object.freeze({
      hasQuizRecord: Boolean(input.historical?.hasQuizRecord),
      hasChecklistRecord: Boolean(input.historical?.hasChecklistRecord),
    }),
  });
}

/**
 * Sort: explicit attention first, then stage order (later first for readiness), then freshness, then name.
 * @param {ReturnType<typeof projectTeacherStudentProgress>[]} rows
 */
export function sortTeacherRosterRows(rows = []) {
  return [...rows].sort((a, b) => {
    const aAtt = a.overallStatus === "needs_attention" ? 0 : 1;
    const bAtt = b.overallStatus === "needs_attention" ? 0 : 1;
    if (aAtt !== bAtt) return aAtt - bAtt;

    const aSub = a.overallStatus === "submitted" ? 1 : 0;
    const bSub = b.overallStatus === "submitted" ? 1 : 0;
    if (aSub !== bSub) return aSub - bSub;

    const aStage = stageIndex(a.currentWorkStageId);
    const bStage = stageIndex(b.currentWorkStageId);
    if (aStage !== bStage) return bStage - aStage;

    const aTime = a.latestUpdateAt ? Date.parse(a.latestUpdateAt) : 0;
    const bTime = b.latestUpdateAt ? Date.parse(b.latestUpdateAt) : 0;
    if (aTime !== bTime) return bTime - aTime;

    const aName = (a.displayName || a.email || a.studentId || "").toLowerCase();
    const bName = (b.displayName || b.email || b.studentId || "").toLowerCase();
    return aName.localeCompare(bName);
  });
}

/**
 * Summary counts for Progress header.
 * @param {ReturnType<typeof projectTeacherStudentProgress>[]} rows
 */
export function summarizeTeacherRoster(rows = []) {
  const counts = {
    total: rows.length,
    not_started: 0,
    in_progress: 0,
    ready_for_next: 0,
    submitted: 0,
    needs_attention: 0,
  };
  for (const row of rows) {
    if (counts[row.overallStatus] != null) counts[row.overallStatus] += 1;
  }
  return Object.freeze(counts);
}
