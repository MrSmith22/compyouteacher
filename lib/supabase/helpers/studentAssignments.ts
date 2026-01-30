import { supabase } from "../../supabaseClient";

const DEFAULT_ASSIGNMENT_NAME = "MLK Essay Assignment";
const MAX_MODULE = 10;

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
 * Ensure a student_assignments row exists for the given user and assignment.
 * Never updates existing rows. Only inserts when missing.
 * If insert fails due to unique conflict, re-fetches and returns the existing row.
 */
export async function ensureStudentAssignmentRow({
  userEmail,
  assignmentName,
  startingModule,
}: {
  userEmail: string;
  assignmentName: string;
  startingModule: number;
}) {
  // 1) Check if row already exists
  const { data: existing, error: fetchError } = await getStudentAssignment({
    userEmail,
    assignmentName,
  });

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  if (existing) {
    return { data: existing, error: null };
  }

  // 2) No row exists, attempt to insert
  const now = new Date().toISOString();
  const clampedModule = Math.min(Math.max(1, startingModule), MAX_MODULE);

  const { data: inserted, error: insertError } = await supabase
    .from("student_assignments")
    .insert({
      user_email: userEmail,
      assignment_name: assignmentName,
      current_module: clampedModule,
      status: "in_progress",
      started_at: now,
      updated_at: now,
    })
    .select()
    .maybeSingle();

  // 3) If insert succeeded, return the inserted row
  if (!insertError) {
    return { data: inserted, error: null };
  }

  // 4) If insert failed due to conflict, re-fetch the existing row
  // Supabase error codes: 23505 is unique_violation (duplicate key)
  // We'll handle any insert error by re-fetching to be safe
  const { data: refetched, error: refetchError } = await getStudentAssignment({
    userEmail,
    assignmentName,
  });

  if (refetchError || !refetched) {
    // If we still can't get the row, return the original insert error
    return { data: null, error: insertError };
  }

  return { data: refetched, error: null };
}

/**
 * Upsert resume path and module progress
 * Progress must never regress, so current_module is clamped forward.
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

  // Clamp incoming module into valid range first
  const incoming =
    typeof currentModule === "number" && Number.isFinite(currentModule)
      ? currentModule
      : 1;

  const incomingClamped = Math.min(Math.max(1, incoming), MAX_MODULE);

  // Fetch existing row so we can prevent regressions
  const { data: existing, error: existingError } = await getStudentAssignment({
    userEmail,
    assignmentName,
  });

  // If we cannot read existing state, keep legacy behavior (write incomingClamped)
  // so callers do not break on unexpected read failures.
  const existingCurrent =
    !existingError && existing && typeof existing.current_module === "number"
      ? existing.current_module
      : null;

  const nextModule =
    typeof existingCurrent === "number"
      ? Math.min(Math.max(existingCurrent, incomingClamped), MAX_MODULE)
      : incomingClamped;

  // Keep the return shape identical: return the Supabase upsert result
  return supabase
  .from("student_assignments")
  .upsert(
    {
      user_email: userEmail,
      assignment_name: assignmentName,
      resume_path: resumePath,
      current_module: nextModule,
      status: "in_progress",
      updated_at: now,
    },
    { onConflict: "user_email,assignment_name" }
  );
}

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