const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildEvaluateChecklist,
  buildEvaluateProofItems,
  canContinueFromEvaluate,
  getEvaluateContinueHint,
  getEvaluateFormContinueHint,
  getValidConnectedEvidence,
  mapEvaluateNextActionToState,
  snapshotEvidenceConnections,
} = require("../lib/module3/evaluateStrengthHelpers.js");

function quote(id, sourceType = "speech") {
  return {
    id,
    quote: `Quote ${id}`,
    sourceType,
    sourceLabel: sourceType === "letter" ? "Letter" : "Speech",
  };
}

const twoConnections = {
  a: {
    selected: true,
    relation: "supports",
    note: "The words show delay causes harm.",
  },
  b: {
    selected: true,
    relation: "sharpens",
    note: "This detail makes the idea more precise.",
  },
};

describe("evaluateStrengthHelpers", () => {
  it("builds an objective checklist from valid connected evidence", () => {
    const checklist = buildEvaluateChecklist({
      ideaStatement: "Delay itself becomes part of the injustice.",
      selectedClusterEvidence: [
        quote("a", "speech"),
        quote("b", "letter"),
      ],
      evidenceConnections: twoConnections,
    });

    const byId = Object.fromEntries(checklist.map((item) => [item.id, item]));
    assert.equal(byId.has_idea.status, "pass");
    assert.equal(byId.two_connections.status, "pass");
    assert.equal(byId.has_relations.status, "pass");
    assert.equal(byId.has_explanations.status, "pass");
    assert.equal(byId.source_mix.status, "pass");
  });

  it("flags single-source quotations as a readiness signal, not a hard failure", () => {
    const checklist = buildEvaluateChecklist({
      ideaStatement: "Delay itself becomes part of the injustice.",
      selectedClusterEvidence: [
        quote("a", "speech"),
        quote("b", "speech"),
      ],
      evidenceConnections: twoConnections,
    });

    const sourceMix = checklist.find((item) => item.id === "source_mix");
    assert.equal(sourceMix.status, "attention");
    assert.equal(sourceMix.kind, "signal");
    assert.match(sourceMix.detail, /one text/i);

    const two = checklist.find((item) => item.id === "two_connections");
    assert.equal(two.status, "pass");
  });

  it("maps student-facing choices onto existing internal values", () => {
    assert.deepEqual(
      mapEvaluateNextActionToState({
        nextActionId: "need_another_quotation",
      }),
      {
        evidenceStrength: "weak",
        pathDecision: "gather_more_evidence",
        gapNote: "I need another quotation.",
        unlocksProgress: true,
        whatComesNext:
          "Next, you’ll look for evidence that fills the gap you identified.",
      }
    );

    const detail = mapEvaluateNextActionToState({
      nextActionId: "explanations_need_detail",
      pathDecision: "move_forward",
    });
    assert.equal(detail.evidenceStrength, "developing");
    assert.equal(detail.pathDecision, "move_forward");
    assert.equal(detail.gapNote, "My explanations need more detail.");

    const connect = mapEvaluateNextActionToState({
      nextActionId: "connect_two_texts",
    });
    assert.equal(connect.evidenceStrength, "developing");
    assert.equal(connect.pathDecision, "gather_more_evidence");

    const ready = mapEvaluateNextActionToState({
      nextActionId: "ready_to_claim",
    });
    assert.equal(ready.evidenceStrength, "strong");
    assert.equal(ready.pathDecision, "");
    assert.match(ready.whatComesNext, /claim/i);

    const unsure = mapEvaluateNextActionToState({
      nextActionId: "not_sure",
    });
    assert.equal(unsure.unlocksProgress, false);
    assert.equal(unsure.evidenceStrength, "");
    assert.ok(unsure.coaching);
  });

  it("maps gather-more-evidence and ready-to-claim route choices", () => {
    const gather = mapEvaluateNextActionToState({
      nextActionId: "need_another_quotation",
    });
    assert.equal(gather.pathDecision, "gather_more_evidence");
    assert.equal(canContinueFromEvaluate(gather), true);

    const claim = mapEvaluateNextActionToState({
      nextActionId: "ready_to_claim",
    });
    assert.equal(claim.pathDecision, "");
    assert.equal(claim.evidenceStrength, "strong");
    assert.equal(canContinueFromEvaluate(claim), true);
  });

  it("explains readiness and gating messages", () => {
    assert.equal(
      getEvaluateContinueHint({
        checklistAcknowledged: false,
      }),
      "Review the evidence checklist first."
    );
    assert.equal(
      getEvaluateContinueHint({
        checklistAcknowledged: true,
        reflectionChoice: "",
      }),
      "Answer the reflection question before choosing your next step."
    );
    assert.equal(
      getEvaluateContinueHint({
        checklistAcknowledged: true,
        reflectionChoice: "specific_yes",
        nextActionId: "",
      }),
      "Choose what your evidence needs next."
    );
    assert.equal(
      getEvaluateContinueHint({
        checklistAcknowledged: true,
        reflectionChoice: "specific_yes",
        nextActionId: "explanations_need_detail",
        evidenceStrength: "developing",
        gapNote: "My explanations need more detail.",
        pathDecision: "",
      }),
      "Choose whether to gather more evidence or move forward."
    );
    assert.equal(
      getEvaluateFormContinueHint({
        evidenceStrength: "",
        gapNote: "",
        pathDecision: "",
      }),
      "Complete the evidence readiness check before continuing."
    );
    assert.equal(
      getEvaluateContinueHint({
        checklistAcknowledged: true,
        reflectionChoice: "specific_yes",
        nextActionId: "ready_to_claim",
        evidenceStrength: "strong",
        gapNote: "I’m ready to build a claim.",
        pathDecision: "",
      }),
      ""
    );
  });

  it("does not count orphan or unselected evidence as a valid connection", () => {
    const connected = getValidConnectedEvidence({
      selectedClusterEvidence: [quote("a"), quote("b")],
      evidenceConnections: {
        ...twoConnections,
        orphan: {
          selected: true,
          relation: "supports",
          note: "Should not appear.",
        },
        c: {
          selected: false,
          relation: "supports",
          note: "Not selected.",
        },
      },
    });

    assert.deepEqual(
      connected.map((item) => item.id),
      ["a", "b"]
    );

    const proof = buildEvaluateProofItems({
      selectedClusterEvidence: [quote("a"), quote("b")],
      evidenceConnections: {
        a: twoConnections.a,
        orphan: {
          selected: true,
          relation: "supports",
          note: "Ignored.",
        },
      },
    });
    assert.equal(proof.length, 1);
    assert.equal(proof[0].relationLabel, "Supports the idea");
  });

  it("does not mutate existing evidence data while evaluating", () => {
    const evidenceConnections = {
      a: { ...twoConnections.a },
      b: { ...twoConnections.b },
    };
    const before = snapshotEvidenceConnections(evidenceConnections);

    buildEvaluateChecklist({
      ideaStatement: "An idea.",
      selectedClusterEvidence: [quote("a"), quote("b")],
      evidenceConnections,
    });
    buildEvaluateProofItems({
      selectedClusterEvidence: [quote("a"), quote("b")],
      evidenceConnections,
    });
    mapEvaluateNextActionToState({
      nextActionId: "ready_to_claim",
    });

    assert.deepEqual(evidenceConnections, before);
  });
});
