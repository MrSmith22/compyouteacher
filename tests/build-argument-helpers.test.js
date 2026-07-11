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
  getThesisContinueHint,
  getThesisJobCoaching,
  getThesisPhase,
  getThesisReadyMessage,
  resolveSupportRationale,
  snapshotEvidenceConnections,
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
    assert.ok(
      coaching.leadingQuestions.some((q) =>
        /assignment question/i.test(q)
      )
    );
    assert.ok(
      coaching.leadingQuestions.some((q) => /supported point from my claim/i.test(q))
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
