/**
 * Module 4 Checkpoint 2 — handoff + paragraph-plan teaching helpers.
 * Presentation and safe flow migration only. Does not write Module 3 artifacts
 * or change Module 4 bucket persistence shapes.
 */

import {
  SUCCESS_PROOF_PLAN_LABELS,
  buildSuccessProofPlanItems,
} from "../module3/moduleThreeSuccessHelpers.js";

/** Keep in sync with components/module4/module4FlowSteps.js (FLOW_VERSION 3). */
export const FLOW_VERSION = 3;
export const STEP_HANDOFF = 0;
export const STEP_WELCOME = 0;
export const STEP_BIG_PICTURE = 1;
export const STEP_EXPLAIN_BUCKETS = 2;
export const STEP_PATTERN = 3;
export const STEP_B1_SCAFFOLD = 4;
export const STEP_B2_REASONING = 11;
export const STEP_THIRD_DECISION = 12;
export const STEP_B3_SCAFFOLD = 13;
export const STEP_B3_REASONING = 16;
export const STEP_REFLECTION = 17;

export { SUCCESS_PROOF_PLAN_LABELS };

export const MODULE4_HANDOFF_QUESTION =
  "How will my Module 3 argument become paragraph plans?";

export const MODULE4_HANDOFF_CTA_LABEL = "Start Paragraph 1";

export const PARAGRAPH_PLAN_FUNCTIONS = [
  {
    id: "main_idea",
    title: "Main idea",
    description: "What this paragraph will prove",
  },
  {
    id: "introduce_evidence",
    title: "Introduce evidence",
    description: "What readers need to know before the quotation",
  },
  {
    id: "evidence",
    title: "Evidence",
    description: "The specific words from the text",
  },
  {
    id: "explain_evidence",
    title: "Explain evidence",
    description: "What those words show",
  },
  {
    id: "connect_to_thesis",
    title: "Connect to the thesis",
    description: "How the paragraph helps prove the essay’s argument",
  },
];

export const HANDOFF_START_HERE_LINES = [
  "You already developed an idea, connected evidence, built a claim, and wrote a thesis in Module 3.",
  "Module 4 turns that argument into paragraph plans.",
  "You are organizing thinking you already started—not starting over, and not writing the full essay yet.",
];

export const HANDOFF_PLAN_VS_PROSE =
  "A paragraph plan is not finished paragraph prose. You will name the main idea, choose evidence, and later write the introduction, explanation, and thesis connection together in your reasoning. Plans become an outline, then drafted paragraphs.";

export const HANDOFF_BUILD_LINES = [
  "You will build at least two paragraph plans.",
  "A third plan is optional only if your thesis needs another body move.",
  "Plans later become an outline, then drafted paragraphs.",
  "You will work on one paragraph at a time.",
];

export const HANDOFF_EVIDENCE_FOUNDATION_NOTE =
  "Your earlier Module 2 notes and Module 3 connection explanations will appear when you choose evidence for each paragraph.";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * True when Module 3 V2 pattern artifacts include a selected pattern with text.
 * Does not rely solely on legacy Module 3 fields.
 */
export function hasValidSavedModule3Pattern(selectedPattern) {
  return safeText(selectedPattern?.text).length > 0;
}

export function buildHandoffProofPlanItems(proofPlan = []) {
  return buildSuccessProofPlanItems(proofPlan);
}

/**
 * Compact evidence-foundation summary for the handoff (not the full shelf).
 */
export function buildHandoffEvidenceFoundation({
  evidencePool = [],
} = {}) {
  const pool = Array.isArray(evidencePool) ? evidencePool : [];
  let speech = 0;
  let letter = 0;
  for (const row of pool) {
    const type = String(row?.type || "").toLowerCase();
    if (type === "letter") letter += 1;
    else if (type === "speech") speech += 1;
  }
  const quotationCount = pool.length;
  const bothWorks = speech > 0 && letter > 0;

  return {
    quotationCount,
    speechCount: speech,
    letterCount: letter,
    bothWorks,
    summary:
      quotationCount === 0
        ? "Your Module 3 working evidence will appear when it is available."
        : bothWorks
          ? `${quotationCount} quotation${quotationCount === 1 ? "" : "s"} in your current working set, including Speech and Letter.`
          : `${quotationCount} quotation${quotationCount === 1 ? "" : "s"} in your current working set.`,
    note: HANDOFF_EVIDENCE_FOUNDATION_NOTE,
  };
}

/**
 * Example materials for teaching the five-part model (read-only).
 * Does not invent transitional prose or a finished paragraph.
 */
export function buildHandoffModelExamples({
  thesis = "",
  proofPlanItems = [],
  evidencePool = [],
} = {}) {
  const firstPlan = Array.isArray(proofPlanItems) ? proofPlanItems[0] : null;
  const firstEvidence = (Array.isArray(evidencePool) ? evidencePool : []).find(
    (row) => safeText(row?.quote)
  );
  const observation = firstEvidence
    ? safeText(firstEvidence.observation) ||
      safeText(firstEvidence.module3Connection?.note)
    : "";

  return {
    thesis: safeText(thesis),
    proofPlanNote: firstPlan
      ? { label: firstPlan.label, text: firstPlan.text }
      : null,
    quotation: firstEvidence
      ? {
          quote: safeText(firstEvidence.quote),
          sourceType: String(firstEvidence.type || "").toLowerCase(),
          appeal: String(firstEvidence.category || "").toLowerCase(),
          priorThinking: observation,
        }
      : null,
  };
}

