/**
 * WP-081 — Diagnostic revision targeting for Body Paragraph slice.
 * Recommends a strategy from health signals + optional read-aloud observation.
 * Never mutates student prose.
 *
 * Confidence limits: ranking is deterministic and instructional, not a grade.
 * Low-confidence health signals can be overridden by the student's observation.
 */

import {
  diagnoseBodyParagraphHealth,
  pickHighestLeverageHealthSignal,
} from "../artifacts/bodyParagraphHealth.js";

export const REVISION_TARGET_IDS = Object.freeze({
  PLAN_ALIGNMENT: "plan_alignment",
  EVIDENCE_PRESENCE: "evidence_presence",
  EXPLANATION: "explanation",
  THESIS_CONNECTION: "thesis_connection",
  TRANSITION: "transition",
  DUPLICATION: "duplication",
  UNDERDEVELOPMENT: "underdevelopment",
});

const SIGNAL_TO_TARGET = Object.freeze({
  missing_evidence: REVISION_TARGET_IDS.EVIDENCE_PRESENCE,
  wrong_source_evidence: REVISION_TARGET_IDS.EVIDENCE_PRESENCE,
  fragmentary_reasoning: REVISION_TARGET_IDS.EXPLANATION,
  missing_explanation_after_quote: REVISION_TARGET_IDS.EXPLANATION,
  plan_alignment: REVISION_TARGET_IDS.PLAN_ALIGNMENT,
  thesis_connection: REVISION_TARGET_IDS.THESIS_CONNECTION,
  duplicate_body_prose: REVISION_TARGET_IDS.DUPLICATION,
  transition_context: REVISION_TARGET_IDS.TRANSITION,
  stale_upstream: REVISION_TARGET_IDS.PLAN_ALIGNMENT,
});

export const REVISION_TARGET_META = Object.freeze({
  [REVISION_TARGET_IDS.PLAN_ALIGNMENT]: {
    id: REVISION_TARGET_IDS.PLAN_ALIGNMENT,
    title: "Align with the paragraph purpose",
    teach:
      "Compare your paragraph with the purpose you planned. Strengthen the sentences that should prove that point.",
  },
  [REVISION_TARGET_IDS.EVIDENCE_PRESENCE]: {
    id: REVISION_TARGET_IDS.EVIDENCE_PRESENCE,
    title: "Check that this quotation comes from the source you planned",
    teach:
      "Check that this quotation comes from the source you planned. Keep the evidence that belongs in this paragraph.",
  },
  [REVISION_TARGET_IDS.EXPLANATION]: {
    id: REVISION_TARGET_IDS.EXPLANATION,
    title: "Explain after evidence",
    teach:
      "After a quotation or paraphrase, explain how the evidence supports the paragraph point.",
  },
  [REVISION_TARGET_IDS.THESIS_CONNECTION]: {
    id: REVISION_TARGET_IDS.THESIS_CONNECTION,
    title: "Connect to the thesis",
    teach:
      "Make the relationship between this paragraph and the thesis easier for a reader to follow.",
  },
  [REVISION_TARGET_IDS.TRANSITION]: {
    id: REVISION_TARGET_IDS.TRANSITION,
    title: "Smooth the transition",
    teach:
      "Look at both sides of the handoff—the end of the previous idea and the opening of this one.",
  },
  [REVISION_TARGET_IDS.DUPLICATION]: {
    id: REVISION_TARGET_IDS.DUPLICATION,
    title: "Remove or combine repetition",
    teach:
      "When two body paragraphs say nearly the same thing, revise so each carries a distinct job.",
  },
  [REVISION_TARGET_IDS.UNDERDEVELOPMENT]: {
    id: REVISION_TARGET_IDS.UNDERDEVELOPMENT,
    title: "Develop the paragraph",
    teach:
      "Add the missing move—context, evidence, explanation, or thesis connection—without starting over.",
  },
});

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function observationHint(observation) {
  const text = safeText(observation).toLowerCase();
  if (!text) return null;
  if (/repeat|same|duplicat|identical/.test(text)) return REVISION_TARGET_IDS.DUPLICATION;
  if (/transition|abrupt|jump|handoff|flow/.test(text)) return REVISION_TARGET_IDS.TRANSITION;
  if (/explain|explanation|after (the )?quote|evidence/.test(text)) {
    return REVISION_TARGET_IDS.EXPLANATION;
  }
  if (/thesis|claim|argument/.test(text)) return REVISION_TARGET_IDS.THESIS_CONNECTION;
  if (/purpose|point|topic/.test(text)) return REVISION_TARGET_IDS.PLAN_ALIGNMENT;
  return null;
}

