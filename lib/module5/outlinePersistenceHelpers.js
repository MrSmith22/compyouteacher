/**
 * Module 5 CP-D0 — outline finalized + autosave safety helpers.
 * Pure logic only; no network side effects.
 */

export const OUTLINE_MODULE = 5;

/**
 * Only strict booleans may change finalized.
 * Omitted / null / malformed → do not include in write payload.
 * @param {unknown} raw
 * @returns {{ include: false } | { include: true, value: boolean }}
 */
export function resolveFinalizedWriteValue(raw) {
  if (raw === true) return { include: true, value: true };
  if (raw === false) return { include: true, value: false };
  return { include: false };
}

/**
 * Build upsert row fields for student_outlines.
 * When finalized is omitted from the request, the column is left out so DB preserves existing.
 * @param {{ userEmail: string, module: number, outline: unknown, finalized?: unknown }} input
 */
export function buildOutlineUpsertRow(input) {
  const row = {
    user_email: input.userEmail,
    module: input.module,
    outline: input.outline,
    updated_at: input.updatedAt || new Date().toISOString(),
  };
  const resolved = resolveFinalizedWriteValue(input.finalized);
  if (resolved.include) {
    row.finalized = resolved.value;
  }
  return row;
}

/**
 * Normalize finalized for client hydration (legacy null/absent → false for lock UI).
 * @param {unknown} raw
 */
export function readFinalizedFlag(raw) {
  return raw === true;
}

/**
 * Stable signature of outline content for echo-save suppression.
 * @param {{ thesis: string, body: unknown[], conclusion: { summary?: string, finalThought?: string } }} outline
 */
export function outlineContentSignature(outline) {
  try {
    return JSON.stringify({
      thesis: outline?.thesis ?? "",
      body: outline?.body ?? [],
      conclusion: {
        summary: outline?.conclusion?.summary ?? "",
        finalThought: outline?.conclusion?.finalThought ?? "",
      },
      // Additive CP-F ephemeral UI (stage/order bookkeeping) — part of newest state.
      module5Ui: outline?.module5Ui ?? null,
    });
  } catch {
    return "";
  }
}

/**
 * Decide whether an autosave POST is allowed.
 * @param {{
 *   hydrationReady: boolean,
 *   locked: boolean,
 *   importing: boolean,
 *   loadFailed?: boolean,
 *   signature: string,
 *   lastPostedSignature: string | null,
 * }} state
 */
export function shouldAutosaveOutline(state) {
  if (!state.hydrationReady) return false;
  if (state.loadFailed) return false;
  if (state.locked) return false;
  if (state.importing) return false;
  if (!state.signature) return false;
  if (
    state.lastPostedSignature != null &&
    state.signature === state.lastPostedSignature
  ) {
    return false;
  }
  return true;
}

/**
 * Autosave request body must omit finalized so a prior finalize is preserved.
 * @param {{ thesis: string, body: unknown[], conclusion: object }} outline
 */
export function buildAutosaveRequestBody(outline) {
  const payload = {
    thesis: outline.thesis ?? "",
    body: outline.body ?? [],
    conclusion: outline.conclusion ?? { summary: "", finalThought: "" },
  };
  if (outline?.module5Ui) {
    payload.module5Ui = outline.module5Ui;
  }
  return {
    module: OUTLINE_MODULE,
    outline: payload,
  };
}

/**
 * Finalize request body always sets finalized: true.
 */
export function buildFinalizeRequestBody(outline) {
  return {
    ...buildAutosaveRequestBody(outline),
    finalized: true,
  };
}

/**
 * Revision tracking for rapid edits — newest wins.
 * @param {number} current
 */
export function nextAutosaveRevision(current) {
  return (Number(current) || 0) + 1;
}

/**
 * After hydrate (existing / import / empty / legacy), mark the applied signature
 * so the first identical echo does not POST.
 */
export function createHydrationAutosaveGate(appliedOutline) {
  return {
    hydrationReady: true,
    lastPostedSignature: outlineContentSignature(appliedOutline),
  };
}

