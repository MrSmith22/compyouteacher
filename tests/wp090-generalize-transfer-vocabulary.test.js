/**
 * WP-090 — Generalized transfer vocabulary across all six Module 1 concepts.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  VOCABULARY_TRANSFER_TERM_IDS,
  VOCABULARY_TRANSFER_PASSAGES,
  SHARED_ANALYTICAL_ANCHOR,
  listVocabularyTransferLessonContracts,
  getVocabularyTransferLessonContract,
  vocabularyTransferStepIndex,
} from "../lib/module1/vocabularyTransferLessonContract.js";
import {
  createEmptyVocabularyTransferState,
  normalizeVocabularyTransferState,
  migrateEthosV1ToTermState,
  evaluateTermTransferReadiness,
  evaluateAllVocabularyTransferReadiness,
  applyParaphraseSignatureToTermState,
  termStateToEthosV1,
} from "../lib/module1/vocabularyTransferState.js";
import {
  createEmptyEthosTransferState,
  getEthosTransferLessonContract,
  ETHOS_TRANSFER_STEPS,
} from "../lib/module1/ethosTransferLessonContract.js";
import {
  isVocabularyTransferLessonDevEnabled,
  isVocabularyTransferLessonEnabled,
  isKnownVocabularyTransferTermId,
} from "../lib/dev/isVocabularyTransferLessonEnabled.js";
import { isEthosTransferLessonEnabled } from "../lib/dev/isEthosTransferLessonEnabled.js";
import { VOCABULARY_TERMS } from "../lib/module1/vocabularyTermHelpers.js";
import { QUIZ_CONTENT_VERSION, getActiveQuiz } from "../lib/module1/quizHelpers.js";
import { hydrateStep2Draft, STEP2_STAGES } from "../lib/module1/step2MicrostageHelpers.js";
import {
  resolveAssignmentInterpretationCarryForward,
} from "../lib/module1/assignmentInterpretationCarryForward.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const FORBIDDEN = Object.freeze([
  "schemaVersion",
  "WP-090",
  "localStorage",
  "NODE_ENV",
  "vertical slice",
  "microstep",
]);

test("WP-090 covers exactly six canonical terms in order", () => {
  assert.deepEqual(
    [...VOCABULARY_TRANSFER_TERM_IDS],
    ["rhetoric", "ethos", "pathos", "logos", "audience", "purpose"]
  );
  assert.deepEqual(
    VOCABULARY_TERMS.map((t) => t.id),
    [...VOCABULARY_TRANSFER_TERM_IDS]
  );
  const contracts = listVocabularyTransferLessonContracts();
  assert.equal(contracts.length, 6);
  assert.deepEqual(
    contracts.map((c) => c.role),
    ["umbrella", "appeal", "appeal", "appeal", "situation", "goal"]
  );
});

test("WP-090 every lesson begins with notice before name/definition", () => {
  for (const contract of listVocabularyTransferLessonContracts()) {
    assert.equal(contract.stepIds[0], "notice");
    assert.ok(vocabularyTransferStepIndex(contract.termId, "notice") < vocabularyTransferStepIndex(contract.termId, "name_boundary"));
    assert.doesNotMatch(contract.familiarScenario.noticePrompt, new RegExp(`\\b${contract.studentFacingName}\\b`, "i"));
  }
});

test("WP-090 every lesson connects choice, audience fit/effect, and purpose appropriately", () => {
  for (const contract of listVocabularyTransferLessonContracts()) {
    assert.ok(contract.familiarScenario.communicationChoice);
    assert.match(SHARED_ANALYTICAL_ANCHOR.label, /choice/i);
    assert.match(SHARED_ANALYTICAL_ANCHOR.label, /audience/i);
    assert.match(SHARED_ANALYTICAL_ANCHOR.label, /purpose/i);
    if (contract.role === "situation") {
      assert.ok(contract.audienceFit);
      assert.ok(contract.stepIds.includes("audience_fit"));
    } else if (contract.role === "goal") {
      assert.ok(contract.purposeResult);
      assert.ok(contract.stepIds.includes("purpose_result"));
      assert.ok(Array.isArray(contract.conceptMap) && contract.conceptMap.length === 6);
    } else {
      assert.ok(contract.audienceEffect);
      assert.ok(contract.purposeConnection);
    }
  }
});

test("WP-090 every lesson includes a concept-appropriate boundary task", () => {
  for (const contract of listVocabularyTransferLessonContracts()) {
    assert.ok(contract.boundary?.options?.length >= 2);
    assert.ok(contract.boundary.options.some((o) => o.isTarget));
    assert.ok(contract.boundary.options.some((o) => !o.isTarget));
  }
});

test("WP-090 rhetoric preserves the umbrella relationship", () => {
  const rhetoric = getVocabularyTransferLessonContract("rhetoric");
  const target = rhetoric.boundary.options.find((o) => o.isTarget);
  assert.match(target.label, /umbrella/i);
  assert.match(target.label, /ethos/i);
  assert.match(target.explanation, /larger category|umbrella/i);
});

test("WP-090 ethos preserves accepted WP-089 behavior", () => {
  const legacy = getEthosTransferLessonContract();
  const generalized = getVocabularyTransferLessonContract("ethos");
  assert.deepEqual([...generalized.stepIds], [...ETHOS_TRANSFER_STEPS]);
  assert.equal(generalized.kingPassage.quotation, legacy.kingPassage.quotation);
  assert.equal(generalized.definition.academic, legacy.definition.academic);
  assert.equal(
    generalized.familiarScenario.noticeOptions[0].id,
    legacy.familiarScenario.noticeOptions[0].id
  );
});

test("WP-090 pathos distinguishes purposeful emotional appeal", () => {
  const pathos = getVocabularyTransferLessonContract("pathos");
  const non = pathos.boundary.options.find((o) => !o.isTarget);
  assert.match(non.explanation, /not automatically pathos|purposeful|feeling/i);
  assert.match(pathos.audienceEffect.uncertaintyCue, /may|could|not everyone/i);
});

test("WP-090 logos requires connected reasoning, not a random fact", () => {
  const logos = getVocabularyTransferLessonContract("logos");
  const non = logos.boundary.options.find((o) => !o.isTarget);
  assert.match(non.label + non.explanation, /statistic|connection|pathos/i);
  const auto = logos.audienceEffect.options.find((o) => /automatically proves/i.test(o.label));
  assert.equal(auto?.isTarget, false);
});

test("WP-090 audience remains distinct from purpose/topic", () => {
  const audience = getVocabularyTransferLessonContract("audience");
  const non = audience.boundary.options.find((o) => !o.isTarget);
  assert.match(non.label, /topic|everyone|purpose/i);
});

test("WP-090 purpose names an intended audience result", () => {
  const purpose = getVocabularyTransferLessonContract("purpose");
  const target = purpose.purposeResult.options.find((o) => o.isTarget);
  assert.match(target.label, /bin|today|action|result/i);
  const vague = purpose.purposeResult.options.find((o) => !o.isTarget);
  assert.match(vague.label, /inform|vague/i);
});

test("WP-090 every King passage has source metadata and verification evidence", () => {
  const assignmentSrc = fs.readFileSync(
    path.join(root, "lib/assignments/mlkRhetoricalAnalysis.ts"),
    "utf8"
  );
  for (const id of VOCABULARY_TRANSFER_TERM_IDS) {
    const passage = VOCABULARY_TRANSFER_PASSAGES[id];
    assert.ok(passage.sourceId);
    assert.ok(passage.guidedPassageId);
    assert.ok(passage.quotation.length > 20);
    assert.match(assignmentSrc, new RegExp(`id:\\s*"${passage.guidedPassageId}"`));
    assert.ok(
      assignmentSrc.includes(passage.verifyNeedle || passage.quotation) ||
        assignmentSrc.includes(passage.quotation.replace(/"/g, '\\"')),
      `${id} quotation must match assignment source`
    );
  }
});

test("WP-090 every King task requires transfer, not definition recall", () => {
  for (const contract of listVocabularyTransferLessonContracts()) {
    assert.equal(contract.kingApplication.requiresTransferNotDefinition, true);
    assert.doesNotMatch(contract.kingApplication.prompt, /what does .* mean/i);
  }
});

test("WP-090 feedback teaches target and non-target choices", () => {
  for (const contract of listVocabularyTransferLessonContracts()) {
    assert.match(contract.teachingFeedback.headings.correct, /That works/);
    for (const opt of [
      ...contract.familiarScenario.noticeOptions,
      ...contract.boundary.options,
      ...(contract.audienceEffect?.options || []),
      ...(contract.purposeConnection?.options || []),
      ...(contract.audienceFit?.options || []),
      ...(contract.purposeResult?.options || []),
      ...contract.kingApplication.options,
    ]) {
      assert.ok(opt.explanation && opt.explanation.length > 15, `${contract.termId}:${opt.id}`);
    }
  }
});

test("WP-090 assignment paraphrase carries forward without overwrite", () => {
  const student = "My own paraphrase about King.";
  const resolved = resolveAssignmentInterpretationCarryForward({
    studentParaphrase: student,
  });
  assert.equal(resolved.text, student);
  assert.equal(resolved.isFallback, false);
});

test("WP-090 concept-specific transfer statements are not duplicated boilerplate", () => {
  const statements = listVocabularyTransferLessonContracts().map(
    (c) => c.assignmentTransfer.transferStatement
  );
  const unique = new Set(statements);
  assert.equal(unique.size, statements.length);
});

test("WP-090 generalized state round-trips for all terms", () => {
  const empty = createEmptyVocabularyTransferState();
  for (const id of VOCABULARY_TRANSFER_TERM_IDS) {
    empty.terms[id].noticeChoiceId = `n-${id}`;
    empty.terms[id].currentStep = "king_apply";
    empty.terms[id].kingFollowUpText = `follow-${id}`;
  }
  const round = normalizeVocabularyTransferState(empty);
  for (const id of VOCABULARY_TRANSFER_TERM_IDS) {
    assert.equal(round.terms[id].noticeChoiceId, `n-${id}`);
    assert.equal(round.terms[id].kingFollowUpText, `follow-${id}`);
  }
  const draft = hydrateStep2Draft(
    {
      stage: STEP2_STAGES.LEARN,
      termIndex: 2,
      quizIndex: 0,
      quizAnswers: Array.from({ length: 10 }, () => ""),
      quizVersion: QUIZ_CONTENT_VERSION,
      vocabularyTransfer: round,
    },
    { quizLength: 10, currentQuizVersion: QUIZ_CONTENT_VERSION }
  );
  assert.equal(draft.termIndex, 2);
  assert.equal(draft.vocabularyTransfer.terms.pathos.kingFollowUpText, "follow-pathos");
});

test("WP-090 WP-089 ethos schema-v1 migration is lossless", () => {
  const legacy = createEmptyEthosTransferState();
  legacy.currentStep = "king_apply";
  legacy.noticeChoiceId = "officer_training";
  legacy.exampleNonexampleChoiceId = "example_credibility";
  legacy.audienceEffectChoiceId = "more_willing_to_trust";
  legacy.purposeChoiceId = "trust_supports_safety";
  legacy.kingChoiceId = "shared_national_authority";
  legacy.kingFollowUpText = "legacy-v1-restore-marker";
  legacy.noticeFeedbackSeen = true;
  legacy.definitionSeen = true;
  legacy.exampleNonexampleFeedbackSeen = true;

  const migrated = migrateEthosV1ToTermState(legacy);
  assert.equal(migrated.currentStep, "king_apply");
  assert.equal(migrated.boundaryChoiceId, "example_credibility");
  assert.equal(migrated.kingFollowUpText, "legacy-v1-restore-marker");

  const bag = normalizeVocabularyTransferState(
    createEmptyVocabularyTransferState(),
    legacy
  );
  assert.equal(bag.terms.ethos.kingFollowUpText, "legacy-v1-restore-marker");
  assert.equal(bag.terms.ethos.boundaryChoiceId, "example_credibility");

  const back = termStateToEthosV1(bag.terms.ethos);
  assert.equal(back.kingFollowUpText, "legacy-v1-restore-marker");
  assert.equal(back.exampleNonexampleChoiceId, "example_credibility");
});

test("WP-090 paraphrase changes preserve lesson responses and mark transfer review", () => {
  const state = migrateEthosV1ToTermState({
    ...createEmptyEthosTransferState(),
    noticeChoiceId: "officer_training",
    promptInterpretationSignature: "p:1:1",
  });
  const next = applyParaphraseSignatureToTermState(state, "A brand new paraphrase text");
  assert.equal(next.noticeChoiceId, "officer_training");
  assert.equal(next.promptInterpretationNeedsReview, true);
});

test("WP-090 no selection/character/timer auto-advance in shared flow", () => {
  const src = fs.readFileSync(
    path.join(root, "components/module1/VocabularyTransferLessonFlow.jsx"),
    "utf8"
  );
  assert.match(src, /continueDisabled=\{!pendingFeedback\}/);
  assert.doesNotMatch(src, /setTimeout\s*\(/);
});

test("WP-090 quiz remains gated until six completions; policy/ids persist", () => {
  const partial = createEmptyVocabularyTransferState();
  assert.equal(evaluateAllVocabularyTransferReadiness(partial).quizUnlockReady, false);

  const full = createEmptyVocabularyTransferState();
  for (const id of VOCABULARY_TRANSFER_TERM_IDS) {
    const c = getVocabularyTransferLessonContract(id);
    full.terms[id] = {
      ...full.terms[id],
      noticeChoiceId: "x",
      definitionSeen: true,
      boundaryChoiceId: "x",
      audienceEffectChoiceId: c.audienceEffect ? "x" : null,
      purposeChoiceId: c.purposeConnection ? "x" : null,
      audienceFitChoiceId: c.audienceFit ? "x" : null,
      purposeResultChoiceId: c.purposeResult ? "x" : null,
      kingChoiceId: "x",
      assignmentTransferSeen: true,
      completed: true,
    };
  }
  // Ethos readiness uses legacy evaluator — need real ethos choice ids
  full.terms.ethos = {
    ...full.terms.ethos,
    noticeChoiceId: "officer_training",
    definitionSeen: true,
    boundaryChoiceId: "example_credibility",
    exampleNonexampleChoiceId: "example_credibility",
    audienceEffectChoiceId: "more_willing_to_trust",
    purposeChoiceId: "trust_supports_safety",
    kingChoiceId: "shared_national_authority",
    assignmentTransferSeen: true,
    completed: true,
  };
  assert.equal(evaluateAllVocabularyTransferReadiness(full).quizUnlockReady, true);

  const quiz = getActiveQuiz();
  assert.equal(quiz.length, 10);
  assert.ok(quiz.every((q) => q.id && q.concept));
  assert.equal(QUIZ_CONTENT_VERSION, 2);
});

test("WP-090 completed Module 1 records remain completed (draft hydrate preserves stage)", () => {
  const draft = hydrateStep2Draft(
    {
      stage: STEP2_STAGES.QUIZ,
      termIndex: 5,
      quizIndex: 0,
      quizAnswers: Array.from({ length: 10 }, () => "a"),
      quizVersion: QUIZ_CONTENT_VERSION,
      vocabularyTransfer: createEmptyVocabularyTransferState(),
    },
    { quizLength: 10, currentQuizVersion: QUIZ_CONTENT_VERSION }
  );
  assert.equal(draft.stage, STEP2_STAGES.QUIZ);
});

test("WP-090 canonical gate covers all six only in development", () => {
  assert.equal(isKnownVocabularyTransferTermId("not-a-term"), false);
  assert.equal(isKnownVocabularyTransferTermId("ethos"), true);
  if (isVocabularyTransferLessonDevEnabled()) {
    for (const id of VOCABULARY_TRANSFER_TERM_IDS) {
      assert.equal(isVocabularyTransferLessonEnabled({ termId: id }), true);
    }
    assert.equal(isVocabularyTransferLessonEnabled({ termId: "nope" }), false);
  }
  // WP-089 ethos-only helper remains ethos-scoped
  assert.equal(isEthosTransferLessonEnabled({ termId: "pathos" }), false);
});

test("WP-090 production/dev-tool boundaries remain intact", () => {
  const gateSrc = fs.readFileSync(
    path.join(root, "lib/dev/isVocabularyTransferLessonEnabled.js"),
    "utf8"
  );
  assert.match(gateSrc, /NODE_ENV === ["']development["']/);
  const panelSrc = fs.readFileSync(
    path.join(root, "components/dev/DeveloperTestingPanel.jsx"),
    "utf8"
  );
  assert.match(panelSrc, /vocabularyTransferLesson/);
  assert.match(panelSrc, /Seed vocabulary transfer \(WP-090\)/);
});

test("WP-090 Module 2 analytical-anchor compatibility remains intact", () => {
  assert.match(SHARED_ANALYTICAL_ANCHOR.label, /Rhetorical choice/);
  const eaSrc = fs.readFileSync(
    path.join(root, "lib/artifacts/evidenceArgumentContract.js"),
    "utf8"
  );
  assert.match(eaSrc, /audience effect/i);
});

test("WP-090 student-facing copy excludes internal architecture terminology", () => {
  const walk = (value, out = []) => {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach((v) => walk(v, out));
    else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        if (k === "schemaVersion" || k === "role" || k === "termId") continue;
        walk(v, out);
      }
    }
    return out;
  };
  for (const contract of listVocabularyTransferLessonContracts()) {
    for (const s of walk(contract)) {
      const lower = s.toLowerCase();
      for (const bad of FORBIDDEN) {
        assert.equal(
          lower.includes(bad.toLowerCase()),
          false,
          `${bad} in ${s.slice(0, 60)}`
        );
      }
    }
  }
});

test("WP-090 ethos term readiness still works after migration", () => {
  const ready = evaluateTermTransferReadiness("ethos", {
    noticeChoiceId: "officer_training",
    definitionSeen: true,
    boundaryChoiceId: "example_credibility",
    exampleNonexampleChoiceId: "example_credibility",
    audienceEffectChoiceId: "more_willing_to_trust",
    purposeChoiceId: "trust_supports_safety",
    kingChoiceId: "shared_national_authority",
    assignmentTransferSeen: true,
    completed: true,
  });
  assert.equal(ready.ready, true);
});
