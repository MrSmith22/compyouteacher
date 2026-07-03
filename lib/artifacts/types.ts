import type { ExportTextStatus } from "@/lib/supabase/helpers/studentDrafts";
import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";

/**
 * Artifact Engine V1 is an adapter over existing storage.
 * These types name current durable work without introducing a new persistence model.
 */
export const ARTIFACT_TYPES = [
  "evidence",
  "source_context",
  "thesis",
  "paragraph_plan",
  "outline",
  "draft",
] as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export interface ArtifactBase<TType extends ArtifactType> {
  id: string;
  type: TType;
  userEmail: string;
  assignmentId: string | null;
  backingTable: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ObservationEvidenceArtifact
  extends ArtifactBase<"evidence"> {
  backingTable: "student_observations";
  sourceType: string | null;
  sourceId: string | null;
  sourceTitle: string | null;
  quote: string | null;
  studentObservation: string | null;
  rhetoricalStrategy: string | null;
  audienceEffect: string | null;
  purposeConnection: string | null;
  essentialQuestionConnection: string | null;
  observationStage: string | null;
  teacherGuided: boolean | null;
  usedInThesis: boolean | null;
  usedInParagraph: boolean | null;
}

export interface LegacyEvidenceArtifact extends ArtifactBase<"evidence"> {
  backingTable: "tchart_entries";
  sourceType: string | null;
  category: string | null;
  quote: string | null;
  studentObservation: string | null;
  letterUrl: string | null;
}

export type EvidenceArtifact =
  | ObservationEvidenceArtifact
  | LegacyEvidenceArtifact;

export interface SourceContextArtifact extends ArtifactBase<"source_context"> {
  backingTable: "module2_sources";
  sourceType: "speech" | "letter";
  title: string;
  url: string | null;
  text: string | null;
  siteName: string | null;
  transcriptYear: string | null;
  citation: string | null;
}

export interface ThesisArtifact extends ArtifactBase<"thesis"> {
  backingTable: "module3_responses";
  thesis: string;
  structureChoice: string | null;
}

export interface ParagraphPlanArtifact
  extends ArtifactBase<"paragraph_plan"> {
  backingTable: "student_buckets";
  module: number;
  index: number;
  claim: string | null;
  reasoning: string | null;
  evidenceKeys: string[];
  evidenceSnippets: string[];
  paragraphRole: string | null;
  suggestionId: string | null;
  reflection: string | null;
  flowState: StudentBucketFlowState | null;
}

export interface OutlineArtifact extends ArtifactBase<"outline"> {
  backingTable: "student_outlines";
  module: number;
  outline: unknown;
  finalized: boolean | null;
}

export interface DraftArtifact extends ArtifactBase<"draft"> {
  backingTable: "student_drafts";
  bestAvailableText: string;
  bestAvailableTextStatus: ExportTextStatus;
  bestAvailableSourceModule: 7 | 6 | null;
  module6Sections: unknown | null;
  module6Locked: boolean | null;
}

export type AnyArtifact =
  | EvidenceArtifact
  | SourceContextArtifact
  | ThesisArtifact
  | ParagraphPlanArtifact
  | OutlineArtifact
  | DraftArtifact;
