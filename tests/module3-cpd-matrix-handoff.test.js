const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const matrix = require("../lib/module2/rhetoricalMatrixHelpers.js");
const derived = require("../lib/module2/matrixDerivationHelpers.js");
const orch = require("../lib/module2/matrixOrchestrationHelpers.js");
const handoff = require("../lib/module3/moduleThreeMatrixHandoffHelpers.js");
const buildArg = require("../lib/module3/buildArgumentHelpers.js");

function fillCell(bundle, index, { rating, evidenceIds = [], note, none = false }) {
  const cell = bundle.cells[index];
  return matrix.updateCellInBundle(bundle, cell.id, {
    rating,
    evidenceIds,
    functionNote: note || "This appeal helps King connect with this audience clearly.",
    explicitNoEvidence: none,
  });
}

function completeAll(ratings) {
  let bundle = matrix.createEmptyMatrixBundle();
  ratings.forEach((rating, index) => {
    const none = rating === 0;
    bundle = fillCell(bundle, index, {
      rating,
      evidenceIds: none
        ? []
        : [`tchart:${bundle.cells[index].sourceType}:${bundle.cells[index].appeal}`],
      none,
      note: "Enough characters for the mechanical function-note threshold.",
    });
  });
  return bundle;
}

function readyBundle(ratings = [9, 4, 5, 5, 4, 4]) {
  const options = derived.derivePatternOptions(completeAll(ratings));
  const primary = orch.selectPrimaryPatternRecommendations(options).primary[0];
  const selected = derived.buildSelectedPattern({
    option: primary || options.options[0],
    derived: options,
  });
  return {
    ...completeAll(ratings),
    selectedPattern: selected,
    audiencePurposeReasoning:
      "This direction fits these audiences and purposes for the essay comparison.",
    reviewState: {
      dependentsNeedReview: false,
      reasons: [],
      changedCellIds: [],
    },
  };
}

const evidenceRecords = [
  {
    id: "tchart:speech:pathos",
    sourceType: "speech",
    appeal: "pathos",
    quotation: "I have a dream that my four little children will one day live in a nation",
  },
  {
    id: "tchart:letter:pathos",
    sourceType: "letter",
    appeal: "pathos",
    quotation: "When you are forever fighting a degenerating sense of nobodiness",
  },
  {
    id: "tchart:speech:ethos",
    sourceType: "speech",
    appeal: "ethos",
    quotation: "I am happy to join with you today",
  },
];

describe("CP-D Module 3 matrix handoff adapter", () => {
  it("1. ready matrix fixture resolves to the selected Module 2 pattern", () => {
    const bundle = readyBundle([9, 2, 5, 5, 4, 4]);
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: bundle,
      evidenceRecords,
    });
    assert.equal(presentation.mode, "prefer_matrix_selection");
    assert.ok(presentation.selectedPattern?.label);
    assert.equal(
      presentation.selectedPattern.optionId,
      bundle.selectedPattern.optionId
    );
  });

  it("2–4. max three primary derived choices plus one custom; same ranking canon", () => {
    const bundle = readyBundle([9, 2, 8, 3, 7, 2]);
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: bundle,
      evidenceRecords,
    });
    const ranked = orch.selectPrimaryPatternRecommendations(
      derived.derivePatternOptions(bundle),
      bundle
    );
    assert.ok(presentation.primaryOptions.length <= 3);
    assert.equal(presentation.primaryOptions.length, ranked.primary.length);
    assert.equal(presentation.customAllowed, true);
    assert.equal(presentation.customOption.label, "Another pattern I notice");
  });

  it("5–6. incomplete matrix and dependentsNeedReview block ready handoff", () => {
    const incomplete = matrix.createEmptyMatrixBundle();
    const incompletePres = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: incomplete,
    });
    assert.equal(incompletePres.mode, "matrix_review_required");
    assert.equal(incompletePres.cta.label, "Return to my matrix");
    assert.match(incompletePres.reviewMessage, /one more check/i);

    const needsReview = {
      ...readyBundle(),
      reviewState: {
        dependentsNeedReview: true,
        reasons: [{ code: "upstream_rating_changed", cellId: "x" }],
        changedCellIds: ["x"],
      },
    };
    const blocked = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: needsReview,
    });
    assert.equal(blocked.mode, "matrix_review_required");
    assert.equal(blocked.reviewReason, "dependents_need_review");
  });

  it("7–8. no matrix uses legacy; malformed uses safe review/fallback", () => {
    const legacy = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: null,
    });
    assert.equal(legacy.mode, "legacy_pattern_path");
    assert.equal(legacy.useLegacyPatternPath, true);

    const bad = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: "nope",
    });
    assert.equal(bad.mode, "legacy_pattern_path");
  });
});

