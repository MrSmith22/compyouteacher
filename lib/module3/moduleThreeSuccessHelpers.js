/**
 * Pure helpers for Module 3 success-page handoff summary.
 * Read-only presentation — never writes artifacts or mutates student work.
 */

import { isValidExplainedConnection } from "./connectEvidenceHelpers.js";
import {
  evidenceIdAliases,
  evidenceIdsMatch,
} from "../shared/evidenceIdAliases.js";
import { referenceMatchesId } from "./moduleThreePhaseModel.js";

export { evidenceIdAliases, evidenceIdsMatch, referenceMatchesId };

export const MODULE_THREE_SUCCESS_COMPLETED_MODULE = 3;
export const MODULE_THREE_SUCCESS_MODULE4_HREF = "/modules/4";
export const MODULE_THREE_SUCCESS_REVIEW_HREF = "/modules/3";

export const SUCCESS_PROOF_PLAN_LABELS = [
  "Speech rhetorical choices",
  "Letter rhetorical choices",
  "Similarity or difference—and how audience or purpose helps explain it",
];

export const SUCCESS_THESIS_FALLBACK =
  "Your saved thesis could not be displayed here. Your Module 3 work is still saved.";

export const SUCCESS_PROOF_PLAN_EMPTY_FALLBACK =
  "No planning notes were found here. Your Module 3 work is still saved.";

export const SUCCESS_PROOF_PLAN_COMPAT_NOTE =
  "These are the planning notes you saved. You can refine their organization in Module 4.";

export const SUCCESS_BOTH_WORKS_CONFIRMED =
  "Your argument is supported by explained evidence from both works.";

export const SUCCESS_EVIDENCE_UNVERIFIED =
  "Your saved evidence will remain available when you continue planning.";

export const SUCCESS_ASSIGNMENT_CONNECTION =
  "You built a thesis for comparing King’s rhetorical choices in the speech and the letter. Your next job is to organize the evidence and reasoning that will prove it.";

export const SUCCESS_MODULE4_HANDOFF =
  "You will turn this proof plan into body-paragraph plans—one paragraph at a time. Your thesis, evidence, and planning notes will come with you. You are not starting over.";

export const SUCCESS_PRIMARY_CTA_LABEL =
  "Continue to Module 4 — plan your paragraphs";

export const SUCCESS_SECONDARY_REVIEW_LABEL = "Review Module 3 work";

export const SUCCESS_ACCOMPLISHMENT =
  "You grouped evidence, developed an idea, connected quotations from both works, and shaped a claim into a thesis with planning notes.";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

export function resolveSuccessClusterId({
  ideaArtifact = null,
  claimArtifact = null,
  thesisArtifact = null,
} = {}) {
  const fromClaim = safeText(claimArtifact?.clusterId);
  if (fromClaim) return fromClaim;
  const fromIdea = safeText(ideaArtifact?.clusterId);
  if (fromIdea) return fromIdea;
  const fromThesis = safeText(thesisArtifact?.clusterId);
  if (fromThesis) return fromThesis;
  return "";
}

function clusterLocalId(clusterArtifactId) {
  const id = normalizeId(clusterArtifactId);
  const parts = id.split(":");
  return parts.length ? parts[parts.length - 1] : id;
}

export function findSuccessClusterArtifact(
  evidenceClusterArtifacts = [],
  clusterId = ""
) {
  const target = normalizeId(clusterId);
  if (!target) return null;
  const list = Array.isArray(evidenceClusterArtifacts)
    ? evidenceClusterArtifacts
    : [];
  return (
    list.find((cluster) => referenceMatchesId(target, cluster?.id)) ||
    list.find((cluster) => clusterLocalId(cluster?.id) === target) ||
    list.find((cluster) => normalizeId(cluster?.id) === target) ||
    null
  );
}

/**
 * Nonempty proof-plan notes in original slot order with established role labels.
 * Empty slots omitted. Original wording preserved (no rewrite/reorder).
 */
