/**
 * WP-086 / WP-087 — Shared evidence-to-argument provenance contract.
 * Additive over CP-B normalizeEvidenceReader. Pure helpers; never invent quotes.
 * WP-087 generalizes pairing across all WP-079 canonical frames + mapped custom.
 */

import {
  normalizeEvidenceReader,
} from "../module2/normalizeEvidenceReader.js";
import { evidenceIdsMatch } from "../shared/evidenceIdAliases.js";
import { MATRIX_CELL_ORDER, matrixCellId } from "../module2/rhetoricalMatrixHelpers.js";
import {
  buildEvidenceArgumentDirectionDescriptor,
  isFullyMappedCustom,
} from "../module2/evidenceArgumentDirectionDescriptor.js";

export const EVIDENCE_ARGUMENT_SCHEMA_VERSION = 2;
/** Legacy WP-086 persisted slice version (pathos/logos representative only). */
export const EVIDENCE_ARGUMENT_SCHEMA_VERSION_V1 = 1;

/** Browser-safe fingerprint (not cryptographic). Never log the payload. */
function fingerprint(payload) {
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `s${(hash >>> 0).toString(16).padStart(8, "0")}${payload.length.toString(16)}`;
}

/**
 * WP-086 fixture alias — legacy representative frame for normalize/resume tests.
 * Not the runtime gate (WP-087 opens all canonical / fully mapped custom directions).
 */
export const WP086_REPRESENTATIVE_OPTION_ID = "cross_dominant:pathos:logos";

export const WP086_WALKTHROUGH_RATINGS = Object.freeze([6, 8, 10, 4, 4, 9]);

export const HEALTH_SEVERITY = Object.freeze({
  ADVISORY: "advisory",
  BLOCKING: "blocking",
});

export const HEALTH_CODES = Object.freeze({
  MISSING_SOURCE: "missing_source",
  QUOTE_NOT_IN_SOURCE: "quote_not_in_source",
  WRONG_SOURCE: "wrong_source",
  MISSING_EFFECT: "missing_effect",
  MISSING_PURPOSE: "missing_purpose",
  DETACHED_ID: "detached_id",
  STALE_AFTER_SOURCE_EDIT: "stale_after_source_edit",
  ONE_WORK_ONLY: "one_work_only",
  LEGACY_FRAGMENT: "legacy_fragment",
  BLANK_VS_EXPLICIT_ZERO: "blank_vs_explicit_zero",
  MISSING_QUOTE_AND_LOCATOR: "missing_quote_and_locator",
  DUPLICATE_EVIDENCE: "duplicate_evidence",
});

/** Student-facing copy must never expose these terms. */
export const WP086_FORBIDDEN_STUDENT_COPY = Object.freeze([
  "artifact",
  "provenance",
  "signature",
  "semantic validation",
  "canonical frame",
  "hydration",
  "health flag",
]);

export const EVIDENCE_ARGUMENT_STEPS = Object.freeze([
  {
    id: "ea_reorient",
    question: "What comparison direction did you choose?",
  },
  {
    id: "ea_reread",
    question: "Reread one passage from each work.",
  },
  {
    id: "ea_repair",
    question: "Does either side need stronger evidence?",
  },
  {
    id: "ea_explain",
    question: "How does each passage work for its audience?",
  },
  {
    id: "ea_pattern",
    question: "What is similar or different across the two works?",
  },
  {
    id: "ea_significance",
    question: "Why does that difference matter for audience or purpose?",
  },
  {
    id: "ea_larger_point",
    question: "What larger point can the essay prove?",
  },
  {
    id: "ea_proof_directions",
    question: "What sections will prove it?",
  },
  {
    id: "ea_argument_map",
    question: "Does this argument map look ready?",
  },
]);

