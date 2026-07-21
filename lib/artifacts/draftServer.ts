import type { Module6DraftRow } from "@/lib/supabase/helpers/module6Draft";
import type { Module7DraftRow } from "@/lib/supabase/helpers/module7Draft";
import type { Module8DraftRow } from "@/lib/supabase/helpers/module8Draft";
import {
  getModule6DraftAdmin,
  writeModule6DraftAtomicAdmin,
} from "@/lib/supabase/helpers/module6Draft";
import {
  httpStatusForAtomicResult,
  type Module6AtomicWriteResult,
} from "@/lib/supabase/helpers/module6AtomicDraft";
import {
  getModule7DraftAdmin,
  upsertModule7DraftAdmin,
} from "@/lib/supabase/helpers/module7Draft";
import {
  getModule8DraftAdmin,
  upsertModule8DraftAdmin,
} from "@/lib/supabase/helpers/module8Draft";

export type Module6DraftWriteInput = {
  userEmail: string;
  sections: string[];
  draft_meta?: Record<string, unknown> | null;
  action?: string;
  expected_revision: number;
};

export type Module6AtomicWriteResponse = {
  ok: boolean;
  result?: Module6AtomicWriteResult | null;
  error?: string;
  code?: string;
  httpStatus?: number;
  status?: string;
  locked?: boolean;
  revision?: number;
};

export type Module7DraftWriteInput = {
  userEmail: string;
  full_text: string;
  final_text: string | null;
  revised: boolean;
  final_ready: boolean;
  draft_meta?: Record<string, unknown> | null;
};

export type Module8DraftWriteInput = {
  userEmail: string;
  full_text: string;
  final_text: string | null;
  revised: boolean;
  final_ready: boolean;
};

export async function getModule6DraftForUser(userEmail: string) {
  const res = await getModule6DraftAdmin({ userEmail });

  if (res.error) {
    return {
      ok: false as const,
      error: res.error,
      data: null as Module6DraftRow | null,
    };
  }

  return { ok: true as const, data: res.data };
}

export async function writeModule6DraftAtomicForUser(
  input: Module6DraftWriteInput
): Promise<Module6AtomicWriteResponse> {
  const writeRes = await writeModule6DraftAtomicAdmin({
    userEmail: input.userEmail,
    action: input.action || "autosave",
    sections: input.sections,
    draftMeta: input.draft_meta ?? null,
    expectedRevision: input.expected_revision,
  });

  if (writeRes.error) {
    const code = writeRes.error.code || "DRAFT_WRITE_FAILED";
    return {
      ok: false,
      error: writeRes.error.message || "Draft write failed",
      code,
      httpStatus: code === "DRAFT_ATOMIC_RPC_REQUIRED" ? 503 : 500,
    };
  }

  const result = writeRes.data;
  if (!result) {
    return {
      ok: false,
      error: "Empty atomic write response",
      httpStatus: 500,
    };
  }

  if (result.ok === false) {
    return {
      ok: false,
      result,
      error: result.error,
      status: result.status,
      locked: result.locked,
      revision: result.revision,
      httpStatus: httpStatusForAtomicResult(result),
    };
  }

  return {
    ok: true,
    result,
    status: result.status,
    locked: result.locked,
    revision: result.revision,
  };
}

/** @deprecated Use writeModule6DraftAtomicForUser — non-atomic upsert removed. */
export async function upsertModule6DraftForUser(input: Module6DraftWriteInput) {
  return writeModule6DraftAtomicForUser(input);
}

export async function getModule7DraftForUser(userEmail: string) {
  const res = await getModule7DraftAdmin({ userEmail });

  if (res.error) {
    return {
      ok: false as const,
      error: res.error,
      data: null as Module7DraftRow | null,
    };
  }

  return { ok: true as const, data: res.data };
}

export async function upsertModule7DraftForUser(input: Module7DraftWriteInput) {
  const writeRes = await upsertModule7DraftAdmin({
    userEmail: input.userEmail,
    full_text: input.full_text,
    final_text: input.final_text,
    revised: input.revised,
    final_ready: input.final_ready,
    draft_meta: input.draft_meta,
  });

  if (writeRes.error) {
    return { ok: false as const, error: writeRes.error };
  }

  return { ok: true as const };
}

export async function getModule8DraftForUser(userEmail: string) {
  const res = await getModule8DraftAdmin({ userEmail });

  if (res.error) {
    return {
      ok: false as const,
      error: res.error,
      data: null as Module8DraftRow | null,
    };
  }

  return { ok: true as const, data: res.data };
}

export async function upsertModule8DraftForUser(input: Module8DraftWriteInput) {
  const writeRes = await upsertModule8DraftAdmin({
    userEmail: input.userEmail,
    full_text: input.full_text,
    final_text: input.final_text,
    revised: input.revised,
    final_ready: input.final_ready,
  });

  if (writeRes.error) {
    return { ok: false as const, error: writeRes.error };
  }

  return { ok: true as const };
}
