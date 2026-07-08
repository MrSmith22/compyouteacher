# Working Set V1

## Purpose

This document formally defines the **Working Set** as an architectural and instructional concept for The Writing Processor.

The Working Set is not merely a layout pattern or a labeled region on a screen. It is a **cognitive model** for how students think while writing: a way of describing what information deserves active attention right now, and what information should remain available without competing for that attention.

This document is architectural and instructional. It does not prescribe implementation, database design, or new product features.

---

## 1. What Is a Working Set?

A **Working Set** is the small collection of information a student is **actively thinking with** at a given moment in the writing process.

It is the material on the desk: the few quotes, ideas, connections, or sentences the student is currently examining, comparing, naming, testing, or revising. The Working Set is always **bounded**. It is intentionally small enough that a student can hold the relationships among its pieces in mind while doing real intellectual work.

A **Reference Set** is everything else that remains **available** but should not compete for attention. It is the material on the nearby shelf: the full evidence library, earlier thinking, alternative patterns, supporting context, or parts of the essay not under revision. Reference material is not hidden and not discarded. It is **de-emphasized** so the student can return to it when needed without being asked to think with all of it at once.

Information may move back and forth between Working Set and Reference Set throughout the assignment. A quote may begin on the shelf, move to the desk when the student selects it, return to the shelf when the student shifts focus, or reappear on the desk in a later module when it becomes relevant to a claim or paragraph. The boundary is **functional**, not permanent.

The Writing Processor should make this boundary legible. The student should always be able to answer: *What am I thinking with right now?* and *What is here if I need to look back?*

---

## 2. Why Students Cannot Think With an Entire Library at Once

Evidence libraries, source collections, pattern lists, outlines, and full drafts are **necessary** but they are not **workspaces**. They are archives of possibility.

When a student faces an entire library at once, several problems appear:

1. **Comparison without focus.** The student sees many items but lacks a stable unit of comparison. Thinking stalls because everything is equally present.
2. **Premature closure.** The student may grab the first plausible combination rather than test whether a smaller set truly belongs together.
3. **Surface activity.** The student can sort, filter, and click without doing the slower work of interpretation, connection, or proof.
4. **Loss of thread.** Each new piece of visible information pulls attention away from the idea currently under construction.

Writing instruction often assumes that students will naturally narrow their attention. In practice, software that presents all collected material with equal visual weight teaches the opposite: that thinking happens **against** the full collection, not **within** a chosen subset.

The Working Set model states a simpler truth: **argumentative thinking happens in small batches.** Students group a few quotes, name a pattern, test one idea, connect selected evidence, judge whether support is enough, and only then state a claim. At each stage, the intellectually honest unit of work is small.

---

## 3. Why People Naturally Work With Only a Few Pieces at a Time

Cognitive science and classroom experience both support a bounded attention model.

**Working memory** can maintain only a limited number of distinct items and relationships simultaneously. When students try to compare six quotes, two patterns, and a draft claim at once, they do not think more richly—they think more shallowly or they outsource the synthesis to guesswork.

**Attention** is single-threaded in practice. A student may switch between objects quickly, but meaningful writing moves—*What repeats here? What might that mean? Does this quote actually prove that?*—require sustained focus on a small set of referents.

**Expert writers** appear to work with large libraries because they have internalized compression. They can summon prior reading selectively. Novice writers need the system to **externalize** that selectivity: to show the desk and the shelf as different statuses of information.

The Working Set is therefore not a simplification for struggling students only. It is an accurate model of how writing cognition works at every level. The difference is that experts manage the boundary internally; the Writing Processor makes the boundary **visible and teachable**.

---

## 4. How the Working Set Differs From Related Concepts

The Writing Processor already contains several durable ideas. The Working Set complements them; it does not replace them.

### Thinking Canvas

The **Thinking Canvas** is the assignment-level **memory and relationship model** for student thinking across modules. It preserves artifacts and how they connect over time: evidence supports idea, pattern emerges from evidence, thesis develops from claim, and so on.

The Working Set is **not** that memory. It is the **momentary focus** inside a module: which artifacts or raw materials are on the desk **right now**. The Canvas answers *What has the student built across the assignment?* The Working Set answers *What is the student using for this thinking move?*

