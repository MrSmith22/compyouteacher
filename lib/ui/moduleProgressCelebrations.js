/**
 * WP-056 — Mid-module progress celebration bridges (Modules 6–9).
 * Pure content helpers: concrete completed work + clear next job.
 */

import {
  getWritingSectionLabel,
  SECTION_TYPES,
} from "../../components/module6/module6StepPresentation.js";
import { MODULE6_DRAFT_STAGE } from "../module6/draftOutlineMapping.js";
import { MODULE7_STEP_TYPES } from "../../components/module7/module7StepPresentation.js";
import { MODULE8_STEP_TYPES } from "../../components/module8/module8StepPresentation.js";
import { getModule7StepKind } from "../module7/module7StepBounds.js";

const GENERIC_ONLY = Object.freeze([
  "great job",
  "nice work",
  "step complete",
  "you did it",
  "keep going",
  "well done",
  "awesome",
  "good job",
]);

const FORBIDDEN_CLAIM =
  /\b(teacher[- ]approved|perfect|graded|grade[ds]?|already submitted|submission is complete)\b/i;

/**
 * Transition audit matrix for Modules 6–9 (WP-056 scope).
 */
export const WP056_TRANSITION_AUDIT_MATRIX = Object.freeze([
  {
    id: "m6-intro-to-first-body-or-conclusion",
    module: 6,
    from: "introduction",
    to: "first body paragraph OR conclusion (no body)",
    trigger: "persistAndNavigateStage succeeds from goNext",
    suppress: "failed save, Back, Edit from review, hydration",
  },
  {
    id: "m6-body-to-next-body",
    module: 6,
    from: "body paragraph N",
    to: "body paragraph N+1",
    trigger: "persistAndNavigateStage succeeds from goNext",
    suppress: "failed save, Back, Edit, hydration",
  },
  {
    id: "m6-final-body-to-conclusion",
    module: 6,
    from: "final body paragraph",
    to: "conclusion",
    trigger: "persistAndNavigateStage succeeds from goNext",
    suppress: "failed save, Back, Edit, hydration",
  },
  {
    id: "m6-conclusion-to-review",
    module: 6,
    from: "conclusion",
    to: "whole-draft review",
    trigger: "persistAndNavigateStage succeeds from goNext",
    suppress: "failed save, Back, Edit, hydration, Finish Draft success page",
  },
  {
    id: "m7-read-aloud-to-intro",
    module: 7,
    from: "read aloud",
    to: "introduction revision",
    trigger: "goNext after recording-and-observation gate passes",
    suppress: "blocked gate, Back, hydration",
  },
  {
    id: "m7-section-to-next",
    module: 7,
    from: "section revision",
    to: "next section OR conclusion OR final review",
    trigger: "goNext forward only",
    suppress: "Back, hydration, Finish Revising success page",
  },
  {
    id: "m8-doc-to-format",
    module: 8,
    from: "create/update Google Doc",
    to: "format",
    trigger: "goNext when docVerifiedThisSession",
    suppress:
      "mismatch, timeout, failure, replacement cancel, Back, Update escape hatch",
  },
  {
    id: "m8-format-to-ready",
    module: 8,
    from: "format checklist",
    to: "ready confidence",
    trigger: "goNext when APA checklist complete",
    suppress: "incomplete checklist, Back, Update escape hatch",
  },
  {
    id: "m9-apa-to-doc",
    module: 9,
    from: "APA learning",
    to: "Google Doc",
    trigger: "fresh persistApaPractice completion",
    suppress: "returning-state hydration / WP-047 resume",
  },
  {
    id: "m9-doc-to-format",
    module: 9,
    from: "verified Google Doc",
    to: "formatting checklist",
    trigger: "verified Continue action",
    suppress: "failed verification, hydration resume",
  },
  {
    id: "m9-format-to-upload",
    module: 9,
    from: "formatting checklist",
    to: "download/check/upload",
    trigger: "Continue when checklist complete",
    suppress: "incomplete checklist, already-submitted hydration, upload failure",
  },
]);

