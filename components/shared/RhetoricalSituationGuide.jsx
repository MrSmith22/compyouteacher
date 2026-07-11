"use client";

import {
  getCompactSituationSummary,
  getRhetoricalSituationModel,
  getSituationComparisonModel,
} from "@/lib/shared/rhetoricalSituationHelpers";

/**
 * Reusable rhetorical-situation presentation.
 * Answers: what was happening, who was King addressing, what was he trying to
 * accomplish, and why the situation may shape his choices.
 *
 * Distinct from the artifact chain (student progress) and the prompt compass
 * (essay requirements). No checkmarks, no progress semantics.
 *
 * Modes: "speech" | "letter" — one full situation card;
 *        "compare"           — both cards + similarities/differences + caveat;
 *        "compact"           — brief per-source reminder.
 */

function SituationRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="text-left">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm leading-relaxed text-text-primary">{value}</dd>
    </div>
  );
}

function SituationCard({ sourceDefinition }) {
  const model = getRhetoricalSituationModel(sourceDefinition);
  if (!model.hasRenderableContext) return null;

  const headingId = `situation-${model.sourceType || model.title || "source"}`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-theme-dark/15 bg-white px-4 py-4 text-left"
    >
      <h3 id={headingId} className="text-base font-semibold text-text-primary">
        {model.label ? `${model.label} — ` : ""}
        {model.title}
      </h3>

      <dl className="mt-3 space-y-3">
        <SituationRow label="Form" value={model.form} />
        <SituationRow
          label="When and where"
          value={[model.date, model.occasion].filter(Boolean).join(" — ")}
        />
        <SituationRow label="Primary audience" value={model.immediateAudience} />
        <SituationRow label="Broader audience" value={model.broaderAudience} />
        <SituationRow label="The situation" value={model.audienceSituation} />
        {model.purposes.length > 0 ? (
          <div className="text-left">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Important purposes to test against the text
            </dt>
            <dd className="mt-0.5">
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-primary">
                {model.purposes.map((purpose) => (
                  <li key={purpose}>{purpose}</li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
        <SituationRow label="What was happening" value={model.historicalContext} />
        <SituationRow label="Why the form matters" value={model.whyFormMatters} />
      </dl>

      {model.authoritativeSources.length > 0 ? (
        <details className="mt-3 rounded-lg bg-surface-soft/50">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-theme-blue underline-offset-2 hover:underline">
            Where this history comes from
          </summary>
          <ul className="space-y-1 border-t border-border-soft/60 px-3 py-2 text-xs leading-relaxed">
            {model.authoritativeSources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-theme-blue underline underline-offset-2"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function CompactCard({ sourceDefinition }) {
  const summary = getCompactSituationSummary(sourceDefinition);
  if (!summary.hasRenderableContext) return null;

  return (
    <div className="rounded-lg border border-border-soft/70 bg-white px-3 py-3 text-left">
      <p className="text-sm font-semibold text-text-primary">
        {summary.label ? `${summary.label} — ` : ""}
        {summary.title}
      </p>
      {summary.form ? (
        <p className="mt-1 text-xs leading-relaxed text-text-muted">{summary.form}</p>
      ) : null}
      {summary.audienceLine ? (
        <p className="mt-1.5 text-sm leading-relaxed text-text-primary">
          <span className="font-medium">Addressing: </span>
          {summary.audienceLine}
        </p>
      ) : null}
      {summary.purposeLines.length > 0 ? (
        <p className="mt-1.5 text-sm leading-relaxed text-text-primary">
          <span className="font-medium">Working to: </span>
          {summary.purposeLines.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

export default function RhetoricalSituationGuide({
  mode = "compact",
  sources = {},
  comparison = null,
}) {
  const speech = sources?.speech || null;
  const letter = sources?.letter || null;

  if (mode === "speech" || mode === "letter") {
    const source = mode === "speech" ? speech : letter;
    if (!source) return null;
    return <SituationCard sourceDefinition={source} />;
  }

  if (mode === "compare") {
    const comparisonModel = getSituationComparisonModel(comparison);
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {speech ? <SituationCard sourceDefinition={speech} /> : null}
          {letter ? <SituationCard sourceDefinition={letter} /> : null}
        </div>

        {comparisonModel.hasRenderableComparison ? (
          <section
            aria-labelledby="situation-comparison-heading"
            className="rounded-xl border border-theme-dark/15 bg-surface-soft/50 px-4 py-4 text-left"
          >
            <h3
              id="situation-comparison-heading"
              className="text-base font-semibold text-text-primary"
            >
              The two situations, compared
            </h3>

            {comparisonModel.shared.length > 0 ? (
              <div className="mt-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                  What the works share
                </h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-primary">
                  {comparisonModel.shared.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {comparisonModel.different.length > 0 ? (
              <div className="mt-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                  What makes them different
                </h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-primary">
                  {comparisonModel.different.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {comparisonModel.caveat ? (
              <p className="mt-3 text-sm italic leading-relaxed text-text-muted">
                {comparisonModel.caveat}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    );
  }

  // compact
  const cards = [speech, letter].filter(Boolean);
  if (cards.length === 0) return null;

  return (
    <div className="space-y-2">
      {speech ? <CompactCard sourceDefinition={speech} /> : null}
      {letter ? <CompactCard sourceDefinition={letter} /> : null}
    </div>
  );
}
