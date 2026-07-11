const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  CONNECT_BLOCKED_CHOOSE_RELATION,
  CONNECT_BLOCKED_COMPLETE_ONE_MORE,
  CONNECT_BLOCKED_DOES_NOT_FIT,
  CONNECT_BLOCKED_FIRST_QUOTATION,
  CONNECT_BLOCKED_WRITE_NOTE,
  CONNECT_CROSS_REVIEW_HEADING,
  CONNECT_CROSS_REVIEW_QUESTIONS,
  CONNECT_MINIMUM,
  CONNECT_PROSPECTIVE_COMPARISON_NOTE,
  CONNECT_READY_COMPARISON_PROMPT,
  CONNECT_READY_MESSAGE,
  RELATION_CHOICES,
  buildCrossConnectionReview,
  buildConnectionReviewItems,
  countValidExplainedConnections,
  getConnectCoachingLines,
  getConnectContinueHint,
  getConnectEvidencePhase,
  getConnectReadyFeedback,
  getConnectReadyMessage,
  getEarlierPassStageIds,
  getSourceContributionQuestions,
  isValidExplainedConnection,
  mapRelationChoiceToConnectionPatch,
} = require("../lib/module3/connectEvidenceHelpers.js");

const {
  CONNECT_COMPASS_FOCUS_ID,
  CONNECT_COMPASS_FRAMING_LINE,
  getPromptCompassModel,
} = require("../lib/module3/promptCompassHelpers.js");

const { getAppealChipLabel } = require("../lib/module3/reviewEvidenceHelpers.js");

const {
  getQuotationSituationFooter,
} = require("../lib/shared/rhetoricalSituationHelpers.js");

function quote(id, extras = {}) {
  return {
    id,
    quote: `Quote ${id}`,
    sourceLabel: extras.sourceType === "letter" ? "Letter" : "Speech",
    sourceType: extras.sourceType || "speech",
    sourceTitle: extras.sourceType === "letter" ? "Letter from Birmingham Jail" : "I Have a Dream",
    observation: extras.observation || "Module 2 note about delay.",
    tags: extras.tags || [],
    ...extras,
  };
}

describe("CONNECT — Prompt Compass focus and framing", () => {
  it("1. CONNECT focuses Compare the works with approved framing", () => {
    assert.equal(CONNECT_COMPASS_FOCUS_ID, "compare");
    assert.equal(
      CONNECT_COMPASS_FRAMING_LINE,
      "Right now, explain what each quotation contributes to your developing idea. Then look across the two works for an important similarity or difference."
    );

    const model = getPromptCompassModel({
      assignmentPrompt: "Compare how King uses rhetorical appeals.",
      focusQuestionId: CONNECT_COMPASS_FOCUS_ID,
    });
    const focused = model.questions.filter((q) => q.isFocus);
    assert.equal(focused.length, 1);
    assert.equal(focused[0].id, "compare");
    assert.equal("complete" in focused[0], false);
  });
});

describe("CONNECT — source-aware contribution coaching", () => {
  it("2. Speech-specific contribution coaching", () => {
    const lines = getSourceContributionQuestions({
      sourceType: "speech",
      otherSourceType: "letter",
    });
    assert.match(lines[0], /Speech quotation add/i);
    assert.match(lines[1], /public audience and purpose/i);
    assert.match(lines[2], /Letter quotation/i);
  });

  it("3. Letter-specific contribution coaching", () => {
    const lines = getSourceContributionQuestions({
      sourceType: "letter",
      otherSourceType: "speech",
    });
    assert.match(lines[0], /Letter quotation add/i);
    assert.match(lines[1], /readers and purpose/i);
    assert.match(lines[2], /Speech quotation/i);
  });

  it("3b. prospective comparison note when the other work is incomplete", () => {
    const lines = getConnectCoachingLines({
      sourceType: "speech",
      uiChoiceId: "supports",
      otherSourceType: "letter",
      otherConnectionComplete: false,
    });
    assert.match(lines.join(" "), /Keep this contribution in mind/i);
    assert.equal(lines.at(-1), CONNECT_PROSPECTIVE_COMPARISON_NOTE);
  });
});

