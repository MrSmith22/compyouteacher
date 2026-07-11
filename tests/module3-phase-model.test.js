const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  MODULE_THREE_PHASES,
  countValidHydrationConnections,
  getArtifactChainStageForStep,
  getInitialModuleThreePhase,
  inferClusterForPattern,
  readArtifactPayload,
  resolveClusterList,
  resolveModuleThreeContext,
} = require("../lib/module3/moduleThreePhaseModel.js");

function clusterArtifact(id, name, evidenceIds) {
  return {
    identity: { sourceId: id },
    payload: { id, clusterName: name, evidenceIds },
  };
}

function patternArtifact(id, text, evidenceIds, isSelected = false) {
  return { payload: { id, text, evidenceIds, isSelected } };
}

function ideaArtifact({
  statement = "Delay itself becomes part of the injustice.",
  clusterId = "",
  patternId = "",
  evidenceMap = {},
} = {}) {
  return { payload: { statement, whyMatters: "", clusterId, patternId, evidenceMap } };
}

function validConnection(note = "The words show delay causes real harm.") {
  return { selected: true, relation: "supports", note };
}

const CLUSTERS = [
  clusterArtifact("cluster-1", "Urgency", ["q1", "q2", "q3"]),
  clusterArtifact("cluster-2", "Moral appeals", ["q4", "q5"]),
];

const PATTERNS = [
  patternArtifact("pattern-1", "Both texts treat waiting as harm.", ["q1", "q2"]),
  patternArtifact("pattern-2", "Both appeal to shared values.", ["q4", "q5"]),
];

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}

describe("moduleThreePhaseModel initial phase", () => {
  it("1. no artifacts opens review", () => {
    const result = getInitialModuleThreePhase({});
    assert.equal(result.phase, MODULE_THREE_PHASES.REVIEW);
    assert.equal(result.clusterId, "");
    assert.equal(result.patternId, "");
  });

  it("2. saved groups only opens review", () => {
    const result = getInitialModuleThreePhase({ clusterArtifacts: CLUSTERS });
    assert.equal(result.phase, MODULE_THREE_PHASES.REVIEW);
    assert.equal(result.clusterId, "");
  });

  it("3. saved patterns without a safe group commitment opens review", () => {
    // Neither pattern is selected and nothing references a cluster.
    const result = getInitialModuleThreePhase({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: PATTERNS,
    });
    assert.equal(result.phase, MODULE_THREE_PHASES.REVIEW);
  });

  it("4. safely resolved selected cluster and pattern opens explore_idea", () => {
    const result = getInitialModuleThreePhase({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: [
        patternArtifact("pattern-1", "Both texts treat waiting as harm.", ["q1", "q2"], true),
        PATTERNS[1],
      ],
    });
    assert.equal(result.phase, MODULE_THREE_PHASES.IDEA);
    assert.equal(result.clusterId, "cluster-1");
    assert.equal(result.patternId, "pattern-1");
  });

  it("5. saved idea without enough valid connections opens connect_evidence", () => {
    const result = getInitialModuleThreePhase({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: PATTERNS,
      ideaArtifact: ideaArtifact({
        clusterId: "cluster-1",
        patternId: "pattern-1",
        evidenceMap: { q1: validConnection() },
      }),
    });
    assert.equal(result.phase, MODULE_THREE_PHASES.CONNECT);
    assert.equal(result.clusterId, "cluster-1");
    assert.equal(result.patternId, "pattern-1");
  });

  it("6. saved idea with two valid in-group explained connections opens evaluate_strength", () => {
    const result = getInitialModuleThreePhase({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: PATTERNS,
      ideaArtifact: ideaArtifact({
        clusterId: "cluster-1",
        patternId: "pattern-1",
        evidenceMap: { q1: validConnection(), q2: validConnection("Another clear note.") },
      }),
    });
    assert.equal(result.phase, MODULE_THREE_PHASES.EVALUATE);
  });

  it("7. orphan connection IDs do not advance readiness", () => {
    // q9 and q10 are not in cluster-1, so only q1 counts.
    const result = getInitialModuleThreePhase({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: PATTERNS,
      ideaArtifact: ideaArtifact({
        clusterId: "cluster-1",
        patternId: "pattern-1",
        evidenceMap: {
          q1: validConnection(),
          q9: validConnection(),
          q10: validConnection(),
        },
      }),
    });
    assert.equal(result.phase, MODULE_THREE_PHASES.CONNECT);
  });

  it("8. duplicate quotation IDs count only once", () => {
    const count = countValidHydrationConnections({
      ideaArtifact: ideaArtifact({
        evidenceMap: {
          q1: validConnection(),
          "q1 ": validConnection("Same quotation with a padded key."),
        },
      }),
      cluster: { id: "cluster-1", evidenceIds: ["q1", "q2"] },
    });
    assert.equal(count, 1);
  });

  it("9. claim without thesis opens develop_claim", () => {
    const result = getInitialModuleThreePhase({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: PATTERNS,
      ideaArtifact: ideaArtifact({ clusterId: "cluster-1", patternId: "pattern-1" }),
      claimArtifact: {
        workingClaim: "Both writers argue that delay deepens injustice.",
        clusterId: "cluster-1",
        patternId: "pattern-1",
      },
    });
    assert.equal(result.phase, MODULE_THREE_PHASES.CLAIM);
    assert.equal(result.clusterId, "cluster-1");
  });

  it("10. thesis opens turn_claim_into_thesis", () => {
    const result = getInitialModuleThreePhase({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: PATTERNS,
      claimArtifact: { workingClaim: "A claim.", clusterId: "cluster-1", patternId: "pattern-1" },
      thesisArtifact: { thesis: "Both writers frame delay as a moral failure." },
    });
    assert.equal(result.phase, MODULE_THREE_PHASES.THESIS);
  });
});

