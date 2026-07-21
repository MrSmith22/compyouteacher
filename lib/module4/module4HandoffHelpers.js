/**
 * Module 4 Checkpoint 2 — handoff + paragraph-plan teaching helpers.
 * Presentation and safe flow migration only. Does not write Module 3 artifacts
 * or change Module 4 bucket persistence shapes.
 */

import {
  SUCCESS_PROOF_PLAN_LABELS,
  buildSuccessProofPlanItems,
} from "../module3/moduleThreeSuccessHelpers.js";
import {
  getModuleRoleTransition,
} from "../transitions/moduleRoleTransitions.js";

const TRANSITION_3_TO_4 = getModuleRoleTransition(3, 4);

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

export const MODULE4_HANDOFF_CTA_LABEL = "Start Body Paragraph 1";

export const MODULE4_HANDOFF_EYEBROW = "Module 3 → Module 4";

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

/** Two-sentence transition shown under the single handoff title. */
export const HANDOFF_TRANSITION_SENTENCES = [
  TRANSITION_3_TO_4.accomplishment,
  `${TRANSITION_3_TO_4.nextRole} ${TRANSITION_3_TO_4.continuity}`,
];

/** @deprecated Prefer HANDOFF_TRANSITION_SENTENCES; kept for compatibility. */
export const HANDOFF_START_HERE_LINES = HANDOFF_TRANSITION_SENTENCES;

export const HANDOFF_PLAN_VS_PROSE =
  "A paragraph plan is not finished prose. Name the main idea, choose evidence, then write introduction, explanation, and thesis connection together in reasoning later.";

export const HANDOFF_BUILD_BRIEF =
  "At least two paragraph plans are required. A third is optional only if your thesis needs another body move.";

export const HANDOFF_BUILD_LINES = [
  "You will build at least two paragraph plans.",
  "A third plan is optional only if your thesis needs another body move.",
  "Plans later become an outline, then drafted paragraphs.",
  "You will work on one paragraph at a time.",
];

export const HANDOFF_EVIDENCE_FOUNDATION_NOTE =
  "Earlier explanations appear when you choose evidence.";

export const HANDOFF_STAGE_ARGUMENT = 1;
export const HANDOFF_STAGE_MODEL = 2;
export const HANDOFF_STAGE_READY = 3;

export const HANDOFF_INTERNAL_STAGES = [
  {
    id: HANDOFF_STAGE_ARGUMENT,
    key: "argument",
    label: "Your argument",
    question: "What argument am I bringing into Module 4?",
    primaryActionLabel: "See how a paragraph plan works",
    advancesDurableFlow: false,
  },
  {
    id: HANDOFF_STAGE_MODEL,
    key: "model",
    label: "Paragraph plan",
    question: "How does one paragraph plan become a paragraph later?",
    primaryActionLabel: "See what you will build",
    advancesDurableFlow: false,
  },
  {
    id: HANDOFF_STAGE_READY,
    key: "ready",
    label: "Get ready",
    question: "What will I build in Module 4?",
    primaryActionLabel: MODULE4_HANDOFF_CTA_LABEL,
    advancesDurableFlow: true,
  },
];

export const HANDOFF_STAGE1_ACCOMPLISHMENT = `${TRANSITION_3_TO_4.accomplishment} ${TRANSITION_3_TO_4.nextRole}`;

export const HANDOFF_STAGE3_EXPECTATIONS = [
  "You will build at least two paragraph plans.",
  "A third plan is optional only if your thesis needs another body move.",
  "You will work on one paragraph at a time.",
  "Plans later become Module 5’s outline, then drafted paragraphs.",
];

const FUNCTION_TEACHER_COACHING = [
  "The main idea is the one point this paragraph will prove—not the whole thesis.",
  "Before the quotation, readers need just enough context to place the words.",
  "Evidence is the specific words from the text—not a paraphrase yet.",
  "Explanation shows what those words reveal about your idea.",
  "The thesis connection is how this paragraph helps prove the essay’s argument.",
];

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
  const sourceType = firstEvidence
    ? String(firstEvidence.type || "").toLowerCase()
    : "";
  const appeal = firstEvidence
    ? String(firstEvidence.category || "").toLowerCase()
    : "";

  const introduceParts = [];
  if (sourceType === "speech" || sourceType === "letter") {
    introduceParts.push(
      sourceType === "speech" ? "Speech" : "Letter"
    );
  }
  if (appeal) introduceParts.push(`${appeal} appeal`);
  const introduceContext = introduceParts.length
    ? `Readers need to know this moment comes from the ${introduceParts.join(
        " · "
      )} before they meet the quotation.`
    : "";

  return {
    thesis: safeText(thesis),
    proofPlanNote: firstPlan
      ? { label: firstPlan.label, text: firstPlan.text }
      : null,
    introduceContext,
    quotation: firstEvidence
      ? {
          quote: safeText(firstEvidence.quote),
          sourceType,
          appeal,
          priorThinking: observation,
        }
      : null,
  };
}

