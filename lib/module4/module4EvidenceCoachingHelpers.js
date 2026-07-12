/**
 * Module 4 Checkpoint 6 — evidence reuse + job/source alignment coaching.
 * Presentation only. Never blocks Continue or mutates selections.
 */

import { evidenceIdsMatch } from "../shared/evidenceIdAliases.js";
import {
  labelForParagraphJob,
  isCustomParagraphJob,
} from "./module4PointJobHelpers.js";
import { uniqueQualifyingEvidenceSlots } from "./module4ValidityHelpers.js";

export {
  normalizeEvidenceKeys,
  normalizeEvidenceSnippets,
} from "./module4SnippetNormalize.js";

/** Jobs that expect evidence from both works. */
export const BOTH_WORKS_JOB_IDS = [
  "compare_both",
  "show_similarity",
  "show_difference",
  "trace_appeal",
];

export const CP6_LAYOUT_CONTRACT = {
  mobile: {
    singleColumn: true,
    fullWidthPrimaryActions: true,
    teacherGuidanceBelow: true,
    noHorizontalOverflow: true,
  },
  tablet: {
    pointJobTwoColumn: true,
  },
  desktop: {
    workspaceRail: true,
  },
};

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function canonicalJobId(paragraphRole) {
  const role = safeText(paragraphRole);
  if (!role) return "";
  if (isCustomParagraphJob(role)) return "custom";
  if (role === "similarity") return "show_similarity";
  if (role === "diff_speech" || role === "diff_letter" || role === "difference") {
    return "show_difference";
  }
  if (role === "ethos" || role === "pathos" || role === "logos" || role === "appeal") {
    return "trace_appeal";
  }
  return role;
}

function slotMatchesEvidenceKey(slot, evidenceKey) {
  if (!slot?.countsTowardEvidenceGate) return false;
  const key = safeText(evidenceKey);
  if (!key) return false;
  if (evidenceIdsMatch(slot.savedKey, key)) return true;
  const rowKey = safeText(
    slot.row?.evidenceKey || slot.row?.id || ""
  );
  if (rowKey && evidenceIdsMatch(rowKey, key)) return true;
  return false;
}

/**
 * Paragraph numbers (1-based) whose qualifying selected evidence matches this key.
 * Missing-only slots never count.
 */
export function paragraphNumbersUsingQualifyingEvidence({
  evidenceKey = "",
  buckets = [],
  getEvidenceSlots = () => [],
  excludeParagraphIndex = null,
} = {}) {
  const key = safeText(evidenceKey);
  if (!key) return [];
  const list = Array.isArray(buckets) ? buckets : [];
  const numbers = [];

  for (let index = 0; index < list.length; index += 1) {
    if (
      excludeParagraphIndex != null &&
      Number(excludeParagraphIndex) === index
    ) {
      continue;
    }
    const slots = getEvidenceSlots(list[index], index) || [];
    const hasMatch = (Array.isArray(slots) ? slots : []).some((slot) =>
      slotMatchesEvidenceKey(slot, key)
    );
    if (hasMatch) numbers.push(index + 1);
  }

  return numbers;
}

export function formatAlreadyUsedLabel(paragraphNumbers = []) {
  const nums = (Array.isArray(paragraphNumbers) ? paragraphNumbers : [])
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return "";
  if (nums.length === 1) return `Already used in Paragraph ${nums[0]}`;
  if (nums.length === 2) {
    return `Already used in Paragraph ${nums[0]} and Paragraph ${nums[1]}`;
  }
  const head = nums.slice(0, -1).map((n) => `Paragraph ${n}`);
  return `Already used in ${head.join(", ")}, and Paragraph ${nums[nums.length - 1]}`;
}

