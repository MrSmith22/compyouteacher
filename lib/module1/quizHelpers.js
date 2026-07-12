/**
 * Module 1 vocabulary quiz sequencing helpers (CP-A).
 * Result storage shape stays { score, total, answers[] } with optional quiz_version meta.
 */

import { VOCABULARY_TERMS } from "./step2MicrostageHelpers.js";

export const QUIZ_ITEM_COUNT = 10;

/** Current on-screen quiz content version (v1 was video-dependent). */
export const QUIZ_CONTENT_VERSION = 2;

/**
 * Quiz v2 — every required question is answerable from on-screen vocabulary instruction.
 * No question depends on optional video or hidden media.
 */
export const MODULE1_QUIZ_V2 = Object.freeze([
  {
    id: "rhetoric_definition",
    concept: "rhetoric",
    question: "What does the term rhetoric mean?",
    options: [
      "The ability to speak loudly and clearly",
      "The art of effective and persuasive writing and speaking",
      "The process of writing fictional stories",
      "The study of ancient Greek literature only",
    ],
    answer: "The art of effective and persuasive writing and speaking",
    requiresOptionalVideo: false,
  },
  {
    id: "ethos_definition",
    concept: "ethos",
    question: "Which of the following best describes ethos?",
    options: [
      "Making the audience laugh to build interest",
      "Appealing to the audience’s emotions",
      "Presenting strong data and facts",
      "Establishing credibility and trustworthiness",
    ],
    answer: "Establishing credibility and trustworthiness",
    requiresOptionalVideo: false,
  },
  {
    id: "ethos_recognition",
    concept: "ethos",
    question:
      "A chef on a cooking show who wears a professional uniform and describes their years of experience is using which rhetorical strategy?",
    options: ["Pathos", "Logos", "Ethos", "Satire"],
    answer: "Ethos",
    requiresOptionalVideo: false,
  },
  {
    id: "pathos_definition",
    concept: "pathos",
    question: "Which of these is an example of pathos?",
    options: [
      "Explaining how a law works in logical steps",
      "Sharing a touching story about a sick puppy to encourage donations",
      "Listing your degrees and awards in a speech",
      "Quoting historical data to support your point",
    ],
    answer:
      "Sharing a touching story about a sick puppy to encourage donations",
    requiresOptionalVideo: false,
  },
  {
    id: "pathos_application",
    concept: "pathos",
    question: "Why is pathos often effective in persuasion?",
    options: [
      "It is based only on historical facts",
      "It appeals only to the audience’s trust in credentials",
      "It connects to emotion and can create urgency",
      "It shows the speaker’s degrees and awards",
    ],
    answer: "It connects to emotion and can create urgency",
    requiresOptionalVideo: false,
  },
  {
    id: "logos_definition",
    concept: "logos",
    question:
      "What does logos focus on when trying to persuade an audience?",
    options: [
      "Trust and reputation",
      "Humor and sarcasm",
      "Clear evidence and logical reasoning",
      "Feelings and empathy",
    ],
    answer: "Clear evidence and logical reasoning",
    requiresOptionalVideo: false,
  },
  {
    id: "logos_recognition",
    concept: "logos",
    question:
      "A dentist shows patients a study on sugar and tooth decay. This is an example of which rhetorical strategy?",
    options: ["Logos", "Ethos", "Pathos", "Irony"],
    answer: "Logos",
    requiresOptionalVideo: false,
  },
  {
    id: "audience_definition",
    concept: "audience",
    question: "In this assignment, what does audience mean?",
    options: [
      "Anyone who has ever read a book",
      "The people a writer or speaker is trying to reach and persuade",
      "Only the teacher who grades the essay",
      "The dictionary definition of every word in the text",
    ],
    answer:
      "The people a writer or speaker is trying to reach and persuade",
    requiresOptionalVideo: false,
  },
  {
    id: "purpose_definition",
    concept: "purpose",
    question: "What does purpose mean when analyzing a text?",
    options: [
      "The length of the text",
      "What the writer or speaker wants the audience to understand, believe, or do",
      "The publisher’s print schedule",
      "Whether the text uses long or short sentences",
    ],
    answer:
      "What the writer or speaker wants the audience to understand, believe, or do",
    requiresOptionalVideo: false,
  },
  {
    id: "king_application",
    concept: "rhetoric",
    question:
      "When you analyze King’s speech and letter later, these vocabulary terms help you explain:",
    options: [
      "Only the dates each text was written",
      "How King uses rhetorical choices to persuade different audiences for different purposes",
      "How to memorize the texts word for word",
      "Whether the optional video was interesting",
    ],
    answer:
      "How King uses rhetorical choices to persuade different audiences for different purposes",
    requiresOptionalVideo: false,
  },
]);

