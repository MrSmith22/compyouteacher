import { getSupabaseAdmin } from "@/lib/supabase/admin";

function observationsDb() {
  return getSupabaseAdmin();
}

export type StudentObservationRow = {
  id: string;
  user_email: string;
  assignment_id: string;
  source_id: string | null;
  source_title: string | null;
  source_type: string | null;
  quote: string | null;
  student_observation: string | null;
  rhetorical_strategy: string | null;
  audience_effect: string | null;
  purpose_connection: string | null;
  essential_question_connection: string | null;
  observation_stage: string | null;
  teacher_guided: boolean | null;
  used_in_thesis: boolean | null;
  used_in_paragraph: boolean | null;
  created_at: string;
  updated_at: string;
};

/** Fields required to insert a new observation row. */
export type StudentObservationInsert = {
  user_email: string;
  assignment_id: string;
  source_id?: string | null;
  source_title?: string | null;
  source_type?: string | null;
  quote?: string | null;
  student_observation?: string | null;
  rhetorical_strategy?: string | null;
  audience_effect?: string | null;
  purpose_connection?: string | null;
  essential_question_connection?: string | null;
  observation_stage?: string | null;
  teacher_guided?: boolean | null;
  used_in_thesis?: boolean | null;
  used_in_paragraph?: boolean | null;
};

export type StudentObservationUpdate = Partial<
  Omit<
    StudentObservationRow,
    "id" | "user_email" | "assignment_id" | "created_at" | "updated_at"
  >
>;

function rowFromInsert(observation: StudentObservationInsert) {
  return {
    user_email: observation.user_email,
    assignment_id: observation.assignment_id,
    source_id: observation.source_id ?? null,
    source_title: observation.source_title ?? null,
    source_type: observation.source_type ?? null,
    quote: observation.quote ?? "",
    student_observation: observation.student_observation ?? "",
    rhetorical_strategy: observation.rhetorical_strategy ?? null,
    audience_effect: observation.audience_effect ?? null,
    purpose_connection: observation.purpose_connection ?? null,
    essential_question_connection:
      observation.essential_question_connection ?? null,
    observation_stage: observation.observation_stage ?? null,
    teacher_guided: observation.teacher_guided ?? false,
    used_in_thesis: observation.used_in_thesis ?? false,
    used_in_paragraph: observation.used_in_paragraph ?? false,
  };
}

export async function getStudentObservations({
  userEmail,
  assignmentId,
}: {
  userEmail: string;
  assignmentId: string;
}) {
  return observationsDb()
    .from("student_observations")
    .select("*")
    .eq("user_email", userEmail)
    .eq("assignment_id", assignmentId)
    .order("created_at", { ascending: true });
}

export async function getStudentObservationBySourceId({
  userEmail,
  assignmentId,
  sourceId,
}: {
  userEmail: string;
  assignmentId: string;
  sourceId: string;
}) {
  return observationsDb()
    .from("student_observations")
    .select("*")
    .eq("user_email", userEmail)
    .eq("assignment_id", assignmentId)
    .eq("source_id", sourceId)
    .maybeSingle();
}

export async function saveStudentObservation(
  observation: StudentObservationInsert
) {
  const now = new Date().toISOString();

  return observationsDb()
    .from("student_observations")
    .insert({
      ...rowFromInsert(observation),
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
}

export async function updateStudentObservation(
  id: string,
  updates: StudentObservationUpdate
) {
  return observationsDb()
    .from("student_observations")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
}

export async function deleteStudentObservation(id: string) {
  return observationsDb().from("student_observations").delete().eq("id", id);
}
