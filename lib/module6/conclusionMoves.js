/**
 * WP-082 — Conclusion sentence-move library.
 * A conclusion is not a shorter body paragraph.
 */

import {
  assembleSectionProse,
  normalizeSectionMoveState,
  resolveAssembledSectionProse,
  selectDeskArtifactsForMove as sharedSelectDeskArtifactsForMove,
  getSectionMovesFromDraftMeta,
  setSectionMovesInDraftMeta,
  SECTION_SLICE_KEYS,
} from "./sectionMoveEngine.js";

export const CONCLUSION_MOVE_IDS = Object.freeze([
  "return_to_thesis",
  "synthesize_body",
  "comparison_insight",
  "final_thought",
]);

export const CONCLUSION_MOVE_META = Object.freeze({
  return_to_thesis: {
    id: "return_to_thesis",
    title: "Return to the thesis in fresh language",
    model:
      "Restate the central relationship without copying the thesis sentence word for word.",
    deskFields: ["thesis"],
  },
  synthesize_body: {
    id: "synthesize_body",
    title: "Synthesize the body paragraphs",
    model:
      "Show how the paragraph purposes work together—do not merely list Body Paragraph 1, 2, and 3.",
    deskFields: ["bodyPurposes"],
  },
  comparison_insight: {
    id: "comparison_insight",
    title: "Explain what the comparison helps the reader understand",
    model:
      "State the larger insight earned by the essay's analysis.",
    deskFields: ["conclusionSummary", "thesis"],
  },
  final_thought: {
    id: "final_thought",
    title: "Purposeful final thought",
    model:
      "End deliberately without adding unsupported evidence or a brand-new claim.",
    deskFields: ["conclusionFinalThought", "thesis"],
  },
});

export const CONCLUSION_DESK_FIELD_LABELS = Object.freeze({
  thesis: "Thesis",
  bodyPurposes: "Body paragraph purposes",
  conclusionSummary: "Conclusion plan — what the reader should understand",
  conclusionFinalThought: "Conclusion plan — why it matters",
});

export function defaultConclusionMoveOrder() {
  return [...CONCLUSION_MOVE_IDS];
}

export function selectConclusionDeskArtifacts(moveId, deskArtifacts = {}) {
  return sharedSelectDeskArtifactsForMove(
    moveId,
    deskArtifacts,
    CONCLUSION_MOVE_META,
    CONCLUSION_DESK_FIELD_LABELS
  );
}

export function assembleConclusionProse(
  moves = {},
  moveOrder = CONCLUSION_MOVE_IDS
) {
  return assembleSectionProse(moves, moveOrder);
}

export function normalizeConclusionMoveState(raw) {
  return normalizeSectionMoveState(raw, {
    moveOrder: defaultConclusionMoveOrder(),
  });
}

export function resolveAssembledConclusionProse(moveState) {
  return resolveAssembledSectionProse(moveState, {
    moveOrder: defaultConclusionMoveOrder(),
  });
}

export function getConclusionMovesFromDraftMeta(draftMeta) {
  return getSectionMovesFromDraftMeta(draftMeta, SECTION_SLICE_KEYS.CONCLUSION);
}

export function setConclusionMovesInDraftMeta(draftMeta, moveState) {
  return setSectionMovesInDraftMeta(
    draftMeta,
    SECTION_SLICE_KEYS.CONCLUSION,
    moveState,
    defaultConclusionMoveOrder()
  );
}

export const CONCLUSION_OUTLINE_MOVE_TITLES = Object.freeze({
  return_to_thesis: "Return to thesis (fresh language)",
  synthesize_body: "Synthesize body paragraphs",
  comparison_insight: "What the comparison shows",
  final_thought: "Purposeful final thought",
});
