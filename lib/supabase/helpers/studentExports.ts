import { supabase } from "../../supabaseClient";

/**
 * Fetch the exported Google Doc link for a user (exported_docs).
 * Read-only; returns the Supabase result unchanged.
 */
export async function getExportedDocLink({
  userEmail,
}: {
  userEmail: string;
}) {
  return supabase
    .from("exported_docs")
    .select("web_view_link")
    .eq("user_email", userEmail)
    .maybeSingle();
}

/**
 * Fetch the final PDF export for a student (Module 9, kind = final_pdf).
 * Read-only; returns the Supabase result unchanged.
 */
export async function getFinalPdfExport({
  userEmail,
}: {
  userEmail: string;
}) {
  return supabase
    .from("student_exports")
    .select("*")
    .eq("user_email", userEmail)
    .eq("module", 9)
    .eq("kind", "final_pdf")
    .maybeSingle();
}

/**
 * Fetch a student export row by user email, module, and kind.
 * Read-only; returns the Supabase result unchanged.
 */
export async function getStudentExport({
  userEmail,
  module,
  kind,
}: {
  userEmail: string;
  module: number;
  kind: string;
}) {
  return supabase
    .from("student_exports")
    .select("*")
    .eq("user_email", userEmail)
    .eq("module", module)
    .eq("kind", kind)
    .maybeSingle();
}
