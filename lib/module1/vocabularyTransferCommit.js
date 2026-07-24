/**
 * WP-104 — Pure next-state builder for vocabulary transfer lesson commits.
 * Kept outside the React component so updaters stay pure and tests can import it.
 */

import { normalizeTermTransferState } from "./vocabularyTransferState.js";

/**
 * @param {string} termId
 * @param {object} prev
 * @param {object} nextPatch
 * @param {{ advanceTo?: string | null, complete?: boolean }} [opts]
 */
export function buildVocabularyTransferNextState(
  termId,
  prev,
  nextPatch,
  { advanceTo = null, complete = false } = {}
) {
  return normalizeTermTransferState(termId, {
    ...prev,
    ...nextPatch,
    updatedAt: new Date().toISOString(),
    ...(advanceTo ? { currentStep: advanceTo } : {}),
    ...(complete ? { completed: true, assignmentTransferSeen: true } : {}),
  });
}
