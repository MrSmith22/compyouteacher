/**
 * WP-061 — Instructional role color semantics (Modules 6–9 pilot).
 * Distinct from action/status colors and from artifact-identity mappings.
 * Color reinforces labelled surfaces; never the sole meaning signal.
 */

export const INSTRUCTIONAL_COLOR_ROLE_ORDER = Object.freeze([
  "instruction",
  "student-thinking",
  "evidence",
  "writing",
  "revision",
  "reference",
]);

/** Static class strings — discovered via Tailwind content `lib/ui/**`. */
export const INSTRUCTIONAL_COLOR_ROLES = Object.freeze({
  instruction: Object.freeze({
    id: "instruction",
    label: "Instruction",
    description: "Teacher coaching, how-to guidance, models, and required directions",
    colorToken: "role-instruction",
    hex: "#1B406D",
    softSurfaceClass:
      "rounded-xl border border-role-instruction/25 bg-role-instruction/[0.05] px-5 py-4 text-left",
    borderClass: "border-role-instruction/25",
    accentClass: "text-role-instruction",
    labelClass:
      "text-[11px] font-semibold uppercase tracking-[0.18em] text-role-instruction",
    permittedSurfaces: Object.freeze([
      "coaching",
      "job-right-now",
      "how-to",
      "apa-teaching",
      "download-directions",
    ]),
  }),
  "student-thinking": Object.freeze({
    id: "student-thinking",
    label: "Your thinking",
    description:
      "Student-created ideas, selected responses, and pulled-forward reasoning",
    colorToken: "role-thinking",
    hex: "#0A4F47",
    softSurfaceClass:
      "rounded-xl border border-role-thinking/25 bg-role-thinking/[0.05] px-4 py-3 text-left md:px-5",
    borderClass: "border-role-thinking/25",
    accentClass: "text-role-thinking",
    labelClass:
      "text-[11px] font-semibold uppercase tracking-[0.18em] text-role-thinking",
    permittedSurfaces: Object.freeze([
      "task-desk",
      "working-notebook",
      "observation-choices",
      "checklist-confirmations",
      "selected-practice",
    ]),
  }),
  evidence: Object.freeze({
    id: "evidence",
    label: "Evidence",
    description: "Quotations, observations, and supporting details",
    colorToken: "role-evidence",
    hex: "#7A5C00",
    softSurfaceClass:
      "rounded-lg border border-role-evidence/25 bg-role-evidence/[0.06] px-3 py-2",
    borderClass: "border-role-evidence/25",
    accentClass: "text-role-evidence",
    labelClass:
      "text-[11px] font-semibold uppercase tracking-[0.18em] text-role-evidence",
    permittedSurfaces: Object.freeze(["evidence-chip", "evidence-desk-item"]),
  }),
  writing: Object.freeze({
    id: "writing",
    label: "Writing",
    description: "Drafting, prose production, and written-artifact work surfaces",
    colorToken: "role-writing",
    hex: "#5C3D6E",
    softSurfaceClass:
      "rounded-xl border-2 border-role-writing/30 bg-role-writing/[0.04] px-4 py-4 text-left shadow-soft",
    borderClass: "border-role-writing/30",
    accentClass: "text-role-writing",
    labelClass:
      "text-[11px] font-semibold uppercase tracking-[0.18em] text-role-writing",
    permittedSurfaces: Object.freeze([
      "draft-textarea",
      "essay-prose",
      "draft-artifact",
    ]),
  }),
  revision: Object.freeze({
    id: "revision",
    label: "Revision",
    description: "Strengthening an existing draft for a reader",
    colorToken: "role-revision",
    hex: "#B45309",
    softSurfaceClass:
      "rounded-xl border border-role-revision/30 bg-role-revision/[0.05] px-4 py-4 text-left",
    borderClass: "border-role-revision/30",
    accentClass: "text-role-revision",
    labelClass:
      "text-[11px] font-semibold uppercase tracking-[0.18em] text-role-revision",
    permittedSurfaces: Object.freeze([
      "revision-strategy",
      "revision-textarea",
      "compare-framing",
    ]),
  }),
  reference: Object.freeze({
    id: "reference",
    label: "Reference",
    description:
      "Shelves, optional guides, saved-work archives, and secondary resources",
    colorToken: "role-reference",
    hex: "#6B7280",
    softSurfaceClass:
      "rounded-xl border border-role-reference/30 bg-role-reference/[0.06] px-4 py-3 text-left",
    borderClass: "border-role-reference/30",
    accentClass: "text-role-reference",
    labelClass:
      "text-[11px] font-semibold uppercase tracking-[0.18em] text-role-reference",
    permittedSurfaces: Object.freeze([
      "notebook-archive",
      "quick-guide",
      "optional-disclosure",
      "external-resources",
    ]),
  }),
});

/** Work-surface wrappers for WritingSetSection (page bg → work card). */
export const ROLE_WRITING_WORK_SURFACE_CLASS =
  "[&>div:last-child]:border-2 [&>div:last-child]:border-role-writing/30 [&>div:last-child]:bg-role-writing/[0.03] [&>div:last-child]:shadow-md [&>div:last-child]:ring-1 [&>div:last-child]:ring-role-writing/10";

export const ROLE_REVISION_WORK_SURFACE_CLASS =
  "[&>div:last-child]:border-2 [&>div:last-child]:border-role-revision/30 [&>div:last-child]:bg-role-revision/[0.03] [&>div:last-child]:shadow-md [&>div:last-child]:ring-1 [&>div:last-child]:ring-role-revision/10";

