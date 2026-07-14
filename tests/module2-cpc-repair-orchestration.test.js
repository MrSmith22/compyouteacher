const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const matrix = require("../lib/module2/rhetoricalMatrixHelpers.js");
const derived = require("../lib/module2/matrixDerivationHelpers.js");
const deps = require("../lib/module2/matrixDependencyHelpers.js");
const orch = require("../lib/module2/matrixOrchestrationHelpers.js");
const m5 = require("../lib/module5/outlinePersistenceHelpers.js");

function fillCell(bundle, index, { rating, evidenceIds = [], note, none = false }) {
  const cell = bundle.cells[index];
  return matrix.updateCellInBundle(bundle, cell.id, {
    rating,
    evidenceIds,
    functionNote:
      note || "Enough characters for the mechanical function-note threshold.",
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
        : [
            `tchart:${bundle.cells[index].sourceType}:${bundle.cells[index].appeal}`,
          ],
      none,
    });
  });
  return bundle;
}

describe("Repair: matrix save controller (ordered writes)", () => {
  it("newest revision is final server value when writes race", async () => {
    const controller = orch.createMatrixSaveController();
    const older = m5.createDeferred();
    const newer = m5.createDeferred();
    const server = { record: null, writes: [] };

    const first = controller.saveForTransition(async (ticket) => {
      await older.promise;
      server.record = { rev: 1, ticket: ticket.revision };
      server.writes.push(1);
      return { ok: true, bundle: server.record };
    });

    // Let pump start revision 1 before queueing revision 2
    await Promise.resolve();

    const second = controller.saveForTransition(async (ticket) => {
      await newer.promise;
      server.record = { rev: 2, ticket: ticket.revision };
      server.writes.push(2);
      return { ok: true, bundle: server.record };
    });

    // Adversarial: resolve newer gate first (noop until its send starts)
    newer.resolve();
    older.resolve();

    const firstResult = await first;
    const secondResult = await second;

    assert.equal(server.record.rev, 2);
    assert.deepEqual(server.writes, [1, 2]);
    assert.equal(firstResult.stale, true);
    assert.equal(firstResult.advanced, false);
    assert.equal(secondResult.ok, true);
    assert.equal(secondResult.advanced, true);
  });

  it("typing does not advance; Continue persists latest and advances only on success", async () => {
    const controller = orch.createMatrixSaveController();
    const older = m5.createDeferred();
    const newer = m5.createDeferred();

    const first = controller.saveForTransition(async () => {
      await older.promise;
      return { ok: true, bundle: { rev: 1 } };
    });

    await Promise.resolve();

    const second = controller.saveForTransition(async () => {
      await newer.promise;
      return { ok: true, bundle: { rev: 2 } };
    });

    older.resolve();
    const firstResult = await first;
    assert.equal(firstResult.stale, true);
    assert.equal(firstResult.advanced, false);

    newer.resolve();
    const secondResult = await second;
    assert.equal(secondResult.ok, true);
    assert.equal(secondResult.advanced, true);
    assert.equal(secondResult.bundle.rev, 2);
  });

  it("failed older write does not discard newer queued bundle", async () => {
    const controller = orch.createMatrixSaveController();
    const d1 = m5.createDeferred();
    const server = { record: null };

    const first = controller.saveForTransition(async () => {
      await d1.promise;
      return { ok: false, error: "transient" };
    });
    await Promise.resolve();
    const second = controller.saveForTransition(async () => {
      server.record = { rev: 2 };
      return { ok: true, bundle: server.record };
    });

    d1.resolve();
    const r1 = await first;
    const r2 = await second;
    assert.equal(r1.ok, false);
    assert.equal(r1.advanced, false);
    assert.equal(r2.ok, true);
    assert.equal(server.record.rev, 2);
  });

  it("failed save does not advance and preserves error for retry", async () => {
    const controller = orch.createMatrixSaveController();
    const result = await controller.saveForTransition(async () => ({
      ok: false,
      error: "network down",
    }));
    assert.equal(result.ok, false);
    assert.equal(result.advanced, false);
    assert.match(result.error, /network down/);
    assert.equal(controller.isTransitionAllowed(result), false);
  });
});

