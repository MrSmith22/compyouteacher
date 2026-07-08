import {
  getModule3IdeaAdmin,
  upsertModule3IdeaAdmin,
  type Module3IdeaRow,
} from "@/lib/supabase/helpers/module3Ideas";

function nowIso() {
  return new Date().toISOString();
}

export type IdeaWriteInput = {
  userEmail: string;
  statement: string;
  whyMatters: string;
  clusterId?: string | null;
  patternId?: string | null;
};

function buildIdeaRow(input: IdeaWriteInput, existing: Module3IdeaRow | null): Module3IdeaRow {
  const timestamp = nowIso();
  const statement = input.statement.trim();
  const whyMatters = input.whyMatters.trim();

  if (!statement && !whyMatters) {
    return {
      statement: "",
      whyMatters: "",
      clusterId: input.clusterId ?? null,
      patternId: input.patternId ?? null,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
  }

  return {
    statement,
    whyMatters,
    clusterId: input.clusterId ?? null,
    patternId: input.patternId ?? null,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

export async function upsertIdeaForUser(input: IdeaWriteInput) {
  const res = await getModule3IdeaAdmin({ userEmail: input.userEmail });
  if (res.error) return { ok: false as const, error: res.error };

  const nextIdea = buildIdeaRow(input, res.idea);
  if (!nextIdea.statement && !nextIdea.whyMatters) {
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
