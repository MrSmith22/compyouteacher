# Cursor Prompt 20 — Teacher Progress Visibility Foundation

Use this prompt only after WP-098 is Resolved and Phase 6 student-facing presentation is complete. This establishes a trustworthy, development-gated teacher-dashboard foundation before any production promotion.

```text
Rebuild the teacher dashboard’s information architecture as a development-gated foundation so a teacher can quickly see where each student is in the writing journey, what authoritative artifact exists, whether a final submission receipt exists, and which explicit problems need attention.

Preserve teacher notes, grading status, final PDF/Google Doc access, assignment settings, rollout controls, authentication, and all student data. This is a read-model and presentation foundation—not a new grading system, learning analytics product, student surveillance layer, or assignment-authoring redesign.

Do not infer struggle from time, score students’ writing, expose private work in the roster, or present legacy quizzes/checklists as current instructional truth.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2
   - Sections 3.1–3.16
   - Sections 4.1–4.5
   - Section 5 assignment configuration
   - Section 6 visual system and journey language
   - Phase 7 teacher configuration/assignment-cloning acceptance
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. docs/design-system-v1.md
8. WP-080, WP-084–WP-098 and every teacher/dashboard/assignment-settings/grading/notes issue in the issue log
9. components/TeacherDashboard.js in full
10. app/api/teacher/dashboard/route.ts, overview/route.js, student/route.js, notes/route.js, submissions/grade/route.ts, and all teacher settings/rollout routes
11. lib/supabase/helpers/teacherDashboard.ts, studentAssignments.ts, studentActivity.ts, studentDrafts.ts, studentBuckets.ts, studentOutlines.ts, studentExports.ts, and exported-doc helpers
12. all Module 1–9 authoritative artifact contracts and compatibility versions
13. lib/ui/writingJourneyStages.js and the accepted success/workspace contracts
14. TeacherWordCountSettings, TeacherWritingSpineRollout, TeacherEvidenceArgumentRollout, TeacherVocabularyTransferRollout, and TeacherSubmissionProtocolRollout
15. student dashboard receipt/final-PDF truth contract
16. existing teacher authorization, RLS/service-role, notes, grading, dashboard, API, privacy, responsive, and accessibility tests

Create one new bounded issue, WP-099. Keep it Open during implementation and Needs Verification until read-model tests, authorization/privacy tests, deterministic fixture acceptance, responsive/keyboard browser acceptance, and production gate-off checks pass.

Do not mark existing teacher issues Resolved unless their original acceptance criteria are actually tested. Do not create a migration or new table unless the audit proves an authoritative fact cannot be derived safely from current artifacts; default to no schema change.

FIRST PROGRESS REPORT — TEACHER DASHBOARD TRUTH AUDIT

Before editing, report:

CURRENT UI AND DATA PATHS

- every teacher dashboard section, table, filter, drawer/panel, settings control, note control, grading control, activity view, link, loading state, empty state, and error state;
- why the dashboard currently loads both `/api/teacher/dashboard` and `/api/teacher/overview`, where their rows disagree, and which should become authoritative;
- every client-side merge/fallback used to calculate student identity, current module, modules completed, final status, last activity, Google Doc, final PDF, quiz score, grading status, and submission time;
- every N+1 query, duplicate full-table query, transient client derivation, stale cache, or race;
- how returning/reloaded teacher sessions hydrate and whether data can shift after the first table paints;
- current mobile/table overflow, keyboard order, drawer focus/escape behavior, and screen-reader labels;
- how assignment settings and rollout controls compete visually with student-progress work.

ARTIFACT AUTHORITY AUDIT

For every Module 1–9 stage, list:

- authoritative artifact(s);
- compatibility/legacy artifact(s);
- completion/progression records;
- timestamps available;
- whether artifact presence proves started, in progress, stage completed, or neither;
- confidence limits;
- safe roster-level summary fields;
- detail-only fields;
- fields that must never be returned to the roster.

Explicitly audit:

- `student_assignments.current_module` and status;
- `student_activity_log`, including duplicate/missing history risk;
- Module 1 transfer state and historical quiz scores;
- Module 2 sources/evidence/direction;
- Module 3 evidence-to-argument state/thesis/proof plan;
- Module 4 buckets/plans;
- Module 5 outline and order;
- Module 6 draft sections/draft_meta;
- Module 7 final revised essay and whole-essay review;
- Module 8 verified Google Doc/current document identity;
- Module 9 guided APA state;
- legacy Module 9 quiz/checklist;
- final `student_exports` durable receipt;
- grading status and teacher notes.

Identify every current teacher-facing field that is misleading under the rebuilt production flows, especially:

- “Modules completed” derived only from activity-row count;
- Module 9 quiz score treated as current readiness;
- legacy checklist completion treated as formatting proof;
- `current_module` treated as stronger than a final receipt;
- final-ready Module 8 legacy state treated as a submission;
- “Completed” based on a link rather than a durable final-PDF row;
- duplicate/competing roster tables;
- “Phase 1/Phase 2” implementation labels exposed as product navigation.

ATTENTION AND PRIVACY AUDIT

List which explicit conditions can honestly support `Needs attention`, such as:

- progression ahead of a missing required artifact;
- current document mismatch or verified-document loss when that state is persisted;
- malformed/future-version artifact requiring recovery;
- failed durable save/upload state if actually persisted and teacher-visible;
- assignment configuration/schema failure affecting the student;
- receipt/file record inconsistency.

Do not infer `Needs attention` from inactivity, elapsed time, low word count in advisory mode, wrong practice answers, quiz score, incomplete ordinary work, or a student taking longer than peers.

Report:

- which APIs use service-role access and how teacher authorization is enforced before any student query;
- whether teacher access is scoped to an assignment/class roster or currently exposes every known user;
- the safest behavior given current assignment membership data;
- private fields currently over-fetched, logged, or returned to summary clients;
- how full prose, source text, private Doc URLs, notes, and receipt links will be limited to authorized detail views;
- required audit/logging boundaries without logging student work.

PROPOSED FOUNDATION

Before editing, specify:

- one authoritative server-side teacher roster read model;
- one pure progress projection with authority precedence and confidence limits;
- journey-stage/status taxonomy;
- attention taxonomy limited to explicit facts;
- roster vs detail field boundary;
- settings/progress/submission information architecture;
- development gate and deterministic teacher fixture strategy;
- files expected to change and exact automated/browser plan.

Do not edit until receipt authority, stage authority, privacy boundary, and honest attention criteria are explicit.

ONE AUTHORITATIVE TEACHER READ MODEL

Replace duplicate `/dashboard` + `/overview` client merging with one authenticated, server-built read model for the new foundation.

The server read model must:

- verify an authenticated teacher role before querying student data;
- scope students to the current assignment using the best existing membership authority;
- batch-query required artifact metadata with no per-student N+1 requests;
- select only fields needed for roster projection;
- never return full essay prose, quotation text, source contents, response bodies, private notes, or private URLs in the roster response;
- use the durable final-PDF receipt as highest-authority terminal state;
- include freshness timestamps and source/confidence metadata needed for honest presentation;
- degrade safely when optional legacy tables are missing;
- distinguish query/configuration failure from an empty roster;
- avoid logging student data;
- remain read-only.

Keep a separately authorized detail endpoint for one selected student. It may return the minimum artifact metadata and teacher-authorized links needed for teaching/review, but must not eagerly load full prose until the teacher explicitly opens the detail. Audit whether full Module 8 final_text is necessary; omit it from the default detail payload if artifact metadata is sufficient.

Do not create a materialized progress table for convenience. Derive the view from accepted artifacts unless performance evidence proves a separate read model is necessary.

PURE PROGRESS PROJECTION

Create a pure, versioned teacher progress projection that returns at least:

- student identifier suitable for the authorized roster;
- assignment id/name;
- overall status: not started | in progress | ready for next stage | submitted | needs attention;
- current shared journey stage: Understand | Read and notice | Develop an argument | Plan | Draft | Revise | Prepare | Submit;
- module/current task label only when authoritative;
- latest meaningful activity timestamp and its source;
- compact artifact trail with present/complete/attention/unknown states;
- verified Google Doc availability (not the private URL in roster);
- durable final receipt availability and submitted timestamp;
- grading status only when a final receipt exists;
- explicit attention reasons and safe next teacher action;
- confidence/unknown state when artifacts disagree.

Authority precedence must include:

1. Durable final PDF receipt = Submitted regardless of stale current_module/activity.
2. Verified/current Google Doc and guided protocol state may prove Prepare/Submit progress but not submission.
3. Newest revised essay/draft/outline/plan/argument/evidence artifacts prove their earned stages according to accepted contracts.
4. `student_assignments.current_module` and activity help orient but cannot override stronger artifacts.
5. Legacy quiz/checklist rows are historical metadata only.
6. Missing/conflicting data produces Unknown or Needs attention only under documented explicit rules.

Do not compute “modules completed” by counting activity rows. If a completion count is shown, derive it idempotently from distinct modules plus stronger terminal artifacts and label its confidence; preferably show the shared journey stage instead.

TEACHER DASHBOARD INFORMATION ARCHITECTURE

Build the foundation around three clear teacher jobs:

1. Student progress — roster orientation and current stage.
2. Submissions/review — durable receipts, grading status, and artifact links.
3. Assignment settings — word-count expectations and independent rollout controls.

Use accessible tabs, segmented navigation, or another clear non-route structure appropriate to the current app. Do not render all settings controls above the roster by default.

STUDENT PROGRESS VIEW

Provide:

- one clear page H1 and assignment context;
- compact class summary counts derived from the same roster projection;
- search;
- filters for All, In progress, Needs attention, Ready/Preparing, and Submitted, using honest projection states;
- sortable/fixed roster ordering with a documented default (attention first only if attention is explicit; otherwise stage/freshness or student name);
- student identifier;
- current journey stage and concise current-work label;
- latest meaningful update;
- compact artifact trail or progress visualization that does not imply false precision;
- submission/receipt status;
- clear View student action.

Do not show Module 1 or Module 9 quiz scores as primary progress. If legacy scores remain useful to teachers, place them under a labeled `Historical records` disclosure in student detail with a note that they do not control the rebuilt pathway.

NEEDS-ATTENTION PRESENTATION

- Use explicit reason text, not a red badge alone.
- Explain what the teacher can do: ask the student to reopen a step, inspect a document mismatch, retry configuration, or contact support, according to actual system capability.
- Do not prescribe punitive intervention or imply the student failed.
- Do not expose internal table/schema/version names.
- Do not create a needs-attention status for ordinary incomplete work.

STUDENT DETAIL

On explicit View student:

- trap/manage focus correctly and return focus to the invoking control on close;
- show current journey stage and projection confidence;
- show a compact artifact trail with timestamps and honest missing/unknown states;
- show Google Doc and final PDF/receipt actions only when authorized artifacts exist;
- preserve grading-status control for submitted work;
- preserve teacher notes and save/retry status;
- show recent meaningful activity without dumping raw event noise;
- place legacy quizzes/checklists under Historical records;
- provide refresh with clear loading/error behavior;
- avoid showing full student prose by default;
- never expose one student’s cached detail after selecting another.

SUBMISSIONS/REVIEW VIEW

Provide a concise receipt-backed list:

- Submitted / Not submitted based on final receipt only;
- submitted timestamp;
- filename/size/status when authorized and available;
- Open final PDF and View receipt actions tied to the same submission;
- grading status and update behavior;
- Google Doc link as a separate preparation artifact, never evidence of submission;
- explicit mismatch/recovery when receipt metadata is incomplete.

Preserve the existing no-replacement/resubmission policy. Do not add a teacher resubmit/delete/replace action in this task.

ASSIGNMENT SETTINGS VIEW

- Preserve TeacherWordCountSettings and all four independent rollout controls.
- Group them under clear `Student expectations` and `Instructional pathway controls` sections.
- Explain that rollout controls are operational and independent without exposing implementation jargon to ordinary teachers.
- Keep current save/retry/database-source behavior.
- Do not alter values, APIs, migrations, or rollout precedence.
- Consider placing advanced rollout controls in a clearly labeled advanced disclosure if normal classroom teachers do not need them frequently.

VISUAL AND RESPONSIVE CONTRACT

Reuse the accepted design system, semantic status/action colors, teacher voice, journey stages, and success/dashboard patterns without making the teacher dashboard look like a student lesson.

- Desktop roster uses available width with readable columns.
- At 390×844, use cards or a deliberate responsive table alternative; do not require horizontal scrolling through essential data.
- Filters/search/actions remain reachable and labeled.
- Status is never color-only.
- One primary action per local context.
- Settings and roster do not compete in the same first viewport.
- Empty/loading/error states are distinct and actionable.
- Keyboard order follows visual order.
- 200% zoom remains usable.

DEVELOPMENT GATE AND FIXTURES

Place the new teacher-dashboard presentation/read-model client path behind one development-only foundation gate. Production retains the existing teacher dashboard until later promotion.

The gate must:

- be presentation/read-path only;
- never alter student artifacts, notes, grading, settings, or rollout values;
- not be teacher-query-param or localStorage controlled;
- keep the legacy production dashboard functioning;
- use one clear helper;
- keep synthetic fixture controls out of production.

Create deterministic development fixtures covering at least:

1. not started;
2. in progress at each shared journey stage;
3. valid current artifact with stale current_module;
4. current_module ahead of missing artifact;
5. verified Google Doc but no receipt;
6. durable submitted receipt with stale progression;
7. receipt metadata mismatch/incomplete legacy size;
8. legacy quiz/checklist only;
9. grading states;
10. no activity timestamp;
11. malformed/future artifact state;
12. empty roster and API failure.

Use synthetic identities/data only. Never write fixtures into production tables or bundles.

AUTOMATED ACCEPTANCE

Add focused WP-099 tests for at least:

1. Progress projection authority precedence.
2. Durable receipt always wins terminal status.
3. Legacy quiz/checklist never certifies current stage or submission.
4. Distinct module completion behavior avoids duplicate activity counts.
5. Explicit attention rules and no inactivity/low-score inference.
6. Unknown/conflicting artifact handling.
7. Journey-stage mapping across all Modules 1–9.
8. Roster response excludes full prose, source text, notes, private URLs, and raw response bodies.
9. Detail authorization and least-data behavior.
10. Teacher-only 401/403 enforcement before student queries.
11. Batch-query/no-N+1 behavior.
12. Empty vs failure response distinction.
13. Search/filter/sort summary consistency.
14. Submission list uses receipt truth and same PDF/receipt identity.
15. Notes and grading behavior remain unchanged.
16. Settings/rollout controls retain values and API behavior.
17. Detail focus/close/refresh/cached-student isolation.
18. Gate is development-only; production retains legacy dashboard.
19. No fixture strings/data in production chunks.
20. Existing teacher auth, dashboard, notes, grading, settings, rollout, WP-080, WP-084–098, and accessibility tests remain green.

AGENT-RUN BROWSER ACCEPTANCE

Use deterministic synthetic teacher fixtures at 390×844 and 1440×900, plus keyboard and 200% zoom.

Verify:

1. Teacher signs in and unauthorized student/anonymous access receives 403/401 without roster data.
2. Progress view first viewport shows assignment, summary, filters/search, and roster—not a wall of settings.
3. Every fixture maps to the correct honest stage/status.
4. Receipt overrides stale progression.
5. Verified Doc without receipt is not Submitted.
6. Legacy quiz/checklist-only student is not falsely complete.
7. Needs attention appears only for explicit fixture problems and includes a safe teacher action.
8. Search/filter/sort preserve row truth.
9. View student opens the correct student, manages focus, shows artifact trail, and does not preload/show full prose.
10. Switching students never leaks the prior student’s cached detail.
11. Notes save/retry and grading status update/rollback work.
12. Submission PDF and receipt actions reference the same final export; Google Doc is separate.
13. Settings preserve word-count and rollout values through refresh and failed-save recovery.
14. Empty roster, API failure, optional legacy-table failure, and refresh states are distinct.
15. No essential horizontal scrolling, clipped actions, inaccessible drawer, or color-only status.
16. Production build retains the current teacher dashboard under gate-off.
17. `/api/dev/panel` and fixture endpoints are denied/absent in production; no synthetic identities in chunks.

Record a machine-readable matrix and representative screenshots. Human review may assess whether density and labels fit teacher workflow, but the agent owns truth, privacy, authorization, responsiveness, keyboard, and behavior.

ACCEPTANCE CRITERIA

- One authoritative server roster read model replaces duplicate client truth in the foundation path.
- One pure projection explains stage/status authority and confidence.
- Final receipt is highest-authority submission truth.
- Roster shows useful progress without exposing full student work.
- Needs attention uses explicit conditions only.
- Student detail, notes, grading, submissions, and settings remain functional.
- Legacy quizzes/checklists are historical, not current gates.
- Teacher authorization and least-data boundaries pass.
- Mobile, desktop, keyboard, zoom, empty/error, refresh, and production gate-off checks pass.
- No new DB table/mode is introduced without proven necessity.
- WP-099 records implementation and evidence before Resolved.

OUT OF SCOPE

- Production promotion of the new teacher dashboard.
- Assignment creation/cloning or multiple-course management.
- New grading rubric, automated grading, comments on prose, or student messaging.
- Inactivity alerts, behavior monitoring, comparative ranking, or predictive analytics.
- Submission replacement/deletion.
- Student-facing UI changes.
- New database progress/materialized-view tables without an approved follow-up.
- Phase 7 target-age/classroom usability sessions.

FIRST RESPONSE REQUIRED

Before editing, provide:

1. Complete current UI/data/authority/privacy audit.
2. Authoritative roster read-model design.
3. Pure progress projection and precedence table.
4. Explicit attention taxonomy and exclusions.
5. Roster/detail/settings information architecture.
6. Development gate and fixture plan.
7. Files expected to change.
8. Automated and browser acceptance plan.

Then implement, test, perform agent-owned browser acceptance, update WP-099 and genuinely affected issue evidence, and report only irreducible subjective teacher-workflow judgment as a human remainder.
```
