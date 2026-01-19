// lib/logActivity.js
import { logStudentActivity } from "@/lib/supabase/helpers/studentActivity";

/**
 * Log a student action into student_activity_log.
 *
 * Flexible usage:
 *   logActivity(email, "login")
 *   logActivity(email, "module_started", 1)
 *   logActivity(email, "quiz_submitted", 1, { quiz: "rhetoric_module1", percent: 90 })
 *   logActivity(email, "note", { foo: "bar" })
 *
 * @param {string} userEmail - student's email
 * @param {string} action - e.g. "module_started", "quiz_submitted"
 * @param {number|object|null} moduleOrMetadata - module number OR metadata object
 * @param {object|null} [maybeMetadata] - extra metadata when third arg is module number
 */
export async function logActivity(
  userEmail,
  action,
  moduleOrMetadata = null,
  maybeMetadata = null
) {
  if (!userEmail || !action) {
    console.warn("[logActivity] Missing userEmail or action", {
      userEmail,
      action,
    });
    return;
  }

  let module = null;
  let metadata = null;

  // Case 1: logActivity(email, action, 1, { ... })
  if (typeof moduleOrMetadata === "number") {
    module = moduleOrMetadata;
    metadata =
      maybeMetadata && typeof maybeMetadata === "object"
        ? maybeMetadata
        : null;
  }
  // Case 2: logActivity(email, action, { ... })
  else if (moduleOrMetadata && typeof moduleOrMetadata === "object") {
    metadata = moduleOrMetadata;
    if (typeof moduleOrMetadata.module === "number") {
      module = moduleOrMetadata.module;
    }
  }
  // Case 3: logActivity(email, action) → no module, no metadata
  // leave module = null, metadata = null

  try {
    const { error } = await logStudentActivity({
      userEmail,
      eventType: action,
      module,
      meta: metadata,
    });

    if (error) {
      console.error("[logActivity] insert error", error);
    } else {
      console.log("[logActivity] logged", { userEmail, action, module, metadata });
    }
  } catch (err) {
    console.error("[logActivity] unexpected error", err);
  }
}