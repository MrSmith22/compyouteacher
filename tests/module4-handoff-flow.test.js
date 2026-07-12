const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  FLOW_VERSION,
  STEP_HANDOFF,
  STEP_WELCOME,
  STEP_BIG_PICTURE,
  STEP_EXPLAIN_BUCKETS,
  STEP_PATTERN,
  STEP_B1_SCAFFOLD,
  STEP_B2_REASONING,
  STEP_THIRD_DECISION,
  STEP_B3_SCAFFOLD,
  STEP_REFLECTION,
  PARAGRAPH_PLAN_FUNCTIONS,
  MODULE4_HANDOFF_CTA_LABEL,
  SUCCESS_PROOF_PLAN_LABELS,
  hasValidSavedModule3Pattern,
  migrateOpeningFlowStep,
  openingBackTarget,
  resolveModule4BackTarget,
  resolveModule4OpeningAdvanceTarget,
  requiresPatternReviewStep,
  buildModule4HandoffPresentation,
  buildHandoffProofPlanItems,
} = require("../lib/module4/module4HandoffHelpers.js");

const {
  STEP_B1_SCAFFOLD: FLOW_B1,
  STEP_PATTERN: FLOW_PATTERN,
  FLOW_VERSION: COMPONENT_FLOW_VERSION,
} = require("../components/module4/module4FlowSteps.js");

