/**
 * WP-095 — Pure Module 2 success evidence projection.
 * Presentation only — never writes artifacts or invents completion.
 */

import { isMatrixHandoffReady } from "./matrixOrchestrationHelpers.js";
import { readMatrixBundle } from "./rhetoricalMatrixHelpers.js";

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sourcesHaveBothWorks(sources) {
  if (!sources || typeof sources !== "object") return false;
  const speech = String(
    sources.speech_full_text ?? sources.mlk_text ?? ""
  ).trim();
  const letter = String(
    sources.letter_full_text ?? sources.lfbj_text ?? ""
  ).trim();
  return speech.length > 0 && letter.length > 0;
}

/**
 * @param {{
 *   sources?: object|null,
 *   matrixBundle?: object|null,
 *   speechTitle?: string|null,
 *   letterTitle?: string|null,
 * }} input
 */
export function projectModule2SuccessEvidence(input = {}) {
  const speechTitle = trimText(input.speechTitle) || "I Have a Dream";
  const letterTitle =
    trimText(input.letterTitle) || "Letter from Birmingham Jail";

  const sourcesReady = sourcesHaveBothWorks(input.sources);
  const bundle = readMatrixBundle(input.matrixBundle);
  const directionLabel = trimText(bundle?.selectedPattern?.label);
  const evidenceIds = Array.isArray(bundle?.selectedPattern?.evidenceIds)
    ? bundle.selectedPattern.evidenceIds.filter(Boolean)
    : [];
  const handoffReady = isMatrixHandoffReady(bundle);
  const bothWorksEvidence =
    handoffReady || evidenceIds.length >= 2 || Boolean(bundle?.selectedPattern);

  return Object.freeze({
    sourcesReady,
    speechTitle,
    letterTitle,
    directionLabel: directionLabel || null,
    bothWorksEvidence: Boolean(bothWorksEvidence && directionLabel),
    handoffReady,
  });
}
