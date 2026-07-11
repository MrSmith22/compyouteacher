/**
 * Pure helpers for Module 3 review_evidence (quote grouping).
 * Kept free of React so they can be unit-tested without a component runner.
 *
 * Convention (reuse later across Module 3): student-facing instructional headlines
 * that are complete sentences or questions use ending punctuation. Short UI labels
 * that are not sentences (Start here, Need Help, Saved groups, Speech, Letter) do not.
 */

export function normalizeEvidenceIdSet(evidenceIds) {
  if (!Array.isArray(evidenceIds)) {
    return [];
  }

  return Array.from(
    new Set(
      evidenceIds
        .map((id) => (typeof id === "string" ? id.trim() : String(id || "").trim()))
        .filter(Boolean)
    )
  ).sort();
}

export function sameEvidenceIdSet(leftIds, rightIds) {
  const left = normalizeEvidenceIdSet(leftIds);
  const right = normalizeEvidenceIdSet(rightIds);

  if (left.length !== right.length) {
    return false;
  }

  return left.every((id, index) => id === right[index]);
}

export function findDuplicateCluster(clusters, evidenceIds) {
  const list = Array.isArray(clusters) ? clusters : [];
  return (
    list.find((cluster) =>
      sameEvidenceIdSet(cluster?.evidenceIds, evidenceIds)
    ) || null
  );
}

export const REVIEW_QUOTE_MINIMUM = 2;

/**
 * Primary instructional flow for review_evidence.
 * The generic short model is intentionally excluded — it lives only in Need Help.
 */
export const REVIEW_PRIMARY_FLOW_SECTIONS = [
  "start_here",
  "brief_explanation",
  "job_card",
  "selected_quotations",
  "module2_quotations",
  "naming_and_saving",
  "saved_groups",
  "need_help",
];

export const REVIEW_HELP_EXAMPLE_LABEL =
  "Show me an example of grouping quotations.";

export function isShortModelInPrimaryFlow() {
  return REVIEW_PRIMARY_FLOW_SECTIONS.includes("short_model");
}

/**
 * Selected quotations for the draft group, derived from current quotation IDs.
 */
export function getSelectedQuotationsFromIds({
  evidenceItems = [],
  selectedIds = [],
} = {}) {
  const idSet = new Set(
    (Array.isArray(selectedIds) ? selectedIds : [])
      .map((id) => (typeof id === "string" ? id.trim() : String(id || "").trim()))
      .filter(Boolean)
  );

  return (Array.isArray(evidenceItems) ? evidenceItems : []).filter((item) =>
    idSet.has(item?.id)
  );
}

/**
 * Visible selection-requirement feedback for the quotation-grouping step.
 * Updates immediately with selectedCount; not color-only.
 */
export function getSelectionRequirementMessage({
  selectedCount = 0,
  quoteMinimum = REVIEW_QUOTE_MINIMUM,
} = {}) {
  const count = Number.isFinite(selectedCount) ? selectedCount : 0;
  const minimum = Number.isFinite(quoteMinimum) ? quoteMinimum : REVIEW_QUOTE_MINIMUM;
  const remaining = minimum - count;

  if (count >= minimum) {
    return {
      tone: "ready",
      message: "You have enough quotations to name this group.",
    };
  }

  if (count === minimum - 1 && remaining === 1) {
    return {
      tone: "need_more",
      message: "Select one more quotation to create a group.",
    };
  }

  return {
    tone: "need_more",
    message: "Select at least two quotations to create a group.",
  };
}

/**
 * Progressive-disclosure phase for review_evidence.
 * Phases stack: later phases remain available once unlocked.
 */
