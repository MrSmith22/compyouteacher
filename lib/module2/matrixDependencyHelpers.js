/**
 * Matrix revision → dependency review marking (CP-C).
 * Never silently rewrites claim, thesis, plans, outline, or draft text.
 */

import {
  createEmptyMatrixBundle,
  readMatrixBundle,
  updateCellInBundle,
} from "./rhetoricalMatrixHelpers.js";
import { derivePatternOptions } from "./matrixDerivationHelpers.js";
import {
  isMatrixHandoffReady,
  mergeReviewState,
  resolveMatrixResumeTarget,
} from "./matrixOrchestrationHelpers.js";

export const DOWNSTREAM_REWRITE_FORBIDDEN = true;

/**
 * When a cell changes: recompute derived options; do not auto-select a new pattern;
 * mark dependents needs_review with reasons and changed cell ids (deduped).
 */
export function applyCellEdit({
  bundle,
  cellId,
  patch,
  existingSelection = null,
}) {
  const previous = readMatrixBundle(bundle) || createEmptyMatrixBundle();
  const next = updateCellInBundle(previous, cellId, patch);
  const derived = derivePatternOptions(next);

  const selectionPreserved = existingSelection || next.selectedPattern || null;
  let reviewState = previous.reviewState || {
    dependentsNeedReview: false,
    reasons: [],
    changedCellIds: [],
  };

  if (selectionPreserved) {
    reviewState = mergeReviewState(reviewState, cellId, {
      code: "upstream_rating_changed",
      message: "A matrix cell changed after you selected a pattern.",
    });
  }

  return {
    bundle: {
      ...next,
      selectedPattern: selectionPreserved,
      reviewState,
    },
    derived,
    selectionAutoUpdated: false,
    downstreamTextsRewritten: false,
  };
}

/**
 * Module 3 hydration decision — requires complete handoff predicate.
 */
export function resolveModule3MatrixHandoff(bundleRaw) {
  const bundle = readMatrixBundle(bundleRaw);
  if (!bundle) {
    return {
      mode: "legacy_pattern_path",
      cta: null,
      selectedPattern: null,
      remaining: null,
    };
  }

  if (isMatrixHandoffReady(bundle)) {
    return {
      mode: "prefer_matrix_selection",
      cta: null,
      selectedPattern: bundle.selectedPattern,
      remaining: null,
    };
  }

  const resume = resolveMatrixResumeTarget(bundle);
  const remainingMessages = {
    incomplete_cell: "Finish all six matrix cells before using this handoff.",
    dependents_need_review:
      "A matrix cell changed. Review or reconfirm your pattern selection.",
    awaiting_pattern_selection:
      "Choose a pattern direction from your completed matrix.",
    custom_pattern_incomplete: "Finish naming your custom pattern (at least 15 characters).",
    reasoning_incomplete:
      "Explain why this direction fits these audiences and purposes.",
    safe_fallback_review: "Return to the matrix review to finish the handoff.",
  };

  return {
    mode: "matrix_review_required",
    cta: {
      href: "/modules/2/matrix",
      label:
        remainingMessages[resume.reason] ||
        "Finish your rhetorical matrix handoff",
    },
    selectedPattern: bundle.selectedPattern || null,
    remaining: resume.reason,
  };
}

/** Review pages must not write. */
export const MATRIX_REVIEW_IS_READONLY = true;