describe("Repair: transition save-result gates freeze navigation", () => {
  const position = {
    stage: "cell",
    cellIndex: 2,
    microtask: "evidence",
    route: "/modules/2/matrix",
  };

  for (const label of [
    "Continue",
    "Back",
    "Open completed cell",
    "Missing-evidence route",
    "Pattern selection",
    "Reasoning completion",
  ]) {
    it(`${label}: save failure keeps stage/cell/microtask/route`, () => {
      const gate = orch.resolveMatrixNavigationGate({
        saveResult: {
          ok: false,
          stale: false,
          advanced: false,
          error: "Could not save your matrix. Please try again.",
        },
        ...position,
      });
      assert.equal(gate.allow, false);
      assert.equal(gate.stage, position.stage);
      assert.equal(gate.cellIndex, position.cellIndex);
      assert.equal(gate.microtask, position.microtask);
      assert.equal(gate.route, position.route);
      assert.match(gate.error, /could not save/i);
    });
  }

  it("stale save result also freezes navigation without treating as hard error", () => {
    const gate = orch.resolveMatrixNavigationGate({
      saveResult: { ok: false, stale: true, advanced: false, error: null },
      ...position,
    });
    assert.equal(gate.allow, false);
    assert.equal(gate.stage, position.stage);
    assert.equal(gate.cellIndex, position.cellIndex);
    assert.equal(gate.microtask, position.microtask);
    assert.equal(gate.route, position.route);
  });

  it("successful save may navigate", () => {
    const gate = orch.resolveMatrixNavigationGate({
      saveResult: { ok: true, stale: false, advanced: true, error: null },
      ...position,
    });
    assert.equal(gate.allow, true);
  });
});

describe("Repair: dependency review via UI path", () => {
  it("marks needs_review when completed matrix with selection is edited", () => {
    let bundle = completeAll([9, 2, 5, 5, 4, 4]);
    bundle = {
      ...bundle,
      selectedPattern: {
        optionId: "largest_contrast:ethos",
        label: "Contrast ethos",
        kind: "largest_contrast",
      },
      audiencePurposeReasoning:
        "Because these audiences differ, the contrast is the essay direction.",
    };

    const once = orch.applyMatrixCellPatchViaUiPath({
      bundle,
      cellId: bundle.cells[0].id,
      patch: { rating: 4 },
    });
    assert.equal(once.usedDependencyReview, true);
    assert.equal(once.bundle.reviewState.dependentsNeedReview, true);
    assert.equal(once.bundle.selectedPattern.optionId, "largest_contrast:ethos");
    assert.equal(once.downstreamTextsRewritten, false);

    const twice = orch.applyMatrixCellPatchViaUiPath({
      bundle: once.bundle,
      cellId: bundle.cells[0].id,
      patch: { functionNote: "Updated note that is long enough for the threshold." },
    });
    const ethosReasons = twice.bundle.reviewState.reasons.filter(
      (r) => r.cellId === bundle.cells[0].id
    );
    assert.equal(ethosReasons.length, 1);
  });
});

