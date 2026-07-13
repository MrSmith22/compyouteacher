/**
 * Development-only Google Doc editor override policy (server-side).
 * Grants an additional writer when a real Google account must edit
 * docs created for the localhost development student.
 *
 * Never import this from client components.
 */

const LOCALHOST_EMAIL = /@localhost$/i;
const BASIC_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {unknown} raw
 * @returns {string | null} lowercased email, or null if invalid/local
 */
export function sanitizeGoogleEditorEmail(raw) {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (!email) return null;
  if (LOCALHOST_EMAIL.test(email)) return null;
  if (!BASIC_EMAIL.test(email)) return null;
  return email;
}

/**
 * @param {{ nodeEnv?: string | null, devAuthEnabled?: boolean | string | null }} params
 */
export function isDevRuntimeEligible({
  nodeEnv = "",
  devAuthEnabled = false,
} = {}) {
  const env = String(nodeEnv || "");
  if (env === "development" || env === "test") return true;
  return devAuthEnabled === true || devAuthEnabled === "true";
}

/**
 * True for the local/dev student identity used by DEV_AUTH flows.
 * @param {unknown} studentEmail
 */
export function isDevStudentTestingFlow(studentEmail) {
  if (typeof studentEmail !== "string") return false;
  const email = studentEmail.trim().toLowerCase();
  if (!email) return false;
  return LOCALHOST_EMAIL.test(email);
}

/**
 * @param {{
 *   studentEmail?: string | null,
 *   editorEmail?: string | null,
 *   nodeEnv?: string | null,
 *   devAuthEnabled?: boolean | string | null,
 * }} params
 */
export function resolveDevGoogleDocEditorOverride({
  studentEmail = "",
  editorEmail = "",
  nodeEnv = "",
  devAuthEnabled = false,
} = {}) {
  if (!isDevRuntimeEligible({ nodeEnv, devAuthEnabled })) {
    return { eligible: false, editorEmail: null, reason: "not_dev_runtime" };
  }
  if (!isDevStudentTestingFlow(studentEmail)) {
    return { eligible: false, editorEmail: null, reason: "not_dev_student" };
  }
  const sanitized = sanitizeGoogleEditorEmail(editorEmail);
  if (!sanitized) {
    if (!String(editorEmail || "").trim()) {
      return { eligible: false, editorEmail: null, reason: "missing" };
    }
    return { eligible: false, editorEmail: null, reason: "invalid" };
  }
  return { eligible: true, editorEmail: sanitized, reason: null };
}

/**
 * Ordered writer recipients for Drive permissions.create.
 * Always includes a real grantable student email when present (production).
 * Skips @localhost / non-Google testing identities — Drive can hang or stall
 * indefinitely when asked to share with an unresolvable address.
 * Adds the override once when eligible and not a duplicate.
 *
 * @param {{
 *   studentEmail?: string | null,
 *   editorEmail?: string | null,
 *   nodeEnv?: string | null,
 *   devAuthEnabled?: boolean | string | null,
 * }} params
 */
export function resolveWriterRecipientEmails({
  studentEmail = "",
  editorEmail = "",
  nodeEnv = "",
  devAuthEnabled = false,
} = {}) {
  const student =
    typeof studentEmail === "string" ? studentEmail.trim() : "";
  const override = resolveDevGoogleDocEditorOverride({
    studentEmail: student,
    editorEmail,
    nodeEnv,
    devAuthEnabled,
  });

  const writers = [];
  if (student && isGrantableGoogleWriterEmail(student)) {
    writers.push(student);
  }
  if (override.eligible && override.editorEmail) {
    const already = writers.some(
      (w) => w.toLowerCase() === override.editorEmail
    );
    if (!already) {
      writers.push(override.editorEmail);
    }
  }

  return { writers, override };
}

/**
 * Drive user-writer grants require a real Google account email.
 * Local/dev student identities (@localhost) must not be sent to permissions.create.
 */
export function isGrantableGoogleWriterEmail(email) {
  if (typeof email !== "string") return false;
  const value = email.trim().toLowerCase();
  if (!value) return false;
  if (LOCALHOST_EMAIL.test(value)) return false;
  if (!BASIC_EMAIL.test(value)) return false;
  if (/@(test|invalid)$/i.test(value)) return false;
  return true;
}

function isPermissionAlreadyExists(err) {
  const status = err?.code || err?.status || err?.response?.status;
  if (status === 400 || status === "400") {
    const message = String(err?.message || err || "").toLowerCase();
    return (
      message.includes("already") ||
      message.includes("duplicate") ||
      message.includes("permission")
    );
  }
  return false;
}

/**
 * Grant writer (+ public reader) permissions for a submission Doc.
 * Does not log email addresses.
 *
 * @param {{
 *   documentId: string,
 *   studentEmail: string,
 *   createPermission: (body: {
 *     type: string,
 *     role: string,
 *     emailAddress?: string,
 *   }) => Promise<void>,
 *   env?: {
 *     DEV_GOOGLE_DOC_EDITOR_EMAIL?: string,
 *     NODE_ENV?: string,
 *     DEV_AUTH_ENABLED?: string,
 *   },
 * }} params
 */
export async function grantSubmissionDocPermissions({
  documentId,
  studentEmail,
  createPermission,
  env = typeof process !== "undefined" ? process.env : {},
}) {
  if (!documentId) {
    throw new Error("Missing documentId for permission grant");
  }

  const { writers, override } = resolveWriterRecipientEmails({
    studentEmail,
    editorEmail: env.DEV_GOOGLE_DOC_EDITOR_EMAIL,
    nodeEnv: env.NODE_ENV,
    devAuthEnabled: env.DEV_AUTH_ENABLED,
  });

  let studentWriterGranted = false;
  let overrideWriterGranted = false;
  const overrideWriterAttempted = override.eligible;

  for (const writer of writers) {
    const isOverride =
      override.eligible &&
      writer.toLowerCase() === override.editorEmail;
    try {
      await createPermission({
        type: "user",
        role: "writer",
        emailAddress: writer,
      });
      if (isOverride) {
        overrideWriterGranted = true;
      } else {
        studentWriterGranted = true;
      }
    } catch (err) {
      if (isOverride) {
        console.warn(
          "[dev] Google Doc editor override writer grant failed"
        );
      } else {
        console.warn(
          "Could not grant writer permission to user:",
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  if (
    writers.length === 0 &&
    isDevStudentTestingFlow(studentEmail) &&
    !override.eligible
  ) {
    console.warn(
      "[dev] No grantable writer emails for submission Doc (localhost student without override)"
    );
  }

  let publicReaderGranted = false;
  try {
    await createPermission({ type: "anyone", role: "reader" });
    publicReaderGranted = true;
  } catch (err) {
    if (isPermissionAlreadyExists(err)) {
      publicReaderGranted = true;
    } else {
      console.warn(
        "Could not grant public reader permission:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return {
    documentId,
    studentWriterGranted,
    overrideWriterAttempted,
    overrideWriterGranted: overrideWriterAttempted
      ? overrideWriterGranted
      : null,
    publicReaderGranted,
    writerRecipientCount: writers.length,
  };
}