/**
 * One instructional demo per paragraph-plan function, using saved student work.
 * Labels make clear these are saved artifacts / function examples—not drafted prose.
 */
export function buildHandoffFunctionDemos(presentation = {}) {
  const p = presentation || {};
  const examples = p.modelExamples || {};
  const functions = Array.isArray(p.paragraphFunctions)
    ? p.paragraphFunctions
    : PARAGRAPH_PLAN_FUNCTIONS;

  return functions.map((fn, index) => {
    let demo = {
      kind: "placeholder",
      artifactLabel: "Saved Module 3 work",
      body: "Your saved Module 3 work will appear here when it is available.",
      sourceType: "",
    };

    if (fn.id === "main_idea" && examples.proofPlanNote) {
      demo = {
        kind: "proof_plan",
        artifactLabel: `Saved proof-plan note · ${examples.proofPlanNote.label}`,
        body: examples.proofPlanNote.text,
        sourceType: "",
      };
    } else if (fn.id === "introduce_evidence") {
      demo = {
        kind: "introduce",
        artifactLabel: "Saved source context (example of introducing evidence)",
        body:
          examples.introduceContext ||
          "When you plan, you will tell readers where the quotation comes from before you quote.",
        sourceType: examples.quotation?.sourceType || "",
      };
    } else if (fn.id === "evidence" && examples.quotation?.quote) {
      demo = {
        kind: "quotation",
        artifactLabel: "Saved quotation · evidence",
        body: examples.quotation.quote,
        sourceType: examples.quotation.sourceType || "",
      };
    } else if (fn.id === "explain_evidence") {
      demo = {
        kind: "explanation",
        artifactLabel: examples.quotation?.priorThinking
          ? "Saved Module 2 / Module 3 note · explain evidence"
          : "Saved thinking (example of explaining evidence)",
        body:
          examples.quotation?.priorThinking ||
          "Your observation or CONNECT note will show what the words reveal.",
        sourceType: examples.quotation?.sourceType || "",
      };
    } else if (fn.id === "connect_to_thesis" && examples.thesis) {
      demo = {
        kind: "thesis",
        artifactLabel: "Saved thesis · connect to the thesis",
        body: examples.thesis,
        sourceType: "",
      };
    }

    return {
      functionId: fn.id,
      title: fn.title,
      description: fn.description,
      index,
      coaching: FUNCTION_TEACHER_COACHING[index] || "",
      demo,
    };
  });
}

export function getHandoffStageMeta(stageId) {
  return (
    HANDOFF_INTERNAL_STAGES.find((stage) => stage.id === stageId) ||
    HANDOFF_INTERNAL_STAGES[0]
  );
}

/**
 * Dynamic teacher guidance for the ephemeral handoff stage / function.
 */
export function getHandoffTeacherGuidance({
  stage = HANDOFF_STAGE_ARGUMENT,
  functionIndex = 0,
  showCompleteModel = false,
} = {}) {
  if (stage === HANDOFF_STAGE_ARGUMENT) {
    return {
      coaching: "You are carrying your argument forward—not starting again.",
      nextStep: "Next you will learn the five jobs inside one paragraph plan.",
    };
  }

  if (stage === HANDOFF_STAGE_MODEL) {
    if (showCompleteModel) {
      return {
        coaching:
          "Those five jobs stay in order when you plan. You are not writing the finished paragraph yet.",
        nextStep: "Next you will see what Module 4 asks you to build.",
      };
    }
    const demos = buildHandoffFunctionDemos({});
    const coaching =
      FUNCTION_TEACHER_COACHING[functionIndex] ||
      demos[functionIndex]?.coaching ||
      "Stay with one job at a time.";
    return {
      coaching,
      nextStep:
        functionIndex < PARAGRAPH_PLAN_FUNCTIONS.length - 1
          ? "Continue to the next job in the paragraph plan."
          : "After this job, you will see the full five-part sequence.",
    };
  }

  return {
    coaching: "Plan the thinking first. The paragraph prose comes later.",
    nextStep: "Start Body Paragraph 1 when you are ready to write the main idea.",
  };
}

