const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  CLAIM_MINIMUM,
  PROOF_PLAN_MINIMUM,
  THESIS_MINIMUM,
  argumentRelationLabel,
  buildArgumentProofItems,
  canContinueFromClaim,
  canContinueFromThesis,
  deriveSupportRationaleFromConnections,
  getArgumentDisplayEvidence,
  getAssignmentQuestionPresentation,
  getBuildArgumentChainStage,
  getClaimContinueHint,
  getClaimJobCoaching,
  getClaimReadyMessage,
  getProofPlanPresentation,
  getThesisContinueHint,
  getThesisJobCoaching,
  getThesisPhase,
  getThesisReadyMessage,
  resolveSupportRationale,
  snapshotEvidenceConnections,
  PROOF_PLAN_EARLIER_PASS_MESSAGE,
  PROOF_PLAN_REVIEW_GUIDANCE,
  PROOF_PLAN_SLOTS,
} = require("../lib/module3/buildArgumentHelpers.js");

function quote(id, sourceType = "speech", extras = {}) {
  return {
    id,
    quote: `Full quotation text for ${id}.`,
    sourceType,
    sourceLabel: sourceType === "letter" ? "Letter" : "Speech",
    sourceTitle:
      sourceType === "letter"
        ? "Letter from Birmingham Jail"
        : "I Have a Dream",
    observation: extras.observation || `Module 2 note for ${id}.`,
    ...extras,
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

const groupEvidence = [
  quote("a", "speech"),
  quote("b", "letter"),
  quote("c", "speech"),
];

describe("buildArgumentHelpers evidence dashboard", () => {
  it("1. includes only selected, valid, in-group connections", () => {
    const items = getArgumentDisplayEvidence({
      selectedClusterEvidence: groupEvidence,
      evidenceConnections: twoConnections,
    });
    assert.deepEqual(
      items.map((item) => item.id),
      ["a", "b"]
    );
  });

  it("2. excludes orphan and unselected evidence", () => {
    const connections = {
      ...twoConnections,
      orphan: {
        selected: true,
        relation: "supports",
        note: "Orphan note that should not appear.",
      },
      c: {
        selected: false,
        relation: "supports",
        note: "Unselected with a note.",
      },
    };

    const items = buildArgumentProofItems({
      selectedClusterEvidence: groupEvidence,
      evidenceConnections: connections,
    });

    assert.deepEqual(
      items.map((item) => item.id),
      ["a", "b"]
    );
  });

  it("3. maps stored relationships to student-facing labels", () => {
    assert.equal(argumentRelationLabel("supports"), "Supports the idea");
    assert.equal(argumentRelationLabel("complicates"), "Complicates the idea");
    assert.equal(argumentRelationLabel("sharpens"), "Sharpens the idea");
  });

  it("4. keeps full quotation and explanation data available", () => {
    const items = buildArgumentProofItems({
      selectedClusterEvidence: groupEvidence,
      evidenceConnections: twoConnections,
    });

    assert.equal(items[0].quote, "Full quotation text for a.");
    assert.equal(items[0].observation, "Module 2 note for a.");
    assert.equal(items[0].note, "The words show delay causes harm.");
    assert.equal(items[0].relationLabel, "Supports the idea");
    assert.equal(items[1].sourceLabel, "Letter");
  });
});

describe("buildArgumentHelpers supportRationale", () => {
  it("5. derives new-claim supportRationale only from student notes", () => {
    const derived = deriveSupportRationaleFromConnections({
      selectedClusterEvidence: groupEvidence,
      evidenceConnections: twoConnections,
    });

    assert.equal(
      derived,
      "The words show delay causes harm.\n\nThis detail makes the idea more precise."
    );
    assert.ok(!derived.includes("Together"));
    assert.ok(!derived.includes("Therefore"));
  });

  it("6. preserves an existing nonempty supportRationale", () => {
    const resolved = resolveSupportRationale({
      existingSupportRationale: "My earlier explanation of why the quotes fit.",
      selectedClusterEvidence: groupEvidence,
      evidenceConnections: twoConnections,
    });

    assert.equal(resolved.source, "preserved");
    assert.equal(
      resolved.supportRationale,
      "My earlier explanation of why the quotes fit."
    );
  });

  it("7. derivation does not mutate evidence connections", () => {
    const original = snapshotEvidenceConnections(twoConnections);
    deriveSupportRationaleFromConnections({
      selectedClusterEvidence: groupEvidence,
      evidenceConnections: twoConnections,
    });
    buildArgumentProofItems({
      selectedClusterEvidence: groupEvidence,
      evidenceConnections: twoConnections,
    });
    assert.deepEqual(twoConnections, original);
  });

  it("8. claim readiness does not depend on a hidden second textarea", () => {
    assert.equal(
      canContinueFromClaim({
        workingClaim: "Both writers argue that delay deepens injustice.",
        existingSupportRationale: "",
        selectedClusterEvidence: groupEvidence,
        evidenceConnections: twoConnections,
      }),
      true
    );

    assert.equal(
      getClaimContinueHint({
        workingClaim: "",
        existingSupportRationale: "",
        selectedClusterEvidence: groupEvidence,
        evidenceConnections: twoConnections,
      }),
      "Write the point your evidence can help you prove."
    );

    assert.equal(
      getClaimContinueHint({
        workingClaim: "Short",
        existingSupportRationale: "",
        selectedClusterEvidence: groupEvidence,
        evidenceConnections: twoConnections,
      }),
      "Add a little more detail so your claim states a complete point."
    );

    assert.equal(getClaimReadyMessage(), "Your working claim is ready to sharpen into a thesis.");
    assert.ok(CLAIM_MINIMUM >= 10);
  });

  it("9. existing claim hydration works through preserved rationale", () => {
    const resolved = resolveSupportRationale({
      existingSupportRationale: "Saved rationale from before the rebuild.",
      selectedClusterEvidence: [],
      evidenceConnections: {},
    });
    assert.equal(resolved.source, "preserved");
    assert.equal(
      canContinueFromClaim({
        workingClaim: "A complete saved working claim.",
        existingSupportRationale: "Saved rationale from before the rebuild.",
        selectedClusterEvidence: [],
        evidenceConnections: {},
      }),
      true
    );
  });
});

describe("buildArgumentHelpers thesis", () => {
  it("10. existing thesis and proof-plan hydration preserves readiness", () => {
    assert.equal(
      canContinueFromThesis({
        thesisStatement: "Both writers frame delay as a moral failure.",
        proofPlan: ["Show how waiting becomes harm.", "", ""],
      }),
      true
    );

    const phase = getThesisPhase({
      thesisStatement: "Both writers frame delay as a moral failure.",
      proofPlan: ["", "", ""],
    });
    assert.equal(phase.showProofPlan, true);
    assert.equal(phase.canContinue, false);
  });

  it("11. thesis readiness preserves the current proof-plan requirement", () => {
    assert.equal(PROOF_PLAN_MINIMUM, 1);
    assert.equal(THESIS_MINIMUM, 10);

    assert.equal(
      canContinueFromThesis({
        thesisStatement: "A clear thesis sentence here.",
        proofPlan: ["", "", ""],
      }),
      false
    );

    assert.equal(
      getThesisContinueHint({
        thesisStatement: "",
        proofPlan: [],
      }),
      "Write your thesis in one clear sentence."
    );

    assert.equal(
      getThesisContinueHint({
        thesisStatement: "Short",
        proofPlan: [],
      }),
      "Add enough detail to state the complete argument."
    );

    assert.equal(
      getThesisContinueHint({
        thesisStatement: "A clear thesis sentence here.",
        proofPlan: ["", "", ""],
      }),
      "Add the required proof-plan step so you know what the essay must show."
    );

    assert.equal(getThesisReadyMessage(), "Your thesis and proof plan are ready.");
  });
});

describe("buildArgumentHelpers artifact-chain stages", () => {
  it("12. CLAIM maps to the Claim artifact-chain stage", () => {
    assert.equal(getBuildArgumentChainStage("claim"), "claim");
  });

  it("13. THESIS maps to the Thesis artifact-chain stage", () => {
    assert.equal(getBuildArgumentChainStage("thesis"), "thesis");
  });
});

describe("buildArgumentHelpers assignment-question coaching", () => {
  const SAMPLE_PROMPT =
    'Write a compare and contrast essay explaining how Dr. Martin Luther King Jr. uses ethos, pathos, and logos.';

  it("1. renders the full assignment question for CLAIM mode", () => {
    const presentation = getAssignmentQuestionPresentation({
      mode: "claim",
      assignmentPrompt: SAMPLE_PROMPT,
    });
    assert.equal(presentation.visible, true);
    assert.equal(presentation.prompt, SAMPLE_PROMPT);
    assert.equal(presentation.placement, "after_headline_before_dashboard");
  });

  it("2. renders the full assignment question for THESIS mode", () => {
    const presentation = getAssignmentQuestionPresentation({
      mode: "thesis",
      assignmentPrompt: SAMPLE_PROMPT,
    });
    assert.equal(presentation.visible, true);
    assert.equal(presentation.mode, "thesis");
    assert.equal(presentation.prompt, SAMPLE_PROMPT);
  });

  it("3. does not place the assignment question in a collapsed disclosure", () => {
    const claim = getAssignmentQuestionPresentation({
      mode: "claim",
      assignmentPrompt: SAMPLE_PROMPT,
    });
    const thesis = getAssignmentQuestionPresentation({
      mode: "thesis",
      assignmentPrompt: SAMPLE_PROMPT,
    });
    assert.equal(claim.collapsed, false);
    assert.equal(claim.duplicatedInDisclosure, false);
    assert.equal(thesis.collapsed, false);
    assert.equal(thesis.duplicatedInDisclosure, false);
  });

  it("4. CLAIM coaching explicitly connects prompt, idea, and evidence", () => {
    const coaching = getClaimJobCoaching();
    assert.equal(coaching.synthesizesPromptIdeaEvidence, true);
    assert.match(coaching.headline, /assignment question/);
    assert.match(coaching.headline, /developing idea and evidence/);
    assert.ok(coaching.steps.some((step) => /assignment question/i.test(step)));
    assert.ok(coaching.steps.some((step) => /developing idea/i.test(step)));
    assert.ok(coaching.steps.some((step) => /quotations and explanations/i.test(step)));
    assert.match(coaching.fieldIntro, /assignment question/);
    assert.match(coaching.fieldReminder, /prompt.*developing idea.*evidence/i);
  });

  it("5. THESIS coaching checks alignment with the assignment question", () => {
    const coaching = getThesisJobCoaching();
    assert.equal(coaching.checksAssignmentQuestionAlignment, true);
    assert.match(coaching.moveExplanation, /claim states the supported point/i);
    assert.match(coaching.moveExplanation, /thesis sharpens/i);
    assert.ok(
      coaching.leadingQuestions.some((q) =>
        /assignment question/i.test(q)
      )
    );
    assert.ok(
      coaching.leadingQuestions.some((q) => /compare or contrast/i.test(q))
    );
    assert.ok(coaching.leadingQuestions.some((q) => /evidence/i.test(q)));
  });

  it("6. existing claim/thesis persistence helpers remain unchanged", () => {
    const preserved = resolveSupportRationale({
      existingSupportRationale: "Saved rationale from before.",
      selectedClusterEvidence: groupEvidence,
      evidenceConnections: twoConnections,
    });
    assert.equal(preserved.source, "preserved");
    assert.equal(
      canContinueFromClaim({
        workingClaim: "Both writers argue that delay deepens injustice.",
        existingSupportRationale: "Saved rationale from before.",
        selectedClusterEvidence: groupEvidence,
        evidenceConnections: twoConnections,
      }),
      true
    );
    assert.equal(
      canContinueFromThesis({
        thesisStatement: "Both writers frame delay as a moral failure.",
        proofPlan: ["Show how waiting becomes harm.", "", ""],
      }),
      true
    );
  });

  it("7. existing evidence-dashboard data remains unchanged", () => {
    const items = buildArgumentProofItems({
      selectedClusterEvidence: groupEvidence,
      evidenceConnections: twoConnections,
    });
    assert.equal(items.length, 2);
    assert.equal(items[0].quote, "Full quotation text for a.");
    assert.equal(items[0].note, "The words show delay causes harm.");
    assert.equal(items[1].relationLabel, "Sharpens the idea");
  });
});

describe("buildArgumentHelpers CLAIM/THESIS instructional refinement", () => {
  it("1. CLAIM job coaching names rhetorical appeals and comparison", () => {
    const coaching = getClaimJobCoaching();
    assert.match(coaching.assignmentFocusLine, /rhetorical appeal/i);
    assert.match(coaching.assignmentFocusLine, /speech and letter/i);
    assert.match(coaching.assignmentFocusLine, /similar or different/i);
    assert.match(coaching.appealDefinition, /ethos \(trust\)/i);
    assert.match(coaching.appealDefinition, /pathos \(feeling\)/i);
    assert.match(coaching.appealDefinition, /logos \(reasoning\)/i);
    assert.ok(
      coaching.leadingQuestions.some((q) => /rhetorical appeal/i.test(q))
    );
    assert.ok(
      coaching.leadingQuestions.some((q) => /similar or different/i.test(q))
    );
    assert.ok(
      coaching.leadingQuestions.some((q) => /audiences or purposes/i.test(q))
    );
  });

  it("2. CLAIM starters are assignment-specific", () => {
    const coaching = getClaimJobCoaching();
    assert.equal(coaching.startersLabel, "Ways to begin—not required shapes.");
    assert.ok(
      coaching.sentenceStarters.some((s) => /In both works, King uses/i.test(s))
    );
    assert.ok(
      coaching.sentenceStarters.some((s) =>
        /differently in the speech and the letter/i.test(s)
      )
    );
    assert.ok(
      coaching.sentenceStarters.some((s) => /adapts ___ to each audience/i.test(s))
    );
  });

  it("3. open-ended starter remains available", () => {
    const coaching = getClaimJobCoaching();
    assert.equal(
      coaching.openStarter,
      "Together, these quotations show that…"
    );
    assert.ok(
      coaching.sentenceStarters.includes(
        "Together, these quotations show that…"
      )
    );
  });

  it("4. starters never auto-fill", () => {
    const claim = getClaimJobCoaching();
    const thesis = getThesisJobCoaching();
    assert.equal(claim.startersAutoFill, false);
    assert.equal(claim.startersRequired, false);
    assert.equal(thesis.startersAutoFill, false);
    assert.equal(thesis.startersRequired, false);
  });

  it("5. CLAIM self-check covers prompt, appeal, comparison, evidence, and summary", () => {
    const coaching = getClaimJobCoaching();
    const items = coaching.selfCheckItems;
    assert.equal(items.length, 5);
    assert.ok(items.some((item) => /assignment question/i.test(item)));
    assert.ok(items.some((item) => /rhetorical appeal/i.test(item)));
    assert.ok(items.some((item) => /speech and the letter/i.test(item)));
    assert.ok(items.some((item) => /displayed evidence/i.test(item)));
    assert.ok(items.some((item) => /beyond summarizing/i.test(item)));
    assert.equal(coaching.selfCheckIsHardGate, false);
  });

  it("6. existing CLAIM technical gate remains unchanged", () => {
    assert.equal(CLAIM_MINIMUM, 10);
    assert.equal(
      canContinueFromClaim({
        workingClaim: "Both writers argue that delay deepens injustice.",
        existingSupportRationale: "",
        selectedClusterEvidence: groupEvidence,
        evidenceConnections: twoConnections,
      }),
      true
    );
    assert.equal(
      canContinueFromClaim({
        workingClaim: "Short",
        existingSupportRationale: "",
        selectedClusterEvidence: groupEvidence,
        evidenceConnections: twoConnections,
      }),
      false
    );
  });

  it("7. THESIS checks cover prompt, comparison, appeal, audience/purpose, and evidence", () => {
    const coaching = getThesisJobCoaching();
    const qs = coaching.leadingQuestions;
    assert.ok(qs.some((q) => /assignment question/i.test(q)));
    assert.ok(qs.some((q) => /compare or contrast/i.test(q)));
    assert.ok(qs.some((q) => /rhetorical appeal/i.test(q)));
    assert.ok(qs.some((q) => /audience or purpose/i.test(q)));
    assert.ok(qs.some((q) => /displayed evidence/i.test(q)));
  });

  it("8. THESIS starters never auto-fill", () => {
    const coaching = getThesisJobCoaching();
    assert.equal(coaching.startersAutoFill, false);
    assert.ok(
      coaching.sentenceStarters.some((s) =>
        /Although King uses ___ in both works/i.test(s)
      )
    );
    assert.ok(
      coaching.sentenceStarters.some((s) =>
        /difference in audience causes/i.test(s)
      )
    );
  });

  it("9. proof-plan labels cover Speech, Letter, and comparison", () => {
    const coaching = getThesisJobCoaching();
    assert.match(coaching.proofPlanLabels[0], /speech/i);
    assert.match(coaching.proofPlanLabels[1], /letter/i);
    assert.match(coaching.proofPlanLabels[2], /similarity or difference/i);
    assert.match(coaching.proofPlanLabels[2], /audience or purpose/i);
    assert.match(coaching.proofPlanFraming, /planning notes/i);
    assert.match(coaching.proofPlanFraming, /not paragraph headings/i);
  });

  it("10. proof-plan storage shape remains unchanged", () => {
    const coaching = getThesisJobCoaching();
    assert.equal(coaching.proofPlanSlots, 3);
    assert.equal(coaching.proofPlanLabels.length, 3);
    assert.equal(
      canContinueFromThesis({
        thesisStatement: "Both writers frame delay as a moral failure.",
        proofPlan: ["Show speech pathos.", "", ""],
      }),
      true
    );
  });

  it("11. existing proof-plan minimum remains unchanged", () => {
    assert.equal(PROOF_PLAN_MINIMUM, 1);
    const coaching = getThesisJobCoaching();
    assert.equal(coaching.proofPlanMinimum, 1);
    assert.equal(
      canContinueFromThesis({
        thesisStatement: "A clear thesis sentence here.",
        proofPlan: ["", "", ""],
      }),
      false
    );
  });

  it("12. existing saved claims and theses hydrate unchanged", () => {
    assert.equal(
      canContinueFromClaim({
        workingClaim: "A complete saved working claim.",
        existingSupportRationale: "Saved rationale from before the rebuild.",
        selectedClusterEvidence: [],
        evidenceConnections: {},
      }),
      true
    );
    assert.equal(
      canContinueFromThesis({
        thesisStatement: "Both writers frame delay as a moral failure.",
        proofPlan: ["Show how waiting becomes harm.", "", ""],
      }),
      true
    );
  });

  it("13. supportRationale behavior remains unchanged", () => {
    const preserved = resolveSupportRationale({
      existingSupportRationale: "My earlier explanation of why the quotes fit.",
      selectedClusterEvidence: groupEvidence,
      evidenceConnections: twoConnections,
    });
    assert.equal(preserved.source, "preserved");
    assert.equal(
      preserved.supportRationale,
      "My earlier explanation of why the quotes fit."
    );

    const derived = deriveSupportRationaleFromConnections({
      selectedClusterEvidence: groupEvidence,
      evidenceConnections: twoConnections,
    });
    assert.equal(
      derived,
      "The words show delay causes harm.\n\nThis detail makes the idea more precise."
    );
  });

  it("14. Module 4 receives the same artifact shapes", () => {
    const claimShape = {
      workingClaim: "King adapts pathos across audiences.",
      supportRationale: "Note one.\n\nNote two.",
      clusterId: "cluster-1",
      patternId: "pattern-1",
    };
    const thesisShape = {
      thesisStatement: "Although both use pathos, audience changes the effect.",
      proofPlan: ["Speech pathos…", "Letter pathos…", "Audience difference…"],
    };
    assert.equal(typeof claimShape.workingClaim, "string");
    assert.equal(typeof claimShape.supportRationale, "string");
    assert.equal(typeof claimShape.clusterId, "string");
    assert.equal(typeof claimShape.patternId, "string");
    assert.equal(Array.isArray(thesisShape.proofPlan), true);
    assert.equal(thesisShape.proofPlan.length, 3);
    assert.ok(
      thesisShape.proofPlan.every((line) => typeof line === "string")
    );
  });

  it("15. narrow layouts remain readable", () => {
    const claim = getClaimJobCoaching();
    const thesis = getThesisJobCoaching();
    assert.ok(claim.assignmentFocusLine.length < 220);
    assert.ok(claim.selfCheckItems.every((item) => item.length < 120));
    assert.ok(
      thesis.proofPlanLabels.every((label) => label.length < 160)
    );
    assert.ok(thesis.moveExplanation.length < 220);
    assert.match(claim.startersLabel, /not required/i);
    assert.match(thesis.startersLabel, /Optional/i);
  });
});

describe("buildArgumentHelpers proof-plan label continuity", () => {
  const savedPlan = [
    "One thing I will need to show about waiting.",
    "Another generic note from before.",
    "A final generic note.",
  ];

  it("1. existing proof-plan strings remain byte-for-byte unchanged", () => {
    const presentation = getProofPlanPresentation({ proofPlan: savedPlan });
    assert.deepEqual(presentation.preservedPlan, savedPlan);
    assert.equal(presentation.preservedPlan[0], savedPlan[0]);
    assert.equal(presentation.preservedPlan[1], savedPlan[1]);
    assert.equal(presentation.preservedPlan[2], savedPlan[2]);
  });

  it("2. existing populated plans show the earlier-pass preservation message", () => {
    const presentation = getProofPlanPresentation({ proofPlan: savedPlan });
    assert.equal(presentation.showEarlierPassMessage, true);
    assert.equal(
      presentation.earlierPassMessage,
      PROOF_PLAN_EARLIER_PASS_MESSAGE
    );
    assert.match(presentation.earlierPassMessage, /earlier pass/i);
    assert.match(presentation.earlierPassMessage, /preserved/i);
  });

  it("3. review/revise guidance appears near the fields", () => {
    const presentation = getProofPlanPresentation({ proofPlan: savedPlan });
    assert.equal(presentation.reviewGuidance, PROOF_PLAN_REVIEW_GUIDANCE);
    assert.match(presentation.reviewGuidance, /Review each saved planning note/i);
    assert.match(presentation.reviewGuidance, /move or revise/i);

    const coaching = getThesisJobCoaching();
    assert.equal(coaching.proofPlanReviewGuidance, PROOF_PLAN_REVIEW_GUIDANCE);
  });

  it("4. empty new plans do not claim earlier saved content exists", () => {
    const presentation = getProofPlanPresentation({
      proofPlan: ["", "", ""],
    });
    assert.equal(presentation.showEarlierPassMessage, false);
    assert.equal(presentation.earlierPassMessage, "");
  });

  it("5. no automatic reordering occurs", () => {
    const oddOrder = [
      "Comparison note that was in slot 1",
      "Speech note that was in slot 2",
      "Letter note that was in slot 3",
    ];
    const presentation = getProofPlanPresentation({ proofPlan: oddOrder });
    assert.deepEqual(presentation.preservedPlan, oddOrder);
    assert.notEqual(presentation.preservedPlan[0], presentation.labels[0]);
  });

  it("6. storage shape, field order, minimum gate, and Module 4 handoff remain unchanged", () => {
    const presentation = getProofPlanPresentation({ proofPlan: savedPlan });
    assert.equal(presentation.slots, PROOF_PLAN_SLOTS);
    assert.equal(presentation.minimum, PROOF_PLAN_MINIMUM);
    assert.equal(presentation.labels.length, 3);
    assert.match(presentation.labels[0], /speech/i);
    assert.match(presentation.labels[1], /letter/i);
    assert.match(presentation.labels[2], /similarity or difference/i);

    assert.equal(
      canContinueFromThesis({
        thesisStatement: "Both writers frame delay as a moral failure.",
        proofPlan: savedPlan,
      }),
      true
    );
    assert.equal(
      canContinueFromThesis({
        thesisStatement: "Both writers frame delay as a moral failure.",
        proofPlan: ["", "", ""],
      }),
      false
    );

    const module4Payload = {
      thesisStatement: "Although both use pathos, audience changes the effect.",
      proofPlan: [...savedPlan],
    };
    assert.deepEqual(module4Payload.proofPlan, savedPlan);
    assert.equal(module4Payload.proofPlan.length, 3);
  });
});