export function buildSuccessProofPlanItems(proofPlan = []) {
  const plan = Array.isArray(proofPlan) ? proofPlan : [];
  const items = [];

  for (let index = 0; index < plan.length; index += 1) {
    const original = typeof plan[index] === "string" ? plan[index] : "";
    if (!safeText(original)) continue;
    items.push({
      slotIndex: index,
      label:
        SUCCESS_PROOF_PLAN_LABELS[index] ||
        `Planning note ${index + 1}`,
      text: original,
    });
  }

  return items;
}

/**
 * Valid explained connections that belong to the relevant cluster/group.
 */
export function getSuccessValidEvidenceItems({
  evidenceMap = {},
  clusterEvidenceIds = [],
  evidenceArtifacts = [],
} = {}) {
  const allowedIds = Array.isArray(clusterEvidenceIds)
    ? clusterEvidenceIds.map(normalizeId).filter(Boolean)
    : [];
  const allowedSet = new Set(allowedIds);
  // Also add aliases of allowed IDs for matching map keys
  for (const id of allowedIds) {
    for (const alias of evidenceIdAliases(id)) {
      allowedSet.add(alias);
    }
  }

  const map =
    evidenceMap && typeof evidenceMap === "object" ? evidenceMap : {};
  const artifacts = Array.isArray(evidenceArtifacts) ? evidenceArtifacts : [];

  const items = [];

  for (const [evidenceId, entry] of Object.entries(map)) {
    const id = normalizeId(evidenceId);
    if (!id) continue;

    // Must be in the relevant group (or match an allowed alias)
    const inGroup =
      allowedSet.size === 0
        ? false
        : [...evidenceIdAliases(id)].some((alias) => allowedSet.has(alias));
    if (!inGroup) continue;

    if (!isValidExplainedConnection(entry)) continue;

    const artifact =
      artifacts.find((item) => evidenceIdsMatch(item?.id, id)) || null;

    const sourceTypeRaw = safeText(artifact?.sourceType).toLowerCase();
    let sourceType = "";
    if (sourceTypeRaw === "letter") sourceType = "letter";
    else if (sourceTypeRaw === "speech") sourceType = "speech";
    else if (id.includes("letter")) sourceType = "letter";
    else if (id.includes("speech") || id.includes("tchart:speech")) {
      sourceType = "speech";
    }

    items.push({
      evidenceId: id,
      sourceType,
      sourceLabel: sourceType === "letter" ? "Letter" : sourceType === "speech" ? "Speech" : "",
      quote: typeof artifact?.quote === "string" ? artifact.quote : "",
      note: typeof entry?.note === "string" ? entry.note : "",
      relation: typeof entry?.relation === "string" ? entry.relation : "",
    });
  }

  return items;
}

export function countSuccessEvidenceBySource(validItems = []) {
  let speechCount = 0;
  let letterCount = 0;
  for (const item of validItems) {
    if (item.sourceType === "speech") speechCount += 1;
    if (item.sourceType === "letter") letterCount += 1;
  }
  return {
    speechCount,
    letterCount,
    bothWorksVerified: speechCount >= 1 && letterCount >= 1,
  };
}

/**
 * Read-only success summary model. Pure — does not write or mutate inputs.
 */
