/**
 * Module 5 CP-H — read-only success summary from a finalized outline.
 * Viewing success must never write outline/prose artifacts.
 */

import { expectedProseSectionCount } from "../module6/draftOutlineMapping.js";

export const MODULE5_SUCCESS_COMPLETED_MODULE = 5;
export const MODULE5_SUCCESS_NEXT_HREF = "/modules/6";
export const MODULE5_SUCCESS_REVIEW_HREF = "/modules/5";

export const MODULE5_SUCCESS_PRIMARY_CTA =
  "Continue to Module 6 — draft your essay";
export const MODULE5_SUCCESS_SECONDARY_REVIEW = "Review Module 5 outline";

export const MODULE5_SUCCESS_ACCOMPLISHMENT =
  "You organized your paragraph plans into a finalized outline with a thesis, ordered body sections, and conclusion notes.";

export const MODULE5_SUCCESS_HANDOFF =
  "Module 6 will draft one section at a time from this outline. Your points, jobs, evidence, and reasoning come with you—you are not starting over.";

export const MODULE5_SUCCESS_INCOMPLETE =
  "Your Module 5 outline is not finalized yet. Finish and finalize the outline before drafting.";

export const MODULE5_SUCCESS_READ_FAILED =
  "We could not load your saved outline. Nothing was changed. Try again.";

export const MODULE5_SUCCESS_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1024, 1440],
  mobile: {
    singleColumn: true,
    minActionTargetPx: 44,
    noHorizontalOverflow: true,
  },
  desktop: {
    artifactMapReadable: true,
    teacherRailOptional: true,
  },
});

export const MODULE5_SUCCESS_STAGES = Object.freeze({
  CELEBRATE: 1,
  EXPLORE: 2,
  HANDOFF: 3,
});

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Pure builder — no network, no mutations.
 */
export function buildModule5SuccessSummary({
  outlineRow = null,
  readFailed = false,
} = {}) {
  if (readFailed) {
    return {
      incomplete: true,
      readFailed: true,
      incompleteMessage: MODULE5_SUCCESS_READ_FAILED,
      primaryHref: MODULE5_SUCCESS_REVIEW_HREF,
      primaryLabel: "Try again",
      secondaryHref: MODULE5_SUCCESS_REVIEW_HREF,
      secondaryLabel: MODULE5_SUCCESS_SECONDARY_REVIEW,
      writesArtifacts: false,
    };
  }

  const outline = outlineRow?.outline || null;
  const finalized = outlineRow?.finalized === true;

  if (!outline || !finalized) {
    return {
      incomplete: true,
      readFailed: false,
      incompleteMessage: MODULE5_SUCCESS_INCOMPLETE,
      primaryHref: MODULE5_SUCCESS_REVIEW_HREF,
      primaryLabel: MODULE5_SUCCESS_SECONDARY_REVIEW,
      secondaryHref: MODULE5_SUCCESS_REVIEW_HREF,
      secondaryLabel: MODULE5_SUCCESS_SECONDARY_REVIEW,
      writesArtifacts: false,
    };
  }

  const body = Array.isArray(outline.body) ? outline.body : [];
  const bodyCards = body.map((card, index) => ({
    id: `body-${index}`,
    order: typeof card?.order === "number" ? card.order : index,
    title:
      safeText(card?.point) ||
      safeText(card?.bucket) ||
      `Body paragraph ${index + 1}`,
    job: safeText(card?.job) || null,
    jobId: safeText(card?.jobId) || null,
    evidenceCount: Array.isArray(card?.evidence) ? card.evidence.length : 0,
    hasReasoning: Boolean(safeText(card?.reasoning)),
    ariaLabel: `Body paragraph ${index + 1}: ${
      safeText(card?.point) || safeText(card?.bucket) || "untitled"
    }`,
  }));

  const conclusion = outline.conclusion || {};
  const thesis = safeText(outline.thesis);

  return {
    incomplete: false,
    readFailed: false,
    writesArtifacts: false,
    accomplishment: MODULE5_SUCCESS_ACCOMPLISHMENT,
    handoff: MODULE5_SUCCESS_HANDOFF,
    primaryHref: MODULE5_SUCCESS_NEXT_HREF,
    primaryLabel: MODULE5_SUCCESS_PRIMARY_CTA,
    secondaryHref: MODULE5_SUCCESS_REVIEW_HREF,
    secondaryLabel: MODULE5_SUCCESS_SECONDARY_REVIEW,
    thesis: {
      available: Boolean(thesis),
      text: thesis || "Your thesis could not be displayed here.",
    },
    bodyCards,
    conclusion: {
      summary: safeText(conclusion.summary),
      finalThought: safeText(conclusion.finalThought),
      available: Boolean(
        safeText(conclusion.summary) || safeText(conclusion.finalThought)
      ),
    },
    expectedDraftSections: expectedProseSectionCount(outline),
    layoutContract: MODULE5_SUCCESS_LAYOUT_CONTRACT,
  };
}

export function resolveModule5SuccessAdvance(stage) {
  if (stage === MODULE5_SUCCESS_STAGES.CELEBRATE) {
    return { stage: MODULE5_SUCCESS_STAGES.EXPLORE, exit: false };
  }
  if (stage === MODULE5_SUCCESS_STAGES.EXPLORE) {
    return { stage: MODULE5_SUCCESS_STAGES.HANDOFF, exit: false };
  }
  return { stage: MODULE5_SUCCESS_STAGES.HANDOFF, exit: true };
}

export function resolveModule5SuccessBack(stage) {
  if (stage === MODULE5_SUCCESS_STAGES.HANDOFF) {
    return { stage: MODULE5_SUCCESS_STAGES.EXPLORE };
  }
  if (stage === MODULE5_SUCCESS_STAGES.EXPLORE) {
    return { stage: MODULE5_SUCCESS_STAGES.CELEBRATE };
  }
  return { stage: MODULE5_SUCCESS_STAGES.CELEBRATE };
}

export function getModule5SuccessStageMeta(stage) {
  if (stage === MODULE5_SUCCESS_STAGES.EXPLORE) {
    return {
      eyebrow: "Module 5 · success",
      heading: "What your outline carries forward",
      primaryActionLabel: "See what happens next",
    };
  }
  if (stage === MODULE5_SUCCESS_STAGES.HANDOFF) {
    return {
      eyebrow: "Module 5 · success",
      heading: "Ready to draft from this outline",
      primaryActionLabel: MODULE5_SUCCESS_PRIMARY_CTA,
    };
  }
  return {
    eyebrow: "Module 5 · success",
    heading: "Module 5 complete",
    primaryActionLabel: "Review what you built",
  };
}