describe("Repair: handoff readiness and resume", () => {
  it("does not treat selectedPattern alone as complete", () => {
    let bundle = completeAll([5, 5, 5, 5, 5, 5]);
    bundle = {
      ...bundle,
      selectedPattern: {
        optionId: "x",
        label: "Some pattern that is long enough",
        kind: "largest_contrast",
      },
      audiencePurposeReasoning: "",
    };
    assert.equal(orch.isMatrixHandoffReady(bundle), false);
    const resume = orch.resolveMatrixResumeTarget(bundle);
    assert.equal(resume.stage, matrix.MATRIX_FLOW_STAGES.REASONING);

    const handoff = deps.resolveModule3MatrixHandoff(bundle);
    assert.equal(handoff.mode, "matrix_review_required");
    assert.match(handoff.cta.label, /audiences and purposes/i);
  });

  it("resumes first incomplete microtask accurately across cells", () => {
    let bundle = matrix.createEmptyMatrixBundle();
    // Cell 0: rating only
    bundle = fillCell(bundle, 0, {
      rating: 7,
      evidenceIds: [],
      note: "short",
    });
    bundle.cells[0].functionNote = "";
    bundle.cells[0].evidenceIds = [];
    let resume = orch.resolveMatrixResumeTarget(bundle);
    assert.equal(resume.cellIndex, 0);
    assert.equal(resume.microtask, "evidence");

    bundle.cells[0].evidenceIds = ["tchart:speech:ethos"];
    resume = orch.resolveMatrixResumeTarget(bundle);
    assert.equal(resume.microtask, "function");

    bundle.cells[0].functionNote =
      "Enough characters for the mechanical function-note threshold.";
    // Cell 1 rating 0 without explicit none
    bundle = fillCell(bundle, 1, { rating: 0, none: false, evidenceIds: [] });
    bundle.cells[1].explicitNoEvidence = false;
    bundle.cells[1].functionNote = "";
    resume = orch.resolveMatrixResumeTarget(bundle);
    assert.equal(resume.cellIndex, 1);
    assert.equal(resume.microtask, "evidence");

    assert.equal(orch.getFirstIncompleteMicrotask(bundle.cells[0]), null);
  });

  it("prefer_matrix_selection only when handoff fully ready", () => {
    let bundle = completeAll([6, 6, 6, 6, 6, 6]);
    bundle = {
      ...bundle,
      selectedPattern: {
        optionId: "combined",
        label: "Combined dominant direction text",
        kind: "combined_dominant_across_works",
      },
      audiencePurposeReasoning:
        "This direction fits both audiences and purposes clearly enough.",
      reviewState: {
        dependentsNeedReview: false,
        reasons: [],
        changedCellIds: [],
      },
    };
    assert.equal(orch.isMatrixHandoffReady(bundle), true);
    assert.equal(
      deps.resolveModule3MatrixHandoff(bundle).mode,
      "prefer_matrix_selection"
    );

    bundle.reviewState.dependentsNeedReview = true;
    assert.equal(orch.isMatrixHandoffReady(bundle), false);
    assert.equal(
      deps.resolveModule3MatrixHandoff(bundle).mode,
      "matrix_review_required"
    );
  });
});

describe("Repair: primary recommendations and readable provenance", () => {
  it("caps primary recommended directions at three plus custom", () => {
    const bundle = completeAll([9, 2, 6, 6, 8, 8]);
    const result = derived.derivePatternOptions(bundle);
    const ranked = orch.selectPrimaryPatternRecommendations(result);
    assert.ok(ranked.primaryCount <= orch.MAX_PRIMARY_RECOMMENDATIONS);
    assert.equal(ranked.custom.kind, "student_created");
    assert.ok(
      ranked.primary.every(
        (o) =>
          o.kind === "largest_contrast" ||
          o.kind === "meaningful_similarity" ||
          o.kind === "combined_dominant_across_works"
      )
    );
    assert.ok(
      !ranked.primary.some((o) => o.kind === "dominant_per_work"),
      "separate dominant-per-work cards must not be primary"
    );
    assert.ok(ranked.supporting.length >= 0);
  });

  it("requires custom pattern threshold and keeps internal IDs secondary", () => {
    assert.equal(
      orch.canContinuePatternSelection({
        selectedOptionId: "student_created",
        customLabel: "too short",
      }),
      false
    );
    assert.equal(
      orch.canContinuePatternSelection({
        selectedOptionId: "student_created",
        customLabel: "A clear custom pattern idea",
      }),
      true
    );

    const option = {
      id: "largest_contrast:ethos",
      kind: "largest_contrast",
      why: "Speech 9/10 vs Letter 2/10",
      provenance: {
        ratings: { speech: { ethos: 9 }, letter: { ethos: 2 } },
        evidenceIds: ["tchart:speech:ethos"],
        appeals: ["ethos"],
      },
    };
    const readable = orch.buildReadableProvenance(option, [
      {
        id: "tchart:speech:ethos",
        sourceType: "speech",
        appeal: "ethos",
        quotation: "I have a dream that one day this nation will rise",
      },
    ]);
    assert.deepEqual(readable.evidenceIds, ["tchart:speech:ethos"]);
    assert.ok(readable.readable.evidence[0].visibleLabel.includes("Speech"));
    assert.ok(!readable.readable.evidence[0].visibleLabel.startsWith("tchart:"));
  });
});

