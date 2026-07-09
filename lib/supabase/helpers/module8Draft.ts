import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const MODULE8_NUMBER = 8;

export type Module8DraftRow = {
  user_email: string;
  module: number;
  full_text: string | null;
  final_text: string | null;
  revised: boolean | null;
  final_ready: boolean | null;
  updated_at?: string | null;
};

export async function getModule8DraftAdmin({
  userEmail,
}: {
  userEmail: string;
}): Promise<{ data: Module8DraftRow | null; error: { message?: string } | null }> {
  const res = await getSupabaseAdmin()
    .from("student_drafts")
    .select("full_text, final_text, revised, final_ready, updated_at")
    .eq("user_email", userEmail)
    .eq("module", MODULE8_NUMBER)
    .maybeSingle();

  if (res.error) {
    return { data: null, error: res.error };
  }

  if (!res.data) {
    return { data: null, error: null };
  }

  return {
    data: {
      user_email: userEmail,
      module: MODULE8_NUMBER,
      full_text: res.data.full_text ?? null,
      final_text: res.data.final_text ?? null,
      revised: res.data.revised ?? null,
      final_ready: res.data.final_ready ?? null,
      updated_at: res.data.updated_at ?? null,
    },
    error: null,
  };
}

export async function upsertModule8DraftAdmin({
  userEmail,
  full_text,
  final_text,
  revised,
  final_ready,
}: {
  userEmail: string;
  full_text: string;
  final_text: string | null;
  revised: boolean;
  final_ready: boolean;
}) {
  return getSupabaseAdmin().from("student_drafts").upsert({
    user_email: userEmail,
    module: MODULE8_NUMBER,
    full_text,
    final_text,
    revised,
    final_ready,
    updated_at: new Date().toISOString(),
  });
}
