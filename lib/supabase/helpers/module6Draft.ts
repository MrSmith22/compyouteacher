import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  atomicWriteModule6DraftAdmin,
  httpStatusForAtomicResult,
  MODULE6_ATOMIC_RPC,
  type Module6AtomicWriteResult,
} from "@/lib/supabase/helpers/module6AtomicDraft";
import { isDraftMetaColumnMissingError } from "@/lib/module6/draftHydrationHelpers";
import { MODULE6_WRITE_ACTION } from "@/lib/module6/draftPersistenceHelpers";

export const MODULE6_NUMBER = 6;

export type Module6DraftRow = {
  user_email: string;
  module: number;
  sections: unknown;
  full_text: string | null;
  locked: boolean | null;
  draft_meta?: Record<string, unknown> | null;
  draft_revision?: number | null;
  revised?: boolean | null;
  final_ready?: boolean | null;
  final_text?: string | null;
  updated_at?: string | null;
};

const MODULE6_SELECT =
  "sections, locked, full_text, draft_meta, draft_revision, revised, final_ready, final_text, updated_at";

export async function getModule6DraftAdmin({
  userEmail,
}: {
  userEmail: string;
}): Promise<{ data: Module6DraftRow | null; error: { message?: string } | null }> {
  let res = await getSupabaseAdmin()
    .from("student_drafts")
    .select(MODULE6_SELECT)
    .eq("user_email", userEmail)
    .eq("module", MODULE6_NUMBER)
    .maybeSingle();

  if (res.error && isDraftMetaColumnMissingError(res.error)) {
    res = await getSupabaseAdmin()
      .from("student_drafts")
      .select("sections, locked, full_text, revised, final_ready, final_text, updated_at")
      .eq("user_email", userEmail)
      .eq("module", MODULE6_NUMBER)
      .maybeSingle();
  }

  if (res.error) {
    return { data: null, error: res.error };
  }

  if (!res.data) {
    return { data: null, error: null };
  }

  const d = res.data as Record<string, unknown>;
  return {
    data: {
      user_email: userEmail,
      module: MODULE6_NUMBER,
      sections: d.sections,
      full_text: (d.full_text as string | null) ?? null,
      locked: (d.locked as boolean | null) ?? null,
      draft_meta: (d.draft_meta as Record<string, unknown> | null) ?? null,
      draft_revision: (d.draft_revision as number | null) ?? 0,
      revised: (d.revised as boolean | null) ?? null,
      final_ready: (d.final_ready as boolean | null) ?? null,
      final_text: (d.final_text as string | null) ?? null,
      updated_at: (d.updated_at as string | null) ?? null,
    },
    error: null,
  };
}

/**
 * Atomic write — sole production write path for Module 6.
 */
export async function writeModule6DraftAtomicAdmin(input: {
  userEmail: string;
  action: string;
  sections: string[];
  draftMeta?: Record<string, unknown> | null;
  expectedRevision: number;
}) {
  return atomicWriteModule6DraftAdmin({
    userEmail: input.userEmail,
    action: input.action,
    sections: input.sections,
    draftMeta: input.draftMeta ?? null,
    expectedRevision: input.expectedRevision ?? null,
  });
}

export {
  atomicWriteModule6DraftAdmin,
  httpStatusForAtomicResult,
  MODULE6_ATOMIC_RPC,
  type Module6AtomicWriteResult,
};
