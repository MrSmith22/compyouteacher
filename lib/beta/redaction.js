/**
 * WP-101 — Redact secrets and student prose from beta evidence/reports.
 */

const SECRET_PATTERNS = [
  /ya29\.[A-Za-z0-9_-]+/g,
  /1\/\/[A-Za-z0-9_-]+/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /NEXTAUTH_SECRET[=:]\s*\S+/gi,
  /SUPABASE_SERVICE_ROLE[^=]*=\s*\S+/gi,
  /https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]+/gi,
  /https:\/\/drive\.google\.com\/[^\s"']+/gi,
];

const PROSE_KEYS = new Set([
  "final_text",
  "essayText",
  "bodyText",
  "prose",
  "studentProse",
  "reasoning",
  "context",
  "explanation",
  "notes",
  "teacherNotes",
  "sourceText",
  "passage",
]);

/**
 * @param {string} text
 * @returns {string}
 */
export function redactSensitiveText(text) {
  if (typeof text !== "string") return "";
  let out = text;
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, "[REDACTED]");
  }
  return out;
}

/**
 * Short safe excerpt for traces: first/last few chars + length + hash hint.
 * @param {string} text
 * @param {{ max?: number }} [opts]
 */
export function safeExcerpt(text, opts = {}) {
  const max = opts.max ?? 24;
  const raw = typeof text === "string" ? text : "";
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return { length: 0, excerpt: "", hashHint: "empty" };
  }
  const head = trimmed.slice(0, Math.min(12, max));
  const tail = trimmed.length > 12 ? trimmed.slice(-8) : "";
  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return {
    length: trimmed.length,
    excerpt: redactSensitiveText(
      tail ? `${head}…${tail}` : head
    ).slice(0, max + 8),
    hashHint: hash.toString(16).padStart(8, "0"),
  };
}

/**
 * Deep-clone-ish redaction for evidence objects.
 * @param {unknown} value
 * @param {number} [depth]
 * @returns {unknown}
 */
export function redactEvidenceValue(value, depth = 0) {
  if (depth > 12) return "[TRUNCATED]";
  if (value == null) return value;
  if (typeof value === "string") return redactSensitiveText(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.map((v) => redactEvidenceValue(v, depth + 1));
  }
  if (typeof value === "object") {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (PROSE_KEYS.has(k) && typeof v === "string") {
        out[k] = safeExcerpt(v);
      } else {
        out[k] = redactEvidenceValue(v, depth + 1);
      }
    }
    return out;
  }
  return String(value);
}
