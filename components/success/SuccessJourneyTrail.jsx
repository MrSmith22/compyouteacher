"use client";

/**
 * WP-094 — Compact non-interactive journey trail (orientation only).
 */

export default function SuccessJourneyTrail({
  stages = [],
  label = "Your writing process",
  testId = "success-journey-trail",
}) {
  if (!Array.isArray(stages) || stages.length === 0) return null;

  return (
    <nav
      aria-label={label}
      data-testid={testId}
      className="rounded-xl border border-border-soft/70 bg-surface-soft/40 px-4 py-3"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
        {stages.map((stage, index) => {
          const state = stage.state || "future";
          const color =
            state === "completed"
              ? "text-theme-green"
              : state === "current"
                ? "text-theme-dark font-semibold"
                : "text-text-muted";
          const mark =
            state === "completed" ? "✓ " : state === "current" ? "• " : "";
          return (
            <li
              key={stage.id}
              className={`inline-flex items-center gap-2 text-sm ${color}`}
              data-stage={stage.id}
              data-state={state}
            >
              <span>
                {mark}
                {stage.label}
              </span>
              {index < stages.length - 1 ? (
                <span className="text-text-muted" aria-hidden="true">
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
