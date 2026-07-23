# Cursor Prompt 18 — Generalize and Promote the Workspace Hierarchy

Use this prompt only after WP-096 is Resolved. This finishes Phase 6 by extending the accepted task-workspace grammar across all current student active-work states in Modules 1–9 and then promoting that presentation to production.

```text
Generalize the accepted WP-096 TaskWorkspaceFrame/TaskWorkspaceRegion hierarchy across every current student active-work state in Modules 1–9, then production-promote it after complete coverage and browser acceptance.

This is a systematic generalization and presentation promotion. It is not a new design exploration. Reuse the accepted contract, exact instructional color roles, one-H1 rule, desk/shelf discipline, responsive task order, action hierarchy, and persistence parity from WP-096.

Do not redesign the production instructional sequences, questions, artifacts, scoring, save behavior, progression, Google Doc/PDF protocol, receipt, success screens, dashboard, or independent rollout controls. Change visual composition and duplication only where the accepted hierarchy requires it.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2
   - Sections 3.1–3.16
   - Sections 4.1–4.5
   - Section 6
   - Phase 6 and its exit condition
   - Epic H
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. docs/design-system-v1.md
8. Prompt 17 and the complete WP-096 issue entry, implementation, tests, browser script, screenshots/evidence, fixes, and production gate-off evidence
9. lib/ui/taskWorkspaceContract.js
10. components/workspace/TaskWorkspaceFrame.jsx and TaskWorkspaceRegion.jsx
11. components/shared/JobRightNow.jsx
12. lib/dev/isTaskWorkspaceHierarchyFoundationEnabled.js
13. lib/ui/hierarchyContract.js, screenOrientationContract.js, instructionalColorContract.js, progressiveDisclosureContract.js, and writingJourneyStages.js
14. all layout shells and workspace column/center/sidebar/guide components
15. every current Module 1–9 student component, step registry/contract, active state resolver, desk/reference selector, input/editor, feedback, readiness gate, action, recovery state, and local navigation path
16. all current production instructional rollout resolvers and their compatibility behavior
17. WP-017, WP-018, WP-048–WP-055, WP-059, WP-061–WP-063, WP-073–WP-079, WP-081–WP-093, WP-095, and WP-096 in the issue log
18. all module-specific behavior, persistence, progression, hierarchy, color, disclosure, accessibility, responsive, and production-bundle tests

Create one new bounded issue, WP-097. Do not reopen WP-096. Keep WP-097 Open during implementation and Needs Verification until the complete state-family coverage matrix, production promotion, clean production-build acceptance, compatibility paths, recovery paths, and dev-infrastructure denial all pass.

WP-050 and WP-061 are app-wide issues. Mark them Resolved only if this work genuinely covers all active-work screen families and the agent records the full acceptance evidence. WP-017 may be Resolved only if the promoted Module 6 composition—not merely the old development gate—keeps required contextual material readable while the writing surface remains largest.

FIRST PROGRESS REPORT — COMPLETE ACTIVE-WORK INVENTORY

Before editing, produce a route/state-family matrix for Modules 1–9. Do not begin with a file list alone. For each distinct active-work family, record:

- route/module;
- production rollout mode/path;
- state/step ids and which share one renderer;
- new-student, returning/resume, partial, complete/revisit, help, error, recovery, and stale/mismatched variants;
- authoritative current-task label;
- active response/editor/work surface;
- required task-relevant artifacts and their source;
- optional shelf/reference content;
- feedback/error placement;
- readiness condition;
- primary, secondary, local-back, and recovery actions;
- current semantic heading structure;
- current desktop/mobile region order;
- existing TaskWorkspaceFrame coverage or missing coverage;
- exact automated fixture/seed available for acceptance.

At minimum, inventory these families:

MODULE 1
- assignment/prompt orientation and first task;
- all six vocabulary-transfer concept families and their microsteps;
- feedback, local Back, transfer desk, incomplete/complete concept states;
- recognition/quiz gate and completion review where still part of production.

MODULE 2
- source/text orientation and reading;
- noticing/annotation/evidence capture;
- direction/frame selection across same-appeal, cross-appeal, and student-created paths;
- evidence-pair readiness, missing-side recovery, ambiguous/multiple candidates, and direction change.

MODULE 3
- reorient, reread, repair, explain, pattern, significance, thesis, proof, and argument-map families;
- legacy/v1/v2 resume and direction-change acknowledgment;
- missing/mismatched evidence and save/retry states.

MODULE 4
- essay-map/pattern orientation;
- introduction, required body-paragraph, and conclusion planning;
- evidence/context/reasoning/thesis-relationship work;
- paragraph-part local edit, review, missing/mismatched upstream artifact, and final review.

MODULE 5
- thesis/outline orientation;
- introduction/body/conclusion move construction;
- writing-plan/formal-outline views;
- reorder, local edit, review/finalize, legacy outline, and mismatch/recovery states.

MODULE 6
- introduction, every required body paragraph, and conclusion sentence-move workspaces;
- single- and multi-evidence moves;
- advanced whole-section mode;
- completed-move local edit, live prose preview, review, autosave/error, and returning state.

MODULE 7
- read-aloud/listen/observation;
- introduction, every required body paragraph, and conclusion diagnostic revision;
- recommended/alternate targets, transition context, before/after, clearer-confirm;
- whole-essay inspection, word-count advisory/required states, local Fix and return, final review.

MODULE 8
- create/update/verify/open Google Doc;
- creating/verifying/ready/needs-attention;
- stale/mismatched/unavailable/replaced Doc and targeted recovery;
- returning/revisit and direct Module 9 transition.

MODULE 9
- every guided APA move and See/Understand/Do/Check/Fix status;
- help/fixed/save-retry/refresh states;
- definitive Doc inspection;
- PDF download steps, selection, invalid/valid file, five-item inspection, upload/retry;
- already-submitted receipt transition. Do not reframe the receipt success page itself.

Also report:

- every page with multiple or competing H1s;
- every place required instruction is currently disclosure-only;
- every desk that contains unrelated history or duplicates the active work surface;
- every required artifact currently buried on a shelf;
- every screen where primary action styling disagrees with behavior;
- every recovery/error block separated from its triggering action;
- every desktop column narrower than readable content or wider than useful line length;
- every mobile DOM order that differs from learning-task order;
- all direct uses of `isTaskWorkspaceHierarchyFoundationEnabled` and every gated/legacy JSX branch;
- whether promotion needs a database setting. Default: no, because this is presentation-only; justify any contrary proposal before editing;
- the exact plan to remove the development boundary rather than replacing it with `return true`;
- files expected to change and the complete automated/browser plan.

Do not edit until the matrix accounts for every production state/step id or explicitly maps multiple ids to one verified renderer. “Representative screens checked” is not sufficient for WP-097.

COVERAGE REGISTRY

Create a testable, pure coverage registry or equivalent contract that maps every current production active-work renderer/state family to:

- journey stage;
- TaskWorkspaceFrame adapter/rendering path;
- active task/work role;
- desk selector or explicit `none`;
- shelf/reference selector or explicit `none`;
- recovery ownership;
- primary-action ownership;
- fixture/acceptance family.

This registry is a coverage safeguard, not a second router or state machine. Existing module step contracts remain authoritative. Derive entries from existing registries where possible; do not manually duplicate every dynamic body paragraph or APA move when a family/pattern entry can be proven exhaustive.

Tests must fail when a new production step type is introduced without a workspace-hierarchy mapping.

GENERALIZATION RULES

For every active-work family:

1. One semantic page H1 represents the current task. Module name/mode/journey chrome remains quieter and must not become a competing H1.
2. The first viewport communicates where the student is, what to do, and the active work surface without opening optional content.
3. Unique action-linked teaching remains visible near the task. Repeated framing may be consolidated, but required instruction is never shelf-only.
4. Desk contains only authoritative artifacts required for the current action.
5. Shelf contains broader history, full guides, extended examples, and optional resources.
6. Active work is the largest/usefully dominant region.
7. Feedback and recovery appear adjacent to the action/state they explain.
8. One primary forward action exists per state; final/irreversible actions retain their accepted distinct treatment.
9. Local Back/edit remains local and preserves work.
10. Mobile DOM/focus order follows learning-task order.
11. Exact color-role ids are reused: `instruction`, `student-thinking`, `evidence`, `writing`, `revision`, and `reference`.
12. Status/action colors remain separate from instructional roles.
13. Non-color labels/structure identify every role.
14. Progressive disclosure hides optional density, not requirements, current work, recovery, or gating truth.
15. Missing/mismatched artifacts produce honest recovery; never silently select an adjacent artifact.

Do not force a desk or shelf onto a simple task that does not need one. Empty decorative regions increase cognitive load.

MODULE-SPECIFIC GENERALIZATION

MODULE 1
- Reuse the WP-096 transfer composition across all six concepts and every microstep.
- Keep concept-specific pedagogy distinct; do not flatten audience fit, purpose, or rhetoric into the ethos pattern.
- Apply the hierarchy to prompt/quiz active tasks without wrapping passive completion screens.
- Preserve explicit Check → teaching feedback → Continue and durable resume.

MODULE 2
- Make the active text/evidence decision primary while keeping the other work available for comparison when required.
- Maintain source identity and both-work provenance.
- Direction frames and custom mapping must be understandable without internal ids.
- Multiple evidence candidates require an explicit student choice; hierarchy must not visually imply a silent default.

MODULE 3
- Extend the accepted WP-096 composition to every evidence-to-argument step and compatibility state.
- The earned chain may accumulate on the desk, but show only the portion required for the current decision.
- Do not reveal a completed thesis/proof map before the student earns it.

MODULE 4
- Bring the current section plan and only its matched evidence/thesis relationship onto the desk.
- Preserve essay-map orientation without making the full map compete with the current paragraph task.
- Local review repair must return to the exact part and back to review without replay.

MODULE 5
- Extend the accepted outline composition to every outline/edit/reorder/review state.
- Keep plan versus outline visibly distinct.
- Preserve stable sourceParagraphIndex across reorder and reload.
- Formal outline conventions remain a view, not implementation labels leaking into writing tasks.

MODULE 6
- Promote the accepted readable contextual desk and largest writing surface across introduction, all body paragraphs, conclusion, advanced mode, review, and local editing.
- Desk selection follows active move, including repeated multi-evidence move ids.
- Empty desk never claims a notebook is open.
- Full outline/history stays available without competing with drafting.

MODULE 7
- Use the `revision` role for active revision work and `writing` for prose being inspected.
- Put the editor near the top and make it primary.
- Show only matched plan/evidence and the diagnostic locus needed for the chosen target.
- Transition repair includes adjacent paragraph context without dumping the full essay.
- Whole-essay inspection shows one finding at a time and local Fix/return remains intact.
- Word-count coaching remains development-focused and teacher-configured; hierarchy must not turn it into “add N words.”

MODULE 8
- Keep the single verified-Google-Doc protocol concise and task-primary.
- Status progression (creating/verifying/ready/needs attention) must be structurally clear with non-color cues.
- Recovery is immediately visible when unhealthy; optional template/reference stays secondary.
- Do not reintroduce APA formatting/checklist work into Module 8.

MODULE 9
- Extend the accepted WP-096 guided-move hierarchy across all APA moves and Doc/PDF phases.
- Full APA guide stays shelf/reference unless a specific fragment is required for the active move.
- Recovery is visible when unhealthy, disclosed only when healthy.
- The numbered PDF download protocol and five-item selected-PDF inspection remain distinct active tasks.
- Upload Final PDF remains the sole final action when eligible.

PRODUCTION PROMOTION

After complete development acceptance:

- make TaskWorkspaceFrame/Region composition the normal production presentation for all covered active-work states;
- remove `isTaskWorkspaceHierarchyFoundationEnabled` and all duplicate gate branches rather than returning `true`;
- retain legacy JSX only when it serves a documented compatibility/recovery state that cannot use the shared frame; otherwise remove it after parity tests;
- do not add an assignment/database rollout mode for presentation-only composition;
- keep existing instructional rollout resolvers completely independent;
- make rollback a code/deployment rollback that never changes student data;
- remove dead foundation-only labels/comments where they would mislead future maintainers;
- keep dev seeds, fixtures, testing controls, and browser harness code out of production bundles;
- prevent legacy→shared hydration shifts or duplicated actions after load.

If a direct reopen lacks artifact data, repair the authoritative read path or render an honest reduced/recovery state. Do not add a display-only persistence table.

AUTOMATED ACCEPTANCE

Add focused WP-097 behavioral tests for at least:

1. Coverage registry exhaustively maps every current production active-work state family.
2. New/unknown step types fail coverage tests clearly.
3. One page H1/current task and one primary forward action per state.
4. Required instruction never exists only in a shelf/disclosure.
5. Desk selectors are task-specific and preserve source/section identity.
6. Missing/mismatched artifacts produce recovery rather than silent adjacency.
7. Mobile DOM order follows the shared contract.
8. Exact semantic color roles and non-color labels.
9. Module-specific save/resume/back/reorder/advanced/help/fix/recovery behavior remains unchanged.
10. Render-time presentation creates no completion/progression writes.
11. Production no longer depends on the development workspace gate.
12. No fixture/seed/panel strings in production chunks.
13. All WP-096 tests remain green or are intentionally upgraded to production expectations.
14. All relevant WP-017/018/048–055/059/061–063/073–079/081–093 suites pass.
15. All Module 1–9 artifact, persistence, progression, and handoff suites affected by wiring pass.

Prefer contract/behavior/DOM tests. Source scans may prove production denial but cannot substitute for behavior.

AGENT-RUN DEVELOPMENT ACCEPTANCE

At 390×844 and 1440×900, plus 200% zoom and reduced motion, exercise at least one state from every coverage family and all exceptional branches listed below. Use deterministic seeds/fixtures and record a machine-readable result matrix.

For every family verify:

- current task visible in first viewport;
- active work primary;
- task-relevant desk only;
- required instruction visible;
- optional shelf reachable;
- one primary action;
- adjacent feedback/recovery;
- correct gating;
- correct keyboard order/focus;
- refresh/resume;
- local Back/edit where supported;
- no overflow/clipping/layout shift;
- no lost work.

Required exceptional paths:

- M1 incomplete concept, feedback, returning microstep, quiz locked/unlocked;
- M2 missing one work, multiple evidence candidates, custom direction, direction change;
- M3 mismatch repair, legacy resume, stale save/retry, thesis/proof handoff;
- M4 intro/body/conclusion, multi-evidence body, local review repair, final review;
- M5 reorder/reload, plan/formal toggle, legacy outline, local edit;
- M6 intro/single-evidence/multi-evidence/final body/conclusion, advanced reload, autosave failure/retry, review;
- M7 read-aloud, each section family, alternate target, transition context, before/after reload, whole-essay Fix/return, advisory and required word-count states;
- M8 create/update/verify, stale/mismatch, unavailable Doc, retry/recovery, returning verified Doc;
- M9 correct/help/fixed/save-retry, all move families, Doc inspection, invalid/valid PDF, upload failure/retry, already-submitted transition.

Do not claim full coverage from one screenshot per module. Multiple step ids may share one verified renderer, but the result matrix must show that mapping.

AGENT-RUN PRODUCTION ACCEPTANCE

Build and run a clean production server with no workspace-hierarchy override.

Verify:

1. Shared task hierarchy renders normally in production across all nine modules.
2. No development workspace gate is required or present.
3. All independent instructional rollout modes remain database-backed and unchanged.
4. New, returning, legacy-compatible, recovery, and already-complete students enter the correct state.
5. Saves, refresh, direct reopen, local repair, module handoffs, Google Doc flow, PDF upload, receipt, and dashboard remain intact.
6. `/api/dev/panel` and reset endpoints remain denied; unauthenticated protected APIs remain denied.
7. No WP-096/097 fixture or seed strings appear in production chunks.
8. No horizontal overflow at both viewports and 200% zoom.
9. Keyboard and focus-visible checks pass on each layout family.
10. Production logs contain no student prose, source text, private document URL, or new sensitive artifact content.

ACCEPTANCE CRITERIA

- Every production active-work state family has an explicit, tested workspace-hierarchy mapping.
- All nine modules use the accepted task/desk/work/feedback/action/shelf grammar where applicable.
- Simple tasks do not gain empty decorative regions.
- The active task and work surface are visually primary.
- Required context is on the desk; optional history/reference is on the shelf.
- Unique teaching remains available and repeated framing is reduced.
- Semantic colors are consistent app-wide with non-color cues.
- Module 6 required contextual material is readable while writing remains largest.
- Mobile, keyboard, zoom, reduced-motion, recovery, and resume acceptance pass.
- Production uses the shared composition without a development gate or new DB mode.
- Artifact, progression, rollout, Doc/PDF, receipt, success, and dashboard behavior remain unchanged.
- WP-097 contains the complete state-family matrix and production evidence before Resolved.
- WP-050, WP-061, and WP-017 are resolved only if their app-wide/promoted criteria are actually met.

OUT OF SCOPE

- Success-screen/dashboard redesign (WP-094/095 complete).
- Teacher dashboard/teacher visibility redesign.
- New instructional content, steps, scoring, artifacts, or persistence.
- New database rollout modes or display-only tables.
- Gamification, brand redesign, or broad animation work.
- Removing legacy instructional pathways.
- Phase 7 target-age usability sessions or assignment cloning; those follow this Phase 6 completion.

FIRST RESPONSE REQUIRED

Before editing, provide:

1. Complete Module 1–9 active-work state-family matrix.
2. Exhaustive coverage-registry design and proof strategy.
3. Desk/work/shelf mapping for every family.
4. Heading, action, disclosure, semantic-color, and responsive exceptions found.
5. Production-promotion and code-rollback boundary, including why no migration is needed.
6. Files expected to change.
7. Automated, development-browser, and production-browser acceptance plan.

Then implement, test, run complete agent-owned development and production acceptance, update WP-097 and genuinely affected older issues, and identify only irreducible subjective visual-tone judgment as a human remainder.
```
