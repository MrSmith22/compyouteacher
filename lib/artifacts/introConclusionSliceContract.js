/**
 * WP-082 — Introduction and Conclusion slice contracts.
 * Builds normalized views from existing M5/M6/M7 artifacts.
 * Section identity uses step.type (intro|conclusion), not draftIndex alone.
 */

import {
  getIntroductionLabel,
  getConclusionLabel,
} from "../essaySectionLabels.js";
import {
  defaultIntroductionMoveOrder,
  assembleIntroductionProse,
  normalizeIntroductionMoveState,
  getIntroductionMovesFromDraftMeta,
  INTRODUCTION_OUTLINE_MOVE_TITLES,
} from "../module6/introductionMoves.js";
import {
  defaultConclusionMoveOrder,
  assembleConclusionProse,
  normalizeConclusionMoveState,
  getConclusionMovesFromDraftMeta,
  CONCLUSION_OUTLINE_MOVE_TITLES,
} from "../module6/conclusionMoves.js";
import {
  diagnoseIntroductionHealth,
  pickHighestLeverageIntroductionSignal,
} from "./introductionHealth.js";
import {
  diagnoseConclusionHealth,
  pickHighestLeverageConclusionSignal,
} from "./conclusionHealth.js";
import { getIntroductionRevisionFromDraftMeta } from "../module7/introductionDiagnostics.js";
import { getConclusionRevisionFromDraftMeta } from "../module7/conclusionDiagnostics.js";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Compact body-paragraph purposes for conclusion desk / outline (not full evidence).
 */
export function compactBodyPurposes(outlineBody = []) {
  if (!Array.isArray(outlineBody)) return [];
  return outlineBody
    .map((card, index) => {
      const purpose = safeText(card?.point || card?.bucket || card?.job);
      if (!purpose) return "";
      return `Body Paragraph ${index + 1}: ${purpose}`;
    })
    .filter(Boolean);
}

export function buildIntroductionSlice({
  thesis = "",
  assignmentQuestion = "",
  textRelationship = "",
  assembledProse = "",
  draftMeta = null,
  upstreamStale = false,
} = {}) {
  const moveOrder = defaultIntroductionMoveOrder();
  const moveStateRaw = getIntroductionMovesFromDraftMeta(draftMeta);
  const moveState = normalizeIntroductionMoveState(moveStateRaw);
  const proseFromMoves = assembleIntroductionProse(moveState.moves, moveOrder);
  const prose = safeText(assembledProse) || proseFromMoves;

  const health = diagnoseIntroductionHealth({
    assembledProse: prose,
    thesis,
    assignmentQuestion,
    upstreamStale,
  });
  const revision = getIntroductionRevisionFromDraftMeta(draftMeta) || {};
  const topHealth = pickHighestLeverageIntroductionSignal(health);

  return {
    sectionType: "intro",
    label: getIntroductionLabel(),
    thesis: safeText(thesis),
    assignmentQuestion: safeText(assignmentQuestion),
    textRelationship: safeText(textRelationship),
    moveOrder,
    moveState,
    assembledProse: prose,
    health,
    revisionTarget: topHealth?.id || null,
    revisionBefore: typeof revision.before === "string" ? revision.before : "",
    revisionAfter: typeof revision.after === "string" ? revision.after : "",
    clearerConfirmed: Boolean(revision.clearerConfirmed),
  };
}

export function buildConclusionSlice({
  thesis = "",
  outline = null,
  assembledProse = "",
  draftMeta = null,
  upstreamStale = false,
} = {}) {
  const moveOrder = defaultConclusionMoveOrder();
  const moveStateRaw = getConclusionMovesFromDraftMeta(draftMeta);
  const moveState = normalizeConclusionMoveState(moveStateRaw);
  const proseFromMoves = assembleConclusionProse(moveState.moves, moveOrder);
  const prose = safeText(assembledProse) || proseFromMoves;
  const bodyPurposes = compactBodyPurposes(outline?.body);
  const conclusionPlan = outline?.conclusion || {};

  const health = diagnoseConclusionHealth({
    assembledProse: prose,
    thesis,
    bodyPurposes,
    upstreamStale,
  });
  const revision = getConclusionRevisionFromDraftMeta(draftMeta) || {};
  const topHealth = pickHighestLeverageConclusionSignal(health);

  return {
    sectionType: "conclusion",
    label: getConclusionLabel(),
    thesis: safeText(thesis),
    bodyPurposes,
    conclusionSummary: safeText(conclusionPlan.summary),
    conclusionFinalThought: safeText(conclusionPlan.finalThought),
    moveOrder,
    moveState,
    assembledProse: prose,
    health,
    revisionTarget: topHealth?.id || null,
    revisionBefore: typeof revision.before === "string" ? revision.before : "",
    revisionAfter: typeof revision.after === "string" ? revision.after : "",
    clearerConfirmed: Boolean(revision.clearerConfirmed),
  };
}

export function formatIntroductionWritingPlanSummary(slice) {
  return {
    label: slice.label,
    purpose: "Open the essay and arrive at the thesis",
    moves: (slice.moveOrder || []).map((id) => ({
      id,
      title: INTRODUCTION_OUTLINE_MOVE_TITLES[id] || id,
    })),
    thesis: slice.thesis,
  };
}

export function formatIntroductionFormalOutlineLines(slice, romanNumeral = "I") {
  const lines = [`${romanNumeral}. ${slice.label}`];
  for (const moveId of slice.moveOrder || []) {
    lines.push(`   - ${INTRODUCTION_OUTLINE_MOVE_TITLES[moveId] || moveId}`);
  }
  if (slice.thesis) {
    lines.push(`   - Thesis: ${slice.thesis}`);
  }
  return lines;
}

export function formatConclusionWritingPlanSummary(slice) {
  return {
    label: slice.label,
    purpose: "Return to the argument and end with purpose",
    moves: (slice.moveOrder || []).map((id) => ({
      id,
      title: CONCLUSION_OUTLINE_MOVE_TITLES[id] || id,
    })),
    summary: slice.conclusionSummary,
    finalThought: slice.conclusionFinalThought,
  };
}

export function formatConclusionFormalOutlineLines(slice, romanNumeral = "V") {
  const lines = [`${romanNumeral}. ${slice.label}`];
  for (const moveId of slice.moveOrder || []) {
    lines.push(`   - ${CONCLUSION_OUTLINE_MOVE_TITLES[moveId] || moveId}`);
  }
  return lines;
}
