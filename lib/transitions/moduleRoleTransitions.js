/**
 * WP-052 — Psychological role transitions at module boundaries.
 * Presentation/copy model only — no CAS, gates, or persistence.
 *
 * Role order: discovery → organization → planning → writing →
 * revision → preparation → submission
 */

export const MODULE_ROLE_ORDER = Object.freeze([
  "discovery",
  "organization",
  "planning",
  "writing",
  "revision",
  "preparation",
  "submission",
]);

/**
 * @typedef {object} ModuleRoleTransition
 * @property {string} id
 * @property {number} fromModule
 * @property {number|null} toModule
 * @property {string} fromRole
 * @property {string} toRole
 * @property {string} accomplishment
 * @property {string} nextRole
 * @property {string} continuity
 * @property {string} actionLabel
 * @property {string} eyebrow
 * @property {string} headline
 * @property {"reuse"|"card"} presentation
 * @property {string} surface
 * @property {boolean} [isTerminal]
 */

/** @type {ReadonlyArray<ModuleRoleTransition>} */
export const MODULE_ROLE_TRANSITIONS = Object.freeze([
  Object.freeze({
    id: "3-to-4",
    fromModule: 3,
    toModule: 4,
    fromRole: "discovery",
    toRole: "organization",
    accomplishment: "You've gathered evidence and built your argument.",
    nextRole: "Next we'll organize those ideas into paragraph plans.",
    continuity:
      "Your thesis, claim, pattern, and evidence come with you—you are organizing thinking you started, not writing the essay yet.",
    actionLabel: "Start Paragraph 1",
    eyebrow: "Module 3 → Module 4",
    headline: "You've gathered evidence. Next we'll organize it.",
    presentation: "reuse",
    surface: "module4-handoff",
  }),
  Object.freeze({
    id: "4-to-5",
    fromModule: 4,
    toModule: 5,
    fromRole: "organization",
    toRole: "planning",
    accomplishment:
      "You've organized your ideas into paragraph plans with points, evidence, and reasoning.",
    nextRole: "Now we'll build a full outline from those plans.",
    continuity:
      "Your saved points, evidence, and reasoning come with you—you are not starting over. Conclusion planning happens later in Module 5's existing flow.",
    actionLabel: "Continue to Module 5 — organize your outline",
    eyebrow: "Module 4 complete",
    headline: "You've organized your ideas. Now we'll build an outline.",
    presentation: "reuse",
    surface: "module4-success",
  }),
  Object.freeze({
    id: "5-to-6",
    fromModule: 5,
    toModule: 6,
    fromRole: "planning",
    toRole: "writing",
    accomplishment:
      "Your outline is finished—thesis, ordered body sections, and conclusion notes are saved.",
    nextRole: "Now you'll begin writing your draft, one section at a time.",
    continuity:
      "Your points, jobs, evidence, and reasoning come with you—you are not starting over.",
    actionLabel: "Continue to Module 6 — draft your essay",
    eyebrow: "Module 5 complete",
    headline: "Your outline is finished. Now you'll begin writing.",
    presentation: "reuse",
    surface: "module5-success",
  }),
  Object.freeze({
    id: "6-to-7",
    fromModule: 6,
    toModule: 7,
    fromRole: "writing",
    toRole: "revision",
    accomplishment:
      "You've written a first draft—introduction, body paragraphs, and conclusion are saved as prose.",
    nextRole: "Now let's strengthen that draft through revision.",
    continuity:
      "Your ordered sections and full text stay with you—you will revise and strengthen, not start over.",
    actionLabel: "Continue to Module 7 — strengthen your draft",
    eyebrow: "Module 6 complete",
    headline: "You've written a draft. Now let's strengthen it.",
    presentation: "reuse",
    surface: "module6-success",
  }),
  Object.freeze({
    id: "7-to-8",
    fromModule: 7,
    toModule: 8,
    fromRole: "revision",
    toRole: "preparation",
    accomplishment:
      "You finished writing—reading aloud, revising every section, and polishing your wording.",
    nextRole:
      "Next you'll prepare the paper for submission: create or update your Google Doc and format it for your reader.",
    continuity:
      "Your finished essay carries forward as the text you'll prepare—you are done inventing new writing.",
    actionLabel: "Continue to Module 8 — prepare your essay for submission",
    eyebrow: "Module 7 complete",
    headline: "You've finished the writing. Now prepare the paper.",
    presentation: "card",
    surface: "module7-success",
  }),
  Object.freeze({
    id: "8-to-9",
    fromModule: 8,
    toModule: 9,
    fromRole: "preparation",
    toRole: "submission",
    accomplishment:
      "You prepared your Google Doc and got the paper ready to turn in.",
    nextRole:
      "Next you'll review APA with teacher guidance, download and check your PDF, then submit it.",
    continuity:
      "Your writing is finished—no more essay drafting. Module 9 is review, download, check, and submit.",
    actionLabel: "Continue to Module 9 — review APA and submit",
    eyebrow: "Module 8 complete",
    headline: "Your Google Doc is ready. Now review, download, and submit.",
    presentation: "card",
    surface: "module8-success",
  }),
  Object.freeze({
    id: "9-complete",
    fromModule: 9,
    toModule: null,
    fromRole: "submission",
    toRole: "submission",
    accomplishment:
      "Your essay was submitted successfully—and you completed the Writing Processor.",
    nextRole:
      "You practiced a transferable sequence: observing and analyzing, organizing, planning, drafting, revising, formatting, and submitting.",
    continuity:
      "Great work. That process stays with you for future writing. Be proud of the work you put in. Your teacher has the PDF you uploaded; you do not need to submit anything else for this assignment.",
    actionLabel: "Back to Dashboard",
    eyebrow: "Writing Processor complete",
    headline: "You finished the whole writing process.",
    presentation: "card",
    surface: "module9-success",
    isTerminal: true,
  }),
]);

export function getModuleRoleTransition(fromModule, toModule) {
  return (
    MODULE_ROLE_TRANSITIONS.find(
      (row) =>
        row.fromModule === fromModule &&
        (toModule == null ? row.toModule == null : row.toModule === toModule)
    ) || null
  );
}

export function getModuleRoleTransitionById(id) {
  return MODULE_ROLE_TRANSITIONS.find((row) => row.id === id) || null;
}

/** Combined handoff paragraph for legacy surfaces that expect one string. */
export function formatRoleTransitionHandoff(transition) {
  if (!transition) return "";
  return `${transition.nextRole} ${transition.continuity}`.trim();
}
