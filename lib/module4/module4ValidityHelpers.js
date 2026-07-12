/**
 * Module 4 Checkpoint 4 — mechanical completeness gates.
 * Selected state, allowed options, trimmed length, resolvable evidence only.
 * Does not grade writing quality, grammar, accuracy, or insight.
 */

import { bucketHasQualifyingEvidence } from "./module4EvidenceContinuity.js";
import {
  CUSTOM_JOB_PREFIX,
  LEGACY_PARAGRAPH_ROLE_LABELS,
  PARAGRAPH_JOB_CHOICES,
  decodeCustomParagraphJob,
  isCustomParagraphJob,
} from "./module4PointJobHelpers.js";

export const POINT_MIN_CHARS = 15;
export const CUSTOM_JOB_MIN_CHARS = 8;
export const REASONING_MIN_CHARS = 20;
export const REFLECTION_MIN_CHARS = 15;

export const POINT_MESSAGES = {
  empty: "Write the point this paragraph will prove.",
  incomplete: "Add a little more. State the idea this paragraph will prove.",
  ready: "This paragraph point is ready for the next planning decision.",
};

export const JOB_MESSAGES = {
  empty: "Choose how this paragraph will do its part in the essay.",
  incomplete: "Describe the organizational job a little more clearly.",
  ready: "The paragraph point and job are set.",
};

export const EVIDENCE_MESSAGES = {
  empty: "Choose at least one quotation that fits this paragraph point and job.",
  unresolved: "Choose a quotation that is still available in your evidence set.",
  ready: "This paragraph has evidence ready to explain.",
};

export const REASONING_MESSAGES = {
  empty:
    "Explain how the selected evidence supports this paragraph point and the thesis.",
  incomplete:
    "Add a little more explanation. Connect what the evidence shows to your paragraph point or thesis.",
  ready: "This paragraph has a complete planning explanation.",
};

export const REFLECTION_MESSAGES = {
  empty: "Write one clear reflection sentence before continuing.",
  incomplete:
    "Add a little more so your reflection names a strength, connection, or next step.",
  ready: "Your reflection is ready.",
};

export const REFLECTION_INSTRUCTION =
  "Write at least one clear sentence about how your paragraph plans work together or what you may adjust in Module 5.";

export const THIRD_DECISION_MESSAGES = {
  empty: "Choose whether you need a third body paragraph.",
  ready: "Your third-paragraph choice is set.",
};

const PREDEFINED_JOB_IDS = new Set(
  PARAGRAPH_JOB_CHOICES.filter((opt) => opt.id !== "custom").map((opt) => opt.id)
);

const LEGACY_RECOGNIZED_JOB_IDS = new Set(
  Object.keys(LEGACY_PARAGRAPH_ROLE_LABELS).filter((id) => id !== "custom")
);

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function charHelper(count, minimum) {
  return `${count} of ${minimum} characters needed`;
}

function fieldResult({
  valid,
  state,
  message,
  count = 0,
  minimum = 0,
  showCountHelper = false,
}) {
  return {
    valid: Boolean(valid),
    state,
    message,
    count,
    minimum,
    countHelper:
      showCountHelper && !valid && state !== "empty"
        ? charHelper(count, minimum)
        : showCountHelper && state === "empty"
          ? charHelper(0, minimum)
          : "",
  };
}

/** Recognized predefined or legacy roles that satisfy the job gate. */
export function isRecognizedParagraphJob(paragraphRole) {
  const role = safeText(paragraphRole);
  if (!role || isCustomParagraphJob(role)) return false;
  if (PREDEFINED_JOB_IDS.has(role)) return true;
  if (LEGACY_RECOGNIZED_JOB_IDS.has(role)) return true;
  return false;
}

export function validateParagraphPoint(claim) {
  const text = safeText(claim);
  const count = text.length;
  if (count === 0) {
    return fieldResult({
      valid: false,
      state: "empty",
      message: POINT_MESSAGES.empty,
      count: 0,
      minimum: POINT_MIN_CHARS,
      showCountHelper: true,
    });
  }
  if (count < POINT_MIN_CHARS) {
    return fieldResult({
      valid: false,
      state: "incomplete",
      message: POINT_MESSAGES.incomplete,
      count,
      minimum: POINT_MIN_CHARS,
      showCountHelper: true,
    });
  }
  return fieldResult({
    valid: true,
    state: "ready",
    message: POINT_MESSAGES.ready,
    count,
    minimum: POINT_MIN_CHARS,
  });
}

