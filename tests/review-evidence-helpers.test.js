const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  sameEvidenceIdSet,
  findDuplicateCluster,
  getReviewEvidencePhase,
  getReviewContinueHint,
  canContinueFromReview,
  getSavedGroupAccent,
  getSelectionRequirementMessage,
  getSelectedQuotationsFromIds,
  isShortModelInPrimaryFlow,
  REVIEW_HELP_EXAMPLE_LABEL,
  REVIEW_PRIMARY_FLOW_SECTIONS,
  DUPLICATE_GROUP_MESSAGE,
  REVIEW_QUOTE_MINIMUM,
} = require("../lib/module3/reviewEvidenceHelpers.js");

const {
  getNoticePatternsPhase,
  getActivePatternCoaching,
  getPatternsContinueHint,
  canContinueFromPatterns,
  countChosenObservationLinks,
  getChosenObservationLinkFeedback,
} = require("../lib/module3/noticePatternsHelpers.js");

const {
  getExploreIdeaPhase,
  getExploreIdeaContinueHint,
  canContinueFromExploreIdea,
  IDEA_STATEMENT_BLOCKED_MESSAGE,
  IDEA_STATEMENT_MINIMUM,
  IDEA_WHY_BLOCKED_MESSAGE,
  IDEA_WHY_MINIMUM,
} = require("../lib/module3/exploreIdeaHelpers.js");

