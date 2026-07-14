/**
 * Compact four-question screen-contract cues (WP-048).
 * Visible summaries only — deeper Help/examples stay elsewhere.
 */
export function pickVisiblePurpose(whyMatters) {
  if (Array.isArray(whyMatters)) {
    const line = whyMatters.find((item) => String(item || "").trim());
    return line ? String(line).trim() : "";
  }
  if (typeof whyMatters === "string" && whyMatters.trim()) {
    return whyMatters.trim();
  }
  return "";
}

export function pickVisibleFinished(successLooksLike) {
  if (!Array.isArray(successLooksLike)) return "";
  const line = successLooksLike.find((item) => String(item || "").trim());
  return line ? String(line).trim() : "";
}

export function remainingContractLines(allLines, visibleLine) {
  const list = Array.isArray(allLines)
    ? allLines.map((item) => String(item || "").trim()).filter(Boolean)
    : typeof allLines === "string" && allLines.trim()
      ? [allLines.trim()]
      : [];
  if (!visibleLine) return list;
  return list.filter((line) => line !== visibleLine);
}

/**
 * Shared presentation-object contract for Modules 6–8 step helpers.
 */
export function assertStepPresentationContract(presentation, label = "presentation") {
  if (!presentation || typeof presentation !== "object") {
    throw new Error(`${label} must be an object`);
  }
  if (!String(presentation.question || "").trim()) {
    throw new Error(`${label}.question is required`);
  }
  const purpose = pickVisiblePurpose(presentation.whyMatters);
  if (!purpose) {
    throw new Error(`${label}.whyMatters must provide a visible purpose`);
  }
  const finished = pickVisibleFinished(presentation.successLooksLike);
  if (!finished) {
    throw new Error(`${label}.successLooksLike must provide a visible finished cue`);
  }
  const hasHow =
    Boolean(presentation.jobRightNow?.steps?.length) ||
    Boolean(String(presentation.howToSucceed || "").trim()) ||
    Boolean(String(presentation.coachingMessage || "").trim());
  if (!hasHow) {
    throw new Error(
      `${label} must provide how-to-succeed via jobRightNow, howToSucceed, or coachingMessage`
    );
  }
  return true;
}
