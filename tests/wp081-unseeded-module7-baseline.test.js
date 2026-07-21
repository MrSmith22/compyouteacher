/**
 * WP-081 — Unseeded Module 7 before/after baseline (no seed fixture).
 * Captures Before when untouched prose enters the revision workspace,
 * not on the first save after editing.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  ensureRevisionBaseline,
  applyRevisionCompareState,
  setRevisionInDraftMeta,
  getRevisionFromDraftMeta,
  REVISION_TARGET_IDS,
} = require("../lib/module7/bodyParagraphDiagnostics.js");

describe("WP-081 unseeded Module 7 baseline capture", () => {
  it("captures Module 6 prose as Before before any revision edit", () => {
    const module6Prose =
      "King builds credibility carefully for clergymen so they will hear his justice claim.";
    // Unseeded: no revisionBySourceIndex yet.
    const draftMeta = { schemaVersion: 1 };
    assert.equal(getRevisionFromDraftMeta(draftMeta, 0), null);

    const baseline = ensureRevisionBaseline(null, { prose: module6Prose });
    assert.ok(baseline);
    assert.equal(baseline.before, module6Prose);
    assert.equal(baseline.after, module6Prose);

    let meta = setRevisionInDraftMeta(draftMeta, 0, baseline);
    assert.equal(getRevisionFromDraftMeta(meta, 0).before, module6Prose);

    // Student edits the paragraph in the workspace.
    const revised =
      "King builds credibility carefully for clergymen so they will hear his justice claim. He opens with respect for their calling.";
    const afterEdit = applyRevisionCompareState(getRevisionFromDraftMeta(meta, 0), {
      prose: revised,
      targetId: REVISION_TARGET_IDS.EXPLANATION,
    });
    assert.equal(afterEdit.before, module6Prose);
    assert.equal(afterEdit.after, revised);

    meta = setRevisionInDraftMeta(meta, 0, afterEdit);

    // Refresh / reload preserves both.
    const reloaded = getRevisionFromDraftMeta(meta, 0);
    assert.equal(reloaded.before, module6Prose);
    assert.equal(reloaded.after, revised);

    // ensureRevisionBaseline must not overwrite after first capture.
    assert.equal(
      ensureRevisionBaseline(reloaded, { prose: revised }),
      null
    );
  });

  it("does not treat first-save-after-edit as the Before baseline when entry capture ran", () => {
    const original = "Original Module 6 body paragraph prose for BP1.";
    const edited = "Edited Module 7 body paragraph prose for BP1.";

    const onEntry = ensureRevisionBaseline(null, { prose: original });
    const onSave = applyRevisionCompareState(onEntry, {
      prose: edited,
      targetId: REVISION_TARGET_IDS.PLAN_ALIGNMENT,
    });

    assert.equal(onSave.before, original);
    assert.equal(onSave.after, edited);
    assert.notEqual(onSave.before, edited);
  });
});
