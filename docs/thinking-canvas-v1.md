# Thinking Canvas V1

## Purpose

This document defines the first buildable version of the **Thinking Canvas / Canvas Engine** for The Writing Processor.

It is an **architecture and product design document**, not an implementation task.

The Thinking Canvas is **not** a separate app. It is the persistent workspace **inside** The Writing Processor where student thinking accumulates across an assignment. It should evolve the current application without replacing it.

The V1 goal is not to introduce a full visual canvas. The V1 goal is to define the durable artifacts of student thinking, the relationships among those artifacts, and the first additive layer that allows the current module system to behave more like a connected thinking environment.

---

## 1. What the Thinking Canvas Is

The Thinking Canvas is the **memory and workspace** of The Writing Processor.

Today, students move through modules that each produce important pieces of thinking: understanding the task, gathering evidence, developing observations, building a thesis, organizing paragraphs, drafting sections, and revising writing. Those artifacts already exist in various forms across the current system. What is missing is a durable way to preserve the **relationships** among them so that later work can visibly grow from earlier thinking.

The Thinking Canvas solves that problem. It does not replace modules. It gives the modules a shared conceptual workspace.

In the Canvas model:

- modules create artifacts
- artifacts remain available after the module ends
- artifacts connect to one another across time
- later modules can reuse earlier thinking directly
- teachers can see not only final products, but the path of development

The Canvas therefore acts as the assignment-level record of student reasoning. It preserves how a student moved from understanding the task, to collecting evidence, to noticing patterns, to forming claims, to planning paragraphs, to drafting and revising.

The core product idea is simple: **student thinking should accumulate, not disappear between modules**.

---

## 2. Why We Are Building the Canvas Engine First

The visual canvas comes later.

The first need is not a graph, drag-and-drop board, or new interactive surface. The first need is a reliable architecture for **durable artifacts and relationships**.

If the product tries to build a visual canvas before the underlying artifact model is clear, the result will likely be decorative rather than useful. A visual layer without durable thinking objects underneath it will not create real instructional value.

Building the Canvas Engine first allows the team to:

- define a stable artifact vocabulary
- preserve relationships among artifacts
- keep using the current module system
- support gradual refactoring instead of replacement
- make later UI work reflect real instructional structure

This order matters because the long-term value of the Thinking Canvas does not come from visualization alone. It comes from making student thinking reusable across the assignment.

In V1, the Canvas Engine should therefore focus on:

- naming the artifacts
- defining how they relate
- identifying which current tables already hold them
- adding only the lightest new storage layer when truly needed
- creating the read model that future UI can display

That is the correct foundation for a later visual canvas.

---

## 3. Canvas Artifact Model

The Canvas Engine needs a shared artifact vocabulary. Each artifact type below represents a durable unit of student thinking or writing development.

### Artifact Table

| Artifact Type | What It Represents | Which Module/Stage Creates It | Which Later Modules Use It | Already Exists or Needs New Storage Later |
|---|---|---|---|---|
| `assignment_understanding` | The student's understanding of the task, essential question, or writing goal | Module 1 / assignment understanding stage | Modules 2-9, especially evidence collection and claim formation | Only partially represented today; likely needs lightweight new storage later if made durable |
| `evidence` | A student-selected quote, detail, observation, or source-based note used to support thinking | Module 2 / evidence collection | Modules 3, 4, 5, 6, 7, teacher views | Already exists today primarily in `student_observations`; legacy compatibility in `tchart_entries` |
| `pattern` | A noticed relationship among pieces of evidence: repetition, contrast, tension, development, strategy, significance | Module 3 / pattern discovery | Modules 3, 4, 5, teacher views | Does not exist as a first-class artifact yet; needs new storage later |
| `idea` | A provisional interpretation developed from a pattern | Module 3 / idea exploration | Modules 3, 4, 5, teacher views | Does not exist as a first-class artifact yet; needs new storage later |
| `evidence_map` | A structured connection between selected evidence and a developing idea or claim | Module 3 / evidence-to-idea support work | Modules 3, 4, 5, 6, teacher views | Does not exist as a first-class artifact yet; needs new storage later |
| `claim` | A supported working claim that the student can defend with evidence | Module 3 / claim formation | Modules 4, 5, 6, 7, teacher views | Does not exist as a first-class artifact yet; needs new storage later |
| `thesis` | The assignment-level thesis statement derived from a claim | Module 3 / thesis formation | Modules 4, 5, 6, teacher views | Already exists today in `module3_responses`; future Canvas artifact should coexist with compatibility preserved |
| `proof_plan` | The planned directions of proof that explain how the thesis will be supported | Module 3 end and Module 4 beginning / organization bridge | Modules 4, 5, 6, teacher views | Does not exist cleanly today; likely begins as new storage later or a bridge artifact built from Module 3 and Module 4 outputs |
| `paragraph_plan` | A planned body-paragraph idea with linked evidence and reasoning direction | Module 4 and Module 5 / organization and outline stages | Modules 5, 6, 7, teacher views | Partially exists today in `student_buckets` and `student_outlines`; can be treated as an inferred artifact in V1 |
| `draft_section` | A section of student draft writing developed from plans and evidence | Module 6 / drafting | Modules 7, 8, 9, teacher views | Already exists today in `student_drafts` |
| `revision_note` | A note about how a draft section should be revised, improved, clarified, or strengthened | Module 7 / revision | Modules 8, teacher views | Not yet a durable first-class artifact; likely needs new storage later, though some revision state may live in `student_drafts` during transition |

