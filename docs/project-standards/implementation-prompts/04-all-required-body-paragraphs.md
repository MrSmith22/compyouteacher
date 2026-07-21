# Cursor Prompt 04 — All Required Body Paragraphs

Use this prompt only after WP-081 and WP-082 are Resolved. This is Phase 2, Slice 3. Keep whole-essay coherence, configurable word count, production-gate promotion, and Modules 8–9 out of scope.

```text
Implement Phase 2, Slice 3 from the July 20, 2026 Writing Processor revision strategy: extend the accepted WP-081 body-paragraph vertical-slice architecture from essay-order Body Paragraph 1 to every required body paragraph, while preserving each paragraph's actual purpose, evidence, reasoning, position, and adjacent-section context.

WP-081 and WP-082 are accepted foundations. Reuse their contracts, section identity, sentence-move workspace, advanced-prose behavior, diagnostic revision, server-backed resume, and agent-owned acceptance practices. Do not create a parallel system for Body Paragraphs 2 and 3.

This prompt does not authorize whole-essay review/word-count work, Modules 1–3 changes, Modules 8–9 changes, broad visual redesign, or removal of the development gate.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Section 1.3: Required product shift
   - Section 2: North-star student experience
   - Sections 3.1–3.14: instructional contracts
   - Sections 4.1–4.4: artifact chain, health, configuration, and diagnostics
   - Module 4
   - Module 5
   - Module 6 body-paragraph moves and readiness checks
   - Module 7 diagnostic revision workflow
   - Phase 2, Slice 3: all required body paragraphs
   - Section 9: acceptance framework
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. WP-081 and WP-082 in docs/project-standards/walkthroughs/issue-log.md
8. Prompt 02, Prompt 03, Prompt 03A, their accepted implementations, and current tests

Create one new bounded issue, WP-083, for this slice. Do not redefine or reopen WP-081 or WP-082. Keep WP-083 Open during implementation and Needs Verification until all automated and agent-browser acceptance passes.

FIRST PROGRESS REPORT — AUDIT BEFORE EDITING

Before proposing changes, report:

- the live Module 4 -> Module 5 -> Module 6 -> Module 7 artifact path for every required body paragraph;
- how sourceParagraphIndex survives Module 5 reorder and maps to the correct M6 draftIndex and essay-order Body Paragraph N label;
- every place that still assumes bodyIndex === 0 or treats BP1 as special;
- how body-paragraph count is determined by the assignment rather than hardcoded to exactly three;
- how multiple evidence items, missing evidence, and transition adjacency are represented today;
- which WP-081 helpers/components can be generalized without changing their accepted behavior;
- how the current development gate will remain bounded and reversible.

Do not implement until this map is explicit. Call out any ambiguity in identity or persistence instead of compensating with array-position guesses.

PROBLEM TO SOLVE

WP-081 proved the complete process for one representative body paragraph, but the remaining body paragraphs still risk falling back to the old paragraph-sized drafting and position-cycled revision flow. A student must experience every required body paragraph as the transformation of its own saved plan:

evidence and thesis -> paragraph purpose -> outline moves -> sentence moves -> assembled prose -> diagnosis -> revision -> before/after.

Generalization must not clone BP1's purpose, evidence, prose, or revision target into later paragraphs. Each paragraph must retain its own identity and instructional job even after reorder, reload, upstream edits, advanced-mode use, and revision resume.

TARGET STUDENT EXPERIENCE

For every required body paragraph, the student should be able to say:

- I know what this paragraph—not the previous one—will prove.
- I can see the evidence and reasoning I chose for this paragraph.
- I know how this paragraph supports the thesis and differs from the other body paragraphs.
- I can turn its plan into sentence moves and read them as one paragraph.
- If I use more than one piece of evidence, I can develop each one instead of dropping quotations into a list.
- I can see the paragraph before and after revision.
- I can revise the relationship that actually needs work, including a specific transition when appropriate.

STABLE IDENTITY AND GENERALIZATION CONTRACT

Preserve the accepted durable identity:

- sourceParagraphIndex remains the stable body-plan key across reorder and reload.
- essay order determines the student-facing label Body Paragraph N.
- draftIndex identifies the prose slot only after the ordered outline is mapped; it is not the durable plan identity.
- draft_meta.verticalSlice.movesBySourceIndex and revisionBySourceIndex remain keyed by sourceParagraphIndex.

Generalize the existing development gate from essay-order BP1 to every required body paragraph. Keep the gate development-only for this slice. Production behavior must remain unchanged until a later promotion decision.

Do not add UUIDs or a new database table unless the audit proves the accepted identity cannot safely represent a real case. Do not key saved moves or revision state only by essay order.

The generalized contract must:

- create independent normalized move state for each sourceParagraphIndex;
- preserve independent advancedProse and active move state for each paragraph;
- assemble each paragraph without labels or numbering;
- retain paragraph-specific purpose, thesis relationship, evidence provenance, evidence context, and reasoning;
- preserve independent revision targets, baselines, After prose, and clearer confirmations;
- mark stale downstream work when the matching upstream plan changes without erasing student prose;
- detect duplicate or near-duplicate prose across body paragraphs without assuming one copy is automatically disposable.

MODULE 4 — EVERY REQUIRED BODY PLAN

- Show the complete essay map before local planning.
- Use stable labels Body Paragraph 1, Body Paragraph 2, and so on everywhere in the student path.
- Keep the selected organizational pattern visible enough to explain why the paragraphs have different jobs.
- Pull forward the strongest matching saved evidence for the active paragraph, with source provenance.
- Let students keep, replace, add, or remove evidence.
- Require reasoning that explains why each evidence item belongs in this paragraph.
- Preserve explicit finish behavior and local editing from final review.
- A local correction to Body Paragraph 2 or 3 must not replay Body Paragraph 1.
- Never auto-advance from character or word count.

Do not hardcode three body paragraphs. Render and persist the assignment's required count, with fixtures covering at least two and three body paragraphs.

MODULE 5 — ORDERED WHOLE-ESSAY OUTLINE

- Display every required body paragraph in both writing-plan and formal-outline views.
- Derive numbering from essay order after reorder; preserve sourceParagraphIndex underneath.
- Show the correct move order for each paragraph: point, evidence context, evidence, explanation, audience/purpose reasoning, thesis connection, and transition when appropriate.
- For multiple evidence items, represent a repeated context -> evidence -> explanation sequence rather than flattening all evidence into one move.
- Keep accessible Move earlier / Move later controls and verify identity survives reorder and reload.
- Roman numerals belong only to formal-outline view and never to assembled prose.
- Editing one outline card must update only the matching plan/paragraph and mark only genuinely affected downstream work stale.

MODULE 6 — SENTENCE MOVES FOR ALL BODY PARAGRAPHS

Apply the accepted SectionMoveWorkspace/body-paragraph move engine to every required body paragraph behind the development gate.

For each active paragraph:

- show Step N of M;
- show one active move and only its mapped desk artifacts;
- keep the paragraph point and thesis relationship specific to this paragraph;
- show the selected evidence item and its context/reasoning for the appropriate move;
- support repeated evidence sequences when the plan contains multiple evidence items;
- show a prose-only live accumulating preview;
- keep completed moves directly editable;
- preserve a first-class advanced whole-paragraph source of truth across rerender and reload;
- switching between paragraphs must not concatenate, replace, or display another paragraph's moves;
- explicit Keep going controls section advancement; counts must not auto-advance;
- reloading Body Paragraph 2 or 3 must resume that paragraph and active mode without replaying earlier sections.

Transition behavior must use actual adjacency after outline reorder:

- a transition move may show the end of the previous paragraph and/or the purpose of the next paragraph when that context is useful;
- the final body paragraph must not be required to bridge to a nonexistent next body paragraph;
- transition context must update when paragraphs are reordered.

MODULE 7 — DIAGNOSTIC REVISION FOR ALL BODY PARAGRAPHS

Apply the accepted diagnostic revision panel to every required body paragraph behind the development gate.

For each paragraph:

- keep the editor visually primary;
- show its actual planned point, selected evidence, and thesis relationship compactly;
- recommend a target from the paragraph's own health signals and the student's read-aloud observation, not from paragraph number;
- allow another relevant target;
- preserve an untouched Before baseline on first workspace entry;
- show live After while editing and durable Before/After after save and refresh;
- persist the active section and revision target through server-backed resume;
- allow local repair without replaying earlier paragraphs;
- ask whether the intended relationship is clearer.

Diagnose conservatively where reliable:

- missing or wrong-source evidence;
- quotation/paraphrase without explanation;
- missing audience effect or purpose reasoning;
- weak thesis connection;
- plan/prose mismatch or stale upstream work;
- duplicate/near-duplicate body paragraphs;
- transition problem using both sides of the actual handoff;
- substantial underdevelopment.

Diagnostics are advisory. Explain confidence limits in code/tests. Never silently rewrite or erase prose.

COGNITIVE LOAD AND COACHING

Preserve the accepted desk/shelf model:

- desk: active paragraph, active move/target, and only required plan material;
- shelf: full notebook, other paragraphs, and full evidence history under disclosures.

Do not add a new orientation wall for every paragraph. After the first body paragraph teaches the process, later paragraphs should use shorter orientation while keeping Step N of M, the paragraph's distinct job, and its relevant notes explicit.

Use direct high-school language. Teach how the current paragraph differs from the previous one. Models should reveal structure without supplying prose for the student's assignment.

WORD COUNT BOUNDARY

Do not implement the later whole-essay coherence or configurable word-count slice here. Preserve useful descriptive paragraph counts if already present, but do not add hard minimums, quality claims, filler incentives, or count-based advancement.

SEEDS AND FIXTURES

Add one development-only, idempotent seed that creates a complete, internally consistent all-body-paragraph path for Modules 4–7. It must use the same shapes production screens consume and must not weaken prerequisite validation.

Fixtures must cover at least:

- two body paragraphs with distinct purposes and sources;
- three body paragraphs with distinct purposes, evidence, and reasoning;
- reorder where sourceParagraphIndex survives a changed essay position;
- one paragraph with two evidence items and repeated evidence-development moves;
- wrong-source evidence in only one paragraph;
- fragmentary reasoning in only one paragraph;
- duplicate/near-duplicate BP1/BP2 prose;
- missing explanation after a quotation;
- upstream change to one paragraph plan after drafting;
- transition target with actual previous/next context;
- final body paragraph with no next-body transition requirement;
- independent advanced mode for BP2 and BP3 across reload;
- independent revision Before/After and resume for BP2 and BP3;
- two-paragraph assignment and three-paragraph assignment counts.

AUTOMATED ACCEPTANCE

Add executable tests proving:

- every required body paragraph gets its own contract/state keyed by sourceParagraphIndex;
- labels come from essay order while persistence survives reorder;
- multiple-evidence move sequences assemble in the intended order;
- prose contains no Step labels, plan labels, or Roman numerals;
- BP2/BP3 moves and advancedProse cannot leak into each other or BP1;
- save/reload and server-backed resume restore the correct body paragraph and active mode;
- revision Before/After and selected target persist independently for every paragraph;
- transition diagnostics use current adjacency and do not require a nonexistent next paragraph;
- a one-paragraph mismatch is flagged without contaminating or erasing other paragraphs;
- duplicate detection compares body paragraphs while preserving both students' text states for repair;
- local edit does not replay completed paragraphs;
- character and word counts do not auto-advance;
- accepted WP-081 and WP-082 behavior remains green.

Run the focused WP-081/WP-082/WP-083 suites, then the proportional Module 4–7 suite.

AGENT-OWNED BROWSER ACCEPTANCE

Cursor owns routine verification. Use seeded states, authenticated APIs, real reloads, and the actual development-gated UI. Verify at 390x844 and 1440x900.

1. Trace a three-body-paragraph essay from Module 4 map through Module 5 writing/formal outline, Module 6 sentence moves/assembled prose, and Module 7 diagnosis/before-after.
2. Show visible evidence that Body Paragraphs 1, 2, and 3 have different purposes, evidence, reasoning, and prose.
3. Reorder two paragraphs in Module 5, reload, and prove sourceParagraphIndex stayed with the correct plan while Body Paragraph N labels followed the new order.
4. Draft a paragraph with two evidence items and prove both context/evidence/explanation sequences appear in the assembled prose without labels.
5. Edit BP2 sentence moves, switch to BP3, return to BP2, reload, and prove no state leakage.
6. Replace BP3 in advanced mode with a unique marker, reload, and prove only that advanced prose remains for BP3 while BP1/BP2 remain intact.
7. Enter M7 BP2, change the recommended target, edit, save, refresh/direct reopen, and prove Before is untouched and After/target/resume are durable.
8. Repeat save/refresh/resume for BP3.
9. Exercise a transition target and visibly show both sides of the current handoff after reorder.
10. Create one mismatch/duplicate fixture and show targeted advisory repair without erased prose.
11. Use Module 4 or Module 5 local edit on a later paragraph and prove the student returns locally rather than replaying BP1.
12. Perform a real keyboard Tab pass through the active editor, move/target controls, Back, Save, and Keep going. Report the focus sequence.
13. Verify no horizontal overflow, editor primacy, and usable controls at both viewports.
14. Read and report visible coaching for BP2/BP3; confirm later-paragraph orientation is shorter without becoming ambiguous.

Do not assign routine browser verification to Jason. If a browser method cannot synthesize a required interaction, use another agent-owned method or explain the specific tooling failure and keep WP-083 Needs Verification.

OUT OF SCOPE

- Introduction/Conclusion redesign beyond regression fixes
- Whole-essay final review, coherence diagnostics, section distribution, or configurable word count
- Removing/promoting the development gate
- Modules 1–3 evidence/argument redesign
- Modules 8–9 APA/export/submission work
- Broad application restyling
- New persistence tables without a demonstrated identity gap

STATUS AND FINAL REPORT

Do not mark WP-083 Resolved based only on unit tests or seeded screenshots. Resolve it only after the full agent-owned browser acceptance passes.

Report:

1. audited all-body-paragraph artifact map and former BP1-only assumptions;
2. stable identity, reorder mapping, and persistence shape;
3. how the WP-081 engine was generalized without parallel code;
4. behavior changes by Modules 4, 5, 6, and 7;
5. multiple-evidence and transition behavior;
6. diagnostics and confidence limits;
7. tests and exact counts;
8. seeded browser state transitions, reload evidence, and non-leakage evidence;
9. responsive and real keyboard evidence;
10. confirmation that the development gate and all out-of-scope boundaries remain unchanged;
11. what remains for Phase 2, Slice 4: whole-essay review and configurable word count.
```

