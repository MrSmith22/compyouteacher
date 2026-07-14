/**
 * WP-062 — Screen orientation reconciliation (Modules 6–9 pilot).
 * Four navigation questions (distinct from WP-048 task/purpose/how/finished):
 * Where / What / Connection / Next.
 *
 * This matrix documents post–WP-048–061 reality and the smallest remediations.
 * Color/rhythm/disclosure contracts remain unchanged.
 */

export const WP062_ORIENTATION_QUESTIONS = Object.freeze([
  "where",
  "what",
  "connection",
  "next",
]);

/**
 * @typedef {object} OrientationAnswer
 * @property {string} answer
 * @property {string} source
 * @property {boolean} alwaysVisible
 * @property {string} [hook]
 */

/**
 * @typedef {object} OrientationRow
 * @property {string} id
 * @property {number} module
 * @property {string} state
 * @property {OrientationAnswer} where
 * @property {OrientationAnswer} what
 * @property {OrientationAnswer} connection
 * @property {OrientationAnswer} next
 * @property {boolean} compliant
 * @property {string|null} gap
 * @property {string} remedy
 * @property {boolean} [repaired]
 */

/** Shared center-visible next line (not WorkspaceGuide-only). */
export const SCREEN_ORIENTATION_NEXT_TEST_ID = "screen-orientation-next";

