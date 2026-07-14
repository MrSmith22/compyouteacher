/**
 * Module 3 matrix-handoff adapter (CP-D).
 * Reuses Module 2 derivation/ranking/handoff helpers — does not invent a second canon.
 * Never silently rewrites idea / claim / thesis / proof-plan text.
 */

import { resolveModule3MatrixHandoff } from "../module2/matrixDependencyHelpers.js";
import {
  derivePatternOptions,
  buildSelectedPattern,
} from "../module2/matrixDerivationHelpers.js";
import {
  buildReadableProvenance,
  selectPrimaryPatternRecommendations,
} from "../module2/matrixOrchestrationHelpers.js";
import { readMatrixBundle } from "../module2/rhetoricalMatrixHelpers.js";
import { evidenceIdsMatch } from "../shared/evidenceIdAliases.js";

export const MATRIX_PROVENANCE_SCHEMA_VERSION = 1;

export const MATRIX_HANDOFF_MODES = Object.freeze({
  PREFER: "prefer_matrix_selection",
  REVIEW: "matrix_review_required",
  LEGACY: "legacy_pattern_path",
  EXISTING_WORK: "existing_module3_with_matrix",
});

export const CLAIM_INTERNAL_STAGES = Object.freeze({
  REVIEW: "claim_review",
  WRITE: "claim_write",
});

export const THESIS_INTERNAL_STAGES = Object.freeze({
  WRITE: "thesis_write",
  PROOF: "thesis_proof",
});

const INTERNAL_ID_RE =
  /\b(?:matrix:mlk:|tchart:|guided:|largest_contrast:|meaningful_similarity:)\S*/i;

/**
 * Deterministic Module 3 pattern id for an adopted matrix direction.
 * Reloads must not create duplicates.
 */
export function matrixPatternArtifactId(optionId) {
  const raw = String(optionId || "custom").trim() || "custom";
  const safe = raw.replace(/[^a-zA-Z0-9:_-]+/g, "_").slice(0, 80);
  return `m3-matrix:${safe}`;
}

/**
 * Meaningful signature from analytical inputs (not timestamps alone).
 */
export function buildMatrixProvenanceSignature({
  selectedPattern = null,
  audiencePurposeReasoning = "",
  schemaVersion = MATRIX_PROVENANCE_SCHEMA_VERSION,
} = {}) {
  const sp = selectedPattern || {};
  const provenance = sp.provenance || {};
  const evidenceIds = [...(provenance.evidenceIds || [])]
    .map(String)
    .filter(Boolean)
    .sort();
  const appeals = [...(provenance.appeals || [])].map(String).sort();
  const ratings = provenance.ratings || {};
  const ratingPairs = [];
  for (const source of Object.keys(ratings).sort()) {
    const slice = ratings[source] || {};
    for (const appeal of Object.keys(slice).sort()) {
      ratingPairs.push(`${source}:${appeal}=${slice[appeal]}`);
    }
  }
  const parts = [
    `v${schemaVersion}`,
    sp.optionId || sp.id || "",
    sp.kind || "",
    String(sp.label || "").trim(),
    appeals.join(","),
    ratingPairs.join("|"),
    evidenceIds.join(","),
    String(audiencePurposeReasoning || "").trim(),
  ];
  return parts.join("::");
}

export function createMatrixProvenanceMetadata({
  selectedPattern = null,
  audiencePurposeReasoning = "",
  importedAt = null,
} = {}) {
  const sp = selectedPattern || {};
  const provenance = sp.provenance || {};
  const evidenceIds = dedupeEvidenceIds(provenance.evidenceIds || []);
  return {
    schemaVersion: MATRIX_PROVENANCE_SCHEMA_VERSION,
    signature: buildMatrixProvenanceSignature({
      selectedPattern: sp,
      audiencePurposeReasoning,
    }),
    selectedPatternOptionId: sp.optionId || sp.id || null,
    selectedPatternKind: sp.kind || null,
    selectedPatternLabel: String(sp.label || "").trim() || null,
    evidenceIds,
    appeals: [...(provenance.appeals || [])],
    ratings: provenance.ratings || {},
    audiencePurposeReasoning: String(audiencePurposeReasoning || "").trim(),
    importedAt: importedAt || new Date().toISOString(),
  };
}