describe("CONNECT — quotation card context", () => {
  it("4. Form/Audience/Purpose footer lookup and safe fallback", () => {
    assert.equal(getQuotationSituationFooter(null), null);
    assert.equal(getQuotationSituationFooter({}), null);

    const footer = getQuotationSituationFooter({
      rhetoricalSituation: {
        compactCue: {
          form: "Public speech",
          audience: "Marchers and a national audience",
          purpose: "Inspire and call the nation to act",
        },
      },
    });
    assert.equal(footer.form, "Public speech");
    assert.equal(footer.audience, "Marchers and a national audience");
    assert.equal(footer.purpose, "Inspire and call the nation to act");
  });

  it("5. Module 2 note remains visible on evidence items", () => {
    const evidence = quote("a", { observation: "King warns that delay hurts people now." });
    assert.ok(evidence.observation.length > 0);
    assert.match(evidence.observation, /delay/i);
  });

  it("6. appeal chip appears only when supported by saved data", () => {
    assert.equal(getAppealChipLabel([]), "");
    assert.equal(getAppealChipLabel(["t-chart"]), "");
    assert.equal(getAppealChipLabel(["pathos"]), "Pathos · feeling");
    assert.equal(getAppealChipLabel(["logos"]), "Logos · reasoning");
  });
});

