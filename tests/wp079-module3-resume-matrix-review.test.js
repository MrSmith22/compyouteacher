const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const matrix = require("../lib/module2/rhetoricalMatrixHelpers.js");
const derived = require("../lib/module2/matrixDerivationHelpers.js");
const orch = require("../lib/module2/matrixOrchestrationHelpers.js");
const handoff = require("../lib/module3/moduleThreeMatrixHandoffHelpers.js");

// WP-079 regression: a student who already completed Module 3 and resumes at a
// LATER stage (e.g. Thesis) must still see the matrix-change review experience
// when the saved Module 2 signature differs from the signature stamped on the
// existing downstream artifacts. The original failure was that the server read
// adapters dropped matrixProvenance/matrixReview for idea/claim/thesis, so the
// resumed form hydrated with null provenance and never fired the review.

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

function readyBundle(ratings = [9, 2, 5, 5, 4, 4]) {
  const options = derived.derivePatternOptions(completeAll(ratings));
  const primary = orch.selectPrimaryPatternRecommendations(options, completeAll(ratings))
    .primary[0];
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

// The exact byte-for-byte prose an existing student already wrote.
const EXISTING_IDEA = "Existing idea remains byte-for-byte.";
const EXISTING_CLAIM = "Existing working claim remains byte-for-byte.";
const EXISTING_THESIS =
  "Existing thesis long enough to unlock the proof plan stage.";
const EXISTING_PROOF = ["Existing proof A", "Existing proof B", ""];

function stampedMeta(bundle) {
  // Signature the downstream artifacts were saved with (older matrix).
  return handoff.createMatrixProvenanceMetadata({
    selectedPattern: bundle.selectedPattern,
    audiencePurposeReasoning: bundle.audiencePurposeReasoning,
    importedAt: "2020-01-01T00:00:00.000Z",
  });
}

describe("WP-079 resume — read path carries downstream matrix provenance", () => {
  it("1. read adapters propagate matrixProvenance/matrixReview for idea/claim/thesis", () => {
    // Root-cause guard: the SSR read path (used by app/modules/3/page.js) must
    // NOT strip additive CP-D fields, or the resumed review can never compute.
    const src = fs.readFileSync(
      path.join(__dirname, "../lib/artifacts/readArtifacts.ts"),
      "utf8"
    );
    assert.match(src, /res\.idea\.matrixProvenance/);
    assert.match(src, /res\.idea\.matrixReview/);
    assert.match(src, /res\.claim\.matrixProvenance/);
    assert.match(src, /res\.claim\.matrixReview/);
    assert.match(src, /v2Res\.thesis\.matrixProvenance/);
    assert.match(src, /v2Res\.thesis\.matrixReview/);
  });

  it("2. artifact types declare additive matrix fields on idea/claim/thesis", () => {
    const types = fs.readFileSync(
      path.join(__dirname, "../lib/artifacts/types.ts"),
      "utf8"
    );
    const ideaBlock = types.slice(
      types.indexOf("interface IdeaArtifact"),
      types.indexOf("interface ClaimArtifact")
    );
    const claimBlock = types.slice(
      types.indexOf("interface ClaimArtifact"),
      types.indexOf("interface SourceContextArtifact")
    );
    const thesisBlock = types.slice(
      types.indexOf("interface ThesisArtifact"),
      types.indexOf("interface ParagraphPlanArtifact")
    );
    for (const block of [ideaBlock, claimBlock, thesisBlock]) {
      assert.match(block, /matrixProvenance\?:/);
      assert.match(block, /matrixReview\?:/);
    }
  });
});

describe("WP-079 resume — matrix-change review fires at a later stage", () => {
  it("3–4. changed signature + completed artifacts marks review on idea/claim/thesis", () => {
    const bundle = readyBundle();
    const meta = stampedMeta(bundle);

    // Student changed the Module 2 audience/purpose reasoning (part of signature).
    const currentSig = handoff.resolveCurrentUpstreamSignature({
      matrixBundle: bundle,
      directionOptionId: meta.selectedPatternOptionId,
      directionKind: meta.selectedPatternKind,
      audiencePurposeReasoning:
        "A completely different audience and purpose rationale now.",
    });
    assert.notEqual(currentSig, meta.signature);

    const evalAll = handoff.evaluateAllDownstreamArtifactsForUpstreamChange({
      currentSignature: currentSig,
      pattern: { text: "selected", matrixProvenance: meta },
      idea: { statement: EXISTING_IDEA, matrixProvenance: meta },
      claim: { workingClaim: EXISTING_CLAIM, matrixProvenance: meta },
      thesis: { thesis: EXISTING_THESIS, matrixProvenance: meta },
    });

    assert.equal(evalAll.artifacts.idea.needsReview, true);
    assert.equal(evalAll.artifacts.claim.needsReview, true);
    assert.equal(evalAll.artifacts.thesis.needsReview, true);
    assert.equal(evalAll.anyNeedsReview, true);
  });

  it("5. student resumes past the first stage (Thesis proof) when work is complete", () => {
    // Completed thesis + proof lands the student on the thesis proof microstage,
    // which is exactly where the review banner must still be reachable.
    const stage = handoff.resolveThesisInternalStage({
      thesisStatement: EXISTING_THESIS,
      proofPlan: EXISTING_PROOF,
    });
    assert.equal(stage, "thesis_proof");
  });

  it("6. existing prose is never rewritten by the review evaluation", () => {
    const bundle = readyBundle();
    const meta = stampedMeta(bundle);
    const idea = { statement: EXISTING_IDEA, matrixProvenance: meta };
    const claim = { workingClaim: EXISTING_CLAIM, matrixProvenance: meta };
    const thesis = {
      thesis: EXISTING_THESIS,
      proofPlan: [...EXISTING_PROOF],
      matrixProvenance: meta,
    };

    const currentSig = handoff.resolveCurrentUpstreamSignature({
      matrixBundle: bundle,
      directionOptionId: meta.selectedPatternOptionId,
      directionKind: meta.selectedPatternKind,
      audiencePurposeReasoning: "Different rationale triggers review here.",
    });
    const evalAll = handoff.evaluateAllDownstreamArtifactsForUpstreamChange({
      currentSignature: currentSig,
      idea,
      claim,
      thesis,
    });

    assert.equal(evalAll.textsRewritten, false);
    assert.equal(idea.statement, EXISTING_IDEA);
    assert.equal(claim.workingClaim, EXISTING_CLAIM);
    assert.equal(thesis.thesis, EXISTING_THESIS);
    assert.deepEqual(thesis.proofPlan, ["Existing proof A", "Existing proof B", ""]);
  });

  it("7. confirming review stores the current signature and clears needsReview", () => {
    const bundle = readyBundle();
    const meta = stampedMeta(bundle);
    const currentSig = handoff.resolveCurrentUpstreamSignature({
      matrixBundle: bundle,
      directionOptionId: meta.selectedPatternOptionId,
      directionKind: meta.selectedPatternKind,
      audiencePurposeReasoning: "Yet another rationale for the confirm path.",
    });
    const confirmed = handoff.confirmMatrixReview({ currentSignature: currentSig });
    assert.equal(confirmed.needsReview, false);
    assert.equal(confirmed.reviewedSignature, currentSig);

    // On the next resume the stored reviewedSignature clears the warning for
    // the same current signature (the confirmation path persists the signature).
    const afterConfirm = handoff.evaluateDownstreamMatrixReview({
      currentSignature: currentSig,
      artifactReview: confirmed,
    });
    assert.equal(afterConfirm.needsReview, false);
  });

  it("8. unchanged signature does not raise a false review warning", () => {
    const bundle = readyBundle();
    const meta = stampedMeta(bundle);
    // Only a timestamp changed upstream — signature excludes timestamps.
    const sameSig = handoff.resolveCurrentUpstreamSignature({
      matrixBundle: { ...bundle, updatedAt: "2099-01-01T00:00:00.000Z" },
      directionOptionId: meta.selectedPatternOptionId,
      directionKind: meta.selectedPatternKind,
      audiencePurposeReasoning: bundle.audiencePurposeReasoning,
    });
    assert.equal(sameSig, meta.signature);

    const evalAll = handoff.evaluateAllDownstreamArtifactsForUpstreamChange({
      currentSignature: sameSig,
      idea: { statement: EXISTING_IDEA, matrixProvenance: meta },
      claim: { workingClaim: EXISTING_CLAIM, matrixProvenance: meta },
      thesis: { thesis: EXISTING_THESIS, matrixProvenance: meta },
    });
    assert.equal(evalAll.anyNeedsReview, false);
    assert.equal(evalAll.artifacts.thesis.needsReview, false);
  });

  it("9. fresh Module 3 user (no downstream provenance) gets the direct matrix handoff", () => {
    const bundle = readyBundle();
    // No prior prose, no stamped provenance on downstream artifacts.
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: bundle,
      evidenceRecords: [],
    });
    assert.equal(presentation.mode, "prefer_matrix_selection");

    const evalAll = handoff.evaluateAllDownstreamArtifactsForUpstreamChange({
      currentSignature: presentation.signature,
      idea: { matrixProvenance: null },
      claim: { matrixProvenance: null },
      thesis: { matrixProvenance: null },
    });
    assert.equal(evalAll.anyNeedsReview, false);
  });
});

