import {
  evidenceMapHasContent,
  getModule3IdeaAdmin,
  resolveNextEvidenceMap,
  upsertModule3IdeaAdmin,
  type Module3EvidenceMap,
  type Module3IdeaRow,
} from "@/lib/supabase/helpers/module3Ideas";
import { mergeOptionalRef, mergeTimestamps } from "@/lib/artifacts/server/rowMerge";

export type IdeaWriteInput = {
  userEmail: string;
  statement?: string;
  whyMatters?: string;
  clusterId?: string | null;
  patternId?: string | null;
  evidenceMap?: Module3EvidenceMap | null;
  matrixProvenance?: Record<string, unknown> | null;
  matrixReview?: Record<string, unknown> | null;
};

function isEmptyIdea(idea: Module3IdeaRow) {
  return (
    !idea.statement.trim() &&
    !idea.whyMatters.trim() &&
    !evidenceMapHasContent(idea.evidenceMap)
  );
}

/** Exported for persistence regression tests. */
export function buildIdeaRow(
  input: IdeaWriteInput,
  existing: Module3IdeaRow | null
): Module3IdeaRow {
  const timestamps = mergeTimestamps(existing?.createdAt);
  const statement =
    input.statement !== undefined ? input.statement.trim() : (existing?.statement ?? "");
  const whyMatters =
    input.whyMatters !== undefined ? input.whyMatters.trim() : (existing?.whyMatters ?? "");
  const evidenceMap = resolveNextEvidenceMap(
    existing?.evidenceMap,
    input.evidenceMap === undefined ? undefined : input.evidenceMap
  );

  const row: Module3IdeaRow = {
    statement,
    whyMatters,
    clusterId: mergeOptionalRef(input.clusterId, existing?.clusterId ?? null),
    patternId: mergeOptionalRef(input.patternId, existing?.patternId ?? null),
    evidenceMap,
    ...timestamps,
  };

  if (input.matrixProvenance !== undefined) {
    row.matrixProvenance = input.matrixProvenance;
  } else if (existing?.matrixProvenance) {
    row.matrixProvenance = existing.matrixProvenance;
  }
  if (input.matrixReview !== undefined) {
    row.matrixReview = input.matrixReview;
  } else if (existing?.matrixReview) {
    row.matrixReview = existing.matrixReview;
  }

  return row;
}

export async function upsertIdeaForUser(input: IdeaWriteInput) {
  const res = await getModule3IdeaAdmin({ userEmail: input.userEmail });
  if (res.error) return { ok: false as const, error: res.error };

  const nextIdea = buildIdeaRow(input, res.idea);
  if (isEmptyIdea(nextIdea)) {
    return deleteIdeaForUser({ userEmail: input.userEmail });
  }

  const writeRes = await upsertModule3IdeaAdmin({
    userEmail: input.userEmail,
    idea: nextIdea,
  });

  if (writeRes.error) return { ok: false as const, error: writeRes.error };
  return { ok: true as const, idea: nextIdea };
}

export async function deleteIdeaForUser({ userEmail }: { userEmail: string }) {
  const writeRes = await upsertModule3IdeaAdmin({
    userEmail,
    idea: null,
  });

  if (writeRes.error) return { ok: false as const, error: writeRes.error };
  return { ok: true as const };
}

export async function getIdeaForUser(userEmail: string) {
  const res = await getModule3IdeaAdmin({ userEmail });
  if (res.error) {
    return { ok: false as const, error: res.error, idea: null as Module3IdeaRow | null };
  }

  return { ok: true as const, idea: res.idea };
}
