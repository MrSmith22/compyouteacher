/**
 * WP-092 — Guided APA protocol contract, state, gate, and boundaries.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  getMlkGuidedApaRequirementsContract,
  buildGuidedApaProtocolSignature,
  GUIDED_APA_RULE_KINDS,
  labelForGuidedApaRuleKind,
} = require("../lib/module9/guidedApaRequirementsContract.js");
const {
  listGuidedApaMoves,
  listGuidedApaPdfInspectionItems,
  GUIDED_APA_PDF_DOWNLOAD_STEPS,
} = require("../lib/module9/guidedApaMoves.js");
const {
  createEmptyGuidedApaProtocolState,
  normalizeGuidedApaProtocolState,
  setGuidedApaMoveStatus,
  invalidateGuidedApaAgainstDocument,
  attachLegacyGuidedApaHistory,
  areFormattingMovesComplete,
  isDocInspectionComplete,
  resolveGuidedApaPhase,
  isGuidedApaWriteStale,
} = require("../lib/module9/guidedApaProtocolState.js");

describe("WP-092 requirements contract", () => {
  it("distinguishes APA / teacher / assignment rule kinds", () => {
    const c = getMlkGuidedApaRequirementsContract();
    assert.equal(c.font.kind, GUIDED_APA_RULE_KINDS.TEACHER_REQUIRES);
    assert.match(c.font.summary, /APA 7 allows other fonts/i);
    assert.equal(c.lineSpacing.kind, GUIDED_APA_RULE_KINDS.APA_GUIDANCE);
    assert.equal(c.abstract.required, false);
    assert.equal(c.abstract.kind, GUIDED_APA_RULE_KINDS.FOR_THIS_ASSIGNMENT);
    assert.equal(c.inTextCitations.sameAuthorSameYear, true);
    assert.equal(c.inTextCitations.speechYearKey, "1963a");
    assert.equal(c.inTextCitations.letterYearKey, "1963b");
    assert.equal(labelForGuidedApaRuleKind("teacher_requires"), "Your teacher requires");
  });

  it("builds a stable protocol signature", () => {
    const a = buildGuidedApaProtocolSignature();
    const b = buildGuidedApaProtocolSignature();
    assert.equal(a, b);
    assert.match(a, /mlk-rhetorical-analysis/);
  });
});

describe("WP-092 guided moves", () => {
  it("covers See/Understand/Do/Check/Fix for every move", () => {
    const moves = listGuidedApaMoves();
    assert.ok(moves.length >= 8);
    for (const m of moves) {
      assert.ok(m.see, m.id);
      assert.ok(m.understand, m.id);
      assert.ok(Array.isArray(m.doSteps) && m.doSteps.length > 0, m.id);
      assert.ok(m.check, m.id);
      assert.ok(m.fix, m.id);
      assert.ok(m.modelLocusId, m.id);
    }
  });

  it("does not use bare King 1963 as the only citation form", () => {
    const moves = listGuidedApaMoves();
    const citations = moves.find((m) => m.id === "in_text_citations");
    assert.match(citations.understand, /1963a/);
    assert.match(citations.understand, /1963b/);
    assert.doesNotMatch(citations.doSteps.join(" "), /\(King, 1963\)(?!a|b)/);
  });

  it("numbers eight PDF download steps", () => {
    assert.equal(GUIDED_APA_PDF_DOWNLOAD_STEPS.length, 8);
    assert.match(GUIDED_APA_PDF_DOWNLOAD_STEPS[3], /PDF Document/i);
  });

  it("keeps PDF inspection distinct and sized for WP-080 checklist", () => {
    const items = listGuidedApaPdfInspectionItems();
    assert.equal(items.length, 5);
    assert.match(items[0].distinction, /Google Doc earlier/i);
  });
});

describe("WP-092 semantic state", () => {
  it("persists by move id rather than array position", () => {
    let state = createEmptyGuidedApaProtocolState();
    state = setGuidedApaMoveStatus(state, "page_setup", "looks_correct", {
      docSignature: "doc-v1",
    });
    assert.equal(state.moves.page_setup.status, "looks_correct");
    assert.equal(state.moves.title_page.status, "not_started");
    const roundTrip = normalizeGuidedApaProtocolState(
      JSON.parse(JSON.stringify(state))
    );
    assert.equal(roundTrip.moves.page_setup.status, "looks_correct");
  });

  it("supports needs_help and local fix return", () => {
    let state = createEmptyGuidedApaProtocolState();
    state = setGuidedApaMoveStatus(state, "title_page", "needs_help");
    assert.equal(state.moves.title_page.status, "needs_help");
    assert.equal(state.activeMoveId, "title_page");
    state = setGuidedApaMoveStatus(state, "title_page", "fixed");
    assert.equal(state.moves.title_page.status, "fixed");
  });

  it("invalidates completed moves when document signature changes", () => {
    let state = createEmptyGuidedApaProtocolState();
    state = setGuidedApaMoveStatus(state, "page_setup", "looks_correct", {
      docSignature: "doc-old",
    });
    state.verificationSignature = "doc-old";
    state = invalidateGuidedApaAgainstDocument(state, {
      verificationSignature: "doc-new",
      reason: "module8_updated_doc",
    });
    assert.equal(state.moves.page_setup.status, "in_progress");
    assert.equal(state.invalidationReason, "module8_updated_doc");
  });

  it("treats legacy checklist as historical non-proof", () => {
    let state = createEmptyGuidedApaProtocolState();
    state = attachLegacyGuidedApaHistory(state, {
      module9Items: [true, true, true, true, true, true],
      module9Quiz: { score: 7, total: 7 },
    });
    assert.equal(state.legacy.module9ChecklistHistorical.proof, false);
    assert.equal(state.legacy.module9QuizHistorical.notAGate, true);
    assert.equal(areFormattingMovesComplete(state), false);
  });

  it("does not auto-complete from character thresholds", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../lib/module9/guidedApaProtocolState.js"),
      "utf8"
    );
    assert.doesNotMatch(src, /length\s*>\s*\d+/);
    assert.doesNotMatch(src, /char(acter)?Count/i);
  });
});

describe("WP-092 guided protocol presentation boundaries", () => {
  it("instructional gate uses submission-protocol rollout mode (WP-093)", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../lib/dev/isGuidedApaProtocolEnabled.js"),
      "utf8"
    );
    assert.doesNotMatch(
      src,
      /return process\.env\.NODE_ENV === ["']development["']/
    );
    assert.match(src, /getEffectiveSubmissionProtocolMode/);
  });

  it("Module 8 guided panel has no Format/Ready checklist copy", () => {
    const src = fs.readFileSync(
      path.join(
        __dirname,
        "../components/module8/ModuleEightGuidedApaDocPanel.jsx"
      ),
      "utf8"
    );
    assert.doesNotMatch(src, /Times New Roman, size 12/);
    assert.doesNotMatch(src, /Ready confidence/);
    assert.match(src, /Open Google Doc/);
    assert.match(src, /Continue to Module 9/);
  });

  it("Module 9 guided flow has no recognition quiz gate", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/module9/GuidedApaProtocolFlow.jsx"),
      "utf8"
    );
    assert.doesNotMatch(src, /MODULE9_APA_CONCEPTS/);
    assert.match(src, /Looks correct/);
    assert.match(src, /Help me fix it/);
    assert.match(src, /You checked your Google Doc earlier/);
    assert.match(src, /skipNextAutosave/);
  });

  it("WP-092 seed hard-reloads so Module 9 remounts after persistence", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/dev/DeveloperTestingPanel.jsx"),
      "utf8"
    );
    assert.match(src, /guidedApaProtocol/);
    assert.match(src, /location\.assign/);
  });

  it("API uses the same assignment-owned submission-protocol resolver", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/api/module9/guided-apa-protocol/route.ts"),
      "utf8"
    );
    assert.match(src, /getAssignmentSubmissionProtocolRollout/);
    assert.match(src, /isRebuiltSubmissionProtocol/);
    assert.match(src, /not_available/);
  });

  it("canonical model does not answer the MLK assignment", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/module9/GuidedApaCanonicalModel.jsx"),
      "utf8"
    );
    assert.match(src, /Community Gardens/i);
    assert.doesNotMatch(src, /I Have a Dream/i);
    assert.doesNotMatch(src, /Birmingham Jail/i);
  });
});

describe("WP-092 completion helpers", () => {
  it("tracks formatting vs doc inspection separately", () => {
    let state = createEmptyGuidedApaProtocolState();
    for (const id of [
      "page_setup",
      "title_page",
      "page_numbers",
      "body_layout",
      "in_text_citations",
      "references_page",
      "paper_order",
    ]) {
      state = setGuidedApaMoveStatus(state, id, "looks_correct");
    }
    assert.equal(areFormattingMovesComplete(state), true);
    assert.equal(isDocInspectionComplete(state), false);
    state = setGuidedApaMoveStatus(state, "doc_inspection", "looks_correct");
    assert.equal(isDocInspectionComplete(state), true);
  });

  it("rejects stale client writes without a timestamp or with an older timestamp", () => {
    assert.equal(isGuidedApaWriteStale(null, "2026-07-22T05:00:00.000Z"), true);
    assert.equal(
      isGuidedApaWriteStale("2026-07-22T04:00:00.000Z", "2026-07-22T05:00:00.000Z"),
      true
    );
    assert.equal(
      isGuidedApaWriteStale("2026-07-22T06:00:00.000Z", "2026-07-22T05:00:00.000Z"),
      false
    );
    assert.equal(isGuidedApaWriteStale("2026-07-22T05:00:00.000Z", null), false);
  });

  it("resolves readyForPdf seed straight to the PDF phase when Doc is ready", () => {
    let state = createEmptyGuidedApaProtocolState();
    for (const id of [
      "page_setup",
      "title_page",
      "page_numbers",
      "body_layout",
      "in_text_citations",
      "references_page",
      "paper_order",
      "doc_inspection",
    ]) {
      state = setGuidedApaMoveStatus(state, id, "looks_correct");
    }
    assert.equal(
      resolveGuidedApaPhase({ docReady: true, state }),
      "pdf"
    );
    assert.equal(
      resolveGuidedApaPhase({ docReady: false, state }),
      "handoff"
    );
  });
});