export function getReviewEvidencePhase({
  selectedCount = 0,
  groupName = "",
  savedGroupCount = 0,
  quoteMinimum = REVIEW_QUOTE_MINIMUM,
} = {}) {
  const hasEnoughQuotes = selectedCount >= quoteMinimum;
  const hasName = typeof groupName === "string" && groupName.trim().length > 0;
  const canSave = hasEnoughQuotes && hasName;
  const hasSavedGroups = savedGroupCount >= 1;

  let primaryPhase = "select";
  if (hasSavedGroups && !hasEnoughQuotes) {
    primaryPhase = "choose";
  } else if (canSave) {
    primaryPhase = "save";
  } else if (hasEnoughQuotes) {
    primaryPhase = "name";
  }

  return {
    primaryPhase,
    showQuoteWorkspace: true,
    showNaming: hasEnoughQuotes,
    showSave: hasEnoughQuotes,
    emphasizeSave: canSave,
    showChooseGroup: hasSavedGroups,
    hasEnoughQuotes,
    hasName,
    canSave,
    quoteMinimum,
  };
}

export function getReviewContinueHint({
  evidenceCount = 0,
  savedGroupCount = 0,
  selectedCluster = null,
  quoteMinimum = REVIEW_QUOTE_MINIMUM,
} = {}) {
  if (evidenceCount < 2) {
    return "You need at least two quotes from Module 2 before you can move on.";
  }

  if (savedGroupCount < 1) {
    return `Choose at least ${quoteMinimum} related quotations, name the group, and save it.`;
  }

  if (!selectedCluster || !Array.isArray(selectedCluster.evidenceIds)) {
    return "Choose one saved group to explore before you continue.";
  }

  if (selectedCluster.evidenceIds.length < 2) {
    return "Choose a saved group that has at least two quotations.";
  }

  return "";
}

export function getReviewReadyMessage(selectedCluster = null) {
  const name =
    typeof selectedCluster?.name === "string" ? selectedCluster.name.trim() : "";
  if (!name) {
    return "";
  }
  return `You chose “${name}.” You’re ready to explore what its quotations reveal.`;
}

export function canContinueFromReview({
  evidenceCount = 0,
  selectedCluster = null,
} = {}) {
  return (
    evidenceCount >= 2 &&
    Boolean(selectedCluster) &&
    Array.isArray(selectedCluster.evidenceIds) &&
    selectedCluster.evidenceIds.length >= 2
  );
}

/**
 * Save confirmation after creating a group.
 * Saving never selects the new group — the wording must match that fact.
 */
export function getSaveGroupConfirmationMessage({
  savedName = "",
  previousSelectedId = "",
  previousSelectedName = "",
} = {}) {
  const name = typeof savedName === "string" ? savedName.trim() : "";
  const hadPriorChoice = Boolean(
    typeof previousSelectedId === "string" && previousSelectedId.trim()
  );

  if (hadPriorChoice) {
    return `Saved “${name}.” Your current exploration choice has not changed. Compare the groups below if you want to choose a different path.`;
  }

  return `Saved “${name}.” It is not selected yet. Compare your saved groups below, then choose one to explore.`;
}

/**
 * Pure model for the coached "choose one group" decision section.
 * Saving and choosing are distinct actions — this models only choosing.
 */
export const REVIEW_GROUP_CHOICE_COPY = {
  heading: "Choose one group to explore more deeply.",
  intro:
    "You have looked across your quotations and created possible groups. Each group represents an idea or connection you might investigate.",
  nextStep:
    "Now choose the group you want to understand better. The next questions will stay focused on that group and help you decide what its quotations might reveal about King’s rhetorical choices.",
  reassurance:
    "You are choosing a direction to explore—not writing your final thesis yet.",
  comparisonPrompt:
    "Choose the group that seems most likely to help you discover something important about how the speech and letter are similar or different.",
  steps: [
    "Read the name and quotations in each saved group.",
    "Ask which group gives you the most interesting comparison or question.",
    "Choose the one you want to examine next.",
  ],
  coachingQuestions: [
    "Which group makes you most curious?",
    "Which group might reveal an important similarity or difference?",
    "Which group could help you explain how King uses a rhetorical appeal?",
    "Which group gives you something worth investigating—not just something obvious?",
  ],
  noChoiceStatus: "No group chosen yet.",
  noChoiceHint: "Choose one group before you continue.",
  exploreAction: "Explore this group",
  chosenAction: "Chosen for exploration",
  exploreInsteadAction: "Explore this group instead",
  chosenBadge: "Your chosen group",
  pathPreviewLead: "This is the group you’ll use next:",
  pathPreviewNext:
    "On the next screen, you’ll look for a pattern: what these quotations share, how they differ, or what they accomplish.",
};

