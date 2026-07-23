/**
 * WP-101 — Beta matrix public exports.
 */

export {
  BETA_MATRIX_SCHEMA_VERSION,
  BETA_LAYERS,
  BETA_RESULTS,
  BETA_SEVERITIES,
  validateBetaManifest,
  validateBetaResults,
  evaluateSweepGate,
} from "./schema.js";
export {
  redactSensitiveText,
  safeExcerpt,
  redactEvidenceValue,
} from "./redaction.js";
export { BetaCleanupLedger } from "./cleanupLedger.js";
export {
  createBetaRunId,
  betaStudentEmail,
  betaTeacherEmail,
  isOwnedBetaEmail,
  BETA_FIXTURE_SOURCE,
  isRejectedBetaFixtureSource,
} from "./identities.js";
export {
  BETA_CONTRADICTION_FIXTURES,
  evaluateContradictionHonesty,
  getContradictionFixture,
  listContradictionFixtureIds,
} from "./contradictionFixtures.js";
export { buildArtifactTraceReport, shortHash } from "./artifactTrace.js";
export { buildBetaManifest, requiredScenarioIds } from "./buildManifest.js";
export { runPureMatrix, runScenario, RETURNING_BOUNDARY_MAP } from "./runMatrix.js";
