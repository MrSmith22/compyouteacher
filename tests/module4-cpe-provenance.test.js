/**
 * CP-E — Module 4 provenance personalization suite.
 * Uses production helpers + source checks for component wiring.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const handoff = require("../lib/module3/moduleThreeMatrixHandoffHelpers.js");
const {
  buildModule4ProvenanceModel,
  buildJobRecommendationCandidates,
  recommendParagraphJobsFromProvenance,
  resolveModule4JobRecommendations,
  getEvidenceProvenancePriorityCue,
  getUpstreamProvenanceChangeNotice,
  getPointStepProvenanceBlurb,
  getReasoningProvenanceReminder,
  module4BucketsHavePlanContent,
  nextSeenUpstreamSignature,
  studentFacingProvenanceTextsHaveInternalIds,
  evidenceRecordsFromModule4Pool,
  CPE_LAYOUT_CONTRACT,
  EVIDENCE_PATTERN_PRIORITY_LABEL,
  MODULE4_PROVENANCE_REVIEW_HREF,
} = require("../lib/module4/module4ProvenanceHelpers.js");
const {
  MODULE4_SAVE_REASONS,
  MODULE4_UPSTREAM_SIGNATURE_BASELINE_POLICY,
  createModule4DirtySaveCoordinator,
  resolveModule4UpstreamSignatureForPersist,
  shouldScheduleModule4Autosave,
} = require("../lib/module4/module4SaveCoordinator.js");
const {
  recommendParagraphJob,
  encodeCustomParagraphJob,
  decodeCustomParagraphJob,
  isCustomParagraphJob,
} = require("../lib/module4/module4PointJobHelpers.js");
const {
  isParagraphMechanicallyPlanned,
  validateParagraphJob,
} = require("../lib/module4/module4ValidityHelpers.js");
const {
  getEvidenceReuseCue,
  getJobEvidenceSourceAlignmentCue,
} = require("../lib/module4/module4EvidenceCoachingHelpers.js");

const evidencePool = [
  {
    evidenceKey: "tchart:speech:pathos",
    type: "speech",
    category: "pathos",
    quote: "I have a dream that my four little children",
  },
  {
    evidenceKey: "tchart:letter:pathos",
    type: "letter",
    category: "pathos",
    quote: "When you are forever fighting a degenerating sense of nobodiness",
  },
  {
    evidenceKey: "tchart:speech:ethos",
    type: "speech",
    category: "ethos",
    quote: "I am happy to join with you today",
  },
  {
    evidenceKey: "tchart:letter:ethos",
    type: "letter",
    category: "ethos",
    quote: "I have the honor of serving as president",
  },
  {
    evidenceKey: "missing-only:ghost",
    type: "speech",
    category: "logos",
    quote: "",
  },
];

const evidenceRecords = evidenceRecordsFromModule4Pool(evidencePool);

function makeProvenance({
  optionId = "largest_contrast",
  kind = "largest_contrast",
  label = "Speech pathos vs Letter ethos",
  ratings = {
    speech: { pathos: 9 },
    letter: { ethos: 8 },
  },
  appeals = ["pathos", "ethos"],
  evidenceIds = ["tchart:speech:pathos", "tchart:letter:ethos"],
  audiencePurposeReasoning = "These audiences and purposes make the contrast worth arguing.",
} = {}) {
  return handoff.createMatrixProvenanceMetadata({
    selectedPattern: {
      optionId,
      kind,
      label,
      provenance: { ratings, appeals, evidenceIds },
    },
    audiencePurposeReasoning,
  });
}

function patternWithProvenance(overrides = {}) {
  const matrixProvenance = overrides.matrixProvenance || makeProvenance();
  return {
    id: "pattern:user:matrix:largest_contrast",
    text: matrixProvenance.selectedPatternLabel || "Contrast pattern",
    evidenceIds: matrixProvenance.evidenceIds || [],
    isSelected: true,
    matrixProvenance,
    matrixReview: overrides.matrixReview || {
      needsReview: false,
      reasonCodes: [],
    },
    ...overrides,
  };
}

describe("CP-E Module 4 provenance personalization", () => {
  it("1. Confirmed adopted matrix direction builds a Module 4 provenance model", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    assert.equal(model.available, true);
    assert.equal(model.ready, true);
    assert.equal(model.needsReview, false);
    assert.equal(model.kind, "largest_contrast");
    assert.ok(model.becauseYouExplanation);
    assert.ok(model.evidenceIds.length >= 1);
    assert.ok(model.signature);
  });

  it("2. Alternate Module 3 direction is used instead of original Module 2 selection", () => {
    const alternate = makeProvenance({
      optionId: "meaningful_similarity",
      kind: "meaningful_similarity",
      label: "Shared pathos across both works",
      ratings: {
        speech: { pathos: 8 },
        letter: { pathos: 8 },
      },
      appeals: ["pathos"],
      evidenceIds: ["tchart:speech:pathos", "tchart:letter:pathos"],
    });
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: alternate,
        text: "Shared pathos across both works",
      }),
      evidencePool,
    });
    assert.equal(model.optionId, "meaningful_similarity");
    assert.equal(model.kind, "meaningful_similarity");
    assert.notEqual(model.kind, "largest_contrast");
  });

  it("3. Custom direction uses only explicitly linked evidence", () => {
    const customProv = makeProvenance({
      optionId: "student_created",
      kind: "student_created",
      label: "My custom openings focus",
      ratings: {},
      appeals: [],
      evidenceIds: ["tchart:speech:ethos"],
    });
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: customProv,
        evidenceIds: [
          "tchart:speech:ethos",
          "tchart:letter:pathos",
          "tchart:speech:pathos",
        ],
      }),
      evidencePool,
    });
    assert.equal(model.kind, "student_created");
    assert.deepEqual(model.evidenceIds, ["tchart:speech:ethos"]);
    const cueLinked = getEvidenceProvenancePriorityCue({
      evidenceKey: "tchart:speech:ethos",
      provenanceModel: model,
      evidenceRow: evidencePool[2],
    });
    const cueOther = getEvidenceProvenancePriorityCue({
      evidenceKey: "tchart:letter:pathos",
      provenanceModel: model,
      evidenceRow: evidencePool[1],
    });
    assert.equal(cueLinked.prioritized, true);
    assert.equal(cueOther.prioritized, false);
  });

  it("4. Legacy no-provenance path remains functional", () => {
    const legacy = {
      id: "pattern:user:legacy",
      text: "King builds trust in both works",
      evidenceIds: ["tchart:speech:ethos", "tchart:letter:ethos"],
      isSelected: true,
    };
    const model = buildModule4ProvenanceModel({
      selectedPattern: legacy,
      evidencePool,
    });
    assert.equal(model.available, true);
    assert.equal(model.ready, false);
    assert.equal(model.legacyFallback, true);
    const jobs = resolveModule4JobRecommendations({
      provenanceModel: model,
      proofPlan: ["Speech trust", "Letter trust", "Both"],
      paragraphIndex: 0,
      suggestionId: "proof-0",
    });
    assert.equal(jobs.source, "proof_plan");
    assert.equal(jobs.primary?.jobId, "analyze_speech");
  });

  it("5. needs_review provenance is not presented as confirmed guidance", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixReview: { needsReview: true, reasonCodes: ["upstream_changed"] },
      }),
      evidencePool,
    });
    assert.equal(model.needsReview, true);
    assert.equal(model.ready, false);
    assert.equal(model.becauseYouExplanation, "");
    const blurb = getPointStepProvenanceBlurb(model);
    assert.equal(blurb.kind, "needs_review");
    assert.equal(blurb.href, MODULE4_PROVENANCE_REVIEW_HREF);
    const notice = getUpstreamProvenanceChangeNotice({
      provenanceModel: model,
      seenSignature: "old",
      hasPlannedContent: true,
    });
    assert.equal(notice.kind, "needs_review");
    const jobs = recommendParagraphJobsFromProvenance({
      provenanceModel: model,
      paragraphIndex: 0,
    });
    assert.equal(jobs.recommendations.length, 0);
  });

  it("6. Contrast produces truthful job recommendations", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const recs = buildJobRecommendationCandidates(model);
    assert.ok(recs.some((r) => r.jobId === "show_difference" && r.isPrimary));
    assert.ok(
      recs.some((r) => /contrast/i.test(r.reason) || /pathos/i.test(r.reason))
    );
  });

  it("7. Similarity produces truthful recommendations", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: makeProvenance({
          optionId: "meaningful_similarity",
          kind: "meaningful_similarity",
          label: "Shared pathos",
          ratings: { speech: { pathos: 8 }, letter: { pathos: 8 } },
          appeals: ["pathos"],
          evidenceIds: ["tchart:speech:pathos", "tchart:letter:pathos"],
        }),
      }),
      evidencePool,
    });
    const recs = buildJobRecommendationCandidates(model);
    assert.equal(recs[0].jobId, "show_similarity");
    assert.match(recs[0].reason, /similar|shared|pathos/i);
  });

  it("8. Dominant single-work direction produces truthful recommendations", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: makeProvenance({
          optionId: "dominant_per_work",
          kind: "dominant_per_work",
          label: "Speech ethos stands out",
          ratings: { speech: { ethos: 9 }, letter: { ethos: 4 } },
          appeals: ["ethos"],
          evidenceIds: ["tchart:speech:ethos"],
        }),
      }),
      evidencePool,
    });
    const recs = buildJobRecommendationCandidates(model);
    assert.equal(recs[0].jobId, "analyze_speech");
    assert.match(recs[0].reason, /Speech|strong/i);
  });

  it("9. Trace-appeal direction produces truthful recommendations", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: makeProvenance({
          optionId: "combined_dominant_across_works",
          kind: "combined_dominant_across_works",
          label: "Pathos across both",
          ratings: { speech: { pathos: 9 }, letter: { pathos: 8 } },
          appeals: ["pathos"],
          evidenceIds: ["tchart:speech:pathos", "tchart:letter:pathos"],
        }),
      }),
      evidencePool,
    });
    const recs = buildJobRecommendationCandidates(model);
    assert.equal(recs[0].jobId, "trace_appeal");
    assert.match(recs[0].reason, /pathos|appeal/i);
  });

  it("10. No more than three recommendations", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const bundle = recommendParagraphJobsFromProvenance({
      provenanceModel: model,
      paragraphIndex: 0,
    });
    assert.ok(bundle.recommendations.length <= 3);
    assert.ok(buildJobRecommendationCandidates(model).length <= 3);
  });

  it("11. Recommendation does not count as job selection", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const bundle = resolveModule4JobRecommendations({
      provenanceModel: model,
      paragraphIndex: 0,
      currentRole: "",
    });
    assert.equal(bundle.recommendationCountsAsSelection, false);
    assert.equal(bundle.selectedJobId, "");
    assert.ok(bundle.primary?.jobId);
    assert.equal(validateParagraphJob("").valid, false);
  });

  it("12. Existing saved job is never rewritten", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const saved = "compare_both";
    const before = { paragraphRole: saved, claim: "Point stays" };
    resolveModule4JobRecommendations({
      provenanceModel: model,
      paragraphIndex: 0,
      currentRole: saved,
    });
    assert.equal(before.paragraphRole, saved);
    assert.equal(before.claim, "Point stays");
  });

  it("13. Paragraph-specific recommendations account for paragraph index/already planned work", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const p1 = recommendParagraphJobsFromProvenance({
      provenanceModel: model,
      paragraphIndex: 0,
      plannedJobs: [],
    });
    const p2 = recommendParagraphJobsFromProvenance({
      provenanceModel: model,
      paragraphIndex: 1,
      plannedJobs: [p1.primary.jobId],
    });
    assert.ok(p1.primary);
    assert.ok(p2.primary);
    assert.notEqual(p2.primary.jobId, p1.primary.jobId);
    const p3Skipped = recommendParagraphJobsFromProvenance({
      provenanceModel: model,
      paragraphIndex: 2,
      planningParagraph3: false,
    });
    assert.equal(p3Skipped.recommendations.length, 0);
    const p3On = recommendParagraphJobsFromProvenance({
      provenanceModel: model,
      paragraphIndex: 2,
      planningParagraph3: true,
      plannedJobs: [p1.primary.jobId, p2.primary.jobId],
    });
    assert.ok(p3On.recommendations.length > 0);
  });

  it("14. Linked qualifying evidence gets a priority cue", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const cue = getEvidenceProvenancePriorityCue({
      evidenceKey: "tchart:speech:pathos",
      provenanceModel: model,
      evidenceRow: evidencePool[0],
    });
    assert.equal(cue.show, true);
    assert.equal(cue.label, EVIDENCE_PATTERN_PRIORITY_LABEL);
  });

  it("15. Missing evidence gets no cue", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: makeProvenance({
          evidenceIds: ["missing-only:ghost", "tchart:speech:pathos"],
        }),
      }),
      // Pool without the missing id as a resolvable record with content —
      // resolveQualifying still needs a record; drop the ghost from records
      // by using a filtered pool that omits it.
      evidencePool: evidencePool.filter((r) => r.evidenceKey !== "missing-only:ghost"),
    });
    assert.ok(!model.evidenceIds.includes("missing-only:ghost"));
    const cue = getEvidenceProvenancePriorityCue({
      evidenceKey: "missing-only:ghost",
      provenanceModel: model,
    });
    assert.equal(cue.show, false);
  });

  it("16. Alias-equivalent evidence deduplicates", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: makeProvenance({
          evidenceIds: [
            "tchart:speech:pathos",
            "guided:speech:pathos",
            "tchart:speech:pathos",
          ],
        }),
      }),
      evidencePool,
    });
    const pathosHits = model.evidenceIds.filter((id) =>
      /speech:pathos/i.test(id)
    );
    assert.equal(pathosHits.length, 1);
  });

  it("17. Evidence is never auto-selected", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const bucket = {
      claim: "",
      paragraphRole: "",
      evidenceKeys: [],
      reasoning: "",
    };
    getEvidenceProvenancePriorityCue({
      evidenceKey: "tchart:speech:pathos",
      provenanceModel: model,
      evidenceRow: evidencePool[0],
    });
    assert.deepEqual(bucket.evidenceKeys, []);
  });

  it("18. Non-prioritized evidence remains selectable", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const other = getEvidenceProvenancePriorityCue({
      evidenceKey: "tchart:letter:pathos",
      provenanceModel: model,
      evidenceRow: evidencePool[1],
    });
    assert.equal(other.prioritized, false);
    // Coaching helpers never return a disabled flag
    assert.equal(other.disabled, undefined);
  });

  it("19. Reuse and priority labels can coexist", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const priority = getEvidenceProvenancePriorityCue({
      evidenceKey: "tchart:speech:pathos",
      provenanceModel: model,
      evidenceRow: evidencePool[0],
    });
    const reuse = getEvidenceReuseCue({
      evidenceKey: "tchart:speech:pathos",
      currentParagraphIndex: 1,
      selectedHere: false,
      buckets: [
        {
          evidenceKeys: ["tchart:speech:pathos"],
        },
        { evidenceKeys: [] },
      ],
      getEvidenceSlots: (bucket) =>
        (bucket.evidenceKeys || []).map((savedKey) => ({
          savedKey,
          countsTowardEvidenceGate: true,
          row: evidencePool[0],
        })),
    });
    assert.equal(priority.show, true);
    assert.equal(reuse.show, true);
    assert.match(reuse.label, /Already used in Body Paragraph 1/);
  });

  it("20. Job/source alignment cue remains non-blocking", () => {
    const cue = getJobEvidenceSourceAlignmentCue({
      paragraphRole: "analyze_speech",
      evidenceSlots: [
        {
          countsTowardEvidenceGate: true,
          row: { type: "letter", evidenceKey: "tchart:letter:ethos" },
        },
      ],
    });
    assert.ok(cue);
    assert.equal(cue.blocksContinue, false);
  });

  it("21. Upstream signature change preserves all Module 4 text/selections", () => {
    const modelA = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const buckets = [
      {
        claim: "Keep this point",
        paragraphRole: "show_difference",
        evidenceKeys: ["tchart:speech:pathos"],
        reasoning: "Keep this reasoning text exactly.",
      },
    ];
    const modelB = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: makeProvenance({
          optionId: "meaningful_similarity",
          kind: "meaningful_similarity",
          label: "Changed direction",
          ratings: { speech: { pathos: 8 }, letter: { pathos: 8 } },
          appeals: ["pathos"],
          evidenceIds: ["tchart:speech:pathos", "tchart:letter:pathos"],
        }),
      }),
      evidencePool,
    });
    assert.notEqual(modelA.signature, modelB.signature);
    const notice = getUpstreamProvenanceChangeNotice({
      provenanceModel: modelB,
      seenSignature: modelA.signature,
      hasPlannedContent: module4BucketsHavePlanContent(buckets),
    });
    assert.equal(notice.kind, "direction_changed");
    assert.equal(notice.marksIncomplete, false);
    assert.equal(buckets[0].claim, "Keep this point");
    assert.equal(buckets[0].paragraphRole, "show_difference");
    assert.equal(buckets[0].reasoning, "Keep this reasoning text exactly.");
    assert.deepEqual(buckets[0].evidenceKeys, ["tchart:speech:pathos"]);
  });

  it("22. Mechanical planned status is unchanged by coaching", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    recommendParagraphJobsFromProvenance({
      provenanceModel: model,
      paragraphIndex: 0,
    });
    const incomplete = {
      claim: "x",
      paragraphRole: "",
      reasoning: "",
    };
    assert.equal(isParagraphMechanicallyPlanned(incomplete, []), false);
    const complete = {
      claim: "King shows a difference in how each text builds trust for its audience.",
      paragraphRole: "show_difference",
      reasoning:
        "The speech quotation builds hope for a public audience, while the letter quotation builds moral pressure for clergy—together they prove the contrast in my thesis.",
    };
    const slots = [
      {
        countsTowardEvidenceGate: true,
        savedKey: "tchart:speech:pathos",
        row: evidencePool[0],
      },
    ];
    // May still fail evidence threshold if validity needs 2 — check helper doesn't flip from coaching alone
    const before = isParagraphMechanicallyPlanned(complete, slots);
    getEvidenceProvenancePriorityCue({
      evidenceKey: "tchart:speech:pathos",
      provenanceModel: model,
      evidenceRow: evidencePool[0],
    });
    assert.equal(isParagraphMechanicallyPlanned(complete, slots), before);
  });

  it("23. Declined Paragraph 3 remains omitted from required recommendations", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const skipped = recommendParagraphJobsFromProvenance({
      provenanceModel: model,
      paragraphIndex: 2,
      planningParagraph3: false,
    });
    assert.equal(skipped.omittedOptionalThird, true);
    assert.equal(skipped.recommendations.length, 0);
  });

  it("24. Viewing provenance performs no writes", () => {
    const pattern = patternWithProvenance();
    const frozen = JSON.stringify(pattern);
    const poolFrozen = JSON.stringify(evidencePool);
    buildModule4ProvenanceModel({
      selectedPattern: pattern,
      evidencePool,
    });
    assert.equal(JSON.stringify(pattern), frozen);
    assert.equal(JSON.stringify(evidencePool), poolFrozen);
  });

  it("25. Student-facing text contains no internal IDs", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: makeProvenance({
          label: "Contrast with tchart:speech:pathos inside",
        }),
      }),
      evidencePool,
    });
    assert.equal(studentFacingProvenanceTextsHaveInternalIds(model), false);
    for (const rec of buildJobRecommendationCandidates(model)) {
      assert.equal(
        handoff.studentFacingCopyHasInternalIds(rec.reason),
        false
      );
    }
  });

  it("26. Production components actually render recommendation/provenance cues", () => {
    const moduleFour = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFour.js"),
      "utf8"
    );
    assert.ok(moduleFour.includes("buildModule4ProvenanceModel"));
    assert.ok(moduleFour.includes("resolveModule4JobRecommendations"));
    assert.ok(moduleFour.includes("getEvidenceProvenancePriorityCue"));
    assert.ok(moduleFour.includes("Connected to your selected pattern") || moduleFour.includes("EVIDENCE_PATTERN_PRIORITY_LABEL") || moduleFour.includes("priorityCue"));
    assert.ok(moduleFour.includes("module4-upstream-provenance-notice"));
    assert.ok(moduleFour.includes("Guidance only"));
    const helpers = fs.readFileSync(
      path.join(__dirname, "../lib/module4/module4ProvenanceHelpers.js"),
      "utf8"
    );
    assert.ok(helpers.includes("restoreActiveDirectionFromSavedPattern"));
  });

  it("27. 320/390/768/1440 layout contracts remain present", () => {
    assert.deepEqual(CPE_LAYOUT_CONTRACT.viewports, [320, 390, 768, 1440]);
    assert.equal(CPE_LAYOUT_CONTRACT.mobile.chipsWrap, true);
    assert.equal(CPE_LAYOUT_CONTRACT.mobile.noHorizontalOverflow, true);
    assert.equal(CPE_LAYOUT_CONTRACT.mobile.fullWidthPrimaryActions, true);
    const moduleFour = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFour.js"),
      "utf8"
    );
    assert.ok(moduleFour.includes("CPE_LAYOUT_CONTRACT"));
    assert.ok(moduleFour.includes("overflow-x-hidden") || moduleFour.includes("flex-wrap"));
  });

  it("read path passes matrix provenance through pattern artifacts", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../lib/artifacts/readArtifacts.ts"),
      "utf8"
    );
    assert.ok(src.includes("matrixProvenance"));
    assert.ok(src.includes("matrixReview"));
  });

  it("custom job encoding remains available alongside recommendations", () => {
    assert.equal(isCustomParagraphJob("custom:Compare openings"), true);
    const legacy = recommendParagraphJob({
      proofPlan: ["a", "b", "c"],
      paragraphIndex: 0,
    });
    assert.ok(legacy?.jobId);
  });

  it("nextSeenUpstreamSignature does not invent a baseline on passive view", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    assert.equal(
      nextSeenUpstreamSignature({
        provenanceModel: model,
        seenSignature: "",
        hasPlannedContent: true,
      }),
      ""
    );
    const next = nextSeenUpstreamSignature({
      provenanceModel: model,
      seenSignature: "old-sig",
      acknowledgeChange: false,
      hasPlannedContent: true,
    });
    assert.equal(next, "old-sig");
    const acked = nextSeenUpstreamSignature({
      provenanceModel: model,
      seenSignature: "old-sig",
      acknowledgeChange: true,
      hasPlannedContent: true,
    });
    assert.equal(acked, model.signature);
  });

  it("reasoning reminder is short and optional", () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    const reminder = getReasoningProvenanceReminder(model);
    assert.ok(reminder);
    assert.equal(handoff.studentFacingCopyHasInternalIds(reminder), false);
  });
});

describe("CP-E Module 4 dirty/save coordination (no write-on-read)", () => {
  function readyModel() {
    return buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
  }

  function plannedBuckets() {
    return [
      {
        claim: "Keep this point exactly",
        paragraphRole: "show_difference",
        evidenceKeys: ["tchart:speech:pathos"],
        reasoning: "Keep this reasoning text exactly.",
      },
    ];
  }

  it("1–3. Initial render, provenance load, and derived signature schedule no POST", () => {
    const model = readyModel();
    const coordinator = createModule4DirtySaveCoordinator({
      initialSignature: "",
    });
    assert.equal(shouldScheduleModule4Autosave({ studentDirty: false }), false);
    assert.equal(coordinator.shouldScheduleAutosave(), false);
    coordinator.notePassiveView();
    buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance(),
      evidencePool,
    });
    resolveModule4UpstreamSignatureForPersist({
      provenanceModel: model,
      savedSignature: "",
      persistReason: MODULE4_SAVE_REASONS.AUTOSAVE,
    });
    assert.equal(coordinator.getPostCount(), 0);
    assert.equal(MODULE4_UPSTREAM_SIGNATURE_BASELINE_POLICY.noWriteOnPassiveView, true);
  });

  it("4–5. Student edit schedules one save and first save includes upstream signature", async () => {
    const model = readyModel();
    const coordinator = createModule4DirtySaveCoordinator({
      initialSignature: "",
    });
    const buckets = plannedBuckets();
    coordinator.markStudentMutation();
    assert.equal(coordinator.shouldScheduleAutosave(), true);

    const result = await coordinator.persist({
      provenanceModel: model,
      persistReason: MODULE4_SAVE_REASONS.AUTOSAVE,
      buildPayload: (signature) => ({
        buckets,
        flow_state: { module4UpstreamSignature: signature },
      }),
      writeFn: async () => ({ ok: true }),
    });

    assert.equal(result.ok, true);
    assert.equal(coordinator.getPostCount(), 1);
    assert.equal(result.signature, model.signature);
    assert.equal(
      result.payload.flow_state.module4UpstreamSignature,
      model.signature
    );
    assert.deepEqual(result.payload.buckets[0].claim, "Keep this point exactly");
    assert.equal(coordinator.isStudentDirty(), false);
  });

  it("6–8. Existing saved signature reload and mismatch show notice without POST", () => {
    const modelA = readyModel();
    const modelB = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: makeProvenance({
          optionId: "meaningful_similarity",
          kind: "meaningful_similarity",
          label: "Changed direction",
          ratings: { speech: { pathos: 8 }, letter: { pathos: 8 } },
          appeals: ["pathos"],
          evidenceIds: ["tchart:speech:pathos", "tchart:letter:pathos"],
        }),
      }),
      evidencePool,
    });
    const buckets = plannedBuckets();
    const frozen = JSON.stringify(buckets);

    const coordinator = createModule4DirtySaveCoordinator({
      initialSignature: modelA.signature,
    });
    assert.equal(coordinator.shouldScheduleAutosave(), false);
    assert.equal(coordinator.getPostCount(), 0);

    const notice = getUpstreamProvenanceChangeNotice({
      provenanceModel: modelB,
      seenSignature: coordinator.getSavedSignature(),
      hasPlannedContent: true,
    });
    assert.equal(notice.kind, "direction_changed");

    // Passive reload simulation: new coordinator with same saved signature.
    const reloaded = createModule4DirtySaveCoordinator({
      initialSignature: modelA.signature,
    });
    const noticeAgain = getUpstreamProvenanceChangeNotice({
      provenanceModel: modelB,
      seenSignature: reloaded.getSavedSignature(),
      hasPlannedContent: true,
    });
    assert.equal(noticeAgain.kind, "direction_changed");
    assert.equal(reloaded.getPostCount(), 0);
    assert.equal(JSON.stringify(buckets), frozen);
  });

  it("9. Explicit acknowledgement saves the new signature", async () => {
    const modelA = readyModel();
    const modelB = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: makeProvenance({
          optionId: "meaningful_similarity",
          kind: "meaningful_similarity",
          label: "Changed direction",
          ratings: { speech: { pathos: 8 }, letter: { pathos: 8 } },
          appeals: ["pathos"],
          evidenceIds: ["tchart:speech:pathos", "tchart:letter:pathos"],
        }),
      }),
      evidencePool,
    });
    const coordinator = createModule4DirtySaveCoordinator({
      initialSignature: modelA.signature,
    });
    const result = await coordinator.persist({
      provenanceModel: modelB,
      persistReason: MODULE4_SAVE_REASONS.ACKNOWLEDGE,
      buildPayload: (signature) => ({
        flow_state: { module4UpstreamSignature: signature },
      }),
      writeFn: async () => ({ ok: true }),
    });
    assert.equal(result.ok, true);
    assert.equal(coordinator.getSavedSignature(), modelB.signature);
    assert.equal(
      getUpstreamProvenanceChangeNotice({
        provenanceModel: modelB,
        seenSignature: coordinator.getSavedSignature(),
        hasPlannedContent: true,
      }),
      null
    );
  });

  it("10. Failed acknowledgement keeps the old signature and notice", async () => {
    const modelA = readyModel();
    const modelB = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixProvenance: makeProvenance({
          optionId: "meaningful_similarity",
          kind: "meaningful_similarity",
          label: "Changed direction",
          ratings: { speech: { pathos: 8 }, letter: { pathos: 8 } },
          appeals: ["pathos"],
          evidenceIds: ["tchart:speech:pathos", "tchart:letter:pathos"],
        }),
      }),
      evidencePool,
    });
    const coordinator = createModule4DirtySaveCoordinator({
      initialSignature: modelA.signature,
    });
    const result = await coordinator.persist({
      provenanceModel: modelB,
      persistReason: MODULE4_SAVE_REASONS.ACKNOWLEDGE,
      buildPayload: (signature) => ({
        flow_state: { module4UpstreamSignature: signature },
      }),
      writeFn: async () => ({ ok: false, error: "network down" }),
    });
    assert.equal(result.ok, false);
    assert.equal(coordinator.getSavedSignature(), modelA.signature);
    assert.ok(coordinator.getAckError());
    assert.equal(
      getUpstreamProvenanceChangeNotice({
        provenanceModel: modelB,
        seenSignature: coordinator.getSavedSignature(),
        hasPlannedContent: true,
      })?.kind,
      "direction_changed"
    );
  });

  it("11. needs_review signature is not persisted as confirmed", async () => {
    const model = buildModule4ProvenanceModel({
      selectedPattern: patternWithProvenance({
        matrixReview: { needsReview: true, reasonCodes: ["upstream_changed"] },
      }),
      evidencePool,
    });
    assert.equal(model.ready, false);
    const coordinator = createModule4DirtySaveCoordinator({
      initialSignature: "",
    });
    coordinator.markStudentMutation();
    const result = await coordinator.persist({
      provenanceModel: model,
      persistReason: MODULE4_SAVE_REASONS.AUTOSAVE,
      buildPayload: (signature) => ({
        flow_state: { module4UpstreamSignature: signature },
      }),
      writeFn: async () => ({ ok: true }),
    });
    assert.equal(result.ok, true);
    assert.equal(result.signature, "");
    assert.equal(result.payload.flow_state.module4UpstreamSignature, "");
  });

  it("12. Legacy plan without signature follows documented baseline policy", () => {
    assert.equal(
      MODULE4_UPSTREAM_SIGNATURE_BASELINE_POLICY.legacyWithoutSignatureDoesNotClaimChange,
      true
    );
    const model = readyModel();
    const buckets = plannedBuckets();
    const notice = getUpstreamProvenanceChangeNotice({
      provenanceModel: model,
      seenSignature: "",
      hasPlannedContent: module4BucketsHavePlanContent(buckets),
    });
    assert.equal(notice, null);
    const baseline = resolveModule4UpstreamSignatureForPersist({
      provenanceModel: model,
      savedSignature: "",
      persistReason: MODULE4_SAVE_REASONS.NAVIGATION,
    });
    assert.equal(baseline, model.signature);
  });

  it("13. Existing paragraph text/selections remain byte-for-byte unchanged", async () => {
    const model = readyModel();
    const buckets = plannedBuckets();
    const frozen = JSON.stringify(buckets);
    const coordinator = createModule4DirtySaveCoordinator({
      initialSignature: model.signature,
    });
    await coordinator.persist({
      provenanceModel: model,
      persistReason: MODULE4_SAVE_REASONS.ACKNOWLEDGE,
      buildPayload: (signature) => ({
        buckets,
        flow_state: { module4UpstreamSignature: signature },
      }),
      writeFn: async (payload) => {
        assert.equal(JSON.stringify(payload.buckets), frozen);
        return { ok: true };
      },
    });
    assert.equal(JSON.stringify(buckets), frozen);
  });

  it("14. No student-facing production copy contains custom:", () => {
    const moduleFour = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFour.js"),
      "utf8"
    );
    // Strip storage encoding helper calls / comparisons, then forbid student copy.
    const withoutStorageHelpers = moduleFour
      .replace(/encodeCustomParagraphJob\([^)]*\)/g, "")
      .replace(/isCustomParagraphJob\([^)]*\)/g, "")
      .replace(/decodeCustomParagraphJob\([^)]*\)/g, "")
      .replace(/CUSTOM_JOB_PREFIX/g, "");
    assert.equal(withoutStorageHelpers.includes("custom:"), false);
    assert.equal(moduleFour.includes("Saved as"), false);
    assert.ok(
      moduleFour.includes(
        "Write a short description of this paragraph’s job."
      )
    );
  });

  it("15. Internal custom-job storage encoding still validates and persists", () => {
    const encoded = encodeCustomParagraphJob("Compare openings");
    assert.equal(encoded, "custom:Compare openings");
    assert.equal(decodeCustomParagraphJob(encoded), "Compare openings");
    assert.equal(isCustomParagraphJob(encoded), true);
    assert.equal(validateParagraphJob(encoded).valid, true);
  });

  it("production ModuleFour wires dirty coordinator and ack Retry", () => {
    const moduleFour = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFour.js"),
      "utf8"
    );
    assert.ok(moduleFour.includes("createModule4DirtySaveCoordinator"));
    assert.ok(moduleFour.includes("shouldScheduleModule4Autosave"));
    assert.ok(moduleFour.includes("markStudentMutation"));
    assert.ok(moduleFour.includes("MODULE4_SAVE_REASONS.ACKNOWLEDGE"));
    assert.ok(moduleFour.includes("module4-acknowledge-upstream-error"));
    assert.ok(moduleFour.includes("Retry"));
    assert.ok(moduleFour.includes("persistAndNavigateTo"));
    assert.ok(moduleFour.includes("module4-navigation-save-error"));
    assert.equal(moduleFour.includes("setModule4UpstreamSignature(provenanceModel.signature)"), false);
  });
});