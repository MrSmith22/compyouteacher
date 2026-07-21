/**
 * Module 4 Checkpoint 5 — readable paragraph-plan artifact helpers.
 * Presentation only. Does not write buckets, evidence, or flow state.
 */

import { getBodyParagraphLabel } from "../essaySectionLabels.js";
import { parseModule2Observation } from "../parseModule2Observation.js";
import {
  evidenceIdsMatch,
  tchartCanonicalFromRow,
  tchartCanonicalId,
} from "../shared/evidenceIdAliases.js";
import {
  decodeCustomParagraphJob,
  isCustomParagraphJob,
  labelForParagraphJob,
  proofPlanSlotForSuggestionId,
  resolveProofPlanSlots,
} from "./module4PointJobHelpers.js";
import {
  isParagraphMechanicallyPlanned,
  uniqueQualifyingEvidenceSlots,
} from "./module4ValidityHelpers.js";

/** Student-facing job label for plan artifacts (custom text preserved exactly). */
export function jobLabelForPlanArtifact(paragraphRole) {
  if (isCustomParagraphJob(paragraphRole)) {
    return decodeCustomParagraphJob(paragraphRole) || "Another organizational job";
  }
  return labelForParagraphJob(paragraphRole) || "";
}

export const PLAN_ARTIFACT_HIERARCHY = [
  "paragraph",
  "job",
  "point",
  "evidence",
  "reasoning",
  "thesis_connection",
];

/** Edit targets by paragraph index (0–2) for durable flow steps. */
export const PARAGRAPH_PART_EDIT_STEPS = {
  point: [4, 8, 13],
  job: [5, 9, 14],
  evidence: [6, 10, 15],
  reasoning: [7, 11, 16],
};

