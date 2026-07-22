# Cursor Prompt 12 — Production Promotion of Module 1 Transfer-Oriented Vocabulary

Use this prompt only after WP-090 is Resolved. This promotes the accepted WP-089/WP-090 Module 1 vocabulary experience to production. It is a production-hardening, compatibility, persistence, and rollout task—not another instructional redesign.

```text
Promote the accepted Module 1 transfer-oriented vocabulary process from development-only execution to the real production path, with one authoritative assignment-owned rollout decision, lossless compatibility for existing students, durable and honest resume behavior, rollback without data loss, migration/preflight readiness, and full acceptance against an actual production build.

WP-089 and WP-090 are accepted. Preserve the shared six-concept contract system, concept-specific pedagogy, explicit student actions, teaching feedback, saved assignment-prompt paraphrase, quiz policy, and Module 2 handoff. Do not redesign the lessons, change quiz scoring/unlock rules, or modify Modules 2–9.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2 and 3.1–3.16
   - Sections 4.1–4.5
   - Module 1 and the Module 1→2 handoff
   - Phase 4 and its exit condition
   - Sections 6.4–6.5
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. WP-055, WP-057, WP-078, WP-085, WP-088, WP-089, and WP-090 in docs/project-standards/walkthroughs/issue-log.md
8. Prompts 10–11 and their accepted implementations, tests, and browser evidence
9. Prompt 06 / WP-085 and Prompt 09 / WP-088 production-rollout architecture, migrations, preflights, rollback contracts, production-build tests, runbooks, and acceptance evidence
10. components/ModuleOne.js and app/modules/1/page.js
11. components/module1/VocabularyTransferLessonFlow.jsx
12. lib/module1/vocabularyTransferLessonContract.js
13. lib/module1/vocabularyTransferState.js
14. lib/module1/ethosTransferLessonContract.js and the WP-089 schema-v1 compatibility path
15. lib/module1/step2MicrostageHelpers.js, quizHelpers.js, module1BrowserCache.js, restartHelpers.js, and completion-readiness helpers
16. lib/dev/isVocabularyTransferLessonEnabled.js and lib/dev/seeds/seedVocabularyTransferLesson.ts
17. Module 1 prompt, quiz, completion, activity, restart, and developer-panel APIs
18. assignment_settings schema/helpers, writing-spine and evidence-argument rollout resolvers/caches/APIs, authentication/RLS, deployment configuration, and production runbooks

Create one new bounded issue, WP-091. Do not reopen WP-089 or WP-090. Keep WP-091 Open during implementation and Needs Verification until the remote migration, production-build browser acceptance, compatibility, rollback, persistence/failure-path, and dev-tool denial checks all pass.

FIRST PROGRESS REPORT — PRODUCTION READINESS AND PERSISTENCE AUDIT

Before editing, report:

- every `NODE_ENV`, dev gate, seed, test identity, localhost assumption, query parameter, local-storage key, dev-panel action, bypass, or browser-only condition controlling the WP-089/WP-090 experience;
- every Module 1 page, component, helper, server route, success/completion route, restart path, and Module 2 boundary that can disagree about whether transfer vocabulary is enabled;
- the authoritative shapes and persistence locations for:
  - assignment-prompt breakdown and saved student paraphrase;
  - legacy Step 2 term/stage progress;
  - legacy vocabulary responses, if any;
  - WP-089 `ethosTransfer` schema-v1;
  - WP-090 `vocabularyTransfer` schema-v2 and each per-term schema-v1 entry;
  - `stage`, `termIndex`, `currentStep`, feedback-read flags, selected choices, King follow-up prose, assignment-transfer acknowledgement, completion flags, prompt signature/review state, and timestamps;
  - quiz version, partial answers, active question, submitted result, and Module 1 completion/progression;
  - the prompt paraphrase handed to the transfer desk;
  - the exact Module 1→2 progression contract;
- which data is server-backed, which is browser-local only, what survives refresh, sign-out/sign-in, a second device, cache clearing, restart, rollback, and deployment, and where the UI currently overstates durability;
- how new, returning, partially completed, quiz-active, quiz-completed, Module-1-completed, and already-in-Module-2+ students currently hydrate;
- how `clearModule1Step2Draft`, restart, quiz submit, and completion interact with transfer state, including whether a successful quiz intentionally clears the lesson draft;
- all compatibility risks for legacy Step 2, WP-089 ethos-v1, WP-090 generalized state, quiz-version migration, malformed/partial data, and prompt-paraphrase changes;
- every production-only assumption that could cause a blank page, lost lesson work, forced replay, false quiz unlock, false completion, silent legacy fallback, or split path;
- how WP-085 resolves `writing_spine_mode` and WP-088 resolves `evidence_argument_mode`, and how to reuse their server-owned pattern without coupling the three independent rollback controls;
- the smallest authoritative rollout/rollback mechanism for Module 1 vocabulary;
- whether browser-local lesson drafts are acceptable as the production source of resume truth under the repository’s artifact decision rules; if not, propose the smallest authenticated server-backed persistence path and migration that preserves local state without silently claiming it was already durable;
- required remote schema changes, RLS/service-role implications, authenticated read/write paths, and how missing schema is distinguished from a missing row/default;
- production build/test commands and how agent browser acceptance will use a real authenticated session without exposing seeds or developer controls;
- exact compatibility adapters, precedence rules, conflict handling, and confidence limits;
- structured observability needed without logging student choices, prompt paraphrases, King follow-up prose, quiz answers, or other student writing.

Do not edit until the rollout decision, persistence source of truth, compatibility precedence, migration, rollback, and production acceptance harness are explicit. Do not replace `NODE_ENV === "development"` with `true`.

PROBLEM TO SOLVE

The accepted WP-090 flow teaches rhetoric, ethos, pathos, logos, audience, and purpose through transfer rather than isolated definition recall, but `isVocabularyTransferLessonEnabled` still requires development mode. Production students therefore receive the older vocabulary presentation.

In addition, the current Step 2 lesson draft is written to browser local storage. That may be sufficient as a cache, but it must not become an unexamined production source of truth. Promotion must determine and implement an honest persistence contract before claiming that progress is saved or resumable.

Promotion must make the accepted transfer process authoritative for the current MLK assignment while:

- preserving prompt work, lesson choices, student explanations, quiz work, and completion;
- preserving the accepted distinctions among umbrella, appeal, situation, and goal concepts;
- adapting legacy and WP-089/WP-090 state without inventing student responses;
- preventing completed students from being sent backward or forced to replay Module 1;
- protecting the independent production Modules 2–3 and Modules 4–7 rollout modes;
- preventing development tooling from shipping;
- failing recoverably when rollout configuration or persistence is unavailable;
- allowing an operational rollback that never deletes rebuilt vocabulary state;
- restoring the same lesson state when rebuilt mode is re-enabled.

TARGET PRODUCTION OUTCOME

For `mlk-rhetorical-analysis` in production:

- new students receive the accepted transfer lesson for all six concepts;
- returning students resume the correct term and local microstep with their own responses intact;
- students see only the current teaching move plus the small working set needed for it;
- lesson progress does not advance merely because text reaches a character count;
- feedback is read before explicit Continue becomes the next action;
- the saved prompt paraphrase remains available at assignment transfer and changes trigger bounded review rather than erasure;
- completing all six concepts unlocks the existing quiz under the existing policy;
- partial/current-version quiz work resumes according to existing quiz-version rules;
- completed Module 1 students remain complete and students already beyond Module 1 are never regressed;
- Module 2 receives the same valid progression/handoff as before;
- development seeds, panels, local identities, and bypasses remain inaccessible;
- rollback selects the legacy presentation without deleting generalized transfer state;
- rebuilt mode restoration resumes the same term, microstep, response, review state, and completion status.

ONE AUTHORITATIVE, INDEPENDENT ROLLOUT CONTRACT

Replace direct development-only instructional gating with one assignment-owned rollout resolver shared by the Module 1 page, lesson UI, relevant APIs, completion/readiness logic, restart behavior, and Module 2 handoff.

The resolver must:

- distinguish at least `legacy` and `rebuilt` vocabulary modes;
- resolve one authoritative mode for the assignment;
- explicitly enable `rebuilt` for the current MLK assignment only after migration and readiness checks;
- default unknown assignments safely;
- support an authenticated teacher/ops rollback and, if consistent with WP-085/WP-088, a deployment-level emergency override;
- preserve all rebuilt state during rollback;
- remain testable in development, test, and production builds;
- never depend on the Developer Testing Panel, a dev seed, localhost, local storage, or a student-controlled browser value to choose production mode;
- expose only the resolved capability needed by client code;
- prevent split-brain behavior between page, lesson component, persistence route, quiz unlock, completion route, restart, and Module 2 entry;
- distinguish configuration read failure from a legitimate legacy/default mode;
- remain independent of `writing_spine_mode` and `evidence_argument_mode`, so rolling back Module 1 does not roll back Modules 2–7 and vice versa.

Use a clear independent setting such as `vocabulary_transfer_mode` unless the audit demonstrates a better single-source name. Reuse WP-085/WP-088 resolver/helper/cache/API patterns; do not create a second Module 1 source of truth.

If schema changes are required:

- add an idempotent migration;
- validate allowed modes server-side;
- retain RLS and service-role boundaries;
- create or update the MLK assignment row without resetting word-count, writing-spine, or evidence-argument settings;
- make missing schema a clear deployment error;
- provide an authenticated teacher/ops write path or a documented minimal SQL operation;
- do not use `.dev-assignment-settings.json` in production;
- do not mark WP-091 Resolved until the remote database reports the mode as database-backed.

DURABLE LESSON-STATE CONTRACT

The audit must choose and document one authoritative resume contract. Do not simply move local-storage code around.

Preferred production qualities:

- authenticated, assignment-scoped server persistence for in-progress transfer state;
- schema-versioned JSON with pure normalization/adaptation at the boundary;
- a browser cache may accelerate/recover, but does not silently override newer server state;
- conflict resolution is deterministic and documented (for example, valid completion first, then newest valid `updatedAt`, with field-level preservation where safe);
- writes are explicit, idempotent, retryable, and do not advance the student on failure;
- no write-on-render migration;
- state is upgraded only during an authenticated normal save or an explicitly reviewed backfill;
- quiz results remain in their current authoritative table and are not duplicated into lesson-state JSON;
- prompt paraphrase remains authoritative in `module1_prompt_breakdown`, with only its signature/review acknowledgement stored in transfer state;
- restart semantics remain narrow and intentional;
- Module 1 completion remains governed by the existing server completion/readiness contract.

If the smallest sound design is a new table, use an assignment/user unique key, timestamps, schema version, RLS/service-role-safe APIs, and an idempotent migration. If an existing server-backed artifact can safely own the state, justify that choice and avoid duplicating sources of truth.

LOCAL-TO-SERVER IMPORT RULES

For an authenticated student with browser-local Step 2 state and no server transfer state:

- inspect and normalize locally without deleting it;
- import only through an explicit authenticated save/claim operation;
- preserve all valid choices, prose, current term/microstep, feedback state, prompt signature, and quiz navigation metadata that belongs in lesson state;
- never overwrite an existing newer or more complete server record silently;
- show a recoverable review/choice only when both copies contain meaningful conflicting work that cannot be safely merged;
- after confirmed durable save, browser storage may remain a cache but must follow the documented precedence;
- never claim cross-device or durable save before the server confirms it.

DEVELOPMENT TOOLING BOUNDARY

These must remain development-only and absent or safely denied in production:

- Developer Testing Panel;
- WP-089/WP-090 seed targets and variants;
- development authentication identities/bypasses;
- progression/reset shortcuts not intended for students;
- test-only query parameters or browser mode switches;
- local file settings fallback;
- debug panels, contract selectors, and fixture markers.

Production promotion must not weaken existing `NODE_ENV` protection around developer infrastructure. Add executable production-source/build checks and endpoint-denial checks.

LEGACY AND RETURNING-STUDENT COMPATIBILITY

Build small pure adapters at artifact boundaries. Never mutate historical data merely to render and never manufacture an answer, explanation, feedback acknowledgement, or completion.

Required cases:

1. New student with prompt paraphrase and no Step 2 state.
2. Legacy Step 2 transition/learn/quiz state with no transfer object.
3. WP-089 `ethosTransfer` schema-v1 at every ethos microstep.
4. WP-090 generalized state with any one of the six concepts active.
5. WP-090 state with several completed terms and a later active term.
6. All six transfer terms complete but quiz not started.
7. Quiz active with current quiz version and partial answers.
8. Quiz draft from an older version under existing migration policy.
9. Quiz submitted and Module 1 completion pending.
10. Module 1 already complete.
11. Student already in Module 2 or later.
12. Prompt paraphrase changed after transfer work began.
13. Both legacy ethos-v1 and generalized ethos state exist.
14. Browser-local and server transfer states both exist and differ.
15. Missing, malformed, partial, unknown-version, future-version, duplicated, or timestamp-less state.
16. Save failure, configuration failure, session expiry, or network interruption during a microstep.
17. Rebuilt → legacy → rebuilt round trip at each major boundary.

Compatibility behavior:

- normalize ethos-v1 losslessly into generalized ethos;
- preserve all valid WP-090 per-term responses and current steps;
- define explicit precedence when ethos-v1 and generalized ethos coexist;
- preserve completed terms and never infer completion from text length;
- map legacy stage/term position only when unambiguous;
- if legacy work cannot satisfy a rebuilt microstep, enter at the nearest honest teaching/review point without erasing it;
- preserve prompt-change review semantics;
- preserve current-version quiz answers and honor existing old-version restart rules;
- completed Module 1 and downstream progression always outrank a lesson replay request;
- rollback changes presentation/entry mode only and never deletes generalized state;
- upgraded metadata is written only on authenticated save/import;
- document confidence limits and legacy-removal criteria.

MODULE 1 PRODUCTION REQUIREMENTS

- Preserve the accepted concept registry and one shared renderer rather than six copied flows.
- Preserve the accepted roles and concept-specific distinctions:
  - rhetoric as strategic choice/umbrella;
  - ethos as credibility/trust;
  - pathos as purposeful feeling rather than incidental emotion;
  - logos as connected reasoning rather than a bare fact;
  - audience as who receives the choice and whether it fits;
  - purpose as intended result.
- Preserve verified, assignment-owned King passages and source provenance.
- Preserve the visible analytical anchor: choice → audience effect/fit → purpose/result, varied where the concept requires it.
- Keep the active teaching move visually primary and the desk narrowly filtered.
- Keep examples structural and short; do not provide an answer that can be copied into the essay.
- Preserve explicit choice, feedback, and Continue actions.
- Never auto-advance on text length or selection alone.
- Keep Back local and preserve responses.
- Preserve cumulative trail/concept map only where it helps the active move.
- Preserve the student’s prompt paraphrase on the transfer desk.
- Preserve assignment-transfer review when the paraphrase signature changes.
- Do not change the ten-question quiz, scoring, answer keys, teaching-feedback policy, retry semantics, or completion threshold unless a separate issue explicitly authorizes it.
- Quiz unlock must use one authoritative readiness decision consistent across client and server.
- Completion language must reflect actual persisted quiz/completion state.

MODULE 1→2 AND DOWNSTREAM SAFETY

- The accepted production Module 2–3 evidence-to-argument spine remains independently controlled by WP-088.
- The accepted production Module 4–7 writing spine remains independently controlled by WP-085.
- Module 1 completion and progression into Module 2 use existing server-authoritative readiness and compare-and-set behavior.
- Rolling back vocabulary does not alter `evidence_argument_mode`, `writing_spine_mode`, word-count settings, or downstream artifacts.
- A student already in Module 2–9 is never sent backward solely because vocabulary mode or persistence schema changed.
- Restart remains Module-1-scoped and must not clear Module 2+ work.
- Add integration tests for rebuilt Module 1 completion → rebuilt Module 2 entry.

FAILURE AND ROLLBACK CONTRACT

- Missing required schema is a deployment error, not a legitimate legacy/default mode.
- Missing assignment row follows the documented safe default without a local-file fallback in production.
- Temporary configuration/persistence failure shows a recoverable state and preserves student input.
- A failed lesson save stays on the same microstep with the response intact and a retry action.
- A failed local-to-server import does not delete or invalidate the local recovery copy.
- Broad catches must not silently route the student into a different vocabulary flow.
- Session expiry prompts sign-in/retry without dropping current input.
- Rollback changes presentation only; it never deletes generalized state, imported state, prompt review, quiz results, or completion.
- Rebuilt → legacy → rebuilt restores the same authoritative transfer state.
- Structured logs may include assignment id, safe internal row id, mode, adapter kind, schema version, term id, step id, and failure code—but never prompt paraphrase, response text, selected answer, quiz answers, or student prose.

MIGRATION AND READ-ONLY PREFLIGHT

Provide an agent-runnable WP-091 preflight that checks:

- required assignment-settings and lesson-state schema exists remotely;
- the MLK row has an explicit vocabulary rollout mode;
- rollout settings are database-backed, not local fallback;
- word-count, writing-spine, and evidence-argument settings remain unchanged and rebuilt where expected;
- prompt, quiz, progression, and new lesson-state tables/columns are readable;
- service-role access works only where required;
- RLS prevents unauthorized direct writes;
- legacy, ethos-v1, generalized-v2, quiz-active, completed, and malformed/future state counts/shapes can be summarized without exposing student content;
- invalid/unknown modes and malformed writes are rejected;
- production never depends on a seed or browser-local mode switch;
- production dev endpoints remain denied;
- the current MLK passages referenced by contracts still match the assignment-owned guided passages.

The preflight is read-only unless explicitly invoked with a reviewed enable/apply option. Output concise pass/fail evidence suitable for the issue log. If remote DDL cannot be applied automatically, provide one minimal idempotent SQL operation and leave WP-091 Needs Verification until the user applies it; every other verification remains agent-owned.

PRODUCTION ACCEPTANCE DATA

Keep seeds development-only. For production-build acceptance, use authenticated APIs plus isolated/reversible acceptance state for a supported test account. Do not create a production seed endpoint.

Cover:

- new student;
- legacy Step 2 student;
- ethos-v1 at multiple steps;
- generalized state at each concept family and representative microsteps;
- all six concepts completed;
- partial current-version quiz;
- older quiz-version migration;
- submitted quiz/pending completion;
- completed Module 1;
- student already in Module 2+;
- prompt paraphrase change;
- local-only state import;
- server/local conflict;
- malformed and future-version state;
- save/config/session failure and retry;
- rollback legacy → rebuilt round trip.

AUTOMATED ACCEPTANCE

Add executable tests proving:

1. environment override and stored assignment mode precedence, if an override is retained;
2. one shared capability decision across Module 1 page, lesson, persistence, quiz readiness, completion, restart, and Module 2 handoff;
3. unknown assignment safe default;
4. missing schema is distinguished from a missing row;
5. invalid mode rejection;
6. production does not use local settings fallback;
7. developer panel/seeds/bypasses remain inaccessible in production;
8. all six canonical concepts use the accepted rebuilt contracts in rebuilt mode;
9. concept-specific step variants remain intact;
10. no character threshold auto-advances;
11. feedback precedes Continue and Back remains local;
12. ethos-v1 migration is lossless;
13. generalized state survives hydration, authenticated save, refresh, sign-out/in, and second-session read;
14. browser-local import preserves valid state and never overwrites newer server state silently;
15. conflicts produce deterministic merge/review behavior;
16. malformed/future state fails recoverably;
17. prompt paraphrase changes preserve work and require bounded review;
18. quiz unlock requires all six lessons under the accepted readiness rules;
19. quiz content/version/scoring policy is unchanged;
20. completed Module 1 and Module 2+ progression never regress;
21. rollback preserves rebuilt state;
22. rebuilt restoration resumes the same state;
23. restart is narrow and leaves Module 2+ artifacts intact;
24. configuration/save/session failure preserves input and provides retry;
25. production build contains no developer UI, seed names, or fixture markers in rendered student surfaces/bundles;
26. rebuilt Module 1 completion enters the independently rebuilt Module 2 path without changing its mode.

Run focused WP-055/WP-078/WP-089–091 tests, the proportional Module 1 suite, relevant authentication/settings/restart/progression tests, read-only Module 2 handoff regressions, the preflight, and a real production build.

AGENT PRODUCTION-BUILD BROWSER ACCEPTANCE — REQUIRED

Cursor owns routine acceptance. Run an actual production build/server (`next build` plus production start or repository equivalents), authenticate through the real supported test/session path, and verify at 390×844 and 1440×900:

1. MLK resolves to rebuilt vocabulary mode from the remote database in production.
2. No Developer Testing Panel, WP-089/WP-090 seed, dev identity, or bypass appears.
3. A new student sees the rebuilt rhetoric lesson and explicit step actions.
4. Rhetoric, ethos, pathos, logos, audience, and purpose retain their distinct teaching moves.
5. Refresh/direct reopen resumes the same term, microstep, feedback state, and response.
6. Sign-out/in and a fresh browser session load the authoritative saved state honestly.
7. Ethos-v1 resumes with all prior data after normalization/save.
8. A local-only WP-090 draft imports safely and becomes server-backed without loss.
9. A server/local conflict follows the documented precedence or asks for bounded review.
10. Prompt-paraphrase change preserves lesson progress and shows the accepted review cue.
11. All six completed lessons unlock the unchanged quiz.
12. Partial current-version quiz resumes; old-version behavior matches existing policy.
13. Failed save/config request preserves the active response and offers retry.
14. Completed Module 1 remains complete after refresh/direct reopen and enters Module 2.
15. A student already beyond Module 1 is not regressed.
16. Rollback rebuilt → legacy → rebuilt preserves state and does not alter Modules 2–7 modes/data.
17. Restart affects only the documented Module 1 records/cache.
18. Production developer endpoints return safe denial.
19. Keyboard/focus order is logical, active work is visually primary, and there is no horizontal overflow.

Use browser automation, API/database inspection, and executable tests wherever possible. Jason should perform only an irreducibly external operation such as remote DDL when no authorized automated path exists; do not assign routine clicking, responsive checking, refresh testing, or state inspection to him.

WP-091 CLOSURE EVIDENCE

Before marking Resolved, report:

1. rollout resolver and precedence;
2. lesson-state source of truth, cache policy, and conflict rules;
3. migration id and remote database-backed evidence;
4. preflight results;
5. legacy/ethos-v1/generalized-v2/quiz/completed compatibility matrix;
6. local-to-server import and conflict evidence;
7. rollback round-trip evidence;
8. production build result;
9. automated test totals;
10. production browser scenarios and viewport evidence;
11. production dev-tool denial evidence;
12. Module 1→2 and independent rollout-mode evidence;
13. any genuinely human-only remainder.

FIRST RESPONSE AFTER READING

Return:

1. governing sections read;
2. all development-only gates and nonproduction assumptions found;
3. Module 1 prompt → lesson → quiz → completion → Module 2 artifact/hydration map;
4. browser-local versus server-backed persistence audit;
5. proposed authoritative rollout and rollback contract;
6. proposed durable lesson-state and local-import contract;
7. migration/preflight plan;
8. legacy/ethos-v1/generalized-v2/quiz compatibility rules and confidence limits;
9. files expected to change;
10. automated and production-browser acceptance plan;
11. explicit out-of-scope boundaries.

Then implement, verify, correct all acceptance findings, update WP-091, and report closure evidence. Do not mark WP-091 Resolved before the remote database setting, authoritative persistence verification, and actual production-build acceptance pass.

OUT OF SCOPE

- redesigning accepted WP-089/WP-090 lesson content or stage sequence;
- changing Module 1 quiz questions, answer keys, scoring, retry, version, or completion policy;
- redesigning the Module 1 prompt-breakdown task;
- changing WP-079 or the Modules 2–3 evidence-to-argument instruction;
- changing Modules 4–7 instruction or rollout;
- Module 8–9 APA/submission redesign;
- broad visual-system or success-screen redesign;
- deleting legacy Module 1 code before a stable production period;
- automatically generating, rewriting, or grading student explanations;
- coupling Module 1 rollback to the independent Modules 2–3 or Modules 4–7 rollout modes.
```
