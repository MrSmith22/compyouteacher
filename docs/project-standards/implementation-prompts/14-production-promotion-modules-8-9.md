# Cursor Prompt 14 — Production Promotion of the Modules 8–9 Guided APA Protocol

Use this prompt only after WP-092 is Resolved. This promotes the accepted Phase 5 Module 8–9 protocol to production. It is a rollout, compatibility, operations, and production-acceptance task—not another instructional redesign.

```text
Promote the accepted WP-092 Module 8–9 guided APA protocol from development-only execution to the real production path, with one authoritative assignment-owned rollout decision, compatibility for every legacy and rebuilt preparation state, rollback without data loss, remote migration/preflight readiness, and complete acceptance against an actual production build.

WP-080 and WP-092 are accepted. Preserve:

- Module 8’s one authoritative create/update/verify/open/continue Google Doc path;
- Module 9’s See → Understand → Do → Check → Fix → Confirm formatting moves;
- the assignment-owned requirements contract and APA/teacher/assignment distinctions;
- the community-gardens canonical model;
- semantic move-id state, document-signature invalidation, stale-write protection, save/retry behavior, and phase resolution;
- the eight numbered PDF download steps;
- the distinct five-item PDF inspection;
- client/server PDF validation, durable upload, persistent receipt, and dashboard consistency.

Do not redesign instruction, formatting requirements, the model paper, PDF upload, receipt, grading, or Modules 1–7.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2 and 3.1–3.16
   - Sections 4.1–4.5
   - Modules 8–9 and Dashboard
   - Phase 5 and its exit condition
   - Epics F–G
   - Sections 6.4–6.5
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. WP-002, WP-004–007, WP-009–011, WP-028–047, WP-067–072, WP-080, WP-084, WP-085, and WP-092 in docs/project-standards/walkthroughs/issue-log.md
8. Prompt 01 / WP-080 implementation, migration, tests, production receipt, and dashboard evidence
9. Prompt 13 / WP-092 implementation, migration, tests, seed variants, browser fixes, and acceptance evidence
10. Prompts 06, 09, and 12 production-rollout patterns, migrations, preflights, teacher/ops APIs, caches, overrides, rollback tests, runbooks, and production-build acceptance
11. lib/dev/isGuidedApaProtocolEnabled.js
12. components/ModuleEight.js, ModuleNine.js, ModuleEightGuidedApaDocPanel.jsx, GuidedApaProtocolFlow.jsx, and GuidedApaCanonicalModel.jsx
13. guidedApaRequirementsContract.js, guidedApaMoves.js, and guidedApaProtocolState.js
14. `/api/module9/guided-apa-protocol` and `module9GuidedApaProtocol.ts`
15. Module 8 draft/success/progression, Module 9 gate/success, `module9_quiz`, `module9_checklist`, and `module9_guided_apa_protocol`
16. Google Doc export/verification/recovery, `exported_docs`, final PDF, receipt, dashboard, and activity paths
17. assignment_settings and all existing independent rollout modes/APIs
18. deployment configuration, production build scripts, dev-tool denial tests, and relevant runbooks

Create one new bounded issue, WP-093. Do not reopen WP-080 or WP-092. Keep WP-093 Open during implementation and Needs Verification until remote migration, database-backed mode confirmation, production-build browser acceptance, rollback, compatibility, failure-path, and dev-tool denial checks all pass.

FIRST PROGRESS REPORT — PRODUCTION READINESS AUDIT

Before editing, report:

- every `NODE_ENV`, development gate, seed, fixture variant, dev panel action, localhost assumption, query parameter, local storage value, test identity, or browser-only switch controlling the WP-092 path;
- every Module 8/9 component, helper, route, success screen, gate, completion action, and dashboard/receipt consumer that can disagree about whether the guided protocol is enabled;
- the exact authoritative artifact chain from Module 7 newest essay through Module 8 verified Google Doc, Module 9 semantic protocol, selected/validated PDF, durable submission receipt, and dashboard;
- all persisted state shapes and tables involved:
  - Module 7/8 draft/final records;
  - `exported_docs` and document verification data;
  - legacy Module 8 checklist/confidence/local state;
  - `module9_quiz`;
  - legacy `module9_checklist` positional booleans;
  - `module9_guided_apa_protocol` schema-v1 semantic JSON;
  - final `student_exports` receipt;
  - progression/activity records;
- how new and returning students hydrate at every Module 8/9 boundary;
- how already-submitted students bypass preparation and how direct receipt/dashboard reopen works;
- how Module 8 updates/replaces a Doc and how guided state is invalidated against the document identity/signature;
- every compatibility case that could cause replay, false completion, skipped instruction, stale formatting certification, duplicate Doc creation, lost semantic state, or an incorrect upload gate;
- whether server/client decisions can split because Module 8/9 currently call a synchronous development gate while the guided API separately gates itself;
- how the existing production resolvers expose assignment-owned capabilities to server and client code and which pattern is safest here;
- why the new rollout must remain independent from `writing_spine_mode`, `evidence_argument_mode`, and `vocabulary_transfer_mode`;
- the smallest authoritative rollout and rollback contract;
- required `assignment_settings` migration, allowed values, remote DDL, RLS/service-role implications, authenticated teacher/ops read/write path, and missing-schema behavior;
- how production-build acceptance will use authenticated state without enabling production seed endpoints;
- production logs/observability needed without recording essay text, formatting selections, source/citation text, filenames beyond accepted receipt behavior, or private document URLs;
- files expected to change and exact automated/browser acceptance plan.

Do not edit until one rollout source of truth, compatibility precedence, rollback, migration, preflight, and production acceptance harness are explicit. Do not replace the development gate with `true`.

PROBLEM TO SOLVE

WP-092 is accepted but `isGuidedApaProtocolEnabled` still requires `NODE_ENV === "development"`. Production therefore retains the repeated Module 8 formatting/readiness checklists and Module 9 recognition quiz/checklist flow.

Promotion must make the accepted guided protocol authoritative for the current MLK assignment while:

- preserving every valid finished essay, Google Doc, legacy checklist/quiz record, guided semantic state, selected PDF, receipt, and progression record;
- preventing duplicate document/export paths;
- avoiding forced replay for completed or already-submitted students;
- adapting historical state honestly rather than treating old checked boxes as proof;
- keeping the four instructional rollout controls independent;
- keeping all development infrastructure inaccessible;
- failing recoverably when settings or persistence are unavailable;
- supporting operational rollback without deleting guided state;
- restoring the same semantic state when rebuilt mode is re-enabled.

TARGET PRODUCTION OUTCOME

For `mlk-rhetorical-analysis` in production:

- Module 8 owns one verified current Google Doc and no APA checklist;
- Module 9 consumes that Doc without a duplicate export ritual or empty Continue-only page;
- the student resumes at the first honest incomplete formatting move;
- semantic progress persists through refresh, direct reopen, and new authenticated session;
- help/fix state, active move, definitive document inspection, and invalidation survive;
- legacy Module 8/9 histories remain readable but do not falsely certify formatting;
- updating/replacing the Doc invalidates only the appropriate confirmations;
- the guided API is available only to authenticated students when the assignment is in rebuilt mode;
- PDF download, validation, inspection, upload, receipt, and dashboard remain trustworthy;
- already-submitted students see the durable receipt/completion path rather than preparation replay;
- rollback to legacy changes presentation only;
- returning to rebuilt restores the same guided state and receipt.

ONE AUTHORITATIVE, INDEPENDENT ROLLOUT CONTRACT

Replace direct development-only instructional gating with one assignment-owned resolver shared by:

- Module 8 page and completion gate;
- Module 8 success/Module 9 transition where relevant;
- Module 9 page, journey/phase resolution, and upload gate;
- guided protocol API;
- Module 9 success/receipt and dashboard only where a capability decision is actually needed;
- teacher/ops controls;
- tests and preflight.

The resolver must:

- distinguish at least `legacy` and `rebuilt` submission-protocol modes;
- resolve one authoritative mode for the assignment;
- explicitly enable `rebuilt` for the current MLK assignment only after migration/readiness checks;
- default unknown assignments safely;
- distinguish missing schema from a legitimate missing row/default;
- support authenticated teacher/ops rollback and a deployment-level emergency override if consistent with prior rollout architecture;
- preserve all guided and legacy state during rollback;
- be testable in development, test, and production builds;
- never depend on Developer Testing Panel, seeds, localhost, local storage, or a student-controlled value;
- expose only the needed capability to client components;
- avoid client/server split brain during initial load and refresh;
- remain independent from all earlier rollout modes.

Prefer an unambiguous setting such as `submission_protocol_mode` or `guided_apa_mode`. Choose one name and use it consistently. Do not overload `writing_spine_mode` merely because Modules 8–9 follow Module 7.

MIGRATION REQUIREMENTS

Add an idempotent migration that:

- adds the independent allowed rollout column to `assignment_settings`;
- constrains values to `legacy` / `rebuilt`;
- explicitly enables rebuilt for `mlk-rhetorical-analysis`;
- preserves word-count, writing-spine, evidence-argument, and vocabulary-transfer settings;
- does not alter or clear `module9_guided_apa_protocol`, `module9_checklist`, `module9_quiz`, `exported_docs`, drafts, or final submissions;
- retains RLS/service-role boundaries;
- comments the rollback contract;
- is safe to apply more than once.

Add authenticated teacher/ops GET/PATCH support and include the student-readable resolved capability in the existing assignment-rollout response without breaking prior fields.

Missing rollout schema is a deployment error, not silent permission to choose either path. Production must never fall back to `.dev-assignment-settings.json`.

Do not mark WP-093 Resolved until the remote database reports the MLK setting as `rebuilt`, `source=database`, and `schemaOk=true` with all other modes unchanged.

SERVER/CLIENT CAPABILITY HYDRATION

Avoid rendering one protocol and switching to another after local state has begun saving.

- Prefer server-resolved capability passed into Module 8/9 or one authenticated hydration gate that blocks only until the authoritative decision is known.
- Cache only according to the accepted rollout architecture and never let a stale cache override a confirmed database mode.
- Guided API GET/POST must use the same server resolver as the pages.
- Configuration failure shows a recoverable preparation state; it does not silently mount legacy and then guided, or vice versa.
- Upload and completion gates must use the same resolved mode as the visible flow.
- Success/receipt truth remains artifact-driven; an existing final receipt does not depend on a rollout read to remain accessible.

LEGACY AND RETURNING-STUDENT COMPATIBILITY

Build/retain pure adapters at artifact boundaries. Do not mutate historical records on render and never convert a legacy checkbox into proof it cannot establish.

Required cases:

1. New student entering Module 8 with a finalized Module 7 essay.
2. Existing current verified Google Doc and no Module 8 finalization.
3. Existing stale, mismatched, unavailable, or replaced Google Doc.
4. Legacy Module 8 six-item checklist partly or fully checked.
5. Legacy Module 8 five-item confidence checklist partly or fully checked.
6. Module 8 already finalized/progression already at 9.
7. Legacy Module 9 recognition lesson partially completed.
8. `module9_quiz` submitted with any score.
9. Legacy six-item `module9_checklist` partly or fully checked.
10. Guided schema-v1 state at every formatting move/status.
11. Guided `needs_help` / `fixed` / document-inspection / ready-for-PDF states.
12. Guided state confirmed against an older document signature.
13. Selected PDF in the current browser session.
14. Failed upload with selected PDF/check state.
15. Durable final PDF receipt already present.
16. Student already returned to dashboard after submission.
17. Malformed, partial, timestamp-less, stale-client, or future-version guided state.
18. Rebuilt → legacy → rebuilt at all major boundaries.

Compatibility rules:

- final receipt is highest-authority terminal state and never requires preparation replay;
- Module 8 completion/progression remains valid after ownership changes;
- existing current Google Doc is reused and verified, not automatically recreated;
- legacy checks/quiz are preserved as historical metadata only;
- old checked boxes may influence a concise reorientation but never auto-complete rebuilt formatting moves;
- do not create fake `module9_quiz` scores for rebuilt students;
- schema-v1 guided state resumes losslessly;
- malformed/future state opens a recoverable review state, never a crash or invented completion;
- document-signature change keeps history and invalidates affected confirmations through accepted WP-092 semantics;
- stale client writes remain rejected without erasing fresher server state;
- rollout changes presentation only and never delete any artifact;
- state upgrades occur through authenticated normal saves, not render-time writes;
- document confidence limits and legacy removal criteria.

MODULE 8 PRODUCTION REQUIREMENTS

- Use the accepted Doc-only guided panel.
- Resolve the newest Module 7 essay using the accepted WP-084 precedence.
- Create/update the one existing authoritative Google Doc path.
- Verify newest essay content before progression.
- Show honest Creating / Verifying / Ready / Needs attention states.
- Keep Open Google Doc, Continue, metadata, and targeted recovery visible.
- Keep template/full essay/resources secondary.
- Do not show or gate on the old Module 8 APA checklist or confidence checklist in rebuilt mode.
- Updating/replacing a Doc must emit a stable verification/document signature usable by Module 9 invalidation.
- Module 8 completion remains idempotent and routes through its accepted success/progression path.

MODULE 9 PRODUCTION REQUIREMENTS

- Consume the Module 8 document; do not create a competing normal export path.
- If the current Doc is verified, enter the first incomplete guided move immediately.
- Preserve the accepted requirements contract, model, move sequence, labels, Google Docs steps, reference guide, help/fix actions, and semantic persistence.
- Preserve APA accuracy decisions including 1963a/1963b handling; do not simplify them during promotion.
- Resume/save against authoritative state and reject stale autosaves.
- Resolve phase correctly when Doc readiness hydrates after state.
- Keep historical quiz/checklist data non-gating.
- Definitive Google Doc inspection remains distinct from PDF inspection.
- Guided completion unlocks PDF phase without relying on a fake quiz submission.
- A settings/save failure keeps student work and provides retry.
- Upload gates match the visible guided state and accepted PDF checks.

PDF, RECEIPT, AND DASHBOARD SAFETY

Do not alter the accepted WP-080 trust contract except to fix a demonstrated regression:

- validate metadata and `%PDF` payload client-side and server-side;
- reject empty/non-PDF/malformed files;
- display tiny files in bytes/KB;
- retain selected file and checks on recoverable upload failure where browser behavior allows;
- do not show received before durable storage/database success;
- success route is a persistent receipt with filename, time, size, id, status, PDF link, trail, and next step;
- refresh/direct receipt reopen returns the same details;
- missing receipt shows recovery rather than false success;
- dashboard status appears once and links to the same final PDF/receipt;
- completion activity remains idempotent.

FAILURE AND ROLLBACK CONTRACT

- Missing rollout or guided-state schema is a deployment error with a recoverable UI.
- Missing assignment row follows the documented safe default without production local fallback.
- Temporary configuration failure does not select a different protocol silently.
- Guided GET/POST failure preserves active state and offers retry.
- Stale writes return fresher state and never overwrite it.
- Session expiry asks for sign-in/retry without losing current browser input.
- Google Doc verification failure stays in targeted recovery.
- Upload failure stays on Module 9 with honest status.
- Rollback changes presentation only; it does not delete guided state, legacy history, Google Docs, checklist/quiz rows, PDFs, receipts, or progression.
- Rebuilt → legacy → rebuilt restores the same semantic-state fingerprint and terminal receipt.
- Rollback of Modules 8–9 does not alter Modules 1–7 rollout modes.
- Structured logs may include assignment id, safe internal ids, resolved mode, schema version, active move id, adapter kind, document-signature hash, and error code—but never essay text, citation text, external Doc URL, student formatting response, or credentials.

READ-ONLY PREFLIGHT AND RUNBOOK

Provide an agent-runnable WP-093 preflight that checks:

- all `assignment_settings` rollout columns exist remotely;
- MLK has explicit rebuilt submission-protocol mode;
- source is database and schema is healthy;
- word-count and Modules 1–7 rollout modes remain unchanged/rebuilt as expected;
- `module9_guided_apa_protocol` exists and is readable;
- required draft, exported-doc, legacy checklist/quiz, final export, receipt, and progression structures are readable;
- service-role access works only where needed;
- RLS/unauthenticated access is denied appropriately;
- invalid/unknown mode writes are rejected;
- guided schema-version/state shapes can be summarized without exposing student content;
- final receipt schema including file size remains healthy;
- no production environment depends on WP-092 seeds, panel, dev auth, query switches, or local settings files.

The preflight is read-only unless explicitly invoked with a reviewed enable/apply option. Produce concise PASS/FAIL output suitable for the issue log.

Add a production rollout runbook covering:

- migration/apply command or SQL;
- preflight;
- enable/verify;
- rollback and restoration;
- state/data invariants;
- common failure recovery;
- how to confirm other rollout modes were not changed.

If remote DDL cannot be applied automatically, provide one minimal idempotent SQL operation and leave WP-093 Needs Verification until Jason applies it. Cursor owns every other check.

PRODUCTION ACCEPTANCE DATA

Development seeds stay development-only. For actual production-build acceptance, use authenticated APIs and isolated/reversible test-account state. Do not create a production seed endpoint.

Cover:

- new Module 8 student;
- existing verified/stale/unavailable Doc;
- legacy Module 8 partial/complete checklist state;
- Module 8 already complete;
- legacy Module 9 partial quiz/checklist;
- every representative guided move/status;
- `needs_help` → fix → resume;
- ready-for-PDF and asynchronous Doc readiness;
- document update/signature invalidation;
- stale autosave race;
- invalid/valid PDF and failed/successful upload;
- durable receipt and dashboard;
- already-submitted student;
- rollback round trip;
- settings/state API failure.

AUTOMATED ACCEPTANCE

Add executable tests proving:

1. override/stored/default rollout precedence;
2. one shared capability decision across Module 8, Module 9, guided API, completion, upload, and transition;
3. unknown assignment safe default;
4. missing schema differs from missing row;
5. invalid mode rejection;
6. production never uses local settings fallback;
7. rollout modes remain independent;
8. development panel/seeds/bypasses remain inaccessible in production;
9. rebuilt Module 8 contains only Doc create/update/verify/open/continue;
10. rebuilt Module 9 contains guided moves and no recognition-quiz/checklist gate;
11. legacy Module 8/9 records remain compatible and non-destructive;
12. schema-v1 guided state resumes at every boundary;
13. stale writes cannot overwrite fresher state;
14. late Doc readiness selects the correct guided phase;
15. document update invalidates appropriate confirmations;
16. rollback preserves semantic-state fingerprint;
17. rebuilt restoration resumes the same state;
18. final receipt bypass remains authoritative across modes;
19. no fake quiz score is written for guided completion;
20. Module 8 progression remains idempotent;
21. WP-080 client/server validation and persistent receipt remain green;
22. dashboard PDF/receipt matches submission;
23. settings/state/save/upload failures preserve recoverability;
24. actual production build succeeds without dev UI or seed strings in student surfaces/bundles;
25. production dev endpoints safely deny access.

Run focused WP-002/WP-004–007/WP-028–047/WP-067–072/WP-080/WP-092–093 tests, proportional Module 7–9 handoff suites, dashboard/submission tests, rollout/settings tests, preflight, and a real production build.

AGENT PRODUCTION-BUILD BROWSER ACCEPTANCE — REQUIRED

Cursor owns routine acceptance. Run an actual production build/server without a forced rebuilt override for final database-backed acceptance. Authenticate through the real supported test/session path and verify at 390×844 and 1440×900:

1. MLK resolves to rebuilt submission protocol from the remote database.
2. No Developer Testing Panel, WP-092 seed/variant, dev identity, or bypass appears.
3. Module 8 new/current Doc path creates or updates and verifies the newest essay.
4. Module 8 shows no formatting/readiness checklist and advances through success.
5. Module 9 consumes the same Doc without duplicate export or empty Continue-only page.
6. Every guided formatting move and canonical-model locus renders correctly.
7. **Help me fix it** → **I fixed it** → refresh resumes correctly.
8. A fresh authenticated session loads the same semantic state.
9. Legacy quiz/checklist history opens honestly without false completion.
10. Updating/replacing the Doc invalidates appropriate confirmations.
11. Simulated stale autosave cannot overwrite fresher state.
12. Late Doc readiness opens the correct phase, not completed Doc inspection.
13. Definitive Google Doc inspection repairs one failed move locally.
14. Eight numbered PDF steps and five distinct inspection items remain visible.
15. Empty/non-PDF/malformed PDF is rejected; tiny valid PDF displays correctly.
16. Simulated upload failure stays recoverable.
17. Valid upload produces durable receipt; refresh/direct reopen matches.
18. Dashboard links to the same final PDF and receipt.
19. Already-submitted state bypasses preparation truthfully.
20. Rollback rebuilt → legacy → rebuilt preserves guided state, Google Doc, final receipt, and all other rollout modes.
21. Configuration/state API failures show recovery without switching protocol silently.
22. Production dev endpoints return safe denial.
23. Keyboard/focus order is logical; active task is primary; actions are at least 44px; no horizontal overflow.

Use browser automation, authenticated API/database inspection, executable tests, and Google Docs verification wherever possible. Jason performs only remote DDL if no authorized automated path exists. Do not assign routine clicking, responsive checks, refresh tests, or file tests to him.

WP-093 CLOSURE EVIDENCE

Before marking Resolved, report:

1. rollout resolver, name, and precedence;
2. migration id and remote database-backed evidence;
3. independent-mode evidence;
4. preflight results;
5. legacy/schema-v1/receipt compatibility matrix;
6. rollback round-trip/state fingerprint evidence;
7. production build result;
8. automated test totals;
9. production browser scenarios and viewport evidence;
10. Google Doc identity/invalidation evidence;
11. WP-080 PDF/receipt/dashboard regression evidence;
12. production dev-tool denial evidence;
13. WP-004/WP-006 and other directly satisfied issue updates;
14. any genuinely human-only remainder.

FIRST RESPONSE AFTER READING

Return:

1. governing sections read;
2. every development-only gate/nonproduction assumption found;
3. Module 7→8→9→receipt→dashboard production artifact/hydration map;
4. proposed authoritative rollout and rollback contract;
5. migration/preflight/runbook plan;
6. legacy/guided/receipt compatibility rules and confidence limits;
7. files expected to change;
8. automated and production-browser acceptance plan;
9. explicit out-of-scope boundaries.

Then implement, verify, fix every acceptance finding, update WP-093 and directly satisfied prior issues with production evidence, and report closure. Do not mark WP-093 Resolved before remote database-backed mode confirmation and actual production-build acceptance pass.

OUT OF SCOPE

- redesigning the accepted WP-092 instruction, canonical model, requirements, move sequence, or semantic state;
- changing Modules 1–7 instruction or their rollout modes;
- changing final PDF storage, grading, or resubmission policy;
- broad dashboard redesign;
- app-wide visual/success-system redesign;
- deleting legacy Module 8/9 code before a stable production period;
- automatically inspecting Google Doc styling beyond what the API can establish;
- fabricating source/citation metadata;
- coupling Module 8–9 rollback to any earlier rollout mode.
```
