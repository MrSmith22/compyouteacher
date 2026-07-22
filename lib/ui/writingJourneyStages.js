/**
 * WP-094 — Shared writing-process journey language.
 * Modules 4–5 share Plan so counts stay honest (not a fake 8-of-9 module meter).
 */

export const WRITING_JOURNEY_STAGE_IDS = Object.freeze([
  "understand",
  "read_and_notice",
  "develop_argument",
  "plan",
  "draft",
  "revise",
  "prepare",
  "submit",
]);

export const WRITING_JOURNEY_STAGES = Object.freeze([
  Object.freeze({
    id: "understand",
    label: "Understand",
    modules: Object.freeze([1]),
  }),
  Object.freeze({
    id: "read_and_notice",
    label: "Read and notice",
    modules: Object.freeze([2]),
  }),
  Object.freeze({
    id: "develop_argument",
    label: "Develop an argument",
    modules: Object.freeze([3]),
  }),
  Object.freeze({
    id: "plan",
    label: "Plan",
    modules: Object.freeze([4, 5]),
  }),
  Object.freeze({
    id: "draft",
    label: "Draft",
    modules: Object.freeze([6]),
  }),
  Object.freeze({
    id: "revise",
    label: "Revise",
    modules: Object.freeze([7]),
  }),
  Object.freeze({
    id: "prepare",
    label: "Prepare",
    modules: Object.freeze([8]),
  }),
  Object.freeze({
    id: "submit",
    label: "Submit",
    modules: Object.freeze([9]),
  }),
]);

/**
 * @param {number} moduleNumber
 * @returns {typeof WRITING_JOURNEY_STAGES[number]|null}
 */
export function getJourneyStageForModule(moduleNumber) {
  const n = Number(moduleNumber);
  if (!Number.isFinite(n)) return null;
  return WRITING_JOURNEY_STAGES.find((stage) => stage.modules.includes(n)) || null;
}

/**
 * Build completed / current / future markers for a success or dashboard surface.
 * @param {{
 *   currentModule?: number|null,
 *   allCompleted?: boolean,
 * }} input
 */
export function buildJourneyProgress(input = {}) {
  const allCompleted = Boolean(input.allCompleted);
  const currentModule = Number(input.currentModule);
  const currentStage = allCompleted
    ? null
    : getJourneyStageForModule(currentModule);

  return WRITING_JOURNEY_STAGES.map((stage) => {
    let state = "future";
    if (allCompleted) {
      state = "completed";
    } else if (currentStage) {
      const currentIndex = WRITING_JOURNEY_STAGES.findIndex(
        (row) => row.id === currentStage.id
      );
      const stageIndex = WRITING_JOURNEY_STAGES.findIndex(
        (row) => row.id === stage.id
      );
      if (stageIndex < currentIndex) state = "completed";
      else if (stageIndex === currentIndex) state = "current";
      else state = "future";
    }
    return Object.freeze({
      id: stage.id,
      label: stage.label,
      modules: stage.modules,
      state,
    });
  });
}
