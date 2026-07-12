const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  REVIEW_STAGE_MAP,
  REVIEW_STAGE_PLANS,
  REVIEW_STAGE_COMPARE,
  REVIEW_STAGE_COUNT,
  REVIEW_LAYOUT_CONTRACT,
  buildFinalReviewPresentation,
  buildReviewStageSnapshot,
  getReviewPrimaryActionLabel,
  getReviewTeacherGuidance,
  resolveReviewInternalAdvance,
  resolveReviewInternalBack,
} = require("../lib/module4/module4FinalReviewHelpers.js");

const {
  SUCCESS_STAGE_CELEBRATE,
  SUCCESS_STAGE_EXPLORE,
  SUCCESS_STAGE_HANDOFF,
  SUCCESS_STAGE_COUNT,
  SUCCESS_LAYOUT_CONTRACT,
  SUCCESS_TRANSFORM_STEPS,
  buildSuccessStageSnapshot,
  getSuccessTeacherGuidance,
  resolveSuccessInternalAdvance,
  resolveSuccessInternalBack,
  successReloadResetsToCelebrate,
} = require("../lib/module4/module4SuccessStageHelpers.js");

const {
  buildModule4SuccessSummary,
  MODULE_FOUR_SUCCESS_MODULE5_HREF,
  MODULE_FOUR_SUCCESS_REVIEW_HREF,
} = require("../lib/module4/module4SuccessHelpers.js");

const {
  editStepForParagraphPart,
} = require("../lib/module4/module4ParagraphPlanArtifactHelpers.js");

const {
  REFLECTION_MIN_CHARS,
} = require("../lib/module4/module4ValidityHelpers.js");

const {
  getModule4PresentationChrome,
} = require("../lib/module4/module4HandoffHelpers.js");

function plannedBucket(overrides = {}) {
  return {
    claim: "King builds trust differently for each audience.",
    paragraphRole: "analyze_speech",
    reasoning: "The evidence shows urgency that supports the thesis clearly.",
    evidenceKeys: ["tchart:speech:pathos"],
    evidenceSnippets: [{ quote: "justice delayed", observation: "urgency" }],
    suggestionId: "proof-0",
    ...overrides,
  };
}

function qualifyingSlot(overrides = {}) {
  return {
    savedKey: "tchart:speech:pathos",
    status: "current",
    countsTowardEvidenceGate: true,
    row: {
      evidenceKey: "tchart:speech:pathos",
      type: "speech",
      category: "pathos",
      quote: "justice delayed is justice denied",
      observation: "Shows urgency",
    },
    quote: "justice delayed is justice denied",
    module3Connection: {
      relationLabel: "Supports my idea",
      note: "This CONNECT note explains the link to the claim.",
    },
    ...overrides,
  };
}

function letterSlot() {
  return qualifyingSlot({
    savedKey: "tchart:letter:ethos",
    row: {
      evidenceKey: "tchart:letter:ethos",
      type: "letter",
      category: "ethos",
      quote: "I am here because",
    },
    quote: "I am here because",
  });
}

