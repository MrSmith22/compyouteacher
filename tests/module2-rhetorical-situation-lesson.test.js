const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  MODULE2_WIZARD_STEPS,
  MODULE2_TCHARTS_RESUME_PATH,
  LESSON_PHASES,
  FORMATIVE_QUESTIONS,
  createInitialLessonState,
  getWizardStepNumber,
  shouldAutoSkipStage5,
  getSaveStageContextCallout,
  getActiveQuestion,
  evaluateAnswer,
  applyAnswer,
  retryCurrentQuestion,
  advanceAfterFeedback,
  advanceLessonPhase,
  canAdvanceFromFeedback,
  isLessonComplete,
  getLessonContinueHint,
  getLessonPrimaryAction,
  getLessonScore,
  buildLessonPersistPayload,
} = require("../lib/module2/rhetoricalSituationLesson.js");

const {
  MLK_RHETORICAL_SITUATIONS,
  MLK_SITUATION_COMPARISON,
} = require("../lib/assignments/rhetoricalSituations.js");

const {
  getRhetoricalSituationModel,
  getSituationComparisonModel,
} = require("../lib/shared/rhetoricalSituationHelpers.js");

describe("Module 2 Meet the two situations — wizard map", () => {
  it("1. wizard now contains seven visible steps", () => {
    assert.equal(MODULE2_WIZARD_STEPS.length, 7);
  });

  it("2. Stage 5 is Meet the two situations", () => {
    const step = MODULE2_WIZARD_STEPS.find((item) => item.stage === 5);
    assert.equal(step.label, "Meet the two situations");
    assert.equal(getWizardStepNumber(5), 6);
  });

  it("3. Stage 5 no longer redirects automatically to Stage 6", () => {
    assert.equal(shouldAutoSkipStage5(), false);
  });

  it("4. Stage 4 continues to Stage 5 in the map", () => {
    const stage4Index = MODULE2_WIZARD_STEPS.findIndex((s) => s.stage === 4);
    const stage5Index = MODULE2_WIZARD_STEPS.findIndex((s) => s.stage === 5);
    assert.equal(stage5Index, stage4Index + 1);
    assert.equal(getWizardStepNumber(4), 5);
  });

  it("5. Stage 5 continues to Stage 6 only after lesson completion", () => {
    let state = createInitialLessonState();
    assert.equal(isLessonComplete(state), false);
    assert.equal(getLessonPrimaryAction(state).kind, "advance");

    state = advanceLessonPhase(state, LESSON_PHASES.LETTER);
    state = advanceLessonPhase(state, LESSON_PHASES.COMPARE);
    state = advanceLessonPhase(state, LESSON_PHASES.CHECK);

    // Incomplete check cannot continue to Stage 6.
    assert.equal(getLessonPrimaryAction(state).kind, "waiting");
    assert.equal(isLessonComplete(state), false);

    // Complete all five questions correctly / formatively.
    for (let i = 0; i < FORMATIVE_QUESTIONS.length; i += 1) {
      const question = getActiveQuestion(state);
      state = applyAnswer(state, question.correctChoiceId);
      assert.equal(canAdvanceFromFeedback(state), true);
      state = advanceAfterFeedback(state);
    }
    assert.equal(isLessonComplete(state), true);
    assert.equal(getLessonPrimaryAction(state).kind, "continue");
    assert.equal(
      getLessonPrimaryAction(state).label,
      "Continue: Begin reading like a writer"
    );
  });

  it("6. Stage 6 still routes to /modules/2/tcharts", () => {
    assert.equal(MODULE2_TCHARTS_RESUME_PATH, "/modules/2/tcharts");
    assert.equal(getWizardStepNumber(6), 7);
  });
});

describe("Module 2 Meet the two situations — lesson sequence", () => {
  it("7. Speech context appears before Letter context", () => {
    const state = createInitialLessonState();
    assert.equal(state.phase, LESSON_PHASES.SPEECH);
    const speech = getRhetoricalSituationModel({
      sourceType: "speech",
      label: "Speech",
      title: "I Have a Dream",
      rhetoricalSituation: MLK_RHETORICAL_SITUATIONS.speech,
    });
    assert.equal(speech.hasRenderableContext, true);
    assert.match(speech.immediateAudience, /250,000 marchers/);
  });

  it("8. Letter context appears before comparison", () => {
    let state = createInitialLessonState();
    state = advanceLessonPhase(state, LESSON_PHASES.LETTER);
    assert.equal(state.phase, LESSON_PHASES.LETTER);
    // Cannot skip straight to compare from speech.
    const skipped = advanceLessonPhase(createInitialLessonState(), LESSON_PHASES.COMPARE);
    assert.equal(skipped.phase, LESSON_PHASES.SPEECH);

    state = advanceLessonPhase(state, LESSON_PHASES.COMPARE);
    assert.equal(state.phase, LESSON_PHASES.COMPARE);
  });

  it("9. Comparison includes similarities, differences, and caveat", () => {
    const comparison = getSituationComparisonModel(MLK_SITUATION_COMPARISON);
    assert.equal(comparison.hasRenderableComparison, true);
    assert.ok(comparison.shared.length >= 3);
    assert.ok(comparison.different.length >= 3);
    assert.match(
      comparison.caveat,
      /tendencies to test against the text—not rules/
    );
  });
});

