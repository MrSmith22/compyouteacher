/**
 * Module 6 CP-H — read-only success summary from a locked draft.
 * Viewing success must never write draft/prose artifacts.
 */

import {
  buildModule6DraftingSteps,
  expectedProseSectionCount,
  MODULE6_DRAFT_STAGE,
} from "./draftOutlineMapping.js";
import { evaluateSectionReadiness } from "./draftPersistenceHelpers.js";

export const MODULE6_SUCCESS_COMPLETED_MODULE = 6;
export const MODULE6_SUCCESS_NEXT_HREF = "/modules/7";
export const MODULE6_SUCCESS_REVIEW_HREF = "/modules/6";

export const MODULE6_SUCCESS_PRIMARY_CTA =
  "Continue to Module 7 — strengthen your draft";
export const MODULE6_SUCCESS_SECONDARY_REVIEW = "Review Module 6 draft";

export const MODULE6_SUCCESS_ACCOMPLISHMENT =
  "You turned your outline into a first draft—one section at a time. Your introduction, body paragraphs, and conclusion are saved as prose you can strengthen next.";

export const MODULE6_SUCCESS_HANDOFF =
  "In Module 7, you will revise and strengthen that draft—not start over. Your ordered sections and full text stay with you.";

export const MODULE6_SUCCESS_INCOMPLETE =
  "Your Module 6 draft is not finished yet. Return to drafting and finish before continuing.";

export const MODULE6_SUCCESS_READ_FAILED =
  "We could not load your saved draft. Nothing was changed. Try again.";

export const MODULE6_SUCCESS_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1024, 1440],
  mobile: {
    singleColumn: true,
    minActionTargetPx: 44,
    noHorizontalOverflow: true,
  },
  desktop: {
    artifactMapReadable: true,
    sectionPreviewBounded: true,
  },
});

export const MODULE6_SUCCESS_STAGES = Object.freeze({
  CELEBRATE: 1,
  EXPLORE: 2,
  HANDOFF: 3,
});

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function writingSectionLabel(step, index, total) {
  if (!step) {
    if (index === 0) return "Introduction";
    if (index === total - 1) return "Conclusion";
    return `Body Paragraph ${index}`;
  }
  if (step.type === MODULE6_DRAFT_STAGE.INTRO || step.type === "intro") {
    return "Introduction";
  }
  if (step.type === MODULE6_DRAFT_STAGE.CONCLUSION || step.type === "conclusion") {
    return "Conclusion";
  }
  const n =
    typeof step.bodyIndex === "number" && step.bodyIndex >= 0
      ? step.bodyIndex + 1
      : index;
  return `Body Paragraph ${n}`;
}

/**
 * Pure builder — no network, no mutations of draft rows.
 */
export function buildModule6SuccessSummary({
  draftRow = null,
  outline = null,
  readFailed = false,
} = {}) {
  if (readFailed) {
    return {
      incomplete: true,
      readFailed: true,
      incompleteMessage: MODULE6_SUCCESS_READ_FAILED,
      primaryHref: MODULE6_SUCCESS_REVIEW_HREF,
      primaryLabel: "Try again",
      secondaryHref: MODULE6_SUCCESS_REVIEW_HREF,
      secondaryLabel: MODULE6_SUCCESS_SECONDARY_REVIEW,
      writesArtifacts: false,
    };
  }

  const sections = Array.isArray(draftRow?.sections)
    ? draftRow.sections.map((s) => String(s ?? ""))
    : [];
  const locked = draftRow?.locked === true;
  const expected = outline ? expectedProseSectionCount(outline) : sections.length;
  const steps = outline ? buildModule6DraftingSteps(outline) : [];

  if (!locked || sections.length === 0) {
    return {
      incomplete: true,
      readFailed: false,
      incompleteMessage: MODULE6_SUCCESS_INCOMPLETE,
      primaryHref: MODULE6_SUCCESS_REVIEW_HREF,
      primaryLabel: MODULE6_SUCCESS_SECONDARY_REVIEW,
      secondaryHref: MODULE6_SUCCESS_REVIEW_HREF,
      secondaryLabel: MODULE6_SUCCESS_SECONDARY_REVIEW,
      writesArtifacts: false,
    };
  }

  const sectionCards = sections.map((text, index) => {
    const step = steps[index] || {
      type: index === 0 ? "intro" : index === sections.length - 1 ? "conclusion" : "body",
      draftIndex: index,
      bodyIndex: index - 1,
    };
    const label = writingSectionLabel(step, index, sections.length);
    const ready = evaluateSectionReadiness(text).ok;
    const preview = safeText(text);
    return {
      id: `section-${index}`,
      index,
      label,
      ready,
      wordCount: preview ? preview.split(/\s+/).filter(Boolean).length : 0,
      preview: preview.slice(0, 180),
      ariaLabel: `${label}${ready ? ", ready" : ", needs more prose"}`,
      statusLabel: ready ? "Saved" : "Incomplete",
    };
  });

  return {
    incomplete: false,
    readFailed: false,
    writesArtifacts: false,
    accomplishment: MODULE6_SUCCESS_ACCOMPLISHMENT,
    handoff: MODULE6_SUCCESS_HANDOFF,
    primaryHref: MODULE6_SUCCESS_NEXT_HREF,
    primaryLabel: MODULE6_SUCCESS_PRIMARY_CTA,
    secondaryHref: MODULE6_SUCCESS_REVIEW_HREF,
    secondaryLabel: MODULE6_SUCCESS_SECONDARY_REVIEW,
    locked: true,
    sectionCount: sections.length,
    expectedSectionCount: expected,
    sectionCards,
    fullTextPreview: safeText(draftRow?.full_text || sections.join("\n\n")).slice(
      0,
      240
    ),
    layoutContract: MODULE6_SUCCESS_LAYOUT_CONTRACT,
  };
}

export function resolveModule6SuccessAdvance(stage) {
  if (stage === MODULE6_SUCCESS_STAGES.CELEBRATE) {
    return { stage: MODULE6_SUCCESS_STAGES.EXPLORE, exit: false };
  }
  if (stage === MODULE6_SUCCESS_STAGES.EXPLORE) {
    return { stage: MODULE6_SUCCESS_STAGES.HANDOFF, exit: false };
  }
  return { stage: MODULE6_SUCCESS_STAGES.HANDOFF, exit: true };
}

export function resolveModule6SuccessBack(stage) {
  if (stage === MODULE6_SUCCESS_STAGES.HANDOFF) {
    return { stage: MODULE6_SUCCESS_STAGES.EXPLORE };
  }
  if (stage === MODULE6_SUCCESS_STAGES.EXPLORE) {
    return { stage: MODULE6_SUCCESS_STAGES.CELEBRATE };
  }
  return { stage: MODULE6_SUCCESS_STAGES.CELEBRATE };
}

export function getModule6SuccessStageMeta(stage) {
  if (stage === MODULE6_SUCCESS_STAGES.EXPLORE) {
    return {
      eyebrow: "Module 6 · success",
      heading: "What your draft sections hold",
      primaryActionLabel: "See what happens next",
    };
  }
  if (stage === MODULE6_SUCCESS_STAGES.HANDOFF) {
    return {
      eyebrow: "Module 6 · success",
      heading: "Ready to strengthen this draft",
      primaryActionLabel: MODULE6_SUCCESS_PRIMARY_CTA,
    };
  }
  return {
    eyebrow: "Module 6 · success",
    heading: "Module 6 complete",
    primaryActionLabel: "Review what you built",
  };
}
