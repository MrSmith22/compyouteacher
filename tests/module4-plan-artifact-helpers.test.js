const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildModule4ParagraphPlanArtifact,
  buildPlanArtifactEvidenceItems,
  buildRequiredPlanArtifacts,
  buildShelfCompletedPlanSummary,
  editStepForParagraphPart,
  jobLabelForPlanArtifact,
  reasoningReadyNextActionLabel,
  requiredParagraphBuckets,
} = require("../lib/module4/module4ParagraphPlanArtifactHelpers.js");

const {
  buildModule4SuccessSummary,
  MODULE_FOUR_SUCCESS_MODULE5_HREF,
  MODULE_FOUR_SUCCESS_REVIEW_HREF,
  MODULE4_SUCCESS_INCOMPLETE_MESSAGE,
} = require("../lib/module4/module4SuccessHelpers.js");

const {
  encodeCustomParagraphJob,
} = require("../lib/module4/module4PointJobHelpers.js");

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
    observation: "Shows urgency",
    module3Connection: {
      relationLabel: "Supports my idea",
      note: "This CONNECT note explains the link to the claim.",
      heading: "Module 3 connection",
    },
    ...overrides,
  };
}

function letterSlot(overrides = {}) {
  return qualifyingSlot({
    savedKey: "tchart:letter:ethos",
    row: {
      evidenceKey: "tchart:letter:ethos",
      type: "letter",
      category: "ethos",
      quote: "I am here because",
      observation: "Authority",
    },
    quote: "I am here because",
    ...overrides,
  });
}