export function getGroupChoicePresentation({
  selectedCluster = null,
  evidenceItems = [],
} = {}) {
  const chosen = selectedCluster && selectedCluster.id ? selectedCluster : null;
  const name =
    chosen && typeof chosen.name === "string" ? chosen.name.trim() : "";

  if (!chosen || !name) {
    return {
      hasChoice: false,
      statusLine: REVIEW_GROUP_CHOICE_COPY.noChoiceStatus,
      statusDetail: REVIEW_GROUP_CHOICE_COPY.noChoiceHint,
      confirmationLine: "",
      confirmationDetail: "",
      pathPreview: null,
    };
  }

  const evidenceIds = Array.isArray(chosen.evidenceIds) ? chosen.evidenceIds : [];
  const mix = sourceMixLabel(evidenceItems, evidenceIds);

  return {
    hasChoice: true,
    statusLine: `You chose “${name}.”`,
    statusDetail:
      "Next, you will look closely at these quotations and decide what they reveal about King’s rhetorical choices.",
    confirmationLine: `You chose “${name}.”`,
    confirmationDetail:
      "Next, you will look closely at these quotations and decide what they reveal about King’s rhetorical choices.",
    pathPreview: {
      lead: REVIEW_GROUP_CHOICE_COPY.pathPreviewLead,
      groupName: name,
      sourceMix: mix,
      quotationCount: evidenceIds.length,
      nextLine: REVIEW_GROUP_CHOICE_COPY.pathPreviewNext,
    },
  };
}

export function getGroupCardActionLabel({ isChosen = false, hasAnyChoice = false } = {}) {
  if (isChosen) {
    return REVIEW_GROUP_CHOICE_COPY.chosenAction;
  }
  if (hasAnyChoice) {
    return REVIEW_GROUP_CHOICE_COPY.exploreInsteadAction;
  }
  return REVIEW_GROUP_CHOICE_COPY.exploreAction;
}

/**
 * Detect whether later thinking exists so a group switch can warn first.
 * Does not mutate anything and does not decide what to clear.
 */
export function hasDownstreamThinking({
  selectedPatternId = "",
  patternNotices = [],
  ideaStatement = "",
  ideaWhyMatters = "",
  evidenceConnections = {},
  workingClaim = "",
  supportRationale = "",
  thesisStatement = "",
  proofPlan = [],
} = {}) {
  if (typeof selectedPatternId === "string" && selectedPatternId.trim()) {
    return true;
  }

  for (const notice of Array.isArray(patternNotices) ? patternNotices : []) {
    if (typeof notice?.text === "string" && notice.text.trim()) {
      return true;
    }
    if (Array.isArray(notice?.evidenceIds) && notice.evidenceIds.length > 0) {
      return true;
    }
  }

  if (typeof ideaStatement === "string" && ideaStatement.trim()) {
    return true;
  }
  if (typeof ideaWhyMatters === "string" && ideaWhyMatters.trim()) {
    return true;
  }

  const connections =
    evidenceConnections && typeof evidenceConnections === "object"
      ? evidenceConnections
      : {};
  for (const value of Object.values(connections)) {
    if (!value || typeof value !== "object") continue;
    if (value.selected) return true;
    if (typeof value.relation === "string" && value.relation.trim()) return true;
    if (typeof value.note === "string" && value.note.trim()) return true;
    if (typeof value.connectionNote === "string" && value.connectionNote.trim()) {
      return true;
    }
  }

  if (typeof workingClaim === "string" && workingClaim.trim()) {
    return true;
  }
  if (typeof supportRationale === "string" && supportRationale.trim()) {
    return true;
  }
  if (typeof thesisStatement === "string" && thesisStatement.trim()) {
    return true;
  }

  for (const line of Array.isArray(proofPlan) ? proofPlan : []) {
    if (typeof line === "string" && line.trim()) {
      return true;
    }
  }

  return false;
}