export const ROLE_WRITING_TEXTAREA_CLASS =
  "min-h-[min(420px,52vh)] w-full max-w-full resize-y rounded-xl border-2 border-role-writing/35 bg-white px-4 py-4 text-base leading-7 text-text-primary shadow-soft focus:border-role-writing/55 focus:outline-none focus:ring-2 focus:ring-role-writing/20 disabled:cursor-not-allowed disabled:opacity-60";

export const ROLE_REVISION_TEXTAREA_CLASS =
  "min-h-[min(320px,48vh)] w-full resize-y rounded-xl border-2 border-role-revision/35 bg-white px-4 py-4 text-base leading-7 text-text-primary shadow-soft focus:border-role-revision/55 focus:outline-none focus:ring-2 focus:ring-role-revision/20 disabled:cursor-not-allowed disabled:opacity-60";

export const ROLE_WRITING_PROSE_CLASS =
  "max-h-[min(480px,60vh)] overflow-y-auto rounded-xl border-2 border-role-writing/25 bg-role-writing/[0.03] px-4 py-4 text-base leading-7 text-text-primary shadow-soft";

export const ROLE_WRITING_ESSAY_COMPACT_CLASS =
  "max-h-[min(180px,28vh)] overflow-y-auto rounded-xl border-2 border-role-writing/25 bg-role-writing/[0.03] px-4 py-3 text-base leading-7 text-text-primary shadow-soft md:max-h-[min(240px,30vh)]";

/**
 * Action/status remain separate systems (not instructional roles).
 */
export const WP061_ACTION_STATUS_RECONCILIATION = Object.freeze({
  primaryAction: "theme-blue (HIERARCHY_ACTION_PRIMARY_CLASS)",
  finalAction: "theme-orange (HIERARCHY_ACTION_FINAL_CLASS) — not revision role",
  successStatus: "theme-green — not student-thinking role",
  errorDestructive: "theme-red",
  inProgressWarm: "theme-orange labelled warning/emphasis — not evidence gold",
});

/**
 * Shared artifactPresentation.ts updated for evidence→gold and draft→writing
 * within the pilot. Other artifact identities retained.
 */
export const WP061_ARTIFACT_REGISTRY_DECISION = Object.freeze({
  changedKeys: Object.freeze(["evidence", "draft"]),
  retainedKeys: Object.freeze([
    "source",
    "evidence_cluster",
    "pattern",
    "idea",
    "claim",
    "thesis",
    "proof_plan",
    "outline",
  ]),
  note:
    "Artifact identity chips remain text-labelled. Instructional surface roles and artifact identity are related but not identical systems.",
});

export const WP061_APPLICATION_MATRIX = Object.freeze([
  {
    module: 6,
    surface: "Job Right Now",
    role: "instruction",
    classify: "instructional role",
  },
  {
    module: 6,
    surface: "Task-relevant desk / working notebook",
    role: "student-thinking",
    classify: "instructional role",
  },
  {
    module: 6,
    surface: "Evidence chips via artifact presentation",
    role: "evidence",
    classify: "artifact identity + instructional evidence",
  },
  {
    module: 6,
    surface: "Drafting textarea / review prose",
    role: "writing",
    classify: "instructional role",
  },
  {
    module: 6,
    surface: "More saved work archive",
    role: "reference",
    classify: "reference",
  },
  {
    module: 7,
    surface: "Read-aloud task card / recorder coaching",
    role: "instruction",
    classify: "instructional role",
  },
  {
    module: 7,
    surface: "Essay prose (read)",
    role: "writing",
    classify: "instructional role",
  },
  {
    module: 7,
    surface: "Observation choices",
    role: "student-thinking",
    classify: "instructional role",
  },
  {
    module: 7,
    surface: "Strategy + revision textarea",
    role: "revision",
    classify: "instructional role",
  },
  {
    module: 8,
    surface: "Preparation framing / format explanation",
    role: "instruction",
    classify: "instructional role",
  },
  {
    module: 8,
    surface: "Ready confidence / confirmation surfaces",
    role: "student-thinking",
    classify: "instructional role",
  },
  {
    module: 8,
    surface: "Finished essay shelf / APA resources",
    role: "reference",
    classify: "reference",
  },
  {
    module: 9,
    surface: "APA concept teaching",
    role: "instruction",
    classify: "instructional role",
  },
  {
    module: 9,
    surface: "Selected practice / checklist confirmations",
    role: "student-thinking",
    classify: "instructional role",
  },
  {
    module: 9,
    surface: "APA Quick Guide / secondary resources",
    role: "reference",
    classify: "reference",
  },
  {
    module: 9,
    surface: "Upload Final PDF button",
    role: null,
    classify: "final action (theme-orange)",
  },
]);

export function getInstructionalColorRole(role) {
  const key = String(role || "");
  return INSTRUCTIONAL_COLOR_ROLES[key] || null;
}

function srgbChannelToLinear(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const raw = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return 0;
  const value = Number.parseInt(raw, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  );
}

/** WCAG 2.x contrast ratio between two hex colors. */
export function contrastRatio(foregroundHex, backgroundHex = "#FFFFFF") {
  const l1 = relativeLuminance(foregroundHex);
  const l2 = relativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAaNormalText(foregroundHex, backgroundHex = "#FFFFFF") {
  return contrastRatio(foregroundHex, backgroundHex) >= 4.5;
}

export function allInstructionalRoleTextColorsMeetAa() {
  return INSTRUCTIONAL_COLOR_ROLE_ORDER.every((id) =>
    meetsWcagAaNormalText(INSTRUCTIONAL_COLOR_ROLES[id].hex, "#FFFFFF")
  );
}
