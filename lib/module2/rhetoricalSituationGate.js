/**
 * Durable progression gate for Module 2 “Meet the two situations.”
 *
 * Stores only completion (timestamp), never a score.
 * Grandfathering protects students who already have legitimate downstream work.
 */

import { MODULE2_TCHARTS_RESUME_PATH } from "./rhetoricalSituationLesson.js";

export const MODULE2_MEET_SITUATIONS_FOCUS_PATH =
  "/modules/2?focus=meet-situations";

export const MODULE2_MEET_SITUATIONS_RETURN_MESSAGE =
  "You’re almost ready to begin gathering evidence. First, finish learning how the Speech and Letter have different audiences and purposes.";

export const MODULE2_STAGE6_LOCKED_MESSAGE =
  "Complete “Meet the two situations” before you begin finding evidence.";

/**
 * Grandfathering rule (application logic, not a DB flag):
 *
 * Treat the lesson as complete when ANY of the following is true:
 * 1. rhetorical_situation_completed_at is set (new students who finished Stage 5);
 * 2. current_module >= 3 (already past Module 2 success);
 * 3. resume_path is already /modules/2/tcharts (entered analysis after Stage 6);
 * 4. at least one T-chart evidence row exists;
 * 5. at least one guided Module 2 observation exists;
 * 6. explicit development bypass (NODE_ENV=development only).
 *
 * Incomplete new students are never auto-marked complete.
 */
export function isRhetoricalSituationLessonSatisfied({
  completedAt = null,
  currentModule = 0,
  resumePath = "",
  tchartEntryCount = 0,
  guidedObservationCount = 0,
  devBypass = false,
} = {}) {
  if (hasRhetoricalSituationCompletionTimestamp(completedAt)) {
    return {
      satisfied: true,
      grandfathered: false,
      reason: "completed",
      completedAt,
    };
  }

  if (devBypass === true) {
    return {
      satisfied: true,
      grandfathered: false,
      reason: "dev_bypass",
      completedAt: null,
    };
  }

  const moduleNumber =
    typeof currentModule === "number" && Number.isFinite(currentModule)
      ? currentModule
      : 0;

  if (moduleNumber >= 3) {
    return {
      satisfied: true,
      grandfathered: true,
      reason: "module_advanced",
      completedAt: null,
    };
  }

  const path = typeof resumePath === "string" ? resumePath.trim() : "";
  if (path === MODULE2_TCHARTS_RESUME_PATH) {
    return {
      satisfied: true,
      grandfathered: true,
      reason: "resume_tcharts",
      completedAt: null,
    };
  }

  if (Number(tchartEntryCount) > 0) {
    return {
      satisfied: true,
      grandfathered: true,
      reason: "tchart_evidence",
      completedAt: null,
    };
  }

  if (Number(guidedObservationCount) > 0) {
    return {
      satisfied: true,
      grandfathered: true,
      reason: "guided_observations",
      completedAt: null,
    };
  }

  return {
    satisfied: false,
    grandfathered: false,
    reason: "incomplete",
    completedAt: null,
  };
}

export function hasRhetoricalSituationCompletionTimestamp(completedAt) {
  if (completedAt == null || completedAt === "") return false;
  if (typeof completedAt === "string") {
    const parsed = Date.parse(completedAt);
    return Number.isFinite(parsed);
  }
  return false;
}

export function canReachModule2WizardStage({
  targetStage,
  sourcesReady = false,
  lessonSatisfied = false,
  knowledgeCheckSubmitted = false,
  speechSaved = false,
} = {}) {
  if (targetStage <= 0) return true;
  if (targetStage === 1) return true;
  if (targetStage === 2) return knowledgeCheckSubmitted;
  if (targetStage === 3) return speechSaved;
  if (targetStage === 4) return sourcesReady;
  if (targetStage === 5) return sourcesReady;
  if (targetStage >= 6) return sourcesReady && lessonSatisfied;
  return false;
}

export function getModule2AnalysisAccessDecision({
  sourcesReady = false,
  lessonSatisfied = false,
} = {}) {
  if (!sourcesReady) {
    return {
      allowed: false,
      redirectTo: "/modules/2",
      reason: "sources_incomplete",
    };
  }

  if (!lessonSatisfied) {
    return {
      allowed: false,
      redirectTo: MODULE2_MEET_SITUATIONS_FOCUS_PATH,
      reason: "lesson_incomplete",
      message: MODULE2_MEET_SITUATIONS_RETURN_MESSAGE,
    };
  }

  return {
    allowed: true,
    redirectTo: null,
    reason: "ready",
  };
}

/** Production behavior never enables a bypass. */
export function isRhetoricalSituationDevBypassAvailable(
  nodeEnv = typeof process !== "undefined" ? process.env.NODE_ENV : ""
) {
  return nodeEnv === "development";
}

export function readRhetoricalSituationDevBypassFlag(storage = null) {
  if (!isRhetoricalSituationDevBypassAvailable()) return false;
  try {
    const store =
      storage ||
      (typeof window !== "undefined" ? window.sessionStorage : null);
    if (!store) return false;
    return store.getItem("module2_rhetorical_situation_dev_bypass") === "1";
  } catch {
    return false;
  }
}

export function writeRhetoricalSituationDevBypassFlag(
  enabled,
  storage = null
) {
  if (!isRhetoricalSituationDevBypassAvailable()) return false;
  try {
    const store =
      storage ||
      (typeof window !== "undefined" ? window.sessionStorage : null);
    if (!store) return false;
    if (enabled) {
      store.setItem("module2_rhetorical_situation_dev_bypass", "1");
    } else {
      store.removeItem("module2_rhetorical_situation_dev_bypass");
    }
    return true;
  } catch {
    return false;
  }
}
