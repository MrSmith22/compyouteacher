/**
 * WP-085 — Process-local cache for the resolved writing-spine mode.
 * Filled by WritingSpineProvider (client) or server loaders. Not student-writable.
 */

import {
  WRITING_SPINE_MODE_LEGACY,
  normalizeWritingSpineMode,
  resolveWritingSpineMode,
} from "./writingSpineRollout.js";

/** @type {"legacy"|"rebuilt"|null} */
let cachedMode = null;

/**
 * @param {unknown} mode
 */
export function setWritingSpineModeCache(mode) {
  cachedMode = normalizeWritingSpineMode(mode);
}

export function clearWritingSpineModeCache() {
  cachedMode = null;
}

/**
 * @returns {"legacy"|"rebuilt"|null}
 */
export function getWritingSpineModeCache() {
  return cachedMode;
}

/**
 * Effective mode for instructional gates.
 * Prefer env override, then cache (from API/provider), then:
 * - development DX default rebuilt (local Next before hydrate)
 * - production/test safe default legacy until authoritative hydrate
 * @returns {"legacy"|"rebuilt"}
 */
export function getEffectiveWritingSpineMode() {
  const override = normalizeWritingSpineMode(
    process.env.WRITING_SPINE_MODE_OVERRIDE
  );
  if (override) return override;
  if (cachedMode) return cachedMode;
  if (process.env.NODE_ENV === "development") {
    return resolveWritingSpineMode({ storedMode: "rebuilt" });
  }
  return WRITING_SPINE_MODE_LEGACY;
}
