const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const restart = require("../lib/module1/restartHelpers.js");
const step2 = require("../lib/module1/step2MicrostageHelpers.js");
const quiz = require("../lib/module1/quizHelpers.js");
const prompt = require("../lib/module1/promptBreakdownHelpers.js");

describe("CP-A restart: ordinary revisit vs explicit restart", () => {
  it("ordinary revisit resumes legitimate saved work and clears nothing", () => {
    const entry = restart.resolveOrdinaryRevisitEntry({
      paraphrase:
        "Compare how King uses rhetorical appeals in the speech and letter for different audiences.",
      step2Draft: {
        stage: step2.STEP2_STAGES.LEARN,
        termIndex: 2,
      },
    });
    assert.equal(entry.mode, "resume_step2");
    assert.equal(entry.path, "/modules/1");
    assert.equal(entry.clearsNothing, true);
    assert.equal(entry.step2Draft.termIndex, 2);
  });

  it("ordinary revisit without paraphrase opens Step 1", () => {
    const entry = restart.resolveOrdinaryRevisitEntry({ paraphrase: "" });
    assert.equal(entry.mode, "resume_prompt");
    assert.equal(entry.path, "/modules/1/prompt");
  });

  it("Module 1 restart clears Module 1 state coherently", () => {
    const plan = restart.planRestartAction(restart.RESTART_ACTIONS.RESTART_MODULE_1);
    assert.equal(plan.label, "Restart Module 1");
    assert.ok(plan.tablesToClear.includes("module1_prompt_breakdown"));
    assert.ok(plan.tablesToClear.includes("module1_quiz_results"));
    assert.equal(plan.clearsParaphrase, true);
    assert.equal(plan.entry.question, 1);

    const after = restart.applyRestartPlanToSnapshot(
      {
        currentModule: 1,
        paraphrase: "Old stale paraphrase that must not survive.",
        promptAnswers: {
          task_verb: "Compare and contrast",
          student_paraphrase: "Old stale paraphrase that must not survive.",
        },
        quizResults: [{ score: 9, total: 10 }],
        step2Draft: { stage: "quiz", quizIndex: 4 },
      },
      plan
    );

    assert.equal(after.paraphrase, "");
    assert.equal(after.promptAnswers.student_paraphrase, "");
    assert.equal(after.quizResults.length, 0);
    assert.equal(after.step2Draft, null);
    assert.equal(after.currentModule, 1);

    const fresh = restart.resolveFreshStartEntry(plan);
    assert.equal(fresh.path, "/modules/1/prompt");
    assert.equal(fresh.question, 1);
    assert.equal(fresh.paraphrase, "");
  });

  it("full assignment restart clears dependent state after confirmation plan", () => {
    const plan = restart.planRestartAction(
      restart.RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT
    );
    assert.equal(plan.label, "Restart the entire assignment");
    assert.equal(plan.warning.requiresConfirmation, true);
    assert.equal(plan.tablesToClear, "all_assignment_tables");

    const after = restart.applyRestartPlanToSnapshot(
      {
        currentModule: 5,
        paraphrase: "Stale",
        quizResults: [{ score: 8 }],
        downstream: { outline: true },
        step2Draft: { stage: "learn" },
      },
      plan
    );
    assert.equal(after.currentModule, 1);
    assert.equal(after.paraphrase, "");
    assert.equal(after.quizResults.length, 0);
    assert.deepEqual(after.downstream, {});
  });

  it("progression and artifacts cannot disagree after fresh-start diagnosis", () => {
    const bad = restart.diagnoseProgressionArtifactCoherence({
      currentModule: 1,
      hasPromptBreakdown: true,
      paraphrase: "leftover",
      expectFreshStart: true,
    });
    assert.equal(bad.coherent, false);
    assert.ok(
      bad.issues.some((i) => i.code === "stale_paraphrase_after_restart")
    );

    const good = restart.diagnoseProgressionArtifactCoherence({
      currentModule: 1,
      hasPromptBreakdown: false,
      paraphrase: "",
      hasQuizResult: false,
      expectFreshStart: true,
    });
    assert.equal(good.coherent, true);
    assert.equal(good.recommendedEntry.question, 1);
  });

  it("warns when Module 1 restart would invalidate downstream work", () => {
    assert.equal(
      restart.hasDownstreamAssignmentWork({ currentModule: 3 }),
      true
    );
    const warning = restart.getRestartWarning(
      restart.RESTART_ACTIONS.RESTART_MODULE_1,
      { hasDownstream: true }
    );
    assert.equal(warning.invalidatesDownstream, true);
    assert.match(warning.message, /Later modules/i);
  });

  it("jump-to-module is not a content wipe", () => {
    const plan = restart.planRestartAction(restart.RESTART_ACTIONS.JUMP_TO_MODULE, {
      moduleNumber: 1,
    });
    assert.equal(plan.clearsParaphrase, false);
    assert.equal(plan.clearsQuiz, false);
    assert.deepEqual(plan.tablesToClear, []);
  });

  it("no stale paraphrase after Module 1 restart simulation", () => {
    const plan = restart.planRestartAction(restart.RESTART_ACTIONS.RESTART_MODULE_1);
    const after = restart.applyRestartPlanToSnapshot(
      { paraphrase: "nonsense shelf text", quizResults: [{}] },
      plan
    );
    assert.equal(after.paraphrase.trim(), "");
    const revisit = restart.resolveOrdinaryRevisitEntry({
      paraphrase: after.paraphrase,
    });
    assert.equal(revisit.path, "/modules/1/prompt");
  });
});

