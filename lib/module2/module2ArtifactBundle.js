/**
 * Module 2 versioned artifact bundle in student_buckets (module = 2).
 * No new remote table. Merges flow_state patches safely.
 */

export const MODULE2_ARTIFACT_MODULE = 2;
export const MODULE2_ARTIFACT_SCHEMA_VERSION = 1;

/**
 * @param {unknown} flowState
 */
export function readModule2ArtifactBundle(flowState) {
  const fs = flowState && typeof flowState === "object" ? flowState : {};
  const bundle =
    fs.module2Artifacts && typeof fs.module2Artifacts === "object"
      ? fs.module2Artifacts
      : {};

  return {
    schemaVersion:
      Number(bundle.schemaVersion) || MODULE2_ARTIFACT_SCHEMA_VERSION,
    rhetoricalSituationSummary: bundle.rhetoricalSituationSummary ?? null,
    matrixBundle: bundle.matrixBundle ?? null,
    updatedAt: bundle.updatedAt || null,
  };
}

/**
 * Merge patch into existing flow_state without wiping unrelated keys.
 * @param {unknown} existingFlowState
 * @param {Partial<{ rhetoricalSituationSummary: unknown, matrixBundle: unknown }>} patch
 */
export function mergeModule2ArtifactBundle(existingFlowState, patch = {}) {
  const existing = existingFlowState && typeof existingFlowState === "object"
    ? { ...existingFlowState }
    : {};
  const current = readModule2ArtifactBundle(existing);
  const nextArtifacts = {
    schemaVersion: MODULE2_ARTIFACT_SCHEMA_VERSION,
    rhetoricalSituationSummary:
      patch.rhetoricalSituationSummary !== undefined
        ? patch.rhetoricalSituationSummary
        : current.rhetoricalSituationSummary,
    matrixBundle:
      patch.matrixBundle !== undefined
        ? patch.matrixBundle
        : current.matrixBundle,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...existing,
    module2Artifacts: nextArtifacts,
  };
}

/**
 * Editing summary/matrix must not rewrite downstream claim/thesis keys on module 3.
 * Module 2 row is isolated by module number.
 */
export const MODULE2_BUNDLE_ISOLATED_FROM_MODULE3 = true;
