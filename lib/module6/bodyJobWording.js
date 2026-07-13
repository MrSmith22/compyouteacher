/**
 * Module 6 body-job display wording.
 * Pure helpers — never mutate stored Module 4 job values.
 */

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Light mechanical third-person for imperative/base job phrases.
 * Does not grade quality — only display grammar for “This paragraph …”.
 */
export function toThirdPersonJobPhrase(job) {
  const trimmed = safeText(job);
  if (!trimmed) return "";
  const match = trimmed.match(/^([A-Za-z]+)([\s\S]*)$/);
  if (!match) {
    return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  }
  const verb = match[1];
  const rest = match[2];
  const lower = verb.toLowerCase();

  // Already looks third-person singular (develops, analyzes, compares).
  if (
    lower.length > 2 &&
    /s$/.test(lower) &&
    !/(ss|us|is|as)$/.test(lower)
  ) {
    return lower + rest;
  }
  if (/[^aeiou]y$/i.test(lower)) {
    return `${lower.slice(0, -1)}ies${rest}`;
  }
  if (/(s|ss|sh|ch|x|z|o)$/i.test(lower)) {
    return `${lower}es${rest}`;
  }
  return `${lower}s${rest}`;
}

export const MODULE6_BODY_JOB_FALLBACK =
  "This paragraph develops one part of your thesis.";

/**
 * Build the student-facing body-job sentence without changing stored job text.
 */
export function formatModule6BodyJobSentence(job, { jobId = "" } = {}) {
  const trimmed = safeText(job);
  if (trimmed) {
    if (/^this paragraph\b/i.test(trimmed)) {
      return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
    }
    const phrase = toThirdPersonJobPhrase(trimmed).replace(/[.]+$/, "");
    return `This paragraph ${phrase}.`;
  }

  const id = safeText(jobId).toLowerCase();
  if (id.includes("letter")) return "This paragraph analyzes the letter.";
  if (id.includes("speech")) return "This paragraph analyzes the speech.";
  if (id.includes("compare") || id.includes("both")) {
    return "This paragraph compares both works.";
  }
  if (id.includes("diff") || id.includes("contrast")) {
    return "This paragraph shows an important difference.";
  }
  if (id.includes("similar")) {
    return "This paragraph shows an important similarity.";
  }
  return MODULE6_BODY_JOB_FALLBACK;
}
