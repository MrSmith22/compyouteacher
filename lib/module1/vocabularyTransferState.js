/**
 * WP-090 — Generalized vocabulary-transfer persistence + ethos-v1 migration.
 */

import {
  VOCABULARY_TRANSFER_SCHEMA_VERSION,
  VOCABULARY_TRANSFER_TERM_STATE_VERSION,
  VOCABULARY_TRANSFER_TERM_IDS,
  getVocabularyTransferLessonContract,
  isValidVocabularyTransferStep,
  buildPromptInterpretationSignature,
} from "./vocabularyTransferLessonContract.js";
import {
  createEmptyEthosTransferState,
  normalizeEthosTransferState,
  evaluateEthosTransferReadiness,
} from "./ethosTransferLessonContract.js";

/**
 * Empty per-term lesson state (generalized field names).
 * @param {string} termId
 */
export function createEmptyTermTransferState(termId) {
  const contract = getVocabularyTransferLessonContract(termId);
  const firstStep = contract?.stepIds?.[0] || "notice";
  return {
    schemaVersion: VOCABULARY_TRANSFER_TERM_STATE_VERSION,
    termId: String(termId || ""),
    currentStep: firstStep,
    noticeChoiceId: null,
    noticeFeedbackSeen: false,
    definitionSeen: false,
    boundaryChoiceId: null,
    boundaryFeedbackSeen: false,
    // WP-089 aliases kept during normalize for ethos migration
    exampleNonexampleChoiceId: null,
    exampleNonexampleFeedbackSeen: false,
    audienceEffectChoiceId: null,
    audienceEffectFeedbackSeen: false,
    purposeChoiceId: null,
    purposeFeedbackSeen: false,
    audienceFitChoiceId: null,
    audienceFitFeedbackSeen: false,
    purposeResultChoiceId: null,
    purposeResultFeedbackSeen: false,
    kingChoiceId: null,
    kingFollowUpText: "",
    kingFeedbackSeen: false,
    assignmentTransferSeen: false,
    completed: false,
    promptInterpretationSignature: null,
    promptInterpretationNeedsReview: false,
    updatedAt: null,
  };
}

/**
 * Migrate WP-089 ethos schema-v1 into generalized term state (lossless).
 * @param {unknown} rawEthos
 */
export function migrateEthosV1ToTermState(rawEthos) {
  const legacy = normalizeEthosTransferState(rawEthos);
  const base = createEmptyTermTransferState("ethos");
  return {
    ...base,
    ...legacy,
    termId: "ethos",
    schemaVersion: VOCABULARY_TRANSFER_TERM_STATE_VERSION,
    boundaryChoiceId:
      legacy.exampleNonexampleChoiceId || legacy.boundaryChoiceId || null,
    boundaryFeedbackSeen: Boolean(
      legacy.exampleNonexampleFeedbackSeen || legacy.boundaryFeedbackSeen
    ),
    exampleNonexampleChoiceId: legacy.exampleNonexampleChoiceId,
    exampleNonexampleFeedbackSeen: Boolean(legacy.exampleNonexampleFeedbackSeen),
  };
}

/**
 * Export generalized ethos term state back to WP-089 shape (compat).
 * @param {object} termState
 */
export function termStateToEthosV1(termState) {
  const s = normalizeTermTransferState("ethos", termState);
  const empty = createEmptyEthosTransferState();
  return normalizeEthosTransferState({
    ...empty,
    ...s,
    exampleNonexampleChoiceId:
      s.boundaryChoiceId || s.exampleNonexampleChoiceId || null,
    exampleNonexampleFeedbackSeen: Boolean(
      s.boundaryFeedbackSeen || s.exampleNonexampleFeedbackSeen
    ),
  });
}

/**
 * @param {string} termId
 * @param {unknown} raw
 */
