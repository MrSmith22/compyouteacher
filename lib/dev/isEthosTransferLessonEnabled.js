/**
 * WP-089 compat — ethos-only gate remains for legacy tests/callers.
 * ModuleOne uses isVocabularyTransferLessonEnabled (WP-090) for all six terms.
 */

export function isEthosTransferLessonDevEnabled() {
  return process.env.NODE_ENV === "development";
}

/**
 * True only for the ethos term under the development vocabulary gate.
 * @param {{ termId?: string|null, termIndex?: number|null }} [input]
 */
export function isEthosTransferLessonEnabled(input = {}) {
  if (!isEthosTransferLessonDevEnabled()) return false;
  const termId =
    typeof input.termId === "string" ? input.termId.trim() : "";
  if (termId) return termId === "ethos";
  if (typeof input.termIndex === "number") {
    return input.termIndex === 1;
  }
  return false;
}
