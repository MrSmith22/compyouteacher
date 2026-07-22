/**
 * WP-091 — Authoritative Module 1 vocabulary-transfer rollout resolver.
 * Independent from writing_spine_mode and evidence_argument_mode.
 *
 * Modes:
 * - rebuilt: accepted WP-089/WP-090 transfer lessons
 * - legacy: pre-rebuild definition-heavy vocabulary presentation
 *
 * Resolution order:
 * 1. VOCABULARY_TRANSFER_MODE_OVERRIDE env (ops emergency)
 * 2. Stored assignment_settings.vocabulary_transfer_mode
 * 3. Safe default: legacy
 */

export const VOCABULARY_TRANSFER_MODES = Object.freeze(["legacy", "rebuilt"]);

export const VOCABULARY_TRANSFER_MODE_LEGACY = "legacy";
export const VOCABULARY_TRANSFER_MODE_REBUILT = "rebuilt";

const DEFAULT_ASSIGNMENT_ID = "mlk-rhetorical-analysis";

/**
 * @param {unknown} value
 * @returns {"legacy"|"rebuilt"|null}
 */
export function normalizeVocabularyTransferMode(value) {
  const mode = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (
    mode === VOCABULARY_TRANSFER_MODE_LEGACY ||
    mode === VOCABULARY_TRANSFER_MODE_REBUILT
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
export function resolveVocabularyTransferMode(input = {}) {
  const envOverride = normalizeVocabularyTransferMode(
    input.envOverride != null
      ? input.envOverride
      : typeof process !== "undefined"
        ? process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE
        : null
  );
  if (envOverride) return envOverride;

  const stored = normalizeVocabularyTransferMode(input.storedMode);
  if (stored) return stored;

  return VOCABULARY_TRANSFER_MODE_LEGACY;
}

/**
 * @param {"legacy"|"rebuilt"|null|undefined} mode
 */
export function isRebuiltVocabularyTransfer(mode) {
  return (
    normalizeVocabularyTransferMode(mode) === VOCABULARY_TRANSFER_MODE_REBUILT
  );
}

/**
 * @param {unknown} raw
 */
export function validateVocabularyTransferMode(raw) {
  const mode = normalizeVocabularyTransferMode(raw);
  if (!mode) {
    return {
      ok: false,
      error: 'vocabulary_transfer_mode must be "legacy" or "rebuilt".',
    };
  }
  return { ok: true, mode };
}

/**
 * @param {"legacy"|"rebuilt"} mode
 */
export function vocabularyTransferCapabilities(mode) {
  const rebuilt = isRebuiltVocabularyTransfer(mode);
  return {
    mode: rebuilt
      ? VOCABULARY_TRANSFER_MODE_REBUILT
      : VOCABULARY_TRANSFER_MODE_LEGACY,
    vocabularyTransferLessons: rebuilt,
    sixConceptTransferPath: rebuilt,
  };
}

export {
  DEFAULT_ASSIGNMENT_ID as VOCABULARY_TRANSFER_ROLLOUT_DEFAULT_ASSIGNMENT_ID,
};
