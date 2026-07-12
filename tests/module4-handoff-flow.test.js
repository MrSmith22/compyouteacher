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
  getModule4PresentationChrome,
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
      presentation.planVersusProse.toLowerCase().includes("not finished prose")
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

describe("module4 Checkpoint 2 — guided handoff stages", () => {
  const {
    HANDOFF_INTERNAL_STAGES,
    HANDOFF_STAGE_ARGUMENT,
    HANDOFF_STAGE_MODEL,
    HANDOFF_STAGE_READY,
    buildHandoffFunctionDemos,
    getHandoffTeacherGuidance,
    getHandoffPrimaryActionLabel,
    resolveHandoffInternalAdvance,
    resolveHandoffInternalBack,
  } = require("../lib/module4/module4HandoffHelpers.js");

  function samplePresentation() {
    return buildModule4HandoffPresentation({
      thesis: "King argues delay is unjust.",
      proofPlan: [
        "Speech uses moral urgency",
        "Letter uses lived injustice",
        "Both reject waiting",
      ],
      selectedPattern: { text: "Moral urgency across both works" },
      evidencePool: [
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
      ],
    });
  }

  it("1. three internal stages exist", () => {
    assert.equal(HANDOFF_INTERNAL_STAGES.length, 3);
    assert.deepEqual(
      HANDOFF_INTERNAL_STAGES.map((stage) => stage.id),
      [HANDOFF_STAGE_ARGUMENT, HANDOFF_STAGE_MODEL, HANDOFF_STAGE_READY]
    );
  });

  it("2. Stage 1 shows argument artifacts but not the full five-part lesson", () => {
    const presentation = samplePresentation();
    assert.ok(presentation.thesis);
    assert.equal(presentation.proofPlanItems.length, 3);
    assert.ok(presentation.patternText);
    assert.ok(presentation.evidenceFoundation.summary);
    assert.equal(
      HANDOFF_INTERNAL_STAGES[0].question,
      "What argument am I bringing into Module 4?"
    );
    // Stage 1 CTA does not advance durable flow
    assert.equal(HANDOFF_INTERNAL_STAGES[0].advancesDurableFlow, false);
    const advance = resolveHandoffInternalAdvance({
      stage: HANDOFF_STAGE_ARGUMENT,
    });
    assert.equal(advance.stage, HANDOFF_STAGE_MODEL);
    assert.equal(advance.advancesDurableFlow, false);
  });

  it("3–5. Stage 2 teaches one function at a time with real artifacts in order", () => {
    const presentation = samplePresentation();
    const demos = buildHandoffFunctionDemos(presentation);
    assert.equal(demos.length, 5);
    assert.deepEqual(
      demos.map((demo) => demo.title),
      [
        "Main idea",
        "Introduce evidence",
        "Evidence",
        "Explain evidence",
        "Connect to the thesis",
      ]
    );

    assert.equal(demos[0].demo.kind, "proof_plan");
    assert.match(demos[0].demo.body, /Speech uses moral urgency/);
    assert.equal(demos[1].demo.kind, "introduce");
    assert.match(demos[1].demo.body, /Speech/i);
    assert.equal(demos[2].demo.kind, "quotation");
    assert.match(demos[2].demo.body, /justice too long delayed/);
    assert.equal(demos[3].demo.kind, "explanation");
    assert.ok(
      demos[3].demo.body.includes("delay harms") ||
        demos[3].demo.body.includes("Both works press")
    );
    assert.equal(demos[4].demo.kind, "thesis");
    assert.match(demos[4].demo.body, /King argues delay/);

    let state = {
      stage: HANDOFF_STAGE_MODEL,
      functionIndex: 0,
      showCompleteModel: false,
    };
    for (let i = 0; i < 4; i += 1) {
      state = resolveHandoffInternalAdvance(state);
      assert.equal(state.stage, HANDOFF_STAGE_MODEL);
      assert.equal(state.functionIndex, i + 1);
      assert.equal(state.showCompleteModel, false);
      assert.equal(state.advancesDurableFlow, false);
    }
    state = resolveHandoffInternalAdvance(state);
    assert.equal(state.showCompleteModel, true);
    assert.equal(state.advancesDurableFlow, false);
  });

  it("6. Stage 3 shows required/optional paragraph-plan expectations", () => {
    const presentation = samplePresentation();
    assert.ok(Array.isArray(presentation.stage3Expectations));
    assert.ok(
      presentation.stage3Expectations.some((line) =>
        /at least two paragraph plans/i.test(line)
      )
    );
    assert.ok(
      presentation.stage3Expectations.some((line) => /third/i.test(line))
    );
    assert.ok(
      presentation.stage3Expectations.some((line) => /Module 5/i.test(line))
    );
    assert.equal(
      getHandoffPrimaryActionLabel({ stage: HANDOFF_STAGE_READY }),
      "Start Paragraph 1"
    );
  });

  it("7. teacher guidance changes by internal stage/function", () => {
    const stage1 = getHandoffTeacherGuidance({ stage: HANDOFF_STAGE_ARGUMENT });
    const fn0 = getHandoffTeacherGuidance({
      stage: HANDOFF_STAGE_MODEL,
      functionIndex: 0,
    });
    const fn2 = getHandoffTeacherGuidance({
      stage: HANDOFF_STAGE_MODEL,
      functionIndex: 2,
    });
    const complete = getHandoffTeacherGuidance({
      stage: HANDOFF_STAGE_MODEL,
      showCompleteModel: true,
    });
    const stage3 = getHandoffTeacherGuidance({ stage: HANDOFF_STAGE_READY });

    assert.match(stage1.coaching, /carrying your argument forward/i);
    assert.match(fn0.coaching, /main idea/i);
    assert.match(fn2.coaching, /specific words/i);
    assert.notEqual(fn0.coaching, fn2.coaching);
    assert.match(complete.coaching, /five jobs|full sequence|finished paragraph/i);
    assert.match(stage3.coaching, /Plan the thinking first/i);
  });

  it("8–9. internal progression does not mutate artifacts; only Start Paragraph 1 advances flow", () => {
    const presentation = samplePresentation();
    const before = JSON.stringify(presentation);
    const mid = resolveHandoffInternalAdvance({
      stage: HANDOFF_STAGE_ARGUMENT,
    });
    assert.equal(mid.advancesDurableFlow, false);
    const toReady = resolveHandoffInternalAdvance({
      stage: HANDOFF_STAGE_MODEL,
      showCompleteModel: true,
    });
    assert.equal(toReady.stage, HANDOFF_STAGE_READY);
    assert.equal(toReady.advancesDurableFlow, false);
    const finish = resolveHandoffInternalAdvance({
      stage: HANDOFF_STAGE_READY,
    });
    assert.equal(finish.advancesDurableFlow, true);
    assert.equal(JSON.stringify(presentation), before);
    assert.equal(
      HANDOFF_INTERNAL_STAGES.filter((stage) => stage.advancesDurableFlow)
        .length,
      1
    );
  });

  it("10–13. shelf/sources hidden on handoff; restored on Paragraph 1; Back returns to handoff", () => {
    const handoff = getModule4PresentationChrome(STEP_HANDOFF);
    assert.equal(handoff.useGuidedHandoffShell, true);
    assert.equal(handoff.showFullReferenceShelf, false);
    assert.equal(handoff.showSources, false);
    assert.equal(handoff.showWhyMatters, false);
    assert.equal(handoff.showNavFooter, false);

    const paragraph = getModule4PresentationChrome(STEP_B1_SCAFFOLD);
    assert.equal(paragraph.useGuidedHandoffShell, false);
    assert.equal(paragraph.showFullReferenceShelf, true);
    assert.equal(paragraph.showSources, true);
    assert.equal(paragraph.showNavFooter, true);

    assert.equal(
      resolveModule4BackTarget({
        flowStep: STEP_B1_SCAFFOLD,
        hasValidSavedPattern: true,
      }),
      STEP_HANDOFF
    );
    assert.equal(
      resolveHandoffInternalBack({
        stage: HANDOFF_STAGE_MODEL,
        functionIndex: 0,
      }).stage,
      HANDOFF_STAGE_ARGUMENT
    );
  });

  it("14. flow migration remains unchanged", () => {
    assert.equal(
      migrateOpeningFlowStep({
        flowStep: STEP_BIG_PICTURE,
        hasValidSavedPattern: true,
      }),
      STEP_HANDOFF
    );
    assert.equal(
      migrateOpeningFlowStep({
        flowStep: STEP_PATTERN,
        hasValidSavedPattern: false,
      }),
      STEP_PATTERN
    );
    assert.equal(
      migrateOpeningFlowStep({
        flowStep: STEP_B2_REASONING,
        hasValidSavedPattern: true,
      }),
      STEP_B2_REASONING
    );
  });
});