export function normalizeTermTransferState(termId, raw) {
  const empty = createEmptyTermTransferState(termId);
  if (!raw || typeof raw !== "object") return empty;

  // Accept legacy ethos-v1 objects when normalizing ethos
  const source =
    termId === "ethos" &&
    (raw.exampleNonexampleChoiceId ||
      raw.schemaVersion === 1 ||
      !raw.boundaryChoiceId)
      ? migrateEthosV1ToTermState(raw)
      : raw;

  const step = isValidVocabularyTransferStep(termId, source.currentStep)
    ? source.currentStep
    : empty.currentStep;

  const boundaryChoiceId =
    typeof source.boundaryChoiceId === "string"
      ? source.boundaryChoiceId
      : typeof source.exampleNonexampleChoiceId === "string"
        ? source.exampleNonexampleChoiceId
        : null;

  return {
    ...empty,
    ...source,
    schemaVersion: VOCABULARY_TRANSFER_TERM_STATE_VERSION,
    termId,
    currentStep: step,
    noticeChoiceId:
      typeof source.noticeChoiceId === "string" ? source.noticeChoiceId : null,
    boundaryChoiceId,
    exampleNonexampleChoiceId: boundaryChoiceId,
    audienceEffectChoiceId:
      typeof source.audienceEffectChoiceId === "string"
        ? source.audienceEffectChoiceId
        : null,
    purposeChoiceId:
      typeof source.purposeChoiceId === "string" ? source.purposeChoiceId : null,
    audienceFitChoiceId:
      typeof source.audienceFitChoiceId === "string"
        ? source.audienceFitChoiceId
        : null,
    purposeResultChoiceId:
      typeof source.purposeResultChoiceId === "string"
        ? source.purposeResultChoiceId
        : null,
    kingChoiceId:
      typeof source.kingChoiceId === "string" ? source.kingChoiceId : null,
    kingFollowUpText:
      typeof source.kingFollowUpText === "string" ? source.kingFollowUpText : "",
    noticeFeedbackSeen: Boolean(source.noticeFeedbackSeen),
    definitionSeen: Boolean(source.definitionSeen),
    boundaryFeedbackSeen: Boolean(
      source.boundaryFeedbackSeen || source.exampleNonexampleFeedbackSeen
    ),
    exampleNonexampleFeedbackSeen: Boolean(
      source.boundaryFeedbackSeen || source.exampleNonexampleFeedbackSeen
    ),
    audienceEffectFeedbackSeen: Boolean(source.audienceEffectFeedbackSeen),
    purposeFeedbackSeen: Boolean(source.purposeFeedbackSeen),
    audienceFitFeedbackSeen: Boolean(source.audienceFitFeedbackSeen),
    purposeResultFeedbackSeen: Boolean(source.purposeResultFeedbackSeen),
    kingFeedbackSeen: Boolean(source.kingFeedbackSeen),
    assignmentTransferSeen: Boolean(source.assignmentTransferSeen),
    completed: Boolean(source.completed),
    promptInterpretationSignature:
      typeof source.promptInterpretationSignature === "string"
        ? source.promptInterpretationSignature
        : null,
    promptInterpretationNeedsReview: Boolean(
      source.promptInterpretationNeedsReview
    ),
    updatedAt: source.updatedAt || null,
  };
}

/**
 * @param {unknown} raw
 * @param {{ ethosTransfer?: unknown }} [legacy]
 */
export function createEmptyVocabularyTransferState() {
  const terms = {};
  for (const id of VOCABULARY_TRANSFER_TERM_IDS) {
    terms[id] = createEmptyTermTransferState(id);
  }
  return {
    schemaVersion: VOCABULARY_TRANSFER_SCHEMA_VERSION,
    terms,
    updatedAt: null,
  };
}

/**
 * Normalize top-level vocabularyTransfer; migrate WP-089 ethosTransfer if needed.
 * @param {unknown} rawVocabularyTransfer
 * @param {unknown} [rawEthosTransfer]
 */
export function normalizeVocabularyTransferState(
  rawVocabularyTransfer,
  rawEthosTransfer = null
) {
  const empty = createEmptyVocabularyTransferState();
  const raw =
    rawVocabularyTransfer && typeof rawVocabularyTransfer === "object"
      ? rawVocabularyTransfer
      : {};
  const rawTerms =
    raw.terms && typeof raw.terms === "object" ? raw.terms : {};

  const terms = {};
  for (const id of VOCABULARY_TRANSFER_TERM_IDS) {
    terms[id] = normalizeTermTransferState(id, rawTerms[id]);
  }

  // Lossless ethos-v1 migration when generalized ethos is still empty
  if (rawEthosTransfer && typeof rawEthosTransfer === "object") {
    const migrated = migrateEthosV1ToTermState(rawEthosTransfer);
    const existing = terms.ethos;
    const existingHasProgress = Boolean(
      existing.noticeChoiceId ||
        existing.boundaryChoiceId ||
        existing.kingChoiceId ||
        existing.completed ||
        existing.currentStep !== "notice"
    );
    if (!existingHasProgress) {
      terms.ethos = migrated;
    } else if (
      // Prefer richer legacy if timestamps suggest it is newer and existing is incomplete
      !existing.completed &&
      migrated.completed
    ) {
      terms.ethos = migrated;
    }
  }

  return {
    schemaVersion: VOCABULARY_TRANSFER_SCHEMA_VERSION,
    terms,
    updatedAt: raw.updatedAt || null,
  };
}

