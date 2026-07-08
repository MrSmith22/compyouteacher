# Artifact Engine V1

## Purpose

This document defines the **Artifact Engine** as an educational and architectural system inside **The Writing Processor**.

It is intentionally **philosophical and architectural**.
It does not prescribe implementation, storage, tooling, UI frameworks, or module rewrites.

The Artifact Engine exists to protect and carry forward student thinking across time—so the Writing Processor behaves like a learning environment, not a sequence of disposable screens.

This document is grounded in the project’s core reference documents:

- `docs/writing-learning-process-v1.md`
- `docs/thinking-canvas-v1.md`
- `docs/working-set-v1.md`
- `docs/design-system-v1.md`
- `docs/module3-v2-design.md`

And it incorporates the Module 3 V2 reference artifact families:

- Evidence Cluster
- Pattern
- Idea (including Evidence Map)
- Claim
- Thesis (including Proof Plan)

---

## 1. What is an Artifact?

An **Artifact** is an **educational thinking product**.

It is something meaningful a student has *built* during the writing process—something that can be revisited, reflected on, extended, and used to produce later work. Artifacts are not “answers to prompts.” They are **units of cognition made durable**.

Artifacts are **not**:

- **temporary UI state** (what is highlighted, what is open, what is currently selected)
- **navigation state** (what step the student is on, what is “visited”)
- **validation state** (what is “complete enough” to proceed)
- **interface controls** (filters, sort settings, toggles)
- **implementation details** (how anything is stored, transported, or rendered)

Artifacts should remain meaningful even if:

- the interface that created them is redesigned
- the learning flow becomes more spiral and less linear
- new teacher views or Canvas presentations appear later

**A storage record can preserve an artifact, but a storage record is not the artifact.**
The artifact is the student’s thinking object; preservation is only the container.

---

## 2. Why does the Artifact Engine exist?

Traditional writing software preserves **documents**.

The Writing Processor preserves **thinking**.

The platform is built around a learning process in which students build understanding through a sequence of cognitive moves: noticing, collecting, grouping, interpreting, testing, claiming, planning, drafting, and revising (`docs/writing-learning-process-v1.md`). Those moves produce real work long before a final essay exists.

The Artifact Engine exists so that this work is not lost or flattened into “final answers.” It ensures that student thinking:

- **remains durable**
- **maintains continuity**
- **can be carried forward into later stages**

This supports:

- **Student reflection**
  - Students can revisit what they built and see how their thinking developed.
- **Teacher understanding**
  - Teachers can see not only the final thesis, but the evidence grouping, pattern recognition, idea testing, and support-mindedness that led there.
- **AI coaching (eventually)**
  - Coaching should respond to real student artifacts—idea, evidence map, claim—not guess from raw inputs.
- **Continuity across modules**
  - Later modules should build on earlier thinking, not ask students to recreate it.
- **Long-term growth**
  - The platform can preserve development across an assignment and across time: the record of a mind learning how argument is made.

---

## 3. Principles

### Artifacts represent thinking, not software
Artifacts are defined by educational meaning. They do not exist “because the UI has a field.”

### Every artifact must have educational meaning
If an artifact does not deepen thinking *or* enable later work, it should not exist.

### Artifacts persist across modules
Artifacts are assignment-level thinking objects. Modules are the current learning sequence; artifacts are the student’s durable work within it.

### Artifacts must be understandable outside their original interface
A teacher, a future module, or a future Canvas surface should be able to interpret an artifact without recreating the original screen.

### Students own artifacts
Artifacts are the student’s intellectual work. The system preserves it; it does not replace it.

### AI and teachers should consume artifacts, not raw forms
The artifact vocabulary is the shared contract for interpretation, support, feedback, and continuity.

### Temporary work should not become artifacts automatically
Not every interaction deserves durability. Artifacts emerge at meaningful boundaries: when the student has made a thinking move worth preserving.

### Artifact identity must be stable
Artifacts can be revised, but they should remain recognizable as “my idea,” “my claim,” “my thesis.”

### One preservation architecture
The system should converge on one conceptual preservation pipeline so durability is consistent and predictable.

### Backward compatibility is a strategy, not a permanent identity
When compatibility is needed, it should be explicit and bounded. The educational meaning stays primary.

---

## 4. Current Artifact Families (Module 3 V2)

