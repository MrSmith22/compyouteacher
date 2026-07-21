/**
 * WP-081 — Module 7 diagnostics and before/after revision state.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  diagnoseBodyParagraphRevision,
  applyRevisionCompareState,
  setRevisionInDraftMeta,
  getRevisionFromDraftMeta,
  REVISION_TARGET_IDS,
} = require("../lib/module7/bodyParagraphDiagnostics.js");

describe("WP-081 module 7 diagnostics before/after", () => {
  it("recommends duplication when body prose matches", () => {
    const prose =
      "Identical body paragraph prose used for both Body Paragraph slots in the essay.";
    const result = diagnoseBodyParagraphRevision({
      purpose: "Purpose about ethos differences across the two King texts.",
      reasoning:
        "Reasoning that should explain evidence for the paragraph point.",
      evidence: [{ quote: "quote", sourceId: "letter" }],
      assembledProse: prose,
      otherBodyProse: prose,
    });
    assert.equal(result.recommendedTarget.id, REVISION_TARGET_IDS.DUPLICATION);
  });

  it("elevates transition when observation names an abrupt handoff", () => {
    const result = diagnoseBodyParagraphRevision({
      purpose: "Purpose about pathos in the speech for public listeners.",
      reasoning: "Reasoning about emotional urgency that is long enough here.",
      evidence: [{ quote: "I have a dream", sourceId: "speech" }],
      assembledProse:
        'King says "I have a dream that my four little children will one day live in a nation where they will not be judged." He explains that this image makes fairness feel urgent for the crowd and connects to the thesis about audience-specific appeals.',
      readAloudObservation: "The transition into the next paragraph felt abrupt.",
      priorParagraphProse: "Earlier paragraph ending about credibility.",
      needsTransition: true,
    });
    assert.ok(
      result.recommendedTarget.id === REVISION_TARGET_IDS.TRANSITION ||
        result.alternateTargets.some(
          (t) => t.id === REVISION_TARGET_IDS.TRANSITION
        )
    );
    assert.equal(result.priorParagraphProse.includes("credibility"), true);
  });

  it("captures before once and updates after without rewriting ownership", () => {
    const original =
      "Original student paragraph about ethos in the letter remains in the student's wording.";
    const revised =
      "Revised student paragraph about ethos in the letter remains in the student's wording and clearer.";
    const first = applyRevisionCompareState(null, {
      prose: original,
      targetId: REVISION_TARGET_IDS.EXPLANATION,
    });
    assert.equal(first.before, original);
    assert.equal(first.after, original);

    const second = applyRevisionCompareState(first, {
      prose: revised,
      targetId: REVISION_TARGET_IDS.EXPLANATION,
      clearerConfirmed: true,
    });
    assert.equal(second.before, original);
    assert.equal(second.after, revised);
    assert.equal(second.clearerConfirmed, true);

    const meta = setRevisionInDraftMeta(null, 0, second);
    const loaded = getRevisionFromDraftMeta(meta, 0);
    assert.equal(loaded.before, original);
    assert.equal(loaded.after, revised);
  });

  it("does not mutate input prose strings", () => {
    const prose = "Immutable student prose for diagnostic ownership check.";
    diagnoseBodyParagraphRevision({
      purpose: "Purpose text",
      reasoning: "Reasoning text that is long enough for the fragment gate.",
      evidence: [],
      assembledProse: prose,
    });
    assert.equal(
      prose,
      "Immutable student prose for diagnostic ownership check."
    );
  });
});
