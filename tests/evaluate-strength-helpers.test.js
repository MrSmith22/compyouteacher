const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  BOTH_WORKS_REQUIREMENT_LABEL,
  BOTH_WORKS_SATISFIED_MESSAGE,
  EVALUATE_COMPARISON_FOLLOW_UP,
  EVALUATE_COMPARISON_OPTIONS,
  EVALUATE_READY_MESSAGE,
  buildEvaluateChecklist,
  buildEvaluateProofItems,
  buildEvaluateSourceProofCards,
  canContinueFromEvaluate,
  getBothWorksEvidenceStatus,
  getEvaluateContinueHint,
  getEvaluateFormContinueHint,
  getEvaluateNextActionsForContext,
  getEvaluatePathChoicesForContext,
  getEvaluateReadyMessage,
  getGatherFocusModel,
  getValidConnectedEvidence,
  getArtifactChainReadinessLabel,
  READINESS_LABEL_CHECKING,
  READINESS_LABEL_COMPLETED,
  READINESS_LABEL_NEEDS_CHECK,
  mapEvaluateNextActionToState,
  snapshotEvidenceConnections,
} = require("../lib/module3/evaluateStrengthHelpers.js");
const {
  CONNECT_NOTE_MINIMUM,
  getEarlierPassStageIds,
} = require("../lib/module3/connectEvidenceHelpers.js");

function quote(id, sourceType = "speech") {
  return {
    id,
    quote: `Quote ${id}`,
    sourceType,
    sourceLabel: sourceType === "letter" ? "Letter" : "Speech",
    sourceTitle: sourceType === "letter" ? "Letter from Birmingham Jail" : "I Have a Dream",
  };
}

function validNote(extra = "") {
  return `The words show delay causes harm.${extra}`;
}

const twoConnections = {
  a: {
    selected: true,
    relation: "supports",
    note: validNote(),
  },
  b: {
    selected: true,
    relation: "sharpens",
    note: "This detail makes the idea more precise.",
  },
};