Over time, what sits in the Working Set often **becomes** or **updates** Canvas artifacts. The Canvas is longitudinal; the Working Set is situational.

### Artifact Engine

The **Artifact Engine** is the **normalization and persistence layer** for durable student work: evidence, thesis, outline, draft, and the relationships among them.

The Working Set is **not** a storage type. It does not introduce a new artifact table or a new persisted object. It describes **which existing or in-progress material** should receive primary attention in the interface at a given step. The Artifact Engine records what the student made; the Working Set frames what the student is **currently making**.

### Assignment Definitions

An **Assignment Definition** is the **instructional blueprint** for an assignment: sources, expectations, coaching language, and the learning path the student should follow.

The Working Set does not define assignments. It defines **how attention should be organized within** an assignment stage that the definition already prescribes. The definition says *students will form a claim from evidence*; the Working Set says *while forming that claim, the desk holds the claim-in-progress and the shelf holds supporting quotes*.

### Notebook

In Module 3, the **Notebook** (sidebar progress story) is a **compressed narrative** of what the student has already figured out: grouped quotes, noticed patterns, connected evidence, and so on.

The Notebook is retrospective and summarizing. It helps the student feel continuity and confidence. The Working Set is **prospective and operational**: it holds the material for the **current** question. The Notebook says *Here is what you have done*; the Working Set says *Here is what you are working with now*.

A student may glance at the Notebook for orientation, but they **think** in the Working Set.

### Reference Material

**Reference material** is the visible form of the Reference Set: context the student may need but should not have to juggle while thinking.

Reference material is not "less important" in absolute terms. A source passage may be essential—but if it is not part of the current thinking move, it belongs on the shelf. Reference material becomes Working Set material when the student pulls it forward for an active purpose: adding a quote to a group, linking evidence to an idea, or checking a prior section while revising.

---

## 5. Two Complementary Concepts

### Working Set

The Working Set is:

- **Small** — typically a few quotes, one pattern, one idea, one connection batch, or one paragraph
- **Active** — the student is expected to read, write, compare, or decide **using** these items now
- **Visually primary** — the interface treats this material as the desk: clear, central, and worthy of writing space
- **Tied to one thinking move** — each module screen should imply a single intellectual operation; the Working Set is the material that operation requires

### Reference Set

The Reference Set is:

- **Broader** — libraries, alternatives, context, prior steps, or parts of the essay not under edit
- **Available** — never removed from reach; searchable, scrollable, or collapsible but not deleted
- **Visually secondary** — the shelf: quieter typography, softer surfaces, less border weight
- **Supportive** — consulted when the student needs more material, a reminder, or a check against prior thinking

### Movement Between Sets

Movement is normal and instructional:

| Direction | Example |
|-----------|---------|
| Reference → Working | Student selects a quote from the library into a group; student chooses a pattern to explore |
| Working → Reference | Student finishes naming a group and returns to browsing; an alternate pattern stays on the shelf while one is explored |
| Working → Canvas artifact | Student saves a group, pattern, claim, or thesis that persists beyond the moment |
| Canvas → Working | Student reopens a cluster's quotes when connecting evidence; student sees their claim while drafting a thesis sentence |

The Writing Processor should teach students that **narrowing attention is a thinking skill**, not a software limitation.

---

## 6. Module 3: Working Set by Screen

Module 3 is the transition from evidence collection to claim and thesis formation. Each screen asks one question. The Working Set holds what the student must think **with** to answer it; the Reference Set holds what they may **need** without juggling it simultaneously.

---

### Screen 1 — Group Related Evidence

**Question being answered:** Which quotes seem to belong together?

**Thinking move:** Select and cluster — the student compares passages and decides which belong in the same interpretive group.

**Working Set:** Selected quotes; the name (and optional note) for the group being formed; saved groups and the choice of which group to explore next.

**Reference set:** The full evidence library (with filters and search); assignment task reminder.

**Artifact being created:** Evidence **cluster** (a named group of evidence ids linked for further work). Not yet a pattern, idea, or claim.

---

### Screen 2 — Notice Patterns

**Question being answered:** What do these quotes seem to have in common?

**Thinking move:** Pattern detection — the student names what repeats, contrasts, builds, or tensions across the active group.

