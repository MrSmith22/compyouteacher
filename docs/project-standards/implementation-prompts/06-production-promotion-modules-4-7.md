# Cursor Prompt 06 — Production Promotion of the Modules 4–7 Writing Spine

Use this prompt only after WP-081, WP-082, WP-083, and WP-084 are Resolved, including all required remote migrations. This prompt promotes the accepted writing spine; it does not redesign its instruction or begin Modules 1–3 or Modules 8–9 work.

```text
Promote the accepted Modules 4–7 writing spine from development-only execution to the real production path, with compatibility for existing student artifacts, one authoritative rollout decision, a safe rollback path, migration readiness, and full acceptance against an actual production build.

WP-081 through WP-084 are accepted. Preserve their instructional behavior and contracts. This is a production-hardening and rollout task—not permission to redesign the sentence moves, diagnostics, whole-essay review, teacher word-count coaching, or visual language.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2: product shift and north-star experience
   - Sections 3.1–3.16: instructional, configuration, completion, success, accessibility contracts
   - Sections 4.1–4.5: artifact/state/configuration/diagnostic/completion architecture
   - Modules 4–7
   - Phase 2 and its exit condition
   - Sections 6.4–6.5: local editing and success transitions
   - Sections 8–9: regression and closure evidence
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. WP-081–WP-084 in docs/project-standards/walkthroughs/issue-log.md
8. Prompts 02–05 and their corrective acceptance history
9. Current migrations, authenticated APIs, production build configuration, and deployment documentation

Create one new bounded issue, WP-085, for production promotion. Do not redefine or reopen WP-081–084. Keep WP-085 Open during implementation and Needs Verification until production-build, legacy-artifact, migration, and rollback acceptance all pass.

FIRST PROGRESS REPORT — PRODUCTION READINESS AUDIT

Before proposing edits, report:

- every development-only gate controlling the rebuilt Module 4, 5, 6, or 7 experience;
- every component/helper whose behavior differs under NODE_ENV;
- every development seed, bypass, test panel, local-file fallback, test identity, or localhost-only assumption that must not leak into production;
- the authoritative persisted artifact shapes for legacy and rebuilt Module 4 plans, Module 5 outlines, Module 6 drafts/draft_meta, Module 7 revisions/resume, and WP-084 settings;
- how returning students at each Module 4–7 boundary currently hydrate;
- how legacy drafts without verticalSlice metadata can be adapted without losing prose;
- how production authentication and authorization protect student writes and teacher settings;
- which migrations are required remotely and whether the application can distinguish missing-schema failure from missing-row/default state;
- how Module 8 selects the newest finished Module 7 essay;
- production build/test commands and how an agent can run a non-development browser acceptance without the developer panel;
- the smallest safe rollout/rollback mechanism that avoids two components making different decisions.

Do not simply replace NODE_ENV === development with true. Do not edit until the rollout decision, compatibility path, and rollback behavior are explicit.

PROBLEM TO SOLVE

The rebuilt writing process currently works only because helpers such as isBodyParagraphVerticalSliceEnabled, isSectionVerticalSliceEnabled, and isWholeEssayReviewEnabled return true in development. A production build silently selects the old workflow. Directly deleting those conditions would expose untested legacy-state and deployment risks.

Promotion must make the accepted experience the real path for the current MLK assignment while preserving existing student work, preventing dev tooling from shipping, and allowing an operational rollback that does not erase or corrupt rebuilt artifacts.

TARGET OUTCOME

For the current MLK assignment in production:

- new students receive the rebuilt Modules 4–7 process;
- returning students resume from saved work at the correct local step;
- legacy plans/outlines/drafts appear in the rebuilt workspace through safe adapters rather than blank pages;
- rebuilt moves, revisions, and whole-essay findings remain durable;
- teacher word-count settings remain database-backed;
- Module 8 receives the newest revised essay;
- development seeds, bypasses, panels, and local file fallbacks remain unavailable;
- one controlled rollback can select the legacy presentation without deleting rebuilt data;
- production errors fail honestly and recoverably rather than silently switching paths or certifying incomplete work.

ONE AUTHORITATIVE ROLLOUT CONTRACT

Replace direct NODE_ENV gating of student instruction with one explicit rollout resolver.

The resolver must:

- distinguish at least legacy and rebuilt writing-spine modes;
- be authoritative for the assignment and shared consistently by Modules 4–7;
- enable rebuilt mode for the current assignment id mlk-rhetorical-analysis in production after migration/readiness checks;
- remain testable in development, test, and production builds;
- never depend on the presence of the Developer Testing Panel;
- never use a student-controlled browser value as the source of truth;
- expose only the resolved capability needed by client components;
- support an authenticated operational rollback to legacy presentation or an equivalent deployment-level emergency override;
- preserve all rebuilt data during rollback;
- avoid split-brain behavior where one module or server route selects legacy while another selects rebuilt.

Prefer extending the assignment-owned configuration architecture if it can safely represent rollout mode. Keep rollout/operations controls separate from ordinary student settings. Do not expose an experimental toggle to students.

If a new database column or table is required:

- provide an idempotent migration;
- default unknown assignments safely;
- explicitly enable rebuilt mode for the current MLK assignment only when intended;
- enable RLS where appropriate;
- keep service-role/server API access explicit;
- reject invalid modes server-side;
- include a preflight that reports missing schema clearly;
- do not mark WP-085 Resolved until the remote migration is applied and verified as database-backed.

DEVELOPMENT TOOLING BOUNDARY

The following must remain development-only and tree-/render-inaccessible in production:

- Developer Testing Panel;
- seed endpoints and seed target names;
- dev authentication identities or bypasses;
- Module progression bypasses;
- local JSON settings fallback;
- debug status/actions;
- test-only query parameters or storage switches.

Production promotion must not weaken existing NODE_ENV protection around developer tooling. Add executable production-build/source tests proving these surfaces are absent or return a safe denial.

LEGACY ARTIFACT COMPATIBILITY

Build small pure compatibility adapters at artifact boundaries. Do not mutate historical data merely to render it, and do not replace valid student prose.

Required legacy cases:

- Module 4 body plans using older labels or partial fields;
- Module 5 legacy outline shape, missing moveOrder, or array-position-only cards;
- reordered outlines with sourceParagraphIndex present or absent;
- Module 6 sections/full_text without draft_meta.verticalSlice;
- Module 6 paragraph prose created in the old whole-textarea path;
- Module 7 revision row without resume/currentStepIndex/revisionBySectionType/revisionBySourceIndex;
- partially completed Module 4, 5, 6, or 7 work;
- already completed Module 7 with an existing final_text consumed by Module 8;
- two-body and three-body assignments;
- teacher word-count row absent (mode off) versus assignment_settings schema absent (deployment error).

Compatibility behavior:

- infer only when the mapping is unambiguous;
- preserve stable sourceParagraphIndex when present;
- when absent, establish a deterministic mapping once and persist it at the next legitimate save;
- hydrate legacy paragraph prose into the accepted advanced whole-section representation so it appears intact, not split into invented sentence moves;
- do not concatenate legacy prose with empty/default moves;
- keep legacy final text available until the rebuilt final text is durably saved;
- flag ambiguous/mismatched artifacts for local review rather than guessing or erasing;
- write upgraded metadata only through authenticated normal saves or a separately reviewed migration, never as a render side effect.

Document each adapter's confidence limits and removal criteria.

MODULE-SPECIFIC PROMOTION REQUIREMENTS

Module 4

- Production uses the accepted essay map, stable Body Paragraph N labels, organization-first flow, evidence pull-forward, explicit finish, and local edit.
- Legacy saved plans hydrate without replay when valid.
- Ambiguous legacy evidence/provenance receives a local repair prompt.

Module 5

- Production uses synchronized writing-plan/formal-outline views and accessible reorder.
- Legacy outlines gain display move lists through adapters without leaking Roman numerals into prose.
- Reorder preserves or establishes durable section identity.

Module 6

- Production uses sentence-move workspaces for Introduction, all required Body Paragraphs, and Conclusion, plus the accepted advanced paths.
- Legacy whole-paragraph prose opens intact in advanced mode.
- Server-backed resume, autosave, explicit Keep going, section review, counts, and Module 6 handoff work without dev seeds.
- No count or character threshold auto-advances.

Module 7

- Production uses accepted section diagnostics, Before/After, local resume, local repair, and whole-essay inspection.
- Legacy revised/final prose remains authoritative until a rebuilt save occurs.
- Returning students resume the correct section/final review without replay.
- Required/advisory word-count behavior uses database settings.
- Completion passes the newest revised essay to Module 8.

FAILURE AND ROLLBACK CONTRACT

- Missing required schema/configuration is a deployment error, not a reason to silently use a local file or claim mode off.
- Temporary settings/read failures must show a recoverable state and preserve student work.
- Rollback changes presentation/entry mode only; it must not delete verticalSlice metadata, revision history, or final text.
- Returning to rebuilt mode after rollback must restore the same moves, prose, Before/After, resume, and final-review confirmations.
- Do not catch broad errors and silently route students to the legacy workflow.
- Add structured server logs for rollout resolution, compatibility adaptation, and failed persistence without logging student essay prose.

DATA AND MIGRATION PREFLIGHT

Provide an agent-runnable preflight that checks:

- required columns/tables/migrations exist remotely;
- assignment_settings is database-backed, not the dev fallback;
- the current MLK assignment has an explicit rollout mode;
- draft_meta is available;
- service-role reads/writes succeed where required;
- RLS prevents unauthorized direct client writes;
- no production environment depends on .dev-assignment-settings.json;
- legacy artifact counts/shapes can be reported without exposing essay text.

The preflight must be read-only unless explicitly invoked for a reviewed migration/backfill. It should produce concise pass/fail evidence suitable for the issue log.

SEEDS, FIXTURES, AND NON-DEV ACCEPTANCE DATA

Keep existing seeds development-only. For production-build acceptance, create a safe test harness that uses authenticated APIs or isolated test fixtures without exposing a production seed endpoint.

Cover at least:

- new student entering Module 4;
- returning student at every Module 4–7 boundary;
- legacy M4 plans;
- legacy M5 outline;
- legacy M6 prose-only draft;
- legacy M7 revision/final text;
- rebuilt in-progress moves and revisions;
- two- and three-body assignments;
- reordered body paragraphs;
- advisory and required word settings;
- missing settings row;
- missing settings schema/preflight failure;
- temporary API failure and retry;
- rollback legacy -> rebuilt round trip;
- Module 7 completion -> Module 8 newest essay.

AUTOMATED ACCEPTANCE

Add executable tests proving:

- production mode selects the rebuilt spine for the current MLK assignment;
- all Modules 4–7 resolve the same rollout decision;
- unknown/legacy assignments follow the documented safe default;
- operational rollback does not delete or overwrite rebuilt artifacts;
- re-enabling rebuilt mode restores saved state;
- developer panel, seeds, bypasses, dev auth, and local-file fallback cannot run in production;
- each legacy adapter preserves prose and produces deterministic identities/state;
- ambiguous artifacts are flagged instead of guessed;
- legacy M6 prose opens only as intact advanced prose;
- returning students resume correctly at all module boundaries;
- settings absence and schema absence remain distinct;
- unauthorized student/anonymous writes to teacher/rollout settings are denied;
- production Module 7 sends the newest revised essay/count to Module 8;
- WP-081–WP-084 focused suites remain green;
- proportional Modules 4–8 regression suites remain green;
- a real production build completes successfully with no development-only import/runtime dependency.

Run the test suite in both the normal test environment and an actual production build/runtime. Source greps alone are not sufficient.

AGENT-OWNED PRODUCTION-BUILD BROWSER ACCEPTANCE

Cursor owns routine acceptance. Build and serve the application with NODE_ENV=production. Do not use the Developer Testing Panel. Use authenticated isolated acceptance users/artifacts and verify 390x844 and 1440x900.

1. Confirm the current MLK assignment resolves rebuilt mode from the authoritative rollout source.
2. New-user path: enter Module 4 and trace the real production UI through map -> plans -> outline -> Introduction/body/conclusion sentence moves -> assembled draft -> section revision -> whole-essay review -> Module 8 handoff.
3. Returning-user path: directly reopen every Module 4–7 boundary and several local move/revision states; verify server-backed resume and no replay.
4. Legacy M4/M5 path: open saved legacy plans/outline and prove content appears under accepted labels/views without erased data.
5. Legacy M6 path: open prose-only sections and prove the exact prose appears intact in advanced mode; save/reload without stale-move concatenation.
6. Legacy M7 path: open existing revised/final prose, perform a local repair, save/reload, and prove Before/After plus Module 8 handoff.
7. Reorder and multi-evidence: verify stable identity, adjacency, and independent state in production.
8. Word settings: verify database-backed advisory and required behavior; missing row means off; schema/read failure shows recovery rather than a false default.
9. Rollback: switch the isolated assignment/user to legacy presentation using the operational mechanism, verify rebuilt data remains stored, switch back, and prove the same rebuilt state returns.
10. Authorization: confirm student/anonymous clients cannot mutate teacher word-count or rollout settings.
11. Production boundary: confirm no developer panel, seed action, bypass, dev account status, or local fallback is visible/callable.
12. Module 8: confirm newest Module 7 prose and matching count, not stale Module 6/M8 text.
13. Keyboard: perform real Tab/activation passes through representative M4, M5 reorder, M6 move/advanced, M7 revision/final-review, and transition actions. Report focus sequences.
14. Responsive/accessibility: no horizontal overflow; visible focus; correct headings/labels/live status; editor and primary action remain findable at both viewports; reduced-motion behavior where animation exists.
15. Failure recovery: simulate a temporary save/settings failure, retry, and prove student prose remains in the editor.

Do not delegate this production walkthrough to Jason. If a remote migration or deployment credential is genuinely inaccessible, keep WP-085 Needs Verification, provide the exact one-time operation, and automatically finish verification after it is applied.

ROLLOUT DOCUMENTATION

Add a concise runbook describing:

- required migrations and preflight command;
- how the current assignment is enabled;
- how to verify the resolved mode;
- monitoring signals and safe logs;
- rollback procedure;
- proof that rollback preserves data;
- how to re-enable rebuilt mode;
- known legacy adapter limits;
- criteria and later issue for removing the legacy path/adapters.

Do not claim production-ready while remote schema/configuration is missing or only a development fallback was tested.

OUT OF SCOPE

- Redesigning accepted Modules 4–7 instruction or visuals
- Modules 1–3 evidence/argument repair
- Module 8 document-flow redesign beyond regression verification
- Module 9 APA/export/submission redesign
- New grading/rubric/AI-writing features
- Removing legacy code before rollback and compatibility acceptance
- Broad application restyling
- Actual public deployment unless separately authorized

STATUS AND FINAL REPORT

Resolve WP-085 only after remote migration/configuration (if needed), production-build tests, production-browser acceptance, legacy compatibility, rollback, authorization, responsive, keyboard, failure recovery, and Module 8 handoff all pass.

Report:

1. readiness audit and all former development-only gates;
2. authoritative rollout contract and current-assignment production setting;
3. migrations/preflight results and database/RLS evidence;
4. legacy compatibility adapters and confidence limits;
5. module-by-module production behavior;
6. development-tooling exclusion evidence;
7. rollback/re-enable evidence with data preservation;
8. automated tests and exact counts;
9. actual production-build browser state transitions for new and returning users;
10. keyboard, responsive, accessibility, authorization, and recovery evidence;
11. Module 8 newest-essay/count handoff evidence;
12. runbook location and remaining criteria for later legacy-path removal;
13. confirmation that no public deployment or out-of-scope redesign occurred.
```

