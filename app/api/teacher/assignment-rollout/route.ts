import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getAssignmentWritingSpineRollout,
  upsertAssignmentWritingSpineRollout,
} from "@/lib/supabase/helpers/writingSpineRolloutSettings";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
} from "@/lib/assignments/identity";

async function requireTeacherRole(sessionEmail: string) {
  const supabase = getSupabaseAdmin();
  const { data: roleRow, error: roleErr } = await supabase
    .from("app_roles")
    .select("role")
    .eq("user_email", sessionEmail)
    .maybeSingle();

  if (roleErr) {
    return { ok: false as const, error: "Role lookup failed", status: 500 };
  }
  if (roleRow?.role !== "teacher") {
    return { ok: false as const, error: "Teacher access only", status: 403 };
  }
  return { ok: true as const };
}

/**
 * Teacher/ops read of writing-spine rollout (WP-085).
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const roleCheck = await requireTeacherRole(email);
  if (!roleCheck.ok) {
    return NextResponse.json(
      { ok: false, error: roleCheck.error },
      { status: roleCheck.status }
    );
  }

  const url = new URL(request.url);
  const assignmentId =
    url.searchParams.get("assignmentId") || DEFAULT_ASSIGNMENT_ID;
  const result = await getAssignmentWritingSpineRollout(assignmentId);
  return NextResponse.json(result);
}

/**
 * Teacher/ops write — changes presentation mode only; never deletes rebuilt artifacts.
 */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const roleCheck = await requireTeacherRole(email);
  if (!roleCheck.ok) {
    return NextResponse.json(
      { ok: false, error: roleCheck.error },
      { status: roleCheck.status }
    );
  }

  const body = await request.json().catch(() => ({}));
  const result = await upsertAssignmentWritingSpineRollout(body.mode ?? body.writingSpineMode, {
    assignmentId: body.assignmentId || DEFAULT_ASSIGNMENT_ID,
    assignmentName: body.assignmentName || DEFAULT_ASSIGNMENT_NAME,
    updatedBy: email,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, source: result.source || null },
      { status: result.status || 400 }
    );
  }

  return NextResponse.json(result);
}
