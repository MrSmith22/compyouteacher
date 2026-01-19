// lib/supabase/helpers/studentActivity.ts
import { supabase } from "@/lib/supabaseClient";

export type StudentActivityEvent = {
  userEmail: string;
  eventType: string;
  module?: number | null;
  meta?: Record<string, any> | null;
};

export async function logStudentActivity(event: StudentActivityEvent) {
  const now = new Date().toISOString();

  return supabase.from("student_activity_log").insert({
    user_email: event.userEmail,
    event_type: event.eventType,
    module: event.module ?? null,
    meta: event.meta ?? null,
    created_at: now,
  });
}