// lib/supabase/helpers/studentActivity.ts
import { supabase } from "@/lib/supabaseClient";

export type StudentActivityEvent = {
  userEmail: string;
  eventType: string;
  module?: number | null;
  meta?: Record<string, unknown> | null;
};

export async function logStudentActivity(event: StudentActivityEvent) {
  return supabase.from("student_activity_log").insert({
    user_email: event.userEmail,
    action: event.eventType,
    module: event.module ?? null,
    metadata: event.meta ?? null,
  });
}