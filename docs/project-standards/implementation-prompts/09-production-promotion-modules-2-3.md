# Cursor Prompt 09 — Production Promotion of the Modules 2–3 Evidence-to-Argument Spine

Use this prompt only after WP-087 is Resolved. This promotes the accepted WP-086/WP-087 Module 2→3 experience to production. It is a rollout and compatibility task, not another instructional redesign.

```text
Promote the accepted Modules 2–3 evidence-to-argument spine from development-only execution to the real production path, with one authoritative assignment-owned rollout decision, compatibility for existing student work, rollback without data loss, migration/preflight readiness, and full acceptance against an actual production build.

WP-079, WP-086, and WP-087 are accepted. Preserve their direction taxonomy, evidence pairing, staged argument flow, both-work readiness, student ownership, and Module 4 handoff. Do not redesign the matrix, evidence coaching, thesis stages, success map, or Modules 4–9.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2 and 3.1–3.16
   - Sections 4.1–4.5
   - Modules 2–4
   - Phase 3 and its exit condition
   - Sections 6.4–6.5
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. WP-003, WP-064, WP-079, WP-085, WP-086, and WP-087 in docs/project-standards/walkthroughs/issue-log.md
8. Prompts 07–08 and their accepted implementations/tests/browser evidence
9. Prompt 06 / WP-085 production-rollout architecture, migration, preflight, rollback, production-build tests, and acceptance evidence
10. lib/dev/isEvidenceToArgumentSliceEnabled.js
11. lib/module2/evidenceArgumentDirectionDescriptor.js and lib/artifacts/evidenceArgumentContract.js
12. Module 2 direction pairing UI, Module 3 flow/API/persistence/success, and Module 4 handoff consumers
13. assignment_settings schema/helpers, writing-spine rollout resolver/cache, authentication/RLS, deployment configuration, and production runbook

Create one new bounded issue, WP-088. Do not reopen WP-079 or WP-085–087. Keep WP-088 Open during implementation and Needs Verification until remote migration, production-build browser acceptance, compatibility, rollback, and failure-path checks pass.

FIRST PROGRESS REPORT — PRODUCTION READINESS AUDIT

Before editing, report:

- every `NODE_ENV`, representative option-id, dev-gate, seed, test identity, localhost, query-string, local-storage, or dev-panel dependency controlling the WP-086/WP-087 experience;
- every Module 2 and Module 3 component/helper/server route that can disagree about whether the rebuilt path is enabled;
- the authoritative persisted shapes for:
  - verified speech and letter source records;
  - observations/evidence and aliases;
  - six-cell ratings/matrix bundle;
  - WP-079 selected direction, ties/supporting selection, custom mapping, and signature;
  - legacy Module 3 pattern/idea/claim/thesis/proof plan;
  - WP-086 schema-v1 and WP-087 schema-v2 `flow_state.evidenceArgumentSlice`;
  - Module 3 resume/current step/local repair/review state;
  - Module 4 thesis and proof-plan handoff;
- how new and returning students hydrate at every Module 2→3 boundary;
- how completed Module 3 students, partially completed legacy students, custom-direction students, and changed-direction students currently reopen;
- every production-only assumption that could produce a blank page, crash, silent fallback, lost prose, false readiness claim, or split path;
- how WP-085 resolves `writing_spine_mode`, how that setting reaches client components, and whether its assignment-owned pattern can be reused safely without coupling unrelated rollback controls;
- the smallest authoritative rollout/rollback mechanism for the evidence-to-argument spine;
- required remote schema changes, RLS implications, authenticated ops path, and whether missing schema can be distinguished from a missing row/default;
- production build/test commands and how agent browser acceptance will use a real authenticated session without exposing seeds or developer controls;
- exact compatibility adapters and their confidence limits;
- production logging/observability needed without recording source text, quotations, explanations, or essay prose.

Do not edit until the rollout decision, compatibility path, migration, rollback, and production acceptance harness are explicit. Do not replace `NODE_ENV === "development"` with `true`.

PROBLEM TO SOLVE

The accepted WP-087 flow covers every valid WP-079 canonical frame and fully mapped student-created direction, but `isEvidenceToArgumentSliceEnabled` still requires development mode. A production build therefore routes students through the prior Module 2–3 experience even though Modules 4–7 now use the rebuilt production spine.

Promotion must make the accepted evidence-to-argument process authoritative for the current MLK assignment while:

- preserving all existing source, observation, matrix, direction, claim, thesis, and proof-plan work;
- adapting legacy Module 3 work honestly;
- protecting custom mappings and evidence selections;
- preventing development tooling from shipping;
- failing recoverably when configuration or persistence is unavailable;
- allowing an operational rollback that never deletes rebuilt state;
- handing the current thesis and proof directions into the already-production Modules 4–7 spine.

TARGET PRODUCTION OUTCOME

For `mlk-rhetorical-analysis` in production:

- new students receive the accepted evidence-to-argument path for every valid WP-079 direction;
- returning students resume at the correct local stage;
- existing Module 2 evidence and Module 3 prose remain visible and owned by the student;
- legacy work enters through confidence-limited adapters rather than blank screens or invented sentence content;
- both-work readiness and completion truth remain authoritative;
- same-appeal, ordered cross-dominant, tied/supporting, and fully mapped custom directions behave consistently;
- direction/evidence changes preserve prose and require review;
- Module 3 success displays the earned argument map;
- Module 4 receives the newest authoritative thesis/proof plan;
- development seeds, panels, bypasses, and local-only fallbacks remain inaccessible;
- one rollback can select the legacy presentation without deleting schema-v2 slice state;
- returning to rebuilt mode restores the same evidence choices, prose, current step, review state, and completion data.

ONE AUTHORITATIVE ROLLOUT CONTRACT

Replace direct development-only instructional gating with one assignment-owned rollout resolver shared by Module 2, Module 3, their APIs, and success/handoff routes.

The resolver must:

- distinguish at least `legacy` and `rebuilt` evidence-to-argument modes;
- resolve one authoritative mode for the assignment;
- explicitly enable `rebuilt` for the current MLK assignment only after migration/readiness checks;
- default unknown assignments safely;
- support an authenticated operational rollback or equivalent deployment-level emergency override;
- preserve all rebuilt data during rollback;
- remain testable in development, test, and production builds;
- never depend on the Developer Testing Panel, a dev seed, localhost, or a student-controlled browser value;
- expose only the resolved capability needed by client components;
- avoid split-brain behavior between Module 2, Module 3, APIs, success, and Module 4 handoff;
- distinguish configuration read failure from a legitimate legacy/default mode.

Prefer an assignment-owned setting such as `evidence_argument_mode` if that produces a clearer independent rollback boundary than overloading `writing_spine_mode`. Reuse WP-085 resolver/helper/cache patterns where appropriate, but do not create two sources of truth or make rollback of Modules 2–3 unexpectedly roll back Modules 4–7.

If schema changes are required:

- add an idempotent migration;
- validate allowed modes server-side;
- retain RLS and service-role boundaries;
- create or update the MLK assignment row without resetting existing word-count or writing-spine settings;
- make missing schema a clear deployment error;
- provide an authenticated/ops write path or documented SQL operation;
- do not use the development JSON fallback in production;
- do not mark WP-088 Resolved until the remote database returns the setting as database-backed.

DEVELOPMENT TOOLING BOUNDARY

These surfaces must remain development-only and absent or safely denied in production:

- Developer Testing Panel;
- WP-086/WP-087 seed targets and variant names;
- dev authentication identities/bypasses;
- progression/reset shortcuts;
- test-only query parameters or browser switches;
- local file settings fallback;
- debug panels and fixture selectors.

Production promotion must not weaken existing `NODE_ENV` protection around developer infrastructure. Add executable production-source/build checks and endpoint denial checks.

LEGACY AND RETURNING-STUDENT COMPATIBILITY

Build small pure adapters at artifact boundaries. Never mutate historical data merely to render it and never replace valid student wording.

Required cases:

1. Verified sources and matrix complete, but no WP-086/WP-087 slice state.
2. Selected WP-079 canonical direction with legacy Module 3 pattern/idea/claim/thesis/proof plan.
3. Selected supporting/tied direction with provenance.
4. Student-created direction with no custom evidence mapping.
5. Fully mapped student-created direction.
6. WP-086 schema-v1 representative state.
7. WP-087 schema-v2 state at every flow step.
8. Changed direction with existing Module 3 prose and review metadata.
9. Multiple matching evidence candidates with a prior choice, or no prior choice.
10. Missing, stale, detached, duplicated, wrong-source, or fragmentary evidence.
11. Blank matrix cell versus explicit zero.
12. One-work-only support.
13. Partially completed Module 3 with legacy resume stage.
14. Already completed Module 3 whose thesis/proof plan are consumed by Module 4.
15. Student already in Module 4–7 when promotion occurs.

Compatibility behavior:

- normalize v1→v2 without losing prose, current step, selected evidence, or review state;
- infer direction/evidence mapping only when unambiguous;
- preserve selected direction signature and prior healthy evidence choices;
- hydrate legacy claim/thesis/proof directions into the rebuilt review/builder without inventing explanations;
- require local mapping/review for ambiguous custom or multiple-candidate states;
- preserve legacy completed thesis/proof plan until a rebuilt save is durable;
- never downgrade a student already beyond Module 3 or force module replay;
- flag unhealthy evidence locally without deleting downstream prose;
- write upgraded metadata only through authenticated normal saves or an explicitly reviewed backfill, never on render;
- document adapter confidence limits and removal criteria.

MODULE 2 PRODUCTION REQUIREMENTS

- Preserve verified-source gates and inspectable working texts.
- Preserve WP-079 ratings, recommendations, ties, supporting choices, custom choice, and ranking behavior unchanged.
- Use the accepted generalized direction descriptor and evidence-pair resolver.
- Require explicit custom mapping before the rebuilt handoff.
- Preserve prior healthy evidence choices; never silently choose among multiple candidates.
- Keep blank distinct from explicit zero.
- Provide local repair for missing/unhealthy evidence.
- Persist provenance and review state through authenticated routes.
- Use explicit actions; never auto-advance on text length.
- A temporary rollout/configuration read failure must show a recoverable state rather than silently selecting a different instructional path.

MODULE 3 PRODUCTION REQUIREMENTS

- Use the accepted reorient → reread → repair → explain → pattern → significance → larger point → proof directions → argument map sequence.
- Resume the saved step and local repair destination server-side.
- Preserve legacy and v1/v2 prose through adapters.
- Require deliberate review after direction/evidence changes.
- Apply identical both-work readiness across same-appeal, cross-dominant, tied/supporting, and custom directions.
- Keep completion language bounded by semantic validation.
- Success shows the actual selected direction, both evidence explanations, thesis, and proof directions.
- Completion and success routes use the same authoritative rollout decision as the main Module 3 UI.
- Repeated saves/refreshes remain idempotent and do not duplicate completion activity.

MODULE 4 HANDOFF AND DOWNSTREAM SAFETY

- The accepted production Module 4–7 spine remains enabled independently through WP-085.
- Module 4 receives the newest authoritative Module 3 thesis and proof-plan strings.
- Legacy completed Module 3 work remains usable until a rebuilt save is durable.
- Rollback of Modules 2–3 must not disable or corrupt Modules 4–7.
- A student already in Modules 4–7 is never sent backward solely because the rollout mode changed.
- Upstream direction/evidence changes follow existing review semantics; they do not rewrite Module 4–7 student prose.
- Add integration tests for production rebuilt Module 3 → production rebuilt Module 4.

FAILURE AND ROLLBACK CONTRACT

- Missing required schema is a deployment error, not a legitimate legacy/default mode.
- Missing assignment row follows the documented safe default without using a local file in production.
- Temporary database/configuration failure shows a recoverable state and preserves student work.
- Failed Module 3 slice save stays on the current step with student input intact and a retry action.
- Broad catches must not silently route students into a different flow.
- Rollback changes presentation/entry mode only; it never deletes evidence selections, schema-v2 state, review history, thesis, proof plan, or completion data.
- Rebuilt → legacy → rebuilt restores the same slice state and current authoritative prose.
- Structured logs may include assignment id, user-safe internal row ids, mode, adapter kind, schema version, and failure code—but never source text, quotation, student explanation, thesis, or essay prose.

MIGRATION AND READ-ONLY PREFLIGHT

Provide an agent-runnable preflight that checks:

- required assignment-settings schema exists remotely;
- the MLK row has an explicit evidence-to-argument rollout mode;
- settings are database-backed, not local fallback;
- source, matrix, Module 3 flow-state, and draft metadata columns are readable;
- service-role access works where required;
- RLS prevents unauthorized direct client writes;
- schema-v1 and schema-v2 slice counts/shapes can be summarized without exposing student text;
- invalid/unknown modes are rejected;
- Module 4’s production writing-spine mode remains rebuilt;
- no production environment depends on dev seeds or `.dev-assignment-settings.json`.

The preflight is read-only unless explicitly invoked with a reviewed enable/apply option. Output concise pass/fail evidence suitable for the issue log. If remote DDL cannot be applied automatically, provide one minimal idempotent SQL operation and leave WP-088 Needs Verification until the user applies it; all other verification remains agent-owned.

PRODUCTION ACCEPTANCE DATA

Keep seeds development-only. For production-build acceptance, use authenticated APIs and isolated acceptance records or a reversible test account state without creating a production seed endpoint.

Cover:

- new student entering Module 2;
- returning student at each Module 2 and Module 3 boundary;
- all canonical direction families proportionately, including reverse cross-dominant;
- supporting/tied selection;
- fully mapped and incompletely mapped custom direction;
- legacy Module 3 prose without slice state;
- schema-v1 and schema-v2 slice state;
- multiple evidence candidates;
- explicit zero/weak side;
- changed direction with existing prose;
- one-work-only readiness failure;
- completed Module 3 → Module 4;
- rollback legacy → rebuilt round trip;
- settings/API failure and retry.

AUTOMATED ACCEPTANCE

Add executable tests proving:

1. environment override and stored assignment mode precedence;
2. one shared capability decision across Module 2, Module 3, APIs, success, and handoff;
3. unknown assignment safe default;
4. missing schema is distinguished from missing row;
5. invalid mode rejection;
6. production does not use the local settings fallback;
7. development tools/seeds remain inaccessible in production;
8. every canonical frame and fully mapped custom direction uses the rebuilt path in rebuilt mode;
9. incomplete/malformed custom state gets local review rather than a crash;
10. legacy Module 3 prose survives adaptation;
11. schema-v1 and schema-v2 state survive hydration and save;
12. direction/evidence changes preserve prose and require review;
13. multiple candidates are not silently selected;
14. true both-work readiness cannot be bypassed;
15. explicit zero is not treated as passage evidence;
16. rollback preserves rebuilt state;
17. rebuilt restoration resumes the same state;
18. Module 3 success and Module 4 use the newest authoritative thesis/proof plan;
19. no character threshold advances;
20. production build succeeds without developer UI or seed names in the student bundle/rendered DOM.

Run focused WP-079/WP-086–088 tests, proportional Module 2–4 suites, relevant WP-081–085 downstream regressions, the read-only preflight, and a real production build.

AGENT PRODUCTION-BUILD BROWSER ACCEPTANCE — REQUIRED

Cursor owns routine acceptance. Run an actual production build/server (`next build` plus production start or repository equivalents), authenticate through the real supported test/session path, and verify at 390×844 and 1440×900:

1. MLK assignment resolves to rebuilt from the database in production.
2. No Developer Testing Panel, seed target, dev identity, or bypass appears.
3. Module 2 verified sources and matrix load without dev state.
4. Same-appeal, reverse cross-dominant, and fully mapped custom selections enter the rebuilt evidence-pair experience.
5. Multiple candidates preserve/require student choice.
6. Module 3 resumes representative steps after refresh/direct reopen.
7. Legacy Module 3 prose opens intact and is not split or rewritten.
8. Schema-v1 state normalizes and saves without loss.
9. Direction change preserves prose and gates review.
10. One-work-only/incomplete custom states cannot overclaim completion.
11. Save/API failure keeps input and offers retry.
12. Completion shows the earned argument map and persists after refresh.
13. Module 4 receives the same newest thesis/proof directions.
14. Rollback rebuilt → legacy → rebuilt preserves slice state and does not affect Modules 4–7 mode/data.
15. Production dev endpoints return safe denial.
16. Keyboard/focus order is logical; no horizontal overflow; active work remains visually primary.

Use browser automation, API/database inspection, and executable tests wherever possible. Jason should perform only an irreducibly external operation such as remote DDL when no authorized automated path exists; do not assign routine clicking or checking to him.

WP-088 CLOSURE EVIDENCE

Before marking Resolved, report:

1. rollout resolver and precedence;
2. migration id and remote database-backed evidence;
3. preflight results;
4. legacy/schema-v1/schema-v2 compatibility matrix;
5. rollback round-trip evidence;
6. production build result;
7. automated test totals;
8. production browser scenarios and viewport evidence;
9. production dev-tool denial evidence;
10. any genuinely human-only remainder.

FIRST RESPONSE AFTER READING

Return:

1. governing sections read;
2. all development-only gates and nonproduction assumptions found;
3. Module 2→3→4 production artifact/hydration map;
4. proposed authoritative rollout and rollback contract;
5. migration/preflight plan;
6. legacy/v1/v2 compatibility rules and confidence limits;
7. files expected to change;
8. automated and production-browser acceptance plan;
9. explicit out-of-scope boundaries.

Then implement, verify, correct all acceptance findings, update WP-088, and report closure evidence. Do not mark WP-088 Resolved before the remote database setting and actual production-build acceptance pass.

OUT OF SCOPE

- changing WP-079 rating, taxonomy, eligibility, or ranking behavior;
- redesigning WP-086/WP-087 instruction or stage sequence;
- changing Modules 4–7 instruction or their rollout mode;
- Module 1 vocabulary redesign;
- Module 8–9 APA/submission redesign;
- broad visual-system or success-screen redesign;
- deleting legacy Module 2–3 code;
- automatic rewriting of student evidence, explanations, thesis, or proof directions.
```
