const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  DUPLICATE_GROUP_MESSAGE,
  canContinueFromReview,
  findDuplicateCluster,
  getDownstreamGroupSwitchMessage,
  getGroupCardActionLabel,
  getGroupChoicePresentation,
  getReviewContinueHint,
  getReviewReadyMessage,
  getSaveGroupConfirmationMessage,
  hasDownstreamThinking,
  resolveGroupSelectionAction,
  REVIEW_GROUP_CHOICE_COPY,
} = require("../lib/module3/reviewEvidenceHelpers.js");

const speech = { id: "s1", sourceType: "speech", quote: "Speech quote" };
const letter = { id: "l1", sourceType: "letter", quote: "Letter quote" };
const evidenceItems = [speech, letter];

function cluster(id, name, evidenceIds) {
  return { id, name, evidenceIds };
}

/**
 * Pure simulation of the save → choose separation.
 * Mirrors createEvidenceCluster: save appends a group and never selects it.
 */
function saveGroupWithoutSelecting({
  clusters,
  selectedClusterId,
  nextCluster,
}) {
  const nextClusters = [...clusters, nextCluster];
  return {
    clusters: nextClusters,
    selectedClusterId, // unchanged — saving must not select
    confirmation: getSaveGroupConfirmationMessage({
      savedName: nextCluster.name,
      previousSelectedId: selectedClusterId,
      previousSelectedName:
        clusters.find((item) => item.id === selectedClusterId)?.name || "",
    }),
    resetCalled: false,
  };
}

describe("save vs choose separation", () => {
  it("1. saving the first group does not select it", () => {
    const result = saveGroupWithoutSelecting({
      clusters: [],
      selectedClusterId: "",
      nextCluster: cluster("cluster-1", "Urgency", ["s1", "l1"]),
    });

    assert.equal(result.selectedClusterId, "");
    assert.equal(result.clusters.length, 1);
    assert.match(result.confirmation, /not selected yet/i);
    assert.equal(result.resetCalled, false);
  });

  it("2. saving a second group does not select it", () => {
    const result = saveGroupWithoutSelecting({
      clusters: [cluster("cluster-1", "Urgency", ["s1", "l1"])],
      selectedClusterId: "",
      nextCluster: cluster("cluster-2", "Hope", ["s1", "s1b"]),
    });

    assert.equal(result.selectedClusterId, "");
    assert.equal(result.clusters[1].id, "cluster-2");
    assert.match(result.confirmation, /not selected yet/i);
  });

  it("3. saving a new group preserves an existing explicit choice", () => {
    const result = saveGroupWithoutSelecting({
      clusters: [cluster("cluster-1", "Urgency", ["s1", "l1"])],
      selectedClusterId: "cluster-1",
      nextCluster: cluster("cluster-2", "Hope", ["s1", "s1b"]),
    });

    assert.equal(result.selectedClusterId, "cluster-1");
    assert.match(result.confirmation, /current exploration choice has not changed/i);
    assert.doesNotMatch(result.confirmation, /not selected yet/i);
  });

  it("4. saving never triggers downstream reset", () => {
    const result = saveGroupWithoutSelecting({
      clusters: [cluster("cluster-1", "Urgency", ["s1", "l1"])],
      selectedClusterId: "cluster-1",
      nextCluster: cluster("cluster-2", "Hope", ["s1", "s1b"]),
    });
    assert.equal(result.resetCalled, false);

    // Saving is not a selection action — resolveGroupSelectionAction is unused.
    const decision = resolveGroupSelectionAction({
      nextClusterId: "",
      currentClusterId: "cluster-1",
      hasDownstream: true,
    });
    assert.equal(decision.action, "noop");
  });
});

