const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  MODULE_THREE_SUCCESS_COMPLETED_MODULE,
  MODULE_THREE_SUCCESS_MODULE4_HREF,
  SUCCESS_BOTH_WORKS_CONFIRMED,
  SUCCESS_EVIDENCE_UNVERIFIED,
  SUCCESS_PROOF_PLAN_COMPAT_NOTE,
  SUCCESS_PROOF_PLAN_EMPTY_FALLBACK,
  SUCCESS_PROOF_PLAN_LABELS,
  SUCCESS_THESIS_FALLBACK,
  buildModuleThreeSuccessSummary,
  buildSuccessProofPlanItems,
  getSuccessValidEvidenceItems,
  snapshotSuccessInputs,
} = require("../lib/module3/moduleThreeSuccessHelpers.js");

const longNote = "The words show delay causes harm in both works.";

function connection(overrides = {}) {
  return {
    selected: true,
    relation: "supports",
    note: longNote,
    ...overrides,
  };
}

function baseArtifacts(overrides = {}) {
  return {
    thesisArtifact: {
      thesis: "Although both use pathos, King adapts feeling to each audience.",
      proofPlan: [
        "Show speech pathos toward the crowd.",
        "Show letter pathos toward the clergy.",
        "Compare how audience changes the appeal.",
      ],
      clusterId: null,
    },
    claimArtifact: {
      workingClaim: "King adapts pathos across audiences.",
      supportRationale: "Note one.\n\nNote two.",
      clusterId: "cluster-1",
      patternId: "pattern-1",
    },
    ideaArtifact: {
      statement: "Delay and feeling work differently for each audience.",
      whyMatters: "It explains the rhetorical shift.",
      clusterId: "cluster-1",
      patternId: "pattern-1",
      evidenceMap: {
        "guided:speech-1": connection(),
        "guided:letter-1": connection({
          relation: "sharpens",
          note: "This letter detail sharpens the audience difference.",
        }),
      },
    },
    evidenceClusterArtifacts: [
      {
        id: "evidence_cluster:user@example.com:cluster-1",
        clusterName: "Audience and feeling",
        evidenceIds: ["guided:speech-1", "guided:letter-1"],
      },
    ],
    evidenceArtifacts: [
      {
        id: "evidence:observation:speech-1",
        sourceType: "speech",
        quote: "I have a dream today.",
        studentObservation: "Speech note",
      },
      {
        id: "evidence:observation:letter-1",
        sourceType: "letter",
        quote: "Injustice anywhere is a threat to justice everywhere.",
        studentObservation: "Letter note",
      },
    ],
    patternArtifacts: [
      {
        id: "pattern-1",
        text: "Both texts pressure delay.",
        isSelected: true,
        evidenceIds: ["guided:speech-1", "guided:letter-1"],
      },
    ],
    ...overrides,
  };
}

