/**
 * Pure helpers for Module 3 evaluate_strength.
 * Maps student-facing readiness choices onto existing ephemeral state:
 * evidenceStrength: weak | developing | strong
 * pathDecision: gather_more_evidence | move_forward | ""
 * gapNote: string
 *
 * Does not mutate evidenceMap or idea artifacts.
 * Both-works readiness counts valid explained connections only
 * (CONNECT validity: selected + stored relation + trimmed note ≥ 15).
 */

import {
  CONNECT_MINIMUM,
  CONNECT_NOTE_MINIMUM,
  CONNECT_RELATION_VALUES,
  isConnectionNoteReady,
  isValidExplainedConnection,
  relationLabelForStored,
} from "./connectEvidenceHelpers.js";

export { CONNECT_MINIMUM, CONNECT_NOTE_MINIMUM, relationLabelForStored };

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

export const BOTH_WORKS_REQUIREMENT_LABEL =
  "Your essay needs explained evidence from both the speech and the letter.";

export const BOTH_WORKS_SATISFIED_MESSAGE =
  "You have explained evidence from both works.";

export const EVALUATE_READY_MESSAGE =
  "Your evidence check is complete. You have explained evidence from both works and are ready to build a claim.";

export const EVALUATE_COMPARISON_HEADING =
  "Look across your two evidence connections.";

export const EVALUATE_COMPARISON_QUESTION =
  "What do you notice when you consider the speech and letter together?";

export const EVALUATE_COMPARISON_OPTIONS = [
  {
    id: "similarity",
    label: "They show an important similarity.",
  },
  {
    id: "difference",
    label: "They show an important difference.",
  },
  {
    id: "both",
    label: "They show both a similarity and a difference.",
  },
  {
    id: "not_sure",
    label: "I’m not sure yet.",
  },
];

export const EVALUATE_COMPARISON_FOLLOW_UP =
  "Keep that comparison in mind. It will help you decide what claim your evidence can honestly support.";

export const EVALUATE_AUDIENCE_PURPOSE_PROMPT =
  "Could you explain how the different audiences or purposes help account for what you noticed?";

export const EVALUATE_REFLECTION_OPTIONS = [
  {
    id: "specific_yes",
    label: "Yes — my notes point to specific words or details.",
  },
  {
    id: "specific_partial",
    label: "Somewhat — one note is specific, the other is more of a summary.",
  },
  {
    id: "specific_no",
    label: "Not yet — my notes mostly retell the quotations or my idea.",
  },
];

export const EVALUATE_PATH_CHOICES = [
  {
    id: "gather_more_evidence",
    label: "Look for another quotation",
    description: "Fill the gap before stating your point.",
  },
  {
    id: "move_forward",
    label: "Move on with what I have",
    description: "State your point with the support you have.",
  },
];

/** Base next-action definitions (UI only). Labels may be specialized by context. */
export const EVALUATE_NEXT_ACTIONS = [
  {
    id: "need_another_quotation",
    label: "I need another quotation.",
    gapLabel: "I need another quotation.",
    evidenceStrength: "weak",
    pathDecision: "gather_more_evidence",
    requiresPathChoice: false,
    unlocksProgress: true,
    showOptionalNote: true,
    whatComesNext:
      "Next, you’ll look for evidence that fills the gap you identified.",
  },
  {
    id: "explanations_need_detail",
    label: "My explanations need more detail.",
    gapLabel: "My explanations need more detail.",
    evidenceStrength: "developing",
    pathDecision: "",
    requiresPathChoice: true,
    unlocksProgress: true,
    showOptionalNote: true,
    whatComesNext: "",
  },
  {
    id: "connect_two_texts",
    label: "My evidence fits, but I need to connect the two texts.",
    gapLabel: "My evidence fits, but I need to connect the two texts.",
    evidenceStrength: "developing",
    pathDecision: "gather_more_evidence",
    requiresPathChoice: false,
    unlocksProgress: true,
    showOptionalNote: true,
    whatComesNext:
      "Next, you’ll look for evidence that fills the gap you identified.",
  },
  {
    id: "ready_to_claim",
    label: "I’m ready to build a claim.",
    gapLabel: "I’m ready to build a claim.",
    evidenceStrength: "strong",
    pathDecision: "",
    requiresPathChoice: false,
    unlocksProgress: true,
    showOptionalNote: false,
    whatComesNext:
      "Next, you’ll turn this supported idea into a claim you can prove.",
  },
  {
    id: "not_sure",
    label: "I’m not sure—help me check.",
    gapLabel: "",
    evidenceStrength: "",
    pathDecision: "",
    requiresPathChoice: false,
    unlocksProgress: false,
    showOptionalNote: false,
    whatComesNext: "",
    coaching:
      "Look again at your checklist and your explanations. Ask: Does each note point to a specific word or detail? If you are missing a Speech or Letter connection, find that quotation first. If your notes need more detail, choose “My explanations need more detail.”",
  },
];

