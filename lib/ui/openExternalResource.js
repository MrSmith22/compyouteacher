/**
 * Safe new-tab open for student file retrieval / external resources.
 * No API calls; no submission-state mutation.
 */

/**
 * @param {string|null|undefined} url
 * @returns {{ opened: boolean, reason: "ok"|"missing"|"blocked"|"unsupported" }}
 */
export function openExternalResource(url) {
  const href = typeof url === "string" ? url.trim() : "";
  if (!href) {
    return { opened: false, reason: "missing" };
  }
  if (typeof window === "undefined" || typeof window.open !== "function") {
    return { opened: false, reason: "unsupported" };
  }
  const handle = window.open(href, "_blank", "noopener,noreferrer");
  if (!handle) {
    return { opened: false, reason: "blocked" };
  }
  return { opened: true, reason: "ok" };
}
