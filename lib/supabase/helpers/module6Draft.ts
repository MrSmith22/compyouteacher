import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const MODULE6_NUMBER = 6;

export type Module6DraftRow = {
  user_email: string;
  module: number;
  sections: unknown;
  full_text: string | null;
  locked: boolean | null;
  revised?: boolean | null;
  final_ready?: boolean | null;
  final_text?: string | null;
  updated_at?: string | null;
};

export async function getModule6DraftAdmin({
  userEmail,
}: {
  userEmail: string;
}): Promise<{ data: Module6DraftRow | null; error: { message?: string } | null }> {
  const res = await getSupabaseAdmin()
    .from("student_drafts")
    .select("sections, locked, full_text, revised, final_ready, final_text, updated_at")
    .eq("user_email", userEmail)
    .eq("module", MODULE6_NUMBER)
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
      module: MODULE6_NUMBER,
      sections: res.data.sections,
      full_text: res.data.full_text ?? null,
      locked: res.data.locked ?? null,
      revised: res.data.revised ?? null,
      final_ready: res.data.final_ready ?? null,
      final_text: res.data.final_text ?? null,
      updated_at: res.data.updated_at ?? null,
    },
    error: null,
  };
}

export async function upsertModule6DraftAdmin({
  userEmail,
  sections,
  full_text,
  locked,
}: {
  userEmail: string;
  sections: unknown;
  full_text: string;
  locked: boolean;
}) {
  return getSupabaseAdmin().from("student_drafts").upsert({
    user_email: userEmail,
    module: MODULE6_NUMBER,
    sections,
    full_text,
    locked,
    updated_at: new Date().toISOString(),
  });
}
