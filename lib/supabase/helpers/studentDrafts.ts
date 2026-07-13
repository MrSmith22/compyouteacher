import { supabase } from "../../supabaseClient";
import { selectEssayTextForExport } from "@/lib/exports/selectEssayTextForExport";

export type ExportTextStatus = "ok" | "missing" | "error";

export type ExportTextResult = {
  text: string;
  status: ExportTextStatus;
  sourceModule: 7 | 6 | null;
  details: string;
};

/**
 * Get the best available draft text for export:
 * Module 7 final_text → Module 7 full_text → Module 6 full_text.
 * Returns metadata so callers can show better student messaging and log what happened.
 * Never throws.
 */
export async function getFinalTextForExport({
  userEmail,
}: {
  userEmail: string;
}): Promise<ExportTextResult> {
  const res7 = await supabase
    .from("student_drafts")
    .select("final_text, full_text")
    .eq("user_email", userEmail)
    .eq("module", 7)
    .maybeSingle();

  const res6 = await supabase
    .from("student_drafts")
    .select("full_text")
    .eq("user_email", userEmail)
    .eq("module", 6)
    .maybeSingle();

  return selectEssayTextForExport({
    module7: res7.error ? null : res7.data,
    module6: res6.error ? null : res6.data,
    module7Error: !!res7.error,
    module6Error: !!res6.error,
  }) as ExportTextResult;
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
