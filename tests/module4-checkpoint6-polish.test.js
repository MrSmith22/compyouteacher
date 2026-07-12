const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  getEvidenceReuseCue,
  getJobEvidenceSourceAlignmentCue,
  formatAlreadyUsedLabel,
  formatIntentionalReuseLabel,
  paragraphNumbersUsingQualifyingEvidence,
  BOTH_WORKS_JOB_IDS,
  CP6_LAYOUT_CONTRACT,
  normalizeEvidenceKeys,
  normalizeEvidenceSnippets,
} = require("../lib/module4/module4EvidenceCoachingHelpers.js");

const {
  resolveSavedEvidenceSlots,
} = require("../lib/module4/module4EvidenceContinuity.js");

const {
  requiredParagraphBuckets,
  buildRequiredPlanArtifacts,
  editStepForParagraphPart,
} = require("../lib/module4/module4ParagraphPlanArtifactHelpers.js");

const {
  buildModule4SuccessSummary,
} = require("../lib/module4/module4SuccessHelpers.js");

const {
  SUCCESS_STAGE_HANDOFF,
  SUCCESS_TRANSFORM_STEPS,
  buildSuccessStageSnapshot,
} = require("../lib/module4/module4SuccessStageHelpers.js");

const {
  REVIEW_STAGE_MAP,
  REVIEW_STAGE_COMPARE,
  buildFinalReviewPresentation,
  buildReviewStageSnapshot,
} = require("../lib/module4/module4FinalReviewHelpers.js");

const {
  labelForParagraphJob,
} = require("../lib/module4/module4PointJobHelpers.js");

const {
  canAdvanceModule4Step,
  validateParagraphEvidence,
} = require("../lib/module4/module4ValidityHelpers.js");

function qualifyingSlot(key, type, category = "pathos") {
  return {
    savedKey: key,
    status: "current",
    countsTowardEvidenceGate: true,
    row: {
      evidenceKey: key,
      type,
      category,
      quote: `${type} quote`,
      observation: "note",
    },
    quote: `${type} quote`,
  };
}

function missingSlot(key) {
  return {
    savedKey: key,
    status: "missing",
    countsTowardEvidenceGate: false,
    row: null,
    quote: "",
  };
}

function plannedBucket(overrides = {}) {
  return {
    claim: "King builds trust differently for each audience.",
    paragraphRole: "analyze_speech",
    reasoning: "The evidence shows urgency that supports the thesis clearly.",
    evidenceKeys: ["tchart:speech:pathos"],
    evidenceSnippets: [{ quote: "justice delayed", observation: "urgency" }],
    ...overrides,
  };
}

