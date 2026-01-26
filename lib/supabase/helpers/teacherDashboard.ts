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