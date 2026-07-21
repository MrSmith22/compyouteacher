import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  QUIZ_CONTENT_VERSION,
  allQuizItemsAnswered,
  answersMatchQuizAttempt,
  buildQuizPersistencePayload,
  getActiveQuiz,
  normalizeQuizAnswers,
  scoreQuizAnswers,
} from "@/lib/module1/quizHelpers";
import { selectCurrentQuizResult } from "@/lib/module1/module1CompletionReadiness";
import { logAdvancementDiagnostic } from "@/lib/module1/advanceModuleProgression";

const QUIZ_SUBMIT_REASONS = Object.freeze({
  SAVED: "saved",
  ALREADY_SAVED: "already_saved",
  PARTIAL_ANSWERS: "partial_answers",
  WRITE_FAILURE: "write_failure",
  READ_FAILURE: "read_failure",
  UNAUTHORIZED: "unauthorized",
});

/**
 * Insert quiz row; if version columns are missing (migration not applied),
 * fall back to the legacy column set so the app stays compatible.
 */
async function listQuizAttempts(supabase, email) {
  const withVersion = await supabase
    .from("module1_quiz_results")
    .select(
      "id, score, total, answers, quiz_version, submitted_at, created_at"
    )
    .eq("user_email", email);

  if (!withVersion.error) {
    return withVersion;
  }

  const message = String(withVersion.error.message || "");
  const missingVersionColumn =
    /quiz_version|submitted_at/i.test(message) ||
    withVersion.error.code === "PGRST204";

  if (!missingVersionColumn) {
    return withVersion;
  }

  return supabase
    .from("module1_quiz_results")
    .select("id, score, total, answers, created_at")
    .eq("user_email", email);
}

async function insertQuizAttempt(supabase, row) {
  const full = await supabase
    .from("module1_quiz_results")
    .insert({
      user_email: row.user_email,
      score: row.score,
      total: row.total,
      answers: row.answers,
      quiz_version: row.quiz_version,
      submitted_at: row.submitted_at,
    })
    .select("id, user_email, score, total, answers, quiz_version, submitted_at, created_at")
    .maybeSingle();

  if (!full.error) {
    return full;
  }

  const message = String(full.error.message || "");
  const missingVersionColumn =
    /quiz_version|submitted_at/i.test(message) ||
    full.error.code === "PGRST204";

  if (!missingVersionColumn) {
    return full;
  }

  // Pre-migration compatibility: persist core assessment fields only.
  return supabase
    .from("module1_quiz_results")
    .insert({
      user_email: row.user_email,
      score: row.score,
      total: row.total,
      answers: row.answers,
    })
    .select("id, user_email, score, total, answers, created_at")
    .maybeSingle();
}

/**
 * Authenticated Module 1 quiz submission.
 * Email from session only. Score calculated server-side from the answer key.
 * Preserves attempt history; identical Retry after success returns already_saved.
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      {
        ok: false,
        reason: QUIZ_SUBMIT_REASONS.UNAUTHORIZED,
        error: { message: "Not signed in." },
      },
      { status: 401 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        reason: QUIZ_SUBMIT_REASONS.PARTIAL_ANSWERS,
        error: { message: "Invalid JSON body." },
      },
      { status: 400 }
    );
  }

  const answers = normalizeQuizAnswers(body?.answers);
  if (!allQuizItemsAnswered(answers)) {
    return NextResponse.json(
      {
        ok: false,
        reason: QUIZ_SUBMIT_REASONS.PARTIAL_ANSWERS,
        error: { message: "Answer every quiz question before submitting." },
      },
      { status: 400 }
    );
  }

  const quiz = getActiveQuiz();
  const scored = scoreQuizAnswers(answers, quiz);
  // Ignore any client-provided score / percent / total.
  const persistence = buildQuizPersistencePayload({
    userEmail: email,
    answers,
    quiz,
    quizVersion: QUIZ_CONTENT_VERSION,
    clientScore: body?.score ?? body?.correct ?? body?.percent,
  });

  try {
    const supabase = getSupabaseAdmin();
    const existingRes = await listQuizAttempts(supabase, email);

    if (existingRes.error) {
      logAdvancementDiagnostic({
        operation: "api_module1_quiz_submit",
        reason: QUIZ_SUBMIT_REASONS.READ_FAILURE,
        code: existingRes.error.code || null,
        message: existingRes.error.message || "",
      });
      return NextResponse.json(
        {
          ok: false,
          reason: QUIZ_SUBMIT_REASONS.READ_FAILURE,
          error: { message: "Could not read prior quiz attempts." },
        },
        { status: 500 }
      );
    }

    const current = selectCurrentQuizResult(existingRes.data || []);
    if (
      current &&
      answersMatchQuizAttempt(current, answers, QUIZ_CONTENT_VERSION)
    ) {
      const percent = Math.round(
        (Number(current.score) / Number(current.total || scored.total)) * 100
      );
      return NextResponse.json({
        ok: true,
        reason: QUIZ_SUBMIT_REASONS.ALREADY_SAVED,
        deduplicated: true,
        score: current.score,
        total: current.total,
        percent,
        answers: normalizeQuizAnswers(current.answers),
        quizVersion: current.quiz_version ?? QUIZ_CONTENT_VERSION,
        attemptId: current.id ?? null,
        submittedAt: current.submitted_at || current.created_at || null,
      });
    }

    const write = await insertQuizAttempt(supabase, {
      user_email: persistence.user_email,
      score: persistence.score,
      total: persistence.total,
      answers: persistence.answers,
      quiz_version: persistence.quiz_version,
      submitted_at: persistence.submitted_at,
    });

    if (write.error || !write.data) {
      logAdvancementDiagnostic({
        operation: "api_module1_quiz_submit",
        reason: QUIZ_SUBMIT_REASONS.WRITE_FAILURE,
        code: write.error?.code || null,
        message: write.error?.message || "insert returned no row",
        details: write.error?.details || null,
        hint: write.error?.hint || null,
      });
      return NextResponse.json(
        {
          ok: false,
          reason: QUIZ_SUBMIT_REASONS.WRITE_FAILURE,
          error: { message: "Could not save your quiz result." },
        },
        { status: 500 }
      );
    }

    const saved = write.data;
    return NextResponse.json({
      ok: true,
      reason: QUIZ_SUBMIT_REASONS.SAVED,
      deduplicated: false,
      score: saved.score,
      total: saved.total,
      percent: Math.round(
        (Number(saved.score) / Number(saved.total || scored.total)) * 100
      ),
      answers: normalizeQuizAnswers(saved.answers),
      quizVersion: saved.quiz_version ?? QUIZ_CONTENT_VERSION,
      attemptId: saved.id ?? null,
      submittedAt: saved.submitted_at || saved.created_at || null,
    });
  } catch (error) {
    logAdvancementDiagnostic({
      operation: "api_module1_quiz_submit",
      reason: QUIZ_SUBMIT_REASONS.WRITE_FAILURE,
      code: error?.code || null,
      message: error?.message || "Unexpected error",
    });
    return NextResponse.json(
      {
        ok: false,
        reason: QUIZ_SUBMIT_REASONS.WRITE_FAILURE,
        error: { message: "Could not save your quiz result." },
      },
      { status: 500 }
    );
  }
}
