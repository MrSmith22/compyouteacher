/**
 * Module 4 evidence continuity — alias-aware pool bounding and
 * Module 3 CONNECT presentation for paragraph planning.
 *
 * Does not mutate Module 3 artifacts or change Module 4 persistence shapes.
 */

import {
  CONNECT_NOTE_MINIMUM,
  isValidExplainedConnection,
  relationLabelForStored,
} from "../module3/connectEvidenceHelpers.js";
import {
  evidenceIdAliases,
  evidenceIdInSet,
  evidenceIdsMatch,
  expandEvidenceIdSet,
  tchartCanonicalFromRow,
  tchartCanonicalId,
} from "../shared/evidenceIdAliases.js";

export {
  evidenceIdAliases,
  evidenceIdsMatch,
  expandEvidenceIdSet,
  tchartCanonicalFromRow,
  tchartCanonicalId,
  CONNECT_NOTE_MINIMUM,
};

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

/** Stable key for a Module 4 evidence pool row (matches evidenceRowKey). */
export function continuityEvidenceRowKey(row) {
  if (row?.evidenceKey) return String(row.evidenceKey);
  if (row?.id != null && String(row.id).length > 0) return String(row.id);
  return "";
}

/**
 * True when a pool row belongs to any cluster evidence ID (alias-aware).
 * Matches row keys and, for T-chart rows, type+category working IDs.
 */
export function evidenceRowMatchesClusterIds(
  rowKey,
  clusterEvidenceIds = [],
  row = null
) {
  const key = normalizeId(rowKey);
  const list = Array.isArray(clusterEvidenceIds) ? clusterEvidenceIds : [];
  if (list.length === 0) return false;

  if (key && list.some((clusterId) => evidenceIdsMatch(key, clusterId))) {
    return true;
  }

  const synthetic = tchartCanonicalFromRow(row);
  if (
    synthetic &&
    list.some((clusterId) => evidenceIdsMatch(synthetic, clusterId))
  ) {
    return true;
  }

  return false;
}

function warnClusterJoinMiss({ clusterEvidenceIds, artifactRows }) {
  if (typeof process === "undefined") return;
  if (process.env.NODE_ENV === "production") return;
  try {
    const sampleKeys = (Array.isArray(artifactRows) ? artifactRows : [])
      .slice(0, 8)
      .map((row) => continuityEvidenceRowKey(row));
    console.warn(
      "[module4EvidenceContinuity] Cluster evidence IDs did not match artifact rows; refusing to widen to the full library.",
      {
        clusterEvidenceIds,
        sampleArtifactKeys: sampleKeys,
      }
    );
  } catch {
    // never throw from diagnostics
  }
}

/**
 * Bound artifact rows to cluster IDs using alias matching.
 * Returns [] when no rows match (caller decides fallback).
 * Dedupes by evidenceRowKey.
 */
export function boundEvidenceRowsToCluster({
  artifactRows = [],
  clusterEvidenceIds = [],
} = {}) {
  const list = Array.isArray(artifactRows) ? artifactRows : [];
  const clusterIds = Array.isArray(clusterEvidenceIds)
    ? clusterEvidenceIds
    : [];
  if (clusterIds.length === 0) return [];

  const seen = new Set();
  const bounded = [];

  for (const row of list) {
    const key = continuityEvidenceRowKey(row);
    if (seen.has(key || JSON.stringify(row))) continue;
    if (!evidenceRowMatchesClusterIds(key, clusterIds, row)) continue;
    if (key) seen.add(key);
    else seen.add(JSON.stringify(row));
    bounded.push(row);
  }

  return bounded;
}

/**
 * Student-facing Module 3 connection presentation for one evidence row.
 * Returns null when the connection is missing or invalid.
 */
export function buildModule3ConnectionPresentation(entry) {
  if (!isValidExplainedConnection(entry)) {
    return null;
  }

  const relation =
    typeof entry?.relation === "string" ? entry.relation.trim() : "";
  const note = typeof entry?.note === "string" ? entry.note : "";

  return {
    valid: true,
    relation,
    relationLabel: relationLabelForStored(relation),
    note,
    heading: "Your Module 3 connection",
  };
}

/**
 * Derive valid CONNECT presentations keyed by Module 4 evidence row keys.
 * Only includes connections that are valid AND in the cluster (alias-aware).
 * Does not mutate evidenceMap.
 */
