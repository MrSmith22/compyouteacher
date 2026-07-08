import {
  getClaimArtifact,
  getIdeaArtifact,
  getThesisArtifact,
  listEvidenceArtifacts,
  listEvidenceClusterArtifacts,
  listParagraphPlanArtifacts,
  listPatternArtifacts,
  listSourceContextArtifacts,
} from "@/lib/artifacts/readArtifacts";
import type {
  ClaimArtifact,
  EvidenceArtifact,
  EvidenceClusterArtifact,
  IdeaArtifact,
  ParagraphPlanArtifact,
  PatternArtifact,
  SourceContextArtifact,
  ThesisArtifact,
} from "@/lib/artifacts/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getModule3ThesisAdmin } from "@/lib/supabase/helpers/module3Thesis";
import { getTChartEntriesAdmin } from "@/lib/supabase/helpers/tchartEntries";
import {
  buildInitialModule3Compat,
  type LegacyModule3Row,
} from "@/lib/module4/module4Compat";
import { resolveModuleOriginalUrls } from "@/lib/module4/resolveModuleSourceUrls";

const MODULE4_NUM = 4;

export type LegacyStudentBucketsRow = {
  buckets?: unknown;
  reflection?: string | null;
  flow_state?: unknown;
  updated_at?: string | null;
  [key: string]: unknown;
} | null;

export type Module4UpstreamArtifacts = {
  thesisArtifact: ThesisArtifact | null;
  claimArtifact: ClaimArtifact | null;
  ideaArtifact: IdeaArtifact | null;
  patternArtifacts: PatternArtifact[];
  evidenceClusterArtifacts: EvidenceClusterArtifact[];
  evidenceArtifacts: EvidenceArtifact[];
  sourceContextArtifacts: SourceContextArtifact[];
  paragraphPlanArtifacts: ParagraphPlanArtifact[];
  selectedClusterId: string | null;
  selectedPatternId: string | null;
};

export type Module4PageData = {
  initialModule3: LegacyModule3Row;
  initialTchartEntries: Awaited<ReturnType<typeof getTChartEntriesAdmin>>["data"];
  initialStudentBuckets: LegacyStudentBucketsRow;
  speechOriginalUrl: string;
  letterOriginalUrl: string;
  upstreamArtifacts: Module4UpstreamArtifacts;
};

function emptyUpstreamArtifacts(): Module4UpstreamArtifacts {
  return {
    thesisArtifact: null,
    claimArtifact: null,
    ideaArtifact: null,
    patternArtifacts: [],
    evidenceClusterArtifacts: [],
    evidenceArtifacts: [],
    sourceContextArtifacts: [],
    paragraphPlanArtifacts: [],
    selectedClusterId: null,
    selectedPatternId: null,
  };
}

/**
 * Loads Module 3 V2 and downstream artifacts through the Artifact Engine read layer.
 * Failures return an empty bundle so legacy reads can still hydrate the page.
 */
export async function loadModule4UpstreamArtifacts(
  userEmail: string
): Promise<Module4UpstreamArtifacts> {
  if (!userEmail) {
    return emptyUpstreamArtifacts();
  }

  try {
    const [
      thesisArtifact,
      claimArtifact,
      ideaArtifact,
      patternArtifacts,
      evidenceClusterArtifacts,
      evidenceArtifacts,
      sourceContextArtifacts,
      paragraphPlanArtifacts,
      thesisAdminRes,
    ] = await Promise.all([
      getThesisArtifact(userEmail),
      getClaimArtifact(userEmail),
      getIdeaArtifact(userEmail),
      listPatternArtifacts(userEmail),
      listEvidenceClusterArtifacts(userEmail),
      listEvidenceArtifacts(userEmail),
      listSourceContextArtifacts(userEmail),
      listParagraphPlanArtifacts(userEmail, MODULE4_NUM),
      getModule3ThesisAdmin({ userEmail }),
    ]);

    const thesisClusterId = thesisAdminRes.error
      ? null
      : thesisAdminRes.thesis?.clusterId ?? null;
    const thesisPatternId = thesisAdminRes.error
      ? null
      : thesisAdminRes.thesis?.patternId ?? null;
    const selectedClusterId =
      (typeof thesisClusterId === "string" ? thesisClusterId.trim() : "") ||
      claimArtifact?.clusterId?.trim() ||
      ideaArtifact?.clusterId?.trim() ||
      null;
    const selectedPatternFromList = patternArtifacts.find((p) => p.isSelected);
    const selectedPatternId =
      selectedPatternFromList?.id ??
      (thesisPatternId ? `pattern:${userEmail}:${thesisPatternId}` : null);

    return {
      thesisArtifact,
      claimArtifact,
      ideaArtifact,
      patternArtifacts,
      evidenceClusterArtifacts,
      evidenceArtifacts,
      sourceContextArtifacts,
      paragraphPlanArtifacts,
      selectedClusterId,
      selectedPatternId,
    };
  } catch (error) {
    console.error("Module 4 upstream artifact load failed:", error);
    return emptyUpstreamArtifacts();
  }
}

/**
 * Server-side loader for Module 4: Artifact Engine upstream reads plus legacy compatibility tables.
 */
export async function loadModule4PageData(
  userEmail: string
): Promise<Module4PageData> {
  const supabase = getSupabaseAdmin();

  const [upstreamArtifacts, m3Res, tchartRes, bucketsRes, m2Res] =
    await Promise.all([
      loadModule4UpstreamArtifacts(userEmail),
      supabase
        .from("module3_responses")
        .select("thesis, structure_choice, responses")
        .eq("user_email", userEmail)
        .maybeSingle(),
      getTChartEntriesAdmin({ userEmail }),
      supabase
        .from("student_buckets")
        .select("*")
        .eq("user_email", userEmail)
        .eq("module", MODULE4_NUM)
        .maybeSingle(),
      supabase
        .from("module2_sources")
        .select("mlk_url, lfbj_url")
        .eq("user_email", userEmail)
        .maybeSingle(),
    ]);

  const legacyModule3 = (m3Res.data ?? null) as LegacyModule3Row;
  const tchartRows = tchartRes.data ?? [];
  const { speechOriginalUrl, letterOriginalUrl } = resolveModuleOriginalUrls({
    module2Row: m2Res.data ?? null,
    tchartRows,
  });

  const initialModule3 = buildInitialModule3Compat(
    legacyModule3,
    upstreamArtifacts.thesisArtifact
  );

  return {
    initialModule3,
    initialTchartEntries: tchartRows,
    initialStudentBuckets: (bucketsRes.data ?? null) as LegacyStudentBucketsRow,
    speechOriginalUrl,
    letterOriginalUrl,
    upstreamArtifacts,
  };
}
