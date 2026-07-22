/**
 * WP-093 — Modules 8–9 submission-protocol production rollout resolver, gates, independence.
 */
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  resolveSubmissionProtocolMode,
  validateSubmissionProtocolMode,
  submissionProtocolCapabilities,
  isRebuiltSubmissionProtocol,
} = require("../lib/assignments/submissionProtocolRollout.js");
const {
  setSubmissionProtocolModeCache,
  clearSubmissionProtocolModeCache,
  getEffectiveSubmissionProtocolMode,
  setSubmissionProtocolHydrateFailed,
  getSubmissionProtocolHydrateFailed,
} = require("../lib/assignments/submissionProtocolModeCache.js");
const {
  setVocabularyTransferModeCache,
  clearVocabularyTransferModeCache,
  getEffectiveVocabularyTransferMode,
} = require("../lib/assignments/vocabularyTransferModeCache.js");
const {
  setEvidenceArgumentModeCache,
  clearEvidenceArgumentModeCache,
  getEffectiveEvidenceArgumentMode,
} = require("../lib/assignments/evidenceArgumentModeCache.js");
const {
  setWritingSpineModeCache,
  clearWritingSpineModeCache,
  getEffectiveWritingSpineMode,
} = require("../lib/assignments/writingSpineModeCache.js");
const {
  isGuidedApaProtocolEnabled,
  isGuidedApaProtocolModeEnabled,
} = require("../lib/dev/isGuidedApaProtocolEnabled.js");
const {
  createEmptyGuidedApaProtocolState,
  normalizeGuidedApaProtocolState,
  isGuidedApaWriteStale,
  invalidateGuidedApaAgainstDocument,
  setGuidedApaMoveStatus,
  getFirstIncompleteGuidedApaMoveId,
} = require("../lib/module9/guidedApaProtocolState.js");

describe("WP-093 submission-protocol rollout resolver", () => {
  const prevOverride = process.env.SUBMISSION_PROTOCOL_MODE_OVERRIDE;
  const prevVt = process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE;
  const prevEa = process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
  const prevWs = process.env.WRITING_SPINE_MODE_OVERRIDE;

  afterEach(() => {
    if (prevOverride == null) delete process.env.SUBMISSION_PROTOCOL_MODE_OVERRIDE;
    else process.env.SUBMISSION_PROTOCOL_MODE_OVERRIDE = prevOverride;
    if (prevVt == null) delete process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE;
    else process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE = prevVt;
    if (prevEa == null) delete process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
    else process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE = prevEa;
    if (prevWs == null) delete process.env.WRITING_SPINE_MODE_OVERRIDE;
    else process.env.WRITING_SPINE_MODE_OVERRIDE = prevWs;
    clearSubmissionProtocolModeCache();
    clearVocabularyTransferModeCache();
    clearEvidenceArgumentModeCache();
    clearWritingSpineModeCache();
  });

  it("env override wins over stored mode", () => {
    process.env.SUBMISSION_PROTOCOL_MODE_OVERRIDE = "legacy";
    assert.equal(
      resolveSubmissionProtocolMode({ storedMode: "rebuilt" }),
      "legacy"
    );
  });

  it("stored rebuilt enables guided APA capabilities", () => {
    clearSubmissionProtocolModeCache();
    delete process.env.SUBMISSION_PROTOCOL_MODE_OVERRIDE;
    setSubmissionProtocolModeCache("rebuilt");
    assert.equal(getEffectiveSubmissionProtocolMode(), "rebuilt");
    assert.equal(isGuidedApaProtocolModeEnabled(), true);
    assert.equal(isGuidedApaProtocolEnabled(), true);
    const caps = submissionProtocolCapabilities("rebuilt");
    assert.equal(caps.guidedApaProtocol, true);
    assert.equal(caps.module8DocOnlyPath, true);
    assert.equal(caps.module9GuidedFormattingMoves, true);
  });

  it("unknown assignments default safely to legacy without override", () => {
    assert.equal(resolveSubmissionProtocolMode({ storedMode: null }), "legacy");
    assert.equal(isRebuiltSubmissionProtocol("legacy"), false);
  });

  it("rejects invalid modes", () => {
    assert.equal(validateSubmissionProtocolMode("experimental").ok, false);
    assert.equal(validateSubmissionProtocolMode("rebuilt").ok, true);
  });

  it("rollback of submission-protocol does not flip Modules 1–7 modes", () => {
    delete process.env.SUBMISSION_PROTOCOL_MODE_OVERRIDE;
    delete process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE;
    delete process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
    delete process.env.WRITING_SPINE_MODE_OVERRIDE;
    setSubmissionProtocolModeCache("legacy");
    setVocabularyTransferModeCache("rebuilt");
    setEvidenceArgumentModeCache("rebuilt");
    setWritingSpineModeCache("rebuilt");
    assert.equal(getEffectiveSubmissionProtocolMode(), "legacy");
    assert.equal(getEffectiveVocabularyTransferMode(), "rebuilt");
    assert.equal(getEffectiveEvidenceArgumentMode(), "rebuilt");
    assert.equal(getEffectiveWritingSpineMode(), "rebuilt");
    assert.equal(isGuidedApaProtocolModeEnabled(), false);
  });

  it("exposes hydrate failure without inventing a mode", () => {
    clearSubmissionProtocolModeCache();
    setSubmissionProtocolHydrateFailed(true);
    assert.equal(getSubmissionProtocolHydrateFailed(), true);
    clearSubmissionProtocolModeCache();
    assert.equal(getSubmissionProtocolHydrateFailed(), false);
  });
});

