/**
 * Module 4 navigation persistence (CP-E repair).
 *
 * Saves the destination flow step atomically with the newest student work.
 * Prevents stale autosaves from overwriting navigation writes.
 */

import {
  STEP_B1_SCAFFOLD,
  STEP_B2_REASONING,
  STEP_B3_REASONING,
  STEP_B3_SCAFFOLD,
  STEP_BIG_PICTURE,
  STEP_EXPLAIN_BUCKETS,
  STEP_HANDOFF,
  STEP_PATTERN,
  STEP_REFLECTION,
  STEP_THIRD_DECISION,
  STEP_WELCOME,
  LAST_STEP,
} from "../../components/module4/module4FlowSteps.js";
import { resolveModule4BackTarget } from "./module4HandoffHelpers.js";
import {
  MODULE4_SAVE_REASONS,
  createModule4DirtySaveCoordinator,
} from "./module4SaveCoordinator.js";
import { editStepForParagraphPart } from "./module4ParagraphPlanArtifactHelpers.js";

export const MODULE4_NAV_SAVE_ERROR =
  "Could not save your progress. Your work is still here. Try again.";

export function isValidModule4FlowStep(flowStep) {
  const step = Number(flowStep);
  return Number.isFinite(step) && step >= STEP_HANDOFF && step <= LAST_STEP;
}

/**
 * Continue / primary advance destination from the current step.
 */
export function resolveModule4GoNextTarget(flowStep) {
  const step = Number(flowStep);
  if (!Number.isFinite(step)) return null;

  if (
    step === STEP_HANDOFF ||
    step === STEP_WELCOME ||
    step === STEP_BIG_PICTURE ||
    step === STEP_EXPLAIN_BUCKETS ||
    step === STEP_PATTERN
  ) {
    return STEP_B1_SCAFFOLD;
  }
  if (step === STEP_B2_REASONING) return STEP_THIRD_DECISION;
  if (step === STEP_B3_REASONING) return STEP_REFLECTION;
  if (step >= LAST_STEP) return null;
  return step + 1;
}

export function resolveModule4Paragraph3DecisionTarget(yes) {
  return yes ? STEP_B3_SCAFFOLD : STEP_REFLECTION;
}

/**
 * Testable navigation + dirty/save session with a mock write boundary.
 */
export function createModule4NavigationSession({
  initialSignature = "",
  initialFlowStep = STEP_HANDOFF,
  initialState = {},
} = {}) {
  const coordinator = createModule4DirtySaveCoordinator({
    initialSignature,
  });

  let flowStep = initialFlowStep;
  let navInFlight = false;
  let navError = "";
  let persistEpoch = 0;
  let pendingNav = null;
  let serverState = {
    flowStep: initialFlowStep,
    buckets: Array.isArray(initialState.buckets)
      ? JSON.parse(JSON.stringify(initialState.buckets))
      : [],
    reflection: initialState.reflection || "",
    wantThirdBucket:
      initialState.wantThirdBucket === undefined
        ? null
        : initialState.wantThirdBucket,
    patternChoice: initialState.patternChoice || "",
    module4UpstreamSignature: initialSignature,
  };

  return {
    coordinator,
    getFlowStep: () => flowStep,
    getNavError: () => navError,
    isNavInFlight: () => navInFlight,
    getPersistEpoch: () => persistEpoch,
    getPendingNav: () => (pendingNav ? { ...pendingNav } : null),
    getServerState: () => JSON.parse(JSON.stringify(serverState)),

    markStudentMutation() {
      coordinator.markStudentMutation();
    },

    cancelPendingAutosave() {
      persistEpoch += 1;
    },

    scheduleAutosaveEpoch() {
      return persistEpoch;
    },

    canRunScheduledAutosave(scheduledEpoch) {
      return (
        scheduledEpoch === persistEpoch &&
        !navInFlight &&
        coordinator.shouldScheduleAutosave()
      );
    },

    async persistAndNavigateTo(
      targetStep,
      {
        writeFn,
        provenanceModel = null,
        buildPayload,
        overrides = {},
      } = {}
    ) {
      if (!isValidModule4FlowStep(targetStep)) {
        return { ok: false, error: "Invalid navigation target", flowStep };
      }
      if (navInFlight) {
        return {
          ok: false,
          blocked: true,
          error: "Navigation in progress",
          flowStep,
        };
      }

      pendingNav = { targetStep, overrides };
      navInFlight = true;
      navError = "";
      this.cancelPendingAutosave();

      const result = await coordinator.persist({
        provenanceModel,
        persistReason: MODULE4_SAVE_REASONS.NAVIGATION,
        buildPayload: (signature) =>
          buildPayload(signature, targetStep, overrides),
        writeFn,
      });

      navInFlight = false;

      if (result?.ok) {
        flowStep = targetStep;
        persistEpoch += 1;
        pendingNav = null;
        navError = "";
        if (result.payload?.flow_state) {
          serverState = {
            ...serverState,
            flowStep: result.payload.flow_state.step,
            wantThirdBucket: result.payload.flow_state.wantThirdBucket,
            patternChoice: result.payload.flow_state.patternChoice,
            module4UpstreamSignature:
              result.payload.flow_state.module4UpstreamSignature,
          };
        }
        if (result.payload?.buckets) {
          serverState.buckets = JSON.parse(
            JSON.stringify(result.payload.buckets)
          );
        }
        if (result.payload?.reflection !== undefined) {
          serverState.reflection = result.payload.reflection;
        }
        return { ok: true, flowStep: targetStep, payload: result.payload };
      }

      navError = result?.error || MODULE4_NAV_SAVE_ERROR;
      return { ok: false, error: navError, flowStep, payload: result?.payload };
    },

    async retryNavigation(args) {
      const pending = pendingNav || args;
      if (!pending) {
        return { ok: false, error: "Nothing to retry" };
      }
      return this.persistAndNavigateTo(pending.targetStep, args);
    },

    async runAutosave({ scheduledEpoch, writeFn, provenanceModel, buildPayload }) {
      if (!this.canRunScheduledAutosave(scheduledEpoch)) {
        return {
          ok: false,
          skipped: true,
          stale: scheduledEpoch !== persistEpoch,
        };
      }
      return coordinator.persist({
        provenanceModel,
        persistReason: MODULE4_SAVE_REASONS.AUTOSAVE,
        buildPayload,
        writeFn,
      });
    },
  };
}

export {
  resolveModule4BackTarget,
  editStepForParagraphPart,
  MODULE4_SAVE_REASONS,
};
