/**
 * WP-093 — Process-local cache for the resolved submission-protocol mode.
 * Filled by WritingSpineProvider (client) or server loaders. Not student-writable.
 */

import {
  SUBMISSION_PROTOCOL_MODE_LEGACY,
  normalizeSubmissionProtocolMode,
  resolveSubmissionProtocolMode,
} from "./submissionProtocolRollout.js";

/** @type {"legacy"|"rebuilt"|null} */
let cachedMode = null;

/** @type {boolean} */
let hydrateFailed = false;

/**
 * @param {unknown} mode
 */
export function setSubmissionProtocolModeCache(mode) {
  cachedMode = normalizeSubmissionProtocolMode(mode);
  hydrateFailed = false;
}

export function clearSubmissionProtocolModeCache() {
  cachedMode = null;
  hydrateFailed = false;
}

/**
 * @param {boolean} [failed]
 */
export function setSubmissionProtocolHydrateFailed(failed = true) {
  hydrateFailed = Boolean(failed);
}

export function getSubmissionProtocolHydrateFailed() {
  return hydrateFailed;
}

/**
 * @returns {"legacy"|"rebuilt"|null}
 */
export function getSubmissionProtocolModeCache() {
  return cachedMode;
}

/**
 * Prefer env override, then cache, then:
 * - development DX default rebuilt (local Next before hydrate)
 * - production/test safe default legacy until authoritative hydrate
 * @returns {"legacy"|"rebuilt"}
 */
export function getEffectiveSubmissionProtocolMode() {
  const override = normalizeSubmissionProtocolMode(
    process.env.SUBMISSION_PROTOCOL_MODE_OVERRIDE
  );
  if (override) return override;
  if (cachedMode) return cachedMode;
  if (process.env.NODE_ENV === "development") {
    return resolveSubmissionProtocolMode({ storedMode: "rebuilt" });
  }
  return SUBMISSION_PROTOCOL_MODE_LEGACY;
}