describe("moduleThreeSuccessHelpers", () => {
  it("1. real saved thesis appears unchanged", () => {
    const thesis =
      "Although both use pathos, King adapts feeling to each audience.";
    const summary = buildModuleThreeSuccessSummary(
      baseArtifacts({
        thesisArtifact: {
          thesis,
          proofPlan: ["a", "b", "c"],
        },
      })
    );
    assert.equal(summary.thesis.available, true);
    assert.equal(summary.thesis.text, thesis);
  });

  it("2. nonempty proof-plan notes appear unchanged and in original order", () => {
    const proofPlan = [
      "Show speech pathos toward the crowd.",
      "Show letter pathos toward the clergy.",
      "Compare how audience changes the appeal.",
    ];
    const summary = buildModuleThreeSuccessSummary(
      baseArtifacts({
        thesisArtifact: {
          thesis: "A thesis.",
          proofPlan,
        },
      })
    );
    assert.deepEqual(
      summary.proofPlan.items.map((item) => item.text),
      proofPlan
    );
    assert.deepEqual(
      summary.proofPlan.items.map((item) => item.slotIndex),
      [0, 1, 2]
    );
    assert.deepEqual(summary.proofPlan.preservedPlan, proofPlan);
  });

  it("3. empty proof-plan slots are omitted", () => {
    const items = buildSuccessProofPlanItems([
      "Only the first note.",
      "",
      "   ",
    ]);
    assert.equal(items.length, 1);
    assert.equal(items[0].slotIndex, 0);
    assert.equal(items[0].text, "Only the first note.");
    assert.equal(items[0].label, SUCCESS_PROOF_PLAN_LABELS[0]);
  });

  it("4. existing notes are not rewritten or automatically reordered", () => {
    const proofPlan = [
      "Comparison note that lived in slot 1",
      "Speech-ish note in slot 2",
      "Letter-ish note in slot 3",
    ];
    const summary = buildModuleThreeSuccessSummary(
      baseArtifacts({
        thesisArtifact: { thesis: "A thesis.", proofPlan },
      })
    );
    assert.deepEqual(summary.proofPlan.preservedPlan, proofPlan);
    assert.equal(summary.proofPlan.items[0].text, proofPlan[0]);
    assert.equal(summary.proofPlan.items[0].label, SUCCESS_PROOF_PLAN_LABELS[0]);
    assert.match(summary.proofPlan.compatNote, /refine their organization/i);
    assert.equal(summary.proofPlan.compatNote, SUCCESS_PROOF_PLAN_COMPAT_NOTE);
  });

  it("5. Speech count includes only valid relevant evidence", () => {
    const summary = buildModuleThreeSuccessSummary(baseArtifacts());
    assert.equal(summary.evidence.speechCount, 1);
    assert.match(summary.evidence.speechSummary, /Speech: 1 explained quotation/);
  });

  it("6. Letter count includes only valid relevant evidence", () => {
    const summary = buildModuleThreeSuccessSummary(baseArtifacts());
    assert.equal(summary.evidence.letterCount, 1);
    assert.match(summary.evidence.letterSummary, /Letter: 1 explained quotation/);
  });

  it("7. orphan/unselected/unrelated evidence is excluded", () => {
    const artifacts = baseArtifacts({
      ideaArtifact: {
        ...baseArtifacts().ideaArtifact,
        evidenceMap: {
          "guided:speech-1": connection(),
          "guided:letter-1": connection({
            selected: false,
            note: "Unselected long enough note here.",
          }),
          "guided:orphan": connection({
            note: "Orphan connection that should not count.",
          }),
          "guided:short": connection({
            note: "Too short",
          }),
        },
      },
      evidenceArtifacts: [
        ...baseArtifacts().evidenceArtifacts,
        {
          id: "evidence:observation:orphan",
          sourceType: "letter",
          quote: "Orphan quote",
        },
        {
          id: "evidence:observation:short",
          sourceType: "letter",
          quote: "Short quote",
        },
      ],
    });

    const valid = getSuccessValidEvidenceItems({
      evidenceMap: artifacts.ideaArtifact.evidenceMap,
      clusterEvidenceIds: artifacts.evidenceClusterArtifacts[0].evidenceIds,
      evidenceArtifacts: artifacts.evidenceArtifacts,
    });
    assert.deepEqual(
      valid.map((item) => item.evidenceId),
      ["guided:speech-1"]
    );

    const summary = buildModuleThreeSuccessSummary(artifacts);
    assert.equal(summary.evidence.letterCount, 0);
    assert.equal(summary.evidence.bothWorksVerified, false);
  });

  it("8. both-works confirmation appears only when verified", () => {
    const ready = buildModuleThreeSuccessSummary(baseArtifacts());
    assert.equal(ready.evidence.bothWorksVerified, true);
    assert.equal(ready.evidence.confirmedMessage, SUCCESS_BOTH_WORKS_CONFIRMED);

    const speechOnly = buildModuleThreeSuccessSummary(
      baseArtifacts({
        ideaArtifact: {
          ...baseArtifacts().ideaArtifact,
          evidenceMap: {
            "guided:speech-1": connection(),
            "guided:speech-2": connection({
              note: "Second speech connection that is also explained.",
            }),
          },
        },
        evidenceClusterArtifacts: [
          {
            id: "evidence_cluster:user@example.com:cluster-1",
            evidenceIds: ["guided:speech-1", "guided:speech-2"],
          },
        ],
        evidenceArtifacts: [
          {
            id: "evidence:observation:speech-1",
            sourceType: "speech",
            quote: "A",
          },
          {
            id: "evidence:observation:speech-2",
            sourceType: "speech",
            quote: "B",
          },
        ],
      })
    );
    assert.equal(speechOnly.evidence.bothWorksVerified, false);
    assert.equal(
      speechOnly.evidence.unverifiedMessage,
      SUCCESS_EVIDENCE_UNVERIFIED
    );
  });

  it("9. missing thesis degrades safely", () => {
    const summary = buildModuleThreeSuccessSummary(
      baseArtifacts({
        thesisArtifact: null,
      })
    );
    assert.equal(summary.thesis.available, false);
    assert.equal(summary.thesis.text, "");
    assert.equal(summary.thesis.fallback, SUCCESS_THESIS_FALLBACK);
  });

  it("10. missing proof plan degrades safely", () => {
    const summary = buildModuleThreeSuccessSummary(
      baseArtifacts({
        thesisArtifact: {
          thesis: "A thesis remains.",
          proofPlan: ["", "", ""],
        },
      })
    );
    assert.equal(summary.proofPlan.empty, true);
    assert.equal(summary.proofPlan.items.length, 0);
    assert.equal(
      summary.proofPlan.emptyFallback,
      SUCCESS_PROOF_PLAN_EMPTY_FALLBACK
    );
  });

  it("11. missing evidence degrades safely", () => {
    const summary = buildModuleThreeSuccessSummary(
      baseArtifacts({
        ideaArtifact: {
          ...baseArtifacts().ideaArtifact,
          evidenceMap: {},
        },
        evidenceClusterArtifacts: [],
        evidenceArtifacts: [],
      })
    );
    assert.equal(summary.evidence.bothWorksVerified, false);
    assert.equal(summary.evidence.speechCount, 0);
    assert.equal(summary.evidence.letterCount, 0);
    assert.equal(
      summary.evidence.unverifiedMessage,
      SUCCESS_EVIDENCE_UNVERIFIED
    );
  });

  it("12. completion advancement remains unchanged", () => {
    const summary = buildModuleThreeSuccessSummary(baseArtifacts());
    assert.equal(summary.completedModuleNumber, 3);
    assert.equal(
      summary.completedModuleNumber,
      MODULE_THREE_SUCCESS_COMPLETED_MODULE
    );
    assert.equal(summary.writesArtifacts, false);
  });

  it("13. Module 4 destination remains /modules/4", () => {
    const summary = buildModuleThreeSuccessSummary(baseArtifacts());
    assert.equal(summary.module4Href, "/modules/4");
    assert.equal(summary.module4Href, MODULE_THREE_SUCCESS_MODULE4_HREF);
    assert.match(summary.primaryCtaLabel, /Continue to Module 4/i);
  });

  it("14. repeat page visits do not duplicate artifacts", () => {
    const input = baseArtifacts();
    const before = snapshotSuccessInputs(input);
    buildModuleThreeSuccessSummary(input);
    buildModuleThreeSuccessSummary(input);
    assert.deepEqual(input, before);
    assert.equal(
      buildModuleThreeSuccessSummary(input).writesArtifacts,
      false
    );
  });

  it("15. narrow layout remains readable", () => {
    const summary = buildModuleThreeSuccessSummary(baseArtifacts());
    assert.ok(summary.assignmentConnection.length < 280);
    assert.ok(summary.module4Handoff.length < 280);
    assert.ok(
      summary.proofPlan.labels.every((label) => label.length < 120)
    );
    assert.ok(summary.primaryCtaLabel.length < 80);
    assert.match(summary.evidence.speechSummary, /Speech/);
    assert.match(summary.evidence.letterSummary, /Letter/);
  });
});
