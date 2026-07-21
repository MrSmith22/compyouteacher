/**
 * WP-082 — Diagnostic revision targeting for Conclusion slice.
 * Never mutates student prose. Does not require body transitions.
 * Synthesis and new-claim concerns are advisory.
 */

import {
  diagnoseConclusionHealth,
  pickHighestLeverageConclusionSignal,
} from "../artifacts/conclusionHealth.js";
import {
  ensureRevisionBaseline,
  applyRevisionCompareState,
} from "./bodyParagraphDiagnostics.js";

export const CONCLUSION_REVISION_TARGET_IDS = Object.freeze({
  FRESH_THESIS: "fresh_thesis",
  SYNTHESIZE: "synthesize",
  COMPARISON_INSIGHT: "comparison_insight",
  FINAL_THOUGHT: "final_thought",
  MOVE_NEW_CLAIM: "move_new_claim",
  DEVELOP: "develop",
});

const SIGNAL_TO_TARGET = Object.freeze({
  verbatim_thesis: CONCLUSION_REVISION_TARGET_IDS.FRESH_THESIS,
  thesis_drift: CONCLUSION_REVISION_TARGET_IDS.FRESH_THESIS,
  stale_upstream: CONCLUSION_REVISION_TARGET_IDS.FRESH_THESIS,
  lists_body_points: CONCLUSION_REVISION_TARGET_IDS.SYNTHESIZE,
  missing_synthesis: CONCLUSION_REVISION_TARGET_IDS.SYNTHESIZE,
  new_evidence_at_end: CONCLUSION_REVISION_TARGET_IDS.MOVE_NEW_CLAIM,
  new_unsupported_claim: CONCLUSION_REVISION_TARGET_IDS.MOVE_NEW_CLAIM,
  missing_final_thought: CONCLUSION_REVISION_TARGET_IDS.FINAL_THOUGHT,
  underdevelopment: CONCLUSION_REVISION_TARGET_IDS.DEVELOP,
});

export const CONCLUSION_REVISION_TARGET_META = Object.freeze({
  [CONCLUSION_REVISION_TARGET_IDS.FRESH_THESIS]: {
    id: CONCLUSION_REVISION_TARGET_IDS.FRESH_THESIS,
    title: "Return to your argument in fresh words",
    teach:
      "Restate the central relationship without copying the thesis sentence.",
  },
  [CONCLUSION_REVISION_TARGET_IDS.SYNTHESIZE]: {
    id: CONCLUSION_REVISION_TARGET_IDS.SYNTHESIZE,
    title: "Bring the body paragraphs together",
    teach:
      "Show how the paragraph purposes work together instead of listing them.",
  },
  [CONCLUSION_REVISION_TARGET_IDS.COMPARISON_INSIGHT]: {
    id: CONCLUSION_REVISION_TARGET_IDS.COMPARISON_INSIGHT,
    title: "Explain what the comparison shows",
    teach:
      "State the larger insight the reader should take from your analysis.",
  },
  [CONCLUSION_REVISION_TARGET_IDS.FINAL_THOUGHT]: {
    id: CONCLUSION_REVISION_TARGET_IDS.FINAL_THOUGHT,
    title: "End with one purposeful final thought",
    teach:
      "Close deliberately. Do not reopen the argument with a new unsupported claim.",
  },
  [CONCLUSION_REVISION_TARGET_IDS.MOVE_NEW_CLAIM]: {
    id: CONCLUSION_REVISION_TARGET_IDS.MOVE_NEW_CLAIM,
    title: "Move this new claim to where it can be supported",
    teach:
      "New evidence or a new claim belongs in a body paragraph, not the ending.",
  },
  [CONCLUSION_REVISION_TARGET_IDS.DEVELOP]: {
    id: CONCLUSION_REVISION_TARGET_IDS.DEVELOP,
    title: "Develop the ending",
    teach:
      "Add the missing move—fresh thesis return, synthesis, insight, or final thought.",
  },
});

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {object} input
 */
export function diagnoseConclusionRevision(input = {}) {
  const health = diagnoseConclusionHealth(input);
  const top = pickHighestLeverageConclusionSignal(health);

  let targetId =
    (top && SIGNAL_TO_TARGET[top.id]) || CONCLUSION_REVISION_TARGET_IDS.DEVELOP;

  if (!safeText(input.assembledProse) || safeText(input.assembledProse).length < 30) {
    targetId = CONCLUSION_REVISION_TARGET_IDS.DEVELOP;
  }

  const recommendedTarget =
    CONCLUSION_REVISION_TARGET_META[targetId] ||
    CONCLUSION_REVISION_TARGET_META[CONCLUSION_REVISION_TARGET_IDS.DEVELOP];

  const alternateIds = Object.values(CONCLUSION_REVISION_TARGET_IDS).filter(
    (id) => id !== targetId
  );
  const alternateTargets = alternateIds.map(
    (id) => CONCLUSION_REVISION_TARGET_META[id]
  );

  return {
    health,
    recommendedTarget,
    alternateTargets,
    inspectLocus: top?.locus || recommendedTarget.id,
    confidenceNote:
      "This suggestion may not fit perfectly. You choose what to revise.",
  };
}

export function getConclusionRevisionFromDraftMeta(draftMeta) {
  const map = draftMeta?.verticalSlice?.revisionBySectionType;
  if (!map || typeof map !== "object") return null;
  return map.conclusion ?? null;
}

export function setConclusionRevisionInDraftMeta(draftMeta, revisionState) {
  const prev = draftMeta && typeof draftMeta === "object" ? { ...draftMeta } : {};
  const verticalSlice = {
    ...(prev.verticalSlice && typeof prev.verticalSlice === "object"
      ? prev.verticalSlice
      : {}),
  };
  const revisionBySectionType = {
    ...(verticalSlice.revisionBySectionType &&
    typeof verticalSlice.revisionBySectionType === "object"
      ? verticalSlice.revisionBySectionType
      : {}),
  };
  revisionBySectionType.conclusion = revisionState;
  verticalSlice.revisionBySectionType = revisionBySectionType;
  return { ...prev, verticalSlice };
}

export { ensureRevisionBaseline, applyRevisionCompareState };
