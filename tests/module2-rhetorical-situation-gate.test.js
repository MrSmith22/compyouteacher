const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  MODULE2_MEET_SITUATIONS_FOCUS_PATH,
  MODULE2_STAGE6_LOCKED_MESSAGE,
  isRhetoricalSituationLessonSatisfied,
  canReachModule2WizardStage,
  getModule2AnalysisAccessDecision,
  isRhetoricalSituationDevBypassAvailable,
  readRhetoricalSituationDevBypassFlag,
  writeRhetoricalSituationDevBypassFlag,
  hasRhetoricalSituationCompletionTimestamp,
} = require("../lib/module2/rhetoricalSituationGate.js");

const {
  LESSON_PHASES,
  FORMATIVE_QUESTIONS,
  createInitialLessonState,
  getActiveQuestion,
  applyAnswer,
  advanceAfterFeedback,
  advanceLessonPhase,
  isLessonComplete,
  getLessonPrimaryAction,
  canAdvanceFromFeedback,
} = require("../lib/module2/rhetoricalSituationLesson.js");

function completeLessonThroughFinalQuestion() {
  let state = createInitialLessonState();
  state = advanceLessonPhase(state, LESSON_PHASES.LETTER);
  state = advanceLessonPhase(state, LESSON_PHASES.COMPARE);
  state = advanceLessonPhase(state, LESSON_PHASES.CHECK);

  for (let i = 0; i < FORMATIVE_QUESTIONS.length; i += 1) {
    const question = getActiveQuestion(state);
    state = applyAnswer(state, question.correctChoiceId);
    assert.equal(canAdvanceFromFeedback(state), true);
    state = advanceAfterFeedback(state);
  }

  return state;
}