export const DOWNSTREAM_GROUP_SWITCH_COPY = {
  heading: "Changing groups will change your later work.",
  keepAction: "Keep my current group",
  switchAction: "Switch groups and clear later work",
};

export function getDownstreamGroupSwitchMessage({
  currentGroupName = "",
  newGroupName = "",
} = {}) {
  const current =
    typeof currentGroupName === "string" ? currentGroupName.trim() : "";
  const next = typeof newGroupName === "string" ? newGroupName.trim() : "";
  return `Your pattern, developing idea, evidence connections, claim, and thesis were built from “${current}.” If you switch to “${next},” that later work will be cleared so you can build from the new evidence.`;
}

/**
 * Pure decision for what selecting a saved group should do.
 * Saving never goes through this path.
 */
export function resolveGroupSelectionAction({
  nextClusterId = "",
  currentClusterId = "",
  hasDownstream = false,
} = {}) {
  const next = typeof nextClusterId === "string" ? nextClusterId.trim() : "";
  const current =
    typeof currentClusterId === "string" ? currentClusterId.trim() : "";

  if (!next || next === current) {
    return { action: "noop", shouldResetDownstream: false };
  }

  if (current && hasDownstream) {
    return { action: "confirm", shouldResetDownstream: false };
  }

  return {
    action: "select",
    shouldResetDownstream: Boolean(current),
  };
}

export function sourceMixLabel(evidenceItems, evidenceIds) {
  const ids = normalizeEvidenceIdSet(evidenceIds);
  const items = Array.isArray(evidenceItems) ? evidenceItems : [];
  const types = new Set();

  for (const id of ids) {
    const match = items.find((item) => item?.id === id);
    if (match?.sourceType) {
      types.add(match.sourceType);
    }
  }

  if (types.has("speech") && types.has("letter")) {
    return "Speech and letter";
  }
  if (types.has("speech")) {
    return "Speech";
  }
  if (types.has("letter")) {
    return "Letter";
  }
  return "";
}

/**
 * Stable visual accents for saved groups (presentation only — does not change IDs).
 * Color is paired with a number/label so distinction is not color-only.
 */
export const SAVED_GROUP_ACCENTS = [
  {
    id: "blue",
    card: "border-theme-blue/35 bg-theme-blue/[0.04]",
    selectedCard: "border-theme-blue/50 bg-theme-blue/[0.08] ring-2 ring-theme-blue/30",
    header: "bg-theme-blue/10 border-b border-theme-blue/25",
    badge: "border border-theme-blue/35 bg-theme-blue/15 text-theme-blue",
    numberLabel: "Group",
  },
  {
    id: "green",
    card: "border-theme-green/35 bg-theme-green/[0.04]",
    selectedCard: "border-theme-green/50 bg-theme-green/[0.08] ring-2 ring-theme-green/30",
    header: "bg-theme-green/10 border-b border-theme-green/25",
    badge: "border border-theme-green/35 bg-theme-green/15 text-theme-green",
    numberLabel: "Group",
  },
  {
    id: "orange",
    card: "border-theme-orange/35 bg-theme-orange/[0.04]",
    selectedCard: "border-theme-orange/50 bg-theme-orange/[0.08] ring-2 ring-theme-orange/30",
    header: "bg-theme-orange/10 border-b border-theme-orange/25",
    badge: "border border-theme-orange/35 bg-theme-orange/15 text-theme-orange",
    numberLabel: "Group",
  },
  {
    id: "dark",
    card: "border-theme-dark/25 bg-theme-dark/[0.03]",
    selectedCard: "border-theme-dark/40 bg-theme-dark/[0.06] ring-2 ring-theme-dark/20",
    header: "bg-theme-dark/[0.06] border-b border-theme-dark/20",
    badge: "border border-theme-dark/25 bg-theme-dark/10 text-theme-dark",
    numberLabel: "Group",
  },
];