/**
 * Pure resolver for internal handoff navigation (presentation-only).
 * Never mutates artifacts or durable Module 4 flow.
 */
export function resolveHandoffInternalAdvance({
  stage,
  functionIndex = 0,
  showCompleteModel = false,
} = {}) {
  if (stage === HANDOFF_STAGE_ARGUMENT) {
    return {
      stage: HANDOFF_STAGE_MODEL,
      functionIndex: 0,
      showCompleteModel: false,
      advancesDurableFlow: false,
    };
  }

  if (stage === HANDOFF_STAGE_MODEL) {
    if (!showCompleteModel) {
      if (functionIndex < PARAGRAPH_PLAN_FUNCTIONS.length - 1) {
        return {
          stage: HANDOFF_STAGE_MODEL,
          functionIndex: functionIndex + 1,
          showCompleteModel: false,
          advancesDurableFlow: false,
        };
      }
      return {
        stage: HANDOFF_STAGE_MODEL,
        functionIndex: PARAGRAPH_PLAN_FUNCTIONS.length - 1,
        showCompleteModel: true,
        advancesDurableFlow: false,
      };
    }
    return {
      stage: HANDOFF_STAGE_READY,
      functionIndex: 0,
      showCompleteModel: false,
      advancesDurableFlow: false,
    };
  }

  return {
    stage: HANDOFF_STAGE_READY,
    functionIndex: 0,
    showCompleteModel: false,
    advancesDurableFlow: true,
  };
}

export function resolveHandoffInternalBack({
  stage,
  functionIndex = 0,
  showCompleteModel = false,
} = {}) {
  if (stage === HANDOFF_STAGE_READY) {
    return {
      stage: HANDOFF_STAGE_MODEL,
      functionIndex: PARAGRAPH_PLAN_FUNCTIONS.length - 1,
      showCompleteModel: true,
    };
  }

  if (stage === HANDOFF_STAGE_MODEL) {
    if (showCompleteModel) {
      return {
        stage: HANDOFF_STAGE_MODEL,
        functionIndex: PARAGRAPH_PLAN_FUNCTIONS.length - 1,
        showCompleteModel: false,
      };
    }
    if (functionIndex > 0) {
      return {
        stage: HANDOFF_STAGE_MODEL,
        functionIndex: functionIndex - 1,
        showCompleteModel: false,
      };
    }
    return {
      stage: HANDOFF_STAGE_ARGUMENT,
      functionIndex: 0,
      showCompleteModel: false,
    };
  }

  return null;
}

export function getHandoffPrimaryActionLabel({
  stage,
  showCompleteModel = false,
  functionIndex = 0,
} = {}) {
  if (stage === HANDOFF_STAGE_ARGUMENT) {
    return getHandoffStageMeta(HANDOFF_STAGE_ARGUMENT).primaryActionLabel;
  }
  if (stage === HANDOFF_STAGE_MODEL) {
    if (showCompleteModel) {
      return getHandoffStageMeta(HANDOFF_STAGE_MODEL).primaryActionLabel;
    }
    if (functionIndex < PARAGRAPH_PLAN_FUNCTIONS.length - 1) {
      return "Next job";
    }
    return "See the full sequence";
  }
  return MODULE4_HANDOFF_CTA_LABEL;
}