export function deriveValidModule3ConnectionsByRowKey({
  evidenceMap = {},
  clusterEvidenceIds = [],
  evidencePool = [],
} = {}) {
  const map =
    evidenceMap && typeof evidenceMap === "object" ? evidenceMap : {};
  const clusterIds = Array.isArray(clusterEvidenceIds)
    ? clusterEvidenceIds
    : [];
  const clusterSet = expandEvidenceIdSet(clusterIds);
  const pool = Array.isArray(evidencePool) ? evidencePool : [];

  /** @type {Map<string, ReturnType<typeof buildModule3ConnectionPresentation>>} */
  const byRowKey = new Map();

  for (const [mapId, entry] of Object.entries(map)) {
    const id = normalizeId(mapId);
    if (!id) continue;

    // Must belong to the working cluster
    if (clusterSet.size > 0 && !evidenceIdInSet(id, clusterSet)) {
      continue;
    }
    // If no cluster IDs, do not attach orphan-looking map entries to the pool
    if (clusterSet.size === 0) {
      continue;
    }

    const presentation = buildModule3ConnectionPresentation(entry);
    if (!presentation) continue;

    // Attach to every matching pool row key (usually one)
    let attached = false;
    for (const row of pool) {
      const rowKey = continuityEvidenceRowKey(row);
      const synthetic = tchartCanonicalFromRow(row);
      const matchesRow =
        (rowKey && evidenceIdsMatch(rowKey, id)) ||
        (synthetic && evidenceIdsMatch(synthetic, id));
      if (!matchesRow) continue;
      if (rowKey) {
        byRowKey.set(rowKey, presentation);
      }
      if (synthetic) {
        byRowKey.set(synthetic, presentation);
      }
      attached = true;
    }

    // If pool is empty / not yet built, still index under map id aliases
    // so callers can look up by either form later.
    if (!attached) {
      for (const alias of evidenceIdAliases(id)) {
        byRowKey.set(alias, presentation);
      }
    }
  }

  return byRowKey;
}

/**
 * Look up Module 3 connection presentation for a pool row / evidence key.
 */
export function getModule3ConnectionForEvidenceKey(
  connectionsByRowKey,
  evidenceKey
) {
  if (!connectionsByRowKey || typeof connectionsByRowKey.get !== "function") {
    return null;
  }
  const key = normalizeId(evidenceKey);
  if (!key) return null;

  const direct = connectionsByRowKey.get(key);
  if (direct) return direct;

  for (const alias of evidenceIdAliases(key)) {
    const hit = connectionsByRowKey.get(alias);
    if (hit) return hit;
  }

  // Scan map keys for alias match (small maps)
  for (const [mapKey, value] of connectionsByRowKey.entries()) {
    if (evidenceIdsMatch(mapKey, key)) return value;
  }

  return null;
}

/**
 * Enrich pool rows with optional module3Connection presentation (non-mutating).
 */
export function enrichEvidencePoolWithModule3Connections(
  evidencePool = [],
  connectionsByRowKey
) {
  const pool = Array.isArray(evidencePool) ? evidencePool : [];
  return pool.map((row) => {
    const key = continuityEvidenceRowKey(row);
    const module3Connection = getModule3ConnectionForEvidenceKey(
      connectionsByRowKey,
      key
    );
    return {
      ...row,
      module3Connection: module3Connection || null,
    };
  });
}

/**
 * Resolve which evidence rows Module 4 should show.
 * Prefer alias-aware cluster bound. When a cluster ID list is present,
 * never silently widen to the full corpus after a failed exact match —
 * try legacy rows with the same aliases, then keep the miss narrow.
 * Full artifact / legacy fallback only when no usable cluster IDs exist.
 * Does not mutate inputs. Dedupes by continuityEvidenceRowKey.
 */
