/**
 * Module 4 Checkpoint 3 — paragraph point vs organizational job helpers.
 * Presentation / derived coaching only. Persists through existing
 * `claim` (point) and `paragraphRole` (job) fields.
 */

import { SUCCESS_PROOF_PLAN_LABELS } from "../module3/moduleThreeSuccessHelpers.js";

export const PARAGRAPH_POINT_DEFINITION =
  "The point is what this paragraph will prove.";

export const PARAGRAPH_JOB_DEFINITION =
  "The job is how this paragraph does one part of the essay’s compare-and-contrast work.";

/** Proof-plan slot index → recommended organizational job id. */
export const PROOF_SLOT_RECOMMENDED_JOB_IDS = [
  "analyze_speech",
  "analyze_letter",
  "compare_both",
];

/**
 * Student-facing organizational job choices.
 * Stored in `paragraphRole` (except custom, which uses CUSTOM_JOB_PREFIX).
 */
export const PARAGRAPH_JOB_CHOICES = [
  { id: "analyze_speech", label: "Analyze the speech" },
  { id: "analyze_letter", label: "Analyze the letter" },
  { id: "compare_both", label: "Compare both works" },
  { id: "show_similarity", label: "Show an important similarity" },
  { id: "show_difference", label: "Show an important difference" },
  { id: "trace_appeal", label: "Trace one rhetorical appeal across both works" },
  { id: "custom", label: "Another organizational job" },
];

/**
 * Custom job convention in existing `paragraphRole` string:
 *   `custom:<short description>`
 * Example: `custom:Compare ethos in both openings`
 * No new storage column.
 */
export const CUSTOM_JOB_PREFIX = "custom:";

/**
 * Legacy Module 4 `paragraphRole` values → current student-facing labels.
 * Stored value is preserved until the student changes it.
 */
export const LEGACY_PARAGRAPH_ROLE_LABELS = {
  similarity: "Show an important similarity",
  diff_speech: "Shows a difference in the speech",
  diff_letter: "Shows a difference in the letter",
  ethos: "Focuses on ethos",
  pathos: "Focuses on pathos",
  logos: "Focuses on logos",
  difference: "Show an important difference",
  appeal: "Trace one rhetorical appeal across both works",
  general: "Organizational job",
  analyze_speech: "Analyze the speech",
  analyze_letter: "Analyze the letter",
  compare_both: "Compare both works",
  show_similarity: "Show an important similarity",
  show_difference: "Show an important difference",
  trace_appeal: "Trace one rhetorical appeal across both works",
};

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function isCustomParagraphJob(paragraphRole) {
  return safeText(paragraphRole).toLowerCase().startsWith(CUSTOM_JOB_PREFIX);
}

export function encodeCustomParagraphJob(description) {
  const text = safeText(description);
  return `${CUSTOM_JOB_PREFIX}${text}`;
}

export function decodeCustomParagraphJob(paragraphRole) {
  const raw = safeText(paragraphRole);
  if (!raw.toLowerCase().startsWith(CUSTOM_JOB_PREFIX)) return "";
  return raw.slice(CUSTOM_JOB_PREFIX.length).trim();
}

export function labelForParagraphJob(paragraphRole) {
  const role = safeText(paragraphRole);
  if (!role) return "";
  if (isCustomParagraphJob(role)) {
    const custom = decodeCustomParagraphJob(role);
    return custom ? `Another job: ${custom}` : "Another organizational job";
  }
  if (LEGACY_PARAGRAPH_ROLE_LABELS[role]) {
    return LEGACY_PARAGRAPH_ROLE_LABELS[role];
  }
  const choice = PARAGRAPH_JOB_CHOICES.find((opt) => opt.id === role);
  if (choice) return choice.label;
  return role;
}

/**
 * Proof-plan slots with original indices preserved (empty slots skipped).
 */
