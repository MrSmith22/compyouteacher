import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const studentEmail = searchParams.get("email");
  if (!studentEmail || !studentEmail.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid email parameter" },
      { status: 400 }
    );
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

  const [draftRes, pdfRes, docRes, quizRes, checklistRes] = await Promise.all([
    supabase
      .from("student_drafts")
      .select("final_ready, final_text, updated_at")
      .eq("user_email", studentEmail)
      .eq("module", 8)
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("student_exports")
      .select("*")
      .eq("user_email", studentEmail)
      .eq("module", 9)
      .eq("kind", "final_pdf")
      .order("uploaded_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("exported_docs")
      .select("web_view_link, created_at")
      .eq("user_email", studentEmail)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("module9_quiz")
      .select("score, total, submitted_at")
      .eq("user_email", studentEmail)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .then((r) => (r.error ? { data: null, error: r.error } : r)),
    supabase
      .from("module9_checklist")
      .select("items, complete, updated_at")
      .eq("user_email", studentEmail)
      .order("updated_at", { ascending: false })
      .limit(1)
      .then((r) => (r.error ? { data: null, error: r.error } : r)),
  ]);

  const err = draftRes.error || pdfRes.error || docRes.error;
  if (err) {
    console.error("Student detail query error:", err);
    return NextResponse.json(
      { ok: false, error: "Student detail query failed" },
      { status: 500 }
    );
  }

  if (quizRes.error) {
    console.warn("Student detail: module9_quiz query failed:", quizRes.error);
  }
  if (checklistRes.error) {
    console.warn("Student detail: module9_checklist query failed:", checklistRes.error);
  }

  const draft = draftRes.data?.[0] ?? null;
  const pdf = pdfRes.data?.[0] ?? null;
  const doc = docRes.data?.[0] ?? null;
  const quizRow = quizRes.data?.[0] ?? null;

  const pdfUrl = pdf
    ? (pdf.web_view_link || pdf.public_url) || null
    : null;
  const pdfUploadedAt = pdf?.uploaded_at ?? null;
  const pdfCreatedAt = pdf?.created_at ?? null;
  const pdfFileName = pdf?.file_name ?? null;
  const pdfFileSize =
    pdf?.file_size != null && !Number.isNaN(Number(pdf.file_size))
      ? Number(pdf.file_size)
      : null;

  const docUrl = doc?.web_view_link || null;
  const docCreatedAt = doc?.created_at ?? null;

  const quizScore = quizRow?.score != null ? Number(quizRow.score) : null;
  const quizTotal = quizRow?.total != null ? Number(quizRow.total) : null;
  const quizPercent =
    quizTotal != null && quizTotal > 0 && quizScore != null
      ? Math.round((quizScore / quizTotal) * 100)
      : null;
  const quiz = quizRow
    ? {
        score: quizScore,
        total: quizTotal,
        percent: quizPercent,
        submitted_at: quizRow.submitted_at ?? null,
      }
    : null;

  const checklistRow = checklistRes.error ? null : (checklistRes.data?.[0] ?? null);
  const checklist = checklistRow
    ? {
        complete: !!checklistRow.complete,
        updated_at: checklistRow.updated_at ?? null,
      }
    : null;

  const payload = {
    user_email: studentEmail,
    module8: draft
      ? {
          final_ready: !!draft.final_ready,
          final_text: draft.final_text ?? null,
          updated_at: draft.updated_at ?? null,
        }
      : null,
    final_pdf: pdfUrl
      ? {
          url: pdfUrl,
          created_at: pdfCreatedAt,
          uploaded_at: pdfUploadedAt,
          file_name: pdfFileName,
          file_size: pdfFileSize,
        }
      : null,
    google_doc: docUrl
      ? { url: docUrl, created_at: docCreatedAt }
      : null,
    quiz,
    checklist,
  };

  return NextResponse.json(payload, { status: 200 });
}
