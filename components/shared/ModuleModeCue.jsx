"use client";

/**
 * WP-058 — Compact psychological mode cue for a module workspace.
 * Orientation only — quieter than the active task; not a transition card.
 */
import { getModulePsychologicalMode } from "@/lib/ui/modulePsychologicalModes";
import { HIERARCHY_LEVELS } from "@/lib/ui/hierarchyContract";

export default function ModuleModeCue({ module }) {
  const entry = getModulePsychologicalMode(module);
  if (!entry) return null;

  return (
    <div
      data-testid="module-mode-cue"
      data-module={String(entry.module)}
      data-mode={entry.mode}
      aria-label={`Module ${entry.module} ${entry.mode} mode`}
      data-hierarchy-level={HIERARCHY_LEVELS.objective}
      className="rounded-lg border border-border-soft/70 bg-surface-soft/40 px-3 py-2 text-left"
    >
      <p className="text-sm leading-snug text-text-primary">
        <span className="font-semibold">{entry.label}</span>
        <span className="text-text-muted"> · {entry.coaching}</span>
      </p>
    </div>
  );
}
