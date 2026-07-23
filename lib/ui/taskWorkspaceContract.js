/**
 * WP-096 — Presentation-only task-workspace slot contract.
 * Callers own response/save/completion/navigation. This only normalizes regions.
 */

import { getJourneyStageForModule } from "./writingJourneyStages.js";
import { getInstructionalColorRole } from "./instructionalColorContract.js";
import {
  HIERARCHY_LEVELS,
  HIERARCHY_TASK_CLASS,
  HIERARCHY_MODULE_CHROME_CLASS,
  HIERARCHY_INSTRUCTION_CLASS,
  HIERARCHY_DESK_CLASS,
  HIERARCHY_WORK_SURFACE_CLASS,
  HIERARCHY_REFERENCE_CLASS,
  HIERARCHY_ACTION_PRIMARY_CLASS,
  HIERARCHY_ACTION_SECONDARY_CLASS,
} from "./hierarchyContract.js";

/** Ordered regions — mobile task order and desktop composition intent. */
export const TASK_WORKSPACE_REGION_IDS = Object.freeze([
  "orientation",
  "task",
  "job",
  "desk",
  "work",
  "feedback",
  "readiness",
  "actions",
  "shelf",
]);

const TASK_WORKSPACE_MOBILE_ORDER_CLASS = Object.freeze({
  orientation: "order-1",
  task: "order-2",
  job: "order-3",
  desk: "order-4",
  work: "order-5",
  feedback: "order-6",
  readiness: "order-7",
  actions: "order-8",
  shelf: "order-9",
});

/**
 * Exact instructional color-role ids used by this foundation.
 * Maps to INSTRUCTIONAL_COLOR_ROLES keys (never invent parallel names).
 */
export const TASK_WORKSPACE_COLOR_ROLES = Object.freeze({
  orientation: null,
  task: null,
  job: "instruction",
  desk: "student-thinking",
  work: "writing",
  feedback: "instruction",
  readiness: null,
  actions: null,
  shelf: "reference",
  evidence: "evidence",
});

const REGION_HIERARCHY_LEVEL = Object.freeze({
  orientation: HIERARCHY_LEVELS.objective,
  task: HIERARCHY_LEVELS.task,
  job: HIERARCHY_LEVELS.instruction,
  desk: HIERARCHY_LEVELS.work,
  work: HIERARCHY_LEVELS.work,
  feedback: HIERARCHY_LEVELS.instruction,
  readiness: HIERARCHY_LEVELS.objective,
  actions: HIERARCHY_LEVELS.task,
  shelf: HIERARCHY_LEVELS.reference,
});

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function clampStep(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

/**
 * @param {{
 *   moduleNumber?: number|null,
 *   stepIndex?: number|null,
 *   stepCount?: number|null,
 *   stepLabel?: string|null,
 *   taskHeading?: string|null,
 *   jobLead?: string|null,
 *   desktopWidthIntent?: "drafting"|"single"|"planning"|null,
 * }} input
 */
export function resolveTaskWorkspacePresentation(input = {}) {
  const moduleNumber = Number(input.moduleNumber);
  const journey =
    Number.isFinite(moduleNumber) && moduleNumber >= 1
      ? getJourneyStageForModule(moduleNumber)
      : null;
  const stepIndex = clampStep(input.stepIndex);
  const stepCount = clampStep(input.stepCount);
  const stepLabel = trimText(input.stepLabel);
  const taskHeading = trimText(input.taskHeading);
  const jobLead = trimText(input.jobLead);
  const desktopWidthIntent = trimText(input.desktopWidthIntent) || "single";

  const stepProgress =
    stepIndex && stepCount
      ? `Step ${stepIndex} of ${stepCount}`
      : stepLabel || null;

  return Object.freeze({
    moduleNumber: Number.isFinite(moduleNumber) ? moduleNumber : null,
    journeyStageId: journey?.id || null,
    journeyStageLabel: journey?.label || null,
    stepIndex,
    stepCount,
    stepProgress,
    taskHeading: taskHeading || null,
    jobLead: jobLead || null,
    desktopWidthIntent,
    regionOrder: [...TASK_WORKSPACE_REGION_IDS],
    regions: Object.freeze(
      Object.fromEntries(
        TASK_WORKSPACE_REGION_IDS.map((id) => [
          id,
          Object.freeze(describeTaskWorkspaceRegion(id)),
        ])
      )
    ),
  });
}

/**
 * @param {string} regionId
 * @param {{ evidenceSurface?: boolean }} [opts]
 */
export function describeTaskWorkspaceRegion(regionId, opts = {}) {
  const id = TASK_WORKSPACE_REGION_IDS.includes(regionId)
    ? regionId
    : "work";
  let colorRoleId = TASK_WORKSPACE_COLOR_ROLES[id] || null;
  if (opts.evidenceSurface && id === "desk") {
    colorRoleId = "evidence";
  }
  const colorRole = colorRoleId ? getInstructionalColorRole(colorRoleId) : null;
  const hierarchyLevel = REGION_HIERARCHY_LEVEL[id] || HIERARCHY_LEVELS.work;

  return {
    id,
    hierarchyLevel,
    colorRoleId,
    colorRoleLabel: colorRole?.label || null,
    surfaceClass: defaultSurfaceClassForRegion(id, colorRole),
    testId: `task-workspace-${id}`,
  };
}

function defaultSurfaceClassForRegion(id, colorRole) {
  if (id === "task") return HIERARCHY_TASK_CLASS;
  if (id === "orientation") return HIERARCHY_MODULE_CHROME_CLASS;
  if (id === "job" || id === "feedback") {
    return colorRole?.softSurfaceClass || HIERARCHY_INSTRUCTION_CLASS;
  }
  if (id === "desk") {
    return colorRole?.softSurfaceClass || HIERARCHY_DESK_CLASS;
  }
  if (id === "work") {
    return colorRole?.softSurfaceClass || HIERARCHY_WORK_SURFACE_CLASS;
  }
  if (id === "shelf") {
    return colorRole?.softSurfaceClass || HIERARCHY_REFERENCE_CLASS;
  }
  return "";
}

export function taskWorkspacePrimaryActionClass() {
  return HIERARCHY_ACTION_PRIMARY_CLASS;
}

export function taskWorkspaceSecondaryActionClass() {
  return HIERARCHY_ACTION_SECONDARY_CLASS;
}

/**
 * Mobile CSS order helpers (1-based matching regionOrder).
 * @param {string} regionId
 */
export function taskWorkspaceMobileOrderClass(regionId) {
  return TASK_WORKSPACE_MOBILE_ORDER_CLASS[regionId] || "order-10";
}

/**
 * Assert exactly one dominant task heading string for tests/callers.
 */
export function assertSingleTaskHeading(taskHeading) {
  const heading = trimText(taskHeading);
  return {
    ok: Boolean(heading),
    heading: heading || null,
  };
}
