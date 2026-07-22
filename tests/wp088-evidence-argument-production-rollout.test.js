/**
 * WP-088 — Evidence-to-argument production rollout resolver, gates, and boundaries.
 */
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  resolveEvidenceArgumentMode,
  validateEvidenceArgumentMode,
  evidenceArgumentCapabilities,
  isRebuiltEvidenceArgument,
} = require("../lib/assignments/evidenceArgumentRollout.js");
const {
  setEvidenceArgumentModeCache,
  clearEvidenceArgumentModeCache,
  getEffectiveEvidenceArgumentMode,
  setEvidenceArgumentHydrateFailed,
  getEvidenceArgumentHydrateFailed,
} = require("../lib/assignments/evidenceArgumentModeCache.js");
const {
  setWritingSpineModeCache,
  clearWritingSpineModeCache,
  getEffectiveWritingSpineMode,
} = require("../lib/assignments/writingSpineModeCache.js");
const {
  isEvidenceToArgumentSliceEnabled,
  isEvidenceToArgumentSliceModeEnabled,
} = require("../lib/dev/isEvidenceToArgumentSliceEnabled.js");
const {
  WP086_REPRESENTATIVE_OPTION_ID,
  adaptLegacyModule3Prose,
  normalizeEvidenceArgumentSliceState,
  createEmptyEvidenceArgumentSliceState,
  resolveEvidencePairForDirection,
  evaluateBothWorkReadiness,
  assembleModule4HandoffFromSlice,
} = require("../lib/artifacts/evidenceArgumentContract.js");
const {
  generateCanonicalDirectionFrames,
} = require("../lib/module2/matrixEssayDirectionContract.js");
const {
  buildEvidenceArgumentDirectionDescriptor,
} = require("../lib/module2/evidenceArgumentDirectionDescriptor.js");

describe("WP-088 evidence-argument rollout resolver", () => {
  const prevOverride = process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
  const prevSpineOverride = process.env.WRITING_SPINE_MODE_OVERRIDE;

  afterEach(() => {
    if (prevOverride == null) delete process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
    else process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE = prevOverride;
    if (prevSpineOverride == null) delete process.env.WRITING_SPINE_MODE_OVERRIDE;
    else process.env.WRITING_SPINE_MODE_OVERRIDE = prevSpineOverride;
    clearEvidenceArgumentModeCache();
    clearWritingSpineModeCache();
  });

  it("env override wins over stored mode", () => {
    process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE = "legacy";
    assert.equal(
      resolveEvidenceArgumentMode({ storedMode: "rebuilt" }),
      "legacy"
    );
  });

  it("stored rebuilt enables shared M2–M3 capabilities", () => {
    clearEvidenceArgumentModeCache();
    delete process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
    setEvidenceArgumentModeCache("rebuilt");
    assert.equal(getEffectiveEvidenceArgumentMode(), "rebuilt");
    assert.equal(isEvidenceToArgumentSliceModeEnabled(), true);
    const caps = evidenceArgumentCapabilities("rebuilt");
    assert.equal(caps.evidenceArgumentSlice, true);
    assert.equal(caps.module2EvidencePairing, true);
    assert.equal(caps.module3StagedFlow, true);
    assert.equal(caps.module3SuccessArgumentMap, true);
  });

  it("unknown assignments default safely to legacy without override", () => {
    assert.equal(resolveEvidenceArgumentMode({ storedMode: null }), "legacy");
    assert.equal(isRebuiltEvidenceArgument("legacy"), false);
  });

  it("rejects invalid modes", () => {
    assert.equal(validateEvidenceArgumentMode("experimental").ok, false);
    assert.equal(validateEvidenceArgumentMode("rebuilt").ok, true);
  });

  it("Modules 2–3 share one capability bundle", () => {
    const a = evidenceArgumentCapabilities("rebuilt");
    const b = evidenceArgumentCapabilities("rebuilt");
    assert.deepEqual(a, b);
    assert.equal(a.module2EvidencePairing, a.module3StagedFlow);
  });

  it("rollback of evidence-argument does not flip writing-spine mode", () => {
    delete process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
    delete process.env.WRITING_SPINE_MODE_OVERRIDE;
    setEvidenceArgumentModeCache("legacy");
    setWritingSpineModeCache("rebuilt");
    assert.equal(getEffectiveEvidenceArgumentMode(), "legacy");
    assert.equal(getEffectiveWritingSpineMode(), "rebuilt");
    assert.equal(isEvidenceToArgumentSliceModeEnabled(), false);
  });

  it("exposes hydrate failure without inventing a mode", () => {
    clearEvidenceArgumentModeCache();
    setEvidenceArgumentHydrateFailed(true);
    assert.equal(getEvidenceArgumentHydrateFailed(), true);
    clearEvidenceArgumentModeCache();
    assert.equal(getEvidenceArgumentHydrateFailed(), false);
  });
});

