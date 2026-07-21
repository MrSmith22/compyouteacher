/**
 * Module 7 server-backed resume (WP-082 corrective).
 * Mirrors Module 6 currentSectionIndex persistence — not sessionStorage-only.
 */

import { clampModule7StepIndex } from "./module7StepBounds.js";

/**
 * @param {unknown} draftMeta
 * @returns {number | null}
 */
export function readModule7ResumeStepIndex(draftMeta) {
  if (!draftMeta || typeof draftMeta !== "object") return null;
  const resume = draftMeta.resume;
  const fromResume =
    resume && typeof resume === "object" ? resume.currentStepIndex : null;
  const raw =
    typeof fromResume === "number"
      ? fromResume
      : typeof draftMeta.currentStepIndex === "number"
        ? draftMeta.currentStepIndex
        : null;
  if (raw == null || !Number.isFinite(raw)) return null;
  return Math.max(0, Math.floor(raw));
}

/**
 * Restore a clamped step index after hydrate.
 * @param {unknown} draftMeta
 * @param {number} sectionStepCount
 */
export function resolveModule7ResumeStepIndex(draftMeta, sectionStepCount) {
  const raw = readModule7ResumeStepIndex(draftMeta);
  if (raw == null) return 0;
  return clampModule7StepIndex(raw, sectionStepCount);
}

/**
 * Persist minimum resume fields into draft_meta without dropping verticalSlice.
 * Supports whole-essay local repair return (WP-084).
 * @param {object | null | undefined} draftMeta
 * @param {{
 *   currentStepIndex: number,
 *   sectionType?: string | null,
 *   draftIndex?: number | null,
 *   returnTo?: string | null,
 *   wholeEssayFindingId?: string | null,
 *   wholeEssayCheckId?: string | null,
 *   revisionTargetId?: string | null,
 * }} resume
 */
export function setModule7ResumeInDraftMeta(draftMeta, resume = {}) {
  const base =
    draftMeta && typeof draftMeta === "object" ? { ...draftMeta } : {};
  const currentStepIndex = Math.max(
    0,
    Math.floor(Number(resume.currentStepIndex) || 0)
  );
  const sectionType =
    typeof resume.sectionType === "string" && resume.sectionType
      ? resume.sectionType
      : null;
  const draftIndex =
    typeof resume.draftIndex === "number" && Number.isFinite(resume.draftIndex)
      ? resume.draftIndex
      : null;
  const returnTo =
    typeof resume.returnTo === "string" && resume.returnTo
      ? resume.returnTo
      : null;
  const wholeEssayFindingId =
    typeof resume.wholeEssayFindingId === "string" && resume.wholeEssayFindingId
      ? resume.wholeEssayFindingId
      : null;
  const wholeEssayCheckId =
    typeof resume.wholeEssayCheckId === "string" && resume.wholeEssayCheckId
      ? resume.wholeEssayCheckId
      : null;
  const revisionTargetId =
    typeof resume.revisionTargetId === "string" && resume.revisionTargetId
      ? resume.revisionTargetId
      : null;

  return {
    ...base,
    currentStepIndex,
    resume: {
      kind: "module7",
      currentStepIndex,
      sectionType,
      draftIndex,
      returnTo,
      wholeEssayFindingId,
      wholeEssayCheckId,
      revisionTargetId,
    },
  };
}

/**
 * Read whole-essay repair return destination from resume.
 * @param {unknown} draftMeta
 */
export function readModule7WholeEssayRepair(draftMeta) {
  if (!draftMeta || typeof draftMeta !== "object") return null;
  const resume = draftMeta.resume;
  if (!resume || typeof resume !== "object") return null;
  if (resume.returnTo !== "final-review") return null;
  return {
    returnTo: "final-review",
    wholeEssayFindingId:
      typeof resume.wholeEssayFindingId === "string"
        ? resume.wholeEssayFindingId
        : null,
    wholeEssayCheckId:
      typeof resume.wholeEssayCheckId === "string"
        ? resume.wholeEssayCheckId
        : null,
    revisionTargetId:
      typeof resume.revisionTargetId === "string"
        ? resume.revisionTargetId
        : null,
    draftIndex:
      typeof resume.draftIndex === "number" ? resume.draftIndex : null,
    sectionType:
      typeof resume.sectionType === "string" ? resume.sectionType : null,
  };
}
