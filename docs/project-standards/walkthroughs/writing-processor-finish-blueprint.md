# The Writing Processor
# Walkthrough to Finished Product Blueprint

Version: July 2026

## Purpose

This document converts Jason's complete end to end walkthrough into an orderly implementation plan that Cursor can execute one student facing problem at a time.

It is designed to prevent three failures:

1. Losing detailed observations from the original walkthrough.
2. Treating the existing issue log as complete when it captured only part of the walkthrough.
3. Making broad redesigns when the working architecture should be preserved.

The goal is not to create more planning work. The goal is to move directly from the walkthrough to a finished, market ready application.

## Governing sources

Use these sources in this order:

1. The complete walkthrough PDF, `Edtech Essay Grader - Summer 26 Writing Processor.pdf`
2. This blueprint
3. The current live application and repository
4. `docs/project-standards/walkthroughs/issue-log.md`
5. The Master Design Specification

The walkthrough is the original usability evidence. This blueprint translates it into executable work. The current application determines what has already changed. The issue log tracks history but is not assumed to contain every observation.

## Nonnegotiable project rules

1. Preserve working architecture.
2. Work on one blueprint item at a time.
3. Cursor should inspect and test automatically before asking Jason to test manually.
4. Manual walkthrough testing is required only when human judgment or browser interaction is necessary.
5. Do not build new developer tools unless an existing defect prevents testing.
6. Do not rewrite working persistence, progression, or export systems to solve presentation problems.
7. Every page must teach, not merely collect an answer.
8. Every page must make the next action obvious.
9. Students should make one meaningful decision at a time.
10. The application should pull forward information it already knows rather than requiring students to search or remember it.
11. Feedback must teach, not merely label an answer correct or incorrect.
12. Buttons mean action. Links mean reference.
13. Color must communicate meaning, not decorate.
14. Planning artifacts and student writing are different representations. Planning labels must not leak into final prose.
15. Nothing is considered resolved until its stated verification passes.
16. If verification discovers a different problem, create a new issue instead of redefining the current one.

## Standard execution cycle

For each blueprint item:

1. Cursor audits the current implementation and identifies whether the item is already complete, partially complete, or missing.
2. Cursor maps it to any existing WP issue without repurposing issue IDs.
3. Cursor implements the smallest coherent fix.
4. Cursor runs automated tests, lint, build, and focused code checks.
5. Cursor reports exact manual verification steps only when needed.
6. Jason performs those steps and reports PASS or FAIL.
7. Cursor updates the issue log only after the result is known.
8. Move to the next blueprint item.

## Current confirmed state

The following work was completed or verified during the continuation of the walkthrough and should not be rebuilt:

- Generated essay prose no longer includes outline Roman numerals or headings.
- Module 2 source persistence gating was repaired and verified.
- Saved source texts can be reopened during Module 3 analysis.
- Module 6 and Module 7 writing surfaces use writing labels rather than outline labels.
- Module 7 developer Unlock to Test restores editing.
- Module 8 requires a current visit Google Doc creation or update before completion.
- Module 8 Create versus Update wording reflects whether a document exists.
- Module 8 completion uses the dedicated success page and advances current_module correctly.
- Module 9 responsive desktop width was improved.
- Module 9 PDF instructions were successfully used in a live walkthrough.
- Module 9 final success page clearly explains submission status and file actions.
- Module 6 received substantial teacher style coaching through WP 073 to WP 077.

Cursor must confirm the current repository before assuming any status because the local issue log may lag behind the code and later walkthrough work.

---

# PRIORITY AND ORDER

The implementation order follows the student journey and the severity of the walkthrough observations.

## Stage 1: Discovery and source preparation

Module 1, then Module 2.

## Stage 2: Evidence, reasoning, and organization

Module 3, then Module 4, then Module 5.

This is the most important unfinished instructional area because the walkthrough repeatedly described confusion, bland visual language, excessive simultaneous information, unclear artifact use, and weak teaching.

## Stage 3: Drafting and revision

Finish Module 6 verification and unresolved details, then improve Module 7.

## Stage 4: Preparation and submission

Finish Module 8 and Module 9 instructional and trust improvements.

## Stage 5: Application wide polish and production readiness

Apply consistent patterns, accessibility, responsive checks, public entry, legal/source strategy, security, and release QA.

---

# MODULE 1: UNDERSTAND THE ASSIGNMENT

## M1.1 Clarify the first task and remove confusing top of page competition

**Status:** Complete — verified July 10, 2026 (WP-078 Resolved)

Walkthrough basis:

The first prompt breakdown page was described as confusing at the top. The page included Step 1 of 2, explanatory copy, reassurance, and the task, but the hierarchy did not make the immediate action obvious.

Student problem:

A student may read several pieces of text without knowing exactly what to answer first.

Required outcome:

- The current question is the most prominent element.
- The page states the concrete task in one sentence.
- Reassurance and background are supporting information, not competing headings.
- The student can identify the next action within five seconds.
- Existing prompt breakdown persistence and progression remain unchanged.

Verification:

Open the first Module 1 task as a reset student. A first time student should be able to say what to do without reading the entire page.

Existing issue mapping:

Likely app wide WP 048, WP 050, WP 051, WP 062. Create a Module 1 specific issue only if the current log does not contain one.