/**
 * Job is valid only when explicitly selected.
 * A proof-plan recommendation does not count until chosen.
 */
export function validateParagraphJob(paragraphRole) {
  const role = safeText(paragraphRole);
  if (!role) {
    return fieldResult({
      valid: false,
      state: "empty",
      message: JOB_MESSAGES.empty,
    });
  }

  if (isCustomParagraphJob(role)) {
    const description = decodeCustomParagraphJob(role);
    const count = description.length;
    if (count < CUSTOM_JOB_MIN_CHARS) {
      return fieldResult({
        valid: false,
        state: count === 0 ? "empty" : "incomplete",
        message:
          count === 0 ? JOB_MESSAGES.empty : JOB_MESSAGES.incomplete,
        count,
        minimum: CUSTOM_JOB_MIN_CHARS,
        showCountHelper: true,
      });
    }
    return fieldResult({
      valid: true,
      state: "ready",
      message: JOB_MESSAGES.ready,
      count,
      minimum: CUSTOM_JOB_MIN_CHARS,
    });
  }

  if (isRecognizedParagraphJob(role)) {
    return fieldResult({
      valid: true,
      state: "ready",
      message: JOB_MESSAGES.ready,
    });
  }

  return fieldResult({
    valid: false,
    state: "incomplete",
    message: JOB_MESSAGES.empty,
  });
}

function qualifyingEvidenceIdentity(slot) {
  if (!slot?.countsTowardEvidenceGate) return "";
  const rowKey =
    (slot.row &&
      (slot.row.evidenceKey ||
        slot.row.id ||
        `${slot.row.type || ""}|${slot.row.category || ""}`)) ||
    "";
  return String(rowKey || slot.savedKey || "").trim();
}

/**
 * Unique gate-qualifying evidence slots (duplicate aliases count once).
 */
export function uniqueQualifyingEvidenceSlots(slots = []) {
  const list = Array.isArray(slots) ? slots : [];
  const seen = new Set();
  const unique = [];
  for (const slot of list) {
    if (!slot?.countsTowardEvidenceGate) continue;
    const identity = qualifyingEvidenceIdentity(slot);
    if (!identity || seen.has(identity)) continue;
    seen.add(identity);
    unique.push(slot);
  }
  return unique;
}

export function validateParagraphEvidence(slots = []) {
  const list = Array.isArray(slots) ? slots : [];
  const unique = uniqueQualifyingEvidenceSlots(list);
  if (unique.length > 0) {
    return fieldResult({
      valid: true,
      state: "ready",
      message: EVIDENCE_MESSAGES.ready,
      count: unique.length,
    });
  }

  const hasSelectedKeys = list.some((slot) => safeText(slot?.savedKey));
  if (!hasSelectedKeys) {
    return fieldResult({
      valid: false,
      state: "empty",
      message: EVIDENCE_MESSAGES.empty,
    });
  }

  return fieldResult({
    valid: false,
    state: "unresolved",
    message: EVIDENCE_MESSAGES.unresolved,
  });
}

export function validateParagraphReasoning(reasoning) {
  const text = safeText(reasoning);
  const count = text.length;
  if (count === 0) {
    return fieldResult({
      valid: false,
      state: "empty",
      message: REASONING_MESSAGES.empty,
      count: 0,
      minimum: REASONING_MIN_CHARS,
      showCountHelper: true,
    });
  }
  if (count < REASONING_MIN_CHARS) {
    return fieldResult({
      valid: false,
      state: "incomplete",
      message: REASONING_MESSAGES.incomplete,
      count,
      minimum: REASONING_MIN_CHARS,
      showCountHelper: true,
    });
  }
  return fieldResult({
    valid: true,
    state: "ready",
    message: REASONING_MESSAGES.ready,
    count,
    minimum: REASONING_MIN_CHARS,
  });
}

