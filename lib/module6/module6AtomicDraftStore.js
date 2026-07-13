/**
 * In-memory atomic Module 6 draft store — mirrors write_module6_draft_atomic RPC.
 * Used for multi-tab / delayed-write race tests without PostgreSQL.
 */

import { deriveModule6FullText } from "./draftPersistenceHelpers.js";

function sectionsEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

const advisoryQueues = new Map();

async function withAdvisoryLock(userEmail, fn) {
  const key = String(userEmail || "");
  const prior = advisoryQueues.get(key) || Promise.resolve();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const tail = prior.then(() => gate);
  advisoryQueues.set(key, tail);
  await prior;

  try {
    return await fn();
  } finally {
    release();
    if (advisoryQueues.get(key) === tail) {
      advisoryQueues.delete(key);
    }
  }
}

/**
 * Mutable database model with row-level locking simulation.
 */
export function createModule6AtomicDraftDatabase(initialRow = null) {
  let row = initialRow ? JSON.parse(JSON.stringify(initialRow)) : null;
  let rpcAvailable = true;
  const writeLog = [];

  return {
    getRow: () => (row ? JSON.parse(JSON.stringify(row)) : null),
    getWriteLog: () => writeLog.slice(),
    setRpcAvailable(value) {
      rpcAvailable = Boolean(value);
    },
    isRpcAvailable: () => rpcAvailable,

    async writeModule6DraftAtomic({
      userEmail,
      action,
      sections,
      draftMeta = null,
      expectedRevision,
      delayMs = 0,
    }) {
      if (!rpcAvailable) {
        return {
          ok: false,
          status: "error",
          error: "rpc_unavailable",
          code: "DRAFT_ATOMIC_RPC_REQUIRED",
        };
      }

      if (!userEmail) {
        return { ok: false, status: "error", error: "missing_user_email" };
      }
      if (!["autosave", "navigate", "finalize"].includes(action)) {
        return { ok: false, status: "error", error: "unsupported_action" };
      }
      if (!Array.isArray(sections)) {
        return { ok: false, status: "error", error: "invalid_sections" };
      }
      if (expectedRevision === null || expectedRevision === undefined) {
        return {
          ok: false,
          status: "error",
          error: "missing_revision",
          code: "missing_revision",
        };
      }
      if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
        return {
          ok: false,
          status: "error",
          error: "invalid_revision",
          code: "invalid_revision",
        };
      }
      if (
        action === "finalize" &&
        (draftMeta == null || typeof draftMeta !== "object" || Array.isArray(draftMeta))
      ) {
        return {
          ok: false,
          status: "error",
          error: "missing_draft_meta",
          code: "missing_metadata",
        };
      }

      return withAdvisoryLock(userEmail, async () => {
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }

        const fullText = deriveModule6FullText(sections);
        const result = applyAtomicWrite({
          row,
          action,
          sections,
          draftMeta,
          expectedRevision,
          fullText,
          userEmail,
        });
        writeLog.push({
          action,
          sections: JSON.parse(JSON.stringify(sections)),
          expectedRevision,
          result: { ...result },
          rowLocked: row?.locked ?? false,
        });
        if (result.ok && result.mutated !== false) {
          row = result.row;
        }
        return result.response;
      });
    },
  };
}

function applyAtomicWrite({
  row,
  action,
  sections,
  draftMeta,
  expectedRevision,
  fullText,
  userEmail,
}) {
  if (row) {
    if (row.locked === true) {
      if (action === "finalize") {
        if (sectionsEqual(row.sections, sections)) {
          return {
            ok: true,
            mutated: false,
            response: {
              ok: true,
              status: "already_finalized",
              locked: true,
              revision: row.draft_revision ?? 0,
              full_text: row.full_text,
            },
            row,
          };
        }
        return {
          ok: false,
          mutated: false,
          response: {
            ok: false,
            status: "locked",
            locked: true,
            revision: row.draft_revision ?? 0,
            error: "draft_already_locked",
          },
          row,
        };
      }
      return {
        ok: false,
        mutated: false,
        response: {
          ok: false,
          status: "locked",
          locked: true,
          revision: row.draft_revision ?? 0,
          error: "draft_locked",
        },
        row,
      };
    }

    if ((row.draft_revision ?? 0) !== expectedRevision) {
      return {
        ok: false,
        mutated: false,
        response: {
          ok: false,
          status: "stale",
          locked: false,
          revision: row.draft_revision ?? 0,
          error: "revision_mismatch",
        },
        row,
      };
    }

    const newRevision = (row.draft_revision ?? 0) + 1;
    const nextRow = {
      ...row,
      sections: sections.map(String),
      full_text: fullText,
      draft_revision: newRevision,
      draft_meta: draftMeta != null ? draftMeta : row.draft_meta ?? null,
      locked: action === "finalize" ? true : row.locked ?? false,
    };
    return {
      ok: true,
      mutated: true,
      response: {
        ok: true,
        status: action === "finalize" ? "finalized" : "saved",
        locked: action === "finalize",
        revision: newRevision,
        full_text: fullText,
      },
      row: nextRow,
    };
  }

  if (expectedRevision !== 0) {
    return {
      ok: false,
      mutated: false,
      response: {
        ok: false,
        status: "stale",
        locked: false,
        revision: 0,
        error: "revision_mismatch",
      },
      row: null,
    };
  }

  const nextRow = {
    user_email: userEmail,
    module: 6,
    sections: sections.map(String),
    full_text: fullText,
    locked: action === "finalize",
    draft_meta: draftMeta,
    draft_revision: 1,
  };
  return {
    ok: true,
    mutated: true,
    response: {
      ok: true,
      status: action === "finalize" ? "finalized" : "saved",
      locked: action === "finalize",
      revision: 1,
      full_text: fullText,
    },
    row: nextRow,
  };
}

export function mapAtomicWriteToHttp(result) {
  if (!result) {
    return { status: 500, body: { ok: false, error: "empty_result" } };
  }
  if (result.error === "rpc_unavailable") {
    return {
      status: 503,
      body: {
        ok: false,
        error:
          "Module 6 atomic draft write is unavailable. Apply migration 20260713010000_module6_draft_meta.sql.",
        code: "DRAFT_ATOMIC_RPC_REQUIRED",
      },
    };
  }
  if (result.status === "locked") {
    return {
      status: 409,
      body: {
        ok: false,
        locked: true,
        status: result.status,
        error: result.error || "draft_locked",
        revision: result.revision,
      },
    };
  }
  if (result.status === "stale") {
    return {
      status: 409,
      body: {
        ok: false,
        status: result.status,
        error: result.error || "revision_mismatch",
        revision: result.revision,
        locked: result.locked ?? false,
      },
    };
  }
  if (result.ok === false) {
    return {
      status: 400,
      body: { ok: false, error: result.error || "write_failed", ...result },
    };
  }
  return {
    status: 200,
    body: {
      ok: true,
      status: result.status,
      locked: result.locked ?? false,
      revision: result.revision,
      full_text: result.full_text,
    },
  };
}
