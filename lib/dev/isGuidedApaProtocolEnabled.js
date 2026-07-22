/**
 * WP-093 — Modules 8–9 guided APA / submission-protocol instructional gate.
 * Authoritative mode comes from submissionProtocolRollout (assignment settings + ops override).
 * Developer tooling stays NODE_ENV-gated elsewhere — not here.
 */

import { getEffectiveSubmissionProtocolMode } from "../assignments/submissionProtocolModeCache.js";
import { isRebuiltSubmissionProtocol } from "../assignments/submissionProtocolRollout.js";

/**
 * True when the assignment rollout mode enables the rebuilt guided APA protocol.
 */
export function isGuidedApaProtocolModeEnabled() {
  return isRebuiltSubmissionProtocol(getEffectiveSubmissionProtocolMode());
}

/**
 * @deprecated Alias — instructional gate is rollout mode, not NODE_ENV.
 */
export function isGuidedApaProtocolDevEnabled() {
  return isGuidedApaProtocolModeEnabled();
}

/**
 * Alias used by Module 8 / Module 9 presentation branches.
 * @param {{ assignmentId?: string|null }} [input]
 */
export function isGuidedApaProtocolEnabled(_input = {}) {
  return isGuidedApaProtocolModeEnabled();
}