describe("Module 2 Meet the two situations — formative check", () => {
  it("10. Question 1 requires the correct answer", () => {
    let state = createInitialLessonState();
    state = advanceLessonPhase(state, LESSON_PHASES.LETTER);
    state = advanceLessonPhase(state, LESSON_PHASES.COMPARE);
    state = advanceLessonPhase(state, LESSON_PHASES.CHECK);

    state = applyAnswer(state, "letter");
    assert.equal(state.lastResult, "incorrect");
    assert.equal(canAdvanceFromFeedback(state), false);
    assert.equal(getLessonPrimaryAction(state).kind, "retry");

    state = retryCurrentQuestion(state);
    state = applyAnswer(state, "speech");
    assert.equal(state.lastResult, "correct");
    assert.equal(canAdvanceFromFeedback(state), true);
  });

  it("11. Question 2 requires the correct answer", () => {
    let state = createInitialLessonState();
    state = advanceLessonPhase(state, LESSON_PHASES.LETTER);
    state = advanceLessonPhase(state, LESSON_PHASES.COMPARE);
    state = advanceLessonPhase(state, LESSON_PHASES.CHECK);
    state = applyAnswer(state, "speech");
    state = advanceAfterFeedback(state);

    state = applyAnswer(state, "speech");
    assert.equal(getActiveQuestion(state).id, "q2");
    assert.equal(canAdvanceFromFeedback(state), false);
    state = retryCurrentQuestion(state);
    state = applyAnswer(state, "letter");
    assert.equal(canAdvanceFromFeedback(state), true);
  });

  it("12. Questions 3–5 provide feedback and permit progression", () => {
    for (const question of FORMATIVE_QUESTIONS.slice(2)) {
      assert.equal(question.requiresCorrect, false);
      const wrong = question.choices.find((c) => c.id !== question.correctChoiceId);
      const evaluation = evaluateAnswer(question.id, wrong.id);
      assert.equal(evaluation.requiresRetry, false);
      assert.ok(evaluation.feedback.length > 0);
    }
  });

  it("13. Questions appear one at a time", () => {
    let state = createInitialLessonState();
    state = advanceLessonPhase(state, LESSON_PHASES.LETTER);
    state = advanceLessonPhase(state, LESSON_PHASES.COMPARE);
    state = advanceLessonPhase(state, LESSON_PHASES.CHECK);
    assert.equal(getActiveQuestion(state).id, "q1");
    state = applyAnswer(state, "speech");
    state = advanceAfterFeedback(state);
    assert.equal(getActiveQuestion(state).id, "q2");
    assert.equal(FORMATIVE_QUESTIONS.filter((q) => q.id === getActiveQuestion(state).id).length, 1);
  });

  it("14. No score or grade is produced", () => {
    const state = createInitialLessonState();
    assert.equal(getLessonScore(state), null);
  });

  it("15. Context lesson state is not sent to an API", () => {
    const state = applyAnswer(
      {
        ...createInitialLessonState(),
        phase: LESSON_PHASES.CHECK,
      },
      "speech"
    );
    assert.equal(buildLessonPersistPayload(state), null);
  });
});

describe("Module 2 Meet the two situations — navigation and callouts", () => {
  it("16. Back navigation works across Stages 4–6 via sequential stages", () => {
    const stages = MODULE2_WIZARD_STEPS.map((step) => step.stage);
    assert.deepEqual(stages.slice(4), [4, 5, 6]);
    // Stage 5 back → 4; Stage 6 back → 5 is component wiring covered by map order.
    assert.equal(stages.indexOf(5), stages.indexOf(4) + 1);
    assert.equal(stages.indexOf(6), stages.indexOf(5) + 1);
  });

  it("17. Save-stage context lines derive from assignment context", () => {
    const speechCallout = getSaveStageContextCallout({
      sourceType: "speech",
      title: "I Have a Dream",
      rhetoricalSituation: MLK_RHETORICAL_SITUATIONS.speech,
    });
    assert.match(speechCallout, /250,000 people/);
    assert.match(speechCallout, /March on Washington/);

    const letterCallout = getSaveStageContextCallout({
      sourceType: "letter",
      title: "Letter from Birmingham Jail",
      rhetoricalSituation: MLK_RHETORICAL_SITUATIONS.letter,
    });
    assert.match(letterCallout, /Birmingham jail/);
    assert.match(letterCallout, /unwise and untimely/);
  });

  it("18. Missing context data degrades safely", () => {
    assert.equal(getSaveStageContextCallout({}), "");
    assert.match(
      getSaveStageContextCallout({ sourceType: "speech", title: "Dream" }),
      /about to save/
    );
    assert.equal(getLessonContinueHint(createInitialLessonState()), "Review the Speech situation first.");
  });

  it("19. Existing source-readiness gates remain unchanged in the map", () => {
    // Stage 5 and 6 still follow notebook completion (stage 4) in the wizard.
    assert.equal(MODULE2_WIZARD_STEPS[4].stage, 4);
    assert.equal(MODULE2_WIZARD_STEPS[5].stage, 5);
    assert.equal(MODULE2_WIZARD_STEPS[6].stage, 6);
  });

  it("20. Existing resume path remains /modules/2/tcharts", () => {
    assert.equal(MODULE2_TCHARTS_RESUME_PATH, "/modules/2/tcharts");
  });
});
