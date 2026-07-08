import { tchartEntryKey } from "@/lib/module4/mapStudentBucketsToOutline";

const APPEALS = ["ethos", "pathos", "logos"];

function normalizeAppeal(value) {
  const v = String(value ?? "").toLowerCase().trim();
  return APPEALS.includes(v) ? v : "";
}

function normalizeSourceType(value) {
  const v = String(value ?? "").toLowerCase().trim();
  if (v === "letter") return "letter";
  return "speech";
}

/**
 * Stable evidence key for bucket selection and save enrichment.
 */
export function evidenceRowKey(row) {
  if (row?.evidenceKey) return String(row.evidenceKey);
  return tchartEntryKey(row);
}

/**
 * Instructional thesis: artifact first, legacy `module3_responses` fallback.
 */
export function resolveInstructionalThesis({ thesisArtifact, initialModule3 }) {
  const artifactThesis =
    typeof thesisArtifact?.thesis === "string" ? thesisArtifact.thesis.trim() : "";
  const legacyThesis =
    typeof initialModule3?.thesis === "string" ? initialModule3.thesis.trim() : "";
  return artifactThesis || legacyThesis || "";
}

/**
 * Proof plan lines from the thesis artifact (Module 3 V2).
 */
export function resolveProofPlan(thesisArtifact) {
  if (!Array.isArray(thesisArtifact?.proofPlan)) return [];
  return thesisArtifact.proofPlan
    .map((line) => (typeof line === "string" ? line.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);
}

/**
 * Selected pattern from Module 3 V2 pattern artifacts.
 */
export function resolveSelectedPattern(patternArtifacts) {
  const list = Array.isArray(patternArtifacts) ? patternArtifacts : [];
  return list.find((p) => p?.isSelected) ?? null;
}

/**
 * Resolve the cluster id that should bound the default evidence pool.
 */
export function resolveSelectedClusterId({
  thesisClusterId,
  claimArtifact,
  ideaArtifact,
}) {
  const fromThesis =
    typeof thesisClusterId === "string" ? thesisClusterId.trim() : "";
  if (fromThesis) return fromThesis;

  const fromClaim =
    typeof claimArtifact?.clusterId === "string" ? claimArtifact.clusterId.trim() : "";
  if (fromClaim) return fromClaim;

  const fromIdea =
    typeof ideaArtifact?.clusterId === "string" ? ideaArtifact.clusterId.trim() : "";
  if (fromIdea) return fromIdea;

  return null;
}

function clusterLocalId(clusterArtifactId) {
  const id = String(clusterArtifactId ?? "");
  const parts = id.split(":");
  return parts.length ? parts[parts.length - 1] : id;
}

function findClusterArtifact(evidenceClusterArtifacts, clusterId) {
  if (!clusterId) return null;
  const list = Array.isArray(evidenceClusterArtifacts)
    ? evidenceClusterArtifacts
    : [];
  return (
    list.find((c) => clusterLocalId(c.id) === clusterId) ||
    list.find((c) => c.id === clusterId) ||
    null
  );
}

/**
 * Convert an Evidence Artifact into the tchart-like row shape Module 4 already uses.
 */
export function evidenceArtifactToRow(artifact) {
  if (!artifact?.id) return null;

  if (artifact.backingTable === "tchart_entries") {
    return {
      id: artifact.id,
      evidenceKey: artifact.id,
      type: normalizeSourceType(artifact.sourceType),
      category: normalizeAppeal(artifact.category),
      quote: artifact.quote ?? "",
      observation: artifact.studentObservation ?? "",
      letter_url: artifact.letterUrl ?? "",
    };
  }

  return {
    id: artifact.id,
    evidenceKey: artifact.id,
    type: normalizeSourceType(artifact.sourceType),
    category: normalizeAppeal(artifact.rhetoricalStrategy),
    quote: artifact.quote ?? "",
    observation: artifact.studentObservation ?? "",
    letter_url: "",
  };
}

function rowsEquivalent(a, b) {
  const keyA = evidenceRowKey(a);
  const keyB = evidenceRowKey(b);
  if (keyA && keyB && keyA === keyB) return true;

  const quoteA = String(a?.quote ?? "").trim();
  const quoteB = String(b?.quote ?? "").trim();
  const typeA = normalizeSourceType(a?.type);
  const typeB = normalizeSourceType(b?.type);
  return quoteA.length > 0 && quoteA === quoteB && typeA === typeB;
}

/**
 * Build the evidence pool for selection UI: artifacts first, cluster-bounded when possible,
 * legacy T-chart rows appended as compatibility fallback.
 */
export function buildModule4EvidencePool({
  evidenceArtifacts,
  evidenceClusterArtifacts,
  selectedClusterId,
  legacyTchartEntries,
}) {
  const artifactRows = (Array.isArray(evidenceArtifacts) ? evidenceArtifacts : [])
    .map(evidenceArtifactToRow)
    .filter(Boolean);

  let pool = artifactRows;

  const cluster = findClusterArtifact(evidenceClusterArtifacts, selectedClusterId);
  if (cluster && Array.isArray(cluster.evidenceIds) && cluster.evidenceIds.length > 0) {
    const idSet = new Set(cluster.evidenceIds);
    const bounded = artifactRows.filter((row) => idSet.has(row.evidenceKey));
    if (bounded.length > 0) {
      pool = bounded;
    }
  }

  if (pool.length === 0 && artifactRows.length > 0) {
    pool = artifactRows;
  }

  if (pool.length === 0) {
    pool = (Array.isArray(legacyTchartEntries) ? legacyTchartEntries : []).map((row) => ({
      ...row,
      evidenceKey: evidenceRowKey(row),
    }));
    return pool;
  }

  const merged = [...pool];
  for (const legacyRow of legacyTchartEntries || []) {
    const legacyWithKey = {
      ...legacyRow,
      evidenceKey: evidenceRowKey(legacyRow),
    };
    if (merged.some((row) => rowsEquivalent(row, legacyWithKey))) continue;
    merged.push(legacyWithKey);
  }

  return merged;
}

/**
 * Bucket suggestions from proof plan lines (preferred when present).
 */
export function buildProofPlanBucketSuggestions(proofPlan) {
  return proofPlan.map((line, index) => ({
    id: `proof-${index}`,
    label: line,
  }));
}

/**
 * Choose bucket suggestions: proof plan when available, otherwise legacy suggestions.
 */
export function resolveBucketSuggestions({
  proofPlan,
  legacySuggestions,
}) {
  if (Array.isArray(proofPlan) && proofPlan.length > 0) {
    return buildProofPlanBucketSuggestions(proofPlan);
  }
  return Array.isArray(legacySuggestions) ? legacySuggestions : [];
}

/**
 * Pattern label for essay-plan reference: Module 3 pattern text when available.
 */
export function resolvePatternPlanLabel({ selectedPattern, patternChoice }) {
  const text =
    typeof selectedPattern?.text === "string" ? selectedPattern.text.trim() : "";
  if (text) return text;

  const legacy = patternChoice != null ? String(patternChoice).trim() : "";
  if (!legacy) return "Not set yet";

  const map = {
    morally_responsible: "King presents himself as morally responsible",
    justice_leadership: "King connects himself to justice and leadership",
    trust_listen: "King builds trust so the audience will listen",
    unsure: "You are still exploring patterns",
  };
  return map[legacy] ?? "Not set yet";
}

/**
 * Evidence rows linked to a selected pattern (for lightweight review UI).
 */
export function patternReviewEvidenceRows(selectedPattern, evidencePool) {
  if (!selectedPattern || !Array.isArray(selectedPattern.evidenceIds)) return [];
  const idSet = new Set(selectedPattern.evidenceIds);
  return (evidencePool || []).filter((row) => idSet.has(evidenceRowKey(row)));
}
