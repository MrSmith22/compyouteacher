/**
 * WP-057 — Build-forward philosophy audit (Modules 4–9; Module 3 excluded).
 * Names prior artifact + current transformation without owning all student copy.
 */

export const WP057_BUILD_FORWARD_AUDIT = Object.freeze([
  {
    id: "m4-success-handoff",
    module: 4,
    priorArtifact: "paragraph plans (points, evidence, reasoning)",
    currentTransformation: "arrange completed plans into a Module 5 outline",
    continuityMeaning: "not starting over in Module 5",
    visibleSurfaceTestId: null,
    copySource: "lib/module4/module4SuccessStageHelpers.js",
    artifactSupport: "Module 4 success plan review + ModuleRoleTransitionCard",
    compliant: true,
    repair: "none — assert existing celebrate/handoff copy in tests",
  },
  {
    id: "m5-entry-outline",
    module: 5,
    priorArtifact: "Module 4 paragraph plans",
    currentTransformation: "arrange and review plans into an outline—not recreate them",
    continuityMeaning: "plans already completed become outline structure",
    visibleSurfaceTestId: "module5-build-forward-framing",
    copySource: "components/ModuleFive.js",
    artifactSupport: "paragraph plan cards working set",
    compliant: true,
    repair: "add stable test hook around existing line",
  },
  {
    id: "m5-success-to-m6",
    module: 5,
    priorArtifact: "finalized Module 5 outline",
    currentTransformation: "outline becomes the drafting map for Module 6 prose",
    continuityMeaning: "draft from this outline; outline carries forward",
    visibleSurfaceTestId: null,
    copySource: "lib/module5/module5SuccessHelpers.js",
    artifactSupport: "Module 5 success artifact map",
    compliant: true,
    repair: "none — assert existing success stage copy in tests",
  },
  {
    id: "m6-first-drafting",
    module: 6,
    priorArtifact: "Module 5 outline / planned thesis and notes",
    currentTransformation: "turn the plan into prose one section at a time",
    continuityMeaning: "not starting over; already figured out what to say",
    visibleSurfaceTestId: "module6-build-forward-framing",
    copySource: "components/ModuleSix.js always-visible framing",
    artifactSupport: "TaskRelevantArtifacts + Need Help thesis/outline",
    compliant: true,
    repair: "promote existing InfoCallout wording into always-visible framing",
  },
  {
    id: "m6-body-conclusion-review",
    module: 6,
    priorArtifact: "outline, thesis, paragraph plans, evidence/reasoning",
    currentTransformation: "draft or review prose from existing planning artifacts",
    continuityMeaning: "desk shows prior thinking; write/transform section",
    visibleSurfaceTestId: "task-relevant-artifacts",
    copySource: "module6StepPresentation + TaskRelevantArtifacts",
    artifactSupport: "desk artifacts / outline map language",
    compliant: true,
    repair: "none",
  },
  {
    id: "m7-read-aloud",
    module: 7,
    priorArtifact: "completed Module 6 draft on the desk",
    currentTransformation: "listen for what to strengthen—not start a new draft",
    continuityMeaning: "draft is the starting artifact",
    visibleSurfaceTestId: "module7-build-forward-framing",
    copySource: "components/ModuleSeven.js read-aloud framing",
    artifactSupport: "module7-current-essay WorkingSet",
    compliant: true,
    repair: "add concise always-visible build-forward line",
  },
  {
    id: "m7-revision-and-final",
    module: 7,
    priorArtifact: "Module 6 draft sections",
    currentTransformation: "strengthen the existing draft section by section",
    continuityMeaning: "draft is complete; now making it stronger",
    visibleSurfaceTestId: "module7-revision-build-forward-framing",
    copySource: "MODULE7_REVISION_STRENGTH_FRAME",
    artifactSupport: "TaskRelevantArtifacts + essay working set",
    compliant: true,
    repair: "hook existing strength-frame line",
  },
  {
    id: "m8-all-steps",
    module: 8,
    priorArtifact: "finished essay from Module 7",
    currentTransformation: "prepare Google Doc / format / ready check—not rewrite",
    continuityMeaning: "writing is complete; preparation is not rewriting",
    visibleSurfaceTestId: "module8-submission-doc-framing",
    copySource: "components/ModuleEight.js persistent framing",
    artifactSupport: "finished essay preview + recovery panel",
    compliant: true,
    repair: "preserve existing shared framing; add build-forward attr",
  },
  {
    id: "m9-apa-learning",
    module: 9,
    priorArtifact: "finished essay / prepared paper",
    currentTransformation: "learn APA presentation moves—not rewrite ideas",
    continuityMeaning: "formatting changes looks, not ideas",
    visibleSurfaceTestId: "module9-build-forward-step-1",
    copySource: "MODULE9_SCREEN_CONTRACT[1]",
    artifactSupport: "APA lesson working set",
    compliant: true,
    repair: "hook existing screen-contract purpose",
  },
  {
    id: "m9-google-doc",
    module: 9,
    priorArtifact: "Module 8 verified Google Doc",
    currentTransformation: "open/verify the prepared Doc for formatting",
    continuityMeaning: "reuse the paper you prepared—not create from scratch",
    visibleSurfaceTestId: "module9-build-forward-step-2",
    copySource: "MODULE9_SCREEN_CONTRACT[2]",
    artifactSupport: "SubmissionDocRecoveryPanel",
    compliant: true,
    repair: "hook existing screen-contract purpose",
  },
  {
    id: "m9-format-checklist",
    module: 9,
    priorArtifact: "written essay already in the prepared Google Doc",
    currentTransformation: "confirm APA presentation before PDF download",
    continuityMeaning: "paper already written/prepared; check formatting",
    visibleSurfaceTestId: "module9-build-forward-step-3",
    copySource: "MODULE9_SCREEN_CONTRACT[3]",
    artifactSupport: "APA quick guide + checklist",
    compliant: true,
    repair: "refine purpose for prior-artifact continuity",
  },
  {
    id: "m9-upload",
    module: 9,
    priorArtifact: "formatted Google Doc / newest PDF of finished paper",
    currentTransformation: "download, check, and upload the newest PDF",
    continuityMeaning: "writing and formatting finished; submit the file",
    visibleSurfaceTestId: "module9-build-forward-step-4",
    copySource: "MODULE9_SCREEN_CONTRACT[4]",
    artifactSupport: "PDF download guidance + final upload checklist",
    compliant: true,
    repair: "refine purpose for finished-paper continuity",
  },
]);

const BLANK_PAGE_INSTRUCTION =
  /\b(start (your |the )?essay from scratch|begin from (a )?blank page|create ideas from scratch|invent (a )?new (essay|argument) from (nothing|scratch))\b/i;

export function isBlankPageInstruction(text) {
  return BLANK_PAGE_INSTRUCTION.test(String(text || ""));
}

export function namesPriorAndTransformation(entry) {
  return Boolean(
    entry &&
      String(entry.priorArtifact || "").trim() &&
      String(entry.currentTransformation || "").trim()
  );
}

export function getBuildForwardAuditEntry(id) {
  return WP057_BUILD_FORWARD_AUDIT.find((row) => row.id === id) || null;
}
