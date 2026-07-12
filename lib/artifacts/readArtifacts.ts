import { DEFAULT_ASSIGNMENT_ID, mlkAssignmentDefinition } from "@/lib/assignments";
import { supabase } from "@/lib/supabaseClient";
import { getModule2Sources } from "@/lib/supabase/helpers/module2Sources";
import { getStudentBuckets } from "@/lib/supabase/helpers/studentBuckets";
import {
  getFinalTextForExport,
  getStudentDraft,
} from "@/lib/supabase/helpers/studentDrafts";
import { getStudentObservations } from "@/lib/supabase/helpers/studentObservations";
import { getStudentOutline } from "@/lib/supabase/helpers/studentOutlines";
import { getTChartEntriesAdmin } from "@/lib/supabase/helpers/tchartEntries";
import { getModule3EvidenceClustersAdmin } from "@/lib/supabase/helpers/module3EvidenceClusters";
import { getModule3PatternsAdmin } from "@/lib/supabase/helpers/module3Patterns";
import { getModule3IdeaAdmin } from "@/lib/supabase/helpers/module3Ideas";
import { getModule3ClaimAdmin } from "@/lib/supabase/helpers/module3Claims";
import { getModule3ThesisAdmin } from "@/lib/supabase/helpers/module3Thesis";
import { requireNoError } from "@/lib/api/readResult";
import { asNonEmptyString, asStringArray } from "@/lib/parsing/coerce";
import type {
  ClaimArtifact,
  DraftArtifact,
  EvidenceArtifact,
  EvidenceClusterArtifact,
  IdeaArtifact,
  OutlineArtifact,
  ParagraphPlanArtifact,
  PatternArtifact,
  SourceContextArtifact,
  ThesisArtifact,
} from "./types";

/**
 * Artifact Engine V1 remains a compatibility adapter over current helpers/tables.
 * These reads do not introduce new storage or change any student-facing behavior.
 */

type Module3ResponseRow = {
  thesis: string | null;
  structure_choice: string | null;
  updated_at: string | null;
};

type TChartEntryRow = {
  category?: string | null;
  type?: string | null;
  quote?: string | null;
  observation?: string | null;
  letter_url?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type Module2SourcesRow = {
  mlk_url?: string | null;
  mlk_text?: string | null;
  mlk_site_name?: string | null;
  mlk_transcript_year?: string | null;
  mlk_citation?: string | null;
  lfbj_url?: string | null;
  lfbj_text?: string | null;
  lfbj_site_name?: string | null;
  lfbj_transcript_year?: string | null;
  lfbj_citation?: string | null;
  updated_at?: string | null;
};

type StudentBucketItem = {
  claim?: unknown;
  reasoning?: unknown;
  evidenceKeys?: unknown;
  evidenceSnippets?: unknown;
  paragraphRole?: unknown;
  suggestionId?: unknown;
};

function asBucketItems(value: unknown): StudentBucketItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is StudentBucketItem =>
      typeof item === "object" && item !== null && !Array.isArray(item)
  );
}

async function getModule3ThesisRow(userEmail: string) {
  return supabase
    .from("module3_responses")
    .select("thesis, structure_choice, updated_at")
    .eq("user_email", userEmail)
    .maybeSingle<Module3ResponseRow>();
}

