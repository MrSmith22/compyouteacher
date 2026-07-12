const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  resolveFinalizedWriteValue,
  buildOutlineUpsertRow,
  readFinalizedFlag,
  outlineContentSignature,
  shouldAutosaveOutline,
  buildAutosaveRequestBody,
  buildFinalizeRequestBody,
  nextAutosaveRevision,
  createHydrationAutosaveGate,
  shouldIgnoreStaleAutosave,
  resolveFinalizeNavigation,
  SUCCESS_PAGE_OUTLINE_WRITE,
  CP_D0_LAYOUT_CONTRACT,
} = require("../lib/module5/outlinePersistenceHelpers.js");

const sampleOutline = {
  thesis: "King adapts ethos for each audience.",
  body: [{ bucket: "Speech ethos", points: ["Credibility with dreamers"] }],
  conclusion: { summary: "Restate", finalThought: "Act" },
};

describe("CP-D0 finalized write semantics", () => {
  it("persists finalized true", () => {
    const resolved = resolveFinalizedWriteValue(true);
    assert.deepEqual(resolved, { include: true, value: true });
    const row = buildOutlineUpsertRow({
      userEmail: "a@b.com",
      module: 5,
      outline: sampleOutline,
      finalized: true,
    });
    assert.equal(row.finalized, true);
  });

  it("persists finalized false intentionally", () => {
    const resolved = resolveFinalizedWriteValue(false);
    assert.deepEqual(resolved, { include: true, value: false });
    const row = buildOutlineUpsertRow({
      userEmail: "a@b.com",
      module: 5,
      outline: sampleOutline,
      finalized: false,
    });
    assert.equal(row.finalized, false);
  });

  it("omitted field preserves existing (column not in upsert row)", () => {
    assert.deepEqual(resolveFinalizedWriteValue(undefined), { include: false });
    assert.deepEqual(resolveFinalizedWriteValue(null), { include: false });
    const row = buildOutlineUpsertRow({
      userEmail: "a@b.com",
      module: 5,
      outline: sampleOutline,
    });
    assert.equal(Object.prototype.hasOwnProperty.call(row, "finalized"), false);
  });

  it("malformed field must not alter saved state", () => {
    for (const bad of ["true", "false", 1, 0, "yes", {}, [], ""]) {
      assert.equal(resolveFinalizedWriteValue(bad).include, false);
      const row = buildOutlineUpsertRow({
        userEmail: "a@b.com",
        module: 5,
        outline: sampleOutline,
        finalized: bad,
      });
      assert.equal(Object.prototype.hasOwnProperty.call(row, "finalized"), false);
    }
  });

  it("legacy null/absent loads safely as not locked", () => {
    assert.equal(readFinalizedFlag(null), false);
    assert.equal(readFinalizedFlag(undefined), false);
    assert.equal(readFinalizedFlag(true), true);
    assert.equal(readFinalizedFlag("true"), false);
  });
});

describe("CP-D0 hydration-safe autosave", () => {
  it("blocks autosave before hydration; load failure does not empty-save when signature matches applied empty", () => {
    const empty = {
      thesis: "",
      body: [],
      conclusion: { summary: "", finalThought: "" },
    };
    const sig = outlineContentSignature(empty);
    assert.equal(
      shouldAutosaveOutline({
        hydrationReady: false,
        locked: false,
        importing: false,
        signature: sig,
        lastPostedSignature: null,
      }),
      false
    );
    const gate = createHydrationAutosaveGate(empty);
    assert.equal(
      shouldAutosaveOutline({
        hydrationReady: true,
        locked: false,
        importing: false,
        loadFailed: true,
        signature: gate.lastPostedSignature,
        lastPostedSignature: gate.lastPostedSignature,
      }),
      false
    );
  });

  it("existing-outline / M4-import / legacy / empty hydrate do not echo identical save", () => {
    const cases = [
      sampleOutline,
      { thesis: "", body: [{ bucket: "from M4", points: ["a"] }], conclusion: { summary: "", finalThought: "" } },
      { thesis: "", body: [], conclusion: { summary: "", finalThought: "" } },
      { thesis: "legacy", body: [], conclusion: { summary: "x", finalThought: "" } },
    ];
    for (const applied of cases) {
      const gate = createHydrationAutosaveGate(applied);
      assert.equal(gate.hydrationReady, true);
      assert.equal(
        shouldAutosaveOutline({
          hydrationReady: true,
          locked: false,
          importing: false,
          signature: gate.lastPostedSignature,
          lastPostedSignature: gate.lastPostedSignature,
        }),
        false
      );
    }
  });

  it("first real edit after hydration autosaves; rapid edits keep newest revision", () => {
    const gate = createHydrationAutosaveGate(sampleOutline);
    const edited = {
      ...sampleOutline,
      thesis: "Edited thesis after hydrate",
    };
    const editedSig = outlineContentSignature(edited);
    assert.equal(
      shouldAutosaveOutline({
        hydrationReady: true,
        locked: false,
        importing: false,
        signature: editedSig,
        lastPostedSignature: gate.lastPostedSignature,
      }),
      true
    );

    let rev = 0;
    rev = nextAutosaveRevision(rev);
    rev = nextAutosaveRevision(rev);
    rev = nextAutosaveRevision(rev);
    assert.equal(rev, 3);
    assert.equal(
      shouldIgnoreStaleAutosave({ pendingRevision: 2, finalizeRevision: 3 }),
      true
    );
    assert.equal(
      shouldIgnoreStaleAutosave({ pendingRevision: 3, finalizeRevision: 3 }),
      false
    );
  });

  it("autosave omits finalized; finalize includes true", () => {
    const auto = buildAutosaveRequestBody(sampleOutline);
    assert.equal(Object.prototype.hasOwnProperty.call(auto, "finalized"), false);
    const fin = buildFinalizeRequestBody(sampleOutline);
    assert.equal(fin.finalized, true);
  });

  it("Strict Mode double-hydrate still suppresses echo via signature gate", () => {
    const first = createHydrationAutosaveGate(sampleOutline);
    const second = createHydrationAutosaveGate(sampleOutline);
    assert.equal(first.lastPostedSignature, second.lastPostedSignature);
    assert.equal(
      shouldAutosaveOutline({
        hydrationReady: true,
        locked: false,
        importing: false,
        signature: second.lastPostedSignature,
        lastPostedSignature: first.lastPostedSignature,
      }),
      false
    );
  });

  it("pending autosave is superseded by finalization revision", () => {
    assert.equal(
      shouldIgnoreStaleAutosave({ pendingRevision: 4, finalizeRevision: 5 }),
      true
    );
  });

  it("finalize failure blocks navigation; success navigates", () => {
    const fail = resolveFinalizeNavigation({ ok: false, error: "boom" });
    assert.equal(fail.navigate, false);
    assert.match(fail.error, /boom|could not save/i);

    const ok = resolveFinalizeNavigation({ ok: true });
    assert.equal(ok.navigate, true);
    assert.equal(ok.path, "/modules/5/success");
  });

  it("success-page refresh performs no outline write", () => {
    assert.equal(SUCCESS_PAGE_OUTLINE_WRITE, false);
    assert.equal(CP_D0_LAYOUT_CONTRACT.noReopenUi, true);
  });
});
