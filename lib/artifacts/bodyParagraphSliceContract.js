/**
 * WP-081 — Shared Body Paragraph vertical-slice contract.
 * Builds a normalized view from existing M4/M5/M6/M7 artifacts.
 * Does not invent a new persistence table; sourceParagraphIndex is the durable key.
 */

import { getBodyParagraphLabel } from "../essaySectionLabels.js";
import {
  defaultBodyParagraphMoveOrder,
  assembleBodyParagraphProse,
  normalizeBodyParagraphMoveState,
  getMovesFromDraftMeta,
  countBodyParagraphEvidence,
  withOutlineMoveOrder as refreshOutlineMoveOrder,
  parseBodyParagraphMoveId,
  resolveBodyParagraphMoveMeta,
} from "../module6/bodyParagraphMoves.js";
import {
  diagnoseBodyParagraphHealth,
  pickHighestLeverageHealthSignal,
} from "./bodyParagraphHealth.js";
import { getRevisionFromDraftMeta } from "../module7/bodyParagraphDiagnostics.js";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEvidenceList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (typeof item === "string") {
      return {
        key: `snippet-${index}`,
        quote: item,
        observation: "",
        sourceId: "",
        source: "",
      };
    }
    return {
      key: String(item?.key || item?.id || `snippet-${index}`),
      quote: safeText(item?.quote || item?.text || item?.snippet),
      observation: safeText(item?.observation || item?.context),
      sourceId: String(item?.sourceId || item?.source_id || item?.work || ""),
      source: String(item?.source || item?.work || item?.sourceLabel || ""),
    };
  });
}

/**
 * Derive move order for outline / drafting from plan fields.
 * Multi-evidence repeats context → evidence → explanation (WP-083).
 * @param {{ includeTransition?: boolean, evidenceCount?: number }} [opts]
 */
export function buildBodyParagraphMoveOrder({
  includeTransition = true,
  evidenceCount = 1,
} = {}) {
  return defaultBodyParagraphMoveOrder({ includeTransition, evidenceCount });
}

/**
 * Attach / refresh moveOrder on an outline body card after reorder or evidence change.
 * @param {object} card
 * @param {{ essayOrderIndex?: number, bodyCount?: number, forceRefresh?: boolean }} [opts]
 */
export function withOutlineMoveOrder(
  card,
  { essayOrderIndex = 0, bodyCount = 2, forceRefresh = false } = {}
) {
  return refreshOutlineMoveOrder(card, {
    essayOrderIndex,
    bodyCount,
    forceRefresh,
  });
}

/**
 * Build the slice contract for one body paragraph.
 *
 * @param {object} args
 * @param {number} args.sourceParagraphIndex — durable M4 bucket index
 * @param {number} args.essayOrderIndex — essay-order bodyIndex (0 = Body Paragraph 1)
 * @param {object} [args.bucket] — Module 4 bucket
 * @param {object} [args.outlineCard] — Module 5 body card
 * @param {string} [args.thesis]
 * @param {string} [args.assembledProse]
 * @param {object} [args.draftMeta] — Module 6 or 7 draft_meta
 * @param {string|string[]} [args.otherBodyProse]
 * @param {boolean} [args.upstreamStale]
 * @param {string[]} [args.expectedSourceIds]
 * @param {boolean} [args.includeTransition]
 * @param {number} [args.bodyCount]
 */