/**
 * @param {object} input
 * @returns {{
 *   health: object[],
 *   recommendedTarget: object,
 *   alternateTargets: object[],
 *   inspectLocus: string,
 *   priorParagraphProse: string,
 *   confidenceNote: string
 * }}
 */
export function diagnoseBodyParagraphRevision(input = {}) {
  const health = diagnoseBodyParagraphHealth(input);
  const top = pickHighestLeverageHealthSignal(health);
  const fromObservation = observationHint(input.readAloudObservation);

  let targetId =
    (top && SIGNAL_TO_TARGET[top.id]) ||
    fromObservation ||
    REVISION_TARGET_IDS.UNDERDEVELOPMENT;

  // Student observation can elevate transition/duplication when health is weak.
  if (
    fromObservation &&
    (!top || top.confidence === "low" || top.severity === "info")
  ) {
    targetId = fromObservation;
  }

  if (!safeText(input.assembledProse) || safeText(input.assembledProse).length < 40) {
    targetId = REVISION_TARGET_IDS.UNDERDEVELOPMENT;
  }

  const recommendedTarget =
    REVISION_TARGET_META[targetId] || REVISION_TARGET_META[REVISION_TARGET_IDS.UNDERDEVELOPMENT];

  const alternateIds = Object.values(REVISION_TARGET_IDS).filter((id) => id !== targetId);
  const alternateTargets = alternateIds.map((id) => REVISION_TARGET_META[id]);

  return {
    health,
    recommendedTarget,
    alternateTargets,
    inspectLocus: top?.locus || recommendedTarget.id,
    priorParagraphProse: safeText(input.priorParagraphProse),
    confidenceNote:
      "This suggestion may not fit perfectly. You choose what to revise.",
  };
}

/**
 * Revision baseline helpers for draft_meta.verticalSlice.revisionBySourceIndex
 */
export function getRevisionFromDraftMeta(draftMeta, sourceParagraphIndex) {
  const map = draftMeta?.verticalSlice?.revisionBySourceIndex;
  if (!map || typeof map !== "object") return null;
  return map[String(sourceParagraphIndex)] ?? map[sourceParagraphIndex] ?? null;
}

export function setRevisionInDraftMeta(draftMeta, sourceParagraphIndex, revisionState) {
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
  revisionBySourceIndex[String(sourceParagraphIndex)] = revisionState;
  verticalSlice.revisionBySourceIndex = revisionBySourceIndex;
  return { ...prev, verticalSlice };
}

/**
 * Capture Before when the untouched paragraph first enters the revision workspace.
 * Does nothing if a baseline already exists. Never uses post-edit prose as Before.
 * @returns {object|null} next revision state, or null when no change is needed
 */
export function ensureRevisionBaseline(existing, { prose } = {}) {
  const prev = existing && typeof existing === "object" ? existing : {};
  if (typeof prev.before === "string" && prev.before.trim().length > 0) {
    return null;
  }
  const text = String(prose ?? "");
  if (!text.trim()) return null;
  return {
    before: text,
    after: typeof prev.after === "string" && prev.after.length > 0 ? prev.after : text,
    targetId: prev.targetId || null,
    clearerConfirmed:
      typeof prev.clearerConfirmed === "boolean" ? prev.clearerConfirmed : false,
  };
}

/**
 * Update After (and optional target/clearer). Preserves an existing Before baseline.
 * If Before was never captured, falls back to current prose only as a last resort.
 */
export function applyRevisionCompareState(existing, { prose, targetId, clearerConfirmed }) {
  const prev = existing && typeof existing === "object" ? existing : {};
  const hasBefore = typeof prev.before === "string" && prev.before.trim().length > 0;
  const before = hasBefore ? prev.before : String(prose ?? "");
  return {
    before,
    after: String(prose ?? ""),
    targetId: targetId || prev.targetId || null,
    clearerConfirmed:
      typeof clearerConfirmed === "boolean"
        ? clearerConfirmed
        : Boolean(prev.clearerConfirmed),
  };
}
