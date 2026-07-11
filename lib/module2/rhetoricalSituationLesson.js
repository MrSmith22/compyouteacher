/**
 * Pure lesson model for Module 2 Stage 5 — “Meet the two situations.”
 *
 * In-memory only: no API, no database, no score. Recognition before writing.
 * Questions 1–2 require a correct answer; 3–5 are formative after feedback.
 */

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export const MODULE2_WIZARD_STEPS = [
  { stage: 0, label: "Get ready" },
  { stage: 1, label: "Can we trust these sources?" },
  { stage: 2, label: "Save the speech" },
  { stage: 3, label: "Save the letter" },
  { stage: 4, label: "Evidence notebook complete" },
  { stage: 5, label: "Meet the two situations" },
  { stage: 6, label: "Begin reading like a writer" },
];

export const MODULE2_TCHARTS_RESUME_PATH = "/modules/2/tcharts";

export const LESSON_PHASES = {
  SPEECH: "speech",
  LETTER: "letter",
  COMPARE: "compare",
  CHECK: "check",
  COMPLETE: "complete",
};

export const FORMATIVE_QUESTIONS = [
  {
    id: "q1",
    prompt: "Which work was delivered out loud to a large public crowd?",
    choices: [
      { id: "speech", label: "“I Have a Dream”" },
      { id: "letter", label: "“Letter from Birmingham Jail”" },
    ],
    correctChoiceId: "speech",
    requiresCorrect: true,
    correctFeedback:
      "Yes. King delivered “I Have a Dream” out loud at the March on Washington for Jobs and Freedom on August 28, 1963, before more than 250,000 people at the Lincoln Memorial.",
    incorrectFeedback:
      "Not quite. “I Have a Dream” was the speech delivered out loud to a large public crowd at the March on Washington. The letter was written from jail.",
  },
  {
    id: "q2",
    prompt: "Which work directly answered people who criticized the demonstrations?",
    choices: [
      { id: "speech", label: "“I Have a Dream”" },
      { id: "letter", label: "“Letter from Birmingham Jail”" },
    ],
    correctChoiceId: "letter",
    requiresCorrect: true,
    correctFeedback:
      "Yes. King wrote “Letter from Birmingham Jail” to answer eight white Alabama clergymen who called the demonstrations “unwise and untimely.”",
    incorrectFeedback:
      "Not quite. The letter directly answered clergymen who criticized the Birmingham demonstrations. The speech was delivered to marchers and a watching nation.",
  },
  {
    id: "q3",
    prompt: "Which audience was more likely to already support the civil-rights movement?",
    choices: [
      {
        id: "marchers",
        label: "Many of the marchers at the March on Washington.",
      },
      {
        id: "clergymen",
        label: "The clergymen who called the demonstrations unwise.",
      },
      {
        id: "everyone",
        label: "Everyone who heard either work supported King already.",
      },
    ],
    correctChoiceId: "marchers",
    requiresCorrect: false,
    correctFeedback:
      "Many marchers came because they already supported the movement and wanted action. “Many” does not mean every person in the crowd thought exactly the same thing.",
    incorrectFeedback:
      "Many marchers came because they already supported the movement and wanted action. “Many” does not mean every person in the crowd thought exactly the same thing. The clergymen were critics who questioned the timing and methods.",
  },
  {
    id: "q4",
    prompt: "What important purpose do both works share?",
    choices: [
      { id: "civil_rights", label: "Advancing civil rights and racial justice." },
      { id: "entertain", label: "Entertaining the audience." },
      { id: "life_story", label: "Describing King’s life story." },
      { id: "unrelated", label: "Reporting unrelated historical facts." },
    ],
    correctChoiceId: "civil_rights",
    requiresCorrect: false,
    correctFeedback:
      "Both works support civil rights and racial justice. Their immediate goals may still differ: the speech often inspires and mobilizes, while the letter often defends, explains, and answers criticism.",
    incorrectFeedback:
      "Both works share a broad purpose of advancing civil rights and racial justice. Entertaining or telling King’s life story is not their main job. Immediate goals can still differ between the speech and the letter.",
  },
  {
    id: "q5",
    prompt: "Why might King use rhetoric differently in these two works?",
    choices: [
      {
        id: "different_situations",
        label:
          "He was addressing different audiences in different situations and working toward different immediate goals.",
      },
      {
        id: "same_audience",
        label: "Both works were meant for exactly the same audience in the same situation.",
      },
      {
        id: "no_reason",
        label: "There is no reason—King always uses appeals the same way.",
      },
    ],
    correctChoiceId: "different_situations",
    requiresCorrect: false,
    correctFeedback:
      "Keep this question with you. It is at the heart of the compare-and-contrast essay.",
    incorrectFeedback:
      "King was addressing different audiences in different situations and working toward different immediate goals. Keep this question with you. It is at the heart of the compare-and-contrast essay.",
  },
];

export function createInitialLessonState() {
  return {
    phase: LESSON_PHASES.SPEECH,
    activeQuestionIndex: 0,
    answers: {},
    feedbackVisible: false,
    lastResult: null,
  };
}

export function getWizardStepNumber(stage, steps = MODULE2_WIZARD_STEPS) {
  const index = steps.findIndex((step) => step.stage === stage);
  return index >= 0 ? index + 1 : 1;
}

export function shouldAutoSkipStage5() {
  // Stage 5 is a real instructional stage; never auto-redirect to Stage 6.
  return false;
}

