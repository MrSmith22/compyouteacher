/**
 * Pure helpers for Module 3 connect_evidence.
 * Preserves evidenceMap shape: { selected, relation, note }.
 * Stored relation values remain: supports | complicates | sharpens.
 */

export const CONNECT_RELATION_VALUES = ["supports", "complicates", "sharpens"];
export const CONNECT_MINIMUM = 2;

/** Trimmed character minimum for a meaningful connection explanation. */
export const CONNECT_NOTE_MINIMUM = 15;

/** UI-only choices; only STORED_* map into evidenceMap.relation */
export const RELATION_CHOICES = [
  {
    id: "supports",
    label: "Supports the idea",
    storedRelation: "supports",
    countsTowardProgress: true,
    coaching:
      "What part of the quotation helps prove or explain your idea?",
  },
  {
    id: "complicates",
    label: "Complicates the idea",
    storedRelation: "complicates",
    countsTowardProgress: true,
    coaching:
      "What does this quotation make more complex or less simple about your idea?",
  },
  {
    id: "sharpens",
    label: "Sharpens or adds detail to the idea",
    storedRelation: "sharpens",
    countsTowardProgress: true,
    coaching:
      "What new detail or more precise meaning does this quotation add?",
  },
  {
    id: "does_not_fit",
    label: "Does not really fit",
    storedRelation: null,
    countsTowardProgress: false,
    coaching:
      "What makes this quotation less useful for this idea? You may choose another quotation if needed.",
  },
  {
    id: "unsure",
    label: "I’m not sure yet",
    storedRelation: null,
    countsTowardProgress: false,
    coaching:
      "Compare one important word or phrase in the quotation with your idea. What connection, if any, can you see?",
  },
];

export const CONNECT_SENTENCE_STARTERS = [
  "This quotation supports my idea because…",
  "The words “___” show that…",
  "This evidence adds to the idea by…",
  "This quotation complicates the idea because…",
  "This quotation makes the idea more specific by…",
];

export const CONNECT_READY_MESSAGE =
  "You have enough explained evidence to evaluate your support.";

export const CONNECT_READY_COMPARISON_PROMPT =
  "Before you continue, look across the Speech and Letter connections: do they contribute something similar, something different, or both?";

export const CONNECT_CROSS_REVIEW_HEADING = "Look across both connections.";

export const CONNECT_CROSS_REVIEW_QUESTIONS = [
  "Do these quotations help the idea in a similar way, in different ways, or both?",
  "How might the different audiences or purposes explain what you see?",
  "You do not need to write another answer here. Carry this comparison into the evidence check.",
];

export const CONNECT_BLOCKED_CHOOSE_RELATION =
  "Choose how this quotation relates to your idea before writing your explanation.";

export const CONNECT_NOTE_EMPTY_MESSAGE =
  "Explain how this quotation helps, complicates, or sharpens your idea.";

export const CONNECT_NOTE_SHORT_MESSAGE =
  "Add a little more explanation. Point to what the quotation shows and connect it to your idea.";

export const CONNECT_NOTE_COMPLETE_MESSAGE =
  "This quotation has a complete connection explanation.";

/** @deprecated Prefer CONNECT_NOTE_EMPTY_MESSAGE / CONNECT_NOTE_SHORT_MESSAGE. */
export const CONNECT_BLOCKED_WRITE_NOTE = CONNECT_NOTE_EMPTY_MESSAGE;

export const CONNECT_BLOCKED_COMPLETE_ONE_MORE =
  "Complete one more quotation connection.";

export const CONNECT_BLOCKED_FIRST_QUOTATION =
  "Explain how the first quotation relates to your idea.";

export const CONNECT_BLOCKED_DOES_NOT_FIT =
  "This quotation will not count yet. Choose another relationship or add a different quotation from this group.";

export const CONNECT_PROSPECTIVE_COMPARISON_NOTE =
  "Keep this contribution in mind. After you explain the other work, you will look across both connections.";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