describe("WP-088 direction eligibility under rebuilt mode", () => {
  beforeEach(() => {
    clearEvidenceArgumentModeCache();
    delete process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE;
    setEvidenceArgumentModeCache("rebuilt");
  });

  afterEach(() => {
    clearEvidenceArgumentModeCache();
  });

  it("opens every canonical frame and fully mapped custom", () => {
    for (const frame of generateCanonicalDirectionFrames().sameAppeal) {
      assert.equal(
        isEvidenceToArgumentSliceEnabled({ optionId: frame.frameId }),
        true,
        frame.frameId
      );
    }
    for (const frame of generateCanonicalDirectionFrames().crossDominant) {
      assert.equal(
        isEvidenceToArgumentSliceEnabled({ optionId: frame.frameId }),
        true,
        frame.frameId
      );
    }
    assert.equal(
      isEvidenceToArgumentSliceEnabled({ optionId: "student_created" }),
      false
    );
    assert.equal(
      isEvidenceToArgumentSliceEnabled({
        optionId: "student_created",
        customMapping: {
          speechAppeal: "pathos",
          letterAppeal: "logos",
          relationship: "cross_dominant",
          speechEvidenceId: "a",
          letterEvidenceId: "b",
        },
      }),
      true
    );
  });

  it("legacy mode blocks all directions even when option is canonical", () => {
    setEvidenceArgumentModeCache("legacy");
    assert.equal(
      isEvidenceToArgumentSliceEnabled({
        optionId: WP086_REPRESENTATIVE_OPTION_ID,
      }),
      false
    );
  });
});

describe("WP-088 compatibility adapters survive production promotion", () => {
  it("adapts legacy Module 3 prose without inventing explanations", () => {
    const adapted = adaptLegacyModule3Prose({
      claimText: "Speech pathos differs from letter logos.",
      thesisText: "King uses pathos in the speech and logos in the letter.",
      proofPlan: ["A", "B", "C"],
      patternText: "contrast",
    });
    assert.equal(
      adapted.slice.thesisText,
      "King uses pathos in the speech and logos in the letter."
    );
    assert.equal(adapted.slice.proofDirections[0].text, "A");
    assert.equal(adapted.confidence.thesis, "preserved_with_claim_review");
  });

  it("normalizes schema-v1 to v2 without losing prose", () => {
    const v1 = {
      ...createEmptyEvidenceArgumentSliceState(),
      schemaVersion: 1,
      currentStep: "ea_pattern",
      patternText: "keep my pattern",
      speechEvidenceId: "speech-1",
      letterEvidenceId: "letter-1",
    };
    const normalized = normalizeEvidenceArgumentSliceState(v1, {
      optionId: WP086_REPRESENTATIVE_OPTION_ID,
    });
    assert.equal(normalized.schemaVersion, 2);
    assert.equal(normalized.patternText, "keep my pattern");
    assert.equal(normalized.currentStep, "ea_pattern");
  });

  it("does not silently pick among multiple evidence candidates", () => {
    const descriptor = buildEvidenceArgumentDirectionDescriptor({
      optionId: WP086_REPRESENTATIVE_OPTION_ID,
    });
    const result = resolveEvidencePairForDirection({
      descriptor,
      matrixBundle: {
        cells: [
          { sourceType: "speech", appeal: "pathos", evidenceIds: [] },
          {
            sourceType: "letter",
            appeal: "logos",
            evidenceIds: ["l1"],
          },
        ],
      },
      evidenceRecords: [
        {
          id: "s1",
          sourceKind: "speech",
          appeal: "pathos",
          quotation: "q1",
          studentObservation: "o1",
        },
        {
          id: "s2",
          sourceKind: "speech",
          appeal: "pathos",
          quotation: "q2",
          studentObservation: "o2",
        },
        {
          id: "l1",
          sourceKind: "letter",
          appeal: "logos",
          quotation: "q3",
          studentObservation: "o3",
        },
      ],
      priorSpeechId: null,
      priorLetterId: null,
    });
    assert.equal(result.requiresStudentPick, true);
    assert.ok((result.speechCandidates || []).length >= 2);
  });

  it("preserves thesis/proof plan through Module 4 handoff", () => {
    const slice = {
      ...createEmptyEvidenceArgumentSliceState(),
      thesisText: "Comparative thesis stays owned.",
      proofDirections: [
        { role: "speech", text: "Proof speech", evidenceId: "s1" },
        { role: "letter", text: "Proof letter", evidenceId: "l1" },
        { role: "both", text: "Proof both", evidenceId: null },
      ],
    };
    const handoff = assembleModule4HandoffFromSlice(slice);
    assert.equal(handoff.thesis, "Comparative thesis stays owned.");
    assert.equal(handoff.proofPlan[0], "Proof speech");
    assert.equal(handoff.proofPlan[1], "Proof letter");
    assert.equal(handoff.proofPlan[2], "Proof both");
  });

  it("both-work readiness cannot be certified by length alone", () => {
    const long = "x".repeat(400);
    const readiness = evaluateBothWorkReadiness({
      thesisText: long,
      speechSourceText: "speech text",
      letterSourceText: "letter text",
      speechEvidence: null,
      letterEvidence: null,
      selectedOptionId: WP086_REPRESENTATIVE_OPTION_ID,
      needsDirectionReview: false,
    });
    assert.equal(readiness.ready, false);
  });
});

