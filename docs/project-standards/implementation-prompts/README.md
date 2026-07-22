# Revision Program — Cursor Prompt Index

These prompts implement the [Complete Walkthrough Revision Strategy](../walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md) in bounded increments.

Cursor also receives the always-applied repository rule at `.cursor/rules/writing-processor-revision-strategy.mdc`. The rule requires the canonical strategy and relevant standards to be read before student-facing changes.

## How to use these prompts

1. Start from a clean understanding of the current branch and preserve unrelated work.
2. Give Cursor one numbered prompt at a time.
3. Do not combine prompts in one implementation pass.
4. Require Cursor to finish automated checks **and perform its own browser acceptance** wherever technically possible.
5. Jason should test only irreducible subjective or externally inaccessible conditions. Routine clicking, responsive checks, refresh checks, keyboard checks, and error-path checks belong to Cursor or Codex.
6. Do not mark the related issue Resolved or start a dependent prompt until agent-run acceptance has passed and any genuinely human-only judgment has been identified explicitly.

## Prompt sequence

| Prompt | Purpose | Dependency |
|---|---|---|
| [01 — Submission trust and persistent receipt](01-submission-trust-and-persistent-receipt.md) | Prevent invalid PDF submission and replace the transient confirmation with a durable receipt synchronized with the dashboard | None; independent critical trust fix |
| [02 — Body Paragraph vertical-slice foundation](02-body-paragraph-vertical-slice-foundation.md) | Establish the shared contract that carries one body paragraph from plan through draft and diagnostic revision | Prompt 01 is independent; do not mix its files into this task |
| [03 — Introduction and conclusion vertical slices](03-introduction-conclusion-vertical-slices.md) | Extend the accepted artifact-to-sentence-to-revision architecture with section-specific moves and diagnostics for the essay's opening and closing | WP-081 / Prompt 02 must be Resolved |
| [03A — WP-082 corrective acceptance](03a-wp082-corrective-acceptance.md) | Repair the fresh browser-acceptance failures in Module 7 reload, the WP-082 Module 5 seed, and Module 4 stable labels | Prompt 03 implemented; WP-082 remains Needs Verification |
| [04 — All required body paragraphs](04-all-required-body-paragraphs.md) | Extend the accepted plan-to-sentence-to-diagnostic-revision process to every required body paragraph without losing paragraph-specific identity or evidence | WP-081 and WP-082 must be Resolved |
| [05 — Whole-essay review and configurable word count](05-whole-essay-review-and-word-count.md) | Add concise essay-level coherence/development checks, teacher-owned word expectations, and direct local repair | WP-081, WP-082, and WP-083 must be Resolved |
| [06 — Production promotion of Modules 4–7](06-production-promotion-modules-4-7.md) | Replace development-only selection with a safe production rollout, legacy-artifact compatibility, rollback, and production-build acceptance | WP-081 through WP-084 must be Resolved, including remote migrations |
| [07 — Evidence-to-argument vertical slice](07-evidence-to-argument-vertical-slice.md) | Establish one traceable Module 2→3 comparison from verified passages through a staged comparative thesis and Module 4 proof directions | WP-085 must be Resolved; preserve WP-079 and the production Modules 4–7 spine |
| [08 — Generalize evidence-to-argument directions](08-generalize-evidence-to-argument-directions.md) | Extend the accepted Module 2→3 slice across all nine canonical WP-079 frames and student-created directions without weakening both-work readiness | WP-086 must be Resolved; preserve WP-079 ranking and keep the generalized slice development-only |
| [09 — Production promotion of Modules 2–3](09-production-promotion-modules-2-3.md) | Promote the accepted evidence-to-argument spine with assignment-owned rollout, legacy/v1/v2 compatibility, rollback, preflight, and production-build acceptance | WP-087 must be Resolved; preserve WP-079 and the independent production Modules 4–7 rollout |
| [10 — Transfer-oriented vocabulary foundation](10-transfer-oriented-vocabulary-foundation.md) | Rebuild one representative ethos lesson from familiar choice through audience effect, purpose, King application, and assignment transfer | WP-088 must be Resolved; preserve WP-078 and keep the representative lesson development-only |
| [11 — Generalize transfer-oriented vocabulary](11-generalize-transfer-vocabulary.md) | Extend the accepted transfer lesson across rhetoric, all three appeals, audience, and purpose with concept-specific teaching and lossless ethos-state migration | WP-089 must be Resolved; preserve quiz policy and keep all generalized lessons development-only |

Future prompts should production-promote the generalized Module 1 vocabulary process, consolidate the Module 8–9 APA protocol, improve the shared visual/success system, and eventually remove legacy paths after stable production periods.
