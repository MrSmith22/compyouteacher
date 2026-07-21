/**
 * WP-081 — Body Paragraph slice contract + labels + prose assembly.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  getBodyParagraphLabel,
  getEssaySectionLabel,
} = require("../lib/essaySectionLabels.js");
const {
  buildBodyParagraphSlice,
  buildBodyParagraphMoveOrder,
  formatBodyParagraphFormalOutlineLines,
} = require("../lib/artifacts/bodyParagraphSliceContract.js");
const {
  assembleBodyParagraphProse,
  proseContainsPlanningChrome,
  setMovesInDraftMeta,
  getMovesFromDraftMeta,
} = require("../lib/module6/bodyParagraphMoves.js");
const {
  isBodyParagraphVerticalSliceEnabled,
  isBodyParagraphVerticalSliceStep,
} = require("../lib/dev/isBodyParagraphVerticalSliceEnabled.js");

describe("WP-081 body paragraph slice contract", () => {
  it("uses stable Body Paragraph N labels from essay order", () => {
    assert.equal(getBodyParagraphLabel(0), "Body Paragraph 1");
    assert.equal(getBodyParagraphLabel(1), "Body Paragraph 2");
    assert.equal(
      getEssaySectionLabel({ type: "body", bodyIndex: 0 }),
      "Body Paragraph 1"
    );
  });

  it("keys the slice by sourceParagraphIndex across essay reorder", () => {
    const slice = buildBodyParagraphSlice({
      sourceParagraphIndex: 1,
      essayOrderIndex: 0,
      bucket: {
        claim: "Credibility differs by audience.",
        reasoning:
          "Respectful address builds trust with clergy before the argument.",
        evidenceSnippets: [
          {
            quote: "My Dear Fellow Clergymen:",
            observation: "Peer address",
            sourceId: "letter",
          },
        ],
        paragraphRole: "compare_ethos",
      },
      thesis: "King adjusts ethos and pathos by audience.",
      includeTransition: true,
    });
    assert.equal(slice.sourceParagraphIndex, 1);
    assert.equal(slice.essayOrderIndex, 0);
    assert.equal(slice.label, "Body Paragraph 1");
    assert.equal(slice.purpose, "Credibility differs by audience.");
    assert.ok(slice.moveOrder.includes("point"));
    assert.ok(slice.moveOrder.includes("transition"));
  });

  it("assembles prose without plan labels or Roman numerals", () => {
    const moves = {
      point: "King builds trust carefully in the letter.",
      evidence_context: "He opens by naming his readers as colleagues.",
      evidence: 'He writes "My Dear Fellow Clergymen."',
      explanation: "That greeting frames him as a peer worth hearing.",
      thesis_connection:
        "This advances the thesis about audience-specific ethos.",
    };
    const prose = assembleBodyParagraphProse(moves);
    assert.ok(prose.includes("King builds trust"));
    assert.equal(proseContainsPlanningChrome(prose), false);
    assert.doesNotMatch(prose, /II\.|Body Paragraph 1|evidence_context:/);
  });

  it("persists moves in draft_meta by sourceParagraphIndex", () => {
    const meta = setMovesInDraftMeta(null, 0, {
      activeMoveId: "point",
      advancedMode: false,
      moves: { point: "Hello" },
    });
    const raw = getMovesFromDraftMeta(meta, 0);
    assert.equal(raw.moves.point, "Hello");
  });

  it("formal outline lines keep Roman numerals out of assembled prose path", () => {
    const slice = buildBodyParagraphSlice({
      sourceParagraphIndex: 0,
      essayOrderIndex: 0,
      outlineCard: {
        point: "Purpose here",
        reasoning: "Enough reasoning text here.",
      },
      includeTransition: false,
    });
    const lines = formatBodyParagraphFormalOutlineLines(slice, "II");
    assert.match(lines[0], /^II\./);
    assert.equal(
      proseContainsPlanningChrome(slice.assembledProse || "plain"),
      false
    );
  });

  it("gates the body slice to every required body paragraph in development", () => {
    const enabled = isBodyParagraphVerticalSliceEnabled();
    assert.equal(typeof enabled, "boolean");
    assert.equal(
      isBodyParagraphVerticalSliceStep({ type: "body", bodyIndex: 0 }),
      enabled
    );
    assert.equal(
      isBodyParagraphVerticalSliceStep({ type: "body", bodyIndex: 1 }),
      enabled
    );
    assert.equal(
      isBodyParagraphVerticalSliceStep({ type: "body", bodyIndex: 2 }),
      enabled
    );
    assert.equal(
      isBodyParagraphVerticalSliceStep({ type: "intro", bodyIndex: -1 }),
      false
    );
  });

  it("default move order includes transition only when requested", () => {
    assert.ok(
      buildBodyParagraphMoveOrder({ includeTransition: true }).includes(
        "transition"
      )
    );
    assert.equal(
      buildBodyParagraphMoveOrder({ includeTransition: false }).includes(
        "transition"
      ),
      false
    );
  });
});