## M1.2 Create a smooth transition from prompt understanding to vocabulary

Walkthrough basis:

The vocabulary page had a useful embedded video, but the transition from Step 1 to Step 2 felt abrupt and insufficiently planned or linear.

Student problem:

Students may not understand why vocabulary study follows prompt breakdown or how the terms help them answer the assignment.

Required outcome:

- Begin with a bridge such as: You now know what the assignment asks. Next, learn the words you will need to analyze the texts.
- Show a short sequence of what students will do.
- Keep the embedded video.
- Explain how each term will be used later.
- Provide a visible completion check.

Verification:

A student should be able to explain why they are learning the vocabulary and what comes next.

## M1.3 Use instructional color to direct attention to vocabulary and concepts

Walkthrough basis:

The page missed an opportunity to use the established color palette to highlight vocabulary and guide the eye.

Student problem:

Important terms blend into surrounding text.

Required outcome:

- Assign a consistent instructional color treatment to vocabulary terms.
- Use color, badges, cards, or borders to distinguish term, definition, example, and student action.
- Do not rely on color alone. Preserve labels and accessible contrast.
- Apply the same vocabulary pattern wherever similar instruction occurs later.

Verification:

Students can visually identify the current term, its meaning, and what they must do.

## M1.4 Make early feedback instructional and corrective

Walkthrough basis:

Jason specifically asked that feedback to student answers in early modules scaffold intermediate students, check thinking, and redirect misunderstandings.

Student problem:

A correct or incorrect label does not reveal whether the student understands the prompt or vocabulary.

Required outcome:

- Explain why the response works or what misconception remains.
- Give one focused retry cue.
- Do not write the student's answer.
- Preserve student ownership.
- Add automatic checks only where they can reliably evaluate the intended thinking.

Verification:

Test one strong and one weak response. The feedback should teach the next thinking move without supplying a finished answer.

## M1.5 Strengthen visible progress through the module

Walkthrough basis:

The progress bar was described as too subtle to communicate progress and as a missed opportunity for purposeful color.

Student problem:

Students may not notice progress or know how much remains.

Required outcome:

- Make progress visible, labeled, and understandable.
- Indicate current step and total steps.
- Use the same progress pattern across modules.
- Avoid turning it into visual clutter.

Verification:

A student can identify where they are and how much remains without searching.

---

# MODULE 2: PREPARE AND READ THE SOURCES

## M2.1 Resolve the production source use and copyright strategy

Walkthrough basis:

The walkthrough raised repeated legal concerns about the source URLs, copied text, and using copyrighted works inside the application.

Student problem:

This is primarily a production risk, but source handling also affects whether students can reliably access the material.

Required outcome:

- Document the approved production source strategy for each text.
- Confirm whether the application stores copied text, source URLs, excerpts, or student supplied working copies.
- Ensure official source attribution is visible.
- Avoid distributing unauthorized full text through the application.
- Preserve a generic assignment definition architecture so public domain or licensed sources can replace the MLK pair.
- Obtain legal review before market release.

Verification:

A production review must confirm source rights, attribution, storage behavior, and assignment portability.

Note:

This may require a separate legal or product decision rather than a code only fix.

## M2.2 Add clear guardrails to source copy and paste

Walkthrough basis:

Copy and paste worked, but the walkthrough said students need guardrails to ensure they create good copies.

Student problem:

Students may paste incomplete, wrong, duplicated, or malformed source text and proceed without realizing it.

Required outcome:

- Explain exactly what to copy and what not to copy.
- Validate minimum completeness without pretending to prove exact source accuracy.
- Warn about obviously empty, too short, or duplicate copies.
- Provide a preview or confirmation before continuing.
- Explain how to correct the source copy.
- Preserve WP 003 gating that requires both sources.

Verification:

Test empty text, short text, duplicate text, and a plausible complete copy. Students should receive understandable recovery instructions.

## M2.3 Let students inspect the texts when evaluating completeness

Walkthrough basis:

One page asked students whether their saved texts looked complete without allowing them to see the texts.

Student problem:

Students cannot make the requested judgment because the evidence is hidden.

Required outcome:

- Provide direct buttons to open or preview both saved working copies from the completeness screen.
- State what a complete copy should contain.
- Make Edit or Replace available before continuing.
- Avoid opening unnecessary duplicate tabs.

Verification:

A student can inspect both sources, determine whether they are complete, and correct them from the same workflow.

## M2.4 Establish persistent source access as a taught workflow

Walkthrough basis:

Jason wanted buttons to access the speech and letter going forward and explicit teaching that students should keep or reopen the tabs for reference.

Student problem:

Students may close source tabs, open repeated copies, or forget how to return to the texts.

Required outcome:

- Use one consistent Open My Speech and Open My Letter control.
- Teach that these are working copies used throughout analysis.
- Reuse the managed window behavior already verified in WP 064.
- Explain what happens if the student closes or returns later.
- Make source access available in all evidence based modules.

Verification:

Open, close, reopen, and focus both sources without duplicates or lost work.

## M2.5 Clarify navigation when students enter source reading pages

Walkthrough basis:

The source pages did not make it clear that students had to return to the main Module 2 page to continue.

Student problem:

Students may look for a Continue button inside a reference page and feel stuck.

Required outcome:

- Add a clear persistent return instruction and button.
- Explain that the source opens for reading while the Writing Processor remains the task workspace.
- Preserve browser tab behavior.

Verification:

A student who opens a source can explain how to return and continue.

## M2.6 Strengthen the transition from source preparation to close reading

Walkthrough basis:

Jason wanted the page to say, in effect: now that you have good sources, you will closely read them to find what the assignment asks for.

Student problem:

The student does not feel the role shift from collecting texts to analyzing them.

Required outcome:

- Celebrate successful source preparation.
- Explain the new job: find one useful example at a time.
- Remind students to use their existing source tabs.
- Preview the analysis sequence.
- Use teacher voice and purposeful color.

Verification:

Students can state what changed and what they will do next.

## M2.7 Redesign guided rhetorical observation as one focused move at a time

Walkthrough basis:

The guided observation page was described as bland and too cognitively demanding. Jason described the desired sequence: find one quote showing ethos, paste it, then answer what makes it ethos.

Student problem:

Quote location, copying, classification, and explanation compete on one page.

Required outcome:

Use a clear sequence:

1. Name the rhetorical appeal in student friendly language.
2. Tell students exactly which source to inspect.
3. Ask for one quotation only.
4. Confirm the quotation has been entered.
5. Reveal the explanation question.
6. Teach how to explain why it is an example.
7. Give instructional feedback.
8. Celebrate completion before moving to the next observation.

Use progressive disclosure. Do not display all prompts simultaneously.

Verification:

A first time student completes one ethos observation without external explanation and understands why the quote qualifies.

## M2.8 Strengthen visual columns, buttons, and reference controls

Walkthrough basis:

The T chart and related pages were too white, columns did not feel like columns, progress was subtle, and a reference control did not look clickable.

Student problem:

Students cannot tell structure, action, and reference apart.

Required outcome:

- Visually distinguish columns and their purposes.
- Make action controls look like buttons.
- Use descriptive labels instead of technical or unexplained terms.
- Keep assignment question and reference information visible but secondary.
- Improve contrast, spacing, and font size.

Verification:

A student can identify each column, the current task, and every clickable action without trial and error.

---

# MODULE 3: ANALYZE, GROUP, AND EXPLAIN EVIDENCE

This module received the most repeated criticism in the original walkthrough. It must be treated as a major instructional redesign of presentation and sequencing, not as an architectural rebuild.

## M3.1 Replace unexplained interface language such as T chart and Explorer

Walkthrough basis:

Jason said the page was confusing even though he designed it. T chart and dropdown options did not make sense, and it was not obvious that clicking an Explorer box revealed the Keep Going button.

Student problem:

Students must infer the meaning of interface terms and hidden gating.

Required outcome:

- Replace or explicitly teach every technical label.
- Rename controls according to the student's task.
- Never hide required progression behind an unexplained click.
- Show why the control must be opened and what completion means.
- Remove irrelevant dropdown options.

Verification:

A first time student can complete the page without guessing what T chart or Explorer means.

## M3.2 Rebuild Module 3 visual hierarchy around the current decision

Walkthrough basis:

The visual language did not help students. The correct task existed, but the page did not teach or scaffold it. Similar concerns continued across multiple screens.

Student problem:

The student sees many equal weight elements and cannot identify the current decision.

Required outcome:

Every Module 3 screen follows this hierarchy:

1. What you are deciding now.
2. Why this decision matters.
3. The exact artifact needed to decide.
4. The single response control.
5. How to know you are ready.
6. Optional help below or collapsed.

Verification:

On each screen, Step 1 is obvious within five seconds.

## M3.3 Replace self evaluation of evidence strength with taught criteria

Walkthrough basis:

The screen asked, Is my support strong enough yet? Jason noted that struggling students are least qualified to judge without being shown what strong enough means.

Student problem:

Students are asked to make an expert judgment without criteria.

Required outcome:

- Teach a small evidence quality checklist.
- Show specific criteria such as relevance, variety, clarity, and ability to explain.
- Let the application guide the student through each criterion.
- Provide examples and non examples.
- Ask for student judgment only after the criteria are visible.

Verification:

A student can explain why their support is sufficient or what is missing using the provided criteria.

## M3.4 Teach thesis creation through progressive steps

Walkthrough basis:

The thesis creation page did not reduce cognitive load enough or truly teach thesis creation. Multimedia could help later, but the core page must work without it.

Student problem:

Students are expected to combine analysis into a thesis before understanding the construction process.

Required outcome:

- Break thesis construction into small decisions.
- Pull forward assignment purpose, discovered similarities, differences, and audience conclusions.
- Teach what the thesis must claim.
- Show a model and why it works.
- Let students construct or revise one part at a time.
- Do not generate the finished thesis for them.
- Make video optional enrichment, not required comprehension.

Verification:

A student can explain each part of their thesis and how it answers the assignment.

## M3.5 Replace information blur with one concept per instructional screen

Walkthrough basis:

Several consecutive pages had many words that did not teach effectively and would look like a blur to a 14 year old. Jason compared the desired pacing to a PowerPoint that explains one thing at a time.

Student problem:

Students scan or skip dense explanations because too many concepts appear at once.

Required outcome:

- Split dense pages into short instructional moments where appropriate.
- Use one concept, one model, one brief check, then continue.
- Convert paragraphs into cards, steps, examples, and short prompts.
- Preserve overall student progress and avoid unnecessary extra clicks.

