/**
 * Module 2 rhetorical matrix — cells, microtasks, validation (CP-C).
 * Appeal-major order per approved decisions.
 */

export const MATRIX_SCHEMA_VERSION = 1;
export const MATRIX_ASSIGNMENT_ID = "mlk";
export const FUNCTION_NOTE_MIN_LENGTH = 20;

export const RATING_ANCHORS = Object.freeze([
  { value: 0, label: "Not meaningfully used" },
  { value: 3, label: "Limited or secondary" },
  { value: 5, label: "Clearly present" },
  { value: 7, label: "Strong and important" },
  { value: 10, label: "Central to how the audience is persuaded" },
]);

export const APPEAL_DEFINITIONS = Object.freeze({
  ethos: "Ethos builds trust or credibility with the audience.",
  pathos: "Pathos appeals to feelings to move the audience.",
  logos: "Logos uses reasons, evidence, or logic to support a point.",
});

/** Approved appeal-major order */
export const MATRIX_CELL_ORDER = Object.freeze([
  { sourceType: "speech", appeal: "ethos" },
  { sourceType: "letter", appeal: "ethos" },
  { sourceType: "speech", appeal: "pathos" },
  { sourceType: "letter", appeal: "pathos" },
  { sourceType: "speech", appeal: "logos" },
  { sourceType: "letter", appeal: "logos" },
]);

export const MICROTASKS = Object.freeze(["rate", "evidence", "function"]);

export const MATRIX_FLOW_STAGES = Object.freeze({
  ORIENTATION: "orientation",
  CELL: "cell",
  PAIR_PAUSE: "pair_pause",
  REVIEW: "review",
  PATTERN: "pattern",
  REASONING: "reasoning",
  COMPLETE: "complete",
});

export function matrixCellId(sourceType, appeal, assignmentId = MATRIX_ASSIGNMENT_ID) {
  return `matrix:${assignmentId}:${sourceType}:${appeal}`;
}

export function createEmptyCell(sourceType, appeal) {
  return {
    id: matrixCellId(sourceType, appeal),
    schemaVersion: MATRIX_SCHEMA_VERSION,
    sourceType,
    appeal,
    rating: null,
    evidenceIds: [],
    functionNote: "",
    explicitNoEvidence: false,
    revisionState: "draft",
    updatedAt: null,
  };
}

export function createEmptyMatrixBundle() {
  return {
    schemaVersion: MATRIX_SCHEMA_VERSION,
    cells: MATRIX_CELL_ORDER.map(({ sourceType, appeal }) =>
      createEmptyCell(sourceType, appeal)
    ),
    selectedPattern: null,
    audiencePurposeReasoning: "",
    reviewState: {
      dependentsNeedReview: false,
      reasons: [],
      changedCellIds: [],
    },
    updatedAt: null,
    revisionId: 0,
  };
}

/**
 * @param {unknown} raw
 */
export function readMatrixBundle(raw) {
  if (!raw || typeof raw !== "object") return null;
  try {
    const base = createEmptyMatrixBundle();
    const byId = new Map();
    if (Array.isArray(raw.cells)) {
      for (const cell of raw.cells) {
        if (!cell || typeof cell !== "object") continue;
        const id =
          typeof cell.id === "string" && cell.id
            ? cell.id
            : matrixCellId(cell.sourceType, cell.appeal);
        byId.set(id, cell);
      }
    }
    const cells = base.cells.map((empty) => {
      const saved = byId.get(empty.id);
      if (!saved) return empty;
      const rating = normalizeRating(saved.rating);
      return {
        ...empty,
        rating: rating.valid ? rating.value : saved.rating === null ? null : empty.rating,
        evidenceIds: Array.isArray(saved.evidenceIds)
          ? saved.evidenceIds.map(String).filter(Boolean)
          : [],
        functionNote:
          typeof saved.functionNote === "string" ? saved.functionNote : "",
        explicitNoEvidence: Boolean(saved.explicitNoEvidence),
        revisionState: saved.revisionState || "draft",
        updatedAt: saved.updatedAt || null,
        schemaVersion: Number(saved.schemaVersion) || MATRIX_SCHEMA_VERSION,
      };
    });

    return {
      schemaVersion: Number(raw.schemaVersion) || MATRIX_SCHEMA_VERSION,
      cells,
      selectedPattern: raw.selectedPattern ?? null,
      audiencePurposeReasoning:
        typeof raw.audiencePurposeReasoning === "string"
          ? raw.audiencePurposeReasoning
          : "",
      reviewState: {
        dependentsNeedReview: Boolean(raw.reviewState?.dependentsNeedReview),
        reasons: Array.isArray(raw.reviewState?.reasons)
          ? raw.reviewState.reasons
          : [],
        changedCellIds: Array.isArray(raw.reviewState?.changedCellIds)
          ? raw.reviewState.changedCellIds
          : [],
      },
      updatedAt: raw.updatedAt || null,
      revisionId: Number(raw.revisionId) || 0,
    };
  } catch {
    return null;
  }
}

export function normalizeRating(raw) {
  if (raw === null || raw === undefined || raw === "") {
    return { valid: false, value: null, reason: "missing" };
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 10) {
    return { valid: false, value: null, reason: "invalid" };
  }
  return { valid: true, value: n };
}

