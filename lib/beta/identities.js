/**
 * WP-101 — Isolated beta test identities (dev auth only).
 */

/**
 * @param {string} [runId]
 */
export function createBetaRunId(runId) {
  if (runId && typeof runId === "string" && runId.trim()) {
    return runId.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  }
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${t}${r}`.slice(0, 16);
}

/**
 * @param {string} runId
 */
export function betaStudentEmail(runId) {
  return `beta-student-${runId}@localhost`;
}

/**
 * @param {string} runId
 */
export function betaTeacherEmail(runId) {
  return `beta-teacher-${runId}@localhost`;
}

/**
 * Never wipe unrelated accounts — only beta-*@localhost for this run.
 * @param {string} email
 * @param {string} runId
 */
export function isOwnedBetaEmail(email, runId) {
  const e = String(email || "")
    .trim()
    .toLowerCase();
  return (
    e === betaStudentEmail(runId).toLowerCase() ||
    e === betaTeacherEmail(runId).toLowerCase()
  );
}

export const BETA_FIXTURE_SOURCE = "beta_contradiction_fixtures";

/**
 * Production APIs must reject this source (same posture as teacher fixtures).
 * @param {string|null|undefined} source
 */
export function isRejectedBetaFixtureSource(source) {
  return source === "fixtures" || source === BETA_FIXTURE_SOURCE;
}