export function resolveModule4EvidencePoolRows({
  artifactRows = [],
  clusterEvidenceIds = [],
  legacyRows = [],
} = {}) {
  const artifacts = Array.isArray(artifactRows) ? artifactRows : [];
  const legacy = Array.isArray(legacyRows) ? legacyRows : [];
  const clusterIds = Array.isArray(clusterEvidenceIds)
    ? clusterEvidenceIds
    : [];

  const dedupedArtifacts = [];
  const seen = new Set();
  for (const row of artifacts) {
    const key = continuityEvidenceRowKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    dedupedArtifacts.push(row);
  }

  if (clusterIds.length > 0) {
    const boundedArtifacts = boundEvidenceRowsToCluster({
      artifactRows: dedupedArtifacts,
      clusterEvidenceIds: clusterIds,
    });
    if (boundedArtifacts.length > 0) {
      return boundedArtifacts;
    }

    const boundedLegacy = boundEvidenceRowsToCluster({
      artifactRows: legacy,
      clusterEvidenceIds: clusterIds,
    });
    if (boundedLegacy.length > 0) {
      return boundedLegacy;
    }

    warnClusterJoinMiss({
      clusterEvidenceIds: clusterIds,
      artifactRows: dedupedArtifacts.length > 0 ? dedupedArtifacts : legacy,
    });
    // Usable cluster IDs were provided but nothing matched — keep empty
    // rather than widening to the entire Module 2 library.
    return [];
  }

  if (dedupedArtifacts.length > 0) {
    return dedupedArtifacts;
  }

  const legacyOut = [];
  const legacySeen = new Set();
  for (const row of legacy) {
    const key = continuityEvidenceRowKey(row);
    if (!key || legacySeen.has(key)) continue;
    legacySeen.add(key);
    legacyOut.push(row);
  }
  return legacyOut;
}

/**
 * Snapshot helper for mutation-guard tests.
 */
export function snapshotEvidenceMap(evidenceMap = {}) {
  return JSON.parse(JSON.stringify(evidenceMap || {}));
}

function snippetHasUsableContent(snippet) {
  if (!snippet || typeof snippet !== "object") return false;
  const quote = safeText(snippet.quote);
  const observation = safeText(snippet.observation);
  return Boolean(quote || observation);
}

function findRowByExactKey(rows, savedKey) {
  const key = normalizeId(savedKey);
  if (!key) return null;
  return (
    (Array.isArray(rows) ? rows : []).find(
      (row) => continuityEvidenceRowKey(row) === key
    ) || null
  );
}

function findRowByAlias(rows, savedKey) {
  const key = normalizeId(savedKey);
  if (!key) return null;
  return (
    (Array.isArray(rows) ? rows : []).find((row) => {
      const rowKey = continuityEvidenceRowKey(row);
      if (rowKey && evidenceIdsMatch(rowKey, key)) return true;
      const synthetic = tchartCanonicalFromRow(row);
      return Boolean(synthetic && evidenceIdsMatch(synthetic, key));
    }) || null
  );
}

/**
 * Unambiguous source + appeal match against lookup rows.
 * Returns null when zero or multiple rows share the same type+category.
 */
export function findRowByUnambiguousSourceAppeal(rows, savedKey) {
  const fromKey = tchartCanonicalId(savedKey);
  if (!fromKey) return null;
  const parts = fromKey.split(":");
  if (parts.length !== 3) return null;
  const type = parts[1];
  const category = parts[2];

  const matches = (Array.isArray(rows) ? rows : []).filter((row) => {
    const synthetic = tchartCanonicalFromRow(row);
    return (
      synthetic === fromKey ||
      (normalizeId(row?.type || row?.sourceType).toLowerCase() === type &&
        normalizeId(row?.category || row?.rhetoricalStrategy).toLowerCase() ===
          category)
    );
  });

  return matches.length === 1 ? matches[0] : null;
}

function rowInClusterPool(row, clusterPool) {
  if (!row) return false;
  const key = continuityEvidenceRowKey(row);
  const pool = Array.isArray(clusterPool) ? clusterPool : [];
  return pool.some((candidate) => {
    const candidateKey = continuityEvidenceRowKey(candidate);
    if (key && candidateKey && evidenceIdsMatch(key, candidateKey)) return true;
    const left = tchartCanonicalFromRow(row);
    const right = tchartCanonicalFromRow(candidate);
    return Boolean(left && right && left === right);
  });
}

/**
 * Resolve one saved paragraph evidence key for plan/reasoning display.
 *
 * Order:
 * 1. Exact key match in cluster pool, then lookup corpus
 * 2. Alias-aware match
 * 3. Unambiguous source + appeal match
 * 4. Denormalized evidenceSnippets fallback
 * 5. Missing / unlinked
 *
 * statuses:
 * - current: resolved inside the current cluster shelf
 * - preserved: outside cluster or snippet-only compatibility
 * - missing: no usable row or snippet
 */