export function getEvaluateNextAction(id) {
  return EVALUATE_NEXT_ACTIONS.find((action) => action.id === id) || null;
}

/**
 * Valid connected evidence from the selected group only.
 * Orphan IDs, unselected entries, and short notes do not count.
 */
export function getValidConnectedEvidence({
  selectedClusterEvidence = [],
  evidenceConnections = {},
} = {}) {
  return (selectedClusterEvidence || []).filter((evidence) =>
    isValidExplainedConnection(evidenceConnections[evidence?.id])
  );
}

/**
 * Both-works readiness from valid explained connections only —
 * not from group composition alone.
 */
export function getBothWorksEvidenceStatus({
  selectedClusterEvidence = [],
  evidenceConnections = {},
} = {}) {
  const connected = getValidConnectedEvidence({
    selectedClusterEvidence,
    evidenceConnections,
  });

  const hasSpeech = connected.some((item) => item.sourceType === "speech");
  const hasLetter = connected.some((item) => item.sourceType === "letter");
  const bothWorksReady = hasSpeech && hasLetter;

  let missingSource = null;
  if (!bothWorksReady) {
    if (hasSpeech && !hasLetter) missingSource = "letter";
    else if (hasLetter && !hasSpeech) missingSource = "speech";
    else if (!hasSpeech && !hasLetter) missingSource = "both";
  }

  let statusMessage = BOTH_WORKS_SATISFIED_MESSAGE;
  let readyChoiceBlockedMessage = "";
  let repairActionLabel = "";
  let repairGapNote = "";

  if (missingSource === "letter") {
    statusMessage =
      "You have explained evidence from the speech, but you still need a connected quotation from the letter.";
    readyChoiceBlockedMessage =
      "Not available yet — your claim will need evidence from the letter as well as the speech.";
    repairActionLabel = "Find evidence from the letter.";
    repairGapNote = "Find one connected quotation from the letter before moving forward.";
  } else if (missingSource === "speech") {
    statusMessage =
      "You have explained evidence from the letter, but you still need a connected quotation from the speech.";
    readyChoiceBlockedMessage =
      "Not available yet — your claim will need evidence from the speech as well as the letter.";
    repairActionLabel = "Find evidence from the speech.";
    repairGapNote = "Find one connected quotation from the speech before moving forward.";
  } else if (missingSource === "both") {
    statusMessage =
      "Your essay needs explained evidence from both the speech and the letter.";
    readyChoiceBlockedMessage =
      "Not available yet — your claim will need explained evidence from both the speech and the letter.";
    repairActionLabel = "Find evidence from both works.";
    repairGapNote =
      "Your essay needs explained evidence from both works before you build a claim.";
  }

  return {
    connected,
    connectedCount: connected.length,
    hasSpeech,
    hasLetter,
    bothWorksReady,
    missingSource,
    requirementLabel: BOTH_WORKS_REQUIREMENT_LABEL,
    statusMessage,
    readyChoiceBlockedMessage,
    repairActionLabel,
    repairGapNote,
  };
}

/**
 * Student-facing next actions with both-works gating and source-aware repair.
 */
