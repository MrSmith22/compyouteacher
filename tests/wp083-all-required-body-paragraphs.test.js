/**
 * WP-083 — All required body paragraphs (generalize WP-081 vertical slice).
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  buildBodyParagraphSlice,
  buildBodyParagraphMoveOrder,
  withOutlineMoveOrder,
} = require("../lib/artifacts/bodyParagraphSliceContract.js");
const {
  diagnoseBodyParagraphHealth,
} = require("../lib/artifacts/bodyParagraphHealth.js");
const {
  isBodyParagraphVerticalSliceEnabled,
  isBodyParagraphVerticalSliceStep,
} = require("../lib/dev/isBodyParagraphVerticalSliceEnabled.js");
const {
  buildWp083Module5Outline,
  buildWp083MovesBySourceIndex,
  buildWp083SectionsFromMoves,
  buildWp083ThreeBodyOutlineCards,
  buildWp083TwoBodyOutlineCards,
} = require("../lib/dev/seeds/buildWp083AllBodyParagraphs.js");
const {
  moveOutlineBodyCard,
} = require("../lib/module5/module5OutlineStageHelpers.js");
const {
  assembleBodyParagraphProse,
  countBodyParagraphEvidence,
  normalizeBodyParagraphMoveState,
  resolveBodyParagraphMoveMeta,
  setMovesInDraftMeta,
  getMovesFromDraftMeta,
  setRevisionInDraftMeta,
  getRevisionFromDraftMeta,
  proseContainsPlanningChrome,
} = require("../lib/module6/bodyParagraphMoves.js");
const {
  matchParagraphPlan,
} = require("../lib/module6/taskRelevantArtifacts.js");
const {
  buildDraftSectionSteps,
  getModule6StepPresentation,
} = require("../components/module6/module6StepPresentation.js");

describe("WP-083 all required body paragraphs", () => {
  it("enables the vertical slice for every bodyIndex behind the development gate", () => {
    const enabled = isBodyParagraphVerticalSliceEnabled();
    assert.equal(typeof enabled, "boolean");
    for (const bodyIndex of [0, 1, 2]) {
      assert.equal(
        isBodyParagraphVerticalSliceStep({ type: "body", bodyIndex }),
        enabled
      );
    }
    assert.equal(
      isBodyParagraphVerticalSliceStep({ type: "intro", bodyIndex: -1 }),
      false
    );
  });

  it("builds independent contracts keyed by sourceParagraphIndex for 2- and 3-body paths", () => {
    for (const bodyCount of [2, 3]) {
      const outline = buildWp083Module5Outline({ bodyCount });
      assert.equal(outline.body.length, bodyCount);
      const movesBySource = buildWp083MovesBySourceIndex();
      const draftMeta = { verticalSlice: { movesBySourceIndex: movesBySource } };
      const sections = buildWp083SectionsFromMoves(movesBySource, bodyCount);

      outline.body.forEach((card, essayOrderIndex) => {
        const other = sections
          .slice(1, 1 + bodyCount)
          .filter((_, i) => i !== essayOrderIndex);
        const slice = buildBodyParagraphSlice({
          sourceParagraphIndex: card.sourceParagraphIndex,
          essayOrderIndex,
          outlineCard: card,
          thesis: outline.thesis,
          assembledProse: sections[essayOrderIndex + 1],
          draftMeta,
          otherBodyProse: other,
          includeTransition: essayOrderIndex < bodyCount - 1,
          bodyCount,
        });
        assert.equal(slice.sourceParagraphIndex, card.sourceParagraphIndex);
        assert.match(
          slice.label,
          new RegExp(`Body Paragraph ${essayOrderIndex + 1}`)
        );
        assert.ok(slice.purpose);
        assert.ok(slice.assembledProse.length > 40);
        assert.equal(proseContainsPlanningChrome(slice.assembledProse), false);
        if (essayOrderIndex === bodyCount - 1) {
          assert.equal(slice.moveOrder.includes("transition"), false);
        } else {
          assert.ok(slice.moveOrder.includes("transition"));
        }
      });
    }
  });

  it("repeats context → evidence → explanation for multi-evidence plans", () => {
    const cards = buildWp083ThreeBodyOutlineCards();
    const multi = cards[1];
    assert.equal(countBodyParagraphEvidence(multi), 2);
    const order = buildBodyParagraphMoveOrder({
      includeTransition: true,
      evidenceCount: 2,
    });
    assert.deepEqual(
      order.filter(
        (id) => id.startsWith("evidence") || id.startsWith("explanation")
      ),
      [
        "evidence_context_0",
        "evidence_0",
        "explanation_0",
        "evidence_context_1",
        "evidence_1",
        "explanation_1",
      ]
    );
    assert.equal(resolveBodyParagraphMoveMeta("evidence_1").title, "Evidence (2)");
    const single = buildBodyParagraphMoveOrder({
      includeTransition: true,
      evidenceCount: 1,
    });
    assert.ok(single.includes("evidence"));
    assert.equal(single.includes("evidence_0"), false);
  });

  it("preserves sourceParagraphIndex and refreshes transition adjacency after reorder", () => {
    const body = buildWp083ThreeBodyOutlineCards();
    const reordered = moveOutlineBodyCard(body, 0, 2);
    assert.equal(reordered[0].sourceParagraphIndex, 1);
    assert.equal(reordered[2].sourceParagraphIndex, 0);
    assert.equal(reordered[0].moveOrder.includes("transition"), true);
    assert.equal(reordered[1].moveOrder.includes("transition"), true);
    assert.equal(reordered[2].moveOrder.includes("transition"), false);
    assert.equal(reordered[2].point, body[0].point);

    const refreshed = withOutlineMoveOrder(reordered[2], {
      essayOrderIndex: 2,
      bodyCount: 3,
      forceRefresh: true,
    });
    assert.equal(refreshed.moveOrder.includes("transition"), false);
  });

  it("matches Module 4 plans by durable sourceParagraphIndex after reorder", () => {
    const plans = [
      { sourceParagraphIndex: 0, claim: "Ethos claim" },
      { sourceParagraphIndex: 1, claim: "Pathos claim" },
      { sourceParagraphIndex: 2, claim: "Logos claim" },
    ];
    assert.equal(
      matchParagraphPlan(plans, 0, { sourceParagraphIndex: 2 })?.claim,
      "Logos claim"
    );
    assert.equal(
      matchParagraphPlan(plans, 0, { sourceParagraphIndex: 0 })?.claim,
      "Ethos claim"
    );
  });

  it("keeps independent move and revision state across source indices", () => {
    let meta = {};
    const order0 = buildBodyParagraphMoveOrder({
      includeTransition: true,
      evidenceCount: 1,
    });
    const order1 = buildBodyParagraphMoveOrder({
      includeTransition: true,
      evidenceCount: 2,
    });
    meta = setMovesInDraftMeta(
      meta,
      0,
      normalizeBodyParagraphMoveState(
        { moves: { point: "BP1 only point" }, activeMoveId: "point" },
        { moveOrder: order0 }
      ),
      { moveOrder: order0 }
    );
    meta = setMovesInDraftMeta(
      meta,
      1,
      normalizeBodyParagraphMoveState(
        {
          advancedMode: true,
          advancedProse: "BP2 advanced whole paragraph only",
          moves: { point: "should not leak" },
        },
        { moveOrder: order1 }
      ),
      { moveOrder: order1 }
    );
    meta = setRevisionInDraftMeta(meta, 0, {
      before: "before-0",
      after: "after-0",
      clearerConfirmed: true,
      targetId: "explanation",
    });
    meta = setRevisionInDraftMeta(meta, 1, {
      before: "before-1",
      after: "after-1",
      clearerConfirmed: false,
      targetId: "transition",
    });

    assert.equal(getMovesFromDraftMeta(meta, 0).moves.point, "BP1 only point");
    assert.equal(getMovesFromDraftMeta(meta, 0).advancedMode, false);
    assert.equal(
      getMovesFromDraftMeta(meta, 1).advancedProse,
      "BP2 advanced whole paragraph only"
    );
    assert.equal(getMovesFromDraftMeta(meta, 1).advancedMode, true);
    assert.notEqual(
      getMovesFromDraftMeta(meta, 1).moves.point,
      "BP1 only point"
    );
    assert.equal(getRevisionFromDraftMeta(meta, 0).before, "before-0");
    assert.equal(getRevisionFromDraftMeta(meta, 1).before, "before-1");
    assert.equal(getRevisionFromDraftMeta(meta, 0).clearerConfirmed, true);
  });

  it("detects duplicate prose against any sibling body paragraph", () => {
    const prose =
      "This body paragraph repeats the same sentences almost word for word across siblings.";
    const signals = diagnoseBodyParagraphHealth({
      purpose: "Distinct purpose words about credibility building carefully",
      reasoning:
        "Enough reasoning characters to avoid fragmentary warning here.",
      evidence: [{ quote: "x", observation: "y", sourceId: "letter" }],
      assembledProse: prose,
      otherBodyProse: ["other unique", prose, "also unique"],
    });
    assert.ok(signals.some((s) => s.id === "duplicate_body_prose"));
  });

  it("maps draft steps with durable sourceParagraphIndex for every body", () => {
    const outline = buildWp083Module5Outline({ bodyCount: 3 });
    const steps = buildDraftSectionSteps(outline);
    const bodies = steps.filter((s) => s.type === "body");
    assert.equal(bodies.length, 3);
    bodies.forEach((step, i) => {
      assert.equal(step.bodyIndex, i);
      assert.equal(step.draftIndex, i + 1);
      assert.equal(
        step.sourceParagraphIndex,
        outline.body[i].sourceParagraphIndex
      );
      assert.equal(
        isBodyParagraphVerticalSliceStep(step),
        isBodyParagraphVerticalSliceEnabled()
      );
    });
  });

  it("uses shorter orientation for later body paragraphs without dropping the job", () => {
    const outline = buildWp083Module5Outline({ bodyCount: 3 });
    const steps = buildDraftSectionSteps(outline);
    const bp1 = getModule6StepPresentation(steps[1], outline);
    const bp2 = getModule6StepPresentation(steps[2], outline);
    assert.ok((bp1.whyMatters || []).length >= (bp2.whyMatters || []).length);
    assert.ok(
      String(bp2.question || "").includes(outline.body[1].point.slice(0, 20))
    );
    assert.ok(bp2.coachingMessage);
  });

  it("two-body fixtures omit a third body card", () => {
    const two = buildWp083TwoBodyOutlineCards();
    assert.equal(two.length, 2);
    assert.equal(two[1].moveOrder.includes("transition"), false);
  });

  it("assembles multi-evidence moves without planning chrome", () => {
    const moves = buildWp083MovesBySourceIndex()["1"].moves;
    const order = buildWp083MovesBySourceIndex()["1"].moveOrder;
    const prose = assembleBodyParagraphProse(moves, order);
    assert.ok(prose.includes("four little children"));
    assert.ok(prose.includes("Never"));
    assert.equal(proseContainsPlanningChrome(prose), false);
    assert.equal(prose.includes("evidence_0"), false);
  });
});
