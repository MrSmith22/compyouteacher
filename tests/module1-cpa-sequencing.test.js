const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const prompt = require("../lib/module1/promptBreakdownHelpers.js");
const quiz = require("../lib/module1/quizHelpers.js");

describe("CP-A Module 1 prompt breakdown sequencing", () => {
  it("advances and backs one step at a time", () => {
    assert.equal(prompt.advancePromptStep(0, "next"), 1);
    assert.equal(prompt.advancePromptStep(1, "back"), 0);
    assert.equal(prompt.advancePromptStep(0, "back"), 0);
    assert.equal(prompt.advancePromptStep(4, "next"), 4);
  });

  it("exposes exactly one dominant question key per stage", () => {
    assert.equal(prompt.PROMPT_STEP_KEYS.length, 5);
    prompt.PROMPT_STEP_KEYS.forEach((key, index) => {
      assert.equal(typeof key, "string");
      assert.equal(prompt.getPromptStepStatusLabel(index).includes(`${index + 1}`), true);
      assert.equal(prompt.getPromptStepStatusLabel(index).includes("of 5"), true);
    });
  });

  it("keeps persistence payload shape compatible", () => {
    const payload = prompt.buildPromptPersistencePayload({
      task_verb: "Compare and contrast",
      task_type: "A compare and contrast essay",
      analysis_focus: "How Dr. King uses rhetorical appeals in two texts",
      required_angle: "Specific evidence from both works",
      student_paraphrase: "Compare how King uses rhetoric in both texts for different audiences.",
      extra_field: "ignored",
    });
    assert.deepEqual(Object.keys(payload).sort(), [
      "analysis_focus",
      "required_angle",
      "student_paraphrase",
      "task_type",
      "task_verb",
    ]);
  });

  it("reloads partial answers without wiping completed fields", () => {
    const partial = prompt.hydratePromptAnswers({
      task_verb: "Compare and contrast",
      task_type: "A compare and contrast essay",
      analysis_focus: "",
      required_angle: null,
    });
    assert.equal(partial.task_verb, "Compare and contrast");
    assert.equal(partial.task_type, "A compare and contrast essay");
    assert.equal(partial.analysis_focus, "");
    assert.equal(partial.required_angle, "");
    assert.equal(partial.student_paraphrase, "");
    assert.equal(prompt.getResumeStepIndex(partial), 2);
  });

  it("enforces paraphrase threshold without generating paraphrase", () => {
    const short = {
      task_verb: "Compare and contrast",
      task_type: "A compare and contrast essay",
      analysis_focus: "How Dr. King uses rhetorical appeals in two texts",
      required_angle: "Specific evidence from both works",
      student_paraphrase: "too short",
    };
    assert.equal(prompt.canAdvanceFromStep(short, 4), false);
    assert.equal(prompt.isPromptBreakdownComplete(short), false);

    const ready = {
      ...short,
      student_paraphrase:
        "Compare and contrast how King uses rhetorical appeals in the speech and letter.",
    };
    assert.ok(ready.student_paraphrase.length >= prompt.PARAPHRASE_MIN_LENGTH);
    assert.equal(prompt.canAdvanceFromStep(ready, 4), true);
    assert.equal(prompt.isPromptBreakdownComplete(ready), true);
  });

  it("documents responsive and accessible status contracts", () => {
    assert.deepEqual(prompt.PROMPT_LAYOUT_CONTRACT.viewports, [320, 390, 768, 1440]);
    assert.equal(prompt.PROMPT_LAYOUT_CONTRACT.oneDominantQuestion, true);
    assert.equal(prompt.PROMPT_LAYOUT_CONTRACT.fullPromptVisible, true);
    assert.equal(prompt.PROMPT_LAYOUT_CONTRACT.noHorizontalOverflow, true);
    assert.match(prompt.getPromptStepStatusLabel(0), /Question 1 of 5/);
  });
});

describe("CP-A Module 1 vocabulary quiz sequencing", () => {
  const sampleQuiz = Array.from({ length: 10 }, (_, i) => ({
    answer: `Answer ${i + 1}`,
  }));

  it("requires every item answered before final submission", () => {
    const partial = quiz.normalizeQuizAnswers(["Answer 1", "Answer 2"]);
    assert.equal(quiz.allQuizItemsAnswered(partial), false);
    assert.equal(quiz.canSubmitQuiz(partial), false);

    const complete = quiz.normalizeQuizAnswers(
      sampleQuiz.map((q) => q.answer)
    );
    assert.equal(quiz.allQuizItemsAnswered(complete), true);
    assert.equal(quiz.canSubmitQuiz(complete), true);
    assert.equal(quiz.canSubmitQuiz(complete, { quizSubmitted: true }), false);
  });

  it("blocks unanswered items from advancing and submitting", () => {
    const answers = quiz.normalizeQuizAnswers([]);
    assert.equal(quiz.canAdvanceQuizItem(answers, 0), false);
    answers[0] = "Answer 1";
    assert.equal(quiz.canAdvanceQuizItem(answers, 0), true);
    assert.equal(quiz.getResumeQuizIndex(answers), 1);
  });

  it("hydrates legacy completed quiz results safely", () => {
    const legacy = quiz.hydrateLegacyQuizResult({
      score: 8,
      total: 10,
      answers: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
    });
    assert.equal(legacy.answers.length, 10);
    assert.equal(legacy.score, 8);
    assert.equal(legacy.total, 10);
    assert.equal(legacy.completed, true);

    const alt = quiz.hydrateLegacyQuizResult({
      raw_answers: ["only-one"],
      score: 1,
      total: 10,
    });
    assert.equal(alt.answers[0], "only-one");
    assert.equal(alt.answers.length, 10);
  });

  it("preserves result storage shape", () => {
    const answers = sampleQuiz.map((q) => q.answer);
    const payload = quiz.buildQuizPersistencePayload({
      userEmail: "student@example.com",
      answers,
      quiz: sampleQuiz,
    });
    assert.equal(payload.user_email, "student@example.com");
    assert.equal(payload.score, 10);
    assert.equal(payload.total, 10);
    assert.deepEqual(payload.answers, answers);
  });

  it("advances one dominant quiz item and exposes accessible status", () => {
    assert.equal(quiz.advanceQuizIndex(0, "next"), 1);
    assert.equal(quiz.advanceQuizIndex(1, "back"), 0);
    assert.match(quiz.getQuizStatusLabel(3), /Question 4 of 10/);
    assert.equal(quiz.QUIZ_LAYOUT_CONTRACT.oneDominantQuestion, true);
    assert.equal(quiz.QUIZ_LAYOUT_CONTRACT.videoSecondary, true);
    assert.equal(quiz.QUIZ_LAYOUT_CONTRACT.requireAccessibleNames, true);
    assert.deepEqual(quiz.QUIZ_LAYOUT_CONTRACT.viewports, [320, 390, 768, 1440]);
  });
});
