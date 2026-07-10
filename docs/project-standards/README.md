# Project Standards — Documentation Index

This folder is the **central index** for all project documentation. It governs how documentation is organized, what counts as a long-term standard, and where every existing document currently lives.

**The Writing Processor** documentation should describe durable product intent—educational philosophy, UX standards, architecture, workflows, and development guidance—not transient bugs or one-off implementation notes.

Implementation work (including Cursor-assisted development) should follow specifications listed here rather than redefine them in prompts or ad hoc comments.

---

## Folder Structure (This Area)

| Folder | Purpose |
|--------|---------|
| [`design/`](./design/) | Educational philosophy, UX patterns, instructional contracts, and design-system standards *(empty — reserved for promoted docs)* |
| [`architecture/`](./architecture/) | System architecture, artifact engine, data model, and integration boundaries *(empty — reserved for promoted docs)* |
| [`walkthroughs/`](./walkthroughs/) | End-to-end walkthrough findings, issue logs, and decisions from student/teacher testing |
| [`references/`](./references/) | Stable reference material, repo indexes, and pointers to legacy docs *(empty — reserved)* |

Nothing outside this README has been moved yet. All existing documents remain at their current paths under `docs/`.

---

## Most Important Documents

Start here for Phase II development and Cursor implementation work.

| Priority | Document | Role |
|----------|----------|------|
| **Primary** | [`master-design-specification-phase-ii.md`](./master-design-specification-phase-ii.md) | **Governing specification** for Phase II — executive vision, global design principles, Modules 6–9 review, visual/instructional standards, AI philosophy, implementation roadmap, and issue-log outline. All Cursor prompts should be evaluated against this document first. |
| Supporting | [`../architecture-principles-v1.md`](../architecture-principles-v1.md) | Architectural constitution (non-negotiable principles) |
| Supporting | [`../writing-learning-process-v1.md`](../writing-learning-process-v1.md) | Educational learning process the product exists to support |
| Supporting | [`../design-system-v1.md`](../design-system-v1.md) | Visual design reference for UI work |
| Supporting | [`../architecture-overview.md`](../architecture-overview.md) | Current app architecture (auth, progress, tables) |
| Supporting | [`../data-map.md`](../data-map.md) | Page-by-page read/write map for the live implementation |

Source: [`master-design-specification-phase-ii.rtf`](./master-design-specification-phase-ii.rtf) (original; unchanged).

---

## Recommended Core Documents (Planned)

These are **placeholders** for documents not yet promoted or fully extracted from the master spec.

| Document | Intended scope | Status |
|----------|----------------|--------|
| **Master Design Specification (Phase II)** | Top-level product vision, module progression, and cross-cutting design decisions | **Exists** — see [`master-design-specification-phase-ii.md`](./master-design-specification-phase-ii.md) |
| **Architecture Overview** | App structure, auth, data flow, and major subsystems |
| **Artifact Engine Specification** | Artifact types, lifecycle, read/write contracts, and module integration |
| **Database / Data Model** | Tables, keys, ownership, and persistence invariants |
| **UI Component Standards** | Layout patterns, working set vs reference set, accessibility, and reusable components |
| **Teacher Dashboard Specification** | Teacher-facing views, data needs, and workflow |
| **Walkthrough Issue Log** | Living implementation tracker from live walkthroughs; bugs vs design gaps | **Exists** — see [`walkthroughs/issue-log.md`](./walkthroughs/issue-log.md) |
| **Development Roadmap** | Prioritized milestones, deferred work, and migration notes |

When a document is promoted into `docs/project-standards/`, update this index and note whether it **supersedes** any older doc.

---

## Documentation Principles

1. **Design documents should outlive implementation.**  
   Specs describe intent and invariants. Code may change; the spec should remain valid until the product decision itself changes.

2. **Cursor prompts should implement the specifications rather than redefine them.**  
   Use prompts to build against existing standards. If a prompt reveals a gap, update the spec first (or log the decision), then implement.

3. **Walkthrough discoveries should update the specifications when they represent long-term design decisions.**  
   Example: an instructional contract (“both source texts must be persisted before analysis”) belongs in design/architecture docs. A one-off regression does not.

4. **Temporary bugs should go into an issue log, not the master specification.**  
   Use [`walkthroughs/`](./walkthroughs/) (or your issue tracker) for defects, repro steps, and fixes. Reserve master specs for durable rules and structure.

---

## Walkthroughs

| Document | Role |
|----------|------|
| [`walkthroughs/issue-log.md`](./walkthroughs/issue-log.md) | **Living implementation tracker** — concrete bugs, instructional gaps, and recommended fixes discovered during the end-to-end student walkthrough (WP-001, WP-002, …). Update status, resolution notes, and commit references as work is completed. The [Master Design Specification](./master-design-specification-phase-ii.md) remains the governing design document; this log tracks specific implementation work. |

---

## Current Documentation Inventory

All paths are relative to the repository root. **Category** indicates document type, not file location.

### Governing standards (philosophy, principles, durable product rules)