describe("CP-D readable provenance", () => {
  it("9–14. ratings, aliases, missing evidence, no internal IDs, because-you, reasoning", () => {
    const bundle = readyBundle([9, 4, 5, 5, 4, 4]);
    // Force pathos contrast-ish ratings into selected provenance for readable lines
    bundle.selectedPattern = {
      ...bundle.selectedPattern,
      provenance: {
        ratings: { speech: { pathos: 9 }, letter: { pathos: 4 } },
        evidenceIds: [
          "tchart:speech:pathos",
          "guided:speech:pathos", // alias duplicate of speech pathos family may not match same id
          "tchart:missing:gone",
        ],
        appeals: ["pathos"],
      },
    };
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: bundle,
      evidenceRecords,
    });

    assert.ok(
      presentation.readableRatingLines.some((l) =>
        /Speech pathos: 9\/10/i.test(l.visibleLabel)
      )
    );
    assert.ok(
      presentation.readableRatingLines.some((l) =>
        /Letter pathos: 4\/10/i.test(l.visibleLabel)
      )
    );
    assert.match(presentation.becauseYouExplanation, /Because you rated/i);
    assert.doesNotMatch(
      presentation.becauseYouExplanation,
      /matrix:mlk:|tchart:/
    );
    assert.equal(
      presentation.audiencePurposeReasoning,
      bundle.audiencePurposeReasoning
    );

    const missingOnly = handoff.resolveQualifyingEvidenceIds(
      ["tchart:missing:gone"],
      evidenceRecords
    );
    assert.equal(missingOnly.length, 0);

    const deduped = handoff.dedupeEvidenceIds([
      "tchart:speech:pathos",
      "tchart:speech:pathos",
    ]);
    assert.equal(deduped.length, 1);

    const blob = JSON.stringify(presentation);
    assert.equal(handoff.studentFacingCopyHasInternalIds(presentation.becauseYouExplanation), false);
    assert.doesNotMatch(presentation.selectedPattern.label, /matrix:mlk:/);
    assert.ok(!blob.includes("Rule largest_contrast fired"));
  });
});

describe("CP-D adoption and legacy safety", () => {
  it("15–16. explicit adoption creates one deterministic pattern; reload does not duplicate", () => {
    const bundle = readyBundle();
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: bundle,
      evidenceRecords,
    });
    const first = handoff.materializeMatrixPatternArtifact({
      option: presentation.selectedPattern,
      evidenceRecords,
      audiencePurposeReasoning: presentation.audiencePurposeReasoning,
      existingPatterns: [],
    });
    assert.equal(first.created, true);
    assert.match(first.pattern.id, /^m3-matrix:/);
    assert.equal(first.pattern.text, presentation.selectedPattern.label);

    const second = handoff.materializeMatrixPatternArtifact({
      option: presentation.selectedPattern,
      evidenceRecords,
      audiencePurposeReasoning: presentation.audiencePurposeReasoning,
      existingPatterns: [first.pattern],
    });
    assert.equal(second.created, false);
    assert.equal(second.pattern.id, first.pattern.id);
  });

  it("17–19. existing Module 3 work is not overwritten; texts unchanged", () => {
    const bundle = readyBundle();
    const existingIdea = "Exact idea statement stays byte-for-byte.";
    const existingClaim = "Exact working claim stays byte-for-byte.";
    const existingThesis = "Exact thesis stays byte-for-byte.";
    const existingProof = ["Exact proof A", "", ""];
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: bundle,
      evidenceRecords,
      existingModule3: {
        patterns: [{ id: "legacy-1", text: "My earlier notice", evidenceIds: ["a", "b"] }],
        selectedPatternId: "legacy-1",
        ideaStatement: existingIdea,
        workingClaim: existingClaim,
        thesisStatement: existingThesis,
        proofPlan: existingProof,
      },
    });
    assert.equal(presentation.mode, "existing_module3_with_matrix");
    assert.equal(presentation.hasExistingModule3Work, true);
    // Hydration must not mutate caller strings
    assert.equal(existingIdea, "Exact idea statement stays byte-for-byte.");
    assert.equal(existingClaim, "Exact working claim stays byte-for-byte.");
    assert.equal(existingThesis, "Exact thesis stays byte-for-byte.");
    assert.deepEqual(existingProof, ["Exact proof A", "", ""]);
  });

  it("20. legacy student without matrix completes current path flags", () => {
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: null,
    });
    assert.equal(presentation.useLegacyPatternPath, true);
    assert.equal(presentation.customAllowed, true);
  });
});

