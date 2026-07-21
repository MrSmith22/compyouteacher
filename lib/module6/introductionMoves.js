/**
 * WP-082 — Introduction sentence-move library.
 * An introduction is not a body paragraph without evidence.
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

export const INTRODUCTION_MOVE_IDS = Object.freeze([
  "opening_context",
  "background_relationship",
  "bridge_to_argument",
  "thesis_destination",
]);

export const INTRODUCTION_MOVE_META = Object.freeze({
  opening_context: {
    id: "opening_context",
    title: "Opening and context",
    model:
      "Give the reader the essential situation or issue—not a generic attention-getter disconnected from the essay.",
    deskFields: ["assignmentQuestion"],
  },
  background_relationship: {
    id: "background_relationship",
    title: "Essential background or text relationship",
    model:
      "Name the texts, speakers/writers, audiences, or relationship the reader needs for this assignment.",
    deskFields: ["assignmentQuestion", "textRelationship"],
  },
  bridge_to_argument: {
    id: "bridge_to_argument",
    title: "Bridge toward the argument",
    model:
      "Narrow from context toward the comparison or claim the essay will make.",
    deskFields: ["thesis", "assignmentQuestion"],
  },
  thesis_destination: {
    id: "thesis_destination",
    title: "Thesis destination",
    model:
      "Arrive at your saved thesis. You may refine phrasing, but do not change its meaning.",
    deskFields: ["thesis"],
  },
});

export const INTRODUCTION_DESK_FIELD_LABELS = Object.freeze({
  assignmentQuestion: "Assignment focus",
  textRelationship: "Texts / relationship",
  thesis: "Your thesis (destination)",
  bodyPurposes: "Body paragraph purposes",
});

export function defaultIntroductionMoveOrder() {
  return [...INTRODUCTION_MOVE_IDS];
}

export function selectIntroductionDeskArtifacts(moveId, deskArtifacts = {}) {
  return sharedSelectDeskArtifactsForMove(
    moveId,
    deskArtifacts,
    INTRODUCTION_MOVE_META,
    INTRODUCTION_DESK_FIELD_LABELS
  );
}

export function assembleIntroductionProse(
  moves = {},
  moveOrder = INTRODUCTION_MOVE_IDS
) {
  return assembleSectionProse(moves, moveOrder);
}

export function normalizeIntroductionMoveState(raw) {
  return normalizeSectionMoveState(raw, {
    moveOrder: defaultIntroductionMoveOrder(),
  });
}

export function resolveAssembledIntroductionProse(moveState) {
  return resolveAssembledSectionProse(moveState, {
    moveOrder: defaultIntroductionMoveOrder(),
  });
}

export function getIntroductionMovesFromDraftMeta(draftMeta) {
  return getSectionMovesFromDraftMeta(draftMeta, SECTION_SLICE_KEYS.INTRO);
}

export function setIntroductionMovesInDraftMeta(draftMeta, moveState) {
  return setSectionMovesInDraftMeta(
    draftMeta,
    SECTION_SLICE_KEYS.INTRO,
    moveState,
    defaultIntroductionMoveOrder()
  );
}

/** Writing-plan / formal-outline move titles (never leak into prose). */
export const INTRODUCTION_OUTLINE_MOVE_TITLES = Object.freeze({
  opening_context: "Opening / context",
  background_relationship: "Background or text relationship",
  bridge_to_argument: "Bridge toward the argument",
  thesis_destination: "Thesis destination",
});
