/**
 * WP-085 — Authoritative writing-spine rollout resolver.
 * One decision shared by Modules 4–7. Never student-controlled.
 *
 * Modes:
 * - rebuilt: accepted Phase 2 Modules 4–7 spine (WP-081–084)
 * - legacy: pre-rebuild presentation (rollback / unknown assignments)
 *
 * Resolution order:
 * 1. WRITING_SPINE_MODE_OVERRIDE env (ops emergency)
 * 2. Stored assignment_settings.writing_spine_mode
 * 3. Safe default: legacy
 */

export const WRITING_SPINE_MODES = Object.freeze(["legacy", "rebuilt"]);

export const WRITING_SPINE_MODE_LEGACY = "legacy";
export const WRITING_SPINE_MODE_REBUILT = "rebuilt";

const DEFAULT_ASSIGNMENT_ID = "mlk-rhetorical-analysis";

/**
 * @param {unknown} value
 * @returns {"legacy"|"rebuilt"|null}
 */
export function normalizeWritingSpineMode(value) {
  const mode = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (mode === WRITING_SPINE_MODE_LEGACY || mode === WRITING_SPINE_MODE_REBUILT) {
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
export function resolveWritingSpineMode(input = {}) {
  const envOverride = normalizeWritingSpineMode(
    input.envOverride != null
      ? input.envOverride
      : typeof process !== "undefined"
        ? process.env.WRITING_SPINE_MODE_OVERRIDE
        : null
  );
  if (envOverride) return envOverride;

  const stored = normalizeWritingSpineMode(input.storedMode);
  if (stored) return stored;

  return WRITING_SPINE_MODE_LEGACY;
}

/**
 * @param {"legacy"|"rebuilt"|null|undefined} mode
 */
export function isRebuiltWritingSpine(mode) {
  return normalizeWritingSpineMode(mode) === WRITING_SPINE_MODE_REBUILT;
}

/**
 * Validate a teacher/ops write for writing_spine_mode.
 * @param {unknown} raw
 */
export function validateWritingSpineMode(raw) {
  const mode = normalizeWritingSpineMode(raw);
  if (!mode) {
    return {
      ok: false,
      error: 'writing_spine_mode must be "legacy" or "rebuilt".',
    };
  }
  return { ok: true, mode };
}

/**
 * Capabilities derived from one resolved mode — shared by M4–M7.
 * @param {"legacy"|"rebuilt"} mode
 */
export function writingSpineCapabilities(mode) {
  const rebuilt = isRebuiltWritingSpine(mode);
  return {
    mode: rebuilt ? WRITING_SPINE_MODE_REBUILT : WRITING_SPINE_MODE_LEGACY,
    bodyParagraphVerticalSlice: rebuilt,
    sectionVerticalSlice: rebuilt,
    wholeEssayReview: rebuilt,
    essaySectionMapLabels: rebuilt,
  };
}

export { DEFAULT_ASSIGNMENT_ID as ROLLOUT_DEFAULT_ASSIGNMENT_ID };
