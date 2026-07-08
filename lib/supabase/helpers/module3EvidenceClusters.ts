import { getStudentBuckets, upsertStudentBuckets } from "@/lib/supabase/helpers/studentBuckets";

export type EvidenceClusterRow = {
  id: string;
  name: string;
  reflection?: string | null;
  evidenceIds: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

const MODULE_NUMBER = 3;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item).trim()).filter(Boolean);
}

function asCluster(value: unknown): EvidenceClusterRow | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = asString(record.id).trim();
  const name = asString(record.name).trim();
  const evidenceIds = asStringArray(record.evidenceIds);

  if (!id || !name) return null;

  return {
    id,
    name,
    reflection: asString(record.reflection).trim() || null,
    evidenceIds,
    createdAt: asString(record.createdAt).trim() || null,
    updatedAt: asString(record.updatedAt).trim() || null,
  };
}

function normalizeClusters(value: unknown): EvidenceClusterRow[] {
  if (!Array.isArray(value)) return [];
  return value.map(asCluster).filter(Boolean) as EvidenceClusterRow[];
}

export async function getModule3EvidenceClusters({
  userEmail,
}: {
  userEmail: string;
}): Promise<{ data: EvidenceClusterRow[]; error: { message?: string } | null }> {
  const res = await getStudentBuckets({ userEmail, module: MODULE_NUMBER });
  if (res.error) return { data: [], error: res.error };
  const clusters = normalizeClusters(res.data?.buckets);
  return { data: clusters, error: null };
}

export async function upsertModule3EvidenceClusters({
  userEmail,
  clusters,
}: {
  userEmail: string;
  clusters: EvidenceClusterRow[];
}) {
  return upsertStudentBuckets({
    userEmail,
    module: MODULE_NUMBER,
    buckets: clusters,
    reflection: null,
    flow_state: null,
  });
}

