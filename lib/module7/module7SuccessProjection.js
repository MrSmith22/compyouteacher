/**
 * WP-095 — Pure Module 7 success evidence projection.
 * Presentation only — never writes drafts or invents submission.
 */

import {
  countEssayWords,
  resolveAuthoritativeEssayTextForCount,
} from "../essay/essayWordCount.js";

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {{
 *   module7?: { final_text?: unknown, full_text?: unknown, final_ready?: boolean } | null,
 *   module6?: { full_text?: unknown } | null,
 *   sectionCount?: number|null,
 *   wordExpectationLabel?: string|null,
 * }} input
 */
export function projectModule7SuccessEvidence(input = {}) {
  const resolved = resolveAuthoritativeEssayTextForCount({
    module7: input.module7,
    module6: input.module6,
  });
  const fromModule7 =
    resolved.source === "module7_final_text" ||
    resolved.source === "module7_full_text";
  const wordTotal = fromModule7 ? countEssayWords(resolved.text) : 0;
  const sectionCount =
    input.sectionCount != null && Number(input.sectionCount) > 0
      ? Number(input.sectionCount)
      : null;

  return Object.freeze({
    revisedEssaySaved: fromModule7 && Boolean(trimText(resolved.text)),
    essaySource: resolved.source,
    sectionCount,
    wordTotal: wordTotal > 0 ? wordTotal : null,
    wordExpectationLabel: trimText(input.wordExpectationLabel) || null,
  });
}
