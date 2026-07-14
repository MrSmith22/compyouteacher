/**
 * Module 2 entry-gate helpers for the Module 1 → Module 2 transition.
 * Never redirect a path to itself; distinguish waiting / denied / error.
 */

export const MODULE2_ENTRY_GATE_STATES = Object.freeze({
  CHECKING: "checking",
  ALLOWED: "allowed",
  WAITING_FOR_PROGRESS: "waiting_for_progress",
  DENIED: "denied",
  ERROR: "error",
});

/** Safe destination when Module 2 is genuinely unavailable. */
export const MODULE2_SAFE_DENIAL_PATH = "/modules/1/success";

export const MODULE2_WAITING_MESSAGE =
  "Finishing your Module 1 save… Checking access again shortly.";

export const MODULE2_DENIED_MESSAGE =
  "Module 1 progress must finish saving before Module 2 opens. Return to the Module 1 success screen to save again.";

export const MODULE2_GATE_ERROR_MESSAGE =
  "Could not verify Module 2 access. Check your connection and try again.";

/**
 * Bounded recheck while Module 1 advancement may still be in flight.
 * Do not poll forever.
 */
export const MODULE2_ENTRY_RECHECK = Object.freeze({
  maxAttempts: 5,
  intervalMs: 450,
});

export function normalizePathForCompare(path) {
  if (typeof path !== "string" || !path) return "";
  const bare = path.split("?")[0].split("#")[0];
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare;
}

/**
 * True when a router.replace would bounce the same path onto itself.
 */
export function isSelfRedirect(fromPath, toPath) {
  return (
    normalizePathForCompare(fromPath) === normalizePathForCompare(toPath)
  );
}

/**
 * Never replace a Module 2 path with itself.
 * Family-access denials fall back to Module 1 success.
 */
export function resolveModule2RedirectTarget({
  pathname,
  proposedRedirect,
  reason = "module_access_denied",
} = {}) {
  const proposed =
    typeof proposedRedirect === "string" && proposedRedirect.trim()
      ? proposedRedirect.trim()
      : MODULE2_SAFE_DENIAL_PATH;

  if (isSelfRedirect(pathname, proposed)) {
    if (reason === "module_access_denied" || reason === "waiting_exhausted") {
      return MODULE2_SAFE_DENIAL_PATH;
    }
    // Already on the intended corrective page (e.g. sources root) — no navigation.
    return null;
  }

  return proposed;
}

/**
 * Interpret assignment fetch for Module 2 family access.
 */
export function interpretModule2EntryAccess({
  currentModule = 0,
  minModule = 2,
  fetchError = false,
} = {}) {
  if (fetchError) {
    return {
      state: MODULE2_ENTRY_GATE_STATES.ERROR,
      currentModule: null,
      message: MODULE2_GATE_ERROR_MESSAGE,
      redirectTo: null,
    };
  }

  const current =
    typeof currentModule === "number" && Number.isFinite(currentModule)
      ? currentModule
      : 0;

  if (current >= minModule) {
    return {
      state: MODULE2_ENTRY_GATE_STATES.ALLOWED,
      currentModule: current,
      message: "",
      redirectTo: null,
    };
  }

  return {
    state: MODULE2_ENTRY_GATE_STATES.WAITING_FOR_PROGRESS,
    currentModule: current,
    message: MODULE2_WAITING_MESSAGE,
    redirectTo: null,
  };
}

/**
 * After bounded rechecks still fail, deny and send to Module 1 success.
 */
export function resolveModule2WaitingExhausted({ pathname } = {}) {
  const redirectTo = resolveModule2RedirectTarget({
    pathname,
    proposedRedirect: MODULE2_SAFE_DENIAL_PATH,
    reason: "waiting_exhausted",
  });
  return {
    state: MODULE2_ENTRY_GATE_STATES.DENIED,
    message: MODULE2_DENIED_MESSAGE,
    redirectTo: redirectTo || MODULE2_SAFE_DENIAL_PATH,
  };
}

/**
 * Decide whether another recheck should run.
 */
export function shouldRecheckModule2Entry({
  state,
  attempt,
  maxAttempts = MODULE2_ENTRY_RECHECK.maxAttempts,
} = {}) {
  if (state !== MODULE2_ENTRY_GATE_STATES.WAITING_FOR_PROGRESS) return false;
  return attempt < maxAttempts;
}

/**
 * Safe redirect for analysis-phase denials that must never self-loop.
 * Returns null when the student is already on the corrective destination.
 */
export function resolveAnalysisPhaseRedirect({
  pathname,
  proposedRedirect,
} = {}) {
  return resolveModule2RedirectTarget({
    pathname,
    proposedRedirect,
    reason: "analysis_phase",
  });
}