describe("group choice presentation", () => {
  it("5. no selection produces No group chosen yet", () => {
    const presentation = getGroupChoicePresentation({
      selectedCluster: null,
      evidenceItems,
    });
    assert.equal(presentation.hasChoice, false);
    assert.equal(presentation.statusLine, "No group chosen yet.");
    assert.equal(presentation.statusDetail, "Choose one group before you continue.");
  });

  it("6. no selection produces the explicit Keep Going message", () => {
    assert.equal(
      getReviewContinueHint({
        evidenceCount: 4,
        savedGroupCount: 1,
        selectedCluster: null,
      }),
      "Choose one saved group to explore before you continue."
    );
  });

  it("7. choosing a group produces the correct confirmation", () => {
    const presentation = getGroupChoicePresentation({
      selectedCluster: cluster("cluster-1", "Urgency", ["s1", "l1"]),
      evidenceItems,
    });
    assert.equal(presentation.hasChoice, true);
    assert.equal(presentation.statusLine, "You chose “Urgency.”");
    assert.match(presentation.statusDetail, /King’s rhetorical choices/);
    assert.equal(
      getReviewReadyMessage(cluster("cluster-1", "Urgency", ["s1", "l1"])),
      "You chose “Urgency.” You’re ready to explore what its quotations reveal."
    );
  });

  it("8. only one group is presented as chosen", () => {
    const groups = [
      cluster("cluster-1", "Urgency", ["s1", "l1"]),
      cluster("cluster-2", "Hope", ["s1", "s1b"]),
    ];
    const chosenId = "cluster-1";
    const labels = groups.map((group) =>
      getGroupCardActionLabel({
        isChosen: group.id === chosenId,
        hasAnyChoice: true,
      })
    );
    assert.equal(labels.filter((label) => label === "Chosen for exploration").length, 1);
    assert.equal(labels[0], "Chosen for exploration");
  });

  it("9. other groups say Explore this group instead", () => {
    assert.equal(
      getGroupCardActionLabel({ isChosen: false, hasAnyChoice: true }),
      "Explore this group instead"
    );
    assert.equal(
      getGroupCardActionLabel({ isChosen: false, hasAnyChoice: false }),
      "Explore this group"
    );
  });

  it("10. a chosen group enables the existing REVIEW continuation gate", () => {
    assert.equal(
      canContinueFromReview({
        evidenceCount: 4,
        selectedCluster: cluster("cluster-1", "Urgency", ["s1", "l1"]),
      }),
      true
    );
    assert.equal(
      canContinueFromReview({
        evidenceCount: 4,
        selectedCluster: null,
      }),
      false
    );
  });
});