/** Phrase for the other work in contribution coaching — never "the the …". */
export function otherSourceQuotationPhrase(sourceType = "") {
  if (sourceType === "speech") return "the Speech quotation";
  if (sourceType === "letter") return "the Letter quotation";
  return "the other work’s quotation";
}

export function getConnectionNoteLength(note = "") {
  return safeText(note).length;
}

export function isConnectionNoteReady(
  note = "",
  minimum = CONNECT_NOTE_MINIMUM
) {
  return getConnectionNoteLength(note) >= minimum;
}

/**
 * Student-facing note feedback beside the active textarea.
 * Emphasizes explaining the connection; character count is a quiet helper.
 */
export function getConnectionNoteFeedback({
  note = "",
  minimum = CONNECT_NOTE_MINIMUM,
} = {}) {
  const length = getConnectionNoteLength(note);
  const ready = length >= minimum;

  if (length === 0) {
    return {
      ready: false,
      length,
      minimum,
      message: CONNECT_NOTE_EMPTY_MESSAGE,
      characterHint: "",
    };
  }

  if (!ready) {
    return {
      ready: false,
      length,
      minimum,
      message: CONNECT_NOTE_SHORT_MESSAGE,
      characterHint: `${length} of ${minimum} characters needed`,
    };
  }

  return {
    ready: true,
    length,
    minimum,
    message: CONNECT_NOTE_COMPLETE_MESSAGE,
    characterHint: "",
  };
}

export function getRelationChoice(id) {
  return RELATION_CHOICES.find((choice) => choice.id === id) || null;
}

export function relationLabelForStored(relation) {
  const match = RELATION_CHOICES.find(
    (choice) => choice.storedRelation === relation
  );
  return match?.label || "Supports the idea";
}

/**
 * Source-aware contribution coaching for the active quotation.
 * Thinking lenses attached to the existing connection note — never a stored comparison answer.
 */
export function getSourceContributionQuestions({
  sourceType = "",
  otherSourceType = "",
} = {}) {
  const otherPhrase = otherSourceQuotationPhrase(otherSourceType);

  if (sourceType === "speech") {
    return [
      "What does this Speech quotation add to your idea?",
      "How might its public audience and purpose help explain King’s choice?",
      `Does it contribute something similar to ${otherPhrase}, something different, or both?`,
    ];
  }

  if (sourceType === "letter") {
    return [
      "What does this Letter quotation add to your idea?",
      "How might its readers and purpose help explain King’s choice?",
      `Does it contribute something similar to ${otherPhrase}, something different, or both?`,
    ];
  }

  return [
    "What does this quotation add to your idea?",
    "How might its audience and purpose help explain King’s choice?",
    `Does it contribute something similar to ${otherPhrase}, something different, or both?`,
  ];
}

/**
 * Relation-tailored coaching plus source-aware contribution questions.
 */
export function getConnectCoachingLines({
  sourceType = "",
  uiChoiceId = "",
  otherSourceType = "",
  otherConnectionComplete = false,
} = {}) {
  const choice = getRelationChoice(uiChoiceId);
  const lines = [];

  if (choice?.coaching && choice.countsTowardProgress) {
    lines.push(choice.coaching);
  }

  if (choice?.countsTowardProgress) {
    lines.push(...getSourceContributionQuestions({ sourceType, otherSourceType }));
  } else if (choice?.coaching) {
    lines.push(choice.coaching);
  }

  if (
    choice?.countsTowardProgress &&
    otherSourceType &&
    !otherConnectionComplete
  ) {
    lines.push(CONNECT_PROSPECTIVE_COMPARISON_NOTE);
  }

  return lines;
}

/**
 * Build the default working set: pattern-linked quotations that still belong
 * to the selected group. Orphan IDs are excluded.
 */
