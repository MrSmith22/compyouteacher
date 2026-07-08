import {
  getModule3ThesisAdmin,
  upsertModule3ResponsesThesisAdmin,
  upsertModule3ThesisAdmin,
  type Module3ThesisRow,
} from "@/lib/supabase/helpers/module3Thesis";

function nowIso() {
  return new Date().toISOString();
}

export type ThesisWriteInput = {
  userEmail: string;
  thesis?: string;
  proofPlan?: string[];
  clusterId?: string | null;
  patternId?: string | null;
};

function normalizeProofPlan(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);
}

function isEmpty(thesis: Module3ThesisRow) {
  return !thesis.thesis.trim() && (thesis.proofPlan?.length ?? 0) === 0;
}

function buildThesisRow(
  input: ThesisWriteInput,
  existing: Module3ThesisRow | null
): Module3ThesisRow {
  const timestamp = nowIso();

  const thesis =
    input.thesis !== undefined ? input.thesis.trim() : existing?.thesis ?? "";

  const proofPlan =
    input.proofPlan !== undefined
      ? normalizeProofPlan(input.proofPlan)
      : existing?.proofPlan ?? [];

  return {
    thesis,
    proofPlan,
    clusterId:
      input.clusterId !== undefined
        ? input.clusterId ?? null
        : existing?.clusterId ?? null,
    patternId:
      input.patternId !== undefined
        ? input.patternId ?? null
        : existing?.patternId ?? null,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

export async function upsertThesisForUser(input: ThesisWriteInput) {
  const res = await getModule3ThesisAdmin({ userEmail: input.userEmail });
  if (res.error) return { ok: false as const, error: res.error };

  const next = buildThesisRow(input, res.thesis);
  if (isEmpty(next)) {
    return deleteThesisForUser({ userEmail: input.userEmail });
  }

  const writeRes = await upsertModule3ThesisAdmin({
    userEmail: input.userEmail,
    thesis: next,
  });
  if (writeRes.error) return { ok: false as const, error: writeRes.error };

  // Compatibility mirror: keep `module3_responses.thesis` up to date for Module 4.
  const compatRes = await upsertModule3ResponsesThesisAdmin({
    userEmail: input.userEmail,
    thesis: next.thesis.trim() ? next.thesis : null,
  });
  if (compatRes.error) return { ok: false as const, error: compatRes.error };

  return { ok: true as const, thesis: next };
}

export async function deleteThesisForUser({ userEmail }: { userEmail: string }) {
  const writeRes = await upsertModule3ThesisAdmin({ userEmail, thesis: null });
  if (writeRes.error) return { ok: false as const, error: writeRes.error };

  const compatRes = await upsertModule3ResponsesThesisAdmin({
    userEmail,
    thesis: null,
  });
  if (compatRes.error) return { ok: false as const, error: compatRes.error };

  return { ok: true as const };
}

export async function getThesisForUser(userEmail: string) {
  const res = await getModule3ThesisAdmin({ userEmail });
  if (res.error) {
    return {
      ok: false as const,
      error: res.error,
      thesis: null as Module3ThesisRow | null,
    };
  }
  return { ok: true as const, thesis: res.thesis };
}