export function buildBodyParagraphSlice({
  sourceParagraphIndex = 0,
  essayOrderIndex = 0,
  bucket = null,
  outlineCard = null,
  thesis = "",
  assembledProse = "",
  draftMeta = null,
  otherBodyProse = "",
  upstreamStale = false,
  expectedSourceIds = [],
  includeTransition,
  bodyCount,
} = {}) {
  const card = outlineCard || {};
  const plan = bucket || {};
  const purpose = safeText(card.point || card.bucket || plan.claim);
  const job = safeText(card.job || plan.paragraphRole);
  const reasoning = safeText(card.reasoning || plan.reasoning);
  const evidence = normalizeEvidenceList(
    card.evidence?.length
      ? card.evidence
      : plan.evidenceSnippets?.length
        ? plan.evidenceSnippets
        : []
  );
  const evidenceContext = evidence
    .map((e) => e.observation)
    .filter(Boolean)
    .join(" ");

  const resolvedBodyCount =
    typeof bodyCount === "number" && bodyCount > 0
      ? bodyCount
      : typeof includeTransition === "boolean"
        ? includeTransition
          ? essayOrderIndex + 2
          : essayOrderIndex + 1
        : 2;
  const transitionDefault =
    typeof includeTransition === "boolean"
      ? includeTransition
      : essayOrderIndex < resolvedBodyCount - 1;
  const evidenceCount = countBodyParagraphEvidence(
    evidence.length ? evidence : card
  );

  const moveOrder =
    Array.isArray(card.moveOrder) && card.moveOrder.length
      ? card.moveOrder
      : buildBodyParagraphMoveOrder({
          includeTransition: transitionDefault,
          evidenceCount,
        });

  const moveStateRaw = getMovesFromDraftMeta(draftMeta, sourceParagraphIndex);
  const moveState = normalizeBodyParagraphMoveState(moveStateRaw, {
    includeTransition: moveOrder.includes("transition"),
    evidenceCount,
    moveOrder,
  });

  const proseFromMoves = assembleBodyParagraphProse(moveState.moves, moveOrder);
  const prose = safeText(assembledProse) || proseFromMoves;

  const health = diagnoseBodyParagraphHealth({
    purpose,
    reasoning,
    evidence,
    assembledProse: prose,
    thesis,
    otherBodyProse,
    expectedSourceIds,
    upstreamStale,
    needsTransition: moveOrder.includes("transition"),
  });

  const revision = getRevisionFromDraftMeta(draftMeta, sourceParagraphIndex) || {};
  const topHealth = pickHighestLeverageHealthSignal(health);

  return {
    sourceParagraphIndex,
    essayOrderIndex,
    label: getBodyParagraphLabel(essayOrderIndex),
    purpose,
    job,
    thesisRelationship: safeText(thesis),
    evidence,
    evidenceContext,
    reasoning,
    moveOrder,
    moveState,
    assembledProse: prose,
    health,
    revisionTarget: topHealth?.id || null,
    revisionBefore: typeof revision.before === "string" ? revision.before : "",
    revisionAfter: typeof revision.after === "string" ? revision.after : "",
    clearerConfirmed: Boolean(revision.clearerConfirmed),
  };
}

/**
 * Formal outline lines for one body paragraph (Roman numeral only in formal view).
 */
export function formatBodyParagraphFormalOutlineLines(slice, romanNumeral) {
  const lines = [];
  lines.push(`${romanNumeral}. ${slice.label}: ${slice.purpose || "(purpose)"}`);
  for (const moveId of slice.moveOrder || []) {
    const meta = resolveBodyParagraphMoveMeta(moveId);
    const { baseId, evidenceIndex } = parseBodyParagraphMoveId(moveId);
    const baseLabels = {
      point: "Paragraph purpose / topic sentence",
      evidence_context: "Evidence context",
      evidence: "Evidence",
      explanation: "Explanation / reasoning",
      thesis_connection: "Connection to thesis",
      transition: "Transition",
    };
    const label =
      evidenceIndex != null
        ? `${baseLabels[baseId] || meta.title} (${evidenceIndex + 1})`
        : baseLabels[moveId] || meta.title || moveId;
    lines.push(`   - ${label}`);
  }
  return lines;
}

/**
 * Writing-plan (non-Roman) card summary for outline UI.
 */
export function formatBodyParagraphWritingPlanSummary(slice) {
  return {
    label: slice.label,
    purpose: slice.purpose,
    moves: (slice.moveOrder || []).map((id) => {
      const meta = resolveBodyParagraphMoveMeta(id);
      return {
        id,
        title: meta.title || id,
      };
    }),
    evidenceCount: Array.isArray(slice.evidence) ? slice.evidence.length : 0,
    reasoning: slice.reasoning,
  };
}
