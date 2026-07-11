const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  CONNECT_MINIMUM,
  RELATION_CHOICES,
  buildConnectionReviewItems,
  countValidExplainedConnections,
  getConnectContinueHint,
  getConnectEvidencePhase,
  getConnectWorkingEvidence,
  isValidExplainedConnection,
  mapRelationChoiceToConnectionPatch,
  relationLabelForStored,
} = require("../lib/module3/connectEvidenceHelpers.js");

function quote(id, extras = {}) {
  return { id, quote: `Quote ${id}`, sourceLabel: "Speech", ...extras };
}

describe("connectEvidenceHelpers", () => {
  it("uses pattern-linked quotations as the initial working set", () => {
    const cluster = [quote("a"), quote("b"), quote("c"), quote("d")];
    const patternLinked = [quote("a"), quote("c")];

    const result = getConnectWorkingEvidence({
      selectedPatternEvidence: patternLinked,
      selectedClusterEvidence: cluster,
    });

    assert.equal(result.source, "pattern");
    assert.equal(result.needsRecovery, false);
    assert.deepEqual(
      result.workingEvidence.map((item) => item.id),
      ["a", "c"]
    );
    assert.equal(result.workingEvidence.length < cluster.length, true);
  });

  it("excludes orphan pattern IDs that are not in the selected group", () => {
    const result = getConnectWorkingEvidence({
      selectedPatternEvidence: [quote("orphan"), quote("a")],
      selectedClusterEvidence: [quote("a"), quote("b")],
    });

    assert.deepEqual(
      result.workingEvidence.map((item) => item.id),
      ["a"]
    );
    assert.equal(result.needsRecovery, true);
  });

  it("maps relation display choices to existing stored values only", () => {
    const supports = mapRelationChoiceToConnectionPatch("supports", {
      note: "Because delay hurts now.",
    });
    assert.deepEqual(supports, {
      selected: true,
      relation: "supports",
      note: "Because delay hurts now.",
    });

    const complicates = mapRelationChoiceToConnectionPatch("complicates", {});
    assert.equal(complicates.relation, "complicates");
    assert.equal(complicates.selected, true);

    const sharpens = mapRelationChoiceToConnectionPatch("sharpens", {});
    assert.equal(sharpens.relation, "sharpens");

    const doesNotFit = mapRelationChoiceToConnectionPatch("does_not_fit", {
      selected: true,
      relation: "supports",
      note: "old note",
    });
    assert.deepEqual(doesNotFit, {
      selected: false,
      relation: "supports",
      note: "",
    });

    const unsure = mapRelationChoiceToConnectionPatch("unsure", {
      note: "maybe",
    });
    assert.equal(unsure.selected, false);
    assert.equal(unsure.note, "");

    const storedValues = RELATION_CHOICES.map((choice) => choice.storedRelation).filter(
      Boolean
    );
    assert.deepEqual(storedValues, ["supports", "complicates", "sharpens"]);
    assert.equal(relationLabelForStored("complicates"), "Complicates the idea");
  });

  it("keeps evidenceMap payload shape as selected, relation, and note", () => {
    const patch = mapRelationChoiceToConnectionPatch("supports", {
      note: "The words hurt people now connect delay to harm.",
    });
    assert.deepEqual(Object.keys(patch).sort(), ["note", "relation", "selected"]);
  });

  it("reveals quote 2 only after quote 1 is ready", () => {
    const workingEvidence = [quote("a"), quote("b")];
    const before = getConnectEvidencePhase({
      workingEvidence,
      evidenceConnections: {},
    });
    assert.equal(before.primaryPhase, "quote1");
    assert.equal(before.revealQuote2, false);
    assert.equal(before.activeIndex, 0);
    assert.equal(before.showReview, false);

    const afterQuote1 = getConnectEvidencePhase({
      workingEvidence,
      evidenceConnections: {
        a: { selected: true, relation: "supports", note: "Explains the link." },
      },
    });
    assert.equal(afterQuote1.revealQuote2, true);
    assert.equal(afterQuote1.activeIndex, 1);
    assert.equal(afterQuote1.primaryPhase, "quote2");
  });

  it("requires at least two valid selected-and-explained connections", () => {
    const workingEvidence = [quote("a"), quote("b"), quote("c")];
    const connections = {
      a: { selected: true, relation: "supports", note: "First explanation." },
      b: { selected: true, relation: "sharpens", note: "Second explanation." },
      orphan: {
        selected: true,
        relation: "supports",
        note: "Should not count.",
      },
    };

    assert.equal(isValidExplainedConnection(connections.a), true);
    assert.equal(
      countValidExplainedConnections(connections, ["a", "b", "c"]),
      2
    );
    // Orphan IDs outside the allowed working/group set must not count.
    assert.equal(
      countValidExplainedConnections(connections, ["a", "b", "c"]),
      countValidExplainedConnections(
        { ...connections, stale: connections.orphan },
        ["a", "b", "c"]
      )
    );
    assert.equal(
      countValidExplainedConnections(connections, ["orphan"]),
      1
    );
    assert.equal(
      countValidExplainedConnections(connections, ["a", "b"]),
      2
    );

    const phase = getConnectEvidencePhase({
      workingEvidence,
      evidenceConnections: connections,
      minimum: CONNECT_MINIMUM,
    });
    assert.equal(phase.canContinue, true);
    assert.equal(phase.showReview, true);
  });

  it("does not count does-not-fit or empty notes toward progress", () => {
    assert.equal(
      isValidExplainedConnection({
        selected: false,
        relation: "supports",
        note: "",
      }),
      false
    );
    assert.equal(
      isValidExplainedConnection({
        selected: true,
        relation: "supports",
        note: "   ",
      }),
      false
    );

    const hint = getConnectContinueHint({
      workingEvidence: [quote("a"), quote("b")],
      evidenceConnections: {
        a: { selected: false, relation: "supports", note: "" },
      },
      activeEvidenceId: "a",
      activeUiChoice: "does_not_fit",
    });
    assert.match(hint, /will not count|another quotation/i);
  });

  it("preserves other connections when one entry is updated", () => {
    const evidenceConnections = {
      a: { selected: true, relation: "supports", note: "First stays." },
      b: { selected: true, relation: "complicates", note: "Second stays." },
    };

    const next = {
      ...evidenceConnections,
      a: {
        ...evidenceConnections.a,
        note: "First edited.",
      },
    };

    assert.equal(next.b.note, "Second stays.");
    assert.equal(next.a.note, "First edited.");
    assert.equal(isValidExplainedConnection(next.b), true);
  });

  it("builds review items compatible with evaluate_strength consumers", () => {
    const workingEvidence = [
      quote("a", { sourceLabel: "Speech" }),
      quote("b", { sourceLabel: "Letter" }),
    ];
    const evidenceConnections = {
      a: {
        selected: true,
        relation: "supports",
        note: "Speech words prove delay harms people.",
      },
      b: {
        selected: true,
        relation: "sharpens",
        note: "Letter detail makes the idea more precise.",
      },
    };

    const items = buildConnectionReviewItems({
      workingEvidence,
      evidenceConnections,
    });

    assert.equal(items.length, 2);
    assert.equal(items[0].relation, "supports");
    assert.equal(items[0].relationLabel, "Supports the idea");
    assert.equal(items[1].relation, "sharpens");
    assert.ok(items.every((item) => item.note && item.evidence));
  });

  it("explains remaining connect_evidence requirements", () => {
    assert.equal(
      getConnectContinueHint({
        workingEvidence: [quote("a"), quote("b")],
        evidenceConnections: {},
        activeEvidenceId: "a",
        activeUiChoice: "",
      }),
      "Explain how the first quotation relates to your idea."
    );

    assert.equal(
      getConnectContinueHint({
        workingEvidence: [quote("a"), quote("b")],
        evidenceConnections: {
          a: {
            selected: true,
            relation: "supports",
            note: "Clear connection.",
          },
        },
        activeEvidenceId: "b",
        activeUiChoice: "",
      }),
      "Complete one more quotation connection."
    );

    assert.equal(
      getConnectContinueHint({
        workingEvidence: [quote("a"), quote("b")],
        evidenceConnections: {
          a: { selected: true, relation: "supports", note: "" },
        },
        activeEvidenceId: "a",
        activeUiChoice: "supports",
      }),
      "Write a clear connection note for this quotation."
    );
  });
});
