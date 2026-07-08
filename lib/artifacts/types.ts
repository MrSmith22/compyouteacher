import type { ExportTextStatus } from "@/lib/supabase/helpers/studentDrafts";
import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import type { Artifact as ArtifactEnvelope } from "./artifactIdentity";

/**
 * Artifact Engine V1 is an adapter over existing storage.
 * These types name current durable work without introducing a new persistence model.
 */
export const ARTIFACT_TYPES = [
  "evidence",
  "evidence_cluster",
  "pattern",
  "idea",
  "claim",
  "source_context",
  "thesis",
  "paragraph_plan",
  "outline",
  "draft",
] as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

/**
 * Current artifact adapters still return flat compatibility objects because the
 * existing read paths and module code already consume these shapes directly.
 *
 * The shared identity wrapper introduced in `artifactIdentity.ts` lives beside
 * these types, not instead of them. That keeps the current adapter layer stable
 * while making the type system capable of representing the future
 * `Artifact<TPayload>` form for Thinking Canvas, teacher review surfaces, and
 * later Canvas-native artifact families.
 */
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

export interface EvidenceClusterArtifact extends ArtifactBase<"evidence_cluster"> {
  backingTable: "student_buckets";
  clusterName: string;
  reflection: string | null;
  evidenceIds: string[];
}

export interface PatternArtifact extends ArtifactBase<"pattern"> {
  backingTable: "student_buckets";
  text: string;
  evidenceIds: string[];
  isSelected: boolean;
}

export interface IdeaArtifact extends ArtifactBase<"idea"> {
  backingTable: "student_buckets";
  statement: string;
  whyMatters: string;
  clusterId: string | null;
  patternId: string | null;
  evidenceMap: Record<
    string,
    {
      selected: boolean;
      relation: string;
      note: string;
    }
  >;
}

export interface ClaimArtifact extends ArtifactBase<"claim"> {
  backingTable: "student_buckets";
  workingClaim: string;
  supportRationale: string;
  clusterId: string | null;
  patternId: string | null;
}

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
  | EvidenceClusterArtifact
  | PatternArtifact
  | IdeaArtifact
  | ClaimArtifact
  | SourceContextArtifact
  | ThesisArtifact
  | ParagraphPlanArtifact
  | OutlineArtifact
  | DraftArtifact;

type CompatibilityArtifactFields =
  | "id"
  | "type"
  | "userEmail"
  | "assignmentId"
  | "backingTable"
  | "createdAt"
  | "updatedAt";

type DistributiveOmit<T, TKeys extends PropertyKey> = T extends unknown
  ? Omit<T, TKeys>
  : never;

/**
 * Extracts the instructional payload from the current flat artifact shapes.
 *
 * This is the bridge between the compatibility-first adapter model and the
 * future identity-wrapped model. It allows the codebase to describe a shared
 * artifact envelope today without forcing every existing adapter to return that
 * envelope immediately.
 */
export type ArtifactPayload<TArtifact> = DistributiveOmit<
  TArtifact,
  CompatibilityArtifactFields
>;

export type ObservationEvidenceArtifactPayload =
  ArtifactPayload<ObservationEvidenceArtifact>;

export type LegacyEvidenceArtifactPayload =
  ArtifactPayload<LegacyEvidenceArtifact>;

export type EvidenceArtifactPayload =
  | ObservationEvidenceArtifactPayload
  | LegacyEvidenceArtifactPayload;

export type SourceContextArtifactPayload = ArtifactPayload<SourceContextArtifact>;
export type ThesisArtifactPayload = ArtifactPayload<ThesisArtifact>;
export type ParagraphPlanArtifactPayload =
  ArtifactPayload<ParagraphPlanArtifact>;
export type OutlineArtifactPayload = ArtifactPayload<OutlineArtifact>;
export type DraftArtifactPayload = ArtifactPayload<DraftArtifact>;

/**
 * Current artifact families mapped to the payload each would carry inside the
 * shared `Artifact<TPayload>` wrapper. New artifact families such as `pattern`,
 * `idea`, `claim`, or `proof_plan` can later join this map while preserving the
 * same identity contract.
 */
export interface ArtifactPayloadMap {
  evidence: EvidenceArtifactPayload;
  evidence_cluster: ArtifactPayload<EvidenceClusterArtifact>;
  pattern: ArtifactPayload<PatternArtifact>;
  idea: ArtifactPayload<IdeaArtifact>;
  claim: ArtifactPayload<ClaimArtifact>;
  source_context: SourceContextArtifactPayload;
  thesis: ThesisArtifactPayload;
  paragraph_plan: ParagraphPlanArtifactPayload;
  outline: OutlineArtifactPayload;
  draft: DraftArtifactPayload;
}

export type ArtifactOfType<TType extends ArtifactType> =
  TType extends ArtifactType
    ? ArtifactEnvelope<ArtifactPayloadMap[TType], TType>
    : never;

export type EvidenceArtifactEnvelope = ArtifactOfType<"evidence">;
export type SourceContextArtifactEnvelope = ArtifactOfType<"source_context">;
export type ThesisArtifactEnvelope = ArtifactOfType<"thesis">;
export type ParagraphPlanArtifactEnvelope = ArtifactOfType<"paragraph_plan">;
export type OutlineArtifactEnvelope = ArtifactOfType<"outline">;
export type DraftArtifactEnvelope = ArtifactOfType<"draft">;

export type AnyArtifactEnvelope = ArtifactOfType<ArtifactType>;
