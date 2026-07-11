/**
 * Pure phase model for Module 3 (Stage 1 of the shared-workspace plan).
 *
 * Maps durable saved artifacts onto the EXISTING step identifiers so the form
 * can open at the deepest phase the student's saved work supports. Runs once
 * at initial hydration; navigation owns the current phase afterward.
 *
 * These helpers never mutate their inputs and never delete or rewrite
 * artifacts. When context cannot be resolved safely they fall back to the
 * earliest screen where the student can make the missing choice.
 */

import { isValidExplainedConnection } from "./connectEvidenceHelpers.js";

export const MODULE_THREE_PHASES = {
  REVIEW: "review_evidence",
  PATTERNS: "notice_patterns",
  IDEA: "explore_idea",
  CONNECT: "connect_evidence",
  EVALUATE: "evaluate_strength",
  GATHER: "gather_more_evidence",
  CLAIM: "develop_claim",
  THESIS: "turn_claim_into_thesis",
};

const HYDRATION_CONNECT_MINIMUM = 2;

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

/** Reads an artifact payload whether the artifact is wrapped or flat. */
export function readArtifactPayload(artifact) {
  if (!artifact || typeof artifact !== "object") return null;
  const payload = artifact.payload || artifact;
  return payload && typeof payload === "object" ? payload : null;
}

/**
 * Persisted references may be raw IDs ("cluster-1") while loaded artifact IDs
 * are namespaced ("evidence_cluster:user@x:cluster-1"), or vice versa. The
 * namespacing is deterministic, so suffix-after-colon matching is exact — it
 * is derivation, not guessing.
 */
export function referenceMatchesId(reference, id) {
  const ref = normalizeId(reference);
  const candidate = normalizeId(id);
  if (!ref || !candidate) return false;
  if (ref === candidate) return true;
  if (candidate.endsWith(`:${ref}`)) return true;
  if (ref.endsWith(`:${candidate}`)) return true;
  return false;
}

/** Normalizes cluster artifacts the same way the form does. */
export function resolveClusterList(clusterArtifacts) {
  return (Array.isArray(clusterArtifacts) ? clusterArtifacts : [])
    .map((artifact) => {
      const payload = readArtifactPayload(artifact);
      if (!payload) return null;
      const id = normalizeId(artifact?.identity?.sourceId || payload.id);
      const name = safeText(payload.clusterName || payload.name);
      if (!id || !name) return null;
      const evidenceIds = Array.isArray(payload.evidenceIds)
        ? payload.evidenceIds.map(normalizeId).filter(Boolean)
        : [];
      return { id, name, evidenceIds };
    })
    .filter(Boolean);
}

/** Normalizes pattern artifacts the same way the form does. */
export function resolvePatternList(patternArtifacts) {
  return (Array.isArray(patternArtifacts) ? patternArtifacts : [])
    .map((artifact) => {
      const payload = readArtifactPayload(artifact);
      if (!payload) return null;
      const id = normalizeId(payload.id);
      if (!id) return null;
      const evidenceIds = Array.isArray(payload.evidenceIds)
        ? payload.evidenceIds.map(normalizeId).filter(Boolean)
        : [];
      return {
        id,
        text: typeof payload.text === "string" ? payload.text : "",
        evidenceIds,
        isSelected: Boolean(payload.isSelected),
      };
    })
    .filter(Boolean);
}

function findByReference(list, reference) {
  const ref = normalizeId(reference);
  if (!ref) return null;
  return list.find((item) => referenceMatchesId(ref, item.id)) || null;
}

/**
 * A cluster may be inferred from a pattern only when exactly one saved
 * cluster contains the pattern's entire valid quotation-ID set.
 * Multiple candidates means no guess.
 */
