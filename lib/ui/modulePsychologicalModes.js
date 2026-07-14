/**
 * WP-058 — Psychological mode orientation for Modules 3–9.
 * Presentation-only: not connected to persistence, gates, or routing.
 *
 * Distinct from WP-052 transitions (role change at boundaries) and
 * WP-056/057 (step celebration / build-forward continuity).
 */

export const MODULE_PSYCHOLOGICAL_MODE_ORDER = Object.freeze([
  "discovery",
  "organization",
  "planning",
  "writing",
  "revision",
  "preparation",
  "submission",
]);

/**
 * @typedef {object} ModulePsychologicalMode
 * @property {number} module
 * @property {string} mode
 * @property {string} label
 * @property {string} coaching
 * @property {string} primaryArtifact
 * @property {string} transformation
 * @property {string} testId
 */

/** @type {ReadonlyArray<ModulePsychologicalMode>} */
export const MODULE_PSYCHOLOGICAL_MODES = Object.freeze([
  Object.freeze({
    module: 3,
    mode: "discovery",
    label: "Discovery mode",
    coaching:
      "Notice, compare, and connect evidence to decide what your sources show.",
    primaryArtifact: "observations, evidence, patterns, and claim/thesis thinking",
    transformation: "discover what the evidence shows before organizing it",
    testId: "module-mode-cue",
  }),
  Object.freeze({
    module: 4,
    mode: "organization",
    label: "Organization mode",
    coaching: "Shape your evidence and reasoning into paragraph plans.",
    primaryArtifact: "evidence, thesis, patterns, and connections",
    transformation: "organize discovery work into coherent paragraph plans",
    testId: "module-mode-cue",
  }),
  Object.freeze({
    module: 5,
    mode: "planning",
    label: "Planning mode",
    coaching:
      "Arrange those paragraph plans into an outline you can follow.",
    primaryArtifact: "completed paragraph plans from Module 4",
    transformation: "plan drafting order by arranging plans into an outline",
    testId: "module-mode-cue",
  }),
  Object.freeze({
    module: 6,
    mode: "writing",
    label: "Writing mode",
    coaching: "Turn one planned section at a time into readable prose.",
    primaryArtifact: "finalized outline, thesis, evidence, and reasoning",
    transformation: "write prose from one planned outline section at a time",
    testId: "module-mode-cue",
  }),
  Object.freeze({
    module: 7,
    mode: "revision",
    label: "Revision mode",
    coaching: "Strengthen how your completed draft reaches the reader.",
    primaryArtifact: "completed Module 6 draft",
    transformation: "revise for clarity, explanation, connection, and flow",
    testId: "module-mode-cue",
  }),
  Object.freeze({
    module: 8,
    mode: "preparation",
    label: "Preparation mode",
    coaching: "Turn the finished essay into the paper you will submit.",
    primaryArtifact: "finished essay from Module 7",
    transformation: "prepare the Google Doc and formatting without rewriting ideas",
    testId: "module-mode-cue",
  }),
  Object.freeze({
    module: 9,
    mode: "submission",
    label: "Submission mode",
    coaching: "Review, check, and turn in the finished paper.",
    primaryArtifact: "prepared Google Doc and final PDF",
    transformation: "review requirements, check the newest PDF, and submit carefully",
    testId: "module-mode-cue",
  }),
]);

/**
 * @param {number|string} moduleNumber
 * @returns {ModulePsychologicalMode|null}
 */
export function getModulePsychologicalMode(moduleNumber) {
  const n = Number(moduleNumber);
  if (!Number.isFinite(n)) return null;
  return MODULE_PSYCHOLOGICAL_MODES.find((entry) => entry.module === n) || null;
}

export function getModulePsychologicalModeOrder() {
  return MODULE_PSYCHOLOGICAL_MODE_ORDER;
}