export function resolveProofPlanSlots(proofPlan = []) {
  const plan = Array.isArray(proofPlan) ? proofPlan : [];
  const slots = [];
  for (let index = 0; index < Math.min(plan.length, 3); index += 1) {
    const text = safeText(plan[index]);
    if (!text) continue;
    slots.push({
      slotIndex: index,
      text,
      roleLabel:
        SUCCESS_PROOF_PLAN_LABELS[index] || `Planning note ${index + 1}`,
      suggestionId: `proof-${index}`,
      recommendedJobId: PROOF_SLOT_RECOMMENDED_JOB_IDS[index] || "",
      recommendedJobLabel:
        labelForParagraphJob(PROOF_SLOT_RECOMMENDED_JOB_IDS[index]) || "",
    });
  }
  return slots;
}

export function proofPlanSlotForSuggestionId(proofPlan, suggestionId) {
  const id = safeText(suggestionId);
  const match = /^proof-(\d+)$/.exec(id);
  if (!match) return null;
  const slotIndex = Number(match[1]);
  return (
    resolveProofPlanSlots(proofPlan).find((slot) => slot.slotIndex === slotIndex) ||
    null
  );
}

/**
 * Recommended job for a paragraph.
 * Prefer the selected proof-plan suggestion slot; else the slot matching
 * the paragraph index when that note exists; else null (neutral choices).
 */
export function recommendParagraphJob({
  proofPlan = [],
  suggestionId = "",
  paragraphIndex = 0,
} = {}) {
  const fromSuggestion = proofPlanSlotForSuggestionId(proofPlan, suggestionId);
  if (fromSuggestion?.recommendedJobId) {
    return {
      jobId: fromSuggestion.recommendedJobId,
      jobLabel: fromSuggestion.recommendedJobLabel,
      slot: fromSuggestion,
      source: "suggestion",
    };
  }

  const slots = resolveProofPlanSlots(proofPlan);
  if (!slots.length) return null;

  const byParagraph = slots.find((slot) => slot.slotIndex === paragraphIndex);
  if (byParagraph?.recommendedJobId) {
    return {
      jobId: byParagraph.recommendedJobId,
      jobLabel: byParagraph.recommendedJobLabel,
      slot: byParagraph,
      source: "paragraph_index",
    };
  }

  return null;
}

export function paragraphJobChoicesForUi({
  proofPlan = [],
  currentRole = "",
} = {}) {
  const hasProofPlan = resolveProofPlanSlots(proofPlan).length > 0;
  const choices = PARAGRAPH_JOB_CHOICES.map((opt) => ({ ...opt }));
  const role = safeText(currentRole);

  if (
    role &&
    !isCustomParagraphJob(role) &&
    !PARAGRAPH_JOB_CHOICES.some((opt) => opt.id === role)
  ) {
    choices.unshift({
      id: role,
      label: labelForParagraphJob(role),
      isLegacy: true,
    });
  }

  return {
    choices,
    hasProofPlan,
    recommendNeutrally: !hasProofPlan,
  };
}

function mentionsSpeech(point) {
  return /\bspeech\b/i.test(point);
}

function mentionsLetter(point) {
  return /\bletter\b/i.test(point);
}

function mentionsBothWorks(point) {
  return (
    /\bboth\b/i.test(point) ||
    /\bcompare\b/i.test(point) ||
    /\bsimilar/i.test(point) ||
    (mentionsSpeech(point) && mentionsLetter(point))
  );
}

