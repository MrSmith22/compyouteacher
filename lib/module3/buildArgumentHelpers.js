/**
 * Pure helpers for Module 3 CLAIM / THESIS (build-argument workspace).
 *
 * Displays valid connected evidence as a proof dashboard and maps student
 * work onto the existing claim/thesis artifact shapes without inventing
 * new analysis.
 *
 * supportRationale compatibility:
 * - Existing nonempty supportRationale is preserved forever.
 * - For a new claim, a compatibility string is derived ONLY from the
 *   student's own saved connection notes (no AI, no rewriting).
 * - The derived string is not presented as a new answer on this screen.
 */

import {
  CONNECT_RELATION_VALUES,
  isValidExplainedConnection,
  relationLabelForStored,
} from "./connectEvidenceHelpers.js";
import { getArtifactChainStageForStep } from "./moduleThreePhaseModel.js";

export { relationLabelForStored };

export const CLAIM_MINIMUM = 10;
export const THESIS_MINIMUM = 10;
export const PROOF_PLAN_MINIMUM = 1;
export const PROOF_PLAN_SLOTS = 3;

/** Student-facing relationship labels for the evidence dashboard. */
export const ARGUMENT_RELATION_LABELS = {
  supports: "Supports the idea",
  complicates: "Complicates the idea",
  sharpens: "Sharpens the idea",
};

/** Assignment-specific claim framing (coaching only — not a separate field). */
export const CLAIM_ASSIGNMENT_FOCUS_LINE =
  "For this essay, your claim should make a point about how King uses a rhetorical appeal—and how the speech and letter are similar or different.";

export const CLAIM_APPEAL_DEFINITION =
  "A rhetorical appeal means ethos (trust), pathos (feeling), or logos (reasoning).";

export const CLAIM_STARTERS_LABEL = "Ways to begin—not required shapes.";

/**
 * Optional claim starters. Never auto-fill the claim field.
 * The final open starter keeps room for valid interpretations outside the
 * comparison templates.
 */
export const CLAIM_SENTENCE_STARTERS = [
  "In both works, King uses ___ to…, but…",
  "King uses ___ differently in the speech and the letter because…",
  "Although both texts use ___, the effect changes because the audience…",
  "King adapts ___ to each audience by…",
  "The speech relies on ___ while the letter relies on ___ because…",
  "Together, these quotations show that…",
];

/** Open-ended starter index — remains available outside comparison templates. */
export const CLAIM_OPEN_STARTER_INDEX = CLAIM_SENTENCE_STARTERS.length - 1;

export const CLAIM_LEADING_QUESTIONS = [
  "Which rhetorical appeal or appeals appear in your evidence?",
  "What is similar or different about how King uses them in the two works?",
  "How might the different audiences or purposes explain that similarity or difference?",
  "What point can these specific quotations honestly help you prove?",
  "Does your statement answer the assignment rather than merely describe the texts?",
];

export const CLAIM_JOB_HEADLINE =
  "Build a statement that answers the assignment question using your developing idea and evidence.";

export const CLAIM_JOB_STEPS = [
  "Reread the assignment question.",
  "Look at your developing idea.",
  "Read your quotations and explanations together.",
  "State one answer to the assignment question that this evidence can defend.",
];

export const CLAIM_FIELD_INTRO =
  "Now answer the assignment question in one statement your evidence can support.";

export const CLAIM_FIELD_REMINDER =
  "You are bringing together the prompt, your developing idea, and the evidence shown above.";

/** Instructional self-check only — not five hard gates or semantic grading. */
export const CLAIM_SELF_CHECK_ITEMS = [
  "My claim answers the assignment question.",
  "My claim names or clearly identifies a rhetorical appeal.",
  "My claim makes a point about the speech and the letter.",
  "My displayed evidence could help me prove it.",
  "My claim goes beyond summarizing what King says.",
];

export const THESIS_MOVE_EXPLANATION =
  "Your claim states the supported point. Your thesis sharpens that point into the sentence that will guide the essay.";

export const THESIS_STARTERS_LABEL = "Optional ways to begin—not required shapes.";

