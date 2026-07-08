import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments";
import {
  getModule3EvidenceClustersAdmin,
  upsertModule3EvidenceClustersAdmin,
  type EvidenceClusterRow,
} from "@/lib/supabase/helpers/module3EvidenceClusters";
import { uniqueOrdered } from "@/lib/artifacts/server/collectionMerge";
import { nowIso } from "@/lib/parsing/time";

export type EvidenceClusterWriteInput = {
  id: string;
  assignmentId?: string;
  userEmail: string;
  clusterName: string;
  reflection?: string | null;
  evidenceIds: string[];
};

function mergeCluster(
  existing: EvidenceClusterRow[],
  input: EvidenceClusterWriteInput
): EvidenceClusterRow[] {
  const assignmentId = input.assignmentId ?? DEFAULT_ASSIGNMENT_ID;
  const timestamp = nowIso();
  const nextClusters = (existing ?? []).map((cluster) => {
    if (cluster.id !== input.id) return cluster;
    return {
      ...cluster,
      name: input.clusterName,
      reflection: input.reflection ?? null,
      evidenceIds: uniqueOrdered(input.evidenceIds),
      updatedAt: timestamp,
    };
  });

  const exists = (existing ?? []).some((cluster) => cluster.id === input.id);
  if (!exists) {
    nextClusters.push({
      id: input.id,
      name: input.clusterName,
      reflection: input.reflection ?? null,
      evidenceIds: uniqueOrdered(input.evidenceIds),
      createdAt: timestamp,
      updatedAt: timestamp,
      assignmentId,
    } as EvidenceClusterRow);
  }

  return nextClusters;
}

export async function upsertEvidenceClusterForUser(input: EvidenceClusterWriteInput) {
  const { data: existing, error } = await getModule3EvidenceClustersAdmin({
    userEmail: input.userEmail,
  });
  if (error) return { ok: false as const, error };

  const nextClusters = mergeCluster(existing ?? [], input);
  const writeRes = await upsertModule3EvidenceClustersAdmin({
    userEmail: input.userEmail,
    clusters: nextClusters,
  });

  if (writeRes.error) return { ok: false as const, error: writeRes.error };
  return { ok: true as const };
}

export async function deleteEvidenceClusterForUser({
  userEmail,
  clusterId,
}: {
  userEmail: string;
  clusterId: string;
}) {
  const { data: existing, error } = await getModule3EvidenceClustersAdmin({
    userEmail,
  });
  if (error) return { ok: false as const, error };

  const nextClusters = (existing ?? []).filter((cluster) => cluster.id !== clusterId);
  const writeRes = await upsertModule3EvidenceClustersAdmin({
    userEmail,
    clusters: nextClusters,
  });
  if (writeRes.error) return { ok: false as const, error: writeRes.error };
  return { ok: true as const };
}

export async function listEvidenceClustersForUser(userEmail: string) {
  const res = await getModule3EvidenceClustersAdmin({ userEmail });
  if (res.error) return { ok: false as const, error: res.error, clusters: [] as EvidenceClusterRow[] };
  return { ok: true as const, clusters: res.data ?? [] };
}