describe("WP-079 resume — legacy work without provenance still triggers review", () => {
  it("11. existing Module 3 work that does not use the matrix selection resolves to EXISTING_WORK", () => {
    const bundle = readyBundle();
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: bundle,
      evidenceRecords: [],
      existingModule3: {
        // Seed/legacy pattern with no matrix provenance at all.
        patterns: [{ id: "seed-pattern-1", text: "My earlier notice", evidenceIds: [] }],
        selectedPatternId: "seed-pattern-1",
        ideaStatement: EXISTING_IDEA,
        workingClaim: EXISTING_CLAIM,
        thesisStatement: EXISTING_THESIS,
        proofPlan: EXISTING_PROOF,
      },
    });
    assert.equal(presentation.mode, "existing_module3_with_matrix");
    assert.equal(presentation.hasExistingModule3Work, true);
    // A signature exists for the current matrix even though the existing work has none.
    assert.ok(presentation.signature);
  });

  it("12. existing work that already uses the matrix selection stays on the direct path", () => {
    const bundle = readyBundle();
    const optionId = bundle.selectedPattern.optionId;
    const matrixPatternId = handoff.matrixPatternArtifactId(optionId);
    const presentation = handoff.buildModuleThreeMatrixHandoffPresentation({
      matrixBundle: bundle,
      evidenceRecords: [],
      existingModule3: {
        patterns: [{ id: matrixPatternId, text: "Matrix direction", evidenceIds: [] }],
        selectedPatternId: matrixPatternId,
        ideaStatement: EXISTING_IDEA,
        workingClaim: EXISTING_CLAIM,
        thesisStatement: EXISTING_THESIS,
        proofPlan: EXISTING_PROOF,
      },
    });
    assert.equal(presentation.mode, "prefer_matrix_selection");
  });

  it("13. form wires EXISTING_WORK mode into the resumed-stage review flags", () => {
    const form = fs.readFileSync(
      path.join(__dirname, "../components/ModuleThreeV2Form.jsx"),
      "utf8"
    );
    // Legacy/seed work (no stored signature) must still gate via the review flags.
    assert.match(form, /modeIsExistingWork/);
    assert.match(form, /existing_module3_with_matrix/);
    assert.match(form, /existingWorkReview/);
    assert.match(form, /reviewedForCurrent/);
    // The review flags derive from the combined per-artifact needs.
    assert.match(form, /idea: ideaNeedsReview/);
    assert.match(form, /claim: claimNeedsReview/);
    assert.match(form, /thesis: thesisNeedsReview/);
  });
});

