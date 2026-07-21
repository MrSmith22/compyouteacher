/**
 * WP-084 — Shared deterministic essay word-count helper.
 * Counts authoritative essay prose only. Outline labels / planning metadata
 * must never be passed in; title pages and references are out of scope unless
 * the assignment explicitly includes them in the essay text.
 *
 * Algorithm (documented for Modules 6–8 + tests):
 * - Normalize CRLF → LF; collapse all whitespace runs to a single space.
 * - Em dashes (—) and en dashes (–) become spaces (split compounds).
 * - Hyphenated terms (well-known) count as one token.
 * - Punctuation attached to words stays with the token (don't / "Wait").
 * - Empty / whitespace-only input → 0.
 * - Section counts use the same function; sum(sectionCounts) === countEssayWords(joined)
 *   when joined with the same separators used for display (\\n\\n).
 */

/**
 * @param {unknown} text
 * @returns {string}
 */
export function normalizeEssayProseForWordCount(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2014\u2013]/g, " ") // em / en dash → word break
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Count words in one prose string (section or full essay).
 * @param {unknown} text
 * @returns {number}
 */
export function countEssayWords(text) {
  const normalized = normalizeEssayProseForWordCount(text);
  if (!normalized) return 0;
  return normalized.split(" ").filter(Boolean).length;
}

/**
 * Per-section counts + total. Empty sections contribute 0.
 * @param {unknown[]} sections
 * @returns {{ sectionCounts: number[], total: number }}
 */
export function countEssaySectionWords(sections = []) {
  const list = Array.isArray(sections) ? sections : [];
  const sectionCounts = list.map((s) => countEssayWords(s));
  const total = sectionCounts.reduce((sum, n) => sum + n, 0);
  return { sectionCounts, total };
}

/**
 * Join sections the same way Modules 6–7 persist full_text.
 * @param {unknown[]} sections
 * @returns {string}
 */
export function joinEssaySectionsForCount(sections = []) {
  const list = Array.isArray(sections) ? sections : [];
  return list
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Prefer finalized Module 7 text, else Module 7 full, else Module 6.
 * Mirrors selectEssayTextForExport priority for counting consistency.
 * @param {{
 *   module7?: { final_text?: unknown, full_text?: unknown, final_ready?: boolean } | null,
 *   module6?: { full_text?: unknown } | null,
 *   sections?: unknown[] | null,
 * }} input
 * @returns {{ text: string, source: string }}
 */
export function resolveAuthoritativeEssayTextForCount(input = {}) {
  if (Array.isArray(input.sections) && input.sections.length) {
    const text = joinEssaySectionsForCount(input.sections);
    if (text.trim()) {
      return { text, source: "sections" };
    }
  }
  const m7 = input.module7 || null;
  const m7Final = m7?.final_text != null ? String(m7.final_text) : "";
  if (m7Final.trim()) {
    return { text: m7Final, source: "module7_final_text" };
  }
  const m7Full = m7?.full_text != null ? String(m7.full_text) : "";
  if (m7Full.trim()) {
    return { text: m7Full, source: "module7_full_text" };
  }
  const m6Full =
    input.module6?.full_text != null ? String(input.module6.full_text) : "";
  if (m6Full.trim()) {
    return { text: m6Full, source: "module6_full_text" };
  }
  return { text: "", source: "empty" };
}