export function getSaveStageContextCallout(sourceDefinition = {}) {
  const situation =
    sourceDefinition?.rhetoricalSituation &&
    typeof sourceDefinition.rhetoricalSituation === "object"
      ? sourceDefinition.rhetoricalSituation
      : {};

  const fromDefinition = safeText(situation.saveStageCallout);
  if (fromDefinition) return fromDefinition;

  // Safe degradation when structured callout is absent.
  const sourceType = safeText(sourceDefinition.sourceType);
  const title = safeText(sourceDefinition.title) || "this source";
  if (sourceType === "speech") {
    return `You’re about to save “${title}.” Keep its audience and purpose in mind as you paste the full text.`;
  }
  if (sourceType === "letter") {
    return `You’re about to save “${title}.” Keep its audience and purpose in mind as you paste the full text.`;
  }
  return "";
}

export function getActiveQuestion(state = {}) {
  const index = Number.isFinite(state.activeQuestionIndex)
    ? state.activeQuestionIndex
    : 0;
  return FORMATIVE_QUESTIONS[index] || null;
}

export function getQuestionById(questionId) {
  return FORMATIVE_QUESTIONS.find((question) => question.id === questionId) || null;
}

export function evaluateAnswer(questionId, choiceId) {
  const question = getQuestionById(questionId);
  if (!question) {
    return { correct: false, feedback: "", requiresRetry: false };
  }

  const correct = question.correctChoiceId === choiceId;
  return {
    correct,
    feedback: correct ? question.correctFeedback : question.incorrectFeedback,
    requiresRetry: question.requiresCorrect && !correct,
    formative: !question.requiresCorrect,
  };
}

/**
 * After feedback is shown, can the student move past this question?
 */
export function canAdvanceFromFeedback(state = {}) {
  if (!state.feedbackVisible) return false;
  const question = getActiveQuestion(state);
  if (!question) return false;
  if (question.requiresCorrect) {
    return state.lastResult === "correct";
  }
  return true;
}

export function applyAnswer(state, choiceId) {
  const question = getActiveQuestion(state);
  if (!question || state.feedbackVisible) {
    return state;
  }

  const result = evaluateAnswer(question.id, choiceId);
  return {
    ...state,
    answers: {
      ...state.answers,
      [question.id]: choiceId,
    },
    feedbackVisible: true,
    lastResult: result.correct ? "correct" : "incorrect",
  };
}

export function retryCurrentQuestion(state) {
  const question = getActiveQuestion(state);
  if (!question) return state;
  const nextAnswers = { ...state.answers };
  delete nextAnswers[question.id];
  return {
    ...state,
    answers: nextAnswers,
    feedbackVisible: false,
    lastResult: null,
  };
}

export function advanceAfterFeedback(state) {
  if (!canAdvanceFromFeedback(state)) {
    return state;
  }

  const nextIndex = (state.activeQuestionIndex || 0) + 1;
  if (nextIndex >= FORMATIVE_QUESTIONS.length) {
    return {
      ...state,
      phase: LESSON_PHASES.COMPLETE,
      feedbackVisible: false,
      lastResult: null,
    };
  }

  return {
    ...state,
    activeQuestionIndex: nextIndex,
    feedbackVisible: false,
    lastResult: null,
  };
}

export function advanceLessonPhase(state, nextPhase) {
  const allowed = {
    [LESSON_PHASES.SPEECH]: LESSON_PHASES.LETTER,
    [LESSON_PHASES.LETTER]: LESSON_PHASES.COMPARE,
    [LESSON_PHASES.COMPARE]: LESSON_PHASES.CHECK,
  };

  if (allowed[state.phase] !== nextPhase) {
    return state;
  }

  return {
    ...state,
    phase: nextPhase,
    activeQuestionIndex: nextPhase === LESSON_PHASES.CHECK ? 0 : state.activeQuestionIndex,
    feedbackVisible: false,
    lastResult: null,
  };
}

export function isLessonComplete(state = {}) {
  return state.phase === LESSON_PHASES.COMPLETE;
}

export function getLessonContinueHint(state = {}) {
  if (state.phase === LESSON_PHASES.SPEECH) {
    return "Review the Speech situation first.";
  }
  if (state.phase === LESSON_PHASES.LETTER) {
    return "Review the Letter situation next.";
  }
  if (state.phase === LESSON_PHASES.COMPARE) {
    return "Compare the two situations.";
  }
  if (state.phase === LESSON_PHASES.CHECK) {
    return "Complete the quick check before continuing.";
  }
  return "";
}

export function getLessonPrimaryAction(state = {}) {
  if (state.phase === LESSON_PHASES.SPEECH) {
    return { kind: "advance", label: "Next: Meet the letter", nextPhase: LESSON_PHASES.LETTER };
  }
  if (state.phase === LESSON_PHASES.LETTER) {
    return {
      kind: "advance",
      label: "Next: Compare the situations",
      nextPhase: LESSON_PHASES.COMPARE,
    };
  }
  if (state.phase === LESSON_PHASES.COMPARE) {
    return { kind: "advance", label: "Check my understanding", nextPhase: LESSON_PHASES.CHECK };
  }
  if (state.phase === LESSON_PHASES.CHECK) {
    if (!state.feedbackVisible) {
      return { kind: "waiting", label: "Choose an answer" };
    }
    if (!canAdvanceFromFeedback(state)) {
      return { kind: "retry", label: "Try again" };
    }
    const isLast =
      (state.activeQuestionIndex || 0) >= FORMATIVE_QUESTIONS.length - 1;
    return {
      kind: "next_question",
      label: isLast ? "Finish the check" : "Next question",
    };
  }
  return {
    kind: "continue",
    label: "Continue: Begin reading like a writer",
  };
}

/** Confirms the lesson never grades or scores the student. */
export function getLessonScore(state) {
  void state;
  return null;
}

/** Confirms no API payload is produced for quiz answers. */
export function buildLessonPersistPayload(state) {
  void state;
  return null;
}
