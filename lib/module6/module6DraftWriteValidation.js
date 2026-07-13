/**
 * Pure Module 6 write validation — safe for Node tests (relative imports only).
 */

import {
  buildModule5DraftSourceSignature,
  expectedProseSectionCount,
  expectedProseSectionIds,
  expectedReviewStageIndex,
  MODULE6_REVIEW_STAGE_ID,
} from "./draftOutlineMapping.js";
import {
  evaluateDraftFinalizeReadiness,
  MODULE6_WRITE_ACTION,
} from "./draftPersistenceHelpers.js";
import { MODULE6_META_SCHEMA_VERSION } from "./draftHydrationHelpers.js";

export function parseMandatoryExpectedRevision(body = {}) {
  if (
    !Object.prototype.hasOwnProperty.call(body, "expected_revision") ||
    body.expected_revision === null ||
    body.expected_revision === undefined
  ) {
    return {
      ok: false,
      status: 400,
      error: "expected_revision is required",
      code: "missing_revision",
    };
  }

  const n = Number(body.expected_revision);
  if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
    return {
      ok: false,
      status: 400,
      error: "expected_revision must be a non-negative integer",
      code: "invalid_revision",
    };
  }

  return { ok: true, expectedRevision: n };
}

/**
 * Strict finalize metadata — never fills missing fields with passing defaults.
 */
export function parseStrictFinalizeDraftMeta(raw) {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      status: 422,
      error: "draft_meta is required for finalize",
      code: "missing_metadata",
    };
  }

  const signature = String(raw.sourceOutlineSignature ?? "").trim();
  if (!signature) {
    return {
      ok: false,
      status: 422,
      error: "sourceOutlineSignature is required for finalize",
      code: "missing_signature",
    };
  }

  if (raw.currentStageId !== MODULE6_REVIEW_STAGE_ID) {
    return {
      ok: false,
      status: 422,
      error: "Complete the draft review step before finishing.",
      code: "not_on_review_stage",
    };
  }

  if (raw.outlineReviewRequired === true) {
    return {
      ok: false,
      status: 409,
      error:
        "Your Module 5 outline changed. Review the outline notice before finishing your draft.",
      code: "outline_review_required",
      reviewRequired: true,
    };
  }

  if (!Array.isArray(raw.completedSectionIds)) {
    return {
      ok: false,
      status: 422,
      error: "completedSectionIds must be an array for finalize",
      code: "invalid_completed_sections",
    };
  }

  const completedSectionIds = raw.completedSectionIds
    .map((id) => String(id))
    .filter(Boolean);

  if (!Number.isInteger(raw.currentSectionIndex) || raw.currentSectionIndex < 0) {
    return {
      ok: false,
      status: 422,
      error: "currentSectionIndex must be a non-negative integer for finalize",
      code: "invalid_review_position",
    };
  }

  return {
    ok: true,
    meta: {
      schemaVersion: MODULE6_META_SCHEMA_VERSION,
      currentSectionIndex: raw.currentSectionIndex,
      currentStageId: MODULE6_REVIEW_STAGE_ID,
      sourceOutlineSignature: signature,
      completedSectionIds: [...new Set(completedSectionIds)],
      outlineReviewRequired: false,
      outlineReviewAcknowledged: raw.outlineReviewAcknowledged === true,
    },
  };
}

/**
 * Validate finalize request against server-loaded Module 5 outline.
 * Never trusts client expected count, full_text, or lock state.
 */
