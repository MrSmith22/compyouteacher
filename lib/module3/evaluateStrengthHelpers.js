/**
 * Pure helpers for Module 3 evaluate_strength.
 * Maps student-facing readiness choices onto existing ephemeral state:
 * evidenceStrength: weak | developing | strong
 * pathDecision: gather_more_evidence | move_forward | ""
 * gapNote: string
 *
 * Does not mutate evidenceMap or idea artifacts.
 */

import {
  CONNECT_MINIMUM,
  CONNECT_RELATION_VALUES,
  isValidExplainedConnection,
  relationLabelForStored,
} from "./connectEvidenceHelpers.js";

export { CONNECT_MINIMUM, relationLabelForStored };

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

/** Student-facing next-action choices (UI only). */
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
      "Look again at your checklist and your explanations. Ask: Does each note point to a specific word or detail? If not, choose “My explanations need more detail.” If you need a different quotation, choose “I need another quotation.”",
  },
];

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

export function getEvaluateNextAction(id) {
  return EVALUATE_NEXT_ACTIONS.find((action) => action.id === id) || null;
}

/**
 * Valid connected evidence from the selected group only.
 * Orphan IDs and unselected entries do not count.
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
 * Build proof items for display. Pure — does not mutate inputs.
 */
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
    };
  });
}

/**
 * Rule-based checklist. Does not claim intellectual strength of explanations.
 */
export function buildEvaluateChecklist({
  ideaStatement = "",
  selectedClusterEvidence = [],
  evidenceConnections = {},
  minimum = CONNECT_MINIMUM,
} = {}) {
  const connected = getValidConnectedEvidence({
    selectedClusterEvidence,
    evidenceConnections,
  });

  const sourceTypes = new Set(
    connected
      .map((item) => item.sourceType)
      .filter((type) => type === "speech" || type === "letter")
  );

  const allHaveRelation = connected.every((evidence) => {
    const relation = evidenceConnections[evidence.id]?.relation;
    return CONNECT_RELATION_VALUES.includes(relation);
  });

  const allHaveNotes = connected.every((evidence) =>
    safeText(evidenceConnections[evidence.id]?.note)
  );

  const bothSources = sourceTypes.has("speech") && sourceTypes.has("letter");

  return [
    {
      id: "has_idea",
      label: "You have an idea to test.",
      status: safeText(ideaStatement) ? "pass" : "attention",
      kind: "objective",
      detail: safeText(ideaStatement)
        ? "Your developing idea is available to check."
        : "Write or return to your idea before judging support.",
    },
    {
      id: "two_connections",
      label: `You connected at least ${minimum} quotations.`,
      status: connected.length >= minimum ? "pass" : "attention",
      kind: "objective",
      detail:
        connected.length >= minimum
          ? `You have ${connected.length} explained connections.`
          : `You currently have ${connected.length}. Connect at least ${minimum} before building a claim.`,
    },
    {
      id: "has_relations",
      label: "Each selected quotation has a relationship.",
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
      label: "Each selected quotation has a written explanation.",
      status: connected.length >= minimum && allHaveNotes ? "pass" : "attention",
      kind: "objective",
      detail:
        connected.length >= minimum && allHaveNotes
          ? "Each connection includes a note in your own words."
          : "Add a clear explanation for each selected quotation.",
    },
    {
      id: "source_mix",
      label: "Your quotations come from both texts.",
      status: bothSources ? "pass" : "attention",
      kind: "signal",
      detail: bothSources
        ? "You are using both Speech and Letter quotations."
        : "Both quotations come from one text. That can still work—consider whether the other text would strengthen your idea.",
    },
  ];
}

export function getEvaluatePhase({
  checklistAcknowledged = false,
  reflectionChoice = "",
  nextActionId = "",
  evidenceStrength = "",
  pathDecision = "",
  gapNote = "",
} = {}) {
  if (!checklistAcknowledged) {
    return {
      primaryPhase: "checklist",
      showReflection: false,
      showNextAction: false,
      showPathChoice: false,
      showOptionalNote: false,
    };
  }

  if (!safeText(reflectionChoice)) {
    return {
      primaryPhase: "reflection",
      showReflection: true,
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
 * Map a student-facing next action (+ optional path/note) into existing state.
 * Returns a plain patch object; callers apply it. Never mutates evidence.
 */
export function mapEvaluateNextActionToState({
  nextActionId = "",
  pathDecision = "",
  optionalNote = "",
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

  const resolvedPath = action.requiresPathChoice
    ? pathDecision || ""
    : action.pathDecision || "";

  const note = safeText(optionalNote);
  const gapNote = note || action.gapLabel || "";

  return {
    evidenceStrength: action.evidenceStrength,
    pathDecision:
      action.evidenceStrength === "strong" ? "" : resolvedPath,
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
} = {}) {
  if (!safeText(evidenceStrength) || !safeText(gapNote)) {
    return false;
  }
  if (evidenceStrength === "strong") {
    return true;
  }
  return Boolean(pathDecision);
}

export function getEvaluateContinueHint({
  checklistAcknowledged = false,
  reflectionChoice = "",
  nextActionId = "",
  evidenceStrength = "",
  pathDecision = "",
  gapNote = "",
} = {}) {
  if (canContinueFromEvaluate({ evidenceStrength, gapNote, pathDecision })) {
    return "";
  }

  if (!checklistAcknowledged) {
    return "Review the evidence checklist first.";
  }

  if (!safeText(reflectionChoice)) {
    return "Answer the reflection question before choosing your next step.";
  }

  const action = getEvaluateNextAction(nextActionId);

  if (!action || action.id === "not_sure") {
    if (action?.id === "not_sure") {
      return "Choose what your evidence needs next after reviewing the coaching.";
    }
    return "Choose what your evidence needs next.";
  }

  if (action.requiresPathChoice && !pathDecision) {
    return "Choose whether to gather more evidence or move forward.";
  }

  if (!safeText(gapNote)) {
    return "Add a short note about the gap you noticed.";
  }

  if (evidenceStrength && evidenceStrength !== "strong" && !pathDecision) {
    return "Choose whether to gather more evidence or move forward.";
  }

  return "Choose what your evidence needs next.";
}

/**
 * Footer hint when progressive UI state lives inside the step component.
 * Uses only shared ephemeral evaluate fields.
 */
export function getEvaluateFormContinueHint({
  evidenceStrength = "",
  gapNote = "",
  pathDecision = "",
} = {}) {
  if (canContinueFromEvaluate({ evidenceStrength, gapNote, pathDecision })) {
    return "";
  }

  if (!safeText(evidenceStrength)) {
    return "Complete the evidence readiness check before continuing.";
  }

  if (!safeText(gapNote)) {
    return "Add a short note about the gap you noticed.";
  }

  if (evidenceStrength !== "strong" && !pathDecision) {
    return "Choose whether to gather more evidence or move forward.";
  }

  return "Complete the evidence readiness check before continuing.";
}

export function getEvaluateReadyMessage() {
  return "Your evidence check is complete. You’re ready to continue.";
}

/**
 * Snapshot helper for tests: confirms evaluate helpers do not mutate connections.
 */
export function snapshotEvidenceConnections(evidenceConnections = {}) {
  return JSON.parse(JSON.stringify(evidenceConnections || {}));
}
