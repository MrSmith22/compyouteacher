/**
 * WP-099 — Development-only gate for teacher progress visibility foundation.
 * Presentation / read-path only. Production keeps the legacy TeacherDashboard.
 */

/**
 * @returns {boolean}
 */
export function isTeacherProgressVisibilityFoundationEnabled() {
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.TEACHER_PROGRESS_VISIBILITY_FOUNDATION === "off") return false;
  if (process.env.NEXT_PUBLIC_TEACHER_PROGRESS_VISIBILITY_FOUNDATION === "off") {
    return false;
  }
  return true;
}
