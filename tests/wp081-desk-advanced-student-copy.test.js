/**
 * WP-081 — Desk filtering, advanced-mode source of truth, Step 1 labeling, student copy.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  BODY_PARAGRAPH_MOVE_META,
  assembleBodyParagraphProse,
  normalizeBodyParagraphMoveState,
  resolveAssembledBodyParagraphProse,
  selectDeskArtifactsForMove,
  setMovesInDraftMeta,
  getMovesFromDraftMeta,
} = require("../lib/module6/bodyParagraphMoves.js");

const BANNED_STUDENT_PHRASES = [
  "evidence provenance",
  "highest-leverage target",
  "student-owned",
  "Diagnostics flag likely relationships",
  "assembled paragraph",
];

describe("WP-081 move-specific desk filtering", () => {
  const desk = {
    purpose: "Ethos fits each audience.",
    thesis: "King adapts appeals by audience.",
    evidence: "“five score years ago”",
    evidenceContext: "Speech opening before a public crowd.",
    reasoning: "The Lincoln echo builds national trust.",
    adjacentParagraph: "Pathos in the letter for clergymen.",
    job: "Should never appear on desk for point move.",
  };

  it("shows only purpose + thesis for point", () => {
    const fields = selectDeskArtifactsForMove("point", desk).map((f) => f.field);
    assert.deepEqual(fields, ["purpose", "thesis"]);
  });

  it("shows evidence + context for evidence_context", () => {
    const fields = selectDeskArtifactsForMove("evidence_context", desk).map(
      (f) => f.field
    );
    assert.deepEqual(fields, ["evidence", "evidenceContext"]);
  });

  it("shows evidence only for evidence", () => {
    const fields = selectDeskArtifactsForMove("evidence", desk).map((f) => f.field);
    assert.deepEqual(fields, ["evidence"]);
  });

  it("shows evidence + reasoning for explanation", () => {
    const fields = selectDeskArtifactsForMove("explanation", desk).map(
      (f) => f.field
    );
    assert.deepEqual(fields, ["evidence", "reasoning"]);
  });

  it("shows purpose + thesis for thesis_connection", () => {
    const fields = selectDeskArtifactsForMove("thesis_connection", desk).map(
      (f) => f.field
    );
    assert.deepEqual(fields, ["purpose", "thesis"]);
  });

  it("shows purpose + adjacent paragraph for transition when available", () => {
    const fields = selectDeskArtifactsForMove("transition", desk).map(
      (f) => f.field
    );
    assert.deepEqual(fields, ["purpose", "adjacentParagraph"]);
  });

  it("deskFields metadata matches the acceptance mapping", () => {
    assert.deepEqual(BODY_PARAGRAPH_MOVE_META.point.deskFields, [
      "purpose",
      "thesis",
    ]);
    assert.deepEqual(BODY_PARAGRAPH_MOVE_META.evidence_context.deskFields, [
      "evidence",
      "evidenceContext",
    ]);
    assert.deepEqual(BODY_PARAGRAPH_MOVE_META.evidence.deskFields, ["evidence"]);
    assert.deepEqual(BODY_PARAGRAPH_MOVE_META.explanation.deskFields, [
      "evidence",
      "reasoning",
    ]);
    assert.deepEqual(BODY_PARAGRAPH_MOVE_META.thesis_connection.deskFields, [
      "purpose",
      "thesis",
    ]);
    assert.deepEqual(BODY_PARAGRAPH_MOVE_META.transition.deskFields, [
      "purpose",
      "adjacentParagraph",
    ]);
  });
});

describe("WP-081 advanced-mode persistence source of truth", () => {
  it("survives move → advanced → replace → reload without concatenating stale moves", () => {
    let state = normalizeBodyParagraphMoveState(
      {
        activeMoveId: "point",
        moves: {
          point: "Move point only.",
          evidence: "Stale evidence move that must not leak.",
        },
      },
      { includeTransition: false }
    );

    // Enter advanced, seeded from current assembly then replaced by student.
    const seed = assembleBodyParagraphProse(state.moves, state.moveOrder);
    state = normalizeBodyParagraphMoveState(
      {
        ...state,
        advancedMode: true,
        advancedProse: seed,
      },
      { includeTransition: false }
    );

    const advancedOnly =
      "Whole-paragraph advanced prose that replaces every sentence move.";
    state = normalizeBodyParagraphMoveState(
      {
        ...state,
        advancedMode: true,
        advancedProse: advancedOnly,
      },
      { includeTransition: false }
    );

    // Persist + reload (normalization must keep advancedProse).
    const meta = setMovesInDraftMeta({ schemaVersion: 1 }, 0, state);
    const reloaded = normalizeBodyParagraphMoveState(getMovesFromDraftMeta(meta, 0), {
      includeTransition: false,
    });

    assert.equal(reloaded.advancedMode, true);
    assert.equal(reloaded.advancedProse, advancedOnly);
    assert.equal(
      resolveAssembledBodyParagraphProse(reloaded, { includeTransition: false }),
      advancedOnly
    );
    assert.equal(
      resolveAssembledBodyParagraphProse(reloaded, { includeTransition: false }).includes(
        "Stale evidence"
      ),
      false
    );

    // Return to sentence moves: move texts stay; advancedProse remains stored.
    const back = normalizeBodyParagraphMoveState(
      { ...reloaded, advancedMode: false },
      { includeTransition: false }
    );
    assert.equal(back.advancedMode, false);
    assert.equal(back.advancedProse, advancedOnly);
    assert.equal(back.moves.point, "Move point only.");
    assert.equal(back.moves.evidence, "Stale evidence move that must not leak.");
    assert.equal(
      resolveAssembledBodyParagraphProse(back, { includeTransition: false }),
      assembleBodyParagraphProse(back.moves, back.moveOrder)
    );

    // Re-enter advanced: still the advanced prose, not concatenated moves.
    const again = normalizeBodyParagraphMoveState(
      { ...back, advancedMode: true },
      { includeTransition: false }
    );
    assert.equal(
      resolveAssembledBodyParagraphProse(again, { includeTransition: false }),
      advancedOnly
    );
  });

  it("migrates legacy _advancedProse into advancedProse on normalize", () => {
    const state = normalizeBodyParagraphMoveState(
      {
        advancedMode: true,
        _advancedProse: "Legacy advanced field.",
        moves: { point: "Should not win." },
      },
      { includeTransition: false }
    );
    assert.equal(state.advancedProse, "Legacy advanced field.");
    assert.equal(
      resolveAssembledBodyParagraphProse(state, { includeTransition: false }),
      "Legacy advanced field."
    );
  });
});

describe("WP-081 student-facing copy and Step 1 correspondence", () => {
  it("excludes internal phrases from student UI modules", () => {
    const roots = [
      path.join(__dirname, "../components/module6/BodyParagraphMoveWorkspace.jsx"),
      path.join(__dirname, "../components/module7/BodyParagraphRevisionPanel.jsx"),
      path.join(__dirname, "../lib/module7/bodyParagraphDiagnostics.js"),
      path.join(__dirname, "../lib/module6/bodyParagraphMoves.js"),
    ];
    for (const file of roots) {
      const src = fs.readFileSync(file, "utf8");
      for (const phrase of BANNED_STUDENT_PHRASES) {
        assert.equal(
          src.toLowerCase().includes(phrase.toLowerCase()),
          false,
          `${path.basename(file)} must not contain “${phrase}”`
        );
      }
    }
  });

  it("labels Step 1 in the move workspace and Module 6 orientation", () => {
    const workspace = fs.readFileSync(
      path.join(__dirname, "../components/module6/BodyParagraphMoveWorkspace.jsx"),
      "utf8"
    );
    assert.match(workspace, /Step \{stepNumber\} of \{totalSteps\}/);
    assert.match(workspace, /data-testid="bp-step-label"/);
    assert.match(workspace, /Your sentence\(s\) for Step \{stepNumber\}/);

    const moduleSix = fs.readFileSync(
      path.join(__dirname, "../components/ModuleSix.js"),
      "utf8"
    );
    assert.match(
      moduleSix,
      /Step 1 — State the paragraph’s point in the writing box below \(labeled Step 1\)/
    );
    assert.match(moduleSix, /it is labeled Step 1 of your moves/);
  });

  it("uses preferred student coaching phrases", () => {
    const diagnostics = fs.readFileSync(
      path.join(__dirname, "../lib/module7/bodyParagraphDiagnostics.js"),
      "utf8"
    );
    assert.match(
      diagnostics,
      /Check that this quotation comes from the source you planned/
    );
    assert.match(
      diagnostics,
      /This suggestion may not fit perfectly\. You choose what to revise/
    );

    const panel = fs.readFileSync(
      path.join(__dirname, "../components/module7/BodyParagraphRevisionPanel.jsx"),
      "utf8"
    );
    assert.match(panel, /Best place to revise/);
    assert.match(panel, /Revise your paragraph/);

    const moves = fs.readFileSync(
      path.join(__dirname, "../lib/module6/bodyParagraphMoves.js"),
      "utf8"
    );
    assert.match(moves, /Keep your ideas and wording/);
  });
});
