/**
 * Assignment progress store adapters for forward-only CAS advancement.
 */

import { CANONICAL_ACTIVE_ASSIGNMENT_STATUS } from "@/lib/assignments/assignmentActivityStatus";

/**
 * Build a compare-and-set store against a Supabase client (anon or service role).
 */
export function createSupabaseAssignmentProgressStore({
  supabase,
  userEmail,
  assignmentName,
}) {
  return {
    async read() {
      return supabase
        .from("student_assignments")
        .select("*")
        .eq("user_email", userEmail)
        .eq("assignment_name", assignmentName)
        .maybeSingle();
    },

    async compareAndSet({
      expectedModule,
      expectedStatus,
      nextModule,
      nextStatus = CANONICAL_ACTIVE_ASSIGNMENT_STATUS,
    }) {
      const now = new Date().toISOString();

      let query = supabase
        .from("student_assignments")
        .update({
          current_module: nextModule,
          updated_at: now,
          // Normalize legacy active spellings to the canonical value on success.
          status: nextStatus || CANONICAL_ACTIVE_ASSIGNMENT_STATUS,
        })
        .eq("user_email", userEmail)
        .eq("assignment_name", assignmentName)
        .eq("current_module", expectedModule);

      if (expectedStatus == null || expectedStatus === "") {
        query = query.is("status", null);
      } else {
        query = query.eq("status", expectedStatus);
      }

      const result = await query.select("*").maybeSingle();

      if (result.error) {
        return { updated: false, data: null, error: result.error };
      }
      if (!result.data) {
        return { updated: false, data: null, error: null };
      }
      return { updated: true, data: result.data, error: null };
    },
  };
}