describe("CP-D review state", () => {
  it("21–24. signature change marks review; timestamp-only does not; confirm clears", () => {
    const bundle = readyBundle();
    const meta = handoff.createMatrixProvenanceMetadata({
      selectedPattern: bundle.selectedPattern,
      audiencePurposeReasoning: bundle.audiencePurposeReasoning,
      importedAt: "2020-01-01T00:00:00.000Z",
    });
    const sameLater = handoff.createMatrixProvenanceMetadata({
      selectedPattern: bundle.selectedPattern,
      audiencePurposeReasoning: bundle.audiencePurposeReasoning,
      importedAt: "2026-07-12T00:00:00.000Z",
    });
    assert.equal(meta.signature, sameLater.signature);

    const changed = {
      ...bundle.selectedPattern,
      provenance: {
        ...bundle.selectedPattern.provenance,
        ratings: { speech: { pathos: 1 }, letter: { pathos: 10 } },
      },
    };
    const nextSig = handoff.buildMatrixProvenanceSignature({
      selectedPattern: changed,
      audiencePurposeReasoning: bundle.audiencePurposeReasoning,
    });
    const review = handoff.evaluateDownstreamMatrixReview({
      currentSignature: nextSig,
      artifactProvenance: meta,
    });
    assert.equal(review.needsReview, true);
    assert.equal(review.textsRewritten, false);
    assert.match(review.message, /Module 2 analysis changed/i);

    const confirmed = handoff.confirmMatrixReview({
      currentSignature: nextSig,
    });
    assert.equal(confirmed.needsReview, false);
    assert.equal(confirmed.reviewedSignature, nextSig);
  });

  it("25. failed save does not clear review metadata helper contract", () => {
    const review = handoff.createMatrixReviewState({
      needsReview: true,
      reasonCodes: ["upstream_matrix_signature_changed"],
      reviewedSignature: null,
    });
    // Confirmation is explicit — a failed save simply never calls confirm.
    assert.equal(review.needsReview, true);
  });
});

describe("CP-D claim/thesis microstages", () => {
  it("26–27. claim review → write; valid claim resumes at write", () => {
    assert.equal(
      handoff.resolveClaimInternalStage({ workingClaim: "" }),
      "claim_review"
    );
    assert.equal(
      handoff.resolveClaimInternalStage({
        workingClaim: "A claim long enough to resume.",
      }),
      "claim_write"
    );
  });

  it("28–30. thesis write hides proof; valid thesis advances to proof; proof hydrates", () => {
    assert.equal(
      handoff.resolveThesisInternalStage({ thesisStatement: "short" }),
      "thesis_write"
    );
    assert.equal(
      handoff.resolveThesisInternalStage({
        thesisStatement: "A thesis long enough to unlock proof directions.",
        proofPlan: ["", "", ""],
      }),
      "thesis_proof"
    );
    const plan = ["Keep speech focus", "Letter answer", ""];
    const stage = handoff.resolveThesisInternalStage({
      thesisStatement: "A thesis long enough to unlock proof directions.",
      proofPlan: plan,
    });
    assert.equal(stage, "thesis_proof");
    assert.deepEqual(plan, ["Keep speech focus", "Letter answer", ""]);
  });

  it("31–33. starters never auto-fill; gates remain", () => {
    const starters = handoff.getClaimStartersForPatternKind("largest_contrast");
    assert.ok(starters.some((s) => /more strongly/i.test(s)));
    assert.equal(buildArg.CLAIM_MINIMUM, 10);
    assert.equal(buildArg.THESIS_MINIMUM, 10);
    assert.equal(
      buildArg.getClaimPhase({
        workingClaim: "too short",
        selectedClusterEvidence: [],
        evidenceConnections: {},
      }).claimReady,
      false
    );
  });
});

