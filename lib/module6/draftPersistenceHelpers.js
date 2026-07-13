/**
 * Module 6 CP-G — ordered write controller, lock semantics, mechanical gates.
 * Pure logic; no network side effects inside the controller.
 */

export const MODULE6_WRITE_ACTION = Object.freeze({
  AUTOSAVE: "autosave",
  NAVIGATE: "navigate",
  FINALIZE: "finalize",
});

export const SECTION_MIN_CHARS = 12;

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Server always derives full_text from ordered sections.
 */
export function deriveModule6FullText(sections) {
  return (Array.isArray(sections) ? sections : [])
    .map((s) => String(s ?? ""))
    .join("\n\n");
}

/**
 * Autosave/navigation must omit locked so DB preserves finalize state.
 */
export function resolveLockedWriteValue(raw, { action } = {}) {
  if (action === MODULE6_WRITE_ACTION.FINALIZE) {
    return { include: true, value: true };
  }
  // Ordinary writes never mutate locked.
  if (raw === undefined) return { include: false };
  return { include: false };
}

/**
 * Build upsert row. Omits locked unless finalize. Omits draft_meta when null.
 */
export function buildModule6UpsertRow({
  userEmail,
  sections,
  draftMeta = null,
  locked,
  action = MODULE6_WRITE_ACTION.AUTOSAVE,
  updatedAt,
} = {}) {
  const row = {
    user_email: userEmail,
    module: 6,
    sections: Array.isArray(sections) ? sections.map((s) => String(s ?? "")) : [],
    full_text: deriveModule6FullText(sections),
    updated_at: updatedAt || new Date().toISOString(),
  };

  const lock = resolveLockedWriteValue(locked, { action });
  if (lock.include) {
    row.locked = lock.value;
  }

  if (draftMeta && typeof draftMeta === "object") {
    row.draft_meta = draftMeta;
  }

  return row;
}

export function draftContentSignature(sections, draftMeta = null) {
  try {
    return JSON.stringify({
      sections: Array.isArray(sections) ? sections : [],
      draftMeta: draftMeta
        ? {
            currentSectionIndex: draftMeta.currentSectionIndex,
            currentStageId: draftMeta.currentStageId,
            sourceOutlineSignature: draftMeta.sourceOutlineSignature,
            completedSectionIds: draftMeta.completedSectionIds,
            outlineReviewRequired: draftMeta.outlineReviewRequired,
            outlineReviewAcknowledged: draftMeta.outlineReviewAcknowledged,
          }
        : null,
    });
  } catch {
    return "";
  }
}

export function shouldAutosaveDraft({
  hydrationReady,
  locked,
  writesAllowed,
  signature,
  lastPostedSignature,
} = {}) {
  if (!hydrationReady) return false;
  if (!writesAllowed) return false;
  if (locked) return false;
  if (!signature) return false;
  if (
    lastPostedSignature != null &&
    signature === lastPostedSignature
  ) {
    return false;
  }
  return true;
}

export function createHydrationDraftAutosaveGate(sections, draftMeta) {
  return {
    hydrationReady: true,
    lastPostedSignature: draftContentSignature(sections, draftMeta),
  };
}

/**
 * Mechanical readiness for one prose section.
 */
export function evaluateSectionReadiness(text, { minimumChars = SECTION_MIN_CHARS } = {}) {
  const trimmed = safeText(text);
  if (!trimmed) {
    return {
      ok: false,
      message: "Write some sentences for this section before continuing.",
      charCount: 0,
      minimumChars,
      gradesStyle: false,
    };
  }
  if (trimmed.length < minimumChars) {
    return {
      ok: false,
      message: `Add a bit more so this section has at least a short paragraph (about ${minimumChars} characters).`,
      charCount: trimmed.length,
      minimumChars,
      gradesStyle: false,
    };
  }
  return {
    ok: true,
    message: "",
    charCount: trimmed.length,
    minimumChars,
    gradesStyle: false,
  };
}

/**
 * Whole-draft mechanical readiness before Finish.
 */
export function evaluateDraftFinalizeReadiness({
  sections = [],
  expectedCount = null,
} = {}) {
  const list = Array.isArray(sections) ? sections : [];
  if (expectedCount != null && list.length !== expectedCount) {
    return {
      ok: false,
      message:
        "Your draft section count does not match your finalized outline. Review the outline change notice before finishing.",
      emptyIndexes: [],
      gradesStyle: false,
    };
  }
  if (list.length < 2) {
    return {
      ok: false,
      message: "Your draft is missing required sections.",
      emptyIndexes: [],
      gradesStyle: false,
    };
  }
  const emptyIndexes = [];
  list.forEach((text, index) => {
    if (!evaluateSectionReadiness(text).ok) emptyIndexes.push(index);
  });
  if (emptyIndexes.length) {
    return {
      ok: false,
      message: "Every required section needs meaningful prose before you finish.",
      emptyIndexes,
      gradesStyle: false,
    };
  }
  return { ok: true, message: "", emptyIndexes: [], gradesStyle: false };
}

