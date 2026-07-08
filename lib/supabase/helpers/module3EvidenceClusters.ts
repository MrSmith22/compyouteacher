import { getStudentBuckets, getStudentBucketsAdmin } from "@/lib/supabase/helpers/studentBuckets";
import { asStringArray, asTrimmedString } from "@/lib/parsing/coerce";
import { readRowRefIds } from "@/lib/module3/rowMetadata";
import { MODULE3_NUMBER } from "@/lib/supabase/helpers/module3Constants";
import {
  upsertModule3BucketsColumnAdmin,
  upsertModule3BucketsColumnClient,
} from "@/lib/supabase/helpers/module3Buckets";

export type EvidenceClusterRow = {
  id: string;
  name: string;
  reflection?: string | null;
  evidenceIds: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

function asCluster(value: unknown): EvidenceClusterRow | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = asTrimmedString(record.id);
  const name = asTrimmedString(record.name);
  const evidenceIds = asStringArray(record.evidenceIds);

  if (!id || !name) return null;

  return {
    id,
    name,
    reflection: asTrimmedString(record.reflection) || null,
    evidenceIds,
    ...readRowRefIds(record),
  };
}

function normalizeClusters(value: unknown): EvidenceClusterRow[] {
  if (!Array.isArray(value)) return [];
  return value.map(asCluster).filter(Boolean) as EvidenceClusterRow[];
}

function readClustersFromBucketRow(
  row: { buckets?: unknown } | null | undefined
): EvidenceClusterRow[] {
  return normalizeClusters(row?.buckets);
}

export async function getModule3EvidenceClusters({
  userEmail,
}: {
  userEmail: string;
}): Promise<{ data: EvidenceClusterRow[]; error: { message?: string } | null }> {
  const res = await getStudentBuckets({ userEmail, module: MODULE3_NUMBER });
  if (res.error) return { data: [], error: res.error };
  const clusters = readClustersFromBucketRow(res.data);
  return { data: clusters, error: null };
}

/** Same projection as {@link getModule3EvidenceClusters}; uses the service role for server-side loads. */
export async function getModule3EvidenceClustersAdmin({
  userEmail,
}: {
  userEmail: string;
}): Promise<{ data: EvidenceClusterRow[]; error: { message?: string } | null }> {
  const res = await getStudentBucketsAdmin({ userEmail, module: MODULE3_NUMBER });
  if (res.error) return { data: [], error: res.error };
  const clusters = readClustersFromBucketRow(res.data);
  return { data: clusters, error: null };
}

export async function upsertModule3EvidenceClusters({
  userEmail,
  clusters,
}: {
  userEmail: string;
  clusters: EvidenceClusterRow[];
}) {
  return upsertModule3BucketsColumnClient({ userEmail, buckets: clusters });
}

/** Same write as {@link upsertModule3EvidenceClusters}; uses the service role for server-side routes. */
export async function upsertModule3EvidenceClustersAdmin({
  userEmail,
  clusters,
}: {
  userEmail: string;
  clusters: EvidenceClusterRow[];
}) {
  return upsertModule3BucketsColumnAdmin({ userEmail, buckets: clusters });
}
