"use client";

/**
 * Compact / expandable Module 2 matrix provenance for Module 3 decisions (CP-D).
 * Ratings and evidence are text-readable — meaning does not rely on color alone.
 */

export default function ModuleThreeMatrixProvenanceCard({
  eyebrow = "From your Module 2 analysis",
  selectedLabel = "",
  becauseYouExplanation = "",
  audiencePurposeReasoning = "",
  ratingLines = [],
  evidenceLines = [],
  compact = true,
  defaultExpanded = false,
}) {
  const hasRatings = Array.isArray(ratingLines) && ratingLines.length > 0;
  const hasEvidence = Array.isArray(evidenceLines) && evidenceLines.length > 0;
  const hasReasoning = Boolean(String(audiencePurposeReasoning || "").trim());

  if (!selectedLabel && !becauseYouExplanation && !hasRatings && !hasEvidence) {
    return null;
  }

  const body = (
    <div className="space-y-3 text-left">
      {selectedLabel ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Because you selected…
          </p>
          <p className="mt-1 text-sm font-medium leading-snug text-text-primary">
            {selectedLabel}
          </p>
        </div>
      ) : null}

      {becauseYouExplanation ? (
        <p className="text-sm leading-relaxed text-text-muted">
          {becauseYouExplanation}
        </p>
      ) : null}

      {hasRatings ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Ratings behind this direction
          </p>
          <ul className="mt-1 space-y-1 text-sm text-text-primary">
            {ratingLines.map((line) => (
              <li key={line.visibleLabel || `${line.sourceLabel}-${line.appeal}`}>
                {line.visibleLabel}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasEvidence ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Evidence behind this direction
          </p>
          <ul className="mt-1 space-y-2 text-sm leading-relaxed text-text-primary">
            {evidenceLines.map((line) => (
              <li
                key={line.evidenceId || line.visibleLabel}
                className="break-words"
              >
                {line.visibleLabel}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasReasoning ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Your audience and purpose reasoning
          </p>
          <p className="mt-1 text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
            {audiencePurposeReasoning}
          </p>
        </div>
      ) : null}
    </div>
  );

  if (compact) {
    return (
      <details
        className="overflow-x-hidden rounded-xl border border-border-soft/80 bg-white/90 px-4 py-3 shadow-soft"
        open={defaultExpanded}
        data-testid="matrix-provenance-card"
      >
        <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
          {eyebrow}
        </summary>
        <div className="mt-3 border-t border-border-soft/60 pt-3">{body}</div>
      </details>
    );
  }

  return (
    <section
      className="overflow-x-hidden rounded-xl border-2 border-theme-blue/35 bg-theme-blue/[0.04] px-4 py-4 shadow-soft sm:px-5"
      data-testid="matrix-provenance-card"
      aria-labelledby="matrix-provenance-heading"
    >
      <h2
        id="matrix-provenance-heading"
        className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue"
      >
        {eyebrow}
      </h2>
      <div className="mt-3">{body}</div>
    </section>
  );
}