export function getConnectWorkingEvidence({
  selectedPatternEvidence = [],
  selectedClusterEvidence = [],
} = {}) {
  const clusterIds = new Set(
    (selectedClusterEvidence || []).map((item) => normalizeId(item?.id)).filter(Boolean)
  );

  const fromPattern = (selectedPatternEvidence || []).filter((item) =>
    clusterIds.has(normalizeId(item?.id))
  );

  if (fromPattern.length >= CONNECT_MINIMUM) {
    return {
      workingEvidence: fromPattern,
      source: "pattern",
      needsRecovery: false,
    };
  }

  return {
    workingEvidence: fromPattern,
    source: fromPattern.length > 0 ? "pattern_partial" : "empty",
    needsRecovery: true,
  };
}

export function isValidExplainedConnection(
  entry,
  { noteMinimum = CONNECT_NOTE_MINIMUM } = {}
) {
  if (!entry || typeof entry !== "object") return false;
  if (!entry.selected) return false;
  if (!isConnectionNoteReady(entry.note, noteMinimum)) return false;
  const relation = typeof entry.relation === "string" ? entry.relation : "";
  return CONNECT_RELATION_VALUES.includes(relation);
}

export function countValidExplainedConnections(
  evidenceConnections = {},
  allowedEvidenceIds = []
) {
  const allowed = new Set(
    (allowedEvidenceIds || []).map(normalizeId).filter(Boolean)
  );

  let count = 0;
  for (const [evidenceId, entry] of Object.entries(evidenceConnections || {})) {
    const id = normalizeId(evidenceId);
    if (!allowed.has(id)) continue;
    if (isValidExplainedConnection(entry)) count += 1;
  }
  return count;
}

export function mapRelationChoiceToConnectionPatch(choiceId, current = {}) {
  const choice = getRelationChoice(choiceId);
  if (!choice) {
    return {
      selected: Boolean(current.selected),
      relation:
        typeof current.relation === "string" ? current.relation : "supports",
      note: typeof current.note === "string" ? current.note : "",
    };
  }

  if (!choice.countsTowardProgress || !choice.storedRelation) {
    return {
      selected: false,
      relation: "supports",
      note: "",
    };
  }

  return {
    selected: true,
    relation: choice.storedRelation,
    note: typeof current.note === "string" ? current.note : "",
  };
}

export function inferUiChoiceFromConnection(entry) {
  if (!entry) return "";
  if (!entry.selected && !safeText(entry.note)) {
    return "";
  }
  if (!entry.selected) {
    return "does_not_fit";
  }
  const match = RELATION_CHOICES.find(
    (choice) => choice.storedRelation === entry.relation
  );
  return match?.id || "supports";
}

export function getConnectEvidencePhase({
  workingEvidence = [],
  evidenceConnections = {},
  minimum = CONNECT_MINIMUM,
} = {}) {
  const workingIds = workingEvidence.map((item) => item.id);
  const readyFlags = workingEvidence.map((item) =>
    isValidExplainedConnection(evidenceConnections[item.id])
  );
  const validCount = readyFlags.filter(Boolean).length;

  let activeIndex = -1;
  for (let i = 0; i < workingEvidence.length; i += 1) {
    if (!readyFlags[i]) {
      activeIndex = i;
      break;
    }
  }

  const showQuote1 = workingEvidence.length > 0;
  const revealQuote2 = workingEvidence.length > 1 && readyFlags[0];
  const showQuote2 = revealQuote2;
  const showReview = validCount >= minimum;
  const canContinue = validCount >= minimum;

  let primaryPhase = "quote1";
  if (showReview) {
    primaryPhase = "review";
  } else if (revealQuote2 && activeIndex >= 1) {
    primaryPhase = "quote2";
  }

  return {
    primaryPhase,
    workingIds,
    readyFlags,
    validCount,
    activeIndex: showReview ? -1 : activeIndex,
    showQuote1,
    revealQuote2,
    showQuote2,
    showReview,
    canContinue,
    minimum,
  };
}

