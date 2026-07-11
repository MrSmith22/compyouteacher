/**
 * Pure helpers for Module 3 explore_idea (pattern → idea interpretation).
 * Presentation/progressive-disclosure only — persistence shape stays statement + whyMatters.
 *
 * Convention: complete sentence/question headlines use ending punctuation;
 * short UI labels (Start here, Need Help) do not.
 */

export const IDEA_STATEMENT_MINIMUM = 15;
export const IDEA_WHY_MINIMUM = 15;

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function isIdeaStatementReady(
  statement = "",
  minimum = IDEA_STATEMENT_MINIMUM
) {
  return safeText(statement).length >= minimum;
}

export function isIdeaWhyReady(whyMatters = "", minimum = IDEA_WHY_MINIMUM) {
  return safeText(whyMatters).length >= minimum;
}

export function getExploreIdeaPhase({
  statement = "",
  whyMatters = "",
  statementMinimum = IDEA_STATEMENT_MINIMUM,
  whyMinimum = IDEA_WHY_MINIMUM,
} = {}) {
  const statementReady = isIdeaStatementReady(statement, statementMinimum);
  const whyReady = isIdeaWhyReady(whyMatters, whyMinimum);
  const canContinue = statementReady && whyReady;

  let primaryPhase = "interpret";
  if (canContinue) {
    primaryPhase = "ready";
  } else if (statementReady) {
    primaryPhase = "why";
  }

  return {
    primaryPhase,
    showWhyMatters: statementReady,
    showReadyFeedback: canContinue,
    statementReady,
    whyReady,
    canContinue,
    statementMinimum,
    whyMinimum,
  };
}

/** Explicit blocked-state messages: always say what to write next. */
export const IDEA_STATEMENT_BLOCKED_MESSAGE =
  "Write one clear idea about what this pattern might mean. That unlocks the next question: why this idea is worth exploring.";

export const IDEA_WHY_BLOCKED_MESSAGE =
  "Explain why this idea feels worth exploring. Then you can keep going.";

/** Explicit readiness message shown when both fields meet the requirements. */
export const IDEA_READY_MESSAGE =
  "Your developing idea is ready to test against the quotations.";

export function getExploreIdeaReadyMessage() {
  return IDEA_READY_MESSAGE;
}

export function getExploreIdeaContinueHint({
  statement = "",
  whyMatters = "",
  statementMinimum = IDEA_STATEMENT_MINIMUM,
  whyMinimum = IDEA_WHY_MINIMUM,
} = {}) {
  const phase = getExploreIdeaPhase({
    statement,
    whyMatters,
    statementMinimum,
    whyMinimum,
  });

  if (!phase.statementReady) {
    return IDEA_STATEMENT_BLOCKED_MESSAGE;
  }

  if (!phase.whyReady) {
    return IDEA_WHY_BLOCKED_MESSAGE;
  }

  return "";
}

export function canContinueFromExploreIdea({
  statement = "",
  whyMatters = "",
  statementMinimum = IDEA_STATEMENT_MINIMUM,
  whyMinimum = IDEA_WHY_MINIMUM,
} = {}) {
  return getExploreIdeaPhase({
    statement,
    whyMatters,
    statementMinimum,
    whyMinimum,
  }).canContinue;
}

/**
 * Comparison-oriented leading questions. Thinking lenses, not a formula —
 * they help the student look; they never write the answer.
 */
export const IDEA_LEADING_QUESTIONS = [
  "What might this similarity show about what King wants both audiences to understand or do?",
  "If the quotations differ, what might explain that difference—the audience, the purpose, the form, or something else?",
  "Why might King use the same appeal differently in the speech and the letter? (An appeal is ethos—trust, pathos—feeling, or logos—reasoning.)",
  "Why might King use different appeals to accomplish a related purpose?",
  "What larger idea about King’s rhetorical choices begins to emerge when you read the quotations together?",
];

/** Optional ways to begin — never auto-filled, never required answer shapes. */
export const IDEA_SENTENCE_STARTERS = [
  "This pattern might show that King…",
  "In both works, King seems to…",
  "The difference between these quotations might matter because…",
  "King may change his approach because the audiences…",
  "Even though the situations are different, both quotations…",
];

export const IDEA_STARTERS_LABEL =
  "Ways to begin (optional — your idea does not have to match these shapes)";

/** Why-matters coaching connects significance to the assignment. */
export const IDEA_WHY_LEADING_QUESTIONS = [
  "Could this idea help explain a similarity or difference between the works?",
  "Could it help explain why King adapts an appeal to an audience or purpose?",
  "Do both quotations give you enough to keep investigating this idea?",
  "Could this become a point your essay might eventually defend?",
];

export const IDEA_WHY_NOT_THESIS_NOTE =
  "You are not committing to a final thesis yet. You are deciding whether this idea deserves more investigation.";
