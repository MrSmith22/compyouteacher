# Architecture Principles V1

## Purpose

This document is the **architectural constitution** of **The Writing Processor**.

It states the **non-negotiable principles** that must govern future implementation—regardless of module, interface, storage, or technology choices.

Implementation will evolve. These principles should remain stable.

This document sits above (and does not replace) the project’s foundational architecture documents:

- `docs/writing-learning-process-v1.md` — the educational model
- `docs/thinking-canvas-v1.md` — the student thinking model
- `docs/working-set-v1.md` — the cognitive workspace model
- `docs/design-system-v1.md` — the interface model
- `docs/artifact-engine-v1.md` — the durable thinking model

This constitution explains **why** those architectural choices exist. It does not redefine them.

---

## Educational First

The educational model always drives architecture.

- Build for learning outcomes and cognitive clarity first.
- Do not let database convenience, UI convenience, or framework limitations define the learning experience.
- If an implementation choice conflicts with educational intent, the implementation must change—not the intent.

---

## Thinking Before Writing

Writing is the visible expression of thinking.

- The Writing Processor should preserve and carry forward student thinking, not merely collect written answers.
- The platform should treat early thinking as legitimate work—because it is.
- A “final product” is valuable, but the learning path that produced it is the platform’s core educational contribution.

---

## Continuity Over Screens

Students should experience one continuous learning journey.

- Modules are instructional experiences, not isolated applications.
- Every step should feel connected to what the student already built.
- Progress should feel like **building**, not **restarting**.

---

## Stable Educational Objects

Artifacts, Working Sets, Assignment Definitions, and the Thinking Canvas represent **educational ideas**, not implementation details.

- Their educational meaning must remain stable even if the interface or implementation changes.
- The system should protect their integrity as student-facing and teacher-facing concepts.
- Any new work should fit these stable objects rather than inventing parallel substitutes.

---

## Progressive Disclosure

Reduce cognitive load by revealing complexity only when it is needed.

- One important question.
- One primary task.
- One clear next step.

The platform should feel calm, teachable, and finishable at each moment of work.

---

## Preserve Student Thinking

Student work should accumulate.

- Students should never feel like they are starting over when they return.
- Intermediate thinking should remain available and reusable.
- Later work should grow from earlier work, not compete with it or replace it.

This is not a “save feature.” It is an educational promise of continuity.

---

## Human Teacher First

The platform should sound like an experienced English teacher.

- Not an LMS.
- Not a workflow engine.
- Not a productivity tool.

Instructional language should be calm, direct, and student-centered.

When AI is present, it should reinforce teacher thinking, not replace it—by responding to student thinking products and supporting the learning journey rather than manufacturing answers.

---

## Backward Compatibility

Compatibility layers are acceptable while evolving the platform.

They must be:

- **explicit**
- **temporary**
- **removable**

Compatibility must never become permanent architecture. The constitutional expectation is convergence back to the shared architecture, not long-term parallel systems.

---

## Prefer Educational Simplicity

When two implementations are equally correct, prefer the one that is easier for:

- students to understand
- teachers to explain
- future developers to reason about

Complexity is only justified when it produces educational value that cannot be achieved otherwise.

---

## One Platform

The Writing Processor should feel like one coherent learning environment.

- Not a collection of independent modules.
- Not a set of disconnected tools.

Every architectural decision should strengthen platform coherence: shared concepts, stable vocabulary, consistent surfaces, and continuity of student thinking.

---

## A final reminder

This document should be concise and principle-driven. Avoid repeating material that already exists in the other architecture documents. When possible, point back to established concepts rather than restating them in full.

---

## The Test

Before implementing a feature, contributors should be able to answer “yes” to most of the following:

- Does this **reduce** (not increase) cognitive load?
- Does this **preserve student thinking** and make it durable?
- Does this **strengthen continuity** across the learning journey?
- Does this make the **educational model clearer** rather than more technical?
- Would an experienced English teacher recognize this as **good instruction**?
- Would a student understand **why** they are doing this?
- Does this fit the existing architecture instead of creating a parallel one?

If the answer to several of these questions is “no,” the implementation should probably be reconsidered.

