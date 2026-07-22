# Cursor Prompt 13 — Consolidated Module 8–9 Guided APA Protocol

Use this prompt only after WP-091 is Resolved. This begins Phase 5 by rebuilding the Module 8–9 preparation experience behind a development-only gate. It establishes the complete instructional and persistence architecture before any production promotion.

```text
Rebuild the Module 8–9 document-preparation experience as one coherent protocol behind a development-only gate:

- Module 8 creates or updates one authoritative Google Doc, verifies that it contains the newest finished essay, confirms the student can open it, and stops;
- Module 9 teaches each required formatting move just before the student applies it in that Google Doc, uses one accurate canonical model throughout, saves one definitive Google Doc inspection, then guides the student through PDF download, inspection, upload, and the already-accepted persistent receipt.

Remove repeated checklist loops, recognition-question busywork, empty Continue-only pages, moralizing language, and giant reference dumps from the rebuilt path. Preserve all accepted document verification, recovery, PDF validation, upload, receipt, and dashboard trust behavior.

This is the Phase 5 architecture and full guided-protocol implementation in development. It is not production promotion. Do not alter the production path until a later prompt explicitly authorizes promotion.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2 and 3.1–3.16
   - Sections 4.1–4.5
   - Module 8, Module 9, Dashboard
   - Success screens and artifact trust
   - Phase 5 and its exit condition
   - Epics F–G
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. WP-002, WP-004–007, WP-009–011, WP-028–047, WP-067–072, WP-080, WP-084, and WP-085 in docs/project-standards/walkthroughs/issue-log.md
8. Prompt 01 / WP-080 implementation and acceptance evidence—do not regress submission trust
9. Prompt 05 / WP-084 newest-essay and word-count handoff
10. components/ModuleEight.js and components/module8/*
11. components/ModuleNine.js and components/module9/*
12. lib/module9/module9ApaLearning.js and module9ScreenContract.js
13. app/api/module9/checklist/route.js and lib/supabase/helpers/module9Checklist.ts
14. Module 8 draft/finalization, Module 8 success, Module 9 gate/success, activity, and dashboard paths
15. exported-doc, Google Docs create/update/verify/recovery helpers and APIs
16. PDF client/server validation, upload, `student_exports`, receipt, and dashboard helpers
17. assignment settings, assignment identity, teacher settings, and existing rollout patterns
18. all Module 8–9 tests, especially submission-doc, APA, upload, receipt, accessibility, hierarchy, rhythm, and responsive tests

Create one bounded umbrella issue, WP-092, for the rebuilt Phase 5 protocol. Do not redefine the older issues. Update WP-004 and WP-006, and any other directly satisfied existing Module 8–9 issues, only with concrete acceptance evidence from this work. Keep WP-092 Open during implementation and Needs Verification until the complete agent browser walkthrough passes.

FIRST PROGRESS REPORT — AUDIT BEFORE EDITING

Before changing code, report:

- the current Module 7 final essay → Module 8 Google Doc → Module 9 PDF → receipt → dashboard artifact chain;
- every Module 8 state, step, gate, checklist, confirmation, persistence row, verification timestamp, success route, and recovery action;
- every Module 9 APA lesson question, quiz/analytics row, Google Doc step, formatting checklist, PDF checklist, upload state, receipt state, and resume rule;
- every place the app creates, updates, verifies, opens, or replaces the submission Google Doc;
- whether Module 9 can create/update a second or divergent Google Doc path and exactly how that duplicates Module 8;
- all repeated APA concepts/checklists across Module 8 and Module 9, including which are persisted and which are local only;
- how `module9_quiz`, `module9_checklist`, Module 8 `final_ready`, `exported_docs`, document verification, and final PDF records currently interact;
- the exact current completion gates for Module 8 and Module 9 and any way the UI can claim formatting is complete without authentic application;
- how existing/returning students hydrate at every boundary, including partially checked Module 8, completed Module 8, partially answered Module 9 lesson, persisted six-item checklist, selected PDF, and already submitted states;
- which current text is APA guidance, which is a teacher requirement, and which is an assignment-specific exception—but is presently mislabeled or conflated;
- the actual current MLK paper requirements and their authoritative source; do not infer a rule merely because existing UI says it;
- whether the Google Doc exporter creates only essay prose or also creates title page, page numbers, citations, and references;
- how the app can know the Google Doc contains the newest essay versus how it can and cannot know formatting is correct;
- every current screenshot/code-native visual, its accuracy, accessibility, and whether it represents the same paper consistently;
- every external APA/template resource, its target section, authority, currency risk, and whether it sends students to an overly broad page;
- the exact current Google Docs desktop menu paths for every required move and how they will be verified in a real editable document;
- all development gates, seeds, acceptance fixtures, production boundaries, and likely files to change;
- the smallest development-only gate that can select the rebuilt Module 8–9 protocol without weakening production behavior;
- the proposed semantic state schema, invalidation signature, compatibility adapter, and confidence limits;
- what can be tested automatically and the truly subjective remainder, if any.

Do not edit until the Module 8/9 ownership boundary, authoritative requirements, canonical model, semantic persistence, invalidation rules, legacy compatibility, and acceptance harness are explicit.

CORE PROBLEM

The current workflow makes students repeatedly certify nearly the same formatting facts:

- Module 8 has a six-item APA checklist;
- Module 8 then has a five-item readiness checklist;
- Module 9 first presents seven recognition-question screens after a large guide;
- Module 9 repeats a six-item formatting checklist;
- Module 9 then presents a five-item PDF checklist.

The PDF inspection is justified because the PDF is a new artifact. The earlier repetitions are not. Students can click through recognition answers and checkboxes without knowing how to perform or inspect the formatting in Google Docs.

The rebuilt architecture must teach, application-coach, and verify at the same time while keeping the protocol simple: one move, one model locus, one exact action, one authentic check.

NONNEGOTIABLE MODULE OWNERSHIP

## Module 8 owns the submission document

Module 8 must do only this:

1. Resolve the newest authoritative finished essay.
2. Create or update one authoritative Google Doc.
3. Verify that the Doc contains that newest essay.
4. Confirm the Doc can be opened by the student.
5. Persist a durable verification state.
6. Continue through the accepted Module 8 success transition.

Module 8 does not teach or certify APA formatting in the rebuilt path. Remove its Format and Ready checklist loops from that path. Do not claim a title page, references page, spacing, page numbers, or other formatting is correct merely because the essay text was exported.

The active Module 8 screen should be understandable within five seconds. When ready, show only:

- Google Doc title;
- created/updated status;
- last verified time;
- current essay word count;
- clear **Open Google Doc** action;
- clear **Continue** action;
- one recovery disclosure shown only when needed/requested.

Essay map, full prose, template, and external resources belong on a quiet shelf or recovery disclosure. The blank template is an alternative/recovery path, not a competing primary action.

## Module 9 owns formatting and submission

Module 9 must:

1. consume Module 8’s authoritative verified Google Doc;
2. show one compact handoff if it is ready;
3. route immediately to the first incomplete formatting move;
4. teach and apply each required move in the real Google Doc;
5. save one definitive Google Doc inspection;
6. guide numbered PDF download steps;
7. inspect the selected PDF as a distinct artifact;
8. upload through the accepted WP-080 path;
9. land on the persistent receipt.

If the Google Doc is stale, unavailable, mismatched, or replaced, show the existing targeted recovery/update actions. Do not replay an empty “Open the paper you prepared” page that merely repeats verification and asks for Continue.

DEVELOPMENT-ONLY GATE

Add one narrow gate for the rebuilt Phase 5 protocol:

- development-only;
- assignment-scoped to the current MLK assignment;
- shared by Module 8, Module 9, their presentation/state helpers, and tests;
- not controlled by local storage, query parameters, or student input;
- production behavior unchanged;
- Developer Testing Panel may seed representative states in development only;
- no production rollout column or remote enablement in this prompt unless a schema migration is independently required for semantic state persistence.

Do not mix this development gate with `writing_spine_mode`, `evidence_argument_mode`, or `vocabulary_transfer_mode`.

ASSIGNMENT FORMATTING REQUIREMENTS CONTRACT

Create one pure, versioned, assignment-owned formatting requirements contract. The active protocol, guide, checklist, model annotations, and PDF expectations must all derive from it.

It must distinguish visibly:

- **APA guidance** — a convention from APA style;
- **Your teacher requires** — a teacher-selected option such as an allowed font choice;
- **For this assignment** — title-page fields, abstract decision, source/citation expectations, or exceptions.

Do not present Times New Roman 12 as the only font APA 7 permits. Do not call a teacher preference a universal APA rule. Do not require an abstract unless the assignment requires one. Do not require a references page or citation pattern without verifying the assignment’s source requirements.

The contract must include stable semantic ids and, where applicable:

- protocol version;
- paper order;
- font family/size requirement;
- line spacing;
- margins;
- paragraph first-line indentation;
- title-page fields and order;
- page-number/header rule;
- body-page title/layout rule;
- abstract requirement/exception;
- in-text citation expectations;
- direct-quotation locator expectations, if required;
- references-page title/order/spacing/hanging indent;
- exact sources required by this assignment or a safe source-resolution mechanism;
- PDF inspection items;
- few, task-specific external references.

If teacher-configurable settings already exist, use them. If configuration is not yet available, make the current MLK requirements explicit in one assignment contract and document the future teacher-settings boundary; do not scatter hard-coded requirements through components.

APA ACCURACY AUDIT

Before authoring the model or coaching, verify the current requirements against authoritative sources and the actual assignment. Specifically audit:

- APA 7 student title-page requirements;
- page-number-only student header versus professional running-head patterns;
- allowed fonts generally versus the teacher’s selected font;
- double spacing and margins;
- body-page title and first-line paragraph indentation;
- author–date citations;
- how to distinguish multiple works by the same author in the same year, if both King works use 1963;
- quotation locators when page numbers are unavailable;
- reference entries for the exact speech and letter versions students used;
- hanging indents and alphabetical order;
- whether the assignment expects a references page and/or abstract.

Do not carry forward the simplified `(King, 1963)` example if it makes the two assigned works ambiguous. Do not invent publication metadata. Record the sources and confidence limits used for the contract.

ONE CANONICAL MODEL PAPER

Create or select one accessible, accurate student model paper matching this assignment’s protocol. It must:

- be safe to use and free of copyright/licensing ambiguity;
- use neutral/synthetic content or a topic that does not provide the student’s MLK analysis answer;
- contain every feature the protocol teaches;
- match the active assignment requirements exactly;
- use the same source/citation logic the protocol teaches;
- work as a whole-paper reference;
- support highlighting one relevant locus at a time;
- have useful alt text and not rely on color alone;
- remain readable at 390×844 and 1440×900;
- be verified visually and semantically before acceptance.

Prefer a repo-owned code-native/HTML model or a carefully generated and checked artifact that can be highlighted consistently. An official APA sample may remain a secondary external reference, but a broad external page is not the primary active-work surface.

STANDARD GUIDED FORMATTING MOVE

Every active formatting move must use the same compact sequence:

1. **See it** — show only the relevant feature highlighted in the canonical model.
2. **Understand it** — one or two plain-language sentences explaining what it does.
3. **Do it** — literal current Google Docs steps/menu path.
4. **Check it** — say exactly where to look in the student’s real document and what correct looks like.
5. **Fix it** — give the exact correction path and common-error distinction.
6. **Confirm it** — actions such as **Looks correct** and **Help me fix it**.

The active move and Google Doc action must appear before the full guide. Reference content remains collapsed and available.

Use explicit numbering and action language. Examples:

- Select all (`Ctrl+A` / `⌘A`) → font menu → required font and size.
- Format → Line & paragraph spacing → Double.
- File → Page setup → one-inch margins, if that is the current Google Docs path.
- Insert → Page numbers → the assignment’s correct option.
- Format → Align & indent → Indentation options → Special indent: First line.
- Format → Align & indent → Indentation options → Special indent: Hanging for references.

Cursor must verify the real menu paths in the current Google Docs UI rather than assuming these examples are current. If desktop and mobile paths differ, teach the supported environment and disclose the limitation concisely.

REQUIRED FORMATTING MOVES

Build the move list from the assignment contract, not from the current six array positions. At minimum audit and support:

1. page setup: font, size, spacing, margins;
2. title page;
3. page numbers/header;
4. body-page layout, paper title, and paragraph indentation;
5. in-text citations and quotation locators required for the assigned sources;
6. references page and hanging indents;
7. paper order and assignment exceptions;
8. one definitive whole-Google-Doc inspection.

Do not add a recognition quiz after stating the answer. If a micro-check is pedagogically useful, it must diagnose a realistic formatting error and immediately route to **Do it / Check it / Fix it**. Correctness trivia is not a gate.

WORKING SET AND COGNITIVE LOAD

On each move:

- desk: active requirement, highlighted model locus, exact Google Docs action, and student confirmation;
- shelf: complete guide, whole model, optional official resources, assignment prompt/essay map, recovery/template;
- one active decision at a time;
- completed moves collapse into a quiet progress list and remain reopenable;
- uncertain/needs-help moves remain visible without blocking unrelated help;
- no giant guide open by default;
- no duplicate orientation paragraphs repeating “do not rewrite” on every page;
- use direct headings such as **Format your Google Doc for this assignment**;
- never imply formatting makes ideas worthy of being taken seriously.

SEMANTIC COMPLETION AND UNCERTAINTY STATE

Replace positional boolean arrays as the rebuilt source of truth with a versioned semantic state keyed by stable move id.

Each move needs enough state to represent:

- `not_started`;
- `in_progress`;
- `looks_correct`;
- `needs_help`;
- `fixed` or re-confirmed;
- `not_applicable` only when the assignment contract permits it;
- last checked time;
- protocol version/signature;
- document identity/version/signature against which it was checked;
- optional safe help/error code (never student prose).

The overall state must include:

- active move id;
- completed move order;
- definitive Google Doc inspection state;
- return destination from a help/fix action;
- protocol signature;
- authoritative Google Doc id and verification signature/timestamp;
- invalidation reason when requirements or document change.

Teach each move once. Reopen/invalidate only when:

- it was not completed;
- the student selected **Help me fix it**;
- the assignment requirements/protocol version changed;
- Module 8 updated/replaced the document or the verified essay changed;
- document verification indicates stale/mismatched content;
- final inspection found a problem.

Never reset formatting progress merely because the student navigated, refreshed, or reopened Module 9.

PERSISTENCE AND LEGACY COMPATIBILITY

Audit whether `module9_checklist` can safely evolve or whether a new versioned JSON field/table is clearer. Use authenticated server persistence, idempotent writes, RLS/service-role boundaries, and recoverable failures.

Support:

1. no existing Module 8/9 state;
2. Module 8 Doc verified but old Format/Ready incomplete;
3. Module 8 old six-item formatting checklist partly/fully complete;
4. Module 8 previously finalized;
5. Module 9 recognition lesson partly complete;
6. `module9_quiz` submitted;
7. old six-item `module9_checklist` partly/fully complete;
8. existing Google Doc verified/unverified/stale/unavailable/replaced;
9. already selected PDF in current session;
10. already submitted final PDF and durable receipt;
11. changed Module 7 essay after earlier Google Doc formatting;
12. malformed/partial/unknown-version semantic state.

Compatibility rules:

- never delete or overwrite student documents or final submissions;
- never make an already submitted student resubmit solely because the instructional protocol changed;
- treat old checked booleans as historical self-report, not proof of authentic application;
- map a legacy item to a semantic move only when its meaning is exact and the same verified Doc/signature still applies;
- otherwise preserve the history and route to a concise re-check, not the recognition quiz;
- `module9_quiz` may remain for historical analytics but must not gate the rebuilt path;
- do not create fake scores for students using the rebuilt protocol;
- completed Module 8 progression remains valid; do not send students backward solely because ownership changed;
- an already-submitted WP-080 receipt remains authoritative and bypasses unfinished preparation UI;
- state upgrades occur through normal authenticated saves, not render-time mutation;
- document adapter confidence limits and future removal criteria.

ONE DEFINITIVE GOOGLE DOC INSPECTION

After individual moves, present one concise final inspection of the real Google Doc. This is the only definitive formatting review.

For each semantic item, state:

- what correct looks like;
- exactly where to look;
- exact Google Docs correction path;
- **Looks correct** / **Help me fix it**;
- link back to the affected move without replaying the protocol.

The final inspection must include the beginning, a representative body page, citations, and the ending/references as required. It is a self-inspection, not a claim that the app can programmatically see Google Docs styling unless the API actually verifies it.

PDF DOWNLOAD, INSPECTION, AND UPLOAD

Preserve the accepted screenshot-based PDF visual and make the visible instructions literally numbered:

1. Open your Google Doc.
2. Click **File**.
3. Point to **Download**.
4. Click **PDF Document (.pdf)**.
5. Wait for the download to finish.
6. Open the file from Downloads.
7. Return to Comp-YouTeacher and select that PDF.
8. Inspect it, then upload it.

Keep detailed troubleshooting under disclosures. The main path must remain visible.

The PDF inspection is a distinct and justified check. Say:

**You checked your Google Doc earlier. Now check that the downloaded PDF still looks correct.**

Use semantic PDF checks derived from the contract:

- file opens;
- entire essay is present;
- required title/references pages appear;
- page numbers are visible;
- nothing is cut off or unexpectedly spaced;
- newest version is present.

Preserve WP-080 behavior:

- KB/bytes for small valid files;
- reject empty, unreadable, malformed, and non-PDF files client- and server-side;
- failed upload keeps the file/check state and offers retry;
- success only after durable storage/database write;
- navigate to the persistent receipt with filename, time, size, receipt id, status, PDF link, trail, and next-step/resubmission guidance;
- dashboard points to the same submitted PDF.

Do not weaken final-upload safety merely to reduce checklist repetition. The Google Doc inspection and PDF inspection concern different artifacts.

REFERENCE ARCHITECTURE

The internal guide must:

- be closed by default;
- use the same assignment contract and model as active moves;
- organize by task/move;
- open directly to the current or requested section;
- avoid duplicating long prose already visible in the active move;
- be searchable only if a simple accessible implementation is feasible—do not add a poor search box for appearance;
- keep optional external sources few and specific.

For external references, prefer authoritative, direct pages and explain what to inspect. At minimum evaluate:

- official APA annotated student sample;
- the exact Purdue OWL page/section relevant to the current task.

Verify links and avoid broad home pages. External references supplement rather than replace in-app teaching.

DEVELOPMENT SEEDS AND FIXTURES

Add a compact configurable WP-092 seed capable of producing:

- new Module 8 Doc state;
- existing verified current Doc;
- stale/mismatched Doc;
- unavailable Doc/recovery;
- new Module 9 protocol;
- mid-move `needs_help` state;
- several completed semantic moves;
- legacy Module 8 checklists;
- legacy Module 9 quiz/checklist;
- requirements/document signature invalidation;
- ready-for-PDF state;
- tiny valid PDF, invalid/empty PDF, failed upload, and existing receipt using safe test mechanisms.

Do not add a clutter of separate panel buttons. Use one seed target with variants. Do not expose production seed routes.

AUTOMATED ACCEPTANCE

Add executable tests proving:

1. rebuilt Module 8 has one create/update/verify/open/continue workflow;
2. rebuilt Module 8 contains no APA formatting or Ready checklist gate;
3. newest Module 7 essay remains authoritative;
4. create/update verification and recovery retain WP-002/WP-030 behavior;
5. Module 8 completion/success advances correctly;
6. Module 9 consumes the same authoritative Doc and does not require a duplicate export;
7. stale/unavailable/mismatch states route to targeted recovery;
8. the requirements contract distinguishes APA/teacher/assignment rules;
9. all rendered guidance/checks derive from stable contract ids;
10. APA accuracy cases, including same-author/same-year sources, are handled correctly;
11. one canonical model covers every move and never exposes the student’s answer;
12. each move provides See / Understand / Do / Check / Fix / Confirm;
13. exact action paths are present and no recognition quiz gates progress;
14. semantic states persist by id rather than array position;
15. `needs_help`, re-entry, and local fix return work;
16. unchanged completed moves remain complete across refresh/revisit;
17. protocol or document signature change invalidates only affected confirmations;
18. legacy Module 8/9 states adapt without false proof or data loss;
19. existing `module9_quiz` history is preserved but not a rebuilt gate;
20. completion does not create a fake quiz score;
21. already-submitted receipt remains authoritative;
22. definitive Google Doc inspection links directly to a failed move;
23. numbered PDF instructions and visual remain accurate;
24. PDF inspection is distinct from the Google Doc inspection;
25. WP-080 validation, upload failure, receipt, refresh, dashboard, and idempotent activity tests remain green;
26. no character/text threshold advances;
27. server save failures preserve current state and offer retry;
28. development gate is narrow and production path remains unchanged;
29. development seeds/panel remain production-denied;
30. accessible names, focus restoration, keyboard order, and responsive layout meet existing contracts.

Run focused WP-002/WP-004–007/WP-028–047/WP-067–072/WP-080/WP-092 tests, proportional Module 7–9 handoff suites, dashboard/submission regressions, and the full relevant production-trust suite.

AGENT BROWSER ACCEPTANCE — REQUIRED

Cursor owns routine acceptance. With the rebuilt Phase 5 gate enabled in development, use real/safely isolated Google Doc operations where authorized and verify at 390×844 and 1440×900:

1. Module 7 newest essay → Module 8 create/update → exact content verification.
2. A student can identify Module 8’s main action in five seconds.
3. Module 8 shows no APA checklist; recovery/template remain secondary.
4. Module 8 success → Module 9 without a duplicate document ritual.
5. Verified current Doc skips the empty Continue-only page and opens the first incomplete move.
6. Walk every formatting move using one model and the real Google Doc action path.
7. Model highlighting changes locus without dumping the whole guide.
8. Choose **Help me fix it**, follow correction, return, and confirm.
9. Refresh/direct reopen resumes the same move and status.
10. Open/close/reopen the full guide at the matching section.
11. Legacy Module 8 and Module 9 states enter the rebuilt protocol honestly.
12. Update/replace the Google Doc and confirm appropriate semantic checks invalidate.
13. Change the upstream final essay and confirm stale formatting is not falsely retained.
14. Complete the one definitive Google Doc inspection and repair one failed item locally.
15. Follow the eight numbered PDF steps with the preserved visual.
16. Select a tiny valid PDF, empty PDF, non-PDF, and malformed PDF; verify accepted/rejected states.
17. Confirm the PDF checklist explains why it is different from the Doc inspection.
18. Simulate upload failure; retain file/state and retry.
19. Valid upload → persistent receipt; refresh/direct reopen shows same receipt.
20. Dashboard final PDF matches the receipt.
21. Already-submitted student bypasses preparation and sees trustworthy completion state.
22. Keyboard-only flow and focus restoration work across moves/help/disclosures.
23. No horizontal overflow; screenshots/model remain useful; active work is visually primary.
24. Production build/source still uses the unchanged legacy path and exposes no WP-092 seed.

Use browser automation, API/database inspection, Google Docs API verification where it can establish facts, and executable tests wherever possible. Do not ask Jason to perform routine clicking, responsive checks, refresh checks, or file-validation checks. Human review is limited to subjective age-fit/tone or an external operation that is technically inaccessible to the agent.

WP-092 CLOSURE EVIDENCE

Before marking Resolved, report:

1. before/after Module 8–9 ownership map;
2. formatting requirements source and rule-kind distinctions;
3. APA accuracy sources and resolved ambiguities;
4. canonical model implementation and verification;
5. guided-move list and exact Google Docs paths;
6. semantic state schema, persistence, invalidation, and failure behavior;
7. legacy compatibility matrix;
8. duplicate checklist/quiz surfaces removed from the rebuilt path;
9. Google Doc and PDF inspection distinction;
10. automated test totals;
11. complete agent browser scenarios and viewport evidence;
12. WP-080 regression evidence;
13. development/production gate evidence;
14. related issue-log updates;
15. genuinely human-only remainder.

FIRST RESPONSE AFTER READING

Return:

1. governing sections read;
2. current Module 7→8→9→receipt→dashboard artifact map;
3. full duplication/gate/persistence audit;
4. proposed Module 8/9 ownership boundary;
5. authoritative formatting-requirements contract and accuracy questions;
6. canonical model plan;
7. guided move architecture;
8. semantic state/invalidation/legacy plan;
9. exact files expected to change;
10. automated and browser acceptance plan;
11. explicit development gate and out-of-scope boundaries.

Then implement, verify, fix all acceptance findings, update WP-092 and directly satisfied older issues with evidence, and report closure. Do not mark WP-092 Resolved until the entire rebuilt Module 8–9 path—including Google Doc work, every formatting move, PDF inspection, upload, and receipt—passes agent acceptance.

OUT OF SCOPE

- production promotion of the rebuilt Phase 5 protocol;
- changing Modules 1–7 instruction or their rollout modes;
- rewriting the student’s essay during formatting;
- automatically claiming Google Doc styling is correct when the app cannot verify it;
- changing final PDF storage, grading, or resubmission policy except to preserve/fix WP-080 trust;
- broad dashboard redesign;
- app-wide visual-system or success-screen redesign;
- deleting legacy Module 8/9 code before stable production promotion;
- adding a general citation generator or fabricating source metadata;
- changing assignment requirements without an authoritative teacher/assignment source.
```
