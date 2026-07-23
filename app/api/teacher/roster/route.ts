/**
 * WP-099 — Teacher roster read-model API (development foundation path).
 * Teacher-only, assignment-scoped, roster fields only.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isTeacherProgressVisibilityFoundationEnabled } from "@/lib/dev/isTeacherProgressVisibilityFoundationEnabled";
import { buildTeacherRosterReadModel } from "@/lib/teacher/buildTeacherRosterReadModel";
import { DEFAULT_ASSIGNMENT_NAME, MLK_ASSIGNMENT_ID } from "@/lib/assignments/identity";

async function requireTeacher() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return {
      error: NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 }),
    };
  }
  const supabase = getSupabaseAdmin();
  const { data: roleRow, error: roleErr } = await supabase
    .from("app_roles")
    .select("role")
    .eq("user_email", email)
    .maybeSingle();
  if (roleErr) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Role lookup failed" },
        { status: 500 }
      ),
    };
  }
  if (roleRow?.role !== "teacher") {
    return {
      error: NextResponse.json(
        { ok: false, error: "Teacher access only" },
        { status: 403 }
      ),
    };
  }
  return { email };
}

export async function GET(req: Request) {
  if (!isTeacherProgressVisibilityFoundationEnabled()) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const auth = await requireTeacher();
  if ("error" in auth && auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignmentId") || MLK_ASSIGNMENT_ID;
  const assignmentName =
    searchParams.get("assignmentName") || DEFAULT_ASSIGNMENT_NAME;
  const useFixtures = searchParams.get("source") === "fixtures";

  try {
    const model = await buildTeacherRosterReadModel({
      assignmentId,
      assignmentName,
      useFixtures,
    });
    if (!model.ok) {
      return NextResponse.json(
        { ok: false, error: model.error || "Roster query failed" },
        { status: 500 }
      );
    }
    return NextResponse.json(model, { status: 200 });
  } catch (err) {
    console.error("Teacher roster error:", err);
    return NextResponse.json(
      { ok: false, error: "Roster query failed" },
      { status: 500 }
    );
  }
}
