/**
 * WP-100 — Least-data teacher student detail (production).
 * Assignment membership required. No default final_text. No fixture runtime path.
 */

import { requireTeacherSession, teacherJson } from "@/lib/teacher/requireTeacherSession";
import { buildTeacherStudentDetailReadModel } from "@/lib/teacher/buildTeacherRosterReadModel";
import { DEFAULT_ASSIGNMENT_NAME } from "@/lib/assignments/identity";

export async function GET(req: Request) {
  const auth = await requireTeacherSession();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  if (searchParams.get("source") === "fixtures") {
    return teacherJson(
      { ok: false, error: "Fixtures are not available on this endpoint" },
      400
    );
  }

  const studentEmail = searchParams.get("email");
  const assignmentName =
    searchParams.get("assignmentName") || DEFAULT_ASSIGNMENT_NAME;

  if (!studentEmail || !studentEmail.includes("@")) {
    return teacherJson(
      { ok: false, error: "Missing or invalid email parameter" },
      400
    );
  }

  try {
    const detail = await buildTeacherStudentDetailReadModel(studentEmail, {
      assignmentName,
    });
    if (!detail.ok) {
      const status = detail.status === 404 ? 404 : 500;
      return teacherJson(
        { ok: false, error: detail.error || "Student detail query failed" },
        status
      );
    }
    return teacherJson(detail, 200);
  } catch (err) {
    console.error(
      "Teacher student detail error:",
      err instanceof Error ? err.message : "failed"
    );
    return teacherJson({ ok: false, error: "Student detail query failed" }, 500);
  }
}