export async function listEvidenceArtifacts(
  userEmail: string,
  assignmentId = DEFAULT_ASSIGNMENT_ID
): Promise<EvidenceArtifact[]> {
  const [observationsRes, tchartRes] = await Promise.all([
    getStudentObservations({ userEmail, assignmentId }),
    getTChartEntriesAdmin({ userEmail }),
  ]);

  const observations = requireNoError(
    observationsRes,
    "student observations"
  );
  const tchartEntries = requireNoError(tchartRes, "t-chart entries") as
    | TChartEntryRow[]
    | null;

  const observationArtifacts: EvidenceArtifact[] = (observations ?? []).map(
    (row) => ({
      id: `evidence:observation:${row.id}`,
      type: "evidence",
      userEmail: row.user_email,
      assignmentId: row.assignment_id,
      backingTable: "student_observations",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sourceType: row.source_type,
      sourceId: row.source_id,
      sourceTitle: row.source_title,
      quote: asNonEmptyString(row.quote),
      studentObservation: asNonEmptyString(row.student_observation),
      rhetoricalStrategy: asNonEmptyString(row.rhetorical_strategy),
      audienceEffect: asNonEmptyString(row.audience_effect),
      purposeConnection: asNonEmptyString(row.purpose_connection),
      essentialQuestionConnection: asNonEmptyString(
        row.essential_question_connection
      ),
      observationStage: asNonEmptyString(row.observation_stage),
      teacherGuided: row.teacher_guided,
      usedInThesis: row.used_in_thesis,
      usedInParagraph: row.used_in_paragraph,
    })
  );

  const legacyArtifacts: EvidenceArtifact[] = (tchartEntries ?? []).map(
    (row) => ({
      id: `evidence:tchart:${userEmail}:${row.type ?? "unknown"}:${
        row.category ?? "unknown"
      }`,
      type: "evidence",
      userEmail,
      assignmentId: null,
      backingTable: "tchart_entries",
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
      sourceType: asNonEmptyString(row.type),
      category: asNonEmptyString(row.category),
      quote: asNonEmptyString(row.quote),
      studentObservation: asNonEmptyString(row.observation),
      letterUrl: asNonEmptyString(row.letter_url),
    })
  );

  return [...observationArtifacts, ...legacyArtifacts];
}

export async function listEvidenceClusterArtifacts(
  userEmail: string,
  assignmentId = DEFAULT_ASSIGNMENT_ID
): Promise<EvidenceClusterArtifact[]> {
  const res = await getModule3EvidenceClustersAdmin({ userEmail });
  const clusters = requireNoError(res, "module 3 evidence clusters");

  return (clusters ?? []).map((cluster) => ({
    id: `evidence_cluster:${userEmail}:${cluster.id}`,
    type: "evidence_cluster" as const,
    userEmail,
    assignmentId,
    backingTable: "student_buckets" as const,
    createdAt: cluster.createdAt ?? null,
    updatedAt: cluster.updatedAt ?? null,
    clusterName: cluster.name,
    reflection: cluster.reflection ?? null,
    evidenceIds: Array.isArray(cluster.evidenceIds) ? cluster.evidenceIds : [],
  }));
}

export async function listPatternArtifacts(
  userEmail: string,
  assignmentId = DEFAULT_ASSIGNMENT_ID
): Promise<PatternArtifact[]> {
  const res = await getModule3PatternsAdmin({ userEmail });
  if (res.error) {
    throw new Error(res.error.message || "Failed to read module 3 patterns");
  }

  const patterns = res.patterns ?? [];
  const selectedPatternId = res.selectedPatternId ?? null;

  return patterns.map((pattern) => ({
    id: `pattern:${userEmail}:${pattern.id}`,
    type: "pattern" as const,
    userEmail,
    assignmentId,
    backingTable: "student_buckets" as const,
    createdAt: pattern.createdAt ?? null,
    updatedAt: pattern.updatedAt ?? null,
    text: pattern.text,
    evidenceIds: Array.isArray(pattern.evidenceIds) ? pattern.evidenceIds : [],
    isSelected: selectedPatternId === pattern.id,
    // Pass through CP-D additive fields so Module 4 can coach read-only.
    ...(pattern.matrixProvenance
      ? { matrixProvenance: pattern.matrixProvenance }
      : {}),
    ...(pattern.matrixReview ? { matrixReview: pattern.matrixReview } : {}),
  }));
}

