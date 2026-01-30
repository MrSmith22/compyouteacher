import { supabase } from "../../supabaseClient";

/**
 * Fetch a student's assignment record
 */
export async function getStudentAssignment({
  userEmail,
  assignmentName,
}: {
  userEmail: string;
  assignmentName: string;
}) {
  return supabase
    .from("student_assignments")
    .select("*")
    .eq("user_email", userEmail)
    .eq("assignment_name", assignmentName)
    .maybeSingle();
}

/**
 * Upsert resume path and module progress
 */
export async function upsertResumePath({
  userEmail,
  assignmentName,
  resumePath,
  currentModule,
}: {
  userEmail: string;
  assignmentName: string;
  resumePath: string;
  currentModule: number;
}) {
  const now = new Date().toISOString();

  return supabase.from("student_assignments").upsert({
    user_email: userEmail,
    assignment_name: assignmentName,
    resume_path: resumePath,
    current_module: currentModule,
    status: "in_progress",
    updated_at: now,
  });
}

const DEFAULT_ASSIGNMENT_NAME = "MLK Essay Assignment";
const MAX_MODULE = 10;

/**
 * Advance student_assignments.current_module to at least (completedModuleNumber + 1)
 * when the assignment exists and status is in_progress. Never regress (e.g. revisiting an old success page).
 */
export async function advanceCurrentModuleOnSuccess({
  userEmail,
  assignmentName = DEFAULT_ASSIGNMENT_NAME,
  completedModuleNumber,
}: {
  userEmail: string;
  assignmentName?: string;
  completedModuleNumber: number;
}) {
  const { data, error } = await getStudentAssignment({
    userEmail,
    assignmentName,
  });
  if (error || !data) return;
  if (data.status !== "in_progress") return;

  const current =
    typeof data.current_module === "number" ? data.current_module : 1;
  const nextModule = Math.min(
    Math.max(current, completedModuleNumber + 1),
    MAX_MODULE
  );
  if (nextModule <= current) return;

  const now = new Date().toISOString();
  return supabase
    .from("student_assignments")
    .upsert(
      {
        user_email: userEmail,
        assignment_name: assignmentName,
        current_module: nextModule,
        status: "in_progress",
        updated_at: now,
      },
      { onConflict: "user_email,assignment_name" }
    );
}