### Notes on the Artifact Model

1. The artifact model is instructional, not cosmetic. Each artifact type corresponds to a genuine thinking move.
2. Not every artifact requires a brand-new table immediately.
3. V1 should infer and reuse as much as possible from the current working system.
4. New storage should be introduced only where current tables cannot express the needed artifact cleanly.

---

## 4. Relationship Model

The Canvas Engine is not just a list of artifacts. It is a model of how thinking develops.

The first relationship model should define how artifacts connect:

- evidence supports idea
- evidence supports claim
- pattern emerges from evidence
- idea develops from pattern
- claim develops from idea
- thesis develops from claim
- proof_plan supports thesis
- paragraph_plan develops proof_plan
- draft_section develops paragraph_plan
- revision_note comments on draft_section

### Relationship Definitions

#### Evidence supports idea

A student may use one or more evidence artifacts to explore or strengthen a provisional idea. This relationship shows which evidence helped move an observation toward interpretation.

#### Evidence supports claim

Once the student forms a claim, evidence relationships should show which evidence is doing the actual supporting work. This matters for later organization, drafting, and teacher review.

#### Pattern emerges from evidence

Patterns should not appear without evidence underneath them. A pattern should be traceable back to the evidence artifacts from which it emerged.

#### Idea develops from pattern

Ideas are not free-floating. A durable relationship should show which pattern gave rise to the student's idea.

#### Claim develops from idea

The claim should remain connected to the earlier exploratory idea so that the system preserves the student's reasoning path rather than only the finished claim.

#### Thesis develops from claim

The thesis is the assignment-level statement of the claim. Keeping the connection visible matters because a thesis should be understood as a supported expression of earlier reasoning, not as an isolated writing task.

#### Proof plan supports thesis

The thesis points toward what must be proven. The proof plan captures those main lines of support and should remain connected to the thesis it serves.

#### Paragraph plan develops proof plan

A paragraph plan is where abstract proof becomes organized body-paragraph thinking. This relationship lets later modules show how organization grows from argument.

#### Draft section develops paragraph plan

Draft sections should be traceable back to paragraph plans, so teachers and students can see whether writing is actually developing the intended line of support.

#### Revision note comments on draft section

Revision notes should attach to actual sections of writing, not float separately. This relationship preserves the history of refinement and makes later teacher intervention more meaningful.

### V1 Relationship Principle

In V1, relationships do not need to be fully visualized. They only need to be:

- durable
- queryable
- additive
- understandable by later modules and teacher views

This means the first goal is **relationship preservation**, not relationship visualization.

---

## 5. V1 Storage Strategy

V1 should **not** propose or require a destructive migration.

The correct strategy is additive:

- keep current tables
- introduce a lightweight canvas artifact layer only when needed
- treat `student_observations` as evidence artifacts
- treat future Module 3 outputs as pattern/idea/claim/thesis artifacts
- preserve `module3_responses` compatibility for Module 4 and 5 until they are refactored

### V1 Principles

#### Keep current tables

The current application already works. V1 should preserve:

- `student_assignments`
- `student_observations`
- `module3_responses`
- `student_buckets`
- `student_outlines`
- `student_drafts`
- activity logging
- assignment definitions

These remain the working system of record for their current stages.

#### Introduce a lightweight canvas artifact layer only when needed

The first artifact layer should be as small as possible. It should exist only to represent artifacts that current tables do not represent well enough, especially new Module 3 V2 artifacts such as:

- pattern
- idea
- evidence_map
- claim
- proof_plan
- revision_note

The artifact layer should complement the current tables rather than replace them.

#### Treat `student_observations` as evidence artifacts

V1 should treat `student_observations` as the canonical evidence artifact source. This aligns with the current direction of the Writing Learning Engine and avoids inventing a second evidence system.

Legacy evidence representations can continue to exist for compatibility, but the Canvas vocabulary should center evidence on `student_observations`.

#### Treat future Module 3 outputs as pattern/idea/claim/thesis artifacts

The redesigned Module 3 is the first place where the Canvas Engine truly becomes necessary. Module 3 V2 introduces durable thinking objects that should not be flattened into one thesis record.