describe("module4 Checkpoint 5 — plan artifacts + success handoff", () => {
  it("1. complete plan produces ready artifact", () => {
    const artifact = buildModule4ParagraphPlanArtifact({
      paragraphIndex: 0,
      bucket: plannedBucket(),
      evidenceSlots: [qualifyingSlot()],
      thesis: "Thesis text here that is long enough.",
      proofPlan: ["Speech note", "Letter note", "Compare note"],
    });
    assert.equal(artifact.ready, true);
    assert.equal(artifact.readyHeading, "Paragraph 1 plan is ready");
    assert.deepEqual(artifact.hierarchy, [
      "paragraph",
      "job",
      "point",
      "evidence",
      "reasoning",
      "thesis_connection",
    ]);
  });

  it("2. incomplete point prevents ready artifact", () => {
    const artifact = buildModule4ParagraphPlanArtifact({
      paragraphIndex: 0,
      bucket: plannedBucket({ claim: "short" }),
      evidenceSlots: [qualifyingSlot()],
    });
    assert.equal(artifact.ready, false);
  });

  it("3. incomplete job prevents ready artifact", () => {
    const artifact = buildModule4ParagraphPlanArtifact({
      paragraphIndex: 0,
      bucket: plannedBucket({ paragraphRole: "" }),
      evidenceSlots: [qualifyingSlot()],
    });
    assert.equal(artifact.ready, false);
  });

  it("4. missing evidence prevents ready artifact", () => {
    const artifact = buildModule4ParagraphPlanArtifact({
      paragraphIndex: 0,
      bucket: plannedBucket({ evidenceKeys: [] }),
      evidenceSlots: [],
    });
    assert.equal(artifact.ready, false);
  });

  it("5. short reasoning prevents ready artifact", () => {
    const artifact = buildModule4ParagraphPlanArtifact({
      paragraphIndex: 0,
      bucket: plannedBucket({ reasoning: "too short" }),
      evidenceSlots: [qualifyingSlot()],
    });
    assert.equal(artifact.ready, false);
  });

  it("6. artifact preserves exact point wording", () => {
    const claim = "Exact student point about rhetorical urgency.";
    const artifact = buildModule4ParagraphPlanArtifact({
      paragraphIndex: 0,
      bucket: plannedBucket({ claim }),
      evidenceSlots: [qualifyingSlot()],
    });
    assert.equal(artifact.point.text, claim);
  });

  it("7. artifact preserves exact custom job", () => {
    const custom = "Compare openings without naming appeals";
    const artifact = buildModule4ParagraphPlanArtifact({
      paragraphIndex: 1,
      bucket: plannedBucket({
        paragraphRole: encodeCustomParagraphJob(custom),
      }),
      evidenceSlots: [qualifyingSlot()],
    });
    assert.equal(artifact.job.label, custom);
    assert.equal(jobLabelForPlanArtifact(encodeCustomParagraphJob(custom)), custom);
  });

  it("8. artifact preserves exact reasoning", () => {
    const reasoning =
      "Exact reasoning connecting the quotation to the paragraph point and thesis.";
    const artifact = buildModule4ParagraphPlanArtifact({
      paragraphIndex: 0,
      bucket: plannedBucket({ reasoning }),
      evidenceSlots: [qualifyingSlot()],
    });
    assert.equal(artifact.reasoning.text, reasoning);
  });

  it("9. evidence shows source and appeal", () => {
    const items = buildPlanArtifactEvidenceItems([qualifyingSlot()]);
    assert.equal(items.length, 1);
    assert.equal(items[0].sourceLabel, "Speech");
    assert.equal(items[0].appeal, "pathos");
  });

  it("10. valid Module 3 connection appears", () => {
    const items = buildPlanArtifactEvidenceItems([qualifyingSlot()]);
    assert.equal(items[0].module3RelationLabel, "Supports my idea");
    assert.match(items[0].module3Note, /CONNECT note/);
  });

  it("11. unresolved empty evidence is excluded", () => {
    const items = buildPlanArtifactEvidenceItems([
      {
        savedKey: "gone",
        status: "missing",
        countsTowardEvidenceGate: false,
        row: null,
        quote: "",
      },
      qualifyingSlot(),
    ]);
    assert.equal(items.length, 1);
    assert.equal(items[0].savedKey, "tchart:speech:pathos");
  });

  it("12. alias-equivalent evidence is deduplicated", () => {
    const items = buildPlanArtifactEvidenceItems([
      qualifyingSlot({ savedKey: "tchart:speech:pathos" }),
      qualifyingSlot({
        savedKey: "evidence:tchart:student@example.com:speech:pathos",
        row: {
          evidenceKey: "evidence:tchart:student@example.com:speech:pathos",
          type: "speech",
          category: "pathos",
          quote: "justice delayed is justice denied",
        },
      }),
    ]);
    assert.equal(items.length, 1);
  });

  it("13–16. edit actions target correct steps", () => {
    assert.equal(editStepForParagraphPart(0, "point"), 4);
    assert.equal(editStepForParagraphPart(0, "job"), 5);
    assert.equal(editStepForParagraphPart(0, "evidence"), 6);
    assert.equal(editStepForParagraphPart(0, "reasoning"), 7);
    assert.equal(editStepForParagraphPart(1, "point"), 8);
    assert.equal(editStepForParagraphPart(1, "job"), 9);
    assert.equal(editStepForParagraphPart(1, "evidence"), 10);
    assert.equal(editStepForParagraphPart(1, "reasoning"), 11);
    assert.equal(editStepForParagraphPart(2, "point"), 13);
    assert.equal(editStepForParagraphPart(2, "job"), 14);
    assert.equal(editStepForParagraphPart(2, "evidence"), 15);
    assert.equal(editStepForParagraphPart(2, "reasoning"), 16);
  });

  it("17. editing one part preserves other parts (artifact edit targets only)", () => {
    const bucket = plannedBucket({
      claim: "Keep this point",
      paragraphRole: "compare_both",
      reasoning: "Keep this reasoning sentence intact for the plan.",
    });
    const artifact = buildModule4ParagraphPlanArtifact({
      paragraphIndex: 0,
      bucket,
      evidenceSlots: [qualifyingSlot()],
    });
    assert.equal(artifact.editTargets.point, 4);
    assert.equal(artifact.point.text, "Keep this point");
    assert.equal(artifact.job.label, "Compare both works");
    assert.equal(
      artifact.reasoning.text,
      "Keep this reasoning sentence intact for the plan."
    );
    assert.equal(artifact.evidence.count, 1);
  });

  it("18. shelf summary shows point/job/evidence count", () => {
    const summary = buildShelfCompletedPlanSummary({
      paragraphIndex: 0,
      bucket: plannedBucket(),
      evidenceSlots: [qualifyingSlot(), letterSlot()],
    });
    assert.equal(summary.paragraphNumber, 1);
    assert.equal(summary.planned, true);
    assert.equal(summary.point, plannedBucket().claim);
    assert.equal(summary.jobLabel, "Analyze the speech");
    assert.equal(summary.evidenceCount, 2);
  });

  it("19. final review includes two required plans", () => {
    const plans = buildRequiredPlanArtifacts({
      buckets: [
        plannedBucket({ claim: "Paragraph one exact point text." }),
        plannedBucket({
          claim: "Paragraph two exact point text here.",
          paragraphRole: "analyze_letter",
        }),
        plannedBucket({ claim: "Stale third should be omitted when declined." }),
      ],
      wantThirdBucket: false,
      getEvidenceSlots: () => [qualifyingSlot()],
      thesis: "Saved thesis",
    });
    assert.equal(plans.length, 2);
    assert.equal(plans[0].point.text, "Paragraph one exact point text.");
    assert.equal(plans[1].point.text, "Paragraph two exact point text here.");
  });

  it("20. chosen third plan appears", () => {
    const plans = buildRequiredPlanArtifacts({
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
    assert.equal(plans.length, 3);
    assert.equal(plans[2].paragraphNumber, 3);
  });

  it("21. declined stale third plan is omitted", () => {
    const required = requiredParagraphBuckets({
      buckets: [plannedBucket(), plannedBucket(), plannedBucket()],
      wantThirdBucket: false,
    });
    assert.equal(required.length, 2);
  });

  it("22–23. success shows exact thesis and real saved plans", () => {
    const thesis = "Exact saved thesis from Module 3 work.";
    const summary = buildModule4SuccessSummary({
      thesisArtifact: { thesis, proofPlan: ["A", "B", "C"] },
      studentBuckets: {
        buckets: [
          plannedBucket({ claim: "P1 point saved exactly here." }),
          plannedBucket({
            claim: "P2 point saved exactly here too.",
            paragraphRole: "analyze_letter",
          }),
        ],
        reflection: "Reflection is long enough here.",
        flow_state: { wantThirdBucket: false, step: 17 },
      },
      getEvidenceSlots: () => [qualifyingSlot()],
    });
    assert.equal(summary.incomplete, false);
    assert.equal(summary.thesis.text, thesis);
    assert.equal(summary.paragraphPlans.length, 2);
    assert.equal(summary.paragraphPlans[0].point.text, "P1 point saved exactly here.");
    assert.equal(
      summary.paragraphPlans[1].point.text,
      "P2 point saved exactly here too."
    );
  });

  it("24–25. evidence counts are accurate; both-works requires Speech and Letter", () => {
    const both = buildModule4SuccessSummary({
      thesisArtifact: { thesis: "A complete thesis for counting checks." },
      studentBuckets: {
        buckets: [plannedBucket(), plannedBucket({ paragraphRole: "analyze_letter" })],
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: (_bucket, index) =>
        index === 0 ? [qualifyingSlot()] : [letterSlot()],
    });
    assert.equal(both.evidenceFoundation.totalQualifyingEvidence, 2);
    assert.equal(both.evidenceFoundation.speechCount, 1);
    assert.equal(both.evidenceFoundation.letterCount, 1);
    assert.equal(both.evidenceFoundation.bothWorksVerified, true);

    const speechOnly = buildModule4SuccessSummary({
      thesisArtifact: { thesis: "A complete thesis for counting checks." },
      studentBuckets: {
        buckets: [plannedBucket(), plannedBucket({ paragraphRole: "analyze_letter" })],
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: () => [qualifyingSlot()],
    });
    assert.equal(speechOnly.evidenceFoundation.bothWorksVerified, false);
  });

  it("26. success read/refresh performs no plan write", () => {
    const input = {
      thesisArtifact: { thesis: "Thesis stays unchanged on success read." },
      studentBuckets: {
        buckets: [plannedBucket(), plannedBucket({ paragraphRole: "analyze_letter" })],
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: () => [qualifyingSlot()],
    };
    const before = JSON.stringify(input.studentBuckets);
    const first = buildModule4SuccessSummary(input);
    const second = buildModule4SuccessSummary(input);
    assert.equal(first.writesArtifacts, false);
    assert.equal(second.writesArtifacts, false);
    assert.equal(JSON.stringify(input.studentBuckets), before);
    assert.equal(first.paragraphPlans[0].point.text, second.paragraphPlans[0].point.text);
  });

  it("27. incomplete success state directs back to Module 4", () => {
    const summary = buildModule4SuccessSummary({
      thesisArtifact: { thesis: "Thesis present but plans incomplete." },
      studentBuckets: {
        buckets: [plannedBucket({ reasoning: "short" }), plannedBucket()],
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: () => [qualifyingSlot()],
    });
    assert.equal(summary.incomplete, true);
    assert.equal(summary.incompleteMessage, MODULE4_SUCCESS_INCOMPLETE_MESSAGE);
    assert.equal(summary.secondaryReviewHref, MODULE_FOUR_SUCCESS_REVIEW_HREF);
  });

  it("28–29. Module 5 CTA and review hrefs", () => {
    const summary = buildModule4SuccessSummary({
      thesisArtifact: { thesis: "Thesis for href checks in success summary." },
      studentBuckets: {
        buckets: [plannedBucket(), plannedBucket({ paragraphRole: "analyze_letter" })],
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: () => [qualifyingSlot()],
    });
    assert.equal(summary.primaryCtaHref, MODULE_FOUR_SUCCESS_MODULE5_HREF);
    assert.equal(summary.primaryCtaHref, "/modules/5");
    assert.equal(summary.secondaryReviewHref, "/modules/4");
  });

  it("reasoning ready next-action labels", () => {
    assert.equal(
      reasoningReadyNextActionLabel({ paragraphIndex: 0 }),
      "Plan Paragraph 2"
    );
    assert.equal(
      reasoningReadyNextActionLabel({ paragraphIndex: 1 }),
      "Decide whether you need Paragraph 3"
    );
    assert.equal(
      reasoningReadyNextActionLabel({ paragraphIndex: 2 }),
      "Review all paragraph plans"
    );
  });

  it("built-from label uses proof-plan role without rewriting claim", () => {
    const claim = "Student wrote this claim by hand.";
    const artifact = buildModule4ParagraphPlanArtifact({
      paragraphIndex: 0,
      bucket: plannedBucket({ claim, suggestionId: "proof-0" }),
      evidenceSlots: [qualifyingSlot()],
      proofPlan: ["Speech note", "Letter note"],
    });
    assert.equal(artifact.point.text, claim);
    assert.equal(artifact.point.builtFromLabel, "Built from: Speech rhetorical choices");
  });
});
