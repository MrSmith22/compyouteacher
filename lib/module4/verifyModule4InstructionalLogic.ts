/**
 * Verification for Module 4 Phase 2 instructional logic.
 * Run: npx tsx lib/module4/verifyModule4InstructionalLogic.ts
 */

import {
  buildModule4EvidencePool,
  buildProofPlanBucketSuggestions,
  evidenceRowKey,
  resolveBucketSuggestions,
  resolveInstructionalThesis,
  resolveProofPlan,
  resolveSelectedPattern,
} from "./module4InstructionalLogic";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// Thesis: artifact primary
{
  const thesis = resolveInstructionalThesis({
    thesisArtifact: { thesis: "Artifact thesis", proofPlan: ["Line 1"] },
    initialModule3: { thesis: "Legacy thesis", structure_choice: null, responses: null },
  });
  assert(thesis === "Artifact thesis", "Artifact thesis is primary when both exist");
}

{
  const thesis = resolveInstructionalThesis({
    thesisArtifact: null,
    initialModule3: { thesis: "Legacy thesis", structure_choice: null, responses: null },
  });
  assert(thesis === "Legacy thesis", "Legacy thesis is fallback when artifact missing");
}

// Proof plan suggestions replace legacy when present
{
  const suggestions = resolveBucketSuggestions({
    proofPlan: ["Establish moral authority", "Show shared values"],
    legacySuggestions: [{ id: "sim-1", label: "Similarity" }],
  });
  assert(suggestions.length === 2, "Proof plan drives suggestions");
  assert(suggestions[0].id === "proof-0", "Proof suggestion ids are stable");
}

{
  const suggestions = resolveBucketSuggestions({
    proofPlan: [],
    legacySuggestions: [{ id: "sim-1", label: "Similarity" }],
  });
  assert(suggestions[0].id === "sim-1", "Legacy suggestions when proof plan empty");
}

// Evidence pool: artifacts first, cluster bounded, tchart fallback
{
  const artifacts = [
    {
      id: "evidence:observation:a",
      backingTable: "student_observations",
      sourceType: "speech",
      rhetoricalStrategy: "ethos",
      quote: "Quote A",
      studentObservation: "Note A",
    },
    {
      id: "evidence:observation:b",
      backingTable: "student_observations",
      sourceType: "letter",
      rhetoricalStrategy: "ethos",
      quote: "Quote B",
      studentObservation: "Note B",
    },
  ];

  const clusters = [
    {
      id: "evidence_cluster:user:cluster-1",
      evidenceIds: ["evidence:observation:a"],
    },
  ];

  const bounded = buildModule4EvidencePool({
    evidenceArtifacts: artifacts,
    evidenceClusterArtifacts: clusters,
    selectedClusterId: "cluster-1",
    legacyTchartEntries: [],
  });
  assert(bounded.length === 1, "Cluster bounds evidence pool when matches exist");
  assert(
    evidenceRowKey(bounded[0]) === "evidence:observation:a",
    "Artifact evidence key preserved"
  );

  const widened = buildModule4EvidencePool({
    evidenceArtifacts: artifacts,
    evidenceClusterArtifacts: clusters,
    selectedClusterId: "missing-cluster",
    legacyTchartEntries: [],
  });
  assert(widened.length === 2, "Missing cluster widens to full artifact library");

  const legacyOnly = buildModule4EvidencePool({
    evidenceArtifacts: [],
    evidenceClusterArtifacts: [],
    selectedClusterId: null,
    legacyTchartEntries: [
      { id: "1", type: "speech", category: "ethos", quote: "Q", observation: "O" },
    ],
  });
  assert(legacyOnly.length === 1, "Falls back to legacy tchart when no artifacts");
}

// Selected pattern
{
  const selected = resolveSelectedPattern([
    { id: "p1", text: "First", isSelected: false },
    { id: "p2", text: "Selected", isSelected: true },
  ]);
  assert(selected?.text === "Selected", "Finds selected pattern artifact");
}

{
  const proofPlan = resolveProofPlan({
    proofPlan: [" One ", "", "Two", "Three", "Four"],
  });
  assert(
    proofPlan.join("|") === "One|Two|Three",
    "Proof plan normalized to three lines"
  );
}

console.log("Module 4 Phase 2 instructional logic: all checks passed");
