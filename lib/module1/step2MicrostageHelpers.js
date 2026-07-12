/**
 * Module 1 Step 2 ephemeral microstages (CP-A cognitive-load repair).
 * Durable route remains /modules/1; stages are internal.
 */

import {
  VOCAB_TERM_COUNT,
  advanceTermIndex,
  canFinishVocabulary,
  getTermProgressLabel,
  getVocabularyTerm,
} from "./vocabularyTermHelpers.js";

export {
  ESSAY_USE_LABEL,
  VOCABULARY_TERMS,
  VOCAB_TERM_COUNT,
  advanceTermIndex,
  audienceDistinctFromPurpose,
  canFinishVocabulary,
  formatEssayUseLine,
  getTermProgressLabel,
  getVocabularyTerm,
  vocabularyTermHasRequiredFields,
} from "./vocabularyTermHelpers.js";

export const STEP2_STAGES = Object.freeze({
  TRANSITION: "transition",
  LEARN: "learn",
  QUIZ: "quiz",
});

/**
 * Presentation model for the active Step 2 microstage.
 * Hierarchy: where → dominant question → strategy → context → action → next.
 */
export function getStep2PresentationModel({
  stage,
  termIndex = 0,
  quizIndex = 0,
  quizLength = 10,
  paraphrase = "",
}) {
  const whereBase = "Module 1 · Step 2 of 2";

  if (stage === STEP2_STAGES.TRANSITION) {
    return {
      stage,
      whereYouAre: `${whereBase} · Getting ready`,
      dominantQuestion:
        "What words will help me analyze King’s rhetorical choices?",
      strategyExplanation:
        "Academic vocabulary reduces the number of words you need to hold in mind when you analyze.",
      requiredContext:
        "You already decoded the assignment prompt. Next you will learn the key terms one at a time.",
      responseMode: "primary_action",
      primaryActionLabel: "Learn the first term",
      whatComesNext: "Learn rhetoric, ethos, pathos, logos, audience, and purpose.",
      showQuiz: false,
      showVocabularyCards: false,
      showAllDefinitions: false,
      paraphraseMode: "collapsed_reference",
      paraphrase: String(paraphrase || "").trim(),
      optionalVideoCollapsed: true,
      optionalReferenceCollapsed: true,
      teacherGuidanceSecondary: true,
      progressLabel: null,
      layout: STEP2_LAYOUT_CONTRACT,
    };
  }

  if (stage === STEP2_STAGES.LEARN) {
    const term = getVocabularyTerm(termIndex);
    return {
      stage,
      whereYouAre: `${whereBase} · Vocabulary`,
      dominantQuestion: `What does “${term.term}” mean, and how will I use it later?`,
      strategyExplanation: term.definition,
      plainLanguage: term.plainLanguage,
      requiredContext: term.example,
      essayUseAction: term.essayUseAction,
      visual: term.visual,
      responseMode: "term_navigation",
      primaryActionLabel: canFinishVocabulary(termIndex)
        ? "Check my understanding"
        : "Next term",
      whatComesNext: canFinishVocabulary(termIndex)
        ? "A short quiz, one question at a time."
        : `Next: ${getVocabularyTerm(termIndex + 1).term}`,
      showQuiz: false,
      showVocabularyCards: true,
      showAllDefinitions: false,
      activeTerm: term,
      paraphraseMode: "collapsed_reference",
      paraphrase: String(paraphrase || "").trim(),
      optionalVideoCollapsed: true,
      optionalReferenceCollapsed: true,
      teacherGuidanceSecondary: true,
      progressLabel: getTermProgressLabel(termIndex),
      termIndex,
      layout: STEP2_LAYOUT_CONTRACT,
    };
  }

  return {
    stage: STEP2_STAGES.QUIZ,
    whereYouAre: `${whereBase} · Check understanding`,
    dominantQuestion: "Can I apply these vocabulary terms correctly?",
    strategyExplanation:
      "Answer one question at a time using what you learned on screen. You do not need the optional video.",
    requiredContext: null,
    responseMode: "quiz_item",
    primaryActionLabel: "Next question",
    whatComesNext: "After the quiz, you move to Module 2 to gather source texts.",
    showQuiz: true,
    showVocabularyCards: false,
    showAllDefinitions: false,
    paraphraseMode: "collapsed_reference",
    paraphrase: String(paraphrase || "").trim(),
    optionalVideoCollapsed: true,
    optionalReferenceCollapsed: true,
    teacherGuidanceSecondary: true,
    progressLabel: `Question ${Math.min(quizIndex + 1, quizLength)} of ${quizLength}`,
    quizIndex,
    layout: STEP2_LAYOUT_CONTRACT,
  };
}