describe("moduleThreePhaseModel reference resolution", () => {
  it("11. thesis reference wins over conflicting claim and idea references", () => {
    const context = resolveModuleThreeContext({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: PATTERNS,
      thesisArtifact: { thesis: "T.", clusterId: "cluster-2", patternId: "pattern-2" },
      claimArtifact: { workingClaim: "C.", clusterId: "cluster-1", patternId: "pattern-1" },
      ideaArtifact: ideaArtifact({ clusterId: "cluster-1", patternId: "pattern-1" }),
    });
    assert.equal(context.clusterId, "cluster-2");
    assert.equal(context.patternId, "pattern-2");
    assert.equal(context.clusterSource, "thesis");
  });

  it("12. claim reference wins when no thesis reference exists", () => {
    const context = resolveModuleThreeContext({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: PATTERNS,
      thesisArtifact: { thesis: "T." },
      claimArtifact: { workingClaim: "C.", clusterId: "cluster-2", patternId: "pattern-2" },
      ideaArtifact: ideaArtifact({ clusterId: "cluster-1", patternId: "pattern-1" }),
    });
    assert.equal(context.clusterId, "cluster-2");
    assert.equal(context.patternId, "pattern-2");
    assert.equal(context.clusterSource, "claim");
  });

  it("13. idea reference wins when no later artifact reference exists", () => {
    const context = resolveModuleThreeContext({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: PATTERNS,
      ideaArtifact: ideaArtifact({ clusterId: "cluster-1", patternId: "pattern-1" }),
    });
    assert.equal(context.clusterId, "cluster-1");
    assert.equal(context.patternId, "pattern-1");
    assert.equal(context.clusterSource, "idea");
  });

  it("an orphan reference is never selected", () => {
    const context = resolveModuleThreeContext({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: PATTERNS,
      ideaArtifact: ideaArtifact({ clusterId: "cluster-gone", patternId: "pattern-gone" }),
    });
    assert.equal(context.clusterId, "");
    assert.equal(context.patternId, "");
  });

  it("matches namespaced artifact IDs against raw persisted references", () => {
    const namespaced = [
      {
        identity: { sourceId: "evidence_cluster:student@example.com:cluster-1" },
        payload: {
          id: "evidence_cluster:student@example.com:cluster-1",
          clusterName: "Urgency",
          evidenceIds: ["q1", "q2"],
        },
      },
    ];
    const context = resolveModuleThreeContext({
      clusterArtifacts: namespaced,
      patternArtifacts: PATTERNS,
      ideaArtifact: ideaArtifact({ clusterId: "cluster-1", patternId: "pattern-1" }),
    });
    assert.equal(context.clusterId, "evidence_cluster:student@example.com:cluster-1");
  });

  it("14. unique evidence-set matching may resolve a cluster from a selected pattern", () => {
    const context = resolveModuleThreeContext({
      clusterArtifacts: CLUSTERS,
      patternArtifacts: [
        patternArtifact("pattern-1", "Waiting as harm.", ["q1", "q2"], true),
      ],
    });
    assert.equal(context.patternId, "pattern-1");
    assert.equal(context.clusterId, "cluster-1");
    assert.equal(context.clusterSource, "evidence_set_inference");
  });

  it("15. ambiguous evidence-set matching does not guess", () => {
    const ambiguousClusters = [
      clusterArtifact("cluster-1", "Urgency", ["q1", "q2", "q3"]),
      clusterArtifact("cluster-3", "Also urgency", ["q1", "q2"]),
    ];
    const context = resolveModuleThreeContext({
      clusterArtifacts: ambiguousClusters,
      patternArtifacts: [
        patternArtifact("pattern-1", "Waiting as harm.", ["q1", "q2"], true),
      ],
    });
    assert.equal(context.patternId, "pattern-1");
    assert.equal(context.clusterId, "");

    const phase = getInitialModuleThreePhase({
      clusterArtifacts: ambiguousClusters,
      patternArtifacts: [
        patternArtifact("pattern-1", "Waiting as harm.", ["q1", "q2"], true),
      ],
    });
    assert.equal(phase.phase, MODULE_THREE_PHASES.REVIEW);
  });
});