export async function getIdeaArtifact(
  userEmail: string,
  assignmentId = DEFAULT_ASSIGNMENT_ID
): Promise<IdeaArtifact | null> {
  const res = await getModule3IdeaAdmin({ userEmail });
  if (res.error) {
    throw new Error(res.error.message || "Failed to read module 3 idea");
  }

  if (!res.idea) {
    return null;
  }

  return {
    id: `idea:${userEmail}`,
    type: "idea" as const,
    userEmail,
    assignmentId,
    backingTable: "student_buckets" as const,
    createdAt: res.idea.createdAt ?? null,
    updatedAt: res.idea.updatedAt ?? null,
    statement: res.idea.statement,
    whyMatters: res.idea.whyMatters,
    clusterId: res.idea.clusterId ?? null,
    patternId: res.idea.patternId ?? null,
    evidenceMap: res.idea.evidenceMap ?? {},
  };
}

export async function getClaimArtifact(
  userEmail: string,
  assignmentId = DEFAULT_ASSIGNMENT_ID
): Promise<ClaimArtifact | null> {
  const res = await getModule3ClaimAdmin({ userEmail });
  if (res.error) {
    throw new Error(res.error.message || "Failed to read module 3 claim");
  }

  if (!res.claim) {
    return null;
  }

  return {
    id: `claim:${userEmail}`,
    type: "claim" as const,
    userEmail,
    assignmentId,
    backingTable: "student_buckets" as const,
    createdAt: res.claim.createdAt ?? null,
    updatedAt: res.claim.updatedAt ?? null,
    workingClaim: res.claim.workingClaim,
    supportRationale: res.claim.supportRationale,
    clusterId: res.claim.clusterId ?? null,
    patternId: res.claim.patternId ?? null,
  };
}

export async function listSourceContextArtifacts(
  userEmail: string
): Promise<SourceContextArtifact[]> {
  const sourcesRes = await getModule2Sources({ userEmail });
  const sourceRow = requireNoError(
    sourcesRes,
    "module 2 source context"
  ) as Module2SourcesRow | null;

  if (!sourceRow) {
    return [];
  }

  const sources = [
    {
      sourceType: "speech" as const,
      title: mlkAssignmentDefinition.sources.speech.title,
      url: sourceRow.mlk_url ?? null,
      text: sourceRow.mlk_text ?? null,
      siteName: sourceRow.mlk_site_name ?? null,
      transcriptYear: sourceRow.mlk_transcript_year ?? null,
      citation: sourceRow.mlk_citation ?? null,
    },
    {
      sourceType: "letter" as const,
      title: mlkAssignmentDefinition.sources.letter.title,
      url: sourceRow.lfbj_url ?? null,
      text: sourceRow.lfbj_text ?? null,
      siteName: sourceRow.lfbj_site_name ?? null,
      transcriptYear: sourceRow.lfbj_transcript_year ?? null,
      citation: sourceRow.lfbj_citation ?? null,
    },
  ];

  return sources
    .filter(
      (source) =>
        source.url ||
        source.text ||
        source.siteName ||
        source.transcriptYear ||
        source.citation
    )
    .map((source) => ({
      id: `source_context:${userEmail}:${source.sourceType}`,
      type: "source_context" as const,
      userEmail,
      assignmentId: null,
      backingTable: "module2_sources" as const,
      createdAt: null,
      updatedAt: sourceRow.updated_at ?? null,
      sourceType: source.sourceType,
      title: source.title,
      url: asNonEmptyString(source.url),
      text: asNonEmptyString(source.text),
      siteName: asNonEmptyString(source.siteName),
      transcriptYear: asNonEmptyString(source.transcriptYear),
      citation: asNonEmptyString(source.citation),
    }));
}

