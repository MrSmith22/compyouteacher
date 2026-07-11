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
    return "Write one clear idea about what this pattern might mean.";
  }

  if (!phase.whyReady) {
    return "Explain why this idea feels worth exploring.";
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

export const IDEA_LEADING_QUESTIONS = [
  "What might King want the audience to understand?",
  "Why might King return to this idea?",
  "What larger message could connect these quotations?",
  "What do these quotations suggest about King’s argument?",
  "What might a reader learn when these quotations are considered together?",
];

export const IDEA_SENTENCE_STARTERS = [
  "These quotations suggest that…",
  "King may be showing that…",
  "This pattern could mean that…",
  "Together, these quotations reveal…",
  "King wants the audience to understand that…",
];

export const IDEA_WHY_LEADING_QUESTIONS = [
  "What could this idea help you explain?",
  "Why might this matter to King’s audience?",
  "How could this idea help answer the assignment?",
  "What could you prove later if this idea is supported?",
];
