/**
 * Pure outline builder for WP-082 Intro+Conclusion seed fixtures.
 * Uses the same CP-F shape Module 5 hydrates from student_outlines.
 */

import { buildOutlineBodyFromModule4Plans } from "../../module4/mapStudentBucketsToOutline.js";
import { MODULE5_STAGE } from "../../module5/module5OutlineStageHelpers.js";

export const WP082_SEED_CONCLUSION = {
  summary:
    "The comparison shows how King matches rhetorical work to each audience.",
  finalThought:
    "Noticing that match helps readers judge persuasion in their own lives.",
};

/**
 * @param {{
 *   buckets?: unknown[],
 *   wantThirdBucket?: boolean | null,
 *   tchartRows?: unknown[],
 *   thesis?: string,
 *   conclusion?: { summary?: string, finalThought?: string },
 * }} input
 */
export function buildWp082Module5Outline(input = {}) {
  const buckets = Array.isArray(input.buckets) ? input.buckets : [];
  const tchartRows = Array.isArray(input.tchartRows) ? input.tchartRows : [];
  const wantThirdBucket =
    input.wantThirdBucket === true || input.wantThirdBucket === false
      ? input.wantThirdBucket
      : false;

  const body = buildOutlineBodyFromModule4Plans({
    buckets,
    wantThirdBucket,
    tchartRows,
  });

  const thesis =
    typeof input.thesis === "string" && input.thesis.trim()
      ? input.thesis.trim()
      : "";

  const conclusion = {
    summary:
      (typeof input.conclusion?.summary === "string" &&
        input.conclusion.summary.trim()) ||
      WP082_SEED_CONCLUSION.summary,
    finalThought:
      (typeof input.conclusion?.finalThought === "string" &&
        input.conclusion.finalThought.trim()) ||
      WP082_SEED_CONCLUSION.finalThought,
  };

  const reviewedBodyIndices = body.map((_, index) => index);

  return {
    thesis,
    body,
    conclusion,
    module5Ui: {
      stage: MODULE5_STAGE.FINALIZE,
      bodyReviewIndex: Math.max(body.length - 1, 0),
      conclusionMicro: 2,
      reviewedBodyIndices,
    },
  };
}

/**
 * Assert the outline shape Module 5 expects for acceptance.
 * @param {unknown} outline
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function assertWp082Module5OutlineContract(outline) {
  if (!outline || typeof outline !== "object") {
    return { ok: false, error: "outline missing" };
  }
  const thesis = String(outline.thesis || "").trim();
  if (!thesis) {
    return { ok: false, error: "thesis missing" };
  }
  const body = Array.isArray(outline.body) ? outline.body : [];
  if (body.length < 2) {
    return { ok: false, error: `body length ${body.length} < 2` };
  }
  for (let i = 0; i < body.length; i += 1) {
    const card = body[i];
    if (typeof card?.sourceParagraphIndex !== "number") {
      return {
        ok: false,
        error: `body[${i}] missing sourceParagraphIndex`,
      };
    }
    if (!String(card?.point || card?.bucket || "").trim()) {
      return { ok: false, error: `body[${i}] missing point` };
    }
    if (!String(card?.job || card?.jobId || "").trim()) {
      return { ok: false, error: `body[${i}] missing job` };
    }
    if (!Array.isArray(card?.moveOrder) || card.moveOrder.length === 0) {
      return { ok: false, error: `body[${i}] missing moveOrder` };
    }
  }
  const conclusion = outline.conclusion;
  if (
    !conclusion ||
    !String(conclusion.summary || "").trim() ||
    !String(conclusion.finalThought || "").trim()
  ) {
    return { ok: false, error: "conclusion plan incomplete" };
  }
  if (Number(outline.module5Ui?.stage) !== MODULE5_STAGE.FINALIZE) {
    return { ok: false, error: "module5Ui.stage must be FINALIZE" };
  }
  return { ok: true };
}
