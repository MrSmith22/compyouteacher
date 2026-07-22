// @ts-nocheck
/**
 * WP-089 compat — maps legacy variants onto WP-090 vocabulary seed.
 */

import { seedVocabularyTransferLesson } from "@/lib/dev/seeds/seedVocabularyTransferLesson";

export { WP090_SEED_VARIANTS } from "@/lib/dev/seeds/seedVocabularyTransferLesson";

/** @deprecated Use WP090_SEED_VARIANTS — kept for WP-089 tests. */
export const WP089_SEED_VARIANTS = Object.freeze([
  "start",
  "kingApply",
  "paraphraseChanged",
]);

/**
 * @param {string} userEmail
 * @param {{ variant?: string }} [opts]
 */
export async function seedEthosTransferLesson(userEmail, opts = {}) {
  const map = {
    start: "partialAllSix",
    kingApply: "legacyEthosV1",
    paraphraseChanged: "paraphraseChanged",
  };
  const variant = map[opts.variant || "start"] || "partialAllSix";
  return seedVocabularyTransferLesson(userEmail, { variant });
}
