/**
 * WP-101 — Beta matrix schema validation (pure; no Zod dependency).
 */

export const BETA_MATRIX_SCHEMA_VERSION = "1.0.0";

export const BETA_LAYERS = Object.freeze([
  "pure",
  "api",
  "dev_browser",
  "prod_browser",
  "external",
]);

export const BETA_RESULTS = Object.freeze([
  "pass",
  "fail",
  "blocked",
  "not_applicable",
]);

export const BETA_SEVERITIES = Object.freeze([
  "Blocker",
  "Critical",
  "High",
  "Medium",
  "Low",
]);

export const BETA_EPICS = Object.freeze([
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "ops",
]);

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function validateBetaManifest(value) {
  const errors = [];
  if (!value || typeof value !== "object") {
    return ["manifest must be an object"];
  }
  const m = /** @type {Record<string, unknown>} */ (value);
  if (m.schemaVersion !== BETA_MATRIX_SCHEMA_VERSION) {
    errors.push(
      `schemaVersion must be ${BETA_MATRIX_SCHEMA_VERSION}, got ${String(m.schemaVersion)}`
    );
  }
  if (!Array.isArray(m.scenarios)) {
    errors.push("scenarios must be an array");
    return errors;
  }
  const ids = new Set();
  for (let i = 0; i < m.scenarios.length; i += 1) {
    const s = m.scenarios[i];
    const prefix = `scenarios[${i}]`;
    if (!s || typeof s !== "object") {
      errors.push(`${prefix} must be an object`);
      continue;
    }
    const sc = /** @type {Record<string, unknown>} */ (s);
    if (typeof sc.id !== "string" || !sc.id.trim()) {
      errors.push(`${prefix}.id required`);
    } else if (ids.has(sc.id)) {
      errors.push(`duplicate scenario id: ${sc.id}`);
    } else {
      ids.add(sc.id);
    }
    if (typeof sc.title !== "string" || !sc.title.trim()) {
      errors.push(`${prefix}.title required`);
    }
    if (!BETA_EPICS.includes(/** @type {string} */ (sc.epic))) {
      errors.push(`${prefix}.epic invalid`);
    }
    if (typeof sc.riskArea !== "string") {
      errors.push(`${prefix}.riskArea required`);
    }
    if (typeof sc.fixtureId !== "string") {
      errors.push(`${prefix}.fixtureId required`);
    }
    if (!BETA_LAYERS.includes(/** @type {string} */ (sc.layer))) {
      errors.push(`${prefix}.layer invalid`);
    }
    if (!Array.isArray(sc.modules)) {
      errors.push(`${prefix}.modules must be array`);
    }
    if (!Array.isArray(sc.stateFamilies)) {
      errors.push(`${prefix}.stateFamilies must be array`);
    }
    if (typeof sc.preconditions !== "string") {
      errors.push(`${prefix}.preconditions required`);
    }
    if (typeof sc.actions !== "string") {
      errors.push(`${prefix}.actions required`);
    }
    if (!sc.expected || typeof sc.expected !== "object") {
      errors.push(`${prefix}.expected object required`);
    }
    if (typeof sc.cleanup !== "string") {
      errors.push(`${prefix}.cleanup required`);
    }
    if (typeof sc.required !== "boolean") {
      errors.push(`${prefix}.required boolean required`);
    }
    if (!Array.isArray(sc.linkedIssues)) {
      errors.push(`${prefix}.linkedIssues must be array`);
    }
    if (
      sc.severityIfFailed != null &&
      !BETA_SEVERITIES.includes(/** @type {string} */ (sc.severityIfFailed))
    ) {
      errors.push(`${prefix}.severityIfFailed invalid`);
    }
  }
  return errors;
}

/**
 * @param {unknown} value
 * @param {{ requiredIds?: Set<string>|string[], buildCommit?: string }} [opts]
 * @returns {string[]}
 */