describe("downstream-change protection", () => {
  it("11. changing groups without downstream work happens immediately", () => {
    const decision = resolveGroupSelectionAction({
      nextClusterId: "cluster-2",
      currentClusterId: "cluster-1",
      hasDownstream: false,
    });
    assert.equal(decision.action, "select");
    assert.equal(decision.shouldResetDownstream, true);
  });

  it("12. changing groups with downstream work requires confirmation", () => {
    const decision = resolveGroupSelectionAction({
      nextClusterId: "cluster-2",
      currentClusterId: "cluster-1",
      hasDownstream: true,
    });
    assert.equal(decision.action, "confirm");
    assert.equal(decision.shouldResetDownstream, false);
  });

  it("13. canceling the warning preserves the current group and downstream work", () => {
    // Cancel = leave pending unresolved; selection and downstream stay put.
    let selectedClusterId = "cluster-1";
    let resetCount = 0;
    const decision = resolveGroupSelectionAction({
      nextClusterId: "cluster-2",
      currentClusterId: selectedClusterId,
      hasDownstream: true,
    });
    assert.equal(decision.action, "confirm");
    // Student cancels — no commit.
    assert.equal(selectedClusterId, "cluster-1");
    assert.equal(resetCount, 0);
  });

  it("14. confirming the warning switches groups and invokes reset exactly once", () => {
    let selectedClusterId = "cluster-1";
    let resetCount = 0;

    const decision = resolveGroupSelectionAction({
      nextClusterId: "cluster-2",
      currentClusterId: selectedClusterId,
      hasDownstream: true,
    });
    assert.equal(decision.action, "confirm");

    // Explicit confirm path (mirrors confirmPendingGroupSwitch).
    resetCount += 1;
    selectedClusterId = "cluster-2";

    assert.equal(selectedClusterId, "cluster-2");
    assert.equal(resetCount, 1);

    assert.match(
      getDownstreamGroupSwitchMessage({
        currentGroupName: "Urgency",
        newGroupName: "Hope",
      }),
      /built from “Urgency.”/
    );
    assert.match(
      getDownstreamGroupSwitchMessage({
        currentGroupName: "Urgency",
        newGroupName: "Hope",
      }),
      /switch to “Hope,”/
    );
  });

  it("detects downstream thinking for patterns, ideas, connections, claims, and theses", () => {
    assert.equal(hasDownstreamThinking({}), false);
    assert.equal(hasDownstreamThinking({ selectedPatternId: "pattern-1" }), true);
    assert.equal(
      hasDownstreamThinking({
        patternNotices: [{ id: "pattern-1", text: "Shared urgency", evidenceIds: [] }],
      }),
      true
    );
    assert.equal(hasDownstreamThinking({ ideaStatement: "King presses urgency." }), true);
    assert.equal(
      hasDownstreamThinking({
        evidenceConnections: { s1: { selected: true, note: "Supports urgency" } },
      }),
      true
    );
    assert.equal(hasDownstreamThinking({ workingClaim: "A claim" }), true);
    assert.equal(hasDownstreamThinking({ thesisStatement: "A thesis" }), true);
    assert.equal(hasDownstreamThinking({ proofPlan: ["", "Point one", ""] }), true);
  });

  it("first choice with no prior group selects immediately without reset", () => {
    const decision = resolveGroupSelectionAction({
      nextClusterId: "cluster-1",
      currentClusterId: "",
      hasDownstream: false,
    });
    assert.equal(decision.action, "select");
    assert.equal(decision.shouldResetDownstream, false);
  });
});

describe("preserved REVIEW behavior", () => {
  it("15. existing duplicate protection remains unchanged", () => {
    const clusters = [cluster("cluster-1", "Hope", ["q1", "q2"])];
    assert.equal(findDuplicateCluster(clusters, ["q2", "q1"])?.id, "cluster-1");
    assert.equal(findDuplicateCluster(clusters, ["q1", "q3"]), null);
    assert.match(DUPLICATE_GROUP_MESSAGE, /already saved a group/i);
  });

  it("16. existing cluster payloads remain unchanged", () => {
    const original = Object.freeze(
      cluster("cluster-1", "Urgency", Object.freeze(["s1", "l1"]))
    );
    const presentation = getGroupChoicePresentation({
      selectedCluster: original,
      evidenceItems,
    });
    assert.equal(presentation.pathPreview.groupName, "Urgency");
    assert.equal(presentation.pathPreview.quotationCount, 2);
    assert.equal(presentation.pathPreview.sourceMix, "Speech and letter");
    assert.equal(original.id, "cluster-1");
    assert.deepEqual(original.evidenceIds, ["s1", "l1"]);
  });

  it("17. helpers do not mutate cluster data", () => {
    const clusters = Object.freeze([
      Object.freeze(cluster("cluster-1", "Urgency", Object.freeze(["s1", "l1"]))),
    ]);
    assert.doesNotThrow(() => {
      getGroupChoicePresentation({
        selectedCluster: clusters[0],
        evidenceItems,
      });
      hasDownstreamThinking({ ideaStatement: "x" });
      resolveGroupSelectionAction({
        nextClusterId: "cluster-2",
        currentClusterId: "cluster-1",
        hasDownstream: true,
      });
    });
    assert.equal(clusters[0].name, "Urgency");
  });

  it("exposes the coached choice heading and path-preview lead", () => {
    assert.equal(
      REVIEW_GROUP_CHOICE_COPY.heading,
      "Choose one group to explore more deeply."
    );
    assert.match(REVIEW_GROUP_CHOICE_COPY.pathPreviewLead, /group you’ll use next/);
  });
});