/** @deprecated Video-dependent v1 kept only for migration/readability of legacy results */
export const MODULE1_QUIZ_V1_LEGACY_MARKERS = Object.freeze([
  "main purpose of the video",
  "in the video",
  "according to the video",
  "based on the video",
]);

export function getActiveQuiz() {
  return MODULE1_QUIZ_V2;
}

/** @param {unknown[]} answers @param {number} length */
export function normalizeQuizAnswers(answers, length = QUIZ_ITEM_COUNT) {
  const source = Array.isArray(answers) ? answers : [];
  return Array.from({ length }, (_, i) => {
    const value = source[i];
    return typeof value === "string" ? value : value == null ? "" : String(value);
  });
}

/** @param {string[]} answers */
export function allQuizItemsAnswered(answers) {
  const normalized = normalizeQuizAnswers(answers);
  return normalized.every((a) => a.trim().length > 0);
}

/** @param {string[]} answers @param {number} index */
export function canAdvanceQuizItem(answers, index) {
  const normalized = normalizeQuizAnswers(answers);
  const value = normalized[index] ?? "";
  return value.trim().length > 0;
}

/** @param {string[]} answers */
export function getResumeQuizIndex(answers) {
  const normalized = normalizeQuizAnswers(answers);
  const firstBlank = normalized.findIndex((a) => !a.trim());
  if (firstBlank === -1) return Math.max(0, normalized.length - 1);
  return firstBlank;
}

/** @param {number} index @param {"back"|"next"} direction @param {number} length */
export function advanceQuizIndex(index, direction, length = QUIZ_ITEM_COUNT) {
  const max = Math.max(0, length - 1);
  const current = Math.max(0, Math.min(max, Number(index) || 0));
  if (direction === "back") return Math.max(0, current - 1);
  if (direction === "next") return Math.min(max, current + 1);
  return current;
}

/**
 * Block final submit until every item has an answer.
 * @param {string[]} answers
 * @param {{ quizSubmitted?: boolean }} [opts]
 */
export function canSubmitQuiz(answers, opts = {}) {
  if (opts.quizSubmitted) return false;
  return allQuizItemsAnswered(answers);
}

/**
 * Legacy completed results hydrate into the same answers array shape.
 * Remains readable even when quiz content version has changed.
 * @param {unknown} result
 */
export function hydrateLegacyQuizResult(result) {
  const row = result && typeof result === "object" ? result : {};
  const answers = normalizeQuizAnswers(row.answers ?? row.raw_answers);
  const score =
    typeof row.score === "number"
      ? row.score
      : answers.filter(Boolean).length
        ? null
        : 0;
  const total =
    typeof row.total === "number" ? row.total : QUIZ_ITEM_COUNT;
  const version =
    typeof row.quiz_version === "number"
      ? row.quiz_version
      : typeof row.quizVersion === "number"
        ? row.quizVersion
        : 1;
  return {
    answers,
    score,
    total,
    quizVersion: version,
    completed: Boolean(
      row.completed ?? (Array.isArray(row.answers) && row.score != null)
    ),
  };
}

/**
 * Version compatibility for applying saved answers to the active quiz UI.
 *
 * Rules:
 * - Completed legacy (v1) results remain readable as historical scores.
 * - Partial legacy (v1) drafts must NOT map onto v2 questions → restart quiz.
 * - Same-version partial drafts resume at first unanswered item.
 *
 * @param {{
 *   saved?: unknown,
 *   draftAnswers?: string[],
 *   draftVersion?: number | null,
 *   currentVersion?: number,
 * }} input
 */
