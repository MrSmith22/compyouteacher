/**
 * WP-081 — Deterministic body-paragraph health signals.
 * Flags only; never silently rewrite student prose.
 *
 * Confidence limits:
 * - wrong_source / plan_alignment heuristics can false-positive on short paraphrases
 * - missing_explanation uses quotation-mark presence, not full rhetorical analysis
 * - duplicate uses normalized exact/near-exact string match, not semantic similarity
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
export function diagnoseBodyParagraphHealth(input = {}) {
  const signals = [];
  const purpose = safeText(input.purpose);
  const reasoning = safeText(input.reasoning);
  const assembledProse = safeText(input.assembledProse);
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const thesis = safeText(input.thesis);
  const otherBodyProseList = Array.isArray(input.otherBodyProse)
    ? input.otherBodyProse.map((p) => safeText(p)).filter(Boolean)
    : safeText(input.otherBodyProse)
      ? [safeText(input.otherBodyProse)]
      : [];
  const expectedSourceIds = Array.isArray(input.expectedSourceIds)
    ? input.expectedSourceIds.map(String)
    : [];
  const upstreamStale = Boolean(input.upstreamStale);

  if (evidence.length === 0) {
    signals.push({
      id: "missing_evidence",
      severity: "error",
      message: "This paragraph plan has no selected evidence yet.",
      confidence: "high",
      locus: "evidence",
    });
  }

  if (reasoning && reasoning.length < 20) {
    signals.push({
      id: "fragmentary_reasoning",
      severity: "warn",
      message: "The reasoning note looks too short to explain how evidence supports the point.",
      confidence: "medium",
      locus: "reasoning",
    });
  }

  if (expectedSourceIds.length > 0) {
    for (const item of evidence) {
      const sourceId = String(item?.sourceId || item?.source || "").trim();
      if (sourceId && !expectedSourceIds.includes(sourceId)) {
        signals.push({
          id: "wrong_source_evidence",
          severity: "warn",
          message:
            "Selected evidence may come from a source that does not match this paragraph's planned direction.",
          confidence: "medium",
          locus: safeText(item?.quote) || safeText(item?.observation) || "evidence",
        });
        break;
      }
    }
  }

  const hasQuote = /["“”]/.test(assembledProse);
  if (hasQuote) {
    // Heuristic: quotation present but little following explanatory prose.
    const afterQuote = assembledProse.split(/["“”]/).slice(2).join(" ").trim();
    if (afterQuote.length < 24) {
      signals.push({
        id: "missing_explanation_after_quote",
        severity: "warn",
        message:
          "A quotation appears without enough explanation of how it supports the paragraph point.",
        confidence: "medium",
        locus: "explanation",
      });
    }
  }

  if (purpose && assembledProse) {
    const purposeTokens = normalizeProse(purpose)
      .split(" ")
      .filter((t) => t.length > 4);
    const proseNorm = normalizeProse(assembledProse);
    const overlap = purposeTokens.filter((t) => proseNorm.includes(t)).length;
    if (purposeTokens.length >= 3 && overlap === 0) {
      signals.push({
        id: "plan_alignment",
        severity: "warn",
        message:
          "The draft does not clearly reuse language from the planned paragraph purpose.",
        confidence: "low",
        locus: "purpose",
      });
    }
  }

  if (thesis && assembledProse) {
    const thesisTokens = normalizeProse(thesis)
      .split(" ")
      .filter((t) => t.length > 4)
      .slice(0, 8);
    const proseNorm = normalizeProse(assembledProse);
    const hit = thesisTokens.some((t) => proseNorm.includes(t));
    if (thesisTokens.length >= 3 && !hit) {
      signals.push({
        id: "thesis_connection",
        severity: "info",
        message: "Check whether this paragraph still connects clearly to the thesis.",
        confidence: "low",
        locus: "thesis_connection",
      });
    }
  }

  if (assembledProse && otherBodyProseList.length) {
    for (const sibling of otherBodyProseList) {
      const ratio = similarityRatio(assembledProse, sibling);
      if (ratio >= 0.9) {
        signals.push({
          id: "duplicate_body_prose",
          severity: "error",
          message:
            "This body paragraph is nearly identical to another body paragraph. Revise so each proves a distinct idea.",
          confidence: "high",
          locus: "prose",
        });
        break;
      }
    }
  }

  if (upstreamStale) {
    signals.push({
      id: "stale_upstream",
      severity: "warn",
      message:
        "An upstream plan or thesis change may make this paragraph outdated. Review without erasing your words.",
      confidence: "high",
      locus: "plan",
    });
  }

  if (input.needsTransition && assembledProse) {
    const lastSentence = assembledProse.split(/(?<=[.!?])\s+/).filter(Boolean).pop() || "";
    if (lastSentence.length < 12) {
      signals.push({
        id: "transition_context",
        severity: "info",
        message: "Consider a clearer bridge into the next paragraph.",
        confidence: "low",
        locus: "transition",
      });
    }
  }

  return signals;
}

/**
 * Highest-leverage signal for revision targeting.
 * @param {HealthSignal[]} signals
 * @returns {HealthSignal | null}
 */
export function pickHighestLeverageHealthSignal(signals = []) {
  const rank = { error: 0, warn: 1, info: 2 };
  const conf = { high: 0, medium: 1, low: 2 };
  const list = Array.isArray(signals) ? [...signals] : [];
  list.sort((a, b) => {
    const s = (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9);
    if (s !== 0) return s;
    return (conf[a.confidence] ?? 9) - (conf[b.confidence] ?? 9);
  });
  return list[0] || null;
}