export function getEvaluateNextActionsForContext({
  bothWorksReady = false,
  missingSource = null,
} = {}) {
  const readyBlockedMessage =
    missingSource === "letter"
      ? "Not available yet — your claim will need evidence from the letter as well as the speech."
      : missingSource === "speech"
        ? "Not available yet — your claim will need evidence from the speech as well as the letter."
        : "Not available yet — your claim will need explained evidence from both the speech and the letter.";

  return EVALUATE_NEXT_ACTIONS.map((action) => {
    if (action.id === "ready_to_claim") {
      return {
        ...action,
        available: bothWorksReady,
        blockedMessage: bothWorksReady ? "" : readyBlockedMessage,
        isDominantRepair: false,
      };
    }

    if (action.id === "need_another_quotation" && missingSource === "letter") {
      return {
        ...action,
        available: true,
        label: "Find evidence from the letter.",
        gapLabel:
          "Find one connected quotation from the letter before moving forward.",
        blockedMessage: "",
        isDominantRepair: true,
      };
    }

    if (action.id === "need_another_quotation" && missingSource === "speech") {
      return {
        ...action,
        available: true,
        label: "Find evidence from the speech.",
        gapLabel:
          "Find one connected quotation from the speech before moving forward.",
        blockedMessage: "",
        isDominantRepair: true,
      };
    }

    return {
      ...action,
      available: true,
      blockedMessage: "",
      isDominantRepair: false,
    };
  });
}

/**
 * Path choices after “explanations need more detail.”
 * move_forward cannot bypass the both-works requirement.
 */
export function getEvaluatePathChoicesForContext({ bothWorksReady = false } = {}) {
  return EVALUATE_PATH_CHOICES.map((choice) => {
    if (choice.id === "move_forward" && !bothWorksReady) {
      return {
        ...choice,
        available: false,
        blockedMessage:
          "Not available yet — your essay needs explained evidence from both works before you build a claim.",
      };
    }
    return {
      ...choice,
      available: true,
      blockedMessage: "",
    };
  });
}

export function buildEvaluateProofItems({
  selectedClusterEvidence = [],
  evidenceConnections = {},
} = {}) {
  return getValidConnectedEvidence({
    selectedClusterEvidence,
    evidenceConnections,
  }).map((evidence) => {
    const connection = evidenceConnections[evidence.id] || {};
    return {
      evidence,
      relation: connection.relation,
      relationLabel: relationLabelForStored(connection.relation),
      note: safeText(connection.note),
      sourceType: evidence.sourceType,
    };
  });
}

/**
 * Separate Speech and Letter proof cards for the readiness dashboard.
 */
export function buildEvaluateSourceProofCards({
  selectedClusterEvidence = [],
  evidenceConnections = {},
} = {}) {
  const items = buildEvaluateProofItems({
    selectedClusterEvidence,
    evidenceConnections,
  });
  const speech =
    items.find((item) => item.evidence?.sourceType === "speech") || null;
  const letter =
    items.find(
      (item) =>
        item.evidence?.sourceType === "letter" &&
        item.evidence?.id !== speech?.evidence?.id
    ) || null;

  return { items, speech, letter };
}

/**
 * Rule-based checklist. Both-works is an objective requirement.
 * Does not claim intellectual strength of explanations.
 */
