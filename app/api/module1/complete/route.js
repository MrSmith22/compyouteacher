import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { MLK_ASSIGNMENT_NAME } from "@/lib/assignments";
import {
  ADVANCE_REASONS,
  advanceModuleProgressionWithStore,
  logAdvancementDiagnostic,
} from "@/lib/module1/advanceModuleProgression";
import { createSupabaseAssignmentProgressStore } from "@/lib/module1/assignmentProgressStore";
import {
  MODULE1_COMPLETION_REASONS,
  evaluateModule1CompletionReadiness,
} from "@/lib/module1/module1CompletionReadiness";

/** Module 1 completion always advances from module 1 → at least 2. */
const MODULE1_COMPLETED_NUMBER = 1;

function hasUnexpectedCompletionParams(body) {
  if (!body || typeof body !== "object") return false;
  return (
    Object.prototype.hasOwnProperty.call(body, "completedModuleNumber") ||
    Object.prototype.hasOwnProperty.call(body, "completed_module") ||
    Object.prototype.hasOwnProperty.call(body, "targetModule") ||
    Object.prototype.hasOwnProperty.call(body, "currentModule")
  );
}

/**
 * Authenticated Module 1 completion only.
 * - Session email is the only identity source
 * - Never trusts a client module number
 * - Requires durable prompt + current-version quiz artifacts before CAS
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      {
        ok: false,
        reason: ADVANCE_REASONS.READ_FAILURE,
        error: { message: "Not signed in." },
      },
      { status: 401 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (hasUnexpectedCompletionParams(body)) {
    return NextResponse.json(
      {
        ok: false,
        reason: ADVANCE_REASONS.WRITE_FAILURE,
        error: {
          message:
            "This endpoint completes Module 1 only. Do not send a module number.",
        },
      },
      { status: 400 }
    );
  }

  if (
    body?.assignmentName != null &&
    String(body.assignmentName).trim() &&
    String(body.assignmentName).trim() !== MLK_ASSIGNMENT_NAME
  ) {
    return NextResponse.json(
      {
        ok: false,
        reason: ADVANCE_REASONS.WRITE_FAILURE,
        error: { message: "Unsupported assignment." },
      },
      { status: 400 }
    );
  }

  const assignmentName = MLK_ASSIGNMENT_NAME;

  try {
    const supabase = getSupabaseAdmin();
    let quizRes = await supabase
      .from("module1_quiz_results")
      .select(
        "id, score, total, answers, quiz_version, submitted_at, created_at"
      )
      .eq("user_email", email);

    if (quizRes.error) {
      const message = String(quizRes.error.message || "");
      if (/quiz_version|submitted_at/i.test(message) || quizRes.error.code === "PGRST204") {
        quizRes = await supabase
          .from("module1_quiz_results")
          .select("id, score, total, answers, created_at")
          .eq("user_email", email);
      }
    }

    const [assignmentRes, promptRes] = await Promise.all([
      supabase
        .from("student_assignments")
        .select("*")
        .eq("user_email", email)
        .eq("assignment_name", assignmentName)
        .maybeSingle(),
      supabase
        .from("module1_prompt_breakdown")
        .select(
          "task_verb, task_type, analysis_focus, required_angle, student_paraphrase, response_text"
        )
        .eq("user_email", email)
        .maybeSingle(),
    ]);

    const readiness = evaluateModule1CompletionReadiness({
      assignment: assignmentRes.data,
      promptBreakdown: promptRes.data
        ? {
            ...promptRes.data,
            student_paraphrase:
              promptRes.data.student_paraphrase ||
              promptRes.data.response_text ||
              "",
          }
        : null,
      quizResults: Array.isArray(quizRes.data) ? quizRes.data : [],
      assignmentReadError: assignmentRes.error,
      promptReadError: promptRes.error,
      quizReadError: quizRes.error,
    });

    if (!readiness.ready) {
      logAdvancementDiagnostic({
        operation: "api_module1_complete_readiness",
        reason: readiness.reason,
        message: "Module 1 artifacts not ready for advancement.",
        currentModule: readiness.currentModule ?? null,
      });
      return NextResponse.json(
        {
          ok: false,
          reason: readiness.reason,
          error: {
            message:
              readiness.reason === MODULE1_COMPLETION_REASONS.QUIZ_MISSING
                ? "Save your Module 1 quiz before continuing."
                : readiness.reason ===
                    MODULE1_COMPLETION_REASONS.PROMPT_INCOMPLETE
                  ? "Finish your prompt breakdown before continuing."
                  : readiness.reason ===
                      MODULE1_COMPLETION_REASONS.QUIZ_VERSION_OUTDATED
                    ? "Retake the current Module 1 quiz before continuing."
                    : "Module 1 is not ready to complete yet.",
          },
        },
        { status: 409 }
      );
    }

    const store = createSupabaseAssignmentProgressStore({
      supabase,
      userEmail: email,
      assignmentName,
    });

    const result = await advanceModuleProgressionWithStore({
      completedModuleNumber: MODULE1_COMPLETED_NUMBER,
      store,
    });

    if (!result.ok) {
      logAdvancementDiagnostic({
        operation: "api_module1_complete",
        reason: result.reason,
        code: result.error?.code || null,
        message: result.error?.message || "",
        details: result.error?.details || null,
        hint: result.error?.hint || null,
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
        completedModuleNumber: MODULE1_COMPLETED_NUMBER,
      },
      { status: result.ok ? 200 : status }
    );
  } catch (error) {
    logAdvancementDiagnostic({
      operation: "api_module1_complete",
      reason: ADVANCE_REASONS.WRITE_FAILURE,
      code: error?.code || null,
      message: error?.message || "Unexpected server error",
      details: error?.details || null,
      hint: error?.hint || null,
    });
    return NextResponse.json(
      {
        ok: false,
        reason: ADVANCE_REASONS.WRITE_FAILURE,
        error: { message: "Could not save progress." },
      },
      { status: 500 }
    );
  }
}
