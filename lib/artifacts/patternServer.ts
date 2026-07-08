import {
  getModule3PatternsAdmin,
  upsertModule3PatternsAdmin,
  type Module3PatternRow,
} from "@/lib/supabase/helpers/module3Patterns";

function nowIso() {
  return new Date().toISOString();
}

function uniqueOrdered(ids: string[] | undefined | null) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids || []) {
    if (typeof id !== "string") continue;
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export type PatternWriteInput = {
  id: string;
  userEmail: string;
  text: string;
  evidenceIds: string[];
  isSelected?: boolean;
};

function mergePattern(existing: Module3PatternRow[], input: PatternWriteInput) {
  const timestamp = nowIso();
  const nextPatterns = (existing ?? []).map((pattern) => {
    if (pattern.id !== input.id) return pattern;
    return {
      ...pattern,
      text: input.text,
      evidenceIds: uniqueOrdered(input.evidenceIds),
      updatedAt: timestamp,
    };
  });

  const exists = (existing ?? []).some((pattern) => pattern.id === input.id);
  if (!exists) {
    nextPatterns.push({
      id: input.id,
      text: input.text,
      evidenceIds: uniqueOrdered(input.evidenceIds),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return nextPatterns;
}

export async function upsertPatternForUser(input: PatternWriteInput) {
  const res = await getModule3PatternsAdmin({ userEmail: input.userEmail });
  if (res.error) return { ok: false as const, error: res.error };

  const nextPatterns = mergePattern(res.patterns ?? [], input);
  const nextSelectedPatternId = input.isSelected ? input.id : res.selectedPatternId;

  const writeRes = await upsertModule3PatternsAdmin({
    userEmail: input.userEmail,
    patterns: nextPatterns,
    selectedPatternId: nextSelectedPatternId ?? null,
  });

  if (writeRes.error) return { ok: false as const, error: writeRes.error };
  return { ok: true as const };
}

export async function selectPatternForUser({
  userEmail,
  patternId,
}: {
  userEmail: string;
  patternId: string;
}) {
  const res = await getModule3PatternsAdmin({ userEmail });
  if (res.error) return { ok: false as const, error: res.error };

  const writeRes = await upsertModule3PatternsAdmin({
    userEmail,
    patterns: res.patterns ?? [],
    selectedPatternId: patternId,
  });

  if (writeRes.error) return { ok: false as const, error: writeRes.error };
  return { ok: true as const };
}

export async function deletePatternForUser({
  userEmail,
  patternId,
}: {
  userEmail: string;
  patternId: string;
}) {
  const res = await getModule3PatternsAdmin({ userEmail });
  if (res.error) return { ok: false as const, error: res.error };

  const nextPatterns = (res.patterns ?? []).filter((pattern) => pattern.id !== patternId);
  const nextSelected =
    res.selectedPatternId === patternId ? null : res.selectedPatternId ?? null;

  const writeRes = await upsertModule3PatternsAdmin({
    userEmail,
    patterns: nextPatterns,
    selectedPatternId: nextSelected,
  });

  if (writeRes.error) return { ok: false as const, error: writeRes.error };
  return { ok: true as const };
}

export async function listPatternsForUser(userEmail: string) {
  const res = await getModule3PatternsAdmin({ userEmail });
  if (res.error) {
    return {
      ok: false as const,
      error: res.error,
      patterns: [] as Module3PatternRow[],
      selectedPatternId: null as string | null,
    };
  }

  return {
    ok: true as const,
    patterns: res.patterns ?? [],
    selectedPatternId: res.selectedPatternId ?? null,
  };
}

