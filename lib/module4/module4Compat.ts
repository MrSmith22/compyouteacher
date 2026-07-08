import type { ThesisArtifact } from "@/lib/artifacts/types";

export type LegacyModule3Row = {
  thesis: string | null;
  structure_choice: string | null;
  responses: unknown;
} | null;

/**
 * Maps Artifact Engine thesis onto the legacy `module3_responses` shape expected by ModuleFour.
 * Legacy row values win when present; artifacts fill gaps only.
 */
export function buildInitialModule3Compat(
  legacyRow: LegacyModule3Row,
  thesisArtifact: ThesisArtifact | null
): LegacyModule3Row {
  const legacyThesis =
    typeof legacyRow?.thesis === "string" ? legacyRow.thesis.trim() : "";
  const artifactThesis =
    typeof thesisArtifact?.thesis === "string" ? thesisArtifact.thesis.trim() : "";

  const legacyStructure =
    typeof legacyRow?.structure_choice === "string"
      ? legacyRow.structure_choice.trim()
      : "";
  const artifactStructure =
    typeof thesisArtifact?.structureChoice === "string"
      ? thesisArtifact.structureChoice.trim()
      : "";

  const thesis = legacyThesis || artifactThesis || null;
  const structure_choice = legacyStructure || artifactStructure || null;
  const responses = legacyRow?.responses ?? null;

  if (!legacyRow && !thesis && !structure_choice && responses == null) {
    return null;
  }

  if (legacyRow) {
    return {
      ...legacyRow,
      thesis: thesis ?? legacyRow.thesis ?? null,
      structure_choice: structure_choice ?? legacyRow.structure_choice ?? null,
      responses: legacyRow.responses ?? null,
    };
  }

  return {
    thesis,
    structure_choice,
    responses,
  };
}
