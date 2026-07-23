/**
 * WP-059 — Working-notebook current-page model (Modules 6–7 pilot).
 * Labels and kinds come from selectTaskRelevantArtifacts items — no second matcher.
 */

/**
 * Scope audit for non-pilot shelves (documentation / tests only).
 */
export const WP059_SIDEBAR_SURFACE_AUDIT = Object.freeze([
  {
    module: 4,
    surface: "ModuleThreeStepFrame sidebar / ModuleFourReferenceShelf",
    classification: "planning/reference shelf",
    wp059Action: "out of scope — pre-draft organization",
  },
  {
    module: 5,
    surface: "ModuleFiveStepFrame right rail guidance",
    classification: "planning/reference shelf",
    wp059Action: "out of scope — outline planning",
  },
  {
    module: 6,
    surface: "ModuleSixReferenceShelf",
    classification: "working notebook candidate (pilot)",
    wp059Action: "current page + collapsed More saved work archive",
  },
  {
    module: 7,
    surface: "ModuleSevenReferenceShelf",
    classification: "working notebook candidate (pilot)",
    wp059Action: "current page + collapsed More saved work archive",
  },
  {
    module: 8,
    surface: "ModuleEightReferenceShelf",
    classification: "resource/reference shelf",
    wp059Action: "preparation reference — not drafting notebook",
  },
  {
    module: 9,
    surface: "ModuleNineApaQuickGuide",
    classification: "quick guide",
    wp059Action: "instructional APA reference — not notebook index",
  },
]);

function safeText(value) {
  return String(value || "").trim();
}

function defaultSectionLabel(stepType) {
  switch (stepType) {
    case "intro":
      return "Introduction";
    case "body":
      return "Body Paragraph";
    case "conclusion":
      return "Conclusion";
    case "review":
      return "Whole-draft review";
    case "final-review":
      return "Full essay review";
    case "read-aloud":
      return "Full draft · read aloud";
    default:
      return "Current work";
  }
}

/**
 * Build the compact sidebar “current notebook page” from desk-selected items.
 *
 * @param {{
 *   module?: number,
 *   stepType?: string,
 *   sectionLabel?: string,
 *   items?: Array<{ label?: string, kind?: string, lines?: string[] }>,
 * }} input
 */
export function buildWorkingNotebookCurrentPage({
  module = 0,
  stepType = "",
  sectionLabel = "",
  items = [],
  locationHintOverride = null,
} = {}) {
  const mod = Number(module) || 0;
  const type = safeText(stepType);
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const currentArtifactLabels = safeItems
    .map((item) => safeText(item.label))
    .filter(Boolean);
  const currentArtifactKinds = safeItems
    .map((item) => safeText(item.kind))
    .filter(Boolean);

  let currentPageLabel = safeText(sectionLabel) || defaultSectionLabel(type);
  let locationHint =
    mod === 7
      ? "These notes are open on your desk beside the revision box."
      : "These notes are open on your desk beside the writing box.";
  let emptyStateMessage = "";

  if (type === "read-aloud") {
    currentPageLabel = safeText(sectionLabel) || "Full draft · read aloud";
    locationHint = "Your full Module 6 draft is open in the work area.";
    emptyStateMessage = "Listen for one place to strengthen.";
  } else if (type === "review") {
    currentPageLabel = safeText(sectionLabel) || "Whole-draft review";
    locationHint = "Your full draft is open in the review work area.";
    if (!currentArtifactLabels.length) {
      emptyStateMessage = "Your thesis will appear here when it is available.";
    }
  } else if (type === "final-review") {
    currentPageLabel = safeText(sectionLabel) || "Full essay review";
    locationHint = "Your full revised essay is open in the review area.";
    if (!currentArtifactLabels.length) {
      emptyStateMessage = "Your thesis will appear here when it is available.";
    }
  } else if (type === "intro" || type === "conclusion") {
    if (!currentArtifactLabels.length) {
      emptyStateMessage = "Your thesis will appear here when it is available.";
    }
  } else if (type === "body") {
    if (!currentArtifactLabels.length) {
      emptyStateMessage =
        "No saved evidence is linked to this paragraph yet. Use the outline points already on your desk.";
    } else if (
      !currentArtifactKinds.includes("evidence") &&
      currentArtifactKinds.includes("points")
    ) {
      // Keep labels; optional contextual note is not required when points exist.
      emptyStateMessage = "";
    }
  }

  const override = safeText(locationHintOverride);
  if (override) {
    locationHint = override;
  }

  return Object.freeze({
    module: mod,
    stepType: type,
    currentPageLabel,
    currentArtifactLabels: Object.freeze([...currentArtifactLabels]),
    currentArtifactKinds: Object.freeze([...currentArtifactKinds]),
    locationHint,
    emptyStateMessage,
    showArtifactLabels: currentArtifactLabels.length > 0,
  });
}

/**
 * True when the notebook index incorrectly lists full artifact line text
 * instead of (or as) compact labels.
 */
export function notebookIndexExposesStudentLines(page, items = []) {
  const labels = page?.currentArtifactLabels || [];
  for (const item of Array.isArray(items) ? items : []) {
    for (const line of item?.lines || []) {
      const text = safeText(line);
      if (text.length > 24 && labels.includes(text)) return true;
    }
  }
  return false;
}
