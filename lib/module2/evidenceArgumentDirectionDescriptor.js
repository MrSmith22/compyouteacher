/**
 * WP-087 — Shared direction descriptor for the evidence-to-argument slice.
 * Derived from WP-079 canonical frames — never a one-off enumerated gate list.
 */

import {
  WP079_APPEALS,
  WP079_RELATIONSHIP,
  generateCanonicalDirectionFrames,
  classifySameAppealRelationship,
  studentFacingSameAppealLabel,
  studentFacingCrossDominantLabel,
} from "./matrixEssayDirectionContract.js";
import { matrixCellId, ratingMap, readMatrixBundle } from "./rhetoricalMatrixHelpers.js";

const APPEAL_SET = new Set(WP079_APPEALS);

function safeText(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

function normalizeAppeal(value) {
  const v = safeText(value).toLowerCase();
  return APPEAL_SET.has(v) ? v : null;
}

/**
 * @returns {Set<string>}
 */
export function getCanonicalWp079OptionIds() {
  const frames = generateCanonicalDirectionFrames();
  return new Set(frames.all.map((f) => f.frameId));
}

/**
 * @param {unknown} optionId
 */
export function isCanonicalWp079OptionId(optionId) {
  const id = safeText(optionId);
  if (!id) return false;
  return getCanonicalWp079OptionIds().has(id);
}

/**
 * Parse option id into family + appeals without inventing missing custom appeals.
 * @param {string} optionId
 */
export function parseWp079OptionId(optionId) {
  const id = safeText(optionId);
  if (!id) {
    return { ok: false, error: "missing_option_id" };
  }

  if (id === "student_created") {
    return {
      ok: true,
      optionId: id,
      family: "student_created",
      speechAppeal: null,
      letterAppeal: null,
      appeal: null,
    };
  }

  const same = /^same_appeal:(ethos|pathos|logos)$/.exec(id);
  if (same) {
    const appeal = same[1];
    return {
      ok: true,
      optionId: id,
      family: "same_appeal",
      speechAppeal: appeal,
      letterAppeal: appeal,
      appeal,
    };
  }

  const cross = /^cross_dominant:(ethos|pathos|logos):(ethos|pathos|logos)$/.exec(id);
  if (cross) {
    const speechAppeal = cross[1];
    const letterAppeal = cross[2];
    if (speechAppeal === letterAppeal) {
      return { ok: false, error: "malformed_cross_same_appeal" };
    }
    return {
      ok: true,
      optionId: id,
      family: "cross_dominant",
      speechAppeal,
      letterAppeal,
      appeal: null,
    };
  }

  return { ok: false, error: "unknown_option_id" };
}

/**
 * Custom mapping is complete only when both works have appeal + evidence.
 * @param {unknown} mapping
 */
export function isFullyMappedCustom(mapping) {
  if (!mapping || typeof mapping !== "object") return false;
  const speechAppeal = normalizeAppeal(mapping.speechAppeal);
  const letterAppeal = normalizeAppeal(mapping.letterAppeal);
  const speechEvidenceId = safeText(mapping.speechEvidenceId);
  const letterEvidenceId = safeText(mapping.letterEvidenceId);
  const relationship = safeText(mapping.relationship);
  return Boolean(
    speechAppeal &&
      letterAppeal &&
      speechEvidenceId &&
      letterEvidenceId &&
      relationship
  );
}

const APPEAL_LABEL = Object.freeze({
  ethos: "credibility",
  pathos: "emotional appeal",
  logos: "logic",
});

/**
 * Student-facing relationship coaching (never writes the thesis).
 */
export function relationshipCoachingPrompt(relationship, { speechAppeal, letterAppeal } = {}) {
  const rel = safeText(relationship);
  if (rel === WP079_RELATIONSHIP.STRONG_CONTRAST) {
    return "How does the same appeal work differently for each audience or purpose?";
  }
  if (rel === WP079_RELATIONSHIP.MEANINGFUL_SIMILARITY) {
    return "What do both works share, and why might the effect still differ by audience or context?";
  }
  if (rel === WP079_RELATIONSHIP.NUANCED_DIFFERENCE) {
    return "What limited but meaningful difference do you notice—without exaggerating it?";
  }
  if (rel === "cross_dominant") {
    const s = APPEAL_LABEL[speechAppeal] || "one appeal";
    const l = APPEAL_LABEL[letterAppeal] || "another appeal";
    return `Why does the speech emphasize ${s} while the letter emphasizes ${l} for its audience and purpose?`;
  }
  if (rel === "student_created" || rel) {
    return "What relationship between the two works do you want to investigate?";
  }
  return "What is similar or different across the two works?";
}

/**
 * Build a normalized direction descriptor from a selected option + optional matrix.
 *
 * @param {{
 *   optionId?: string|null,
 *   selectedPattern?: object|null,
 *   matrixBundle?: object|null,
 *   customMapping?: object|null,
 *   customLabel?: string|null,
 *   signature?: string|null,
 * }} [input]
 */
export function buildEvidenceArgumentDirectionDescriptor(input = {}) {
  const optionId = safeText(
    input.optionId ||
      input.selectedPattern?.optionId ||
      input.selectedPattern?.id ||
      ""
  );
  const parsed = parseWp079OptionId(optionId);
  if (!parsed.ok) {
    return {
      ok: false,
      optionId: optionId || null,
      family: null,
      label: "",
      speechAppeal: null,
      letterAppeal: null,
      relationship: null,
      speechCellId: null,
      letterCellId: null,
      ratings: {},
      signature: safeText(input.signature) || null,
      mappingComplete: false,
      mappingReason: parsed.error || "unknown_option_id",
      customMapping: null,
    };
  }

  const bundle = readMatrixBundle(input.matrixBundle) || input.matrixBundle;
  const R = ratingMap(bundle);
  const provenanceRatings =
    input.ratings ||
    input.selectedPattern?.provenance?.ratings ||
    input.selectedPattern?.ratings ||
    null;
  const customMapping =
    input.customMapping && typeof input.customMapping === "object"
      ? {
          speechAppeal: normalizeAppeal(input.customMapping.speechAppeal),
          letterAppeal: normalizeAppeal(input.customMapping.letterAppeal),
          relationship: safeText(input.customMapping.relationship) || null,
          speechEvidenceId: safeText(input.customMapping.speechEvidenceId) || null,
          letterEvidenceId: safeText(input.customMapping.letterEvidenceId) || null,
          label: safeText(input.customMapping.label) || null,
        }
      : null;

  let speechAppeal = parsed.speechAppeal;
  let letterAppeal = parsed.letterAppeal;
  let relationship = null;
  let label = safeText(input.selectedPattern?.label || input.customLabel);
  let mappingComplete = false;
  let mappingReason = "";

  function ratingFor(sourceType, appeal) {
    if (R?.[sourceType]?.[appeal] != null) return R[sourceType][appeal];
    const fromProv = provenanceRatings?.[sourceType]?.[appeal];
    return fromProv != null ? fromProv : null;
  }

  if (parsed.family === "same_appeal") {
    const speechRating = ratingFor("speech", speechAppeal);
    const letterRating = ratingFor("letter", letterAppeal);
    relationship = classifySameAppealRelationship(speechRating, letterRating);
    if (!label) {
      label = studentFacingSameAppealLabel(speechAppeal, relationship);
    }
    // In Module 3 the direction is already selected; if ratings are missing from
    // the handoff, do not block the staged builder — treat as mapped.
    mappingComplete =
      relationship !== WP079_RELATIONSHIP.TOO_WEAK ||
      (speechRating == null && letterRating == null);
    mappingReason = mappingComplete
      ? ""
      : "weak_same_appeal_signal";
  } else if (parsed.family === "cross_dominant") {
    relationship = "cross_dominant";
    if (!label) {
      label = studentFacingCrossDominantLabel(speechAppeal, letterAppeal);
    }
    mappingComplete = true;
  } else {
    // student_created — never invent appeals
    speechAppeal = customMapping?.speechAppeal || null;
    letterAppeal = customMapping?.letterAppeal || null;
    relationship = customMapping?.relationship || "student_created";
    if (!label) {
      label =
        customMapping?.label ||
        safeText(input.selectedPattern?.label) ||
        "Another pattern I notice";
    }
    mappingComplete = isFullyMappedCustom(customMapping);
    mappingReason = mappingComplete
      ? ""
      : "custom_mapping_incomplete";
  }

  const speechCellId = speechAppeal ? matrixCellId("speech", speechAppeal) : null;
  const letterCellId = letterAppeal ? matrixCellId("letter", letterAppeal) : null;

  const ratings = {};
  if (speechAppeal) {
    ratings.speech = { [speechAppeal]: ratingFor("speech", speechAppeal) };
  }
  if (letterAppeal) {
    ratings.letter = { [letterAppeal]: ratingFor("letter", letterAppeal) };
  }

  return {
    ok: true,
    optionId: parsed.optionId,
    family: parsed.family,
    label,
    speechAppeal,
    letterAppeal,
    relationship,
    speechCellId,
    letterCellId,
    ratings,
    signature: safeText(input.signature) || null,
    mappingComplete,
    mappingReason,
    customMapping: parsed.family === "student_created" ? customMapping : null,
    coachingPrompt: relationshipCoachingPrompt(relationship, {
      speechAppeal,
      letterAppeal,
    }),
  };
}

export { WP079_RELATIONSHIP, WP079_APPEALS };