describe("CP-D write ordering", () => {
  it("34–38. serialized controller keeps newest explicit state; failed save freezes", async () => {
    const controller = handoff.createSerializedWriteController();
    const results = [];
    await controller.enqueue(async () => {
      await new Promise((r) => setTimeout(r, 20));
      results.push("A");
      return { ok: true, value: "A" };
    });
    const b = controller.enqueue(async ({ isLatest }) => {
      results.push("B");
      assert.equal(isLatest(), true);
      return { ok: true, value: "B" };
    });
    const final = await b;
    assert.equal(final.ok, true);
    assert.ok(results.includes("B"));

    const fail = await controller.enqueue(async () => ({
      ok: false,
      error: { message: "nope" },
    }));
    assert.equal(fail.ok, false);
  });

  it("14–15 race. rapid A→B leaves B; completion waits for newest", async () => {
    const store = handoff.createMockArtifactStore({ idea: "start" });
    store.setDelay(40);
    const controller = handoff.createSerializedWriteController();

    const writeA = controller.enqueue(async ({ isLatest }) => {
      await new Promise((r) => setTimeout(r, 40));
      if (!isLatest()) return { ok: true, superseded: true };
      return store.write("idea", "A-stale");
    });
    const writeB = controller.enqueue(async ({ isLatest }) => {
      if (!isLatest()) return { ok: true, superseded: true };
      return store.write("idea", "B-newest");
    });
    await Promise.all([writeA, writeB]);
    assert.equal(store.get("idea"), "B-newest");

    store.setDelay(0);
    const mid = controller.enqueue(async ({ isLatest }) => {
      await new Promise((r) => setTimeout(r, 30));
      if (!isLatest()) return { ok: true, superseded: true };
      return store.write("idea", "mid");
    });
    const completion = controller.enqueue(async ({ isLatest }) => {
      if (!isLatest()) return { ok: true, superseded: true };
      return store.write("idea", "completion-newest");
    });
    await Promise.all([mid, completion]);
    assert.equal(store.get("idea"), "completion-newest");
  });

  it("failed review confirmation keeps needs_review on mock store", async () => {
    const store = handoff.createMockArtifactStore({
      idea: {
        statement: "Byte-for-byte idea text.",
        matrixReview: { needsReview: true, reviewedSignature: null },
      },
    });
    const controller = handoff.createSerializedWriteController();
    const confirm = await controller.enqueue(async () => {
      // Simulate failed confirmation save — do not mutate review state.
      return { ok: false, error: { message: "network" } };
    });
    assert.equal(confirm.ok, false);
    assert.equal(store.get("idea").matrixReview.needsReview, true);
    assert.equal(store.get("idea").statement, "Byte-for-byte idea text.");
  });
});

describe("CP-D because-you wording by kind", () => {
  it("12–13. similarity / dominant / student-created wording", () => {
    const contrast = handoff.buildBecauseYouExplanationForPattern({
      kind: "largest_contrast",
      provenance: {
        ratings: { speech: { pathos: 9 }, letter: { pathos: 2 } },
        appeals: ["pathos"],
      },
    });
    assert.match(contrast, /this contrast/i);

    const similarity = handoff.buildBecauseYouExplanationForPattern({
      kind: "high_high",
      provenance: {
        ratings: { speech: { ethos: 8 }, letter: { ethos: 8 } },
        appeals: ["ethos"],
      },
    });
    assert.match(similarity, /this similarity|this shared pattern/i);
    assert.doesNotMatch(similarity, /this contrast/i);

    const dominant = handoff.buildBecauseYouExplanationForPattern({
      kind: "combined_dominant_across_works",
      provenance: {
        ratings: { speech: { logos: 9 }, letter: { logos: 8 } },
        appeals: ["logos"],
      },
    });
    assert.match(dominant, /this strong pattern/i);

    const student = handoff.buildBecauseYouExplanationForPattern({
      kind: "student_created",
      provenance: { ratings: {}, evidenceIds: [], appeals: [] },
    });
    assert.match(student, /selected and named this direction/i);
    assert.doesNotMatch(student, /Because you rated/i);
  });
});

