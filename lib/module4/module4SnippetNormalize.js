/**
 * Module 4 Checkpoint 6 — safe evidenceKeys / evidenceSnippets normalization.
 * Read-boundary only. Does not change persistence shapes.
 */

/**
 * Normalize persisted evidenceSnippets at the read boundary.
 */
export function normalizeEvidenceSnippets(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (entry == null) {
      return { quote: "", observation: "" };
    }
    if (typeof entry === "string") {
      return { quote: entry, observation: "" };
    }
    if (typeof entry === "object") {
      return {
        quote: typeof entry.quote === "string" ? entry.quote : "",
        observation:
          typeof entry.observation === "string" ? entry.observation : "",
      };
    }
    return { quote: "", observation: "" };
  });
}

/**
 * Normalize evidenceKeys array safely.
 */
export function normalizeEvidenceKeys(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((key) => {
      if (typeof key === "string") return key.trim();
      if (key == null) return "";
      return String(key).trim();
    })
    .filter(Boolean);
}