export function validateReflection(reflection) {
  const text = safeText(reflection);
  const count = text.length;
  if (count === 0) {
    return fieldResult({
      valid: false,
      state: "empty",
      message: REFLECTION_MESSAGES.empty,
      count: 0,
      minimum: REFLECTION_MIN_CHARS,
      showCountHelper: true,
    });
  }
  if (count < REFLECTION_MIN_CHARS) {
    return fieldResult({
      valid: false,
      state: "incomplete",
      message: REFLECTION_MESSAGES.incomplete,
      count,
      minimum: REFLECTION_MIN_CHARS,
      showCountHelper: true,
    });
  }
  return fieldResult({
    valid: true,
    state: "ready",
    message: REFLECTION_MESSAGES.ready,
    count,
    minimum: REFLECTION_MIN_CHARS,
  });
}

export function validateThirdParagraphDecision(wantThirdBucket) {
  if (wantThirdBucket === true || wantThirdBucket === false) {
    return fieldResult({
      valid: true,
      state: "ready",
      message: THIRD_DECISION_MESSAGES.ready,
    });
  }
  return fieldResult({
    valid: false,
    state: "empty",
    message: THIRD_DECISION_MESSAGES.empty,
  });
}

/**
 * A paragraph is mechanically planned only when all four parts are valid.
 * Flow position alone does not mark a paragraph planned.
 */
export function isParagraphMechanicallyPlanned(bucket, evidenceSlots = []) {
  return (
    validateParagraphPoint(bucket?.claim).valid &&
    validateParagraphJob(bucket?.paragraphRole).valid &&
    validateParagraphEvidence(evidenceSlots).valid &&
    validateParagraphReasoning(bucket?.reasoning).valid
  );
}

export function plannedParagraphIndices({
  buckets = [],
  wantThirdBucket = null,
  getEvidenceSlots = () => [],
} = {}) {
  const list = Array.isArray(buckets) ? buckets : [];
  const requiredCount = wantThirdBucket === true ? 3 : Math.min(list.length, 2);
  const planned = [];
  for (let i = 0; i < requiredCount; i += 1) {
    const slots = getEvidenceSlots(list[i], i) || [];
    if (isParagraphMechanicallyPlanned(list[i], slots)) {
      planned.push(i);
    }
  }
  return planned;
}

export function areRequiredParagraphsPlanned({
  buckets = [],
  wantThirdBucket = null,
  getEvidenceSlots = () => [],
} = {}) {
  const list = Array.isArray(buckets) ? buckets : [];
  const requiredCount = wantThirdBucket === true ? 3 : 2;
  for (let i = 0; i < requiredCount; i += 1) {
    const slots = getEvidenceSlots(list[i], i) || [];
    if (!isParagraphMechanicallyPlanned(list[i], slots)) return false;
  }
  return true;
}

/**
 * Shared advance gate for Continue / submit handlers.
 * Returns { ok, message, field } — handler must refuse when ok is false.
 */
