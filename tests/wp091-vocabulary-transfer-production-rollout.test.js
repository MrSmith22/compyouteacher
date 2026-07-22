/**
 * WP-091 — Module 1 vocabulary-transfer production rollout resolver, gates, persistence merge.
 */
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  resolveVocabularyTransferMode,
  validateVocabularyTransferMode,
  vocabularyTransferCapabilities,
  isRebuiltVocabularyTransfer,
} = require("../lib/assignments/vocabularyTransferRollout.js");
const {
  setVocabularyTransferModeCache,
  clearVocabularyTransferModeCache,
  getEffectiveVocabularyTransferMode,
  setVocabularyTransferHydrateFailed,
  getVocabularyTransferHydrateFailed,
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
  isVocabularyTransferLessonEnabled,
  isVocabularyTransferLessonModeEnabled,
} = require("../lib/dev/isVocabularyTransferLessonEnabled.js");
const {
  VOCABULARY_TRANSFER_TERM_IDS,
  createEmptyVocabularyTransferState,
  normalizeVocabularyTransferState,
  resolveVocabularyTransferAuthority,
  countCompletedVocabularyTerms,
  migrateEthosV1ToTermState,
} = require("../lib/module1/vocabularyTransferState.js");

describe("WP-091 vocabulary-transfer rollout resolver", () => {
  const prevOverride = process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE;
  const prevEa = process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
  const prevWs = process.env.WRITING_SPINE_MODE_OVERRIDE;

  afterEach(() => {
    if (prevOverride == null) delete process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE;
    else process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE = prevOverride;
    if (prevEa == null) delete process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
    else process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE = prevEa;
    if (prevWs == null) delete process.env.WRITING_SPINE_MODE_OVERRIDE;
    else process.env.WRITING_SPINE_MODE_OVERRIDE = prevWs;
    clearVocabularyTransferModeCache();
    clearEvidenceArgumentModeCache();
    clearWritingSpineModeCache();
  });

  it("env override wins over stored mode", () => {
    process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE = "legacy";
    assert.equal(
      resolveVocabularyTransferMode({ storedMode: "rebuilt" }),
      "legacy"
    );
  });

  it("stored rebuilt enables six-concept transfer capabilities", () => {
    clearVocabularyTransferModeCache();
    delete process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE;
    setVocabularyTransferModeCache("rebuilt");
    assert.equal(getEffectiveVocabularyTransferMode(), "rebuilt");
    assert.equal(isVocabularyTransferLessonModeEnabled(), true);
    const caps = vocabularyTransferCapabilities("rebuilt");
    assert.equal(caps.vocabularyTransferLessons, true);
    assert.equal(caps.sixConceptTransferPath, true);
  });

  it("unknown assignments default safely to legacy without override", () => {
    assert.equal(resolveVocabularyTransferMode({ storedMode: null }), "legacy");
    assert.equal(isRebuiltVocabularyTransfer("legacy"), false);
  });

  it("rejects invalid modes", () => {
    assert.equal(validateVocabularyTransferMode("experimental").ok, false);
    assert.equal(validateVocabularyTransferMode("rebuilt").ok, true);
  });

  it("rollback of vocabulary-transfer does not flip other spines", () => {
    delete process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE;
    delete process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
    delete process.env.WRITING_SPINE_MODE_OVERRIDE;
    setVocabularyTransferModeCache("legacy");
    setEvidenceArgumentModeCache("rebuilt");
    setWritingSpineModeCache("rebuilt");
    assert.equal(getEffectiveVocabularyTransferMode(), "legacy");
    assert.equal(getEffectiveEvidenceArgumentMode(), "rebuilt");
    assert.equal(getEffectiveWritingSpineMode(), "rebuilt");
    assert.equal(isVocabularyTransferLessonModeEnabled(), false);
  });

  it("exposes hydrate failure without inventing a mode", () => {
    clearVocabularyTransferModeCache();
    setVocabularyTransferHydrateFailed(true);
    assert.equal(getVocabularyTransferHydrateFailed(), true);
    clearVocabularyTransferModeCache();
    assert.equal(getVocabularyTransferHydrateFailed(), false);
  });
});

