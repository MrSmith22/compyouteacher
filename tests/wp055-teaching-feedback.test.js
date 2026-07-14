/**
 * WP-055 — Teaching feedback (not binary Correct/Incorrect).
 *
 * Audit matrix + Module 1 content-model/UI proofs. Module 3 is excluded.
 * Operational errors are classified separately and are not rewritten as lessons.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  MODULE1_QUIZ_V2,
  QUIZ_CONTENT_VERSION,
  QUIZ_ITEM_COUNT,
  buildQuizPersistencePayload,
  getActiveQuiz,
  getModule1QuizTeachingExplanation,
  scoreQuizAnswers,
} from "../lib/module1/quizHelpers.js";
import { FORMATIVE_QUESTIONS } from "../lib/module2/rhetoricalSituationLesson.js";
import {
  MODULE9_APA_CONCEPTS,
  advanceApaConcept,
  recordApaAttempt,
  buildEmptyApaLessonState,
  canContinueApaConcept,
} from "../lib/module9/module9ApaLearning.js";
import {
  TEACHING_FEEDBACK_HEADINGS,
  getTeachingFeedbackPresentation,
  hasTeachingExplanation,
  isBinaryOnlyFeedback,
} from "../lib/ui/teachingFeedbackContract.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

/**
 * App-wide feedback audit (clean Modules 1–2 and 4–9).
 * Teaching requirement applies to instructional correctness & formative validation.
 */
export const WP055_FEEDBACK_AUDIT_MATRIX = Object.freeze([
  {
    id: "m1-quiz-active",
    module: 1,
    surface: "ModuleOne quiz (MODULE1_QUIZ_V2)",
    classification: "instructional correct/incorrect answer feedback",
    mounting: "active",
    wp055Action: "repaired — correctFeedback/incorrectFeedback + teaching UI",
  },
  {
    id: "m2-rhetorical-lesson",
    module: 2,
    surface: "lib/module2/rhetoricalSituationLesson FORMATIVE_QUESTIONS",
    classification: "instructional correct/incorrect answer feedback",
    mounting: "active",
    wp055Action: "preserve — already has substantive correctFeedback/incorrectFeedback",
  },
  {
    id: "m4-8-quizzes",
    module: "4–8",
    surface: "No comparable instructional quiz answer-evaluation",
    classification: "n/a — no active binary quiz feedback",
    mounting: "none found",
    wp055Action: "none",
  },
  {
    id: "m6-review-length-chip",
    module: 6,
    surface: 'ModuleSix review "Empty or too short" / "Has prose"',
    classification: "formative validation/coaching (length readiness chip)",
    mounting: "active",
    wp055Action:
      "leave — status of prose readiness, not academic-answer judgment",
  },
  {
    id: "m6-9-network-errors",
    module: "6–9",
    surface: "Save/load/upload/Google Doc recovery strings with Try again",
    classification: "operational error/retry message",
    mounting: "active",
    wp055Action: "exclude — actionable recovery, not instructional feedback",
  },
  {
    id: "m9-apa-lesson",
    module: 9,
    surface: "ModuleNineApaLesson + MODULE9_APA_CONCEPTS option.feedback",
    classification: "instructional correct/incorrect answer feedback",
    mounting: "active",
    wp055Action: "preserve WP-038–040 — per-option teaching + That works./Let’s look closer.",
  },
  {
    id: "m9-submission",
    module: 9,
    surface: "PDF upload / submission verification panels",
    classification: "submission verification/recovery",
    mounting: "active",
    wp055Action: "exclude from teaching rewrite",
  },
  {
    id: "dormant-module-system",
    module: 1,
    surface: "components/ModuleSystem.js",
    classification: "dormant/unmounted code (legacy binary Correct/Incorrect)",
    mounting: "dormant — not imported by routes",
    wp055Action: "do not modify; active route uses ModuleOne",
  },
  {
    id: "m3-excluded",
    module: 3,
    surface: "Module 3 evaluation (paused dirty work)",
    classification: "out of scope",
    mounting: "excluded",
    wp055Action: "no WP-055 edits",
  },
]);