describe("evaluateStrengthHelpers — both-works readiness", () => {
  it("1. two Speech connections do not satisfy both-works readiness", () => {
    const status = getBothWorksEvidenceStatus({
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "speech")],
      evidenceConnections: twoConnections,
    });
    assert.equal(status.bothWorksReady, false);
    assert.equal(status.missingSource, "letter");
    assert.match(status.statusMessage, /letter/i);

    const checklist = buildEvaluateChecklist({
      ideaStatement: "Delay itself becomes part of the injustice.",
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "speech")],
      evidenceConnections: twoConnections,
    });
    const sourceMix = checklist.find((item) => item.id === "source_mix");
    assert.equal(sourceMix.status, "attention");
    assert.equal(sourceMix.kind, "objective");
    assert.equal(sourceMix.label, BOTH_WORKS_REQUIREMENT_LABEL);
  });

  it("2. two Letter connections do not satisfy both-works readiness", () => {
    const status = getBothWorksEvidenceStatus({
      selectedClusterEvidence: [quote("a", "letter"), quote("b", "letter")],
      evidenceConnections: twoConnections,
    });
    assert.equal(status.bothWorksReady, false);
    assert.equal(status.missingSource, "speech");
    assert.match(status.statusMessage, /speech/i);
  });

  it("3. one valid Speech plus one valid Letter connection satisfies it", () => {
    const status = getBothWorksEvidenceStatus({
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "letter")],
      evidenceConnections: twoConnections,
    });
    assert.equal(status.bothWorksReady, true);
    assert.equal(status.missingSource, null);
    assert.equal(status.statusMessage, BOTH_WORKS_SATISFIED_MESSAGE);

    const cards = buildEvaluateSourceProofCards({
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "letter")],
      evidenceConnections: twoConnections,
    });
    assert.ok(cards.speech);
    assert.ok(cards.letter);
  });

  it("4. a short note from the missing source does not satisfy it", () => {
    const status = getBothWorksEvidenceStatus({
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "letter")],
      evidenceConnections: {
        a: twoConnections.a,
        b: {
          selected: true,
          relation: "supports",
          note: "Too short",
        },
      },
    });
    assert.ok(twoConnections.a.note.trim().length >= CONNECT_NOTE_MINIMUM);
    assert.ok("Too short".trim().length < CONNECT_NOTE_MINIMUM);
    assert.equal(status.bothWorksReady, false);
    assert.equal(status.hasLetter, false);
    assert.equal(status.missingSource, "letter");
  });

  it("5. an unselected connection does not satisfy it", () => {
    const status = getBothWorksEvidenceStatus({
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "letter")],
      evidenceConnections: {
        a: twoConnections.a,
        b: {
          selected: false,
          relation: "supports",
          note: validNote(" letter"),
        },
      },
    });
    assert.equal(status.bothWorksReady, false);
    assert.equal(status.hasLetter, false);
  });

  it("6. an orphan ID does not satisfy it", () => {
    const status = getBothWorksEvidenceStatus({
      selectedClusterEvidence: [quote("a", "speech")],
      evidenceConnections: {
        a: twoConnections.a,
        orphanLetter: {
          selected: true,
          relation: "supports",
          note: validNote(" from letter orphan"),
        },
      },
    });
    assert.equal(status.bothWorksReady, false);
    assert.equal(status.hasLetter, false);

    const connected = getValidConnectedEvidence({
      selectedClusterEvidence: [quote("a", "speech")],
      evidenceConnections: {
        a: twoConnections.a,
        orphanLetter: {
          selected: true,
          relation: "supports",
          note: validNote(" orphan"),
        },
      },
    });
    assert.deepEqual(
      connected.map((item) => item.id),
      ["a"]
    );
  });

  it("7. group composition alone does not satisfy it", () => {
    const status = getBothWorksEvidenceStatus({
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "letter")],
      evidenceConnections: {
        a: twoConnections.a,
        // letter is in the group but has no valid explained connection
      },
    });
    assert.equal(status.bothWorksReady, false);
    assert.equal(status.hasSpeech, true);
    assert.equal(status.hasLetter, false);
  });

  it("8. ready to build a claim is unavailable without both works", () => {
    const actions = getEvaluateNextActionsForContext({
      bothWorksReady: false,
      missingSource: "letter",
    });
    const ready = actions.find((item) => item.id === "ready_to_claim");
    assert.equal(ready.available, false);
    assert.match(ready.blockedMessage, /letter/i);

    const mapped = mapEvaluateNextActionToState({
      nextActionId: "ready_to_claim",
      bothWorksReady: false,
      missingSource: "letter",
    });
    assert.equal(mapped.unlocksProgress, false);
    assert.equal(mapped.blocked, true);
    assert.equal(
      canContinueFromEvaluate({
        evidenceStrength: "strong",
        gapNote: "I’m ready to build a claim.",
        pathDecision: "",
        bothWorksReady: false,
      }),
      false
    );
  });

  it("9. no alternate forward path bypasses the requirement", () => {
    const pathChoices = getEvaluatePathChoicesForContext({
      bothWorksReady: false,
    });
    const moveForward = pathChoices.find((item) => item.id === "move_forward");
    assert.equal(moveForward.available, false);

    const blocked = mapEvaluateNextActionToState({
      nextActionId: "explanations_need_detail",
      pathDecision: "move_forward",
      bothWorksReady: false,
      missingSource: "letter",
    });
    assert.equal(blocked.pathDecision, "");
    assert.equal(blocked.blocked, true);
    assert.equal(
      canContinueFromEvaluate({
        evidenceStrength: "developing",
        gapNote: "My explanations need more detail.",
        pathDecision: "move_forward",
        bothWorksReady: false,
      }),
      false
    );
  });

  it("10. missing-source message accurately names Speech or Letter", () => {
    const missingLetter = getBothWorksEvidenceStatus({
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "speech")],
      evidenceConnections: twoConnections,
    });
    assert.match(missingLetter.statusMessage, /speech/i);
    assert.match(missingLetter.statusMessage, /letter/i);
    assert.equal(missingLetter.repairActionLabel, "Find evidence from the letter.");
    assert.match(missingLetter.readyChoiceBlockedMessage, /letter/i);

    const missingSpeech = getBothWorksEvidenceStatus({
      selectedClusterEvidence: [quote("a", "letter"), quote("b", "letter")],
      evidenceConnections: twoConnections,
    });
    assert.equal(missingSpeech.repairActionLabel, "Find evidence from the speech.");
    assert.match(missingSpeech.readyChoiceBlockedMessage, /speech/i);
  });

  it("11. repair action enters existing GATHER", () => {
    const mapped = mapEvaluateNextActionToState({
      nextActionId: "need_another_quotation",
      bothWorksReady: false,
      missingSource: "letter",
    });
    assert.equal(mapped.pathDecision, "gather_more_evidence");
    assert.equal(mapped.evidenceStrength, "weak");
    assert.equal(mapped.unlocksProgress, true);
    assert.equal(
      canContinueFromEvaluate({
        ...mapped,
        bothWorksReady: false,
      }),
      true
    );
  });

  it("12. GATHER opens focused on the missing source", () => {
    const letterGap = getGatherFocusModel({
      gapNote: "Find one connected quotation from the letter before moving forward.",
      ideaStatement: "Delay becomes injustice.",
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "speech")],
      evidenceConnections: twoConnections,
    });
    assert.equal(letterGap.mode, "find_missing_source");
    assert.equal(letterGap.missingSource, "letter");
    assert.equal(letterGap.defaultSourceFilter, "letter");
    assert.match(letterGap.heading, /Letter/i);
    assert.match(letterGap.coaching, /Speech/i);
    assert.equal(letterGap.existingOtherConnection?.sourceType, "speech");

    const speechGap = getGatherFocusModel({
      gapNote: "Find one connected quotation from the speech before moving forward.",
      ideaStatement: "Delay becomes injustice.",
      selectedClusterEvidence: [quote("a", "letter"), quote("b", "letter")],
      evidenceConnections: twoConnections,
    });
    assert.equal(speechGap.missingSource, "speech");
    assert.equal(speechGap.defaultSourceFilter, "speech");
    assert.match(speechGap.heading, /Speech/i);
  });

  it("13. existing relation and persistence shapes remain unchanged", () => {
    const evidenceConnections = {
      a: { ...twoConnections.a },
      b: { ...twoConnections.b },
    };
    const before = snapshotEvidenceConnections(evidenceConnections);

    buildEvaluateChecklist({
      ideaStatement: "An idea.",
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "letter")],
      evidenceConnections,
    });
    mapEvaluateNextActionToState({
      nextActionId: "ready_to_claim",
      bothWorksReady: true,
    });
    getGatherFocusModel({
      gapNote: "I need another quotation.",
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "letter")],
      evidenceConnections,
    });

    assert.deepEqual(evidenceConnections, before);
    assert.equal(evidenceConnections.a.relation, "supports");
    assert.equal(evidenceConnections.b.relation, "sharpens");
    assert.equal(typeof evidenceConnections.a.selected, "boolean");
    assert.equal(typeof evidenceConnections.a.note, "string");
  });

  it("14. comparison reflection is not persisted or graded", () => {
    const optionIds = EVALUATE_COMPARISON_OPTIONS.map((item) => item.id);
    assert.deepEqual(optionIds, [
      "similarity",
      "difference",
      "both",
      "not_sure",
    ]);

    const mapped = mapEvaluateNextActionToState({
      nextActionId: "ready_to_claim",
      bothWorksReady: true,
    });
    assert.equal(Object.prototype.hasOwnProperty.call(mapped, "comparisonChoice"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(mapped, "comparisonGrade"), false);
  });

  it("15. selecting not sure still provides coaching", () => {
    const unsure = mapEvaluateNextActionToState({
      nextActionId: "not_sure",
      bothWorksReady: true,
    });
    assert.equal(unsure.unlocksProgress, false);
    assert.ok(unsure.coaching);
    assert.match(unsure.coaching, /checklist/i);

    assert.equal(
      getEvaluateContinueHint({
        checklistAcknowledged: true,
        reflectionChoice: "specific_yes",
        comparisonChoice: "not_sure",
        nextActionId: "not_sure",
        bothWorksReady: true,
      }),
      "Choose what your evidence needs next after reviewing the coaching."
    );
    assert.match(EVALUATE_COMPARISON_FOLLOW_UP, /comparison/i);
  });

  it("16. existing valid both-work students can proceed normally", () => {
    const ready = mapEvaluateNextActionToState({
      nextActionId: "ready_to_claim",
      bothWorksReady: true,
    });
    assert.equal(ready.evidenceStrength, "strong");
    assert.equal(ready.pathDecision, "");
    assert.equal(ready.unlocksProgress, true);
    assert.equal(
      canContinueFromEvaluate({
        evidenceStrength: ready.evidenceStrength,
        gapNote: ready.gapNote,
        pathDecision: ready.pathDecision,
        bothWorksReady: true,
      }),
      true
    );
    assert.equal(
      getEvaluateReadyMessage({ bothWorksReady: true }),
      EVALUATE_READY_MESSAGE
    );
  });

  it("17. saved downstream artifacts are preserved (evaluate does not clear claim/thesis shapes)", () => {
    const claimPreview = "Delay becomes a form of injustice.";
    const thesisPreview =
      "Although both speakers urge justice, King shows delay itself as oppression.";
    const mapped = mapEvaluateNextActionToState({
      nextActionId: "need_another_quotation",
      bothWorksReady: false,
      missingSource: "letter",
    });
    assert.equal(mapped.pathDecision, "gather_more_evidence");
    // Evaluate helpers never return claim/thesis mutations.
    assert.equal(Object.prototype.hasOwnProperty.call(mapped, "workingClaim"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(mapped, "thesisStatement"), false);
    assert.equal(claimPreview.length > 0, true);
    assert.equal(thesisPreview.length > 0, true);
  });

  it("18. narrow-layout labels retain readable source identities and requirement messages", () => {
    const status = getBothWorksEvidenceStatus({
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "speech")],
      evidenceConnections: twoConnections,
    });
    assert.ok(status.requirementLabel.includes("speech"));
    assert.ok(status.requirementLabel.includes("letter"));
    assert.ok(status.repairActionLabel.includes("letter"));
    assert.ok(status.statusMessage.includes("speech"));
    assert.ok(status.statusMessage.includes("letter"));

    const proof = buildEvaluateProofItems({
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "letter")],
      evidenceConnections: twoConnections,
    });
    assert.equal(proof[0].evidence.sourceLabel, "Speech");
    assert.equal(proof[1].evidence.sourceLabel, "Letter");
  });
});

