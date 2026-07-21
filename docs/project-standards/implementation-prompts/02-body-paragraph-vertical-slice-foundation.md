# Cursor Prompt 02 — Body Paragraph Vertical-Slice Foundation

Use this prompt after Prompt 01 is separated or complete. Do not combine both implementations in one change set.

```text
Implement the first instructional vertical slice from the July 20, 2026 Writing Processor revision strategy: carry one representative body paragraph coherently from paragraph purpose through planning, outlining, guided drafting, and diagnostic revision.

This is a prototype of the shared instructional architecture, not permission to redesign all of Modules 4–7 at once. Build the smallest reusable contract and apply it to one representative Body Paragraph path using the current assignment and current persistence architecture. Do not expose an inconsistent half-finished production path: use the project's existing development/test gating approach if the slice cannot yet safely replace the current path.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Section 1.3: Required product shift
   - Section 2: North-star student experience
   - Sections 3.1–3.10: instructional contracts
   - Sections 4.1–4.4: artifact chain, artifact health, configuration, and revision diagnostics
   - Module 4
   - Module 5
   - Module 6
   - Module 7
   - Phase 2: Rebuild the central writing spine
   - Section 9: Acceptance framework
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. Relevant Module 4–7 issues in docs/project-standards/walkthroughs/issue-log.md

In the first progress report, state which sections govern the work and identify the current code/data path before proposing changes.

PROBLEM TO SOLVE

The current app has paragraph plans, an outline, prose, and revision screens, but the student does not reliably experience those as transformations of the same paragraph. Plans can mismatch evidence, Module 5 does not produce a sufficiently recognizable outline, Module 6 relies too heavily on paragraph-sized drafting, and Module 7 buries the editor while assigning generic strategies without enough diagnosis or before/after comparison.

TARGET STUDENT EXPERIENCE

For one representative Body Paragraph, the student should be able to say:

- This is what this paragraph will prove.
- This is the evidence and reasoning I chose for it.
- This is where it sits in my essay.
- I turned the plan into meaningful sentence moves.
- I can read those moves together as one paragraph.
- I know the most useful thing to revise.
- I can see what I changed and why it is clearer.

AUDIT FIRST

Before editing, map:

- Module 4 paragraph plan data, provenance, completion, and local edit flow;
- Module 5 outline mapping, order, labels, and persistence;
- Module 6 task-relevant artifact selection, draft section storage, validation, and assembly;
- Module 7 paragraph selection, strategy selection, editor position, save behavior, and final navigation;
- how upstream changes mark downstream work for review;
- existing tests and developer fixtures that can safely exercise the path.

Identify where one canonical section identity can link the same Body Paragraph across the four modules. Prefer existing stable IDs/provenance over array-position guessing. Do not add a new persistence system when current artifacts can be extended safely.

REQUIRED SLICE CONTRACT

Define a small reusable contract for the representative paragraph containing at least:

- stable section identity and student-facing label;
- paragraph purpose/point;
- relationship to thesis;
- selected evidence with source provenance;
- evidence context;
- reasoning/audience/purpose explanation;
- intended order of paragraph moves;
- assembled draft prose;
- health/review signals;
- revision target;
- before and after revision state or an equivalent safe comparison representation.

Preserve student ownership. Health signals may flag missing, duplicated, fragmentary, stale, or mismatched work, but must not silently rewrite prose.

MODULE 4 BEHAVIOR IN THE SLICE

- Show the whole essay map before the local paragraph task.
- Make the chosen organizational pattern visible.
- Use the stable label Body Paragraph 1, not Paragraph 1, Plan 1, or Module 4 Paragraph 1.
- Put the paragraph purpose, strongest matching prior evidence, and reasoning on the desk.
- Let the student keep, replace, add, or remove evidence.
- Require an explicit finish action; never auto-advance on character count.
- Support local edit from review without replaying all earlier steps.

MODULE 5 BEHAVIOR IN THE SLICE

- Show the paragraph inside a recognizable essay outline.
- Distinguish paragraph plan from outline.
- Represent the internal move order: point, evidence context, evidence, explanation, thesis connection, and transition when appropriate.
- Use formal outline numbering only in formal-outline view; do not leak it into prose.
- Preserve an accessible reorder mechanism.

MODULE 6 BEHAVIOR IN THE SLICE

- Draft one active rhetorical move at a time.
- Show only the relevant saved plan material for that move.
- Provide a short structural model that does not supply the student's answer.
- Show a live accumulating paragraph preview.
- Keep completed moves collapsed but directly editable.
- Allow an advanced whole-paragraph editing path without making it the default.
- Require explicit save/finish actions.
- Assemble prose only—no internal labels or outline numbering.

MODULE 7 BEHAVIOR IN THE SLICE

- Present the assembled paragraph editor near the top of the active workspace.
- Compare the paragraph with its planned purpose and evidence compactly.
- Diagnose at least these conditions where reliable: plan alignment, evidence presence/provenance, explanation after evidence, thesis connection, transition context, duplication with another body paragraph, and substantial underdevelopment.
- Recommend the highest-leverage target and allow another relevant target.
- Point to the exact sentence or relationship to inspect.
- For transition work, show both sides of the transition.
- Preserve the pre-revision paragraph and show before/after after saving.
- Ask the student to confirm whether the intended relationship is clearer.

WORKING SET AND VISUAL HIERARCHY

The active workspace must be findable without scrolling through the complete notebook. On the desk, show only what the current move requires. Keep the full notebook, other paragraphs, and full evidence history on the shelf under descriptive disclosures.

TEST FIXTURES

Use or add fixtures for:

- coherent paragraph plan and draft;
- evidence from the wrong source;
- fragmentary reasoning;
- duplicated Body Paragraph 1 and Body Paragraph 2 prose;
- upstream thesis/plan change after drafting;
- missing explanation after a quotation;
- transition target with prior-paragraph context;
- local edit and reload persistence.

Do not hardcode the walkthrough student's exact prose into product logic. It may be used as test fixture data.

ACCEPTANCE

- One Body Paragraph can be traced from source evidence and thesis through plan, outline, sentence moves, assembled paragraph, and revision.
- The same stable section identity survives across modules.
- A mismatch is flagged for student repair without erasing their words.
- The editor is visually primary when writing or revising.
- No character threshold advances the student.
- Local repair does not replay the entire module.
- Before/after revision is visible.
- Prose remains free of plan labels and numbering.
- Keyboard, focus, 390×844, and 1440×900 behavior are verified.

IMPLEMENTATION DISCIPLINE

Do not generalize to every paragraph until the representative slice and contract pass focused tests. Do not perform broad visual restyling unrelated to the slice. Do not change Module 8 or Module 9. Keep changes reviewable and document any deliberate temporary gating.

Run focused tests for each touched module and the artifact handoffs, then broader checks proportional to the shared code changed. Perform the browser walkthrough yourself using available browser tools, seeded states, developer controls, responsive viewports, and keyboard checks. Do not delegate routine acceptance to Jason. Request human review only for subjective instructional judgment or an inaccessible external dependency, and explain the exact limitation. Do not mark issues Resolved before agent-run acceptance passes.

FINAL REPORT

Report:

1. current-state artifact map;
2. chosen stable section identity and why;
3. shared slice contract;
4. implementation changes by Module 4, 5, 6, and 7;
5. health diagnostics and their confidence limits;
6. tests and results;
7. exact browser walkthrough evidence produced by the agent;
8. any irreducible human-only review and why it cannot be automated;
9. what remains before safely generalizing to all sections.
```