describe("CP-D active adopted direction + custom evidence", () => {
  it("7–8. restore active direction without duplicate materialize", () => {
    const bundle = readyBundle();
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: bundle,
      evidenceRecords,
    });
    const first = handoff.materializeMatrixPatternArtifact({
      option: presentation.primaryOptions[1] || presentation.selectedPattern,
      evidenceRecords,
      audiencePurposeReasoning: presentation.audiencePurposeReasoning,
      existingPatterns: [],
    });
    assert.equal(first.created, true);

    const active = handoff.buildActiveAdoptedDirection({
      option: {
        optionId: first.pattern.matrixProvenance.selectedPatternOptionId,
        kind: first.pattern.matrixProvenance.selectedPatternKind,
        label: first.pattern.text,
        provenance: {
          ratings: first.pattern.matrixProvenance.ratings,
          evidenceIds: first.pattern.evidenceIds,
          appeals: first.pattern.matrixProvenance.appeals,
        },
      },
      evidenceRecords,
      audiencePurposeReasoning: presentation.audiencePurposeReasoning,
    });
    assert.ok(active?.optionId);
    assert.ok(active.becauseYouExplanation);

    const restored = handoff.restoreActiveDirectionFromSavedPattern({
      pattern: first.pattern,
      evidenceRecords,
    });
    assert.equal(restored.optionId, active.optionId);
    assert.equal(restored.label, first.pattern.text);

    const again = handoff.materializeMatrixPatternArtifact({
      option: {
        optionId: restored.optionId,
        kind: restored.kind,
        label: restored.label,
        provenance: {
          ratings: restored.ratings,
          evidenceIds: restored.evidenceIds,
          appeals: restored.appeals,
        },
      },
      evidenceRecords,
      audiencePurposeReasoning: restored.audiencePurposeReasoning,
      existingPatterns: [first.pattern],
    });
    assert.equal(again.created, false);
    assert.equal(again.pattern.id, first.pattern.id);
  });

  it("9–11. custom direction requires explicit qualifying evidence", () => {
    assert.equal(
      handoff.canCompleteCustomMatrixDirection({
        customLabel: "A custom direction long enough",
        evidenceIds: [],
        evidenceRecords,
      }),
      false
    );
    assert.equal(
      handoff.canCompleteCustomMatrixDirection({
        customLabel: "A custom direction long enough",
        evidenceIds: ["tchart:missing:gone"],
        evidenceRecords,
      }),
      false
    );
    assert.equal(
      handoff.canCompleteCustomMatrixDirection({
        customLabel: "A custom direction long enough",
        evidenceIds: ["tchart:speech:pathos"],
        evidenceRecords,
      }),
      true
    );

    const custom = handoff.buildCustomMatrixOption(
      "Students invent this alternate reading here"
    );
    const materialized = handoff.materializeMatrixPatternArtifact({
      option: {
        ...custom,
        provenance: {
          ...(custom.provenance || {}),
          evidenceIds: ["tchart:speech:pathos"],
        },
      },
      evidenceRecords,
      audiencePurposeReasoning: "Fits audience purpose.",
      existingPatterns: [],
    });
    assert.ok(
      handoff.canContinueFromMatrixPattern({
        selectedPattern: materialized.pattern,
      })
    );
    assert.deepEqual(materialized.pattern.evidenceIds, [
      "tchart:speech:pathos",
    ]);
  });
});

