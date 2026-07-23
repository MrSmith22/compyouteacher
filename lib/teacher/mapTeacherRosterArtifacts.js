/**
 * WP-099 — Pure mapper from batch DB metadata → projection input.
 * No DB I/O. Safe for unit tests without path aliases.
 */

import { evaluateAllVocabularyTransferReadiness } from "../module1/vocabularyTransferState.js";
import {
  areFormattingMovesComplete,
  isDocInspectionComplete,
  normalizeGuidedApaProtocolState,
} from "../module9/guidedApaProtocolState.js";
import { isMatrixHandoffReady } from "../module2/matrixOrchestrationHelpers.js";

const MLK_ASSIGNMENT_ID = "mlk-rhetorical-analysis";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function hasNonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Map batch DB rows for one student into projection artifact bag (booleans only).
 * @param {object} bag
 */
export function mapBatchRowsToArtifactInput(bag = {}) {
  const assignment = bag.assignment || null;
  const vocab = bag.vocabTransfer || null;
  const sources = bag.sources || null;
  const buckets2 = bag.buckets2 || null;
  const buckets3 = bag.buckets3 || null;
  const buckets4 = bag.buckets4 || null;
  const outline = bag.outline || null;
  const draft6 = bag.draft6 || null;
  const draft7 = bag.draft7 || null;
  const draft8 = bag.draft8 || null;
  const exportedDoc = bag.exportedDoc || null;
  const guidedApa = bag.guidedApa || null;
  const exportPdf = bag.exportPdf || null;
  const quiz = bag.quiz || null;
  const checklist = bag.checklist || null;

  let vocabTransferReady = false;
  if (vocab?.state) {
    try {
      const readiness = evaluateAllVocabularyTransferReadiness(vocab.state);
      vocabTransferReady = Boolean(readiness?.allReady);
    } catch {
      vocabTransferReady = false;
    }
  }

  const hasSpeech =
    hasNonEmptyText(sources?.mlk_text) || hasNonEmptyText(sources?.speech_text);
  const hasLetter =
    hasNonEmptyText(sources?.lfbj_text) || hasNonEmptyText(sources?.letter_text);
  const sourcesReady = hasSpeech && hasLetter;

  let directionReady = false;
  try {
    const flow = buckets2?.flow_state;
    const bundle = flow?.module2Artifacts?.matrixBundle || flow?.matrixBundle;
    if (bundle) directionReady = Boolean(isMatrixHandoffReady(bundle));
  } catch {
    directionReady = false;
  }

  const thesis =
    buckets3?.flow_state?.module3Thesis?.thesis ||
    buckets3?.flow_state?.thesis ||
    null;
  const proofPlan =
    buckets3?.flow_state?.module3Thesis?.proofPlan ||
    buckets3?.flow_state?.proofPlan ||
    [];
  const hasThesis = hasNonEmptyText(thesis);
  const hasProofPlan = Array.isArray(proofPlan)
    ? proofPlan.filter((p) => hasNonEmptyText(p) || hasNonEmptyText(p?.text))
        .length > 0
    : false;

  const hasPlans = Boolean(
    buckets4 &&
      (Array.isArray(buckets4.buckets)
        ? buckets4.buckets.length > 0
        : buckets4.buckets && Object.keys(buckets4.buckets).length > 0)
  );

  const outlineFinalized = outline?.finalized === true;
  const hasOutline = Boolean(outline?.outline);

  const hasDraft = Boolean(
    draft6 &&
      (draft6.has_sections ||
        draft6.has_full_text ||
        draft6.locked === true ||
        draft6.updated_at)
  );
  const draftLocked = draft6?.locked === true;

  const hasRevisedText = Boolean(
    draft7?.has_final_text || draft7?.has_full_text || draft7?.revised === true
  );

  const hasGoogleDoc = Boolean(
    exportedDoc?.document_id ||
      exportedDoc?.web_view_link ||
      exportedDoc?.has_pointer
  );

  let guidedApaComplete = false;
  if (guidedApa?.state) {
    try {
      const state = normalizeGuidedApaProtocolState(guidedApa.state);
      guidedApaComplete =
        areFormattingMovesComplete(state) && isDocInspectionComplete(state);
    } catch {
      guidedApaComplete = false;
    }
  }

  const receipt = exportPdf
    ? {
        hasReceiptRow: true,
        storagePath: exportPdf.storage_path || null,
        fileName: exportPdf.file_name || null,
        pdfUrl: exportPdf.public_url || exportPdf.web_view_link || null,
        byteSize:
          exportPdf.file_size != null &&
          !Number.isNaN(Number(exportPdf.file_size))
            ? Number(exportPdf.file_size)
            : null,
        submittedAt: exportPdf.uploaded_at || exportPdf.created_at || null,
        gradingStatus: exportPdf.grading_status || "ungraded",
      }
    : null;

  const receiptForProjection = receipt
    ? {
        hasReceiptRow: true,
        storagePath: receipt.storagePath,
        fileName: receipt.fileName,
        byteSize: receipt.byteSize,
        submittedAt: receipt.submittedAt,
      }
    : null;

  const timestamps = [
    assignment?.updated_at,
    vocab?.updated_at,
    sources?.updated_at,
    buckets2?.updated_at,
    buckets3?.updated_at,
    buckets4?.updated_at,
    outline?.updated_at,
    draft6?.updated_at,
    draft7?.updated_at,
    exportedDoc?.created_at,
    guidedApa?.updated_at,
    exportPdf?.uploaded_at,
    exportPdf?.created_at,
  ]
    .filter(Boolean)
    .map((t) => Date.parse(t))
    .filter((n) => Number.isFinite(n));

  const latestUpdateAt =
    timestamps.length > 0
      ? new Date(Math.max(...timestamps)).toISOString()
      : assignment?.updated_at || null;

  return {
    studentId: String(assignment?.user_email || bag.email || ""),
    displayName: bag.displayName || null,
    email: String(assignment?.user_email || bag.email || ""),
    assignmentId: bag.assignmentId || MLK_ASSIGNMENT_ID,
    currentModule: assignment?.current_module ?? null,
    latestUpdateAt,
    artifacts: {
      understandComplete: vocabTransferReady,
      vocabTransferReady,
      legacyQuizComplete: Boolean(bag.legacyModule1Complete),
      sourcesReady,
      directionReady,
      hasThesis,
      hasProofPlan,
      hasPlans,
      hasOutline,
      outlineFinalized,
      hasDraft,
      draftLocked,
      hasRevisedText,
      hasGoogleDoc,
      guidedApaComplete,
      prepareCompleteClaimed: Boolean(draft8?.final_ready) && !hasGoogleDoc,
      finalReady: Boolean(draft8?.final_ready),
      malformedArtifact: Boolean(bag.malformedArtifact),
      futureVersionArtifact: Boolean(bag.futureVersionArtifact),
    },
    receipt: receiptForProjection,
    assignmentConfigFailure: Boolean(bag.assignmentConfigFailure),
    historical: {
      hasQuizRecord: Boolean(quiz),
      hasChecklistRecord: Boolean(checklist),
    },
    _detail: {
      googleDocUrl: exportedDoc?.web_view_link || null,
      pdfUrl: receipt?.pdfUrl || null,
      pdfFileName: receipt?.fileName || null,
      pdfFileSize: receipt?.byteSize ?? null,
      pdfUploadedAt: receipt?.submittedAt || null,
      gradingStatus: receipt?.gradingStatus || null,
    },
  };
}