export function buildModule4HandoffPresentation({
  thesis = "",
  proofPlan = [],
  selectedPattern = null,
  evidencePool = [],
} = {}) {
  const proofPlanItems = buildHandoffProofPlanItems(proofPlan);
  const modelExamples = buildHandoffModelExamples({
    thesis,
    proofPlanItems,
    evidencePool,
  });
  const base = {
    question: MODULE4_HANDOFF_QUESTION,
    eyebrow: MODULE4_HANDOFF_EYEBROW,
    transitionSentences: HANDOFF_TRANSITION_SENTENCES,
    startHereLines: HANDOFF_START_HERE_LINES,
    accomplishment: HANDOFF_STAGE1_ACCOMPLISHMENT,
    thesis: safeText(thesis),
    proofPlanItems,
    patternText: safeText(selectedPattern?.text),
    evidenceFoundation: buildHandoffEvidenceFoundation({ evidencePool }),
    paragraphFunctions: PARAGRAPH_PLAN_FUNCTIONS,
    planVersusProse: HANDOFF_PLAN_VS_PROSE,
    buildBrief: HANDOFF_BUILD_BRIEF,
    buildLines: HANDOFF_BUILD_LINES,
    stage3Expectations: HANDOFF_STAGE3_EXPECTATIONS,
    modelExamples,
    ctaLabel: MODULE4_HANDOFF_CTA_LABEL,
    stages: HANDOFF_INTERNAL_STAGES,
  };
  return {
    ...base,
    functionDemos: buildHandoffFunctionDemos(base),
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

/**
 * True for the consolidated handoff surface (including legacy opening step
 * numbers that still render the handoff UI before migration settles).
 */
export function isModule4HandoffSurface(flowStep) {
  const step = Number(flowStep);
  return (
    step === STEP_HANDOFF ||
    step === STEP_WELCOME ||
    step === STEP_BIG_PICTURE ||
    step === STEP_EXPLAIN_BUCKETS
  );
}

/**
 * Presentation chrome flags for Module 4.
 * Handoff and final review use a guided teaching shell (no full desk chrome).
 * Paragraph and pattern steps keep the full desk.
 */
export function getModule4PresentationChrome(flowStep) {
  const step = Number(flowStep);
  const handoffSurface = isModule4HandoffSurface(step);
  const reviewSurface = step === STEP_REFLECTION;
  const guidedShell = handoffSurface || reviewSurface;
  const onModule =
    Number.isFinite(step) && step >= STEP_HANDOFF && step <= STEP_REFLECTION;

  return {
    useGuidedHandoffShell: guidedShell,
    useGuidedReviewShell: reviewSurface,
    useMinimalStepChrome: false,
    showPageQuestion: !guidedShell,
    showWhyMatters: !guidedShell,
    showExampleDisclosure: !guidedShell,
    showReflectionDisclosure: !guidedShell,
    showTeacherGuide: !guidedShell,
    showStepMetadata: !guidedShell,
    showWorkingSetLabel: !guidedShell,
    showSources: onModule && !guidedShell,
    showFullReferenceShelf: onModule && !guidedShell,
    showNavFooter: !guidedShell,
    onlyPrimaryActionLabel: handoffSurface ? MODULE4_HANDOFF_CTA_LABEL : null,
  };
}

/**
 * Count exact title occurrences in markup/text (presentation regression guard).
 */
export function countHandoffTitleOccurrences(
  text,
  title = MODULE4_HANDOFF_QUESTION
) {
  const source = typeof text === "string" ? text : "";
  if (!title || !source) return 0;
  let count = 0;
  let from = 0;
  while (from <= source.length) {
    const at = source.indexOf(title, from);
    if (at === -1) break;
    count += 1;
    from = at + title.length;
  }
  return count;
}

/**
 * Minimal markup snapshot of the handoff body for presentation tests.
 * Mirrors the compact hierarchy; does not invent finished paragraph prose.
 */
export function buildHandoffPresentationSnapshot(presentation = {}) {
  const p = presentation || {};
  const title = p.question || MODULE4_HANDOFF_QUESTION;
  const functions = Array.isArray(p.paragraphFunctions)
    ? p.paragraphFunctions
    : PARAGRAPH_PLAN_FUNCTIONS;
  const proofItems = Array.isArray(p.proofPlanItems) ? p.proofPlanItems : [];
  const lines = [
    p.eyebrow || MODULE4_HANDOFF_EYEBROW,
    title,
    ...(Array.isArray(p.transitionSentences)
      ? p.transitionSentences
      : HANDOFF_TRANSITION_SENTENCES),
    p.thesis || "",
    ...proofItems.map((item) => `${item.label}: ${item.text}`),
    p.patternText || "",
    p.evidenceFoundation?.summary || "",
    p.planVersusProse || HANDOFF_PLAN_VS_PROSE,
    ...functions.map((fn) => `${fn.title} — ${fn.description}`),
    p.buildBrief || HANDOFF_BUILD_BRIEF,
    p.ctaLabel || MODULE4_HANDOFF_CTA_LABEL,
  ];
  return lines.filter(Boolean).join("\n");
}