export function resolveSavedEvidenceSlot({
  savedKey = "",
  snippet = null,
  clusterPool = [],
  lookupRows = [],
  connectionsByRowKey = null,
} = {}) {
  const key = normalizeId(savedKey);
  const cluster = Array.isArray(clusterPool) ? clusterPool : [];
  const lookup = Array.isArray(lookupRows) ? lookupRows : [];
  const corpus = [...cluster, ...lookup];

  let row =
    findRowByExactKey(cluster, key) ||
    findRowByExactKey(lookup, key) ||
    findRowByAlias(cluster, key) ||
    findRowByAlias(lookup, key) ||
    findRowByUnambiguousSourceAppeal(cluster, key) ||
    findRowByUnambiguousSourceAppeal(lookup, key);

  const inCluster = rowInClusterPool(row, cluster);
  const connection = row
    ? row.module3Connection ||
      getModule3ConnectionForEvidenceKey(
        connectionsByRowKey,
        continuityEvidenceRowKey(row)
      ) ||
      getModule3ConnectionForEvidenceKey(connectionsByRowKey, key)
    : getModule3ConnectionForEvidenceKey(connectionsByRowKey, key);

  if (row && inCluster) {
    return {
      savedKey: key,
      status: "current",
      row,
      quote: safeText(row.quote),
      observation: safeText(row.observation),
      module3Connection: connection || null,
      compatibilityLabel: null,
      countsTowardEvidenceGate: true,
      suppressDisplay: false,
    };
  }

  if (row && !inCluster) {
    return {
      savedKey: key,
      status: "preserved",
      row,
      quote: safeText(row.quote),
      observation: safeText(row.observation),
      module3Connection: null,
      compatibilityLabel:
        "Saved earlier — outside your current working evidence set",
      countsTowardEvidenceGate: true,
      suppressDisplay: false,
    };
  }

  if (snippetHasUsableContent(snippet)) {
    const typeFromKey = tchartCanonicalId(key);
    let type = "";
    let category = "";
    if (typeFromKey) {
      const parts = typeFromKey.split(":");
      type = parts[1] || "";
      category = parts[2] || "";
    }
    return {
      savedKey: key,
      status: "preserved",
      row: {
        evidenceKey: key,
        type,
        category,
        quote: snippet.quote || "",
        observation: snippet.observation || "",
        module3Connection: null,
      },
      quote: safeText(snippet.quote),
      observation: safeText(snippet.observation),
      module3Connection: null,
      compatibilityLabel:
        "Saved earlier — quote kept from your paragraph plan",
      countsTowardEvidenceGate: true,
      suppressDisplay: false,
    };
  }

  return {
    savedKey: key,
    status: "missing",
    row: null,
    quote: "",
    observation: "",
    module3Connection: null,
    compatibilityLabel: null,
    countsTowardEvidenceGate: false,
    suppressDisplay: false,
  };
}

/**
 * Resolve all saved keys for a paragraph bucket.
 * Duplicate missing keys only warn once.
 */
export function resolveSavedEvidenceSlots({
  evidenceKeys = [],
  evidenceSnippets = [],
  clusterPool = [],
  lookupRows = [],
  connectionsByRowKey = null,
} = {}) {
  const keys = Array.isArray(evidenceKeys) ? evidenceKeys : [];
  const snippets = Array.isArray(evidenceSnippets) ? evidenceSnippets : [];
  const seenMissing = new Set();
  const slots = [];

  for (let index = 0; index < keys.length; index += 1) {
    const slot = resolveSavedEvidenceSlot({
      savedKey: keys[index],
      snippet: snippets[index] || null,
      clusterPool,
      lookupRows,
      connectionsByRowKey,
    });

    if (slot.status === "missing") {
      if (seenMissing.has(slot.savedKey)) {
        slots.push({ ...slot, suppressDisplay: true });
        continue;
      }
      seenMissing.add(slot.savedKey);
    }

    slots.push(slot);
  }

  return slots;
}

/** True when a paragraph has at least one gate-qualifying evidence slot. */
export function bucketHasQualifyingEvidence(slots = []) {
  return (Array.isArray(slots) ? slots : []).some(
    (slot) => slot?.countsTowardEvidenceGate
  );
}

export { safeText };