describe("module4 Checkpoint 5 repair — dynamic review + success stages", () => {
  it("1. final review has three internal stages", () => {
    assert.equal(REVIEW_STAGE_COUNT, 3);
    assert.equal(REVIEW_STAGE_MAP, 1);
    assert.equal(REVIEW_STAGE_PLANS, 2);
    assert.equal(REVIEW_STAGE_COMPARE, 3);
  });

  it("2. Stage 1 shows compact map, not full artifacts", () => {
    const presentation = buildFinalReviewPresentation({
      buckets: [plannedBucket(), plannedBucket({ paragraphRole: "analyze_letter" })],
      wantThirdBucket: false,
      getEvidenceSlots: () => [qualifyingSlot()],
      thesis: "Exact thesis for the map.",
    });
    const snap = buildReviewStageSnapshot({
      stage: REVIEW_STAGE_MAP,
      presentation,
    });
    assert.equal(snap.showsCompactMap, true);
    assert.equal(snap.showsFullArtifacts, false);
    assert.equal(snap.showsReflection, false);
    assert.equal(snap.compactCardCount, 2);
    assert.ok(!JSON.stringify(snap).includes(plannedBucket().reasoning));
  });

  it("3–4. Stage 2 shows one active plan and navigates all required plans", () => {
    const presentation = buildFinalReviewPresentation({
      buckets: [
        plannedBucket({ claim: "Paragraph one exact point text." }),
        plannedBucket({
          claim: "Paragraph two exact point text here.",
          paragraphRole: "analyze_letter",
        }),
      ],
      wantThirdBucket: false,
      getEvidenceSlots: () => [qualifyingSlot()],
      thesis: "Thesis",
    });
    assert.equal(presentation.planCount, 2);

    let state = { stage: REVIEW_STAGE_MAP, planIndex: 0 };
    state = resolveReviewInternalAdvance({
      ...state,
      planCount: presentation.planCount,
    });
    assert.equal(state.stage, REVIEW_STAGE_PLANS);
    assert.equal(state.planIndex, 0);
    assert.equal(state.writesArtifacts, false);

    const first = buildReviewStageSnapshot({
      stage: state.stage,
      presentation,
      planIndex: state.planIndex,
    });
    assert.equal(first.activePlanOnly, true);
    assert.equal(first.activeParagraphNumber, 1);

    state = resolveReviewInternalAdvance({
      ...state,
      planCount: presentation.planCount,
    });
    assert.equal(state.planIndex, 1);
    const second = buildReviewStageSnapshot({
      stage: state.stage,
      presentation,
      planIndex: state.planIndex,
    });
    assert.equal(second.activeParagraphNumber, 2);

    state = resolveReviewInternalAdvance({
      ...state,
      planCount: presentation.planCount,
    });
    assert.equal(state.stage, REVIEW_STAGE_COMPARE);
    assert.equal(
      getReviewPrimaryActionLabel({
        stage: REVIEW_STAGE_PLANS,
        planIndex: 1,
        planCount: 2,
      }),
      "Compare my plans"
    );
  });

  it("5. declined Paragraph 3 is omitted", () => {
    const presentation = buildFinalReviewPresentation({
      buckets: [
        plannedBucket(),
        plannedBucket({ paragraphRole: "analyze_letter" }),
        plannedBucket({ claim: "Stale third paragraph point text." }),
      ],
      wantThirdBucket: false,
      getEvidenceSlots: () => [qualifyingSlot()],
    });
    assert.equal(presentation.planCount, 2);
    assert.equal(presentation.compactCards.length, 2);
  });

  it("6. chosen Paragraph 3 is included", () => {
    const presentation = buildFinalReviewPresentation({
      buckets: [
        plannedBucket(),
        plannedBucket({ paragraphRole: "analyze_letter" }),
        plannedBucket({
          claim: "Third paragraph point with enough characters.",
          paragraphRole: "compare_both",
        }),
      ],
      wantThirdBucket: true,
      getEvidenceSlots: () => [qualifyingSlot()],
    });
    assert.equal(presentation.planCount, 3);
    assert.equal(presentation.compactCards[2].paragraphNumber, 3);
  });

  it("7–8. Stage 3 reveals reflection; gate remains 15 characters", () => {
    const presentation = buildFinalReviewPresentation({
      buckets: [plannedBucket(), plannedBucket({ paragraphRole: "analyze_letter" })],
      wantThirdBucket: false,
      getEvidenceSlots: () => [qualifyingSlot()],
      thesis: "Thesis",
    });
    const snap = buildReviewStageSnapshot({
      stage: REVIEW_STAGE_COMPARE,
      presentation,
    });
    assert.equal(snap.showsReflection, true);
    assert.equal(snap.reflectionMinChars, 15);
    assert.equal(REFLECTION_MIN_CHARS, 15);
  });

  it("9. edit actions retain approved destinations", () => {
    assert.equal(editStepForParagraphPart(0, "point"), 4);
    assert.equal(editStepForParagraphPart(0, "job"), 5);
    assert.equal(editStepForParagraphPart(0, "evidence"), 6);
    assert.equal(editStepForParagraphPart(0, "reasoning"), 7);
  });

  it("10. review-stage navigation writes no artifacts", () => {
    const advance = resolveReviewInternalAdvance({
      stage: REVIEW_STAGE_MAP,
      planIndex: 0,
      planCount: 2,
    });
    const back = resolveReviewInternalBack({
      stage: REVIEW_STAGE_PLANS,
      planIndex: 1,
    });
    assert.equal(advance.writesArtifacts, false);
    assert.equal(back.writesArtifacts, false);
    const presentation = buildFinalReviewPresentation({
      buckets: [plannedBucket(), plannedBucket()],
      wantThirdBucket: false,
      getEvidenceSlots: () => [qualifyingSlot()],
    });
    assert.equal(presentation.writesArtifacts, false);
  });

  it("11. success has three internal stages", () => {
    assert.equal(SUCCESS_STAGE_COUNT, 3);
    assert.equal(SUCCESS_STAGE_CELEBRATE, 1);
    assert.equal(SUCCESS_STAGE_EXPLORE, 2);
    assert.equal(SUCCESS_STAGE_HANDOFF, 3);
  });

  it("12. Success Stage 1 shows thesis and compact plan map", () => {
    const summary = buildModule4SuccessSummary({
      thesisArtifact: { thesis: "Exact saved thesis from Module 3 work." },
      studentBuckets: {
        buckets: [
          plannedBucket({ claim: "P1 point saved exactly here." }),
          plannedBucket({
            claim: "P2 point saved exactly here too.",
            paragraphRole: "analyze_letter",
          }),
        ],
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: () => [qualifyingSlot()],
    });
    const snap = buildSuccessStageSnapshot({
      stage: SUCCESS_STAGE_CELEBRATE,
      summary,
    });
    assert.equal(snap.showsThesis, true);
    assert.equal(snap.showsCompactMap, true);
    assert.equal(snap.thesis, "Exact saved thesis from Module 3 work.");
    assert.equal(snap.planCount, 2);
    assert.equal(snap.showsModule5Cta, false);
  });

  it("13–14. Success Stage 2 navigates real plans and evidence foundation", () => {
    const summary = buildModule4SuccessSummary({
      thesisArtifact: { thesis: "Thesis for explore stage checks." },
      studentBuckets: {
        buckets: [
          plannedBucket({ claim: "P1 point saved exactly here." }),
          plannedBucket({
            claim: "P2 point saved exactly here too.",
            paragraphRole: "analyze_letter",
          }),
        ],
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: (_b, index) =>
        index === 0 ? [qualifyingSlot()] : [letterSlot()],
    });
    const snap0 = buildSuccessStageSnapshot({
      stage: SUCCESS_STAGE_EXPLORE,
      summary,
      planIndex: 0,
    });
    const snap1 = buildSuccessStageSnapshot({
      stage: SUCCESS_STAGE_EXPLORE,
      summary,
      planIndex: 1,
    });
    assert.equal(snap0.activeParagraphNumber, 1);
    assert.equal(snap1.activeParagraphNumber, 2);
    assert.equal(snap0.evidenceFoundation.totalQualifyingEvidence, 2);
    assert.equal(snap0.evidenceFoundation.speechCount, 1);
    assert.equal(snap0.evidenceFoundation.letterCount, 1);
    assert.equal(snap0.evidenceFoundation.bothWorksVerified, true);
  });

  it("15. Success Stage 3 retains Module 5 and Review links", () => {
    const summary = buildModule4SuccessSummary({
      thesisArtifact: { thesis: "Thesis for handoff href checks." },
      studentBuckets: {
        buckets: [plannedBucket(), plannedBucket({ paragraphRole: "analyze_letter" })],
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: () => [qualifyingSlot()],
    });
    const snap = buildSuccessStageSnapshot({
      stage: SUCCESS_STAGE_HANDOFF,
      summary,
    });
    assert.equal(snap.primaryCtaHref, MODULE_FOUR_SUCCESS_MODULE5_HREF);
    assert.equal(snap.secondaryReviewHref, MODULE_FOUR_SUCCESS_REVIEW_HREF);
    assert.equal(snap.primaryCtaHref, "/modules/5");
    assert.equal(snap.secondaryReviewHref, "/modules/4");
  });

  it("Success Stage 3 renders every transformation step (regression)", () => {
    assert.ok(Array.isArray(SUCCESS_TRANSFORM_STEPS));
    assert.equal(SUCCESS_TRANSFORM_STEPS.length, 5);
    assert.deepEqual(SUCCESS_TRANSFORM_STEPS, [
      "Points become outline paragraph focuses",
      "Selected evidence comes along",
      "Reasoning becomes planning support",
      "You are not restarting",
      "Conclusion planning happens later in Module 5",
    ]);

    // Mirrors ModuleFourSuccessClient Stage 3 mapping — must not throw.
    const renderedLines = SUCCESS_TRANSFORM_STEPS.map((line) => line);
    assert.equal(renderedLines.length, SUCCESS_TRANSFORM_STEPS.length);
    for (const step of SUCCESS_TRANSFORM_STEPS) {
      assert.equal(typeof step, "string");
      assert.ok(step.length > 0);
      assert.ok(renderedLines.includes(step));
    }

    const summary = buildModule4SuccessSummary({
      thesisArtifact: { thesis: "Thesis for Stage 3 transform render." },
      studentBuckets: {
        buckets: [plannedBucket(), plannedBucket({ paragraphRole: "analyze_letter" })],
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: () => [qualifyingSlot()],
    });
    const snap = buildSuccessStageSnapshot({
      stage: SUCCESS_STAGE_HANDOFF,
      summary,
    });
    assert.equal(snap.showsTransformVisual, true);
    assert.equal(snap.showsModule5Cta, true);
  });

  it("16. reload-safe stage behavior does not mutate data", () => {
    const reload = successReloadResetsToCelebrate();
    assert.equal(reload.initialStage, SUCCESS_STAGE_CELEBRATE);
    assert.equal(reload.writesArtifacts, false);
    assert.equal(reload.mutatesPlans, false);

    const input = {
      thesisArtifact: { thesis: "Thesis stays unchanged on success read." },
      studentBuckets: {
        buckets: [plannedBucket(), plannedBucket({ paragraphRole: "analyze_letter" })],
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: () => [qualifyingSlot()],
    };
    const before = JSON.stringify(input.studentBuckets);
    resolveSuccessInternalAdvance({ stage: SUCCESS_STAGE_CELEBRATE });
    resolveSuccessInternalBack({ stage: SUCCESS_STAGE_EXPLORE });
    buildModule4SuccessSummary(input);
    assert.equal(JSON.stringify(input.studentBuckets), before);
  });

  it("17. teacher guidance changes by stage/plan", () => {
    const map = getReviewTeacherGuidance({ stage: REVIEW_STAGE_MAP });
    const p1 = getReviewTeacherGuidance({
      stage: REVIEW_STAGE_PLANS,
      planIndex: 0,
      planCount: 2,
    });
    const p2 = getReviewTeacherGuidance({
      stage: REVIEW_STAGE_PLANS,
      planIndex: 1,
      planCount: 2,
    });
    const compare = getReviewTeacherGuidance({ stage: REVIEW_STAGE_COMPARE });
    assert.notEqual(map.coaching, p1.coaching);
    assert.notEqual(p1.coaching, p2.coaching);
    assert.notEqual(p2.coaching, compare.coaching);

    const s1 = getSuccessTeacherGuidance({ stage: SUCCESS_STAGE_CELEBRATE });
    const s2 = getSuccessTeacherGuidance({
      stage: SUCCESS_STAGE_EXPLORE,
      planIndex: 0,
      planArtifacts: [{ paragraphNumber: 1, job: { label: "Analyze the speech" } }],
    });
    const s3 = getSuccessTeacherGuidance({ stage: SUCCESS_STAGE_HANDOFF });
    assert.notEqual(s1.coaching, s2.coaching);
    assert.notEqual(s2.coaching, s3.coaching);
  });

  it("18–19. desktop/mobile layout contracts", () => {
    assert.equal(REVIEW_LAYOUT_CONTRACT.desktop.workspaceRail, true);
    assert.equal(REVIEW_LAYOUT_CONTRACT.desktop.compactPlansGrid, true);
    assert.equal(REVIEW_LAYOUT_CONTRACT.mobile.singleColumn, true);
    assert.equal(REVIEW_LAYOUT_CONTRACT.mobile.noHorizontalScroll, true);
    assert.equal(SUCCESS_LAYOUT_CONTRACT.desktop.workspaceRail, true);
    assert.equal(SUCCESS_LAYOUT_CONTRACT.mobile.singleColumn, true);
    assert.equal(SUCCESS_LAYOUT_CONTRACT.mobile.noHorizontalScroll, true);
  });

  it("guided review shell uses reflection chrome without durable step change", () => {
    const chrome = getModule4PresentationChrome(17);
    assert.equal(chrome.useGuidedHandoffShell, true);
    assert.equal(chrome.useGuidedReviewShell, true);
    assert.equal(chrome.showNavFooter, false);
    assert.equal(chrome.showFullReferenceShelf, false);
  });
});
