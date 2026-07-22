/**
 * WP-089 — Carry-forward helper for the student’s saved prompt interpretation.
 * Prefer student wording; assignment-owned fallback only when missing.
 * Never overwrites or “improves” the paraphrase.
 */

/** Assignment-owned fallback when the student has not saved a paraphrase yet. */
export const ASSIGNMENT_INTERPRETATION_FALLBACK =
  "Compare how King uses rhetorical appeals for different audiences and purposes.";

export const ASSIGNMENT_INTERPRETATION_LABEL = "What this assignment asks";

/**
 * @param {{
 *   studentParaphrase?: string|null,
 *   assignmentFallback?: string|null,
 * }} [input]
 */
export function resolveAssignmentInterpretationCarryForward(input = {}) {
  const student = String(input.studentParaphrase || "").trim();
  const fallback = String(
    input.assignmentFallback || ASSIGNMENT_INTERPRETATION_FALLBACK
  ).trim();

  if (student) {
    return {
      label: ASSIGNMENT_INTERPRETATION_LABEL,
      text: student,
      source: "student_paraphrase",
      isFallback: false,
    };
  }

  return {
    label: ASSIGNMENT_INTERPRETATION_LABEL,
    text: fallback,
    source: "assignment_fallback",
    isFallback: true,
  };
}

/**
 * Desk vs shelf placement for the carry-forward reference.
 * @param {"shelf"|"desk"} mode
 */
export function assignmentInterpretationPlacement(mode) {
  return mode === "desk" ? "desk" : "shelf";
}
