"use client";

/**
 * WP-084 — Concise whole-essay final inspection.
 * One primary finding + compact check overview. No five-card wall.
 * WP-097 — Renders inside ModuleSixStepFrame's promoted work region; only
 * adds internal desk/feedback region attrs (no separate frame/root).
 */

const CHECK_ORDER = [
  "thesis_body",
  "evidence_explanation",
  "intro_conclusion",
  "missing_duplicate",
  "word_count",
];

export default function WholeEssayReviewPanel({
  review,
  activeCheckId = null,
  onSelectCheck,
  onFixFinding,
  onConfirmAdvisory,
  advisoryConfirmed = false,
  disabled = false,
}) {
  if (!review) return null;

  const checks = Array.isArray(review.checks) ? review.checks : [];
  const clearCount = review.clearCount ?? checks.filter((c) => c.status === "pass").length;
  const checkCount =
    review.checkCount ??
    checks.filter((c) => c.status !== "skipped").length;
  const primary = review.primaryFinding;
  const activeCheck =
    activeCheckId || primary?.checkId || checks.find((c) => c.status === "needs_attention")?.checkId;

  const activeFindings = (review.findings || []).filter(
    (f) => f.checkId === activeCheck
  );
  const shown = activeFindings[0] || primary;

  const wordEval = review.wordEvaluation;
  const wordMessage = review.wordMessage;

  return (
    <div className="space-y-4" data-testid="whole-essay-review-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-theme-dark">
          Final inspection · {clearCount} of {checkCount} checks clear
        </p>
        <p
          className="text-sm text-text-muted"
          data-testid="whole-essay-word-total"
        >
          {review.essayWordCount} words total
          {Array.isArray(review.sectionCounts)
            ? ` · sections ${review.sectionCounts.join(" / ")}`
            : ""}
        </p>
      </div>

      {wordEval && wordEval.mode !== "off" ? (
        <div
          className="rounded-md border border-border-soft bg-surface-soft/40 px-3 py-2 text-sm"
          data-testid="whole-essay-word-expectation"
          data-word-status={wordEval.status}
          data-task-workspace-region="desk"
          data-instructional-color-role="student-thinking"
        >
          <p className="font-semibold text-theme-dark">
            Teacher expectation: {wordEval.expectationLabel}
          </p>
          <p className="mt-1 text-theme-dark/85">{wordMessage}</p>
        </div>
      ) : null}

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Inspection checks"
        data-testid="whole-essay-check-tabs"
      >
        {checks
          .filter((c) => c.status !== "skipped")
          .map((check) => {
            const selected = check.checkId === activeCheck;
            const pass = check.status === "pass";
            return (
              <button
                key={check.checkId}
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={disabled}
                className={[
                  "min-h-[44px] rounded-md border px-3 text-xs font-semibold",
                  selected
                    ? "border-theme-blue bg-theme-blue/10 text-theme-blue"
                    : pass
                      ? "border-theme-green/40 text-theme-green"
                      : "border-border-soft text-theme-dark",
                ].join(" ")}
                onClick={() => onSelectCheck?.(check.checkId)}
                data-check-id={check.checkId}
                data-check-status={check.status}
              >
                {pass ? "✓ " : ""}
                {check.label}
              </button>
            );
          })}
      </div>

      {shown ? (
        <div
          className="rounded-md border border-theme-blue/25 bg-theme-blue/[0.04] px-3 py-3 space-y-2"
          data-testid="whole-essay-active-finding"
          data-finding-id={shown.id}
          data-task-workspace-region="feedback"
          data-instructional-color-role="instruction"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-theme-blue">
            {shown.severity === "error" || shown.blocking
              ? "Needs attention"
              : shown.severity === "info"
                ? "Notice"
                : "Needs attention"}
          </p>
          <p className="text-sm font-semibold text-theme-dark">{shown.title}</p>
          <p className="text-sm text-theme-dark/90">
            <span className="font-semibold">What to check: </span>
            {shown.whatToCheck}
          </p>
          <p className="text-sm text-theme-dark/90">
            <span className="font-semibold">How to recognize it: </span>
            {shown.howToRecognize}
          </p>
          {shown.confidenceNote ? (
            <p className="text-xs text-text-muted">{shown.confidenceNote}</p>
          ) : null}
          {shown.sectionLabel ? (
            <button
              type="button"
              className="min-h-[44px] rounded-md bg-theme-blue px-3 text-sm font-semibold text-white disabled:opacity-50"
              disabled={disabled}
              onClick={() => onFixFinding?.(shown)}
              data-testid="whole-essay-fix-section"
            >
              Review/Fix {shown.sectionLabel}
            </button>
          ) : wordEval?.status === "below" && wordEval?.isAdvisory ? (
            <button
              type="button"
              className="min-h-[44px] rounded-md border border-border-soft px-3 text-sm font-semibold disabled:opacity-50"
              disabled={disabled || advisoryConfirmed}
              onClick={() => onConfirmAdvisory?.(shown)}
              data-testid="whole-essay-confirm-advisory"
            >
              {advisoryConfirmed
                ? "Confirmed — you can continue"
                : "I understand — continue without a specific section fix"}
            </button>
          ) : null}
        </div>
      ) : (
        <div
          className="rounded-md border border-theme-green/30 bg-theme-green/5 px-3 py-3 text-sm text-theme-green"
          data-testid="whole-essay-all-clear"
        >
          <p className="font-semibold">Pass — no automatic findings on these checks.</p>
          <p className="mt-1 text-theme-dark/80">
            You can still use Back to strengthen a section, then finish revising.
          </p>
        </div>
      )}

      {wordEval?.blocksCompletion ? (
        <p
          className="text-sm text-red-800"
          role="status"
          data-testid="whole-essay-required-block"
        >
          Finish stays locked until your saved essay meets your teacher’s required
          word-count expectation.
        </p>
      ) : null}
    </div>
  );
}

export { CHECK_ORDER };
