/**
 * WP-091 — Module 1 vocabulary-transfer instructional gate.
 * Authoritative mode comes from vocabularyTransferRollout (assignment settings + ops override).
 * Developer tooling stays NODE_ENV-gated elsewhere — not here.
 */

import { VOCABULARY_TERMS } from "../module1/vocabularyTermHelpers.js";
import { getEffectiveVocabularyTransferMode } from "../assignments/vocabularyTransferModeCache.js";
import { isRebuiltVocabularyTransfer } from "../assignments/vocabularyTransferRollout.js";

const CANONICAL_IDS = new Set(VOCABULARY_TERMS.map((t) => t.id));

/**
 * True when the assignment rollout mode enables rebuilt transfer lessons.
 */
export function isVocabularyTransferLessonModeEnabled() {
  return isRebuiltVocabularyTransfer(getEffectiveVocabularyTransferMode());
}

/**
 * @deprecated Alias — instructional gate is rollout mode, not NODE_ENV.
 */
export function isVocabularyTransferLessonDevEnabled() {
  return isVocabularyTransferLessonModeEnabled();
}

/**
 * True when the active vocabulary term should use the transfer slice.
 * @param {{ termId?: string|null, termIndex?: number|null }} [input]
 */
export function isVocabularyTransferLessonEnabled(input = {}) {
  if (!isVocabularyTransferLessonModeEnabled()) return false;

  const termId =
    typeof input.termId === "string" ? input.termId.trim() : "";
  if (termId) return CANONICAL_IDS.has(termId);

  if (typeof input.termIndex === "number") {
    const term = VOCABULARY_TERMS[input.termIndex];
    return Boolean(term && CANONICAL_IDS.has(term.id));
  }

  return false;
}

/** Safe fail for unknown/malformed ids. */
export function isKnownVocabularyTransferTermId(termId) {
  return CANONICAL_IDS.has(String(termId || "").trim());
}
