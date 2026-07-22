/**
 * WP-094 — Presentation-only development gate for the success-screen family
 * and completed-dashboard foundation (Phase 6).
 *
 * Does not alter completion writes, receipt authority, PDF validation,
 * progression, or any instructional rollout mode.
 */

/**
 * @returns {boolean}
 */
export function isSuccessExperienceFoundationEnabled() {
  return process.env.NODE_ENV === "development";
}