describe("WP-088 development tooling and source boundaries", () => {
  it("instructional gate uses rollout mode, not NODE_ENV alone", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../lib/dev/isEvidenceToArgumentSliceEnabled.js"),
      "utf8"
    );
    assert.doesNotMatch(
      src,
      /return process\.env\.NODE_ENV === [\"']development[\"']/
    );
    assert.match(src, /getEffectiveEvidenceArgumentMode/);
  });

  it("keeps DeveloperTestingPanel behind NODE_ENV dynamic import", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/layout/AppLayoutShell.jsx"),
      "utf8"
    );
    assert.match(src, /NODE_ENV === \"development\"/);
    assert.match(src, /DeveloperTestingPanel/);
  });

  it("assignment rollout API exposes independent evidenceArgumentMode", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/api/assignment-rollout/route.ts"),
      "utf8"
    );
    assert.match(src, /evidenceArgumentMode/);
    assert.match(src, /getAssignmentEvidenceArgumentRollout/);
    assert.match(src, /getAssignmentWritingSpineRollout/);
  });

  it("slice API resolves assignment mode from database/override, not NODE_ENV alone", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/api/module3/evidence-argument-slice/route.ts"),
      "utf8"
    );
    assert.match(src, /getAssignmentEvidenceArgumentRollout/);
    assert.match(src, /isRebuiltEvidenceArgument/);
    assert.match(src, /EVIDENCE_ARGUMENT_MODE_OVERRIDE/);
    // Development DX for missing schema is allowed, but availability still goes
    // through the rollout resolver — not a bare `return NODE_ENV === development`.
    assert.doesNotMatch(
      src,
      /if\s*\(\s*!isEvidenceToArgumentSliceDevEnabled\(\)\s*\)/
    );
  });

  it("migration adds evidence_argument_mode without wiping writing_spine_mode", () => {
    const src = fs.readFileSync(
      path.join(
        __dirname,
        "../supabase/migrations/20260721220000_evidence_argument_rollout.sql"
      ),
      "utf8"
    );
    assert.match(src, /evidence_argument_mode/);
    assert.match(src, /mlk-rhetorical-analysis/);
    assert.match(src, /writing_spine_mode/);
    assert.doesNotMatch(src, /writing_spine_mode = 'legacy'/);
  });

  it("does not ship seed target names as production instructional gates", () => {
    const gate = fs.readFileSync(
      path.join(__dirname, "../lib/dev/isEvidenceToArgumentSliceEnabled.js"),
      "utf8"
    );
    assert.doesNotMatch(gate, /evidenceToArgumentSlice/);
    assert.doesNotMatch(gate, /WP087_SEED_VARIANTS/);
  });
});