export function createMatrixReviewState({
  needsReview = false,
  reasonCodes = [],
  reviewedSignature = null,
  reviewedAt = null,
} = {}) {
  return {
    needsReview: Boolean(needsReview),
    reasonCodes: Array.isArray(reasonCodes) ? [...reasonCodes] : [],
    reviewedSignature: reviewedSignature || null,
    reviewedAt: reviewedAt || null,
  };
}

/**
 * Deduplicate evidence IDs including alias matches.
 */
export function dedupeEvidenceIds(ids = []) {
  const out = [];
  for (const id of ids || []) {
    const next = String(id || "").trim();
    if (!next) continue;
    if (out.some((existing) => evidenceIdsMatch(existing, next))) continue;
    out.push(next);
  }
  return out;
}

/**
 * Qualifying evidence IDs that resolve to a real record (missing-only do not count).
 */
export function resolveQualifyingEvidenceIds(ids = [], evidenceRecords = []) {
  const deduped = dedupeEvidenceIds(ids);
  const records = Array.isArray(evidenceRecords) ? evidenceRecords : [];
  return deduped.filter((id) =>
    records.some((rec) => evidenceIdsMatch(rec?.id, id))
  );
}

function formatRatingLines(ratings = {}) {
  const lines = [];
  for (const sourceType of ["speech", "letter"]) {
    const slice = ratings[sourceType] || {};
    for (const [appeal, value] of Object.entries(slice)) {
      const sourceLabel = sourceType === "letter" ? "Letter" : "Speech";
      lines.push({
        sourceLabel,
        appeal,
        rating: value,
        visibleLabel: `${sourceLabel} ${appeal}: ${value}/10`,
      });
    }
  }
  return lines;
}

function buildBecauseYouExplanation(selectedPattern) {
  const kind = String(selectedPattern?.kind || "");
  const ratings =
    selectedPattern?.provenance?.ratings || selectedPattern?.ratings || {};
  const lines = formatRatingLines(ratings);
  const fmt = (line) =>
    `${line.sourceLabel} ${line.appeal} ${line.rating}/10`;

  if (kind === "student_created") {
    return "You selected and named this direction yourself. Connect it to evidence from your matrix before continuing.";
  }

  if (!lines.length) {
    return "This is the direction you selected from your matrix.";
  }

  const ratingPhrase =
    lines.length >= 2
      ? `Because you rated ${fmt(lines[0])} and ${fmt(lines[1])}`
      : `Because you rated ${fmt(lines[0])}`;

  if (
    kind.includes("contrast") ||
    kind === "high_low" ||
    kind === "largest_contrast"
  ) {
    return `${ratingPhrase}, this contrast became one possible direction.`;
  }

  if (
    kind.includes("similarity") ||
    kind === "high_high" ||
    kind === "low_low" ||
    kind === "meaningful_similarity"
  ) {
    return `${ratingPhrase}, this similarity became one possible direction.`;
  }

  if (
    kind.includes("dominant") ||
    kind === "combined_dominant_across_works" ||
    kind === "dominant_per_work"
  ) {
    return `${ratingPhrase}, this strong pattern became one possible direction.`;
  }

  if (kind.includes("trace") || kind.includes("appeal")) {
    const appeal =
      selectedPattern?.appeals?.[0] ||
      selectedPattern?.provenance?.appeals?.[0] ||
      lines[0]?.appeal ||
      "this appeal";
    return `${ratingPhrase}, tracing ${appeal} became one possible direction.`;
  }

  return `${ratingPhrase}, this shared pattern became one possible direction.`;
}

/** Exported for tests and UI that need kind-accurate wording. */
export function buildBecauseYouExplanationForPattern(selectedPattern) {
  return sanitizeStudentFacingCopy(buildBecauseYouExplanation(selectedPattern));
}

/**
 * Strip internal IDs from any student-facing string.
 */
