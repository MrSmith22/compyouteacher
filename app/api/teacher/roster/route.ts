/**
 * WP-100 — Teacher roster read-model API (production).
 * Teacher-only, assignment-scoped, roster fields only. No fixture runtime path.
 */

import { requireTeacherSession, teacherJson } from "@/lib/teacher/requireTeacherSession";
import { buildTeacherRosterReadModel } from "@/lib/teacher/buildTeacherRosterReadModel";
import { DEFAULT_ASSIGNMENT_NAME, MLK_ASSIGNMENT_ID } from "@/lib/assignments/identity";

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

  const assignmentId = searchParams.get("assignmentId") || MLK_ASSIGNMENT_ID;
  const assignmentName =
    searchParams.get("assignmentName") || DEFAULT_ASSIGNMENT_NAME;

  try {
    const model = await buildTeacherRosterReadModel({
      assignmentId,
      assignmentName,
    });
    if (!model.ok) {
      return teacherJson(
        { ok: false, error: model.error || "Roster query failed" },
        500
      );
    }
    return teacherJson(model, 200);
  } catch (err) {
    console.error("Teacher roster error:", err instanceof Error ? err.message : "failed");
    return teacherJson({ ok: false, error: "Roster query failed" }, 500);
  }
}