/** Identity baseline from pre-WP-055 HEAD — questions/options/answers/order frozen. */
const MODULE1_QUIZ_IDENTITY_BASELINE = Object.freeze([
  {
    id: "rhetoric_definition",
    question: "What does the term rhetoric mean?",
    options: [
      "The ability to speak loudly and clearly",
      "The art of effective and persuasive writing and speaking",
      "The process of writing fictional stories",
      "The study of ancient Greek literature only",
    ],
    answer: "The art of effective and persuasive writing and speaking",
  },
  {
    id: "ethos_definition",
    question: "Which of the following best describes ethos?",
    options: [
      "Making the audience laugh to build interest",
      "Appealing to the audience’s emotions",
      "Presenting strong data and facts",
      "Establishing credibility and trustworthiness",
    ],
    answer: "Establishing credibility and trustworthiness",
  },
  {
    id: "ethos_recognition",
    question:
      "A chef on a cooking show who wears a professional uniform and describes their years of experience is using which rhetorical strategy?",
    options: ["Pathos", "Logos", "Ethos", "Satire"],
    answer: "Ethos",
  },
  {
    id: "pathos_definition",
    question: "Which of these is an example of pathos?",
    options: [
      "Explaining how a law works in logical steps",
      "Sharing a touching story about a sick puppy to encourage donations",
      "Listing your degrees and awards in a speech",
      "Quoting historical data to support your point",
    ],
    answer:
      "Sharing a touching story about a sick puppy to encourage donations",
  },
  {
    id: "pathos_application",
    question: "Why is pathos often effective in persuasion?",
    options: [
      "It is based only on historical facts",
      "It appeals only to the audience’s trust in credentials",
      "It connects to emotion and can create urgency",
      "It shows the speaker’s degrees and awards",
    ],
    answer: "It connects to emotion and can create urgency",
  },
  {
    id: "logos_definition",
    question: "What does logos focus on when trying to persuade an audience?",
    options: [
      "Trust and reputation",
      "Humor and sarcasm",
      "Clear evidence and logical reasoning",
      "Feelings and empathy",
    ],
    answer: "Clear evidence and logical reasoning",
  },
  {
    id: "logos_recognition",
    question:
      "A dentist shows patients a study on sugar and tooth decay. This is an example of which rhetorical strategy?",
    options: ["Logos", "Ethos", "Pathos", "Irony"],
    answer: "Logos",
  },
  {
    id: "audience_definition",
    question: "In this assignment, what does audience mean?",
    options: [
      "Anyone who has ever read a book",
      "The people a writer or speaker is trying to reach and persuade",
      "Only the teacher who grades the essay",
      "The dictionary definition of every word in the text",
    ],
    answer: "The people a writer or speaker is trying to reach and persuade",
  },
  {
    id: "purpose_definition",
    question: "What does purpose mean when analyzing a text?",
    options: [
      "The length of the text",
      "What the writer or speaker wants the audience to understand, believe, or do",
      "The publisher’s print schedule",
      "Whether the text uses long or short sentences",
    ],
    answer:
      "What the writer or speaker wants the audience to understand, believe, or do",
  },
  {
    id: "king_application",
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
  },
]);

describe("WP-055 teaching-feedback contract helpers", () => {
  it("rejects binary-only labels", () => {
    for (const label of [
      "Correct",
      "Incorrect",
      "Right",
      "Wrong",
      "Yes",
      "No",
      "Try again",
      "Good job",
    ]) {
      assert.equal(isBinaryOnlyFeedback(label), true, label);
      assert.equal(hasTeachingExplanation(label), false, label);
    }
  });

  it("accepts substantive explanations (even with Correct. prefix)", () => {
    const text =
      "Correct. Ethos builds trust so the audience believes the writer is credible.";
    assert.equal(isBinaryOnlyFeedback(text), false);
    assert.equal(hasTeachingExplanation(text), true);
  });

  it("presents That works. / Let’s look closer. headings", () => {
    const ok = getTeachingFeedbackPresentation({
      correct: true,
      explanation: "A full teaching sentence about ethos.",
    });
    const miss = getTeachingFeedbackPresentation({
      correct: false,
      explanation: "A full teaching sentence about the distinction.",
    });
    assert.equal(ok.heading, TEACHING_FEEDBACK_HEADINGS.correct);
    assert.equal(miss.heading, TEACHING_FEEDBACK_HEADINGS.incorrect);
    assert.equal(ok.heading, "That works.");
    assert.equal(miss.heading, "Let’s look closer.");
  });
});

describe("WP-055 audit matrix", () => {
  it("documents active vs dormant surfaces and operational exclusions", () => {
    assert.ok(WP055_FEEDBACK_AUDIT_MATRIX.length >= 8);
    const dormant = WP055_FEEDBACK_AUDIT_MATRIX.find(
      (r) => r.id === "dormant-module-system"
    );
    assert.ok(dormant);
    assert.match(dormant.mounting, /dormant/i);
    const ops = WP055_FEEDBACK_AUDIT_MATRIX.find(
      (r) => r.id === "m6-9-network-errors"
    );
    assert.equal(ops.classification, "operational error/retry message");
    assert.match(ops.wp055Action, /exclude/i);
  });

  it("does not rewrite operational Try again as academic feedback", () => {
    const m6 = readSrc("lib/module6/module6SuccessHelpers.js");
    assert.match(m6, /Try again/);
    assert.ok(
      WP055_FEEDBACK_AUDIT_MATRIX.some(
        (r) =>
          r.classification.includes("operational") &&
          /exclude/i.test(r.wp055Action)
      )
    );
  });
});

