// lib/supabase/helpers/teacherDashboard.ts
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function fetchTeacherDashboardData() {
  const supabase = getSupabaseAdmin();

  const [
    assignmentsRes,
    moduleScoresRes,
    module9Res,
    activityRes,
    exportsRes,
  ] = await Promise.all([
    supabase.from("student_assignments").select("*"),
    supabase.from("module_scores").select("*"),
    supabase.from("module9_quiz").select("*"),
    supabase
      .from("student_activity_log")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("student_exports").select("*").eq("kind", "final_pdf"),
  ]);

  const error =
    assignmentsRes.error ||
    moduleScoresRes.error ||
    module9Res.error ||
    activityRes.error ||
    exportsRes.error;

  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      assignments: assignmentsRes.data ?? [],
      moduleScores: moduleScoresRes.data ?? [],
      module9: module9Res.data ?? [],
      activity: activityRes.data ?? [],
      exports: exportsRes.data ?? [],
    },
    error: null,
  };
}

/** Student row for Module 9 submission review: submitted = has student_exports row with module=9, kind=final_pdf */
export type Module9SubmissionRow = {
  user_email: string;
  submittedFinalPdf: boolean;
  finalPdfUrl: string | null;
  googleDocUrl: string | null;
};

/**
 * Returns a list of students with Module 9 submission info for the teacher dashboard.
 * Submitted is determined by presence of a student_exports row where module=9 and kind=final_pdf.
 */
export async function fetchModule9SubmissionList(): Promise<{
  data: Module9SubmissionRow[] | null;
  error: Error | null;
}> {
  const supabase = getSupabaseAdmin();

  const [
    assignmentsRes,
    moduleScoresRes,
    module9Res,
    activityRes,
    exportsRes,
    exportedDocsRes,
  ] = await Promise.all([
    supabase.from("student_assignments").select("user_email"),
    supabase.from("module_scores").select("user_email"),
    supabase.from("module9_quiz").select("user_email"),
    supabase.from("student_activity_log").select("user_email"),
    supabase
      .from("student_exports")
      .select("user_email, public_url, web_view_link")
      .eq("module", 9)
      .eq("kind", "final_pdf"),
    supabase.from("exported_docs").select("user_email, web_view_link"),
  ]);

  const err =
    assignmentsRes.error ||
    moduleScoresRes.error ||
    module9Res.error ||
    activityRes.error ||
    exportsRes.error ||
    exportedDocsRes.error;
  if (err) {
    return { data: null, error: err };
  }

  const assignments = assignmentsRes.data ?? [];
  const moduleScores = moduleScoresRes.data ?? [];
  const module9 = module9Res.data ?? [];
  const activity = activityRes.data ?? [];
  const exports = exportsRes.data ?? [];
  const exportedDocs = exportedDocsRes.data ?? [];

  const emailSet = new Set<string>();
  assignments.forEach((r) => r.user_email && emailSet.add(r.user_email));
  moduleScores.forEach((r) => r.user_email && emailSet.add(r.user_email));
  module9.forEach((r) => r.user_email && emailSet.add(r.user_email));
  activity.forEach((r) => r.user_email && emailSet.add(r.user_email));
  exports.forEach((r) => r.user_email && emailSet.add(r.user_email));

  const list: Module9SubmissionRow[] = Array.from(emailSet).map((user_email) => {
    const exportRow = exports.find((e) => e.user_email === user_email);
    const docRow = exportedDocs.find((d) => d.user_email === user_email);
    const submittedFinalPdf = !!exportRow;
    const finalPdfUrl =
      exportRow?.public_url ?? exportRow?.web_view_link ?? null;
    const googleDocUrl = docRow?.web_view_link ?? null;
    return {
      user_email,
      submittedFinalPdf,
      finalPdfUrl,
      googleDocUrl,
    };
  });

  return { data: list, error: null };
}