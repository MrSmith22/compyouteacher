/**
 * Module 4 Checkpoint 5 repair — ephemeral final-review stages.
 * Presentation / navigation only. Does not write buckets or artifacts.
 */

import { REFLECTION_MIN_CHARS } from "./module4ValidityHelpers.js";
import { buildRequiredPlanArtifacts } from "./module4ParagraphPlanArtifactHelpers.js";

export const REVIEW_STAGE_MAP = 1;
export const REVIEW_STAGE_PLANS = 2;
export const REVIEW_STAGE_COMPARE = 3;

export const REVIEW_STAGE_COUNT = 3;

export const REVIEW_EYEBROW = "Module 4 · final review";

export const REVIEW_STAGE_META = {
  [REVIEW_STAGE_MAP]: {
    id: REVIEW_STAGE_MAP,
    label: "See the paragraph map",
    question: "How do my paragraph plans divide the work of the essay?",
    primaryActionLabel: "Review Paragraph 1",
  },
  [REVIEW_STAGE_PLANS]: {
    id: REVIEW_STAGE_PLANS,
    label: "Review one plan at a time",
    question: "Does this paragraph plan still say what I mean?",
    primaryActionLabel: "Next paragraph",
    lastPlanActionLabel: "Compare my plans",
  },
  [REVIEW_STAGE_COMPARE]: {
    id: REVIEW_STAGE_COMPARE,
    label: "Compare and reflect",
    question: "What do I notice when I read my paragraph plans together?",
    primaryActionLabel: "Finish Module 4",
  },
};

export const REVIEW_COMPARE_PROMPTS = [
  "Does each paragraph do a distinct part of the essay?",
  "Do the plans work together to support the thesis?",
  "What might I reorder or deepen in Module 5?",
];

export const REVIEW_LAYOUT_CONTRACT = {
  desktop: {
    workspaceRail: true,
    compactPlansGrid: true,
    activePlanFullWidth: true,
  },
  tablet: {
    twoColumnOrStacked: true,
    planNavigationVisible: true,
  },
  mobile: {
    singleColumn: true,
    teacherGuidanceBelow: true,
    noHorizontalScroll: true,
    reflectionAfterCompare: true,
  },
};

const PLAN_GUIDANCE = [
  {
    coaching:
      "Check that the paragraph point and job still match: the point is what this paragraph proves; the job is how it fits the essay.",
    nextStep: "Next, look at whether the selected evidence still fits this plan.",
  },
  {
    coaching:
      "Ask whether each quotation still belongs with this paragraph’s point and job—not just whether it is interesting.",
    nextStep: "Next, check that the reasoning connects evidence to the thesis.",
  },
  {
    coaching:
      "Read the reasoning once. A reader should see how this evidence helps prove the thesis.",
    nextStep: "When this plan feels solid, continue to the next paragraph or comparison.",
  },
];

export function getReviewStageMeta(stage = REVIEW_STAGE_MAP) {
  return (
    REVIEW_STAGE_META[stage] || REVIEW_STAGE_META[REVIEW_STAGE_MAP]
  );
}

export function buildReviewCompactPlanCards(planArtifacts = []) {
  return (Array.isArray(planArtifacts) ? planArtifacts : []).map((artifact) => ({
    paragraphIndex: artifact.paragraphIndex,
    paragraphNumber: artifact.paragraphNumber,
    jobLabel: artifact.job?.label || "Job not set yet",
    point: artifact.point?.text || "",
    evidenceCount: artifact.evidence?.count || 0,
    ready: Boolean(artifact.ready),
    speechCount: (artifact.evidence?.items || []).filter(
      (item) => item.sourceType === "speech"
    ).length,
    letterCount: (artifact.evidence?.items || []).filter(
      (item) => item.sourceType === "letter"
    ).length,
  }));
}

export function buildFinalReviewPresentation({
  buckets = [],
  wantThirdBucket = null,
  getEvidenceSlots = () => [],
  thesis = "",
  proofPlan = [],
} = {}) {
  const planArtifacts = buildRequiredPlanArtifacts({
    buckets,
    wantThirdBucket,
    getEvidenceSlots,
    thesis,
    proofPlan,
  });
  const compactCards = buildReviewCompactPlanCards(planArtifacts);
  return {
    writesArtifacts: false,
    thesis: typeof thesis === "string" ? thesis.trim() : "",
    planArtifacts,
    compactCards,
    planCount: planArtifacts.length,
    requiredPlanCount: wantThirdBucket === true ? 3 : 2,
    layout: REVIEW_LAYOUT_CONTRACT,
    reflectionMinChars: REFLECTION_MIN_CHARS,
    comparePrompts: [...REVIEW_COMPARE_PROMPTS],
  };
}