export function getCellByOrderIndex(bundle, index) {
  const cells = bundle?.cells || createEmptyMatrixBundle().cells;
  return cells[index] || null;
}

export function getCellIndex(bundle, cellId) {
  return (bundle?.cells || []).findIndex((c) => c.id === cellId);
}

export function updateCellInBundle(bundle, cellId, patch) {
  const base = readMatrixBundle(bundle) || createEmptyMatrixBundle();
  const cells = base.cells.map((cell) => {
    if (cell.id !== cellId) return cell;
    return {
      ...cell,
      ...patch,
      id: cell.id,
      sourceType: cell.sourceType,
      appeal: cell.appeal,
      updatedAt: new Date().toISOString(),
      revisionState: patch.revisionState || "revised",
    };
  });
  return {
    ...base,
    cells,
    updatedAt: new Date().toISOString(),
    revisionId: (Number(base.revisionId) || 0) + 1,
  };
}

export function isCellComplete(cell) {
  if (!cell) return false;
  const rating = normalizeRating(cell.rating);
  if (!rating.valid) return false;
  if (rating.value === 0) {
    return (
      Boolean(cell.explicitNoEvidence) &&
      String(cell.functionNote || "").trim().length >= FUNCTION_NOTE_MIN_LENGTH
    );
  }
  return (
    Array.isArray(cell.evidenceIds) &&
    cell.evidenceIds.length > 0 &&
    String(cell.functionNote || "").trim().length >= FUNCTION_NOTE_MIN_LENGTH
  );
}

export function canAdvanceMicrotask(cell, microtask) {
  if (!cell) return false;
  if (microtask === "rate") {
    return normalizeRating(cell.rating).valid;
  }
  if (microtask === "evidence") {
    const rating = normalizeRating(cell.rating);
    if (!rating.valid) return false;
    if (rating.value === 0) return Boolean(cell.explicitNoEvidence);
    return Array.isArray(cell.evidenceIds) && cell.evidenceIds.length > 0;
  }
  if (microtask === "function") {
    return (
      String(cell.functionNote || "").trim().length >= FUNCTION_NOTE_MIN_LENGTH
    );
  }
  return false;
}

export function advanceMicrotask(microtask, direction = "next") {
  const idx = MICROTASKS.indexOf(microtask);
  if (idx < 0) return "rate";
  if (direction === "back") return MICROTASKS[Math.max(0, idx - 1)];
  return MICROTASKS[Math.min(MICROTASKS.length - 1, idx + 1)];
}

export function getMatrixProgress({ cellIndex = 0, microtask = "rate" } = {}) {
  const safeCell = Math.max(0, Math.min(5, cellIndex));
  const microIdx = Math.max(0, MICROTASKS.indexOf(microtask));
  return {
    cellNumber: safeCell + 1,
    cellTotal: 6,
    microtaskNumber: microIdx + 1,
    microtaskTotal: 3,
    label: `Cell ${safeCell + 1} of 6 · Step ${microIdx + 1} of 3`,
  };
}

export function isPairComplete(bundle, pairIndex) {
  // pairIndex 0=ethos, 1=pathos, 2=logos → cells 0-1, 2-3, 4-5
  const start = pairIndex * 2;
  const cells = bundle?.cells || [];
  return (
    isCellComplete(cells[start]) && isCellComplete(cells[start + 1])
  );
}

export function allCellsComplete(bundle) {
  return (bundle?.cells || []).every(isCellComplete);
}

export function ratingMap(bundle) {
  const map = {
    speech: { ethos: null, pathos: null, logos: null },
    letter: { ethos: null, pathos: null, logos: null },
  };
  for (const cell of bundle?.cells || []) {
    if (!cell?.sourceType || !cell?.appeal) continue;
    const r = normalizeRating(cell.rating);
    map[cell.sourceType][cell.appeal] = r.valid ? r.value : null;
  }
  return map;
}

export function getOrientationCopy() {
  return {
    title: "How to rate rhetorical centrality",
    body: [
      "You will give each appeal a provisional score from 0 to 10.",
      "The score measures how central the appeal is to persuading that work’s audience—not how often it appears, not whether the writing is “good,” and not an objective scientific measurement.",
      "Scores are editable. You will connect evidence to each judgment.",
    ],
    anchors: RATING_ANCHORS,
    primaryResponseMode: "continue",
  };
}

export function dominantQuestionForMicrotask(cell, microtask) {
  const appeal = cell?.appeal || "appeal";
  const work = cell?.sourceType === "letter" ? "letter" : "speech";
  if (microtask === "rate") {
    return `How strongly does King rely on ${appeal} in the ${work} to persuade this audience?`;
  }
  if (microtask === "evidence") {
    return "Which evidence best supports that rating?";
  }
  const rating = normalizeRating(cell?.rating);
  if (rating.valid && rating.value === 0) {
    return "Why might this appeal be limited here, or what does King rely on instead?";
  }
  return "What does this appeal help King accomplish with this audience?";
}

export const MATRIX_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1440],
  oneDominantQuestion: true,
  oneResponseMode: true,
  noSixSimultaneousInputs: true,
  noHorizontalOverflow: true,
  statusNotColorAlone: true,
  mobileFullWidthPrimary: true,
  teacherGuidancePlacement: "rail_or_below",
});