export function getConnectContinueHint({
  workingEvidence = [],
  evidenceConnections = {},
  activeEvidenceId = "",
  activeUiChoice = "",
  minimum = CONNECT_MINIMUM,
} = {}) {
  const validCount = countValidExplainedConnections(
    evidenceConnections,
    workingEvidence.map((item) => item.id)
  );

  if (workingEvidence.length === 0) {
    return "Add at least two quotations from this group before connecting them to your idea.";
  }

  if (validCount >= minimum) {
    return "";
  }

  const active = evidenceConnections[activeEvidenceId];
  const choice = getRelationChoice(activeUiChoice);

  if (choice && !choice.countsTowardProgress) {
    if (choice.id === "does_not_fit") {
      return CONNECT_BLOCKED_DOES_NOT_FIT;
    }
    return CONNECT_BLOCKED_CHOOSE_RELATION;
  }

  if (!activeUiChoice && !isValidExplainedConnection(active)) {
    if (validCount === 0) {
      return CONNECT_BLOCKED_FIRST_QUOTATION;
    }
    return CONNECT_BLOCKED_COMPLETE_ONE_MORE;
  }

  if (choice?.countsTowardProgress && !isValidExplainedConnection(active)) {
    const noteFeedback = getConnectionNoteFeedback({ note: active?.note });
    return noteFeedback.message;
  }

  if (validCount === 1) {
    return CONNECT_BLOCKED_COMPLETE_ONE_MORE;
  }

  if (validCount === 0) {
    return CONNECT_BLOCKED_FIRST_QUOTATION;
  }

  return `Connect at least ${minimum} quotations to your idea.`;
}

export function getConnectReadyMessage() {
  return CONNECT_READY_MESSAGE;
}

export function getConnectReadyComparisonPrompt() {
  return CONNECT_READY_COMPARISON_PROMPT;
}

export function getConnectReadyFeedback() {
  return {
    quantityMessage: CONNECT_READY_MESSAGE,
    comparisonPrompt: CONNECT_READY_COMPARISON_PROMPT,
  };
}

export function buildConnectionReviewItems({
  workingEvidence = [],
  evidenceConnections = {},
} = {}) {
  return workingEvidence
    .filter((evidence) =>
      isValidExplainedConnection(evidenceConnections[evidence.id])
    )
    .map((evidence) => {
      const connection = evidenceConnections[evidence.id];
      return {
        evidence,
        relation: connection.relation,
        relationLabel: relationLabelForStored(connection.relation),
        note: safeText(connection.note),
      };
    });
}

/**
 * Speech + Letter review layout for the completed synthesis state.
 * Falls back to first two review items when source types are ambiguous.
 */
export function buildCrossConnectionReview({
  workingEvidence = [],
  evidenceConnections = {},
} = {}) {
  const items = buildConnectionReviewItems({
    workingEvidence,
    evidenceConnections,
  });

  const speech =
    items.find((item) => item.evidence?.sourceType === "speech") ||
    items[0] ||
    null;
  const letter =
    items.find(
      (item) =>
        item.evidence?.sourceType === "letter" &&
        item.evidence?.id !== speech?.evidence?.id
    ) ||
    items.find((item) => item.evidence?.id !== speech?.evidence?.id) ||
    null;

  return {
    items,
    speech,
    letter,
    hasBothSources: Boolean(speech && letter),
  };
}

/** Presentation-only: downstream artifacts saved before revisiting an earlier step. */
export function getEarlierPassStageIds({
  currentStep = "",
  claimPreview = "",
  thesisPreview = "",
  stepsBeforeClaim = [],
} = {}) {
  if (!stepsBeforeClaim.includes(currentStep)) {
    return [];
  }

  const ids = [];
  if (safeText(claimPreview)) ids.push("claim");
  if (safeText(thesisPreview)) ids.push("thesis");
  return ids;
}