/**
 * Finish ordering: pending autosave must be superseded by finalize.
 * @param {{ pendingRevision: number, finalizeRevision: number }} input
 */
export function shouldIgnoreStaleAutosave(input) {
  return (
    Number(input.pendingRevision) || 0
  ) < (Number(input.finalizeRevision) || 0);
}

/**
 * Ordered outline-write queue for Module 5.
 * Autosaves and finalize share one serial pipeline.
 * Coalesces queued autosaves to the newest pending outline.
 */
export function createOutlineWriteController() {
  let contentRevision = 0;
  let writeGeneration = 0;
  let autosavesAllowed = true;
  let finalizing = false;
  /** @type {Array<object>} */
  let queue = [];
  let running = false;
  let lastAcceptedWrite = {
    kind: null,
    revision: 0,
    outline: null,
    finalized: null,
    generation: 0,
  };

  function settle(job, result) {
    job.resolve(result);
  }

  async function runQueue() {
    if (running) return;
    running = true;
    try {
      while (queue.length > 0) {
        const job = queue.shift();
        if (job.generation !== writeGeneration) {
          settle(job, {
            ok: false,
            applied: false,
            stale: true,
            reason: "obsolete_generation",
            result: null,
          });
          continue;
        }

        try {
          if (job.kind === "autosave") {
            const result = await job.send({
              revision: job.revision,
              outline: job.outline,
              generation: job.generation,
            });
            if (result?.ok) {
              lastAcceptedWrite = {
                kind: "autosave",
                revision: job.revision,
                outline: result.outline ?? job.outline,
                finalized: false,
                generation: job.generation,
              };
            }
            settle(job, {
              ok: Boolean(result?.ok),
              applied: Boolean(result?.ok),
              stale: !result?.ok,
              reason: result?.ok ? null : "not_applied",
              result,
            });
          } else if (job.kind === "finalize") {
            const result = await job.sendFinalize(job.outline);
            if (!result?.ok) {
              // Failed finalize: new generation so later edits can autosave.
              writeGeneration += 1;
              finalizing = false;
              autosavesAllowed = true;
              const obsolete = queue.filter(
                (q) => q.generation !== writeGeneration
              );
              queue = queue.filter((q) => q.generation === writeGeneration);
              for (const old of obsolete) {
                settle(old, {
                  ok: false,
                  applied: false,
                  stale: true,
                  reason: "obsolete_generation",
                  result: null,
                  navigate: false,
                });
              }
              settle(job, {
                ok: false,
                navigate: false,
                error:
                  result?.error ||
                  "We could not save your outline. Please try again.",
                lastWrite: lastAcceptedWrite,
                finalizeBarrier: 0,
              });
              continue;
            }

            lastAcceptedWrite = {
              kind: "finalize",
              revision: job.revision,
              outline: job.outline,
              finalized: true,
              generation: job.generation,
            };
            settle(job, {
              ok: true,
              navigate: true,
              error: null,
              lastWrite: lastAcceptedWrite,
              finalizeBarrier: job.revision,
            });
          }
        } catch (err) {
          if (job.kind === "finalize") {
            writeGeneration += 1;
            finalizing = false;
            autosavesAllowed = true;
            const obsolete = queue.filter(
              (q) => q.generation !== writeGeneration
            );
            queue = queue.filter((q) => q.generation === writeGeneration);
            for (const old of obsolete) {
              settle(old, {
                ok: false,
                applied: false,
                stale: true,
                reason: "obsolete_generation",
                result: null,
                navigate: false,
              });
            }
            settle(job, {
              ok: false,
              navigate: false,
              error:
                err?.message ||
                "We could not save your outline. Please try again.",
              lastWrite: lastAcceptedWrite,
              finalizeBarrier: 0,
            });
          } else {
            settle(job, {
              ok: false,
              applied: false,
              stale: false,
              reason: "error",
              result: { ok: false, error: err?.message },
            });
          }
        }
      }
    } finally {
      running = false;
      if (queue.length > 0) {
        void runQueue();
      }
    }
  }

  function enqueue(job) {
    queue.push(job);
    void runQueue();
  }

  return {
    getContentRevision: () => contentRevision,
    getWriteGeneration: () => writeGeneration,
    getFinalizeBarrier: () => (finalizing ? contentRevision : 0),
    areAutosavesAllowed: () => autosavesAllowed && !finalizing,
    getQueueLength: () => queue.length,
    isRunning: () => running,

    noteLocalEdit() {
      contentRevision += 1;
      return contentRevision;
    },

    /**
     * Enqueue an autosave of the newest outline. Coalesces waiting autosaves.
     * @param {(ctx: { revision: number, outline: object, generation: number }) => Promise<{ ok: boolean, outline?: object }>} send
     * @param {object} [outline] optional explicit outline; otherwise caller must pass via send closure
     */
    beginAutosave(send, outline) {
      if (!autosavesAllowed || finalizing) return null;

      const revision = contentRevision;
      const generation = writeGeneration;
      const payload = outline ?? null;

      // Coalesce any waiting autosave jobs to this newest one.
      const waiting = [];
      const kept = [];
      for (const job of queue) {
        if (job.kind === "autosave" && job.generation === generation) {
          waiting.push(job);
        } else {
          kept.push(job);
        }
      }
      queue = kept;
      for (const old of waiting) {
        settle(old, {
          ok: false,
          applied: false,
          stale: true,
          reason: "coalesced",
          result: null,
        });
      }

      return new Promise((resolve) => {
        enqueue({
          kind: "autosave",
          revision,
          generation,
          outline: payload,
          send: async (ctx) => {
            // Prefer newest snapshot from send if it reads live state
            return send(ctx);
          },
          resolve,
        });
      });
    },

    /**
     * Finalize: cancel timer, block autosaves, drain/coalesce queue, write last.
     */
    async finalize({ outline, cancelPendingTimer, sendFinalize }) {
      cancelPendingTimer?.();
      autosavesAllowed = false;
      finalizing = true;
      contentRevision += 1;
      const revision = contentRevision;
      const generation = writeGeneration;

      // Coalesce waiting autosaves away — finalize carries newest content.
      const waiting = [];
      const kept = [];
      for (const job of queue) {
        if (job.kind === "autosave" && job.generation === generation) {
          waiting.push(job);
        } else {
          kept.push(job);
        }
      }
      queue = kept;
      for (const old of waiting) {
        settle(old, {
          ok: false,
          applied: false,
          stale: true,
          reason: "superseded_by_finalize",
          result: null,
        });
      }

      return new Promise((resolve) => {
        enqueue({
          kind: "finalize",
          revision,
          generation,
          outline,
          sendFinalize,
          resolve,
        });
      });
    },

    mayApplyAutosaveResult(autosaveRevision, generation = writeGeneration) {
      if (finalizing) return false;
      if (generation !== writeGeneration) return false;
      if (
        lastAcceptedWrite.kind === "finalize" &&
        lastAcceptedWrite.generation === writeGeneration
      ) {
        return false;
      }
      return Number(autosaveRevision) >= 0;
    },

    getLastAcceptedWrite() {
      return lastAcceptedWrite;
    },
  };
}

/**
 * Simulate deferred network for tests.
 */
export function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Navigation only after successful finalize.
 */
export function resolveFinalizeNavigation(result) {
  if (result?.ok === true) {
    return { navigate: true, path: "/modules/5/success", error: null };
  }
  return {
    navigate: false,
    path: null,
    error:
      result?.error ||
      "We could not save your outline. Please try again.",
  };
}

/**
 * Success-page refresh must not write outlines.
 */
export const SUCCESS_PAGE_OUTLINE_WRITE = false;

export const CP_D0_LAYOUT_CONTRACT = Object.freeze({
  accessibleFinalizeError: true,
  noReopenUi: true,
  noContentValidityGates: true,
});