export function getReviewTeacherGuidance({
  stage = REVIEW_STAGE_MAP,
  planIndex = 0,
  planCount = 2,
} = {}) {
  if (stage === REVIEW_STAGE_MAP) {
    return {
      coaching:
        "First, check whether each paragraph is doing a clear part of the argument.",
      nextStep: "Then review Paragraph 1 closely—one plan at a time.",
    };
  }

  if (stage === REVIEW_STAGE_PLANS) {
    const guidance = PLAN_GUIDANCE[planIndex % PLAN_GUIDANCE.length];
    const n = planIndex + 1;
    return {
      coaching: guidance.coaching,
      nextStep:
        planIndex < planCount - 1
          ? `After this check, move to Paragraph ${n + 1}.`
          : guidance.nextStep,
      planProgressLabel: `Paragraph ${n} of ${planCount}`,
    };
  }

  return {
    coaching:
      "A short, honest reflection is enough. Name one strength, connection, or next step.",
    nextStep: "When your reflection is ready, finish Module 4 and move toward outlining.",
  };
}

export function getReviewPrimaryActionLabel({
  stage = REVIEW_STAGE_MAP,
  planIndex = 0,
  planCount = 2,
} = {}) {
  if (stage === REVIEW_STAGE_MAP) {
    return REVIEW_STAGE_META[REVIEW_STAGE_MAP].primaryActionLabel;
  }
  if (stage === REVIEW_STAGE_PLANS) {
    if (planIndex >= planCount - 1) {
      return REVIEW_STAGE_META[REVIEW_STAGE_PLANS].lastPlanActionLabel;
    }
    return "Next paragraph";
  }
  return REVIEW_STAGE_META[REVIEW_STAGE_COMPARE].primaryActionLabel;
}

export function resolveReviewInternalAdvance({
  stage = REVIEW_STAGE_MAP,
  planIndex = 0,
  planCount = 2,
} = {}) {
  const count = Math.max(1, Number(planCount) || 1);
  const index = Math.max(0, Number(planIndex) || 0);

  if (stage === REVIEW_STAGE_MAP) {
    return {
      stage: REVIEW_STAGE_PLANS,
      planIndex: 0,
      complete: false,
      writesArtifacts: false,
    };
  }

  if (stage === REVIEW_STAGE_PLANS) {
    if (index < count - 1) {
      return {
        stage: REVIEW_STAGE_PLANS,
        planIndex: index + 1,
        complete: false,
        writesArtifacts: false,
      };
    }
    return {
      stage: REVIEW_STAGE_COMPARE,
      planIndex: index,
      complete: false,
      writesArtifacts: false,
    };
  }

  return {
    stage: REVIEW_STAGE_COMPARE,
    planIndex: index,
    complete: true,
    writesArtifacts: false,
  };
}

export function resolveReviewInternalBack({
  stage = REVIEW_STAGE_MAP,
  planIndex = 0,
} = {}) {
  const index = Math.max(0, Number(planIndex) || 0);

  if (stage === REVIEW_STAGE_COMPARE) {
    return {
      stage: REVIEW_STAGE_PLANS,
      planIndex: index,
      writesArtifacts: false,
    };
  }

  if (stage === REVIEW_STAGE_PLANS) {
    if (index > 0) {
      return {
        stage: REVIEW_STAGE_PLANS,
        planIndex: index - 1,
        writesArtifacts: false,
      };
    }
    return {
      stage: REVIEW_STAGE_MAP,
      planIndex: 0,
      writesArtifacts: false,
    };
  }

  return {
    stage: REVIEW_STAGE_MAP,
    planIndex: 0,
    writesArtifacts: false,
  };
}

/** Snapshot for tests: stage 1 must not include full reasoning/quotations. */
export function buildReviewStageSnapshot({
  stage = REVIEW_STAGE_MAP,
  presentation = null,
  planIndex = 0,
} = {}) {
  const p = presentation || {};
  const cards = Array.isArray(p.compactCards) ? p.compactCards : [];
  const plans = Array.isArray(p.planArtifacts) ? p.planArtifacts : [];

  if (stage === REVIEW_STAGE_MAP) {
    return {
      stage,
      showsCompactMap: true,
      showsFullArtifacts: false,
      showsReflection: false,
      thesis: p.thesis || "",
      compactCardCount: cards.length,
      fields: cards.flatMap((card) => [
        `P${card.paragraphNumber}`,
        card.jobLabel,
        card.point,
        `evidence:${card.evidenceCount}`,
      ]),
    };
  }

  if (stage === REVIEW_STAGE_PLANS) {
    const active = plans[planIndex] || null;
    return {
      stage,
      showsCompactMap: false,
      showsFullArtifacts: true,
      activePlanOnly: true,
      activeParagraphNumber: active?.paragraphNumber || null,
      showsReflection: false,
      reviewedCompactCount: Math.max(0, planIndex),
    };
  }

  return {
    stage,
    showsCompactMap: false,
    showsFullArtifacts: false,
    showsCompareSummaries: true,
    showsReflection: true,
    reflectionMinChars: REFLECTION_MIN_CHARS,
    compactCardCount: cards.length,
  };
}