describe("evaluateStrengthHelpers — progressive gating and GATHER modes", () => {
  it("builds an objective checklist from valid connected evidence", () => {
    const checklist = buildEvaluateChecklist({
      ideaStatement: "Delay itself becomes part of the injustice.",
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "letter")],
      evidenceConnections: twoConnections,
    });

    const byId = Object.fromEntries(checklist.map((item) => [item.id, item]));
    assert.equal(byId.has_idea.status, "pass");
    assert.equal(byId.two_connections.status, "pass");
    assert.equal(byId.has_relations.status, "pass");
    assert.equal(byId.has_explanations.status, "pass");
    assert.equal(byId.source_mix.status, "pass");
    assert.equal(byId.source_mix.kind, "objective");
  });

  it("maps student-facing choices onto existing internal values", () => {
    assert.deepEqual(
      mapEvaluateNextActionToState({
        nextActionId: "need_another_quotation",
        bothWorksReady: true,
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
      bothWorksReady: true,
    });
    assert.equal(detail.evidenceStrength, "developing");
    assert.equal(detail.pathDecision, "move_forward");
    assert.equal(detail.gapNote, "My explanations need more detail.");
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
      "Answer the explanation question before choosing your next step."
    );
    assert.equal(
      getEvaluateContinueHint({
        checklistAcknowledged: true,
        reflectionChoice: "specific_yes",
        comparisonChoice: "",
      }),
      "Look across the speech and letter before choosing your next step."
    );
    assert.equal(
      getEvaluateContinueHint({
        checklistAcknowledged: true,
        reflectionChoice: "specific_yes",
        comparisonChoice: "similarity",
        nextActionId: "",
      }),
      "Choose what your evidence needs next."
    );
    assert.equal(
      getEvaluateContinueHint({
        checklistAcknowledged: true,
        reflectionChoice: "specific_yes",
        comparisonChoice: "similarity",
        nextActionId: "explanations_need_detail",
        evidenceStrength: "developing",
        gapNote: "My explanations need more detail.",
        pathDecision: "",
        bothWorksReady: true,
      }),
      "Choose whether to gather more evidence or revise your explanation."
    );
    assert.equal(
      getEvaluateFormContinueHint({
        evidenceStrength: "",
        gapNote: "",
        pathDecision: "",
      }),
      "Complete the evidence readiness check before continuing."
    );
  });

  it("GATHER revise-explanation mode does not demand a new quotation", () => {
    const focus = getGatherFocusModel({
      gapNote: "My explanations need more detail.",
      ideaStatement: "Delay becomes injustice.",
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "letter")],
      evidenceConnections: twoConnections,
    });
    assert.equal(focus.mode, "revise_explanation");
    assert.equal(focus.showSourceShelf, false);
    assert.match(focus.heading, /Revise/i);
    assert.match(focus.coaching, /do not need a brand-new quotation/i);
  });

  it("GATHER comparison gap surfaces the exact gapNote", () => {
    const note = "My evidence fits, but I need to connect the two texts.";
    const focus = getGatherFocusModel({
      gapNote: note,
      ideaStatement: "Delay becomes injustice.",
      selectedClusterEvidence: [quote("a", "speech"), quote("b", "letter")],
      evidenceConnections: twoConnections,
    });
    assert.equal(focus.mode, "comparison_gap");
    assert.equal(focus.gapNote, note);
    assert.match(focus.coaching, /connect the two texts/i);
  });
});

