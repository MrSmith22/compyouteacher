# Writing Processor Architecture V1

## Purpose

This document is the master architecture blueprint for **The Writing Processor / Writing Learning Engine**.

It synthesizes the current architectural direction across:

- `docs/writing-learning-engine-v2.md`
- `docs/assignment-definition-v2.md`
- `docs/thinking-canvas-v1.md`
- `docs/artifact-engine-v1.md`
- `docs/module3-v2-design.md`

This is the final architecture synthesis document before implementation returns to active build work.

It is a design document only.

It does **not** propose code changes, Supabase migrations, module rewrites, or new product features. Its purpose is to define the system clearly enough that implementation can proceed in small, compatibility-first phases.

## 1. Product Identity

The Writing Processor is a **Writing Learning Engine**, not an essay generator.

Its purpose is to help students learn how writing grows out of thinking. Students should understand the assignment, gather sources, collect evidence, notice patterns, develop ideas, form claims, organize reasoning, draft, revise, and publish. The product exists to scaffold those thinking moves in a structured, reusable way.

AI is not the product identity. Essay generation is not the product identity. The product identity is a guided writing system that teaches students how to think with evidence and turn that thinking into writing.

In this architecture:

- assignments define the instructional experience
- modules render the stages of that experience
- artifacts preserve the student work created along the way
- the Thinking Canvas makes that work visible across the assignment
- teacher views reveal the development of thinking, not just final submission

## 2. Core Architecture Layers

### Assignment Definition

The Assignment Definition layer is the instructional blueprint. It defines what the assignment is asking students to learn, collect, build, and produce.

Over time, it should define:

- assignment identity
- prompt and essential question
- writing mode
- source intelligence expectations
- evidence requirements
- observation schema
- pattern, idea, claim, and thesis expectations
- proof and organization expectations
- drafting and revision expectations
- deterministic coaching language
- teacher review expectations

### Module Renderer

The Module Renderer layer is the staged student experience. It keeps the numbered module spine and route structure, but its long-term role is to render assignment-defined learning stages rather than hardcoded assignment-specific flows.

### Artifact Engine

The Artifact Engine is the persistence and normalization layer for durable student thinking. It names the major artifacts, maps them onto current storage, preserves compatibility, and later supports new artifact types when the current system cannot represent them cleanly.

### Existing Supabase Helper Layer

The existing Supabase Helper Layer is the current application’s persistence boundary. It already provides table- and workflow-specific reads and writes. In V1, it remains the implementation base that the Artifact Engine builds on top of rather than replaces.

### Thinking Canvas

The Thinking Canvas is the assignment-level workspace and display layer for student thinking. It is not the storage model. It is the visible continuity layer that lets students and teachers see how evidence, ideas, claims, planning, drafting, and revision connect over time.

### Teacher Review Layer

The Teacher Review Layer is the teacher-facing visibility layer. It surfaces artifacts, progress, evidence history, draft development, and other signs of student growth so that teachers can review thinking, not just finished writing.

### Future AI Coach Layer

The Future AI Coach Layer is a later instructional layer that reads durable artifacts and gives coaching based on the student’s real thinking path. It is additive and depends on the deterministic system beneath it being stable first.

## 3. Responsibility of Each Layer

### Assignment Definition

What it owns:

- instructional intent
- assignment-specific source expectations
- evidence expectations
- artifact expectations
- coaching language
- module-stage content rules

What it must not own:

- raw student persistence
- Supabase table design
- UI layout details for every screen
- teacher dashboard implementation
- AI generation behavior

### Module Renderer

What it owns:

- student-facing routes and staged experiences
- rendering the current step in the workflow
- collecting student input
- triggering artifact creation and updates

What it must not own:

- the long-term definition of the assignment
- the permanent meaning of artifacts
- isolated storage models that cannot be reused later
- future visualization logic

### Artifact Engine

What it owns:

- artifact vocabulary
- artifact normalization over current storage
- compatibility mappings
- artifact retrieval and reuse boundaries
- relationship preservation where possible

What it must not own:

- full module UI
- assignment pedagogy
- visualization surfaces
- teacher-facing review experiences
- AI feedback logic

### Existing Supabase Helper Layer

What it owns:

- table- and workflow-specific persistence operations
- compatibility-safe reads and writes
- low-level storage access

What it must not own:

- instructional meaning
- assignment pedagogy
- Thinking Canvas display logic
- future artifact vocabulary decisions

### Thinking Canvas

What it owns:

- assignment-level thinking continuity
- artifact visibility across modules
- relationship display
- read-only or later interactive workspace surfaces

What it must not own:

- persistence rules
- artifact schema decisions
- module progression logic
- assignment instructional definitions

### Teacher Review Layer

What it owns:

- teacher visibility into progress and thinking
- summaries of artifacts and development
- intervention and review surfaces

What it must not own:

- artifact persistence
- student module rendering
- assignment-definition logic
- AI coaching logic

### Future AI Coach Layer

What it owns:

- reading artifacts and relationships
- giving instructional coaching
- helping students recognize weak support, gaps, and next moves

What it must not own:

- authorship of student work
- silent artifact writes
- deterministic scaffolding replacement
- foundational architecture decisions that belong to earlier layers

## 4. Data Flow

The intended V1 data flow is:

Assignment Definition  
-> Module experience  
-> Student action  
-> Artifact  
-> Helper  
-> Supabase  
-> Later module reuse  
-> Thinking Canvas display  
-> Teacher visibility

This means:

1. The Assignment Definition determines what kind of thinking the module should ask for.
2. The module renders that stage as a student experience.
3. The student performs a real thinking action: gather a source, save evidence, form an idea, build a plan, draft, revise.
4. That action creates or updates a durable artifact.
5. A helper or adapter writes that artifact using the current persistence boundary.
6. Supabase stores the current durable representation.
7. Later modules reuse the artifact instead of pretending earlier thinking disappeared.
8. The Thinking Canvas reads the artifacts and shows continuity across the assignment.
9. The Teacher Review Layer reads the same durable work and makes the student’s development visible.

Architecturally, the key principle is that **student thinking should move forward through the system as durable work**, not as temporary prompt completion.

## 5. Compatibility Strategy

V1 is explicitly compatibility-first.

That means:

- current tables remain in place
- current helpers remain in place
- current module routes remain in place
- current module numbers remain in place
- current working MLK assignment remains in place

V1 does **not** assume:

- destructive migration
- replacement of all existing tables
- replacement of all current helpers
- module rewrites before earlier layers are stable

The compatibility rule is:

- use current tables and helpers first
- add adapters before migrations
- add new storage only if a real artifact cannot fit existing storage cleanly
- preserve Module 4 and Module 5 compatibility during Module 3 V2

This is especially important because Module 4 and Module 5 still depend on the current Module 3 compatibility handoff. Module 3 V2 must therefore produce richer artifacts while continuing to preserve the current downstream read path until those modules are safely refactored.

## 6. Artifact Strategy

Artifact Engine V1 is additive, not replacement-oriented.

Its central strategy is:

- existing objects become artifacts through adapters
- `student_observations` is the future evidence model
- `tchart_entries` remains compatibility evidence
- `module3_responses` remains compatibility handoff until later refactor
- new artifact storage is introduced only when necessary

In practice, that means:

- `student_observations` is the strongest existing future-facing evidence representation
- `tchart_entries` remains the currently active evidence backbone for downstream modules
- `module2_sources` remains the temporary source-context and citation backing layer
- `module3_responses.thesis` remains the durable thesis handoff for current modules
- `student_buckets` already behaves like paragraph planning
- `student_outlines` already behaves like outline persistence
- `student_drafts` already behaves like the durable draft family

Artifact Engine V1 should therefore begin as:

- an artifact vocabulary
- an adapter layer over current storage
- a compatibility read model
- a minimal boundary for future Module 3 V2 artifacts

It should not begin as a generalized replacement database model.

## 7. Assignment Definition Strategy

Assignment Definition V2 establishes that assignment definitions should define instruction, not just metadata.

Over time, assignment definitions should own:

- source intelligence expectations
- evidence requirements
- observation schema
- pattern and claim development expectations
- thesis and proof-plan expectations
- coaching language
- artifact expectations
- teacher review expectations

The MLK configuration is the first Assignment Definition.

It is not yet the full future model, but it is the first real assignment-specific definition shape from which the rest of the architecture grows. The architecture should therefore treat the MLK definition as the first canonical assignment-definition target rather than as a one-off exception.

The strategic direction is:

- stabilize the definition shape
- move more instructional logic into it over time
- let modules gradually render assignment-defined experiences instead of relying on hardcoded instructional copy

## 8. Thinking Canvas Strategy

The Thinking Canvas is a display and workspace layer, not the storage layer.

It reads artifacts.
It does not own persistence.

Its role is to make student thinking visible across the assignment so that work from one module remains available in later modules and visible to teachers. It is the continuity surface, not the storage authority.

In V1, the Thinking Canvas should remain modest:

- read-only first
- additive
- assignment-level
- grounded in real stored artifacts

This is why the Canvas Engine must come before any richer visual canvas. Without durable artifacts and relationships underneath it, a canvas would be decorative rather than instructional.

## 9. Module Strategy

Modules remain the route and stage system.

They should evolve according to these principles:

- modules remain routes and stages
- modules render assignment-defined experiences
- modules create artifacts
- modules gradually stop owning isolated data models

The architecture does **not** call for removing the numbered module spine. Instead, it calls for changing what modules do internally:

- less assignment-specific hardcoding
- more assignment-defined instructional rendering
- less isolated module-only storage logic
- more artifact creation and reuse across modules

The ideal long-term state is that modules still provide the staged student journey, but the meaning of the experience comes from the Assignment Definition and the Artifact Engine rather than from scattered page-level assumptions.

## 10. Source Intelligence Strategy

Source and citation work belongs early in the workflow.

Sources should become artifacts before evidence.

Citation metadata should be collected during source work, not at the end.

This matters because:

- students should understand sources before they use them as evidence
- source credibility and context shape later thinking
- citation information is most accurate when captured while the source is being gathered
- the system should not treat citation as an afterthought added after drafting

The architecture therefore places source intelligence early:

- source identification
- source understanding
- source metadata capture
- citation capture
- then evidence collection

That sequence supports both stronger student thinking and cleaner later reuse.

## 11. AI Strategy

AI is a future layer only.

AI should:

- read artifacts
- coach thinking
- help students recognize gaps in evidence, support, and reasoning

AI should not:

- write student work
- replace deterministic scaffolding
- appear before the artifact and canvas foundations work

The architecture assumes a strict sequencing rule:

- deterministic scaffolding first
- durable artifacts second
- Thinking Canvas visibility third
- AI coaching only after those foundations are trustworthy

This preserves student ownership and keeps the system aligned with its identity as a Writing Learning Engine rather than an essay generator.

## 12. Architectural Rules

- Preserve working systems.
- Add adapters before migrations.
- Student thinking must persist.
- Every student response should deepen thinking or become reusable.
- Do not make the Canvas busywork.
- Do not introduce AI before deterministic scaffolding works.
- Do not make modules directly depend on future visualization.
- Prefer assignment-defined content over hardcoded instructional copy.
- Do not create new tables unless current storage cannot express the artifact.
- Preserve Module 4 and Module 5 compatibility while Module 3 V2 is introduced.
- Keep new architecture additive before it becomes substitutive.
- Keep visualization downstream of artifact durability.
- Keep teacher visibility downstream of artifact persistence, not in parallel ad hoc storage.
- Test after every phase.

## 13. Near-Term Implementation Order

The near-term implementation order should be:

1. Commit current assignment-definition stabilization.
2. Create the master architecture doc.
3. Build the minimal Artifact Engine adapter layer.
4. Build Module 3 V2 using artifacts while preserving `module3_responses` compatibility.
5. Add a read-only Thinking Canvas sidebar.
6. Refactor Module 4 to consume Module 3 V2 outputs.
7. Later: graphic organizer / visual canvas.
8. Later: AI Coach.

This order matters because it keeps architecture, compatibility, and pedagogy aligned:

- Assignment Definition stabilization clarifies the source-of-truth model.
- The master architecture doc aligns the major documents into one system.
- The Artifact Engine adapter layer creates the minimal persistence boundary needed for future work.
- Module 3 V2 becomes the first real artifact-producing module without forcing downstream rewrites all at once.
- The read-only Canvas sidebar proves the value of artifact continuity before more complex visualization work.
- Module 4 refactor comes only after Module 3 V2 outputs are stable enough to consume directly.

## 14. What Not To Do Next

The next phase should explicitly exclude:

- full canvas visualization
- drag and drop
- AI API integration
- Supabase rewrite
- second assignment
- teacher assignment builder
- Module 4 rewrite before Module 3 V2 works

These are excluded not because they are unimportant, but because they depend on earlier architecture becoming stable first.

## First Implementation Task After This Document

The exact first implementation task after this document is:

**Build the minimal Artifact Engine adapter layer on top of the current helpers and storage model, with special attention to Module 3 V2 compatibility and preservation of the current Module 4 and Module 5 handoff path.**

That phase should focus on:

- defining the first artifact vocabulary in code
- mapping current durable objects to that vocabulary
- creating the smallest helper or adapter boundary needed for artifact-aware reads and writes
- preserving all current module behavior
- preparing Module 3 V2 to create richer artifacts without breaking current downstream modules

### Files likely to inspect first

- `docs/writing-learning-engine-v2.md`
- `docs/assignment-definition-v2.md`
- `docs/thinking-canvas-v1.md`
- `docs/artifact-engine-v1.md`
- `docs/module3-v2-design.md`
- `lib/assignments/index.ts`
- `lib/assignments/mlkRhetoricalAnalysis.ts`
- `lib/supabase/helpers/studentObservations.ts`
- `lib/supabase/helpers/studentBuckets.ts`
- `lib/supabase/helpers/studentOutlines.ts`
- `lib/supabase/helpers/studentDrafts.ts`
- `components/ModuleThreeForm.js`
- `app/modules/4/page.js`
- `components/ModuleFour.js`
- `components/ModuleFive.js`

### Files not to touch yet

- `student_assignments` progress behavior
- module gating behavior
- full Module 4 rewrite
- full Module 5 rewrite
- broad draft-module flow in Modules 6-9
- teacher dashboard redesign
- any attempt to replace all current tables
- any AI coaching layer
- any second-assignment implementation
- any teacher assignment authoring system

## Closing Summary

The Writing Processor architecture is now defined as a layered Writing Learning Engine:

- Assignment Definitions define the instructional blueprint
- Modules render staged student experiences
- the Artifact Engine preserves durable student work
- the existing helper layer remains the V1 persistence boundary
- the Thinking Canvas displays continuity across modules
- teacher review surfaces the path of development
- a future AI Coach reads artifacts only after deterministic scaffolding is stable

This architecture keeps the current product working while establishing the path toward a reusable writing engine that preserves student thinking across the full assignment lifecycle.
