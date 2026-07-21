# The Writing Processor
# Complete Walkthrough Revision Strategy

Version: July 20, 2026  
Status: **Canonical revision strategy from the completed Modules 1–9 student walkthrough**  
Scope: Student journey, instructional design, artifact continuity, visual hierarchy, assignment configuration, document preparation, submission trust, and implementation order

## Document role

This document converts Jason Smith's complete student walkthrough of the current application into the governing revision strategy for the next product-development cycle.

It is not merely a list of interface complaints. It defines:

- the writing process the application should teach;
- the student artifacts that should accumulate across that process;
- the instructional and visual contracts every screen should follow;
- the specific revisions required in Modules 1–9;
- the sequence in which those revisions should be implemented;
- the evidence required before work is considered complete.

This strategy should be consulted before writing implementation prompts, redesigning a module, accepting a proposed fix, or marking a walkthrough issue resolved.

## Authority and relationship to earlier documents

This document is the newest source of walkthrough evidence. It should be read with the durable principles in:

- [Master Design Specification — Phase II](../master-design-specification-phase-ii.md)
- [Cognitive Load Charter](../cognitive-load-charter.md)
- [Writing Artifact Decision Architecture](../writing-artifact-decision-architecture.md)
- [Working Set V1](../../working-set-v1.md)
- [Writing Learning Process V1](../../writing-learning-process-v1.md)
- [Writing Learning Engine V2](../../writing-learning-engine-v2.md)

The earlier [Walkthrough to Finished Product Blueprint](master-walkthrough-blueprint.md) and [Issue Log](issue-log.md) remain useful historical and implementation records. However, this complete walkthrough found that several areas previously described as verification or polish require deeper instructional redesign. When the documents conflict about the current student experience, use this document as the current walkthrough finding and update the governing specification or issue log before implementation.

## Evidence status and limits

The findings come from a complete authenticated walkthrough of one MLK rhetorical-analysis assignment on the current local application. The walkthrough exercised all nine modules, transitions, success screens, Google Doc preparation, APA instruction, PDF selection, upload, and return to the dashboard.

The walkthrough provides strong expert-review evidence about instructional coherence, cognitive load, terminology, visual hierarchy, and workflow integrity. It does not replace:

- testing with target-age students;
- accessibility testing with assistive technology;
- multiple-assignment testing;
- teacher authoring/configuration testing;
- production security and privacy review;
- browser and device coverage;
- validation of external integrations under real school accounts.

Those remain separate release gates.

---

# 1. Executive diagnosis

## 1.1 What the application already does well

The application has a strong underlying idea: it carries students from understanding an assignment through analysis, planning, drafting, revision, formatting, and submission. Several screens demonstrate the right instructional instincts:

- The Module 1 welcome and basic orientation are approachable.
- The appeal-rating matrix gives students a concrete comparison instrument.
- Module 4's final-plan review concept is useful.
- Module 5 conclusion planning keeps the task light and focused.
- Module 7's read-aloud page clearly explains why students listen, what to notice, and what happens next.
- Module 7's revision-cycle language—Listen → Notice → Name → Change → Compare—is a strong organizing idea.
- Module 7's success message clearly distinguishes completed writing from later document preparation.
- Module 8's success message clearly introduces review, download, and submission.
- Module 9's screenshot showing the Google Docs File → Download → PDF path is practical and age-appropriate.
- The dashboard gives the student access to the final PDF after completion.

These should be treated as foundations, not discarded during redesign.

## 1.2 The central product problem

The application has many useful activities, but the student does not always experience them as one accumulating act of writing.

Too often:

- a prior decision is stored but not visibly reused;
- labels change between modules;
- an activity asks for a local answer without showing the essay-level purpose;
- planning data is dumped onto a later page instead of interpreted and filtered;
- the actionable editor is visually buried below instruction and notes;
- completion gates verify presence or clicks rather than coherent writing;
- success screens repeat information without helping students understand the transformation they just completed;
- APA requirements are explained, quizzed, and checked repeatedly without enough authentic practice in the student's document.

The result is a sequence of modules that can feel like related worksheets rather than a writing processor.

## 1.3 The required product shift

The next revision cycle must make the artifact chain visible and dependable:

**Assignment → source understanding → evidence → comparison → claim → thesis → paragraph purposes → paragraph plans → formal outline → sentence moves → assembled paragraphs → revision → formatted document → inspected PDF → submission receipt**

Every transition must answer four student questions:

1. What did I already decide?
2. How is that decision helping me now?
3. What new decision or change am I making here?
4. What will this become next?

No page should exist only because the database or module structure has another state. A page earns its place when the student performs a meaningful action, learns a transferable move, resolves uncertainty, or receives durable confirmation.

## 1.4 Definition of real progress

Real progress is not shorter copy by itself, a new card layout, or more colorful success screens. It means:

- students make better writing decisions;
- each decision becomes a trustworthy downstream artifact;
- the application detects contradictions and missing development before certifying readiness;
- students can see and edit the work at the level appropriate to the current stage;
- instruction appears at the moment of need;
- repeated procedures are consolidated;
- teacher requirements are configurable instead of hardcoded as universal rules;
- completion and submission states are persistent and trustworthy.

---

# 2. North-star student experience

## 2.1 The experience should feel continuous

Modules are implementation and curriculum boundaries. They should not feel like separate applications or fresh starts.

Student-facing transitions should use language such as:

- “You decided…”
- “Here is the evidence you chose…”
- “Now turn that plan into sentences…”
- “Your sentences are now together as a paragraph…”
- “You are strengthening the paragraph you already wrote…”
- “Your writing is finished; now prepare the document…”

Avoid making “Module 4,” “Module 5,” or internal artifact names the main meaning of the task.

## 2.2 Stable student-facing essay structure

Use stable labels everywhere:

- Introduction
- Body Paragraph 1
- Body Paragraph 2
- Body Paragraph 3, when assigned
- Conclusion

Do not alternate among “Paragraph 1,” “Plan 1,” “Section 2,” “Module 4 Paragraph 1,” and “Body Paragraph 1.” Internal identifiers may differ, but the student-facing vocabulary must remain stable.

## 2.3 The intended vertical curriculum

The strongest curriculum emerging from the walkthrough is:

- **Module 5:** establish the essay map and the internal moves each section must make.
- **Module 6:** draft those moves one at a time and watch them assemble into paragraphs.
- **Module 7:** read each assembled paragraph as a whole and revise relationships among its sentences and across sections.

This creates a genuine process:

**plan the paragraph → build its sentences → revise the assembled paragraph → review the essay**

Module 6 must not present an empty text box and call that drafting. Module 7 must not repeat the same sentence-building work. The representational level should deliberately change.

