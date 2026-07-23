/**
 * WP-098 — Writing-teacher voice taxonomy for student-facing copy.
 * Presentation/language only. Does not own correctness, gates, or persistence.
 */

export const TEACHER_VOICE_STRING_JOBS = Object.freeze([
  "task_question",
  "coaching",
  "teaching_feedback",
  "status",
  "recovery",
  "technical_instruction",
  "success",
  "reference",
  "action",
]);

/**
 * Scoped jargon patterns for student-visible registries/components.
 * Do not run as a naive whole-repo ban (would flag code/comments and brand chrome).
 */
export const FORBIDDEN_STUDENT_JARGON_PATTERNS = Object.freeze([
  /\bschema\b/i,
  /\brollout\b/i,
  /\bflow state\b/i,
  /\bfixture\b/i,
  /\bexport row\b/i,
  /\bthe processor\b/i,
  /\bin the processor\b/i,
  /\bWriting Processor will\b/i,
]);

/** Product brand chrome may keep this exact title; instructional narration should not. */
export const ALLOWED_PRODUCT_BRAND_TITLE = "The Writing Processor";

export const TECHNICAL_INSTRUCTION_VERBS = Object.freeze([
  "Create Google Doc",
  "Update Google Doc",
  "Open Google Doc",
  "Download PDF",
  "Choose file",
  "Upload Final PDF",
  "Open final PDF",
]);

/**
 * @param {string} text
 * @returns {{ ok: boolean, hits: string[] }}
 */
export function findForbiddenStudentJargon(text) {
  const value = typeof text === "string" ? text : "";
  const hits = [];
  for (const pattern of FORBIDDEN_STUDENT_JARGON_PATTERNS) {
    const match = value.match(pattern);
    if (match) hits.push(match[0]);
  }
  return { ok: hits.length === 0, hits };
}

/**
 * @param {string} job
 * @returns {boolean}
 */
export function isTeacherVoiceStringJob(job) {
  return TEACHER_VOICE_STRING_JOBS.includes(job);
}

/**
 * Lightweight classifier hints for tests and audits.
 * @param {string} text
 * @param {{ job?: string }} [opts]
 */
export function classifyStudentFacingCopy(text, opts = {}) {
  const value = typeof text === "string" ? text.trim() : "";
  const job = opts.job && isTeacherVoiceStringJob(opts.job) ? opts.job : null;
  const jargon = findForbiddenStudentJargon(value);
  const looksTechnicalVerb = TECHNICAL_INSTRUCTION_VERBS.some((verb) =>
    value.includes(verb)
  );
  return Object.freeze({
    job,
    length: value.length,
    forbiddenJargon: jargon.hits,
    keepTechnical: looksTechnicalVerb,
    voiceClass: jargon.ok
      ? looksTechnicalVerb
        ? "technical"
        : "teacher_or_neutral"
      : "forbidden_jargon",
  });
}

/**
 * @param {Iterable<string>} strings
 * @param {{ allowBrandTitle?: boolean }} [opts]
 */
export function assertNoForbiddenStudentJargon(strings, opts = {}) {
  const allowBrand = opts.allowBrandTitle !== false;
  const failures = [];
  for (const raw of strings) {
    const text = typeof raw === "string" ? raw : "";
    if (allowBrand && text.trim() === ALLOWED_PRODUCT_BRAND_TITLE) continue;
    const { ok, hits } = findForbiddenStudentJargon(text);
    if (!ok) failures.push({ text: text.slice(0, 120), hits });
  }
  if (failures.length > 0) {
    throw new Error(
      `WP-098 teacher-voice jargon: ${failures
        .map((f) => `"${f.text}" → ${f.hits.join(", ")}`)
        .join("; ")}`
    );
  }
  return true;
}
