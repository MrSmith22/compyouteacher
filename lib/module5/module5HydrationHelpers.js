/**
 * Module 5 CP-F repair — outline hydration / read-state safety.
 * Distinguishes load success, confirmed empty, and read failure so a failed
 * GET cannot seed an imported outline that overwrites a saved artifact.
 */

export const MODULE5_OUTLINE_READ_STATE = Object.freeze({
  PENDING: "pending",
  SAVED_OUTLINE_LOADED: "saved_outline_loaded",
  CONFIRMED_NO_SAVED_OUTLINE: "confirmed_no_saved_outline",
  SAVED_OUTLINE_READ_FAILED: "saved_outline_read_failed",
});

export const MODULE5_OUTLINE_READ_ERROR =
  "We could not load your saved outline. Your work is protected—nothing was overwritten. Try again.";

export const MODULE5_UPSTREAM_UNAVAILABLE =
  "Module 4 comparison is temporarily unavailable. Your saved outline is unchanged.";

/**
 * Classify the outlines GET result. Only a successful empty response may
 * authorize first import.
 *
 * @param {{ ok?: boolean, status?: number, data?: unknown, networkError?: boolean }} input
 */
export function resolveModule5OutlineReadState(input = {}) {
  if (input.networkError) {
    return {
      state: MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_READ_FAILED,
      savedRow: null,
      canFirstImport: false,
      canWrite: false,
      message: MODULE5_OUTLINE_READ_ERROR,
    };
  }

  if (input.ok !== true) {
    return {
      state: MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_READ_FAILED,
      savedRow: null,
      canFirstImport: false,
      canWrite: false,
      message: MODULE5_OUTLINE_READ_ERROR,
    };
  }

  const row = input.data ?? null;
  if (row && row.outline) {
    return {
      state: MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_LOADED,
      savedRow: row,
      canFirstImport: false,
      canWrite: true,
      message: "",
    };
  }

  // Successful API confirmation that no saved outline exists (null or empty).
  return {
    state: MODULE5_OUTLINE_READ_STATE.CONFIRMED_NO_SAVED_OUTLINE,
    savedRow: null,
    canFirstImport: true,
    canWrite: true,
    message: "",
  };
}

/**
 * Whether Module 5 may autosave / navigate-save / finalize.
 */
export function shouldAllowModule5OutlineWrites({
  readState = MODULE5_OUTLINE_READ_STATE.PENDING,
  hydrationReady = false,
  locked = false,
} = {}) {
  if (!hydrationReady) return false;
  if (locked) return false;
  if (readState === MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_READ_FAILED) {
    return false;
  }
  if (readState === MODULE5_OUTLINE_READ_STATE.PENDING) return false;
  return (
    readState === MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_LOADED ||
    readState === MODULE5_OUTLINE_READ_STATE.CONFIRMED_NO_SAVED_OUTLINE
  );
}

/**
 * Decide whether first import from Module 4 is allowed.
 */
export function mayPerformModule5FirstImport({
  readState,
  upstreamOk = true,
} = {}) {
  return (
    readState === MODULE5_OUTLINE_READ_STATE.CONFIRMED_NO_SAVED_OUTLINE &&
    upstreamOk === true
  );
}

/**
 * When a saved outline is already loaded, a failed Module 4/evidence read must
 * keep the saved outline and disable destructive upstream comparison.
 */
export function resolveUpstreamComparisonAvailability({
  readState,
  upstreamOk,
} = {}) {
  if (readState === MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_LOADED) {
    if (upstreamOk === true) {
      return { available: true, message: "" };
    }
    return {
      available: false,
      message: MODULE5_UPSTREAM_UNAVAILABLE,
    };
  }
  return { available: Boolean(upstreamOk), message: "" };
}

/**
 * Testable hydration session with a mutable outlines GET/POST boundary.
 * Generation guards ensure superseded Retry responses cannot apply.
 */