## 2.4 The desk-and-shelf model

Every working screen should distinguish:

- **On the desk:** the small set of information required for the current decision.
- **On the shelf:** broader saved work and reference material available on demand.

For example, a body-paragraph revision screen may need the paragraph's planned point, the relevant evidence, the current paragraph, and perhaps the previous paragraph's final sentence. It does not need the full thesis, all outline notes, all evidence, all reasoning notes, and every explanation fully expanded at once.

## 2.5 The eye path should teach the task

A student should be able to scan the page and understand the work without reading every sentence.

The default eye path is:

1. **Where am I?**
2. **What am I doing now?**
3. **What am I using?**
4. **Where do I do it?**
5. **How do I know I am ready?**
6. **What happens next?**

The active editor, choice, or upload control must not be hidden beneath long instructional or reference sections.

---

# 3. Application-wide instructional contracts

## 3.1 One dominant operation per screen

Each screen should have one dominant cognitive or procedural action. Supporting information may help that action, but it must not compete with it.

Examples:

- compare two ratings;
- choose an essay direction;
- write the topic sentence;
- explain how one quotation supports the paragraph point;
- revise one transition;
- set one-inch margins;
- inspect the exported PDF.

If a screen teaches six concepts, shows a full reference guide, asks a quiz question, and expects work in another application, it contains too many simultaneous jobs.

## 3.2 Standard teaching loop

Instructional tasks should follow a consistent loop:

1. **Orient:** State the immediate purpose in plain language.
2. **Show:** Present a small model or example/nonexample.
3. **Notice:** Identify the feature that matters.
4. **Do:** Give the student an authentic action.
5. **Check:** Provide observable success criteria.
6. **Repair:** Offer targeted help when the result does not align.
7. **Carry forward:** Show what was saved and how it will be used.

Not every small screen needs all seven labels, but the instructional experience should contain all seven functions.

## 3.3 Instruction is not text volume

More explanation does not automatically create scaffolding. Use the smallest amount of information that enables the next meaningful action.

Prefer:

- a labeled example over three paragraphs describing one;
- an exact question over general advice;
- a highlighted sentence over an entire expanded notebook;
- an authentic action over a recognition quiz;
- a targeted repair message over generic “Needs work” feedback.

## 3.4 Models must match the student's task

Examples should reflect the actual move students are being asked to make. Generic examples that use a different paragraph purpose, evidence pattern, or rhetorical strategy compete with the student's saved plan.

Whenever feasible, provide:

- a neutral model that demonstrates structure without supplying the student's answer;
- an example and nonexample;
- a short explanation of why the example works;
- direct visual alignment between the model and the student's workspace.

## 3.5 Authentic action over recognition

A recognition question is appropriate only when recognition is the learning goal. It should not stand in for performance.

Examples:

- Choosing “one-inch margins” from three answers does not show that a student can set or verify margins.
- Selecting a definition of a transition does not show that a student can improve a transition.
- Checking “My evidence is explained” does not show that an explanation exists.

Prefer authentic actions in the real artifact, followed by visible inspection criteria.

## 3.6 Semantic validation rather than length-only validation

Character count can prevent an empty submission, but it cannot establish quality or alignment.

Validation should look for the required relationship at the current stage:

- both works are represented when comparison is required;
- the chosen quotation belongs to the intended source;
- an explanation connects evidence to audience and purpose;
- a paragraph advances its planned point;
- a thesis and paragraph purposes align;
- body paragraphs are not accidental duplicates;
- the conclusion returns to the argument rather than introducing a new one.

When automated confidence is limited, flag the concern and let the student inspect or intentionally override it. Do not silently rewrite student work.

## 3.7 No automatic advancement at a text threshold

Crossing a character threshold must never advance the student automatically. This created fragmentary saved thinking during the walkthrough.

Use an explicit action such as:

- Save this thought
- Add this sentence
- Finish this move
- Keep this revision

The student, not the counter, decides when the thought is ready to save.

## 3.8 Feedback must teach and preserve ownership

Feedback should:

- name the successful relationship or the specific gap;
- point to the exact evidence or sentence involved;
- offer one next move;
- avoid writing the final answer for the student;
- allow intentional continuation when the student understands a flagged tension.

Replace generic “Correct,” “Incorrect,” “Looks good,” or “Add more” messages with causal feedback.

## 3.9 Student language must be visibly student language

Saved student words should be visually distinguished from system instructions and generated labels.

Use patterns such as:

- YOUR WORDS
- YOU WROTE
- quotation marks around student language when inserted into a question;
- a student-work color treatment distinct from teacher coaching;
- “Edit your words” rather than presenting them as authoritative system copy.

This is especially important when spelling or grammar is unfinished. The system should not appear to endorse a draft phrase as a polished heading.

## 3.10 The application should repair, not merely transport, prior work

Prior work may be incomplete, mismatched, duplicated, or contain placeholder fragments. Pulling it forward unchanged can amplify earlier confusion.

At each transition, the application should:

1. load the relevant prior artifact;
2. normalize its structure;
3. identify missing or contradictory relationships;
4. show the student a concise repair task when needed;
5. preserve the student's language unless the student edits it;
6. record the repaired artifact for later stages.

## 3.11 One primary action and clear action semantics

- Buttons perform actions.
- Links open references.
- One button is visually primary.
- Secondary actions are visibly secondary.
- Disabled actions explain what remains.
- Back does not force the student through an entire module to repair one section.

## 3.12 Progress should describe learning, not software states

Show both position and transformation:

- “Body Paragraph 2 of 3 · connect this point to your thesis”
- “Revision cycle · Change”
- “Preparing your paper · Format”

Do not mark a step simultaneously “complete” and active. Do not claim “ready” while required checks are incomplete.

## 3.13 Progressive disclosure

Keep the active teaching and workspace visible. Place these behind clearly labeled disclosure:

- full source texts;
- complete notebook history;
- optional examples after the student understands the task;
- advanced exceptions;
- external reference guides;
- recovery actions that are not currently needed.

Disclosure labels must describe the content: “See your full outline,” not “More.”

## 3.14 Word-count coaching

Word count must become a strategic, configurable part of the process rather than an end-stage surprise.

Teacher settings should support:

- no target;
- minimum;
- range;
- exact target when pedagogically justified;
- optional section guidance;
- whether quotations count, if the assignment requires a special rule.

For this five-section scaffold, a conservative default range such as **450–650 words** is a reasonable starting product assumption, but it must not be presented as a universal high-school standard. Teachers must be able to change it.

Student coaching should emphasize development, not filler:

- show current essay total and target;
- show section distribution;
- identify an underdeveloped paragraph;
- recommend adding context, evidence explanation, comparison, or reasoning;
- never recommend repeating ideas merely to reach a number.

## 3.15 Success screens have three jobs

A success screen should:

1. celebrate what the student genuinely completed;
2. make the saved artifact or receipt visible;
3. explain the next transformation.

Avoid tiny centered cards surrounded by unused space, repetitive multi-stage success carousels, or claims that exceed what the system validated.

## 3.16 Accessibility and responsiveness

Every redesigned pattern must support:

- keyboard operation;
- meaningful focus order and focus visibility;
- proper headings, labels, tab semantics, and live-region behavior;
- color-independent meaning and sufficient contrast;
- zoom and text resizing;
- reduced motion;
- screen widths at least 390×844 and 1440×900;
- no horizontal overflow;
- editors and primary actions reachable without excessive scrolling.

---

# 4. Artifact and state architecture required by the redesign

## 4.1 Canonical artifact chain

The product should maintain explicit relationships among:

| Stage | Durable artifact | Required downstream relationship |
|---|---|---|
| Assignment | Prompt interpretation | Reappears when students judge relevance |
| Sources | Verified texts and metadata | Evidence remains tied to source and location |
| Observation | Quote/passage + student notice | Feeds appeal and audience/purpose reasoning |
| Comparison | Ratings + rationale + selected direction | Feeds claim and thesis work |
| Argument | Claim + comparative thesis | Governs paragraph purposes |
| Planning | Paragraph purpose, evidence, reasoning, order | Becomes formal outline and drafting moves |
| Outline | Ordered sections and internal moves | Becomes Module 6 drafting sequence |
| Draft | Sentence moves assembled as paragraphs | Becomes Module 7 revision baseline |
| Revision | Revised sections + change history | Becomes finished essay |
| Preparation | Verified Google Doc + formatting protocol | Becomes export source |
| Submission | Inspected PDF + receipt | Becomes final dashboard artifact |

## 4.2 Artifact health

Each artifact should be able to carry health or review metadata, including:

- complete;
- incomplete;
- inconsistent with upstream work;
- contains placeholder or suspicious fragment;
- duplicates another artifact;
- changed upstream and needs review;
- student intentionally confirmed despite a warning.

This metadata should drive targeted repair prompts. It must not silently overwrite prose.

## 4.3 Assignment configuration

Move assignment-specific decisions out of page copy and into a teacher-owned assignment definition:

- required number of body paragraphs;
- allowed organizational patterns;
- source set and source metadata;
- required evidence per paragraph;
- required comparison scope;
- word-count mode and target;
- citation style;
- formatting requirements;
- teacher-specific font requirement;
- title-page fields;
- abstract required or omitted;
- reference expectations;
- submission file type and resubmission policy.

The UI should distinguish **general style guidance**, **teacher requirements**, and **assignment exceptions**.

## 4.4 Revision diagnostics

Module 7 should use shared diagnostic checks rather than assign a fixed strategy solely by paragraph position.

Potential checks:

- point matches paragraph plan;
- evidence belongs to the intended source and paragraph;
- quotation has context;
- explanation follows evidence;
- explanation addresses audience and purpose;
- paragraph connects to thesis;
- transition connects to adjacent section;
- paragraph duplicates another paragraph;
- conclusion synthesizes rather than restarts;
- section is substantially underdeveloped relative to assignment expectations.

The system should recommend the highest-leverage revision target and allow the student or teacher to choose another.

## 4.5 Completion and receipt states

Separate these states clearly:

- work saved;
- section complete;
- module complete;
- document created;
- document verified against newest essay;
- formatting confirmed;
- PDF selected;
- PDF validated;
- upload in progress;
- upload accepted;
- submission receipt available.

Do not infer one state from another. A checked formatting list is not proof that the PDF is valid. A successful upload is not trustworthy without a persistent receipt.

---

# 5. Module-by-module revision specifications

# Module 1 — Understand the assignment and learn the analytical lens

## Intended outcome

Students can explain the assignment in their own words and use the basic rhetorical concepts needed to read the sources.

## Preserve

- The approachable welcome experience.
- The basic prompt-orientation sequence.
- Quiz feedback when it genuinely explains the concept.
- The current completion moment, subject to app-wide visual polish.

## Problems observed

- The student's prompt paraphrase is saved but not visibly reused later.
- Vocabulary instruction is dry and definition-heavy.
- Terms may be learned as isolated facts rather than as tools for understanding how choices affect an audience and help accomplish a purpose.

## Required revision

Use this vocabulary teaching sequence:

1. Begin with a familiar communication example.
2. Ask students to notice a choice the communicator made.
3. Name and define the term.
4. Show an example and nonexample.
5. Connect the choice to an audience effect.
6. Connect that effect to purpose.
7. Apply the same lens to a short passage from King.
8. Ask for one small decision or explanation.
9. State how the concept will help answer the essay question.

Use the recurring analytical anchor:

**Rhetorical choice → effect on audience → contribution to purpose**

Carry the student's prompt interpretation forward as a compact “What this assignment asks” reference whenever relevance is judged.

## Acceptance criteria

- A student can explain why they are learning the term.
- The student applies the term to a passage, not only defines it.
- Saved prompt understanding reappears later in the process.
- Each page has one visible task and one primary action.

# Module 2 — Establish trustworthy sources and compare rhetorical appeals

## Intended outcome

Students work from verified source texts, record evidence accurately, and use a transparent rating process to identify promising comparisons.

## Preserve

- Persistent access to both source texts.
- The 0–10 appeal-centrality ratings as a thinking tool.
- Transparent direction recommendations with student choice and provenance.
- The idea that ratings are judgments, not scientific measurements.

## Problems observed

- Source metadata and citation details require authoritative verification.
- At least one trust-source path accepted an incorrect response.
- A save-source action appeared after the input rather than where the task began.
- Several pages were too dense.
- Matrix and downstream states contained detached cells, fallback text, fragments, and old inputs.
- Some evidence appeared without a quotation or without a clear source connection.
- The student could pause or advance with work that did not yet support the claimed comparison.

## Required revision

### Source preparation

- Verify titles, authors, dates, publication context, and citation metadata.
- Save source records in a style-neutral form; format them later according to assignment settings.
- Put the source action directly above or beside the source entry field.
- Make both source texts inspectable before completion.
- Treat source completeness and source credibility as separate checks.

### Evidence observation

Use the sequence:

**Quotation → rhetorical choice → audience effect → purpose**

Every saved observation must retain:

- exact source;
- quote or precise passage reference;
- student observation;
- appeal or strategy tag when applicable;
- audience/purpose reasoning.

