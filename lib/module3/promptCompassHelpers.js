/**
 * Pure helpers for the Module 3 prompt compass.
 *
 * The compass answers: "What must my final writing accomplish?"
 * (The artifact chain answers: "How has my thinking developed?" — different job.)
 *
 * The full assignment wording always comes from the supplied assignmentPrompt
 * (ASSIGNMENT.task.prompt). No second full prompt is hard-coded here.
 */

export const PROMPT_COMPASS_HEADING = "What your essay must do";

export const PROMPT_COMPASS_DISCLOSURE_LABEL = "See the full assignment.";

export const PROMPT_COMPASS_FOCUS_MARKER = "Focus right now";

export const PROMPT_COMPASS_QUESTIONS = [
  {
    id: "appeal",
    text: "Name the appeal. Is King using ethos (trust), pathos (feeling), or logos (reasoning)?",
  },
  {
    id: "compare",
    text: "Compare the works. What is similar or different between the speech and the letter?",
  },
  {
    id: "why",
    text: "Explain why. How do the audience and purpose shape King’s choices?",
  },
  {
    id: "prove",
    text: "Prove it. Which quotations from both works back up your answer?",
  },
];

/** REVIEW emphasizes the comparison question. */
export const REVIEW_COMPASS_FOCUS_ID = "compare";

export const REVIEW_COMPASS_FRAMING_LINE =
  "Right now, look for quotations that could help you find an important similarity or difference between the two works.";

/** PATTERNS also emphasizes the comparison question. */
export const PATTERNS_COMPASS_FOCUS_ID = "compare";

export const PATTERNS_COMPASS_FRAMING_LINE =
  "Right now, look inside your chosen group and notice an important similarity, difference, or relationship between King’s choices in the two works.";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Compass model for rendering. Pure; no completion state, no gate behavior —
 * questions are requirements of the final essay, not progress items.
 */
export function getPromptCompassModel({
  assignmentPrompt = "",
  focusQuestionId = "",
} = {}) {
  const fullPrompt = typeof assignmentPrompt === "string" ? assignmentPrompt : "";

  return {
    heading: PROMPT_COMPASS_HEADING,
    disclosureLabel: PROMPT_COMPASS_DISCLOSURE_LABEL,
    focusMarker: PROMPT_COMPASS_FOCUS_MARKER,
    fullPrompt,
    hasFullPrompt: Boolean(safeText(fullPrompt)),
    questions: PROMPT_COMPASS_QUESTIONS.map((question) => ({
      ...question,
      isFocus: question.id === focusQuestionId,
    })),
  };
}
