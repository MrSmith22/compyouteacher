# Cursor Prompt 05 — Whole-Essay Review and Configurable Word Count

Use this prompt only after WP-081, WP-082, and WP-083 are Resolved. This is Phase 2, Slice 4. Keep production-gate promotion, Modules 1–3 repair, and Modules 8–9 APA/submission redesign out of scope.

```text
Implement Phase 2, Slice 4 from the July 20, 2026 Writing Processor revision strategy: turn the end of Modules 6–7 into a concise whole-essay review that checks coherence, development, missing explanation, repetition, section completeness, and the teacher's configured word-count expectation, then routes the student directly to the section that needs repair.

WP-081, WP-082, and WP-083 are accepted foundations. Reuse their stable section identities, section health signals, diagnostic revision panels, Before/After persistence, and server-backed local resume. Do not create a second revision system or flatten section-specific coaching into a generic essay checklist.

Keep the new whole-essay experience behind the same development-only rollout approach. This prompt does not authorize production promotion, Modules 1–3 changes, Modules 8–9 changes, APA work, or broad visual restyling.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Section 1.3: required product shift
   - Section 2: north-star student experience
   - Sections 3.1–3.15: instructional, cognitive-load, configuration, completion, and success contracts
   - Section 4.1: artifact chain
   - Section 4.2: artifact health
   - Section 4.3: assignment configuration
   - Section 4.4: revision diagnostics
   - Module 6 completion and success
   - Module 7 final essay review
   - Phase 2, Slice 4: whole-essay review and word count
   - Section 9, especially settings changes and below-target regression scenarios
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. WP-081, WP-082, and WP-083 in docs/project-standards/walkthroughs/issue-log.md
8. Prompts 02–04, their accepted implementation, tests, gates, and seeds

Create one new bounded issue, WP-084, for this slice. Do not redefine or reopen WP-081–083. Keep WP-084 Open during implementation and Needs Verification until all automated and agent-browser acceptance passes.

FIRST PROGRESS REPORT — AUDIT BEFORE EDITING

Before proposing edits, report:

- where assignment-owned settings live today and how teachers/admins currently change them;
- every existing word-count calculation, display, threshold, and completion gate in Modules 6–9;
- which prose is authoritative at Module 6 review, Module 7 section revision, Module 7 final review, Module 8 export, and Module 9 submission;
- how current revised sections are assembled and whether final_text/full_text/sections can become stale relative to one another;
- how the accepted section identities map a whole-essay finding back to the correct editor;
- how Module 7 resume can leave a section repair and return to final review;
- which existing health checks can be composed at essay level and which require a new conservative whole-essay check;
- what configuration/schema/API/UI changes are actually necessary for a teacher-owned word expectation;
- every remaining hardcoded word threshold that could be mistaken for an assignment requirement.

Do not invent a universal high-school word count. Do not implement until the authoritative essay source and assignment-configuration path are explicit.

PROBLEM TO SOLVE

The current final review is too broad after students have already read aloud and revised each section. It asks whether the essay communicates clearly but does not tell students exactly what to inspect, how to recognize a problem, or where to fix it. Word count is displayed in a few places but is not a coherent teacher-owned expectation, and an arbitrary number could encourage filler or overwhelm students.

The final review should be a short inspection protocol over the essay the student actually revised. It should surface only meaningful findings, explain what the student is looking for, and route one local repair at a time.

TARGET STUDENT EXPERIENCE

At the final review, the student should be able to say:

- I can see my revised essay as complete paragraphs.
- I know exactly what I am checking and how to recognize it.
- I can trace my thesis into each body paragraph's point.
- I can see whether every quotation or paraphrase is followed by explanation.
- I can tell whether my introduction and conclusion express the same argument in fresh language.
- I can spot missing sections and accidental repetition.
- I know my teacher's word-count expectation and where my essay stands.
- If I need more development, I know which idea to explain—not how to add filler.
- I can open the affected section, repair it, and return without replaying the module.

TEACHER-OWNED WORD-COUNT CONTRACT

Implement a small explicit assignment configuration. Reuse the existing assignment settings architecture if it can safely represent the contract. Additive schema/API/UI changes are allowed only after the audit.

Support these modes:

1. off
   - No word-count requirement is shown as an assignment target.
   - Descriptive total and section counts may still appear where useful.
2. advisory_minimum
   - Teacher sets a minimum.
   - The app coaches development below the minimum but does not block completion solely for count.
3. required_minimum
   - Teacher sets a minimum.
   - Final completion may remain locked while below it because the teacher made it a requirement.
   - The screen must explain the requirement and route to substantive development opportunities.
4. advisory_range
   - Teacher sets minimum and maximum.
   - Below minimum prompts development; above maximum prompts focus, relevance, and removal of repetition.
5. required_range
   - Teacher sets minimum and maximum.
   - Final completion may be locked outside the range because the teacher made it a requirement.

Use clear validation:

- nonnegative whole-number values;
- minimum required for minimum/range modes;
- maximum required for range modes and not below minimum;
- no target numbers when mode is off;
- invalid configuration is rejected server-side and never presented as a student failure;
- settings are assignment-owned, authenticated, and durable;
- changing a setting takes effect on the student's next load without rewriting prose or invalidating saved revisions.

Preserve existing assignments safely. A migration must not silently impose a new requirement. Existing assignments default to off unless an authoritative current setting already exists. For the WP-084 development seed, use a conservative 300-word minimum so the workflow can be tested; label it as this seeded assignment's teacher requirement, not a universal high-school rule.

If a teacher-settings screen exists, add the smallest coherent control there. If none exists, add the smallest authenticated teacher/admin assignment-settings surface consistent with the current architecture. Do not bury the only configuration in source code or a developer seed.

WORD COUNT CALCULATION

Create or identify one shared, deterministic prose word-count helper used by Modules 6–8 and tests. Define and document its treatment of:

- repeated whitespace and line breaks;
- punctuation attached to words;
- em dashes and hyphenated terms;
- empty sections;
- outline labels and planning metadata, which must never count;
- title page/reference material, which must not count toward the essay unless the assignment explicitly says otherwise.

Count the current authoritative revised essay, not a stale Module 6 draft. Section counts must sum to the displayed essay total under the same algorithm.

Word count is evidence about assignment length, not evidence of writing quality. Never congratulate filler, claim an essay is strong because it is long, auto-advance a move, or silently generate prose to reach a number.

WHOLE-ESSAY HEALTH CONTRACT

Add a small pure whole-essay review engine that composes accepted section data and health signals. It must return student-actionable findings with:

- stable finding id;
- severity or blocking status derived from evidence/configuration;
- student-facing title;
- concise what-to-check guidance;
- how-to-recognize-it guidance;
- affected section identity/identities;
- suggested local revision target when reliable;
- confidence limit/advisory status;
- current and expected word metrics when relevant.

Required checks:

1. Thesis through body points
   - Compare the saved/current thesis with each body paragraph's planned point and current prose.
   - Flag only clear missing/drift cases; do not require identical wording.
2. Evidence followed by explanation
   - Use accepted section health/provenance and quotation/paraphrase structure.
   - Route to the specific body paragraph and explanation target.
3. Introduction/conclusion argument relationship
   - Confirm both express the same central argument in fresh language.
   - Distinguish a copied thesis from a contradictory or missing relationship.
4. Missing or duplicate sections
   - Detect absent required sections and near-identical body prose.
   - Preserve both texts for student repair.
5. Word-count development/focus
   - Compare the current revised total with teacher configuration.
   - Below target: recommend the highest-confidence underdeveloped section or missing reasoning/evidence explanation.
   - Above target: recommend repetition, off-topic material, or overlong context only when evidence supports it.
   - If no reliable section-level opportunity exists, say that the student should review the teacher requirement and choose where an idea needs fuller explanation; do not invent a target.

Do not build a vague numerical alignment score. Do not silently rewrite prose. Findings should be conservative, explainable, and testable.

MODULE 6 — ASSEMBLED-DRAFT HANDOFF

At the end of Module 6:

- show the assembled essay as paragraphs in essay order;
- show a descriptive total and compact section counts;
- explain briefly that Module 7 will read and revise paragraphs as wholes;
- surface only high-confidence structural problems that prevent a coherent handoff, such as missing sections or exact/near duplicate body paragraphs;
- route local repair to the affected section without replaying the module;
- do not duplicate Module 7's full final-inspection protocol;
- keep completion language honest when a required section is missing.

This should replace/collapse redundant multi-stage review screens rather than add another review wall.

MODULE 7 — CONCISE FINAL INSPECTION

Replace the generic final-review coaching with one compact inspection sequence over the current revised essay:

1. Thesis -> body paragraph points
2. Evidence -> explanation
3. Introduction <-> conclusion
4. Missing/duplicate sections
5. Teacher word-count expectation

For each inspection:

- teach in one or two short lines what the student is checking;
- show how to recognize success or a problem;
- show Pass only when supported by current data;
- show Needs attention with the affected section when supported;
- provide one primary action: Review/Fix [section label];
- keep technical details, full plans, and optional examples on the shelf;
- do not require the student to check a box merely to acknowledge text.

Show one highest-priority finding at a time, with a compact overview of the remaining checks. A student may inspect another check, but the page should not display five equally loud cards or repeat Why this matters/How to succeed/Before you continue for every check.

LOCAL REPAIR LOOP

When the student chooses Fix [section]:

- open the accepted section revision panel at the relevant target;
- retain the whole-essay finding and final-review return destination in server-backed resume state;
- preserve Before/current After behavior;
- save only that section and its revision metadata;
- return directly to final review;
- recompute the essay and findings from authoritative saved data;
- mark the finding resolved only when the evidence actually changes;
- never replay read-aloud or unrelated sections.

If an upstream thesis or plan changed and made a section stale, route to the appropriate accepted repair path and explain why review is needed.

COMPLETION AND GATING

- Never block completion for an advisory word-count mode.
- For required modes, count may participate in the final completion gate because it is a teacher requirement.
- Other blocking conditions must be evidence-backed requirements such as a missing required section, not heuristic quality judgments.
- Advisory coherence findings remain student-owned: the student may confirm and continue when the product cannot know with confidence.
- Persist intentional confirmation with finding/config version so a refresh does not repeatedly demand the same acknowledgment.
- If the teacher changes a required setting, recompute status and explain the changed expectation; do not erase the essay.

The final action should clearly say what will happen next. Preserve the accepted Module 7 completion transition to Module 8.

COGNITIVE LOAD AND VISUAL HIERARCHY

The final review must be shorter and more actionable than the current broad page:

- revised essay visible as readable paragraphs, with the active finding near it;
- one primary repair/continue action;
- compact progress such as 3 of 5 checks clear;
- exact teacher expectation and current count in one place;
- no duplicate checklists;
- no wall of all saved notes;
- optional diagnostic detail disclosed;
- success/attention color supports meaning but does not replace text.

Use direct high-school language. Prefer Develop your explanation in Body Paragraph 2 over Add 57 words. Prefer Cut repeated background over Make the essay shorter.

SEEDS AND FIXTURES

Add development-only, idempotent fixtures using the same production shapes for:

- coherent essay within a 300-word seeded minimum;
- essay below an advisory minimum with one clearly underdeveloped explanation;
- essay below a required minimum;
- essay above an advisory/required range with clear repetition;
- missing required section;
- duplicate/near-duplicate body paragraphs;
- quotation without explanation;
- body point drifting from thesis;
- conclusion contradicting the thesis;
- thesis copied verbatim into conclusion but not contradicted;
- no reliable development target despite below-minimum count;
- teacher changes mode/number after revision;
- two-body and three-body assignments;
- repaired section that clears one finding and returns to final review;
- reload during final review and during the local repair loop.

AUTOMATED ACCEPTANCE

Add executable tests proving:

- one shared word-count algorithm counts only authoritative essay prose and section totals sum to the essay total;
- configuration modes validate and persist correctly, with existing assignments defaulting safely to off;
- advisory modes never block solely for count;
- required modes apply only the configured final gate;
- invalid teacher configuration is rejected server-side;
- settings changes recompute status without altering prose;
- the whole-essay engine finds each required fixture and routes to the correct stable section identity;
- below-target coaching selects a substantive existing development opportunity rather than a numeric filler prompt;
- no reliable target produces honest non-specific coaching rather than an invented diagnosis;
- duplicate/missing/contradiction findings do not erase prose;
- local repair persists, returns, and recomputes findings;
- refresh/direct reopen preserves final-review or local-repair resume;
- Module 8 receives the newest revised essay and the same word count after Module 7 completion;
- no character/word count auto-advances sentence moves;
- accepted WP-081/WP-082/WP-083 behavior remains green.

Run focused WP-081–WP-084 tests, the proportional Module 4–7 suite, and the relevant Module 8 export/word-count tests because this slice changes the authoritative handoff.

AGENT-OWNED BROWSER ACCEPTANCE

Cursor owns routine verification. Use authenticated APIs, real persisted settings, seeded states, reloads, and the development-gated UI at 390x844 and 1440x900.

1. Teacher/admin: set the seeded assignment to advisory minimum 300; reload and prove the student sees 300 as this teacher's expectation.
2. Change to required minimum and a valid range; prove persistence and server validation. Attempt invalid range and show a clear teacher-side error without corrupting the prior setting.
3. Open a coherent essay and show the revised essay, section counts, total, and concise five-check inspection.
4. Open a below-minimum essay with a missing explanation; prove coaching routes to that explanation rather than saying Add N words.
5. Repair the section, save, return directly to final review, and prove the finding/count recompute without replay.
6. In advisory mode, prove the student can continue below the minimum after honest coaching/confirmation.
7. In required mode, prove completion is locked below the minimum and unlocks after authoritative saved prose reaches it.
8. Exercise a below-minimum essay with no reliable target; prove the UI does not invent a diagnosis.
9. Exercise duplicate paragraphs, a missing section, thesis/body drift, quotation-without-explanation, and intro/conclusion disagreement; prove each routes to the correct section and preserves prose.
10. Change the teacher setting after a saved revision; reload and prove the new expectation appears without erased work.
11. Refresh/direct reopen at final review and during a local repair; prove server-backed resume restores the correct state.
12. Complete Module 7 and verify Module 8 receives the newest revised essay and matching word count.
13. At 1440x900, perform a real keyboard Tab pass through check navigation, the primary repair action, essay/section navigation, confirmation when present, and Continue. Report the focus sequence.
14. At 390x844 and 1440x900, verify no horizontal overflow, readable paragraph layout, visible primary action, and no five-card wall.
15. Read and report the exact visible coaching for below/within/above expectation states.

Do not transfer routine browser or teacher-setting verification to Jason. If external authentication prevents a check, use the application's authenticated development harness rather than weakening authorization.

OUT OF SCOPE

- Removing/promoting the development gate
- Modules 1–3 evidence/argument redesign
- Module 8 document-flow redesign beyond verifying the existing newest-essay/count handoff
- Module 9 APA instruction, PDF upload, or receipt changes
- Universal high-school word counts
- AI-generated filler or automatic prose rewriting
- Broad application restyling
- Rubric scoring or grades

STATUS AND FINAL REPORT

Do not mark WP-084 Resolved based only on unit tests or a single seeded happy path. Resolve it only after the full agent-owned acceptance passes.

Report:

1. audited authoritative essay and configuration paths;
2. assignment word-count schema/API/teacher surface and migration behavior;
3. shared count algorithm;
4. whole-essay health contract and confidence limits;
5. Module 6 handoff changes;
6. Module 7 inspection and local-repair loop;
7. advisory versus required completion behavior;
8. tests and exact counts;
9. browser evidence for teacher settings, student states, repair, refresh, responsive layout, and real keyboard order;
10. Module 8 newest-essay/count handoff evidence;
11. confirmation that the development gate and all out-of-scope boundaries remain unchanged;
12. what remains before production promotion of the rebuilt Modules 4–7 writing spine.
```

