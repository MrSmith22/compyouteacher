/**
 * WP-100 — Grading status update (private, no-store). Receipt row required.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireTeacherSession, teacherJson } from "@/lib/teacher/requireTeacherSession";

const allowedStatuses = new Set(["ungraded", "in_review", "graded"]);

export async function POST(request: Request) {
  const auth = await requireTeacherSession();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const studentEmail = body?.studentEmail;
  const gradingStatus = body?.gradingStatus;

  if (
    !studentEmail ||
    typeof studentEmail !== "string" ||
    !allowedStatuses.has(gradingStatus)
  ) {
    return teacherJson({ ok: false, error: "Invalid request body" }, 400);
  }

  const supabase = getSupabaseAdmin();
  const { data: receipt, error: lookupErr } = await supabase
    .from("student_exports")
    .select("id")
    .eq("user_email", studentEmail)
    .eq("module", 9)
    .eq("kind", "final_pdf")
    .limit(1)
    .maybeSingle();

  if (lookupErr) {
    console.warn("Grading status lookup failed");
    return teacherJson({ ok: false, error: "Status update failed" }, 500);
  }
  if (!receipt) {
    return teacherJson(
      { ok: false, error: "No durable submission receipt for this student" },
      400
    );
  }

  const { error } = await supabase
    .from("student_exports")
    .update({ grading_status: gradingStatus })
    .eq("user_email", studentEmail)
    .eq("module", 9)
    .eq("kind", "final_pdf");

  if (error) {
    console.warn("Grading status update failed");
    return teacherJson({ ok: false, error: "Status update failed" }, 500);
  }

  return teacherJson({ ok: true }, 200);
}
