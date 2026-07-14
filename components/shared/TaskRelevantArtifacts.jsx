"use client";

import ArtifactChip from "@/components/ui/ArtifactChip";
import {
  HIERARCHY_DESK_BODY_CLASS,
  HIERARCHY_DESK_CLASS,
  HIERARCHY_DESK_ITEM_CLASS,
  HIERARCHY_LEVELS,
} from "@/lib/ui/hierarchyContract";

/**
 * Compact desk of already-saved artifacts for the current drafting/revision step.
 * Level 4 support — quieter than the active writing/decision surface.
 */
export default function TaskRelevantArtifacts({
  items = [],
  heading = "On your desk for this step",
}) {
  const visible = Array.isArray(items) ? items.filter((item) => item?.lines?.length) : [];
  if (!visible.length) return null;

  return (
    <section
      className={HIERARCHY_DESK_CLASS}
      data-testid="task-relevant-artifacts"
      data-hierarchy-level={HIERARCHY_LEVELS.work}
      data-hierarchy-emphasis="support"
      data-instructional-color-role="student-thinking"
      aria-label={heading}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-role-thinking">
        {heading}
      </p>
      <div className="mt-2.5 space-y-2">
        {visible.map((item) => (
          <div
            key={item.id}
            className={HIERARCHY_DESK_ITEM_CLASS}
            data-testid={`task-relevant-artifact-${item.kind}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {item.artifactType ? (
                <ArtifactChip artifactType={item.artifactType} label={item.label} />
              ) : (
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {item.label}
                </p>
              )}
            </div>
            <ul className={`mt-1.5 list-none space-y-1 ${HIERARCHY_DESK_BODY_CLASS}`}>
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