function safeText(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

function normalizeSourceKind(value) {
  const v = safeText(value).toLowerCase();
  if (v === "letter" || v === "lfbj") return "letter";
  if (v === "speech" || v === "mlk") return "speech";
  return v === "speech" || v === "letter" ? v : "";
}

/**
 * Deterministic fingerprint of a saved working source (never logs prose).
 * @param {{ text?: string, citation?: string, siteName?: string, year?: string|number|null }} source
 */
export function buildSourceRecordSignature(source = {}) {
  const text = safeText(source.text);
  if (!text) return null;
  const payload = [
    text,
    safeText(source.citation),
    safeText(source.siteName),
    source.year == null ? "" : String(source.year),
  ].join("\n");
  return fingerprint(payload);
}

/**
 * Find quote in source text; return surrounding context only when matched.
 * Never invent a quote.
 */
export function findQuoteInSource(quotation, sourceText, { radius = 80 } = {}) {
  const quote = safeText(quotation);
  const source = typeof sourceText === "string" ? sourceText : "";
  if (!quote || !source) {
    return { found: false, index: -1, contextSnippet: "" };
  }
  const index = source.indexOf(quote);
  if (index === -1) {
    // Soft match: collapse whitespace
    const collapsedSource = source.replace(/\s+/g, " ");
    const collapsedQuote = quote.replace(/\s+/g, " ");
    const soft = collapsedSource.indexOf(collapsedQuote);
    if (soft === -1) {
      return { found: false, index: -1, contextSnippet: "" };
    }
    const start = Math.max(0, soft - radius);
    const end = Math.min(collapsedSource.length, soft + collapsedQuote.length + radius);
    return {
      found: true,
      index: soft,
      contextSnippet: collapsedSource.slice(start, end),
      softMatch: true,
    };
  }
  const start = Math.max(0, index - radius);
  const end = Math.min(source.length, index + quote.length + radius);
  return {
    found: true,
    index,
    contextSnippet: source.slice(start, end),
    softMatch: false,
  };
}

/**
 * Normalize one evidence record into the WP-086 contract shape.
 * @param {object} record — from normalizeEvidenceReader
 * @param {{
 *   speechText?: string,
 *   letterText?: string,
 *   speechSignature?: string|null,
 *   letterSignature?: string|null,
 *   selectedDirectionId?: string|null,
 *   selectedDirectionSignature?: string|null,
 *   ratingCellId?: string|null,
 *   comparisonRole?: string|null,
 * }} [ctx]
 */
export function toEvidenceArgumentRecord(record, ctx = {}) {
  if (!record || typeof record !== "object") return null;
  const sourceKind = normalizeSourceKind(record.sourceType);
  const quotation = safeText(record.quotation);
  const sourceText =
    sourceKind === "letter" ? ctx.letterText : sourceKind === "speech" ? ctx.speechText : "";
  const match = quotation
    ? findQuoteInSource(quotation, sourceText)
    : { found: false, index: -1, contextSnippet: "" };
  const sourceRecordSignature =
    sourceKind === "letter"
      ? ctx.letterSignature || null
      : sourceKind === "speech"
        ? ctx.speechSignature || null
        : null;

  return {
    schemaVersion: EVIDENCE_ARGUMENT_SCHEMA_VERSION,
    id: String(record.id || ""),
    sourceId: sourceKind || null,
    sourceKind: sourceKind || null,
    sourceRecordSignature,
    quotation,
    passageLocator: safeText(record.passageLocator) || null,
    contextSnippet: match.found ? match.contextSnippet : "",
    quoteFoundInSource: quotation ? match.found : null,
    studentObservation: safeText(record.studentObservation),
    rhetoricalChoice: safeText(record.appeal) || null,
    audienceEffect: safeText(record.audienceNote || record.audienceEffect),
    purposeContribution: safeText(record.purposeNote || record.purposeConnection),
    ratingCellId: ctx.ratingCellId || null,
    comparisonRole: ctx.comparisonRole || null,
    selectedDirectionId: ctx.selectedDirectionId || null,
    selectedDirectionSignature: ctx.selectedDirectionSignature || null,
    originalStorageSource: record.originalStorageSource || null,
    writeCompatible: Boolean(record.writeCompatible),
    legacy: Boolean(record.legacy),
    aliases: Array.isArray(record.aliases) ? [...record.aliases] : [],
    updatedAt: record.updatedAt || null,
  };
}

/**
 * Build contract records from tchart/guided rows + source texts.
 */
export function buildEvidenceArgumentRecords({
  tchartRows = [],
  guidedRows = [],
  speechText = "",
  letterText = "",
  speechSignature = null,
  letterSignature = null,
  selectedDirectionId = null,
  selectedDirectionSignature = null,
} = {}) {
  const normalized = normalizeEvidenceReader({ tchartRows, guidedRows });
  const speechSig =
    speechSignature || buildSourceRecordSignature({ text: speechText });
  const letterSig =
    letterSignature || buildSourceRecordSignature({ text: letterText });

  return normalized
    .map((record) =>
      toEvidenceArgumentRecord(record, {
        speechText,
        letterText,
        speechSignature: speechSig,
        letterSignature: letterSig,
        selectedDirectionId,
        selectedDirectionSignature,
      })
    )
    .filter(Boolean);
}

/**
 * Diagnose health for one evidence record.
 * @returns {{ code: string, severity: string, message: string }[]}
 */
export function diagnoseEvidenceHealth(record, {
  speechText = "",
  letterText = "",
  expectedSourceKind = null,
  currentSpeechSignature = null,
  currentLetterSignature = null,
} = {}) {
  const findings = [];
  if (!record) {
    findings.push({
      code: HEALTH_CODES.DETACHED_ID,
      severity: HEALTH_SEVERITY.BLOCKING,
      message: "This evidence could not be found.",
    });
    return findings;
  }

  const sourceKind = normalizeSourceKind(record.sourceKind || record.sourceId);
  const sourceText =
    sourceKind === "letter" ? letterText : sourceKind === "speech" ? speechText : "";

  if (!sourceText) {
    findings.push({
      code: HEALTH_CODES.MISSING_SOURCE,
      severity: HEALTH_SEVERITY.BLOCKING,
      message: "The saved source text for this passage is missing.",
    });
  }

  if (expectedSourceKind && sourceKind && expectedSourceKind !== sourceKind) {
    findings.push({
      code: HEALTH_CODES.WRONG_SOURCE,
      severity: HEALTH_SEVERITY.BLOCKING,
      message: "This passage is labeled for the wrong work.",
    });
  }

  const quotation = safeText(record.quotation);
  const locator = safeText(record.passageLocator);
  if (!quotation && !locator) {
    findings.push({
      code: HEALTH_CODES.MISSING_QUOTE_AND_LOCATOR,
      severity: HEALTH_SEVERITY.BLOCKING,
      message: "This note does not include an exact quotation or passage reference.",
    });
  } else if (quotation && sourceText) {
    const match = findQuoteInSource(quotation, sourceText);
    if (!match.found) {
      findings.push({
        code: HEALTH_CODES.QUOTE_NOT_IN_SOURCE,
        severity: HEALTH_SEVERITY.BLOCKING,
        message: "This quotation was not found in the saved source text.",
      });
    }
  }

  if (!safeText(record.audienceEffect)) {
    findings.push({
      code: HEALTH_CODES.MISSING_EFFECT,
      severity: HEALTH_SEVERITY.ADVISORY,
      message: "Add what this choice may do for the audience.",
    });
  }

  if (!safeText(record.purposeContribution)) {
    findings.push({
      code: HEALTH_CODES.MISSING_PURPOSE,
      severity: HEALTH_SEVERITY.ADVISORY,
      message: "Add how this choice supports the author’s purpose.",
    });
  }

  if (
    !quotation &&
    !safeText(record.studentObservation) &&
    (record.legacy || !record.writeCompatible)
  ) {
    findings.push({
      code: HEALTH_CODES.LEGACY_FRAGMENT,
      severity: HEALTH_SEVERITY.ADVISORY,
      message: "This saved note looks incomplete. Review it before using it as evidence.",
    });
  }

  const currentSig =
    sourceKind === "letter"
      ? currentLetterSignature
      : sourceKind === "speech"
        ? currentSpeechSignature
        : null;
  if (
    record.sourceRecordSignature &&
    currentSig &&
    record.sourceRecordSignature !== currentSig
  ) {
    findings.push({
      code: HEALTH_CODES.STALE_AFTER_SOURCE_EDIT,
      severity: HEALTH_SEVERITY.ADVISORY,
      message: "The saved source text changed after this note was made. Check the quotation.",
    });
  }

  return findings;
}

/**
 * Matrix cell evidence / explicit-zero traceability.
 */
export function diagnoseMatrixCellTraceability(cell, evidenceRecords = []) {
  const findings = [];
  if (!cell || typeof cell !== "object") {
    return [
      {
        code: HEALTH_CODES.DETACHED_ID,
        severity: HEALTH_SEVERITY.BLOCKING,
        message: "A rating cell is missing.",
      },
    ];
  }

  const rating = cell.rating;
  if (rating == null || Number.isNaN(Number(rating))) {
    findings.push({
      code: HEALTH_CODES.BLANK_VS_EXPLICIT_ZERO,
      severity: HEALTH_SEVERITY.ADVISORY,
      message: "This rating is not finished yet (blank is not the same as zero).",
    });
    return findings;
  }

  if (Number(rating) === 0) {
    if (!cell.explicitNoEvidence) {
      findings.push({
        code: HEALTH_CODES.BLANK_VS_EXPLICIT_ZERO,
        severity: HEALTH_SEVERITY.BLOCKING,
        message: "A zero rating needs an explicit judgment that this appeal is not used.",
      });
    }
    return findings;
  }

  const ids = Array.isArray(cell.evidenceIds) ? cell.evidenceIds : [];
  if (ids.length === 0) {
    findings.push({
      code: HEALTH_CODES.DETACHED_ID,
      severity: HEALTH_SEVERITY.BLOCKING,
      message: "A nonzero rating needs linked evidence or an explicit plan to gather it.",
    });
    return findings;
  }

  for (const id of ids) {
    const resolved = evidenceRecords.find((row) => evidenceIdsMatch(row.id, id));
    if (!resolved) {
      findings.push({
        code: HEALTH_CODES.DETACHED_ID,
        severity: HEALTH_SEVERITY.BLOCKING,
        message: "Linked evidence could not be found for this rating.",
      });
    }
  }

  return findings;
}

function appealOf(record) {
  return safeText(record?.rhetoricalChoice || record?.appeal).toLowerCase() || null;
}

function sourceOf(record) {
  return normalizeSourceKind(record?.sourceKind || record?.sourceType);
}

function filterCandidates(list, sourceKind, appeal) {
  return (Array.isArray(list) ? list : []).filter((r) => {
    if (sourceOf(r) !== sourceKind) return false;
    if (!appeal) return true;
    return appealOf(r) === appeal;
  });
}

function linkedIdsForCell(matrixBundle, sourceType, appeal) {
  if (!matrixBundle || !Array.isArray(matrixBundle.cells) || !appeal) return [];
  const cell = matrixBundle.cells.find(
    (c) => c.sourceType === sourceType && c.appeal === appeal
  );
  return Array.isArray(cell?.evidenceIds) ? cell.evidenceIds.filter(Boolean) : [];
}

function pickEvidenceSide({
  candidates,
  linkedIds,
  priorId,
  usedIds,
}) {
  const available = candidates.filter(
    (r) => !usedIds.some((id) => evidenceIdsMatch(r.id, id))
  );
  if (!available.length) {
    return { record: null, ambiguous: false, reason: "no_candidates" };
  }

  const linkedMatches = linkedIds.length
    ? available.filter((r) =>
        linkedIds.some((id) => evidenceIdsMatch(r.id, id))
      )
    : [];

  const pool = linkedMatches.length ? linkedMatches : available;

  if (priorId) {
    const prior = pool.find((r) => evidenceIdsMatch(r.id, priorId));
    if (prior) {
      return { record: prior, ambiguous: false, reason: "prior_choice" };
    }
  }

  if (pool.length === 1) {
    return { record: pool[0], ambiguous: false, reason: "single_match" };
  }

  // Multiple healthy matches: do not silently pick a winner.
  return {
    record: null,
    ambiguous: true,
    reason: "multi_candidate_requires_pick",
    candidates: pool,
  };
}

/**
 * Resolve speech/letter evidence for any WP-079 direction descriptor.
 * Never invents appeals for custom; never cross-source reuses one observation.
 */
export function resolveEvidencePairForDirection({
  descriptor = null,
  matrixBundle = null,
  evidenceRecords = [],
  priorSpeechId = null,
  priorLetterId = null,
  customMapping = null,
} = {}) {
  const desc =
    descriptor && typeof descriptor === "object"
      ? descriptor
      : buildEvidenceArgumentDirectionDescriptor({
          optionId: descriptor?.optionId,
          matrixBundle,
          customMapping,
        });

  const optionId = safeText(desc?.optionId);
  if (!desc?.ok || !optionId) {
    return {
      ok: false,
      optionId: optionId || null,
      speech: null,
      letter: null,
      speechCandidates: [],
      letterCandidates: [],
      reason: desc?.mappingReason || "invalid_descriptor",
      requiresStudentPick: false,
    };
  }

  let speechAppeal = desc.speechAppeal;
  let letterAppeal = desc.letterAppeal;
  const mapping =
    customMapping ||
    desc.customMapping ||
    null;

  if (desc.family === "student_created") {
    if (!isFullyMappedCustom(mapping)) {
      return {
        ok: false,
        optionId,
        speech: null,
        letter: null,
        speechCandidates: [],
        letterCandidates: [],
        reason: "custom_mapping_incomplete",
        requiresStudentPick: true,
        descriptor: desc,
      };
    }
    speechAppeal = mapping.speechAppeal;
    letterAppeal = mapping.letterAppeal;
  }

  const list = Array.isArray(evidenceRecords) ? evidenceRecords : [];
  const speechCandidates = filterCandidates(list, "speech", speechAppeal);
  const letterCandidates = filterCandidates(list, "letter", letterAppeal);

  // Custom: prefer explicit mapped evidence ids first.
  const speechLinked =
    desc.family === "student_created" && mapping?.speechEvidenceId
      ? [mapping.speechEvidenceId, ...linkedIdsForCell(matrixBundle, "speech", speechAppeal)]
      : linkedIdsForCell(matrixBundle, "speech", speechAppeal);
  const letterLinked =
    desc.family === "student_created" && mapping?.letterEvidenceId
      ? [mapping.letterEvidenceId, ...linkedIdsForCell(matrixBundle, "letter", letterAppeal)]
      : linkedIdsForCell(matrixBundle, "letter", letterAppeal);

  const speechPick = pickEvidenceSide({
    candidates: speechCandidates,
    linkedIds: speechLinked,
    priorId: priorSpeechId || mapping?.speechEvidenceId || null,
    usedIds: [],
  });

  const usedAfterSpeech = speechPick.record ? [speechPick.record.id] : [];
  const letterPick = pickEvidenceSide({
    candidates: letterCandidates,
    linkedIds: letterLinked,
    priorId: priorLetterId || mapping?.letterEvidenceId || null,
    usedIds: usedAfterSpeech,
  });

  const requiresStudentPick =
    Boolean(speechPick.ambiguous) || Boolean(letterPick.ambiguous);

  return {
    ok: Boolean(speechPick.record && letterPick.record) && !requiresStudentPick,
    optionId,
    speech: speechPick.record,
    letter: letterPick.record,
    speechCandidates:
      speechPick.candidates || speechCandidates,
    letterCandidates:
      letterPick.candidates || letterCandidates,
    speechCellId: speechAppeal ? matrixCellId("speech", speechAppeal) : null,
    letterCellId: letterAppeal ? matrixCellId("letter", letterAppeal) : null,
    ratingOrder: MATRIX_CELL_ORDER,
    reason: requiresStudentPick
      ? "multi_candidate_requires_pick"
      : !speechPick.record
        ? speechPick.reason
        : !letterPick.record
          ? letterPick.reason
          : "",
    requiresStudentPick,
    descriptor: {
      ...desc,
      speechAppeal,
      letterAppeal,
    },
  };
}

/**
 * WP-086 alias — pairs the legacy representative pathos/logos direction.
 */
export function pairRepresentativeDirectionEvidence({
  evidenceRecords = [],
  selectedOptionId = "",
  matrixBundle = null,
  priorSpeechId = null,
  priorLetterId = null,
} = {}) {
  const optionId = safeText(selectedOptionId) || WP086_REPRESENTATIVE_OPTION_ID;
  if (optionId !== WP086_REPRESENTATIVE_OPTION_ID) {
    return {
      ok: false,
      optionId,
      speech: null,
      letter: null,
      reason: "not_representative_direction",
    };
  }
  const descriptor = buildEvidenceArgumentDirectionDescriptor({
    optionId: WP086_REPRESENTATIVE_OPTION_ID,
    matrixBundle,
  });
  return resolveEvidencePairForDirection({
    descriptor,
    matrixBundle,
    evidenceRecords,
    priorSpeechId,
    priorLetterId,
  });
}

/**
 * True both-work readiness for the evidence-to-argument slice.
 * Length alone never certifies. Mapping must be complete for the active direction.
 */
export function evaluateBothWorkReadiness({
  speechSourceText = "",
  letterSourceText = "",
  speechEvidence = null,
  letterEvidence = null,
  selectedOptionId = "",
  selectedDirectionSignature = "",
  reviewedUpstreamSignature = "",
  patternText = "",
  thesisText = "",
  proofDirections = [],
  speechFindings = [],
  letterFindings = [],
  directionDescriptor = null,
  customMapping = null,
  needsDirectionReview = false,
} = {}) {
  const blockers = [];
  const advisories = [];

  if (!safeText(speechSourceText) || !safeText(letterSourceText)) {
    blockers.push("Both saved source texts must be available.");
  }
  if (!speechEvidence || !safeText(speechEvidence.quotation || speechEvidence.quote)) {
    blockers.push("Add an inspectable passage from the speech.");
  }
  if (!letterEvidence || !safeText(letterEvidence.quotation || letterEvidence.quote)) {
    blockers.push("Add an inspectable passage from the letter.");
  }

  const speechExplain =
    safeText(speechEvidence?.audienceEffect || speechEvidence?.audienceNote) &&
    safeText(
      speechEvidence?.purposeContribution || speechEvidence?.purposeNote
    );
  const letterExplain =
    safeText(letterEvidence?.audienceEffect || letterEvidence?.audienceNote) &&
    safeText(
      letterEvidence?.purposeContribution || letterEvidence?.purposeNote
    );
  if (!speechExplain) {
    blockers.push("Explain audience effect and purpose for the speech passage.");
  }
  if (!letterExplain) {
    blockers.push("Explain audience effect and purpose for the letter passage.");
  }

  const descriptor =
    directionDescriptor && typeof directionDescriptor === "object"
      ? directionDescriptor
      : buildEvidenceArgumentDirectionDescriptor({
          optionId: selectedOptionId,
          customMapping,
        });

  if (!descriptor?.ok || !descriptor.mappingComplete) {
    blockers.push(
      descriptor?.family === "student_created"
        ? "Finish mapping which appeal and evidence belong to each work."
        : "Choose a supported comparison direction with clear evidence on both sides."
    );
  }

  if (needsDirectionReview) {
    blockers.push("Review your Module 3 work after the comparison direction changed.");
  }

  if (
    selectedDirectionSignature &&
    reviewedUpstreamSignature &&
    selectedDirectionSignature !== reviewedUpstreamSignature
  ) {
    blockers.push("Review your Module 3 work after the matrix direction changed.");
  }

  if (!safeText(patternText)) {
    blockers.push("State what is similar or different across both works.");
  }

  const thesis = safeText(thesisText);
  if (!thesis) {
    blockers.push("Write a comparative thesis that includes both works.");
  } else {
    const lower = thesis.toLowerCase();
    const mentionsSpeech = /\bspeech\b/.test(lower);
    const mentionsLetter = /\bletter\b/.test(lower);
    if (!mentionsSpeech || !mentionsLetter) {
      blockers.push("Your thesis should clearly represent both the speech and the letter.");
    }
  }

  const proofs = (Array.isArray(proofDirections) ? proofDirections : [])
    .map((p) => (typeof p === "string" ? p : p?.text || ""))
    .map(safeText)
    .filter(Boolean);
  if (proofs.length < 2) {
    blockers.push("Name at least two proof directions that align with your thesis.");
  }

  for (const f of [...speechFindings, ...letterFindings]) {
    if (f.severity === HEALTH_SEVERITY.BLOCKING) {
      blockers.push(f.message);
    } else if (f.severity === HEALTH_SEVERITY.ADVISORY) {
      advisories.push(f.message);
    }
  }

  const speechOnly =
    speechEvidence &&
    !letterEvidence;
  const letterOnly = letterEvidence && !speechEvidence;
  if (speechOnly || letterOnly) {
    blockers.push("Both works must be substantively represented.");
  }

  return {
    ready: blockers.length === 0,
    blockers: [...new Set(blockers)],
    advisories: [...new Set(advisories)],
  };
}

/**
 * Empty persisted slice state for Module 3 flow_state.evidenceArgumentSlice.
 */
export function createEmptyEvidenceArgumentSliceState() {
  return {
    schemaVersion: EVIDENCE_ARGUMENT_SCHEMA_VERSION,
    currentStep: EVIDENCE_ARGUMENT_STEPS[0].id,
    repairReturnStep: null,
    speechEvidenceId: null,
    letterEvidenceId: null,
    patternText: "",
    significanceText: "",
    largerPointText: "",
    thesisText: "",
    proofDirections: [
      { role: "speech", text: "", evidenceId: null },
      { role: "letter", text: "", evidenceId: null },
      { role: "comparison", text: "", evidenceId: null },
    ],
    upstreamSignature: null,
    reviewedUpstreamSignature: null,
    argumentMapConfirmed: false,
    directionDescriptor: null,
    customMapping: null,
    priorProseForReview: null,
    needsDirectionReview: false,
    updatedAt: null,
  };
}

/**
 * Normalize persisted slice to schema v2.
 * Preserves student prose; never silently rewrites it.
 */
export function normalizeEvidenceArgumentSliceState(raw, context = {}) {
  const empty = createEmptyEvidenceArgumentSliceState();
  if (!raw || typeof raw !== "object") {
    return { ...empty, ...buildDescriptorFields(context) };
  }

  const version = Number(raw.schemaVersion) || EVIDENCE_ARGUMENT_SCHEMA_VERSION_V1;
  const optionId = safeText(
    context.optionId ||
      raw.directionDescriptor?.optionId ||
      (version <= EVIDENCE_ARGUMENT_SCHEMA_VERSION_V1
        ? WP086_REPRESENTATIVE_OPTION_ID
        : "")
  );

  // Preserve a previously complete descriptor when this call has no option context
  // (e.g. bare API GET) so we do not wipe mappingComplete.
  if (
    !safeText(context.optionId) &&
    raw.directionDescriptor?.ok &&
    raw.directionDescriptor?.mappingComplete &&
    !context.forceRebuildDescriptor
  ) {
    return {
      ...empty,
      ...raw,
      schemaVersion: EVIDENCE_ARGUMENT_SCHEMA_VERSION,
      directionDescriptor: raw.directionDescriptor,
      customMapping: raw.customMapping || null,
    };
  }

  const customMapping =
    (context.customMapping && typeof context.customMapping === "object"
      ? context.customMapping
      : null) ||
    (raw.customMapping && typeof raw.customMapping === "object"
      ? raw.customMapping
      : null);

  const descriptor = buildEvidenceArgumentDirectionDescriptor({
    optionId,
    matrixBundle: context.matrixBundle || null,
    customMapping,
    signature: context.signature || raw.upstreamSignature || null,
    selectedPattern: context.selectedPattern || null,
    ratings: context.ratings || null,
  });

  const priorOptionId = safeText(raw.directionDescriptor?.optionId);
  const optionChanged =
    Boolean(priorOptionId) &&
    Boolean(optionId) &&
    priorOptionId !== optionId;

  const priorSignature = safeText(
    raw.upstreamSignature || raw.directionDescriptor?.signature
  );
  const nextSignature = safeText(
    context.signature || descriptor.signature || raw.upstreamSignature
  );
  const signatureChanged =
    Boolean(priorSignature) &&
    Boolean(nextSignature) &&
    priorSignature !== nextSignature &&
    !optionChanged;

  let priorProseForReview = raw.priorProseForReview || null;
  let needsDirectionReview = Boolean(raw.needsDirectionReview);

  if (optionChanged) {
    priorProseForReview = {
      patternText: safeText(raw.patternText),
      significanceText: safeText(raw.significanceText),
      largerPointText: safeText(raw.largerPointText),
      thesisText: safeText(raw.thesisText),
      proofDirections: Array.isArray(raw.proofDirections)
        ? raw.proofDirections
        : [],
      fromOptionId: priorOptionId,
    };
    needsDirectionReview = true;
  } else if (signatureChanged) {
    needsDirectionReview = true;
  }

  const resolved = resolveEvidencePairForDirection({
    descriptor,
    matrixBundle: context.matrixBundle || null,
    evidenceRecords: context.evidenceRecords || [],
    priorSpeechId: optionChanged ? null : raw.speechEvidenceId,
    priorLetterId: optionChanged ? null : raw.letterEvidenceId,
    customMapping,
  });

  return {
    ...empty,
    ...raw,
    schemaVersion: EVIDENCE_ARGUMENT_SCHEMA_VERSION,
    currentStep: safeText(raw.currentStep) || empty.currentStep,
    speechEvidenceId: resolved.speech?.id || (optionChanged ? null : raw.speechEvidenceId) || null,
    letterEvidenceId: resolved.letter?.id || (optionChanged ? null : raw.letterEvidenceId) || null,
    directionDescriptor: descriptor,
    customMapping: descriptor.family === "student_created" ? customMapping : null,
    priorProseForReview,
    needsDirectionReview,
    upstreamSignature: nextSignature || raw.upstreamSignature || null,
    reviewedUpstreamSignature: needsDirectionReview
      ? raw.reviewedUpstreamSignature || null
      : raw.reviewedUpstreamSignature || nextSignature || null,
  };
}

function buildDescriptorFields(context = {}) {
  const descriptor = buildEvidenceArgumentDirectionDescriptor({
    optionId: context.optionId,
    matrixBundle: context.matrixBundle,
    customMapping: context.customMapping,
    signature: context.signature,
    selectedPattern: context.selectedPattern,
  });
  return {
    directionDescriptor: descriptor.ok ? descriptor : null,
    customMapping:
      descriptor.family === "student_created" ? context.customMapping || null : null,
  };
}

/**
 * Map legacy claim/thesis into staged fields only when unambiguous.
 * Never overwrites provided staged text.
 */
export function adaptLegacyModule3Prose({
  claimText = "",
  thesisText = "",
  proofPlan = [],
  patternText = "",
  existingSlice = null,
} = {}) {
  const slice = {
    ...createEmptyEvidenceArgumentSliceState(),
    ...(existingSlice && typeof existingSlice === "object" ? existingSlice : {}),
  };
  const confidence = { thesis: "none", pattern: "none", proofs: "none" };

  if (!safeText(slice.thesisText) && safeText(thesisText)) {
    slice.thesisText = safeText(thesisText);
    confidence.thesis = "preserved";
  } else if (!safeText(slice.thesisText) && safeText(claimText) && !safeText(thesisText)) {
    // Ambiguous: claim alone is not auto-promoted to thesis
    confidence.thesis = "needs_review";
    slice.legacyClaimForReview = safeText(claimText);
  }

  if (!safeText(slice.patternText) && safeText(patternText)) {
    slice.patternText = safeText(patternText);
    confidence.pattern = "preserved";
  }

  const plans = Array.isArray(proofPlan) ? proofPlan.map(safeText) : [];
  if (
    Array.isArray(slice.proofDirections) &&
    slice.proofDirections.every((p) => !safeText(p.text)) &&
    plans.some(Boolean)
  ) {
    slice.proofDirections = slice.proofDirections.map((slot, i) => ({
      ...slot,
      text: plans[i] || slot.text || "",
    }));
    confidence.proofs = "preserved";
  }

  if (safeText(claimText) && safeText(thesisText) && claimText !== thesisText) {
    slice.legacyClaimForReview = safeText(claimText);
    if (confidence.thesis === "preserved") confidence.thesis = "preserved_with_claim_review";
  }

  return { slice, confidence };
}

/**
 * Assemble Module 4–compatible thesis + proofPlan strings from slice state.
 */
export function assembleModule4HandoffFromSlice(slice) {
  const state = slice || createEmptyEvidenceArgumentSliceState();
  const thesis =
    safeText(state.thesisText) || safeText(state.largerPointText) || "";
  const proofPlan = (Array.isArray(state.proofDirections) ? state.proofDirections : [])
    .map((p) => safeText(typeof p === "string" ? p : p?.text))
    .filter(Boolean)
    .slice(0, 3);
  while (proofPlan.length < 3) proofPlan.push("");
  return {
    thesis,
    proofPlan,
    structuredProofLinks: (Array.isArray(state.proofDirections)
      ? state.proofDirections
      : []
    ).map((p) => ({
      role: p.role || null,
      text: safeText(p.text),
      evidenceId: p.evidenceId || null,
    })),
    speechEvidenceId: state.speechEvidenceId || null,
    letterEvidenceId: state.letterEvidenceId || null,
  };
}

/**
 * Compact argument map for completion / desk.
 */
export function buildArgumentMapPresentation({
  selectedDirectionLabel = "",
  speechEvidence = null,
  letterEvidence = null,
  thesisText = "",
  proofDirections = [],
} = {}) {
  return {
    direction: safeText(selectedDirectionLabel),
    speechProof: {
      quote: safeText(speechEvidence?.quotation || speechEvidence?.quote),
      explanation: [
        safeText(speechEvidence?.studentObservation || speechEvidence?.observation),
        safeText(speechEvidence?.audienceEffect || speechEvidence?.audienceNote),
        safeText(
          speechEvidence?.purposeContribution || speechEvidence?.purposeNote
        ),
      ]
        .filter(Boolean)
        .join(" "),
    },
    letterProof: {
      quote: safeText(letterEvidence?.quotation || letterEvidence?.quote),
      explanation: [
        safeText(letterEvidence?.studentObservation || letterEvidence?.observation),
        safeText(letterEvidence?.audienceEffect || letterEvidence?.audienceNote),
        safeText(
          letterEvidence?.purposeContribution || letterEvidence?.purposeNote
        ),
      ]
        .filter(Boolean)
        .join(" "),
    },
    thesis: safeText(thesisText),
    proofDirections: (Array.isArray(proofDirections) ? proofDirections : [])
      .map((p) => safeText(typeof p === "string" ? p : p?.text))
      .filter(Boolean),
  };
}

/**
 * Desk vs shelf split: strong contract records on desk; fragments on shelf for review.
 */
export function partitionDeskAndShelf(
  records = [],
  { speechText = "", letterText = "" } = {}
) {
  const desk = [];
  const shelf = [];
  for (const record of records) {
    if (!record) continue;
    const findings = diagnoseEvidenceHealth(record, { speechText, letterText });
    const blocking = findings.some((f) => f.severity === HEALTH_SEVERITY.BLOCKING);
    const fragment = findings.some((f) => f.code === HEALTH_CODES.LEGACY_FRAGMENT);
    if (blocking || fragment || (!safeText(record.quotation) && !safeText(record.passageLocator))) {
      shelf.push({ record, findings, reviewRequired: true });
    } else {
      desk.push({ record, findings, reviewRequired: false });
    }
  }
  return { desk, shelf };
}

export function studentCopyContainsForbiddenTerms(text) {
  const lower = safeText(text).toLowerCase();
  return WP086_FORBIDDEN_STUDENT_COPY.filter((term) => lower.includes(term));
}
