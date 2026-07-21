/**
 * WP-082 — Shared sentence-move engine for section vertical slices.
 * Move IDs are instructional scaffolding; assembled prose must never include them.
 */

/**
 * Assemble move texts into prose only — no labels, Roman numerals, or move IDs.
 * @param {Record<string, string>} moves
 * @param {string[]} moveOrder
 * @returns {string}
 */
export function assembleSectionProse(moves = {}, moveOrder = []) {
  const parts = [];
  for (const id of moveOrder) {
    const text = typeof moves?.[id] === "string" ? moves[id].trim() : "";
    if (text) parts.push(text);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Detect forbidden planning chrome in assembled prose.
 * @param {string} prose
 * @returns {boolean}
 */
export function proseContainsPlanningChrome(prose) {
  const text = String(prose || "");
  if (/\b(I{1,3}|IV|V|VI|VII|VIII|IX|X)\.\s/.test(text)) return true;
  if (/\b(Body Paragraph|Paragraph Plan|Module\s*[4-7])\s*\d+/i.test(text)) return true;
  if (/\b(Introduction|Conclusion)\s*:/i.test(text) && /\b(Step\s+\d+)/i.test(text)) {
    return true;
  }
  if (
    /\b(point|evidence_context|thesis_connection|opening_context|thesis_destination|synthesize_body|final_thought)\s*:/i.test(
      text
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Return only the plan fields needed for the active move.
 * @param {string} moveId
 * @param {Record<string, string>} [deskArtifacts]
 * @param {Record<string, { deskFields?: string[] }>} moveMeta
 * @param {Record<string, string>} [fieldLabels]
 * @returns {{ field: string, label: string, value: string }[]}
 */
export function selectDeskArtifactsForMove(
  moveId,
  deskArtifacts = {},
  moveMeta = {},
  fieldLabels = {}
) {
  const fields = moveMeta[moveId]?.deskFields || [];
  const selected = [];
  for (const field of fields) {
    const value =
      typeof deskArtifacts?.[field] === "string" ? deskArtifacts[field].trim() : "";
    if (!value) continue;
    selected.push({
      field,
      label: fieldLabels[field] || field,
      value,
    });
  }
  return selected;
}

/**
 * Normalize persisted move state for one section.
 * advancedProse is a first-class field (survives hydrate); legacy _advancedProse is migrated.
 * @param {unknown} raw
 * @param {{ moveOrder: string[] }} opts
 */
export function normalizeSectionMoveState(raw, { moveOrder }) {
  const order = Array.isArray(moveOrder) && moveOrder.length ? moveOrder : [];
  const base = raw && typeof raw === "object" ? raw : {};
  const movesIn = base.moves && typeof base.moves === "object" ? base.moves : {};
  const moves = {};
  for (const id of order) {
    moves[id] = typeof movesIn[id] === "string" ? movesIn[id] : "";
  }
  const activeMoveId =
    typeof base.activeMoveId === "string" && order.includes(base.activeMoveId)
      ? base.activeMoveId
      : order[0] || "";
  const advancedProse =
    typeof base.advancedProse === "string"
      ? base.advancedProse
      : typeof base._advancedProse === "string"
        ? base._advancedProse
        : "";
  return {
    activeMoveId,
    moves,
    advancedMode: Boolean(base.advancedMode),
    advancedProse,
    moveOrder: order,
  };
}

/**
 * Resolve the single prose string for sections[] from move state.
 * Advanced mode uses advancedProse exclusively (never concatenates stale moves).
 * @param {unknown} moveState
 * @param {{ moveOrder: string[] }} opts
 * @returns {string}
 */
export function resolveAssembledSectionProse(moveState, opts) {
  const normalized = normalizeSectionMoveState(moveState, opts);
  if (normalized.advancedMode) {
    return String(normalized.advancedProse || "").trim();
  }
  return assembleSectionProse(normalized.moves, normalized.moveOrder);
}

/**
 * Stable section-type keys for intro/conclusion vertical-slice persistence.
 * Prefer type over draftIndex so reorder/body-count changes do not remount identity.
 */
export const SECTION_SLICE_KEYS = Object.freeze({
  INTRO: "intro",
  CONCLUSION: "conclusion",
});

/**
 * @param {string} sectionType
 * @returns {"intro"|"conclusion"|null}
 */
export function sectionSliceKeyForType(sectionType) {
  const type = String(sectionType || "").toLowerCase();
  if (type === "intro" || type === "introduction") return SECTION_SLICE_KEYS.INTRO;
  if (type === "conclusion") return SECTION_SLICE_KEYS.CONCLUSION;
  return null;
}

/**
 * Read move state from draft_meta.verticalSlice.movesBySectionType
 */
export function getSectionMovesFromDraftMeta(draftMeta, sectionKey) {
  const map = draftMeta?.verticalSlice?.movesBySectionType;
  if (!map || typeof map !== "object") return null;
  const key = String(sectionKey);
  return map[key] ?? null;
}

/**
 * Write move state into draft_meta.verticalSlice.movesBySectionType
 */
export function setSectionMovesInDraftMeta(draftMeta, sectionKey, moveState, moveOrder) {
  const prev = draftMeta && typeof draftMeta === "object" ? { ...draftMeta } : {};
  const verticalSlice = {
    ...(prev.verticalSlice && typeof prev.verticalSlice === "object"
      ? prev.verticalSlice
      : {}),
  };
  const movesBySectionType = {
    ...(verticalSlice.movesBySectionType &&
    typeof verticalSlice.movesBySectionType === "object"
      ? verticalSlice.movesBySectionType
      : {}),
  };
  const normalized = normalizeSectionMoveState(moveState, { moveOrder });
  movesBySectionType[String(sectionKey)] = normalized;
  verticalSlice.movesBySectionType = movesBySectionType;
  return { ...prev, verticalSlice };
}