describe("reviewEvidenceHelpers", () => {
  it("keeps the generic short model out of the primary workflow", () => {
    assert.equal(isShortModelInPrimaryFlow(), false);
    assert.equal(REVIEW_PRIMARY_FLOW_SECTIONS.includes("short_model"), false);
    assert.ok(REVIEW_PRIMARY_FLOW_SECTIONS.includes("selected_quotations"));
    assert.ok(REVIEW_PRIMARY_FLOW_SECTIONS.includes("module2_quotations"));
    assert.ok(REVIEW_PRIMARY_FLOW_SECTIONS.includes("job_card"));
    assert.match(REVIEW_HELP_EXAMPLE_LABEL, /example of grouping/i);
  });

  it("treats quotation ID sets as equal regardless of order", () => {
    assert.equal(sameEvidenceIdSet(["a", "b"], ["b", "a"]), true);
    assert.equal(sameEvidenceIdSet(["a", "b"], ["a", "b", "c"]), false);
  });

  it("finds a duplicate cluster with the identical quotation set", () => {
    const clusters = [
      { id: "cluster-1", name: "Hope", evidenceIds: ["q1", "q2"] },
      { id: "cluster-2", name: "Justice", evidenceIds: ["q3", "q4"] },
    ];

    const duplicate = findDuplicateCluster(clusters, ["q2", "q1"]);
    assert.equal(duplicate?.id, "cluster-1");
    assert.equal(findDuplicateCluster(clusters, ["q1", "q3"]), null);
  });

  it("exposes a student-facing duplicate message", () => {
    assert.match(DUPLICATE_GROUP_MESSAGE, /already saved a group/i);
    assert.match(DUPLICATE_GROUP_MESSAGE, /different combination/i);
  });

  it("assigns stable distinguishable accents without changing IDs", () => {
    const first = getSavedGroupAccent(0);
    const second = getSavedGroupAccent(1);
    const fifth = getSavedGroupAccent(4);

    assert.notEqual(first.id, second.id);
    assert.equal(first.id, fifth.id);
    assert.ok(first.badge);
    assert.ok(first.selectedCard);
    assert.equal(first.numberLabel, "Group");
  });

  it("keeps naming secondary until enough quotations are selected", () => {
    const before = getReviewEvidencePhase({
      selectedCount: 1,
      groupName: "",
      savedGroupCount: 0,
    });
    assert.equal(before.showNaming, false);
    assert.equal(before.primaryPhase, "select");
    assert.equal(before.quoteMinimum, REVIEW_QUOTE_MINIMUM);

    const after = getReviewEvidencePhase({
      selectedCount: 2,
      groupName: "",
      savedGroupCount: 0,
    });
    assert.equal(after.showNaming, true);
    assert.equal(after.primaryPhase, "name");
    assert.equal(after.canSave, false);
  });

  it("explains the two-quotation requirement as selections change", () => {
    assert.equal(
      getSelectionRequirementMessage({ selectedCount: 0 }).message,
      "Select at least two quotations to create a group."
    );
    assert.equal(
      getSelectionRequirementMessage({ selectedCount: 1 }).message,
      "Select one more quotation to create a group."
    );
    assert.equal(
      getSelectionRequirementMessage({ selectedCount: 2 }).tone,
      "ready"
    );
    assert.equal(
      getSelectionRequirementMessage({ selectedCount: 2 }).message,
      "You have enough quotations to name this group."
    );
    assert.equal(
      getReviewEvidencePhase({ selectedCount: 2 }).showNaming,
      true
    );
  });

  it("derives selected quotations from the current quotation IDs", () => {
    const evidenceItems = [
      { id: "a", quote: "First" },
      { id: "b", quote: "Second" },
      { id: "c", quote: "Third" },
    ];
    const selected = getSelectedQuotationsFromIds({
      evidenceItems,
      selectedIds: ["c", "a"],
    });
    assert.deepEqual(
      selected.map((item) => item.id),
      ["a", "c"]
    );
    assert.equal(
      getSelectedQuotationsFromIds({
        evidenceItems,
        selectedIds: ["missing", "b"],
      }).length,
      1
    );
  });

  it("keeps naming hidden until at least two quotations are selected", () => {
    assert.equal(
      getReviewEvidencePhase({ selectedCount: 0 }).showNaming,
      false
    );
    assert.equal(
      getReviewEvidencePhase({ selectedCount: 1 }).showNaming,
      false
    );
    assert.equal(
      getReviewEvidencePhase({ selectedCount: 2 }).showNaming,
      true
    );
    assert.equal(
      getReviewEvidencePhase({ selectedCount: 2 }).showSave,
      true
    );
  });

  it("preserves duplicate protection for identical quotation sets", () => {
    const clusters = [
      { id: "cluster-1", name: "Hope", evidenceIds: ["a", "b"] },
    ];
    assert.equal(
      findDuplicateCluster(clusters, ["b", "a"])?.id,
      "cluster-1"
    );
    assert.match(DUPLICATE_GROUP_MESSAGE, /already saved a group/i);
  });

  it("models save clearing the draft selection without deleting the saved group", () => {
    const savedGroups = [
      { id: "cluster-1", name: "Injustice", evidenceIds: ["a", "b"] },
    ];
    let draftIds = ["a", "b"];
    let draftName = "Injustice";

    // Simulate successful save: keep saved group, clear draft.
    draftIds = [];
    draftName = "";

    assert.equal(savedGroups.length, 1);
    assert.deepEqual(savedGroups[0].evidenceIds, ["a", "b"]);
    assert.deepEqual(draftIds, []);
    assert.equal(draftName, "");

    const phase = getReviewEvidencePhase({
      selectedCount: draftIds.length,
      groupName: draftName,
      savedGroupCount: savedGroups.length,
    });
    assert.equal(phase.showChooseGroup, true);
    assert.equal(phase.showNaming, false);
  });

  it("keeps downstream group selection compatible after saving", () => {
    assert.equal(
      canContinueFromReview({
        evidenceCount: 4,
        selectedCluster: { id: "c1", evidenceIds: ["a", "b"] },
      }),
      true
    );
    assert.equal(
      getReviewContinueHint({
        evidenceCount: 4,
        savedGroupCount: 1,
        selectedCluster: { id: "c1", evidenceIds: ["a", "b"] },
      }),
      ""
    );
  });

  it("emphasizes save only when quotations and name are ready", () => {
    const phase = getReviewEvidencePhase({
      selectedCount: 2,
      groupName: "Consequences of injustice",
      savedGroupCount: 0,
    });
    assert.equal(phase.canSave, true);
    assert.equal(phase.emphasizeSave, true);
    assert.equal(phase.primaryPhase, "save");
  });

  it("shows choose-group once a group is saved and the draft is clear", () => {
    const phase = getReviewEvidencePhase({
      selectedCount: 0,
      groupName: "",
      savedGroupCount: 1,
    });
    assert.equal(phase.showChooseGroup, true);
    assert.equal(phase.primaryPhase, "choose");
  });

  it("gates Keep Going until a saved group is selected", () => {
    assert.equal(
      canContinueFromReview({
        evidenceCount: 4,
        selectedCluster: null,
      }),
      false
    );

    assert.equal(
      canContinueFromReview({
        evidenceCount: 4,
        selectedCluster: { id: "c1", evidenceIds: ["a", "b"] },
      }),
      true
    );

    assert.equal(
      getReviewContinueHint({
        evidenceCount: 4,
        savedGroupCount: 1,
        selectedCluster: null,
      }),
      "Choose one saved group to explore before you continue."
    );
  });
});

