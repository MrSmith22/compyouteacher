/**
 * WP-100 — Teacher notes (private, no-store).
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireTeacherSession, teacherJson } from "@/lib/teacher/requireTeacherSession";

export async function GET(request: Request) {
  const auth = await requireTeacherSession();
  if ("error" in auth) return auth.error;
  const teacherEmail = auth.email;

  const { searchParams } = new URL(request.url);
  const studentEmail = searchParams.get("studentEmail");
  const assignmentName = searchParams.get("assignmentName");

  if (!studentEmail || !assignmentName) {
    return teacherJson(
      { ok: false, error: "Missing studentEmail or assignmentName" },
      400
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("teacher_notes")
    .select("note")
    .eq("teacher_email", teacherEmail)
    .eq("student_email", studentEmail)
    .eq("assignment_name", assignmentName)
    .maybeSingle();

  if (error) {
    console.warn("Teacher notes fetch failed");
    return teacherJson({ ok: false, error: "Notes fetch failed" }, 500);
  }

  return teacherJson({ ok: true, note: data?.note ?? "" }, 200);
}

export async function POST(request: Request) {
  const auth = await requireTeacherSession();
  if ("error" in auth) return auth.error;
  const teacherEmail = auth.email;

  const body = await request.json().catch(() => null);
  const studentEmail = body?.studentEmail;
  const assignmentName = body?.assignmentName;
  const note = body?.note;

  if (!studentEmail || !assignmentName || typeof note !== "string") {
    return teacherJson({ ok: false, error: "Invalid request body" }, 400);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("teacher_notes").upsert(
    {
      teacher_email: teacherEmail,
      student_email: studentEmail,
      assignment_name: assignmentName,
      note,
    },
    { onConflict: "teacher_email,student_email,assignment_name" }
  );

  if (error) {
    console.warn("Teacher notes save failed");
    return teacherJson({ ok: false, error: "Notes save failed" }, 500);
  }

  return teacherJson({ ok: true }, 200);
}