export function buildEvaluateChecklist({
  ideaStatement = "",
  selectedClusterEvidence = [],
  evidenceConnections = {},
  minimum = CONNECT_MINIMUM,
} = {}) {
  const bothWorks = getBothWorksEvidenceStatus({
    selectedClusterEvidence,
    evidenceConnections,
  });
  const connected = bothWorks.connected;

  const allHaveRelation = connected.every((evidence) => {
    const relation = evidenceConnections[evidence.id]?.relation;
    return CONNECT_RELATION_VALUES.includes(relation);
  });

  const allHaveNotes = connected.every((evidence) =>
    isConnectionNoteReady(evidenceConnections[evidence.id]?.note)
  );

  return [
    {
      id: "has_idea",
      label: "You have a developing idea.",
      status: safeText(ideaStatement) ? "pass" : "attention",
      kind: "objective",
      detail: safeText(ideaStatement)
        ? "Your developing idea is available to check."
        : "Write or return to your idea before judging support.",
    },
    {
      id: "two_connections",
      label: `You have at least ${minimum} valid explained evidence connections.`,
      status: connected.length >= minimum ? "pass" : "attention",
      kind: "objective",
      detail:
        connected.length >= minimum
          ? `You have ${connected.length} explained connections.`
          : `You currently have ${connected.length}. Connect at least ${minimum} before building a claim.`,
    },
    {
      id: "has_relations",
      label: "Each valid connection has a stored relationship.",
      status:
        connected.length >= minimum && allHaveRelation ? "pass" : "attention",
      kind: "objective",
      detail:
        connected.length >= minimum && allHaveRelation
          ? "Each connection names how the quotation relates to the idea."
          : "Choose supports, complicates, or sharpens for each connection.",
    },
    {
      id: "has_explanations",
      label: `Each valid connection has an explanation (at least ${CONNECT_NOTE_MINIMUM} characters).`,
      status: connected.length >= minimum && allHaveNotes ? "pass" : "attention",
      kind: "objective",
      detail:
        connected.length >= minimum && allHaveNotes
          ? "Each connection includes a clear note in your own words."
          : "Add a clear explanation for each selected quotation.",
    },
    {
      id: "source_mix",
      label: BOTH_WORKS_REQUIREMENT_LABEL,
      status: bothWorks.bothWorksReady ? "pass" : "attention",
      kind: "objective",
      detail: bothWorks.statusMessage,
    },
  ];
}

export function getEvaluatePhase({
  checklistAcknowledged = false,
  reflectionChoice = "",
  comparisonChoice = "",
  nextActionId = "",
  evidenceStrength = "",
  pathDecision = "",
  gapNote = "",
} = {}) {
  if (!checklistAcknowledged) {
    return {
      primaryPhase: "checklist",
      showReflection: false,
      showComparison: false,
      showNextAction: false,
      showPathChoice: false,
      showOptionalNote: false,
    };
  }

  if (!safeText(reflectionChoice)) {
    return {
      primaryPhase: "reflection",
      showReflection: true,
      showComparison: false,
      showNextAction: false,
      showPathChoice: false,
      showOptionalNote: false,
    };
  }

  if (!safeText(comparisonChoice)) {
    return {
      primaryPhase: "comparison",
      showReflection: true,
      showComparison: true,
      showNextAction: false,
      showPathChoice: false,
      showOptionalNote: false,
    };
  }

  const action = getEvaluateNextAction(nextActionId);
  const showPathChoice = Boolean(action?.requiresPathChoice);
  const showOptionalNote = Boolean(action?.showOptionalNote);

  return {
    primaryPhase: action?.unlocksProgress ? "decision" : "next_action",
    showReflection: true,
    showComparison: true,
    showNextAction: true,
    showPathChoice,
    showOptionalNote,
    action,
    evidenceStrength,
    pathDecision,
    gapNote,
  };
}

/**
 * Map a student-facing next action into existing ephemeral state.
 * Hard-gates ready_to_claim and move_forward behind both-works readiness.
 */
