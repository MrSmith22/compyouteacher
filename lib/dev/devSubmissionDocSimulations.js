/**
 * Dev-only one-shot submission Doc verification simulations (in-memory).
 * Used by the Developer Testing Panel for WP-030 Scenario D.
 * Never persists; never logs essay text or emails.
 */

const temporaryVerifyFailures = new Map();

/**
 * Arm a one-shot temporary verification failure for the signed-in student.
 * The next verify-submission-doc call for this email consumes the flag.
 */
export function armTemporaryVerificationFailure(userEmail) {
  const key = normalizeEmail(userEmail);
  if (!key) return { ok: false, error: "missing_email" };
  temporaryVerifyFailures.set(key, {
    armedAt: Date.now(),
    reason: "simulated_temporary_verification_failure",
  });
  return { ok: true, simulation: "temporary_verification_failure" };
}

/**
 * Consume a one-shot temporary verification failure flag.
 * @returns {null | { reason: string }}
 */
export function consumeTemporaryVerificationFailure(userEmail) {
  const key = normalizeEmail(userEmail);
  if (!key) return null;
  if (!temporaryVerifyFailures.has(key)) return null;
  const payload = temporaryVerifyFailures.get(key);
  temporaryVerifyFailures.delete(key);
  return payload || { reason: "simulated_temporary_verification_failure" };
}

export function clearTemporaryVerificationFailure(userEmail) {
  const key = normalizeEmail(userEmail);
  if (!key) return;
  temporaryVerifyFailures.delete(key);
}

function normalizeEmail(userEmail) {
  if (typeof userEmail !== "string") return null;
  const email = userEmail.trim().toLowerCase();
  return email || null;
}