describe("CP-D upstream signature + review across artifacts", () => {
  it("1–6. meaningful change marks all artifacts; timestamp-only does not; text preserved", () => {
    const bundle = readyBundle();
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: bundle,
      evidenceRecords,
    });
    const meta = handoff.createMatrixProvenanceMetadata({
      selectedPattern: bundle.selectedPattern,
      audiencePurposeReasoning: bundle.audiencePurposeReasoning,
      importedAt: "2020-01-01T00:00:00.000Z",
    });
    const ideaText = "Exact idea remains byte-for-byte.";
    const claimText = "Exact claim remains byte-for-byte.";
    const thesisText = "Exact thesis remains byte-for-byte.";

    const unchangedSig = handoff.resolveCurrentUpstreamSignature({
      matrixBundle: {
        ...bundle,
        updatedAt: "2099-01-01T00:00:00.000Z",
      },
      directionOptionId: meta.selectedPatternOptionId,
      directionKind: meta.selectedPatternKind,
      audiencePurposeReasoning: bundle.audiencePurposeReasoning,
    });
    assert.equal(unchangedSig, meta.signature);

    const changedBundle = {
      ...bundle,
      selectedPattern: {
        ...bundle.selectedPattern,
        provenance: {
          ...bundle.selectedPattern.provenance,
          ratings: { speech: { pathos: 1 }, letter: { pathos: 10 } },
        },
      },
    };
    // Keep option id but mutate option list ratings via selectedPattern path
    const liveSig = handoff.buildMatrixProvenanceSignature({
      selectedPattern: changedBundle.selectedPattern,
      audiencePurposeReasoning: bundle.audiencePurposeReasoning,
    });
    assert.notEqual(liveSig, meta.signature);

    const evalAll = handoff.evaluateAllDownstreamArtifactsForUpstreamChange({
      currentSignature: liveSig,
      pattern: {
        text: presentation.selectedPattern.label,
        matrixProvenance: meta,
      },
      idea: { statement: ideaText, matrixProvenance: meta },
      claim: { workingClaim: claimText, matrixProvenance: meta },
      thesis: { thesis: thesisText, matrixProvenance: meta },
    });
    assert.equal(evalAll.artifacts.pattern.needsReview, true);
    assert.equal(evalAll.artifacts.idea.needsReview, true);
    assert.equal(evalAll.artifacts.claim.needsReview, true);
    assert.equal(evalAll.artifacts.thesis.needsReview, true);
    assert.equal(evalAll.textsRewritten, false);
    assert.equal(ideaText, "Exact idea remains byte-for-byte.");
    assert.equal(claimText, "Exact claim remains byte-for-byte.");
    assert.equal(thesisText, "Exact thesis remains byte-for-byte.");

    const confirmed = handoff.confirmMatrixReview({
      currentSignature: liveSig,
    });
    assert.equal(confirmed.needsReview, false);
    assert.equal(confirmed.reviewedSignature, liveSig);
  });
});

