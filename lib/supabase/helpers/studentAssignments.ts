import { supabase } from "../supabaseClient";

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