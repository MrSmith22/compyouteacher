import type { StudentBucketFlowState } from "@/lib/supabase/helpers/studentBuckets";
import { asString, asTrimmedString } from "@/lib/parsing/coerce";
import { readRowRefIds } from "@/lib/module3/rowMetadata";
import {
  getModule3StudentBucketAdmin,
  upsertModule3ScalarFlowStateAdmin,
} from "@/lib/supabase/helpers/module3FlowState";

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

const DEFAULT_RELATION = "supports";

function asEvidenceMapEntry(value: unknown): Module3EvidenceMapEntry | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const relation = asTrimmedString(record.relation) || DEFAULT_RELATION;

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
    const evidenceId = asTrimmedString(key);
    if (!evidenceId) continue;
    const normalized = asEvidenceMapEntry(entry);
    if (normalized) out[evidenceId] = normalized;
  }
  return out;
}

export function evidenceMapHasContent(map: Module3EvidenceMap | undefined | null) {
  if (!map) return false;
  return Object.values(map).some(
    (entry) => entry.selected || asTrimmedString(entry.note).length > 0
  );
}

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
