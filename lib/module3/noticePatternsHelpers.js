/**
 * Pure helpers for Module 3 notice_patterns (pattern noticing).
 * Guided scaffolding is UI-only; persisted notices remain { id, text, evidenceIds }.
 */

/**
 * Guided noticing choices. Recognition before writing: each choice unlocks
 * coaching and a sentence starter, and never writes the observation for the
 * student. The two works never share one generic audience — comparative
 * audience coaching addresses the speech's audience, then the letter's
 * readers, then the comparison.
 */
export const CONNECTION_OPTIONS = [
  {
    id: "strategy",
    label: "Do the quotations use the same rhetorical appeal?",
    coaching:
      "Look for trust-building, emotion, or reasoning that appears across the quotations.",
    starter: "In both quotations, King uses…",
    needsStrategyFollowUp: true,
  },
  {
    id: "different_appeals",
    label: "Does King use different appeals for a similar purpose?",
    coachingSteps: [
      "Which appeal appears in the speech quotation — ethos (trust), pathos (feeling), or logos (reasoning)?",
      "Which appeal appears in the letter quotation?",
      "What broad goal might the two different choices share?",
    ],
    starter: "In the speech King uses…, while in the letter he uses…",
  },
  {
    id: "audience",
    label: "Do they create a similar effect on their different audiences?",
    coachingSteps: [
      "First consider the speech: what might King want the marchers and the watching nation to feel, believe, understand, or do?",
      "Then consider the letter: what might King want the clergymen and other doubtful readers to feel, believe, understand, or do?",
      "Now compare: what is similar or different about the effect King is trying to create?",
    ],
    starter: "The speech’s audience might…, while the letter’s readers might…",
  },
  {
    id: "different_audiences",
    label: "Do they affect their audiences differently because the audiences differ?",
    coachingSteps: [
      "Many marchers already supported the movement and needed hope, unity, or direction.",
      "The clergymen questioned King’s methods and timing.",
      "How might those different starting points explain a difference in King’s choices?",
    ],
    starter: "King tries to move each audience toward…, but…",
  },
  {
    id: "message",
    label: "Do they address the same message, problem, or value?",
    coaching:
      "Name the shared idea in plain words—justice, urgency, hope, patience, dignity.",
    starter: "King returns to the idea that…",
  },
  {
    id: "contrast",
    label: "Do they show an important contrast?",
    coaching: "Name what differs and why that difference still belongs in this group.",
    starter: "One important contrast is…",
  },
  {
    id: "purpose",
    label: "Do they share a broad purpose even though each work has its own immediate goal?",
    coachingSteps: [
      "Both works support civil rights and racial justice. Their immediate goals may differ: the speech can inspire and mobilize, while the letter can defend, explain, and answer criticism.",
      "What do you notice in your selected quotations?",
    ],
    starter: "Both quotations work toward…, even though…",
  },
  {
    id: "unsure",
    label: "I’m not sure yet.",
    coaching:
      "Start with one honest notice. You can revise it. Look for a repeated word, feeling, or purpose.",
    starter: "Both quotations show that…",
  },
];

export const STRATEGY_OPTIONS = [
  {
    id: "ethos",
    label: "Ethos — building trust or credibility",
    coaching: "How does King build trust or credibility in these quotations?",
    starter: "In both quotations, King builds trust by…",
  },
  {
    id: "pathos",
    label: "Pathos — stirring emotion",
    coaching:
      "What similar feeling might these quotations stir in each work’s audience?",
    starter: "In both quotations, King stirs…",
  },
  {
    id: "logos",
    label: "Logos — using logic or reasoning",
    coaching: "What shared reasoning or evidence pattern appears in both quotations?",
    starter: "In both quotations, King uses reasoning to…",
  },
  {
    id: "more_than_one",
    label: "More than one appeal",
    coaching: "Which appeals appear together, and what do they accomplish?",
    starter: "In both quotations, King combines…",
  },
  {
    id: "unsure",
    label: "I'm not sure yet",
    coaching:
      "Look for trust, emotion, or reasoning—even if you are not sure of the label yet.",
    starter: "In both quotations, King uses…",
  },
];

/**
 * Detached context strips were replaced by in-card Form/Audience/Purpose footers.
 * This helper always returns null so callers cannot render the old strips.
 */
export function getPatternSourceContextStrip() {
  return null;
}

/** Neutral coaching shown before any guided lens is selected. */
export const PATTERNS_NO_LENS_COACHING =
  "Choose a question above to help you examine the two quotations from a specific angle.";

export function getConnectionOption(id) {
  return CONNECTION_OPTIONS.find((option) => option.id === id) || null;
}

export function getStrategyOption(id) {
  return STRATEGY_OPTIONS.find((option) => option.id === id) || null;
}

