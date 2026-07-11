/**
 * Pure helpers for Module 3 connect_evidence.
 * Preserves evidenceMap shape: { selected, relation, note }.
 * Stored relation values remain: supports | complicates | sharpens.
 */

export const CONNECT_RELATION_VALUES = ["supports", "complicates", "sharpens"];
export const CONNECT_MINIMUM = 2;

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

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
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

  // Recovery: keep any valid pattern-linked quotes, student can add from group.
  return {
    workingEvidence: fromPattern,
    source: fromPattern.length > 0 ? "pattern_partial" : "empty",
    needsRecovery: true,
  };
}

export function isValidExplainedConnection(entry) {
  if (!entry || typeof entry !== "object") return false;
  if (!entry.selected) return false;
  if (!safeText(entry.note)) return false;
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

/**
 * Map a UI relation choice into a persistence-safe evidenceMap patch.
 * does_not_fit / unsure do not create progress-counting connections.
 */
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
  const showQuote2 =
    workingEvidence.length > 1 && (readyFlags[0] || validCount >= 1);
  // Reveal quote 2 after quote 1 is ready OR if quote 1 already ready on resume
  const revealQuote2 = workingEvidence.length > 1 && readyFlags[0];
  const showReview = validCount >= minimum;
  const canContinue = validCount >= minimum;

  let primaryPhase = "quote";
  if (showReview) {
    primaryPhase = "review";
  } else if (revealQuote2 && activeIndex >= 1) {
    primaryPhase = "quote2";
  } else {
    primaryPhase = "quote1";
  }

  return {
    primaryPhase,
    workingIds,
    readyFlags,
    validCount,
    activeIndex: showReview ? -1 : activeIndex,
    showQuote1,
    revealQuote2,
    showQuote2: revealQuote2,
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
      return "This quotation will not count yet. Choose another relationship or add a different quotation from this group.";
    }
    return "Choose a relationship before writing the explanation.";
  }

  if (!activeUiChoice && !isValidExplainedConnection(active)) {
    if (validCount === 0) {
      return "Explain how the first quotation relates to your idea.";
    }
    return "Complete one more quotation connection.";
  }

  if (choice?.countsTowardProgress && !safeText(active?.note)) {
    return "Write a clear connection note for this quotation.";
  }

  if (validCount === 1) {
    return "Complete one more quotation connection.";
  }

  if (validCount === 0) {
    return "Explain how the first quotation relates to your idea.";
  }

  return `Connect at least ${minimum} quotations to your idea.`;
}

export function getConnectReadyMessage() {
  return "You have enough explained evidence to evaluate your support.";
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
