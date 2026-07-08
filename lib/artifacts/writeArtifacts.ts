import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments";
import {
  getModule3EvidenceClusters,
  upsertModule3EvidenceClusters,
} from "@/lib/supabase/helpers/module3EvidenceClusters";

function nowIso() {
  return new Date().toISOString();
}

function uniqueOrdered(ids) {
  const seen = new Set();
  const out = [];
  for (const id of ids || []) {
    if (typeof id !== "string") continue;
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export type EvidenceClusterWriteInput = {
  id: string;
  assignmentId?: string;
  userEmail: string;
  clusterName: string;
  reflection?: string | null;
  evidenceIds: string[];
};

export async function upsertEvidenceClusterArtifact(input: EvidenceClusterWriteInput) {
  const assignmentId = input.assignmentId ?? DEFAULT_ASSIGNMENT_ID;
  const { data: existing, error } = await getModule3EvidenceClusters({
    userEmail: input.userEmail,
  });
  if (error) return { ok: false, error };

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
      assignmentId, // stored but ignored by reader if absent
    });
  }

  const writeRes = await upsertModule3EvidenceClusters({
    userEmail: input.userEmail,
    clusters: nextClusters,
  });

  if (writeRes.error) return { ok: false, error: writeRes.error };
  return { ok: true };
}

export async function deleteEvidenceClusterArtifact({
  userEmail,
  clusterId,
}: {
  userEmail: string;
  clusterId: string;
}) {
  const { data: existing, error } = await getModule3EvidenceClusters({ userEmail });
  if (error) return { ok: false, error };

  const nextClusters = (existing ?? []).filter((cluster) => cluster.id !== clusterId);
  const writeRes = await upsertModule3EvidenceClusters({
    userEmail,
    clusters: nextClusters,
  });
  if (writeRes.error) return { ok: false, error: writeRes.error };
  return { ok: true };
}

