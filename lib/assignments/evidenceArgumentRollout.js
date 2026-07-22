/**
 * WP-088 — Authoritative evidence-to-argument rollout resolver.
 * One decision shared by Modules 2–3 (pairing, staged flow, API, success).
 * Independent from writing_spine_mode so M2–3 rollback does not flip M4–7.
 *
 * Modes:
 * - rebuilt: accepted WP-086/WP-087 evidence-to-argument spine
 * - legacy: pre-rebuild Module 2–3 presentation (rollback / unknown assignments)
 *
 * Resolution order:
 * 1. EVIDENCE_ARGUMENT_MODE_OVERRIDE env (ops emergency)
 * 2. Stored assignment_settings.evidence_argument_mode
 * 3. Safe default: legacy
 */

export const EVIDENCE_ARGUMENT_MODES = Object.freeze(["legacy", "rebuilt"]);

export const EVIDENCE_ARGUMENT_MODE_LEGACY = "legacy";
export const EVIDENCE_ARGUMENT_MODE_REBUILT = "rebuilt";

const DEFAULT_ASSIGNMENT_ID = "mlk-rhetorical-analysis";

/**
 * @param {unknown} value
 * @returns {"legacy"|"rebuilt"|null}
 */
export function normalizeEvidenceArgumentMode(value) {
  const mode = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (
    mode === EVIDENCE_ARGUMENT_MODE_LEGACY ||
    mode === EVIDENCE_ARGUMENT_MODE_REBUILT
  ) {
    return mode;
  }
  return null;
}

/**
 * @param {{
 *   assignmentId?: string | null,
 *   storedMode?: unknown,
 *   envOverride?: unknown,
 * }} [input]
 * @returns {"legacy"|"rebuilt"}
 */
export function resolveEvidenceArgumentMode(input = {}) {
  const envOverride = normalizeEvidenceArgumentMode(
    input.envOverride != null
      ? input.envOverride
      : typeof process !== "undefined"
        ? process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE
        : null
  );
  if (envOverride) return envOverride;

  const stored = normalizeEvidenceArgumentMode(input.storedMode);
  if (stored) return stored;

  return EVIDENCE_ARGUMENT_MODE_LEGACY;
}

/**
 * @param {"legacy"|"rebuilt"|null|undefined} mode
 */
export function isRebuiltEvidenceArgument(mode) {
  return normalizeEvidenceArgumentMode(mode) === EVIDENCE_ARGUMENT_MODE_REBUILT;
}

/**
 * Validate a teacher/ops write for evidence_argument_mode.
 * @param {unknown} raw
 */
export function validateEvidenceArgumentMode(raw) {
  const mode = normalizeEvidenceArgumentMode(raw);
  if (!mode) {
    return {
      ok: false,
      error: 'evidence_argument_mode must be "legacy" or "rebuilt".',
    };
  }
  return { ok: true, mode };
}

/**
 * Capabilities derived from one resolved mode — shared by M2–M3.
 * @param {"legacy"|"rebuilt"} mode
 */
export function evidenceArgumentCapabilities(mode) {
  const rebuilt = isRebuiltEvidenceArgument(mode);
  return {
    mode: rebuilt
      ? EVIDENCE_ARGUMENT_MODE_REBUILT
      : EVIDENCE_ARGUMENT_MODE_LEGACY,
    evidenceArgumentSlice: rebuilt,
    module2EvidencePairing: rebuilt,
    module3StagedFlow: rebuilt,
    module3SuccessArgumentMap: rebuilt,
  };
}

export { DEFAULT_ASSIGNMENT_ID as EVIDENCE_ARGUMENT_ROLLOUT_DEFAULT_ASSIGNMENT_ID };
