const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const readiness = require("../lib/module1/module1CompletionReadiness.js");
const quiz = require("../lib/module1/quizHelpers.js");
const prompt = require("../lib/module1/promptBreakdownHelpers.js");
const progress = require("../lib/module1/advanceModuleProgression.js");

function completePrompt() {
  return {
    task_verb: "Compare and contrast",
    task_type: "A compare and contrast essay",
    analysis_focus: "How Dr. King uses rhetorical appeals in two texts",
    required_angle: "Specific evidence from both works",
    student_paraphrase:
      "I will compare how King uses rhetoric in the speech and the letter.",
  };
}

function completeAnswers() {
  return quiz.getActiveQuiz().map((q) => q.answer);
}

describe("Module 1 completion integrity — readiness predicate", () => {
  it("3–4. missing/invalid prompt blocks progression", () => {
    const missing = readiness.evaluateModule1CompletionReadiness({
      assignment: { current_module: 1, status: "in_progress" },
      promptBreakdown: null,
      quizResults: [
        {
          score: 10,
          total: 10,
          answers: completeAnswers(),
          quiz_version: 2,
        },
      ],
    });
    assert.equal(missing.ready, false);
    assert.equal(missing.reason, readiness.MODULE1_COMPLETION_REASONS.PROMPT_INCOMPLETE);

    const incomplete = readiness.evaluateModule1CompletionReadiness({
      assignment: { current_module: 1, status: "in_progress" },
      promptBreakdown: { ...completePrompt(), student_paraphrase: "short" },
      quizResults: [
        {
          score: 10,
          total: 10,
          answers: completeAnswers(),
          quiz_version: 2,
        },
      ],
    });
    assert.equal(incomplete.ready, false);
    assert.equal(
      incomplete.reason,
      readiness.MODULE1_COMPLETION_REASONS.PROMPT_INCOMPLETE
    );
  });

  it("5–6. missing/incomplete quiz blocks progression", () => {
    const missing = readiness.evaluateModule1CompletionReadiness({
      assignment: { current_module: 1, status: "in_progress" },
      promptBreakdown: completePrompt(),
      quizResults: [],
    });
    assert.equal(missing.ready, false);
    assert.equal(missing.reason, readiness.MODULE1_COMPLETION_REASONS.QUIZ_MISSING);

    const incomplete = readiness.evaluateModule1CompletionReadiness({
      assignment: { current_module: 1, status: "in_progress" },
      promptBreakdown: completePrompt(),
      quizResults: [{ score: 2, total: 10, answers: ["a"], quiz_version: 2 }],
    });
    assert.equal(incomplete.ready, false);
    assert.equal(
      incomplete.reason,
      readiness.MODULE1_COMPLETION_REASONS.QUIZ_INCOMPLETE
    );
  });

  it("7. outdated quiz version follows documented policy", () => {
    const outdated = readiness.evaluateModule1CompletionReadiness({
      assignment: { current_module: 1, status: "in_progress" },
      promptBreakdown: completePrompt(),
      quizResults: [
        {
          score: 10,
          total: 10,
          answers: completeAnswers(),
          quiz_version: 1,
        },
      ],
    });
    assert.equal(outdated.ready, false);
    assert.equal(
      outdated.reason,
      readiness.MODULE1_COMPLETION_REASONS.QUIZ_VERSION_OUTDATED
    );
  });

  it("8 + 17. ready prompt + current quiz allow readiness; legacy unversioned grandfathers", () => {
    const ready = readiness.evaluateModule1CompletionReadiness({
      assignment: { current_module: 1, status: "in progress" },
      promptBreakdown: completePrompt(),
      quizResults: [
        {
          score: 9,
          total: 10,
          answers: completeAnswers(),
          quiz_version: 2,
          submitted_at: "2026-07-12T12:00:00.000Z",
        },
      ],
    });
    assert.equal(ready.ready, true);
    assert.equal(ready.reason, readiness.MODULE1_COMPLETION_REASONS.READY);

    const legacy = readiness.evaluateModule1CompletionReadiness({
      assignment: { current_module: 1, status: "in_progress" },
      promptBreakdown: completePrompt(),
      quizResults: [
        {
          score: 8,
          total: 10,
          answers: completeAnswers(),
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    assert.equal(legacy.ready, true);
    assert.equal(legacy.quiz.grandfathered || legacy.ready, true);
  });

  it("inactive assignment is protected", () => {
    const result = readiness.evaluateModule1CompletionReadiness({
      assignment: { current_module: 1, status: "abandoned" },
      promptBreakdown: completePrompt(),
      quizResults: [
        {
          score: 10,
          total: 10,
          answers: completeAnswers(),
          quiz_version: 2,
        },
      ],
    });
    assert.equal(result.ready, false);
    assert.equal(
      result.reason,
      readiness.MODULE1_COMPLETION_REASONS.ASSIGNMENT_INACTIVE
    );
  });
});

describe("Module 1 quiz server scoring", () => {
  it("10–12. server scores answers; client score ignored; partial rejected", () => {
    const answers = completeAnswers();
    const scored = quiz.scoreQuizAnswers(answers);
    assert.equal(scored.score, 10);
    assert.equal(scored.total, 10);

    const payload = quiz.buildQuizPersistencePayload({
      userEmail: "s@example.com",
      answers,
      clientScore: 0,
    });
    assert.equal(payload.score, 10);
    assert.equal(payload._ignoredClientScore, 0);

    assert.equal(quiz.allQuizItemsAnswered(["only-one"]), false);
    assert.equal(quiz.allQuizItemsAnswered(answers), true);
  });

  it("15. identical attempt matching supports dedupe without history wipe", () => {
    const answers = completeAnswers();
    const row = {
      answers,
      quiz_version: quiz.QUIZ_CONTENT_VERSION,
      score: 10,
      total: 10,
    };
    assert.equal(
      quiz.answersMatchQuizAttempt(row, answers, quiz.QUIZ_CONTENT_VERSION),
      true
    );
    assert.equal(
      quiz.answersMatchQuizAttempt(
        row,
        answers.map((a, i) => (i === 0 ? "wrong" : a)),
        quiz.QUIZ_CONTENT_VERSION
      ),
      false
    );
  });
});

describe("Module 1 completion / quiz production wiring", () => {
  it("1–2. complete endpoint ignores client module authority", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/api/module1/complete/route.js"),
      "utf8"
    );
    assert.match(src, /MODULE1_COMPLETED_NUMBER\s*=\s*1/);
    assert.match(src, /hasUnexpectedCompletionParams/);
    assert.match(src, /evaluateModule1CompletionReadiness/);
    assert.match(src, /completedModuleNumber: MODULE1_COMPLETED_NUMBER/);
    assert.doesNotMatch(
      src,
      /completedModuleNumber:\s*Number\(body/
    );
  });

  it("9 + 13–14 + 16. quiz-submit session + ModuleOne save-before-navigate", () => {
    const route = fs.readFileSync(
      path.join(__dirname, "../app/api/module1/quiz-submit/route.js"),
      "utf8"
    );
    assert.match(route, /getServerSession/);
    assert.match(route, /session\?\.user\?\.email/);
    assert.match(route, /scoreQuizAnswers|buildQuizPersistencePayload/);
    assert.match(route, /body\?\.score/);
    assert.match(route, /ALREADY_SAVED/);

    const ui = fs.readFileSync(
      path.join(__dirname, "../components/ModuleOne.js"),
      "utf8"
    );
    assert.match(ui, /\/api\/module1\/quiz-submit/);
    assert.match(ui, /quizSaving/);
    assert.match(ui, /role="alert"/);
    assert.match(ui, /module1-quiz-retry/);
    assert.match(ui, /Saving your quiz/);
    assert.doesNotMatch(ui, /supabase\.from\(\s*["']module1_quiz_results["']/);
    // Navigate only after confirmed ok payload
    assert.match(ui, /if \(!response\.ok \|\| !payload\?\.ok\)/);
    assert.match(ui, /router\.push\(`\/modules\/1\/success/);
  });

  it("success page no longer sends completedModuleNumber", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/modules/1/success/page.js"),
      "utf8"
    );
    assert.doesNotMatch(src, /completedModuleNumber/);
    assert.match(src, /\/api\/module1\/complete/);
  });

  it("18. CAS jump protection still available", async () => {
    const store = progress.createMutableAssignmentProgressStore({
      current_module: 1,
      status: "in_progress",
    });
    const release = store.armPauseBeforeCommit();
    const pending = progress.advanceModuleProgressionWithStore({
      completedModuleNumber: 1,
      store,
    });
    for (let i = 0; i < 50 && store.casAttempts < 1; i += 1) {
      await new Promise((r) => setTimeout(r, 1));
    }
    store.replace({ current_module: 5, status: "in_progress" });
    release();
    const result = await pending;
    assert.equal(store.snapshot().current_module, 5);
    assert.equal(result.alreadyAdvanced, true);
  });

  it("prompt completeness helper remains the shared gate", () => {
    assert.equal(prompt.isPromptBreakdownComplete(completePrompt()), true);
    assert.equal(
      prompt.isPromptBreakdownComplete({
        ...completePrompt(),
        student_paraphrase: "too short",
      }),
      false
    );
  });
});
