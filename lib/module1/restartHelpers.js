/**
 * Module 1 / assignment restart semantics (CP-A fresh-start repair).
 * Pure helpers — no network. Dev/server actions apply the plans.
 */

export const RESTART_ACTIONS = Object.freeze({
  RESTART_MODULE_1: "restart_module_1",
  RESTART_ENTIRE_ASSIGNMENT: "restart_entire_assignment",
  RESEED_SCENARIO: "reseed_scenario",
  /** Progression-only jump — not a content wipe */
  JUMP_TO_MODULE: "jump_to_module",
});

export const RESTART_ACTION_LABELS = Object.freeze({
  [RESTART_ACTIONS.RESTART_MODULE_1]: "Restart Module 1",
  [RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT]: "Restart the entire assignment",
  [RESTART_ACTIONS.RESEED_SCENARIO]: "Reseed a specific testing scenario",
  [RESTART_ACTIONS.JUMP_TO_MODULE]: "Jump to module (progression only)",
});

/** Tables cleared by Restart Module 1 */
export const MODULE_1_ARTIFACT_TABLES = Object.freeze([
  "module1_prompt_breakdown",
  "module1_quiz_results",
]);

/** Local/ephemeral Module 1 flow keys cleared on Module 1 restart */
export const MODULE_1_FLOW_CACHE_KEY_SPECS = Object.freeze([
  Object.freeze(["module1", "welcome"]),
  Object.freeze(["module1", "step2"]),
]);

/** @deprecated use MODULE_1_FLOW_CACHE_KEY_SPECS — kept for step2-only identity checks */
export const MODULE_1_FLOW_CACHE_PARTS = Object.freeze(["module1", "step2"]);

/**
 * Which browser-cache clear path an action must use.
 * Client code must honor this — Module 1-only never wipes Module 2+ keys.
 *
 * @returns {"none"|"module1_flow_only"|"all_user_scoped"}
 */
export function resolveBrowserCacheClearMode(action) {
  switch (action) {
    case RESTART_ACTIONS.RESTART_MODULE_1:
    case "reset_current_module_m1":
      return "module1_flow_only";
    case RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT:
    case "full_reset_student":
      return "all_user_scoped";
    case RESTART_ACTIONS.JUMP_TO_MODULE:
    case "ordinary_revisit":
    case RESTART_ACTIONS.RESEED_SCENARIO:
    default:
      return "none";
  }
}
/**
 * Detect whether downstream (Module 2+) work exists.
 * @param {{
 *   currentModule?: number | null,
 *   hasModule2Sources?: boolean,
 *   hasTcharts?: boolean,
 *   hasModule3?: boolean,
 *   hasLaterArtifacts?: boolean,
 * }} snapshot
 */
export function hasDownstreamAssignmentWork(snapshot = {}) {
  const module = Number(snapshot.currentModule) || 1;
  if (module > 1) return true;
  return Boolean(
    snapshot.hasModule2Sources ||
      snapshot.hasTcharts ||
      snapshot.hasModule3 ||
      snapshot.hasLaterArtifacts
  );
}

/**
 * Warning copy before destructive restart.
 * @param {string} action RESTART_ACTIONS value
 * @param {{ hasDownstream?: boolean }} [opts]
 */
export function getRestartWarning(action, opts = {}) {
  if (action === RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT) {
    return {
      requiresConfirmation: true,
      title: RESTART_ACTION_LABELS[action],
      message:
        "This deletes all assignment progress and student work for this student, then returns to Module 1 Step 1, Question 1 with empty work. This cannot be undone.",
      invalidatesDownstream: true,
    };
  }

  if (action === RESTART_ACTIONS.RESTART_MODULE_1) {
    if (opts.hasDownstream) {
      return {
        requiresConfirmation: true,
        title: RESTART_ACTION_LABELS[action],
        message:
          "This clears Module 1 prompt breakdown and quiz results and returns to Module 1 Step 1, Question 1. Later modules will no longer match Module 1 and may feel inconsistent until you reseed or continue carefully. Type OK to proceed.",
        invalidatesDownstream: true,
      };
    }
    return {
      requiresConfirmation: true,
      title: RESTART_ACTION_LABELS[action],
      message:
        "This clears Module 1 prompt breakdown, quiz results, and Step 2 draft progress, then opens Module 1 Step 1, Question 1 with empty student work.",
      invalidatesDownstream: false,
    };
  }

  if (action === RESTART_ACTIONS.RESEED_SCENARIO) {
    return {
      requiresConfirmation: false,
      title: RESTART_ACTION_LABELS[action],
      message:
        "Reseed writes a specific testing scenario. It does not silently wipe unrelated modules unless the seed target says so.",
      invalidatesDownstream: false,
    };
  }

  return {
    requiresConfirmation: false,
    title: RESTART_ACTION_LABELS[RESTART_ACTIONS.JUMP_TO_MODULE],
    message:
      "This only changes which module the dashboard resumes. It does not delete saved artifacts.",
    invalidatesDownstream: false,
  };
}

/**
 * Plan tables + progression for a named restart action.
 * Ordinary navigation never uses this.
 */