export function buildModuleThreeSuccessSummary({
  thesisArtifact = null,
  claimArtifact = null,
  ideaArtifact = null,
  evidenceClusterArtifacts = [],
  evidenceArtifacts = [],
  patternArtifacts = [],
} = {}) {
  const thesisText =
    typeof thesisArtifact?.thesis === "string" ? thesisArtifact.thesis : "";
  const hasThesis = Boolean(safeText(thesisText));

  const proofPlan = Array.isArray(thesisArtifact?.proofPlan)
    ? thesisArtifact.proofPlan.map((line) =>
        typeof line === "string" ? line : ""
      )
    : [];
  const proofPlanItems = buildSuccessProofPlanItems(proofPlan);

  const clusterId = resolveSuccessClusterId({
    ideaArtifact,
    claimArtifact,
    thesisArtifact,
  });
  const cluster = findSuccessClusterArtifact(
    evidenceClusterArtifacts,
    clusterId
  );
  const clusterEvidenceIds = Array.isArray(cluster?.evidenceIds)
    ? cluster.evidenceIds
    : [];

  const evidenceMap =
    ideaArtifact?.evidenceMap && typeof ideaArtifact.evidenceMap === "object"
      ? ideaArtifact.evidenceMap
      : {};

  const validEvidence = getSuccessValidEvidenceItems({
    evidenceMap,
    clusterEvidenceIds,
    evidenceArtifacts,
  });
  const sourceCounts = countSuccessEvidenceBySource(validEvidence);

  const pattern =
    (Array.isArray(patternArtifacts)
      ? patternArtifacts.find((item) => item?.isSelected)
      : null) || null;

  return {
    completedModuleNumber: MODULE_THREE_SUCCESS_COMPLETED_MODULE,
    module4Href: MODULE_THREE_SUCCESS_MODULE4_HREF,
    reviewHref: MODULE_THREE_SUCCESS_REVIEW_HREF,
    primaryCtaLabel: SUCCESS_PRIMARY_CTA_LABEL,
    secondaryReviewLabel: SUCCESS_SECONDARY_REVIEW_LABEL,
    accomplishment: SUCCESS_ACCOMPLISHMENT,
    assignmentConnection: SUCCESS_ASSIGNMENT_CONNECTION,
    module4Handoff: SUCCESS_MODULE4_HANDOFF,
    thesis: {
      available: hasThesis,
      text: hasThesis ? thesisText : "",
      fallback: SUCCESS_THESIS_FALLBACK,
    },
    proofPlan: {
      items: proofPlanItems,
      // Exact preserved array for handoff/tests — never reordered by this helper.
      preservedPlan: [...proofPlan],
      empty: proofPlanItems.length === 0,
      emptyFallback: SUCCESS_PROOF_PLAN_EMPTY_FALLBACK,
      compatNote: SUCCESS_PROOF_PLAN_COMPAT_NOTE,
      labels: [...SUCCESS_PROOF_PLAN_LABELS],
    },
    evidence: {
      speechCount: sourceCounts.speechCount,
      letterCount: sourceCounts.letterCount,
      bothWorksVerified: sourceCounts.bothWorksVerified,
      confirmedMessage: SUCCESS_BOTH_WORKS_CONFIRMED,
      unverifiedMessage: SUCCESS_EVIDENCE_UNVERIFIED,
      items: validEvidence,
      speechSummary:
        sourceCounts.speechCount === 1
          ? "Speech: 1 explained quotation"
          : `Speech: ${sourceCounts.speechCount} explained quotations`,
      letterSummary:
        sourceCounts.letterCount === 1
          ? "Letter: 1 explained quotation"
          : `Letter: ${sourceCounts.letterCount} explained quotations`,
    },
    meta: {
      clusterId,
      clusterName: cluster?.clusterName || "",
      patternId: safeText(ideaArtifact?.patternId || claimArtifact?.patternId),
      patternText: typeof pattern?.text === "string" ? pattern.text : "",
      ideaStatement:
        typeof ideaArtifact?.statement === "string"
          ? ideaArtifact.statement
          : "",
      workingClaim:
        typeof claimArtifact?.workingClaim === "string"
          ? claimArtifact.workingClaim
          : "",
    },
    /** Confirms this summary never writes artifacts. */
    writesArtifacts: false,
  };
}

/**
 * Snapshot helper — confirms success helpers do not mutate artifact inputs.
 */
export function snapshotSuccessInputs(input = {}) {
  return JSON.parse(JSON.stringify(input));
}
