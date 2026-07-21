/**
 * WP-082 — Deterministic conclusion health signals.
 * Flags only; never silently rewrite student prose.
 * Does not require transitions to another paragraph or body evidence presence.
 *
 * Confidence limits:
 * - verbatim thesis copy uses high similarity, not full paraphrase quality scoring
 * - "lists body points" looks for Body Paragraph / First/Second/Third patterns
 * - new-claim / new-evidence heuristics are advisory and low/medium confidence
 */

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeProse(text) {
  return safeText(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarityRatio(a, b) {
  const left = normalizeProse(a);
  const right = normalizeProse(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;
  if (longer.includes(shorter) && shorter.length / longer.length >= 0.85) {
    return shorter.length / longer.length;
  }
  return 0;
}

/**
 * @typedef {{ id: string, severity: "info"|"warn"|"error", message: string, confidence: "high"|"medium"|"low", locus?: string }} HealthSignal
 */

/**
 * @param {object} input
 * @returns {HealthSignal[]}
 */
export function diagnoseConclusionHealth(input = {}) {
  const signals = [];
  const prose = safeText(input.assembledProse);
  const thesis = safeText(input.thesis);
  const bodyPurposes = Array.isArray(input.bodyPurposes)
    ? input.bodyPurposes.map(safeText).filter(Boolean)
    : [];
  const upstreamStale = Boolean(input.upstreamStale);
  const wordCount = prose ? prose.split(/\s+/).filter(Boolean).length : 0;

  if (!prose || wordCount < 20) {
    signals.push({
      id: "underdevelopment",
      severity: "warn",
      message:
        "This conclusion looks too short to return to the argument and end purposefully.",
      confidence: "medium",
      locus: "final_thought",
    });
  }

  if (thesis && prose) {
    const sim = similarityRatio(prose, thesis);
    if (sim >= 0.9 || normalizeProse(prose) === normalizeProse(thesis)) {
      signals.push({
        id: "verbatim_thesis",
        severity: "warn",
        message:
          "The conclusion copies the thesis almost word for word. Return to the argument in fresh language.",
        confidence: "high",
        locus: "return_to_thesis",
      });
    } else if (sim < 0.15 && prose.length > 60) {
      signals.push({
        id: "thesis_drift",
        severity: "warn",
        message:
          "The ending may drift from or contradict the thesis you planned.",
        confidence: "low",
        locus: "return_to_thesis",
      });
    }
  }

  const listsBody =
    /\bbody paragraph\s*[123]\b/i.test(prose) ||
    /\b(first|second|third),?\s+(body|paragraph|point)\b/i.test(prose) ||
    (/\bfirst\b/i.test(prose) &&
      /\bsecond\b/i.test(prose) &&
      bodyPurposes.length >= 2);
  if (listsBody) {
    signals.push({
      id: "lists_body_points",
      severity: "warn",
      message:
        "The conclusion lists body points instead of bringing them together.",
      confidence: "medium",
      locus: "synthesize_body",
    });
  }

  if (bodyPurposes.length >= 2 && prose.length > 40 && !listsBody) {
    const purposeHits = bodyPurposes.filter(
      (p) => p.length > 12 && normalizeProse(prose).includes(normalizeProse(p).slice(0, 24))
    ).length;
    if (purposeHits === 0) {
      signals.push({
        id: "missing_synthesis",
        severity: "info",
        message:
          "It is not yet clear how the body paragraph purposes work together.",
        confidence: "low",
        locus: "synthesize_body",
      });
    }
  }

  // New unsupported claim / new evidence at the end — advisory only.
  const lastSentence =
    prose
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .pop() || "";
  if (
    lastSentence &&
    (/["“]/.test(lastSentence) ||
      /\b(for example|according to|as .+ (writes|says|argues))\b/i.test(
        lastSentence
      ))
  ) {
    signals.push({
      id: "new_evidence_at_end",
      severity: "warn",
      message:
        "The ending introduces new evidence. Move that support to a body paragraph where it can be explained.",
      confidence: "medium",
      locus: "final_thought",
    });
  }

  if (
    lastSentence &&
    /\b(furthermore|additionally|another reason|a new point)\b/i.test(
      lastSentence
    )
  ) {
    signals.push({
      id: "new_unsupported_claim",
      severity: "warn",
      message:
        "The ending may open a new claim that belongs in a body paragraph.",
      confidence: "low",
      locus: "final_thought",
    });
  }

  if (/\b(first|second|third)\b/i.test(prose) && listsBody) {
    signals.push({
      id: "missing_final_thought",
      severity: "info",
      message: "End with one purposeful final thought after the synthesis.",
      confidence: "low",
      locus: "final_thought",
    });
  }

  if (upstreamStale) {
    signals.push({
      id: "stale_upstream",
      severity: "warn",
      message:
        "Your thesis or paragraph purposes changed since this conclusion was drafted. Check that the ending still fits.",
      confidence: "high",
      locus: "return_to_thesis",
    });
  }

  return signals;
}

const LEVERAGE_ORDER = [
  "verbatim_thesis",
  "new_evidence_at_end",
  "new_unsupported_claim",
  "lists_body_points",
  "thesis_drift",
  "stale_upstream",
  "missing_synthesis",
  "missing_final_thought",
  "underdevelopment",
];

/**
 * @param {HealthSignal[]} signals
 * @returns {HealthSignal|null}
 */
export function pickHighestLeverageConclusionSignal(signals = []) {
  if (!Array.isArray(signals) || signals.length === 0) return null;
  for (const id of LEVERAGE_ORDER) {
    const match = signals.find((s) => s.id === id);
    if (match) return match;
  }
  return signals[0];
}
