/**
 * WP-090 — Development-only gate for generalized vocabulary transfer lessons.
 * All six canonical VOCABULARY_TERMS ids; production unchanged.
 */

import { VOCABULARY_TERMS } from "../module1/vocabularyTermHelpers.js";

const CANONICAL_IDS = new Set(VOCABULARY_TERMS.map((t) => t.id));

export function isVocabularyTransferLessonDevEnabled() {
  return process.env.NODE_ENV === "development";
}

/**
 * True when the active vocabulary term should use the transfer slice.
 * @param {{ termId?: string|null, termIndex?: number|null }} [input]
 */
export function isVocabularyTransferLessonEnabled(input = {}) {
  if (!isVocabularyTransferLessonDevEnabled()) return false;

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