export function buildModule4HandoffPresentation({
  thesis = "",
  proofPlan = [],
  selectedPattern = null,
  evidencePool = [],
} = {}) {
  const proofPlanItems = buildHandoffProofPlanItems(proofPlan);
  return {
    question: MODULE4_HANDOFF_QUESTION,
    startHereLines: HANDOFF_START_HERE_LINES,
    thesis: safeText(thesis),
    proofPlanItems,
    patternText: safeText(selectedPattern?.text),
    evidenceFoundation: buildHandoffEvidenceFoundation({ evidencePool }),
    paragraphFunctions: PARAGRAPH_PLAN_FUNCTIONS,
    planVersusProse: HANDOFF_PLAN_VS_PROSE,
    buildLines: HANDOFF_BUILD_LINES,
    modelExamples: buildHandoffModelExamples({
      thesis,
      proofPlanItems,
      evidencePool,
    }),
    ctaLabel: MODULE4_HANDOFF_CTA_LABEL,
  };
}

/**
 * Migrate opening flow steps to Checkpoint 2 handoff / pattern fallback.
 * Never changes paragraph-planning steps (B1 scaffold and later).
 *
 * Migration map (FLOW_VERSION 3):
 * - Welcome (0), Big Picture (1), Explain (2) → Handoff when pattern saved,
 *   else Pattern fallback
 * - Pattern (3) + saved pattern → Handoff
 * - Pattern (3) + missing pattern → Pattern fallback
 * - B1 scaffold (4)+ → unchanged
 */
export function migrateOpeningFlowStep({
  flowStep,
  hasValidSavedPattern = false,
} = {}) {
  const step = Number(flowStep);
  if (!Number.isFinite(step)) {
    return hasValidSavedPattern ? STEP_HANDOFF : STEP_PATTERN;
  }

  if (step >= STEP_B1_SCAFFOLD) {
    return step;
  }

  // Opening zone: 0–3
  if (step === STEP_PATTERN) {
    return hasValidSavedPattern ? STEP_HANDOFF : STEP_PATTERN;
  }

  if (
    step === STEP_HANDOFF ||
    step === STEP_WELCOME ||
    step === STEP_BIG_PICTURE ||
    step === STEP_EXPLAIN_BUCKETS ||
    step < STEP_B1_SCAFFOLD
  ) {
    return hasValidSavedPattern ? STEP_HANDOFF : STEP_PATTERN;
  }

  return step;
}

export function openingBackTarget({ hasValidSavedPattern = false } = {}) {
  return hasValidSavedPattern ? STEP_HANDOFF : STEP_PATTERN;
}

/**
 * Pure back-target resolver for Module 4 navigation (Checkpoint 2).
 * Opening back from Paragraph 1 main idea returns handoff or pattern fallback.
 * Later paragraph Back targets stay sequential (unchanged from pre-Checkpoint 2).
 */
export function resolveModule4BackTarget({
  flowStep,
  hasValidSavedPattern = false,
  wantThirdBucket = null,
} = {}) {
  const step = Number(flowStep);
  if (!Number.isFinite(step) || step <= STEP_HANDOFF) return null;
  if (step === STEP_PATTERN && !hasValidSavedPattern) return null;
  if (step === STEP_B1_SCAFFOLD) {
    return openingBackTarget({ hasValidSavedPattern });
  }
  if (step === STEP_REFLECTION) {
    return wantThirdBucket === true ? STEP_B3_REASONING : STEP_THIRD_DECISION;
  }
  if (step === STEP_THIRD_DECISION) return STEP_B2_REASONING;
  if (step === STEP_B3_SCAFFOLD) return STEP_THIRD_DECISION;
  if (step === STEP_BIG_PICTURE || step === STEP_EXPLAIN_BUCKETS) {
    return STEP_HANDOFF;
  }
  return step - 1;
}

/**
 * Pure forward target after the opening zone.
 * Handoff and pattern fallback both enter Paragraph 1 main idea.
 */
export function resolveModule4OpeningAdvanceTarget(flowStep) {
  const step = Number(flowStep);
  if (
    step === STEP_HANDOFF ||
    step === STEP_WELCOME ||
    step === STEP_BIG_PICTURE ||
    step === STEP_EXPLAIN_BUCKETS ||
    step === STEP_PATTERN
  ) {
    return STEP_B1_SCAFFOLD;
  }
  return null;
}

export function isModule4OpeningStep(flowStep) {
  const step = Number(flowStep);
  return (
    Number.isFinite(step) &&
    step < STEP_B1_SCAFFOLD &&
    step >= STEP_HANDOFF
  );
}

/**
 * Whether a student with a valid saved pattern should see a required Pattern
 * review step. Checkpoint 2: never — pattern is presentation-only reference.
 */
export function requiresPatternReviewStep(hasValidSavedPattern) {
  return !hasValidSavedPattern;
}