describe("noticePatternsHelpers", () => {
  it("keeps the first observation field behind guided noticing", () => {
    const before = getNoticePatternsPhase({
      connectionChoice: "",
      firstObservationText: "",
      secondObservationText: "",
      filledObservationCount: 0,
    });
    assert.equal(before.showFirstObservation, false);
    assert.equal(before.primaryPhase, "guide");

    const after = getNoticePatternsPhase({
      connectionChoice: "message",
      firstObservationText: "",
      secondObservationText: "",
      filledObservationCount: 0,
    });
    assert.equal(after.showFirstObservation, true);
    assert.equal(after.showSecondObservation, false);
    assert.equal(after.primaryPhase, "first");
  });

  it("reveals the second observation after the first has text", () => {
    const phase = getNoticePatternsPhase({
      connectionChoice: "audience",
      firstObservationText: "Both quotations stir urgency.",
      secondObservationText: "",
      filledObservationCount: 1,
    });
    assert.equal(phase.showSecondObservation, true);
    assert.equal(phase.showChooseObservation, false);
    assert.equal(phase.primaryPhase, "second");
  });

  it("asks students to choose after two observations exist", () => {
    const phase = getNoticePatternsPhase({
      connectionChoice: "message",
      firstObservationText: "Both name injustice.",
      secondObservationText: "Both warn against waiting.",
      filledObservationCount: 2,
    });
    assert.equal(phase.showChooseObservation, true);
    assert.equal(phase.primaryPhase, "choose");
  });

  it("uses guided choices to provide coaching without writing the answer", () => {
    const coaching = getActivePatternCoaching({
      connectionChoice: "strategy",
      strategyChoice: "pathos",
    });
    assert.match(coaching.coaching, /feeling|audience/i);
    assert.ok(coaching.starter);
    assert.equal(coaching.awaitingStrategy, false);
  });

  it("waits for strategy follow-up before unlocking writing", () => {
    const phase = getNoticePatternsPhase({
      connectionChoice: "strategy",
      strategyChoice: "",
      firstObservationText: "",
      filledObservationCount: 0,
    });
    assert.equal(phase.awaitingStrategy, true);
    assert.equal(phase.showFirstObservation, false);
  });

  it("explains remaining pattern requirements for Keep Going", () => {
    const groupIds = ["speech-1", "letter-1"];

    assert.equal(
      getPatternsContinueHint({ filledObservationCount: 0, groupEvidenceIds: groupIds }),
      "Write one possible observation."
    );
    assert.equal(
      getPatternsContinueHint({ filledObservationCount: 1, groupEvidenceIds: groupIds }),
      "Add another possible observation."
    );
    assert.equal(
      getPatternsContinueHint({
        filledObservationCount: 2,
        selectedPattern: null,
        groupEvidenceIds: groupIds,
      }),
      "Choose the observation you want to explore."
    );
    assert.equal(
      getPatternsContinueHint({
        filledObservationCount: 2,
        selectedPattern: { text: "Both show urgency.", evidenceIds: [] },
        groupEvidenceIds: groupIds,
      }),
      "Connect at least two quotations to the observation you chose."
    );
    assert.equal(
      getPatternsContinueHint({
        filledObservationCount: 2,
        selectedPattern: { text: "Both show urgency.", evidenceIds: ["speech-1"] },
        groupEvidenceIds: groupIds,
      }),
      "Connect one more quotation to the observation you chose."
    );
    assert.equal(
      getPatternsContinueHint({
        filledObservationCount: 2,
        selectedPattern: {
          text: "Both show urgency.",
          evidenceIds: ["speech-1", "letter-1"],
        },
        groupEvidenceIds: groupIds,
      }),
      ""
    );
  });

  it("gates Keep Going on the chosen observation's in-group links only", () => {
    const groupIds = ["q1", "q2"];
    const chosenWithZero = { id: "obs-3", text: "Only speech feels strong.", evidenceIds: [] };
    const chosenWithOne = {
      id: "obs-3",
      text: "Only speech feels strong.",
      evidenceIds: ["q1"],
    };
    const chosenWithTwo = {
      id: "obs-3",
      text: "Both passages warn against waiting.",
      evidenceIds: ["q1", "q2"],
    };
    const unchosenWithTwo = {
      id: "obs-1",
      text: "Other observation already linked.",
      evidenceIds: ["q1", "q2"],
    };

    assert.equal(countChosenObservationLinks(chosenWithZero, groupIds), 0);
    assert.equal(countChosenObservationLinks(chosenWithOne, groupIds), 1);
    assert.equal(countChosenObservationLinks(chosenWithTwo, groupIds), 2);

    assert.equal(
      canContinueFromPatterns({
        filledObservationCount: 2,
        selectedPattern: chosenWithZero,
        groupEvidenceIds: groupIds,
      }),
      false
    );
    assert.equal(
      canContinueFromPatterns({
        filledObservationCount: 2,
        selectedPattern: chosenWithOne,
        groupEvidenceIds: groupIds,
      }),
      false
    );
    assert.equal(
      canContinueFromPatterns({
        filledObservationCount: 2,
        selectedPattern: chosenWithTwo,
        groupEvidenceIds: groupIds,
      }),
      true
    );

    // Unchosen observation with two links must not unlock progression.
    assert.equal(
      canContinueFromPatterns({
        filledObservationCount: 2,
        selectedPattern: chosenWithOne,
        groupEvidenceIds: groupIds,
      }),
      false
    );
    assert.equal(unchosenWithTwo.evidenceIds.length, 2);

    // Switching chosen observation recalculates readiness.
    assert.equal(
      canContinueFromPatterns({
        filledObservationCount: 2,
        selectedPattern: unchosenWithTwo,
        groupEvidenceIds: groupIds,
      }),
      true
    );

    // Unchecking one of two links disables immediately.
    assert.equal(
      canContinueFromPatterns({
        filledObservationCount: 2,
        selectedPattern: {
          ...chosenWithTwo,
          evidenceIds: ["q1"],
        },
        groupEvidenceIds: groupIds,
      }),
      false
    );

    // Stale / orphan IDs outside the group do not count.
    assert.equal(
      countChosenObservationLinks(
        { text: "Looks linked", evidenceIds: ["q1", "orphan-old-id"] },
        groupIds
      ),
      1
    );
    assert.equal(
      canContinueFromPatterns({
        filledObservationCount: 2,
        selectedPattern: {
          text: "Looks linked",
          evidenceIds: ["q1", "orphan-old-id"],
        },
        groupEvidenceIds: groupIds,
      }),
      false
    );

    // Persisted chosen observation with one in-group link loads disabled.
    assert.equal(
      getChosenObservationLinkFeedback({
        selectedPattern: chosenWithOne,
        groupEvidenceIds: groupIds,
      }).message,
      "Connect one more quotation to the observation you chose."
    );
    assert.equal(
      getChosenObservationLinkFeedback({
        selectedPattern: chosenWithTwo,
        groupEvidenceIds: groupIds,
      }).message,
      "Your chosen observation is connected to enough evidence."
    );
  });

  it("allows resume when observations already exist without a guided choice", () => {
    const phase = getNoticePatternsPhase({
      connectionChoice: "",
      firstObservationText: "Saved notice one",
      secondObservationText: "Saved notice two",
      filledObservationCount: 2,
    });
    assert.equal(phase.showFirstObservation, true);
    assert.equal(phase.showSecondObservation, true);
    assert.equal(phase.showChooseObservation, true);
  });
});

