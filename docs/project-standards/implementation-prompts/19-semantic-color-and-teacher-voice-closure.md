# Cursor Prompt 19 — Semantic Color and Teacher-Voice Closure

Use this prompt only after WP-097 is Resolved and the shared workspace hierarchy is the production default. This closes the remaining student-facing Phase 6 consistency gaps: application-wide instructional color semantics and a stable writing-teacher voice.

```text
Complete an application-wide student-facing semantic-color and teacher-voice sweep across the production Modules 1–9 active workspaces, recovery states, success screens, and student dashboard.

Close WP-061 only after every current student-facing surface uses the accepted instructional role system correctly. Close WP-011 only after high-traffic student language consistently sounds like a writing teacher while retaining precise operational labels where students must perform technical actions.

This is a presentation and language-system closure task. Do not change instructional sequence, answer correctness, artifact content, saves, progression, rollout modes, Google Doc/PDF behavior, receipt authority, grading, teacher dashboard, or assignment settings.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2
   - Sections 3.1–3.16
   - Sections 4.1–4.5
   - Section 6, especially semantic color, teacher voice, journey language, action hierarchy, and success variants
   - Phase 6 and its exit condition
   - Epic H
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. docs/design-system-v1.md
8. WP-011, WP-018, WP-047, WP-050, WP-053, WP-056, WP-061, WP-062, WP-069, WP-072–WP-078, WP-089–WP-097 in the issue log
9. lib/ui/instructionalColorContract.js
10. lib/ui/hierarchyContract.js
11. lib/ui/taskWorkspaceContract.js and taskWorkspaceCoverageRegistry.js
12. lib/ui/writingJourneyStages.js
13. every TaskWorkspaceFrame/Region adapter and SuccessExperienceShell variant
14. all shared instruction, feedback, status, recovery, artifact, desk, shelf, editor, revision, success, and action primitives
15. all student-facing strings in production Module 1–9 workspaces, success routes, recovery states, and student dashboard
16. current action/status color usage in buttons, banners, badges, alerts, checklists, progress, and receipts
17. existing WP-061, hierarchy, action-affordance, teacher-guided-flow, copy, accessibility, and visual tests

Create one new bounded issue, WP-098. Keep it Open during implementation and Needs Verification until the complete color/voice inventory, automated validation, development/browser acceptance, and clean production-build acceptance pass.

Do not reopen resolved issues. Add evidence to WP-018 and other older issues only when the specific original surface is verified. WP-061 and WP-011 are app-wide: do not mark either Resolved from a representative sample.

FIRST PROGRESS REPORT — COLOR AND VOICE INVENTORY

Before editing, produce two complete inventories tied to the WP-097 active-work coverage registry and all success/dashboard/recovery surfaces.

COLOR INVENTORY

For each rendered student-facing surface family, record:

- component/route;
- semantic instructional role, if any;
- current token/classes;
- visible non-color label/structure;
- whether the role is correct, missing, duplicated, or misleading;
- action/status color, if any;
- contrast/focus/reduced-motion implications;
- whether the surface needs no semantic color.

Explicitly identify:

- teacher coaching/instruction;
- student-created thinking/selections;
- source evidence;
- drafting/writing surfaces;
- revision surfaces;
- reference/shelf/history;
- readiness/completion;
- warning/recovery/error;
- primary, secondary, final, reference, and destructive actions;
- neutral page chrome.

Report every misuse, including:

- success green used for neutral saved work;
- evidence gold used as a generic accent;
- revision orange confused with final-action orange;
- instruction blue used on active student writing;
- student-thinking teal used on source evidence;
- reference gray applied to required instruction;
- color-only readiness/error meaning;
- multiple saturated roles competing on one screen;
- arbitrary local Tailwind colors that bypass the contract;
- missing revision-role treatment in Module 7;
- success and dashboard colors inconsistent with the accepted success family.

VOICE INVENTORY

For every high-traffic student-facing string family, record:

- route/component/state;
- current wording;
- job of the string: task question, coaching, feedback, status, action, technical instruction, recovery, success, or reference;
- whether it is teacher voice, necessary technical language, implementation jargon, LMS/transactional language, repetitive, vague, or falsely reassuring;
- proposed language rule, not merely a one-off replacement.

Explicitly audit:

- task headings and questions;
- “Your job right now” copy;
- Check/feedback/Continue sequences;
- Back/Save/Finish labels;
- module transitions and success copy;
- error/retry/recovery messages;
- Google Doc creation/update/verification wording;
- APA and PDF download/upload instructions;
- receipt/submission truth;
- dashboard status/actions;
- legacy/compatibility states still reachable in production;
- empty/loading states;
- teacher/assignment/APA requirement labels.

Identify implementation language such as internal step ids, schema/version names, source indexes, rollout/gate terminology, “processor,” “export” when the student is actually creating/updating a Google Doc, and quiz/score framing that no longer matches the accepted teaching flow.

Do not classify precise technical verbs as bad merely because they are operational. `Open Google Doc`, `Download PDF`, `Choose file`, and `Upload Final PDF` may be the clearest teacher guidance for a real action.

Also report:

- all string registries/contracts already available;
- the smallest shared language guide/contract needed;
- whether any proposed copy change could alter a correctness boundary, gate, legal/submission meaning, or APA distinction;
- files expected to change and exact automated/browser plan.

Do not edit until both inventories are complete and each proposed change is classified as semantic styling, wording-only, or intentionally unchanged technical language.

SEMANTIC COLOR SYSTEM

Use the existing exact instructional role ids:

- `instruction`
- `student-thinking`
- `evidence`
- `writing`
- `revision`
- `reference`

Do not add parallel synonyms or a second palette.

Role rules:

1. Instruction — teacher coaching, how-to directions, models, and required guidance.
2. Student thinking — the student’s ideas, selections, observations, and pulled-forward reasoning.
3. Evidence — source quotations, source observations, and supporting details with provenance.
4. Writing — prose drafting, written responses, and finished prose being inspected as writing.
5. Revision — controls, targets, comparisons, and editors whose current job is strengthening existing prose.
6. Reference — shelves, archives, full guides, optional examples, and secondary resources.

Action/status rules remain separate:

- primary forward action uses the accepted primary action treatment;
- final irreversible/high-stakes action uses the accepted final treatment;
- secondary/local/retry actions use the accepted secondary hierarchy as behavior dictates;
- readiness/completion uses success status treatment plus text/icon/structure;
- warning/recovery uses warning or destructive treatment plus explicit language;
- source evidence gold is not a warning color;
- revision orange is not an Upload/Finish button color merely because both are warm hues.

Every colored instructional surface must retain a visible textual/structural label. Screens must remain understandable in grayscale and to users who cannot distinguish the colors.

MODULE 7 REVISION-ROLE CLOSURE

WP-061 remains open specifically because the revision-role sweep is incomplete. Audit and correct every Module 7 revision family:

- read-aloud prose uses `writing`, not `revision`, until the student begins changing it;
- observations/choices use `student-thinking`;
- diagnostic recommendation/coaching uses `instruction` or `revision` according to whether it teaches or hosts the revision decision;
- revision editor, target/locus, before/after comparison, clearer-confirm, and local repair use `revision` where appropriate;
- matched source evidence remains `evidence`;
- plan/thesis notes pulled from the student remain `student-thinking`;
- full essay/notebook/history remains `reference`;
- whole-essay word-count readiness remains a status, not a revision-colored artifact;
- final review distinguishes revised writing, outstanding revision finding, readiness, and reference.

Do not paint the entire Module 7 page orange. The active revision locus should be identifiable without making every surrounding card equally loud.

APPLICATION-WIDE COLOR CLOSURE

Use the WP-097 coverage registry to verify all active-work families, plus:

- Module 1–9 success screens;
- Module 9 durable receipt and missing-receipt recovery;
- student dashboard active and completed states;
- module gates/configuration failure states;
- loading, empty, save failure, stale/mismatch, and retry states;
- Google Doc/PDF technical workflow;
- disclosures and reference shelves.

Simple neutral surfaces should remain neutral. Semantic color is another teacher, not decoration.

TEACHER-VOICE CONTRACT

Add a concise, testable writing-teacher voice guide/contract in the design/project standards and, where useful, a small pure string/taxonomy helper. Do not centralize every sentence into one enormous string file.

The contract must distinguish:

- task question: plain, direct, student-addressed;
- coaching: short explanation connected to the current decision;
- teaching feedback: explains why a choice works or needs another look;
- status: factual, calm, and artifact-backed;
- recovery: names the problem, preserves trust, and gives the next safe action;
- technical instruction: literal UI verb and destination;
- success: names the actual accomplishment and next use;
- reference: optional and clearly secondary.

Preferred voice:

- conversational but not childish;
- specific about the student’s current work;
- reader- and purpose-centered;
- confident without false certainty;
- concise enough for the current decision;
- respectful of student ownership;
- explicit when the system is uncertain.

Avoid:

- software narration (`the processor`, `flow state`, `schema`, `export row`);
- empty LMS commands without context (`Complete`, `Proceed`, `Submit` as a heading);
- repeated reassurance that writing is finished on every neighboring card;
- praise disconnected from evidence;
- pass/fail or score language in teaching practice where the accepted flow uses feedback;
- pretending a save/upload/submission happened before durable evidence exists;
- presenting a teacher preference as universal APA law;
- generated prose or language that takes authorship from the student.

Do not ban necessary button labels globally. A button may say `Continue`, `Save`, or `Upload Final PDF` when adjacent task/coaching copy makes the action clear. Voice improvement should not make technical steps poetic or ambiguous.

COPY-CHANGE SAFETY

- Preserve exact artifact and submission truth.
- Preserve APA/teacher/assignment requirement distinctions.
- Preserve error specificity needed for recovery.
- Preserve action accessible names and analytics/test selectors unless there is a justified migration.
- Preserve translation of labels into stable student-facing section names.
- Do not change input prompts in ways that alter what constitutes a valid answer.
- Do not change answer options, target answers, or scoring under a voice pass.
- Do not rewrite student-authored text.
- Do not modify persisted historical strings merely to match presentation copy.

When a string is correct and clear, leave it alone. Avoid churn for stylistic novelty.

AUTOMATED ACCEPTANCE

Create focused WP-098 tests for at least:

1. Every production active-work coverage family declares valid instructional roles or explicit neutral/no-role treatment.
2. Unknown role ids fail clearly.
3. Instructional roles use existing contract tokens only.
4. Every semantic role has non-color label/structure.
5. Revision-role mapping covers every Module 7 revision family.
6. Action/status colors remain distinct from instructional roles.
7. Reference styling does not contain required instruction-only content.
8. Success/receipt/dashboard states retain truthful completion/recovery semantics.
9. Voice taxonomy/guide covers task, coaching, feedback, status, recovery, technical instruction, success, and reference.
10. No internal ids/schema/rollout/gate vocabulary appears on current production student surfaces.
11. APA, Google Doc, PDF, and submission technical labels retain literal operational clarity.
12. Copy changes do not alter option values, correctness, gates, destinations, test ids, or persistence keys.
13. Existing WP-011, WP-018, WP-047, WP-053, WP-061, WP-069, WP-072–078, WP-089–097, success, receipt, and accessibility suites pass.

Avoid a naive repository-wide banned-word test that flags internal code/comments or legitimate technical instructions. Validate rendered production string registries/components and scoped contracts.

AGENT-RUN BROWSER ACCEPTANCE

At 390×844 and 1440×900, with reduced motion and a grayscale/high-contrast inspection, exercise every WP-097 layout family and verify:

- the student can distinguish coaching, their own thinking, evidence, writing, revision, and reference without relying only on color;
- the active role is visually meaningful but not oversaturated;
- readiness, warning, error, and actions cannot be confused with evidence/revision roles;
- only one primary action dominates;
- focus remains visible;
- no color/label change creates overflow or layout shift;
- screen-reader-accessible labels remain meaningful;
- task and feedback language sounds consistent across modules;
- technical instructions remain literal and executable;
- loading/error/recovery copy is calm, accurate, and actionable;
- refresh/resume/direct reopen preserves the same artifact/state and wording.

Required deep checks:

1. M1 notice/choice/feedback/transfer and quiz gate.
2. M2 source evidence, direction selection, ambiguity/missing-side recovery.
3. M3 repair/explain/thesis/proof and stale-save recovery.
4. M4 plan/evidence/reasoning and local review repair.
5. M5 reorder/edit/review and plan/formal view.
6. M6 intro/body/conclusion, evidence move, advanced mode, save failure.
7. M7 read-aloud, observation, each section revision family, before/after, whole-essay finding, advisory/required word count, local Fix/return.
8. M8 create/update/verify/ready/recovery.
9. M9 guided move, help/fix, Doc inspection, invalid/valid PDF, upload failure, receipt and missing receipt.
10. Student dashboard active and completed states.

Production acceptance:

- clean production build with no presentation override;
- color/voice changes visible in production;
- all instructional rollout modes unchanged and database-backed;
- `/api/dev/panel` and reset remain denied;
- no fixtures or acceptance-only copy in production chunks;
- no new logging of student prose, sources, private URLs, or responses.

Record a machine-readable pass matrix and representative screenshots. Human review may assess subjective warmth/age fit, but the agent owns consistency, meaning, contrast, accessibility, overflow, technical accuracy, and behavior.

ACCEPTANCE CRITERIA

- Every current student-facing production surface uses a correct accepted role or intentional neutral treatment.
- Module 7 revision-role semantics are complete and verified.
- Students can identify semantic roles without color alone.
- Action/status meaning remains distinct from instructional color.
- High-traffic language consistently follows the writing-teacher voice contract.
- Technical Google Doc/PDF/submission instructions remain precise.
- No internal implementation language leaks to students.
- No copy/style change alters instructional correctness, data, gates, progression, or receipt truth.
- Mobile, desktop, grayscale/high-contrast, keyboard, refresh, recovery, and production checks pass.
- WP-061 and WP-011 are marked Resolved only with the full app-wide evidence.
- WP-098 records the inventories, changes, test totals, browser matrix, and production evidence.

OUT OF SCOPE

- Teacher dashboard or teacher-facing data redesign.
- New colors, rebranding, themes, dark mode, or broad typography redesign.
- New instruction, questions, scoring, artifacts, or persistence.
- Success/workspace structural redesign beyond correcting semantic-role defects.
- New database modes or migrations.
- Target-age usability sessions; those belong to Phase 7.
- Legacy-path removal.

FIRST RESPONSE REQUIRED

Before editing, provide:

1. Complete student-facing color-role inventory.
2. Complete high-traffic voice inventory.
3. Module 7 revision-role correction map.
4. Proposed teacher-voice taxonomy/guide.
5. Strings/styles intentionally unchanged and why.
6. Files expected to change.
7. Automated and browser acceptance plan.

Then implement, test, run agent-owned development and production acceptance, update WP-098 and genuinely affected older issues, and identify only irreducible subjective warmth/age-fit judgment as a human remainder.
```