/** Optional thesis starters. Never auto-fill the thesis field. */
export const THESIS_SENTENCE_STARTERS = [
  "Although King uses ___ in both works, he…",
  "King adapts ___ in the speech and letter because their audiences…",
  "While the speech uses ___ to…, the letter uses ___ to…",
  "In both works, King…, but the difference in audience causes…",
  "King’s use of ___ shows that…",
];

export const THESIS_LEADING_QUESTIONS = [
  "Does my thesis clearly answer the assignment question?",
  "Does it compare or contrast the speech and letter?",
  "Does it identify the rhetorical appeal or appeals I will analyze?",
  "Does it connect King’s choices to audience or purpose?",
  "Can the displayed evidence help me prove it?",
];

export const THESIS_JOB_HEADLINE =
  "Sharpen your claim into one clear thesis sentence that still answers the assignment question.";

export const ARGUMENT_THINKING_PATH = [
  "Assignment question",
  "Your developing idea",
  "Your quotations and explanations",
  "The point you can prove",
];

/** Presentation labels only — storage remains three strings; minimum unchanged. */
export const PROOF_PLAN_LABELS = [
  "What I’ll show about King’s rhetorical choices in the speech…",
  "What I’ll show about King’s rhetorical choices in the letter…",
  "The important similarity or difference—and how audience or purpose helps explain it…",
];

export const PROOF_PLAN_FRAMING =
  "These are the parts your essay may need to prove. They are planning notes, not paragraph headings or sentences that will automatically appear in your essay.";

export const PROOF_PLAN_REVIEW_GUIDANCE =
  "Review each saved planning note and make sure it answers the label above it. If an earlier note belongs somewhere else, move or revise it before continuing.";

export const PROOF_PLAN_EARLIER_PASS_MESSAGE =
  "These notes were saved from an earlier pass. Their wording has been preserved.";

/**
 * Presentation helpers for proof-plan fields.
 * Never rewrites, reorders, classifies, or deletes student strings.
 */
export function getProofPlanPresentation({ proofPlan = [] } = {}) {
  const plan = Array.isArray(proofPlan) ? proofPlan.map((line) => line) : ["", "", ""];
  while (plan.length < PROOF_PLAN_SLOTS) {
    plan.push("");
  }
  const preservedExact = plan.slice(0, PROOF_PLAN_SLOTS);
  const hasSavedContent = filledProofPlanCount(preservedExact) > 0;

  return {
    labels: [...PROOF_PLAN_LABELS],
    framing: PROOF_PLAN_FRAMING,
    reviewGuidance: PROOF_PLAN_REVIEW_GUIDANCE,
    earlierPassMessage: hasSavedContent ? PROOF_PLAN_EARLIER_PASS_MESSAGE : "",
    showEarlierPassMessage: hasSavedContent,
    slots: PROOF_PLAN_SLOTS,
    minimum: PROOF_PLAN_MINIMUM,
    /** Exact preserved strings in original slot order — never reordered. */
    preservedPlan: preservedExact,
  };
}

/**
 * Presentation contract for the assignment question in CLAIM/THESIS.
 * The full prompt is always prominent (never a collapsed secondary disclosure).
 */
export function getAssignmentQuestionPresentation({
  mode = "claim",
  assignmentPrompt = "",
} = {}) {
  const prompt = typeof assignmentPrompt === "string" ? assignmentPrompt : "";
  return {
    mode: mode === "thesis" ? "thesis" : "claim",
    visible: Boolean(safeText(prompt)),
    collapsed: false,
    duplicatedInDisclosure: false,
    placement: "after_headline_before_dashboard",
    heading: "Return to the assignment question",
    coaching:
      mode === "thesis"
        ? "Your thesis should still answer this question while sharpening the supported point from your claim."
        : "Your claim should answer this question using the developing idea and evidence you built.",
    prompt,
    thinkingPath: [...ARGUMENT_THINKING_PATH],
  };
}