| File | Purpose | Category |
|------|---------|----------|
| [`docs/project-standards/master-design-specification-phase-ii.md`](./master-design-specification-phase-ii.md) | Phase II master design specification from the alpha walkthrough: instructional philosophy, UX principles, Modules 6–9 specs, visual language, AI philosophy, and implementation roadmap. | Governing Standard |
| [`docs/architecture-principles-v1.md`](../architecture-principles-v1.md) | States the non-negotiable architectural constitution that must govern all future implementation regardless of module or technology. | Governing Standard |
| [`docs/writing-learning-process-v1.md`](../writing-learning-process-v1.md) | Defines the educational learning process the product exists to support—how students build understanding before writing essays. | Governing Standard |
| [`docs/writing-learning-engine-v2.md`](../writing-learning-engine-v2.md) | Describes the V2 philosophy: thinking coach, evidence-before-claims, and the ideal learning progression across the assignment. | Governing Standard |
| [`docs/design-system-v1.md`](../design-system-v1.md) | Authoritative visual design reference: product naming, color system, typography, and UI rules future work should follow. | Governing Standard |
| [`docs/working-set-v1.md`](../working-set-v1.md) | Defines the Working Set vs Reference Set cognitive model for how students focus attention during writing tasks. | Governing Standard |
| [`docs/writing-learning-engine-vision.md`](../writing-learning-engine-vision.md) | Authoritative product vision for evolving the live app into a configurable Writing Learning Engine without a rewrite. | Governing Standard |

### Architecture (system layers, engines, synthesis)

| File | Purpose | Category |
|------|---------|----------|
| [`docs/writing-processor-architecture-v1.md`](../writing-processor-architecture-v1.md) | Master architecture blueprint synthesizing assignment definition, artifacts, canvas, and Module 3 V2 into one pre-implementation synthesis. | Architecture |
| [`docs/artifact-engine-v1.md`](../artifact-engine-v1.md) | Defines what an artifact is, artifact families, lifecycle, and how durable student thinking carries forward across modules. | Architecture |
| [`docs/thinking-canvas-v1.md`](../thinking-canvas-v1.md) | Defines the Thinking Canvas as the assignment-level workspace where artifacts accumulate and connect across modules. | Architecture |
| [`docs/assignment-definition-v2.md`](../assignment-definition-v2.md) | Specifies the future assignment definition model as the instructional blueprint for sources, evidence, artifacts, and coaching language. | Architecture |
| [`docs/assignment-definition-engine.md`](../assignment-definition-engine.md) | Inventories hardcoded MLK content in the codebase and maps each location into the assignment definition engine boundaries. | Architecture |
| [`docs/architecture-overview.md`](../architecture-overview.md) | Practical overview of the **current** Next.js app: auth, Supabase tables, progress model, activity logging, and module artifact storage. | Architecture |

### Module design (instructional flow and module-specific specs)

| File | Purpose | Category |
|------|---------|----------|
| [`docs/module3-v2-design.md`](../module3-v2-design.md) | Target design for Module 3 V2: evidence library → patterns → ideas → claims → thesis with coaching scaffolds. | Module Design |
| [`docs/module2-architecture-analysis.md`](../module2-architecture-analysis.md) | Evaluates whether Module 2’s current routes and screens fit the architectural direction established by Module 3 V2. | Module Design |
| [`docs/pedagogical-flow.md`](../pedagogical-flow.md) | Step-by-step student journey for the MLK assignment: what each module does, what gets saved, and how progress advances. | Module Design |
| [`docs/module3-current-design.md`](../module3-current-design.md) | Exhaustive description of Module 3 **as implemented today**: wizard steps, prompts, API routes, and downstream dependencies. | Module Design |

### Data model (persistence, tables, read/write maps)

| File | Purpose | Category |
|------|---------|----------|
| [`docs/data-map.md`](../data-map.md) | Page-by-page inventory of which Supabase tables and localStorage keys each route reads and writes. | Data Model |
| [`docs/module-data-notes.md`](../module-data-notes.md) | Per-module instructional intent, tables used, activity logged, and what teachers need to see in the dashboard. | Data Model |
| [`docs/data-plan-draft.md`](../data-plan-draft.md) | Draft principles for core student artifacts, progress semantics, and future AI usage of stored work. | Data Model |

### Implementation notes (current code behavior, helpers, repo indexes)

| File | Purpose | Category |
|------|---------|----------|
| [`docs/supabase-helpers-spec.md`](../supabase-helpers-spec.md) | Specifies the helper layer pattern: which helpers to implement, progress rules, and target file locations under `lib/supabase/`. | Implementation Notes |
| [`docs/project-map.md`](../project-map.md) | Single developer reference for repo structure, auth flow, Supabase usage, helper layer state, and common dev tasks. | Implementation Notes |
| [`docs/project-tree.txt`](../project-tree.txt) | Machine-generated-style directory tree snapshot of the repository layout. | Implementation Notes |
| [`docs/project-files.txt`](../project-files.txt) | Flat list of project file paths; useful for quick lookup but may drift from the live tree. | Implementation Notes |

### Category legend

