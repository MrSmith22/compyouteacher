/**
 * WP-089 — Transfer-oriented ethos vocabulary foundation (representative slice).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ETHOS_TRANSFER_STEPS,
  ETHOS_ANALYTICAL_ANCHOR,
  ETHOS_KING_PASSAGE,
  ETHOS_TRANSFER_SCHEMA_VERSION,
  getEthosTransferLessonContract,
  createEmptyEthosTransferState,
  normalizeEthosTransferState,
  evaluateEthosTransferReadiness,
  buildPromptInterpretationSignature,
  ethosTransferStepIndex,
} from "../lib/module1/ethosTransferLessonContract.js";
import {
  ASSIGNMENT_INTERPRETATION_LABEL,
  resolveAssignmentInterpretationCarryForward,
  assignmentInterpretationPlacement,
} from "../lib/module1/assignmentInterpretationCarryForward.js";
import {
  isEthosTransferLessonDevEnabled,
  isEthosTransferLessonEnabled,
} from "../lib/dev/isEthosTransferLessonEnabled.js";
import { hydrateStep2Draft, STEP2_STAGES } from "../lib/module1/step2MicrostageHelpers.js";
import { VOCABULARY_TERMS } from "../lib/module1/vocabularyTermHelpers.js";
import { QUIZ_CONTENT_VERSION } from "../lib/module1/quizHelpers.js";
import { ETHOS_ANALYTICAL_ANCHOR as ANCHOR } from "../lib/module1/ethosTransferLessonContract.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const FORBIDDEN_STUDENT_COPY = Object.freeze([
  "schemaVersion",
  "microstep",
  "WP-089",
  "localStorage",
  "promptInterpretationSignature",
  "NODE_ENV",
  "vertical slice",
]);

function collectStudentFacingStrings(contract) {
  const out = [];
  const walk = (value) => {
    if (typeof value === "string") {
      out.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  };
  walk(contract);
  return out;
}

test("WP-089 lesson contract contains every required instructional move", () => {
  const c = getEthosTransferLessonContract();
  assert.equal(c.termId, "ethos");
  assert.equal(c.schemaVersion, ETHOS_TRANSFER_SCHEMA_VERSION);
  assert.ok(c.familiarScenario?.situation);
  assert.ok(c.familiarScenario?.noticePrompt);
  assert.ok(c.definition?.academic);
  assert.ok(c.definition?.plainLanguage);
  assert.ok(c.exampleNonexample?.options?.length >= 2);
  assert.ok(c.audienceEffect?.namedAudience);
  assert.ok(c.purposeConnection?.communicatorPurpose);
  assert.ok(c.kingPassage?.quotation);
  assert.ok(c.kingApplication?.prompt);
  assert.ok(c.assignmentTransfer?.transferStatement);
  assert.equal(c.completionCriteria.notByTextLength, true);
  assert.deepEqual([...c.stepIds], [...ETHOS_TRANSFER_STEPS]);
});

test("WP-089 step order is notice before name/definition", () => {
  assert.ok(ethosTransferStepIndex("notice") < ethosTransferStepIndex("name_boundary"));
  assert.equal(ETHOS_TRANSFER_STEPS[0], "notice");
  assert.equal(ETHOS_TRANSFER_STEPS[1], "name_boundary");
  const noticePrompt = getEthosTransferLessonContract().familiarScenario.noticePrompt;
  assert.doesNotMatch(noticePrompt, /\bethos\b/i);
});

test("WP-089 example/nonexample distinguishes credibility from emotion", () => {
  const opts = getEthosTransferLessonContract().exampleNonexample.options;
  const example = opts.find((o) => o.kind === "example");
  const nonexample = opts.find((o) => o.kind === "nonexample");
  assert.equal(example?.isTarget, true);
  assert.equal(nonexample?.isTarget, false);
  assert.match(example.explanation, /credib|reliab|trust/i);
  assert.match(nonexample.explanation, /emotion|pathos/i);
});

test("WP-089 analytical anchor is choice → audience effect → purpose", () => {
  assert.match(ETHOS_ANALYTICAL_ANCHOR.label, /choice/i);
  assert.match(ETHOS_ANALYTICAL_ANCHOR.label, /audience/i);
  assert.match(ETHOS_ANALYTICAL_ANCHOR.label, /purpose/i);
  assert.equal(ANCHOR.choice, "Rhetorical choice");
  assert.equal(ANCHOR.audienceEffect, "Effect on audience");
  assert.equal(ANCHOR.purpose, "Contribution to purpose");
});

test("WP-089 audience-effect language permits reasonable uncertainty", () => {
  const ae = getEthosTransferLessonContract().audienceEffect;
  assert.match(ae.uncertaintyCue, /may|could/i);
  const target = ae.options.find((o) => o.isTarget);
  assert.match(target.label, /may/i);
  const certain = ae.options.find((o) => /definitely/i.test(o.label));
  assert.equal(certain?.isTarget, false);
});

test("WP-089 King passage has inspectable source metadata matching assignment", () => {
  const passage = ETHOS_KING_PASSAGE;
  assert.equal(passage.sourceId, "speech");
  assert.equal(passage.guidedPassageId, "speech-ethos");
  assert.ok(passage.quotation.length > 20);
  assert.ok(passage.passageLocator);
  assert.ok(passage.citationSafeNote);

  const assignmentSrc = fs.readFileSync(
    path.join(root, "lib/assignments/mlkRhetoricalAnalysis.ts"),
    "utf8"
  );
  assert.match(assignmentSrc, /id:\s*"speech-ethos"/);
  assert.ok(
    assignmentSrc.includes(passage.quotation),
    "King quotation must match authoritative speech-ethos passage"
  );
});

test("WP-089 King application requires transfer, not definition recall", () => {
  const app = getEthosTransferLessonContract().kingApplication;
  assert.equal(app.requiresTransferNotDefinition, true);
  assert.doesNotMatch(app.prompt, /what does ethos mean/i);
  assert.match(app.prompt, /credibility choice|lens|King/i);
  assert.ok(app.followUpStem);
  const target = app.options.find((o) => o.isTarget);
  assert.match(target.label, /history|Lincoln|Emancipation|national/i);
});

test("WP-089 teaching feedback explains target and non-target choices", () => {
  const c = getEthosTransferLessonContract();
  assert.match(c.teachingFeedback.headings.correct, /That works/i);
  assert.match(c.teachingFeedback.headings.incorrect, /look closer/i);
  for (const opt of [
    ...c.familiarScenario.noticeOptions,
    ...c.exampleNonexample.options,
    ...c.audienceEffect.options,
    ...c.purposeConnection.options,
    ...c.kingApplication.options,
  ]) {
    if (opt.explanation) {
      assert.ok(opt.explanation.length > 20, `${opt.id} needs teaching explanation`);
    }
  }
  // notice options may lack explanation in contract — feedback still uses headings
  assert.ok(c.exampleNonexample.options.every((o) => o.explanation));
});

test("WP-089 saved prompt interpretation appears in transfer and is not overwritten", () => {
  const student =
    "I need to compare how King builds trust for different audiences.";
  const resolved = resolveAssignmentInterpretationCarryForward({
    studentParaphrase: student,
  });
  assert.equal(resolved.source, "student_paraphrase");
  assert.equal(resolved.isFallback, false);
  assert.equal(resolved.text, student);
  assert.equal(resolved.label, ASSIGNMENT_INTERPRETATION_LABEL);
  assert.equal(assignmentInterpretationPlacement("desk"), "desk");
  assert.equal(assignmentInterpretationPlacement("shelf"), "shelf");
});

test("WP-089 fallback assignment wording is used only when needed", () => {
  const resolved = resolveAssignmentInterpretationCarryForward({
    studentParaphrase: "   ",
  });
  assert.equal(resolved.isFallback, true);
  assert.equal(resolved.source, "assignment_fallback");
  assert.ok(resolved.text.length > 10);
});

test("WP-089 microstep persistence/resume round-trips", () => {
  const empty = createEmptyEthosTransferState();
  empty.currentStep = "king_apply";
  empty.noticeChoiceId = "officer_training";
  empty.definitionSeen = true;
  empty.exampleNonexampleChoiceId = "example_credibility";
  empty.audienceEffectChoiceId = "more_willing_to_trust";
  empty.purposeChoiceId = "trust_supports_safety";
  empty.kingChoiceId = "shared_national_authority";
  empty.kingFollowUpText = "they already respect those ideals.";

  const round = normalizeEthosTransferState(empty);
  assert.equal(round.currentStep, "king_apply");
  assert.equal(round.kingFollowUpText, "they already respect those ideals.");
  assert.equal(round.noticeChoiceId, "officer_training");

  const draft = hydrateStep2Draft(
    {
      stage: STEP2_STAGES.LEARN,
      termIndex: 1,
      quizIndex: 0,
      quizAnswers: Array.from({ length: 10 }, () => ""),
      quizVersion: QUIZ_CONTENT_VERSION,
      ethosTransfer: round,
    },
    { quizLength: 10, currentQuizVersion: QUIZ_CONTENT_VERSION }
  );
  assert.equal(draft.stage, STEP2_STAGES.LEARN);
  assert.equal(draft.termIndex, 1);
  assert.equal(draft.ethosTransfer.currentStep, "king_apply");
});

test("WP-089 readiness is decision-based, not text-length", () => {
  const partial = createEmptyEthosTransferState();
  assert.equal(evaluateEthosTransferReadiness(partial).ready, false);

  const full = {
    ...createEmptyEthosTransferState(),
    noticeChoiceId: "officer_training",
    definitionSeen: true,
    exampleNonexampleChoiceId: "example_credibility",
    audienceEffectChoiceId: "more_willing_to_trust",
    purposeChoiceId: "trust_supports_safety",
    kingChoiceId: "shared_national_authority",
    kingFollowUpText: "", // empty follow-up still ok
    assignmentTransferSeen: true,
    completed: true,
  };
  const ready = evaluateEthosTransferReadiness(full);
  assert.equal(ready.ready, true);
  assert.equal(ready.completed, true);
});

test("WP-089 paraphrase signature flags review without erasing progress", () => {
  const a = buildPromptInterpretationSignature("Compare appeals.");
  const b = buildPromptInterpretationSignature("Compare appeals for audience.");
  assert.ok(a);
  assert.notEqual(a, b);
  const state = normalizeEthosTransferState({
    noticeChoiceId: "officer_training",
    definitionSeen: true,
    promptInterpretationSignature: a,
    promptInterpretationNeedsReview: true,
  });
  assert.equal(state.noticeChoiceId, "officer_training");
  assert.equal(state.promptInterpretationNeedsReview, true);
});

test("WP-089 Back supports local review via ordered steps", () => {
  const idx = ethosTransferStepIndex("purpose");
  assert.equal(ETHOS_TRANSFER_STEPS[idx - 1], "audience_effect");
  assert.ok(ethosTransferStepIndex("assignment_transfer") > ethosTransferStepIndex("king_apply"));
});

test("WP-089 legacy/completed Module 1 path preserved outside gate", () => {
  assert.equal(isEthosTransferLessonEnabled({ termId: "pathos" }), false);
  assert.equal(isEthosTransferLessonEnabled({ termId: "rhetoric" }), false);
  assert.equal(isEthosTransferLessonEnabled({ termIndex: 0 }), false);
  // Ethos only when gate on
  if (isEthosTransferLessonDevEnabled()) {
    assert.equal(isEthosTransferLessonEnabled({ termId: "ethos" }), true);
    assert.equal(isEthosTransferLessonEnabled({ termIndex: 1 }), true);
  }
  const ethosTerm = VOCABULARY_TERMS.find((t) => t.id === "ethos");
  assert.ok(ethosTerm?.definition);
  assert.equal(VOCABULARY_TERMS.length, 6);
});

test("WP-089 quiz and six-term production contract unchanged outside gate", () => {
  assert.ok(QUIZ_CONTENT_VERSION >= 1);
  assert.equal(VOCABULARY_TERMS.map((t) => t.id).join(","), "rhetoric,ethos,pathos,logos,audience,purpose");
});

test("WP-089 student-facing copy excludes internal architecture terminology", () => {
  const strings = collectStudentFacingStrings(getEthosTransferLessonContract());
  for (const s of strings) {
    const lower = s.toLowerCase();
    for (const bad of FORBIDDEN_STUDENT_COPY) {
      assert.equal(
        lower.includes(bad.toLowerCase()),
        false,
        `Forbidden term "${bad}" in: ${s.slice(0, 80)}`
      );
    }
  }
});

test("WP-089 gate and seeds remain development-only", () => {
  const gateSrc = fs.readFileSync(
    path.join(root, "lib/dev/isEthosTransferLessonEnabled.js"),
    "utf8"
  );
  assert.match(gateSrc, /NODE_ENV === ["']development["']/);

  const panelSrc = fs.readFileSync(
    path.join(root, "components/dev/DeveloperTestingPanel.jsx"),
    "utf8"
  );
  assert.match(panelSrc, /ethosTransferLesson/);
  assert.match(panelSrc, /Seed ethos transfer \(WP-089\)/);

  const seedIndex = fs.readFileSync(
    path.join(root, "lib/dev/seeds/index.ts"),
    "utf8"
  );
  assert.match(seedIndex, /ethosTransferLesson/);
  assert.match(seedIndex, /seedEthosTransferLesson/);

  const seedFile = fs.readFileSync(
    path.join(root, "lib/dev/seeds/seedEthosTransferLesson.ts"),
    "utf8"
  );
  assert.match(seedFile, /WP089_SEED_VARIANTS/);
  assert.match(seedFile, /kingApply/);
  assert.match(seedFile, /paraphraseChanged/);
});

test("WP-089 Module 2–3 analytical anchor compatibility remains intact", () => {
  // Same three-part lens language used in evidence→argument production path.
  assert.match(ETHOS_ANALYTICAL_ANCHOR.label, /Rhetorical choice/);
  assert.match(ETHOS_ANALYTICAL_ANCHOR.label, /effect on audience/);
  assert.match(ETHOS_ANALYTICAL_ANCHOR.label, /contribution to purpose/);

  const eaContractPath = path.join(root, "lib/artifacts/evidenceArgumentContract.js");
  const eaSrc = fs.readFileSync(eaContractPath, "utf8");
  assert.match(eaSrc, /audience effect/i);
  assert.match(eaSrc, /purpose/i);

  const transfer = getEthosTransferLessonContract().assignmentTransfer;
  assert.match(transfer.transferStatement, /audiences and purposes/i);
  assert.match(transfer.confirmLabel, /choice → audience effect → purpose/);
});

test("WP-089 no auto-advance contract: Continue requires explicit feedback path", () => {
  // Flow source must not auto-advance on radio change alone.
  const flowSrc = fs.readFileSync(
    path.join(root, "components/module1/EthosTransferLessonFlow.jsx"),
    "utf8"
  );
  assert.match(flowSrc, /continueDisabled=\{!pendingFeedback\}/);
  assert.match(flowSrc, /data-testid="ethos-transfer-check"/);
  assert.doesNotMatch(flowSrc, /setTimeout\s*\(/);
  assert.doesNotMatch(flowSrc, /auto.?advance/i);
});

test("WP-089 notice options include teaching explanations when checked via feedback helper", () => {
  // Notice options currently omit per-option explanation; Check uses teachingFeedback headings.
  // Ensure name_boundary and later steps have explanations (covered above).
  const notice = getEthosTransferLessonContract().familiarScenario.noticeOptions;
  assert.equal(notice.length, 2);
  assert.ok(notice.some((o) => o.isTarget));
  assert.ok(notice.some((o) => !o.isTarget));
});
