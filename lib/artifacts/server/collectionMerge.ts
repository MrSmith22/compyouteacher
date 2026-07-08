export function uniqueOrdered(ids: string[] | undefined | null): string[] {
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