export function getActivePatternCoaching({
  connectionChoice = "",
  strategyChoice = "",
} = {}) {
  const connection = getConnectionOption(connectionChoice);
  if (!connection) {
    return {
      coaching: "",
      coachingSteps: [],
      starter: "",
    };
  }

  if (connection.needsStrategyFollowUp) {
    const strategy = getStrategyOption(strategyChoice);
    if (!strategy) {
      return {
        coaching: connection.coaching || "",
        coachingSteps: connection.coachingSteps || [],
        starter: connection.starter,
        awaitingStrategy: true,
      };
    }
    return {
      coaching: strategy.coaching,
      coachingSteps: [],
      starter: strategy.starter,
      awaitingStrategy: false,
    };
  }

  return {
    coaching: connection.coaching || "",
    coachingSteps: connection.coachingSteps || [],
    starter: connection.starter,
    awaitingStrategy: false,
  };
}

/**
 * Progressive disclosure for notice_patterns.
 * Existing filled notices (resume) unlock later phases without forcing the guided choice again.
 */
export function getNoticePatternsPhase({
  connectionChoice = "",
  strategyChoice = "",
  firstObservationText = "",
  secondObservationText = "",
  filledObservationCount = 0,
} = {}) {
  const connection = getConnectionOption(connectionChoice);
  const resumedPastGuide = filledObservationCount > 0 && !connectionChoice;
  const hasConnection = Boolean(connection) || resumedPastGuide;

  let awaitingStrategy = false;
  if (connection?.needsStrategyFollowUp && !resumedPastGuide) {
    awaitingStrategy = !strategyChoice;
  }

  const showGuidedNoticing = true;
  const showFirstObservation = hasConnection && !awaitingStrategy;
  const showSecondObservation =
    showFirstObservation &&
    (safeText(firstObservationText).length > 0 || filledObservationCount >= 2);
  const showChooseObservation =
    showSecondObservation &&
    (safeText(secondObservationText).length > 0 || filledObservationCount >= 2);

  let primaryPhase = "guide";
  if (showChooseObservation) {
    primaryPhase = "choose";
  } else if (showSecondObservation) {
    primaryPhase = "second";
  } else if (showFirstObservation) {
    primaryPhase = "first";
  } else if (awaitingStrategy) {
    primaryPhase = "strategy";
  }

  return {
    primaryPhase,
    showGuidedNoticing,
    showFirstObservation,
    showSecondObservation,
    showChooseObservation,
    awaitingStrategy,
    hasConnection,
  };
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value == null) {
    return "";
  }
  return String(value).trim();
}

/**
 * Count distinct quotation IDs linked to the chosen observation that still
 * belong to the selected group. Orphan / stale IDs outside the group do not count.
 */
export function countChosenObservationLinks(
  selectedPattern = null,
  groupEvidenceIds = []
) {
  const groupSet = new Set(
    (Array.isArray(groupEvidenceIds) ? groupEvidenceIds : [])
      .map(normalizeId)
      .filter(Boolean)
  );

  const linked = Array.isArray(selectedPattern?.evidenceIds)
    ? selectedPattern.evidenceIds
    : [];

  const distinctInGroup = new Set();
  for (const id of linked) {
    const normalized = normalizeId(id);
    if (normalized && groupSet.has(normalized)) {
      distinctInGroup.add(normalized);
    }
  }

  return distinctInGroup.size;
}

export function getChosenObservationLinkFeedback({
  selectedPattern = null,
  groupEvidenceIds = [],
  quoteMinimum = 2,
} = {}) {
  const linkedCount = countChosenObservationLinks(
    selectedPattern,
    groupEvidenceIds
  );

  if (linkedCount <= 0) {
    return {
      tone: "need_more",
      linkedCount,
      message: "Connect at least two quotations to the observation you chose.",
    };
  }

  if (linkedCount === 1) {
    return {
      tone: "need_more",
      linkedCount,
      message: "Connect one more quotation to the observation you chose.",
    };
  }

  if (linkedCount >= quoteMinimum) {
    return {
      tone: "ready",
      linkedCount,
      message: "Your chosen observation is connected to enough evidence.",
    };
  }

  return {
    tone: "need_more",
    linkedCount,
    message: "Connect at least two quotations to the observation you chose.",
  };
}

export function canContinueFromPatterns({
  filledObservationCount = 0,
  selectedPattern = null,
  groupEvidenceIds = [],
  quoteMinimum = 2,
} = {}) {
  if (filledObservationCount < 2) {
    return false;
  }

  if (!selectedPattern || !safeText(selectedPattern.text)) {
    return false;
  }

  return (
    countChosenObservationLinks(selectedPattern, groupEvidenceIds) >=
    quoteMinimum
  );
}

export function getPatternsContinueHint({
  filledObservationCount = 0,
  selectedPattern = null,
  groupEvidenceIds = [],
  quoteMinimum = 2,
} = {}) {
  if (filledObservationCount < 1) {
    return "Write one possible observation.";
  }

  if (filledObservationCount < 2) {
    return "Add another possible observation.";
  }

  if (!selectedPattern || !safeText(selectedPattern.text)) {
    return "Choose the observation you want to explore.";
  }

  const linkFeedback = getChosenObservationLinkFeedback({
    selectedPattern,
    groupEvidenceIds,
    quoteMinimum,
  });

  if (linkFeedback.tone === "ready") {
    return "";
  }

  return linkFeedback.message;
}
