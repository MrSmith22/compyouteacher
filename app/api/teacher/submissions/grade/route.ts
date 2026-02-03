import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const allowedStatuses = new Set(["ungraded", "in_review", "graded"]);

async function requireTeacherRole(email: string | null | undefined) {
  if (!email) {
    return { ok: false, status: 401, error: "Not signed in" };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_roles")
    .select("role")
    .eq("user_email", email)
    .maybeSingle();

  if (error) {
    console.warn("Grading status role lookup failed:", error);
    return { ok: false, status: 500, error: "Role lookup failed" };
  }

  if (data?.role !== "teacher") {
    return { ok: false, status: 403, error: "Teacher access only" };
  }

  return { ok: true };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const roleCheck = await requireTeacherRole(session?.user?.email);
  if (!roleCheck.ok) {
    return NextResponse.json(
      { ok: false, error: roleCheck.error },
      { status: roleCheck.status }
    );
  }

  const body = await request.json().catch(() => null);
  const studentEmail = body?.studentEmail;
  const gradingStatus = body?.gradingStatus;

  if (
    !studentEmail ||
    typeof studentEmail !== "string" ||
    !allowedStatuses.has(gradingStatus)
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("student_exports")
    .update({ grading_status: gradingStatus })
    .eq("user_email", studentEmail)
    .eq("module", 9)
    .eq("kind", "final_pdf");

  if (error) {
    console.warn("Grading status update failed:", error);
    return NextResponse.json(
      { ok: false, error: "Status update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
