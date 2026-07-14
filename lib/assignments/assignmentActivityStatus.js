/**
 * Canonical student_assignments.status activity rules.
 * Shared by creation, completion CAS, seeds/resets, and tests.
 *
 * Historical writers used both "in_progress" and "in progress";
 * some legacy rows are null / not_started while still active.
 */

export const ASSIGNMENT_STATUS = Object.freeze({
  IN_PROGRESS: "in_progress",
  IN_PROGRESS_LEGACY: "in progress",
  NOT_STARTED: "not_started",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
});

/** Canonical value written for newly active / normalized rows. */
export const CANONICAL_ACTIVE_ASSIGNMENT_STATUS =
  ASSIGNMENT_STATUS.IN_PROGRESS;

const INACTIVE_NORMALIZED = new Set([
  "completed",
  "abandoned",
  "inactive",
  "archived",
  "done",
]);

/**
 * Normalize spacing/case so "In Progress" and "in_progress" compare equally.
 */
export function normalizeAssignmentStatus(status) {
  if (status == null) return null;
  const raw = String(status).trim();
  if (!raw) return null;
  return raw.toLowerCase().replace(/[\s-]+/g, "_");
}

/**
 * True when the assignment is still an active student attempt.
 * Null / missing / not_started / in_progress (any legacy spelling) are active.
 * Only known completed/abandoned/inactive values are protected from advancement.
 */
export function isAssignmentStatusActive(status) {
  const normalized = normalizeAssignmentStatus(status);
  if (normalized == null) return true;
  if (INACTIVE_NORMALIZED.has(normalized)) return false;
  return true;
}

/**
 * True when status is a known inactive terminal state.
 */
export function isAssignmentStatusInactive(status) {
  return !isAssignmentStatusActive(status);
}

/**
 * Values that may appear on legitimate active rows (for docs/tests).
 */
export function listKnownActiveAssignmentStatuses() {
  return [
    null,
    "",
    ASSIGNMENT_STATUS.NOT_STARTED,
    ASSIGNMENT_STATUS.IN_PROGRESS,
    ASSIGNMENT_STATUS.IN_PROGRESS_LEGACY,
  ];
}
