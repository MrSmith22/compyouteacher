"use client";

/**
 * Code-native vocabulary meaning diagrams (no icon library / no stock art).
 * Captions remain visible for accessibility; decorative connectors are aria-hidden.
 */

export default function ModuleOneVocabularyVisual({ visual }) {
  if (!visual || !visual.kind) return null;

  return (
    <figure
      className="rounded-xl border border-border-soft/70 bg-white/90 px-4 py-4 shadow-soft overflow-x-hidden"
      data-testid="vocab-visual-model"
      data-visual-kind={visual.kind}
    >
      {visual.kind === "umbrella" ? (
        <div className="space-y-3" aria-hidden="true">
          <div className="inline-flex min-h-[40px] items-center rounded-full border-2 border-theme-blue bg-theme-blue/10 px-4 py-2 text-sm font-semibold text-theme-blue">
            {visual.root}
          </div>
          <div className="ml-2 border-l-2 border-border-soft pl-4 space-y-2">
            {(visual.children || []).map((child) => (
              <div
                key={child}
                className="rounded-lg border border-border-soft/80 bg-surface-soft/50 px-3 py-2 text-sm text-text-primary"
              >
                {child}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ol
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch"
          aria-hidden="true"
        >
          {(visual.steps || []).map((step, index) => (
            <li
              key={`${step}-${index}`}
              className="flex min-w-0 flex-1 items-stretch gap-2"
            >
              <div className="flex min-h-[52px] w-full flex-col justify-center rounded-lg border-2 border-border-soft bg-surface-soft/40 px-3 py-2 text-sm font-medium leading-snug text-text-primary">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  {index + 1}
                </span>
                <span className="mt-1">{step}</span>
              </div>
              {index < (visual.steps?.length || 0) - 1 ? (
                <span
                  className="hidden self-center text-text-muted sm:inline"
                  aria-hidden="true"
                >
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      <figcaption className="mt-3 text-sm leading-relaxed text-text-muted">
        {visual.caption}
      </figcaption>
    </figure>
  );
}