describe("Repair: missing-evidence recovery and presentation", () => {
  it("blocks advance and offers recovery actions", () => {
    const cell = {
      sourceType: "speech",
      appeal: "pathos",
      rating: 7,
      evidenceIds: [],
    };
    const recovery = orch.getMissingEvidenceRecovery({
      cell,
      matchingEvidenceCount: 0,
    });
    assert.equal(recovery.needed, true);
    assert.equal(recovery.canAdvance, false);
    assert.ok(recovery.actions.some((a) => a.id === "add_evidence"));
    assert.ok(recovery.actions.some((a) => a.id === "revise_rating"));
    assert.match(recovery.actions[0].href, /tcharts/);
  });

  it("exposes rating anchors and continue gate in presentation model", () => {
    const bundle = completeAll([5, 5, 5, 5, 5, 5]);
    const model = orch.getMatrixPresentationModel({
      stage: matrix.MATRIX_FLOW_STAGES.CELL,
      bundle,
      cellIndex: 0,
      microtask: "rate",
    });
    assert.equal(model.ratingAnchorsVisible, true);
    assert.equal(model.ratingAnchors.length, 5);
    assert.ok(model.dominantQuestion.includes("ethos"));
    assert.equal(model.responseMode, "rate");
  });
});

describe("Repair: Module 5 ordered outline writes (mock server)", () => {
  it("ordinary autosave A then B ends with B on the server", async () => {
    const controller = m5.createOutlineWriteController();
    const dA = m5.createDeferred();
    const server = { record: null, writes: [] };

    controller.noteLocalEdit();
    const pA = controller.beginAutosave(async ({ outline }) => {
      await dA.promise;
      server.record = { ...outline, finalized: false };
      server.writes.push("A");
      return { ok: true, outline };
    }, { thesis: "A", body: [], conclusion: {} });

    await Promise.resolve();

    controller.noteLocalEdit();
    const pB = controller.beginAutosave(async ({ outline }) => {
      server.record = { ...outline, finalized: false };
      server.writes.push("B");
      return { ok: true, outline };
    }, { thesis: "B", body: [], conclusion: {} });

    dA.resolve();
    await pA;
    await pB;

    assert.equal(server.record.thesis, "B");
    assert.equal(server.record.finalized, false);
    assert.ok(server.writes.includes("B"));
    assert.equal(server.writes[server.writes.length - 1], "B");
  });

  it("finalize after A/B edits ends with C finalized; no later writes", async () => {
    const controller = m5.createOutlineWriteController();
    const dA = m5.createDeferred();
    const server = { record: null, writes: [], postFinalizeWrites: 0 };

    controller.noteLocalEdit();
    const pA = controller.beginAutosave(async ({ outline }) => {
      await dA.promise;
      server.record = { ...outline, finalized: false };
      server.writes.push(outline.thesis);
      return { ok: true, outline };
    }, { thesis: "A", body: [], conclusion: {} });

    await Promise.resolve();

    controller.noteLocalEdit();
    controller.beginAutosave(async ({ outline }) => {
      server.record = { ...outline, finalized: false };
      server.writes.push(outline.thesis);
      return { ok: true, outline };
    }, { thesis: "B", body: [], conclusion: {} });

    controller.noteLocalEdit();
    const fin = controller.finalize({
      outline: { thesis: "C", body: [], conclusion: { summary: "s" } },
      cancelPendingTimer: () => {},
      sendFinalize: async (outline) => {
        server.record = { ...outline, finalized: true };
        server.writes.push("FINAL:" + outline.thesis);
        return { ok: true };
      },
    });

    // Adversarial resolve of A after finalize was requested
    dA.resolve();
    await pA;
    const outcome = await fin;

    assert.equal(outcome.ok, true);
    assert.equal(server.record.thesis, "C");
    assert.equal(server.record.finalized, true);
    assert.equal(server.writes[server.writes.length - 1], "FINAL:C");

    // No write after finalize
    const blocked = controller.beginAutosave(async ({ outline }) => {
      server.postFinalizeWrites += 1;
      server.record = outline;
      return { ok: true, outline };
    }, { thesis: "D" });
    assert.equal(blocked, null);
    assert.equal(server.postFinalizeWrites, 0);
    assert.equal(server.record.thesis, "C");
  });

  it("finalize failure recovers: later autosave and retry Finish succeed", async () => {
    const controller = m5.createOutlineWriteController();
    const server = { record: null };

    controller.noteLocalEdit();
    await controller.beginAutosave(async ({ outline }) => {
      server.record = { ...outline, finalized: false };
      return { ok: true, outline };
    }, { thesis: "settled-early", body: [], conclusion: {} });

    const failed = await controller.finalize({
      outline: { thesis: "fail-attempt", body: [], conclusion: {} },
      cancelPendingTimer: () => {},
      sendFinalize: async () => ({ ok: false, error: "server error" }),
    });
    assert.equal(failed.ok, false);
    assert.equal(failed.navigate, false);
    assert.equal(failed.finalizeBarrier, 0);
    assert.equal(controller.areAutosavesAllowed(), true);

    controller.noteLocalEdit();
    await controller.beginAutosave(async ({ outline }) => {
      server.record = { ...outline, finalized: false };
      return { ok: true, outline };
    }, { thesis: "after-failure-edit", body: [], conclusion: {} });

    assert.equal(server.record.thesis, "after-failure-edit");

    const retry = await controller.finalize({
      outline: { thesis: "after-failure-edit", body: [], conclusion: {} },
      cancelPendingTimer: () => {},
      sendFinalize: async (outline) => {
        server.record = { ...outline, finalized: true };
        return { ok: true };
      },
    });

    assert.equal(retry.ok, true);
    assert.equal(retry.navigate, true);
    assert.equal(server.record.thesis, "after-failure-edit");
    assert.equal(server.record.finalized, true);
  });

  it("in-flight autosave then finalize: server ends with finalize content", async () => {
    const controller = m5.createOutlineWriteController();
    const deferred = m5.createDeferred();
    const server = { record: null };

    controller.noteLocalEdit();
    const autosave = controller.beginAutosave(async ({ outline }) => {
      await deferred.promise;
      server.record = { ...outline, finalized: false };
      return { ok: true, outline };
    }, { thesis: "OLD", body: [], conclusion: {} });

    await Promise.resolve();

    const newest = {
      thesis: "NEWEST",
      body: [{ bucket: "A", points: ["p"] }],
      conclusion: { summary: "s", finalThought: "t" },
    };

    const finalizePromise = controller.finalize({
      outline: newest,
      cancelPendingTimer: () => {},
      sendFinalize: async (outline) => {
        server.record = { ...outline, finalized: true };
        return { ok: true };
      },
    });

    deferred.resolve();
    await autosave;
    const fin = await finalizePromise;
    assert.equal(fin.ok, true);
    assert.equal(server.record.thesis, "NEWEST");
    assert.equal(server.record.finalized, true);
    assert.equal(controller.mayApplyAutosaveResult(1), false);
  });

  it("finalize failure after in-flight autosave does not navigate", async () => {
    const controller = m5.createOutlineWriteController();
    const deferred = m5.createDeferred();
    controller.noteLocalEdit();
    controller.beginAutosave(async () => {
      await deferred.promise;
      return { ok: true, outline: { thesis: "mid" } };
    }, { thesis: "mid" });

    await Promise.resolve();

    const finalizePromise = controller.finalize({
      outline: { thesis: "final-attempt" },
      cancelPendingTimer: () => {},
      sendFinalize: async () => ({ ok: false, error: "server error" }),
    });
    deferred.resolve();
    const fin = await finalizePromise;
    assert.equal(fin.ok, false);
    assert.equal(fin.navigate, false);
    assert.match(fin.error, /server error|could not save/i);
    assert.equal(controller.areAutosavesAllowed(), true);
  });
});
