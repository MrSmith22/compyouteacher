/**
 * WP-081 / WP-083 — Development gate for section vertical-slice prototypes.
 * Production builds never enable these paths.
 */

/**
 * @returns {boolean}
 */
export function isBodyParagraphVerticalSliceEnabled() {
  return process.env.NODE_ENV === "development";
}

/**
 * Same development gate as WP-081; shared for Introduction / Conclusion (WP-082).
 * @returns {boolean}
 */
export function isSectionVerticalSliceEnabled() {
  return process.env.NODE_ENV === "development";
}

/**
 * Whole-essay review + teacher word-count inspection (WP-084).
 * @returns {boolean}
 */
export function isWholeEssayReviewEnabled() {
  return process.env.NODE_ENV === "development";
}

/**
 * Apply the body-paragraph slice UX to every required body paragraph in development.
 * Essay-order Body Paragraph N uses bodyIndex >= 0; production remains gated off.
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
 * Apply Introduction / Conclusion slice UX when the development gate is on.
 * Identity uses step.type — never draftIndex alone.
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
 * Any vertical-slice step currently gated for development (all bodies, intro, or conclusion).
 * @param {{ bodyIndex?: number | null, type?: string }} step
 * @returns {boolean}
 */
export function isVerticalSliceStep(step) {
  return (
    isBodyParagraphVerticalSliceStep(step) ||
    isIntroConclusionVerticalSliceStep(step)
  );
}