Verification:

No instructional screen requires the student to understand multiple new concepts before one action.

## M3.6 Require meaningful student artifacts instead of passive reading

Walkthrough basis:

One page had almost no interactivity and produced no artifact that could be evaluated or reused later.

Student problem:

Students can advance without demonstrating or saving the thinking the page is intended to teach.

Required outcome:

- Identify every passive Module 3 page.
- Add one small meaningful response only where it supports the learning objective.
- Save the response as a reusable artifact.
- Avoid busywork and avoid collecting answers that will never be used.

Verification:

Each interactive response either informs feedback or appears meaningfully later.

## M3.7 Scaffold paragraph idea creation from selected evidence

Walkthrough basis:

Jason liked the educational strategy of forming a paragraph idea from selected evidence but said it needed more teaching, clearer focus, and less cognitive load.

Student problem:

Students may not see how multiple observations become one paragraph idea.

Required outcome:

- Display only the evidence relevant to the current paragraph.
- State the question the paragraph must answer.
- Teach students to notice what the evidence has in common.
- Guide them to write one sentence that captures that common idea.
- Show where that idea will be used later.

Verification:

A student can explain how the paragraph idea came from the evidence and where it belongs in the essay.

## M3.8 Redesign quotation selection so students compare evidence to one paragraph purpose

Walkthrough basis:

The walkthrough repeatedly described the evidence selection sequence as overwhelming. Students needed to focus on the current paragraph idea, the relevant source, and the best quote rather than process every possible quotation and category.

Student problem:

Too many quotations, source labels, categories, and prior notes compete at once.

Required outcome:

- Keep the current paragraph purpose visible.
- Filter or progressively reveal only relevant quotations.
- Present one decision at a time.
- Explain what makes a quotation useful for this paragraph.
- Show source and rhetorical context clearly.
- Allow source reopening without duplicate windows.
- Do not ask students to search the sidebar for the paragraph purpose.

Verification:

A student can select a quote and explain why it belongs in the current paragraph.

## M3.9 Make paragraph job choices concrete and taught

Walkthrough basis:

The strategy of choosing a paragraph job was sound, but students were not sufficiently taught what similarity, speech difference, or letter difference meant for paragraph structure.

Student problem:

Students may select a category without understanding how it shapes the paragraph.

Required outcome:

- Explain each possible job in plain language.
- Show a small example.
- Pull forward the evidence being organized.
- Explain how the choice affects the paragraph.
- Use instructional feedback after selection.

Verification:

A student can state the chosen paragraph job and what the paragraph must prove.

## M3.10 Make the relationship evidence to paragraph idea to thesis visually explicit

Walkthrough basis:

Jason wanted an aha moment where students see that they are simply identifying another idea that proves the thesis.

Student problem:

The process feels like many unrelated forms instead of a simple chain of reasoning.

Required outcome:

Create a recurring visual chain:

Quotation or observation

leads to

What it shows

leads to

Paragraph idea

leads to

How it supports the thesis

The chain should use the student's own saved work and update as they progress.

Verification:

A student can point to each link and explain how the evidence supports the thesis.

## M3.11 Redesign explanation writing so the exact source material and task are unmistakable

Walkthrough basis:

Jason said it was not obvious what students were rewriting in their own words. Sentence starter buttons worked but were confusing. The section felt overwhelming and needed to spoon feed the process.

Student problem:

Students cannot distinguish quotation, previous notes, prompt, starter, and the new explanation they must write.

Required outcome:

- Label the source material explicitly.
- Show one selected quotation.
- Ask one explanation question.
- Explain what not to do, such as repeat or paraphrase the quote without analysis.
- Make sentence starters optional, explain what clicking one does, and avoid destructive text replacement.
- Reveal thesis connection only after the evidence explanation is complete if that reduces load.
- Show a short model and why it works.

Verification:

A student can state exactly what they are writing, what source information they are using, and how many sentences are expected.

## M3.12 Teach students how to use the sidebar or replace it with contextual pull forward

Walkthrough basis:

The sidebar was intended to hold useful prior work, but Jason repeatedly said students may not understand that they are supposed to use it or how. Visual language did not support the intended behavior.

Student problem:

Critical planning information is technically present but functionally hidden.

Required outcome:

- Treat the sidebar as a working notebook, not storage.
- Highlight the current relevant artifact.
- Add direct references such as See your paragraph idea on the left.
- On high load pages, pull the relevant artifact into the center workspace instead of requiring sidebar searching.
- Increase readable width and font size where necessary.
- Preserve access to the broader history without giving it equal visual weight.

Verification:

A first time student knows when and how to use the sidebar and never searches blindly for required information.

## M3.13 Audit optional third paragraph flow for instructional parity

Walkthrough basis:

The optional third paragraph functioned, but Jason noted it shared the same instructional and cognitive load problems as the rest of Module 3.

Student problem:

Optional complexity may receive weaker guidance than the main path.

Required outcome:

- Apply the same teaching, progressive disclosure, artifact pull forward, and success criteria to optional paragraph planning.
- Explain why a third paragraph might strengthen the essay.
- Do not pressure students to add unnecessary content.

Verification:

Both two paragraph and three paragraph paths provide equivalent guidance and persistence.

---

# MODULE 4: BUILD PARAGRAPH PLANS

The walkthrough PDF compresses some module boundaries, but the evidence to paragraph plan work must be addressed regardless of the current route numbering.

## M4.1 Make the module transition explicit: evidence is now becoming a plan

Student problem:

Students may not understand the difference between analyzing evidence and organizing it for writing.

Required outcome:

- Celebrate the completed evidence work.
- State that students will now turn evidence into paragraph plans.
- Preview what a finished paragraph plan contains.
- Show how the plan will become the outline and later the draft.

Verification:

A student can explain the new role of the module.

## M4.2 Pull all required evidence into the current paragraph plan workspace

Walkthrough basis:

Jason repeatedly objected to students searching the sidebar and to screens that contained too much unrelated information.

Required outcome:

For the current paragraph only, surface:

- paragraph job
- paragraph idea
- selected quotations
- source labels
- explanations
- thesis connection

Everything else remains secondary or collapsed.

Verification:

Students can complete a plan without searching another page or scanning unrelated paragraphs.

## M4.3 Teach the structure of a paragraph plan before collecting it

Student problem:

Students may fill fields without understanding how the pieces will become a paragraph.

Required outcome:

Teach the sequence:

1. Main idea
2. Introduce evidence
3. Evidence
4. Explain evidence
5. Connect to thesis

Use the student's artifacts as the model. Do not generate finished paragraph prose.

Verification:

Students can identify the function of every plan component.

## M4.4 Reduce simultaneous choices and display one planning decision at a time

Required outcome:

- Use progressive disclosure.
- Do not show every plan field, help card, quote, and checklist simultaneously.
- Save continuously.
- Let completed decisions collapse into a concise summary.

Verification:

The current decision remains obvious and previous work stays accessible.

## M4.5 Create a readable completed paragraph plan artifact

Student problem:

Students need to recognize that they produced something valuable that will be reused.

Required outcome:

- Present the completed plan in a clean, readable form.
- Name what the student accomplished.
- Allow review and correction.
- Explain that Module 5 will arrange these plans into an outline.

Verification:

Students can read the completed plan and identify where each element came from.

---

# MODULE 5: BUILD THE OUTLINE

## M5.1 Preserve automatic import of paragraph plans

Walkthrough basis:

Jason called automatic pulling of paragraph plans a major usability win because students do not retype previous work.

Required outcome:

- Preserve this behavior.
- Add regression tests.
- Clearly tell students that their earlier work has already been brought forward.

Verification:

All paragraph plans appear correctly with no reentry.

## M5.2 Make the outline preview look like an actual outline, not debugging output

Walkthrough basis:

The workflow functioned, but the final outline preview was described as text heavy and similar to debugging output.

Student problem:

Students cannot easily see essay structure in the artifact intended to reveal structure.

Required outcome:

- Use a clean hierarchy with Roman numerals, indentation, bullets, and spacing.
- Distinguish introduction, body sections, and conclusion.
- Keep planning labels here because this is the planning representation.
- Make editing and confirmation obvious.
- Avoid dense raw object style rendering.

Verification:

A student can scan the outline and describe the essay structure.

## M5.3 Explicitly connect the outline to the coming draft

Student problem:

Without a psychological transition, Module 6 can feel like a blank page despite the completed outline.

Required outcome:

- State that the hard thinking is complete.
- Explain that Module 6 will turn each outline section into sentences.
- Preview the one section at a time workflow.
- Celebrate the finished plan.

Verification:

A student entering Module 6 expects translation, not starting over.

## M5.4 Teach conclusion planning clearly

Walkthrough basis:

Later drafting exposed that conclusion planning included restating the thesis and choosing a final thought, but those artifacts were not always highlighted.

Required outcome:

- Ensure Module 5 explicitly captures the conclusion's restated main point and final thought.
- Explain why each is needed.
- Store them in a stable structure used by Module 6.

Verification:

Both conclusion planning artifacts appear in Module 6 Need Help and drafting coaching.

---

# MODULE 6: DRAFT THE ESSAY

Significant work was completed after the walkthrough. The immediate need is to reconcile the finished code with WP 012 through WP 019 and WP 073 through WP 077, close what truly passes, and implement only remaining gaps.

## M6.1 Verify and close the current reader first, action first drafting pattern

Required outcome:

On introduction, body, and conclusion pages:

- The question is natural and student friendly.
- Start Here or Your Job Right Now appears before the textbox.
- Students know what to type first.
- Need Help is clearly reachable.
- Thesis and outline artifacts are visually connected to coaching.
- Supporting information does not compete with the action.

Verification:

Use the verification criteria already established for WP 073 through WP 077. Update the issue log after pass.

## M6.2 Complete planning artifact pull forward for introduction

Walkthrough basis:

Jason said students must see what they already planned for the introduction so they can focus on wording, not inventing ideas.

Required outcome:

Surface, as available:

- thesis
- essay purpose
- paragraph topic preview
- introduction plan

Do not rely only on the thin shelf.

Verification:

A student can draft the introduction using visible prior work without searching.

Mapping:

WP 013.

## M6.3 Complete evidence and explanation pull forward for body paragraphs

Walkthrough basis:

Jason said the sidebar text was too small and students were not told specifically to use the planned material.

