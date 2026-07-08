import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import { getStudentBucketsAdmin, upsertStudentBucketsAdmin } from "@/lib/supabase/helpers/studentBuckets";

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
};

const MODULE_NUMBER = 3;
const DEFAULT_RELATION = "supports";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asEvidenceMapEntry(value: unknown): Module3EvidenceMapEntry | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const relation = asString(record.relation).trim() || DEFAULT_RELATION;

  return {
    selected: Boolean(record.selected),
    relation,
    note: asString(record.note),
  };
}

export function normalizeEvidenceMap(value: unknown): Module3EvidenceMap {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const out: Module3EvidenceMap = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const evidenceId = asString(key).trim();
    if (!evidenceId) continue;
    const normalized = asEvidenceMapEntry(entry);
    if (normalized) out[evidenceId] = normalized;
  }
  return out;
}

export function evidenceMapHasContent(map: Module3EvidenceMap | undefined | null) {
  if (!map) return false;
  return Object.values(map).some(
    (entry) => entry.selected || asString(entry.note).trim().length > 0
  );
}

function asIdea(value: unknown): Module3IdeaRow | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const statement = asString(record.statement).trim();
  const whyMatters = asString(record.whyMatters).trim();
  const evidenceMap = normalizeEvidenceMap(record.evidenceMap);

  if (!statement && !whyMatters && !evidenceMapHasContent(evidenceMap)) {
    return null;
  }

  return {
    statement,
    whyMatters,
    clusterId: asString(record.clusterId).trim() || null,
    patternId: asString(record.patternId).trim() || null,
    evidenceMap,
    createdAt: asString(record.createdAt).trim() || null,
    updatedAt: asString(record.updatedAt).trim() || null,
  };
}

export async function getModule3IdeaAdmin({ userEmail }: { userEmail: string }) {
  const res = await getStudentBucketsAdmin({ userEmail, module: MODULE_NUMBER });
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
  const existingRes = await getStudentBucketsAdmin({ userEmail, module: MODULE_NUMBER });
  if (existingRes.error) return { data: null, error: existingRes.error };
  const existing = existingRes.data ?? null;

  const existingFlowState = (existing?.flow_state ?? null) as StudentBucketFlowState | null;
  const nextFlowState: StudentBucketFlowState = {
    ...(existingFlowState || {}),
    module3Idea: idea,
  };

  if (!idea) {
    delete nextFlowState.module3Idea;
  }

  return upsertStudentBucketsAdmin({
    userEmail,
    module: MODULE_NUMBER,
    buckets: existing?.buckets ?? [],
    reflection: existing?.reflection ?? null,
    flow_state: nextFlowState,
  });
}
