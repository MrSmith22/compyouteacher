/**
 * WP-081 / WP-083 — Body-paragraph sentence-move helpers (thin wrappers over sectionMoveEngine).
 * Move IDs are instructional scaffolding only; assembled prose must never include them.
 * Student coaching: Keep your ideas and wording.
 */

import {
  assembleSectionProse,
  hydrateLegacyProseAsAdvancedMoveState,
  normalizeSectionMoveState,
  proseContainsPlanningChrome,
  resolveAssembledSectionProse,
  selectDeskArtifactsForMove as selectSectionDeskArtifacts,
} from "./sectionMoveEngine.js";

export { proseContainsPlanningChrome };

/** @typedef {"point"|"evidence_context"|"evidence"|"explanation"|"thesis_connection"|"transition"} BodyParagraphMoveId */

/**
 * Base move metadata. Indexed multi-evidence moves resolve through resolveBodyParagraphMoveMeta.
 */
export const BODY_PARAGRAPH_MOVE_META = Object.freeze({
  point: Object.freeze({
    id: "point",
    title: "Point",
    prompt: "State this paragraph’s job in one clear sentence.",
    deskFields: Object.freeze(["purpose", "thesis"]),
  }),
  evidence_context: Object.freeze({
    id: "evidence_context",
    title: "Evidence context",
    prompt: "Orient the reader before the evidence.",
    deskFields: Object.freeze(["evidence", "evidenceContext"]),
  }),
  evidence: Object.freeze({
    id: "evidence",
    title: "Evidence",
    prompt: "Place the evidence in your own sentence (quote or paraphrase).",
    deskFields: Object.freeze(["evidence"]),
  }),
  explanation: Object.freeze({
    id: "explanation",
    title: "Explanation",
    prompt: "Explain how the evidence supports the paragraph’s point.",
    deskFields: Object.freeze(["evidence", "reasoning"]),
  }),
  thesis_connection: Object.freeze({
    id: "thesis_connection",
    title: "Thesis connection",
    prompt: "Tie this paragraph back to the thesis claim.",
    deskFields: Object.freeze(["purpose", "thesis"]),
  }),
  transition: Object.freeze({
    id: "transition",
    title: "Transition",
    prompt: "Bridge toward the next paragraph when this is not the last body.",
    deskFields: Object.freeze(["purpose", "adjacentParagraph"]),
  }),
});

export const BODY_PARAGRAPH_CORE_MOVES = Object.freeze([
  "point",
  "evidence_context",
  "evidence",
  "explanation",
  "thesis_connection",
]);

/** Stable id list for cross-slice comparisons (WP-082). */
export const BODY_PARAGRAPH_MOVE_IDS = Object.freeze([
  ...BODY_PARAGRAPH_CORE_MOVES,
  "transition",
]);

export const BODY_PARAGRAPH_DESK_FIELD_LABELS = Object.freeze({
  purpose: "Paragraph purpose",
  evidenceContext: "Evidence context from plan",
  evidence: "Evidence from plan",
  reasoning: "Reasoning from plan",
  thesis: "Thesis",
  adjacentParagraph: "Next paragraph purpose",
});

const INDEXED_MOVE_RE = /^(evidence_context|evidence|explanation)_(\d+)$/;

/**
 * @param {string} moveId
 * @returns {{ baseId: string, evidenceIndex: number | null }}
 */
export function parseBodyParagraphMoveId(moveId) {
  const id = String(moveId || "");
  const m = id.match(INDEXED_MOVE_RE);
  if (m) {
    return { baseId: m[1], evidenceIndex: Number(m[2]) };
  }
  return { baseId: id, evidenceIndex: null };
}

/**
 * Resolve metadata for a move id, including multi-evidence indexed ids.
 * @param {string} moveId
 */
export function resolveBodyParagraphMoveMeta(moveId) {
  const direct = BODY_PARAGRAPH_MOVE_META[moveId];
  if (direct) return direct;
  const { baseId, evidenceIndex } = parseBodyParagraphMoveId(moveId);
  const base = BODY_PARAGRAPH_MOVE_META[baseId];
  if (!base || evidenceIndex == null) {
    return BODY_PARAGRAPH_MOVE_META.point;
  }
  const n = evidenceIndex + 1;
  const deskFields =
    baseId === "evidence_context"
      ? [`evidenceContext_${evidenceIndex}`, "evidenceContext"]
      : baseId === "evidence"
        ? [`evidence_${evidenceIndex}`, "evidence"]
        : baseId === "explanation"
          ? [`reasoning_${evidenceIndex}`, "reasoning"]
          : base.deskFields;
  return {
    ...base,
    id: moveId,
    title: `${base.title} (${n})`,
    prompt:
      baseId === "evidence_context"
        ? `Orient the reader before evidence ${n}.`
        : baseId === "evidence"
          ? `Place evidence ${n} in your own sentence.`
          : `Explain how evidence ${n} supports the paragraph’s point.`,
    deskFields,
    evidenceIndex,
  };
}