describe("WP-055 Module 1 quiz teaching content", () => {
  it("1–3. every item has substantive correct and incorrect teaching feedback", () => {
    assert.equal(MODULE1_QUIZ_V2.length, QUIZ_ITEM_COUNT);
    for (const item of MODULE1_QUIZ_V2) {
      assert.ok(
        hasTeachingExplanation(item.correctFeedback),
        `${item.id} correctFeedback`
      );
      assert.ok(
        hasTeachingExplanation(item.incorrectFeedback),
        `${item.id} incorrectFeedback`
      );
      assert.equal(isBinaryOnlyFeedback(item.correctFeedback), false);
      assert.equal(isBinaryOnlyFeedback(item.incorrectFeedback), false);
      assert.equal(
        getModule1QuizTeachingExplanation(item, true),
        item.correctFeedback
      );
      assert.equal(
        getModule1QuizTeachingExplanation(item, false),
        item.incorrectFeedback
      );
    }
  });

  it("4. question, options, answers, order, quiz version, and scoring unchanged", () => {
    assert.equal(QUIZ_CONTENT_VERSION, 2);
    assert.equal(getActiveQuiz(), MODULE1_QUIZ_V2);
    assert.deepEqual(
      MODULE1_QUIZ_V2.map((q) => ({
        id: q.id,
        question: q.question,
        options: [...q.options],
        answer: q.answer,
      })),
      MODULE1_QUIZ_IDENTITY_BASELINE
    );

    const allCorrect = MODULE1_QUIZ_V2.map((q) => q.answer);
    const scored = scoreQuizAnswers(allCorrect);
    assert.equal(scored.score, QUIZ_ITEM_COUNT);
    assert.equal(scored.total, QUIZ_ITEM_COUNT);
    assert.equal(scored.percent, 100);

    const oneWrong = [...allCorrect];
    oneWrong[0] = MODULE1_QUIZ_V2[0].options.find((o) => o !== MODULE1_QUIZ_V2[0].answer);
    const scoredWrong = scoreQuizAnswers(oneWrong);
    assert.equal(scoredWrong.score, QUIZ_ITEM_COUNT - 1);

    const payload = buildQuizPersistencePayload({
      userEmail: "student@example.com",
      answers: allCorrect,
      quizVersion: QUIZ_CONTENT_VERSION,
    });
    assert.ok(Array.isArray(payload.answers));
    assert.equal(payload.answers.length, QUIZ_ITEM_COUNT);
    assert.equal(payload.quiz_version, 2);
    assert.equal(payload.score, QUIZ_ITEM_COUNT);
    assert.equal(payload.total, QUIZ_ITEM_COUNT);
  });
});