export function wordCount(text) {
  return safeText(text)
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Server validation of POST body.
 */
export function validateModule6DraftWriteBody(body = {}, { existingLocked = false } = {}) {
  const action = String(body?.action || MODULE6_WRITE_ACTION.AUTOSAVE).toLowerCase();
  const sections = body?.sections;

  if (!Array.isArray(sections)) {
    return {
      ok: false,
      status: 400,
      error: "Missing or invalid sections array",
    };
  }
  if (!sections.every((s) => typeof s === "string")) {
    return {
      ok: false,
      status: 400,
      error: "Each section must be a string",
    };
  }

  // Never trust client full_text or user email.
  if (Object.prototype.hasOwnProperty.call(body, "userEmail") && body.userEmail) {
    // Ignored — session email wins. Not an error.
  }

  if (existingLocked && action !== MODULE6_WRITE_ACTION.FINALIZE) {
    return {
      ok: false,
      status: 409,
      error: "This draft is locked. Ordinary writes are not allowed.",
      locked: true,
    };
  }

  let draftMeta = null;
  if (body?.draft_meta != null) {
    if (typeof body.draft_meta !== "object" || Array.isArray(body.draft_meta)) {
      return {
        ok: false,
        status: 400,
        error: "draft_meta must be an object when provided",
      };
    }
    draftMeta = body.draft_meta;
  }

  return {
    ok: true,
    action,
    sections,
    draftMeta,
    // full_text always derived server-side
    full_text: deriveModule6FullText(sections),
    finalize: action === MODULE6_WRITE_ACTION.FINALIZE,
  };
}

/**
 * Ordered draft-write queue (autosave / navigate / finalize).
 */
export function createDraftWriteController() {
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
    sections: null,
    locked: null,
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
            locked: false,
            error: "obsolete_generation",
          });
          continue;
        }

        try {
          if (job.kind === "finalize") {
            const result = await job.sendFinalize(job.payload);
            if (!result?.ok) {
              writeGeneration += 1;
              finalizing = false;
              autosavesAllowed = true;
              const obsolete = queue.filter((q) => q.generation !== writeGeneration);
              queue = queue.filter((q) => q.generation === writeGeneration);
              for (const old of obsolete) {
                settle(old, {
                  ok: false,
                  applied: false,
                  stale: true,
                  locked: false,
                  error: "obsolete_generation",
                });
              }
              settle(job, {
                ok: false,
                applied: false,
                stale: false,
                locked: false,
                error: result?.error || "finalize_failed",
              });
              continue;
            }
            lastAcceptedWrite = {
              kind: "finalize",
              revision: job.revision,
              sections: job.payload.sections,
              locked: true,
              generation: job.generation,
            };
            settle(job, {
              ok: true,
              applied: true,
              stale: false,
              locked: true,
              error: null,
            });
            continue;
          }

          const result = await job.send(job.payload);
          if (result?.ok) {
            lastAcceptedWrite = {
              kind: job.kind,
              revision: job.revision,
              sections: job.payload.sections,
              locked: false,
              generation: job.generation,
            };
          }
          settle(job, {
            ok: Boolean(result?.ok),
            applied: Boolean(result?.ok),
            stale: !result?.ok,
            locked: false,
            error: result?.ok ? null : result?.error || "not_applied",
          });
        } catch (err) {
          if (job.kind === "finalize") {
            writeGeneration += 1;
            finalizing = false;
            autosavesAllowed = true;
            settle(job, {
              ok: false,
              applied: false,
              stale: false,
              locked: false,
              error: err?.message || "finalize_failed",
            });
          } else {
            settle(job, {
              ok: false,
              applied: false,
              stale: false,
              locked: false,
              error: err?.message || "write_failed",
            });
          }
        }
      }
    } finally {
      running = false;
      if (queue.length > 0) void runQueue();
    }
  }

  function enqueue(job) {
    queue.push(job);
    void runQueue();
  }

  function coalesceAutosaves(generation) {
    const waiting = [];
    const kept = [];
    for (const job of queue) {
      if (
        (job.kind === "autosave" || job.kind === "navigate") &&
        job.generation === generation
      ) {
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
        locked: false,
        error: "coalesced",
      });
    }
  }

  return {
    getContentRevision: () => contentRevision,
    getWriteGeneration: () => writeGeneration,
    areAutosavesAllowed: () => autosavesAllowed && !finalizing,
    getQueueLength: () => queue.length,
    getLastAcceptedWrite: () => ({ ...lastAcceptedWrite }),

    noteLocalEdit() {
      contentRevision += 1;
      return contentRevision;
    },

    beginAutosave(send, payload) {
      if (!autosavesAllowed || finalizing) return null;
      const revision = contentRevision;
      const generation = writeGeneration;
      coalesceAutosaves(generation);
      return new Promise((resolve) => {
        enqueue({
          kind: "autosave",
          revision,
          generation,
          payload,
          send,
          resolve,
        });
      });
    },

    beginNavigate(send, payload) {
      if (!autosavesAllowed || finalizing) return null;
      contentRevision += 1;
      const revision = contentRevision;
      const generation = writeGeneration;
      coalesceAutosaves(generation);
      return new Promise((resolve) => {
        enqueue({
          kind: "navigate",
          revision,
          generation,
          payload,
          send,
          resolve,
        });
      });
    },

    async finalize({ payload, cancelPendingTimer, sendFinalize }) {
      cancelPendingTimer?.();
      autosavesAllowed = false;
      finalizing = true;
      contentRevision += 1;
      const revision = contentRevision;
      const generation = writeGeneration;
      coalesceAutosaves(generation);

      return new Promise((resolve) => {
        enqueue({
          kind: "finalize",
          revision,
          generation,
          payload,
          sendFinalize,
          resolve,
        });
      });
    },

    /**
     * After failed finalize, allow edits again.
     */
    unlockAfterFailedFinalize() {
      finalizing = false;
      autosavesAllowed = true;
      writeGeneration += 1;
    },
  };
}