/**
 * Default move order. Single-evidence keeps legacy ids (WP-081 unchanged).
 * Multi-evidence repeats context → evidence → explanation per item.
 * @param {{ includeTransition?: boolean, evidenceCount?: number }} [opts]
 * @returns {string[]}
 */
export function defaultBodyParagraphMoveOrder({
  includeTransition = true,
  evidenceCount = 1,
} = {}) {
  const n = Math.max(1, Math.floor(Number(evidenceCount) || 1));
  /** @type {string[]} */
  const order = ["point"];
  if (n <= 1) {
    order.push("evidence_context", "evidence", "explanation");
  } else {
    for (let i = 0; i < n; i += 1) {
      order.push(`evidence_context_${i}`, `evidence_${i}`, `explanation_${i}`);
    }
  }
  order.push("thesis_connection");
  if (includeTransition) order.push("transition");
  return order;
}

/**
 * @param {{ includeTransition?: boolean, evidenceCount?: number }} [opts]
 */
export function buildBodyParagraphMoveOrder(opts = {}) {
  return defaultBodyParagraphMoveOrder(opts);
}

/**
 * Count evidence items on an outline card / slice input.
 * @param {unknown} cardOrEvidence
 * @returns {number}
 */
export function countBodyParagraphEvidence(cardOrEvidence) {
  if (Array.isArray(cardOrEvidence)) {
    return Math.max(1, cardOrEvidence.filter(Boolean).length || 1);
  }
  if (!cardOrEvidence || typeof cardOrEvidence !== "object") return 1;
  const card = /** @type {Record<string, unknown>} */ (cardOrEvidence);
  if (Array.isArray(card.evidence) && card.evidence.length) {
    return Math.max(1, card.evidence.length);
  }
  if (Array.isArray(card.points) && card.points.filter(Boolean).length) {
    return Math.max(1, card.points.filter(Boolean).length);
  }
  return 1;
}

export function assembleBodyParagraphProse(moves = {}, moveOrder = BODY_PARAGRAPH_CORE_MOVES) {
  return assembleSectionProse(moves, moveOrder);
}

/**
 * @param {string} moveId
 * @param {Record<string, string>} [deskArtifacts]
 */
export function selectDeskArtifactsForMove(moveId, deskArtifacts = {}) {
  const meta = resolveBodyParagraphMoveMeta(moveId);
  const selected = selectSectionDeskArtifacts(
    moveId,
    deskArtifacts,
    { [moveId]: meta },
    BODY_PARAGRAPH_DESK_FIELD_LABELS
  );
  // Prefer indexed field values; fall back labels already applied by engine.
  return selected.map((row) => {
    const { baseId, evidenceIndex } = parseBodyParagraphMoveId(moveId);
    if (evidenceIndex == null) return row;
    const preferred =
      baseId === "evidence_context"
        ? `evidenceContext_${evidenceIndex}`
        : baseId === "evidence"
          ? `evidence_${evidenceIndex}`
          : baseId === "explanation"
            ? `reasoning_${evidenceIndex}`
            : null;
    if (preferred && row.field === preferred) {
      return {
        ...row,
        label:
          baseId === "evidence_context"
            ? `Evidence context ${evidenceIndex + 1}`
            : baseId === "evidence"
              ? `Evidence ${evidenceIndex + 1}`
              : `Reasoning for evidence ${evidenceIndex + 1}`,
      };
    }
    return row;
  });
}

/**
 * @param {unknown} raw
 * @param {{ includeTransition?: boolean, evidenceCount?: number, moveOrder?: string[], legacyProse?: string }} [opts]
 */
export function normalizeBodyParagraphMoveState(
  raw,
  {
    includeTransition = true,
    evidenceCount = 1,
    moveOrder: explicitOrder,
    legacyProse = "",
  } = {}
) {
  const moveOrder =
    Array.isArray(explicitOrder) && explicitOrder.length
      ? explicitOrder
      : defaultBodyParagraphMoveOrder({ includeTransition, evidenceCount });
  const normalized = normalizeSectionMoveState(raw, { moveOrder });
  if (!legacyProse) return normalized;
  return hydrateLegacyProseAsAdvancedMoveState(normalized, {
    moveOrder,
    legacyProse,
  });
}

/**
 * @param {unknown} moveState
 * @param {{ includeTransition?: boolean, evidenceCount?: number, moveOrder?: string[] }} [opts]
 */