export function mapEvaluateNextActionToState({
  nextActionId = "",
  pathDecision = "",
  optionalNote = "",
  bothWorksReady = false,
  missingSource = null,
} = {}) {
  const action = getEvaluateNextAction(nextActionId);
  if (!action) {
    return {
      evidenceStrength: "",
      pathDecision: "",
      gapNote: "",
      unlocksProgress: false,
    };
  }

  if (!action.unlocksProgress) {
    return {
      evidenceStrength: "",
      pathDecision: "",
      gapNote: "",
      unlocksProgress: false,
      coaching: action.coaching || "",
    };
  }

  if (action.id === "ready_to_claim" && !bothWorksReady) {
    return {
      evidenceStrength: "",
      pathDecision: "",
      gapNote: "",
      unlocksProgress: false,
      blocked: true,
      blockedMessage:
        missingSource === "letter"
          ? "Not available yet — your claim will need evidence from the letter as well as the speech."
          : missingSource === "speech"
            ? "Not available yet — your claim will need evidence from the speech as well as the letter."
            : "Your essay needs explained evidence from both works before you build a claim.",
    };
  }

  let resolvedPath = action.requiresPathChoice
    ? pathDecision || ""
    : action.pathDecision || "";

  if (resolvedPath === "move_forward" && !bothWorksReady) {
    return {
      evidenceStrength: action.evidenceStrength || "developing",
      pathDecision: "",
      gapNote:
        safeText(optionalNote) ||
        action.gapLabel ||
        "Your essay needs explained evidence from both works before you build a claim.",
      unlocksProgress: false,
      blocked: true,
      blockedMessage:
        "Not available yet — your essay needs explained evidence from both works before you build a claim.",
    };
  }

  const specializedActions = getEvaluateNextActionsForContext({
    bothWorksReady,
    missingSource,
  });
  const specialized = specializedActions.find((item) => item.id === action.id);
  const note = safeText(optionalNote);
  const gapNote = note || specialized?.gapLabel || action.gapLabel || "";

  return {
    evidenceStrength: action.evidenceStrength,
    pathDecision: action.evidenceStrength === "strong" ? "" : resolvedPath,
    gapNote,
    unlocksProgress: true,
    whatComesNext:
      action.evidenceStrength === "strong"
        ? action.whatComesNext
        : resolvedPath === "gather_more_evidence"
          ? "Next, you’ll look for evidence that fills the gap you identified."
          : resolvedPath === "move_forward"
            ? "Next, you’ll turn this supported idea into a claim you can prove."
            : action.whatComesNext,
  };
}

export function canContinueFromEvaluate({
  evidenceStrength = "",
  gapNote = "",
  pathDecision = "",
  bothWorksReady = false,
} = {}) {
  if (!safeText(evidenceStrength) || !safeText(gapNote)) {
    return false;
  }
  if (evidenceStrength === "strong") {
    return bothWorksReady === true;
  }
  if (pathDecision === "move_forward" && !bothWorksReady) {
    return false;
  }
  return Boolean(pathDecision);
}

export function getEvaluateContinueHint({
  checklistAcknowledged = false,
  reflectionChoice = "",
  comparisonChoice = "",
  nextActionId = "",
  evidenceStrength = "",
  pathDecision = "",
  gapNote = "",
  bothWorksReady = false,
  missingSource = null,
} = {}) {
  if (
    canContinueFromEvaluate({
      evidenceStrength,
      gapNote,
      pathDecision,
      bothWorksReady,
    })
  ) {
    return "";
  }

  if (!checklistAcknowledged) {
    return "Review the evidence checklist first.";
  }

  if (!safeText(reflectionChoice)) {
    return "Answer the explanation question before choosing your next step.";
  }

  if (!safeText(comparisonChoice)) {
    return "Look across the speech and letter before choosing your next step.";
  }

  const action = getEvaluateNextAction(nextActionId);

  if (!action || action.id === "not_sure") {
    if (action?.id === "not_sure") {
      return "Choose what your evidence needs next after reviewing the coaching.";
    }
    return "Choose what your evidence needs next.";
  }

  if (action.id === "ready_to_claim" && !bothWorksReady) {
    if (missingSource === "letter") {
      return "Find one connected quotation from the letter before moving forward.";
    }
    if (missingSource === "speech") {
      return "Find one connected quotation from the speech before moving forward.";
    }
    return "Your essay needs explained evidence from both works before you build a claim.";
  }

  if (action.requiresPathChoice && !pathDecision) {
    return "Choose whether to gather more evidence or revise your explanation.";
  }

  if (pathDecision === "move_forward" && !bothWorksReady) {
    return "Your essay needs explained evidence from both works before you build a claim.";
  }

  if (!safeText(gapNote) && action.showOptionalNote) {
    // Optional note is optional — don't block on it when gapLabel fills gapNote
  }

  if (evidenceStrength && evidenceStrength !== "strong" && !pathDecision) {
    if (action.requiresPathChoice) {
      return "Choose whether to gather more evidence or revise your explanation.";
    }
  }

  if (!safeText(evidenceStrength)) {
    return "Choose what your evidence needs next.";
  }

  return "Choose what your evidence needs next.";
}