describe("artifact-chain readiness presentation continuity", () => {
  const bothWorkEvidence = [quote("a", "speech"), quote("b", "letter")];
  const speechOnlyEvidence = [quote("a", "speech"), quote("b", "speech")];

  it("1. EVALUATE before completion shows checking/not complete", () => {
    const label = getArtifactChainReadinessLabel({
      currentStep: "evaluate_strength",
      bothWorksReady: true,
      evidenceStrength: "",
      pathDecision: "",
      gapNote: "",
    });
    assert.equal(label, READINESS_LABEL_CHECKING);
    assert.notEqual(label, READINESS_LABEL_COMPLETED);

    const incomplete = getArtifactChainReadinessLabel({
      currentStep: "evaluate_strength",
      selectedClusterEvidence: speechOnlyEvidence,
      evidenceConnections: twoConnections,
    });
    assert.equal(incomplete, READINESS_LABEL_CHECKING);
  });

  it("2. CLAIM with valid both-work evidence shows evidence check completed", () => {
    const label = getArtifactChainReadinessLabel({
      currentStep: "develop_claim",
      // Ephemeral EVALUATE radios intentionally empty (resume / after navigation)
      evidenceStrength: "",
      pathDecision: "",
      gapNote: "",
      selectedClusterEvidence: bothWorkEvidence,
      evidenceConnections: twoConnections,
    });
    assert.equal(label, READINESS_LABEL_COMPLETED);
  });

  it("3. THESIS with valid both-work evidence shows evidence check completed", () => {
    const label = getArtifactChainReadinessLabel({
      currentStep: "turn_claim_into_thesis",
      evidenceStrength: "",
      pathDecision: "",
      gapNote: "",
      selectedClusterEvidence: bothWorkEvidence,
      evidenceConnections: twoConnections,
    });
    assert.equal(label, READINESS_LABEL_COMPLETED);
  });

  it("4. CLAIM/THESIS with newly invalid evidence shows needs another check", () => {
    assert.equal(
      getArtifactChainReadinessLabel({
        currentStep: "develop_claim",
        selectedClusterEvidence: speechOnlyEvidence,
        evidenceConnections: twoConnections,
      }),
      READINESS_LABEL_NEEDS_CHECK
    );
    assert.equal(
      getArtifactChainReadinessLabel({
        currentStep: "turn_claim_into_thesis",
        selectedClusterEvidence: bothWorkEvidence,
        evidenceConnections: {
          a: twoConnections.a,
          b: {
            selected: true,
            relation: "supports",
            note: "Too short",
          },
        },
      }),
      READINESS_LABEL_NEEDS_CHECK
    );
  });

  it("5. Backward navigation does not erase downstream artifacts", () => {
    const claimPreview = "King adapts pathos across audiences.";
    const thesisPreview =
      "Although both use pathos, audience changes the effect.";
    const earlier = getEarlierPassStageIds({
      currentStep: "evaluate_strength",
      claimPreview,
      thesisPreview,
      stepsBeforeClaim: [
        "review_evidence",
        "notice_patterns",
        "explore_idea",
        "connect_evidence",
        "evaluate_strength",
        "gather_more_evidence",
      ],
    });
    assert.deepEqual(earlier, ["claim", "thesis"]);
    assert.equal(claimPreview, "King adapts pathos across audiences.");
    assert.equal(
      thesisPreview,
      "Although both use pathos, audience changes the effect."
    );

    // Readiness derivation must not invent mutations of claim/thesis.
    const label = getArtifactChainReadinessLabel({
      currentStep: "evaluate_strength",
      selectedClusterEvidence: bothWorkEvidence,
      evidenceConnections: twoConnections,
    });
    assert.equal(label, READINESS_LABEL_CHECKING);
    assert.equal(claimPreview, "King adapts pathos across audiences.");
    assert.equal(
      thesisPreview,
      "Although both use pathos, audience changes the effect."
    );
  });
});
