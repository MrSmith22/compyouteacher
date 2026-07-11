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

export const CLAIM_SENTENCE_STARTERS = [
  "Together, these quotations show that…",
  "King uses these choices to…",
  "Across the speech and letter, King…",
  "The evidence suggests that…",
  "King’s rhetorical choices help him…",
];

export const CLAIM_LEADING_QUESTIONS = [
  "What part of the assignment question does your developing idea address?",
  "What answer do your quotations support?",
  "How can you turn that answer into one clear, defensible statement?",
  "Does your statement answer the prompt—not just describe the texts?",
  "Could you point to the displayed evidence to defend it?",
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

export const CLAIM_SELF_CHECK_ITEMS = [
  "My claim states a point, not just a topic.",
  "My displayed evidence could help me prove it.",
  "My claim connects to the assignment question.",
];

export const THESIS_LEADING_QUESTIONS = [
  "Does my thesis clearly answer the assignment question?",
  "Does it preserve the supported point from my claim?",
  "Can my evidence help me prove it?",
];

export const THESIS_JOB_HEADLINE =
  "Sharpen your claim into one clear thesis sentence that still answers the assignment question.";

export const ARGUMENT_THINKING_PATH = [
  "Assignment question",
  "Your developing idea",
  "Your quotations and explanations",
  "The point you can prove",
];

export const PROOF_PLAN_LABELS = [
  "One thing I will need to show…",
  "Another thing I will need to show…",
  "A final thing I may need to show…",
];

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
      "Your claim should answer this question using the developing idea and evidence you built.",
    prompt,
    thinkingPath: [...ARGUMENT_THINKING_PATH],
  };
}

export function getClaimJobCoaching() {
  return {
    headline: CLAIM_JOB_HEADLINE,
    steps: [...CLAIM_JOB_STEPS],
    leadingQuestions: [...CLAIM_LEADING_QUESTIONS],
    fieldIntro: CLAIM_FIELD_INTRO,
    fieldReminder: CLAIM_FIELD_REMINDER,
    synthesizesPromptIdeaEvidence: true,
  };
}

export function getThesisJobCoaching() {
  return {
    headline: THESIS_JOB_HEADLINE,
    leadingQuestions: [...THESIS_LEADING_QUESTIONS],
    checksAssignmentQuestionAlignment: true,
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
