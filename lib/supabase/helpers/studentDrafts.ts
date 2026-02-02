import { supabase } from "../../supabaseClient";

/**
 * Get the best available draft text for export: Module 7 final_text, else Module 6 full_text.
 * Does not throw; on query errors treats as no text and continues fallback or returns "".
 */
export async function getFinalTextForExport({
  userEmail,
}: {
  userEmail: string;
}): Promise<{ text: string }> {
  const res7 = await supabase
    .from("student_drafts")
    .select("final_text")
    .eq("user_email", userEmail)
    .eq("module", 7)
    .maybeSingle();
  const m7 = res7.error ? null : res7.data;

  if (m7?.final_text != null && String(m7.final_text).trim() !== "") {
    return { text: m7.final_text };
  }

  const res6 = await supabase
    .from("student_drafts")
    .select("full_text")
    .eq("user_email", userEmail)
    .eq("module", 6)
    .maybeSingle();
  const m6 = res6.error ? null : res6.data;

  if (m6?.full_text != null) {
    return { text: m6.full_text };
  }

  return { text: "" };
}

/**
 * Fetch a single draft row for a module.
 * Uses maybeSingle so the "no row yet" case returns data: null, error: null.
 */
export async function getStudentDraft({
  userEmail,
  module,
}: {
  userEmail: string;
  module: number;
}): Promise<{ data: any | null; error: any | null }> {
  const res = await supabase
    .from("student_drafts")
    .select("sections, locked")
    .eq("user_email", userEmail)
    .eq("module", module)
    .maybeSingle();

  return { data: res.data ?? null, error: res.error ?? null };
}