export async function getThesisArtifact(
  userEmail: string
): Promise<ThesisArtifact | null> {
  // Prefer the Module 3 V2 Thesis artifact stored in student_buckets.flow_state.
  const v2Res = await getModule3ThesisAdmin({ userEmail });
  if (v2Res.error) {
    throw new Error(v2Res.error.message || "Failed to read module 3 thesis");
  }

  if (v2Res.thesis) {
    return {
      id: `thesis:${userEmail}`,
      type: "thesis",
      userEmail,
      assignmentId: null,
      backingTable: "student_buckets",
      createdAt: v2Res.thesis.createdAt ?? null,
      updatedAt: v2Res.thesis.updatedAt ?? null,
      thesis: v2Res.thesis.thesis,
      proofPlan: Array.isArray(v2Res.thesis.proofPlan) ? v2Res.thesis.proofPlan : [],
      structureChoice: null,
    };
  }

  // Backward compatibility: fall back to legacy module3_responses.thesis.
  const thesisRes = await getModule3ThesisRow(userEmail);
  const row = requireNoError(thesisRes, "module 3 thesis");

  if (!row?.thesis || !row.thesis.trim()) {
    return null;
  }

  return {
    id: `thesis:${userEmail}`,
    type: "thesis",
    userEmail,
    assignmentId: null,
    backingTable: "module3_responses",
    createdAt: null,
    updatedAt: row.updated_at ?? null,
    thesis: row.thesis,
    proofPlan: [],
    structureChoice: asNonEmptyString(row.structure_choice),
  };
}

export async function listParagraphPlanArtifacts(
  userEmail: string,
  module = 4
): Promise<ParagraphPlanArtifact[]> {
  const bucketsRes = await getStudentBuckets({ userEmail, module });
  const row = requireNoError(bucketsRes, "student buckets");

  if (!row) {
    return [];
  }

  return asBucketItems(row.buckets).map((bucket, index) => ({
    id: `paragraph_plan:${userEmail}:${module}:${index}`,
    type: "paragraph_plan",
    userEmail,
    assignmentId: null,
    backingTable: "student_buckets",
    createdAt: null,
    updatedAt: row.updated_at ?? null,
    module,
    index,
    claim: asNonEmptyString(bucket.claim),
    reasoning: asNonEmptyString(bucket.reasoning),
    evidenceKeys: asStringArray(bucket.evidenceKeys),
    evidenceSnippets: asStringArray(bucket.evidenceSnippets),
    paragraphRole: asNonEmptyString(bucket.paragraphRole),
    suggestionId: asNonEmptyString(bucket.suggestionId),
    reflection: asNonEmptyString(row.reflection),
    flowState: row.flow_state ?? null,
  }));
}

export async function getOutlineArtifact(
  userEmail: string,
  module = 5
): Promise<OutlineArtifact | null> {
  const outlineRes = await getStudentOutline({ userEmail, module });
  const row = requireNoError(outlineRes, "student outline");

  if (!row) {
    return null;
  }

  return {
    id: `outline:${userEmail}:${module}`,
    type: "outline",
    userEmail,
    assignmentId: null,
    backingTable: "student_outlines",
    createdAt: null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    module,
    outline: row.outline ?? null,
    finalized: typeof row.finalized === "boolean" ? row.finalized : null,
  };
}

export async function getDraftArtifact(
  userEmail: string
): Promise<DraftArtifact | null> {
  const [bestText, module6Draft] = await Promise.all([
    getFinalTextForExport({ userEmail }),
    getStudentDraft({ userEmail, module: 6 }),
  ]);

  if (module6Draft.error) {
    throw new Error(module6Draft.error.message || "Failed to read student draft");
  }

  const hasSections = module6Draft.data?.sections != null;
  const hasText = bestText.text.trim().length > 0;

  if (!hasSections && !hasText && bestText.status === "missing") {
    return null;
  }

  return {
    id: `draft:${userEmail}`,
    type: "draft",
    userEmail,
    assignmentId: null,
    backingTable: "student_drafts",
    createdAt: null,
    updatedAt: null,
    bestAvailableText: bestText.text,
    bestAvailableTextStatus: bestText.status,
    bestAvailableSourceModule: bestText.sourceModule,
    module6Sections: module6Draft.data?.sections ?? null,
    module6Locked:
      typeof module6Draft.data?.locked === "boolean"
        ? module6Draft.data.locked
        : null,
  };
}
