import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  fetchTeacherDashboardData,
  fetchModule9SubmissionList,
} from "@/lib/supabase/helpers/teacherDashboard";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: roleRow, error: roleErr } = await supabase
    .from("app_roles")
    .select("role")
    .eq("user_email", email)
    .maybeSingle();

  if (roleErr) {
    console.error("Role lookup error:", roleErr);
    return NextResponse.json({ ok: false, error: "Role lookup failed" }, { status: 500 });
  }

  if (roleRow?.role !== "teacher") {
    return NextResponse.json({ ok: false, error: "Teacher access only" }, { status: 403 });
  }

  const [dashboardResult, submissionResult] = await Promise.all([
    fetchTeacherDashboardData(),
    fetchModule9SubmissionList(),
  ]);

  const { data, error } = dashboardResult;
  if (error) {
    console.error("Teacher dashboard query error:", error);
    return NextResponse.json({ ok: false, error: "Dashboard query failed" }, { status: 500 });
  }

  const module9SubmissionList = submissionResult.error ? [] : (submissionResult.data ?? []);

  return NextResponse.json(
    { ok: true, data: { ...data, module9SubmissionList } },
    { status: 200 }
  );
}