| Category | When to use |
|----------|-------------|
| **Governing Standard** | Durable principles and philosophy; should outlive specific implementations |
| **Architecture** | System structure, engines, layers, and target-state design |
| **Module Design** | Instructional flow and module-specific behavior or analysis |
| **Data Model** | Tables, persistence invariants, and read/write semantics |
| **Implementation Notes** | What the code does today, helper specs, and repo indexes |
| **Historical** | Superseded drafts kept for reference *(none formally marked yet)* |
| **Candidate for Consolidation** | Overlaps substantially with another doc; merge when promoted |

Documents marked **Candidate for Consolidation** in the inventory below are still active references until merged.

---

## Overlap and Consolidation Candidates

These pairs or groups cover similar ground. None should be deleted yet; note them when promoting docs into `docs/project-standards/`.

| Group | Relationship |
|-------|--------------|
| `writing-learning-engine-vision.md`, `writing-processor-architecture-v1.md`, `writing-learning-engine-v2.md` | Vision + synthesis + philosophy—strong candidates for one **Master Design Specification** |
| `architecture-overview.md`, `writing-processor-architecture-v1.md` | Current-state overview vs target-state blueprint—keep both until a single doc has “today” and “target” sections |
| `assignment-definition-v2.md`, `assignment-definition-engine.md` | Conceptual model vs codebase inventory—merge into one **Assignment Definition** spec with model + migration map |
| `data-map.md`, `module-data-notes.md`, `pedagogical-flow.md` | Module journey, instructional intent, and read/write maps—merge into **Database / Data Model** + **Pedagogical Flow** appendices |
| `data-plan-draft.md`, `data-map.md` | Draft principles vs live page map—consolidate when AI-ready data plan is finalized |
| `module3-current-design.md`, `module3-v2-design.md` | Current implementation vs target design—`module3-current-design` becomes historical when V2 ships |
| `project-map.md`, `project-tree.txt`, `project-files.txt` | Overlapping repo indexes—consolidate under `references/` with one maintained index |

---

## Recommended Future Structure

When documents are **promoted** (not moved prematurely), target layout:

```
docs/project-standards/
├── README.md                          ← this index (always current)
├── design/
│   ├── master-design-spec-phase-ii.md ← merge: vision + WLE v2 + pedagogical principles
│   ├── writing-learning-process.md    ← from writing-learning-process-v1.md
│   ├── design-system.md               ← from design-system-v1.md
│   ├── working-set.md                 ← from working-set-v1.md
│   └── ui-component-standards.md      ← extract from design-system-v1.md if needed
├── architecture/
│   ├── architecture-principles.md     ← from architecture-principles-v1.md
│   ├── architecture-overview.md       ← merge: current overview + processor-architecture-v1
│   ├── artifact-engine.md             ← from artifact-engine-v1.md
│   ├── thinking-canvas.md             ← from thinking-canvas-v1.md
│   ├── assignment-definition.md       ← merge: assignment-definition-v2 + engine inventory
│   └── data-model.md                  ← merge: data-map + module-data-notes + data-plan-draft
├── walkthroughs/
│   └── issue-log.md                   ← new: dated walkthrough findings
├── references/
│   ├── project-map.md                 ← from project-map.md
│   └── module-design/                 ← module2-architecture-analysis, module3-v2-design, etc.
└── implementation/                    ← optional: living notes that stay outside “standards”
    ├── supabase-helpers-spec.md
    ├── module3-current-design.md      ← archive when V2 replaces current UI
    └── pedagogical-flow-mlk.md        ← assignment-specific journey snapshot
```

**Promotion rules**

1. Leave a stub at the old path linking to the new canonical location until all internal links are updated.
2. Mark superseded files with a header: `Status: Superseded by docs/project-standards/...`
3. Do not move `project-tree.txt` / `project-files.txt` until replaced by a maintained generator or dropped.
4. Walkthrough bugs and regressions go in `walkthroughs/issue-log.md`, not in governing specs.

---

## Quick Start for Developers

| If you need… | Start here |
|--------------|------------|
| **Phase II governing spec (what to build next)** | [`master-design-specification-phase-ii.md`](./master-design-specification-phase-ii.md) |
| **Walkthrough implementation tracker (what to fix next)** | [`walkthroughs/issue-log.md`](./walkthroughs/issue-log.md) |
| Why the product exists and how students learn | `writing-learning-process-v1.md`, `writing-learning-engine-v2.md` |
| Non-negotiable rules for all future work | `architecture-principles-v1.md` |
| What the app does **today** (auth, progress, tables) | `architecture-overview.md`, `data-map.md` |
| Where MLK content is hardcoded | `assignment-definition-engine.md` |
| Module 3 target vs current | `module3-v2-design.md` vs `module3-current-design.md` |
| UI and visual language | `design-system-v1.md`, `working-set-v1.md` |
| Repo layout and dev tasks | `project-map.md` |
| Helper layer conventions | `supabase-helpers-spec.md` |

---

## How to Contribute

- Propose new standards via pull request with a clear **supersedes** or **extends** note.
- Date significant spec changes and record **why** the decision was made.
- Update **this README** whenever a document is added, renamed, or promoted.
- Prefer one authoritative document per topic over many overlapping drafts.
