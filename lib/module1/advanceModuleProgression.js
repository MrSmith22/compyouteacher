/**
 * Forward-only module advancement with compare-and-set (CAS).
 * Shared orchestration for advanceCurrentModuleOnSuccess — no unconditional upserts.
 */

import {
  CANONICAL_ACTIVE_ASSIGNMENT_STATUS,
  isAssignmentStatusActive,
} from "../assignments/assignmentActivityStatus.js";

export const ADVANCE_CAS_MAX_ATTEMPTS = 5;

export const ADVANCE_REASONS = Object.freeze({
  ADVANCED: "advanced",
  ALREADY_ADVANCED: "already_advanced",
  CONCURRENT_STATE_CHANGE: "concurrent_state_change",
  READ_FAILURE: "read_failure",
  WRITE_FAILURE: "write_failure",
  MISSING_ASSIGNMENT: "missing_assignment",
  RETRY_EXHAUSTED: "retry_exhausted",
});

/**
 * Development-only structured diagnostic. Never log secrets.
 */
export function logAdvancementDiagnostic({
  operation = "advance_module",
  reason = "",
  code = null,
  message = "",
  details = null,
  hint = null,
  attemptCount = null,
  currentModule = null,
  assignmentStatus = null,
} = {}) {
  if (typeof process === "undefined" || process.env.NODE_ENV !== "development") {
    return;
  }
  // eslint-disable-next-line no-console
  console.info("[module-progress]", {
    operation,
    reason,
    code,
    message,
    details,
    hint,
    attemptCount,
    currentModule,
    assignmentStatus,
  });
}

function inactiveStateResult(current, attempts) {
  return {
    ok: false,
    alreadyAdvanced: false,
    reason: ADVANCE_REASONS.CONCURRENT_STATE_CHANGE,
    currentModule: current,
    error: {
      message: "Assignment status changed; progression was not written.",
      code: ADVANCE_REASONS.CONCURRENT_STATE_CHANGE,
    },
    attempts,
  };
}

/**
 * Atomic forward-only advancement against an injectable store.
 * Never writes a stale calculated module over a concurrent higher value.
 */
export async function advanceModuleProgressionWithStore({
  completedModuleNumber,
  maxModule = 10,
  maxAttempts = ADVANCE_CAS_MAX_ATTEMPTS,
  store,
} = {}) {
  if (!store || typeof store.read !== "function" || typeof store.compareAndSet !== "function") {
    return {
      ok: false,
      reason: ADVANCE_REASONS.WRITE_FAILURE,
      error: { message: "Progress store is not configured." },
    };
  }

  const targetModule = Math.min(
    Math.max(1, Number(completedModuleNumber) + 1),
    maxModule
  );

  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts += 1;

    let readResult;
    try {
      readResult = await store.read();
    } catch (error) {
      logAdvancementDiagnostic({
        reason: ADVANCE_REASONS.READ_FAILURE,
        code: error?.code || null,
        message: error?.message || "read threw",
        details: error?.details || null,
        hint: error?.hint || null,
        attemptCount: attempts,
      });
      return {
        ok: false,
        reason: ADVANCE_REASONS.READ_FAILURE,
        error,
        attempts,
      };
    }

    if (readResult?.error) {
      const err = readResult.error;
      logAdvancementDiagnostic({
        reason: ADVANCE_REASONS.READ_FAILURE,
        code: err?.code || null,
        message: err?.message || "read error",
        details: err?.details || null,
        hint: err?.hint || null,
        attemptCount: attempts,
      });
      return {
        ok: false,
        reason: ADVANCE_REASONS.READ_FAILURE,
        error: err,
        attempts,
      };
    }

    const row = readResult?.data ?? null;
    if (!row) {
      logAdvancementDiagnostic({
        reason: ADVANCE_REASONS.MISSING_ASSIGNMENT,
        message: "Assignment not found.",
        attemptCount: attempts,
      });
      return {
        ok: false,
        reason: ADVANCE_REASONS.MISSING_ASSIGNMENT,
        error: { message: "Assignment not found." },
        attempts,
      };
    }

    const current =
      typeof row.current_module === "number" && Number.isFinite(row.current_module)
        ? row.current_module
        : 0;
    const status = row.status;

    if (current >= targetModule) {
      return {
        ok: true,
        alreadyAdvanced: true,
        reason: ADVANCE_REASONS.ALREADY_ADVANCED,
        currentModule: current,
        attempts,
      };
    }

    // Protect completed/abandoned/inactive — but allow legacy active spellings.
    if (!isAssignmentStatusActive(status)) {
      logAdvancementDiagnostic({
        reason: ADVANCE_REASONS.CONCURRENT_STATE_CHANGE,
        message: "Row is not an active assignment status.",
        attemptCount: attempts,
        currentModule: current,
        assignmentStatus: status ?? null,
      });
      return inactiveStateResult(current, attempts);
    }

    let casResult;
    try {
      casResult = await store.compareAndSet({
        expectedModule: current,
        // Pass through the exact stored status (including null / "in progress")
        // so the conditional UPDATE matches the real row.
        expectedStatus: status == null || status === "" ? null : status,
        nextModule: targetModule,
        nextStatus: CANONICAL_ACTIVE_ASSIGNMENT_STATUS,
      });
    } catch (error) {
      logAdvancementDiagnostic({
        reason: ADVANCE_REASONS.WRITE_FAILURE,
        code: error?.code || null,
        message: error?.message || "CAS threw",
        details: error?.details || null,
        hint: error?.hint || null,
        attemptCount: attempts,
        currentModule: current,
        assignmentStatus: status ?? null,
      });
      return {
        ok: false,
        reason: ADVANCE_REASONS.WRITE_FAILURE,
        error,
        currentModule: current,
        attempts,
      };
    }

    if (casResult?.error) {
      const err = casResult.error;
      logAdvancementDiagnostic({
        reason: ADVANCE_REASONS.WRITE_FAILURE,
        code: err?.code || null,
        message: err?.message || "CAS error",
        details: err?.details || null,
        hint: err?.hint || null,
        attemptCount: attempts,
        currentModule: current,
        assignmentStatus: status ?? null,
      });
      return {
        ok: false,
        reason: ADVANCE_REASONS.WRITE_FAILURE,
        error: err,
        currentModule: current,
        attempts,
      };
    }

    if (casResult?.updated) {
      return {
        ok: true,
        alreadyAdvanced: false,
        reason: ADVANCE_REASONS.ADVANCED,
        currentModule: targetModule,
        attempts,
      };
    }

    logAdvancementDiagnostic({
      reason: "cas_conflict",
      message: "Conditional update matched zero rows; re-reading.",
      attemptCount: attempts,
      currentModule: current,
      assignmentStatus: status ?? null,
    });
    // Zero rows updated — concurrent writer won. Re-read and resolve.
  }

  // Final re-read after exhausting CAS attempts.
  try {
    const finalRead = await store.read();
    if (finalRead?.error) {
      return {
        ok: false,
        reason: ADVANCE_REASONS.READ_FAILURE,
        error: finalRead.error,
        attempts,
      };
    }
    const row = finalRead?.data ?? null;
    if (!row) {
      return {
        ok: false,
        reason: ADVANCE_REASONS.MISSING_ASSIGNMENT,
        error: { message: "Assignment not found." },
        attempts,
      };
    }
    const current =
      typeof row.current_module === "number" ? row.current_module : 0;
    if (current >= targetModule) {
      return {
        ok: true,
        alreadyAdvanced: true,
        reason: ADVANCE_REASONS.ALREADY_ADVANCED,
        currentModule: current,
        attempts,
      };
    }
    if (!isAssignmentStatusActive(row.status)) {
      return inactiveStateResult(current, attempts);
    }
  } catch (error) {
    return {
      ok: false,
      reason: ADVANCE_REASONS.READ_FAILURE,
      error,
      attempts,
    };
  }

  logAdvancementDiagnostic({
    reason: ADVANCE_REASONS.RETRY_EXHAUSTED,
    message: "Could not advance module after concurrent updates.",
    attemptCount: attempts,
  });

  return {
    ok: false,
    reason: ADVANCE_REASONS.RETRY_EXHAUSTED,
    error: {
      message: "Could not advance module after concurrent updates.",
      code: ADVANCE_REASONS.RETRY_EXHAUSTED,
    },
    attempts,
  };
}

