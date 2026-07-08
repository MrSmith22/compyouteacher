# Assignment Definition V2

## Purpose

This document defines the future **Assignment Definition** model for The Writing Processor / Writing Learning Engine.

Its purpose is to explain how an assignment definition eventually becomes the **source of truth for the student learning experience**. In the long term, the assignment definition should not merely label an assignment. It should define the learning path, source expectations, evidence requirements, artifact expectations, coaching language, and publishing requirements that shape the student's work across Modules 1-10.

This is an architecture and product design document. It does not require immediate implementation and does not assume a rewrite.

---

## 1. What an Assignment Definition Is

An Assignment Definition is the canonical description of what a student is being asked to learn, build, and produce in a specific writing assignment.

It is **not** just metadata.

It is not enough for an assignment definition to contain only a title, prompt, and list of sources. In the future Writing Learning Engine, an assignment definition should define the student experience across the full workflow.

That means an assignment definition should specify:

- the identity of the assignment
- the instructional purpose of the assignment
- the essential question
- the prompt and writing expectations
- the content knowledge expectations
- the source requirements students must satisfy
- the evidence students must collect
- the patterns, ideas, claims, and thesis work the assignment expects
- the proof and organization logic that follows
- the drafting and revision expectations
- the publishing and submission requirements
- the coaching language and deterministic scaffolds that guide students before AI is introduced

In the future model, the assignment definition becomes the **instructional blueprint** for the assignment. It tells the system what kinds of student work should exist, what sequence of thinking should occur, what artifacts matter, what sources are required, and how later modules should build on earlier modules.

Put simply:

- the **assignment definition** defines the learning experience
- the **modules** render stages of that experience
- the **artifact engine** preserves the student work created within it
- the **thinking canvas** preserves the relationships among those artifacts

---

## 2. Assignment Definition vs Current MLK Config

The current `mlkAssignmentDefinition` is an **early version** of this future model.

It already includes important building blocks:

- identity
- prompt
- sources
- guided passages
- source metadata

More specifically, the current definition already contains:

- assignment identity fields
- assignment title
- essential question
- essay prompt
- author and subject naming
- source titles
- source audience and purpose defaults
- search-related source metadata
- trusted-source metadata
- citation-related source metadata
- rhetorical strategy list
- guided observation passages

This means the current system has already begun the shift from hardcoded assignment behavior toward a reusable assignment-definition model.

However, the current `mlkAssignmentDefinition` is still only a **partial definition**. It does not yet fully define the instructional experience. Much of the real learning flow remains distributed across page-level and component-level logic, especially in:

- source gathering behavior
- evidence expectations
- Module 3 thesis and claim scaffolds
- organization logic
- drafting and revision guidance
- deterministic coaching rules
- teacher review expectations

In the future model, the assignment definition will need to include enough structure to become the primary configuration surface for:

- what students must understand
- what students must collect
- what thinking steps they move through
- what artifacts should be created
- what coaching language appears at each stage
- what later modules expect to receive

The current MLK config is therefore best understood as **Assignment Definition V0.5**:

- strong enough to prove the pattern
- not yet complete enough to drive the full learning experience

---

## 3. Required Top-Level Fields

The future assignment definition will likely need the following top-level sections.

### `identity`

Defines the stable identity of the assignment.

This should include:

- assignment id
- assignment name
- title
- version
- display labels
- course or subject context if needed later

This section binds the assignment definition to progress, artifact storage, and display context.

### `standards`

Defines standards alignment for the assignment.

This may include:

- writing standards
- reading standards
- argumentation standards
- disciplinary literacy standards
- grade-band expectations

This allows the assignment definition to describe the instructional purpose in standards terms, even if the first implementation uses the information only lightly.

### `writingMode`

Defines what kind of writing the student is being asked to do.

Examples might include:

- argument
- literary analysis
- rhetorical analysis
- explanatory writing
- synthesis
- historical analysis

This matters because the writing mode shapes evidence expectations, claim structure, organization, and publishing expectations.