describe("WP-091 instructional gate under rebuilt mode", () => {
  beforeEach(() => {
    clearVocabularyTransferModeCache();
    delete process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE;
    setVocabularyTransferModeCache("rebuilt");
  });

  afterEach(() => {
    clearVocabularyTransferModeCache();
  });

  it("opens all six canonical terms", () => {
    for (const id of VOCABULARY_TRANSFER_TERM_IDS) {
      assert.equal(isVocabularyTransferLessonEnabled({ termId: id }), true, id);
    }
    assert.equal(isVocabularyTransferLessonEnabled({ termId: "nope" }), false);
  });

  it("legacy mode blocks all terms", () => {
    setVocabularyTransferModeCache("legacy");
    assert.equal(isVocabularyTransferLessonEnabled({ termId: "ethos" }), false);
  });
});

describe("WP-091 merge / compatibility", () => {
  it("imports local-only progress without inventing responses", () => {
    const local = createEmptyVocabularyTransferState();
    local.terms.ethos = migrateEthosV1ToTermState({
      noticeChoiceId: "officer_training",
      definitionSeen: true,
      exampleNonexampleChoiceId: "example_credibility",
      kingFollowUpText: "my follow-up",
      completed: true,
      assignmentTransferSeen: true,
    });
    const resolved = resolveVocabularyTransferAuthority(null, local);
    assert.equal(resolved.source, "local");
    assert.equal(resolved.state.terms.ethos.kingFollowUpText, "my follow-up");
    assert.equal(countCompletedVocabularyTerms(resolved.state), 1);
  });

  it("prefers more complete server over thinner local", () => {
    const server = createEmptyVocabularyTransferState();
    server.terms.ethos.completed = true;
    server.terms.pathos.completed = true;
    server.updatedAt = "2026-07-21T12:00:00.000Z";
    const local = createEmptyVocabularyTransferState();
    local.terms.ethos.completed = true;
    local.updatedAt = "2026-07-22T12:00:00.000Z";
    const resolved = resolveVocabularyTransferAuthority(server, local);
    assert.equal(countCompletedVocabularyTerms(resolved.state), 2);
  });

  it("normalizes ethos-v1 through vocabularyTransfer bag", () => {
    const bag = normalizeVocabularyTransferState(null, {
      noticeChoiceId: "officer_training",
      kingFollowUpText: "keep",
      completed: false,
    });
    assert.equal(bag.terms.ethos.noticeChoiceId, "officer_training");
    assert.equal(bag.terms.ethos.kingFollowUpText, "keep");
  });
});

describe("WP-091 development tooling and source boundaries", () => {
  it("instructional gate uses rollout mode, not NODE_ENV alone", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../lib/dev/isVocabularyTransferLessonEnabled.js"),
      "utf8"
    );
    assert.doesNotMatch(
      src,
      /return process\.env\.NODE_ENV === [\"']development[\"']/
    );
    assert.match(src, /getEffectiveVocabularyTransferMode/);
  });

  it("keeps DeveloperTestingPanel behind NODE_ENV dynamic import", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/layout/AppLayoutShell.jsx"),
      "utf8"
    );
    assert.match(src, /NODE_ENV === \"development\"/);
    assert.match(src, /DeveloperTestingPanel/);
  });

  it("assignment rollout API exposes independent vocabularyTransferMode", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/api/assignment-rollout/route.ts"),
      "utf8"
    );
    assert.match(src, /vocabularyTransferMode/);
    assert.match(src, /getAssignmentVocabularyTransferRollout/);
  });

  it("lesson API resolves assignment mode from database/override", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/api/module1/vocabulary-transfer/route.ts"),
      "utf8"
    );
    assert.match(src, /getAssignmentVocabularyTransferRollout/);
    assert.match(src, /isRebuiltVocabularyTransfer/);
    assert.match(src, /VOCABULARY_TRANSFER_MODE_OVERRIDE/);
  });

  it("migration adds vocabulary_transfer_mode without wiping other modes", () => {
    const src = fs.readFileSync(
      path.join(
        __dirname,
        "../supabase/migrations/20260721230000_vocabulary_transfer_rollout.sql"
      ),
      "utf8"
    );
    assert.match(src, /vocabulary_transfer_mode/);
    assert.match(src, /module1_vocabulary_transfer/);
    assert.match(src, /mlk-rhetorical-analysis/);
    assert.doesNotMatch(src, /writing_spine_mode = 'legacy'/);
    assert.doesNotMatch(src, /evidence_argument_mode = 'legacy'/);
  });

  it("does not ship seed target names as production instructional gates", () => {
    const gate = fs.readFileSync(
      path.join(__dirname, "../lib/dev/isVocabularyTransferLessonEnabled.js"),
      "utf8"
    );
    assert.doesNotMatch(gate, /vocabularyTransferLesson/);
    assert.doesNotMatch(gate, /WP090_SEED_VARIANTS/);
  });
});
