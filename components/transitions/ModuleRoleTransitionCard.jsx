"use client";

/**
 * WP-052 — Compact role-change transition for thin boundary screens.
 * Semantic list of accomplishment → next role → continuity; CTA stays strongest.
 */
import {
  HIERARCHY_FOCUS_RING_CLASS,
  HIERARCHY_OBJECTIVE_CLASS,
  HIERARCHY_TASK_CLASS,
} from "@/lib/ui/hierarchyContract";

export default function ModuleRoleTransitionCard({
  transition,
  children = null,
  status = null,
}) {
  if (!transition) return null;

  const headingId = `module-role-transition-${transition.id}-heading`;

  return (
    <section
      className="w-full max-w-xl space-y-5 text-left"
      data-testid="module-role-transition"
      data-from-module={String(transition.fromModule)}
      data-to-module={
        transition.toModule == null ? "complete" : String(transition.toModule)
      }
      data-presentation={transition.presentation || "card"}
      aria-labelledby={headingId}
    >
      {transition.eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
          {transition.eyebrow}
        </p>
      ) : null}

      <h1 id={headingId} className={`${HIERARCHY_TASK_CLASS} text-theme-dark`}>
        {transition.headline || transition.accomplishment}
      </h1>

      <div className="space-y-3">
        <p className="text-base font-medium leading-relaxed text-text-primary md:text-lg">
          {transition.accomplishment}
        </p>
        <p className="text-base leading-relaxed text-text-primary md:text-lg">
          {transition.nextRole}
        </p>
        <p className={`${HIERARCHY_OBJECTIVE_CLASS} max-w-prose`}>
          {transition.continuity}
        </p>
      </div>

      {status ? (
        <p className="text-sm text-text-muted" role="status">
          {status}
        </p>
      ) : null}

      {children ? (
        <div className={`pt-1 ${HIERARCHY_FOCUS_RING_CLASS}`}>{children}</div>
      ) : null}
    </section>
  );
}