### `essentialQuestion`

Defines the core question that the assignment is trying to answer.

This is not simply a prompt restatement. It provides the deeper inquiry frame that helps connect evidence, claims, and reasoning.

### `prompt`

Defines the full writing task presented to the student.

This should include:

- full prompt language
- task requirements
- comparison or argument expectations
- success criteria stated in student-facing terms

### `contentKnowledge`

Defines what students need to understand before meaningful evidence collection or claim formation can occur.

This section may include:

- background knowledge needs
- core concepts
- vocabulary
- framing context
- assignment-specific knowledge-building steps

### `sourceIntelligence`

Defines the rules and expectations for how students gather, understand, evaluate, and cite sources.

This is where the assignment definition connects to source requirements, credibility logic, and citation expectations.

### `sources`

Defines the actual source set for the assignment.

This should include:

- source identities
- source types
- titles
- authors
- trusted source metadata
- source-specific instructional notes

### `evidenceRequirements`

Defines what the minimum evidence library should contain and what kinds of evidence students must gather before moving into claim-building work.

### `observationSchema`

Defines what kinds of evidence observations students create and how those observations are structured.

This includes:

- what fields are required
- what thinking prompts guide evidence collection
- what tags or labels the evidence can carry

### `patternDiscovery`

Defines how students move from evidence to patterns.

This may include:

- pattern-noticing prompts
- comparison expectations
- contrast expectations
- significance prompts

### `claimDevelopment`

Defines how students move from pattern to idea to claim.

This should include:

- what counts as a claim
- what support expectations exist
- what deterministic checks should happen before a claim is accepted as usable

### `thesisDevelopment`

Defines how a claim becomes a thesis.

This may include:

- thesis expectations
- claim-to-thesis guidance
- writing-mode-specific thesis patterns
- proof-direction expectations

### `proofPlan`

Defines how students should identify the main lines of proof that flow from the thesis.

This becomes especially important for Module 3 V2 and Module 4.

### `organization`

Defines how the assignment expects argument structure to develop.

This may include:

- paragraph logic
- section ordering
- body-structure expectations
- outline constraints

### `drafting`

Defines the expectations for turning organized thinking into prose.

This may include:

- section-level expectations
- body paragraph expectations
- evidence integration expectations
- introduction and conclusion guidance

### `revision`

Defines what students are expected to revise and how they should evaluate improvement.

This may include:

- clarity
- support strength
- reasoning depth
- coherence
- style and polish

### `publication`

Defines how the final work is prepared and presented.

This may include:

- submission requirements
- formatting requirements
- citation style
- export requirements
- final publishing checks

### `teacherReview`

Defines what teachers need to see about this assignment.

This may include:

- review checkpoints
- artifact visibility expectations
- teacher-facing summaries
- intervention flags

### `coachingRules`

Defines deterministic coaching language and rule-based feedback before AI is introduced.

This section matters because the system should be able to give instructional support that is assignment-aware even before any AI coach layer exists.

---

## 4. Source Intelligence Requirements

The assignment definition must define what source data students are expected to collect and understand.

This is necessary because source work is not generic across all assignments. Different assignments may require different kinds of source validation, citation, and credibility understanding.

At minimum, the assignment definition should be able to define source intelligence requirements for:

- title
- author
- publisher
- organization
- publication date
- URL
- access date
- source type
- credibility questions
- citation style requirements

### Title

The system should know the title students are expected to collect, confirm, or use in citation and source understanding work.

### Author

The system should define what author information matters and how it should be displayed or checked.

### Publisher

Assignments should be able to specify whether publisher information matters and how students should interpret it.

### Organization

For many source-based assignments, the publishing organization or hosting organization matters for credibility. The definition should be able to declare what organization-level information students must capture or evaluate.

### Publication date

The assignment definition should be able to specify whether publication date is required, optional, or central to credibility and context.

### URL

Assignments should define whether the original URL must be captured and retained for source verification, citation, or teacher review.

