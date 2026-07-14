"use client";

import Button from "@/components/ui/Button";
import {
  MATRIX_REVIEW_CONFIRM_LABEL,
  MATRIX_REVIEW_MESSAGE,
} from "@/lib/module3/moduleThreeMatrixHandoffHelpers";

/**
 * Quiet but unmistakable upstream-dependency review banner (CP-D).
 * Confirmation is explicit; save failure must keep review state.
 */
export default function ModuleThreeMatrixReviewBanner({
  visible = false,
  message = MATRIX_REVIEW_MESSAGE,
  confirmLabel = MATRIX_REVIEW_CONFIRM_LABEL,
  busy = false,
  error = "",
  onConfirm,
}) {
  if (!visible) return null;

  return (
    <section
      className="overflow-x-hidden rounded-xl border-2 border-theme-orange/45 bg-theme-orange/[0.07] px-4 py-4"
      data-testid="matrix-dependency-review-banner"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-text-primary">{message}</p>
      <p className="mt-1 text-sm text-text-muted">
        Your writing stays exactly as you left it. Confirm it still fits, or edit
        it first.
      </p>
      <Button
        type="button"
        className="mt-3 min-h-[44px] w-full sm:w-auto"
        disabled={busy}
        data-testid="matrix-review-confirm"
        onClick={() => onConfirm?.()}
      >
        {confirmLabel}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-theme-red">
          {error}
        </p>
      ) : null}
    </section>
  );
}