function canonicalJobId(paragraphRole) {
  const role = safeText(paragraphRole);
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

/**
 * Soft pairing coaching. Never blocks progression.
 */
export function getPointJobPairingCoaching({
  claim = "",
  paragraphRole = "",
  suggestionId = "",
  recommendedJobId = "",
} = {}) {
  const point = safeText(claim);
  const jobId = canonicalJobId(paragraphRole);
  if (!point || !jobId || jobId === "custom") return null;

  const speechOnly = mentionsSpeech(point) && !mentionsLetter(point);
  const letterOnly = mentionsLetter(point) && !mentionsSpeech(point);
  const both = mentionsBothWorks(point);

  if (speechOnly && jobId === "analyze_letter") {
    return {
      code: "speech_point_letter_job",
      message:
        "Check this pairing: your paragraph point mentions the speech, but the job is Analyze the letter.",
    };
  }
  if (letterOnly && jobId === "analyze_speech") {
    return {
      code: "letter_point_speech_job",
      message:
        "Check this pairing: your paragraph point mentions the letter, but the job is Analyze the speech.",
    };
  }
  if (both && (jobId === "analyze_speech" || jobId === "analyze_letter")) {
    return {
      code: "both_point_single_job",
      message:
        "Check this pairing: your paragraph point sounds like both works, but the job focuses on one work.",
    };
  }

  const slot = /^proof-(\d+)$/.exec(safeText(suggestionId));
  if (slot) {
    const slotIndex = Number(slot[1]);
    const expected = PROOF_SLOT_RECOMMENDED_JOB_IDS[slotIndex];
    if (
      expected === "analyze_speech" &&
      jobId === "analyze_letter"
    ) {
      return {
        code: "speech_slot_letter_job",
        message:
          "Check this pairing: you chose a Speech proof-plan note, but the job is Analyze the letter.",
      };
    }
    if (
      expected === "analyze_letter" &&
      jobId === "analyze_speech"
    ) {
      return {
        code: "letter_slot_speech_job",
        message:
          "Check this pairing: you chose a Letter proof-plan note, but the job is Analyze the speech.",
      };
    }
  }

  if (
    recommendedJobId &&
    jobId &&
    recommendedJobId !== jobId &&
    (recommendedJobId === "analyze_speech" ||
      recommendedJobId === "analyze_letter") &&
    (jobId === "analyze_speech" || jobId === "analyze_letter") &&
    recommendedJobId !== jobId
  ) {
    // Already covered by slot checks when suggestion present; keep quiet otherwise.
  }

  return null;
}

export function buildPriorParagraphJobSummaries(buckets = [], upToIndex = 0) {
  const list = Array.isArray(buckets) ? buckets : [];
  const summaries = [];
  for (let i = 0; i < Math.min(upToIndex, list.length); i += 1) {
    const job = labelForParagraphJob(list[i]?.paragraphRole);
    if (!job) continue;
    summaries.push({
      paragraphNumber: i + 1,
      jobLabel: job,
      point: safeText(list[i]?.claim),
    });
  }
  return summaries;
}

export function getRepeatedJobCoaching(buckets = [], currentIndex = 0) {
  const list = Array.isArray(buckets) ? buckets : [];
  const jobs = [];
  for (let i = 0; i <= currentIndex && i < list.length; i += 1) {
    const role = safeText(list[i]?.paragraphRole);
    if (!role) return null;
    jobs.push(canonicalJobId(role));
  }
  if (jobs.length < 2) return null;
  const first = jobs[0];
  if (jobs.every((job) => job === first)) {
    return "Check whether each paragraph is doing a distinct part of your argument.";
  }
  return null;
}

export function buildShelfParagraphSummary(bucket, index) {
  const point = safeText(bucket?.claim);
  const job = labelForParagraphJob(bucket?.paragraphRole);
  return {
    paragraphNumber: index + 1,
    point,
    jobLabel: job,
    hasPoint: Boolean(point),
    hasJob: Boolean(job),
  };
}

export function pointStepQuestion(paragraphNumber) {
  return `What point will Paragraph ${paragraphNumber} prove?`;
}

export function jobStepQuestion(paragraphNumber) {
  return `How will Paragraph ${paragraphNumber} do its part in the essay?`;
}

export function hasSelectedParagraphJob(paragraphRole) {
  const role = safeText(paragraphRole);
  if (!role) return false;
  if (isCustomParagraphJob(role)) {
    // Checkpoint 4 mechanical threshold for custom job descriptions.
    return decodeCustomParagraphJob(role).length >= 8;
  }
  return true;
}
