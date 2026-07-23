import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { MLK_ASSIGNMENT_NAME } from "@/lib/assignments";
import {
  advanceModuleProgressionWithStore,
  ADVANCE_REASONS,
  logAdvancementDiagnostic,
} from "@/lib/module1/advanceModuleProgression";
import { createSupabaseAssignmentProgressStore } from "@/lib/module1/assignmentProgressStore";

/**
 * Session-authenticated assignment progress for module gates and success advance.
 * Avoids browser anon Supabase (NextAuth session ≠ Supabase Auth JWT).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json(
      { ok: false, reason: "not_signed_in", currentModule: 0 },
      { status: 401 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("student_assignments")
      .select("current_module, status, resume_path, assignment_name")
      .eq("user_email", email)
      .eq("assignment_name", MLK_ASSIGNMENT_NAME)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          reason: "read_failure",
          currentModule: 0,
          error: { message: error.message },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      reason: data ? "found" : "missing",
      currentModule:
        data && typeof data.current_module === "number"
          ? data.current_module
          : 0,
      status: data?.status ?? null,
      resumePath: data?.resume_path ?? null,
      assignmentName: MLK_ASSIGNMENT_NAME,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: "read_failure",
        currentModule: 0,
        error: { message: String(err?.message || err) },
      },
      { status: 500 }
    );
  }
}

/**
 * Forward-only CAS advance after a module success screen.
 * Body: { completedModuleNumber: number }
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json(
      { ok: false, reason: "not_signed_in", currentModule: null },
      { status: 401 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const completedModuleNumber = Number(body?.completedModuleNumber);
  if (
    !Number.isFinite(completedModuleNumber) ||
    completedModuleNumber < 1 ||
    completedModuleNumber > 9
  ) {
    return NextResponse.json(
      {
        ok: false,
        reason: "invalid_completed_module",
        currentModule: null,
      },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const store = createSupabaseAssignmentProgressStore({
      supabase,
      userEmail: email,
      assignmentName: MLK_ASSIGNMENT_NAME,
    });

    const result = await advanceModuleProgressionWithStore({
      completedModuleNumber,
      store,
    });

    if (!result.ok) {
      logAdvancementDiagnostic({
        operation: "api_assignments_progress_advance",
        reason: result.reason,
        code: result.error?.code || null,
        message: result.error?.message || "",
        attemptCount: result.attempts ?? null,
        currentModule: result.currentModule ?? null,
      });
    }

    const status =
      result.reason === ADVANCE_REASONS.MISSING_ASSIGNMENT
        ? 404
        : result.ok
          ? 200
          : 409;

    return NextResponse.json(
      {
        ok: Boolean(result.ok),
        reason: result.reason,
        alreadyAdvanced: Boolean(result.alreadyAdvanced),
        currentModule: result.currentModule ?? null,
        attempts: result.attempts ?? null,
        completedModuleNumber,
      },
      { status: result.ok ? 200 : status }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: "write_failure",
        currentModule: null,
        error: { message: String(err?.message || err) },
      },
      { status: 500 }
    );
  }
}