/**
 * Mutable mock assignment store for race tests.
 * CAS is atomic unless `pauseBeforeCommit` yields between check and write.
 */
export function createMutableAssignmentProgressStore(initialRow = null) {
  let row =
    initialRow && typeof initialRow === "object" ? { ...initialRow } : null;
  let pauseBeforeCommit = null;
  let casAttempts = 0;

  return {
    get casAttempts() {
      return casAttempts;
    },
    snapshot() {
      return row ? { ...row } : null;
    },
    replace(nextRow) {
      row = nextRow && typeof nextRow === "object" ? { ...nextRow } : null;
    },
    armPauseBeforeCommit() {
      let release;
      pauseBeforeCommit = new Promise((resolve) => {
        release = resolve;
      });
      return () => {
        if (typeof release === "function") release();
        pauseBeforeCommit = null;
      };
    },
    async read() {
      return { data: row ? { ...row } : null, error: null };
    },
    async compareAndSet({
      expectedModule,
      expectedStatus,
      nextModule,
      nextStatus = CANONICAL_ACTIVE_ASSIGNMENT_STATUS,
    }) {
      casAttempts += 1;
      if (!row) {
        return { updated: false, data: null, error: null };
      }

      const statusMatches =
        (expectedStatus == null || expectedStatus === "")
          ? row.status == null || row.status === ""
          : row.status === expectedStatus;

      if (row.current_module !== expectedModule || !statusMatches) {
        return { updated: false, data: null, error: null };
      }

      if (!isAssignmentStatusActive(row.status)) {
        return { updated: false, data: null, error: null };
      }

      if (pauseBeforeCommit) {
        await pauseBeforeCommit;
      }

      const statusMatchesAfter =
        (expectedStatus == null || expectedStatus === "")
          ? row.status == null || row.status === ""
          : row?.status === expectedStatus;

      if (
        !row ||
        row.current_module !== expectedModule ||
        !statusMatchesAfter ||
        !isAssignmentStatusActive(row.status)
      ) {
        return { updated: false, data: null, error: null };
      }

      row = {
        ...row,
        current_module: nextModule,
        status: nextStatus || CANONICAL_ACTIVE_ASSIGNMENT_STATUS,
        updated_at: new Date().toISOString(),
      };
      return { updated: true, data: { ...row }, error: null };
    },
  };
}