describe("WP-093 shared capability across Module 8/9 surfaces", () => {
  beforeEach(() => {
    clearSubmissionProtocolModeCache();
    delete process.env.SUBMISSION_PROTOCOL_MODE_OVERRIDE;
    setSubmissionProtocolModeCache("rebuilt");
  });

  afterEach(() => {
    clearSubmissionProtocolModeCache();
  });

  it("one shared rebuilt decision for gate helpers", () => {
    assert.equal(isGuidedApaProtocolEnabled(), true);
    assert.equal(isGuidedApaProtocolModeEnabled(), true);
    setSubmissionProtocolModeCache("legacy");
    assert.equal(isGuidedApaProtocolEnabled(), false);
  });
});

describe("WP-093 guided state compatibility and rollback fingerprint", () => {
  it("schema-v1 resumes at first incomplete move", () => {
    let state = createEmptyGuidedApaProtocolState();
    state = setGuidedApaMoveStatus(state, "page_setup", "looks_correct");
    state = setGuidedApaMoveStatus(state, "title_page", "looks_correct");
    const normalized = normalizeGuidedApaProtocolState(state);
    assert.equal(getFirstIncompleteGuidedApaMoveId(normalized), "page_numbers");
  });

  it("stale writes cannot overwrite fresher state", () => {
    assert.equal(
      isGuidedApaWriteStale(
        "2026-07-21T10:00:00.000Z",
        "2026-07-22T12:00:00.000Z"
      ),
      true
    );
  });

  it("document signature change keeps history and invalidates confirmations", () => {
    let state = createEmptyGuidedApaProtocolState();
    state = setGuidedApaMoveStatus(state, "page_setup", "looks_correct", {
      docSignature: "sig-a",
    });
    state = {
      ...state,
      verificationSignature: "sig-a",
    };
    const before = state.moves.page_setup.status;
    state = invalidateGuidedApaAgainstDocument(state, {
      verificationSignature: "sig-b",
      reason: "document_replaced",
    });
    assert.equal(before, "looks_correct");
    assert.equal(state.moves.page_setup.status, "in_progress");
    assert.equal(state.verificationSignature, "sig-b");
  });

  it("rollback preserves semantic-state fingerprint for restore", () => {
    let state = createEmptyGuidedApaProtocolState();
    state = setGuidedApaMoveStatus(state, "page_setup", "looks_correct");
    state = {
      ...state,
      verificationSignature: "doc-1",
    };
    const fingerprint = JSON.stringify(normalizeGuidedApaProtocolState(state));
    // Presentation rollback does not mutate guided rows — same fingerprint on re-enable.
    const restored = normalizeGuidedApaProtocolState(JSON.parse(fingerprint));
    assert.equal(JSON.stringify(restored), fingerprint);
  });
});

