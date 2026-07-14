/**
 * WP-050 — Five-level visual hierarchy contract for Modules 6–9 pilot.
 * Static Tailwind class tokens + semantic level names.
 * Scale/spacing/contrast/placement — not a more colorful palette.
 */

export const HIERARCHY_LEVELS = Object.freeze({
  task: "task",
  objective: "objective",
  instruction: "instruction",
  work: "work",
  reference: "reference",
});

/** Level 1 — dominant current task heading */
export const HIERARCHY_TASK_CLASS =
  "max-w-4xl text-[1.95rem] font-bold leading-[1.08] tracking-tight text-text-primary md:text-[2.65rem] md:leading-[1.05]";

/** Module chrome titles stay quieter than active journey/task headings */
export const HIERARCHY_MODULE_CHROME_CLASS =
  "text-lg font-semibold leading-snug tracking-tight text-text-primary md:text-xl";

/** Level 2 — purpose/objective under the task (never competes with H1) */
export const HIERARCHY_OBJECTIVE_CLASS =
  "text-sm leading-relaxed text-text-muted";

export const HIERARCHY_OBJECTIVE_LABEL_CLASS =
  "font-medium text-text-muted";

/**
 * Level 3 — teacher instruction (job-right-now / coaching).
 * WP-061: soft instruction-blue surface. Not for Module 7 revision strategy.
 */
export const HIERARCHY_INSTRUCTION_CLASS =
  "rounded-xl border border-role-instruction/25 bg-role-instruction/[0.05] px-5 py-4 text-left";

export const HIERARCHY_INSTRUCTION_LABEL_CLASS =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-role-instruction";

export const HIERARCHY_INSTRUCTION_LEAD_CLASS =
  "mt-2 text-base font-semibold leading-snug text-text-primary";

export const HIERARCHY_INSTRUCTION_BODY_CLASS =
  "text-sm leading-relaxed text-text-primary";

/**
 * Level 4 — active student work surface (textarea / essay / checklist host).
 * Neutral by default — use ROLE_* writing/revision tokens when cognitive role differs.
 */
export const HIERARCHY_WORK_SURFACE_CLASS =
  "[&>div:last-child]:border-2 [&>div:last-child]:border-theme-dark/20 [&>div:last-child]:bg-white [&>div:last-child]:shadow-md [&>div:last-child]:ring-1 [&>div:last-child]:ring-theme-dark/10";

/**
 * Level 4 support — pulled-forward desk (student-thinking role, WP-061).
 */
export const HIERARCHY_DESK_CLASS =
  "rounded-xl border border-role-thinking/25 bg-role-thinking/[0.05] px-4 py-3 text-left md:px-5";

export const HIERARCHY_DESK_ITEM_CLASS =
  "rounded-lg border border-border-soft/40 bg-white/70 px-3 py-2.5";

export const HIERARCHY_DESK_BODY_CLASS =
  "text-sm leading-relaxed text-text-muted";

/** Level 5 — reference / guide / shelf (reference-gray role, WP-061) */
export const HIERARCHY_REFERENCE_CLASS =
  "opacity-75 text-left";

export const HIERARCHY_REFERENCE_ASIDE_CLASS =
  "space-y-5 rounded-xl border border-role-reference/25 bg-role-reference/[0.06] px-5 py-5 text-left";

/** Actions — primary forward vs secondary; orange final stays intentional */
export const HIERARCHY_ACTION_SECONDARY_CLASS =
  "min-h-[44px] rounded-lg border border-border-soft/80 bg-surface-soft px-4 py-2 text-sm font-medium text-text-primary hover:bg-border-soft/50 disabled:opacity-50";

export const HIERARCHY_ACTION_PRIMARY_CLASS =
  "min-h-[44px] rounded-lg bg-theme-blue px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-50";

export const HIERARCHY_ACTION_FINAL_CLASS =
  "min-h-[44px] rounded-lg bg-theme-orange px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-50";

export const HIERARCHY_FOCUS_RING_CLASS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2";

/**
 * WP-053 — Optional external instructional material (APA template, OWL, samples).
 * Semantic anchors only — not workflow operations.
 */
export const HIERARCHY_REFERENCE_LINK_CLASS =
  "inline-flex min-h-[44px] items-center text-sm text-theme-blue underline underline-offset-2 hover:decoration-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2";

/**
 * Action affordance taxonomy (Modules 8–9 verification scope):
 * - Primary: current forward workflow action (one per state)
 * - Final: irreversible/high-stakes submission or completion
 * - Secondary: escape, open/copy/retry alternative, or retrieval
 * - Reference link: optional external instructional material
 * - Navigation link: changes location without performing workflow work
 */