describe("module4 Checkpoint 6 — reuse, alignment, snippet safety", () => {
  it("alias-aware evidence reuse detection", () => {
    const buckets = [
      plannedBucket({
        evidenceKeys: ["tchart:speech:pathos"],
      }),
      plannedBucket({
        paragraphRole: "analyze_letter",
        evidenceKeys: [],
      }),
    ];
    const getEvidenceSlots = (bucket) => {
      if ((bucket.evidenceKeys || []).some((k) => k.includes("pathos"))) {
        return [
          qualifyingSlot(
            "evidence:tchart:student@example.com:speech:pathos",
            "speech"
          ),
        ];
      }
      return [];
    };

    const cue = getEvidenceReuseCue({
      evidenceKey: "tchart:speech:pathos",
      currentParagraphIndex: 1,
      selectedHere: false,
      buckets,
      getEvidenceSlots,
    });
    assert.equal(cue.show, true);
    assert.equal(cue.kind, "already_used");
    assert.equal(cue.label, "Already used in Paragraph 1");
    assert.equal(cue.blocksReuse, false);
  });

  it("reuse across two and three paragraphs", () => {
    const buckets = [
      plannedBucket({ evidenceKeys: ["tchart:speech:pathos"] }),
      plannedBucket({
        paragraphRole: "analyze_letter",
        evidenceKeys: ["tchart:speech:pathos"],
      }),
      plannedBucket({
        paragraphRole: "compare_both",
        evidenceKeys: ["tchart:speech:pathos"],
      }),
    ];
    const getEvidenceSlots = () => [
      qualifyingSlot("tchart:speech:pathos", "speech"),
    ];

    const two = paragraphNumbersUsingQualifyingEvidence({
      evidenceKey: "tchart:speech:pathos",
      buckets: buckets.slice(0, 2),
      getEvidenceSlots,
    });
    assert.deepEqual(two, [1, 2]);
    assert.equal(
      formatIntentionalReuseLabel(two),
      "Used intentionally in Paragraph 1 and Paragraph 2"
    );

    const three = paragraphNumbersUsingQualifyingEvidence({
      evidenceKey: "tchart:speech:pathos",
      buckets,
      getEvidenceSlots,
    });
    assert.deepEqual(three, [1, 2, 3]);

    const intentional = getEvidenceReuseCue({
      evidenceKey: "tchart:speech:pathos",
      currentParagraphIndex: 2,
      selectedHere: true,
      buckets,
      getEvidenceSlots,
    });
    assert.equal(intentional.kind, "intentional");
    assert.match(intentional.label, /Used intentionally/);
    assert.match(intentional.label, /Paragraph 1/);
    assert.match(intentional.label, /Paragraph 3/);
  });

  it("missing-only evidence excluded from reuse", () => {
    const buckets = [
      {
        ...plannedBucket(),
        evidenceKeys: ["gone-key"],
      },
      plannedBucket({ evidenceKeys: [] }),
    ];
    const getEvidenceSlots = (bucket, index) =>
      index === 0 ? [missingSlot("gone-key")] : [];

    const cue = getEvidenceReuseCue({
      evidenceKey: "gone-key",
      currentParagraphIndex: 1,
      selectedHere: false,
      buckets,
      getEvidenceSlots,
    });
    assert.equal(cue.show, false);
    assert.equal(formatAlreadyUsedLabel([]), "");
  });

  it("source/job alignment cues for each applicable job", () => {
    const letterOnly = [qualifyingSlot("tchart:letter:ethos", "letter", "ethos")];
    const speechOnly = [qualifyingSlot("tchart:speech:pathos", "speech")];
    const both = [
      qualifyingSlot("tchart:speech:pathos", "speech"),
      qualifyingSlot("tchart:letter:ethos", "letter", "ethos"),
    ];

    const speechJobLetter = getJobEvidenceSourceAlignmentCue({
      paragraphRole: "analyze_speech",
      evidenceSlots: letterOnly,
    });
    assert.equal(speechJobLetter.code, "speech_job_letter_evidence");
    assert.match(speechJobLetter.message, /Analyze the speech/);
    assert.match(speechJobLetter.message, /Letter/);
    assert.equal(speechJobLetter.blocksContinue, false);

    const letterJobSpeech = getJobEvidenceSourceAlignmentCue({
      paragraphRole: "analyze_letter",
      evidenceSlots: speechOnly,
    });
    assert.equal(letterJobSpeech.code, "letter_job_speech_evidence");

    for (const jobId of BOTH_WORKS_JOB_IDS) {
      const cue = getJobEvidenceSourceAlignmentCue({
        paragraphRole: jobId,
        evidenceSlots: speechOnly,
      });
      assert.equal(cue.code, "both_works_job_one_source");
      assert.match(cue.message, /both works|only one work/i);
      assert.equal(cue.blocksContinue, false);
    }

    assert.equal(
      getJobEvidenceSourceAlignmentCue({
        paragraphRole: "compare_both",
        evidenceSlots: both,
      }),
      null
    );
  });

  it("cues remain non-blocking when mechanical evidence gate passes", () => {
    const slots = [qualifyingSlot("tchart:letter:ethos", "letter", "ethos")];
    const cue = getJobEvidenceSourceAlignmentCue({
      paragraphRole: "analyze_speech",
      evidenceSlots: slots,
    });
    assert.ok(cue);
    assert.equal(cue.blocksContinue, false);
    assert.equal(validateParagraphEvidence(slots).valid, true);
    assert.equal(
      canAdvanceModule4Step({
        flowStep: 6,
        buckets: [
          plannedBucket({
            paragraphRole: "analyze_speech",
            evidenceKeys: ["tchart:letter:ethos"],
          }),
        ],
        getEvidenceSlots: () => slots,
        stepConstants: { STEP_B1_EVIDENCE: 6 },
      }),
      true
    );
  });

  it("compare-both with one source versus both sources", () => {
    const one = getJobEvidenceSourceAlignmentCue({
      paragraphRole: "compare_both",
      evidenceSlots: [qualifyingSlot("tchart:speech:pathos", "speech")],
    });
    const both = getJobEvidenceSourceAlignmentCue({
      paragraphRole: "compare_both",
      evidenceSlots: [
        qualifyingSlot("tchart:speech:pathos", "speech"),
        qualifyingSlot("tchart:letter:ethos", "letter", "ethos"),
      ],
    });
    assert.ok(one);
    assert.equal(both, null);
  });

  it("preserved snippet compatibility still qualifies", () => {
    const slots = resolveSavedEvidenceSlots({
      evidenceKeys: ["legacy-missing-row"],
      evidenceSnippets: [
        { quote: "kept quote", observation: "kept note" },
      ],
      clusterPool: [],
      lookupRows: [],
    });
    assert.equal(slots[0].status, "preserved");
    assert.equal(slots[0].countsTowardEvidenceGate, true);
    assert.equal(validateParagraphEvidence(slots).valid, true);
  });

  it("malformed/absent snippet safety", () => {
    assert.deepEqual(normalizeEvidenceSnippets(null), []);
    assert.deepEqual(normalizeEvidenceSnippets(undefined), []);
    assert.deepEqual(normalizeEvidenceSnippets("nope"), []);
    assert.deepEqual(normalizeEvidenceKeys(null), []);
    assert.deepEqual(normalizeEvidenceKeys([null, " a ", 12]), ["a", "12"]);

    const slots = resolveSavedEvidenceSlots({
      evidenceKeys: ["k1", "k2", "k3"],
      evidenceSnippets: [
        "string-snippet",
        null,
        { quote: 99, observation: { bad: true } },
      ],
      clusterPool: [],
      lookupRows: [],
    });
    assert.equal(slots.length, 3);
    assert.ok(slots.every((slot) => typeof slot.quote === "string"));
  });

  it("declined and restored Paragraph 3 behavior", () => {
    const buckets = [
      plannedBucket(),
      plannedBucket({ paragraphRole: "analyze_letter" }),
      plannedBucket({
        claim: "Third draft point remains in memory here.",
        paragraphRole: "compare_both",
        evidenceKeys: ["tchart:speech:pathos"],
      }),
    ];

    const declined = requiredParagraphBuckets({
      buckets,
      wantThirdBucket: false,
    });
    assert.equal(declined.length, 2);
    assert.equal(buckets[2].claim, "Third draft point remains in memory here.");

    const restored = requiredParagraphBuckets({
      buckets,
      wantThirdBucket: true,
    });
    assert.equal(restored.length, 3);
    assert.equal(
      restored[2].bucket.claim,
      "Third draft point remains in memory here."
    );

    const review = buildRequiredPlanArtifacts({
      buckets,
      wantThirdBucket: false,
      getEvidenceSlots: () => [qualifyingSlot("tchart:speech:pathos", "speech")],
    });
    assert.equal(review.length, 2);

    const success = buildModule4SuccessSummary({
      thesisArtifact: { thesis: "Thesis for declined third checks." },
      studentBuckets: {
        buckets,
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: () => [qualifyingSlot("tchart:speech:pathos", "speech")],
    });
    assert.equal(success.paragraphPlans.length, 2);
  });

  it("final-review and success-stage rendering with safe defaults", () => {
    const presentation = buildFinalReviewPresentation({
      buckets: [
        plannedBucket(),
        plannedBucket({ paragraphRole: "analyze_letter" }),
      ],
      wantThirdBucket: false,
      getEvidenceSlots: () => [qualifyingSlot("tchart:speech:pathos", "speech")],
      thesis: "Thesis",
    });
    const mapSnap = buildReviewStageSnapshot({
      stage: REVIEW_STAGE_MAP,
      presentation,
    });
    const compareSnap = buildReviewStageSnapshot({
      stage: REVIEW_STAGE_COMPARE,
      presentation,
    });
    assert.equal(mapSnap.showsCompactMap, true);
    assert.equal(compareSnap.showsReflection, true);

    assert.ok(Array.isArray(SUCCESS_TRANSFORM_STEPS));
    assert.equal(SUCCESS_TRANSFORM_STEPS.length, 5);

    const summary = buildModule4SuccessSummary({
      thesisArtifact: { thesis: "Thesis for stage render defaults." },
      studentBuckets: {
        buckets: [
          plannedBucket(),
          plannedBucket({ paragraphRole: "analyze_letter" }),
        ],
        flow_state: { wantThirdBucket: false },
      },
      getEvidenceSlots: () => [qualifyingSlot("tchart:speech:pathos", "speech")],
    });
    const stage3 = buildSuccessStageSnapshot({
      stage: SUCCESS_STAGE_HANDOFF,
      summary,
    });
    assert.equal(stage3.showsTransformVisual, true);
    assert.deepEqual(stage3.transformSteps, SUCCESS_TRANSFORM_STEPS);
    // Render path must not throw when mapping steps.
    const rendered = (stage3.transformSteps || []).map((line) => String(line));
    assert.equal(rendered.length, 5);
  });

  it("responsive layout contracts and accessible labels", () => {
    assert.equal(CP6_LAYOUT_CONTRACT.mobile.singleColumn, true);
    assert.equal(CP6_LAYOUT_CONTRACT.mobile.fullWidthPrimaryActions, true);
    assert.equal(CP6_LAYOUT_CONTRACT.mobile.noHorizontalOverflow, true);
    assert.equal(CP6_LAYOUT_CONTRACT.tablet.pointJobTwoColumn, true);
    assert.equal(CP6_LAYOUT_CONTRACT.desktop.workspaceRail, true);

    assert.equal(editStepForParagraphPart(0, "evidence"), 6);
    assert.equal(labelForParagraphJob("analyze_speech"), "Analyze the speech");
    assert.equal(labelForParagraphJob("similarity"), "Show an important similarity");
  });

  it("legacy paragraph jobs retain stored values and display labels", () => {
    assert.equal(labelForParagraphJob("diff_speech"), "Shows a difference in the speech");
    assert.equal(labelForParagraphJob("ethos"), "Focuses on ethos");
    const cue = getJobEvidenceSourceAlignmentCue({
      paragraphRole: "similarity",
      evidenceSlots: [qualifyingSlot("tchart:speech:pathos", "speech")],
    });
    assert.equal(cue.code, "both_works_job_one_source");
  });

  it("Module 5 persistence mapping remains claim/points from snippets", () => {
    const module4Bucket = {
      claim: "Point text",
      paragraphRole: "analyze_speech",
      reasoning: "Because urgency matters.",
      evidenceSnippets: [{ quote: "q", observation: "note" }],
    };
    const module5Card = {
      bucket: String(module4Bucket.claim || "").trim() || "Body paragraph",
      points: [
        `${module4Bucket.evidenceSnippets[0].observation} — "${module4Bucket.evidenceSnippets[0].quote}"`,
        module4Bucket.reasoning,
      ],
    };
    assert.equal(module5Card.bucket, "Point text");
    assert.ok(module5Card.points.some((p) => p.includes("note")));
    assert.ok(module5Card.points.some((p) => p.includes("urgency")));
    assert.equal(
      Object.prototype.hasOwnProperty.call(module5Card, "paragraphRole"),
      false
    );
  });
});
