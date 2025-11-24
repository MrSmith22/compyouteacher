// lib/logActivity.js
import { supabase } from "./supabaseClient";

/**
 * Log a student action into student_activity_log.
 *
 * @param {string} userEmail - student's email
 * @param {string} action - e.g. "module_started", "quiz_submitted"
 * @param {object} [metadata] - any extra info (module, etc.)
 */
export async function logActivity(userEmail, action, metadata = {}) {
  if (!userEmail || !action) {
    console.warn("[logActivity] Missing userEmail or action", {
      userEmail,
      action,
    });
    return;
  }

  try {
    const { error } = await supabase.from("student_activity_log").insert({
      user_email: userEmail,
      action,
      module:
        typeof metadata.module === "number" ? metadata.module : null,
      metadata,
    });

    if (error) {
      console.error("[logActivity] insert error", error);
    }
  } catch (err) {
    console.error("[logActivity] unexpected error", err);
  }
}