describe("WP-079 resume — production wiring keeps review visible + gated per stage", () => {
  it("10. form hydrates downstream matrix meta and gates advance until reviewed", () => {
    const form = fs.readFileSync(
      path.join(__dirname, "../components/ModuleThreeV2Form.jsx"),
      "utf8"
    );

    // Hydrate idea/claim/thesis matrix provenance from the initial artifacts.
    const provenanceHydrations = form.match(
      /matrixProvenance: payload\.matrixProvenance \|\| null/g
    );
    assert.ok(provenanceHydrations && provenanceHydrations.length >= 3);

    // Each downstream stage renders the shared review banner keyed to its flag.
    assert.match(form, /visible=\{artifactReviewFlags\.idea\}/);
    assert.match(form, /visible=\{artifactReviewFlags\.claim\}/);
    assert.match(form, /visible=\{artifactReviewFlags\.thesis\}/);

    // Advancement is blocked while any stage still needs review.
    assert.match(form, /if \(artifactReviewFlags\.idea\) return false;/);
    assert.match(form, /if \(artifactReviewFlags\.claim\) return false;/);
    assert.match(form, /if \(artifactReviewFlags\.thesis\) return false;/);

    // Confirmation goes through the established review path only.
    assert.match(form, /confirmArtifactReview\("thesis"\)/);
    assert.match(form, /evaluateAllDownstreamArtifactsForUpstreamChange/);
  });
});
