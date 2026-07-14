const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const matrix = require("../lib/module2/rhetoricalMatrixHelpers.js");
const derived = require("../lib/module2/matrixDerivationHelpers.js");
const deps = require("../lib/module2/matrixDependencyHelpers.js");

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
      evidenceIds: none ? [] : [`tchart:${bundle.cells[index].sourceType}:${bundle.cells[index].appeal}`],
      none,
      note: "Enough characters for the mechanical function-note threshold.",
    });
  });
  return bundle;
}

describe("CP-C matrix ratings and cells", () => {
  it("accepts valid ratings 0–10 and rejects invalid", () => {
    for (let n = 0; n <= 10; n += 1) {
      assert.equal(matrix.normalizeRating(n).valid, true);
    }
    assert.equal(matrix.normalizeRating(11).valid, false);
    assert.equal(matrix.normalizeRating(-1).valid, false);
    assert.equal(matrix.normalizeRating(1.5).valid, false);
    assert.equal(matrix.normalizeRating("x").valid, false);
  });

  it("uses six canonical IDs in approved appeal-major order", () => {
    assert.deepEqual(
      matrix.MATRIX_CELL_ORDER.map((c) => matrix.matrixCellId(c.sourceType, c.appeal)),
      [
        "matrix:mlk:speech:ethos",
        "matrix:mlk:letter:ethos",
        "matrix:mlk:speech:pathos",
        "matrix:mlk:letter:pathos",
        "matrix:mlk:speech:logos",
        "matrix:mlk:letter:logos",
      ]
    );
  });

  it("sequences rate → evidence → function", () => {
    assert.equal(matrix.advanceMicrotask("rate", "next"), "evidence");
    assert.equal(matrix.advanceMicrotask("evidence", "next"), "function");
    assert.equal(matrix.advanceMicrotask("function", "back"), "evidence");
  });

  it("rating 0 uses explicit-none path; above 0 requires evidence", () => {
    let bundle = matrix.createEmptyMatrixBundle();
    const cell0 = bundle.cells[0];
    bundle = matrix.updateCellInBundle(bundle, cell0.id, {
      rating: 0,
      explicitNoEvidence: true,
      functionNote: "Limited here because King relies on pathos instead for this crowd.",
    });
    assert.equal(matrix.isCellComplete(bundle.cells[0]), true);
    assert.equal(matrix.canAdvanceMicrotask(bundle.cells[0], "evidence"), true);

    bundle = matrix.updateCellInBundle(bundle, cell0.id, {
      rating: 7,
      explicitNoEvidence: false,
      evidenceIds: [],
      functionNote: "Still incomplete without evidence linked to the rating judgment.",
    });
    assert.equal(matrix.canAdvanceMicrotask(bundle.cells[0], "evidence"), false);
    assert.equal(matrix.isCellComplete(bundle.cells[0]), false);

    bundle = matrix.updateCellInBundle(bundle, cell0.id, {
      evidenceIds: ["tchart:speech:ethos"],
    });
    assert.equal(matrix.isCellComplete(bundle.cells[0]), true);
  });

  it("enforces function-note threshold and supports partial hydration / resume", () => {
    const partial = matrix.readMatrixBundle({
      schemaVersion: 1,
      cells: [
        {
          id: "matrix:mlk:speech:ethos",
          sourceType: "speech",
          appeal: "ethos",
          rating: 8,
          evidenceIds: ["tchart:speech:ethos"],
          functionNote: "short",
        },
      ],
    });
    assert.equal(partial.cells.length, 6);
    assert.equal(partial.cells[0].rating, 8);
    assert.equal(matrix.isCellComplete(partial.cells[0]), false);
    assert.equal(matrix.getMatrixProgress({ cellIndex: 2, microtask: "evidence" }).label, "Cell 3 of 6 · Step 2 of 3");
  });

  it("revision updates cell without wiping others", () => {
    let bundle = completeAll([8, 3, 6, 6, 4, 9]);
    const beforeOther = bundle.cells[5].rating;
    bundle = matrix.updateCellInBundle(bundle, bundle.cells[0].id, { rating: 5 });
    assert.equal(bundle.cells[0].rating, 5);
    assert.equal(bundle.cells[5].rating, beforeOther);
  });
});

