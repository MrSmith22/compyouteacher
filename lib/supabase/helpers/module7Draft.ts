import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const MODULE7_NUMBER = 7;

export type Module7DraftRow = {
  user_email: string;
  module: number;
  full_text: string | null;
  final_text: string | null;
  revised: boolean | null;
  final_ready: boolean | null;
  draft_meta?: Record<string, unknown> | null;
  updated_at?: string | null;
};

export async function getModule7DraftAdmin({
  userEmail,
}: {
  userEmail: string;
}): Promise<{ data: Module7DraftRow | null; error: { message?: string } | null }> {
  const res = await getSupabaseAdmin()
    .from("student_drafts")
    .select("full_text, final_text, revised, final_ready, draft_meta, updated_at")
    .eq("user_email", userEmail)
    .eq("module", MODULE7_NUMBER)
    .maybeSingle();

  if (res.error) {
    // Compatibility: older schemas without draft_meta
    const fallback = await getSupabaseAdmin()
      .from("student_drafts")
      .select("full_text, final_text, revised, final_ready, updated_at")
      .eq("user_email", userEmail)
      .eq("module", MODULE7_NUMBER)
      .maybeSingle();
    if (fallback.error) {
      return { data: null, error: fallback.error };
    }
    if (!fallback.data) {
      return { data: null, error: null };
    }
    return {
      data: {
        user_email: userEmail,
        module: MODULE7_NUMBER,
        full_text: fallback.data.full_text ?? null,
        final_text: fallback.data.final_text ?? null,
        revised: fallback.data.revised ?? null,
        final_ready: fallback.data.final_ready ?? null,
        draft_meta: null,
        updated_at: fallback.data.updated_at ?? null,
      },
      error: null,
    };
  }

  if (!res.data) {
    return { data: null, error: null };
  }

  return {
    data: {
      user_email: userEmail,
      module: MODULE7_NUMBER,
      full_text: res.data.full_text ?? null,
      final_text: res.data.final_text ?? null,
      revised: res.data.revised ?? null,
      final_ready: res.data.final_ready ?? null,
      draft_meta: (res.data.draft_meta as Record<string, unknown> | null) ?? null,
      updated_at: res.data.updated_at ?? null,
    },
    error: null,
  };
}

export async function upsertModule7DraftAdmin({
  userEmail,
  full_text,
  final_text,
  revised,
  final_ready,
  draft_meta,
}: {
  userEmail: string;
  full_text: string;
  final_text: string | null;
  revised: boolean;
  final_ready: boolean;
  draft_meta?: Record<string, unknown> | null;
}) {
  const row: Record<string, unknown> = {
    user_email: userEmail,
    module: MODULE7_NUMBER,
    full_text,
    final_text,
    revised,
    final_ready,
    updated_at: new Date().toISOString(),
  };
  if (draft_meta !== undefined) {
    row.draft_meta = draft_meta;
  }
  return getSupabaseAdmin().from("student_drafts").upsert(row);
}