describe("module4 Checkpoint 2 — handoff + flow migration", () => {
  it("keeps helper and component flow version / B1 step in sync", () => {
    assert.equal(FLOW_VERSION, 3);
    assert.equal(COMPONENT_FLOW_VERSION, 3);
    assert.equal(STEP_B1_SCAFFOLD, FLOW_B1);
    assert.equal(STEP_PATTERN, FLOW_PATTERN);
    assert.equal(STEP_HANDOFF, STEP_WELCOME);
  });

  it("1–2. saved pattern → handoff, then Paragraph 1; no required Pattern review", () => {
    const pattern = { text: "King uses moral urgency in both works." };
    assert.equal(hasValidSavedModule3Pattern(pattern), true);
    assert.equal(requiresPatternReviewStep(true), false);

    for (const opening of [
      STEP_WELCOME,
      STEP_BIG_PICTURE,
      STEP_EXPLAIN_BUCKETS,
      STEP_PATTERN,
    ]) {
      assert.equal(
        migrateOpeningFlowStep({
          flowStep: opening,
          hasValidSavedPattern: true,
        }),
        STEP_HANDOFF,
        `opening ${opening} should become handoff`
      );
    }

    assert.equal(
      resolveModule4OpeningAdvanceTarget(STEP_HANDOFF),
      STEP_B1_SCAFFOLD
    );
    assert.equal(MODULE4_HANDOFF_CTA_LABEL, "Start Paragraph 1");
  });

  it("3–4. missing pattern → focused fallback, then Paragraph 1", () => {
    assert.equal(hasValidSavedModule3Pattern(null), false);
    assert.equal(hasValidSavedModule3Pattern({ text: "   " }), false);
    assert.equal(hasValidSavedModule3Pattern({ id: "legacy-only" }), false);
    assert.equal(requiresPatternReviewStep(false), true);

    for (const opening of [
      STEP_WELCOME,
      STEP_BIG_PICTURE,
      STEP_EXPLAIN_BUCKETS,
      STEP_PATTERN,
    ]) {
      assert.equal(
        migrateOpeningFlowStep({
          flowStep: opening,
          hasValidSavedPattern: false,
        }),
        STEP_PATTERN,
        `opening ${opening} should become pattern fallback`
      );
    }

    assert.equal(
      resolveModule4OpeningAdvanceTarget(STEP_PATTERN),
      STEP_B1_SCAFFOLD
    );
  });

  it("5–8. old Welcome / Big Picture / Explain / Pattern+saved → handoff", () => {
    assert.equal(
      migrateOpeningFlowStep({ flowStep: 0, hasValidSavedPattern: true }),
      STEP_HANDOFF
    );
    assert.equal(
      migrateOpeningFlowStep({ flowStep: 1, hasValidSavedPattern: true }),
      STEP_HANDOFF
    );
    assert.equal(
      migrateOpeningFlowStep({ flowStep: 2, hasValidSavedPattern: true }),
      STEP_HANDOFF
    );
    assert.equal(
      migrateOpeningFlowStep({ flowStep: 3, hasValidSavedPattern: true }),
      STEP_HANDOFF
    );
  });

  it("9. old Pattern + missing pattern → fallback", () => {
    assert.equal(
      migrateOpeningFlowStep({ flowStep: 3, hasValidSavedPattern: false }),
      STEP_PATTERN
    );
  });

  it("10. Paragraph 1 or later keeps the same working stage", () => {
    for (const step of [4, 7, 11, 12, 16, 17]) {
      assert.equal(
        migrateOpeningFlowStep({
          flowStep: step,
          hasValidSavedPattern: true,
        }),
        step
      );
      assert.equal(
        migrateOpeningFlowStep({
          flowStep: step,
          hasValidSavedPattern: false,
        }),
        step
      );
    }
  });

  it("11. Back from Paragraph 1 → handoff (or fallback when missing pattern)", () => {
    assert.equal(openingBackTarget({ hasValidSavedPattern: true }), STEP_HANDOFF);
    assert.equal(openingBackTarget({ hasValidSavedPattern: false }), STEP_PATTERN);
    assert.equal(
      resolveModule4BackTarget({
        flowStep: STEP_B1_SCAFFOLD,
        hasValidSavedPattern: true,
      }),
      STEP_HANDOFF
    );
    assert.equal(
      resolveModule4BackTarget({
        flowStep: STEP_B1_SCAFFOLD,
        hasValidSavedPattern: false,
      }),
      STEP_PATTERN
    );
  });

  it("12. later Back navigation remains unchanged", () => {
    assert.equal(
      resolveModule4BackTarget({
        flowStep: STEP_B2_REASONING,
        hasValidSavedPattern: true,
      }),
      STEP_B2_REASONING - 1
    );
    assert.equal(
      resolveModule4BackTarget({
        flowStep: STEP_THIRD_DECISION,
        hasValidSavedPattern: true,
      }),
      STEP_B2_REASONING
    );
    assert.equal(
      resolveModule4BackTarget({
        flowStep: STEP_B3_SCAFFOLD,
        hasValidSavedPattern: true,
      }),
      STEP_THIRD_DECISION
    );
    assert.equal(
      resolveModule4BackTarget({
        flowStep: STEP_REFLECTION,
        hasValidSavedPattern: true,
        wantThirdBucket: false,
      }),
      STEP_THIRD_DECISION
    );
    assert.equal(
      resolveModule4BackTarget({
        flowStep: STEP_REFLECTION,
        hasValidSavedPattern: true,
        wantThirdBucket: true,
      }),
      16 // STEP_B3_REASONING
    );
  });

  it("13. five paragraph functions appear in approved order", () => {
    assert.deepEqual(
      PARAGRAPH_PLAN_FUNCTIONS.map((fn) => fn.title),
      [
        "Main idea",
        "Introduce evidence",
        "Evidence",
        "Explain evidence",
        "Connect to the thesis",
      ]
    );
    assert.deepEqual(
      PARAGRAPH_PLAN_FUNCTIONS.map((fn) => fn.description),
      [
        "What this paragraph will prove",
        "What readers need to know before the quotation",
        "The specific words from the text",
        "What those words show",
        "How the paragraph helps prove the essay’s argument",
      ]
    );
  });

  it("14. proof-plan notes retain original wording and Module 3 role labels", () => {
    const proofPlan = [
      "Speech note stays exact",
      "Letter note stays exact",
      "Compare note stays exact",
    ];
    const items = buildHandoffProofPlanItems(proofPlan);
    assert.equal(items.length, 3);
    assert.equal(items[0].label, SUCCESS_PROOF_PLAN_LABELS[0]);
    assert.equal(items[1].label, SUCCESS_PROOF_PLAN_LABELS[1]);
    assert.equal(items[2].label, SUCCESS_PROOF_PLAN_LABELS[2]);
    assert.equal(items[0].text, "Speech note stays exact");
    assert.equal(items[1].text, "Letter note stays exact");
    assert.equal(items[2].text, "Compare note stays exact");
  });

  it("15–16. pattern is presentation-only; viewing handoff does not write artifacts", () => {
    const selectedPattern = {
      text: "Moral urgency across both works",
      selected: true,
    };
    const proofPlan = ["A", "B", "C"];
    const evidencePool = [
      {
        id: "tchart:speech:pathos",
        type: "speech",
        category: "pathos",
        quote: "justice too long delayed",
        observation: "delay harms people",
        module3Connection: { note: "Both works press urgency" },
      },
      {
        id: "tchart:letter:pathos",
        type: "letter",
        category: "pathos",
        quote: "wait means never",
        observation: "waiting denies justice",
      },
    ];

    const beforePattern = JSON.stringify(selectedPattern);
    const beforePlan = JSON.stringify(proofPlan);
    const beforePool = JSON.stringify(evidencePool);

    const presentation = buildModule4HandoffPresentation({
      thesis: "King argues delay is unjust.",
      proofPlan,
      selectedPattern,
      evidencePool,
    });

    assert.equal(presentation.patternText, "Moral urgency across both works");
    assert.equal(presentation.ctaLabel, "Start Paragraph 1");
    assert.equal(presentation.evidenceFoundation.quotationCount, 2);
    assert.equal(presentation.evidenceFoundation.bothWorks, true);
    assert.ok(
      presentation.planVersusProse.toLowerCase().includes("not finished paragraph")
    );
    assert.ok(
      /introduction|explanation|thesis connection|reasoning/i.test(
        presentation.planVersusProse
      )
    );
    assert.equal(JSON.stringify(selectedPattern), beforePattern);
    assert.equal(JSON.stringify(proofPlan), beforePlan);
    assert.equal(JSON.stringify(evidencePool), beforePool);
    assert.equal(
      Object.prototype.hasOwnProperty.call(presentation, "claim"),
      false
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(presentation, "reasoning"),
      false
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(presentation, "evidenceKeys"),
      false
    );
  });
});
