/**
 * WP-082 — Deterministic introduction health signals.
 * Flags only; never silently rewrite student prose.
 * Does not require body-paragraph evidence.
 *
 * Confidence limits:
 * - thesis presence uses normalized substring / similarity, not full semantic paraphrase detection
 * - "evidence before context" uses quotation marks as a weak heuristic
 * - staleness is only flagged when upstreamStale is provided by the caller
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
  if (longer.includes(shorter) && shorter.length / longer.length >= 0.7) {
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
export function diagnoseIntroductionHealth(input = {}) {
  const signals = [];
  const prose = safeText(input.assembledProse);
  const thesis = safeText(input.thesis);
  const assignmentQuestion = safeText(input.assignmentQuestion);
  const upstreamStale = Boolean(input.upstreamStale);
  const wordCount = prose ? prose.split(/\s+/).filter(Boolean).length : 0;

  if (!prose || wordCount < 25) {
    signals.push({
      id: "underdevelopment",
      severity: "warn",
      message: "This introduction looks too short to give the reader context and arrive at the thesis.",
      confidence: "medium",
      locus: "opening",
    });
  }

  if (!assignmentQuestion && !prose) {
    signals.push({
      id: "missing_context",
      severity: "warn",
      message: "Your reader still needs the essential situation or issue.",
      confidence: "medium",
      locus: "opening_context",
    });
  }

  if (thesis) {
    const normThesis = normalizeProse(thesis);
    const normProse = normalizeProse(prose);
    const hasThesis =
      normProse.includes(normThesis) || similarityRatio(prose, thesis) >= 0.55;
    if (!hasThesis && prose.length > 40) {
      signals.push({
        id: "missing_thesis",
        severity: "error",
        message: "The introduction does not yet arrive at your saved thesis.",
        confidence: "high",
        locus: "thesis_destination",
      });
    }

    // Thesis repeated as background: thesis appears early AND again later as near-copy.
    if (hasThesis && prose.length > thesis.length + 40) {
      const firstHalf = prose.slice(0, Math.floor(prose.length / 2));
      const secondHalf = prose.slice(Math.floor(prose.length / 2));
      if (
        similarityRatio(firstHalf, thesis) >= 0.75 &&
        similarityRatio(secondHalf, thesis) >= 0.75
      ) {
        signals.push({
          id: "repeated_thesis_as_background",
          severity: "warn",
          message: "Background and thesis look like the same idea said twice.",
          confidence: "medium",
          locus: "background_relationship",
        });
      }
    }

    // Thesis meaning drift: prose contains a thesis-like sentence that barely overlaps.
    if (
      hasThesis === false &&
      /\b(thesis|argue|argument|claim)\b/i.test(prose) &&
      similarityRatio(prose, thesis) < 0.35
    ) {
      signals.push({
        id: "thesis_meaning_changed",
        severity: "warn",
        message:
          "The opening's claim may no longer match the thesis you planned.",
        confidence: "low",
        locus: "thesis_destination",
      });
    }
  } else if (prose.length > 40) {
    signals.push({
      id: "missing_thesis",
      severity: "warn",
      message: "No saved thesis is available for the introduction to arrive at.",
      confidence: "medium",
      locus: "thesis_destination",
    });
  }

  // Opening that begins with evidence before the reader understands the situation.
  const firstSentence = prose.split(/(?<=[.!?])\s+/)[0] || "";
  if (
    firstSentence &&
    (/["“]/.test(firstSentence) || /\b(according to|writes that|states that)\b/i.test(firstSentence)) &&
    firstSentence.length < 180
  ) {
    signals.push({
      id: "evidence_before_context",
      severity: "warn",
      message:
        "The opening begins with evidence before the reader understands the situation.",
      confidence: "medium",
      locus: "opening_context",
    });
  }

  if (upstreamStale) {
    signals.push({
      id: "stale_upstream",
      severity: "warn",
      message:
        "Your thesis or assignment focus changed since this introduction was drafted. Check that it still leads to your current thesis.",
      confidence: "high",
      locus: "thesis_destination",
    });
  }

  return signals;
}

const LEVERAGE_ORDER = [
  "missing_thesis",
  "thesis_meaning_changed",
  "stale_upstream",
  "evidence_before_context",
  "repeated_thesis_as_background",
  "missing_context",
  "underdevelopment",
];

/**
 * @param {HealthSignal[]} signals
 * @returns {HealthSignal|null}
 */
export function pickHighestLeverageIntroductionSignal(signals = []) {
  if (!Array.isArray(signals) || signals.length === 0) return null;
  for (const id of LEVERAGE_ORDER) {
    const match = signals.find((s) => s.id === id);
    if (match) return match;
  }
  return signals[0];
}
