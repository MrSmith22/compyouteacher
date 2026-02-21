import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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

  const [assignmentsRes, draftsRes, exportsRes, quizRes] = await Promise.all([
    supabase.from("student_assignments").select("user_email, current_module"),
    supabase.from("student_drafts").select("user_email, final_ready").eq("module", 8),
    supabase
      .from("student_exports")
      .select("user_email")
      .eq("module", 9)
      .eq("kind", "final_pdf"),
    supabase
      .from("module9_quiz")
      .select("user_email, score, total, submitted_at")
      .then((r) => (r.error ? { data: [], error: r.error } : r)),
  ]);

  const err = assignmentsRes.error || draftsRes.error || exportsRes.error;
  if (err) {
    console.error("Overview query error:", err);
    return NextResponse.json({ ok: false, error: "Overview query failed" }, { status: 500 });
  }
  if (quizRes.error) {
    console.warn("Overview: module9_quiz query failed (table may be missing):", quizRes.error);
  }

  const assignments = assignmentsRes.data ?? [];
  const drafts8 = draftsRes.data ?? [];
  const exports9 = exportsRes.data ?? [];
  const quizzes9 = quizRes.data ?? [];

  const result = assignments
    .map((a) => {
      const draft = drafts8.find((d) => d.user_email === a.user_email);
      const exportRow = exports9.find((e) => e.user_email === a.user_email);
      const quiz = quizzes9.find((q) => q.user_email === a.user_email);
      const score = quiz?.score != null ? Number(quiz.score) : null;
      const total = quiz?.total != null ? Number(quiz.total) : null;
      const percent =
        total != null && total > 0 && score != null
          ? Math.round((score / total) * 100)
          : null;
      return {
        user_email: a.user_email,
        current_module: a.current_module ?? 0,
        final_ready: !!(draft?.final_ready),
        has_final_pdf: !!exportRow,
        quiz_completed: !!quiz,
        quiz_score: score,
        quiz_total: total,
        quiz_percent: percent,
        quiz_submitted_at: quiz?.submitted_at ?? null,
      };
    })
    .sort((a, b) => {
      const modA = Number(a.current_module) ?? 0;
      const modB = Number(b.current_module) ?? 0;
      if (modA !== modB) return modA - modB;
      return (a.user_email ?? "").localeCompare(b.user_email ?? "");
    });

  return NextResponse.json(result, { status: 200 });
}