describe("CP-C derivation and provenance", () => {
  it("derives largest contrast, similarity, dominant, high/high, low/low, high/low, ties, missing, no-evidence, custom", () => {
    const bundle = completeAll([9, 2, 6, 6, 8, 8]);
    const result = derived.derivePatternOptions(bundle);
    const kinds = new Set(result.options.map((o) => o.kind));
    assert.ok(kinds.has("largest_contrast"));
    assert.ok(kinds.has("meaningful_similarity"));
    assert.ok(kinds.has("dominant_per_work"));
    assert.ok(kinds.has("high_high"));
    assert.ok(kinds.has("high_low"));
    assert.ok(kinds.has("student_created"));

    const contrast = result.options.find((o) => o.kind === "largest_contrast");
    assert.ok(contrast.provenance.ratings);
    assert.ok(Array.isArray(contrast.provenance.evidenceIds));
    assert.ok(contrast.why.match(/\d+/));

    const lowBundle = completeAll([2, 1, 2, 3, 1, 2]);
    const low = derived.derivePatternOptions(lowBundle);
    assert.ok(low.options.some((o) => o.kind === "low_low"));

    const missing = derived.derivePatternOptions(matrix.createEmptyMatrixBundle());
    assert.equal(missing.flags.missingRatings, true);

    let noEv = matrix.createEmptyMatrixBundle();
    noEv = fillCell(noEv, 0, {
      rating: 7,
      evidenceIds: [],
      note: "Function note long enough for threshold check here.",
    });
    // force incomplete evidence path into flags via raw cell
    noEv.cells[0].evidenceIds = [];
    const flagged = derived.derivePatternOptions(noEv);
    assert.ok(flagged.flags.ratingWithoutEvidence.length >= 1);

    const selected = derived.buildSelectedPattern({
      option: contrast,
      derived: result,
    });
    assert.equal(selected.advisory, true);
    assert.ok(selected.provenance.evidenceIds);

    const custom = derived.buildSelectedPattern({
      option: result.options.find((o) => o.kind === "student_created"),
      customLabel: "King shifts from dream imagery to legal logic",
      derived: result,
    });
    assert.match(custom.label, /shifts from dream/);

    const cue = derived.contradictoryChoiceCue(
      result.options.find((o) => o.kind === "meaningful_similarity"),
      result
    );
    // may or may not cue depending on contrast size; ensure function is safe
    assert.ok(cue === null || cue.kind === "contradictory_choice");
  });
});

describe("CP-C safety and compatibility", () => {
  it("legacy no-matrix falls back; incomplete handoff requires CTA; ready prefers selection", () => {
    assert.equal(deps.resolveModule3MatrixHandoff(null).mode, "legacy_pattern_path");
    const incomplete = matrix.createEmptyMatrixBundle();
    assert.equal(
      deps.resolveModule3MatrixHandoff(incomplete).mode,
      "matrix_review_required"
    );
    const selectionOnly = {
      ...completeAll([5, 5, 5, 5, 5, 5]),
      selectedPattern: { optionId: "x", label: "A selected pattern label" },
      audiencePurposeReasoning: "",
    };
    assert.equal(
      deps.resolveModule3MatrixHandoff(selectionOnly).mode,
      "matrix_review_required"
    );
    const ready = {
      ...completeAll([5, 5, 5, 5, 5, 5]),
      selectedPattern: {
        optionId: "x",
        label: "A selected pattern label",
        kind: "largest_contrast",
      },
      audiencePurposeReasoning:
        "This direction fits these audiences and purposes for the essay.",
      reviewState: {
        dependentsNeedReview: false,
        reasons: [],
        changedCellIds: [],
      },
    };
    assert.equal(
      deps.resolveModule3MatrixHandoff(ready).mode,
      "prefer_matrix_selection"
    );
  });

  it("cell edit does not rewrite selection or downstream texts; marks review", () => {
    const bundle = {
      ...completeAll([9, 2, 5, 5, 4, 4]),
      selectedPattern: { optionId: "largest_contrast:ethos", label: "Contrast ethos" },
    };
    const result = deps.applyCellEdit({
      bundle,
      cellId: bundle.cells[0].id,
      patch: { rating: 4 },
      existingSelection: bundle.selectedPattern,
    });
    assert.equal(result.selectionAutoUpdated, false);
    assert.equal(result.downstreamTextsRewritten, false);
    assert.equal(result.bundle.selectedPattern.optionId, "largest_contrast:ethos");
    assert.equal(result.bundle.reviewState.dependentsNeedReview, true);
    assert.equal(deps.DOWNSTREAM_REWRITE_FORBIDDEN, true);
    assert.equal(deps.MATRIX_REVIEW_IS_READONLY, true);
  });

  it("malformed bundle reads safely; layout contracts documented", () => {
    assert.equal(matrix.readMatrixBundle("nope"), null);
    assert.equal(matrix.MATRIX_LAYOUT_CONTRACT.oneDominantQuestion, true);
    assert.equal(matrix.MATRIX_LAYOUT_CONTRACT.noSixSimultaneousInputs, true);
    assert.deepEqual(matrix.MATRIX_LAYOUT_CONTRACT.viewports, [320, 390, 768, 1440]);
  });
});