**Working set:** Pattern notices (text the student writes); selection of which pattern to explore; checkboxes linking quotes to each pattern candidate.

**Reference set:** Quotes in the **selected cluster** (visible for glance-back while writing); **other clusters** the student is not currently analyzing.

**Artifact being created:** **Pattern** (provisional descriptions of what the evidence seems to show together). Relationship: pattern emerges from clustered evidence.

---

### Screen 3 — Explore an Idea

**Question being answered:** What might this pattern mean?

**Thinking move:** Interpretation — the student proposes a possible meaning and states why it is worth testing.

**Working set:** Idea statement; explanation of why the idea matters or feels worth exploring.

**Reference set:** The **selected pattern** text; quotes linked to that pattern; **other patterns** not currently chosen.

**Artifact being created:** **Idea** (provisional interpretation). Relationship: idea develops from pattern.

---

### Screen 4 — Connect Evidence to the Idea

**Question being answered:** How does each quote help this idea?

**Thinking move:** Evidence mapping — the student selects quotes and explains how each supports, complicates, or sharpens the idea.

**Working set:** Per-quote connection decisions and connection notes (the student's explanations).

**Reference set:** The **idea** under test; quote cards for the cluster (as context for each connection).

**Artifact being created:** **Evidence map** / connection records (structured links between evidence and idea with student-authored rationale).

---

### Screen 5 — Evaluate Support Strength

**Question being answered:** Is my support strong enough yet?

**Thinking move:** Epistemic judgment — the student assesses whether the current support warrants moving forward or returning to evidence.

**Working set:** Strength rating (weak / developing / strong); description of what feels weakest; decision whether to gather more evidence or move on.

**Reference set:** Summary of **connections already made**; the **idea** being evaluated.

**Artifact being created:** No new durable artifact type; this step produces **metacognitive record** (strength assessment and gap note) that informs the next path. It may later inform teacher view and coaching.

---

### Screen 6 — Gather More Evidence (Optional)

**Question being answered:** What kind of quote is still missing?

**Thinking move:** Targeted evidence expansion — the student seeks quotes that fill a specific weakness rather than browsing randomly.

**Working set:** Quotes currently selected for strengthening; notes explaining how each fills the gap.

**Reference set:** The **idea** and the **gap note** from evaluation; the **full quote library** (unselected quotes remain on the shelf until pulled to the desk).

**Artifact being created:** Enriched **evidence cluster** and/or additional **evidence map** entries (strengthening notes tied to evidence). Existing cluster membership may grow.

---

### Screen 7 — Develop a Claim

**Question being answered:** What point do these quotes help you prove?

**Thinking move:** Claim formation — the student states a defensible point and explains why the evidence backs it.

**Working set:** Working claim; rationale for why quotes support the claim.

**Reference set:** **Supporting quotes** (connected and strengthened evidence summaries); the **idea** that preceded the claim.

**Artifact being created:** **Claim** (a supported point the student believes they can argue). Relationship: claim develops from idea and evidence map.

---

### Screen 8 — Turn Claim Into Thesis

**Question being answered:** How would you explain your main point in one clear sentence?

**Thinking move:** Thesis sharpening — the student compresses the claim into one essay-guiding sentence and sketches directions of proof.

**Working set:** Thesis sentence; proof plan (up to three directions the essay will need to establish).

**Reference set:** The **claim** the thesis refines.

**Artifact being created:** **Thesis** and **proof plan** (assignment-level argument sentence and planned lines of proof). These bridge to Module 4 organization.

---

## 7. Extension Beyond Module 3

The Working Set is a cross-module interaction principle. Each module has a natural desk and shelf if the product asks, at every screen, *What belongs on the desk?*

### Module 2 — Evidence Collection

**Working set:** The few sources or passages the student is **currently observing** — one passage open for note-taking, one comparison pair, one guided observation in progress.

**Reference set:** The broader source list, search results, T-chart history, and passages not yet examined.

**Thinking move:** Close reading and observation, not final argument.

---

### Module 4 — Organization

**Working set:** **One proof direction** or **one paragraph bucket** being planned — the student arranges evidence and reasoning for a single part of the argument.

**Reference set:** Thesis, proof plan, full evidence library, and **other paragraph plans** not yet being shaped.

**Thinking move:** Structural planning — how a part of the argument will be built.

---

### Module 5 — Outlining

**Working set:** **One paragraph** or outline section being drafted in detail — topic direction, evidence choices, and reasoning for that section only.

**Reference set:** Full outline skeleton, thesis, organization choice, and **other sections** visible but not primary.

**Thinking move:** Paragraph-level design before full drafting.

---

### Module 6 — Drafting

**Working set:** **One draft section** (introduction, body paragraph, conclusion) actively being written.

**Reference set:** Outline, thesis, proof plan, bucket notes, and **previously drafted sections** accessible for consistency checks.

**Thinking move:** Prose generation from plan — translating structure into sentences.

---

### Module 7 — Revision

**Working set:** **One revision target** — a paragraph, claim, or criterion (clarity, evidence, flow) under active improvement.

**Reference set:** Full draft (stable background); **other sections** not currently being revised; rubric or revision checklist.

**Thinking move:** Diagnose and improve — compare intention (thesis, plan) to execution (draft).

---

### Modules 8–10 — Publication and Reflection

The same pattern applies: **one submission artifact or reflection focus** on the desk; prior modules' outputs on the shelf. The Thinking Canvas carries the longitudinal record; the Working Set governs the **session** of attention.

---

## 8. Why the Working Set Reduces Cognitive Load

### Working Memory

By bounding visible referents, the Working Set aligns the interface with the capacity of working memory. The student juggles fewer objects and can sustain relationships among them long enough to write.

### Attention

Primary and secondary visual tiers direct attention without forbidding exploration. The student does not scan the entire library to find "what matters now"—the desk already shows it.

### Decision Fatigue

When every quote, pattern, and control competes equally, every screen becomes a menu. The Working Set reduces simultaneous decisions: *first* think with this set; *then* pull from the shelf if needed.

### Progressive Disclosure

Reference material is disclosed progressively: available when sought, not loaded into the primary thinking task by default. This is disclosure in service of **cognition**, not hiding content.

### Learning

The Working Set teaches a transferable writing habit: **narrow before you argue.** Students learn to cluster, test one idea, connect selected evidence, and only then claim—mirroring expert practice.

### Student Confidence

A small desk feels finishable. A full library feels endless. When students see a bounded Working Set grow into saved artifacts (groups, patterns, claims), they experience **progress** rather than accumulation without direction. The Notebook narrates that progress; the Working Set makes each step feel possible.

---

## 9. A Fundamental Interaction Pattern for the Writing Processor

The Working Set should become one of the **fundamental interaction patterns** of The Writing Processor, alongside:

- question-centered screens (one intellectual question at a time)
- the Artifact Engine (durable student work)
- the Thinking Canvas (relationships across the assignment)
- Assignment Definitions (instructional blueprint)

### Influence on Future Modules

New and refactored modules should be designed by first identifying the **thinking move**, then assigning material to Working Set and Reference Set—not by presenting all persisted artifacts with equal weight.

### Influence on the Thinking Canvas

The Canvas stores **what** was built and **how** pieces relate. Future Canvas views may show the full graph while any **editing or coaching session** still uses a Working Set lens: *focus on this artifact and its immediate neighbors.*

### Influence on Teacher Views

Teachers benefit from seeing both the **path** (Canvas / Notebook) and the **moment** (what the student was thinking with when they wrote a connection or claim). Teacher interfaces can adopt desk/shelf framing when reviewing a step: *Here is what they had on the desk; here is what they could see on the shelf.*

### Influence on AI Coaching (Eventually)

When AI coaching is introduced, it should coach **within** the Working Set boundary: respond to the idea, claim, or paragraph on the desk; suggest returns to the shelf ("You might compare this quote to one you have not added yet") rather than flooding the student with the entire library. The Working Set gives coaching a **scope** consistent with how humans tutor: one question, a few papers on the desk, the rest within reach.

---

## Closing Principle

Students are not trying to browse information. They are trying to **think**.

The Writing Processor should treat thinking as a sequence of **bounded engagements** with material—each with a clear question, a small Working Set, and a Reference Set that stays available without demanding equal attention.

The Working Set is how the product respects the way writing actually happens: not all at once, but **a few pieces at a time**, until those pieces become something the student can defend in a sentence, a paragraph, and eventually an essay.