export function validateModule6FinalizeAgainstOutline({
  sections = [],
  draftMeta = null,
  outline = null,
} = {}) {
  if (!outline) {
    return {
      ok: false,
      status: 422,
      error: "Module 5 outline is required for finalize validation.",
      code: "outline_missing",
    };
  }

  const metaParse = parseStrictFinalizeDraftMeta(draftMeta);
  if (!metaParse.ok) {
    return metaParse;
  }

  const meta = metaParse.meta;
  const expectedCount = expectedProseSectionCount(outline);
  const canonicalSignature = buildModule5DraftSourceSignature(outline);
  const requiredSectionIds = expectedProseSectionIds(outline);
  const reviewIndex = expectedReviewStageIndex(outline);

  if (meta.sourceOutlineSignature !== canonicalSignature) {
    return {
      ok: false,
      status: 409,
      error:
        "Your Module 5 outline changed since drafting began. Review the outline notice before finishing.",
      code: "outline_signature_stale",
      reviewRequired: true,
      canonicalSignature,
    };
  }

  if (meta.currentSectionIndex !== reviewIndex) {
    return {
      ok: false,
      status: 422,
      error: "Complete the draft review step before finishing.",
      code: "invalid_review_position",
    };
  }

  const missingCompleted = requiredSectionIds.filter(
    (id) => !meta.completedSectionIds.includes(id)
  );
  if (missingCompleted.length > 0) {
    return {
      ok: false,
      status: 422,
      error: "Every required section must be completed before finishing.",
      code: "incomplete_completed_sections",
      missingSectionIds: missingCompleted,
    };
  }

  const readiness = evaluateDraftFinalizeReadiness({
    sections,
    expectedCount,
  });
  if (!readiness.ok) {
    return {
      ok: false,
      status: 422,
      error: readiness.message,
      code: "incomplete_draft",
      emptyIndexes: readiness.emptyIndexes,
    };
  }

  return {
    ok: true,
    expectedCount,
    canonicalSignature,
    draftMeta: {
      ...meta,
      sourceOutlineSignature: canonicalSignature,
      outlineReviewRequired: false,
    },
    action: MODULE6_WRITE_ACTION.FINALIZE,
  };
}

/**
 * Validate ordinary write body shape (not finalize predicates).
 */
export function validateModule6OrdinaryWriteBody(body = {}) {
  const action = String(body?.action || MODULE6_WRITE_ACTION.AUTOSAVE).toLowerCase();
  if (
    action !== MODULE6_WRITE_ACTION.AUTOSAVE &&
    action !== MODULE6_WRITE_ACTION.NAVIGATE
  ) {
    return {
      ok: false,
      status: 400,
      error: "Unsupported action",
      code: "unsupported_action",
    };
  }

  const revisionParse = parseMandatoryExpectedRevision(body);
  if (!revisionParse.ok) {
    return revisionParse;
  }

  const sections = body?.sections;
  if (!Array.isArray(sections)) {
    return {
      ok: false,
      status: 400,
      error: "Missing or invalid sections array",
      code: "invalid_sections",
    };
  }
  if (!sections.every((s) => typeof s === "string")) {
    return {
      ok: false,
      status: 400,
      error: "Each section must be a string",
      code: "invalid_sections",
    };
  }

  let draftMeta = null;
  if (body?.draft_meta != null) {
    if (typeof body.draft_meta !== "object" || Array.isArray(body.draft_meta)) {
      return {
        ok: false,
        status: 400,
        error: "draft_meta must be an object when provided",
        code: "invalid_metadata",
      };
    }
    draftMeta = body.draft_meta;
  }

  return {
    ok: true,
    action,
    sections,
    draftMeta,
    expectedRevision: revisionParse.expectedRevision,
  };
}

/**
 * Finalize POST body: mandatory revision + strict metadata + outline predicates.
 */
export function validateModule6FinalizeRequestBody(body = {}, { outline = null } = {}) {
  const revisionParse = parseMandatoryExpectedRevision(body);
  if (!revisionParse.ok) {
    return revisionParse;
  }

  const sections = body?.sections;
  if (!Array.isArray(sections) || !sections.every((s) => typeof s === "string")) {
    return {
      ok: false,
      status: 400,
      error: "Missing or invalid sections array",
      code: "invalid_sections",
    };
  }

  const outlineValidation = validateModule6FinalizeAgainstOutline({
    sections,
    draftMeta: body?.draft_meta,
    outline,
  });
  if (!outlineValidation.ok) {
    return outlineValidation;
  }

  return {
    ok: true,
    sections,
    expectedRevision: revisionParse.expectedRevision,
    draftMeta: outlineValidation.draftMeta,
    action: MODULE6_WRITE_ACTION.FINALIZE,
  };
}
