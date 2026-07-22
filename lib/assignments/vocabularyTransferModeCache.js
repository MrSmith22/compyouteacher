/**
 * WP-091 — Process-local cache for the resolved vocabulary-transfer mode.
 * Filled by WritingSpineProvider (client) or server loaders. Not student-writable.
 */

import {
  VOCABULARY_TRANSFER_MODE_LEGACY,
  normalizeVocabularyTransferMode,
  resolveVocabularyTransferMode,
} from "./vocabularyTransferRollout.js";

/** @type {"legacy"|"rebuilt"|null} */
let cachedMode = null;

/** @type {boolean} */
let hydrateFailed = false;

/**
 * @param {unknown} mode
 */
export function setVocabularyTransferModeCache(mode) {
  cachedMode = normalizeVocabularyTransferMode(mode);
  hydrateFailed = false;
}

export function clearVocabularyTransferModeCache() {
  cachedMode = null;
  hydrateFailed = false;
}

/**
 * @param {boolean} [failed]
 */
export function setVocabularyTransferHydrateFailed(failed = true) {
  hydrateFailed = Boolean(failed);
}

export function getVocabularyTransferHydrateFailed() {
  return hydrateFailed;
}

/**
 * @returns {"legacy"|"rebuilt"|null}
 */
export function getVocabularyTransferModeCache() {
  return cachedMode;
}

/**
 * Prefer env override, then cache, then:
 * - development DX default rebuilt (local Next before hydrate)
 * - production/test safe default legacy until authoritative hydrate
 * @returns {"legacy"|"rebuilt"}
 */
export function getEffectiveVocabularyTransferMode() {
  const override = normalizeVocabularyTransferMode(
    process.env.VOCABULARY_TRANSFER_MODE_OVERRIDE
  );
  if (override) return override;
  if (cachedMode) return cachedMode;
  if (process.env.NODE_ENV === "development") {
    return resolveVocabularyTransferMode({ storedMode: "rebuilt" });
  }
  return VOCABULARY_TRANSFER_MODE_LEGACY;
}