Required outcome:

For the current body paragraph, Need Help includes the paragraph idea, evidence, explanations, and thesis connection. It must remain readable without overwhelming the primary writing task.

Verification:

Students can draft the paragraph from the pulled forward plan.

Mapping:

WP 014, WP 017, WP 049.

## M6.4 Complete conclusion coaching using the actual conclusion plan

Walkthrough basis:

Jason specifically said the page lacked basic instruction to restate the thesis and use the planned final thought.

Required outcome:

- Show the thesis.
- Show the planned summary or restatement.
- Show the planned final thought.
- Teach that a conclusion lands the essay without simply copying the thesis.
- Keep reader centered language.

Verification:

Students can identify what to restate and what final thought to leave.

Mapping:

WP 015.

## M6.5 Reconcile the six section instructional contract with the simplified hierarchy

Student problem:

The original specification called for why, artifacts, writer strategy, write, and self check. Later work correctly reduced competing cards. The final design must preserve unique teaching without rebuilding clutter.

Required outcome:

- Action first.
- Writing box immediately available.
- Need Help contains unique supporting instruction.
- Why, model, and self check are collapsed or contextual.
- No duplicate recipes in the right rail.

Verification:

The page teaches all necessary concepts while preserving a single dominant action.

Mapping:

WP 016, WP 019, WP 074.

## M6.6 Improve sidebar readability and role without duplicating the center workspace

Required outcome:

- Increase readability where needed.
- Clearly label the shelf as prior work or notebook.
- Highlight the current outline section.
- Do not give the sidebar equal importance to the drafting task.
- Preserve responsive stacking.

Mapping:

WP 017, WP 059.

## M6.7 Apply purposeful color semantics consistently

Required outcome:

- Keep thesis color consistent.
- Keep outline color consistent.
- Keep action coaching distinct.
- Meet contrast and accessibility requirements.
- Avoid adding decorative color that competes with writing.

Mapping:

WP 018, WP 061.

## M6.8 Strengthen Module 6 completion and transition to revision

Required outcome:

- Celebrate that a complete first draft exists.
- Explain that revision is strengthening, not starting over or fixing failure.
- Preview read aloud and one section at a time revision.

Mapping:

WP 008, WP 010, WP 052.

---

# MODULE 7: REVISE THE ESSAY

## M7.1 Teach what revision is before asking students to revise

Walkthrough basis:

The application asked students to strengthen sections without adequately teaching how. The walkthrough repeatedly said successive pages asked for changes but did not coach them.

Required outcome:

- Explain revision versus proofreading.
- Normalize imperfect first drafts.
- Explain what students will listen for and change.
- Use teacher voice.

Mapping:

WP 020, WP 026.

## M7.2 Strengthen Read Aloud purpose and listening checklist

Walkthrough basis:

Jason liked the full essay read and recording playback, but wanted clearer instructions and more scaffolding.

Required outcome:

Before recording, tell students to listen for:

- confusing sentences
- repetition
- abrupt transitions
- missing explanation
- places that do not sound like their intended meaning

After playback, capture a short revision note or checklist.

Preserve recording and playback behavior.

Mapping:

WP 021.

## M7.3 Keep Read Aloud and all assembled essay views prose only

Required outcome:

Maintain the verified removal of Roman numerals and outline headings. Add regression coverage.

Mapping:

WP 001 resolved.

## M7.4 Add section specific revision strategy coaching

Required outcome:

Introduction:

- clarity of topic
- useful context
- thesis placement

Body:

- main idea
- evidence introduction
- explanation
- thesis connection

Conclusion:

- synthesis
- restated main point
- final thought

Mapping:

WP 022.

## M7.5 Compare the current draft to planning artifacts without recreating outline clutter

Required outcome:

- Pull forward only the relevant thesis, paragraph plan, or conclusion plan.
- Ask focused comparison questions.
- Do not display the entire planning history simultaneously.
- Preserve prose first revision.

Mapping:

WP 023, WP 024, WP 063.

## M7.6 Configure the shelf as a revision notebook

Required outcome:

- Show read aloud notes.
- Show the relevant original plan.
- Show completed revision status.
- Direct students to use it when needed.
- Keep the current revision task primary.

Mapping:

WP 025, WP 059.

## M7.7 Add visible success criteria and small celebrations

Required outcome:

Each section tells students how they know revision is complete. Completion feedback names the improvement rather than merely moving forward.

Mapping:

WP 051, WP 056.

## M7.8 Strengthen transition to preparation for submission

Required outcome:

- State that the writing and revision are finished.
- Explain that the next work changes how the paper is presented, not what it says.
- Reassure students that the finished essay remains saved.

Mapping:

WP 052, WP 057.

---

# MODULE 8: PREPARE THE PAPER

## M8.1 Establish one authoritative Google Doc pathway

Walkthrough basis:

The walkthrough encountered stale documents and later found that the Module 9 export produced the correct new document.

Required outcome:

- Use one shared current essay source.
- Use one production export function.
- Decide whether update means update the same document or create a new one, then communicate it honestly.
- Remove duplicate student pathways where possible.
- Preserve current session verification.

Mapping:

WP 002, WP 028, WP 029.

## M8.2 Verify the exported document contains the latest essay

Required outcome:

- Compare export metadata to latest final essay metadata.
- Provide a human understandable confirmation such as current word count and export time.
- Do not falsely claim content verification that the app did not perform.
- Provide a clear Update action after revisions.

Mapping:

WP 029, WP 036.

## M8.3 Add recovery actions for export problems

Required outcome:

Students can:

- retry export
- create or update again
- open the latest document
- return to revision if needed
- understand an error without losing work

Mapping:

WP 030.

## M8.4 Replace expected actions with buttons and clear labels

Required outcome:

Use primary buttons for Create, Update, Open, Retry, and Continue. Keep links for optional reference resources only.

Mapping:

WP 031, WP 053.

## M8.5 Explain what the Google Doc is and what it is not

Walkthrough basis:

Jason wanted clear explanation of everything happening on the page and student expectations.

Required outcome:

Explain:

- The Writing Processor keeps the finished essay.
- The Google Doc is the submission preparation copy.
- Students format it but should not restart or substantially rewrite the essay here.
- Opening a document does not submit it.
- Updating the document brings over the latest essay.

Mapping:

WP 032, WP 033, WP 037.

## M8.6 Coach APA formatting as a practical checklist

Required outcome:

- Explain why each required format matters.
- Use a short checklist.
- Provide examples or links to the internal guide.
- Let students open the current document from the page.
- Include a visible route to update the document if text is wrong.

Mapping:

WP 034, WP 036.

## M8.7 Create a confidence based Ready screen

Required outcome:

Before completion, confirm:

- correct current document
- required formatting checked
- student knows submission has not happened yet
- student knows what Module 9 will require

Mapping:

WP 035, WP 037.

## M8.8 Strengthen success and transition to Module 9

Required outcome:

Use the dedicated success page. State that writing is finished and list the remaining tasks: learn or review the needed APA items, prepare the document, download PDF, upload PDF. No additional essay writing is required.

Mapping:

WP 009, WP 010, WP 068.

---

# MODULE 9: FORMAT AND SUBMIT

## M9.1 Teach APA before testing it

Walkthrough basis:

Jason said the quiz was unfair because the application had not taught all the information.

Required outcome:

- Replace quiz first entry with teach, practice, feedback, continue.
- Keep any quiz as reinforcement.
- Teach only the APA rules needed for this assignment.

Mapping:

WP 006.

## M9.2 Build an internal APA Quick Guide

Required outcome:

Provide concise visual sections for:

- title page
- font and size
- spacing
- margins
- page numbers
- in text citation
- references

Use examples and screenshots where possible. Keep external sources as optional deeper references.

Mapping:

WP 038, WP 043.

## M9.3 Present one APA concept per screen or focused interaction

Walkthrough basis:

The quiz stacked many questions. Cognitive load on the quiz itself was reasonable, but the narrow layout and lack of teaching were concerns.

Required outcome:

- One concept at a time.
- Immediate explanatory feedback.
- Visible progress.
- Allow reference to the Quick Guide.
- Avoid a long vertical exam feel.

Mapping:

WP 039, WP 040.

## M9.4 Preserve responsive desktop width and mobile stacking

Required outcome:

Maintain the corrected wider desktop layout. Confirm useful line lengths and efficient screen real estate on desktop, tablet, and narrow mobile widths.

Mapping:

WP 005.

## M9.5 Remove duplicate export preparation or explain the authoritative action

Required outcome:

Module 9 should not unexpectedly create another competing document if Module 8 already created the current submission document. Reuse or clearly update the authoritative document.

Mapping:

WP 004, WP 028.

## M9.6 Replace technical export language with student action language

Required outcome:

Prefer phrases such as Prepare my Google Doc, Update my submission document, Open my document, and Continue to formatting. Use export only where technically necessary in secondary text.

Mapping:

WP 011, WP 042.

## M9.7 Reinforce that formatting is not rewriting

Required outcome:

State that the essay's ideas are complete. Students are checking presentation and correctness, not starting another revision unless they discover a genuine mistake.

Mapping:

WP 041.

## M9.8 Add visual, explicit PDF download instruction

Required outcome:

Preserve the verified numbered instructions and add screenshots where feasible. Cover File, Download, PDF, where the file usually saves, and how to return.

Mapping:

WP 007 resolved, WP 043.

## M9.9 Redesign the upload page for 13 and 14 year olds

Walkthrough basis:

Jason said the upload worked but needed more specific instructions.

Required outcome:

- Tell students exactly where to find the file.
- Explain Choose File, selected filename, and Upload.
- Explain that selecting is not yet submitting.
- Show a pre upload checklist.
- Reassure students what to do if they selected the wrong PDF.
- Prevent duplicate submission where possible.

Mapping:

WP 044, WP 045, WP 046.

## M9.10 Make final submission feel like completion, not an LMS transaction

Required outcome:

Preserve the improved final success page. Ensure submission status is unambiguous, actions are explained, accomplishment is celebrated, and any resubmission policy directs students to the teacher.

Mapping:

WP 047, WP 069.

---

# APPLICATION WIDE IMPLEMENTATION PASS

These are not separate reasons to rebuild every page. They are a consistency pass applied after the module specific work.

## A.1 Four question screen contract

Every instructional screen must answer:

1. What am I doing?
2. Why am I doing it?
3. How do I do it successfully?
4. How do I know I am finished?