export function isGenericCelebrationOnly(message) {
  const text = String(message || "")
    .trim()
    .toLowerCase()
    .replace(/[.!]+$/g, "");
  if (!text) return true;
  if (GENERIC_ONLY.includes(text)) return true;
  if (/^(great job|nice work|well done|you did it|keep going)[.!]?$/i.test(text)) {
    return true;
  }
  return false;
}

export function celebrationClaimsPrematureApproval(message) {
  return FORBIDDEN_CLAIM.test(String(message || ""));
}

/**
 * Require both completed work and a next job (heuristic: "Next," clause).
 */
export function celebrationNamesCompletedAndNext(message) {
  const text = String(message || "").trim();
  if (text.length < 28) return false;
  if (isGenericCelebrationOnly(text)) return false;
  if (!/\bnext\b/i.test(text)) return false;
  // Must name something accomplished (drafted / finished / prose / verified / complete).
  if (
    !/\b(drafted|finished|prose|verified|complete|prepared|named|checklist)\b/i.test(
      text
    )
  ) {
    return false;
  }
  return true;
}

export function assertCelebrationMessage(message) {
  const text = String(message || "").trim();
  if (!text) return false;
  if (isGenericCelebrationOnly(text)) return false;
  if (celebrationClaimsPrematureApproval(text)) return false;
  if (!celebrationNamesCompletedAndNext(text)) return false;
  return true;
}

function stepKey(step) {
  if (!step) return "";
  if (step.id) return String(step.id);
  if (step.type) return String(step.type);
  return "";
}

/**
 * @param {{ fromStep?: object, toStep?: object }} input
 * @returns {{ fromStep: string, toStep: string, message: string } | null}
 */
export function getModule6ProgressCelebration({ fromStep, toStep } = {}) {
  if (!fromStep || !toStep) return null;
  const fromType = fromStep.type;
  const toType = toStep.type;
  if (fromType === MODULE6_DRAFT_STAGE.REVIEW) return null;
  if (toType === fromType && fromType !== SECTION_TYPES.BODY) return null;

  let message = "";

  if (fromType === SECTION_TYPES.INTRO) {
    if (toType === SECTION_TYPES.BODY) {
      const nextLabel = getWritingSectionLabel(toStep);
      message = `Your introduction is drafted. Next, build ${nextLabel} from the plan already on your desk.`;
    } else if (toType === SECTION_TYPES.CONCLUSION) {
      message =
        "Your introduction is drafted. Next, write your conclusion from the plan already on your desk.";
    }
  } else if (fromType === SECTION_TYPES.BODY) {
    const fromLabel = getWritingSectionLabel(fromStep);
    if (toType === SECTION_TYPES.BODY) {
      const toLabel = getWritingSectionLabel(toStep);
      message = `${fromLabel} now has prose. Next, draft ${toLabel}.`;
    } else if (toType === SECTION_TYPES.CONCLUSION) {
      message = `${fromLabel} now has prose. Next, draft your conclusion.`;
    }
  } else if (
    fromType === SECTION_TYPES.CONCLUSION &&
    toType === MODULE6_DRAFT_STAGE.REVIEW
  ) {
    message =
      "Your conclusion is drafted. Next, review the essay as a whole before finishing the draft.";
  }

  if (!message || !assertCelebrationMessage(message)) return null;
  return {
    fromStep: stepKey(fromStep),
    toStep: stepKey(toStep),
    message,
  };
}

/**
 * Build Module 7 step descriptor keys for bridge data attributes.
 */
export function getModule7StepKey(index, sectionSteps = []) {
  const kind = getModule7StepKind(index, sectionSteps.length);
  if (kind === "read-aloud") return "read-aloud";
  if (kind === "final-review") return "final-review";
  if (kind === "section") {
    const step = sectionSteps[Number(index) - 1];
    return step?.id || `section-${index}`;
  }
  return `step-${index}`;
}

/**
 * @param {{ fromIndex: number, toIndex: number, sectionSteps?: object[] }} input
 */