export const WP062_ORIENTATION_MATRIX = Object.freeze([
  Object.freeze({
    id: "m6-intro",
    module: 6,
    state: "Introduction drafting",
    where: Object.freeze({
      answer: "Writing mode · Module 6 Draft step position",
      source: "ModuleModeCue + progress strip",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Dominant task heading + Job Right Now + writing box",
      source: "screen-contract-task + jobRightNow + ROLE writing surface",
      alwaysVisible: true,
      hook: "screen-contract-task",
    }),
    connection: Object.freeze({
      answer: "You already figured out what you want to say… one section at a time",
      source: "module6-build-forward-framing + task-relevant desk",
      alwaysVisible: true,
      hook: "module6-build-forward-framing",
    }),
    next: Object.freeze({
      answer: "Next you will help your reader understand your first body idea (or conclusion)",
      source: "screen-orientation-next (+ WorkspaceGuide echo)",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "center next line + retained build-forward",
    repaired: true,
  }),
  Object.freeze({
    id: "m6-body",
    module: 6,
    state: "Body paragraph drafting",
    where: Object.freeze({
      answer: "Writing mode · Module 6 Draft step N of Y",
      source: "ModuleModeCue + progress strip",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Body paragraph task + that paragraph’s writing box",
      source: "task heading + section label + writing surface",
      alwaysVisible: true,
      hook: "screen-contract-task",
    }),
    connection: Object.freeze({
      answer: "Build-forward framing + desk points/evidence for this paragraph",
      source: "module6-build-forward-framing + TaskRelevantArtifacts",
      alwaysVisible: true,
      hook: "module6-build-forward-framing",
    }),
    next: Object.freeze({
      answer: "Next body/conclusion — from presentation nextStepText",
      source: "screen-orientation-next",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: "Previously: build-forward first-stage only; next Guide-only",
    remedy: "show build-forward on drafting stages; center next",
    repaired: true,
  }),
  Object.freeze({
    id: "m6-conclusion",
    module: 6,
    state: "Conclusion drafting",
    where: Object.freeze({
      answer: "Writing mode · Module 6 Draft step position",
      source: "ModuleModeCue + progress strip",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Conclusion task + conclusion writing box",
      source: "task heading + Job Right Now + writing surface",
      alwaysVisible: true,
      hook: "screen-contract-task",
    }),
    connection: Object.freeze({
      answer: "Build-forward + desk thesis/conclusion notes",
      source: "module6-build-forward-framing + TaskRelevantArtifacts",
      alwaysVisible: true,
      hook: "module6-build-forward-framing",
    }),
    next: Object.freeze({
      answer: "Next you will review the whole draft before finishing Module 6",
      source: "presentation nextStepText via screen-orientation-next",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: "Previously promised Module 7 revision and skipped whole-draft review",
    remedy: "truthful nextStepText + center next + build-forward",
    repaired: true,
  }),
  Object.freeze({
    id: "m6-review",
    module: 6,
    state: "Whole-draft review",
    where: Object.freeze({
      answer: "Writing mode · review step",
      source: "ModuleModeCue + progress strip",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Whole-draft readiness map",
      source: "task heading + review working set",
      alwaysVisible: true,
      hook: "module6-review-section-list",
    }),
    connection: Object.freeze({
      answer: "Sections written earlier in Module 6",
      source: "review cards + desk/notebook",
      alwaysVisible: true,
      hook: "module6-review-section-list",
    }),
    next: Object.freeze({
      answer: "Finish draft and continue to revision (Module 7)",
      source: "screen-orientation-next matching finalize",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "center next line",
    repaired: true,
  }),
  Object.freeze({
    id: "m6-save-failure",
    module: 6,
    state: "Navigation/finalize save failure overlay",
    where: Object.freeze({
      answer: "Still on Module 6 drafting/review frame under the banner",
      source: "ModuleModeCue remains in frame",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Save failed — retry required before advancing",
      source: "module6-navigation-save-error / finalize-error",
      alwaysVisible: true,
      hook: "module6-navigation-save-error",
    }),
    connection: Object.freeze({
      answer: "Your draft text remains; progress not advanced",
      source: "error banner copy",
      alwaysVisible: true,
      hook: "module6-navigation-save-error",
    }),
    next: Object.freeze({
      answer: "Retry save — not Keep going until save succeeds",
      source: "Retry control on banner",
      alwaysVisible: true,
      hook: "module6-navigation-save-error",
    }),
    compliant: true,
    gap: null,
    remedy: "already compliant — overlay names Retry, does not claim success",
    repaired: false,
  }),
  Object.freeze({
    id: "m7-read-aloud-before",
    module: 7,
    state: "Read aloud before observation",
    where: Object.freeze({
      answer: "Revision mode · Module 7 step strip",
      source: "ModuleModeCue + progress",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Listen like a reader + record essay",
      source: "task heading + module7-read-aloud-task + essay work",
      alwaysVisible: true,
      hook: "module7-read-aloud-task",
    }),
    connection: Object.freeze({
      answer: "Draft from Module 6 on the desk",
      source: "build-forward framing + current essay working set",
      alwaysVisible: true,
      hook: "module7-current-essay",
    }),
    next: Object.freeze({
      answer: "Next you will revise your introduction—one section at a time",
      source: "screen-orientation-next",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: "Previously next Guide-only; jobRightNow unused",
    remedy: "center next + pass jobRightNow when present",
    repaired: true,
  }),
  Object.freeze({
    id: "m7-read-aloud-after",
    module: 7,
    state: "Read aloud after recording + observation",
    where: Object.freeze({
      answer: "Revision mode · Module 7 step strip",
      source: "ModuleModeCue + progress",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Name one observation + keep listening/revision plan",
      source: "observation panel + task card",
      alwaysVisible: true,
      hook: "module7-read-aloud-observation",
    }),
    connection: Object.freeze({
      answer: "Module 6 essay + what you heard",
      source: "essay + observation choices",
      alwaysVisible: true,
      hook: "module7-current-essay",
    }),
    next: Object.freeze({
      answer: "Keep going unlocks after recording + observation; then revise intro",
      source: "screen-orientation-next + gate note on SuccessCriteria",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "center next",
    repaired: true,
  }),
  Object.freeze({
    id: "m7-intro-revision",
    module: 7,
    state: "Introduction revision",
    where: Object.freeze({
      answer: "Revision mode · section step",
      source: "ModuleModeCue + progress",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Revise introduction section in the textarea",
      source: "task heading + revision strategy + textarea",
      alwaysVisible: true,
      hook: "module7-strategy-card",
    }),
    connection: Object.freeze({
      answer: "Module 6 prose for this section + desk artifacts",
      source: "build-forward framing + TaskRelevantArtifacts",
      alwaysVisible: true,
      hook: "task-relevant-artifacts",
    }),
    next: Object.freeze({
      answer: "Next section or final review from presentation nextStepText",
      source: "screen-orientation-next",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "center next + jobRightNow wiring",
    repaired: true,
  }),
  Object.freeze({
    id: "m7-body-revision",
    module: 7,
    state: "Body paragraph revision",
    where: Object.freeze({
      answer: "Revision mode · body step",
      source: "ModuleModeCue + progress",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Revise this body paragraph only",
      source: "task heading + section label + textarea",
      alwaysVisible: true,
      hook: "screen-contract-task",
    }),
    connection: Object.freeze({
      answer: "That paragraph’s Module 6 draft + desk notes",
      source: "TaskRelevantArtifacts for body index",
      alwaysVisible: true,
      hook: "task-relevant-artifacts",
    }),
    next: Object.freeze({
      answer: "Next body/conclusion/final review",
      source: "screen-orientation-next",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "center next",
    repaired: true,
  }),
  Object.freeze({
    id: "m7-conclusion-revision",
    module: 7,
    state: "Conclusion revision",
    where: Object.freeze({
      answer: "Revision mode · conclusion step",
      source: "ModuleModeCue + progress",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Revise conclusion section",
      source: "task heading + strategy + textarea",
      alwaysVisible: true,
      hook: "module7-strategy-card",
    }),
    connection: Object.freeze({
      answer: "Module 6 conclusion prose + desk",
      source: "build-forward + desk",
      alwaysVisible: true,
      hook: "task-relevant-artifacts",
    }),
    next: Object.freeze({
      answer: "Next: final review of the whole essay",
      source: "screen-orientation-next",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "center next",
    repaired: true,
  }),
  Object.freeze({
    id: "m7-final-review",
    module: 7,
    state: "Final essay review",
    where: Object.freeze({
      answer: "Revision mode · final review",
      source: "ModuleModeCue + progress",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Read the whole revised essay (no more drafting here)",
      source: "task heading + essay surface",
      alwaysVisible: true,
      hook: "screen-contract-task",
    }),
    connection: Object.freeze({
      answer: "Sections strengthened in Module 7",
      source: "strategy + full essay",
      alwaysVisible: true,
      hook: "module7-strategy-card",
    }),
    next: Object.freeze({
      answer: "Next: prepare Google Doc in Module 8",
      source: "screen-orientation-next",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "center next",
    repaired: true,
  }),
  Object.freeze({
    id: "m8-create",
    module: 8,
    state: "Create/Update Google Doc",
    where: Object.freeze({
      answer: "Submission/preparation mode · Create step",
      source: "ModuleModeCue + preparation progress",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Create or update the submission Google Doc",
      source: "task heading + WorkingSet recovery",
      alwaysVisible: true,
      hook: "module8-create-working-set",
    }),
    connection: Object.freeze({
      answer: "Finished writing from Module 7; preparing paper, not rewriting",
      source: "module8-submission-doc-framing + reassurance",
      alwaysVisible: true,
      hook: "module8-submission-doc-framing",
    }),
    next: Object.freeze({
      answer: "Next you will format your paper in APA style inside your Google Doc",
      source: "screen-orientation-next",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "center next",
    repaired: true,
  }),
  Object.freeze({
    id: "m8-create-recovery",
    module: 8,
    state: "Doc mismatch/timeout recovery",
    where: Object.freeze({
      answer: "Still on Module 8 Create/Update preparation",
      source: "ModuleModeCue + framing",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Repair/confirm Google Doc — not yet ready to advance",
      source: "SubmissionDocRecoveryPanel titles/actions",
      alwaysVisible: true,
      hook: "module8-doc",
    }),
    connection: Object.freeze({
      answer: "Finished essay still available; Doc needs repair",
      source: "framing + recovery panel",
      alwaysVisible: true,
      hook: "module8-submission-doc-framing",
    }),
    next: Object.freeze({
      answer: "Retry / Update / Create new / Open — not Keep going until verified",
      source: "recovery actions; SuccessCriteria gate",
      alwaysVisible: true,
      hook: "module8-doc",
    }),
    compliant: true,
    gap: null,
    remedy: "already compliant — does not claim verified while recovering",
    repaired: false,
  }),
  Object.freeze({
    id: "m8-format",
    module: 8,
    state: "APA Format checklist",
    where: Object.freeze({
      answer: "Preparation mode · Format step",
      source: "ModuleModeCue + progress",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Apply APA in Doc + check items here",
      source: "task heading + format working set",
      alwaysVisible: true,
      hook: "module8-format-working-set",
    }),
    connection: Object.freeze({
      answer: "Writing finished; preparing look of the paper",
      source: "framing + What you will change",
      alwaysVisible: true,
      hook: "module8-submission-doc-framing",
    }),
    next: Object.freeze({
      answer: "Next: ready check before Module 9",
      source: "screen-orientation-next (aligned with format continue cue)",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: "Previously Guide said vague 'ready to continue'",
    remedy: "truthful nextStepText + center next",
    repaired: true,
  }),
  Object.freeze({
    id: "m8-ready",
    module: 8,
    state: "Ready confidence check",
    where: Object.freeze({
      answer: "Preparation mode · Ready step",
      source: "ModuleModeCue + progress",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Confirm Doc readiness before Module 9",
      source: "task heading + confidence checklist",
      alwaysVisible: true,
      hook: "module8-ready-working-set",
    }),
    connection: Object.freeze({
      answer: "Finished writing in Module 7; Doc + APA confirmations",
      source: "framing + readiness status list",
      alwaysVisible: true,
      hook: "module8-submission-doc-framing",
    }),
    next: Object.freeze({
      answer: "Module 9 APA checks and final PDF submission",
      source: "screen-orientation-next + Finish CTA",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "center next",
    repaired: true,
  }),
  Object.freeze({
    id: "m9-apa-lesson",
    module: 9,
    state: "APA learning",
    where: Object.freeze({
      answer: "Submission mode · Journey step 1 Learn APA",
      source: "ModuleModeCue + module9-journey-progress",
      alwaysVisible: true,
      hook: "module9-journey-progress",
    }),
    what: Object.freeze({
      answer: "Learn APA moves you’ll use",
      source: "screen-contract-task + lesson",
      alwaysVisible: true,
      hook: "screen-contract-task",
    }),
    connection: Object.freeze({
      answer: "Formatting the prepared paper—not rewriting the essay",
      source: "ScreenContract purpose + build-forward",
      alwaysVisible: true,
      hook: "module9-build-forward-step-1",
    }),
    next: Object.freeze({
      answer: "Next: open the Google Doc you prepared in Module 8",
      source: "MODULE9_SCREEN_CONTRACT[1].next via screen-orientation-next",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: "Previously next only implied by Continue",
    remedy: "always-visible next line from contract",
    repaired: true,
  }),
  Object.freeze({
    id: "m9-google-doc",
    module: 9,
    state: "Google Doc open/verify",
    where: Object.freeze({
      answer: "Submission mode · Journey step 2",
      source: "ModuleModeCue + journey",
      alwaysVisible: true,
      hook: "module9-journey-progress",
    }),
    what: Object.freeze({
      answer: "Open/verify the prepared Google Doc",
      source: "task heading + recovery panel",
      alwaysVisible: true,
      hook: "module9-submission-doc-step",
    }),
    connection: Object.freeze({
      answer: "Reuse Module 8 Doc — not a new essay",
      source: "purpose + do-not-rewrite coaching",
      alwaysVisible: true,
      hook: "module9-build-forward-step-2",
    }),
    next: Object.freeze({
      answer: "Next: APA formatting checklist in your Doc",
      source: "screen-orientation-next",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "always-visible next line",
    repaired: true,
  }),
  Object.freeze({
    id: "m9-format",
    module: 9,
    state: "APA formatting checklist",
    where: Object.freeze({
      answer: "Submission mode · Journey step 3",
      source: "ModuleModeCue + journey",
      alwaysVisible: true,
      hook: "module9-journey-progress",
    }),
    what: Object.freeze({
      answer: "Confirm APA formatting items",
      source: "task heading + checklist work",
      alwaysVisible: true,
      hook: "module9-format-checklist-work",
    }),
    connection: Object.freeze({
      answer: "Essay already in the Module 8 Doc",
      source: "purpose + Quick Guide reference",
      alwaysVisible: true,
      hook: "module9-build-forward-step-3",
    }),
    next: Object.freeze({
      answer: "Next: download, check, and upload the PDF",
      source: "screen-orientation-next",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "always-visible next line",
    repaired: true,
  }),
  Object.freeze({
    id: "m9-upload",
    module: 9,
    state: "PDF download / check / upload",
    where: Object.freeze({
      answer: "Submission mode · Journey step 4",
      source: "ModuleModeCue + journey",
      alwaysVisible: true,
      hook: "module9-journey-progress",
    }),
    what: Object.freeze({
      answer: "Download PDF, select file, confirm, upload",
      source: "task heading + upload working set",
      alwaysVisible: true,
      hook: "module9-upload-working-set",
    }),
    connection: Object.freeze({
      answer: "Formatted Doc from earlier Module 9 steps",
      source: "purpose + build-forward",
      alwaysVisible: true,
      hook: "module9-build-forward-step-4",
    }),
    next: Object.freeze({
      answer: "After a successful upload you finish Module 9 — upload failure stays on this step",
      source: "screen-orientation-next + upload error status",
      alwaysVisible: true,
      hook: SCREEN_ORIENTATION_NEXT_TEST_ID,
    }),
    compliant: true,
    gap: null,
    remedy: "truthful next; errors do not claim success",
    repaired: true,
  }),
  Object.freeze({
    id: "m9-already-submitted",
    module: 9,
    state: "Already submitted / PDF on file",
    where: Object.freeze({
      answer: "Module 9 submission complete (mode cue + finished screen)",
      source: "ModuleModeCue + completed section",
      alwaysVisible: true,
      hook: "module-mode-cue",
    }),
    what: Object.freeze({
      answer: "Your PDF was received — nothing else to submit",
      source: "completed heading + orientation copy",
      alwaysVisible: true,
      hook: "module9-already-submitted",
    }),
    connection: Object.freeze({
      answer: "Open final PDF / Google Doc to review what you turned in",
      source: "open buttons",
      alwaysVisible: true,
      hook: "module9-open-final-pdf",
    }),
    next: Object.freeze({
      answer: "Return to Dashboard — no further Module 9 instructional step",
      source: "Back to Dashboard + orientation next line",
      alwaysVisible: true,
      hook: "module9-back-dashboard",
    }),
    compliant: true,
    gap: "Previously thin next story",
    remedy: "explicit finished orientation + dashboard CTA test id",
    repaired: true,
  }),
  Object.freeze({
    id: "m9-gate-blocked",
    module: 9,
    state: "Module 8 gate blocked",
    where: Object.freeze({
      answer: "Module 9 is locked until Module 8 is finished",
      source: "ModeCue + gate message",
      alwaysVisible: true,
      hook: "module9-gate-blocked",
    }),
    what: Object.freeze({
      answer: "Finish Module 8 preparation first",
      source: "gate heading",
      alwaysVisible: true,
      hook: "module9-gate-blocked",
    }),
    connection: Object.freeze({
      answer: "Module 9 formats and submits the paper Module 8 prepared",
      source: "gate connection line",
      alwaysVisible: true,
      hook: "module9-gate-blocked",
    }),
    next: Object.freeze({
      answer: "Go to Module 8 to finish preparation",
      source: "primary link/button to Module 8",
      alwaysVisible: true,
      hook: "module9-go-module-8",
    }),
    compliant: true,
    gap: "Previously bare sentence, no next CTA",
    remedy: "compact gate orientation shell",
    repaired: true,
  }),
  Object.freeze({
    id: "m9-success",
    module: 9,
    state: "Final success page",
    where: Object.freeze({
      answer: "Module 9 complete transition",
      source: "ModuleRoleTransitionCard / success page",
      alwaysVisible: true,
      hook: "module-role-transition",
    }),
    what: Object.freeze({
      answer: "Submission finished — review files or leave",
      source: "success transition copy",
      alwaysVisible: true,
      hook: "module-role-transition",
    }),
    connection: Object.freeze({
      answer: "Continuity from Modules 6–9 work just completed",
      source: "transition continuity",
      alwaysVisible: true,
      hook: "module-role-transition",
    }),
    next: Object.freeze({
      answer: "Dashboard (no further instructional Module 9 step)",
      source: "transition actionLabel → /dashboard",
      alwaysVisible: true,
      hook: "module-role-transition",
    }),
    compliant: true,
    gap: null,
    remedy: "already compliant via success transition",
    repaired: false,
  }),
]);

export function getWp062OrientationMatrix() {
  return WP062_ORIENTATION_MATRIX;
}

export function getWp062ModulesCovered() {
  return [...new Set(WP062_ORIENTATION_MATRIX.map((row) => row.module))].sort(
    (a, b) => a - b
  );
}

export function getWp062NonCompliantRows() {
  return WP062_ORIENTATION_MATRIX.filter((row) => row.compliant !== true);
}

export function orientationAnswersAlwaysVisible(row) {
  return WP062_ORIENTATION_QUESTIONS.every(
    (key) => row?.[key]?.alwaysVisible === true && String(row[key].answer || "").trim()
  );
}

export function matrixUsesModeOrJourneyForWhere(row) {
  const source = String(row?.where?.source || "").toLowerCase();
  return (
    source.includes("mode") ||
    source.includes("journey") ||
    source.includes("transition") ||
    source.includes("gate")
  );
}

export function orientationAnswerNotDisclosureBound(row) {
  const blob = WP062_ORIENTATION_QUESTIONS.map(
    (key) => `${row?.[key]?.source || ""} ${row?.[key]?.hook || ""}`
  )
    .join(" ")
    .toLowerCase();
  return !blob.includes("instructionaldisclosure") && !blob.includes("closed details");
}