Those outputs should therefore be stored as Canvas-aware artifacts, even if some summary data continues to be mirrored into `module3_responses`.

#### Preserve `module3_responses` compatibility for Module 4 and 5 until they are refactored

Module 4 and Module 5 currently rely on `module3_responses`. V1 should preserve that compatibility rather than forcing downstream modules to change all at once.

This means:

- Canvas artifacts can be introduced for Module 3 V2
- `module3_responses` can continue to be written in compatibility mode
- Module 4 and Module 5 can consume current data first
- later phases can refactor them to consume Canvas artifacts directly

### Recommended V1 Storage Posture

The Canvas Engine should begin as a **thin additive artifact and relationship layer**, not a replacement storage model.

That layer should:

- reuse existing module tables wherever possible
- store only what existing tables cannot cleanly express
- preserve old read paths until later modules are ready
- support a read-only UI before any advanced editing UI exists

---

## 6. Module-by-Module Role

Each existing module contributes differently to the Canvas.

### Module 1: assignment understanding

Module 1 establishes assignment understanding.

Canvas contribution:

- creates or confirms the student's understanding of the task
- introduces the assignment frame that later evidence and claims belong to

Canvas role:

- source of `assignment_understanding` artifacts, initially lightweight or partially inferred

### Module 2: evidence artifacts

Module 2 is the main source of evidence collection.

Canvas contribution:

- creates evidence artifacts from source-based observations
- anchors evidence in the assignment and source set
- gives later modules reusable support

Canvas role:

- primary source of `evidence` artifacts, especially through `student_observations`

### Module 3: pattern, idea, claim, thesis

Module 3 is the central transition into argument.

Canvas contribution:

- turns evidence into patterns
- turns patterns into ideas
- tests support
- develops claim
- turns claim into thesis

Canvas role:

- primary source of `pattern`, `idea`, `evidence_map`, `claim`, `thesis`, and early `proof_plan` artifacts

### Module 4: proof plan / organization

Module 4 moves from claim-level thinking into proof and organization.

Canvas contribution:

- develops the proof plan
- begins turning lines of proof into paragraph-level planning

Canvas role:

- extends `proof_plan`
- begins `paragraph_plan` development

### Module 5: paragraph plans / outline

Module 5 formalizes organization into an outline.

Canvas contribution:

- refines paragraph planning
- orders argument structure
- converts proof directions into structured outline thinking

Canvas role:

- deepens `paragraph_plan`
- preserves outline-level organization as reusable argument structure

### Module 6: draft sections

Module 6 turns plans into writing.

Canvas contribution:

- creates draft writing sections from paragraph plans and outline structure

Canvas role:

- primary source of `draft_section` artifacts

### Module 7: revision notes

Module 7 introduces reflective refinement.

Canvas contribution:

- captures what needs to change in the draft
- documents how the student responds to weaknesses in support, clarity, or organization

Canvas role:

- source of `revision_note` artifacts
- provides teacher visibility into revision reasoning

### Module 8: final polish

Module 8 strengthens and finalizes the draft.

Canvas contribution:

- applies revision work to improve final clarity, readiness, and coherence

Canvas role:

- refines `draft_section` artifacts toward final form

### Module 9: publication/export

Module 9 prepares final delivery.

Canvas contribution:

- closes the writing process
- links published output back to the thinking path that produced it

Canvas role:

- final publication stage; not a major new artifact creator in V1, but an endpoint for Canvas-supported work

### Module 10: teacher visibility

Module 10 is the teacher access point to the Canvas.

Canvas contribution:

- surfaces the student's artifact history
- shows development over time
- makes thinking paths inspectable

Canvas role:

- read and review layer for teachers

---

## 7. V1 UI Strategy

The first UI version of the Thinking Canvas should be modest and read-only.

### V1 UI shape

The first interface should be a:

- read-only collapsible sidebar or panel

It should:

- show artifact counts
- show simple previews
- avoid drag and drop
- avoid complex visualization
- be available from student module pages
- grow as students progress

### What the V1 UI should show

The sidebar or panel can show:

- assignment understanding summary
- evidence count
- recent evidence previews
- number of pattern artifacts
- current working claim or thesis preview
- proof-plan preview when available
- outline presence
- draft presence
- revision-note presence

### Why this is the right first UI

This first UI is useful because it:

- proves the artifact model has real value
- shows continuity across modules
- supports student memory without overcomplicating the interface
- gives teachers a future model for visibility
- can be added without redesigning the entire application

The V1 UI should feel like a persistent **thinking summary panel**, not yet like a full visual workspace.

---

## 8. What Not To Build Yet

The first version should explicitly exclude the following:

- full visual graph
- drag-and-drop canvas
- AI coaching
- database rewrite
- replacing existing modules all at once
- replacing all current tables