export function getSavedGroupAccent(index = 0) {
  const safeIndex = Number.isFinite(index) && index >= 0 ? index : 0;
  return SAVED_GROUP_ACCENTS[safeIndex % SAVED_GROUP_ACCENTS.length];
}

export const DUPLICATE_GROUP_MESSAGE =
  "You already saved a group with these quotations. Choose a different combination, or use the group you already created.";

/**
 * Assignment-prompt presence contract for REVIEW.
 * The legacy collapsed "Your assignment question (reference)" disclosure was
 * replaced by the prompt compass; the full prompt appears exactly once.
 */
export const REVIEW_PROMPT_PRESENTATION = {
  component: "prompt_compass",
  legacyReferenceDisclosure: false,
  fullPromptDuplicated: false,
};

/** Grouping lenses shown beside the task (only these two in the primary flow). */
export const REVIEW_PRIMARY_GROUPING_LENSES = [
  "The same rhetorical appeal appears in both texts.",
  "The quotations address the same problem or value.",
];

/** Additional lenses live in Need Help only. */
export const REVIEW_HELP_GROUPING_LENSES = [
  "King uses different appeals for a similar purpose.",
  "The quotations affect their audiences in similar ways.",
  "The quotations affect their audiences differently.",
  "The quotations reveal an important contrast.",
  "The same appeal changes because the audience changes.",
];

/**
 * Student-facing appeal chips. Recognizes ethos/pathos/logos in evidence tags
 * case-insensitively; ignores implementation tags (t-chart, teacher-guided,
 * observation-stage values). Returns "" when no appeal is known — never
 * invents an appeal.
 */
const APPEAL_CHIP_LABELS = {
  ethos: "Ethos · trust",
  pathos: "Pathos · feeling",
  logos: "Logos · reasoning",
};

export function getAppealChipLabel(tags = []) {
  for (const tag of Array.isArray(tags) ? tags : []) {
    const key = typeof tag === "string" ? tag.trim().toLowerCase() : "";
    if (APPEAL_CHIP_LABELS[key]) {
      return APPEAL_CHIP_LABELS[key];
    }
  }
  return "";
}

/**
 * Source-mix coaching for the LIVE draft selection. Coaching only —
 * it never blocks selection, naming, saving, or duplicate protection,
 * and one-source groups remain legal while exploring.
 */
export function getSelectionSourceMix(workingEvidence = []) {
  const items = Array.isArray(workingEvidence) ? workingEvidence : [];
  let speechCount = 0;
  let letterCount = 0;

  for (const item of items) {
    if (item?.sourceType === "speech") speechCount += 1;
    else if (item?.sourceType === "letter") letterCount += 1;
  }

  const total = items.length;

  if (total === 0) {
    return { show: false, speechCount: 0, letterCount: 0, countLine: "", message: "" };
  }

  const countLine = `Speech: ${speechCount} · Letter: ${letterCount}`;

  let message = "";
  if (total >= 2) {
    if (speechCount > 0 && letterCount > 0) {
      message = "This group includes both works.";
    } else if (speechCount > 0) {
      message =
        "This group uses only the speech. That’s fine while exploring—your final argument will need evidence from both works.";
    } else if (letterCount > 0) {
      message =
        "This group uses only the letter. That’s fine while exploring—your final argument will need evidence from both works.";
    }
  }

  return { show: true, speechCount, letterCount, countLine, message };
}

