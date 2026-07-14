"use client";

/**
 * WP-051 — Visible success criteria near the forward action.
 * Semantic list only — not interactive checkboxes, not a new gate.
 */
import {
  HIERARCHY_INSTRUCTION_LABEL_CLASS,
  HIERARCHY_LEVELS,
} from "@/lib/ui/hierarchyContract";

export default function SuccessCriteriaPanel({
  items = [],
  heading = "Before you continue",
  lead = "Check your work:",
  note = "",
  mode = "criteria", // criteria | gate | micro
}) {
  const list = Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  if (!list.length) return null;

  return (
    <section
      className="rounded-xl border border-border-soft/70 bg-surface-soft/35 px-4 py-3 text-left md:px-5"
      data-testid="success-criteria-panel"
      data-success-criteria-mode={mode}
      data-hierarchy-level={HIERARCHY_LEVELS.instruction}
      aria-label={heading}
    >
      <p className={HIERARCHY_INSTRUCTION_LABEL_CLASS}>{heading}</p>
      {lead ? (
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-text-primary">
          {lead}
        </p>
      ) : null}
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-primary marker:text-text-muted/70">
        {list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {note ? (
        <p className="mt-2 text-xs leading-relaxed text-text-muted">{note}</p>
      ) : null}
    </section>
  );
}