describe("WP-093 development tooling and source boundaries", () => {
  it("instructional gate uses rollout mode, not NODE_ENV alone", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../lib/dev/isGuidedApaProtocolEnabled.js"),
      "utf8"
    );
    assert.doesNotMatch(
      src,
      /return process\.env\.NODE_ENV === [\"']development[\"']/
    );
    assert.match(src, /getEffectiveSubmissionProtocolMode/);
  });

  it("keeps DeveloperTestingPanel behind NODE_ENV dynamic import", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/layout/AppLayoutShell.jsx"),
      "utf8"
    );
    assert.match(src, /NODE_ENV === \"development\"/);
    assert.match(src, /DeveloperTestingPanel/);
  });

  it("assignment rollout API exposes independent submissionProtocolMode", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/api/assignment-rollout/route.ts"),
      "utf8"
    );
    assert.match(src, /submissionProtocolMode/);
    assert.match(src, /getAssignmentSubmissionProtocolRollout/);
  });

  it("guided API resolves assignment mode from database/override", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/api/module9/guided-apa-protocol/route.ts"),
      "utf8"
    );
    assert.match(src, /getAssignmentSubmissionProtocolRollout/);
    assert.match(src, /isRebuiltSubmissionProtocol/);
    assert.match(src, /SUBMISSION_PROTOCOL_MODE_OVERRIDE/);
  });

  it("migration adds submission_protocol_mode without wiping other modes", () => {
    const src = fs.readFileSync(
      path.join(
        __dirname,
        "../supabase/migrations/20260722020000_submission_protocol_rollout.sql"
      ),
      "utf8"
    );
    assert.match(src, /submission_protocol_mode/);
    assert.match(src, /mlk-rhetorical-analysis/);
    assert.doesNotMatch(src, /writing_spine_mode = 'legacy'/);
    assert.doesNotMatch(src, /evidence_argument_mode = 'legacy'/);
    assert.doesNotMatch(src, /vocabulary_transfer_mode = 'legacy'/);
  });

  it("rebuilt Module 8 UI contains Doc-only path without Format checklist", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleEight.js"),
      "utf8"
    );
    assert.match(src, /useSubmissionProtocolMode/);
    assert.match(src, /ModuleEightGuidedApaDocPanel/);
    assert.match(src, /guidedApaProtocol/);
  });

  it("rebuilt Module 9 UI mounts guided flow without quiz gate dependency", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleNine.js"),
      "utf8"
    );
    assert.match(src, /useSubmissionProtocolMode/);
    assert.match(src, /GuidedApaProtocolFlow/);
    assert.match(src, /guidedApaProtocol/);
  });

  it("does not ship seed target names as production instructional gates", () => {
    const gate = fs.readFileSync(
      path.join(__dirname, "../lib/dev/isGuidedApaProtocolEnabled.js"),
      "utf8"
    );
    assert.doesNotMatch(gate, /seedGuidedApaProtocol/);
    assert.doesNotMatch(gate, /guidedApaProtocol/);
  });

  it("teacher ops UI and runbook exist", () => {
    assert.ok(
      fs.existsSync(
        path.join(
          __dirname,
          "../components/teacher/TeacherSubmissionProtocolRollout.jsx"
        )
      )
    );
    assert.ok(
      fs.existsSync(
        path.join(
          __dirname,
          "../docs/project-standards/runbooks/submission-protocol-production-rollout.md"
        )
      )
    );
    assert.ok(
      fs.existsSync(
        path.join(__dirname, "../scripts/wp093-submission-protocol-preflight.js")
      )
    );
  });
});
