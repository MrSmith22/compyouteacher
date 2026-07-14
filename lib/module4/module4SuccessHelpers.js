/**
 * Module 4 Checkpoint 5 — success-page summary helpers.
 * Read-only presentation. Viewing success must not write plans.
 *
 * Keep this module free of Next/TS-only imports so node:test can load it.
 * Evidence pool resolution for the success page lives in
 * module4SuccessEvidenceResolver.js.
 */

import {
  buildModule4ParagraphPlanArtifact,
  requiredParagraphBuckets,
} from "./module4ParagraphPlanArtifactHelpers.js";
import {
  areRequiredParagraphsPlanned,
  uniqueQualifyingEvidenceSlots,
} from "./module4ValidityHelpers.js";
import {
  formatRoleTransitionHandoff,
  getModuleRoleTransition,
} from "../transitions/moduleRoleTransitions.js";

const TRANSITION_4_TO_5 = getModuleRoleTransition(4, 5);

export const MODULE_FOUR_SUCCESS_COMPLETED_MODULE = 4;
export const MODULE_FOUR_SUCCESS_MODULE5_HREF = "/modules/5";
export const MODULE_FOUR_SUCCESS_REVIEW_HREF = "/modules/4";

export const MODULE4_SUCCESS_ACCOMPLISHMENT = TRANSITION_4_TO_5.accomplishment;

export const MODULE4_SUCCESS_THESIS_FALLBACK =
  "Your saved thesis could not be displayed here. Your Module 4 paragraph plans are still saved.";

export const MODULE4_SUCCESS_ASSIGNMENT_CONNECTION =
  "These plans organize your analysis of King’s rhetorical choices, audience, purpose, and evidence from both the speech and the letter.";

export const MODULE4_SUCCESS_MODULE5_HANDOFF =
  formatRoleTransitionHandoff(TRANSITION_4_TO_5);

export const MODULE4_SUCCESS_PRIMARY_CTA_LABEL = TRANSITION_4_TO_5.actionLabel;

export const MODULE4_SUCCESS_SECONDARY_REVIEW_LABEL = "Review Module 4 work";

export const MODULE4_SUCCESS_INCOMPLETE_MESSAGE =
  "Some required paragraph plans still need work. Review Module 4 to finish them before outlining.";

export const MODULE4_SUCCESS_TRANSITION =
  "These paragraph plans are the work Module 5 will organize into your outline.";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveSuccessThesis({ thesisArtifact, initialModule3 }) {
  const artifactThesis =
    typeof thesisArtifact?.thesis === "string" ? thesisArtifact.thesis.trim() : "";
  const legacyThesis =
    typeof initialModule3?.thesis === "string" ? initialModule3.thesis.trim() : "";
  return artifactThesis || legacyThesis || "";
}