This section defines the Module 3 artifact families as educational objects.

### Evidence Cluster

- **Educational purpose**
  - Turns a flat evidence library into *thinkable groups*. Grouping is the first act of synthesis.
- **What it represents**
  - A named set of evidence items the student believes belong together for interpretive work.
- **How it builds on previous artifacts**
  - Builds from evidence the student has already collected.
- **What later modules may use it for**
  - Provides a bounded support pool for pattern discovery, idea testing, and later organization.

### Pattern

- **Educational purpose**
  - Moves the student from “I have quotes” to “I notice a relationship.”
- **What it represents**
  - A student-authored description of what repeats, contrasts, develops, or tensions across a cluster.
- **How it builds on previous artifacts**
  - Emerges from evidence inside a chosen cluster; should remain traceable to evidence.
- **What later modules may use it for**
  - Provides interpretive direction for idea-building and teacher visibility into the student’s reasoning move.

### Idea (including Evidence Map)

- **Educational purpose**
  - Creates a tentative interpretation worth testing, and teaches support-mindedness before claims.
- **What it represents**
  - A provisional meaning statement and why it matters, together with structured evidence connections the student authored.
- **How it builds on previous artifacts**
  - Develops from a selected pattern and its supporting evidence.
- **What later modules may use it for**
  - Carries forward the interpretive core behind the claim and thesis; supports proof planning and revision alignment.

**Evidence Map (inside Idea)**

The evidence map is the student’s explicit work of explaining how evidence supports, complicates, or sharpens the idea. It belongs with the idea because it is **idea-testing work**, not a separate thinking product that needs its own independent identity in V1.

### Claim

- **Educational purpose**
  - Converts supported thinking into a defensible point the student can argue.
- **What it represents**
  - A working claim and a rationale for why current evidence supports it.
- **How it builds on previous artifacts**
  - Develops from an idea that has been tested against evidence.
- **What later modules may use it for**
  - Anchors organization, drafting, revision, and teacher review of argument quality.

### Thesis (including Proof Plan)

- **Educational purpose**
  - Makes the argument portable: one clear sentence that guides the essay, plus a sketch of proof obligations.
- **What it represents**
  - The thesis statement and a proof plan: up to three main directions the essay must prove.
- **How it builds on previous artifacts**
  - Develops from the claim; it is a sharpening, not a restart.
- **What later modules may use it for**
  - Drives organization choices, paragraph planning, outlining, drafting alignment, and revision targets.

**Proof Plan (inside Thesis)**

The proof plan belongs inside the thesis artifact because it is the thesis’s supporting structure: *If this thesis is true, what must the essay establish?* In V1, it is not treated as an independent artifact family.

---

## 5. Artifact Relationships

The Artifact Engine models a cognitive chain, not just a collection of saved objects:

Evidence  
↓  
Evidence Cluster  
↓  
Pattern  
↓  
Idea (with Evidence Map)  
↓  
Claim  
↓  
Thesis (with Proof Plan)

### Why Evidence Map belongs to the Idea

Evidence mapping is the act of testing an idea against evidence. Keeping it inside the idea preserves the meaning: *this idea is supported (or complicated) by these connections in the student’s words*.

### Why Proof Plan belongs to the Thesis

Proof planning is the thesis’s forward-looking structure. Keeping it inside the thesis preserves the meaning: *this plan exists to establish this thesis*.

---

## 6. What should become an Artifact?

Artifacts should be created only when a student has produced a **meaningful thinking product**.

Decision rules:

- **Can it stand on its own?**
  - Would it make sense to a teacher outside the interface that created it?
- **Does it represent meaningful thinking?**
  - Is it a cognitive move (pattern recognition, interpretation, proof planning), not just interaction?
- **Will a teacher want to see it?**
  - Does it reveal reasoning rather than compliance?
- **Will AI benefit from it?**
  - Would coaching become more grounded and more honest because it can reference the artifact?
- **Will later modules build on it?**
  - Does it protect continuity and reduce re-creation of thinking?
- **Is it stable enough to be durable?**
  - Some work is exploratory and fluid; durability should preserve growth without fossilizing noise.

Not every click deserves permanence. Artifacts are the student’s growing body of work—not the record of every interaction.

---

## 7. Lifecycle