export function evaluateModule4Advance({
  flowStep,
  buckets = [],
  reflection = "",
  wantThirdBucket = null,
  patternChoice = "",
  hasSavedPattern = false,
  hasPatternPair = true,
  getEvidenceSlots = () => [],
  stepConstants = {},
} = {}) {
  const {
    STEP_HANDOFF = 0,
    STEP_WELCOME = 0,
    STEP_BIG_PICTURE = 1,
    STEP_EXPLAIN_BUCKETS = 2,
    STEP_PATTERN = 3,
    STEP_B1_SCAFFOLD = 4,
    STEP_B1_ROLE = 5,
    STEP_B1_EVIDENCE = 6,
    STEP_B1_REASONING = 7,
    STEP_B2_SCAFFOLD = 8,
    STEP_B2_ROLE = 9,
    STEP_B2_EVIDENCE = 10,
    STEP_B2_REASONING = 11,
    STEP_THIRD_DECISION = 12,
    STEP_B3_SCAFFOLD = 13,
    STEP_B3_ROLE = 14,
    STEP_B3_EVIDENCE = 15,
    STEP_B3_REASONING = 16,
    STEP_REFLECTION = 17,
  } = stepConstants;

  const bucketIndexForStep = (step) => {
    if (step >= STEP_B1_SCAFFOLD && step <= STEP_B1_REASONING) return 0;
    if (step >= STEP_B2_SCAFFOLD && step <= STEP_B2_REASONING) return 1;
    if (step >= STEP_B3_SCAFFOLD && step <= STEP_B3_REASONING) return 2;
    return -1;
  };

  const step = Number(flowStep);

  if (
    step === STEP_HANDOFF ||
    step === STEP_WELCOME ||
    step === STEP_BIG_PICTURE ||
    step === STEP_EXPLAIN_BUCKETS
  ) {
    return { ok: true, message: "", field: null };
  }

  if (step === STEP_PATTERN) {
    if (hasSavedPattern) return { ok: true, message: "", field: null };
    if (!hasPatternPair) return { ok: true, message: "", field: null };
    if (safeText(patternChoice)) return { ok: true, message: "", field: null };
    return {
      ok: false,
      message: "Choose a pattern before Paragraph 1.",
      field: "pattern",
    };
  }

  const scaffoldSteps = [STEP_B1_SCAFFOLD, STEP_B2_SCAFFOLD, STEP_B3_SCAFFOLD];
  if (scaffoldSteps.includes(step)) {
    const i = bucketIndexForStep(step);
    const result = validateParagraphPoint(buckets[i]?.claim);
    return {
      ok: result.valid,
      message: result.valid ? "" : result.message,
      field: "point",
      result,
    };
  }

  const roleSteps = [STEP_B1_ROLE, STEP_B2_ROLE, STEP_B3_ROLE];
  if (roleSteps.includes(step)) {
    const i = bucketIndexForStep(step);
    const result = validateParagraphJob(buckets[i]?.paragraphRole);
    return {
      ok: result.valid,
      message: result.valid ? "" : result.message,
      field: "job",
      result,
    };
  }

  const evidenceSteps = [STEP_B1_EVIDENCE, STEP_B2_EVIDENCE, STEP_B3_EVIDENCE];
  if (evidenceSteps.includes(step)) {
    const i = bucketIndexForStep(step);
    const slots = getEvidenceSlots(buckets[i], i) || [];
    const result = validateParagraphEvidence(slots);
    return {
      ok: result.valid,
      message: result.valid ? "" : result.message,
      field: "evidence",
      result,
    };
  }

  const reasoningSteps = [
    STEP_B1_REASONING,
    STEP_B2_REASONING,
    STEP_B3_REASONING,
  ];
  if (reasoningSteps.includes(step)) {
    const i = bucketIndexForStep(step);
    const result = validateParagraphReasoning(buckets[i]?.reasoning);
    return {
      ok: result.valid,
      message: result.valid ? "" : result.message,
      field: "reasoning",
      result,
    };
  }

  if (step === STEP_THIRD_DECISION) {
    return {
      ok: false,
      message: THIRD_DECISION_MESSAGES.empty,
      field: "third",
    };
  }

  if (step === STEP_REFLECTION) {
    const reflectionResult = validateReflection(reflection);
    if (!reflectionResult.valid) {
      return {
        ok: false,
        message: reflectionResult.message,
        field: "reflection",
        result: reflectionResult,
      };
    }
    const plannedOk = areRequiredParagraphsPlanned({
      buckets,
      wantThirdBucket,
      getEvidenceSlots,
    });
    if (!plannedOk) {
      return {
        ok: false,
        message:
          wantThirdBucket === true
            ? "Finish planning Paragraph 3 before continuing."
            : "Finish planning Paragraphs 1 and 2 before continuing.",
        field: "paragraphs",
      };
    }
    return { ok: true, message: "", field: null, result: reflectionResult };
  }

  return { ok: false, message: "Keep going on the current step.", field: null };
}

export function canAdvanceModule4Step(args) {
  return evaluateModule4Advance(args).ok;
}

/** Compatibility with older evidence helper naming. */
export function evidenceGatePasses(slots) {
  return (
    validateParagraphEvidence(slots).valid ||
    bucketHasQualifyingEvidence(slots)
  );
}

// Touch CUSTOM_JOB_PREFIX so custom encoding stays documented beside gates.
void CUSTOM_JOB_PREFIX;
