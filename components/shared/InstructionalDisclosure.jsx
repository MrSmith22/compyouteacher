"use client";

import { useId, useState } from "react";
import { HIERARCHY_FOCUS_RING_CLASS } from "@/lib/ui/hierarchyContract";

/**
 * WP-054 — Shared accessible instructional disclosure.
 * Closed-by-default for supplemental content. Never renders when empty.
 * Presentation-only: does not save, progress, verify, or upload.
 */
export default function InstructionalDisclosure({
  title,
  children,
  defaultOpen = false,
  className = "",
  "data-testid": testId,
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const panelId = useId();
  const hasContent =
    children != null &&
    !(typeof children === "string" && !String(children).trim());

  if (!hasContent) return null;

  const stateLabel = open ? "Hide" : "Show";

  return (
    <details
      className={[
        "rounded-lg border border-border-soft/70 bg-white/80 open:border-theme-blue/25 open:bg-theme-blue/[0.03]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      open={open}
      data-testid={testId || "instructional-disclosure"}
      data-disclosure-title={title}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        aria-expanded={open}
        aria-controls={panelId}
        className={`flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium text-text-primary transition hover:bg-surface-soft/70 ${HIERARCHY_FOCUS_RING_CLASS} [&::-webkit-details-marker]:hidden`}
      >
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border-soft bg-surface-soft text-xs font-bold text-text-primary"
        >
          {open ? "−" : "+"}
        </span>
        <span className="flex-1 text-left">{title}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {stateLabel}
        </span>
        <span aria-hidden="true" className="text-text-muted">
          {open ? "▴" : "▾"}
        </span>
      </summary>
      <div id={panelId} className="space-y-2 border-t border-border-soft/50 px-3 py-3">
        {children}
      </div>
    </details>
  );
}