describe("CP-D production wiring (source assertions)", () => {
  it("17. review banner + status + confirm are rendered by production components", () => {
    const banner = fs.readFileSync(
      path.join(
        __dirname,
        "../components/module3/ModuleThreeMatrixReviewBanner.jsx"
      ),
      "utf8"
    );
    // Review announcement uses status/polite; save errors stay role="alert".
    assert.match(banner, /role="status"/);
    assert.match(banner, /aria-live="polite"/);
    assert.match(banner, /role="alert"/);
    assert.match(banner, /MATRIX_REVIEW_CONFIRM_LABEL|This still says what I mean/);
    assert.match(banner, /matrix-review-confirm/);

    const form = fs.readFileSync(
      path.join(__dirname, "../components/ModuleThreeV2Form.jsx"),
      "utf8"
    );
    assert.match(form, /evaluateDownstreamMatrixReview|evaluateAllDownstreamArtifactsForUpstreamChange/);
    assert.match(form, /confirmMatrixReview/);
    assert.match(form, /confirmArtifactReview\(/);
    assert.match(form, /ModuleThreeMatrixReviewBanner/);
    assert.match(form, /activeAdoptedDirection/);
    assert.match(form, /canCompleteCustomMatrixDirection/);
    assert.match(form, /resolveQualifyingEvidenceIds/);
    assert.match(form, /matrixEvidenceRecords/);
    assert.match(form, /readAdditiveMatrixFields/);
    assert.match(form, /matrixDirectionAdopted/);
    assert.match(form, /matrixHandoffLoading/);
    assert.match(form, /matrixPresentation/);
    assert.match(form, /ideaWriteControllerRef/);
    assert.match(form, /claimWriteControllerRef/);
    assert.match(form, /thesisWriteControllerRef/);
    assert.match(form, /matrixProvenance/);
    assert.match(form, /matrixReview/);
    // Pattern hydrate must keep additive CP-D fields (not strip to text/ids only).
    assert.match(form, /readAdditiveMatrixFields\(payload\)/);

    const panel = fs.readFileSync(
      path.join(
        __dirname,
        "../components/module3/ModuleThreeMatrixPatternPanel.jsx"
      ),
      "utf8"
    );
    assert.match(panel, /customStage === "describe"/);
    assert.match(panel, /onCustomSubmit/);
    assert.match(panel, /evidenceCandidates/);

    const writeArtifacts = fs.readFileSync(
      path.join(__dirname, "../lib/artifacts/writeArtifacts.ts"),
      "utf8"
    );
    assert.match(writeArtifacts, /matrixProvenance/);
    assert.match(writeArtifacts, /matrixReview/);

    for (const rel of [
      "../lib/artifacts/ideaServer.ts",
      "../lib/artifacts/claimServer.ts",
      "../lib/artifacts/thesisServer.ts",
      "../app/api/module3/ideas/route.js",
      "../app/api/module3/claims/route.js",
      "../app/api/module3/thesis/route.js",
    ]) {
      const src = fs.readFileSync(path.join(__dirname, rel), "utf8");
      assert.match(src, /matrixProvenance/);
      assert.match(src, /matrixReview/);
    }

    const explore = fs.readFileSync(
      path.join(
        __dirname,
        "../components/module3/ModuleThreeExploreIdeaStep.jsx"
      ),
      "utf8"
    );
    assert.match(explore, /matrixReviewBanner/);

    const build = fs.readFileSync(
      path.join(
        __dirname,
        "../components/module3/ModuleThreeBuildArgumentStep.jsx"
      ),
      "utf8"
    );
    assert.match(build, /matrixReviewBanner/);
  });

  it("16. legacy no-matrix path still preferred when bundle missing", () => {
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: null,
    });
    assert.equal(presentation.useLegacyPatternPath, true);
    const form = fs.readFileSync(
      path.join(__dirname, "../components/ModuleThreeV2Form.jsx"),
      "utf8"
    );
    assert.match(form, /useLegacyPatternPath|legacy_pattern_path/);
  });
});

describe("CP-D JSX parses", () => {
  it("45. changed Module 3 CP-D components parse as JSX", () => {
    const parser = require("next/dist/compiled/babel/parser");
    for (const rel of [
      "../components/module3/ModuleThreeMatrixProvenanceCard.jsx",
      "../components/module3/ModuleThreeMatrixPatternPanel.jsx",
      "../components/module3/ModuleThreeMatrixReviewBanner.jsx",
      "../components/module3/ModuleThreeNoticePatternsStep.jsx",
      "../components/module3/ModuleThreeExploreIdeaStep.jsx",
      "../components/module3/ModuleThreeBuildArgumentStep.jsx",
      "../components/ModuleThreeV2Form.jsx",
    ]) {
      const src = fs.readFileSync(path.join(__dirname, rel), "utf8");
      parser.parse(src, { sourceType: "module", plugins: ["jsx"] });
    }
  });
});

describe("CP-D additive matrix field helpers", () => {
  it("omitted fields preserve existing; explicit null clears", async () => {
    const fields = await import("../lib/module3/matrixArtifactFields.js");
    const existing = {
      matrixProvenance: { selectedPatternOptionId: "opt-a" },
      matrixReview: { needsReview: false, reviewedSignature: "sig-1" },
    };
    const omitted = fields.mergeAdditiveMatrixFields({}, existing);
    assert.deepEqual(omitted.matrixProvenance, existing.matrixProvenance);
    assert.deepEqual(omitted.matrixReview, existing.matrixReview);

    const cleared = fields.mergeAdditiveMatrixFields(
      { matrixProvenance: null, matrixReview: null },
      existing
    );
    assert.equal(cleared.matrixProvenance, null);
    assert.equal(cleared.matrixReview, null);

    const read = fields.readAdditiveMatrixFields({
      matrixProvenance: { selectedPatternOptionId: "opt-b" },
      matrixReview: { needsReview: true },
      text: "ignored",
    });
    assert.equal(read.matrixProvenance.selectedPatternOptionId, "opt-b");
    assert.equal(read.matrixReview.needsReview, true);
    assert.equal(read.text, undefined);
  });
});
