/**
 * WP-088 — Evidence-to-argument instructional gate.
 * Authoritative mode comes from evidenceArgumentRollout (assignment settings + ops override).
 * Direction eligibility (canonical WP-079 frames + fully mapped custom) still applies.
 * Developer tooling stays NODE_ENV-gated elsewhere — not here.
 */

import { getEffectiveEvidenceArgumentMode } from "../assignments/evidenceArgumentModeCache.js";
import { isRebuiltEvidenceArgument } from "../assignments/evidenceArgumentRollout.js";
import {
  isCanonicalWp079OptionId,
  isFullyMappedCustom,
} from "../module2/evidenceArgumentDirectionDescriptor.js";

/** Fixture alias re-export for legacy WP-086 tests. */
export { WP086_REPRESENTATIVE_OPTION_ID } from "../artifacts/evidenceArgumentContract.js";

/**
 * True when the assignment rollout mode enables the rebuilt evidence-to-argument path.
 * @returns {boolean}
 */
export function isEvidenceToArgumentSliceModeEnabled() {
  return isRebuiltEvidenceArgument(getEffectiveEvidenceArgumentMode());
}

/**
 * @deprecated Use isEvidenceToArgumentSliceModeEnabled — kept as alias for clarity during migration.
 * @returns {boolean}
 */
export function isEvidenceToArgumentSliceDevEnabled() {
  return isEvidenceToArgumentSliceModeEnabled();
}

/**
 * True when the selected direction may use the gated Module 2→3 slice UX.
 * Requires rebuilt rollout mode PLUS a valid WP-079 canonical frame or fully mapped custom.
 * @param {{
 *   optionId?: string|null,
 *   selectedPattern?: { optionId?: string|null }|null,
 *   customMapping?: object|null,
 * }} [input]
 */
export function isEvidenceToArgumentSliceEnabled(input = {}) {
  if (!isEvidenceToArgumentSliceModeEnabled()) return false;
  const optionId =
    typeof input.optionId === "string"
      ? input.optionId.trim()
      : String(input.selectedPattern?.optionId || "").trim();
  if (!optionId) return false;

  if (optionId === "student_created") {
    return isFullyMappedCustom(input.customMapping);
  }

  // Canonical nine frames via WP-079 generator — no one-off enumerated list.
  return isCanonicalWp079OptionId(optionId);
}