export function validateBetaResults(value, opts = {}) {
  const errors = [];
  if (!value || typeof value !== "object") {
    return ["results must be an object"];
  }
  const r = /** @type {Record<string, unknown>} */ (value);
  if (r.schemaVersion !== BETA_MATRIX_SCHEMA_VERSION) {
    errors.push(`results schemaVersion must be ${BETA_MATRIX_SCHEMA_VERSION}`);
  }
  if (typeof r.buildCommit !== "string" || !r.buildCommit.trim()) {
    errors.push("buildCommit required");
  }
  if (opts.buildCommit && r.buildCommit !== opts.buildCommit) {
    errors.push(
      `stale evidence: results.buildCommit ${String(r.buildCommit)} !== ${opts.buildCommit}`
    );
  }
  if (!Array.isArray(r.results)) {
    errors.push("results.results must be an array");
    return errors;
  }
  const seen = new Set();
  for (let i = 0; i < r.results.length; i += 1) {
    const row = r.results[i];
    const prefix = `results[${i}]`;
    if (!row || typeof row !== "object") {
      errors.push(`${prefix} must be object`);
      continue;
    }
    const rr = /** @type {Record<string, unknown>} */ (row);
    if (typeof rr.scenarioId !== "string") {
      errors.push(`${prefix}.scenarioId required`);
    } else if (seen.has(rr.scenarioId)) {
      errors.push(`duplicate result for ${rr.scenarioId}`);
    } else {
      seen.add(rr.scenarioId);
    }
    if (!BETA_RESULTS.includes(/** @type {string} */ (rr.result))) {
      errors.push(`${prefix}.result invalid`);
    }
    if (!Array.isArray(rr.evidence)) {
      errors.push(`${prefix}.evidence must be array`);
    }
    if (typeof rr.cleanupConfirmed !== "boolean") {
      errors.push(`${prefix}.cleanupConfirmed boolean required`);
    }
    if (typeof rr.timestamp !== "string") {
      errors.push(`${prefix}.timestamp required`);
    }
    if (
      rr.result === "pass" &&
      Array.isArray(rr.evidence) &&
      rr.evidence.length === 1 &&
      rr.evidence[0] &&
      typeof rr.evidence[0] === "object" &&
      /** @type {Record<string, unknown>} */ (rr.evidence[0]).kind === "screenshot" &&
      /** @type {Record<string, unknown>} */ (rr.evidence[0]).persistenceRequired === true
    ) {
      errors.push(
        `${prefix}: screenshot-only evidence cannot pass when persistence is required`
      );
    }
  }
  const requiredIds = opts.requiredIds
    ? opts.requiredIds instanceof Set
      ? opts.requiredIds
      : new Set(opts.requiredIds)
    : null;
  if (requiredIds) {
    for (const id of requiredIds) {
      if (!seen.has(id)) {
        errors.push(`missing result for required scenario: ${id}`);
      }
    }
  }
  return errors;
}

/**
 * Overall sweep fails when any required scenario is fail, blocked (if blocking),
 * missing, silently skipped, or cleanup unconfirmed on pass/fail.
 * @param {{ scenarios: Array<{ id: string, required?: boolean }> }} manifest
 * @param {{ results: Array<Record<string, unknown>>, buildCommit?: string }} resultsDoc
 * @param {{ buildCommit?: string, treatBlockedAsFail?: boolean }} [opts]
 */
export function evaluateSweepGate(manifest, resultsDoc, opts = {}) {
  const treatBlockedAsFail = opts.treatBlockedAsFail !== false;
  const byId = new Map(
    (resultsDoc.results || []).map((r) => [r.scenarioId, r])
  );
  /** @type {string[]} */
  const failures = [];
  for (const sc of manifest.scenarios || []) {
    if (!sc.required) continue;
    const row = byId.get(sc.id);
    if (!row) {
      failures.push(`${sc.id}: missing result`);
      continue;
    }
    if (row.result === "fail") {
      failures.push(`${sc.id}: fail`);
    } else if (row.result === "blocked" && treatBlockedAsFail) {
      failures.push(`${sc.id}: blocked`);
    }
    if (
      (row.result === "pass" || row.result === "fail") &&
      row.cleanupConfirmed !== true
    ) {
      failures.push(`${sc.id}: cleanup not confirmed`);
    }
    if (
      opts.buildCommit &&
      resultsDoc.buildCommit &&
      resultsDoc.buildCommit !== opts.buildCommit
    ) {
      failures.push(`${sc.id}: stale buildCommit`);
    }
  }
  return {
    ok: failures.length === 0,
    failures,
  };
}