/**
 * @param {object} termState
 * @param {string} termId
 */
export function evaluateTermTransferReadiness(termId, termState) {
  const contract = getVocabularyTransferLessonContract(termId);
  if (!contract) {
    return { ready: false, missing: ["unknown_term"], completed: false };
  }

  // Ethos: keep WP-089 readiness semantics via legacy evaluator after alias sync
  if (termId === "ethos") {
    const legacy = termStateToEthosV1(termState);
    return evaluateEthosTransferReadiness(legacy);
  }

  const s = normalizeTermTransferState(termId, termState);
  const missing = [];
  const c = contract.completionCriteria || {};
  if (c.requireNoticeDecision && !s.noticeChoiceId) missing.push("notice");
  if (c.requireDefinitionSeen && !s.definitionSeen) missing.push("definition");
  if (c.requireBoundaryDecision && !s.boundaryChoiceId) missing.push("boundary");
  if (c.requireAudienceEffectDecision && !s.audienceEffectChoiceId) {
    missing.push("audience_effect");
  }
  if (c.requirePurposeConnection && !s.purposeChoiceId) missing.push("purpose");
  if (c.requireAudienceFitDecision && !s.audienceFitChoiceId) {
    missing.push("audience_fit");
  }
  if (c.requirePurposeResultDecision && !s.purposeResultChoiceId) {
    missing.push("purpose_result");
  }
  if (c.requireKingApplication && !s.kingChoiceId) missing.push("king_apply");
  if (c.requireAssignmentTransferSeen && !s.assignmentTransferSeen) {
    missing.push("assignment_transfer");
  }
  return {
    ready: missing.length === 0,
    missing,
    completed: Boolean(s.completed) && missing.length === 0,
    contractVersion: contract.schemaVersion,
  };
}

/**
 * @param {object} vocabularyTransfer
 */
export function evaluateAllVocabularyTransferReadiness(vocabularyTransfer) {
  const state = normalizeVocabularyTransferState(vocabularyTransfer);
  const byTerm = {};
  let allReady = true;
  for (const id of VOCABULARY_TRANSFER_TERM_IDS) {
    const result = evaluateTermTransferReadiness(id, state.terms[id]);
    byTerm[id] = result;
    if (!result.completed) allReady = false;
  }
  return { allReady, byTerm, quizUnlockReady: allReady };
}

/**
 * Compact trail of completed term cues.
 * @param {object} vocabularyTransfer
 */
export function getCompletedVocabularyTrail(vocabularyTransfer) {
  const state = normalizeVocabularyTransferState(vocabularyTransfer);
  const trail = [];
  for (const id of VOCABULARY_TRANSFER_TERM_IDS) {
    const term = state.terms[id];
    if (term?.completed) {
      const contract = getVocabularyTransferLessonContract(id);
      trail.push(contract?.cumulativeCue || id);
    }
  }
  return trail;
}

/**
 * Mark transfer review when paraphrase signature changes; preserve decisions.
 * @param {object} termState
 * @param {string} paraphrase
 */
export function applyParaphraseSignatureToTermState(termState, paraphrase) {
  const s = { ...termState };
  const sig = buildPromptInterpretationSignature(paraphrase);
  if (sig && s.promptInterpretationSignature && sig !== s.promptInterpretationSignature) {
    return {
      ...s,
      promptInterpretationSignature: sig,
      promptInterpretationNeedsReview: true,
    };
  }
  if (sig && !s.promptInterpretationSignature) {
    return { ...s, promptInterpretationSignature: sig };
  }
  return s;
}

export { buildPromptInterpretationSignature, VOCABULARY_TRANSFER_TERM_IDS };