export function formatIntentionalReuseLabel(paragraphNumbers = []) {
  const nums = [
    ...new Set(
      (Array.isArray(paragraphNumbers) ? paragraphNumbers : [])
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0)
    ),
  ].sort((a, b) => a - b);
  if (nums.length < 2) return "";
  if (nums.length === 2) {
    return `Used intentionally in Paragraph ${nums[0]} and Paragraph ${nums[1]}`;
  }
  const head = nums.slice(0, -1).map((n) => `Paragraph ${n}`);
  return `Used intentionally in ${head.join(", ")}, and Paragraph ${nums[nums.length - 1]}`;
}

/**
 * Quiet reuse cue for one evidence option on the current paragraph step.
 * selectedHere: whether the current paragraph already has this key selected.
 */
export function getEvidenceReuseCue({
  evidenceKey = "",
  currentParagraphIndex = 0,
  selectedHere = false,
  buckets = [],
  getEvidenceSlots = () => [],
} = {}) {
  const others = paragraphNumbersUsingQualifyingEvidence({
    evidenceKey,
    buckets,
    getEvidenceSlots,
    excludeParagraphIndex: currentParagraphIndex,
  });

  if (others.length === 0) {
    return { show: false, label: "", kind: null, paragraphNumbers: [] };
  }

  if (selectedHere) {
    const all = [...others, currentParagraphIndex + 1].sort((a, b) => a - b);
    return {
      show: true,
      kind: "intentional",
      label: formatIntentionalReuseLabel(all),
      paragraphNumbers: all,
      blocksReuse: false,
    };
  }

  return {
    show: true,
    kind: "already_used",
    label: formatAlreadyUsedLabel(others),
    paragraphNumbers: others,
    blocksReuse: false,
  };
}

function sourceTypeFromSlot(slot) {
  const type = String(
    slot?.row?.type || slot?.row?.sourceType || ""
  ).toLowerCase();
  return type === "letter" ? "letter" : type === "speech" ? "speech" : "";
}

/**
 * Non-blocking cue when selected evidence sources may conflict with the job.
 */
export function getJobEvidenceSourceAlignmentCue({
  paragraphRole = "",
  evidenceSlots = [],
} = {}) {
  const jobId = canonicalJobId(paragraphRole);
  if (!jobId || jobId === "custom") return null;

  const unique = uniqueQualifyingEvidenceSlots(evidenceSlots);
  if (unique.length === 0) return null;

  let speechCount = 0;
  let letterCount = 0;
  for (const slot of unique) {
    const source = sourceTypeFromSlot(slot);
    if (source === "letter") letterCount += 1;
    else if (source === "speech") speechCount += 1;
  }

  const jobLabel = labelForParagraphJob(paragraphRole) || jobId;
  const selectedSummary =
    speechCount > 0 && letterCount > 0
      ? `Speech (${speechCount}) and Letter (${letterCount})`
      : speechCount > 0
        ? `Speech only (${speechCount})`
        : letterCount > 0
          ? `Letter only (${letterCount})`
          : "selected evidence";

  if (jobId === "analyze_speech" && letterCount > 0) {
    return {
      code: "speech_job_letter_evidence",
      title: "Check this evidence choice",
      message: `Your job is “${jobLabel},” which suggests Speech evidence. You currently have ${selectedSummary} selected. Review whether this pairing still fits—or keep it if you chose it on purpose.`,
      blocksContinue: false,
    };
  }

  if (jobId === "analyze_letter" && speechCount > 0) {
    return {
      code: "letter_job_speech_evidence",
      title: "Check this evidence choice",
      message: `Your job is “${jobLabel},” which suggests Letter evidence. You currently have ${selectedSummary} selected. Review whether this pairing still fits—or keep it if you chose it on purpose.`,
      blocksContinue: false,
    };
  }

  if (BOTH_WORKS_JOB_IDS.includes(jobId) && !(speechCount > 0 && letterCount > 0)) {
    return {
      code: "both_works_job_one_source",
      title: "Check this evidence choice",
      message: `Your job is “${jobLabel},” which usually draws on both works. You currently have ${selectedSummary} selected. Review whether you still want evidence from only one work—or add a quotation from the other when it fits.`,
      blocksContinue: false,
    };
  }

  return null;
}