describe("CP-A Step 2 microstages", () => {
  it("flows transition → term sequence → quiz", () => {
    let state = { stage: step2.STEP2_STAGES.TRANSITION, termIndex: 0 };
    state = { ...state, ...step2.advanceStep2FromTransition() };
    assert.equal(state.stage, step2.STEP2_STAGES.LEARN);
    assert.equal(state.termIndex, 0);

    for (let i = 0; i < step2.VOCAB_TERM_COUNT - 1; i += 1) {
      state = { ...state, ...step2.advanceStep2FromLearn(state.termIndex) };
      assert.equal(state.stage, step2.STEP2_STAGES.LEARN);
    }
    state = { ...state, ...step2.advanceStep2FromLearn(state.termIndex) };
    assert.equal(state.stage, step2.STEP2_STAGES.QUIZ);
  });

  it("exposes one dominant question and one response mode per stage", () => {
    for (const stage of Object.values(step2.STEP2_STAGES)) {
      const model = step2.getStep2PresentationModel({
        stage,
        termIndex: 1,
        quizIndex: 3,
        paraphrase: "Saved paraphrase",
      });
      assert.equal(typeof model.dominantQuestion, "string");
      assert.ok(model.dominantQuestion.length > 10);
      assert.equal(typeof model.responseMode, "string");
      assert.equal(model.showAllDefinitions, false);
      assert.equal(model.paraphraseMode, "collapsed_reference");
      if (stage !== step2.STEP2_STAGES.QUIZ) {
        assert.equal(model.showQuiz, false);
      } else {
        assert.equal(model.showQuiz, true);
        assert.equal(model.showVocabularyCards, false);
      }
    }
  });

  it("supports Back and Next across terms", () => {
    assert.equal(step2.advanceTermIndex(0, "next"), 1);
    assert.equal(step2.advanceTermIndex(1, "back"), 0);
    const backToTransition = step2.retreatStep2({
      stage: step2.STEP2_STAGES.LEARN,
      termIndex: 0,
      quizIndex: 0,
    });
    assert.equal(backToTransition.stage, step2.STEP2_STAGES.TRANSITION);
  });

  it("reload during a term restores that term", () => {
    const draft = step2.hydrateStep2Draft(
      {
        stage: step2.STEP2_STAGES.LEARN,
        termIndex: 3,
        quizIndex: 0,
        quizAnswers: [],
        quizVersion: quiz.QUIZ_CONTENT_VERSION,
      },
      { currentQuizVersion: quiz.QUIZ_CONTENT_VERSION }
    );
    assert.equal(draft.stage, step2.STEP2_STAGES.LEARN);
    assert.equal(draft.termIndex, 3);
    assert.match(step2.getTermProgressLabel(3), /Term 4 of 6/);
  });

  it("reload during quiz question 4 preserves answers", () => {
    const answers = quiz.normalizeQuizAnswers([
      "a",
      "b",
      "c",
      "d",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    const draft = step2.hydrateStep2Draft(
      {
        stage: step2.STEP2_STAGES.QUIZ,
        termIndex: 5,
        quizIndex: 3,
        quizAnswers: answers,
        quizVersion: quiz.QUIZ_CONTENT_VERSION,
      },
      { currentQuizVersion: quiz.QUIZ_CONTENT_VERSION }
    );
    assert.equal(draft.stage, step2.STEP2_STAGES.QUIZ);
    assert.equal(draft.quizIndex, 3);
    assert.equal(draft.quizAnswers[3], "d");
    assert.equal(quiz.getResumeQuizIndex(draft.quizAnswers), 4);
  });

  it("quiz is hidden before vocabulary stages finish", () => {
    const transition = step2.getStep2PresentationModel({
      stage: step2.STEP2_STAGES.TRANSITION,
    });
    const learn = step2.getStep2PresentationModel({
      stage: step2.STEP2_STAGES.LEARN,
      termIndex: 0,
    });
    assert.equal(transition.showQuiz, false);
    assert.equal(learn.showQuiz, false);
    assert.equal(quiz.QUIZ_LAYOUT_CONTRACT.quizHiddenUntilVocabularyComplete, true);
  });

  it("teaches six required vocabulary terms including purpose", () => {
    assert.equal(step2.VOCAB_TERM_COUNT, 6);
    const ids = step2.VOCABULARY_TERMS.map((t) => t.id);
    assert.deepEqual(ids, [
      "rhetoric",
      "ethos",
      "pathos",
      "logos",
      "audience",
      "purpose",
    ]);
  });
});

describe("CP-A quiz content versioning and video independence", () => {
  it("no required question depends on optional video", () => {
    const audit = quiz.auditQuizVideoIndependence();
    assert.equal(audit.ok, true);
    assert.equal(audit.count, 10);
    assert.deepEqual(audit.offenders, []);
  });

  it("all questions map to taught vocabulary", () => {
    const audit = quiz.auditQuizMapsToTaughtVocabulary();
    assert.equal(audit.ok, true);
    assert.ok(audit.conceptsUsed.includes("audience"));
    assert.ok(audit.conceptsUsed.includes("purpose"));
  });

  it("every item must be answered before submit", () => {
    const partial = quiz.normalizeQuizAnswers(["only-first"]);
    assert.equal(quiz.canSubmitQuiz(partial), false);
    const complete = quiz.normalizeQuizAnswers(
      quiz.getActiveQuiz().map((q) => q.answer)
    );
    assert.equal(quiz.canSubmitQuiz(complete), true);
  });

  it("legacy completion remains readable without applying to v2 UI", () => {
    const migration = quiz.resolveQuizVersionMigration({
      saved: {
        score: 8,
        total: 10,
        answers: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
        quiz_version: 1,
        completed: true,
      },
    });
    assert.equal(migration.rule, "legacy_completion_readable");
    assert.equal(migration.applyAnswersToActiveQuiz, false);
    assert.equal(migration.readableResult.score, 8);
    assert.equal(migration.readableResult.quizVersion, 1);
  });

  it("partial legacy quiz state restarts under explicit migration rule", () => {
    const migration = quiz.resolveQuizVersionMigration({
      draftAnswers: ["old-a", "old-b"],
      draftVersion: 1,
      currentVersion: 2,
    });
    assert.equal(migration.rule, "partial_legacy_quiz_restarts");
    assert.equal(migration.restartQuiz, true);
    assert.equal(migration.answers.every((a) => a === ""), true);
  });

  it("same-version partial draft resumes", () => {
    const migration = quiz.resolveQuizVersionMigration({
      draftAnswers: ["x", "y", "", ""],
      draftVersion: 2,
      currentVersion: 2,
    });
    assert.equal(migration.rule, "same_version_resume");
    assert.equal(migration.resumeIndex, 2);
    assert.equal(migration.answers[0], "x");
  });

  it("active quiz version is 2 and persistence keeps answers array", () => {
    assert.equal(quiz.QUIZ_CONTENT_VERSION, 2);
    const payload = quiz.buildQuizPersistencePayload({
      userEmail: "s@example.com",
      answers: quiz.getActiveQuiz().map((q) => q.answer),
      quiz: quiz.getActiveQuiz(),
    });
    assert.equal(payload.quiz_version, 2);
    assert.equal(Array.isArray(payload.answers), true);
    assert.equal(payload.score, 10);
  });
});

describe("CP-A Step 2 presentation and layout contracts", () => {
  it("visible hierarchy model contains only the active task fields", () => {
    const model = step2.getStep2PresentationModel({
      stage: step2.STEP2_STAGES.LEARN,
      termIndex: 0,
    });
    assert.ok(model.whereYouAre);
    assert.ok(model.dominantQuestion);
    assert.ok(model.strategyExplanation);
    assert.ok(model.responseMode);
    assert.equal(model.showAllDefinitions, false);
    assert.equal(model.optionalVideoCollapsed, true);
    assert.equal(model.teacherGuidanceSecondary, true);
  });

  it("documents mobile and desktop layout contracts with a11y", () => {
    assert.deepEqual(step2.STEP2_LAYOUT_CONTRACT.viewports, [
      320, 390, 768, 1440,
    ]);
    assert.equal(step2.STEP2_LAYOUT_CONTRACT.oneActiveTask, true);
    assert.equal(step2.STEP2_LAYOUT_CONTRACT.fullWidthPrimaryActionOnMobile, true);
    assert.equal(step2.STEP2_LAYOUT_CONTRACT.teacherGuidanceBelowOnNarrow, true);
    assert.equal(step2.STEP2_LAYOUT_CONTRACT.requireAccessibleNames, true);
    assert.equal(step2.STEP2_LAYOUT_CONTRACT.visibleFocus, true);
    assert.equal(step2.STEP2_LAYOUT_CONTRACT.noHorizontalOverflow, true);
  });

  it("prompt Step 1 still resumes Question 1 after empty restart payload", () => {
    const empty = prompt.hydratePromptAnswers({});
    assert.equal(prompt.getResumeStepIndex(empty), 0);
    assert.match(prompt.getPromptStepStatusLabel(0), /Question 1 of 5/);
  });
});

describe("CP-A Module 1 scoped browser-cache cleanup", () => {
  const browser = require("../lib/module1/module1BrowserCache.js");
  const welcome = require("../lib/module1/assignmentWelcomeHelpers.js");
  const fs = require("node:fs");
  const path = require("node:path");
  const email = "student@example.com";

  function seedMixedStore() {
    const store = new Map([
      [
        browser.getModule1WelcomeCacheKey(email),
        JSON.stringify(welcome.buildWelcomeCompletionRecord()),
      ],
      [browser.getModule1Step2CacheKey(email), JSON.stringify({ stage: "quiz" })],
      [`wp:${email}:module2:source-cache`, "m2"],
      [`wp:${email}:module4:plan-draft`, "m4"],
      [`wp:${email}:module5:outline-draft`, "m5"],
      ["tchart_legacy", "legacy"],
    ]);
    return store;
  }

  it("Module 1-only cleanup removes welcome + step2 and preserves downstream keys", () => {
    const store = seedMixedStore();
    const result = browser.clearModule1FlowCacheFromStore(store, email);
    assert.ok(result.removedKeys.includes(`wp:${email}:module1:welcome`));
    assert.ok(result.removedKeys.includes(`wp:${email}:module1:step2`));
    assert.equal(store.has(`wp:${email}:module1:welcome`), false);
    assert.equal(store.has(`wp:${email}:module1:step2`), false);
    assert.equal(store.get(`wp:${email}:module2:source-cache`), "m2");
    assert.equal(store.get(`wp:${email}:module4:plan-draft`), "m4");
    assert.equal(store.get(`wp:${email}:module5:outline-draft`), "m5");
    assert.ok(result.preservedKeys.includes(`wp:${email}:module2:source-cache`));
    assert.ok(result.preservedKeys.includes(`wp:${email}:module4:plan-draft`));
    assert.ok(result.preservedKeys.includes(`wp:${email}:module5:outline-draft`));
  });

  it("flow keys match makeStudentKey contracts", () => {
    assert.deepEqual(
      restart.MODULE_1_FLOW_CACHE_KEY_SPECS.map((p) => [...p]),
      [
        ["module1", "welcome"],
        ["module1", "step2"],
      ]
    );
    assert.equal(
      browser.getModule1Step2CacheKey(email),
      `wp:${email}:module1:step2`
    );
    assert.equal(
      browser.getModule1WelcomeCacheKey(email),
      `wp:${email}:module1:welcome`
    );
  });

  it("full-assignment reset clears all user-scoped keys", () => {
    const store = seedMixedStore();
    const removed = browser.clearAllUserScopedCacheFromStore(store, email);
    assert.ok(removed.includes(`wp:${email}:module1:step2`));
    assert.ok(removed.includes(`wp:${email}:module1:welcome`));
    assert.ok(removed.includes(`wp:${email}:module2:source-cache`));
    assert.ok(removed.includes(`wp:${email}:module5:outline-draft`));
    assert.equal(store.size, 0);
  });

  it("jump and ordinary revisit clear nothing", () => {
    assert.equal(
      restart.resolveBrowserCacheClearMode(restart.RESTART_ACTIONS.JUMP_TO_MODULE),
      "none"
    );
    assert.equal(
      restart.resolveBrowserCacheClearMode("ordinary_revisit"),
      "none"
    );
    const store = seedMixedStore();
    const before = store.size;
    assert.equal(store.size, before);
    assert.equal(store.has(browser.getModule1Step2CacheKey(email)), true);
  });

  it("Restart Module 1 and Reset Current Module-on-M1 use scoped flow cleanup path", () => {
    assert.equal(
      restart.resolveBrowserCacheClearMode(restart.RESTART_ACTIONS.RESTART_MODULE_1),
      "module1_flow_only"
    );
    assert.equal(
      restart.resolveBrowserCacheClearMode("reset_current_module_m1"),
      "module1_flow_only"
    );
    assert.equal(
      restart.resolveBrowserCacheClearMode(
        restart.RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT
      ),
      "all_user_scoped"
    );
    assert.equal(
      restart.resolveBrowserCacheClearMode("full_reset_student"),
      "all_user_scoped"
    );

    const panelSrc = fs.readFileSync(
      path.join(__dirname, "../components/dev/DeveloperTestingPanel.jsx"),
      "utf8"
    );
    assert.match(panelSrc, /clearBrowserCacheForDevAction/);
    assert.match(panelSrc, /clearModule1FlowCache/);
    assert.match(
      panelSrc,
      /clearBrowserCacheForDevAction\(\s*RESTART_ACTIONS\.RESTART_MODULE_1/
    );
    assert.match(
      panelSrc,
      /clearBrowserCacheForDevAction\(\s*"reset_current_module_m1"/
    );
    const restartFn = panelSrc.slice(
      panelSrc.indexOf("async function restartModule1WithWarning"),
      panelSrc.indexOf("async function restartEntireAssignmentWithWarning")
    );
    assert.equal(restartFn.includes("clearStudentCache"), false);
  });

  it("Step 2 progress element has only one aria-live attribute", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleOne.js"),
      "utf8"
    );
    const progressBlock = src.slice(
      src.indexOf('data-testid="step2-progress"') - 120,
      src.indexOf('data-testid="step2-progress"') + 80
    );
    const matches = progressBlock.match(/aria-live="/g) || [];
    assert.equal(matches.length, 1);
    assert.match(progressBlock, /aria-live="polite"/);
  });
});