describe("Module 2 rhetorical-situation progression gate", () => {
  it("1. Stage 6 is unavailable before lesson completion", () => {
    assert.equal(
      canReachModule2WizardStage({
        targetStage: 6,
        sourcesReady: true,
        lessonSatisfied: false,
        knowledgeCheckSubmitted: true,
        speechSaved: true,
      }),
      false
    );

    assert.equal(
      canReachModule2WizardStage({
        targetStage: 6,
        sourcesReady: true,
        lessonSatisfied: true,
        knowledgeCheckSubmitted: true,
        speechSaved: true,
      }),
      true
    );
  });

  it("2. Progress controls cannot skip Stage 5 into Stage 6", () => {
    const sourcesReady = true;
    const lessonSatisfied = false;

    assert.equal(
      canReachModule2WizardStage({
        targetStage: 5,
        sourcesReady,
        lessonSatisfied,
        knowledgeCheckSubmitted: true,
        speechSaved: true,
      }),
      true
    );
    assert.equal(
      canReachModule2WizardStage({
        targetStage: 6,
        sourcesReady,
        lessonSatisfied,
        knowledgeCheckSubmitted: true,
        speechSaved: true,
      }),
      false
    );
  });

  it("3. Direct /modules/2/tcharts entry is rejected before completion", () => {
    const denied = getModule2AnalysisAccessDecision({
      sourcesReady: true,
      lessonSatisfied: false,
    });
    assert.equal(denied.allowed, false);
    assert.equal(denied.redirectTo, MODULE2_MEET_SITUATIONS_FOCUS_PATH);
    assert.match(denied.message, /almost ready to begin gathering evidence/i);

    const allowed = getModule2AnalysisAccessDecision({
      sourcesReady: true,
      lessonSatisfied: true,
    });
    assert.equal(allowed.allowed, true);
  });

  it("4. Legacy routes cannot bypass the gate (same access decision)", () => {
    // Legacy /modules/2/letter must use the same decision before pushing tcharts.
    const access = getModule2AnalysisAccessDecision({
      sourcesReady: true,
      lessonSatisfied: false,
    });
    assert.equal(access.allowed, false);
    assert.equal(access.redirectTo, MODULE2_MEET_SITUATIONS_FOCUS_PATH);
    assert.notEqual(access.redirectTo, "/modules/2/tcharts");
  });

  it("5. Completion is recorded only after the final required lesson action", () => {
    let state = createInitialLessonState();
    assert.equal(isLessonComplete(state), false);

    state = advanceLessonPhase(state, LESSON_PHASES.LETTER);
    state = advanceLessonPhase(state, LESSON_PHASES.COMPARE);
    state = advanceLessonPhase(state, LESSON_PHASES.CHECK);
    assert.equal(isLessonComplete(state), false);
    assert.equal(getLessonPrimaryAction(state).kind, "waiting");

    // Four questions done — still incomplete.
    for (let i = 0; i < 4; i += 1) {
      const question = getActiveQuestion(state);
      state = applyAnswer(state, question.correctChoiceId);
      state = advanceAfterFeedback(state);
    }
    assert.equal(isLessonComplete(state), false);

    const last = getActiveQuestion(state);
    state = applyAnswer(state, last.correctChoiceId);
    state = advanceAfterFeedback(state);
    assert.equal(isLessonComplete(state), true);
    assert.equal(getLessonPrimaryAction(state).kind, "continue");
  });

  it("6. Completion survives refresh/resume via durable timestamp", () => {
    const before = isRhetoricalSituationLessonSatisfied({
      completedAt: null,
      currentModule: 2,
      resumePath: "/modules/2",
      tchartEntryCount: 0,
      guidedObservationCount: 0,
    });
    assert.equal(before.satisfied, false);

    const after = isRhetoricalSituationLessonSatisfied({
      completedAt: "2026-07-11T12:00:00.000Z",
      currentModule: 2,
      resumePath: "/modules/2",
      tchartEntryCount: 0,
      guidedObservationCount: 0,
    });
    assert.equal(after.satisfied, true);
    assert.equal(after.grandfathered, false);
    assert.equal(after.reason, "completed");
    assert.equal(
      hasRhetoricalSituationCompletionTimestamp("2026-07-11T12:00:00.000Z"),
      true
    );
    assert.equal(hasRhetoricalSituationCompletionTimestamp(null), false);
  });

  it("7. Existing downstream students are safely grandfathered", () => {
    const byModule = isRhetoricalSituationLessonSatisfied({
      completedAt: null,
      currentModule: 3,
    });
    assert.equal(byModule.satisfied, true);
    assert.equal(byModule.grandfathered, true);
    assert.equal(byModule.reason, "module_advanced");

    const byResume = isRhetoricalSituationLessonSatisfied({
      completedAt: null,
      currentModule: 2,
      resumePath: "/modules/2/tcharts",
    });
    assert.equal(byResume.satisfied, true);
    assert.equal(byResume.grandfathered, true);
    assert.equal(byResume.reason, "resume_tcharts");

    const byTchart = isRhetoricalSituationLessonSatisfied({
      completedAt: null,
      currentModule: 2,
      tchartEntryCount: 2,
    });
    assert.equal(byTchart.satisfied, true);
    assert.equal(byTchart.grandfathered, true);
    assert.equal(byTchart.reason, "tchart_evidence");

    const byObservations = isRhetoricalSituationLessonSatisfied({
      completedAt: null,
      currentModule: 2,
      guidedObservationCount: 1,
    });
    assert.equal(byObservations.satisfied, true);
    assert.equal(byObservations.grandfathered, true);
    assert.equal(byObservations.reason, "guided_observations");

    // Incomplete new students are never auto-marked complete.
    const incomplete = isRhetoricalSituationLessonSatisfied({
      completedAt: null,
      currentModule: 2,
      resumePath: "/modules/2",
      tchartEntryCount: 0,
      guidedObservationCount: 0,
    });
    assert.equal(incomplete.satisfied, false);
  });

  it("8. Development bypass is unavailable in production behavior", () => {
    assert.equal(isRhetoricalSituationDevBypassAvailable("production"), false);
    assert.equal(isRhetoricalSituationDevBypassAvailable("test"), false);
    assert.equal(isRhetoricalSituationDevBypassAvailable("development"), true);

    const memory = {
      store: Object.create(null),
      getItem(key) {
        return this.store[key] ?? null;
      },
      setItem(key, value) {
        this.store[key] = String(value);
      },
      removeItem(key) {
        delete this.store[key];
      },
    };

    // Even if storage is polluted, production helper refuses to read/write.
    memory.setItem("module2_rhetorical_situation_dev_bypass", "1");
    // Force production check by calling availability with production, then
    // verifying write/read helpers gate on process.env.NODE_ENV indirectly.
    // We exercise the write helper: when NODE_ENV is not development it no-ops.
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      assert.equal(isRhetoricalSituationDevBypassAvailable(), false);
      assert.equal(writeRhetoricalSituationDevBypassFlag(true, memory), false);
      assert.equal(readRhetoricalSituationDevBypassFlag(memory), false);

      process.env.NODE_ENV = "development";
      assert.equal(isRhetoricalSituationDevBypassAvailable(), true);
      assert.equal(writeRhetoricalSituationDevBypassFlag(true, memory), true);
      assert.equal(readRhetoricalSituationDevBypassFlag(memory), true);
      assert.equal(writeRhetoricalSituationDevBypassFlag(false, memory), true);
      assert.equal(readRhetoricalSituationDevBypassFlag(memory), false);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }

    assert.match(MODULE2_STAGE6_LOCKED_MESSAGE, /Meet the two situations/);

    // Final lesson path still unlocks Stage 6 after completion.
    const finished = completeLessonThroughFinalQuestion();
    assert.equal(isLessonComplete(finished), true);
  });
});