### Matrix

- Keep all six rating cells legible and connected to their evidence.
- Require a short rationale or evidence link for meaningful ratings.
- Explain what the ratings suggest without presenting the suggestion as a thesis.
- Preserve ties and student-created directions.
- Detect incomplete, stale, or contradictory matrix states before handoff.

### Walkthrough-specific test data

The walkthrough used these ratings and selected direction; they should remain useful regression data:

- Speech ethos: 6
- Letter ethos: 8
- Speech pathos: 10
- Letter pathos: 4
- Speech logos: 4
- Letter logos: 9
- Selected direction: speech pathos compared with letter logos

## Acceptance criteria

- Neither source can be treated as complete without inspectable text and metadata.
- Wrong trust-source answers receive corrective teaching and do not pass silently.
- Every matrix rating can be traced to evidence or an explicit zero judgment.
- The selected direction is visible downstream with its provenance.
- No fallback strings, detached evidence, or legacy values appear as student work.

# Module 3 — Turn evidence into a defensible comparative argument

## Intended outcome

Students move from comparison evidence to an idea, claim, comparative thesis, and proof directions that genuinely represent both texts.

## Problems observed

- Initial screens were overwhelming and contained irrelevant or malformed saved material.
- The selected direction was not always prominent.
- The sequence sometimes asked for a conclusion before students had adequately reread and tested evidence.
- Cross-work grouping and observation order could misrepresent the evidence.
- Letter-only evidence could support an interface claim that both works were ready.
- Character thresholds caused automatic advancement and saved fragments.
- Claim and thesis activities duplicated each other.
- Proof-plan requirements appeared late or below the fold.
- Completion could claim both works were ready without adequate comparative support.

## Required revision

Use this sequence:

1. Reorient students to the direction they selected.
2. Put the strongest starting evidence from both works on the desk.
3. Reread the exact passages.
4. Gather or replace evidence where one side is weak.
5. Test the emerging pattern.
6. State a provisional comparative idea.
7. Develop that idea into a claim.
8. Build the thesis in stages.
9. Name the proof directions that the body paragraphs will need.

Combine claim and thesis work into a staged thesis builder rather than collecting near-duplicate sentences. A useful sequence is:

- What is similar or different?
- Why does that difference matter for audience or purpose?
- What larger point can the essay prove?
- What sections will prove it?

Use explicit finish actions. Never advance because a textarea crossed a length threshold.

Before certification, require:

- a comparative thesis;
- meaningful representation of both works;
- at least one explained passage from each work;
- proof directions that align with the thesis;
- no unresolved fragments or contradictory source labels.

The Module 3 completion screen should display the actual comparative argument that was earned: the thesis, the speech-side evidence/explanation, the letter-side evidence/explanation, and the resulting proof directions. It should remain readable on desktop and mobile and must not compress the work into an overly narrow or nonresponsive success card.

## Acceptance criteria

- A student can describe how the selected matrix direction became the thesis.
- Both works are visibly and substantively represented.
- Claim and thesis activities add distinct value.
- Proof-plan requirements are visible before writing begins.
- Completion language never exceeds what semantic validation established.

# Module 4 — Design the essay's organization and paragraph purposes

## Intended outcome

Students choose an essay organization and establish the purpose of each body paragraph before filling it with evidence.

## Problems observed

- The student was asked to make local paragraph decisions without a visible essay map.
- “Job” choices overlapped and recommendations did not always match the student's intended argument.
- The system did not clearly distinguish subject-by-subject from point-by-point organization.
- Evidence selection was repeatedly rechecked instead of using prior decisions intelligently.
- “Paragraph 1,” “Paragraph 2,” and “Paragraph 3” were ambiguous.
- Editing a final review could send the student through the entire module again.

## Required revision

### Choose organization first

Before defining body paragraphs, teach and let students choose among appropriate organizational patterns:

- point-by-point;
- subject-by-subject;
- another teacher-enabled structure.

Show a miniature essay map for each pattern using the student's current thesis and evidence. Explain the tradeoff rather than labeling one universally correct.

### Establish the essay map

For the walkthrough argument, the intended structure was:

- Body Paragraph 1: shared purpose—both texts seek to advance civil rights by enlisting support.
- Body Paragraph 2: speech—pathos and a broad public audience.
- Body Paragraph 3: letter—logos/religious reasoning and a narrower clergy audience.

The app should have helped the student see and confirm that structure before presenting isolated paragraph forms.

### Use evidence intelligently

- Automatically place the strongest already-selected evidence into the relevant proposed paragraph.
- Let the student keep, replace, remove, or add evidence.
- Do not ask the student to rediscover identical evidence unless a conflict needs repair.
- Require reasoning that explains why the evidence belongs in that paragraph.

### Review and edit

- Show the complete essay map before completion.
- Allow inline editing of any paragraph purpose, evidence choice, or reasoning note.
- Preserve the student's place after an edit.
- Do not force a full-module replay for a local correction.

## Acceptance criteria

- The student chooses or confirms the organizational structure before building paragraphs.
- Each body paragraph has a distinct, thesis-aligned purpose.
- Student-facing labels consistently say Body Paragraph 1/2/3.
- Evidence is pulled forward and editable rather than repeatedly reselected.
- Final review supports direct editing.

# Module 5 — Convert paragraph plans into a real outline

## Intended outcome

Students create an ordered, recognizable outline that shows both the whole essay and the internal logic of each section.

## Preserve

- Automatic reuse of paragraph plans.
- The relatively light conclusion-planning experience.
- The idea of a final whole-outline review.

## Problems observed

- Labels such as “Paragraph Plan 1 — Module 4 Paragraph 1” exposed implementation history.
- Ordering occurred after labels had already implied a fixed order.
- A supposedly reorderable screen could appear prepopulated and finished.
- Paragraph plan and outline were insufficiently distinguished.
- The completed artifact did not look like a formal outline.
- The success page used an awkward grid and did not show a satisfying finished artifact.

## Required revision

Explain the distinction:

- **Paragraph plan:** what the paragraph will prove and the evidence/reasoning it will use.
- **Outline:** where the paragraph belongs and the order of moves inside it.

Ordering should happen before permanent numbering. Use direct manipulation where appropriate, with fully accessible move-up/move-down controls.

The outline should support two synchronized views:

- **Writing plan:** plain student-facing cards.
- **Formal outline:** conventional outline form suitable for instruction or export.

Target formal structure:

1. Introduction
   - Context
   - Thesis
2. Body Paragraph 1
   - Paragraph purpose/topic sentence
   - Evidence and context
   - Explanation/reasoning
   - Connection to thesis
3. Body Paragraph 2
   - Same internal categories