export function sanitizeStudentFacingCopy(text) {
  return String(text || "")
    .replace(INTERNAL_ID_RE, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function studentFacingCopyHasInternalIds(text) {
  return INTERNAL_ID_RE.test(String(text || ""));
}

/**
 * Map a matrix option into the Module 3 pattern notice shape (additive metadata).
 */
export function materializeMatrixPatternArtifact({
  option,
  evidenceRecords = [],
  audiencePurposeReasoning = "",
  existingPatterns = [],
} = {}) {
  const optionId = option?.optionId || option?.id || "student_created";
  const id = matrixPatternArtifactId(optionId);
  const already = (existingPatterns || []).find((p) => p.id === id);
  if (already) {
    return {
      pattern: already,
      created: false,
      duplicated: false,
    };
  }

  const rawIds = option?.provenance?.evidenceIds || option?.evidenceIds || [];
  const qualifying = resolveQualifyingEvidenceIds(rawIds, evidenceRecords);
  const provenance = createMatrixProvenanceMetadata({
    selectedPattern: {
      optionId,
      kind: option?.kind,
      label: option?.label,
      provenance: option?.provenance || {
        ratings: option?.ratings || {},
        evidenceIds: rawIds,
        appeals: option?.appeals || [],
      },
    },
    audiencePurposeReasoning,
  });

  return {
    pattern: {
      id,
      text: String(option?.label || "").trim(),
      evidenceIds: qualifying,
      matrixProvenance: provenance,
      matrixReview: createMatrixReviewState({
        needsReview: false,
        reviewedSignature: provenance.signature,
        reviewedAt: provenance.importedAt,
      }),
    },
    created: true,
    duplicated: false,
  };
}

/**
 * Decide whether existing Module 3 work should block automatic adoption.
 */
export function hasExistingModule3AnalyticalWork({
  patterns = [],
  selectedPatternId = "",
  ideaStatement = "",
  workingClaim = "",
  thesisStatement = "",
  proofPlan = [],
} = {}) {
  const hasPatternText = (patterns || []).some(
    (p) => String(p?.text || "").trim().length > 0
  );
  const hasProof = (proofPlan || []).some((p) => String(p || "").trim());
  return Boolean(
    hasPatternText ||
      selectedPatternId ||
      String(ideaStatement || "").trim() ||
      String(workingClaim || "").trim() ||
      String(thesisStatement || "").trim() ||
      hasProof
  );
}

/**
 * Compare upstream signature to saved provenance; mark review without rewriting text.
 */
export function evaluateDownstreamMatrixReview({
  currentSignature,
  artifactProvenance = null,
  artifactReview = null,
} = {}) {
  const savedSig =
    artifactProvenance?.signature ||
    artifactReview?.reviewedSignature ||
    null;
  if (!currentSignature || !savedSig) {
    return {
      needsReview: false,
      reasonCodes: [],
      textsRewritten: false,
    };
  }
  if (currentSignature === savedSig) {
    return {
      needsReview: false,
      reasonCodes: [],
      textsRewritten: false,
    };
  }
  // Timestamp-only differences never reach here — signature excludes timestamps.
  return {
    needsReview: true,
    reasonCodes: ["upstream_matrix_signature_changed"],
    textsRewritten: false,
    message:
      "Your Module 2 analysis changed. Check that this still says what you mean.",
  };
}

export function confirmMatrixReview({
  currentSignature,
  reviewedAt = null,
} = {}) {
  return createMatrixReviewState({
    needsReview: false,
    reasonCodes: [],
    reviewedSignature: currentSignature || null,
    reviewedAt: reviewedAt || new Date().toISOString(),
  });
}

/**
 * Claim internal stage from saved claim text.
 */
export function resolveClaimInternalStage({
  workingClaim = "",
  preferredStage = null,
  claimMinimum = 10,
} = {}) {
  if (
    preferredStage === CLAIM_INTERNAL_STAGES.REVIEW ||
    preferredStage === CLAIM_INTERNAL_STAGES.WRITE
  ) {
    if (
      preferredStage === CLAIM_INTERNAL_STAGES.REVIEW &&
      String(workingClaim || "").trim().length >= claimMinimum
    ) {
      // Explicit back to review is allowed; default resume prefers write when valid.
    }
    return preferredStage;
  }
  if (String(workingClaim || "").trim().length >= claimMinimum) {
    return CLAIM_INTERNAL_STAGES.WRITE;
  }
  return CLAIM_INTERNAL_STAGES.REVIEW;
}

/**
 * Thesis internal stage from saved thesis / proof plan.
 */
export function resolveThesisInternalStage({
  thesisStatement = "",
  proofPlan = [],
  preferredStage = null,
  thesisMinimum = 10,
} = {}) {
  if (
    preferredStage === THESIS_INTERNAL_STAGES.WRITE ||
    preferredStage === THESIS_INTERNAL_STAGES.PROOF
  ) {
    return preferredStage;
  }
  const thesisOk = String(thesisStatement || "").trim().length >= thesisMinimum;
  const hasProof = (proofPlan || []).some((p) => String(p || "").trim());
  if (thesisOk && hasProof) return THESIS_INTERNAL_STAGES.PROOF;
  if (thesisOk) return THESIS_INTERNAL_STAGES.PROOF;
  return THESIS_INTERNAL_STAGES.WRITE;
}

/**
 * Optional claim starters tailored to pattern kind (never auto-fill).
 */
export function getClaimStartersForPatternKind(kind) {
  const k = String(kind || "");
  if (k.includes("contrast") || k === "high_low") {
    return [
      "King uses ___ more strongly in ___ because…",
      "In the speech King relies on ___, while in the letter he relies on ___ because…",
      "Together, these quotations show that…",
    ];
  }
  if (k.includes("similarity") || k === "high_high" || k === "low_low") {
    return [
      "In both works, King uses ___ to…",
      "Across the speech and the letter, King returns to ___ because…",
      "Together, these quotations show that…",
    ];
  }
  if (
    k.includes("dominant") ||
    k === "combined_dominant_across_works" ||
    k === "dominant_per_work"
  ) {
    return [
      "Across the two works, King’s use of ___ shows…",
      "King’s strongest appeal in each work reveals…",
      "Together, these quotations show that…",
    ];
  }
  return [
    "In both works, King uses ___ to…, but…",
    "King adapts ___ to each audience by…",
    "Together, these quotations show that…",
  ];
}

/**
 * Idea-step framing that uses audience/purpose reasoning without writing the answer.
 */
export function getIdeaMatrixFraming({
  patternLabel = "",
  audiencePurposeReasoning = "",
} = {}) {
  const label = String(patternLabel || "").trim();
  const reasoning = String(audiencePurposeReasoning || "").trim();
  const shortReason =
    reasoning.length > 160 ? `${reasoning.slice(0, 157)}…` : reasoning;
  return {
    selectedLine: label ? `You selected: ${label}` : "",
    framingQuestion: shortReason
      ? `You explained that ${shortReason} What larger idea does this reveal about how King adapts to his audiences?`
      : "What larger idea does this pattern reveal about how King adapts to his audiences?",
    doNotPrefill: true,
  };
}

/**
 * Claim transparent prompt.
 */
export function getClaimMatrixPrompt({ patternLabel = "" } = {}) {
  const label = String(patternLabel || "").trim();
  if (!label) {
    return "What point can your pattern and evidence help you prove?";
  }
  return `Because you selected “${label}” and connected these quotations, what point can they help you prove?`;
}

/**
 * Thesis transparent prompt.
 */
export function getThesisMatrixPrompt() {
  return "Your claim grew from the direction you selected in Module 2. Now state the essay’s main answer in one sentence.";
}

/**
 * Serialized write controller — newest explicit state wins; failed save freezes advance.
 */
export function createSerializedWriteController() {
  let chain = Promise.resolve({ ok: true });
  let latestToken = 0;

  return {
    enqueue(task) {
      const token = ++latestToken;
      chain = chain.then(async () => {
        if (token !== latestToken) {
          return { ok: true, superseded: true };
        }
        try {
          const result = await task({
            token,
            isLatest: () => token === latestToken,
          });
          if (token !== latestToken) {
            return { ok: true, superseded: true };
          }
          return result && typeof result === "object"
            ? result
            : { ok: Boolean(result) };
        } catch (error) {
          return {
            ok: false,
            error: { message: error?.message || "Save failed." },
          };
        }
      });
      return chain;
    },
    get pending() {
      return chain;
    },
  };
}

/**
 * Canonical Module 3 presentation model for the matrix handoff.
 */
export function buildModuleThreeMatrixHandoffPresentation({
  matrixBundle = null,
  evidenceRecords = [],
  existingModule3 = null,
} = {}) {
  const base = resolveModule3MatrixHandoff(matrixBundle);
  const bundle = readMatrixBundle(matrixBundle);
  const audiencePurposeReasoning = String(
    bundle?.audiencePurposeReasoning || ""
  ).trim();

  const existing = existingModule3 || {};
  const hasExisting = hasExistingModule3AnalyticalWork(existing);

  if (base.mode === MATRIX_HANDOFF_MODES.LEGACY) {
    return {
      mode: MATRIX_HANDOFF_MODES.LEGACY,
      selectedPattern: null,
      audiencePurposeReasoning: "",
      readableRatingLines: [],
      readableEvidenceProvenance: [],
      becauseYouExplanation: "",
      primaryOptions: [],
      customOption: {
        id: "student_created",
        kind: "student_created",
        label: "Another pattern I notice",
      },
      customAllowed: true,
      reviewRequired: false,
      reviewReason: null,
      cta: null,
      signature: null,
      hasExistingModule3Work: hasExisting,
      useLegacyPatternPath: true,
      loadingSafe: true,
    };
  }

  if (base.mode === MATRIX_HANDOFF_MODES.REVIEW) {
    return {
      mode: MATRIX_HANDOFF_MODES.REVIEW,
      selectedPattern: normalizeSelectedPattern(base.selectedPattern),
      audiencePurposeReasoning,
      readableRatingLines: [],
      readableEvidenceProvenance: [],
      becauseYouExplanation: "",
      primaryOptions: [],
      customOption: {
        id: "student_created",
        kind: "student_created",
        label: "Another pattern I notice",
      },
      customAllowed: true,
      reviewRequired: true,
      reviewReason: base.remaining,
      reviewMessage: "Your Module 2 analysis needs one more check.",
      cta: {
        href: base.cta?.href || "/modules/2/matrix",
        label: "Return to my matrix",
        detail: base.cta?.label || "",
      },
      signature: base.selectedPattern
        ? buildMatrixProvenanceSignature({
            selectedPattern: base.selectedPattern,
            audiencePurposeReasoning,
          })
        : null,
      hasExistingModule3Work: hasExisting,
      useLegacyPatternPath: false,
      loadingSafe: true,
      preserveModule3Text: true,
    };
  }

  // Ready preference
  const derived = derivePatternOptions(bundle);
  const ranked = selectPrimaryPatternRecommendations(derived, bundle);
  const selectedRaw = base.selectedPattern;
  const selectedNormalized = normalizeSelectedPattern(selectedRaw);
  const readable = buildReadableProvenance(
    {
      why: selectedRaw?.why,
      provenance: selectedRaw?.provenance || {
        ratings: {},
        evidenceIds: [],
        appeals: [],
      },
    },
    evidenceRecords
  );

  // Drop missing-only evidence from readable support counts
  const qualifyingIds = resolveQualifyingEvidenceIds(
    readable.evidenceIds || [],
    evidenceRecords
  );
  const readableEvidence = (readable.readable?.evidence || []).filter((row) =>
    qualifyingIds.some((id) => evidenceIdsMatch(id, row.evidenceId))
  );

  const signature = buildMatrixProvenanceSignature({
    selectedPattern: selectedRaw,
    audiencePurposeReasoning,
  });

  const primaryOptions = (ranked.primary || []).slice(0, 3).map((opt) => ({
    id: opt.id,
    kind: opt.kind,
    label: sanitizeStudentFacingCopy(opt.label),
    why: sanitizeStudentFacingCopy(opt.why),
    provenance: opt.provenance,
  }));

  const mode =
    hasExisting && !existingAlreadyUsesMatrixSelection(existing, selectedNormalized)
      ? MATRIX_HANDOFF_MODES.EXISTING_WORK
      : MATRIX_HANDOFF_MODES.PREFER;

  return {
    mode,
    selectedPattern: selectedNormalized
      ? {
          ...selectedNormalized,
          evidenceIds: qualifyingIds,
          appeals: [...(selectedRaw?.provenance?.appeals || [])],
          ratings: selectedRaw?.provenance?.ratings || {},
        }
      : null,
    audiencePurposeReasoning,
    readableRatingLines: (readable.readable?.ratings || []).map((r) => ({
      ...r,
      visibleLabel: sanitizeStudentFacingCopy(r.visibleLabel),
    })),
    readableEvidenceProvenance: readableEvidence.map((e) => ({
      ...e,
      visibleLabel: sanitizeStudentFacingCopy(e.visibleLabel),
    })),
    becauseYouExplanation: sanitizeStudentFacingCopy(
      buildBecauseYouExplanation(selectedRaw)
    ),
    primaryOptions,
    customOption: {
      id: ranked.custom?.id || "student_created",
      kind: "student_created",
      label: "Another pattern I notice",
      why: ranked.custom?.why || "",
    },
    customAllowed: true,
    reviewRequired: false,
    reviewReason: null,
    cta: null,
    signature,
    hasExistingModule3Work: hasExisting,
    useLegacyPatternPath: false,
    loadingSafe: true,
    carryForwardLabel: "Carry this direction forward",
    chooseDifferentLabel: "Choose a different direction",
    retainExistingLabel: "Keep my saved Module 3 direction",
    transparencyNote:
      "This is the direction you selected. You can carry it forward, choose another matrix-supported direction, or write your own.",
    ideaFraming: getIdeaMatrixFraming({
      patternLabel: selectedNormalized?.label,
      audiencePurposeReasoning,
    }),
    claimPrompt: getClaimMatrixPrompt({
      patternLabel: selectedNormalized?.label,
    }),
    thesisPrompt: getThesisMatrixPrompt(),
    claimStarters: getClaimStartersForPatternKind(selectedNormalized?.kind),
  };
}

function normalizeSelectedPattern(sp) {
  if (!sp) return null;
  return {
    optionId: sp.optionId || sp.id || null,
    kind: sp.kind || null,
    label: sanitizeStudentFacingCopy(sp.label || ""),
    why: sanitizeStudentFacingCopy(sp.why || ""),
    evidenceIds: dedupeEvidenceIds(sp.provenance?.evidenceIds || sp.evidenceIds || []),
    appeals: [...(sp.provenance?.appeals || sp.appeals || [])],
    ratings: sp.provenance?.ratings || sp.ratings || {},
  };
}

function existingAlreadyUsesMatrixSelection(existing, selected) {
  if (!selected?.optionId) return false;
  const expectedId = matrixPatternArtifactId(selected.optionId);
  if (existing?.selectedPatternId === expectedId) return true;
  return (existing?.patterns || []).some(
    (p) =>
      p.id === expectedId ||
      p?.matrixProvenance?.selectedPatternOptionId === selected.optionId
  );
}

/**
 * Gate: can continue from patterns when matrix direction was adopted.
 * Qualifying matrix provenance evidence satisfies the grounded-evidence rule
 * (including cross-source aliases), without requiring a single cluster.
 */
export function canContinueFromMatrixPattern({
  selectedPattern = null,
  quoteMinimum = 1,
} = {}) {
  if (!selectedPattern || !String(selectedPattern.text || "").trim()) {
    return false;
  }
  const ids = Array.isArray(selectedPattern.evidenceIds)
    ? selectedPattern.evidenceIds.filter(Boolean)
    : [];
  const provenanceIds = Array.isArray(
    selectedPattern.matrixProvenance?.evidenceIds
  )
    ? selectedPattern.matrixProvenance.evidenceIds.filter(Boolean)
    : [];
  const combined = dedupeEvidenceIds([...ids, ...provenanceIds]);
  return combined.length >= quoteMinimum;
}

export function getMatrixPatternContinueHint({
  selectedPattern = null,
  presentation = null,
} = {}) {
  if (presentation?.reviewRequired) {
    return presentation.reviewMessage || "Your Module 2 analysis needs one more check.";
  }
  if (!selectedPattern || !String(selectedPattern.text || "").trim()) {
    return "Carry your Module 2 direction forward, or choose a different direction.";
  }
  if (!canContinueFromMatrixPattern({ selectedPattern })) {
    return "Connect this direction to evidence from your matrix before continuing.";
  }
  return "";
}

/**
 * Build a selected pattern object for custom student text (matrix secondary path).
 * Evidence must be connected explicitly afterward — never auto-selected.
 */
export function buildCustomMatrixOption(customLabel) {
  return buildSelectedPattern({
    option: {
      id: "student_created",
      kind: "student_created",
      label: "Another pattern I notice",
      why: "Student-created",
      provenance: { ratings: {}, evidenceIds: [], appeals: [] },
    },
    customLabel,
    derived: { options: [] },
  });
}

export const CUSTOM_DIRECTION_MIN_LENGTH = 15;

/**
 * Custom direction stages: describe → connect evidence → save.
 */
export const CUSTOM_DIRECTION_STAGES = Object.freeze({
  DESCRIBE: "describe",
  CONNECT_EVIDENCE: "connect_evidence",
});

export function resolveCustomDirectionStage({
  customLabel = "",
  evidenceIds = [],
  evidenceRecords = [],
} = {}) {
  if (String(customLabel || "").trim().length < CUSTOM_DIRECTION_MIN_LENGTH) {
    return CUSTOM_DIRECTION_STAGES.DESCRIBE;
  }
  const qualifying = resolveQualifyingEvidenceIds(evidenceIds, evidenceRecords);
  if (qualifying.length < 1) {
    return CUSTOM_DIRECTION_STAGES.CONNECT_EVIDENCE;
  }
  return CUSTOM_DIRECTION_STAGES.CONNECT_EVIDENCE;
}

export function canCompleteCustomMatrixDirection({
  customLabel = "",
  evidenceIds = [],
  evidenceRecords = [],
} = {}) {
  if (String(customLabel || "").trim().length < CUSTOM_DIRECTION_MIN_LENGTH) {
    return false;
  }
  return resolveQualifyingEvidenceIds(evidenceIds, evidenceRecords).length >= 1;
}

/**
 * Canonical active Module 3 matrix direction used across later steps.
 */
export function buildActiveAdoptedDirection({
  option = null,
  evidenceRecords = [],
  audiencePurposeReasoning = "",
} = {}) {
  if (!option) return null;
  const optionId = option.optionId || option.id || null;
  const kind = option.kind || null;
  const label = sanitizeStudentFacingCopy(option.label || "");
  const provenance = option.provenance || {
    ratings: option.ratings || {},
    evidenceIds: option.evidenceIds || [],
    appeals: option.appeals || [],
  };
  const qualifyingIds = resolveQualifyingEvidenceIds(
    provenance.evidenceIds || option.evidenceIds || [],
    evidenceRecords
  );
  const readable = buildReadableProvenance(
    { why: option.why, provenance },
    evidenceRecords
  );
  const readableEvidence = (readable.readable?.evidence || []).filter((row) =>
    qualifyingIds.some((id) => evidenceIdsMatch(id, row.evidenceId))
  );
  const selectedForSig = {
    optionId,
    kind,
    label,
    provenance: {
      ...provenance,
      evidenceIds: qualifyingIds,
    },
  };
  const signature = buildMatrixProvenanceSignature({
    selectedPattern: selectedForSig,
    audiencePurposeReasoning,
  });

  return {
    optionId,
    kind,
    label,
    ratings: provenance.ratings || {},
    appeals: [...(provenance.appeals || [])],
    evidenceIds: qualifyingIds,
    readableRatingLines: (readable.readable?.ratings || []).map((r) => ({
      ...r,
      visibleLabel: sanitizeStudentFacingCopy(r.visibleLabel),
    })),
    readableEvidenceLines: readableEvidence.map((e) => ({
      ...e,
      visibleLabel: sanitizeStudentFacingCopy(e.visibleLabel),
    })),
    audiencePurposeReasoning: String(audiencePurposeReasoning || "").trim(),
    signature,
    becauseYouExplanation: buildBecauseYouExplanationForPattern({
      kind,
      provenance,
      appeals: provenance.appeals,
      ratings: provenance.ratings,
    }),
    ideaFraming: getIdeaMatrixFraming({
      patternLabel: label,
      audiencePurposeReasoning,
    }),
    claimPrompt: getClaimMatrixPrompt({ patternLabel: label }),
    thesisPrompt: getThesisMatrixPrompt(),
    claimStarters: getClaimStartersForPatternKind(kind),
    matrixProvenance: createMatrixProvenanceMetadata({
      selectedPattern: selectedForSig,
      audiencePurposeReasoning,
    }),
  };
}

/**
 * Restore active direction from a saved Module 3 pattern with matrix provenance.
 */
export function restoreActiveDirectionFromSavedPattern({
  pattern = null,
  evidenceRecords = [],
} = {}) {
  const prov = pattern?.matrixProvenance;
  if (!pattern || !prov?.selectedPatternOptionId) return null;
  return buildActiveAdoptedDirection({
    option: {
      optionId: prov.selectedPatternOptionId,
      kind: prov.selectedPatternKind,
      label: prov.selectedPatternLabel || pattern.text,
      provenance: {
        ratings: prov.ratings || {},
        evidenceIds: prov.evidenceIds || pattern.evidenceIds || [],
        appeals: prov.appeals || [],
      },
    },
    evidenceRecords,
    audiencePurposeReasoning: prov.audiencePurposeReasoning || "",
  });
}

/**
 * Recompute the live meaningful upstream signature for the adopted direction
 * from the current Module 2 matrix (not from saved provenance alone).
 * Timestamp-only bundle fields never affect the signature.
 */
export function resolveCurrentUpstreamSignature({
  matrixBundle = null,
  directionOptionId = null,
  directionKind = null,
  directionLabel = "",
  directionEvidenceIds = [],
  audiencePurposeReasoning = "",
} = {}) {
  const bundle = readMatrixBundle(matrixBundle);
  if (!bundle) return null;
  const apr = String(
    audiencePurposeReasoning || bundle.audiencePurposeReasoning || ""
  ).trim();
  const optionId = directionOptionId || null;
  const kind = directionKind || null;

  if (kind === "student_created" || optionId === "student_created") {
    return buildMatrixProvenanceSignature({
      selectedPattern: {
        optionId: "student_created",
        kind: "student_created",
        label: directionLabel || "",
        provenance: {
          ratings: {},
          evidenceIds: directionEvidenceIds || [],
          appeals: [],
        },
      },
      audiencePurposeReasoning: apr,
    });
  }

  const derived = derivePatternOptions(bundle);
  const candidates = [...(derived.options || [])];
  if (bundle.selectedPattern) {
    candidates.unshift({
      id: bundle.selectedPattern.optionId,
      kind: bundle.selectedPattern.kind,
      label: bundle.selectedPattern.label,
      provenance: bundle.selectedPattern.provenance,
    });
  }

  const match =
    (optionId &&
      candidates.find((o) => (o.id || o.optionId) === optionId)) ||
    null;

  if (match) {
    return buildMatrixProvenanceSignature({
      selectedPattern: {
        optionId: match.id || match.optionId,
        kind: match.kind,
        label: match.label,
        provenance: match.provenance || {
          ratings: {},
          evidenceIds: [],
          appeals: [],
        },
      },
      audiencePurposeReasoning: apr,
    });
  }

  if (bundle.selectedPattern) {
    return buildMatrixProvenanceSignature({
      selectedPattern: bundle.selectedPattern,
      audiencePurposeReasoning: apr,
    });
  }

  return null;
}

export const MATRIX_REVIEW_MESSAGE =
  "Your Module 2 analysis changed. Check that this still says what you mean.";

export const MATRIX_REVIEW_CONFIRM_LABEL = "This still says what I mean";

/**
 * Evaluate pattern/idea/claim/thesis against the current upstream signature.
 * Never rewrites student text.
 */
export function evaluateAllDownstreamArtifactsForUpstreamChange({
  currentSignature = null,
  pattern = null,
  idea = null,
  claim = null,
  thesis = null,
} = {}) {
  const artifacts = {
    pattern: evaluateDownstreamMatrixReview({
      currentSignature,
      artifactProvenance: pattern?.matrixProvenance,
      artifactReview: pattern?.matrixReview,
    }),
    idea: evaluateDownstreamMatrixReview({
      currentSignature,
      artifactProvenance: idea?.matrixProvenance,
      artifactReview: idea?.matrixReview,
    }),
    claim: evaluateDownstreamMatrixReview({
      currentSignature,
      artifactProvenance: claim?.matrixProvenance,
      artifactReview: claim?.matrixReview,
    }),
    thesis: evaluateDownstreamMatrixReview({
      currentSignature,
      artifactProvenance: thesis?.matrixProvenance,
      artifactReview: thesis?.matrixReview,
    }),
  };

  const anyNeedsReview = Object.values(artifacts).some((a) => a.needsReview);
  return {
    artifacts,
    anyNeedsReview,
    message: anyNeedsReview ? MATRIX_REVIEW_MESSAGE : "",
    textsRewritten: false,
  };
}

/**
 * Apply needs_review flags onto artifact metadata without touching text fields.
 */
export function applyNeedsReviewFlags(artifact, evaluation, currentSignature) {
  if (!artifact || !evaluation?.needsReview) {
    return artifact;
  }
  return {
    ...artifact,
    matrixReview: createMatrixReviewState({
      needsReview: true,
      reasonCodes: evaluation.reasonCodes || [
        "upstream_matrix_signature_changed",
      ],
      reviewedSignature: artifact.matrixReview?.reviewedSignature || null,
      reviewedAt: artifact.matrixReview?.reviewedAt || null,
    }),
    // Keep provenance; signature comparison uses stored provenance.signature.
    matrixProvenance: artifact.matrixProvenance || null,
    _upstreamSignatureForReview: currentSignature || null,
  };
}

/**
 * Mutable mock-server write race harness for tests.
 */
export function createMockArtifactStore(initial = {}) {
  const store = { ...initial };
  let writeDelayMs = 0;
  return {
    get(key) {
      return store[key];
    },
    setDelay(ms) {
      writeDelayMs = ms;
    },
    async write(key, value) {
      const snapshot = value;
      if (writeDelayMs) {
        await new Promise((r) => setTimeout(r, writeDelayMs));
      }
      store[key] = snapshot;
      return { ok: true, value: snapshot };
    },
    snapshot() {
      return { ...store };
    },
  };
}