describe("WP-055 Module 1 teaching UI presentation", () => {
  const moduleOne = () => readSrc("components/ModuleOne.js");

  it("5–8. That works. / Let’s look closer., status/live, not color-only", () => {
    const src = moduleOne();
    assert.match(src, /getTeachingFeedbackPresentation/);
    assert.match(src, /getModule1QuizTeachingExplanation/);
    assert.match(src, /That works\.|TEACHING_FEEDBACK_HEADINGS|activeTeaching\.heading/);
    assert.match(src, /data-testid="quiz-item-feedback"/);
    assert.match(src, /data-feedback-correct=/);
    assert.match(src, /role="status"/);
    assert.match(src, /aria-live="polite"/);
    assert.doesNotMatch(src, />\{\s*isQuizCorrect\([^)]+\)\s*\?\s*"Correct"\s*:\s*"Incorrect"\s*\}/);
    assert.doesNotMatch(src, /text-green-600[\s\S]{0,80}Correct/);
    assert.doesNotMatch(src, /text-red-600[\s\S]{0,80}Incorrect/);
  });

  it("9. answer change and Back/Next restore feedback from correctness + explanation", () => {
    const src = moduleOne();
    assert.match(src, /setItemFeedback/);
    assert.match(src, /advanceQuizIndex/);
    // Teaching block derives from active answer correctness + item explanation.
    assert.match(src, /showQuizTeachingFeedback/);
    assert.match(src, /activeTeaching/);
  });

  it("10. quiz submit/persistence still use score helpers (unchanged contract)", () => {
    const src = moduleOne();
    assert.match(src, /canSubmitQuiz|buildQuizPersistencePayload|QUIZ_CONTENT_VERSION/);
    const welcome = readSrc("tests/module1-completion-integrity.test.js");
    assert.match(welcome, /scoreQuizAnswers|buildQuizPersistencePayload/);
  });

  it("15. active Module 1 route mounts ModuleOne, not dormant ModuleSystem", () => {
    const page = readSrc("app/modules/1/page.js");
    assert.match(page, /from ["']@\/components\/ModuleOne["']/);
    assert.doesNotMatch(page, /ModuleSystem/);
    const modulesIndex = readSrc("app/modules/page.js");
    assert.doesNotMatch(modulesIndex, /ModuleSystem/);
    const imports = [
      "app/modules/1/page.js",
      "app/modules/page.js",
      "components/ModuleOne.js",
    ]
      .map(readSrc)
      .join("\n");
    assert.doesNotMatch(imports, /from ["']@\/components\/ModuleSystem["']/);
    assert.doesNotMatch(imports, /from ["']\.\.\/ModuleSystem["']/);
  });

  it("16. no Module 3 file is part of the WP-055 product sources under test", () => {
    const productPaths = [
      "components/ModuleOne.js",
      "lib/module1/quizHelpers.js",
      "lib/ui/teachingFeedbackContract.js",
    ];
    for (const p of productPaths) {
      assert.doesNotMatch(p, /module3|ModuleThree/i);
      assert.ok(readSrc(p).length > 0);
    }
  });
});

describe("WP-055 Module 2 already-compliant teaching feedback", () => {
  it("11. every active rhetorical question has substantive correct and incorrect feedback", () => {
    assert.ok(FORMATIVE_QUESTIONS.length >= 5);
    for (const q of FORMATIVE_QUESTIONS) {
      assert.ok(
        hasTeachingExplanation(q.correctFeedback),
        `${q.id} correctFeedback`
      );
      assert.ok(
        hasTeachingExplanation(q.incorrectFeedback),
        `${q.id} incorrectFeedback`
      );
      assert.equal(isBinaryOnlyFeedback(q.correctFeedback), false);
      assert.equal(isBinaryOnlyFeedback(q.incorrectFeedback), false);
    }
  });
});

describe("WP-055 Module 9 APA teaching feedback preserved", () => {
  it("12. per-option teaching feedback; rejects binary-only copy", () => {
    for (const concept of MODULE9_APA_CONCEPTS) {
      assert.ok(concept.options.length >= 2);
      for (const option of concept.options) {
        assert.ok(
          hasTeachingExplanation(option.feedback),
          `${concept.id}/${option.id}`
        );
        assert.equal(isBinaryOnlyFeedback(option.feedback), false);
      }
      const correct = concept.options.filter((o) => o.correct);
      const incorrect = concept.options.filter((o) => !o.correct);
      assert.equal(correct.length, 1);
      assert.ok(incorrect.length >= 1);
    }
    const lesson = readSrc("components/module9/ModuleNineApaLesson.jsx");
    assert.match(lesson, /That works\./);
    assert.match(lesson, /Let’s look closer\./);
    assert.match(lesson, /data-testid="module9-apa-feedback"/);
    assert.match(lesson, /data-feedback-correct=/);
  });

  it("13. incorrect Module 9 answers still permit continuation after feedback", () => {
    const concept = MODULE9_APA_CONCEPTS[0];
    const wrong = concept.options.find((o) => !o.correct);
    let state = buildEmptyApaLessonState();
    state = recordApaAttempt(state, concept.id, wrong.id);
    assert.equal(state.responses[concept.id].feedbackSeen, true);
    assert.equal(state.responses[concept.id].firstAttemptCorrect, false);
    assert.equal(canContinueApaConcept(state, concept.id), true);
    const advanced = advanceApaConcept(state);
    assert.equal(advanced.conceptIndex, 1);
    const lesson = readSrc("components/module9/ModuleNineApaLesson.jsx");
    assert.match(lesson, /continue after you[\s\S]*learn from it/i);
  });
});

describe("WP-055 dormant ModuleSystem untouched as active implementation", () => {
  it("15. ModuleSystem remains dormant binary legacy; not WP-055 source", () => {
    const dormant = readSrc("components/ModuleSystem.js");
    assert.match(dormant, /Correct|Incorrect/);
    // Prove WP-055 product files do not re-export or import it.
    const contract = readSrc("lib/ui/teachingFeedbackContract.js");
    assert.doesNotMatch(contract, /ModuleSystem/);
    const helpers = readSrc("lib/module1/quizHelpers.js");
    assert.doesNotMatch(helpers, /ModuleSystem/);
  });
});