export function createModule5HydrationSession({
  initialServerOutline = null,
} = {}) {
  let serverOutline = initialServerOutline
    ? JSON.parse(JSON.stringify(initialServerOutline))
    : null;
  let generation = 0;
  let appliedGeneration = 0;
  let readState = MODULE5_OUTLINE_READ_STATE.PENDING;
  let localOutline = null;
  let writeCount = 0;
  const writes = [];
  let failNextGet = false;
  let getHandler = null;

  return {
    getReadState: () => readState,
    getLocalOutline: () =>
      localOutline ? JSON.parse(JSON.stringify(localOutline)) : null,
    getServerOutline: () =>
      serverOutline ? JSON.parse(JSON.stringify(serverOutline)) : null,
    getWriteCount: () => writeCount,
    getWrites: () => writes.slice(),
    getAppliedGeneration: () => appliedGeneration,

    setFailNextGet(value) {
      failNextGet = Boolean(value);
    },

    setGetHandler(fn) {
      getHandler = typeof fn === "function" ? fn : null;
    },

    setServerOutline(row) {
      serverOutline = row ? JSON.parse(JSON.stringify(row)) : null;
    },

    beginHydration() {
      generation += 1;
      return generation;
    },

    /**
     * @param {{
     *   generation: number,
     *   importBody?: unknown[],
     *   upstreamOk?: boolean,
     * }} args
     */
    async hydrate({
      generation: attemptGeneration,
      importBody = [],
      upstreamOk = true,
    }) {
      let getResult;
      if (getHandler) {
        getResult = await getHandler();
      } else if (failNextGet) {
        failNextGet = false;
        getResult = { ok: false, networkError: true };
      } else {
        getResult = { ok: true, data: serverOutline };
      }

      const classified = resolveModule5OutlineReadState(getResult);

      // Stale attempt — do not apply.
      if (attemptGeneration !== generation) {
        return {
          ok: false,
          stale: true,
          readState,
          applied: false,
        };
      }

      readState = classified.state;

      if (classified.state === MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_READ_FAILED) {
        localOutline = null;
        appliedGeneration = attemptGeneration;
        return {
          ok: false,
          stale: false,
          readState,
          applied: true,
          canWrite: false,
          message: classified.message,
        };
      }

      if (classified.state === MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_LOADED) {
        localOutline = JSON.parse(JSON.stringify(classified.savedRow.outline));
        const upstream = resolveUpstreamComparisonAvailability({
          readState,
          upstreamOk,
        });
        appliedGeneration = attemptGeneration;
        return {
          ok: true,
          stale: false,
          readState,
          applied: true,
          canWrite: true,
          localOutline,
          upstreamAvailable: upstream.available,
          upstreamMessage: upstream.message,
          imported: false,
        };
      }

      // Confirmed no saved outline — first import only when upstream OK.
      if (mayPerformModule5FirstImport({ readState, upstreamOk })) {
        localOutline = {
          thesis: "",
          body: Array.isArray(importBody) ? importBody : [],
          conclusion: { summary: "", finalThought: "" },
        };
        appliedGeneration = attemptGeneration;
        return {
          ok: true,
          stale: false,
          readState,
          applied: true,
          canWrite: true,
          localOutline,
          imported: true,
        };
      }

      // Confirmed empty but upstream failed — do not seed a partial import.
      localOutline = {
        thesis: "",
        body: [],
        conclusion: { summary: "", finalThought: "" },
      };
      appliedGeneration = attemptGeneration;
      return {
        ok: true,
        stale: false,
        readState,
        applied: true,
        canWrite: true,
        localOutline,
        imported: false,
        upstreamFailed: true,
      };
    },

    attemptWrite(outline) {
      if (
        !shouldAllowModule5OutlineWrites({
          readState,
          hydrationReady: true,
          locked: false,
        })
      ) {
        return { ok: false, blocked: true, writeCount };
      }
      writeCount += 1;
      writes.push(JSON.parse(JSON.stringify(outline)));
      serverOutline = {
        outline: JSON.parse(JSON.stringify(outline)),
        finalized: serverOutline?.finalized ?? false,
      };
      return { ok: true, writeCount };
    },
  };
}