/**
 * Mutable test boundary for hydration + write serialization.
 */
export function createModule6DraftSession({
  initialServerDraft = null,
} = {}) {
  let serverDraft = initialServerDraft
    ? JSON.parse(JSON.stringify(initialServerDraft))
    : null;
  let generation = 0;
  let localSections = null;
  let localMeta = null;
  let readState = "pending";
  let writeCount = 0;
  const writes = [];
  let failNextGet = false;
  let getHandler = null;
  let rejectOrdinaryWhenLocked = true;

  return {
    getWriteCount: () => writeCount,
    getWrites: () => writes.slice(),
    getServerDraft: () =>
      serverDraft ? JSON.parse(JSON.stringify(serverDraft)) : null,
    getLocalSections: () =>
      localSections ? JSON.parse(JSON.stringify(localSections)) : null,
    getLocalMeta: () =>
      localMeta ? JSON.parse(JSON.stringify(localMeta)) : null,
    getReadState: () => readState,
    setFailNextGet(v) {
      failNextGet = Boolean(v);
    },
    setGetHandler(fn) {
      getHandler = typeof fn === "function" ? fn : null;
    },
    setServerDraft(row) {
      serverDraft = row ? JSON.parse(JSON.stringify(row)) : null;
    },
    beginHydration() {
      generation += 1;
      return generation;
    },
    async hydrate({
      generation: attemptGeneration,
      emptySections = [],
      meta = null,
    }) {
      let getResult;
      if (getHandler) getResult = await getHandler();
      else if (failNextGet) {
        failNextGet = false;
        getResult = { ok: false, networkError: true };
      } else {
        getResult = { ok: true, data: serverDraft };
      }

      if (attemptGeneration !== generation) {
        return { ok: false, stale: true, applied: false, readState };
      }

      if (!getResult.ok) {
        readState = "draft_read_failed";
        localSections = null;
        return {
          ok: false,
          stale: false,
          applied: true,
          readState,
          canWrite: false,
        };
      }

      const row = getResult.data;
      if (row && Array.isArray(row.sections) && row.sections.length) {
        readState = "draft_loaded";
        localSections = row.sections.map(String);
        localMeta = row.draft_meta || meta;
        return {
          ok: true,
          stale: false,
          applied: true,
          readState,
          canWrite: row.locked !== true,
          locked: row.locked === true,
          imported: false,
        };
      }

      readState = "confirmed_no_draft";
      localSections = emptySections.map(String);
      localMeta = meta;
      return {
        ok: true,
        stale: false,
        applied: true,
        readState,
        canWrite: true,
        locked: false,
        imported: true,
      };
    },
    attemptWrite({ sections, draftMeta, action = "autosave", locked } = {}) {
      if (readState === "draft_read_failed" || readState === "pending") {
        return { ok: false, blocked: true, writeCount };
      }
      if (
        rejectOrdinaryWhenLocked &&
        serverDraft?.locked === true &&
        action !== "finalize"
      ) {
        return { ok: false, blocked: true, locked: true, writeCount };
      }
      writeCount += 1;
      const next = {
        sections: sections.map(String),
        full_text: deriveModule6FullText(sections),
        locked:
          action === "finalize"
            ? true
            : serverDraft?.locked === true
              ? true
              : false,
        draft_meta: draftMeta || serverDraft?.draft_meta || null,
      };
      // Autosave/navigate must not unlock.
      if (action !== "finalize" && serverDraft?.locked === true) {
        next.locked = true;
      }
      if (action !== "finalize") {
        // omit lock mutation: keep prior
        next.locked = serverDraft?.locked === true;
      }
      writes.push({ action, ...JSON.parse(JSON.stringify(next)) });
      serverDraft = next;
      localSections = next.sections;
      localMeta = next.draft_meta;
      return { ok: true, writeCount, locked: next.locked };
    },
  };
}