Do not force all four into four large cards. The answers may be expressed through hierarchy, concise copy, examples, and checklists.

Mapping: WP 048, WP 051.

## A.2 One primary action

Each screen has one visually dominant next action. Secondary actions and reference material remain secondary.

Mapping: WP 050, WP 053, WP 062.

## A.3 Progressive disclosure

Dense pages reveal only what students need now. Completed work collapses into summaries and Help content remains available without competing.

Mapping: WP 054, WP 060.

## A.4 Artifact pull forward

If the application knows the thesis, quote, explanation, paragraph idea, plan, or conclusion thought, it places the relevant artifact where the student needs it.

Mapping: WP 049, WP 057, WP 059.

## A.5 Purposeful color semantics

Create an accessible, documented semantic palette. Use it consistently for instructional categories. Do not rely on color alone.

Mapping: WP 061.

## A.6 Teacher voice

Review headings, buttons, instructions, errors, and feedback. Replace software and LMS language with calm, direct teaching language where appropriate.

Mapping: WP 011.

## A.7 Feedback teaches

Feedback explains the concept, points to evidence, and gives a next move. It does not produce the student's substantive writing.

Mapping: WP 055.

## A.8 Progress and celebration

Use clear progress indicators, small milestone acknowledgments, and meaningful completion pages.

Mapping: WP 010, WP 056.

## A.9 Psychological transitions

At module boundaries, explain the completed role and the next role. The student journey should feel like discovery, organization, planning, writing, revision, preparation, and submission.

Mapping: WP 052, WP 058.

## A.10 Planning support fades naturally

Planning is prominent while needed, then becomes support. Final drafting, revision, and submission surfaces prioritize genuine prose.

Mapping: WP 063.

---

# PRODUCTION READINESS WORK

The original walkthrough intentionally deferred some production concerns. They must be completed before market release.

## P.1 Public landing page and branding

Walkthrough basis:

The landing page was explicitly described as a placeholder. Development login must not be visible to public users. Branding and marketing were deferred.

Required outcome:

- Production homepage
- clear product value
- student, teacher, school, and parent entry paths as appropriate
- professional branding
- privacy and terms links
- no development controls outside development

## P.2 Authentication and role security

- Verify production role separation.
- Remove or environment gate all developer tools.
- Confirm student data isolation.
- Confirm teacher authorization.
- Review Google OAuth configuration and redirect URLs.
- Add production error handling.

## P.3 Privacy, student data, and legal compliance

- FERPA and COPPA review as applicable.
- Privacy policy and retention policy.
- Consent and school agreement model.
- Source copyright review.
- AI disclosure and data handling review.
- Account deletion and export behavior.

## P.4 Accessibility

- Keyboard navigation
- visible focus
- semantic headings
- form labels
- error announcements
- contrast
- text resizing
- screen reader review
- reduced motion handling

## P.5 Responsive support

- Desktop primary layout
- tablet
- common Chromebook widths
- narrow mobile fallback
- no clipped drawers, sidebars, buttons, or textareas
- readable line lengths

## P.6 Reliability and recovery

- Autosave visibility and error recovery
- refresh and resume
- offline or interrupted request messaging
- export retry
- upload retry
- duplicate action protection
- stale state handling

## P.7 Teacher dashboard and assignment operations

- assignment creation and definition management
- student roster and progress
- artifact review
- feedback workflows
- submission status
- reset and reassignment safeguards
- no developer only assumptions

## P.8 Observability and support

- production logging without exposing student content unnecessarily
- actionable error IDs
- support contact workflow
- monitoring for failed exports and uploads
- audit trail for progress and submission

## P.9 Automated quality gates

Before release:

- unit tests for helpers
- integration tests for persistence and gates
- browser tests for primary student path
- export tests
- upload tests
- accessibility checks
- lint and production build
- database migration review
- environment validation

## P.10 Final student usability validation

After all blueprint tasks are complete, conduct a short validation with actual target age students. This is not a repeat of the original design walkthrough. It is a focused confirmation that students can complete the final flow independently.

---

# DEFINITION OF FINISHED PRODUCT

The Writing Processor is ready for the market only when:

1. A first time student can complete the full assignment without unexplained steps.
2. Every module teaches the thinking it requests.
3. The application reduces rather than transfers cognitive load.
4. Earlier student work is reused visibly and purposefully.
5. Students always know what to do next and how to know they are done.
6. Drafting and revision feel like writing, not form completion.
7. Export and submission are current, trustworthy, and recoverable.
8. The final success state is unambiguous.
9. Production authentication, privacy, accessibility, legal source use, and reliability have been reviewed.
10. Automated quality gates pass.
11. Target age usability validation passes.

---

# CURSOR OPERATING INSTRUCTION

Cursor must never attempt to implement this entire blueprint in one pass.

At the start of each work cycle:

1. Read this blueprint.
2. Identify the first unchecked task in implementation order.
3. Audit current code and issue log for that task only.
4. Report whether the task is complete, partial, or missing.
5. Implement only that task unless it cannot be separated safely.
6. Run automated verification.
7. Give Jason exact manual verification steps if required.
8. Wait for the result.
9. Update the issue log and check off the blueprint item only after verification.

The first task after importing this blueprint is M1.1 unless Jason directs a different starting point.
