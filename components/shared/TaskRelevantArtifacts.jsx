"use client";

import ArtifactChip from "@/components/ui/ArtifactChip";

/**
 * Compact desk of already-saved artifacts for the current drafting/revision step.
 * Does not rewrite student work. Omits empty groups.
 */
export default function TaskRelevantArtifacts({
  items = [],
  heading = "On your desk for this step",
}) {
  const visible = Array.isArray(items) ? items.filter((item) => item?.lines?.length) : [];
  if (!visible.length) return null;

  return (
    <section
      className="rounded-xl border border-border-soft/70 bg-surface-soft/40 px-4 py-4 text-left shadow-soft md:px-5"
      data-testid="task-relevant-artifacts"
      aria-label={heading}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        {heading}
      </p>
      <div className="mt-3 space-y-3">
        {visible.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border-soft/60 bg-white/80 px-3 py-3"
            data-testid={`task-relevant-artifact-${item.kind}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {item.artifactType ? (
                <ArtifactChip artifactType={item.artifactType} label={item.label} />
              ) : (
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {item.label}
                </p>
              )}
            </div>
            <ul className="mt-2 list-none space-y-1.5 text-sm leading-relaxed text-text-primary">
              {item.lines.map((line, index) => (
                <li key={`${item.id}-${index}`} className="whitespace-pre-wrap break-words">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
