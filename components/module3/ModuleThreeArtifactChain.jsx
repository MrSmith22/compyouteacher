"use client";

/**
 * Compact Module 3 artifact chain using the student's real work.
 * Not a generic progress bar — shows how artifacts became each other:
 * Group → Pattern → Idea → Connections → Readiness → Claim → Thesis.
 */

const NOT_STARTED = "Not started yet";

export default function ModuleThreeArtifactChain({
  groupName = "",
  patternText = "",
  ideaStatement = "",
  connectionProgressLabel = "",
  readinessLabel = "",
  claimPreview = "",
  thesisPreview = "",
  currentStage = "connections",
}) {
  const stages = [
    {
      id: "group",
      label: "Group",
      preview: groupName || "Not chosen yet",
      started: Boolean(groupName),
    },
    {
      id: "pattern",
      label: "Chosen pattern",
      preview: patternText || "Not chosen yet",
      started: Boolean(patternText),
    },
    {
      id: "idea",
      label: "Your idea",
      preview: ideaStatement || "Not written yet",
      started: Boolean(ideaStatement),
    },
    {
      id: "connections",
      label: "Evidence connections",
      preview: connectionProgressLabel || NOT_STARTED,
      started: Boolean(connectionProgressLabel),
    },
    {
      id: "readiness",
      label: "Readiness",
      preview: readinessLabel || NOT_STARTED,
      started: Boolean(readinessLabel),
    },
    {
      id: "claim",
      label: "Claim",
      preview: claimPreview || NOT_STARTED,
      started: Boolean(claimPreview),
    },
    {
      id: "thesis",
      label: "Thesis",
      preview: thesisPreview || NOT_STARTED,
      started: Boolean(thesisPreview),
    },
  ].map((stage) => ({ ...stage, active: stage.id === currentStage }));

  return (
    <nav
      aria-label="How your thinking is building"
      className="rounded-xl border border-border-soft/80 bg-surface-soft/50 px-3 py-3 md:px-4"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
        Your thinking so far
      </p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {stages.map((stage, index) => (
          <li
            key={stage.id}
            aria-current={stage.active ? "step" : undefined}
            className={`min-w-0 rounded-lg border px-3 py-2 ${
              stage.active
                ? "border-theme-orange/40 bg-theme-orange/10"
                : stage.started
                  ? "border-border-soft/70 bg-white/70"
                  : "border-border-soft/50 bg-white/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  stage.active
                    ? "bg-theme-orange/20 text-theme-orange"
                    : "bg-surface-soft text-text-muted"
                }`}
              >
                {index + 1}
              </span>
              <p
                className={`text-xs font-semibold ${
                  stage.active ? "text-theme-orange" : "text-text-muted"
                }`}
              >
                {stage.label}
                {stage.active ? (
                  <span className="sr-only"> (current stage)</span>
                ) : null}
              </p>
            </div>
            <p
              className={`mt-1 line-clamp-2 text-left text-xs leading-relaxed ${
                stage.started || stage.active ? "text-text-primary" : "text-text-muted/70"
              }`}
            >
              {stage.preview}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-2 hidden text-center text-[10px] text-text-muted xl:block" aria-hidden="true">
        Group → Pattern → Idea → Evidence connections → Readiness → Claim → Thesis
      </p>
    </nav>
  );
}
