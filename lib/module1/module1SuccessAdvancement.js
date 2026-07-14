/**
 * Module 1 success → Module 2 advancement controller helpers.
 * Prefer an explicit, observable save over fire-and-forget effects.
 */

export const MODULE1_ADVANCE_STATES = Object.freeze({
  IDLE: "idle",
  SAVING: "saving",
  READY: "ready",
  ERROR: "error",
});

export const MODULE1_CONTINUE_HREF = "/modules/2";
export const MODULE1_CONTINUE_LABEL =
  "Continue to Module 2 — save your source texts";
export const MODULE1_SAVING_MESSAGE = "Saving your Module 1 progress…";
export const MODULE1_ADVANCE_ERROR_MESSAGE =
  "Could not save your Module 1 progress. Stay here and try again.";

/**
 * Whether the Continue CTA may navigate to Module 2.
 */
export function canNavigateToModule2(advanceState) {
  return advanceState === MODULE1_ADVANCE_STATES.READY;
}

/**
 * Whether a new advancement attempt may start (blocks double submit).
 */
export function canStartModule1Advancement(advanceState, { inFlight = false } = {}) {
  if (inFlight) return false;
  return (
    advanceState === MODULE1_ADVANCE_STATES.IDLE ||
    advanceState === MODULE1_ADVANCE_STATES.ERROR
  );
}

/**
 * Interpret a student_assignments row for Module 1 completion idempotency.
 * Already at module >= 2 counts as success without another write.
 */
export function interpretModule1AdvancementRead({
  assignment = null,
  readError = null,
  completedModuleNumber = 1,
} = {}) {
  if (readError) {
    return {
      ok: false,
      alreadyAdvanced: false,
      shouldWrite: false,
      currentModule: null,
      reason: "read_failed",
      message: MODULE1_ADVANCE_ERROR_MESSAGE,
    };
  }
  if (!assignment) {
    return {
      ok: false,
      alreadyAdvanced: false,
      shouldWrite: false,
      currentModule: null,
      reason: "missing_assignment",
      message: MODULE1_ADVANCE_ERROR_MESSAGE,
    };
  }

  const current =
    typeof assignment.current_module === "number"
      ? assignment.current_module
      : 0;
  const target = completedModuleNumber + 1;

  if (current >= target) {
    return {
      ok: true,
      alreadyAdvanced: true,
      shouldWrite: false,
      currentModule: current,
      reason: "already_advanced",
      message: "",
    };
  }

  // Clamp-forward writes never regress a developer jump to a higher module.
  return {
    ok: true,
    alreadyAdvanced: false,
    shouldWrite: true,
    currentModule: current,
    targetModule: target,
    reason: "needs_write",
    message: "",
  };
}

/**
 * Interpret the write/upsert result after advancement.
 */
export function interpretModule1AdvancementWrite({
  writeError = null,
  alreadyAdvanced = false,
  reason = "",
} = {}) {
  if (alreadyAdvanced || reason === "already_advanced") {
    return {
      ok: true,
      state: MODULE1_ADVANCE_STATES.READY,
      message: "",
    };
  }
  if (reason === "advanced" && !writeError) {
    return {
      ok: true,
      state: MODULE1_ADVANCE_STATES.READY,
      message: "",
    };
  }
  if (writeError || (reason && reason !== "advanced" && reason !== "already_advanced")) {
    return {
      ok: false,
      state: MODULE1_ADVANCE_STATES.ERROR,
      message: MODULE1_ADVANCE_ERROR_MESSAGE,
      reason: reason || "write_failure",
    };
  }
  return {
    ok: true,
    state: MODULE1_ADVANCE_STATES.READY,
    message: "",
  };
}

/**
 * Create a small in-memory controller for tests / UI coordination.
 * Ensures only one in-flight advancement at a time.
 */
export function createModule1AdvancementController() {
  let inFlight = false;
  let generation = 0;

  return {
    get inFlight() {
      return inFlight;
    },
    begin() {
      if (inFlight) return { accepted: false, generation };
      inFlight = true;
      generation += 1;
      return { accepted: true, generation };
    },
    end(gen) {
      if (gen === generation) {
        inFlight = false;
      }
    },
    reset() {
      inFlight = false;
      generation += 1;
    },
  };
}
