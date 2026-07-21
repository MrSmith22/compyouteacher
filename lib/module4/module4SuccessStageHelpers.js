/**
 * Module 4 Checkpoint 5 repair — ephemeral success-page stages.
 * Presentation only. Does not write plans or artifacts.
 */

export const SUCCESS_STAGE_CELEBRATE = 1;
export const SUCCESS_STAGE_EXPLORE = 2;
export const SUCCESS_STAGE_HANDOFF = 3;

export const SUCCESS_STAGE_COUNT = 3;

export const SUCCESS_EYEBROW = "Module 4 · success";

export const SUCCESS_STAGE_META = {
  [SUCCESS_STAGE_CELEBRATE]: {
    id: SUCCESS_STAGE_CELEBRATE,
    label: "Celebrate the argument plan",
    heading: "You've organized your ideas. Now we'll build an outline.",
    question: "You've organized your ideas. Now we'll build an outline.",
    primaryActionLabel: "Review what you built",
  },
  [SUCCESS_STAGE_EXPLORE]: {
    id: SUCCESS_STAGE_EXPLORE,
    label: "Explore the completed plans",
    question: "What did each paragraph plan contribute?",
    primaryActionLabel: "See what happens next",
  },
  [SUCCESS_STAGE_HANDOFF]: {
    id: SUCCESS_STAGE_HANDOFF,
    label: "Move into Module 5",
    question: "How will these plans become my outline?",
    primaryActionLabel: "Continue to Module 5 — organize your outline",
  },
};

export const SUCCESS_TRANSFORM_STEPS = [
  "Points become outline paragraph focuses",
  "Selected evidence comes along",
  "Reasoning becomes planning support",
  "You are not restarting",
  "Introduction and conclusion stay on the essay map—conclusion planning happens in Module 5",
];

export const SUCCESS_LAYOUT_CONTRACT = {
  desktop: {
    workspaceRail: true,
    planSummariesGrid: true,
    boundedTextLines: true,
  },
  tablet: {
    twoColumnOrStacked: true,
    planNavigationVisible: true,
  },
  mobile: {
    singleColumn: true,
    teacherGuidanceBelow: true,
    fullWidthControls: true,
    noHorizontalScroll: true,
    noStickyOverlap: true,
  },
};

export function getSuccessStageMeta(stage = SUCCESS_STAGE_CELEBRATE) {
  return (
    SUCCESS_STAGE_META[stage] || SUCCESS_STAGE_META[SUCCESS_STAGE_CELEBRATE]
  );
}

export function getSuccessTeacherGuidance({
  stage = SUCCESS_STAGE_CELEBRATE,
  planIndex = 0,
  planArtifacts = [],
} = {}) {
  if (stage === SUCCESS_STAGE_CELEBRATE) {
    return {
      coaching:
        "You now have the thinking for your body paragraphs. You are not starting over in Module 5.",
      nextStep: "Next, look closely at what each paragraph plan contributed.",
    };
  }

  if (stage === SUCCESS_STAGE_EXPLORE) {
    const plan = planArtifacts[planIndex];
    const n = plan?.paragraphNumber || planIndex + 1;
    const job = plan?.job?.label || "this paragraph’s job";
    return {
      coaching: `Body Paragraph ${n} carries the job “${job}.” Notice how its point, evidence, and reasoning work together.`,
      nextStep:
        planIndex < (planArtifacts.length || 1) - 1
          ? "Switch to another paragraph, or continue when you have reviewed the set."
          : "When you have reviewed your plans, see how Module 5 will use them.",
      planProgressLabel: `Body Paragraph ${n} of ${planArtifacts.length || 1}`,
    };
  }

  return {
    coaching: "Module 5 will organize the plans you already built.",
    nextStep: "Continue when you are ready to arrange these plans into an outline.",
  };
}

export function resolveSuccessInternalAdvance({
  stage = SUCCESS_STAGE_CELEBRATE,
} = {}) {
  if (stage === SUCCESS_STAGE_CELEBRATE) {
    return { stage: SUCCESS_STAGE_EXPLORE, writesArtifacts: false };
  }
  if (stage === SUCCESS_STAGE_EXPLORE) {
    return { stage: SUCCESS_STAGE_HANDOFF, writesArtifacts: false };
  }
  return { stage: SUCCESS_STAGE_HANDOFF, writesArtifacts: false, exit: true };
}

export function resolveSuccessInternalBack({
  stage = SUCCESS_STAGE_CELEBRATE,
} = {}) {
  if (stage === SUCCESS_STAGE_HANDOFF) {
    return { stage: SUCCESS_STAGE_EXPLORE, writesArtifacts: false };
  }
  if (stage === SUCCESS_STAGE_EXPLORE) {
    return { stage: SUCCESS_STAGE_CELEBRATE, writesArtifacts: false };
  }
  return { stage: SUCCESS_STAGE_CELEBRATE, writesArtifacts: false };
}

export function buildSuccessStageSnapshot({
  stage = SUCCESS_STAGE_CELEBRATE,
  summary = null,
  planIndex = 0,
} = {}) {
  const s = summary || {};
  const plans = Array.isArray(s.paragraphPlans) ? s.paragraphPlans : [];
  const foundation = s.evidenceFoundation || {};

  if (stage === SUCCESS_STAGE_CELEBRATE) {
    return {
      stage,
      heading: SUCCESS_STAGE_META[SUCCESS_STAGE_CELEBRATE].heading,
      showsThesis: true,
      showsCompactMap: true,
      showsFullPlanExplorer: false,
      showsModule5Cta: false,
      thesis: s.thesis?.text || "",
      planCount: plans.length,
      progress: "1 of 3",
    };
  }

  if (stage === SUCCESS_STAGE_EXPLORE) {
    const active = plans[planIndex] || null;
    return {
      stage,
      showsThesis: false,
      showsCompactThesisReference: true,
      showsFullPlanExplorer: true,
      activeParagraphNumber: active?.paragraphNumber || null,
      evidenceFoundation: {
        completedPlanCount: foundation.completedPlanCount,
        totalQualifyingEvidence: foundation.totalQualifyingEvidence,
        speechCount: foundation.speechCount,
        letterCount: foundation.letterCount,
        bothWorksVerified: foundation.bothWorksVerified,
      },
      progress: "2 of 3",
    };
  }

  return {
    stage,
    showsTransformVisual: true,
    showsModule5Cta: true,
    primaryCtaHref: s.primaryCtaHref || "/modules/5",
    secondaryReviewHref: s.secondaryReviewHref || "/modules/4",
    transformSteps: Array.isArray(SUCCESS_TRANSFORM_STEPS)
      ? [...SUCCESS_TRANSFORM_STEPS]
      : [],
    progress: "3 of 3",
  };
}

export function successReloadResetsToCelebrate() {
  return {
    initialStage: SUCCESS_STAGE_CELEBRATE,
    writesArtifacts: false,
    mutatesPlans: false,
  };
}