export function planRestartAction(action, opts = {}) {
  const hasDownstream = Boolean(opts.hasDownstream);

  if (action === RESTART_ACTIONS.RESTART_MODULE_1) {
    return {
      action,
      label: RESTART_ACTION_LABELS[action],
      tablesToClear: [...MODULE_1_ARTIFACT_TABLES],
      clearFlowCache: true,
      setCurrentModule: 1,
      resumePath: "/modules/1/prompt",
      entry: { module: 1, step: 1, question: 1 },
      warning: getRestartWarning(action, { hasDownstream }),
      clearsParaphrase: true,
      clearsQuiz: true,
    };
  }

  if (action === RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT) {
    return {
      action,
      label: RESTART_ACTION_LABELS[action],
      tablesToClear: "all_assignment_tables",
      clearFlowCache: true,
      clearStudentAssignments: true,
      setCurrentModule: null,
      resumePath: "/modules/1/prompt",
      entry: { module: 1, step: 1, question: 1 },
      warning: getRestartWarning(action),
      clearsParaphrase: true,
      clearsQuiz: true,
    };
  }

  if (action === RESTART_ACTIONS.RESEED_SCENARIO) {
    return {
      action,
      label: RESTART_ACTION_LABELS[action],
      tablesToClear: [],
      clearFlowCache: false,
      setCurrentModule: null,
      resumePath: null,
      entry: null,
      warning: getRestartWarning(action),
      clearsParaphrase: false,
      clearsQuiz: false,
      scenarioTarget: opts.scenarioTarget || null,
    };
  }

  // Jump — progression only
  return {
    action: RESTART_ACTIONS.JUMP_TO_MODULE,
    label: RESTART_ACTION_LABELS[RESTART_ACTIONS.JUMP_TO_MODULE],
    tablesToClear: [],
    clearFlowCache: false,
    setCurrentModule: opts.moduleNumber ?? 1,
    resumePath: `/modules/${Math.min(opts.moduleNumber ?? 1, 9)}`,
    entry: null,
    warning: getRestartWarning(RESTART_ACTIONS.JUMP_TO_MODULE),
    clearsParaphrase: false,
    clearsQuiz: false,
  };
}

/**
 * Coherence: progression and artifacts must not disagree after restart planning.
 * @param {{
 *   currentModule: number,
 *   hasPromptBreakdown: boolean,
 *   hasQuizResult: boolean,
 *   paraphrase?: string,
 * }} state
 */
export function diagnoseProgressionArtifactCoherence(state) {
  const module = Number(state.currentModule) || 1;
  const paraphrase = String(state.paraphrase || "").trim();
  const hasPrompt = Boolean(state.hasPromptBreakdown) || paraphrase.length > 0;
  const hasQuiz = Boolean(state.hasQuizResult);

  const issues = [];

  // Progression says M1 but completed M1 quiz exists without expecting revisit
  if (module === 1 && hasQuiz && !hasPrompt) {
    issues.push({
      code: "quiz_without_prompt",
      message: "Quiz results exist without a prompt breakdown.",
    });
  }

  // Progression reset to M1 while paraphrase survives → UI jumps to Step 2
  if (module === 1 && hasPrompt && state.expectFreshStart) {
    issues.push({
      code: "stale_paraphrase_after_restart",
      message: "Prompt paraphrase survived an explicit restart.",
    });
  }

  // Artifacts cleared but progression still past Module 1
  if (module > 1 && state.expectFreshStart) {
    issues.push({
      code: "progression_ahead_of_fresh_start",
      message: "Progression still points past Module 1 after a fresh start.",
    });
  }

  return {
    coherent: issues.length === 0,
    issues,
    recommendedEntry: hasPrompt
      ? { path: "/modules/1", step: 2 }
      : { path: "/modules/1/prompt", step: 1, question: 1 },
  };
}

/**
 * After an explicit Module 1 or full restart, entry must be Step 1 Q1 empty.
 */
export function resolveFreshStartEntry(restartPlan) {
  if (
    restartPlan?.action === RESTART_ACTIONS.RESTART_MODULE_1 ||
    restartPlan?.action === RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT
  ) {
    return {
      path: "/modules/1/prompt",
      step: 1,
      question: 1,
      paraphrase: "",
      quizAnswers: [],
      step2Stage: null,
    };
  }
  return null;
}

/**
 * Ordinary revisit: resume legitimate saved work (do not clear).
 */
export function resolveOrdinaryRevisitEntry({
  paraphrase = "",
  promptAnswers = null,
  step2Draft = null,
  quizCompleted = false,
}) {
  const trimmed = String(paraphrase || "").trim();
  if (!trimmed) {
    return {
      mode: "resume_prompt",
      path: "/modules/1/prompt",
      clearsNothing: true,
    };
  }

  if (quizCompleted) {
    return {
      mode: "module_complete_or_step2",
      path: "/modules/1",
      clearsNothing: true,
    };
  }

  return {
    mode: "resume_step2",
    path: "/modules/1",
    step2Draft: step2Draft || null,
    promptAnswers,
    clearsNothing: true,
  };
}

/**
 * Simulated apply of a restart plan onto an in-memory student snapshot (tests).
 */
export function applyRestartPlanToSnapshot(snapshot, plan) {
  const next = {
    currentModule: snapshot.currentModule ?? 1,
    paraphrase: snapshot.paraphrase ?? "",
    promptAnswers: { ...(snapshot.promptAnswers || {}) },
    quizResults: snapshot.quizResults ? [...snapshot.quizResults] : [],
    step2Draft: snapshot.step2Draft ?? null,
    downstream: snapshot.downstream ? { ...snapshot.downstream } : {},
  };

  if (plan.clearsParaphrase) {
    next.paraphrase = "";
    next.promptAnswers = {
      task_verb: "",
      task_type: "",
      analysis_focus: "",
      required_angle: "",
      student_paraphrase: "",
    };
  }
  if (plan.clearsQuiz) {
    next.quizResults = [];
  }
  if (plan.clearFlowCache) {
    next.step2Draft = null;
  }
  if (plan.clearStudentAssignments || plan.setCurrentModule === null) {
    next.currentModule = 1;
    next.downstream = {};
  } else if (typeof plan.setCurrentModule === "number") {
    next.currentModule = plan.setCurrentModule;
  }

  return next;
}
