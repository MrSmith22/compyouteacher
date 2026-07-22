/**
 * WP-085 — Writing-spine production rollout resolver, adapters, and gates.
 */
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  resolveWritingSpineMode,
  validateWritingSpineMode,
  writingSpineCapabilities,
  isRebuiltWritingSpine,
} = require("../lib/assignments/writingSpineRollout.js");
const {
  setWritingSpineModeCache,
  clearWritingSpineModeCache,
  getEffectiveWritingSpineMode,
} = require("../lib/assignments/writingSpineModeCache.js");
const {
  isBodyParagraphVerticalSliceEnabled,
  isSectionVerticalSliceEnabled,
  isWholeEssayReviewEnabled,
} = require("../lib/dev/isBodyParagraphVerticalSliceEnabled.js");
const {
  adaptLegacyOutlineForRebuiltSpine,
  adaptLegacyModule6DraftForRebuiltSpine,
  adaptLegacyModule7DraftForRebuiltSpine,
  adaptLegacyModule4PlansForRebuiltSpine,
} = require("../lib/artifacts/legacyWritingSpineAdapters.js");
const {
  hydrateLegacyProseAsAdvancedMoveState,
  resolveAssembledSectionProse,
} = require("../lib/module6/sectionMoveEngine.js");

describe("WP-085 writing-spine rollout resolver", () => {
  const prevOverride = process.env.WRITING_SPINE_MODE_OVERRIDE;

  afterEach(() => {
    if (prevOverride == null) delete process.env.WRITING_SPINE_MODE_OVERRIDE;
    else process.env.WRITING_SPINE_MODE_OVERRIDE = prevOverride;
    clearWritingSpineModeCache();
  });

  it("env override wins over stored mode", () => {
    process.env.WRITING_SPINE_MODE_OVERRIDE = "legacy";
    assert.equal(
      resolveWritingSpineMode({ storedMode: "rebuilt" }),
      "legacy"
    );
  });

  it("stored rebuilt enables capabilities for all M4–M7 gates", () => {
    clearWritingSpineModeCache();
    delete process.env.WRITING_SPINE_MODE_OVERRIDE;
    setWritingSpineModeCache("rebuilt");
    assert.equal(getEffectiveWritingSpineMode(), "rebuilt");
    assert.equal(isBodyParagraphVerticalSliceEnabled(), true);
    assert.equal(isSectionVerticalSliceEnabled(), true);
    assert.equal(isWholeEssayReviewEnabled(), true);
    const caps = writingSpineCapabilities("rebuilt");
    assert.equal(caps.bodyParagraphVerticalSlice, true);
    assert.equal(caps.wholeEssayReview, true);
  });

  it("unknown assignments default safely to legacy without override", () => {
    clearWritingSpineModeCache();
    delete process.env.WRITING_SPINE_MODE_OVERRIDE;
    // Force legacy path regardless of NODE_ENV DX default by using pure resolver
    assert.equal(resolveWritingSpineMode({ storedMode: null }), "legacy");
    assert.equal(isRebuiltWritingSpine("legacy"), false);
  });

  it("rejects invalid modes", () => {
    assert.equal(validateWritingSpineMode("experimental").ok, false);
    assert.equal(validateWritingSpineMode("rebuilt").ok, true);
  });

  it("Modules 4–7 share one capability bundle", () => {
    const a = writingSpineCapabilities("rebuilt");
    const b = writingSpineCapabilities("rebuilt");
    assert.deepEqual(a, b);
    assert.equal(a.sectionVerticalSlice, a.bodyParagraphVerticalSlice);
  });
});

describe("WP-085 legacy adapters", () => {
  it("assigns deterministic sourceParagraphIndex without erasing purposes", () => {
    const result = adaptLegacyOutlineForRebuiltSpine({
      thesis: "Thesis",
      body: [{ purpose: "A" }, { purpose: "B", sourceParagraphIndex: 1 }],
    });
    assert.equal(result.ok, true);
    assert.equal(result.adapted.body[0].sourceParagraphIndex, 0);
    assert.equal(result.adapted.body[0].purpose, "A");
    assert.equal(result.adapted.body[1].sourceParagraphIndex, 1);
  });

  it("flags duplicate sourceParagraphIndex instead of guessing", () => {
    const result = adaptLegacyOutlineForRebuiltSpine({
      body: [
        { purpose: "A", sourceParagraphIndex: 0 },
        { purpose: "B", sourceParagraphIndex: 0 },
      ],
    });
    assert.equal(result.ok, false);
    assert.equal(result.needsLocalReview, true);
  });

  it("opens legacy M6 prose as advanced without inventing moves", () => {
    const prose = "King earns trust differently in each text.";
    const result = adaptLegacyModule6DraftForRebuiltSpine({
      sections: [prose, "Body one.", "End."],
      draftMeta: {},
    });
    assert.equal(result.adapted.mode, "legacy_advanced_prose");
    assert.equal(result.adapted.openAdvancedByDefault, true);
    assert.equal(result.adapted.sections[0], prose);

    const hydrated = hydrateLegacyProseAsAdvancedMoveState(
      { moves: {} },
      {
        moveOrder: ["point", "evidence", "explanation"],
        legacyProse: prose,
      }
    );
    assert.equal(hydrated.advancedMode, true);
    assert.equal(hydrated.advancedProse, prose);
    assert.equal(
      resolveAssembledSectionProse(hydrated, {
        moveOrder: ["point", "evidence", "explanation"],
      }),
      prose
    );
    assert.equal(hydrated.moves.point, "");
  });

  it("preserves Module 7 final text until rebuilt save", () => {
    const result = adaptLegacyModule7DraftForRebuiltSpine({
      fullText: "older",
      finalText: "newest final",
      draftMeta: { resume: { currentStepIndex: 3 } },
    });
    assert.equal(result.adapted.authoritativeText, "newest final");
    assert.equal(result.adapted.draftMeta.currentStepIndex, 3);
    assert.equal(result.adapted.preserveUntilRebuiltSave, true);
  });

  it("adapts Module 4 plans without rewriting student language", () => {
    const result = adaptLegacyModule4PlansForRebuiltSpine([
      { purpose: "Keep my words", evidence: ["q1"] },
    ]);
    assert.equal(result.adapted[0].purpose, "Keep my words");
    assert.equal(result.adapted[0].sourceParagraphIndex, 0);
  });
});

describe("WP-085 development tooling boundary", () => {
  it("hydrates the production Module 6 move workspace from the live draft", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleSix.js"),
      "utf8"
    );
    assert.match(src, /legacyProse:\s*draft\[/);
    assert.doesNotMatch(src, /legacyProse:\s*sections\[/);
  });

  it("keeps DeveloperTestingPanel behind NODE_ENV dynamic import", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/layout/AppLayoutShell.jsx"),
      "utf8"
    );
    assert.match(src, /NODE_ENV === \"development\"/);
    assert.match(src, /DeveloperTestingPanel/);
  });

  it("keeps assignmentSettings file fallback out of production", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../lib/supabase/helpers/assignmentSettings.ts"),
      "utf8"
    );
    assert.match(src, /NODE_ENV === \"production\"/);
    assert.match(src, /schema_missing/);
    assert.match(src, /dev_fallback/);
  });

  it("does not enable instructional spine solely by flipping a comment NODE_ENV check in gate file", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../lib/dev/isBodyParagraphVerticalSliceEnabled.js"),
      "utf8"
    );
    assert.doesNotMatch(
      src,
      /return process\.env\.NODE_ENV === [\"']development[\"']/
    );
    assert.match(src, /getEffectiveWritingSpineMode/);
  });
});
