/**
 * Lightweight verification for Module 4 Phase 1 compatibility mapping.
 * Run: npx tsx lib/module4/verifyLoadModule4PageData.ts
 */

import {
  buildInitialModule3Compat,
  type LegacyModule3Row,
} from "./module4Compat";
import type { ThesisArtifact } from "@/lib/artifacts/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function thesisArtifact(
  overrides: Partial<ThesisArtifact> = {}
): ThesisArtifact {
  return {
    id: "thesis:test@example.com",
    type: "thesis",
    userEmail: "test@example.com",
    assignmentId: null,
    backingTable: "student_buckets",
    createdAt: null,
    updatedAt: null,
    thesis: "King uses rhetoric to inspire change.",
    proofPlan: ["Establish moral authority", "Appeal to shared values"],
    structureChoice: null,
    ...overrides,
  };
}

// V2 student: legacy mirror may be empty; artifact supplies thesis.
{
  const result = buildInitialModule3Compat(null, thesisArtifact());
  assert(
    result?.thesis === "King uses rhetoric to inspire change.",
    "V2 artifact thesis should hydrate when legacy row is missing"
  );
  assert(result?.structure_choice === null, "V2 has no structure_choice on artifact");
}

// Legacy-only student: legacy row wins.
{
  const legacy: LegacyModule3Row = {
    thesis: "Legacy thesis",
    structure_choice: "appeals-organization",
    responses: ["speech audience", "speech purpose", "letter audience", "letter purpose"],
  };
  const result = buildInitialModule3Compat(legacy, thesisArtifact({ thesis: "Artifact thesis" }));
  assert(result?.thesis === "Legacy thesis", "Legacy thesis should win over artifact");
  assert(
    result?.structure_choice === "appeals-organization",
    "Legacy structure_choice should be preserved"
  );
  assert(Array.isArray(result?.responses), "Legacy responses should be preserved");
}

// Incomplete Module 3: no legacy, no artifact.
{
  const result = buildInitialModule3Compat(null, null);
  assert(result === null, "Incomplete data should yield null initialModule3");
}

// Partial legacy: empty thesis string, artifact fills gap.
{
  const legacy: LegacyModule3Row = {
    thesis: "   ",
    structure_choice: null,
    responses: null,
  };
  const result = buildInitialModule3Compat(legacy, thesisArtifact());
  assert(
    result?.thesis === "King uses rhetoric to inspire change.",
    "Artifact thesis should fill empty legacy thesis"
  );
}

// Legacy structure_choice with V2 thesis artifact (structure only on legacy path).
{
  const legacy: LegacyModule3Row = {
    thesis: "Shared thesis",
    structure_choice: "similarities-then-differences",
    responses: ["a", "b", "c", "d"],
  };
  const result = buildInitialModule3Compat(legacy, thesisArtifact({ thesis: "Other" }));
  assert(result?.thesis === "Shared thesis", "Non-empty legacy thesis preserved");
  assert(
    result?.structure_choice === "similarities-then-differences",
    "structure_choice preserved for legacy scaffold"
  );
}

console.log("Module 4 Phase 1 compatibility mapping: all checks passed");