export function resolveQuizVersionMigration(input = {}) {
  const currentVersion = input.currentVersion ?? QUIZ_CONTENT_VERSION;
  const saved = hydrateLegacyQuizResult(input.saved || {});
  const draftVersion =
    input.draftVersion != null ? Number(input.draftVersion) : null;

  if (saved.completed) {
    return {
      rule: "legacy_completion_readable",
      applyAnswersToActiveQuiz: false,
      restartQuiz: false,
      readableResult: saved,
      answers: normalizeQuizAnswers([], QUIZ_ITEM_COUNT),
      resumeIndex: 0,
      quizVersion: currentVersion,
    };
  }

  if (draftVersion != null && draftVersion !== currentVersion) {
    return {
      rule: "partial_legacy_quiz_restarts",
      applyAnswersToActiveQuiz: false,
      restartQuiz: true,
      readableResult: null,
      answers: normalizeQuizAnswers([], QUIZ_ITEM_COUNT),
      resumeIndex: 0,
      quizVersion: currentVersion,
    };
  }

  const draftAnswers = normalizeQuizAnswers(
    input.draftAnswers ?? [],
    QUIZ_ITEM_COUNT
  );
  const hasPartial = draftAnswers.some((a) => a.trim());
  if (hasPartial) {
    return {
      rule: "same_version_resume",
      applyAnswersToActiveQuiz: true,
      restartQuiz: false,
      readableResult: null,
      answers: draftAnswers,
      resumeIndex: getResumeQuizIndex(draftAnswers),
      quizVersion: currentVersion,
    };
  }

  return {
    rule: "fresh_quiz",
    applyAnswersToActiveQuiz: true,
    restartQuiz: false,
    readableResult: null,
    answers: draftAnswers,
    resumeIndex: 0,
    quizVersion: currentVersion,
  };
}

/**
 * Persist payload compatibility for module1_quiz_results insert.
 * quiz_version is included for new rows; legacy readers ignore unknown fields safely
 * when the column is absent (caller may strip). Answers remain a string array.
 * @param {{ userEmail: string, answers: string[], quiz: { answer: string }[], quizVersion?: number }} input
 */
export function buildQuizPersistencePayload(input) {
  const answers = normalizeQuizAnswers(input.answers);
  const quiz = Array.isArray(input.quiz) ? input.quiz : getActiveQuiz();
  const correct = quiz.reduce((acc, q, i) => {
    const given = (answers[i] || "").toLowerCase();
    const expected = String(q?.answer || "").toLowerCase();
    return acc + (given && given === expected ? 1 : 0);
  }, 0);
  return {
    user_email: input.userEmail,
    score: correct,
    total: quiz.length || QUIZ_ITEM_COUNT,
    answers,
    quiz_version: input.quizVersion ?? QUIZ_CONTENT_VERSION,
  };
}

export function getQuizStatusLabel(index, length = QUIZ_ITEM_COUNT) {
  const safe = Math.max(0, Math.min(length - 1, index));
  return `Question ${safe + 1} of ${length}`;
}

/**
 * Audit: no required question may depend on optional video.
 */
export function auditQuizVideoIndependence(quiz = MODULE1_QUIZ_V2) {
  const items = Array.isArray(quiz) ? quiz : [];
  const offenders = items.filter((q) => {
    if (q.requiresOptionalVideo) return true;
    const text = `${q.question || ""} ${q.options?.join(" ") || ""}`.toLowerCase();
    return MODULE1_QUIZ_V1_LEGACY_MARKERS.some((m) => text.includes(m));
  });
  return {
    ok: offenders.length === 0,
    count: items.length,
    offenders: offenders.map((q) => q.id || q.question),
  };
}

/**
 * Every quiz item maps to a taught vocabulary concept.
 */
export function auditQuizMapsToTaughtVocabulary(
  quiz = MODULE1_QUIZ_V2,
  terms = VOCABULARY_TERMS
) {
  const taught = new Set(terms.map((t) => t.id));
  const unmapped = quiz.filter((q) => !taught.has(q.concept));
  return {
    ok: unmapped.length === 0,
    taughtConcepts: [...taught],
    conceptsUsed: [...new Set(quiz.map((q) => q.concept))],
    unmapped: unmapped.map((q) => q.id || q.question),
  };
}

export const QUIZ_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1440],
  oneDominantQuestion: true,
  videoSecondary: true,
  referenceCollapsed: true,
  primaryActionMinHeightPx: 44,
  noHorizontalOverflow: true,
  requireAccessibleNames: true,
  quizHiddenUntilVocabularyComplete: true,
});
