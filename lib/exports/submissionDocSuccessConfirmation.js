/**
 * WP-032 — Pure helpers for verified submission-doc success confirmation.
 * No essay bodies; uses export operation + verification metadata only.
 */

export const SUBMISSION_DOC_READY_FOR_FORMATTING = "Ready for formatting";

/**
 * Operation-appropriate student success statement after verified Create/Update.
 * @param {"created"|"updated"|"replacement_created"|string|null|undefined} operation
 */
export function getVerifiedExportSuccessStatement(operation) {
  if (operation === "created") {
    return "Your submission document has been created successfully";
  }
  if (operation === "replacement_created") {
    return "Your new submission document has been created successfully";
  }
  // updated and unknown verified writes
  return "Your submission document has been updated successfully";
}

/**
 * Build rich confirmation only when content verification succeeded.
 * Word count comes from verified expectedWordCount (essay exported).
 *
 * @param {{
 *   operation?: string|null,
 *   verification?: {
 *     verified?: boolean,
 *     expectedWordCount?: number|null,
 *   }|null,
 *   completedAt?: string|null,
 * }} args
 * @returns {null|{
 *   statement: string,
 *   completedAt: string,
 *   wordCount: number,
 *   statusLabel: string,
 * }}
 */
export function buildSubmissionDocSuccessConfirmation({
  operation = null,
  verification = null,
  completedAt = null,
} = {}) {
  if (!verification?.verified) return null;
  if (typeof completedAt !== "string" || !completedAt.trim()) return null;

  const wordCount = verification.expectedWordCount;
  if (typeof wordCount !== "number" || !Number.isFinite(wordCount) || wordCount < 0) {
    return null;
  }

  return {
    statement: getVerifiedExportSuccessStatement(operation),
    completedAt: completedAt.trim(),
    wordCount,
    statusLabel: SUBMISSION_DOC_READY_FOR_FORMATTING,
  };
}

/**
 * Format an ISO completion time for display in the student's locale.
 * @param {string|null|undefined} iso
 * @param {string|string[]|undefined} locale
 * @param {Date|undefined} now unused; kept for test injection stability
 */
export function formatSubmissionDocCompletedAt(iso, locale) {
  if (typeof iso !== "string" || !iso.trim()) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(locale || undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    try {
      return date.toLocaleString();
    } catch {
      return iso;
    }
  }
}