export function getClaimJobCoaching() {
  return {
    headline: CLAIM_JOB_HEADLINE,
    assignmentFocusLine: CLAIM_ASSIGNMENT_FOCUS_LINE,
    appealDefinition: CLAIM_APPEAL_DEFINITION,
    steps: [...CLAIM_JOB_STEPS],
    leadingQuestions: [...CLAIM_LEADING_QUESTIONS],
    fieldIntro: CLAIM_FIELD_INTRO,
    fieldReminder: CLAIM_FIELD_REMINDER,
    startersLabel: CLAIM_STARTERS_LABEL,
    sentenceStarters: [...CLAIM_SENTENCE_STARTERS],
    openStarter: CLAIM_SENTENCE_STARTERS[CLAIM_OPEN_STARTER_INDEX],
    selfCheckItems: [...CLAIM_SELF_CHECK_ITEMS],
    startersAutoFill: false,
    startersRequired: false,
    selfCheckIsHardGate: false,
    synthesizesPromptIdeaEvidence: true,
  };
}

export function getThesisJobCoaching() {
  return {
    headline: THESIS_JOB_HEADLINE,
    moveExplanation: THESIS_MOVE_EXPLANATION,
    leadingQuestions: [...THESIS_LEADING_QUESTIONS],
    startersLabel: THESIS_STARTERS_LABEL,
    sentenceStarters: [...THESIS_SENTENCE_STARTERS],
    startersAutoFill: false,
    startersRequired: false,
    proofPlanLabels: [...PROOF_PLAN_LABELS],
    proofPlanFraming: PROOF_PLAN_FRAMING,
    proofPlanReviewGuidance: PROOF_PLAN_REVIEW_GUIDANCE,
    proofPlanEarlierPassMessage: PROOF_PLAN_EARLIER_PASS_MESSAGE,
    proofPlanSlots: PROOF_PLAN_SLOTS,
    proofPlanMinimum: PROOF_PLAN_MINIMUM,
    checksAssignmentQuestionAlignment: true,
  };
}

/**
 * Progressive-disclosure status copy for CLAIM (instructional only).
 */
export function getClaimProgressStatus({
  workingClaim = "",
  minimum = CLAIM_MINIMUM,
} = {}) {
  const claimReady = isClaimTextReady(workingClaim, minimum);
  return {
    writingNow: "Write one claim that answers the assignment and your evidence can support.",
    lockedUntilClaim:
      "The self-check unlocks after your claim reaches a meaningful length.",
    unlocksNext: claimReady
      ? "Self-check is open. When your claim is ready, Keep Going moves you to the thesis."
      : "Finishing a meaningful claim unlocks the self-check, then Keep Going to the thesis.",
    showSelfCheck: claimReady,
  };
}

/**
 * Progressive-disclosure status copy for THESIS (instructional only).
 */
