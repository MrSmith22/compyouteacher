/**
 * WP-099 — Least-data teacher student detail (foundation path).
 * Omits default full final_text. Doc/PDF URLs only in authorized detail.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isTeacherProgressVisibilityFoundationEnabled } from "@/lib/dev/isTeacherProgressVisibilityFoundationEnabled";
import { buildTeacherStudentDetailReadModel } from "@/lib/teacher/buildTeacherRosterReadModel";
import { WP099_SYNTHETIC_STUDENT_INPUTS } from "@/lib/teacher/teacherProgressFixtures.js";
import { DEFAULT_ASSIGNMENT_NAME } from "@/lib/assignments/identity";
import { projectTeacherStudentProgress } from "@/lib/teacher/teacherProgressProjection.js";

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
  const studentEmail = searchParams.get("email");
  const studentId = searchParams.get("studentId");
  const useFixtures = searchParams.get("source") === "fixtures";
  const assignmentName =
    searchParams.get("assignmentName") || DEFAULT_ASSIGNMENT_NAME;

  if (useFixtures) {
    const key = studentId || studentEmail;
    if (!key) {
      return NextResponse.json(
        { ok: false, error: "Missing studentId or email" },
        { status: 400 }
      );
    }
    const input = WP099_SYNTHETIC_STUDENT_INPUTS.find(
      (s: { studentId: string; email?: string | null }) =>
        s.studentId === key || s.email === key
    );
    if (!input) {
      return NextResponse.json(
        { ok: false, error: "Student not found" },
        { status: 404 }
      );
    }
    const progress = projectTeacherStudentProgress(input);
    return NextResponse.json({
      ok: true,
      student: {
        email: input.email,
        progress,
        googleDoc: input.artifacts?.hasGoogleDoc
          ? {
              url: "https://docs.google.com/document/d/wp099-fixture/edit",
              createdAt: input.latestUpdateAt,
            }
          : null,
        finalPdf: input.receipt?.storagePath
          ? {
              url: "/api/dev/fixture-pdf-not-real",
              fileName: input.receipt.fileName || "final.pdf",
              fileSize: input.receipt.byteSize ?? null,
              uploadedAt: input.receipt.submittedAt || null,
              createdAt: input.receipt.submittedAt || null,
              gradingStatus: "ungraded",
            }
          : null,
        module8: {
          finalReady: Boolean(input.artifacts?.finalReady),
          updatedAt: input.latestUpdateAt,
        },
        note: "",
        historicalRecords: {
          label: "Historical records",
          quiz: input.historical?.hasQuizRecord
            ? { score: 8, total: 10, percent: 80, submittedAt: input.latestUpdateAt }
            : null,
          checklist: input.historical?.hasChecklistRecord
            ? { complete: true, updatedAt: input.latestUpdateAt }
            : null,
        },
      },
    });
  }

  if (!studentEmail || !studentEmail.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid email parameter" },
      { status: 400 }
    );
  }

  try {
    const detail = await buildTeacherStudentDetailReadModel(studentEmail, {
      assignmentName,
    });
    return NextResponse.json(detail, { status: 200 });
  } catch (err) {
    console.error("Teacher student detail error:", err);
    return NextResponse.json(
      { ok: false, error: "Student detail query failed" },
      { status: 500 }
    );
  }
}