Artifacts have a recognizable lifecycle across the platform:

- **Create**
  - The student produces a new thinking object (a cluster, a pattern, an idea).
- **Revise**
  - The artifact evolves as thinking improves. Revision is expected and educational.
- **Preserve**
  - The artifact becomes durable so it cannot be lost to time, navigation, or device.
- **Restore**
  - The system brings artifacts back into the student’s workspace so they continue thinking, not restart.
- **Consume**
  - Later modules and teacher views draw on artifacts as inputs to new work.
- **Extend**
  - Later stages add structure (for example, moving from proof directions into paragraph planning).
- **Archive**
  - Artifacts remain part of the assignment record even when not active.

A key requirement: **artifacts evolve without losing identity**. The student still recognizes “my idea” and “my claim,” even as the wording improves.

---

## 8. Preservation Philosophy

The Artifact Engine relies on a conceptual separation between:

- the **learning surface** where students think
- the **artifact boundary** where meaningful thinking products become durable
- the **restoration** of durable thinking back into new learning moments

This separation matters because educational meaning must outlive any one screen or workflow. The system should be able to:

- protect student thinking from being lost
- carry it forward into later stages
- support teacher views and future coaching without reinterpreting raw UI state
- allow learning surfaces to evolve while preserving the same underlying thinking products

Durability is an educational promise: *your thinking will still be here when you return, and future work will grow from it*.

---

## 9. Future Modules (4–9)

Modules 4–9 should **consume existing artifacts** rather than recreate student thinking.

Guiding expectations:

- Later modules should feel like **building on a foundation**, not opening new worksheets.
- Organization should grow from the thesis and its proof obligations.
- Drafting should grow from plans rather than from memory.
- Revision should reconnect writing back to the thinking chain: thesis → proof plan → paragraph plans → evidence.

The Artifact Engine is the student’s accumulating body of work. Later stages should honor it by reusing it.

---

## 10. Design Principles (for future development)

Future work should preserve these platform-level constraints:

- **Educational clarity over technical convenience**
- **Cognitive continuity across modules**
- **Stable artifact identities**
- **One preservation architecture**
- **Backward compatibility where necessary**
- **No new artifact families without educational justification**
- **Working Set discipline**
  - Editing experiences should keep a bounded desk and a quieter shelf (`docs/working-set-v1.md`), even as artifacts become richer.

---

## 11. Artifact Engine vs. Thinking Canvas

The **Thinking Canvas** and the **Artifact Engine** are complementary layers.
They are related, but they are not the same thing.

### Thinking Canvas

The Thinking Canvas is the **educational workspace students experience**.

It:

- organizes thinking into a coherent learning journey
- presents artifacts in forms students can understand
- supports bounded attention through **Working Sets** and **Reference Sets**
- includes Notebook views, instructional guidance, and other learning surfaces
- may include temporary instructional context that is helpful in the moment but is **not itself an artifact**

In other words: the Canvas is where thinking happens, where attention is managed, and where progress is made visible.

### Artifact Engine

The Artifact Engine is the **durable educational memory**.

It:

- preserves meaningful thinking products so they can be carried forward
- is independent of any particular interface or workflow
- allows teacher views, AI coaching, future modules, and future Canvas designs to reuse the same student thinking
- protects the continuity of student work even if the UI changes completely

In other words: the Artifact Engine is what makes thinking durable and reusable across time.

### Conclusion

The Thinking Canvas is **one way of presenting artifacts**.

The Artifact Engine is the system that **preserves them**.

Either can evolve without changing the other.

---

## 12. Vision

### The Artifact Engine as the Memory of the Writing Processor

The Thinking Canvas is what students may eventually *see* as a unified workspace.

The Artifact Engine is what allows the Writing Processor to **remember**.

It preserves the student’s thinking as durable, connected educational objects—so the platform can:

- carry thinking forward into later modules
- protect the student’s reasoning path from being lost or flattened
- support reflection and teacher visibility
- ground future coaching in authentic student work
- ensure writing remains the product of thinking rather than the replacement for it

In short:

- The **Thinking Canvas** is a student-facing continuity surface.
- The **Artifact Engine** is the underlying continuity system.

The Writing Processor becomes a learning environment when thinking accumulates, remains usable, and stays connected over time. The Artifact Engine is the architecture that makes that possible.
