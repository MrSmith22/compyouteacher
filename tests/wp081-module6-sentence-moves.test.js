/**
 * WP-081 — Module 6 sentence-move persistence and assembly.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  assembleBodyParagraphProse,
  normalizeBodyParagraphMoveState,
  setMovesInDraftMeta,
  getMovesFromDraftMeta,
  proseContainsPlanningChrome,
} = require("../lib/module6/bodyParagraphMoves.js");
const {
  SECTION_MIN_CHARS,
  evaluateSectionReadiness,
} = require("../lib/module6/draftPersistenceHelpers.js");

describe("WP-081 module 6 sentence moves", () => {
  it("normalizes move state and reloads from draft_meta", () => {
    const first = normalizeBodyParagraphMoveState(
      {
        activeMoveId: "evidence",
        moves: { point: "Point sentence.", evidence: "Evidence sentence." },
      },
      { includeTransition: true }
    );
    assert.equal(first.activeMoveId, "evidence");
    assert.equal(first.moves.point, "Point sentence.");
    assert.equal(first.moves.transition, "");

    const meta = setMovesInDraftMeta({ schemaVersion: 1 }, 0, first);
    const reloaded = normalizeBodyParagraphMoveState(
      getMovesFromDraftMeta(meta, 0),
      { includeTransition: true }
    );
    assert.equal(reloaded.moves.point, "Point sentence.");
    assert.equal(reloaded.activeMoveId, "evidence");
  });

  it("assembled prose is the section readiness input, not per-move auto-advance", () => {
    const moves = {
      point: "Point.",
      evidence_context: "Context.",
      evidence: "Evidence.",
      explanation: "Explanation of effect.",
      thesis_connection: "Thesis link.",
    };
    const prose = assembleBodyParagraphProse(moves);
    assert.ok(prose.length >= SECTION_MIN_CHARS);
    const ready = evaluateSectionReadiness(prose);
    assert.equal(ready.ok, true);

    const shortOnly = assembleBodyParagraphProse({ point: "Hi" });
    assert.ok(shortOnly.length < SECTION_MIN_CHARS);
    assert.equal(evaluateSectionReadiness(shortOnly).ok, false);
  });

  it("advanced mode stores whole-paragraph text without planning chrome", () => {
    const advanced =
      "King builds credibility carefully for clergymen so they will hear his justice claim.";
    assert.equal(proseContainsPlanningChrome(advanced), false);
    const state = normalizeBodyParagraphMoveState(
      {
        advancedMode: true,
        advancedProse: advanced,
        moves: { point: "Stale move text that must not assemble." },
      },
      { includeTransition: false }
    );
    assert.equal(state.advancedMode, true);
    assert.equal(state.advancedProse, advanced);
    const {
      resolveAssembledBodyParagraphProse,
    } = require("../lib/module6/bodyParagraphMoves.js");
    assert.equal(
      resolveAssembledBodyParagraphProse(state, { includeTransition: false }),
      advanced
    );
  });
});