describe("moduleThreePhaseModel chain stages", () => {
  it("16. gather maps to the readiness chain stage", () => {
    assert.equal(getArtifactChainStageForStep("gather_more_evidence"), "readiness");
  });

  it("17. chain stage mapping covers every existing step ID", () => {
    assert.deepEqual(
      Object.values(MODULE_THREE_PHASES).map(getArtifactChainStageForStep),
      ["group", "pattern", "idea", "connections", "readiness", "readiness", "claim", "thesis"]
    );
    assert.equal(getArtifactChainStageForStep("unknown_step"), "group");
  });
});

describe("moduleThreePhaseModel purity", () => {
  it("18. helper functions do not mutate their inputs", () => {
    const clusters = deepFreeze([
      clusterArtifact("cluster-1", "Urgency", ["q1", "q2", "q3"]),
    ]);
    const patterns = deepFreeze([
      patternArtifact("pattern-1", "Waiting as harm.", ["q1", "q2"], true),
    ]);
    const idea = deepFreeze(
      ideaArtifact({
        clusterId: "cluster-1",
        patternId: "pattern-1",
        evidenceMap: { q1: validConnection(), q2: validConnection("Second note.") },
      })
    );
    const claim = deepFreeze({ workingClaim: "C.", clusterId: "cluster-1", patternId: "pattern-1" });
    const thesis = deepFreeze({ thesis: "T." });

    assert.doesNotThrow(() => {
      readArtifactPayload(idea);
      resolveClusterList(clusters);
      inferClusterForPattern(resolveClusterList(clusters), {
        evidenceIds: ["q1", "q2"],
      });
      countValidHydrationConnections({
        ideaArtifact: idea,
        cluster: resolveClusterList(clusters)[0],
      });
      const result = getInitialModuleThreePhase({
        clusterArtifacts: clusters,
        patternArtifacts: patterns,
        ideaArtifact: idea,
        claimArtifact: claim,
        thesisArtifact: thesis,
      });
      assert.equal(result.phase, MODULE_THREE_PHASES.THESIS);
    });
  });
});