### Access date

Assignments that use web-based sources may require access dates for citation or documentation purposes.

### Source type

The assignment definition should define the source categories students are expected to use, such as:

- speech
- letter
- article
- historical document
- poem
- video transcript
- editorial
- primary source
- secondary source

This matters for source understanding, evidence expectations, and later interpretation.

### Credibility questions

The assignment definition should also be able to define deterministic credibility questions such as:

- Who produced this source?
- Why should this source be trusted?
- What organization stands behind it?
- Is this a primary or secondary source?
- What makes this source credible for this assignment?

These questions are part of the instructional design, not just source metadata.

### Citation style requirements

The assignment definition should specify the citation expectations associated with the assignment, including:

- APA
- MLA
- other style variants later

This keeps source intelligence aligned with publication requirements.

---

## 5. Evidence Requirements

The assignment definition should define what counts as sufficient evidence for the assignment.

This includes:

- minimum evidence library
- required evidence types
- required tags
- optional evidence expansion
- evidence strength rules

### Minimum evidence library

The assignment definition should specify the minimum evidence base students must build before they move meaningfully into pattern discovery and claim formation.

This requirement should be instructional, not arbitrary. Its purpose is to ensure that students have enough material to think with.

### Required evidence types

Assignments may require different kinds of evidence. The definition should be able to specify expectations such as:

- direct quotations
- paraphrased observations
- textual moments
- examples of a rhetorical strategy
- examples from multiple sources
- contrasting evidence

### Required tags

The assignment definition should define which evidence tags are required or expected for the assignment.

Depending on the assignment, these might include:

- source
- strategy
- theme
- issue
- perspective
- section of text
- credibility status
- claim relevance

Required tags matter because they make the Evidence Library useful for later filtering and claim development.

### Optional evidence expansion

The assignment definition should also specify whether students are expected or encouraged to gather more evidence once an idea or claim begins to form.

This is especially important in the Writing Learning Engine V2 model, where claim strength may require revisiting evidence after an early idea has emerged.

### Evidence strength rules

Assignments should be able to define how evidence strength is interpreted in that assignment context.

The definition should be able to support instructional rules such as:

- one example is not enough for a broad claim
- multiple sources are needed for certain argument types
- contrast or complexity may be required for stronger support
- explanation matters as much as evidence count

These should remain instructional rules, not grading rules.

---

## 6. Artifact Expectations

The assignment definition should tell the Artifact Engine what artifacts should be created as students move through the assignment.

This is critical because not every assignment will require the same artifact pattern, even if they share the same module structure.

The future assignment definition should be able to define expectations for:

- source artifacts
- evidence artifacts
- pattern artifacts
- idea artifacts
- claim artifacts
- thesis artifacts
- proof plan artifacts
- paragraph plan artifacts
- draft section artifacts
- revision artifacts

### Source artifacts

The definition should clarify what source-level artifacts exist and what information they must preserve.

### Evidence artifacts

The definition should specify what counts as valid evidence for the assignment and what structure the evidence artifacts must follow.

### Pattern artifacts

Assignments should be able to declare whether students are expected to produce explicit pattern notices and how those are shaped.

### Idea artifacts

The definition should specify whether exploratory ideas are first-class artifacts and how they relate to evidence and patterns.

### Claim artifacts

The definition should specify what a supported working claim looks like in that assignment context.

### Thesis artifacts

The definition should define how the final thesis or central claim statement should be represented and reused later.

### Proof plan artifacts

The definition should declare whether the assignment expects explicit lines of proof, categories of support, or other claim-to-organization bridge artifacts.

### Paragraph plan artifacts

The definition should specify how body-level thinking is represented before drafting.

### Draft section artifacts

The definition should clarify how drafted writing sections relate back to plans and claims.

### Revision artifacts

The definition should specify what revision thinking becomes durable and how that artifact should support later polish or teacher review.

In the future model, this means the assignment definition does not just shape prompts. It shapes the **artifact lifecycle** of the assignment.