function resolveSuccessProofPlan(thesisArtifact) {
  if (!Array.isArray(thesisArtifact?.proofPlan)) return [];
  return thesisArtifact.proofPlan
    .map((line) => (typeof line === "string" ? line.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);
}

function parseBucketsRow(studentBuckets) {
  const row = studentBuckets || {};
  const buckets = Array.isArray(row.buckets) ? row.buckets : [];
  const flow = row.flow_state || {};
  const wantThird =
    flow.wantThirdBucket === true
      ? true
      : flow.wantThirdBucket === false
        ? false
        : null;
  return {
    buckets,
    reflection: safeText(row.reflection),
    wantThirdBucket: wantThird,
    flowStep: typeof flow.step === "number" ? flow.step : null,
  };
}

/**
 * Evidence foundation counts for success (alias-deduped within each paragraph).
 */
export function buildModule4SuccessEvidenceFoundation({
  planArtifacts = [],
} = {}) {
  let speechCount = 0;
  let letterCount = 0;
  let totalEvidence = 0;

  for (const plan of planArtifacts) {
    const items = Array.isArray(plan?.evidence?.items) ? plan.evidence.items : [];
    totalEvidence += items.length;
    for (const item of items) {
      if (item.sourceType === "letter") letterCount += 1;
      else speechCount += 1;
    }
  }

  const bothWorksVerified = speechCount > 0 && letterCount > 0;

  return {
    completedPlanCount: planArtifacts.filter((p) => p?.ready).length,
    totalQualifyingEvidence: totalEvidence,
    speechCount,
    letterCount,
    bothWorksVerified,
    bothWorksMessage: bothWorksVerified
      ? "Your plans include selected evidence from both the speech and the letter."
      : "Keep using evidence from both works as you outline and draft.",
  };
}

/**
 * Pure success summary. Does not write artifacts.
 * Prefer passing getEvidenceSlots from createModule4EvidenceSlotResolver on the server.
 */
export function buildModule4SuccessSummary({
  thesisArtifact = null,
  initialModule3 = null,
  studentBuckets = null,
  proofPlan = null,
  getEvidenceSlots = null,
} = {}) {
  const thesis = resolveSuccessThesis({
    thesisArtifact,
    initialModule3,
  });
  const resolvedProofPlan =
    Array.isArray(proofPlan) && proofPlan.length > 0
      ? proofPlan
      : resolveSuccessProofPlan(thesisArtifact);

  const resolveSlots =
    typeof getEvidenceSlots === "function"
      ? getEvidenceSlots
      : () => [];

  const parsed = parseBucketsRow(studentBuckets);
  const required = requiredParagraphBuckets({
    buckets: parsed.buckets,
    wantThirdBucket: parsed.wantThirdBucket,
  });

  const planArtifacts = required.map(({ bucket, index }) =>
    buildModule4ParagraphPlanArtifact({
      paragraphIndex: index,
      bucket,
      evidenceSlots: resolveSlots(bucket, index) || [],
      thesis,
      proofPlan: resolvedProofPlan,
    })
  );

  const allReady = areRequiredParagraphsPlanned({
    buckets: parsed.buckets,
    wantThirdBucket: parsed.wantThirdBucket,
    getEvidenceSlots: resolveSlots,
  });

  const incomplete = !allReady;

  return {
    writesArtifacts: false,
    incomplete,
    incompleteMessage: incomplete ? MODULE4_SUCCESS_INCOMPLETE_MESSAGE : "",
    accomplishment: MODULE4_SUCCESS_ACCOMPLISHMENT,
    thesis: {
      available: Boolean(safeText(thesis)),
      text: safeText(thesis) || MODULE4_SUCCESS_THESIS_FALLBACK,
      fallback: MODULE4_SUCCESS_THESIS_FALLBACK,
    },
    paragraphPlans: incomplete
      ? planArtifacts.filter((plan) => plan.ready)
      : planArtifacts,
    evidenceFoundation: buildModule4SuccessEvidenceFoundation({
      planArtifacts: incomplete
        ? planArtifacts.filter((plan) => plan.ready)
        : planArtifacts,
    }),
    assignmentConnection: MODULE4_SUCCESS_ASSIGNMENT_CONNECTION,
    module5Handoff: MODULE4_SUCCESS_MODULE5_HANDOFF,
    transition: MODULE4_SUCCESS_TRANSITION,
    primaryCtaLabel: MODULE4_SUCCESS_PRIMARY_CTA_LABEL,
    primaryCtaHref: MODULE_FOUR_SUCCESS_MODULE5_HREF,
    secondaryReviewLabel: MODULE4_SUCCESS_SECONDARY_REVIEW_LABEL,
    secondaryReviewHref: MODULE_FOUR_SUCCESS_REVIEW_HREF,
    reflection: parsed.reflection,
    wantThirdBucket: parsed.wantThirdBucket,
    requiredPlanCount: parsed.wantThirdBucket === true ? 3 : 2,
  };
}

/** Test helper: count unique qualifying slots the same way success does. */
export function countUniqueQualifyingEvidence(slots = []) {
  return uniqueQualifyingEvidenceSlots(slots).length;
}
