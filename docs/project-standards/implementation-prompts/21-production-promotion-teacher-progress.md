# Cursor Prompt 21 — Production Promotion of Teacher Progress Visibility

Use this prompt only after WP-099 is Resolved. This promotes the accepted teacher progress foundation to production, removes the development-only presentation/read gate, and retires duplicate legacy dashboard truth only after real database-backed acceptance.

```text
Promote the accepted WP-099 teacher progress visibility foundation to the normal production teacher dashboard.

Make the authoritative roster read model, pure progress projection, Progress/Submissions/Settings information architecture, receipt-backed submission truth, explicit attention taxonomy, least-data student detail, notes, and grading behavior production-ready.

Do not add a database rollout setting or migration for this presentation/read-model promotion. Do not create a materialized progress table. Rollback is a code/deployment rollback and must never alter student artifacts, teacher notes, grading, assignment settings, or instructional rollout values.

Preserve WP-099 authority and privacy rules exactly. This is production hardening, compatibility, cleanup, and acceptance—not a new teacher-dashboard redesign.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2
   - Sections 3.1–3.16
   - Sections 4.1–4.5
   - Section 5
   - Section 6
   - Phase 7
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. docs/design-system-v1.md
8. Prompt 20 and the full WP-099 issue entry, audit, implementation, projection/read-model contracts, fixtures, tests, browser evidence, and production gate-off evidence
9. lib/teacher/teacherProgressProjection.js
10. lib/teacher/mapTeacherRosterArtifacts.js
11. lib/teacher/buildTeacherRosterReadModel.js
12. lib/teacher/teacherProgressFixtures.js
13. components/teacher/TeacherProgressFoundationDashboard.jsx
14. lib/dev/isTeacherProgressVisibilityFoundationEnabled.js
15. app/api/teacher/roster/route.ts and student-progress/route.ts
16. components/TeacherDashboard.js and every legacy teacher dashboard section/path
17. legacy `/api/teacher/dashboard`, `/api/teacher/overview`, and `/api/teacher/student` consumers
18. teacher notes, grading, assignment-settings, rollout, role/auth, and student membership helpers/APIs
19. student final PDF receipt and dashboard truth paths
20. all teacher authorization, privacy, read-model, projection, notes, grading, settings, accessibility, responsive, and production-denial tests

Create one new bounded issue, WP-100. Keep it Open during implementation and Needs Verification until production source cleanup, authenticated real-data API acceptance, teacher browser acceptance, anonymous/student denial, settings/notes/grading regression, responsive/keyboard checks, and clean production-bundle checks pass.

Do not reopen WP-099. Update older teacher/dashboard issues only with evidence this production promotion actually provides.

FIRST PROGRESS REPORT — PRODUCTION READINESS AUDIT

Before editing, report:

GATE AND FIXTURE AUDIT

- every use of `isTeacherProgressVisibilityFoundationEnabled`;
- every route/component that returns 404 or legacy UI while the gate is off;
- every fixture import, synthetic identity, panel action, query parameter, localStorage/cache value, dev-only branch, acceptance string, and test shortcut used by WP-099;
- which fixture code can remain development-only and which must be removed from production route dependency graphs;
- how production chunks and server bundles will be checked for synthetic identities/data.

AUTHORIZATION AND SCOPE AUDIT

- exact authentication/teacher-role check for every new and legacy teacher endpoint;
- whether role authorization occurs before any student query;
- exact assignment membership scope used by the roster read model;
- whether current data permits a teacher to see all application students or only students attached to the selected assignment;
- any unresolved teacher-to-class ownership limitation and the safest production behavior;
- service-role use and why it cannot bypass the route-level teacher/scope decision;
- response-cache headers and risk of one teacher receiving another teacher’s data;
- error/logging paths that might leak email, prose, notes, URLs, or artifact details.

READ MODEL AND COMPATIBILITY AUDIT

- every batch query and selected column in the production roster builder;
- optional/missing legacy table behavior;
- empty assignment vs query failure behavior;
- all current/legacy artifact versions and malformed/future-state behavior;
- receipt precedence and receipt-metadata mismatch behavior;
- current_module/activity conflicts and confidence projection;
- verified Doc without receipt behavior;
- notes, grading, settings, and rollout-control read/write paths;
- real-data students who have only legacy records, only current rebuilt artifacts, mixed records, or a final receipt;
- performance/query-count expectations for the current roster size and how to prevent N+1 regressions.

LEGACY RETIREMENT AUDIT

- every consumer of `/api/teacher/dashboard`, `/api/teacher/overview`, and `/api/teacher/student`;
- every piece of legacy TeacherDashboard state/UI not used by the WP-099 foundation;
- whether external/bookmarked links or Module 10 routes depend on legacy APIs;
- which legacy pieces can be deleted now, which require compatibility aliases, and which should remain temporarily with an explicit deprecation note;
- how removing duplicate truth will preserve notes, grading, and links;
- whether any historical quiz/checklist view needs to remain under the accepted Historical records disclosure.

PRODUCTION ACCEPTANCE PLAN

- how agent-owned acceptance will use an existing authenticated teacher and real database-backed student rows without production fixtures;
- how empty/partial/legacy/mixed/submitted cases will be tested without writing synthetic production data;
- safe local/mock integration coverage for cases not present in the real database;
- code/deployment rollback boundary;
- files expected to change and exact automated/browser plan.

Do not edit until production authorization, assignment scope, fixture removal, compatibility, legacy retirement, and real-data acceptance are explicit.

PRODUCTION DEFAULT

- Make TeacherProgressFoundationDashboard the normal TeacherDashboard implementation.
- Rename it to a non-foundation production name if appropriate.
- Remove `isTeacherProgressVisibilityFoundationEnabled` rather than changing it to return true.
- Remove legacy/foundation branching from TeacherDashboard.
- Enable `/api/teacher/roster` and `/api/teacher/student-progress` for authorized teachers in all environments.
- Remove runtime fixture branches/imports from production endpoints.
- Retain deterministic fixture builders only in dev/test-only dependency paths.
- Do not add a database setting, environment override, teacher-controlled toggle, or student-controlled switch.
- Prevent hydration from painting the legacy dashboard before switching to the production dashboard.

AUTHORIZATION, ASSIGNMENT SCOPE, AND PRIVACY

Every production teacher read/write route must:

- require an authenticated session;
- verify teacher role before querying student data;
- scope the request to an authorized assignment/membership boundary supported by current data;
- reject invalid/missing assignment or student identifiers;
- ensure a requested student belongs to the authorized assignment before detail access;
- return 401 for unauthenticated and 403 for unauthorized access without revealing roster existence;
- use least-data selects;
- apply `private, no-store` or equally safe response caching semantics;
- never log response bodies, student prose, source text, notes, private URLs, or artifact content;
- never return teacher notes in roster results;
- never return full prose in roster or default detail results;
- keep Doc/PDF URLs limited to explicit authorized detail/submission actions.

If the current schema cannot represent teacher-to-class ownership beyond a global teacher role and assignment membership, document that confidence limit and restrict to the current assignment. Do not invent class ownership or silently claim stronger isolation. Log a bounded follow-up issue only if a real authorization model gap remains.

AUTHORITATIVE ROSTER CONTRACT

Preserve the accepted projection:

- durable final receipt is highest-authority Submitted truth;
- verified Google Doc/guided APA state proves preparation, never submission;
- newest authoritative artifacts prove earned journey stages;
- current_module/activity orient but do not override stronger artifacts;
- legacy quiz/checklist rows are historical only;
- attention is explicit-only;
- inactivity, low practice score, advisory word count, or normal incomplete work never creates attention;
- disagreement produces documented unknown/attention state rather than false precision.

The production roster response must retain a stable schema/version. Validate/normalize every row server-side. Future/malformed artifact versions must not crash the roster.

REAL-DATA COMPATIBILITY

Support:

1. Assignment row only/no artifacts.
2. Legacy Module 1/9 quiz or checklist only.
3. Current Module 1 transfer state.
4. Module 2 evidence/direction without later artifacts.
5. Module 3 v1/v2 argument state.
6. Module 4 plans and Module 5 legacy/current outline.
7. Module 6 draft_meta legacy/current sentence moves.
8. Module 7 revised essay/word-count review.
9. Module 8 legacy final_ready/current verified Doc.
10. Module 9 legacy quiz/checklist/current guided state.
11. Verified Doc without final receipt.
12. Valid final receipt with stale progression.
13. Receipt metadata missing legacy file size/id.
14. Mixed legacy/rebuilt artifacts.
15. Malformed/future artifacts.
16. Missing optional legacy table.
17. Empty roster.
18. Partial query failure.

Never mutate or upgrade student records while rendering the teacher dashboard.

PROGRESS, SUBMISSIONS, SETTINGS, AND DETAIL

Preserve the accepted WP-099 information architecture and behavior:

- Progress is the default teacher job.
- Submissions is receipt-backed and keeps Google Doc separate.
- Settings preserves word-count and all four rollout controls.
- Advanced operational rollout controls remain clearly separated from normal student expectations.
- View student uses least-data detail, correct focus management, refresh, cache isolation, artifact trail, historical records, notes, grading, and authorized links.
- Status/attention meaning is never color-only.
- Mobile does not require horizontal scrolling through essential information.
- Empty/loading/error states remain distinct.

Do not introduce new teacher actions in promotion. No submission replacement, automated messaging, grading rubric, prose comments, or analytics.

NOTES AND GRADING SAFETY

- Notes must load/save for the selected authorized student only.
- Switching students must cancel/ignore stale requests and never show the prior student’s notes or detail.
- Notes save failure must preserve unsaved text and allow retry.
- Local fallback must not be used as production authority if the database route is available; audit existing behavior and make it honest.
- Grading status is enabled only when a durable final receipt exists.
- Grading updates must be server-authorized, validated to allowed values, recoverable on failure, and reflected in both Progress/Submissions detail consistently.
- No grading update may change submission receipt truth.

SETTINGS SAFETY

- All current settings remain database-backed in production.
- Word-count validation and prior-value preservation remain intact.
- All four rollout modes remain independent.
- Missing schema is a deployment/configuration error, not local fallback in production.
- Failed saves preserve prior confirmed value and show retry.
- Dashboard promotion must not write a setting simply because the Settings view rendered.

LEGACY CLEANUP

After proving parity:

- remove dead duplicate client state and UI from the old TeacherDashboard;
- remove unused duplicate overview/dashboard fetches;
- remove obsolete endpoints only when repository-wide search and tests prove no consumer;
- if an endpoint must remain for compatibility, make it call the same authoritative read model or clearly document its deprecation—do not maintain competing calculations;
- retain historical quiz/checklist metadata only under the accepted detail disclosure;
- remove “Phase 1/Phase 2” implementation labels from production teacher UI;
- keep developer fixtures/panel actions development-only.

AUTOMATED ACCEPTANCE

Add focused WP-100 tests for at least:

1. Production dashboard no longer depends on the development gate.
2. Fixture imports/identities are absent from production API dependency paths/chunks.
3. 401/403 occurs before student queries.
4. Assignment/student scope checks on roster and detail.
5. Private/no-store caching.
6. Roster schema normalization/version and malformed/future-state resilience.
7. Receipt precedence across all compatibility cases.
8. Explicit-only attention exclusions.
9. No full prose, source text, notes, private URLs, or raw responses in roster.
10. Least-data detail and no default final_text.
11. Batch-query/no-N+1 behavior.
12. Empty vs query failure vs optional legacy failure.
13. Real/legacy/mixed artifact fixture matrix.
14. Search/filter/sort/summary counts use the same projected rows.
15. Student-switch request isolation.
16. Notes failure preserves draft/retry and production authority is honest.
17. Grading allowed values, receipt gate, failure rollback, and receipt independence.
18. Settings values/API/source/failure behavior unchanged.
19. Legacy endpoint consumers are migrated or compatibility-routed to the authoritative model.
20. No render-time writes.
21. Existing WP-080, WP-084–099, teacher auth/dashboard/notes/grading/settings/rollout, accessibility, and responsive suites pass.

AGENT-RUN PRODUCTION ACCEPTANCE

Run a clean production build with no teacher-progress override and no dev fixture injection.

Using an existing authenticated teacher session and real database-backed rows, verify at 390×844 and 1440×900 plus keyboard and 200% zoom:

1. Production opens the new Progress view directly—no legacy flash.
2. Roster rows match authoritative database artifacts for at least one real in-progress/mixed student and one submitted student when available.
3. Submitted row matches the same final receipt/PDF as student dashboard and Module 9 receipt.
4. Verified Doc without receipt is not Submitted when such a case exists; otherwise prove through integration fixture tests.
5. Legacy quiz/checklist data does not determine current stage.
6. Search/filter/sort and summary counts remain consistent.
7. View student focus, refresh, artifact trail, historical records, link authorization, and cache isolation work.
8. Default detail response contains no full prose.
9. Notes save/retry and grading update/rollback work against authorized database rows without corrupting existing data; restore any acceptance-only status after the check.
10. Settings read database values; safe reversible save checks restore original values; rollout modes remain unchanged afterward.
11. Empty/loading/error states are distinct using mocked/integration acceptance without corrupting production data.
12. Anonymous receives 401; authenticated student receives 403; neither response leaks roster data.
13. Essential teacher work requires no horizontal scrolling; focus order and focus return are correct.
14. Production chunks contain no synthetic WP-099 identities/fixture payloads/panel actions in student/teacher bundles.
15. `/api/dev/panel` and reset remain denied/absent.
16. Server logs contain no new sensitive student/teacher content.

If the live database lacks a required compatibility case, do not create fake production students. Use executable server/integration fixtures for that case and clearly separate them from real-data browser evidence.

ROLLBACK ACCEPTANCE

Because no data shape changes, rollback is code-only. Demonstrate that:

- the prior production commit can still read all unchanged records;
- new dashboard reads/writes use existing notes/grading/settings schemas only;
- no WP-100 render created/modified student artifacts;
- reverting presentation does not require data cleanup;
- final receipts, notes, grading, and settings remain intact.

ACCEPTANCE CRITERIA

- New teacher dashboard is the production default with no gate or DB mode.
- One authoritative roster model replaces duplicate progress truth.
- Teacher/student authorization and assignment scope are enforced before reads.
- Roster and detail obey least-data/privacy boundaries.
- Receipt-backed submission truth matches student-facing receipt/dashboard.
- Legacy/current/mixed records project honestly without render-time mutation.
- Notes, grading, settings, rollouts, and links remain functional and recoverable.
- Legacy duplicate UI/APIs are removed or compatibility-routed without competing calculations.
- Mobile, desktop, keyboard, zoom, production, denial, and rollback acceptance pass.
- No production fixtures or sensitive logging.
- WP-100 records exact automated and real-data browser evidence before Resolved.

OUT OF SCOPE

- New teacher-to-class/section schema unless a separate authorization blocker is proven and approved.
- Assignment cloning/authoring.
- Rubric creation, automated grading, prose commenting, student messaging, or analytics.
- Inactivity monitoring or predictive risk.
- Submission replacement/deletion.
- Student-facing changes.
- Legacy instructional-path removal.
- Target-age/student usability sessions.

FIRST RESPONSE REQUIRED

Before editing, provide:

1. Complete gate/fixture/auth/scope/read-model/legacy audit.
2. Production default and fixture-removal plan.
3. Real-data compatibility matrix.
4. Legacy endpoint retirement/compatibility plan.
5. Authorization/privacy/caching plan.
6. Code rollback contract.
7. Files expected to change.
8. Automated, real-data browser, denial, and production acceptance plan.

Then implement, test, perform agent-owned production acceptance, update WP-100 and genuinely affected issue evidence, and report only irreducible subjective teacher-workflow judgment as a human remainder.
```
