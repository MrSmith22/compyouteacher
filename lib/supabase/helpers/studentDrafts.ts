import { supabase } from "../../supabaseClient";

export type ExportTextStatus = "ok" | "missing" | "error";

export type ExportTextResult = {
  text: string;
  status: ExportTextStatus;
  sourceModule: 7 | 6 | null;
  details: string;
};

/**
 * Get the best available draft text for export: Module 7 final_text, else Module 6 full_text.
 * Returns metadata so callers can show better student messaging and log what happened.
 * Never throws.
 */
export async function getFinalTextForExport({
  userEmail,
}: {
  userEmail: string;
}): Promise<ExportTextResult> {
  let m7Error: any | null = null;
  let m6Error: any | null = null;

  // Try Module 7 final_text first
  const res7 = await supabase
    .from("student_drafts")
    .select("final_text")
    .eq("user_email", userEmail)
    .eq("module", 7)
    .maybeSingle();

  if (res7.error) m7Error = res7.error;

  const m7 = res7.error ? null : res7.data;
  const m7Text = m7?.final_text != null ? String(m7.final_text) : "";
  if (m7Text.trim() !== "") {
    return {
      text: m7Text,
      status: "ok",
      sourceModule: 7,
      details: "export_text_from_module_7_final_text",
    };
  }

  // Fallback to Module 6 full_text
  const res6 = await supabase
    .from("student_drafts")
    .select("full_text")
    .eq("user_email", userEmail)
    .eq("module", 6)
    .maybeSingle();

  if (res6.error) m6Error = res6.error;

  const m6 = res6.error ? null : res6.data;
  const m6Text = m6?.full_text != null ? String(m6.full_text) : "";
  if (m6Text.trim() !== "") {
    return {
      text: m6Text,
      status: "ok",
      sourceModule: 6,
      details: m7Error
        ? "export_text_from_module_6_full_text_fallback_after_module_7_error"
        : "export_text_from_module_6_full_text_fallback",
    };
  }

  // If we got here, we have no usable text
  if (m7Error || m6Error) {
    const parts: string[] = [];
    if (m7Error) parts.push("module7_query_error");
    if (m6Error) parts.push("module6_query_error");
    return {
      text: "",
      status: "error",
      sourceModule: null,
      details: parts.join("_and_"),
    };
  }

  return {
    text: "",
    status: "missing",
    sourceModule: null,
    details: "no_text_in_module_7_or_module_6",
  };
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