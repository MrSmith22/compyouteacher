/**
 * WP-085 — Pure legacy → rebuilt writing-spine adapters.
 * Confidence limits: infer only when mapping is unambiguous. Never rewrite prose.
 * Removal criteria: after legacy path is retired and all active students have
 * durable sourceParagraphIndex + verticalSlice metadata (track in a later issue).
 */

/**
 * @typedef {{
 *   ok: boolean,
 *   confidence: "high"|"medium"|"low",
 *   confidenceNote: string,
 *   needsLocalReview: boolean,
 *   adapted: object | null,
 * }} AdapterResult
 */

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Module 4 / 5 body cards: preserve sourceParagraphIndex; assign deterministic
 * indices only when absent and length is stable.
 * @param {unknown} outline
 * @returns {AdapterResult}
 */
export function adaptLegacyOutlineForRebuiltSpine(outline) {
  if (!outline || typeof outline !== "object") {
    return {
      ok: false,
      confidence: "low",
      confidenceNote: "Missing outline object.",
      needsLocalReview: true,
      adapted: null,
    };
  }

  const body = safeArray(outline.body).map((card, index) => {
    const row = card && typeof card === "object" ? { ...card } : {};
    if (typeof row.sourceParagraphIndex !== "number") {
      row.sourceParagraphIndex = index;
    }
    if (!row.purpose && row.claim) row.purpose = row.claim;
    return row;
  });

  const ambiguous = body.some(
    (card, index, arr) =>
      arr.findIndex((c) => c.sourceParagraphIndex === card.sourceParagraphIndex) !==
      index
  );

  return {
    ok: !ambiguous,
    confidence: ambiguous ? "low" : "high",
    confidenceNote: ambiguous
      ? "Duplicate sourceParagraphIndex values — local review required."
      : "Preserved or assigned deterministic sourceParagraphIndex by essay order.",
    needsLocalReview: ambiguous,
    adapted: {
      ...outline,
      body,
    },
  };
}

/**
 * Module 6: legacy prose-only sections without verticalSlice moves.
 * Hydrate as advanced whole-section prose — do not invent sentence moves.
 * @param {{ sections?: unknown, draftMeta?: unknown, fullText?: unknown }} input
 * @returns {AdapterResult}
 */
export function adaptLegacyModule6DraftForRebuiltSpine(input = {}) {
  const sections = safeArray(input.sections).map((s) => String(s || ""));
  const fullText = typeof input.fullText === "string" ? input.fullText : "";
  const draftMeta =
    input.draftMeta && typeof input.draftMeta === "object" ? { ...input.draftMeta } : {};

  const hasMoves =
    draftMeta.verticalSlice &&
    (draftMeta.verticalSlice.movesBySourceIndex ||
      draftMeta.verticalSlice.movesBySectionType);

  if (hasMoves) {
    return {
      ok: true,
      confidence: "high",
      confidenceNote: "verticalSlice moves already present — no adaptation.",
      needsLocalReview: false,
      adapted: { sections, draftMeta, fullText, mode: "rebuilt_moves" },
    };
  }

  const proseSections =
    sections.length > 0
      ? sections
      : fullText
        ? fullText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
        : [];

  if (!proseSections.some((p) => p.trim())) {
    return {
      ok: true,
      confidence: "medium",
      confidenceNote: "Empty legacy draft — student starts rebuilt drafting.",
      needsLocalReview: false,
      adapted: {
        sections: proseSections,
        draftMeta,
        fullText,
        mode: "empty",
      },
    };
  }

  // Do not write verticalSlice here — render path opens advanced prose intact.
  // Metadata upgrades happen only on authenticated save.
  return {
    ok: true,
    confidence: "high",
    confidenceNote:
      "Legacy whole-paragraph prose opens intact in advanced mode; moves are not invented.",
    needsLocalReview: false,
    adapted: {
      sections: proseSections,
      draftMeta,
      fullText: fullText || proseSections.join("\n\n"),
      mode: "legacy_advanced_prose",
      openAdvancedByDefault: true,
    },
  };
}

/**
 * Module 7: ensure resume index is readable; do not invent Before/After.
 * @param {{ draftMeta?: unknown, fullText?: unknown, finalText?: unknown }} input
 * @returns {AdapterResult}
 */
export function adaptLegacyModule7DraftForRebuiltSpine(input = {}) {
  const draftMeta =
    input.draftMeta && typeof input.draftMeta === "object" ? { ...input.draftMeta } : {};
  const fullText = typeof input.fullText === "string" ? input.fullText : "";
  const finalText = typeof input.finalText === "string" ? input.finalText : "";
  const authoritative = String(finalText || fullText || "").trim();

  if (
    typeof draftMeta.currentStepIndex !== "number" &&
    draftMeta.resume &&
    typeof draftMeta.resume === "object" &&
    typeof draftMeta.resume.currentStepIndex === "number"
  ) {
    draftMeta.currentStepIndex = draftMeta.resume.currentStepIndex;
  }

  return {
    ok: true,
    confidence: authoritative ? "high" : "medium",
    confidenceNote: authoritative
      ? "Legacy revised/final prose remains authoritative until a rebuilt save."
      : "No Module 7 prose yet.",
    needsLocalReview: false,
    adapted: {
      draftMeta,
      fullText,
      finalText,
      authoritativeText: authoritative,
      preserveUntilRebuiltSave: true,
    },
  };
}

/**
 * Module 4 plans: normalize body labels without changing student language.
 * @param {unknown} plans
 * @returns {AdapterResult}
 */
export function adaptLegacyModule4PlansForRebuiltSpine(plans) {
  const list = safeArray(plans);
  if (!list.length) {
    return {
      ok: true,
      confidence: "medium",
      confidenceNote: "No Module 4 plans saved.",
      needsLocalReview: false,
      adapted: [],
    };
  }

  const adapted = list.map((plan, index) => {
    const row = plan && typeof plan === "object" ? { ...plan } : {};
    if (typeof row.sourceParagraphIndex !== "number") {
      row.sourceParagraphIndex = index;
    }
    return row;
  });

  return {
    ok: true,
    confidence: "high",
    confidenceNote: "Assigned deterministic sourceParagraphIndex where missing.",
    needsLocalReview: false,
    adapted,
  };
}
