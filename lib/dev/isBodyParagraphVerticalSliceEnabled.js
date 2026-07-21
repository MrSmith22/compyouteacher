/**
 * WP-081–085 — Instructional writing-spine gates.
 * Authoritative mode comes from writingSpineRollout (assignment settings + ops override).
 * Developer tooling stays NODE_ENV-gated elsewhere — not here.
 */

import {
  getEffectiveWritingSpineMode,
} from "../assignments/writingSpineModeCache.js";
import { isRebuiltWritingSpine } from "../assignments/writingSpineRollout.js";

/**
 * @returns {boolean}
 */
export function isBodyParagraphVerticalSliceEnabled() {
  return isRebuiltWritingSpine(getEffectiveWritingSpineMode());
}

/**
 * Same rollout as body paragraphs (Introduction / Conclusion).
 * @returns {boolean}
 */
export function isSectionVerticalSliceEnabled() {
  return isRebuiltWritingSpine(getEffectiveWritingSpineMode());
}

/**
 * Whole-essay review + teacher word-count inspection.
 * @returns {boolean}
 */
export function isWholeEssayReviewEnabled() {
  return isRebuiltWritingSpine(getEffectiveWritingSpineMode());
}

/**
 * Apply the body-paragraph slice UX to every required body paragraph.
 * @param {{ bodyIndex?: number | null, type?: string }} step
 * @returns {boolean}
 */
export function isBodyParagraphVerticalSliceStep(step) {
  if (!isBodyParagraphVerticalSliceEnabled()) return false;
  if (!step) return false;
  const type = String(step.type || "").toLowerCase();
  if (type !== "body") return false;
  return typeof step.bodyIndex === "number" && step.bodyIndex >= 0;
}

/**
 * Apply Introduction / Conclusion slice UX when rebuilt mode is on.
 * @param {{ type?: string }} step
 * @returns {boolean}
 */
export function isIntroConclusionVerticalSliceStep(step) {
  if (!isSectionVerticalSliceEnabled()) return false;
  if (!step) return false;
  const type = String(step.type || "").toLowerCase();
  return type === "intro" || type === "introduction" || type === "conclusion";
}

/**
 * Any vertical-slice step for the rebuilt spine.
 * @param {{ bodyIndex?: number | null, type?: string }} step
 * @returns {boolean}
 */
export function isVerticalSliceStep(step) {
  return (
    isBodyParagraphVerticalSliceStep(step) ||
    isIntroConclusionVerticalSliceStep(step)
  );
}
