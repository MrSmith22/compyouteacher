/**
 * Module 6 CP-G — hydration / read-state safety.
 */

export const MODULE6_DRAFT_READ_STATE = Object.freeze({
  PENDING: "pending",
  DRAFT_LOADED: "draft_loaded",
  CONFIRMED_NO_DRAFT: "confirmed_no_draft",
  DRAFT_READ_FAILED: "draft_read_failed",
  OUTLINE_READ_FAILED: "outline_read_failed",
  OUTLINE_MISSING_OR_UNFINALIZED: "outline_missing_or_unfinalized",
});

export const MODULE6_DRAFT_READ_ERROR =
  "We could not load your saved draft. Your writing is protected—nothing was overwritten. Try again.";

export const MODULE6_OUTLINE_READ_ERROR =
  "We could not load your Module 5 outline. Drafting stays locked until the outline loads successfully.";

export const MODULE6_OUTLINE_UNFINALIZED =
  "Finish and finalize your Module 5 outline before drafting here.";

export const MODULE6_META_SCHEMA_VERSION = 1;

/**
 * Classify outline GET for Module 6 entry.
 */
export function resolveModule6OutlineReadState(input = {}) {
  if (input.networkError || input.ok !== true) {
    return {
      state: MODULE6_DRAFT_READ_STATE.OUTLINE_READ_FAILED,
      outlineRow: null,
      message: MODULE6_OUTLINE_READ_ERROR,
      canSeed: false,
      canWrite: false,
    };
  }

  const row = input.data ?? null;
  const hasOutline = Boolean(row?.outline);
  const finalized = row?.finalized === true;

  if (!hasOutline || !finalized) {
    return {
      state: MODULE6_DRAFT_READ_STATE.OUTLINE_MISSING_OR_UNFINALIZED,
      outlineRow: row,
      message: MODULE6_OUTLINE_UNFINALIZED,
      canSeed: false,
      canWrite: false,
    };
  }

  return {
    state: "outline_ready",
    outlineRow: row,
    message: "",
    canSeed: true,
    canWrite: true,
  };
}

/**
 * Classify draft GET. Only successful empty may authorize blank section init.
 */
export function resolveModule6DraftReadState(input = {}) {
  if (input.networkError || input.ok !== true) {
    return {
      state: MODULE6_DRAFT_READ_STATE.DRAFT_READ_FAILED,
      draftRow: null,
      canInitializeEmpty: false,
      canWrite: false,
      message: MODULE6_DRAFT_READ_ERROR,
    };
  }

  const row = input.data ?? null;
  if (row && Array.isArray(row.sections) && row.sections.length > 0) {
    return {
      state: MODULE6_DRAFT_READ_STATE.DRAFT_LOADED,
      draftRow: row,
      canInitializeEmpty: false,
      canWrite: row.locked !== true,
      message: "",
    };
  }

  return {
    state: MODULE6_DRAFT_READ_STATE.CONFIRMED_NO_DRAFT,
    draftRow: null,
    canInitializeEmpty: true,
    canWrite: true,
    message: "",
  };
}

export function shouldAllowModule6DraftWrites({
  readState = MODULE6_DRAFT_READ_STATE.PENDING,
  hydrationReady = false,
  locked = false,
  outlineReviewBlocksWrites = false,
} = {}) {
  if (!hydrationReady) return false;
  if (locked) return false;
  if (outlineReviewBlocksWrites) return false;
  if (
    readState === MODULE6_DRAFT_READ_STATE.DRAFT_READ_FAILED ||
    readState === MODULE6_DRAFT_READ_STATE.OUTLINE_READ_FAILED ||
    readState === MODULE6_DRAFT_READ_STATE.OUTLINE_MISSING_OR_UNFINALIZED ||
    readState === MODULE6_DRAFT_READ_STATE.PENDING
  ) {
    return false;
  }
  return (
    readState === MODULE6_DRAFT_READ_STATE.DRAFT_LOADED ||
    readState === MODULE6_DRAFT_READ_STATE.CONFIRMED_NO_DRAFT
  );
}

/**
 * Normalize additive draft_meta. Never mixes into sections/full_text.
 */
export function normalizeModule6DraftMeta(raw = null, fallback = {}) {
  const src = raw && typeof raw === "object" ? raw : {};
  const currentSectionIndex = Number.isInteger(src.currentSectionIndex)
    ? Math.max(0, src.currentSectionIndex)
    : Number.isInteger(fallback.currentSectionIndex)
      ? Math.max(0, fallback.currentSectionIndex)
      : 0;
  const currentStageId =
    typeof src.currentStageId === "string" && src.currentStageId
      ? src.currentStageId
      : fallback.currentStageId || "section-0";

  const completed = Array.isArray(src.completedSectionIds)
    ? src.completedSectionIds.map(String).filter(Boolean)
    : Array.isArray(fallback.completedSectionIds)
      ? fallback.completedSectionIds
      : [];

  return {
    schemaVersion: MODULE6_META_SCHEMA_VERSION,
    currentSectionIndex,
    currentStageId,
    sourceOutlineSignature:
      typeof src.sourceOutlineSignature === "string"
        ? src.sourceOutlineSignature
        : typeof fallback.sourceOutlineSignature === "string"
          ? fallback.sourceOutlineSignature
          : "",
    completedSectionIds: [...new Set(completed)],
    outlineReviewRequired: Boolean(
      src.outlineReviewRequired ?? fallback.outlineReviewRequired
    ),
    outlineReviewAcknowledged: Boolean(
      src.outlineReviewAcknowledged ?? fallback.outlineReviewAcknowledged
    ),
  };
}

export function createDefaultModule6DraftMeta({
  sourceOutlineSignature = "",
  currentSectionIndex = 0,
  currentStageId = "section-0",
} = {}) {
  return normalizeModule6DraftMeta({
    schemaVersion: MODULE6_META_SCHEMA_VERSION,
    currentSectionIndex,
    currentStageId,
    sourceOutlineSignature,
    completedSectionIds: [],
    outlineReviewRequired: false,
    outlineReviewAcknowledged: false,
  });
}

/**
 * Detect missing draft_meta column (migration not applied).
 */
export function isDraftMetaColumnMissingError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("draft_meta") &&
    (message.includes("column") ||
      message.includes("schema cache") ||
      message.includes("does not exist"))
  );
}
