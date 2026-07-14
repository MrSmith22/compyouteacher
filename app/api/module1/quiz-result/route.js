import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { selectCurrentQuizResult } from "@/lib/module1/module1CompletionReadiness";
import { normalizeQuizAnswers } from "@/lib/module1/quizHelpers";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    let { data, error } = await supabase
      .from("module1_quiz_results")
      .select(
        "id, score, total, answers, quiz_version, submitted_at, created_at"
      )
      .eq("user_email", email);

    if (error) {
      const message = String(error.message || "");
      if (/quiz_version|submitted_at/i.test(message) || error.code === "PGRST204") {
        const fallback = await supabase
          .from("module1_quiz_results")
          .select("id, score, total, answers, created_at")
          .eq("user_email", email);
        data = fallback.data;
        error = fallback.error;
      }
    }

    if (error) {
      console.error("module1_quiz_result GET error:", error);
      return NextResponse.json(
        { error: "Could not load quiz result" },
        { status: 500 }
      );
    }

    const current = selectCurrentQuizResult(data || []);
    if (!current || current.total == null || current.total === 0) {
      return NextResponse.json({
        score: null,
        total: null,
        percent: null,
        answers: null,
        quizVersion: null,
        attemptId: null,
        submittedAt: null,
      });
    }

    const percent = Math.round(
      (Number(current.score) / Number(current.total)) * 100
    );
    return NextResponse.json({
      score: current.score,
      total: current.total,
      percent,
      answers: normalizeQuizAnswers(current.answers),
      quizVersion: current.quiz_version ?? null,
      attemptId: current.id ?? null,
      submittedAt: current.submitted_at || current.created_at || null,
    });
  } catch (err) {
    console.error("module1_quiz_result GET error:", err);
    return NextResponse.json(
      { error: "Could not load quiz result" },
      { status: 500 }
    );
  }
}
