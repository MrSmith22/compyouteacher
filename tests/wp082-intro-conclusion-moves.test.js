/**
 * WP-082 — Introduction / Conclusion move libraries, desk mappings, persistence.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  getIntroductionLabel,
  getConclusionLabel,
  getEssaySectionLabel,
} = require("../lib/essaySectionLabels.js");
const {
  INTRODUCTION_MOVE_IDS,
  INTRODUCTION_MOVE_META,
  assembleIntroductionProse,
  normalizeIntroductionMoveState,
  resolveAssembledIntroductionProse,
  selectIntroductionDeskArtifacts,
  setIntroductionMovesInDraftMeta,
  getIntroductionMovesFromDraftMeta,
} = require("../lib/module6/introductionMoves.js");
const {
  CONCLUSION_MOVE_IDS,
  CONCLUSION_MOVE_META,
  assembleConclusionProse,
  normalizeConclusionMoveState,
  resolveAssembledConclusionProse,
  selectConclusionDeskArtifacts,
  setConclusionMovesInDraftMeta,
  getConclusionMovesFromDraftMeta,
} = require("../lib/module6/conclusionMoves.js");
const {
  BODY_PARAGRAPH_MOVE_IDS,
  proseContainsPlanningChrome,
} = require("../lib/module6/bodyParagraphMoves.js");
const {
  isIntroConclusionVerticalSliceStep,
  isBodyParagraphVerticalSliceStep,
} = require("../lib/dev/isBodyParagraphVerticalSliceEnabled.js");
const {
  buildIntroductionSlice,
  buildConclusionSlice,
  formatIntroductionFormalOutlineLines,
  formatConclusionWritingPlanSummary,
} = require("../lib/artifacts/introConclusionSliceContract.js");
const {
  buildEssaySectionMap,
} = require("../lib/module4/module4FinalReviewHelpers.js");

describe("WP-082 intro/conclusion move libraries", () => {
  it("uses different move libraries than body paragraphs", () => {
    for (const id of INTRODUCTION_MOVE_IDS) {
      assert.equal(BODY_PARAGRAPH_MOVE_IDS.includes(id), false);
    }
    for (const id of CONCLUSION_MOVE_IDS) {
      assert.equal(BODY_PARAGRAPH_MOVE_IDS.includes(id), false);
    }
    assert.ok(INTRODUCTION_MOVE_META.thesis_destination);
    assert.ok(CONCLUSION_MOVE_META.synthesize_body);
  });

  it("keeps stable section labels from type, not draftIndex", () => {
    assert.equal(getIntroductionLabel(), "Introduction");
    assert.equal(getConclusionLabel(), "Conclusion");
    assert.equal(
      getEssaySectionLabel({ type: "intro", draftIndex: 99 }),
      "Introduction"
    );
    assert.equal(
      getEssaySectionLabel({ type: "conclusion", draftIndex: 0 }),
      "Conclusion"
    );
  });

  it("gates intro/conclusion by type behind the development gate", () => {
    assert.equal(
      isIntroConclusionVerticalSliceStep({ type: "intro" }),
      process.env.NODE_ENV === "development"
    );
    assert.equal(
      isIntroConclusionVerticalSliceStep({ type: "conclusion" }),
      process.env.NODE_ENV === "development"
    );
    assert.equal(
      isIntroConclusionVerticalSliceStep({ type: "body", bodyIndex: 0 }),
      false
    );
    assert.equal(
      isBodyParagraphVerticalSliceStep({ type: "intro" }),
      false
    );
  });

  it("maps introduction desk fields by move (thesis prominent on bridge/thesis)", () => {
    const desk = {
      assignmentQuestion: "How does King adjust persuasion by audience?",
      textRelationship: "Letter vs speech",
      thesis: "King adjusts ethos and pathos by audience.",
    };
    const opening = selectIntroductionDeskArtifacts("opening_context", desk);
    assert.equal(
      opening.some((d) => d.field === "assignmentQuestion"),
      true
    );
    assert.equal(opening.some((d) => d.field === "thesis"), false);

    const bridge = selectIntroductionDeskArtifacts("bridge_to_argument", desk);
    assert.equal(bridge.some((d) => d.field === "thesis"), true);

    const thesisMove = selectIntroductionDeskArtifacts(
      "thesis_destination",
      desk
    );
    assert.deepEqual(
      thesisMove.map((d) => d.field),
      ["thesis"]
    );
  });

  it("maps conclusion desk to compact body purposes, not full evidence", () => {
    const desk = {
      thesis: "King adjusts ethos and pathos by audience.",
      bodyPurposes:
        "Body Paragraph 1: Ethos in the letter · Body Paragraph 2: Pathos in the speech",
      conclusionSummary: "Readers see how persuasion is matched to audience.",
      conclusionFinalThought: "That match matters beyond this essay.",
    };
    const synth = selectConclusionDeskArtifacts("synthesize_body", desk);
    assert.equal(synth.some((d) => d.field === "bodyPurposes"), true);
    assert.equal(synth.some((d) => d.field === "evidence"), false);
  });

  it("assembles prose without move labels, Step labels, or Roman numerals", () => {
    const intro = assembleIntroductionProse({
      opening_context: "Context for the reader.",
      background_relationship: "Two texts, two audiences.",
      bridge_to_argument: "Narrowing toward the claim.",
      thesis_destination: "King adjusts ethos and pathos by audience.",
    });
    assert.equal(proseContainsPlanningChrome(intro), false);
    assert.doesNotMatch(intro, /Step\s+\d|opening_context:|I\.\s/);

    const conclusion = assembleConclusionProse({
      return_to_thesis: "Fresh return to the claim.",
      synthesize_body: "The parts work together.",
      comparison_insight: "The comparison teaches matching.",
      final_thought: "End with purpose.",
    });
    assert.equal(proseContainsPlanningChrome(conclusion), false);
  });

  it("advanced prose is not concatenated with stale move prose", () => {
    const advanced = resolveAssembledIntroductionProse({
      advancedMode: true,
      advancedProse: "Only the advanced introduction.",
      moves: {
        opening_context: "Stale move that must not appear.",
        thesis_destination: "Also stale.",
      },
    });
    assert.equal(advanced, "Only the advanced introduction.");
    assert.equal(advanced.includes("Stale move"), false);

    const conclusionAdvanced = resolveAssembledConclusionProse({
      advancedMode: true,
      advancedProse: "Only the advanced conclusion.",
      moves: {
        return_to_thesis: "Stale.",
      },
    });
    assert.equal(conclusionAdvanced, "Only the advanced conclusion.");
  });

  it("persists moves by section type across save/reload shape", () => {
    let meta = setIntroductionMovesInDraftMeta(null, {
      activeMoveId: "bridge_to_argument",
      moves: {
        opening_context: "Open.",
        background_relationship: "Background.",
        bridge_to_argument: "Bridge.",
        thesis_destination: "Thesis.",
      },
    });
    meta = setConclusionMovesInDraftMeta(meta, {
      activeMoveId: "synthesize_body",
      moves: {
        return_to_thesis: "Return.",
        synthesize_body: "Synthesize.",
        comparison_insight: "Insight.",
        final_thought: "End.",
      },
    });
    const intro = normalizeIntroductionMoveState(
      getIntroductionMovesFromDraftMeta(meta)
    );
    const conclusion = normalizeConclusionMoveState(
      getConclusionMovesFromDraftMeta(meta)
    );
    assert.equal(intro.activeMoveId, "bridge_to_argument");
    assert.equal(intro.moves.bridge_to_argument, "Bridge.");
    assert.equal(conclusion.activeMoveId, "synthesize_body");
    assert.ok(meta.verticalSlice.movesBySectionType.intro);
    assert.ok(meta.verticalSlice.movesBySectionType.conclusion);
  });

  it("builds outline summaries with section-specific moves", () => {
    const intro = buildIntroductionSlice({
      thesis: "King adjusts ethos and pathos by audience.",
    });
    const lines = formatIntroductionFormalOutlineLines(intro, "I");
    assert.ok(lines[0].startsWith("I. Introduction"));
    assert.ok(lines.some((l) => /Thesis destination|thesis/i.test(l)));

    const conclusion = buildConclusionSlice({
      thesis: "King adjusts ethos and pathos by audience.",
      outline: {
        body: [
          { point: "Ethos in the letter" },
          { point: "Pathos in the speech" },
        ],
        conclusion: {
          summary: "Matching persuasion to audience.",
          finalThought: "That skill travels.",
        },
      },
    });
    const summary = formatConclusionWritingPlanSummary(conclusion);
    assert.equal(summary.label, "Conclusion");
    assert.ok(summary.moves.some((m) => m.id === "synthesize_body"));
  });

  it("builds Module 4 essay map with Introduction and Conclusion purposes", () => {
    const map = buildEssaySectionMap({ bodyCount: 2 });
    assert.equal(map[0].label, "Introduction");
    assert.equal(map[map.length - 1].label, "Conclusion");
    assert.ok(/thesis/i.test(map[0].purpose));
    assert.ok(/synthesize|fresh|purpose/i.test(map[map.length - 1].purpose));
  });
});