---

## 7. Coaching and Feedback

The assignment definition should define coaching and feedback language before AI is introduced.

This matters because the system should be able to provide deterministic, assignment-aware support even when no AI layer is involved.

The assignment definition should therefore include:

- coaching language for source gathering
- prompts for evidence collection
- pattern-noticing guidance
- claim-strength checks
- evidence-strength reminders
- thesis-development cues
- organization reminders
- drafting and revision checklists

This coaching layer should be:

- deterministic
- stage-aware
- assignment-aware
- reusable
- consistent across the student experience

For example, an assignment definition may specify:

- what to say when evidence is too thin
- what to say when a pattern notice is too vague
- what to say when a claim overreaches the evidence
- what to say when a thesis does not yet point toward proof

This gives the system meaningful instructional scaffolding without requiring AI-generated feedback.

Later, an AI coach can build on this foundation. But the assignment definition should first support deterministic coaching rules that are transparent, testable, and stable.

---

## 8. Generic Module Rendering

In the future, modules should render stages based on the assignment definition rather than hardcoded MLK content.

That does **not** mean the existing module structure disappears. It means the learning content inside the modules becomes definition-driven.

For example:

- Module 2 should render source and evidence expectations based on the assignment definition
- Module 3 should render pattern, idea, claim, and thesis stages based on the assignment definition
- Module 4 should render proof and organizational structures based on the assignment definition
- later modules should render drafting, revision, and publication expectations based on the assignment definition

This creates a system in which:

- module numbers stay stable
- the pedagogical spine stays stable
- assignment-specific content becomes configurable

In that model, future modules become generic stage renderers for an assignment-defined workflow.

The assignment definition therefore becomes the contract between:

- the writing engine
- the module system
- the artifact engine
- the thinking canvas
- the future coaching layer

---

## 9. Compatibility Strategy

This model must evolve from the current app **without breaking**:

- existing routes
- existing module numbers
- existing Supabase tables
- current MLK assignment
- Module 4 and 5 compatibility

### Existing routes

The current route structure should remain intact. The assignment definition should drive what modules render, not force a route redesign.

### Existing module numbers

The numbered module spine is already part of the product logic and student experience. Assignment Definition V2 should work inside that structure.

### Existing Supabase tables

The current tables should remain valid. Assignment Definition V2 should be additive and should guide future refactors rather than require destructive schema changes up front.

### Current MLK assignment

The current MLK assignment should remain the canonical first assignment instance. It becomes the first full migration target for the V2 definition model, not a special exception outside of it.

### Module 4 and 5 compatibility

Modules 4 and 5 currently depend on current Module 3 outputs. As Module 3 V2 evolves, compatibility should be preserved until those modules are refactored to consume newer artifacts more directly.

In short, Assignment Definition V2 should be introduced as a **source-of-truth layer**, not as a breaking replacement layer.

---

## 10. Example: MLK Rhetorical Analysis

The current MLK rhetorical analysis assignment maps cleanly into this future model.

### Identity

The definition already has:

- assignment id
- assignment name
- title
- author display naming

### Prompt and essential question

The MLK assignment already defines:

- a full compare-and-contrast rhetorical analysis prompt
- an essential question focused on rhetorical choices, audiences, and purposes

### Source intelligence

The MLK assignment already defines or implies:

- two sources
- source titles
- source audience and purpose defaults
- official source URLs
- trusted-source expectations
- transcript examples
- citation-related metadata

### Evidence requirements

In the V2 model, the MLK assignment would explicitly define:

- a minimum evidence library across both texts
- rhetorical-strategy evidence expectations
- required source tagging
- evidence-strength rules for compare-and-contrast reasoning

### Observation schema

The MLK assignment already has a strong starting point here through guided passages and rhetorical strategy observation fields.

### Pattern, claim, and thesis development

Under V2, the MLK assignment would explicitly define:

- the pattern-noticing stage
- the idea-development stage
- the claim-development expectations
- thesis expectations for rhetorical compare-and-contrast work

