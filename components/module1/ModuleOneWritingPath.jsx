"use client";

/**
 * Compact six-stage writing path for the Module 1 welcome screen.
 * Below lg: continuous vertical path. At lg+: one continuous horizontal row.
 * Stages ≠ total decisions — one decision at a time within each stage.
 */

export const WRITING_PATH_FOOTER =
  "Six stages. One small decision at a time. You begin by understanding the assignment—not by writing the whole essay.";

export const WRITING_PATH_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1440],
  stageCount: 6,
  /** Continuous vertical path at 320 / 390 / 768 (all widths below lg). */
  verticalConnectedBelowLg: true,
  /** One continuous horizontal row at lg+ only — no wrapped multi-row path. */
  horizontalConnectedAtLgOnly: true,
  noWrappedMultiRowPath: true,
  startHereOnFirstStage: true,
  finishedEssayDestination: true,
  noHorizontalOverflow: true,
  meaningNotColorOnly: true,
  orderedListSemantics: true,
});

export default function ModuleOneWritingPath({
  steps = [],
  currentIndex = 0,
  destinationLabel = "Finished essay",
}) {
  return (
    <section
      aria-labelledby="welcome-process-heading"
      data-testid="welcome-writing-path"
      className="overflow-x-hidden"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2
          id="welcome-process-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted"
        >
          Your writing path
        </h2>
        <p className="text-xs font-medium text-theme-green">
          Destination: {destinationLabel}
        </p>
      </div>

      <ol
        className="mt-4 flex flex-col lg:flex-row lg:flex-nowrap"
        data-testid="welcome-process-preview"
      >
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;
          return (
            <li
              key={step}
              className="relative flex min-w-0 lg:min-w-0 lg:flex-1"
              data-stage-index={index}
              data-current={isCurrent ? "true" : "false"}
            >
              {/* Below lg: vertical connector from this circle to the next */}
              {!isLast ? (
                <span
                  className="pointer-events-none absolute left-[17px] top-9 z-0 h-[calc(100%-0.75rem)] w-px bg-border-soft lg:hidden"
                  aria-hidden="true"
                  data-testid={
                    index === 0 ? "path-connector-vertical" : undefined
                  }
                  data-path-connector="vertical"
                />
              ) : null}

              {/* lg+: horizontal connector from this circle to the next circle */}
              {!isLast ? (
                <span
                  className="pointer-events-none absolute left-[calc(50%+1.125rem)] top-[1.125rem] z-0 hidden h-px w-[calc(100%-2.25rem)] bg-border-soft lg:block"
                  aria-hidden="true"
                  data-testid={
                    index === 0 ? "path-connector-horizontal" : undefined
                  }
                  data-path-connector="horizontal"
                />
              ) : null}

              <div className="relative z-10 flex w-full gap-3 pb-5 lg:flex-col lg:items-center lg:gap-2 lg:px-2 lg:pb-2 lg:text-center">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                    isCurrent
                      ? "border-theme-orange bg-theme-orange text-white"
                      : isLast
                        ? "border-theme-green bg-theme-green/15 text-theme-green"
                        : "border-theme-blue/50 bg-theme-blue/10 text-theme-blue"
                  }`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1 lg:w-full lg:flex-none">
                  <p className="text-sm font-medium leading-snug text-text-primary">
                    {step}
                  </p>
                  {isCurrent ? (
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-orange">
                      Start here
                    </p>
                  ) : null}
                  {isLast ? (
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-green">
                      Essay
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p
        className="mt-4 text-sm leading-relaxed text-text-muted"
        data-testid="welcome-writing-path-footer"
      >
        {WRITING_PATH_FOOTER}
      </p>
    </section>
  );
}