export function resolveAssembledBodyParagraphProse(moveState, opts = {}) {
  const includeTransition =
    typeof opts.includeTransition === "boolean" ? opts.includeTransition : true;
  const fromState =
    Array.isArray(moveState?.moveOrder) && moveState.moveOrder.length
      ? moveState.moveOrder
      : null;
  const evidenceCount =
    typeof opts.evidenceCount === "number"
      ? opts.evidenceCount
      : fromState
        ? Math.max(
            1,
            fromState.filter((id) => /^evidence(_\d+)?$/.test(String(id))).length ||
              1
          )
        : 1;
  const moveOrder =
    Array.isArray(opts.moveOrder) && opts.moveOrder.length
      ? opts.moveOrder
      : fromState ||
        defaultBodyParagraphMoveOrder({ includeTransition, evidenceCount });
  return resolveAssembledSectionProse(moveState, { moveOrder });
}

/**
 * Attach / refresh moveOrder on an outline body card from essay position + evidence count.
 * Call after reorder so transition adjacency stays correct.
 * @param {object} card
 * @param {{ essayOrderIndex: number, bodyCount: number, forceRefresh?: boolean }} opts
 */
export function withOutlineMoveOrder(card, { essayOrderIndex, bodyCount, forceRefresh = false }) {
  if (!card || typeof card !== "object") return card;
  const includeTransition = essayOrderIndex < Math.max(1, bodyCount) - 1;
  const evidenceCount = countBodyParagraphEvidence(card);
  const nextOrder = buildBodyParagraphMoveOrder({ includeTransition, evidenceCount });
  const existing = Array.isArray(card.moveOrder) ? card.moveOrder : null;
  const needsRefresh =
    forceRefresh ||
    !existing ||
    existing.length === 0 ||
    existing.includes("transition") !== includeTransition ||
    existing.length !== nextOrder.length ||
    existing.some((id, i) => id !== nextOrder[i]);
  if (!needsRefresh) return { ...card, moveOrder: existing };
  return {
    ...card,
    moveOrder: nextOrder,
  };
}

/**
 * Persist helpers keyed by sourceParagraphIndex (durable identity).
 */
export function getMovesFromDraftMeta(draftMeta, sourceParagraphIndex) {
  const map = draftMeta?.verticalSlice?.movesBySourceIndex;
  if (!map || typeof map !== "object") return null;
  const key = String(sourceParagraphIndex);
  return map[key] ?? null;
}

export function setMovesInDraftMeta(draftMeta, sourceParagraphIndex, moveState, opts = {}) {
  const prev = draftMeta && typeof draftMeta === "object" ? { ...draftMeta } : {};
  const verticalSlice = {
    ...(prev.verticalSlice && typeof prev.verticalSlice === "object"
      ? prev.verticalSlice
      : {}),
  };
  const movesBySourceIndex = {
    ...(verticalSlice.movesBySourceIndex &&
    typeof verticalSlice.movesBySourceIndex === "object"
      ? verticalSlice.movesBySourceIndex
      : {}),
  };
  const includeTransition =
    typeof opts.includeTransition === "boolean" ? opts.includeTransition : true;
  const evidenceCount =
    typeof opts.evidenceCount === "number" ? opts.evidenceCount : 1;
  const moveOrder =
    Array.isArray(opts.moveOrder) && opts.moveOrder.length
      ? opts.moveOrder
      : defaultBodyParagraphMoveOrder({ includeTransition, evidenceCount });
  movesBySourceIndex[String(sourceParagraphIndex)] = normalizeBodyParagraphMoveState(
    moveState,
    { includeTransition, evidenceCount, moveOrder }
  );
  verticalSlice.movesBySourceIndex = movesBySourceIndex;
  return { ...prev, verticalSlice };
}

export function getRevisionFromDraftMeta(draftMeta, sourceParagraphIndex) {
  const map = draftMeta?.verticalSlice?.revisionBySourceIndex;
  if (!map || typeof map !== "object") return null;
  return map[String(sourceParagraphIndex)] ?? null;
}

export function setRevisionInDraftMeta(draftMeta, sourceParagraphIndex, revision) {
  const prev = draftMeta && typeof draftMeta === "object" ? { ...draftMeta } : {};
  const verticalSlice = {
    ...(prev.verticalSlice && typeof prev.verticalSlice === "object"
      ? prev.verticalSlice
      : {}),
  };
  const revisionBySourceIndex = {
    ...(verticalSlice.revisionBySourceIndex &&
    typeof verticalSlice.revisionBySourceIndex === "object"
      ? verticalSlice.revisionBySourceIndex
      : {}),
  };
  revisionBySourceIndex[String(sourceParagraphIndex)] = {
    before: typeof revision?.before === "string" ? revision.before : "",
    after: typeof revision?.after === "string" ? revision.after : "",
    clearerConfirmed: Boolean(revision?.clearerConfirmed),
    targetId: typeof revision?.targetId === "string" ? revision.targetId : null,
  };
  verticalSlice.revisionBySourceIndex = revisionBySourceIndex;
  return { ...prev, verticalSlice };
}
