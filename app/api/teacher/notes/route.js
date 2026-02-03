import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

async function requireTeacherRole(sessionEmail) {
  const supabase = getSupabaseAdmin();
  const { data: roleRow, error: roleErr } = await supabase
    .from("app_roles")
    .select("role")
    .eq("user_email", sessionEmail)
    .maybeSingle();

  if (roleErr) {
    console.warn("Teacher notes role lookup failed:", roleErr);
    return { ok: false, error: "Role lookup failed", status: 500 };
  }

  if (roleRow?.role !== "teacher") {
    return { ok: false, error: "Teacher access only", status: 403 };
  }

  return { ok: true };
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const teacherEmail = session?.user?.email;

  if (!teacherEmail) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const roleCheck = await requireTeacherRole(teacherEmail);
  if (!roleCheck.ok) {
    return NextResponse.json(
      { ok: false, error: roleCheck.error },
      { status: roleCheck.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const studentEmail = searchParams.get("studentEmail");
  const assignmentName = searchParams.get("assignmentName");

  if (!studentEmail || !assignmentName) {
    return NextResponse.json(
      { ok: false, error: "Missing studentEmail or assignmentName" },
      { status: 400 }
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
    console.warn("Teacher notes fetch failed:", error);
    return NextResponse.json({ ok: false, error: "Notes fetch failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, note: data?.note ?? "" }, { status: 200 });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const teacherEmail = session?.user?.email;

  if (!teacherEmail) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const roleCheck = await requireTeacherRole(teacherEmail);
  if (!roleCheck.ok) {
    return NextResponse.json(
      { ok: false, error: roleCheck.error },
      { status: roleCheck.status }
    );
  }

  const body = await request.json().catch(() => null);
  const studentEmail = body?.studentEmail;
  const assignmentName = body?.assignmentName;
  const note = body?.note;

  if (!studentEmail || !assignmentName || typeof note !== "string") {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("teacher_notes")
    .upsert(
      {
        teacher_email: teacherEmail,
        student_email: studentEmail,
        assignment_name: assignmentName,
        note,
      },
      { onConflict: "teacher_email,student_email,assignment_name" }
    );

  if (error) {
    console.warn("Teacher notes save failed:", error);
    return NextResponse.json({ ok: false, error: "Notes save failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