export function editStepForParagraphPart(paragraphIndex, part) {
  const index = Number(paragraphIndex);
  const steps = PARAGRAPH_PART_EDIT_STEPS[part];
  if (!steps || !Number.isFinite(index) || index < 0 || index > 2) return null;
  return steps[index];
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sourceLabel(type) {
  return String(type || "").toLowerCase() === "letter" ? "Letter" : "Speech";
}

/**
 * Build display items for qualifying evidence (alias-deduped).
 */
export function buildPlanArtifactEvidenceItems(evidenceSlots = []) {
  const unique = uniqueQualifyingEvidenceSlots(evidenceSlots);
  const items = [];
  const seenKeys = [];

  for (const slot of unique) {
    const row = slot.row || {};
    const identityCandidates = [
      String(row.evidenceKey || "").trim(),
      String(row.id || "").trim(),
      String(slot.savedKey || "").trim(),
      tchartCanonicalId(row.evidenceKey || slot.savedKey),
      tchartCanonicalFromRow(row),
    ].filter(Boolean);

    if (
      identityCandidates.some((candidate) =>
        seenKeys.some((seen) => evidenceIdsMatch(seen, candidate))
      )
    ) {
      continue;
    }
    for (const candidate of identityCandidates) {
      if (!seenKeys.some((seen) => evidenceIdsMatch(seen, candidate))) {
        seenKeys.push(candidate);
      }
    }

    const parsed = parseModule2Observation(row.observation || slot.observation);
    const module2Note =
      safeText(parsed.main) ||
      safeText(slot.observation) ||
      safeText(row.observation);
    const connection = slot.module3Connection || null;
    const sourceType = String(row.type || row.sourceType || "").toLowerCase();
    const appeal = String(row.category || row.rhetoricalStrategy || "").toLowerCase();
    const quote = safeText(slot.quote || row.quote);
    if (!quote && slot.status === "missing") continue;

    items.push({
      savedKey: slot.savedKey,
      status: slot.status,
      sourceType: sourceType === "letter" ? "letter" : "speech",
      sourceLabel: sourceLabel(sourceType),
      appeal,
      quote,
      quotePreview: quote.length > 120 ? `${quote.slice(0, 117)}…` : quote,
      module2Note,
      module3RelationLabel: connection?.relationLabel || "",
      module3Note: safeText(connection?.note),
      compatibilityLabel: slot.compatibilityLabel || null,
      isPreserved: slot.status === "preserved",
    });
  }

  return items;
}

/**
 * Readable completed-plan artifact view model.
 */
export function buildModule4ParagraphPlanArtifact({
  paragraphIndex = 0,
  bucket = null,
  evidenceSlots = [],
  thesis = "",
  proofPlan = [],
} = {}) {
  const index = Number(paragraphIndex);
  const paragraphNumber = index + 1;
  const label = getBodyParagraphLabel(index);
  const claim = safeText(bucket?.claim);
  const reasoning = safeText(bucket?.reasoning);
  const jobLabel = jobLabelForPlanArtifact(bucket?.paragraphRole);
  const ready = isParagraphMechanicallyPlanned(bucket, evidenceSlots);
  const evidenceItems = buildPlanArtifactEvidenceItems(evidenceSlots);
  const slot = proofPlanSlotForSuggestionId(
    proofPlan,
    bucket?.suggestionId
  );
  const builtFromLabel = slot?.roleLabel
    ? `Built from: ${slot.roleLabel}`
    : "";

  return {
    paragraphIndex: index,
    paragraphNumber,
    label,
    ready,
    hierarchy: PLAN_ARTIFACT_HIERARCHY,
    title: label,
    readyHeading: `${label} plan is ready`,
    job: {
      label: jobLabel || "Job not set yet",
      raw: safeText(bucket?.paragraphRole),
    },
    point: {
      text: claim,
      builtFromLabel,
    },
    evidence: {
      items: evidenceItems,
      count: evidenceItems.length,
    },
    reasoning: {
      text: reasoning,
      label: "How this evidence supports the paragraph point and thesis",
    },
    thesisConnection: {
      label: "Thesis this paragraph helps prove",
      text: safeText(thesis),
    },
    editTargets: {
      point: editStepForParagraphPart(index, "point"),
      job: editStepForParagraphPart(index, "job"),
      evidence: editStepForParagraphPart(index, "evidence"),
      reasoning: editStepForParagraphPart(index, "reasoning"),
    },
  };
}

export function reasoningReadyNextActionLabel({
  paragraphIndex = 0,
  wantThirdBucket = null,
} = {}) {
  if (paragraphIndex === 0) return "Plan Body Paragraph 2";
  if (paragraphIndex === 1) return "Decide whether you need Body Paragraph 3";
  if (paragraphIndex === 2) return "Review all paragraph plans";
  if (wantThirdBucket === true) return "Review all paragraph plans";
  return "Keep going";
}

export function buildShelfCompletedPlanSummary({
  paragraphIndex = 0,
  bucket = null,
  evidenceSlots = [],
} = {}) {
  const evidenceItems = buildPlanArtifactEvidenceItems(evidenceSlots);
  const ready = isParagraphMechanicallyPlanned(bucket, evidenceSlots);
  return {
    paragraphNumber: Number(paragraphIndex) + 1,
    planned: ready,
    point: safeText(bucket?.claim),
    jobLabel: jobLabelForPlanArtifact(bucket?.paragraphRole),
    evidenceCount: evidenceItems.length,
  };
}

/**
 * Required current plans for review/success (omits declined stale P3).
 */
export function requiredParagraphBuckets({
  buckets = [],
  wantThirdBucket = null,
} = {}) {
  const list = Array.isArray(buckets) ? buckets : [];
  const count = wantThirdBucket === true ? 3 : 2;
  return list.slice(0, count).map((bucket, index) => ({ bucket, index }));
}

export function buildRequiredPlanArtifacts({
  buckets = [],
  wantThirdBucket = null,
  getEvidenceSlots = () => [],
  thesis = "",
  proofPlan = [],
} = {}) {
  return requiredParagraphBuckets({ buckets, wantThirdBucket }).map(
    ({ bucket, index }) =>
      buildModule4ParagraphPlanArtifact({
        paragraphIndex: index,
        bucket,
        evidenceSlots: getEvidenceSlots(bucket, index) || [],
        thesis,
        proofPlan: Array.isArray(proofPlan)
          ? proofPlan
          : resolveProofPlanSlots(proofPlan).map((slot) => slot.text),
      })
  );
}
