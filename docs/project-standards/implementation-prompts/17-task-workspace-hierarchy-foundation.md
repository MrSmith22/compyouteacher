# Cursor Prompt 17 — Task Workspace Hierarchy Foundation

Use this prompt only after WP-095 is Resolved and the shared success system is live in production. This begins the remaining Phase 6 workspace work by proving one reusable task-focused composition across representative learning, argument, planning, drafting, and submission screens.

```text
Build a development-gated task-workspace hierarchy foundation that makes the student’s current action visually primary, places only task-relevant saved work on the desk, keeps broader history/reference material on the shelf, uses semantic color consistently, and preserves all accepted instruction and persistence.

Apply the foundation to one representative active-work screen from each major workflow family:

1. Module 1 transfer vocabulary;
2. Module 3 evidence-to-argument;
3. Module 5 outline planning;
4. Module 6 sentence-move drafting;
5. Module 9 guided APA formatting.

The point is not to restyle five pages independently. Establish and prove one composable hierarchy contract that can later be generalized across the remaining module screens.

Do not change the accepted instructional sequence, questions, answer logic, artifact schemas, autosave, progression, module rollout modes, Google Doc/PDF behavior, receipt, or success screens. This task changes composition, emphasis, disclosure, and semantic presentation only.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2, especially the north star and desk-and-shelf model
   - Sections 3.1–3.14
   - Sections 4.1–4.4
   - Section 6, especially page composition, semantic color, journey language, local editing, and progressive disclosure
   - Phase 6 and its exit condition
   - Epic H
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. docs/design-system-v1.md
8. WP-017, WP-018, WP-048–WP-055, WP-061–WP-063, WP-073–WP-078, WP-081–WP-093, WP-094, and WP-095 in docs/project-standards/walkthroughs/issue-log.md
9. lib/ui/hierarchyContract.js
10. lib/ui/screenOrientationContract.js
11. lib/ui/instructionalColorContract.js
12. lib/ui/progressiveDisclosureContract.js
13. lib/ui/writingJourneyStages.js
14. components/layout/WorkspaceLayout.jsx, WorkspaceColumns.jsx, WorkspaceCenter.jsx, WorkspaceSidebar.jsx, WorkspaceGuide.jsx, ModulePageShell.jsx, and AppLayoutShell.jsx
15. components/shared/ScreenContractCues.jsx, TaskRelevantArtifacts.jsx, ModuleModeCue, JobRightNow, SuccessCriteriaPanel, InstructionalDisclosure, and action/button primitives
16. Module 1 transfer lesson contract, carry-forward desk, shared renderer, persistence, and production rollout
17. Module 3 evidence-to-argument step frame, desk frame, staged flow, artifact contract, persistence, and production rollout
18. Module 5 step frame, reference/planning surfaces, outline reorder/actions, identity contract, and production writing spine
19. Module 6 step frame, SectionMoveWorkspace, BodyParagraphMoveWorkspace, TaskRelevantArtifacts, reference shelf, advanced path, autosave, and production writing spine
20. Module 9 guided APA protocol flow, canonical model, quick guide/reference, help/fix state, persistence, Doc/PDF phases, and production rollout
21. WP-094/095 success components only to preserve shared visual language; do not pull success-page celebration into active workspaces
22. existing hierarchy, color, disclosure, orientation, action-affordance, responsive, keyboard, persistence, and module-specific tests

Create one new bounded issue, WP-096. Do not reopen resolved issues. Keep WP-096 Open during implementation and Needs Verification until automated and agent-run browser acceptance pass. Record evidence against older app-wide visual issues only when the representative slice actually verifies their stated criteria; do not prematurely close an app-wide issue from five screens.

FIRST PROGRESS REPORT — WORKSPACE-FAMILY AUDIT

Before editing, report:

- the current DOM/visual order for each representative screen from page chrome through primary action;
- every repeated orientation, “why this matters,” “how to succeed,” “you’re ready when,” “what happens next,” module-mode, teacher, instruction, job, success-criteria, desk, shelf, and progress block visible on each screen;
- which pieces contain unique teaching value and which repeat the same message in different words;
- the exact current active task and gating condition for each representative screen;
- the exact task-relevant artifacts required for that action and their authoritative sources;
- everything currently shown on the desk that is not needed for the current action;
- everything currently buried on the shelf that is required for the current action;
- current editor/input position, size, visual prominence, and distance from the instruction it answers;
- current primary/secondary/reference actions and whether visual hierarchy matches behavior;
- current semantic color roles and any colors used only decoratively or inconsistently;
- current desktop columns/widths, especially Module 6 reference width and active editor width;
- current mobile stacking and keyboard order compared with task order;
- all shared primitives already capable of expressing the target hierarchy;
- the minimum missing primitive or contract needed without creating another page shell;
- a normalized slot/region model that works across all five families while allowing module-specific teaching;
- the smallest development-only presentation gate and fixture/seed states needed for reliable acceptance;
- files expected to change and exact automated/browser acceptance plan.

Do not edit until the audit maps every visible block to a clear role and identifies what will move, collapse, merge, remain, or be removed as duplicate. Do not delete unique teaching merely because the page is long.

PROBLEM TO SOLVE

The application already contains strong teaching and several partial visual contracts, but students can still encounter screens where page chrome, orientation copy, instruction, saved work, examples, editor, readiness, and reference material compete at nearly equal weight. A page can be technically organized yet still make a student ask, “What am I supposed to do right now?”

The solution is not five louder cards or less teaching. It is a stable visual grammar:

- quiet orientation;
- unmistakable current task;
- short action-linked teaching;
- task-relevant saved work on the desk;
- active student work as the dominant surface;
- feedback/recovery next to the action that caused it;
- one clear readiness/continue region;
- broader saved work and reference material on the shelf.

TARGET FIVE-LEVEL HIERARCHY

Use and refine the accepted hierarchy contract rather than replacing it:

1. Current task — the dominant question/action and active step.
2. Objective/orientation — concise purpose and position in the journey.
3. Instruction/coaching — only the teaching needed to perform this action.
4. Student work and task-relevant artifacts — editor/input plus desk material.
5. Reference/history — broader notebook, full guides, examples, and completed prior work.

This is a priority model, not a requirement to render five cards. Several levels may share a region when their relationship is clear.

SHARED TASK-WORKSPACE CONTRACT

Create or extend one composable task-workspace contract and small shared primitives, with repository-appropriate names, that can represent:

- module and shared journey stage;
- current step label and optional `Step N of M`;
- concise task heading/question;
- one-sentence job or action instruction;
- active input/work surface;
- task-relevant desk artifacts;
- contextual model/example/help;
- teaching feedback or recoverable error;
- readiness state and one primary forward action;
- secondary/local navigation actions;
- shelf/reference content;
- semantic role for every visual region;
- responsive ordering and desktop width intent.

The contract must be presentation-only. It must not own response state, save state, completion, navigation, or artifact selection logic. Existing module components remain authoritative for those behaviors.

Prefer slots/composition over a universal mega-component with dozens of module-specific conditionals. Reuse ModulePageShell/WorkspaceLayout where appropriate. Do not nest a new full-page shell inside an existing full-page shell.

ORIENTATION WITHOUT A WALL OF TEXT

At the top of an active screen, the student should see:

- where they are;
- the current task;
- the shortest useful reason/job cue.

Do not repeat the same idea in a module-mode banner, four-question orientation block, instruction panel, teacher rail, and job card. Keep unique value but consolidate repeated claims.

Rules:

- Journey/mode is a quiet orientation cue, not the largest element.
- The current task heading is the first dominant heading.
- `Step N of M` appears when a meaningful local sequence exists.
- “Why this matters” remains visible only when it directly changes the student’s decision; otherwise move its unique value into concise coaching or optional disclosure.
- “What happens next” should not compete with the current action; the readiness/action region can carry the short preview.
- Never hide a required instruction behind a disclosure.
- Never require students to memorize a large guide before beginning a small action.

DESK-AND-SHELF RULES

Desk:

- contains only the smallest authoritative information needed for the active decision;
- updates when the active move changes;
- labels student-created work as the student’s own work;
- keeps source identity/provenance when evidence is shown;
- may show a compact structural model, but never a model that supplies the student’s answer;
- does not duplicate content already visible inside the active work surface.

Shelf:

- contains the full notebook, earlier work, extended examples, complete guides, and optional resources;
- remains reachable without leaving the task;
- begins collapsed when density policy says it is optional;
- uses a meaningful label such as `More saved work`, `Full evidence set`, or `APA reference`, not a vague `More`;
- never becomes the only location of required task context.

If a required artifact cannot be matched confidently, show an honest recovery/mismatch state. Do not silently choose an adjacent paragraph, source, outline card, or document.

SEMANTIC COLOR CONTRACT

Use the existing instructional color contract/tokens consistently across the representative screens:

- current action/work surface;
- coaching/instruction;
- student-created words/artifacts;
- source evidence/reference;
- completion/readiness;
- warning/recovery;
- neutral shelf/history.

Each semantic role must also be identified structurally or with text/iconography. Color alone never communicates readiness, correctness, ownership, or error.

Do not introduce a new palette, paint every container, or use success green for neutral saved work. The active work surface should dominate through composition and contrast, not saturation alone.

RESPONSIVE COMPOSITION

Desktop:

- use a calm orientation band;
- give the active work surface the largest useful region;
- place a contextual desk beside it only when side-by-side comparison helps;
- give the desk enough width to be readable—specifically address the accepted WP-017 Module 6 narrow-sidebar finding;
- move shelf/reference below or into a quieter rail/disclosure;
- keep readable line lengths.

Mobile:

- stack in task order, not desktop-column order:
  orientation → current task/coaching → task-relevant desk → active work → feedback/readiness → actions → shelf;
- allow a tightly coupled desk item to appear immediately above its corresponding input;
- no horizontal overflow at 390×844;
- primary controls at least 44px;
- no required side-by-side reading;
- keyboard order must match visual/task order.

REPRESENTATIVE MODULE REQUIREMENTS

MODULE 1 — TRANSFER VOCABULARY

- Keep the accepted notice → name/boundary → effect/fit → purpose → King apply → assignment transfer sequence.
- Make the current microstep and response control primary.
- Show only the passage, concept boundary, or saved paraphrase needed for that microstep.
- Keep teaching feedback adjacent to Check/Continue.
- The six-concept guide/map is shelf/reference unless the current purpose step requires it.
- Preserve local Back, explicit Continue, response persistence, and quiz unlock.

MODULE 3 — EVIDENCE TO ARGUMENT

- Keep reorient → reread → repair → explain → pattern → significance → thesis → proof → map.
- Show the relevant speech/letter evidence pair on the desk only when the step uses it.
- Keep the active explanation/thesis/proof input visually dominant.
- Avoid showing the full argument map before the student has earned it.
- Preserve both-work readiness, direction-change acknowledgment, legacy resume, saves, and Module 4 handoff.

MODULE 5 — OUTLINE PLANNING

- Distinguish the current outline action from the Module 4 writing plan.
- Make reorder/edit/confirm actions visibly connected to the outline card they affect.
- Keep thesis and the active paragraph’s plan material on the desk; broader plan/history on the shelf.
- Preserve sourceParagraphIndex identity, accessible Move earlier/later, writing/formal views, and outline persistence.
- Roman numerals remain a formal-outline representation, not the only navigation language.

MODULE 6 — SENTENCE-MOVE DRAFTING

- Preserve Step N of M, move-specific desk filtering, live accumulating prose preview, advancedProse source of truth, completed-move editing, and explicit finish.
- Make the active move input/editor the primary surface.
- Give the contextual desk enough desktop width to read evidence and reasoning comfortably.
- Keep full outline/notebook and extended help on the shelf.
- Prevent duplicate thesis/evidence/context blocks.
- Preserve no-character-auto-advance, autosave/reload, advanced-mode round trip, and prose without plan labels.

MODULE 9 — GUIDED APA FORMATTING

- Preserve See → Understand → Do → Check → Fix, accurate canonical model, exact Google Docs actions, help/fix persistence, and semantic resume.
- Show only the current formatting move’s model, instruction, and check as the active workspace.
- Keep the full APA Quick Guide available as reference, not expanded above every active move.
- Keep `Looks correct`, `Help me fix it`, and `I fixed it` adjacent to the relevant check/feedback.
- Do not reintroduce recognition quizzes or repeated format checklists.
- Preserve Doc inspection, PDF phase, upload, and receipt behavior unchanged.

DEVELOPMENT GATE

Put the new task-workspace composition behind one explicit development-only, presentation-only helper for the representative surfaces.

The gate must:

- not alter instructional rollout selection;
- not change saves, artifacts, completion, or actions;
- not be student-controlled;
- not leak fixture copy into production;
- leave production behavior unchanged until a later generalization/promotion prompt;
- make side-by-side legacy/foundation acceptance possible in tests where useful.

Use existing developer seeds when they cover the states. Add only the smallest synthetic fixture variants required for repeatable visual acceptance.

AUTOMATED TESTS

Add focused WP-096 behavioral tests for at least:

1. Shared workspace contract slot/role normalization.
2. Exactly one dominant current task and one primary forward action.
3. Required instruction never placed only in shelf/disclosure.
4. Desk selectors expose only artifacts mapped to the active move.
5. Missing/mismatched artifacts produce recovery rather than an adjacent silent match.
6. Mobile region order matches task order.
7. Semantic color roles come from the shared contract/tokens and retain non-color labels.
8. Module 1 feedback and response persistence remain unchanged.
9. Module 3 evidence pair, thesis/proof saves, and handoff remain unchanged.
10. Module 5 reorder identity and persistence remain unchanged.
11. Module 6 move filtering, advanced mode, autosave, and no-auto-advance remain unchanged.
12. Module 9 help/fix/resume and phase resolution remain unchanged.
13. Gate is development-only and presentation-only.
14. Production source/build excludes fixture labels and retains current composition.
15. Existing WP-050, WP-053, WP-054, WP-061, WP-062, WP-073–077, WP-081–093, and relevant module suites remain green.

Prefer DOM/behavior assertions over screenshots or source-string checks. Use visual screenshots as browser evidence, not as the only automated proof.

AGENT-RUN BROWSER ACCEPTANCE

At 390×844 and 1440×900, use seeded representative states and verify:

1. The current task can be identified from the first viewport without opening a disclosure.
2. The active input/editor is visually primary and reachable early by keyboard.
3. Only required saved work appears on the desk for the active move.
4. Broader work remains available on the shelf without interrupting the task.
5. Primary, secondary, reference, and recovery actions look and behave differently.
6. Feedback/errors appear adjacent to the action they explain.
7. Continue/Finish stays gated exactly as before.
8. Back/local edit preserves work and returns to the correct local state.
9. Refresh restores the same microstep/move and student response.
10. No horizontal overflow, clipped evidence, tiny sidebar text, or desktop-width wall of prose.
11. Keyboard focus order matches visual/task order and focus remains visible.
12. Semantic colors consistently distinguish coaching, student work, evidence/reference, readiness, and recovery with non-color cues.
13. Reduced motion and 200% zoom retain a usable task order.

Module-specific paths:

- M1: complete one notice/choice/feedback/Continue cycle and inspect assignment-transfer desk.
- M3: inspect both-work evidence, save an explanation, refresh, and reach thesis/proof without context mismatch.
- M5: reorder a body paragraph, refresh, edit locally, and confirm identity/desk content.
- M6: move Step 1 → evidence move → final move, edit a completed move, switch advanced mode and reload.
- M9: `needs_help` → fix steps → `I fixed it` → refresh at next move; confirm full guide stays secondary.

Production gate acceptance:

- clean production build retains the current accepted production workspace composition;
- no WP-096 fixture/gate UI is visible;
- `/api/dev/panel` remains 404 and unauthenticated protected APIs remain denied;
- all production instructional rollout API values remain unchanged.

Capture screenshots/structured evidence for all five representative screens at both viewports. The only acceptable human remainder is subjective visual tone; the agent owns density, hierarchy, responsive, keyboard, persistence, and recovery checks.

ACCEPTANCE CRITERIA

- One shared composable contract expresses the same hierarchy across five different workflow families.
- Current task and active student work are visually primary.
- Desk contains task-relevant artifacts only; shelf retains broader context.
- Unique teaching remains available while repeated framing is reduced.
- Semantic colors communicate stable roles with non-color cues.
- Module 6’s contextual desk is readable at desktop width.
- Mobile and keyboard order follow the learning task.
- All accepted instructional, persistence, and progression behavior is unchanged.
- Development and production gate acceptance pass.
- WP-096 records implementation and evidence before Resolved.

OUT OF SCOPE

- Generalizing the workspace foundation to every screen in Modules 1–9.
- Production promotion of the new workspace composition.
- Success screens or completed dashboard redesign (WP-094/095 are complete).
- Teacher dashboard/visibility redesign.
- Instructional sequence, artifact schema, or rollout changes.
- New animations, gamification, brand identity, or broad typography redesign.
- Removal of legacy instructional pathways.

FIRST RESPONSE REQUIRED

Before editing, provide:

1. The five-screen block/role/density audit.
2. Proposed shared slot contract and how it extends existing primitives.
3. Exact desk vs shelf mapping for every representative active step.
4. Semantic color-role mapping.
5. Development gate boundary.
6. Files expected to change.
7. Automated and browser acceptance plan.

Then implement, test, perform agent-owned browser acceptance, update WP-096 and genuinely affected issue evidence, and report any human-only visual-tone judgment separately.
```
