# Cursor Prompt 03 — Introduction and Conclusion Vertical Slices

Use this prompt only after WP-081 / Prompt 02 is Resolved. Keep this work separate from Modules 8–9 and from generalizing the body-paragraph slice to Body Paragraphs 2 and 3.

```text
Implement Phase 2, Slice 2 from the July 20, 2026 Writing Processor revision strategy: extend the accepted WP-081 vertical-slice architecture to the introduction and conclusion with section-specific planning, sentence moves, assembled prose, diagnostics, and before/after revision.

WP-081 is the accepted foundation. Reuse its proven patterns instead of creating a parallel writing system. This prompt does not authorize generalizing the slice to Body Paragraphs 2 and 3, removing the development gate, changing Modules 8–9, or broadly restyling the application.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Section 1.3: Required product shift
   - Section 2: North-star student experience
   - Sections 3.1–3.14: instructional contracts and word-count coaching
   - Module 4
   - Module 5
   - Module 6, especially Introduction moves and Conclusion moves
   - Module 7
   - Phase 2, Slice 2: introduction and conclusion
   - Section 9: Acceptance framework
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. WP-081 in docs/project-standards/walkthroughs/issue-log.md
8. The accepted WP-081 implementation, tests, and current development gate.

Create one new issue, WP-082, for this bounded slice. Do not redefine or reopen WP-081. In the first progress report, state the governing sections, map the current introduction/conclusion artifact path, and identify exactly which WP-081 contracts/components can be generalized safely before proposing edits.

PROBLEM TO SOLVE

The introduction and conclusion currently have editable prose, but they do not yet participate fully in the instructional process established by WP-081. Students need to experience their saved plans becoming purposeful sentence moves, those moves becoming readable sections, and those sections receiving diagnostics appropriate to openings and closings.

An introduction is not a body paragraph without evidence, and a conclusion is not a shorter body paragraph. Do not reuse body-paragraph labels, evidence requirements, or diagnostics where they do not fit.

TARGET STUDENT EXPERIENCE

For the introduction, the student should be able to say:

- I know what background my reader needs.
- I showed the relationship between the texts and the assignment.
- I built a clear path toward my argument.
- My introduction arrives at my thesis rather than hiding or repeating it.
- I can read all of the moves together as one opening paragraph.
- I know what relationship to revise and can compare before and after.

For the conclusion, the student should be able to say:

- I returned to my thesis in fresh language.
- I brought the body paragraphs together instead of listing them.
- I explained what the comparison helps the reader understand.
- I ended with a purposeful final thought.
- I did not introduce a new claim that belongs in a body paragraph.
- I can compare the original and revised ending.

AUDIT FIRST

Before editing, map:

- where Module 4 stores or derives introduction and conclusion plans;
- how Module 5 represents Introduction and Conclusion in writing-plan and formal-outline views;
- how Module 6 identifies, stores, validates, assembles, autosaves, reloads, and reviews those sections;
- how Module 7 identifies, diagnoses, edits, saves, and compares those sections;
- which metadata already exists and which additive fields are actually necessary;
- how word count is currently calculated and displayed for a section and the whole essay;
- how the accepted WP-081 advanced mode, move-specific desk filtering, explicit Step N of M sequence, and revision baseline work.

Do not infer section identity from a fragile visual position when existing section type and draft index contracts can identify Introduction and Conclusion safely. Preserve compatibility with existing drafts.

SHARED ARCHITECTURE

Generalize the smallest useful parts of WP-081 into section-aware contracts. Prefer extending or extracting existing helpers over copying BodyParagraphMoveWorkspace or BodyParagraphRevisionPanel into near-duplicates.

The shared architecture must support:

- stable section type and student-facing label;
- section-specific move order and move metadata;
- move-specific desk artifact selection;
- separate sentence-move and advanced whole-section representations without stale concatenation;
- prose-only assembly with no planning labels or numbering;
- reload-safe draft_meta persistence;
- section-specific health signals and revision targets;
- an untouched revision baseline captured when the revision workspace begins;
- live After prose while editing and durable before/after after saving;
- explicit student confirmation of whether the intended relationship is clearer.

Do not over-generalize into an abstract framework that is harder to understand than three small section definitions. Shared code should remove real duplication while keeping each section's teaching visible.

INTRODUCTION MOVE LIBRARY

Implement these recommended moves, allowing a move to contain more than one sentence when needed:

1. Opening and context
   - Give the reader the essential situation or issue.
   - Avoid a generic attention-getter that is disconnected from the essay.
2. Essential background or text relationship
   - Name the texts, speakers/writers, audiences, or relationship needed for this assignment.
3. Bridge toward the argument
   - Narrow from context toward the comparison or claim the essay will make.
4. Thesis destination
   - Show the saved thesis prominently.
   - Let the student refine phrasing without silently changing the thesis's meaning.
5. Read the assembled introduction

The active move must show only the saved material needed for that move. Do not show the whole notebook in every step. The thesis must be prominent for the bridge and thesis moves, not buried below optional examples.

INTRODUCTION HEALTH AND REVISION TARGETS

Where confidence is reasonable, diagnose:

- missing essential context;
- background that does not lead toward the thesis;
- missing, duplicated, or substantially changed thesis;
- an opening that begins with evidence before the reader understands the situation;
- repetition between background and thesis;
- substantial underdevelopment;
- plan/prose staleness after an upstream thesis change.

Use student-facing targets such as:

- Give your reader the needed context.
- Build a clearer bridge to your argument.
- Make the thesis the destination of the introduction.
- Remove repeated ideas.

Do not show terms such as diagnostic, provenance, leverage, heuristic, artifact, alignment score, or student-owned in the student UI.

CONCLUSION MOVE LIBRARY

Implement these recommended moves:

1. Return to the thesis in fresh language
   - Restate the central relationship without copying the thesis sentence.
2. Synthesize the body paragraphs
   - Show how the paragraph purposes work together.
   - Do not merely list Body Paragraph 1, Body Paragraph 2, and Body Paragraph 3.
3. Explain what the comparison helps the reader understand
   - State the larger insight earned by the essay's analysis.
4. Purposeful final thought
   - End deliberately without adding unsupported evidence or a brand-new claim.
5. Read the assembled conclusion

The conclusion desk may show the thesis and compact body-paragraph purposes. It should not dump every quotation or the full notebook into the active workspace.

CONCLUSION HEALTH AND REVISION TARGETS

Where confidence is reasonable, diagnose:

- thesis copied verbatim rather than returned to in fresh language;
- body paragraphs listed without synthesis;
- missing relationship among the body-paragraph purposes;
- a new unsupported claim or new evidence introduced at the end;
- missing purposeful final thought;
- conclusion that contradicts or drifts from the thesis;
- substantial underdevelopment;
- duplicated conclusion prose or stale upstream work.

Use student-facing targets such as:

- Return to your argument in fresh words.
- Bring the body paragraphs together.
- Explain what the comparison shows.
- End with one purposeful final thought.
- Move this new claim to the part of the essay where it can be supported.

MODULE-SPECIFIC REQUIREMENTS

Module 4

- Preserve the whole-essay map and stable labels Introduction and Conclusion.
- Make clear what each section is supposed to accomplish.
- Pull forward only the relevant thesis, assignment relationship, body purposes, and existing conclusion plan.
- Preserve local edit and explicit finish behavior.
- Do not add evidence-selection requirements to the conclusion.

Module 5

- Show Introduction and Conclusion as recognizable parts of the writing plan and formal outline.
- Introduction displays context/relationship/bridge/thesis moves.
- Conclusion displays fresh thesis return/synthesis/larger insight/final thought moves.
- Roman numerals appear only in formal-outline view and never in assembled prose.
- Keep the accepted writing-plan/formal-outline vocabulary.

Module 6

- Apply the accepted WP-081 interaction pattern to Introduction and Conclusion behind the existing development-only rollout approach.
- Show one active move, one short job, only relevant saved notes, one focused writing field, a live assembled section preview, and explicit navigation.
- Display Step N of M and make any instruction referring to Step 1 correspond to a visible Step 1.
- Keep completed moves directly editable.
- Preserve the advanced whole-section path using a first-class source of truth.
- Read/review steps display the assembled paragraph as prose.
- Do not auto-advance because of character or word count.

Module 7

- Keep the section editor visually primary.
- Compare the prose compactly with the section's actual job and relevant plan.
- Recommend one section-appropriate place to revise and allow another relevant choice.
- Point to the sentence or relationship to inspect when possible.
- Capture the untouched baseline on workspace entry, including an unseeded Module 6 → Module 7 path.
- Show Before and live After, then preserve both after save and refresh.
- Ask whether the intended relationship is clearer.
- Do not apply body-paragraph evidence-presence or transition rules blindly to Introduction or Conclusion.

COGNITIVE-LOAD AND COACHING CONTRACT

Each drafting/revision screen should contain:

- one brief orientation;
- one active move or revision target;
- only the plan material required for that action;
- the student's accumulating or current prose;
- one primary action;
- optional examples and full history on the shelf.

Remove repeated statements of why the section matters, what comes next, readiness, and saved plan details when the same information is already visible nearby.

Use direct high-school language. Teach the action and how to recognize success. A short model should reveal structure without giving the student a finished answer for the current assignment.

WORD COUNT

Do not introduce a hard minimum or an arbitrary high-school target in this slice. Preserve existing configurable essay expectations if present. Add only useful descriptive section and whole-essay counts where they help the student see development. Never auto-advance, block a move, or claim quality solely from word count. Record anything needed for the later whole-essay word-count slice without building that slice prematurely.

TEST FIXTURES

Add seeded and unseeded fixtures for at least:

- coherent introduction that leads to the saved thesis;
- introduction missing the thesis;
- introduction whose thesis changed meaning;
- introduction that repeats the thesis as background;
- coherent conclusion with synthesis and a purposeful ending;
- conclusion that copies the thesis verbatim;
- conclusion that only lists body points;
- conclusion that introduces new evidence or a new unsupported claim;
- stale upstream thesis or paragraph-purpose changes;
- advanced mode after sentence-move text, followed by rerender/reload;
- unseeded Module 6 → Module 7 before/after capture;
- local edit from final review without replaying the module.

AUTOMATED ACCEPTANCE

Add focused tests that prove:

- the introduction and conclusion have different move libraries and desk mappings;
- section labels and identities survive save/reload;
- assembled prose contains no move labels, Step labels, or outline numbering;
- advanced prose is not concatenated with stale move prose;
- introduction diagnostics do not require body evidence;
- conclusion diagnostics do not require a transition to another paragraph;
- conclusion synthesis and new-claim concerns remain advisory and do not rewrite prose;
- untouched revision baselines work on unseeded paths;
- banned internal phrases do not appear in student-facing rendering;
- character and word counts do not auto-advance;
- existing BP1 behavior and WP-081 tests remain green.

AGENT BROWSER ACCEPTANCE

Cursor owns routine browser verification. Use seeded and unseeded states and verify at 390×844 and 1440×900:

1. Trace Introduction from plan → outline moves → sentence moves → assembled opening → diagnostic revision → Before/After.
2. Confirm each active introduction move shows only its mapped notes.
3. Confirm the saved thesis is prominent at the bridge/thesis destination.
4. Exercise introduction advanced mode across rerender and reload.
5. Trace Conclusion from plan → outline moves → sentence moves → assembled ending → diagnostic revision → Before/After.
6. Confirm the conclusion synthesis move shows compact body purposes, not the full evidence notebook.
7. Exercise conclusion advanced mode across rerender and reload.
8. Verify unseeded Module 6 → Module 7 baseline capture for both section types.
9. Verify local repair from review without full replay.
10. Verify keyboard focus, primary action, no horizontal overflow, and no character/word-count auto-advance.
11. Read the visible coaching copy and report it. Do not report only test IDs or counts.

If a subjective coaching concern can be assessed from visible language and interaction, Cursor should assess it rather than sending routine testing to Jason. Ask for human judgment only when a genuinely irreducible pedagogical choice remains, and describe it precisely.

OUT OF SCOPE

- Body Paragraphs 2 and 3
- Removing or promoting the development gate
- Whole-essay coherence and configurable word-count implementation
- Modules 1–3
- Modules 8–9 and APA instruction
- Broad visual redesign
- New database tables unless an audit proves the current additive metadata cannot represent these two sections

STATUS AND FINAL REPORT

Keep WP-082 Open during implementation and Needs Verification until all automated and agent-browser acceptance passes. Do not mark Resolved based only on unit tests or seeded data.

Report:

1. current introduction/conclusion artifact map;
2. shared code reused or extracted from WP-081;
3. stable section identity and persistence shape;
4. section-specific move libraries and desk mappings;
5. section-specific diagnostics and confidence limits;
6. tests and exact results;
7. seeded and unseeded browser evidence with visible copy and state transitions;
8. responsive and keyboard evidence;
9. any genuinely human-only remainder;
10. what remains for the later all-body-paragraph and whole-essay slices.
```
