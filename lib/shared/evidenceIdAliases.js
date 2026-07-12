/**
 * Shared evidence ID alias helpers.
 * Bridges Module 3 working IDs and Artifact Engine IDs without changing stored values:
 * - guided:X ↔ evidence:observation:X
 * - tchart:type:category ↔ evidence:tchart:{email}:type:category
 */

function normalizeId(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

/**
 * Canonical Module 3 T-chart working ID: `tchart:{type}:{category}`.
 * Accepts:
 * - Module 3 form `tchart:speech:ethos`
 * - Artifact Engine `evidence:tchart:{email}:speech:ethos`
 * - Legacy Module 4 selection key `ethos|speech` (category|type)
 */
export function tchartCanonicalId(id) {
  const raw = normalizeId(id);
  if (!raw) return "";

  if (raw.startsWith("tchart:")) {
    return raw;
  }

  if (raw.startsWith("evidence:tchart:")) {
    // evidence:tchart:{email}:{type}:{category}
    const rest = raw.slice("evidence:tchart:".length);
    const parts = rest.split(":").filter(Boolean);
    if (parts.length >= 3) {
      const category = parts[parts.length - 1];
      const type = parts[parts.length - 2];
      return `tchart:${type}:${category}`;
    }
  }

  // Legacy Module 4 key from tchartEntryKey fallback: category|type
  const pipe = raw.match(/^([a-z]+)\|([a-z]+)$/i);
  if (pipe) {
    const category = pipe[1].toLowerCase();
    const type = pipe[2].toLowerCase();
    if (type && category) {
      return `tchart:${type}:${category}`;
    }
  }

  return "";
}

/**
 * Synthetic T-chart working ID from a Module 4 pool row's type + category.
 * Used when legacy rows keep numeric keys but still carry appeal/source fields.
 */
export function tchartCanonicalFromRow(row) {
  if (!row || typeof row !== "object") return "";
  const type = normalizeId(row.type || row.sourceType).toLowerCase();
  const category = normalizeId(row.category || row.rhetoricalStrategy).toLowerCase();
  if (!type || !category) return "";
  if (!["speech", "letter"].includes(type)) return "";
  if (!["ethos", "pathos", "logos"].includes(category) && category !== "note") {
    // Still allow other categories Module 3 may have stored
  }
  return `tchart:${type}:${category}`;
}

/**
 * Alias set for a single evidence ID.
 * Exact ID is always included. Cross-namespace aliases added when applicable.
 */
export function evidenceIdAliases(id) {
  const raw = normalizeId(id);
  const aliases = new Set();
  if (!raw) return aliases;
  aliases.add(raw);

  if (raw.startsWith("guided:")) {
    aliases.add(`evidence:observation:${raw.slice("guided:".length)}`);
  }
  if (raw.startsWith("evidence:observation:")) {
    aliases.add(`guided:${raw.slice("evidence:observation:".length)}`);
  }

  const tchart = tchartCanonicalId(raw);
  if (tchart) {
    aliases.add(tchart);
    const parts = tchart.split(":");
    if (parts.length === 3) {
      // category|type — legacy Module 4 evidenceKeys from tchartEntryKey
      aliases.add(`${parts[2]}|${parts[1]}`);
    }
  }

  return aliases;
}

export function evidenceIdsMatch(left, right) {
  const leftAliases = evidenceIdAliases(left);
  if (leftAliases.size === 0) return false;
  for (const alias of evidenceIdAliases(right)) {
    if (leftAliases.has(alias)) return true;
  }

  // Extra safety: compare T-chart canonical forms even if alias sets diverge
  // because evidence:tchart IDs embed an email that cannot be enumerated.
  const leftT = tchartCanonicalId(left);
  const rightT = tchartCanonicalId(right);
  if (leftT && rightT && leftT === rightT) return true;

  return false;
}

/** Expand a list of IDs with all aliases for Set membership checks. */
export function expandEvidenceIdSet(ids = []) {
  const out = new Set();
  for (const id of Array.isArray(ids) ? ids : []) {
    for (const alias of evidenceIdAliases(id)) {
      out.add(alias);
    }
  }
  return out;
}

export function evidenceIdInSet(id, expandedSet) {
  if (!(expandedSet instanceof Set) || expandedSet.size === 0) return false;
  for (const alias of evidenceIdAliases(id)) {
    if (expandedSet.has(alias)) return true;
  }

  const tchart = tchartCanonicalId(id);
  if (tchart && expandedSet.has(tchart)) return true;

  if (tchart) {
    for (const member of expandedSet) {
      if (tchartCanonicalId(member) === tchart) return true;
    }
  }

  return false;
}
