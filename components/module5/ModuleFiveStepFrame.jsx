/**
 * Module 5 instructional frame — same coaching structure as Module 3,
 * with a wide main workspace instead of the Module 3 three-column squeeze.
 *
 * Desktop (lg+): centered shell ~1180px; main ~680–820px; compact right rail.
 * Tablet / mobile (<lg): single column; guidance stacks below the workspace.
 */

import ModuleModeCue from "@/components/shared/ModuleModeCue";

function normalizeWhyMatters(whyMatters) {
  if (Array.isArray(whyMatters)) {
    return whyMatters.filter(Boolean);
  }
  if (typeof whyMatters === "string" && whyMatters.trim()) {
    return [whyMatters.trim()];
  }
  return [];
}

export default function ModuleFiveStepFrame({
  question,
  whyMatters,
  successLooksLike = [],
  children,
  coachingMessage = "",
  nextStepText = "",
  psychologicalModule = 5,
}) {
  const whyLines = normalizeWhyMatters(whyMatters);
  const successItems = Array.isArray(successLooksLike)
    ? successLooksLike.filter(Boolean)
    : [];

  return (
    <div
      className="mx-auto w-full max-w-[1180px] overflow-x-hidden"
      data-module5-step-frame="true"
      data-cpf-desktop-shell="1180"
    >
      <div
        className={[
          "grid grid-cols-1 gap-6",
          // Rail only at lg+ so tablet stays a readable single column.
          "lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] lg:items-start lg:gap-8",
        ].join(" ")}
        data-cpf-layout-grid="module5"
      >
        <section
          className="min-w-0 w-full max-w-none space-y-6 lg:max-w-[820px]"
          aria-label="Outline workspace"
          data-module5-main-workspace="true"
          data-cpf-main-max="820"
        >
          {psychologicalModule != null ? (
            <ModuleModeCue module={psychologicalModule} />
          ) : null}

          <header className="space-y-3 py-1 text-left md:py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Question
            </p>
            <h1
              className="w-full max-w-none text-[1.65rem] font-bold leading-[1.15] tracking-tight text-text-primary sm:text-[1.9rem] md:text-[2.15rem] md:leading-[1.12]"
              data-module5-question="true"
            >
              {question}
            </h1>
          </header>

          <div className="w-full space-y-3 text-left">
            <details
              className="rounded-lg bg-surface-soft/50 px-4 py-3"
              open
            >
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                Why this matters
              </summary>
              <div className="mt-2 space-y-2">
                {whyLines.length > 0 ? (
                  whyLines.map((line) => (
                    <p
                      key={line}
                      className="text-sm leading-relaxed text-text-muted"
                    >
                      {line}
                    </p>
                  ))
                ) : (
                  <p className="text-sm leading-relaxed text-text-muted">
                    Keep going in your own words. We&apos;re building thinking
                    you can use later.
                  </p>
                )}
              </div>
            </details>

            {successItems.length > 0 ? (
              <details className="rounded-lg bg-surface-soft/50 px-4 py-3">
                <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                  How do I know I&apos;m finished?
                </summary>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
                  {successItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>

          <div
            className="w-full min-w-0 space-y-6"
            data-module5-stage-content="true"
          >
            {children}
          </div>
        </section>

        <aside
          className="min-w-0 w-full lg:sticky lg:top-6 lg:self-start"
          aria-label="Teacher guidance"
          data-module5-teacher-rail="true"
        >
          <div className="space-y-5 rounded-xl bg-surface-soft/70 px-4 py-5 text-left">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                From your teacher
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                {coachingMessage ||
                  "Keep your language simple and honest. Clear thinking beats fancy words."}
              </p>
            </div>

            <div className="space-y-2 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                What comes next
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                {nextStepText ||
                  "Keep one outline decision at a time as your paragraph order becomes clear."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
