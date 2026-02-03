import { getStudentAssignment } from "./studentAssignments";

/**
 * Read-only gate: allow access only if student_assignments.current_module >= minModule.
 * No assignment or current_module < minModule → ok false.
 */
export async function requireModuleAccess({
  userEmail,
  assignmentName,
  minModule,
}: {
  userEmail: string;
  assignmentName: string;
  minModule: number;
}): Promise<{ ok: boolean }> {
  const { data, error } = await getStudentAssignment({
    userEmail,
    assignmentName,
  });

  if (error) return { ok: false };

  const current =
    data && typeof data.current_module === "number" ? data.current_module : 0;
  return { ok: current >= minModule };
}
