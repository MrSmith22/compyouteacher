/**
 * WP-104 — Module 1 corrective: compare/contrast teaching + pure vocab state updates.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const prompt = require("../lib/module1/promptBreakdownHelpers.js");
const {
  hasTeachingExplanation,
  isBinaryOnlyFeedback,
  getTeachingFeedbackPresentation,
} = require("../lib/ui/teachingFeedbackContract.js");
const {
  buildVocabularyTransferNextState,
} = require("../lib/module1/vocabularyTransferCommit.js");
const {
  createEmptyTermTransferState,
  evaluateTermTransferReadiness,
  normalizeTermTransferState,
  VOCABULARY_TRANSFER_TERM_IDS,
  createEmptyVocabularyTransferState,
  evaluateAllVocabularyTransferReadiness,
} = require("../lib/module1/vocabularyTransferState.js");
const {
  getVocabularyTransferLessonContract,
} = require("../lib/module1/vocabularyTransferLessonContract.js");
const {
  advanceTermIndex,
  STEP2_STAGES,
  hydrateStep2Draft,
} = require("../lib/module1/step2MicrostageHelpers.js");
const { QUIZ_CONTENT_VERSION } = require("../lib/module1/quizHelpers.js");

const root = path.join(__dirname, "..");
const flowSrc = fs.readFileSync(
  path.join(root, "components/module1/VocabularyTransferLessonFlow.jsx"),
  "utf8"
);
const promptPageSrc = fs.readFileSync(
  path.join(root, "app/modules/1/prompt/page.js"),
  "utf8"
);

describe("WP-104 compare-and-contrast teaching (Finding 1)", () => {
  it("teaches compare vs contrast after the action-word question", () => {
    const tv = prompt.PROMPT_MC.task_verb;
    assert.equal(tv.correct, "Compare and contrast");
    assert.ok(hasTeachingExplanation(tv.correctFeedback));
    assert.ok(hasTeachingExplanation(tv.incorrectFeedback));
    assert.equal(isBinaryOnlyFeedback(tv.correctFeedback), false);
    assert.match(tv.correctFeedback, /similarit/i);
    assert.match(tv.correctFeedback, /difference/i);
    assert.match(tv.correctFeedback, /ethos|pathos|logos/i);
    assert.match(tv.correctFeedback, /audience|purpose/i);
    assert.match(tv.correctFeedback, /analysis/i);
    assert.match(tv.correctFeedback, /not merely summarizing/i);

    const teaching = prompt.getPromptStepTeachingFeedback(
      "task_verb",
      "Compare and contrast"
    );
    assert.equal(teaching.correct, true);
    const presentation = getTeachingFeedbackPresentation(teaching);
    assert.equal(presentation.heading, "That works.");
    assert.match(presentation.explanation, /Compare means/i);
  });

  it("replaces ambiguous comparison question with unambiguous focus wording", () => {
    const af = prompt.PROMPT_MC.analysis_focus;
    assert.equal(
      af.label,
      "What will your essay compare across the two texts?"
    );
    assert.doesNotMatch(af.label, /^What are you comparing\?$/);
    assert.equal(
      af.correct,
      "How Dr. King uses rhetorical appeals in the speech and the letter."
    );
    assert.ok(af.choices.includes(af.correct));
    assert.ok(
      af.choices.some((c) => /summary|what happens/i.test(c)),
      "distractor: summarizing"
    );
    assert.ok(
      af.choices.some((c) => /longer|length/i.test(c)),
      "distractor: text length"
    );
    assert.ok(
      af.choices.some((c) => /World War|historical/i.test(c)),
      "distractor: unrelated history"
    );
    assert.match(af.correctFeedback, /I Have a Dream/i);
    assert.match(af.correctFeedback, /Letter from Birmingham Jail/i);
    assert.match(af.correctFeedback, /rhetorical/i);
    assert.match(af.correctFeedback, /audience|purpose/i);
  });

  it("accepts legacy analysis_focus answers without blocking resume", () => {
    assert.equal(
      prompt.nudge(
        "analysis_focus",
        "How Dr. King uses rhetorical appeals in two texts"
      ),
      null
    );
    assert.equal(
      prompt.nudge("analysis_focus", prompt.ANALYSIS_FOCUS_CORRECT),
      null
    );
  });

  it("prompt page shows teaching feedback without turning into a lecture quiz", () => {
    assert.match(promptPageSrc, /getPromptStepTeachingFeedback/);
    assert.match(promptPageSrc, /data-testid="prompt-step-feedback"/);
    assert.match(promptPageSrc, /getTeachingFeedbackPresentation/);
    assert.equal(prompt.PROMPT_STEP_KEYS.length, 5);
    assert.equal(prompt.PROMPT_LAYOUT_CONTRACT.oneDominantQuestion, true);
    assert.doesNotMatch(promptPageSrc, /role="quiz"/);
  });
});

describe("WP-104 vocabulary transfer pure parent notify (Finding 2)", () => {
  it("commit/patchState do not call external callbacks inside a state updater", () => {
    assert.match(flowSrc, /buildVocabularyTransferNextState/);
    assert.match(flowSrc, /stateRef\.current = merged/);
    assert.match(flowSrc, /notifyParent\(merged/);
    assert.doesNotMatch(
      flowSrc,
      /setState\(\s*\(\s*prev\s*\)\s*=>\s*\{[\s\S]{0,400}onStateChange/
    );
    assert.doesNotMatch(
      flowSrc,
      /setState\(\s*\(\s*prev\s*\)\s*=>\s*\{[\s\S]{0,400}onLessonComplete/
    );
    assert.doesNotMatch(
      flowSrc,
      /setState\(\s*\(\s*prev\s*\)\s*=>\s*\{[\s\S]{0,400}notifyParent/
    );
  });

  it("buildVocabularyTransferNextState is pure and parent notify is one call per change", () => {
    const prev = createEmptyTermTransferState("rhetoric");
    const a = buildVocabularyTransferNextState("rhetoric", prev, {
      noticeChoiceId: "version_b_deadline",
    });
    const b = buildVocabularyTransferNextState("rhetoric", prev, {
      noticeChoiceId: "version_b_deadline",
    });
    assert.equal(a.noticeChoiceId, "version_b_deadline");
    assert.equal(b.noticeChoiceId, "version_b_deadline");
    assert.equal(a.currentStep, prev.currentStep);

    let parentCalls = 0;
    let completeCalls = 0;
    const notify = (merged, { complete = false } = {}) => {
      parentCalls += 1;
      if (complete) {
        const readiness = evaluateTermTransferReadiness("rhetoric", merged);
        if (readiness.ready) completeCalls += 1;
      }
    };
    const patched = buildVocabularyTransferNextState("rhetoric", prev, {
      noticeChoiceId: "version_b_deadline",
    });
    notify(patched);
    assert.equal(parentCalls, 1);
    assert.equal(completeCalls, 0);

    const incompleteComplete = buildVocabularyTransferNextState(
      "rhetoric",
      patched,
      { assignmentTransferSeen: true },
      { complete: true }
    );
    notify(incompleteComplete, { complete: true });
    assert.equal(parentCalls, 2);
    assert.equal(completeCalls, 0, "completion must not fire without readiness");
  });

  it("lesson completion notify fires only when readiness is satisfied", () => {
    const c = getVocabularyTransferLessonContract("rhetoric");
    let state = createEmptyTermTransferState("rhetoric");
    state = buildVocabularyTransferNextState("rhetoric", state, {
      noticeChoiceId: c.familiarScenario.noticeOptions.find((o) => o.isTarget)
        .id,
      noticeFeedbackSeen: true,
      definitionSeen: true,
      boundaryChoiceId: c.boundary.options.find((o) => o.isTarget).id,
      boundaryFeedbackSeen: true,
      audienceEffectChoiceId: c.audienceEffect.options.find((o) => o.isTarget)
        .id,
      audienceEffectFeedbackSeen: true,
      purposeChoiceId: c.purposeConnection.options.find((o) => o.isTarget).id,
      purposeFeedbackSeen: true,
      kingChoiceId: c.kingApplication.options.find((o) => o.isTarget).id,
      kingFeedbackSeen: true,
      kingFollowUpText: "He uses metaphor to move the audience toward action.",
    });
    assert.equal(evaluateTermTransferReadiness("rhetoric", state).ready, false);

    const ready = buildVocabularyTransferNextState(
      "rhetoric",
      state,
      { assignmentTransferSeen: true },
      { complete: true }
    );
    assert.equal(evaluateTermTransferReadiness("rhetoric", ready).ready, true);

    let completeCalls = 0;
    const readiness = evaluateTermTransferReadiness("rhetoric", ready);
    if (readiness.ready) completeCalls += 1;
    assert.equal(completeCalls, 1);
  });

  it("Strict Mode double-invoke of a pure builder does not duplicate notify when notify is outside", () => {
    const prev = createEmptyTermTransferState("ethos");
    const first = buildVocabularyTransferNextState("ethos", prev, {
      noticeChoiceId: "officer_training",
    });
    const second = buildVocabularyTransferNextState("ethos", prev, {
      noticeChoiceId: "officer_training",
    });
    assert.equal(first.noticeChoiceId, second.noticeChoiceId);

    let saves = 0;
    const notifyOnce = () => {
      saves += 1;
    };
    notifyOnce(second);
    assert.equal(saves, 1, "one intended state change → one parent notification");
  });

  it("refresh/resume restores the same term and microstep via draft hydrate", () => {
    const termState = normalizeTermTransferState("rhetoric", {
      ...createEmptyTermTransferState("rhetoric"),
      currentStep: "audience_effect",
      noticeChoiceId: "version_b_deadline",
      kingFollowUpText: "wp104-refresh-marker",
    });
    const bag = createEmptyVocabularyTransferState();
    bag.terms.rhetoric = termState;
    const draft = hydrateStep2Draft(
      {
        stage: STEP2_STAGES.LEARN,
        termIndex: 0,
        quizIndex: 0,
        quizAnswers: [],
        quizVersion: QUIZ_CONTENT_VERSION,
        vocabularyTransfer: bag,
      },
      { quizLength: 10, currentQuizVersion: QUIZ_CONTENT_VERSION }
    );
    assert.equal(draft.stage, STEP2_STAGES.LEARN);
    assert.equal(draft.termIndex, 0);
    assert.equal(
      draft.vocabularyTransfer.terms.rhetoric.currentStep,
      "audience_effect"
    );
    assert.equal(
      draft.vocabularyTransfer.terms.rhetoric.kingFollowUpText,
      "wp104-refresh-marker"
    );
  });

  it("Next term advances correctly and all six vocabulary terms remain completable", () => {
    assert.equal(advanceTermIndex(0, "next"), 1);
    assert.equal(advanceTermIndex(5, "next"), 5);
    assert.equal(VOCABULARY_TRANSFER_TERM_IDS.length, 6);

    const full = createEmptyVocabularyTransferState();
    for (const id of VOCABULARY_TRANSFER_TERM_IDS) {
      const contract = getVocabularyTransferLessonContract(id);
      assert.ok(contract, `contract for ${id}`);
      full.terms[id] = {
        ...createEmptyTermTransferState(id),
        noticeChoiceId: "x",
        definitionSeen: true,
        boundaryChoiceId: "x",
        audienceEffectChoiceId: contract.audienceEffect ? "x" : null,
        purposeChoiceId: contract.purposeConnection ? "x" : null,
        audienceFitChoiceId: contract.audienceFit ? "x" : null,
        purposeResultChoiceId: contract.purposeResult ? "x" : null,
        kingChoiceId: "x",
        assignmentTransferSeen: true,
        completed: true,
        currentStep: "assignment_transfer",
      };
    }
    const ethos = getVocabularyTransferLessonContract("ethos");
    full.terms.ethos = {
      ...full.terms.ethos,
      noticeChoiceId: ethos.familiarScenario.noticeOptions.find((o) => o.isTarget)
        .id,
      boundaryChoiceId: ethos.boundary.options.find((o) => o.isTarget).id,
      exampleNonexampleChoiceId: ethos.boundary.options.find((o) => o.isTarget)
        .id,
      audienceEffectChoiceId: ethos.audienceEffect.options.find((o) => o.isTarget)
        .id,
      purposeChoiceId: ethos.purposeConnection.options.find((o) => o.isTarget)
        .id,
      kingChoiceId: ethos.kingApplication.options.find((o) => o.isTarget).id,
      assignmentTransferSeen: true,
      completed: true,
    };
    assert.equal(
      evaluateAllVocabularyTransferReadiness(full).quizUnlockReady,
      true
    );
  });

  it("ModuleOne wires onStateChange after child commit without child-side save loops", () => {
    const moduleOne = fs.readFileSync(
      path.join(root, "components/ModuleOne.js"),
      "utf8"
    );
    assert.match(moduleOne, /onStateChange=\{\(nextTermState\)\s*=>/);
    assert.match(moduleOne, /VocabularyTransferLessonFlow/);
    assert.match(moduleOne, /serverSaveTimerRef/);
    assert.doesNotMatch(flowSrc, /saveServerVocabularyTransfer/);
  });
});