export function inferClusterForPattern(clusters, pattern) {
  if (!pattern || !Array.isArray(pattern.evidenceIds)) return null;
  const ids = pattern.evidenceIds.map(normalizeId).filter(Boolean);
  if (ids.length === 0) return null;

  const matches = (Array.isArray(clusters) ? clusters : []).filter((cluster) =>
    ids.every((id) => cluster.evidenceIds.includes(id))
  );
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Resolves the most reliable saved cluster and pattern context.
 *
 * Reference priority (per field, first valid match wins):
 * 1. thesis payload clusterId / patternId
 * 2. claim payload clusterId / patternId
 * 3. idea payload clusterId / patternId
 * 4. persisted selected pattern (isSelected)
 * 5. unique evidence-set inference for the cluster only
 *
 * Returned IDs are always IDs from the loaded artifact lists (the IDs the
 * form will actually use), never orphan references.
 */
export function resolveModuleThreeContext({
  clusterArtifacts = [],
  patternArtifacts = [],
  ideaArtifact = null,
  claimArtifact = null,
  thesisArtifact = null,
} = {}) {
  const clusters = resolveClusterList(clusterArtifacts);
  const patterns = resolvePatternList(patternArtifacts);

  const referenceSources = [
    ["thesis", readArtifactPayload(thesisArtifact)],
    ["claim", readArtifactPayload(claimArtifact)],
    ["idea", readArtifactPayload(ideaArtifact)],
  ];

  let cluster = null;
  let clusterSource = "";
  let pattern = null;
  let patternSource = "";

  for (const [sourceName, payload] of referenceSources) {
    if (!payload) continue;
    if (!cluster) {
      const match = findByReference(clusters, payload.clusterId);
      if (match) {
        cluster = match;
        clusterSource = sourceName;
      }
    }
    if (!pattern) {
      const match = findByReference(patterns, payload.patternId);
      if (match) {
        pattern = match;
        patternSource = sourceName;
      }
    }
  }

  if (!pattern) {
    const selected = patterns.find((item) => item.isSelected) || null;
    if (selected) {
      pattern = selected;
      patternSource = "selected_pattern";
    }
  }

  if (!cluster && pattern) {
    const inferred = inferClusterForPattern(clusters, pattern);
    if (inferred) {
      cluster = inferred;
      clusterSource = "evidence_set_inference";
    }
  }

  return {
    clusterId: cluster?.id || "",
    patternId: pattern?.id || "",
    cluster,
    pattern,
    clusterSource,
    patternSource,
    clusters,
    patterns,
  };
}

/**
 * Counts valid explained connections for hydration purposes.
 * - distinct quotation IDs count once;
 * - entries must pass the existing connection validation;
 * - when group context is available, only in-group IDs count
 *   (orphan IDs left in evidenceMap do not advance readiness).
 */
export function countValidHydrationConnections({
  ideaArtifact = null,
  cluster = null,
} = {}) {
  const payload = readArtifactPayload(ideaArtifact);
  const map = payload?.evidenceMap;
  if (!map || typeof map !== "object") return 0;

  const allowed =
    cluster && Array.isArray(cluster.evidenceIds) && cluster.evidenceIds.length > 0
      ? new Set(cluster.evidenceIds.map(normalizeId))
      : null;

  const counted = new Set();
  for (const [rawId, entry] of Object.entries(map)) {
    const id = normalizeId(rawId);
    if (!id || counted.has(id)) continue;
    if (allowed && !allowed.has(id)) continue;
    if (!isValidExplainedConnection(entry)) continue;
    counted.add(id);
  }
  return counted.size;
}

/**
 * Initial-phase decision table (durable saved work only; ephemeral evaluate
 * and gather state is intentionally not reconstructed):
 *
 * 1. Meaningful thesis            -> turn_claim_into_thesis
 * 2. Meaningful working claim     -> develop_claim
 * 3. Idea + >=2 valid connections -> evaluate_strength
 * 4. Idea, fewer connections      -> connect_evidence
 * 5. Resolved cluster + pattern   -> explore_idea
 * 6. Anything less                -> review_evidence
 */
export function getInitialModuleThreePhase({
  clusterArtifacts = [],
  patternArtifacts = [],
  ideaArtifact = null,
  claimArtifact = null,
  thesisArtifact = null,
} = {}) {
  const context = resolveModuleThreeContext({
    clusterArtifacts,
    patternArtifacts,
    ideaArtifact,
    claimArtifact,
    thesisArtifact,
  });

  const base = {
    clusterId: context.clusterId,
    patternId: context.patternId,
  };

  const thesis = readArtifactPayload(thesisArtifact);
  if (safeText(thesis?.thesis)) {
    return { phase: MODULE_THREE_PHASES.THESIS, ...base };
  }

  const claim = readArtifactPayload(claimArtifact);
  if (safeText(claim?.workingClaim)) {
    return { phase: MODULE_THREE_PHASES.CLAIM, ...base };
  }

  const idea = readArtifactPayload(ideaArtifact);
  if (safeText(idea?.statement)) {
    const validConnections = countValidHydrationConnections({
      ideaArtifact,
      cluster: context.cluster,
    });
    return {
      phase:
        validConnections >= HYDRATION_CONNECT_MINIMUM
          ? MODULE_THREE_PHASES.EVALUATE
          : MODULE_THREE_PHASES.CONNECT,
      ...base,
    };
  }

  if (context.clusterId && context.patternId) {
    return { phase: MODULE_THREE_PHASES.IDEA, ...base };
  }

  return { phase: MODULE_THREE_PHASES.REVIEW, ...base };
}

/** Maps every existing step ID to its artifact-chain stage. */
export function getArtifactChainStageForStep(stepId) {
  switch (stepId) {
    case MODULE_THREE_PHASES.REVIEW:
      return "group";
    case MODULE_THREE_PHASES.PATTERNS:
      return "pattern";
    case MODULE_THREE_PHASES.IDEA:
      return "idea";
    case MODULE_THREE_PHASES.CONNECT:
      return "connections";
    case MODULE_THREE_PHASES.EVALUATE:
    case MODULE_THREE_PHASES.GATHER:
      return "readiness";
    case MODULE_THREE_PHASES.CLAIM:
      return "claim";
    case MODULE_THREE_PHASES.THESIS:
      return "thesis";
    default:
      return "group";
  }
}
