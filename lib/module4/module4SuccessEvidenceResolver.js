/**
 * Server-side evidence slot resolver for Module 4 success.
 * Presentation only — does not write plans or artifacts.
 */

import { findSuccessClusterArtifact } from "../module3/moduleThreeSuccessHelpers.js";
import {
  deriveValidModule3ConnectionsByRowKey,
  resolveSavedEvidenceSlots,
} from "./module4EvidenceContinuity.js";
import {
  buildModule4EvidencePool,
  evidenceArtifactToRow,
  evidenceRowKey,
} from "./module4InstructionalLogic.js";

/**
 * Build a read-only evidence-slot resolver from Module 4 page / success load data.
 */
export function createModule4EvidenceSlotResolver({
  upstreamArtifacts = null,
  initialTchartEntries = [],
  ideaArtifact = null,
} = {}) {
  const upstream = upstreamArtifacts || {};
  const evidencePool = buildModule4EvidencePool({
    evidenceArtifacts: upstream.evidenceArtifacts,
    evidenceClusterArtifacts: upstream.evidenceClusterArtifacts,
    selectedClusterId: upstream.selectedClusterId,
    legacyTchartEntries: initialTchartEntries,
  });

  const cluster = findSuccessClusterArtifact(
    upstream.evidenceClusterArtifacts,
    upstream.selectedClusterId
  );
  const idea = ideaArtifact || upstream.ideaArtifact || null;
  const connectionsByRowKey = deriveValidModule3ConnectionsByRowKey({
    evidenceMap: idea?.evidenceMap,
    clusterEvidenceIds: Array.isArray(cluster?.evidenceIds)
      ? cluster.evidenceIds
      : [],
    evidencePool,
  });

  const artifactRows = (
    Array.isArray(upstream.evidenceArtifacts) ? upstream.evidenceArtifacts : []
  )
    .map(evidenceArtifactToRow)
    .filter(Boolean);
  const legacyRows = (
    Array.isArray(initialTchartEntries) ? initialTchartEntries : []
  ).map((row) => ({
    ...row,
    evidenceKey: evidenceRowKey(row),
  }));
  const seen = new Set();
  const lookupRows = [];
  for (const row of [...artifactRows, ...legacyRows]) {
    const key = evidenceRowKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    lookupRows.push(row);
  }

  return function getEvidenceSlots(bucket) {
    return resolveSavedEvidenceSlots({
      evidenceKeys: bucket?.evidenceKeys,
      evidenceSnippets: bucket?.evidenceSnippets,
      clusterPool: evidencePool,
      lookupRows,
      connectionsByRowKey,
    });
  };
}
