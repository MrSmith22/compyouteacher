/**
 * WP-055 — Teaching-feedback helpers (content-agnostic).
 * Distinguishes instructional feedback from binary-only correctness labels.
 */

const BINARY_ONLY = Object.freeze([
  "correct",
  "incorrect",
  "right",
  "wrong",
  "yes",
  "no",
  "try again",
  "good job",
  "the answer is incorrect",
  "review the lesson",
]);

export const TEACHING_FEEDBACK_HEADINGS = Object.freeze({
  correct: "That works.",
  incorrect: "Let’s look closer.",
});

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isBinaryOnlyFeedback(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[.!]+$/g, "");
  if (!text) return true;
  if (BINARY_ONLY.includes(text)) return true;
  // Short binary labels with no additional sentence.
  if (/^(correct|incorrect|right|wrong|yes|no)[.!]?$/i.test(String(value || "").trim())) {
    return true;
  }
  return false;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function hasTeachingExplanation(value) {
  const text = String(value || "").trim();
  if (text.length < 24) return false;
  if (isBinaryOnlyFeedback(text)) return false;
  // Reject binary prefix with no meaningful remainder.
  const withoutPrefix = text
    .replace(/^(correct|incorrect|right|wrong)[.!:\-\s]*/i, "")
    .trim();
  if (withoutPrefix.length < 20) return false;
  return true;
}

/**
 * @param {{ correct?: boolean, explanation?: string }} input
 */
export function getTeachingFeedbackPresentation({
  correct = false,
  explanation = "",
} = {}) {
  const ok = Boolean(correct);
  return {
    correct: ok,
    heading: ok
      ? TEACHING_FEEDBACK_HEADINGS.correct
      : TEACHING_FEEDBACK_HEADINGS.incorrect,
    explanation: String(explanation || "").trim(),
  };
}
