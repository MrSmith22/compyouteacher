/**
 * Pure helpers for Module 3 idea evidenceMap persistence.
 * Shared by the Supabase idea helper and regression tests.
 */

function asString(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function asTrimmedString(value) {
  return asString(value).trim();
}

const DEFAULT_RELATION = "supports";

function asEvidenceMapEntry(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value;
  const relation = asTrimmedString(record.relation) || DEFAULT_RELATION;

  return {
    selected: Boolean(record.selected),
    relation,
    note: asString(record.note),
  };
}

export function normalizeEvidenceMap(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const out = {};
  for (const [key, entry] of Object.entries(value)) {
    const evidenceId = asTrimmedString(key);
    if (!evidenceId) continue;
    const normalized = asEvidenceMapEntry(entry);
    if (normalized) out[evidenceId] = normalized;
  }
  return out;
}

export function evidenceMapHasContent(map) {
  if (!map) return false;
  return Object.values(map).some(
    (entry) => entry.selected || asTrimmedString(entry.note).length > 0
  );
}

/**
 * Resolve the next durable evidenceMap.
 * - undefined incoming → keep existing
 * - nonempty incoming → replace with normalized incoming
 * - empty incoming while existing has content → preserve existing
 */
export function resolveNextEvidenceMap(existing, incoming) {
  if (incoming === undefined) {
    return normalizeEvidenceMap(existing);
  }

  const next = normalizeEvidenceMap(incoming);
  const prev = normalizeEvidenceMap(existing);

  if (Object.keys(next).length === 0 && evidenceMapHasContent(prev)) {
    if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
      console.warn(
        "[module3Ideas] Ignoring empty evidenceMap write that would erase saved CONNECT notes."
      );
    }
    return prev;
  }

  return next;
}

/**
 * Build the next idea row fields relevant to persistence tests.
 * Mirrors ideaServer.buildIdeaRow merge rules for evidenceMap / refs.
 */
export function buildIdeaEvidenceState(input = {}, existing = null) {
  const statement =
    input.statement !== undefined
      ? String(input.statement).trim()
      : existing?.statement ?? "";
  const whyMatters =
    input.whyMatters !== undefined
      ? String(input.whyMatters).trim()
      : existing?.whyMatters ?? "";
  const evidenceMap = resolveNextEvidenceMap(
    existing?.evidenceMap,
    input.evidenceMap === undefined ? undefined : input.evidenceMap
  );
  const clusterId =
    input.clusterId !== undefined
      ? input.clusterId ?? null
      : existing?.clusterId ?? null;
  const patternId =
    input.patternId !== undefined
      ? input.patternId ?? null
      : existing?.patternId ?? null;

  return {
    statement,
    whyMatters,
    clusterId,
    patternId,
    evidenceMap,
  };
}
