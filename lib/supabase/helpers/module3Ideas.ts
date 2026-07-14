import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import { asTrimmedString } from "@/lib/parsing/coerce";
import { readRowRefIds } from "@/lib/module3/rowMetadata";
import {
  getModule3StudentBucketAdmin,
  upsertModule3ScalarFlowStateAdmin,
} from "@/lib/supabase/helpers/module3FlowState";
import {
  evidenceMapHasContent,
  normalizeEvidenceMap,
  resolveNextEvidenceMap,
} from "@/lib/module3/ideaEvidenceMapHelpers";

export type Module3EvidenceMapEntry = {
  selected: boolean;
  relation: string;
  note: string;
};

export type Module3EvidenceMap = Record<string, Module3EvidenceMapEntry>;

export type Module3IdeaRow = {
  statement: string;
  whyMatters: string;
  clusterId?: string | null;
  patternId?: string | null;
  evidenceMap?: Module3EvidenceMap;
  createdAt?: string | null;
  updatedAt?: string | null;
  matrixProvenance?: Record<string, unknown> | null;
  matrixReview?: Record<string, unknown> | null;
};

export {
  evidenceMapHasContent,
  normalizeEvidenceMap,
  resolveNextEvidenceMap,
};

function asIdea(value: unknown): Module3IdeaRow | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const statement = asTrimmedString(record.statement);
  const whyMatters = asTrimmedString(record.whyMatters);
  const evidenceMap = normalizeEvidenceMap(record.evidenceMap);

  if (!statement && !whyMatters && !evidenceMapHasContent(evidenceMap)) {
    return null;
  }

  return {
    statement,
    whyMatters,
    evidenceMap,
    ...readRowRefIds(record),
    ...(record.matrixProvenance &&
    typeof record.matrixProvenance === "object" &&
    !Array.isArray(record.matrixProvenance)
      ? { matrixProvenance: record.matrixProvenance as Record<string, unknown> }
      : {}),
    ...(record.matrixReview &&
    typeof record.matrixReview === "object" &&
    !Array.isArray(record.matrixReview)
      ? { matrixReview: record.matrixReview as Record<string, unknown> }
      : {}),
  };
}

export async function getModule3IdeaAdmin({ userEmail }: { userEmail: string }) {
  const res = await getModule3StudentBucketAdmin({ userEmail });
  if (res.error) return { idea: null, error: res.error };
  const flowState = (res.data?.flow_state ?? null) as StudentBucketFlowState | null;
  const idea = asIdea(flowState?.module3Idea);
  return { idea, error: null };
}

export async function upsertModule3IdeaAdmin({
  userEmail,
  idea,
}: {
  userEmail: string;
  idea: Module3IdeaRow | null;
}) {
  return upsertModule3ScalarFlowStateAdmin({
    userEmail,
    key: "module3Idea",
    value: idea,
  });
}