export function getThesisProgressStatus({
  thesisStatement = "",
  proofPlan = [],
  thesisMinimum = THESIS_MINIMUM,
  proofPlanMinimum = PROOF_PLAN_MINIMUM,
} = {}) {
  const thesisReady = isThesisTextReady(thesisStatement, thesisMinimum);
  const filled = filledProofPlanCount(proofPlan);
  return {
    writingNow: thesisReady
      ? "Name what the essay must show in the proof-plan notes."
      : "Write one thesis sentence that sharpens your working claim.",
    lockedUntilThesis:
      "The proof plan unlocks after your thesis reaches a meaningful length.",
    unlocksNext: thesisReady
      ? `Add at least ${proofPlanMinimum} proof-plan note${
          proofPlanMinimum === 1 ? "" : "s"
        } (${filled} of ${PROOF_PLAN_SLOTS} started). Then you are ready to continue.`
      : "Finishing a meaningful thesis unlocks the proof-plan notes.",
    showProofPlan: thesisReady,
    filledProofPlan: filled,
    proofPlanMinimum,
  };
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

/**
 * Student-facing label for a stored relation value.
 * Maps sharpens → "Sharpens the idea" (shorter than CONNECT's full label).
 */
export function argumentRelationLabel(relation) {
  const key = typeof relation === "string" ? relation : "";
  if (ARGUMENT_RELATION_LABELS[key]) {
    return ARGUMENT_RELATION_LABELS[key];
  }
  return relationLabelForStored(relation);
}

/**
 * Valid displayed evidence: only selected, explained, in-group connections.
 * Orphan IDs and unselected entries are excluded.
 */
export function getArgumentDisplayEvidence({
  selectedClusterEvidence = [],
  evidenceConnections = {},
} = {}) {
  return (selectedClusterEvidence || []).filter((evidence) =>
    isValidExplainedConnection(evidenceConnections[evidence?.id])
  );
}

/**
 * Proof-structure items for the evidence dashboard.
 * Pure — does not mutate evidenceConnections or evidence items.
 */
export function buildArgumentProofItems({
  selectedClusterEvidence = [],
  evidenceConnections = {},
} = {}) {
  return getArgumentDisplayEvidence({
    selectedClusterEvidence,
    evidenceConnections,
  }).map((evidence) => {
    const connection = evidenceConnections[evidence.id] || {};
    const observation =
      typeof evidence.observation === "string" ? evidence.observation.trim() : "";
    return {
      id: normalizeId(evidence.id),
      evidence,
      quote: typeof evidence.quote === "string" ? evidence.quote : "",
      sourceType: evidence.sourceType || "",
      sourceLabel: evidence.sourceLabel || evidence.sourceType || "",
      sourceTitle: evidence.sourceTitle || "",
      observation,
      relation: connection.relation,
      relationLabel: argumentRelationLabel(connection.relation),
      note: safeText(connection.note),
    };
  });
}

/**
 * Compatibility derivation: join the student's own connection notes.
 * Does not invent, rewrite, summarize with AI, or add analytical claims.
 * Returns "" when no valid notes exist.
 */
export function deriveSupportRationaleFromConnections({
  selectedClusterEvidence = [],
  evidenceConnections = {},
} = {}) {
  const notes = buildArgumentProofItems({
    selectedClusterEvidence,
    evidenceConnections,
  })
    .map((item) => item.note)
    .filter(Boolean);

  return notes.join("\n\n");
}

/**
 * Resolve the supportRationale that should be persisted with a claim.
 *
 * Priority:
 * 1. Existing nonempty saved supportRationale (preserve as-is).
 * 2. Deterministic derivation from student-authored connection notes.
 *
 * Never invents new analysis.
 */
export function resolveSupportRationale({
  existingSupportRationale = "",
  selectedClusterEvidence = [],
  evidenceConnections = {},
} = {}) {
  const existing = safeText(existingSupportRationale);
  if (existing) {
    return {
      supportRationale: existingSupportRationale,
      source: "preserved",
    };
  }

  const derived = deriveSupportRationaleFromConnections({
    selectedClusterEvidence,
    evidenceConnections,
  });

  return {
    supportRationale: derived,
    source: derived ? "derived_from_connection_notes" : "empty",
  };
}

export function isClaimTextReady(workingClaim = "", minimum = CLAIM_MINIMUM) {
  return safeText(workingClaim).length >= minimum;
}

/**
 * Claim can continue when the visible working claim is ready AND the
 * artifact can be saved with a compatible supportRationale (preserved or
 * derived). Does not require a hidden second textarea.
 */
export function canContinueFromClaim({
  workingClaim = "",
  existingSupportRationale = "",
  selectedClusterEvidence = [],
  evidenceConnections = {},
  minimum = CLAIM_MINIMUM,
} = {}) {
  if (!isClaimTextReady(workingClaim, minimum)) {
    return false;
  }

  const resolved = resolveSupportRationale({
    existingSupportRationale,
    selectedClusterEvidence,
    evidenceConnections,
  });

  return safeText(resolved.supportRationale).length >= minimum;
}

export function getClaimContinueHint({
  workingClaim = "",
  existingSupportRationale = "",
  selectedClusterEvidence = [],
  evidenceConnections = {},
  minimum = CLAIM_MINIMUM,
} = {}) {
  const claimText = safeText(workingClaim);

  if (!claimText) {
    return "Write the point your evidence can help you prove.";
  }

  if (claimText.length < minimum) {
    return "Add a little more detail so your claim states a complete point.";
  }

  const resolved = resolveSupportRationale({
    existingSupportRationale,
    selectedClusterEvidence,
    evidenceConnections,
  });

  if (safeText(resolved.supportRationale).length < minimum) {
    return "Check that your claim is supported by the evidence shown above.";
  }

  return "";
}

export function getClaimReadyMessage() {
  return "Your working claim is ready to sharpen into a thesis.";
}

export function getClaimPhase({
  workingClaim = "",
  existingSupportRationale = "",
  selectedClusterEvidence = [],
  evidenceConnections = {},
  minimum = CLAIM_MINIMUM,
} = {}) {
  const claimReady = isClaimTextReady(workingClaim, minimum);
  const canContinue = canContinueFromClaim({
    workingClaim,
    existingSupportRationale,
    selectedClusterEvidence,
    evidenceConnections,
    minimum,
  });

  return {
    showSelfCheck: claimReady,
    claimReady,
    canContinue,
  };
}

export function filledProofPlanCount(proofPlan = []) {
  return (Array.isArray(proofPlan) ? proofPlan : [])
    .map((line) => safeText(line))
    .filter(Boolean).length;
}

export function isThesisTextReady(thesisStatement = "", minimum = THESIS_MINIMUM) {
  return safeText(thesisStatement).length >= minimum;
}

/**
 * Preserves the existing gate: meaningful thesis + at least one proof-plan entry.
 */
export function canContinueFromThesis({
  thesisStatement = "",
  proofPlan = [],
  thesisMinimum = THESIS_MINIMUM,
  proofPlanMinimum = PROOF_PLAN_MINIMUM,
} = {}) {
  return (
    isThesisTextReady(thesisStatement, thesisMinimum) &&
    filledProofPlanCount(proofPlan) >= proofPlanMinimum
  );
}

export function getThesisContinueHint({
  thesisStatement = "",
  proofPlan = [],
  thesisMinimum = THESIS_MINIMUM,
  proofPlanMinimum = PROOF_PLAN_MINIMUM,
} = {}) {
  const thesisText = safeText(thesisStatement);

  if (!thesisText) {
    return "Write your thesis in one clear sentence.";
  }

  if (thesisText.length < thesisMinimum) {
    return "Add enough detail to state the complete argument.";
  }

  if (filledProofPlanCount(proofPlan) < proofPlanMinimum) {
    return "Add the required proof-plan step so you know what the essay must show.";
  }

  return "";
}

export function getThesisReadyMessage() {
  return "Your thesis and proof plan are ready.";
}

export function getThesisPhase({
  thesisStatement = "",
  proofPlan = [],
  thesisMinimum = THESIS_MINIMUM,
  proofPlanMinimum = PROOF_PLAN_MINIMUM,
} = {}) {
  const thesisReady = isThesisTextReady(thesisStatement, thesisMinimum);
  const canContinue = canContinueFromThesis({
    thesisStatement,
    proofPlan,
    thesisMinimum,
    proofPlanMinimum,
  });

  return {
    showProofPlan: thesisReady,
    thesisReady,
    canContinue,
    filledProofPlan: filledProofPlanCount(proofPlan),
    proofPlanMinimum,
  };
}

/** Confirms CLAIM/THESIS map to the shared artifact-chain stages. */
export function getBuildArgumentChainStage(mode) {
  if (mode === "thesis") {
    return getArtifactChainStageForStep("turn_claim_into_thesis");
  }
  return getArtifactChainStageForStep("develop_claim");
}

/** Snapshot helper for tests — shallow copy of connection map. */
export function snapshotEvidenceConnections(evidenceConnections = {}) {
  const snapshot = {};
  for (const [id, entry] of Object.entries(evidenceConnections || {})) {
    snapshot[id] =
      entry && typeof entry === "object" ? { ...entry } : entry;
  }
  return snapshot;
}

export { CONNECT_RELATION_VALUES };