export function getModule7ProgressCelebration({
  fromIndex,
  toIndex,
  sectionSteps = [],
} = {}) {
  const n = sectionSteps.length;
  if (!(Number(toIndex) > Number(fromIndex))) return null;
  const fromKind = getModule7StepKind(fromIndex, n);
  const toKind = getModule7StepKind(toIndex, n);
  if (fromKind === "invalid" || toKind === "invalid") return null;

  let message = "";

  if (fromKind === "read-aloud" && toKind === "section") {
    message =
      "You finished the read-aloud and named what you noticed. Next, strengthen the introduction for your reader.";
  } else if (fromKind === "section" && toKind === "section") {
    const fromStep = sectionSteps[fromIndex - 1];
    const toStep = sectionSteps[toIndex - 1];
    const fromLabel = getWritingSectionLabel(fromStep).toLowerCase();
    const toLabel = getWritingSectionLabel(toStep);
    message = `You finished this revision pass on the ${fromLabel}. Next, strengthen ${toLabel}.`;
  } else if (fromKind === "section" && toKind === "final-review") {
    message =
      "You finished the conclusion revision pass. Next, review how the full essay communicates.";
  }

  if (!message || !assertCelebrationMessage(message)) return null;
  return {
    fromStep: getModule7StepKey(fromIndex, sectionSteps),
    toStep: getModule7StepKey(toIndex, sectionSteps),
    message,
  };
}

/**
 * @param {{ fromType?: string, toType?: string }} input
 */
export function getModule8ProgressCelebration({ fromType, toType } = {}) {
  let message = "";
  if (
    fromType === MODULE8_STEP_TYPES.CREATE_DOC &&
    toType === MODULE8_STEP_TYPES.FORMAT
  ) {
    message =
      "Your Google Doc now has your verified finished essay. Next, format that paper in APA style.";
  } else if (
    fromType === MODULE8_STEP_TYPES.FORMAT &&
    toType === MODULE8_STEP_TYPES.READY
  ) {
    message =
      "You finished the APA formatting checklist. Next, confirm that the Google Doc is ready for submission.";
  }
  if (!message || !assertCelebrationMessage(message)) return null;
  return {
    fromStep: String(fromType || ""),
    toStep: String(toType || ""),
    message,
  };
}

export const MODULE9_CELEBRATION_STEPS = Object.freeze({
  APA: 1,
  DOC: 2,
  FORMAT: 3,
  UPLOAD: 4,
});

const MODULE9_STEP_KEYS = Object.freeze({
  1: "apa-learning",
  2: "google-doc",
  3: "formatting-checklist",
  4: "download-upload",
});

/**
 * @param {{ fromStep?: number, toStep?: number }} input
 */
export function getModule9ProgressCelebration({ fromStep, toStep } = {}) {
  const from = Number(fromStep);
  const to = Number(toStep);
  if (!(to === from + 1)) return null;

  let message = "";
  if (from === MODULE9_CELEBRATION_STEPS.APA && to === MODULE9_CELEBRATION_STEPS.DOC) {
    message =
      "You finished the APA learning moves. Next, open the Google Doc you prepared.";
  } else if (
    from === MODULE9_CELEBRATION_STEPS.DOC &&
    to === MODULE9_CELEBRATION_STEPS.FORMAT
  ) {
    message =
      "Your Google Doc is verified. Next, use the APA guide to check its formatting.";
  } else if (
    from === MODULE9_CELEBRATION_STEPS.FORMAT &&
    to === MODULE9_CELEBRATION_STEPS.UPLOAD
  ) {
    message =
      "Your formatting checklist is complete. Next, download the PDF, check it, and upload it.";
  }

  if (!message || !assertCelebrationMessage(message)) return null;
  return {
    fromStep: MODULE9_STEP_KEYS[from] || String(from),
    toStep: MODULE9_STEP_KEYS[to] || String(to),
    message,
  };
}

/** Re-export step type constants for tests. */
export {
  MODULE6_DRAFT_STAGE,
  MODULE7_STEP_TYPES,
  MODULE8_STEP_TYPES,
  SECTION_TYPES,
};