describe("exploreIdeaHelpers", () => {
  it("keeps whyMatters hidden until statement readiness", () => {
    const before = getExploreIdeaPhase({
      statement: "Too short",
      whyMatters: "",
    });
    assert.equal(before.statementReady, false);
    assert.equal(before.showWhyMatters, false);
    assert.equal(before.primaryPhase, "interpret");
    assert.ok("Too short".length < IDEA_STATEMENT_MINIMUM);

    const readyStatement = "King may be showing that delay itself becomes injustice.";
    const after = getExploreIdeaPhase({
      statement: readyStatement,
      whyMatters: "",
    });
    assert.equal(after.statementReady, true);
    assert.equal(after.showWhyMatters, true);
    assert.equal(after.primaryPhase, "why");
    assert.ok(readyStatement.length >= IDEA_STATEMENT_MINIMUM);
  });

  it("requires both statement and whyMatters for progression", () => {
    const statement = "These quotations suggest King links delay with injustice.";
    assert.equal(
      canContinueFromExploreIdea({
        statement,
        whyMatters: "Too short",
      }),
      false
    );
    assert.ok("Too short".length < IDEA_WHY_MINIMUM);

    const why =
      "This idea could help explain how King persuades his audience to act now.";
    assert.equal(
      canContinueFromExploreIdea({
        statement,
        whyMatters: why,
      }),
      true
    );

    const phase = getExploreIdeaPhase({ statement, whyMatters: why });
    assert.equal(phase.showReadyFeedback, true);
    assert.equal(phase.primaryPhase, "ready");
  });

  it("explains remaining explore_idea requirements", () => {
    assert.equal(
      getExploreIdeaContinueHint({ statement: "", whyMatters: "" }),
      IDEA_STATEMENT_BLOCKED_MESSAGE
    );
    assert.equal(
      getExploreIdeaContinueHint({
        statement: "King may be showing that delay itself becomes injustice.",
        whyMatters: "",
      }),
      IDEA_WHY_BLOCKED_MESSAGE
    );
    assert.equal(
      getExploreIdeaContinueHint({
        statement: "King may be showing that delay itself becomes injustice.",
        whyMatters:
          "This idea could help explain how King persuades his audience to act now.",
      }),
      ""
    );
  });
});
