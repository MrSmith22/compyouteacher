/**
 * WP-088 — Process-local cache for the resolved evidence-argument mode.
 * Filled by WritingSpineProvider (client) or server loaders. Not student-writable.
 */

import {
  EVIDENCE_ARGUMENT_MODE_LEGACY,
  normalizeEvidenceArgumentMode,
  resolveEvidenceArgumentMode,
} from "./evidenceArgumentRollout.js";

/** @type {"legacy"|"rebuilt"|null} */
let cachedMode = null;

/** @type {boolean} */
let hydrateFailed = false;

/**
 * @param {unknown} mode
 */
export function setEvidenceArgumentModeCache(mode) {
  cachedMode = normalizeEvidenceArgumentMode(mode);
  hydrateFailed = false;
}

export function clearEvidenceArgumentModeCache() {
  cachedMode = null;
  hydrateFailed = false;
}

/**
 * Mark that the authoritative hydrate failed (temporary DB/config error).
 * Gates should not silently invent a different instructional path.
 */
export function setEvidenceArgumentHydrateFailed(failed = true) {
  hydrateFailed = Boolean(failed);
}

export function getEvidenceArgumentHydrateFailed() {
  return hydrateFailed;
}

/**
 * @returns {"legacy"|"rebuilt"|null}
 */
export function getEvidenceArgumentModeCache() {
  return cachedMode;
}

/**
 * Effective mode for instructional gates.
 * Prefer env override, then cache (from API/provider), then:
 * - development DX default rebuilt (local Next before hydrate)
 * - production/test safe default legacy until authoritative hydrate
 * @returns {"legacy"|"rebuilt"}
 */
export function getEffectiveEvidenceArgumentMode() {
  const override = normalizeEvidenceArgumentMode(
    process.env.EVIDENCE_ARGUMENT_MODE_OVERRIDE
  );
  if (override) return override;
  if (cachedMode) return cachedMode;
  if (process.env.NODE_ENV === "development") {
    return resolveEvidenceArgumentMode({ storedMode: "rebuilt" });
  }
  return EVIDENCE_ARGUMENT_MODE_LEGACY;
}
