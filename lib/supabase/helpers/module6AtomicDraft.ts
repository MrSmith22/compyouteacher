import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { MODULE6_WRITE_ACTION } from "@/lib/module6/draftPersistenceHelpers";

export const MODULE6_ATOMIC_RPC = "write_module6_draft_atomic";

export type Module6AtomicWriteResult = {
  ok: boolean;
  status?: string;
  locked?: boolean;
  revision?: number;
  full_text?: string;
  error?: string;
  code?: string;
};

function isRpcMissingError(error: { message?: string; code?: string } | null) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("write_module6_draft_atomic") ||
    message.includes("could not find the function") ||
    message.includes("schema cache") ||
    error?.code === "PGRST202"
  );
}

function isDraftRevisionColumnMissing(error: { message?: string } | null) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("draft_revision") && message.includes("column");
}

/**
 * Atomic Module 6 draft write via PostgreSQL RPC.
 * All autosave / navigate / finalize must use this path.
 */
export async function atomicWriteModule6DraftAdmin({
  userEmail,
  action,
  sections,
  draftMeta,
  expectedRevision,
}: {
  userEmail: string;
  action: string;
  sections: string[];
  draftMeta?: Record<string, unknown> | null;
  expectedRevision: number;
}): Promise<{
  data: Module6AtomicWriteResult | null;
  error: { message?: string; code?: string } | null;
}> {
  const payload: Record<string, unknown> = {
    p_user_email: userEmail,
    p_action: action,
    p_sections: sections,
    p_draft_meta: draftMeta ?? null,
    p_expected_revision: expectedRevision,
  };

  const res = await getSupabaseAdmin().rpc(MODULE6_ATOMIC_RPC, payload);

  if (res.error) {
    if (isRpcMissingError(res.error) || isDraftRevisionColumnMissing(res.error)) {
      return {
        data: null,
        error: {
          message:
            "Module 6 atomic draft write is unavailable. Apply migration 20260713010000_module6_draft_meta.sql.",
          code: "DRAFT_ATOMIC_RPC_REQUIRED",
        },
      };
    }
    return { data: null, error: res.error };
  }

  const raw = res.data as Module6AtomicWriteResult | null;
  if (!raw || typeof raw !== "object") {
    return {
      data: { ok: false, error: "invalid_rpc_response" },
      error: null,
    };
  }

  return { data: raw, error: null };
}

export function httpStatusForAtomicResult(result: Module6AtomicWriteResult) {
  if (result.error === "rpc_unavailable" || result.code === "DRAFT_ATOMIC_RPC_REQUIRED") {
    return 503;
  }
  if (result.status === "locked") return 409;
  if (result.status === "stale") return 409;
  if (result.ok === false) {
    if (result.error === "unsupported_action") return 400;
    if (result.error === "missing_revision" || result.error === "invalid_revision") {
      return 400;
    }
    return 422;
  }
  return 200;
}

export { MODULE6_WRITE_ACTION };
