/**
 * WP-093 — Authoritative Modules 8–9 submission-protocol rollout resolver.
 * Independent from writing_spine_mode, evidence_argument_mode, and vocabulary_transfer_mode.
 *
 * Modes:
 * - rebuilt: accepted WP-092 guided APA / Doc-only Module 8–9 protocol
 * - legacy: pre-rebuild checklists, recognition quiz, and duplicate export ritual
 *
 * Resolution order:
 * 1. SUBMISSION_PROTOCOL_MODE_OVERRIDE env (ops emergency)
 * 2. Stored assignment_settings.submission_protocol_mode
 * 3. Safe default: legacy
 */

export const SUBMISSION_PROTOCOL_MODES = Object.freeze(["legacy", "rebuilt"]);

export const SUBMISSION_PROTOCOL_MODE_LEGACY = "legacy";
export const SUBMISSION_PROTOCOL_MODE_REBUILT = "rebuilt";

const DEFAULT_ASSIGNMENT_ID = "mlk-rhetorical-analysis";

/**
 * @param {unknown} value
 * @returns {"legacy"|"rebuilt"|null}
 */
export function normalizeSubmissionProtocolMode(value) {
  const mode = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (
    mode === SUBMISSION_PROTOCOL_MODE_LEGACY ||
    mode === SUBMISSION_PROTOCOL_MODE_REBUILT
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
export function resolveSubmissionProtocolMode(input = {}) {
  const envOverride = normalizeSubmissionProtocolMode(
    input.envOverride != null
      ? input.envOverride
      : typeof process !== "undefined"
        ? process.env.SUBMISSION_PROTOCOL_MODE_OVERRIDE
        : null
  );
  if (envOverride) return envOverride;

  const stored = normalizeSubmissionProtocolMode(input.storedMode);
  if (stored) return stored;

  return SUBMISSION_PROTOCOL_MODE_LEGACY;
}

/**
 * @param {"legacy"|"rebuilt"|null|undefined} mode
 */
export function isRebuiltSubmissionProtocol(mode) {
  return (
    normalizeSubmissionProtocolMode(mode) === SUBMISSION_PROTOCOL_MODE_REBUILT
  );
}

/**
 * @param {unknown} raw
 */
export function validateSubmissionProtocolMode(raw) {
  const mode = normalizeSubmissionProtocolMode(raw);
  if (!mode) {
    return {
      ok: false,
      error: 'submission_protocol_mode must be "legacy" or "rebuilt".',
    };
  }
  return { ok: true, mode };
}

/**
 * @param {"legacy"|"rebuilt"} mode
 */
export function submissionProtocolCapabilities(mode) {
  const rebuilt = isRebuiltSubmissionProtocol(mode);
  return {
    mode: rebuilt
      ? SUBMISSION_PROTOCOL_MODE_REBUILT
      : SUBMISSION_PROTOCOL_MODE_LEGACY,
    guidedApaProtocol: rebuilt,
    module8DocOnlyPath: rebuilt,
    module9GuidedFormattingMoves: rebuilt,
  };
}

export {
  DEFAULT_ASSIGNMENT_ID as SUBMISSION_PROTOCOL_ROLLOUT_DEFAULT_ASSIGNMENT_ID,
};