/**
 * Footer hint when progressive UI state lives inside the step component.
 */
export function getEvaluateFormContinueHint({
  evidenceStrength = "",
  gapNote = "",
  pathDecision = "",
  bothWorksReady = false,
  missingSource = null,
} = {}) {
  if (
    canContinueFromEvaluate({
      evidenceStrength,
      gapNote,
      pathDecision,
      bothWorksReady,
    })
  ) {
    return "";
  }

  if (!safeText(evidenceStrength)) {
    return "Complete the evidence readiness check before continuing.";
  }

  if (evidenceStrength === "strong" && !bothWorksReady) {
    if (missingSource === "letter") {
      return "Find one connected quotation from the letter before moving forward.";
    }
    if (missingSource === "speech") {
      return "Find one connected quotation from the speech before moving forward.";
    }
    return "Your essay needs explained evidence from both works before you build a claim.";
  }

  if (pathDecision === "move_forward" && !bothWorksReady) {
    return "Your essay needs explained evidence from both works before you build a claim.";
  }

  if (!safeText(gapNote)) {
    return "Add a short note about the gap you noticed.";
  }

  if (evidenceStrength !== "strong" && !pathDecision) {
    return "Choose whether to gather more evidence or revise your explanation.";
  }

  return "Complete the evidence readiness check before continuing.";
}

export function getEvaluateReadyMessage({ bothWorksReady = true } = {}) {
  if (!bothWorksReady) {
    return "Your essay needs explained evidence from both works before you build a claim.";
  }
  return EVALUATE_READY_MESSAGE;
}

/** Artifact-chain readiness previews (presentation only). */
export const READINESS_LABEL_CHECKING = "Checking support";
export const READINESS_LABEL_COMPLETED = "Evidence check completed";
export const READINESS_LABEL_NEEDS_CHECK = "Needs another check";
export const READINESS_LABEL_GATHERING = "Gathering more evidence";
export const READINESS_LABEL_FILLING_GAP = "Filling an evidence gap";
export const READINESS_LABEL_READY = "Ready to continue";

/**
 * Derive the artifact-chain Readiness preview from current valid evidence
 * and the student’s phase — not solely from ephemeral EVALUATE radios.
 *
 * CLAIM/THESIS: both-works readiness from valid connections decides
 * "Evidence check completed" vs "Needs another check".
 * EVALUATE: shows checking / gap / ready based on current state.
 * Does not mutate claim, thesis, or evidence.
 */
export function getArtifactChainReadinessLabel({
  currentStep = "",
  bothWorksReady,
  evidenceStrength = "",
  pathDecision = "",
  gapNote = "",
  selectedClusterEvidence = [],
  evidenceConnections = {},
} = {}) {
  const step = typeof currentStep === "string" ? currentStep : "";

  const bothWorks =
    typeof bothWorksReady === "boolean"
      ? bothWorksReady
      : getBothWorksEvidenceStatus({
          selectedClusterEvidence,
          evidenceConnections,
        }).bothWorksReady;

  if (step === "gather_more_evidence") {
    return READINESS_LABEL_GATHERING;
  }

  if (step === "develop_claim" || step === "turn_claim_into_thesis") {
    return bothWorks ? READINESS_LABEL_COMPLETED : READINESS_LABEL_NEEDS_CHECK;
  }

  if (step === "evaluate_strength") {
    const evaluateComplete = canContinueFromEvaluate({
      evidenceStrength,
      gapNote,
      pathDecision,
      bothWorksReady: bothWorks,
    });

    if (evaluateComplete) {
      if (pathDecision === "gather_more_evidence") {
        return READINESS_LABEL_FILLING_GAP;
      }
      if (evidenceStrength === "strong" || pathDecision === "move_forward") {
        return bothWorks ? READINESS_LABEL_READY : READINESS_LABEL_NEEDS_CHECK;
      }
    }

    return READINESS_LABEL_CHECKING;
  }

  return "";
}

/**
 * GATHER presentation based on EVALUATE gap — no new routes or schema.
 */