4. Body Paragraph 3, when required
   - Same internal categories
5. Conclusion
   - Fresh return to thesis
   - Synthesis
   - Purposeful final thought

Use Roman numerals only in formal-outline view. Never leak them into generated prose.

## Acceptance criteria

- The finished product is recognizably an outline.
- Students can toggle between a readable writing plan and formal outline.
- Numbering follows the chosen order.
- Every body paragraph shows its purpose, evidence, reasoning, and thesis relationship.
- The outline is editable and exportable.
- The success transition shows the actual outline and explains that drafting will turn each move into sentences.

# Module 6 — Draft sentence moves and assemble paragraphs

## Intended outcome

Students translate the outline into prose by composing manageable sentence moves and seeing those moves assemble into complete paragraphs.

## Central redesign decision

Module 6 should become a guided drafting workspace at the sentence-move level. It should not rely mainly on a blank paragraph-sized textarea.

Each drafting page should show:

- one active move;
- the exact saved plan that move uses;
- a short structural model;
- a focused writing field;
- an accumulating live paragraph preview;
- completed moves collapsed but editable;
- an optional advanced “write the paragraph in one box” path.

## Introduction moves

Recommended moves:

1. Opening/context move
2. Essential background or text relationship
3. Bridge toward the argument
4. Saved thesis, with an opportunity to refine its phrasing without changing its meaning
5. Read the assembled introduction

The saved thesis must be prominent and clearly labeled as the destination of the opening—not hidden beneath an unrelated example.

## Body-paragraph moves

Recommended move library:

1. State the paragraph's point.
2. Give context for the evidence.
3. Present a quotation or accurate paraphrase.
4. Explain the important words or rhetorical choice.
5. Explain the effect on the audience and contribution to purpose.
6. Connect the paragraph to the thesis.
7. Bridge to the next idea when a transition is needed.

These are rhetorical moves, not a rigid rule that each must equal exactly one sentence. Students may combine, expand, or reorder moves when the meaning remains clear.

For paragraphs with multiple pieces of evidence, repeat the evidence context → evidence → explanation sequence.

## Conclusion moves

Recommended moves:

1. Return to the thesis in fresh language.
2. Synthesize the body paragraphs rather than list them.
3. State what the comparison helps the reader understand.
4. End with a purposeful final thought.
5. Read the assembled conclusion.

## Draft-readiness checks

For each evidence-bearing paragraph, confirm that prose contains or intentionally addresses:

- paragraph point;
- evidence;
- evidence context;
- rhetorical choice or feature;
- audience effect;
- purpose;
- thesis connection.

Use targeted repair prompts when saved notes contain fragments, mismatched evidence, duplicated paragraphs, or a paragraph purpose that no longer fits the thesis.

## Completion and success

The final full-draft page must do more than check whether each section contains prose. It should identify high-confidence problems such as:

- identical or near-identical body paragraphs;
- missing evidence explanation;
- section that conflicts with its plan;
- conclusion that restarts the argument;
- very uneven or far-below-target word distribution.

The multi-stage Module 6 success experience should be collapsed. Show the assembled essay path, celebrate completion, briefly explain that the next stage reads paragraphs as wholes, and continue to revision.

If a read-only tabbed review remains, explicitly frame its job: “Pause and see what you built. You will revise this text on the next step.” Otherwise, begin Module 7 directly.

## Acceptance criteria

- Students draft one meaningful move at a time.
- The active writing field is visible without searching below reference material.
- Every move visibly comes from the outline.
- Students can edit a completed move without replaying the module.
- Live preview contains prose only—no outline labels.
- Semantic checks catch the duplicate Body Paragraph 1/2 case seen in the walkthrough.
- The success screen explains why the assembled-paragraph level matters for revision.

# Module 7 — Diagnose and revise assembled writing

## Intended outcome

Students hear and read their assembled essay, select meaningful revision targets, change complete paragraphs, and compare the result with the prior version.

## Preserve

- The read-aloud requirement.
- Clear coaching about listening like a reader.
- The listening prompts for stumbling, repetition, abrupt transitions, and missing explanation.
- The revision cycle: Listen → Notice → Name → Change → Compare.
- The message that revision strengthens completed work rather than treating the draft as failure.
- The existing Module 7 completion message, with only visual consistency improvements if needed.

## Problems observed

- The editor was often hidden below strategy cards and an oversized notebook dump.
- The introduction page did a better job than the body pages because it showed an editable paragraph and relevant thesis context.
- Body pages used nearly identical templates with a different assigned strategy.
- Strategy selection appeared determined by paragraph number instead of evidence from the paragraph.
- Students were not always told the exact sentence or relationship needing attention.
- Before/after comparison was absent.
- Duplicate body paragraphs and plan/draft mismatches were not diagnosed.
- A transition activity did not show enough of the adjacent paragraph to revise the handoff.
- The full-essay final review remained too broad after extensive read-aloud and section revision.

## Required revision

### Read aloud

Keep the current conceptual page. Strengthen the visual journey so students can see:

- Listen
- Name one place
- Revise sections
- Compare the essay

The active stage should be unmistakable.

### Diagnostic revision workflow

For each section:

1. Show the assembled paragraph prominently in an editor.
2. Show a compact comparison with its planned purpose and evidence.
3. Run or present diagnostic checks.
4. Recommend the highest-leverage revision target.
5. Let the student choose another relevant strategy when appropriate.
6. Highlight or quote the exact place to inspect.
7. Provide one concise model.
8. Let the student revise the whole paragraph.
9. Show before and after.
10. Ask whether the change made the intended meaning clearer.

Make the distinction between Module 6 and Module 7 explicit. In Module 6 the student **constructed** the paragraph's moves. In Module 7 the student reads those moves together as a paragraph and judges how they work as a whole. The student's named read-aloud observation should help prioritize the first relevant revision target rather than disappearing after the recording step.

### Strategy examples

- Orient the reader to a clear thesis.
- Explain how evidence supports the paragraph point.
- Connect the paragraph explicitly to the thesis.
- Add missing context before a quotation.
- Smooth the transition between two specific sections.
- Remove or combine repetition.
- Align the paragraph with its planned purpose.
- Bring the conclusion together in fresh language.

### Visible working set

The main workspace should contain only:

- the paragraph being revised;
- its point;
- the selected target;
- the relevant evidence or adjacent sentence;
- the editor;
- the before/after comparison.

Keep the full notebook and complete evidence history on the shelf.

### Final essay review

Replace general “Does it communicate more clearly?” coaching with a succinct inspection protocol:

1. Trace the thesis into each topic sentence.
2. Check that every quotation is followed by explanation.
3. Check that introduction and conclusion express the same argument in fresh language.
4. Check for accidental repetition or missing sections.
5. Check current word count against the teacher's target and develop ideas rather than add filler.

If one check fails, link directly to the affected section editor.

## Acceptance criteria

- Revision targets come from paragraph evidence or student observation, not only position.
- The editor appears near the top of the active workspace.
- Transition work includes both sides of the transition.
- Duplicate and plan-mismatch cases trigger targeted repair.
- The student sees what changed and why it is clearer.
- Final review is concise and actionable.

# Module 8 — Create the submission document and begin preparation

## Intended outcome

Students create or update one authoritative Google Doc containing the newest finished essay and can reopen it reliably.

## Preserve

- Automatic creation/update when it works.
- Verification against the latest finished essay.
- Recovery actions for document problems.
- The Module 8 completion screen, which the walkthrough judged clear.

## Problems observed

- A simple technical action was surrounded by excessive instruction.
- Essay map, template, resources, explanations, progress, and repeated “not rewriting” messages competed with the main action.
- The page sometimes implied a title page was already required even though formatting came next.
- Formatting instruction began here and then repeated extensively in Module 9.

## Required revision

The primary workflow should be:

1. Create or update the Google Doc.
2. Verify that it contains the newest finished essay.
3. Open it successfully.
4. Continue.

Show explicit states:

- Creating…
- Verifying…
- Ready
- Needs attention

When ready, show only the essentials:

- document title;
- account, when relevant;
- last verified time;
- essay word count;
- Open Google Doc;
- Continue;
- clearly labeled recovery disclosure.

Keep the essay map, blank template, and external references available only when needed. Treat the template as an alternative or recovery path, not a competing primary path.

## Module-boundary decision

Modules 8 and 9 currently duplicate formatting education and checklists. Use a clean division:

- **Module 8:** create/update/verify the submission document.
- **Module 9:** teach, apply, verify, export, inspect, and submit.

If product constraints require some formatting in Module 8, Module 9 must resume saved progress rather than reteach and recheck identical items.

## Acceptance criteria

- A student can identify the main technical action in five seconds.
- The newest essay is automatically verified.
- Recovery options appear only when requested or required.
- No statement claims a formatting task is complete before it occurs.
- Completing Module 8 produces one authoritative Google Doc and a durable verification state.

# Module 9 — Apply formatting, inspect the exported PDF, and submit

## Intended outcome

Students learn the assignment's formatting protocol while applying it to their own document, verify the exported PDF, submit it, and retain a trustworthy receipt.

## Central redesign decision

Separate three functions:

- **Instruction:** one formatting move at a time, just before application.
- **Reference:** a compact, searchable/expandable guide that remains available.
- **Verification:** one saved inspection of the real document and one inspection of the exported PDF.

The current giant guide plus rotating recognition quizzes plus repeated checklists should not remain the primary architecture.

Use direct, non-moralizing page language. Replace headings such as “How do you format your paper so a reader can take it seriously?” with a concrete task such as **“Format your Google Doc for this assignment”** or **“Let's format your paper in APA style.”** Formatting supports consistency and navigation; it is not what makes the student's ideas worthy of being taken seriously.

## One canonical model paper

Create or select one accurate student model paper that matches the assignment's actual requirements. Use the same model throughout the protocol.

At each step, highlight only the relevant feature:

1. Page setup
2. Title page
3. Page numbers
4. Body-page layout and paragraph indentation
5. In-text citations
6. References page
7. Paper order and assignment exceptions
8. Exported PDF inspection

The model should be available later as a whole-paper reference. It must be reviewed for accessibility, copyright/use rights, accuracy, and consistency with teacher settings.

## Standard formatting step

Each step should use:

1. **See it:** highlighted model feature.
2. **Understand it:** one or two sentences explaining its purpose.
3. **Do it:** exact Google Docs menu path or action.
4. **Check it:** precise location to inspect in the student's document.
5. **Fix it:** targeted help with the exact correction path.
6. **Confirm it:** Looks correct / Help me fix it.

Example:

> **Page numbers**  
> Look at the upper-right corner of the title page and one later page. Both should show a number. For this assignment, the header should not contain the paper title.  
> To fix it in Google Docs: Insert → Page numbers → choose the top-right option.  
> **Actions:** Looks correct · Show me an example · Help me fix it

## Requirements and exceptions

The UI must clearly label:

- **APA guidance:** conventions that come from the style.
- **Your teacher requires:** choices such as Times New Roman 12.
- **For this assignment:** title-page fields, abstract decision, source expectations, or exceptions.

Do not present a teacher preference as the only rule allowed by APA generally.

## Full guide and external sources

The complete internal guide should be closed by default and remain available as reference. It should be organized by task and searchable if feasible.

External links should be few and carefully selected. Appropriate candidates include:

- the official APA sample student paper;
- a specific Purdue OWL APA page that matches the current task.

Do not send students to a broad external site without explaining exactly what section to use.

## Recognition questions

Remove recognition quizzes as the main instruction. They are low value when:

- the answer is stated immediately above;
- distractors are implausible;
- an option is labeled “matches the target” before selection;
- completion does not require opening or changing the Google Doc.

If checks remain, use realistic error diagnosis after authentic action—for example, identifying what is wrong in a title page, citation, header, or reference entry.

## Eliminate repeated checklist loops

Teach each formatting technique once, save its completion and uncertainty state, and reopen it only when:

- it has not been completed;
- the teacher's requirements changed;
- the document changed in a way that may invalidate it;
- the student requested help;
- a later inspection found a problem.

The final Google Doc review should be the single definitive formatting inspection. Each item must say what correct looks like, where to look, and how to fix it.

## Remove empty transition pages

The “Open the paper you prepared” screen repeated verification several times and required only Continue. If the document is already verified, show a compact confirmation and move directly into the active formatting protocol.

A minimal state is sufficient:

- Your Google Doc is ready.
- Verified with your latest essay.
- Open Google Doc.
- Continue to formatting.
- Having trouble? disclosure.

## PDF download and inspection

Preserve the screenshot-based guidance. Present literal numbered steps:

1. Open your Google Doc.
2. Click **File**.
3. Point to **Download**.
4. Click **PDF Document (.pdf)**.
5. Wait for the download to finish.
6. Open the file from Downloads.
7. Return to the application and select that PDF.
8. Inspect and upload it.

The PDF checklist is justified because the PDF is a new artifact. State the distinction:

**You checked your Google Doc earlier. Now check that the downloaded PDF still looks correct.**

Verify:

- the PDF opens;
- the entire essay is present;
- the title and references pages appear when required;
- page numbers are visible;
- nothing is cut off or unexpectedly spaced;
- it is the newest version.