### Why these are excluded

#### Full visual graph

A graph is only useful once the artifacts and relationships are durable and reliable.

#### Drag-and-drop canvas

This adds product complexity before the engine itself is proven.

#### AI coaching

AI should not be layered on top of an unstable artifact model. Deterministic scaffolding and reusable artifact flow must work first.

#### Database rewrite

The current system must remain operational while the Canvas Engine is added incrementally.

#### Replacing existing modules all at once

The module workflow is already working and should evolve in phases.

#### Replacing all current tables

The current tables contain valid student work and already support major stages of the product. V1 should build on them.

---

## 9. Implementation Phases

### Phase 1: documentation and artifact vocabulary

Define the Thinking Canvas concept, artifact model, relationship model, and module roles.

Deliverables:

- architecture documents
- shared vocabulary
- explicit phase plan

### Phase 2: minimal canvas artifact helpers

Introduce the smallest helper layer needed to read and write Canvas-aware artifacts and relationships where the current tables do not already provide them.

Deliverables:

- minimal artifact helper interfaces
- minimal relationship helper interfaces
- compatibility with current module tables

### Phase 3: Module 3 V2 stores pattern/idea/claim artifacts

Make Module 3 V2 the first true Canvas-aware module.

Deliverables:

- Module 3 creates durable pattern, idea, claim, thesis-related artifacts
- compatibility writes preserve existing downstream reads where necessary

### Phase 4: read-only Canvas sidebar

Expose the first student-facing Canvas surface.

Deliverables:

- collapsible read-only sidebar or panel
- simple artifact counts and previews
- visible growth across modules

### Phase 5: Module 4 consumes Canvas artifacts

Refactor organization work to use Canvas outputs from Module 3 more directly.

Deliverables:

- Module 4 reads claim, thesis, proof-plan direction, and linked evidence artifacts
- reduced dependence on legacy intermediate structures where safe

### Phase 6: visual Thinking Canvas

Add a richer, more visual workspace once artifacts and relationships are proven.

Deliverables:

- visual canvas or graph-like UI
- richer navigation among connected artifacts

### Phase 7: AI coach layer

Only after the deterministic Canvas Engine works should coaching be added.

Deliverables:

- AI reads durable artifacts
- AI comments on real support structures
- AI coaching remains additive and non-destructive

---

## 10. Risks and Guardrails

### Do not let the Canvas become busywork

Every new artifact should exist because it improves thinking, continuity, or teacher visibility. Students should never create artifacts just to satisfy the system.

### Every artifact must either deepen thinking or be reused later

If an artifact is not instructional now and is not useful later, it should not exist.

### Preserve working systems

The current module system, progress semantics, and major storage model are working and should remain stable while the Canvas Engine is added.

### Test after each phase

Each phase should be validated before the next begins. The Canvas Engine should grow in small, testable steps rather than through a large rewrite.

### Do not introduce AI before deterministic scaffolding works

The system must first prove that it can preserve artifacts, reuse them across modules, and surface them clearly. AI should come only after those deterministic foundations are trustworthy.

---

## First Code Phase After This Document

The first code phase should implement the **minimum Canvas artifact vocabulary and helper boundary**, with special attention to Module 3 V2 compatibility and reuse of existing evidence artifacts.

The goal of that phase should be:

- define the first artifact and relationship helper shapes
- map existing structures to Canvas vocabulary
- preserve all current module behavior
- prepare Module 3 V2 to store pattern, idea, claim, and thesis-related artifacts without breaking Module 4 and Module 5

### Files that should likely be inspected first

- `docs/writing-learning-engine-vision.md`
- `docs/writing-learning-engine-v2.md`
- `docs/module3-v2-design.md`
- `lib/supabase/helpers/studentObservations.ts`
- `lib/supabase/helpers/studentBuckets.ts`
- `lib/supabase/helpers/studentOutlines.ts`
- `lib/supabase/helpers/studentDrafts.ts`
- `components/ModuleThreeForm.js`
- `app/modules/4/page.js`
- `components/ModuleFour.js`
- `components/ModuleFive.js`
- `lib/assignments/index.ts`
- `lib/assignments/mlkRhetoricalAnalysis.ts`

### What should not be touched in the first code phase

- `student_assignments` progress semantics
- module gating behavior
- full Module 4 rewrite
- full Module 5 rewrite
- draft module flow in Modules 6-9
- teacher dashboard redesign
- any attempt to replace all current tables
- any AI coaching layer

---

## Closing Summary

Thinking Canvas V1 should be built as an additive engine layer inside The Writing Processor. Its first job is not to visualize thinking, but to preserve it: define artifacts, preserve relationships, reuse current tables, support Module 3 V2, and prepare the product for a later read-only Canvas view and, eventually, a full visual canvas.
