/**
 * WP-082 corrective — Module 7 resume + revision save/reload contracts.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  readModule7ResumeStepIndex,
  resolveModule7ResumeStepIndex,
  setModule7ResumeInDraftMeta,
} = require("../lib/module7/module7Resume.js");
const {
  applyRevisionCompareState,
  setRevisionInDraftMeta,
  getRevisionFromDraftMeta,
} = require("../lib/module7/bodyParagraphDiagnostics.js");
const {
  setIntroductionRevisionInDraftMeta,
  getIntroductionRevisionFromDraftMeta,
} = require("../lib/module7/introductionDiagnostics.js");
const {
  setConclusionRevisionInDraftMeta,
  getConclusionRevisionFromDraftMeta,
} = require("../lib/module7/conclusionDiagnostics.js");

describe("WP-082 Module 7 resume persistence", () => {
  it("stores and restores currentStepIndex without dropping verticalSlice", () => {
    const withSlice = {
      verticalSlice: {
        revisionBySectionType: {
          conclusion: { before: "B", after: "A", targetId: null },
        },
      },
    };
    const next = setModule7ResumeInDraftMeta(withSlice, {
      currentStepIndex: 5,
      sectionType: "conclusion",
      draftIndex: 4,
    });
    assert.equal(next.currentStepIndex, 5);
    assert.equal(next.resume.kind, "module7");
    assert.equal(next.resume.sectionType, "conclusion");
    assert.equal(
      next.verticalSlice.revisionBySectionType.conclusion.before,
      "B"
    );
    assert.equal(readModule7ResumeStepIndex(next), 5);
    assert.equal(resolveModule7ResumeStepIndex(next, 5), 5);
  });

  it("clamps resume to valid Module 7 bounds", () => {
    const meta = setModule7ResumeInDraftMeta(null, { currentStepIndex: 99 });
    // 5 section steps → max index = 6 (final review)
    assert.equal(resolveModule7ResumeStepIndex(meta, 5), 6);
    assert.equal(resolveModule7ResumeStepIndex(null, 5), 0);
  });

  it("keeps Introduction before/after distinct across resume merge", () => {
    const before =
      "Original introduction prose about audience and thesis destination.";
    const after =
      "Revised introduction prose about audience and thesis destination MARKER.";
    let meta = setIntroductionRevisionInDraftMeta(
      null,
      applyRevisionCompareState(null, { prose: before })
    );
    meta = setIntroductionRevisionInDraftMeta(
      meta,
      applyRevisionCompareState(getIntroductionRevisionFromDraftMeta(meta), {
        prose: after,
        clearerConfirmed: true,
      })
    );
    meta = setModule7ResumeInDraftMeta(meta, {
      currentStepIndex: 1,
      sectionType: "intro",
      draftIndex: 0,
    });
    const loaded = getIntroductionRevisionFromDraftMeta(meta);
    assert.equal(loaded.before, before);
    assert.equal(loaded.after, after);
    assert.equal(resolveModule7ResumeStepIndex(meta, 5), 1);
  });

  it("keeps Conclusion before/after distinct across resume merge", () => {
    const before =
      "Original conclusion prose that returns to the thesis without a marker.";
    const after =
      "Original conclusion prose that returns to the thesis without a marker. CONC-MARKER.";
    let meta = setConclusionRevisionInDraftMeta(
      null,
      applyRevisionCompareState(null, { prose: before })
    );
    meta = setConclusionRevisionInDraftMeta(
      meta,
      applyRevisionCompareState(getConclusionRevisionFromDraftMeta(meta), {
        prose: after,
      })
    );
    meta = setModule7ResumeInDraftMeta(meta, {
      currentStepIndex: 5,
      sectionType: "conclusion",
      draftIndex: 4,
    });
    const loaded = getConclusionRevisionFromDraftMeta(meta);
    assert.equal(loaded.before, before);
    assert.equal(loaded.after, after);
    assert.match(loaded.after, /CONC-MARKER/);
    assert.doesNotMatch(loaded.before, /CONC-MARKER/);
    assert.equal(resolveModule7ResumeStepIndex(meta, 5), 5);
  });

  it("preserves BP1 revision state when resume is written", () => {
    const before = "BP1 original student wording about ethos remains owned.";
    const after = "BP1 revised student wording about ethos remains owned.";
    let meta = setRevisionInDraftMeta(
      null,
      0,
      applyRevisionCompareState(null, { prose: before })
    );
    meta = setRevisionInDraftMeta(
      meta,
      0,
      applyRevisionCompareState(getRevisionFromDraftMeta(meta, 0), {
        prose: after,
      })
    );
    meta = setModule7ResumeInDraftMeta(meta, {
      currentStepIndex: 2,
      sectionType: "body",
      draftIndex: 1,
    });
    const loaded = getRevisionFromDraftMeta(meta, 0);
    assert.equal(loaded.before, before);
    assert.equal(loaded.after, after);
  });
});

describe("WP-082 Module 7 save does not imply Module 6 wipe", () => {
  it("documents that M7 upsert keys module:7 only (payload contract)", () => {
    // Guard against accidental cross-module writes in the client save path.
    const ModuleSevenSource = require("fs").readFileSync(
      require("path").join(__dirname, "../components/ModuleSeven.js"),
      "utf8"
    );
    assert.match(ModuleSevenSource, /upsertModule7DraftArtifact/);
    assert.match(ModuleSevenSource, /setModule7ResumeInDraftMeta/);
    assert.match(ModuleSevenSource, /resolveModule7ResumeStepIndex/);
    assert.doesNotMatch(
      ModuleSevenSource,
      /upsertModule6DraftArtifact\(/
    );
  });
});