export function getGatherFocusModel({
  gapNote = "",
  selectedClusterEvidence = [],
  evidenceConnections = {},
  ideaStatement = "",
} = {}) {
  const bothWorks = getBothWorksEvidenceStatus({
    selectedClusterEvidence,
    evidenceConnections,
  });
  const gap = safeText(gapNote).toLowerCase();

  const isExplanationGap =
    gap.includes("explanations need more detail") ||
    gap.includes("revise your explanation");

  const isComparisonGap =
    gap.includes("connect the two texts") ||
    gap.includes("comparison") ||
    gap.includes("audience") ||
    gap.includes("purpose");

  let missingSource = bothWorks.missingSource;
  if (missingSource === "both") {
    missingSource = "letter";
  }

  if (isExplanationGap) {
    return {
      mode: "revise_explanation",
      missingSource: null,
      defaultSourceFilter: "all",
      heading: "Revise an explanation that still needs more detail.",
      coaching:
        "You do not need a brand-new quotation yet. Return to the connection that is too thin and point to a specific word or detail that helps your idea.",
      ideaStatement: safeText(ideaStatement),
      existingOtherConnection: null,
      gapNote: safeText(gapNote),
      showSourceShelf: false,
    };
  }

  if (
    !isExplanationGap &&
    (missingSource === "letter" ||
      gap.includes("letter") ||
      bothWorks.missingSource === "letter")
  ) {
    const other =
      bothWorks.connected.find((item) => item.sourceType === "speech") || null;
    return {
      mode: "find_missing_source",
      missingSource: "letter",
      defaultSourceFilter: "letter",
      heading: "Find one Letter quotation that can help test your idea.",
      coaching:
        "You already have explained evidence from the Speech. Now find a Letter quotation that supports, complicates, or sharpens the same developing idea.",
      ideaStatement: safeText(ideaStatement),
      existingOtherConnection: other,
      gapNote: safeText(gapNote) || bothWorks.repairGapNote,
      showSourceShelf: true,
    };
  }

  if (
    !isExplanationGap &&
    (missingSource === "speech" ||
      gap.includes("speech") ||
      bothWorks.missingSource === "speech")
  ) {
    const other =
      bothWorks.connected.find((item) => item.sourceType === "letter") || null;
    return {
      mode: "find_missing_source",
      missingSource: "speech",
      defaultSourceFilter: "speech",
      heading: "Find one Speech quotation that can help test your idea.",
      coaching:
        "You already have explained evidence from the Letter. Now find a Speech quotation that supports, complicates, or sharpens the same developing idea.",
      ideaStatement: safeText(ideaStatement),
      existingOtherConnection: other,
      gapNote: safeText(gapNote) || bothWorks.repairGapNote,
      showSourceShelf: true,
    };
  }

  if (isComparisonGap) {
    return {
      mode: "comparison_gap",
      missingSource: bothWorks.missingSource,
      defaultSourceFilter: bothWorks.missingSource === "speech" ? "speech" : bothWorks.missingSource === "letter" ? "letter" : "all",
      heading: "Strengthen the connection between the two texts.",
      coaching:
        safeText(gapNote) ||
        "Look for a quotation that helps you explain a similarity or difference between the speech and the letter.",
      ideaStatement: safeText(ideaStatement),
      existingOtherConnection: bothWorks.connected[0] || null,
      gapNote: safeText(gapNote),
      showSourceShelf: true,
    };
  }

  return {
    mode: "general_gap",
    missingSource: bothWorks.missingSource,
    defaultSourceFilter: "all",
    heading: "Find evidence that fills the gap you noticed.",
    coaching:
      "Don’t grab random quotations. Look for ones that answer the exact weakness you named.",
    ideaStatement: safeText(ideaStatement),
    existingOtherConnection: bothWorks.connected[0] || null,
    gapNote: safeText(gapNote),
    showSourceShelf: true,
  };
}

/**
 * Snapshot helper for tests: confirms evaluate helpers do not mutate connections.
 */
export function snapshotEvidenceConnections(evidenceConnections = {}) {
  return JSON.parse(JSON.stringify(evidenceConnections || {}));
}