### Proof plan and organization

The definition would specify how the thesis should be developed into proof directions and paragraph-level organization.

### Drafting, revision, and publication

The definition would also define:

- what drafting guidance belongs to this assignment
- what revision focus matters most
- what citation and publication requirements apply

This example shows that the current MLK assignment is already close enough to serve as the first full Assignment Definition V2 target. It simply needs to be expanded from a partial configuration into a full learning-definition model.

---

## 11. What Not To Build Yet

The Assignment Definition V2 effort should explicitly exclude:

- teacher assignment authoring UI
- AI-generated assignments
- database-backed assignment builder
- full schema migration
- second assignment implementation

### Teacher assignment authoring UI

The system does not need a teacher-facing authoring interface before the definition model itself is stable.

### AI-generated assignments

Assignments should not be generated automatically before the structure, vocabulary, and deterministic learning rules are well defined.

### Database-backed assignment builder

The first goal is to stabilize the definition model, not to build an authoring platform around it.

### Full schema migration

Current tables should remain valid while the assignment definition becomes more capable.

### Second assignment implementation

A second assignment should not be attempted until the first assignment definition model is stable enough to drive Module 3 V2 and its downstream compatibility successfully.

---

## 12. Implementation Roadmap

### Phase 1: documentation only

Define the Assignment Definition V2 model conceptually and align it with the Writing Learning Engine, source intelligence, artifact vocabulary, and Module 3 V2 design.

### Phase 2: stabilize current assignment definition shape

Clarify the current definition boundaries and formalize the near-term shape of the MLK assignment definition so it can act as the first full example.

### Phase 3: extend source intelligence fields

Expand the assignment definition so that it fully defines source intelligence requirements, not just source labels and URLs.

### Phase 4: define evidence requirements

Add explicit assignment-level evidence expectations, including minimum evidence library rules, evidence types, tagging expectations, and evidence-strength logic.

### Phase 5: define Module 3 V2 artifact requirements

Extend the definition so that it can express pattern, idea, claim, thesis, and proof-plan expectations for Module 3 V2.

### Phase 6: use assignment definition to drive Module 3 V2

Make Module 3 V2 the first major module whose instructional experience is directly shaped by the Assignment Definition V2 model.

### Phase 7: create second assignment only after Module 3 V2 works

Only after Module 3 V2 works successfully under this definition model should a second assignment be attempted.

---

## First Code Phase After This Document

The first code phase that should follow this document is:

**stabilize and formalize the current assignment definition shape around the existing MLK assignment**

That phase should focus on:

- clarifying the canonical TypeScript shape of the assignment definition
- aligning current MLK fields with that shape
- identifying which current hardcoded areas map cleanly to existing fields
- preparing the definition to absorb source-intelligence, evidence, and Module 3 V2 artifact requirements later

This should still be a **non-destructive, compatibility-first phase**.

### Files likely to inspect first

- `docs/assignment-definition-engine.md`
- `docs/writing-learning-engine-vision.md`
- `docs/writing-learning-engine-v2.md`
- `docs/module3-v2-design.md`
- `docs/thinking-canvas-v1.md`
- `lib/assignments/index.ts`
- `lib/assignments/mlkRhetoricalAnalysis.ts`
- `lib/assignments/identity.ts`
- `app/modules/2/observations/guided/page.js`
- `components/ModuleThreeForm.js`

### Files not to touch yet

- `student_assignments` progress behavior
- Module 4 logic
- Module 5 logic
- broad draft-module flow in Modules 6-9
- teacher dashboard behavior
- any attempt to replace all current tables
- any second-assignment implementation
- any AI-generated assignment layer

---

## Closing Summary

Assignment Definition V2 is the future source-of-truth model for the student learning experience. It expands the current partial MLK configuration into a full instructional definition that can eventually specify source intelligence, evidence requirements, artifact expectations, coaching rules, organizational logic, and publication requirements while preserving the current route structure, module spine, storage model, and compatibility path.