export const STEP2_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1440],
  oneActiveTask: true,
  oneDominantQuestion: true,
  oneResponseMode: true,
  noHorizontalOverflow: true,
  fullWidthPrimaryActionOnMobile: true,
  teacherGuidanceBelowOnNarrow: true,
  optionalResourcesCollapsed: true,
  noCompetingMultiColumnOnMobile: true,
  paraphraseCollapsedDuringVocab: true,
  primaryActionMinHeightPx: 44,
  requireAccessibleNames: true,
  visibleFocus: true,
  visualNotColorOnly: true,
});

export function createEmptyStep2Draft(quizLength = 10) {
  return {
    stage: STEP2_STAGES.TRANSITION,
    termIndex: 0,
    quizIndex: 0,
    quizAnswers: Array.from({ length: quizLength }, () => ""),
    quizVersion: null,
    updatedAt: null,
  };
}

export function hydrateStep2Draft(raw, opts) {
  const quizLength = opts.quizLength ?? 10;
  const empty = createEmptyStep2Draft(quizLength);
  if (!raw || typeof raw !== "object") return empty;

  const stage = Object.values(STEP2_STAGES).includes(raw.stage)
    ? raw.stage
    : STEP2_STAGES.TRANSITION;
  const termIndex = Math.max(
    0,
    Math.min(VOCAB_TERM_COUNT - 1, Number(raw.termIndex) || 0)
  );
  const quizIndex = Math.max(
    0,
    Math.min(quizLength - 1, Number(raw.quizIndex) || 0)
  );
  const answers = Array.isArray(raw.quizAnswers)
    ? Array.from({ length: quizLength }, (_, i) =>
        typeof raw.quizAnswers[i] === "string" ? raw.quizAnswers[i] : ""
      )
    : empty.quizAnswers;

  const draftVersion = Number(raw.quizVersion) || null;
  if (
    stage === STEP2_STAGES.QUIZ &&
    draftVersion != null &&
    draftVersion !== opts.currentQuizVersion
  ) {
    return {
      ...empty,
      stage: STEP2_STAGES.QUIZ,
      termIndex: VOCAB_TERM_COUNT - 1,
      quizIndex: 0,
      quizAnswers: empty.quizAnswers,
      quizVersion: opts.currentQuizVersion,
      migratedFromVersion: draftVersion,
      migrationRule: "partial_legacy_quiz_restarts",
    };
  }

  return {
    stage,
    termIndex,
    quizIndex,
    quizAnswers: answers,
    quizVersion: draftVersion ?? opts.currentQuizVersion,
    updatedAt: raw.updatedAt ?? null,
    migrationRule: null,
  };
}

export function advanceStep2FromTransition() {
  return { stage: STEP2_STAGES.LEARN, termIndex: 0 };
}

export function advanceStep2FromLearn(termIndex) {
  if (canFinishVocabulary(termIndex)) {
    return { stage: STEP2_STAGES.QUIZ, termIndex, quizIndex: 0 };
  }
  return {
    stage: STEP2_STAGES.LEARN,
    termIndex: advanceTermIndex(termIndex, "next"),
  };
}

export function retreatStep2({ stage, termIndex, quizIndex }) {
  if (stage === STEP2_STAGES.QUIZ) {
    if (quizIndex > 0) {
      return { stage: STEP2_STAGES.QUIZ, termIndex, quizIndex: quizIndex - 1 };
    }
    return {
      stage: STEP2_STAGES.LEARN,
      termIndex: VOCAB_TERM_COUNT - 1,
      quizIndex: 0,
    };
  }
  if (stage === STEP2_STAGES.LEARN) {
    if (termIndex > 0) {
      return {
        stage: STEP2_STAGES.LEARN,
        termIndex: advanceTermIndex(termIndex, "back"),
      };
    }
    return { stage: STEP2_STAGES.TRANSITION, termIndex: 0 };
  }
  return { stage: STEP2_STAGES.TRANSITION, termIndex: 0 };
}