Show small files in KB rather than displaying 0.0 MB. Block truly zero-byte, unreadable, non-PDF, or otherwise invalid files.

## Submission confirmation

“Your paper was received” must never appear only briefly before redirecting.

The lasting success screen must function as a receipt:

- clear submitted status;
- assignment name;
- submitted filename;
- submission date and time;
- file size;
- upload status;
- receipt/submission ID when available;
- View submitted PDF;
- resubmission policy and next step.

Celebrate the entire process with a wider, more visually dynamic composition. A useful accomplishment trail is:

**Understood → Analyzed → Planned → Drafted → Revised → Formatted → Submitted**

The receipt remains the primary information; celebration supports it.

## Acceptance criteria

- Students apply each formatting move to their real Google Doc.
- One model paper provides consistent visual reference.
- The full guide is available but not dumped into the main task.
- Formatting completion persists and is not repeatedly recollected.
- PDF download directions are numbered and illustrated.
- Empty/unreadable files cannot be submitted.
- Upload results in a persistent receipt page.
- The dashboard final-PDF link points to the received submission.

# Dashboard — Confirm completion and preserve access

## Preserve

- Clear “Essay completed” status.
- Direct access to the final PDF.

## Required revisions

- Remove duplicate status wording.
- Show the most recent submission timestamp.
- Make the final PDF action visually clear.
- If resubmission is allowed, explain it; if not, explain whom to contact.
- Ensure development-only reset controls never appear in production.
- Consider a compact accomplishment trail or assignment summary without turning the dashboard into another instruction page.

## Acceptance criteria

- The dashboard state matches the persistent submission receipt.
- The student can reopen the exact submitted PDF.
- Status is stated once and unambiguously.

---

# 6. Cross-module visual and interaction system

## 6.1 Persistent journey language

Use an assignment-level journey rather than nine isolated module identities:

- Understand
- Read and notice
- Develop an argument
- Plan
- Draft
- Revise
- Prepare
- Submit

The current stage is active, completed stages are quiet but visible, and future stages are not styled as completed.

## 6.2 Page composition

Desktop pages should generally support:

- a quiet orientation region;
- a primary central workspace large enough for real writing;
- an optional contextual desk/reference rail;
- a visible readiness/action region.

Do not allow all content to collapse into a narrow center column on large screens. Do not fill large screens with decorative emptiness when an artifact, example, or progress visualization would help.

Mobile pages should stack in task order, not desktop column order.

## 6.3 Color semantics

Use the palette consistently:

- teacher/instructional coaching;
- student words and saved artifacts;
- current working action;
- successful completion;
- warning or needs-review state;
- reference material.

Color should reinforce labels, never replace them.

## 6.4 Editing model

Students must be able to correct a local artifact locally:

- edit a matrix rationale;
- repair a thesis;
- change one paragraph purpose;
- replace one evidence item;
- revise one sentence move;
- edit one paragraph;
- return from final review directly to the relevant section.

The system should recompute or mark downstream artifacts for review rather than erase them or force a full replay.

## 6.5 Success-screen family

Create a shared success-screen system with variants:

- learning milestone;
- artifact completed;
- phase transition;
- final submission receipt.

Each variant should use the same visual language but differ in evidence and emphasis. The final submission screen should be the richest; a routine section-save confirmation should be the lightest.

---

# 7. Prioritized implementation roadmap

## Priority principles

Prioritize work that prevents incorrect downstream writing, restores the intended writing process, or protects submission trust. Do not begin with decorative polish while artifact contradictions and repeated instructional loops remain.

## Phase 0 — Reconcile specifications and establish baselines

1. Treat this document as the current walkthrough strategy.
2. Map each finding to the issue log without changing the meaning of historical issues.
3. Create new issues where the complete walkthrough revealed a materially different problem.
4. Record current screenshots and state fixtures for the walkthrough account.
5. Establish regression fixtures using the walkthrough thesis, paragraph plans, ratings, 277-word draft, duplicated body paragraph, and final PDF flow.
6. Decide and document Module 8/9 ownership before editing either module.

Exit condition: the team has an agreed issue map, artifact fixtures, and module-boundary decisions.

## Phase 1 — Protect artifact and submission integrity

Highest urgency:

1. Stop character-count auto-advance.
2. Add artifact-health detection for fragments, missing sources, duplicates, and obvious plan/draft mismatch.
3. Prevent completion claims that exceed validation.
4. Make local repair possible without replaying a full module.
5. Validate PDF type, readability, and nonzero size.
6. Create a persistent submission receipt.
7. Reconcile all progress-state contradictions.

Exit condition: the app no longer certifies malformed work or leaves submission success ambiguous.

## Phase 2 — Rebuild the central writing spine, Modules 4–7

This is the most important instructional phase.

### Slice 1: one representative body paragraph end to end

Implement one complete vertical slice:

1. choose organization;
2. confirm paragraph purpose;
3. pull forward matching evidence;
4. create paragraph plan;
5. display it in a real outline;
6. draft it through sentence moves;
7. assemble it as a paragraph;
8. diagnose and revise it;
9. compare before/after.

Test the slice with strong, weak, mismatched, duplicated, and fragmentary data before generalizing components.

### Slice 2: introduction and conclusion

Build section-specific move libraries and revision diagnostics.

### Slice 3: all required body paragraphs

Generalize the vertical slice while preserving each paragraph's actual purpose and evidence.

### Slice 4: whole-essay review and word count

Add essay-level coherence and development checks, section counts, and targeted navigation.

Exit condition: a student can explain how the outline became sentences, sentences became paragraphs, and paragraphs became a revised essay.

## Phase 3 — Repair evidence-to-argument formation, Modules 2–3

1. Harden source verification and evidence provenance.
2. Remove malformed/fallback states.
3. Rebuild the evidence reread and comparison sequence.
4. Combine claim/thesis work into a coherent builder.
5. Require true both-work support.
6. Connect selected direction, thesis, and proof directions visibly.

Exit condition: every paragraph plan can trace back through thesis and comparison to evidence in both sources.

## Phase 4 — Improve entry instruction, Module 1

1. Rebuild vocabulary around familiar examples and transfer.
2. Establish the recurring rhetorical-choice → audience-effect → purpose lens.
3. Reuse the student's assignment interpretation later.

Exit condition: early instruction prepares the exact thinking used in Modules 2–4.

## Phase 5 — Consolidate document preparation and APA instruction, Modules 8–9

1. Establish the Module 8/9 boundary.
2. Build or select the canonical model paper.
3. Replace the giant learn-then-quiz experience with just-in-time application.
4. Add exact Google Docs directions and authentic checks.
5. Save check states and uncertainty.
6. Preserve and improve the illustrated PDF steps.
7. Build the final PDF inspection and receipt.

