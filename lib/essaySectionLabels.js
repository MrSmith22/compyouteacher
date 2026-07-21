/**
 * Stable student-facing essay section labels (WP-081 / strategy §2.2).
 * Internal IDs may differ; student vocabulary must remain Body Paragraph N.
 */

export function getBodyParagraphLabel(essayOrderIndex) {
  const n =
    typeof essayOrderIndex === "number" && essayOrderIndex >= 0
      ? essayOrderIndex + 1
      : 1;
  return `Body Paragraph ${n}`;
}

export function getIntroductionLabel() {
  return "Introduction";
}

export function getConclusionLabel() {
  return "Conclusion";
}

/**
 * @param {{ type?: string, bodyIndex?: number }} step
 */
export function getEssaySectionLabel(step) {
  if (!step) return "Draft";
  const type = String(step.type || "").toLowerCase();
  if (type === "intro" || type === "introduction") return getIntroductionLabel();
  if (type === "conclusion") return getConclusionLabel();
  if (type === "body") {
    return getBodyParagraphLabel(
      typeof step.bodyIndex === "number" ? step.bodyIndex : 0
    );
  }
  return "Draft";
}
