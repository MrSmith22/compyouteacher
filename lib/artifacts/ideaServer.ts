import {
  evidenceMapHasContent,
  getModule3IdeaAdmin,
  normalizeEvidenceMap,
  upsertModule3IdeaAdmin,
  type Module3EvidenceMap,
  type Module3IdeaRow,
} from "@/lib/supabase/helpers/module3Ideas";

function nowIso() {
  return new Date().toISOString();
}

export type IdeaWriteInput = {
  userEmail: string;
  statement?: string;
  whyMatters?: string;
  clusterId?: string | null;
  patternId?: string | null;
  evidenceMap?: Module3EvidenceMap | null;
};

function isEmptyIdea(idea: Module3IdeaRow) {
  return (
    !idea.statement.trim() &&
    !idea.whyMatters.trim() &&
    !evidenceMapHasContent(idea.evidenceMap)
  );
}

function buildIdeaRow(input: IdeaWriteInput, existing: Module3IdeaRow | null): Module3IdeaRow {
  const timestamp = nowIso();
  const statement =
    input.statement !== undefined ? input.statement.trim() : (existing?.statement ?? "");
  const whyMatters =
    input.whyMatters !== undefined ? input.whyMatters.trim() : (existing?.whyMatters ?? "");
  const evidenceMap =
    input.evidenceMap !== undefined
      ? normalizeEvidenceMap(input.evidenceMap)
      : normalizeEvidenceMap(existing?.evidenceMap);

  return {
    statement,
    whyMatters,
    clusterId:
      input.clusterId !== undefined ? input.clusterId ?? null : existing?.clusterId ?? null,
    patternId:
      input.patternId !== undefined ? input.patternId ?? null : existing?.patternId ?? null,
    evidenceMap,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
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