Exit condition: students can format their real paper using one guided protocol without repeated checklist loops.

## Phase 6 — Visual system, success states, and dashboard

1. Apply consistent desk/shelf hierarchy.
2. Ensure active work appears above or beside reference material.
3. Improve journey indicators and progress semantics.
4. Create success-screen variants.
5. Add proportionate celebration.
6. Improve final dashboard status and receipt access.

Exit condition: the visual hierarchy communicates the learning process and no important workspace is visually buried.

## Phase 7 — Beta-readiness validation

1. Automated unit, integration, and browser tests.
2. Fresh-account and returning-account walkthroughs.
3. Strong/weak/incomplete/contradictory artifact fixtures.
4. Mobile and desktop responsive validation.
5. Keyboard and screen-reader checks.
6. Google account and document recovery cases.
7. Failed upload and retry cases.
8. Target-age student usability sessions.
9. Teacher configuration and assignment-cloning tests.

Exit condition: the defined acceptance evidence exists; not merely a green build.

---

# 8. Recommended epic structure

Use the following epics to prevent scattered page-by-page patching.

## Epic A — Artifact coherence and repair

Includes provenance, health metadata, semantic validation, change propagation, local editing, and truthful completion.

## Epic B — Essay map and outline

Includes organizational choice, paragraph purposes, evidence placement, reasoning, formal outline, and editable review.

## Epic C — Guided drafting

Includes section move libraries, live assembly, advanced drafting path, and draft-readiness checks.

## Epic D — Diagnostic revision

Includes read-aloud observation, paragraph diagnostics, target choice, before/after, and final coherence review.

## Epic E — Assignment configuration

Includes required sections, word count, source expectations, formatting requirements, and teacher exceptions.

## Epic F — Document preparation and APA protocol

Includes authoritative Google Doc, model paper, just-in-time instruction, saved verification, and reference guide.

## Epic G — PDF and submission trust

Includes illustrated download, file validation, inspection, upload states, receipt, and dashboard access.

## Epic H — Visual hierarchy and success system

Includes page composition, semantic color, journey language, progressive disclosure, and completion variants.

---

# 9. Acceptance framework

## 9.1 Screen-level review

For every student screen, reviewers must answer:

1. What is the one dominant action?
2. Is the required context on the desk?
3. Is the active control easy to find?
4. Does the page teach a strategy rather than merely state a requirement?
5. Does the model match the student's actual task?
6. Does completion create or improve a reusable artifact?
7. Is the next use of that artifact visible?
8. Can the student repair a mistake locally?
9. Does the page avoid false certainty?
10. Does it work with keyboard, zoom, mobile, and desktop?

Any “no” requires revision or an explicit product decision.

## 9.2 Transition-level review

At every module boundary, verify:

- the student sees what was completed;
- the saved artifact is accurately summarized;
- no internal labels leak into prose;
- the next stage uses the artifact rather than asking for it again;
- changed upstream work triggers review rather than silent inconsistency;
- celebration and next-step coaching are proportionate.

## 9.3 End-to-end artifact trace

Select one final body paragraph and trace it backward:

**submitted PDF paragraph → revised paragraph → assembled draft → sentence moves → outline → paragraph plan → thesis proof direction → comparison direction → source evidence**

Every link must be inspectable. If the chain breaks, the app is not yet functioning as a writing processor.

## 9.4 Required regression scenarios

Test at least:

- clean strong student path;
- minimal but valid path;
- one source missing;
- evidence assigned to the wrong work;
- thesis changed after plans exist;
- duplicate body paragraphs;
- fragment saved in a reasoning field;
- paragraph plan and draft disagree;
- conclusion introduces a new claim;
- draft substantially below word target;
- teacher changes word-count or formatting settings;
- stale Google Doc;
- Google Doc unavailable;
- tiny valid PDF;
- zero-byte or corrupt PDF;
- upload failure and retry;
- returning student at every module boundary.

## 9.5 Evidence required to close an issue

An issue is complete only when it has:

- a stated instructional or operational outcome;
- code review against this strategy;
- focused automated coverage where appropriate;
- browser evidence for the actual workflow;
- responsive and accessibility evidence proportional to risk;
- confirmation that persistence and downstream artifacts remain correct;
- updated issue-log status and resolution notes.

---

# 10. What not to do

- Do not rewrite the entire application at once.
- Do not preserve a flawed interaction merely because automated tests cover it.
- Do not treat every existing page as necessary.
- Do not solve cognitive overload by hiding the only information students need.
- Do not add more instructional paragraphs where a model or authentic action is needed.
- Do not add another checklist when an existing completion state can be reused.
- Do not use AI to silently repair or replace student prose.
- Do not use word count to reward filler.
- Do not present teacher preferences as universal APA rules.
- Do not certify “ready,” “complete,” or “submitted” without evidence.
- Do not prioritize celebration styling above artifact integrity, but do not leave major accomplishments emotionally flat once integrity is secure.

---

# 11. Immediate next actions

1. Update the walkthrough issue log with the new findings and new issue IDs where needed.
2. Make the Module 8/9 ownership decision explicit.
3. Define teacher-configurable word-count and formatting settings.
4. Specify artifact-health checks and local repair behavior.
5. Prototype one Body Paragraph vertical slice across Modules 4–7.
6. Build the persistent Module 9 submission receipt and PDF validation as an independent trust fix.
7. Select or create the canonical model APA student paper and verify its accuracy.
8. Run the revised vertical slice with the walkthrough data before scaling it to every section.

The first implementation milestone should not be “Module 4 redesigned” or “Module 6 redesigned” in isolation. It should be:

> A student can take one evidence-based paragraph purpose, plan it, outline it, draft it through visible moves, revise the assembled paragraph using a diagnosed need, and trace the finished paragraph back to the evidence and thesis.

That milestone proves the central instructional architecture before the team repeats it across the rest of the essay.

---

# 12. Product-level definition of success

The revision strategy succeeds when a target-age student can move through the application and accurately say:

- “I know what I am doing right now.”
- “I know why this step matters.”
- “I can see the work I already did that helps me.”
- “I am making one real writing decision or change.”
- “I can fix a problem without starting over.”
- “I can see how my evidence became my argument.”
- “I can see how my plan became paragraphs.”
- “I can see what I changed during revision.”
- “I know how to prepare and check the document.”
- “I know exactly what I submitted, and I have proof it was received.”

The product is approaching its intended form when those statements are true because of the experience itself—not because a teacher standing beside the student explains what the interface meant.