describe("CONNECT — relation storage and progression", () => {
  it("7. existing relation storage mapping remains unchanged", () => {
    assert.deepEqual(
      RELATION_CHOICES.filter((c) => c.storedRelation).map((c) => ({
        id: c.id,
        storedRelation: c.storedRelation,
      })),
      [
        { id: "supports", storedRelation: "supports" },
        { id: "complicates", storedRelation: "complicates" },
        { id: "sharpens", storedRelation: "sharpens" },
      ]
    );

    const doesNotFit = mapRelationChoiceToConnectionPatch("does_not_fit", {
      selected: true,
      relation: "supports",
      note: "old",
    });
    assert.equal(doesNotFit.selected, false);
    assert.equal(doesNotFit.note, "");
  });

  it("8. one-quotation-at-a-time disclosure remains unchanged", () => {
    const workingEvidence = [quote("a"), quote("b", { sourceType: "letter" })];
    const before = getConnectEvidencePhase({
      workingEvidence,
      evidenceConnections: {},
    });
    assert.equal(before.revealQuote2, false);
    assert.equal(before.activeIndex, 0);

    const afterFirst = getConnectEvidencePhase({
      workingEvidence,
      evidenceConnections: {
        a: { selected: true, relation: "supports", note: "Speech connection." },
      },
    });
    assert.equal(afterFirst.revealQuote2, true);
    assert.equal(afterFirst.activeIndex, 1);
  });

  it("9. two valid explained connections remain the gate", () => {
    const workingEvidence = [quote("a"), quote("b", { sourceType: "letter" })];
    const connections = {
      a: { selected: true, relation: "supports", note: "Speech explanation." },
      b: { selected: true, relation: "sharpens", note: "Letter explanation." },
    };
    assert.equal(
      countValidExplainedConnections(
        connections,
        workingEvidence.map((item) => item.id)
      ),
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
});

describe("CONNECT — completed review and readiness", () => {
  it("10. completed review asks students to compare the two contributions", () => {
    assert.equal(CONNECT_CROSS_REVIEW_HEADING, "Look across both connections.");
    assert.equal(CONNECT_CROSS_REVIEW_QUESTIONS.length, 3);
    assert.match(CONNECT_CROSS_REVIEW_QUESTIONS.join(" "), /similar way, in different ways, or both/i);
    assert.match(CONNECT_CROSS_REVIEW_QUESTIONS.join(" "), /audiences or purposes/i);
    assert.match(CONNECT_CROSS_REVIEW_QUESTIONS.join(" "), /do not need to write another answer/i);
  });

  it("11. no additional stored comparison response exists", () => {
    const patch = mapRelationChoiceToConnectionPatch("supports", { note: "Only note." });
    assert.deepEqual(Object.keys(patch).sort(), ["note", "relation", "selected"]);
    assert.equal("comparisonNote" in patch, false);
    assert.equal("crossTextRelation" in patch, false);
  });

  it("12. editing one connection preserves the other", () => {
    const evidenceConnections = {
      a: { selected: true, relation: "supports", note: "First stays." },
      b: { selected: true, relation: "complicates", note: "Second stays." },
    };
    const next = {
      ...evidenceConnections,
      a: { ...evidenceConnections.a, note: "First edited." },
    };
    assert.equal(next.b.note, "Second stays.");
    assert.equal(isValidExplainedConnection(next.b), true);
  });

  it("13. downstream artifacts are never deleted by presentation changes", () => {
    const ids = getEarlierPassStageIds({
      currentStep: "connect_evidence",
      claimPreview: "Working claim text",
      thesisPreview: "Working thesis text",
      stepsBeforeClaim: [
        "review_evidence",
        "notice_patterns",
        "explore_idea",
        "connect_evidence",
      ],
    });
    assert.deepEqual(ids, ["claim", "thesis"]);

    const onClaim = getEarlierPassStageIds({
      currentStep: "develop_claim",
      claimPreview: "Working claim text",
      thesisPreview: "Working thesis text",
      stepsBeforeClaim: ["connect_evidence"],
    });
    assert.deepEqual(onClaim, []);
  });

  it("14. cross review separates Speech and Letter contributions", () => {
    const workingEvidence = [
      quote("a", { sourceType: "speech" }),
      quote("b", { sourceType: "letter" }),
    ];
    const evidenceConnections = {
      a: { selected: true, relation: "supports", note: "Speech helps." },
      b: { selected: true, relation: "complicates", note: "Letter complicates." },
    };

    const review = buildCrossConnectionReview({
      workingEvidence,
      evidenceConnections,
    });
    assert.equal(review.speech.evidence.sourceType, "speech");
    assert.equal(review.letter.evidence.sourceType, "letter");
    assert.equal(review.hasBothSources, true);
    assert.equal(buildConnectionReviewItems({ workingEvidence, evidenceConnections }).length, 2);
  });

  it("readiness and blocked messages stay explicit", () => {
    assert.equal(getConnectReadyMessage(), CONNECT_READY_MESSAGE);
    assert.equal(
      getConnectReadyFeedback().comparisonPrompt,
      CONNECT_READY_COMPARISON_PROMPT
    );

    assert.equal(
      getConnectContinueHint({
        workingEvidence: [quote("a"), quote("b", { sourceType: "letter" })],
        evidenceConnections: {},
        activeEvidenceId: "a",
        activeUiChoice: "",
      }),
      CONNECT_BLOCKED_FIRST_QUOTATION
    );

    assert.equal(
      getConnectContinueHint({
        workingEvidence: [quote("a"), quote("b", { sourceType: "letter" })],
        evidenceConnections: {
          a: { selected: true, relation: "supports", note: "" },
        },
        activeEvidenceId: "a",
        activeUiChoice: "supports",
      }),
      CONNECT_BLOCKED_WRITE_NOTE
    );

    assert.equal(
      getConnectContinueHint({
        workingEvidence: [quote("a"), quote("b", { sourceType: "letter" })],
        evidenceConnections: {
          a: { selected: true, relation: "supports", note: "Done." },
        },
        activeEvidenceId: "b",
        activeUiChoice: "",
      }),
      CONNECT_BLOCKED_COMPLETE_ONE_MORE
    );

    assert.equal(
      getConnectContinueHint({
        workingEvidence: [quote("a"), quote("b", { sourceType: "letter" })],
        evidenceConnections: {
          a: { selected: false, relation: "supports", note: "" },
        },
        activeEvidenceId: "a",
        activeUiChoice: "does_not_fit",
      }),
      CONNECT_BLOCKED_DOES_NOT_FIT
    );

    assert.equal(
      getConnectContinueHint({
        workingEvidence: [quote("a"), quote("b", { sourceType: "letter" })],
        evidenceConnections: {
          a: { selected: false, relation: "supports", note: "" },
        },
        activeEvidenceId: "a",
        activeUiChoice: "unsure",
      }),
      CONNECT_BLOCKED_CHOOSE_RELATION
    );
  });
});
