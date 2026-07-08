# Module 2 Architecture Analysis

## Purpose

This document evaluates whether **Module 2** can naturally fit the architectural direction now established for The Writing Processor, using **Module 3 V2** as the reference model for where the product is headed.

This is an **architectural and instructional analysis only**. It does not propose implementation, redesign, database changes, or new features.

The analysis is organized through:

- Assignment Definition
- Artifact Engine
- Thinking Canvas
- Working Set
- Design System
- Question-centered learning
- Teacher conversation
- Student cognitive load

---

## 1. What Module 2 Is For

In the Writing Learning Engine progression, Module 2 occupies **Source Understanding** and **Evidence Collection**:

- students obtain trustworthy copies of assignment sources
- students read closely and save **evidence** (quotes plus observations)
- that evidence becomes raw material for Module 3 pattern discovery, idea exploration, and claim formation

Module 2’s purpose is therefore **foundational**, not argumentative. Students are not yet grouping quotes into interpretive clusters, testing ideas, or writing claims. They are building the **evidence library** and learning how to notice rhetorical choices in context.

That purpose is **compatible** with the new architecture. The open question is whether Module 2’s **current surfaces** express that purpose as clearly as Module 3 now does.

---

## 2. Module 2 Route Landscape (Context)

Module 2 is not a single linear UI. Several routes coexist:

| Route | Role today |
|-------|------------|
| `/modules/2` | Primary **source-gathering wizard** (7 stages) → analysis bridge |
| `/modules/2/analysis` | Analysis orientation → t-charts |
| `/modules/2/tcharts` | **Appeal-based evidence collection** (ethos / pathos / logos × speech + letter) |
| `/modules/2/observations/guided` | **Assignment-defined guided observations** (6 passages from `observationSchema.guidedPassages`) |
| `/modules/2/source`, `/modules/2/letter` | Legacy **APA source-building** flow → t-charts |
| `/modules/2/form` | Legacy **ModuleTwoForm** (older t-chart-style UI) |
| `/modules/2/success` | Completion → Module 3 |

Module 3 V2 loads evidence from **guided observations** (`student_observations`) and **t-chart entries** (`tchart_entries`), plus source context from **module2 sources**. Pedagogically, Module 2’s job is to populate those stores. Architecturally, **multiple parallel paths** to the same outcome create fragmentation that Module 3’s unified model does not yet mirror.

The screen analyses below focus on the **instructionally primary** surfaces: the source wizard, analysis bridge, t-charts, and guided observations.

---

## 3. Screen-by-Screen Analysis

Each major screen is analyzed through the architectural lens.

**Legend — UI fit**

- **Strong** — already supports the thinking move; minor framing gaps only
- **Partial** — correct pedagogy, weak expression in new architecture terms
- **Weak** — competes with cognitive model or obscures the thinking move

**Legend — Module 3 transition**

- **Strong** — outputs and mental model hand off cleanly
- **Partial** — data flows, but student experience shifts abruptly
- **Weak** — student must reinterpret what they collected

---

### 3.1 Source Gathering Wizard (`/modules/2`)

Seven in-page stages driven by `ProgressDots` and stage labels (`Welcome`, `Why these sources`, `Get the speech`, etc.).

#### Stage 0 — Welcome

| Dimension | Analysis |
|-----------|----------|
| **Question** | What am I doing in this module, and why does it matter? |
| **Thinking move** | Orient — understand the module’s job before acting |
| **Working set** | The module goal and short task list |
| **Reference set** | None yet |
| **Artifact(s)** | None (activity logging only) |
| **UI fit** | **Partial** — clear prose, but framed as “Module 2” and a numbered checklist, not a question |
| **→ Module 3** | **Partial** — explains source gathering, but does not preview that evidence will later be **grouped by the student’s own logic** |

#### Stage 1 — Why these sources are trustworthy

| Dimension | Analysis |
|-----------|----------|
| **Question** | Why should I trust these archives as sources for serious analysis? |
| **Thinking move** | Source evaluation — credibility and institutional trust |
| **Working set** | Knowledge-check options and institutional facts |
| **Reference set** | Expository text about archives |
| **Artifact(s)** | None persisted (submit is local UI state) |
| **UI fit** | **Partial** — good content; reads like a quiz stage, not a conversation |
| **→ Module 3** | **Strong** — builds source literacy that supports later evidence use |

#### Stage 2 — Get the speech

| Dimension | Analysis |
|-----------|----------|
| **Question** | Do I have a complete, accurate copy of the speech to work from? |
| **Thinking move** | Source acquisition — locate, copy, verify completeness |
| **Working set** | URL field + full-text paste area for the speech |
| **Reference set** | Official source link, copy instructions, formatting notes |
| **Artifact(s)** | **Source context** row in `module2_sources` (speech URL, full text, metadata) |
| **UI fit** | **Partial** — working set is implicit (paste box) but competes with long instructions and external link |
| **→ Module 3** | **Strong** — saved text feeds `/texts/speech` and underpins quote accuracy later |

#### Stage 3 — Get the letter

| Dimension | Analysis |
|-----------|----------|
| **Question** | Do I have a complete, accurate copy of the letter to work from? |
| **Thinking move** | Source acquisition (same as speech) |
| **Working set** | URL + full-text paste for the letter |
| **Reference set** | Official link, instructions |
| **Artifact(s)** | **Source context** in `module2_sources` (letter fields) |
| **UI fit** | **Partial** — same pattern as speech |
| **→ Module 3** | **Strong** |

#### Stage 4 — Check your saved texts

| Dimension | Analysis |
|-----------|----------|
| **Question** | Are my saved copies complete enough to rely on? |
| **Thinking move** | Verification — length and phrase heuristics as proxy for completeness |
| **Working set** | Summary cards for speech and letter with character counts and pass/fail hints |
| **Reference set** | Links back to official sources for re-checking |
| **Artifact(s)** | Confirms persisted **source context** |
| **UI fit** | **Strong** — bounded review of two objects only |
| **→ Module 3** | **Strong** — prevents empty or partial library in Module 3 |

#### Stage 5 — Use your texts while you work

| Dimension | Analysis |
|-----------|----------|
| **Question** | How will I read and quote from these texts during analysis? |
| **Thinking move** | Workflow orientation — establish reading habit |
| **Working set** | Links to saved speech and letter reading views |
| **Reference set** | Brief explanation of two-tab workflow |
| **Artifact(s)** | None new |
| **UI fit** | **Partial** — useful habit formation; still step-labeled |
| **→ Module 3** | **Strong** — same “open text beside workspace” pattern Module 3 expects |

#### Stage 6 — Begin rhetorical analysis (bridge)

| Dimension | Analysis |
|-----------|----------|
| **Question** | Am I ready to start collecting evidence from these texts? |
| **Thinking move** | Transition — from source prep to analysis |
| **Working set** | Short forward-looking explanation |
| **Reference set** | Implicit: completed sources |
| **Artifact(s)** | Resume path update (`/modules/2/analysis`) |
| **UI fit** | **Weak** — duplicate of analysis intro content; feels like software staging |
| **→ Module 3** | **Partial** — rhetorical framing previews analysis, not clustering |

---

### 3.2 Analysis Orientation (`/modules/2/analysis`)

| Dimension | Analysis |
|-----------|----------|
| **Question** | What am I about to do with these texts, and how should I work? |
| **Thinking move** | Orient to evidence collection — read, quote, label appeal type |
| **Working set** | Instructions and “Begin analysis” action |
| **Reference set** | Links to saved speech/letter copies |
| **Artifact(s)** | Resume path (`/modules/2/tcharts`) |
| **UI fit** | **Weak** — largely repeats Stage 6; step-oriented panels, no Working Set / Reference framing |
| **→ Module 3** | **Partial** — explains evidence for later comparison, but frames appeals taxonomy not student-driven grouping |

---

### 3.3 T-Chart Analysis (`/modules/2/tcharts`)

One UI pattern repeated for **Ethos → Pathos → Logos**. Each pass is effectively one major screen.

| Dimension | Analysis |
|-----------|----------|
| **Question (per appeal)** | Where does King use [ethos / pathos / logos] in the speech and in the letter? |
| **Thinking move** | **Close reading + categorization** — find one speech quote and one letter quote per appeal; explain why, audience effect, purpose |
| **Working set** | The **active appeal**: eight fields (speech quote + three reflection fields + letter quote + three reflection fields) |
| **Reference set** | Appeal definition intro; buttons to open saved/original texts; other appeals in tab strip |
| **Artifact(s)** | **`tchart_entries`** rows (quote + overloaded `observation` string per appeal × source type) — future **`evidence`** artifacts in Artifact Engine terms |
| **UI fit** | **Partial** — **one appeal at a time** already matches bounded attention; but speech and letter tasks are **stacked vertically** (16 fields visible if scrolling), and source-access panel competes equally with writing |
| **→ Module 3** | **Partial** — quotes and notes **do** feed Module 3’s library, but M2 organizes by **preset appeal grid** while M3 asks **which quotes belong together by the student’s emerging argument**. Student must mentally re-sort from “ethos/pathos/logos slots” to “my groups” |

**Per-appeal sub-thinking moves**

| Appeal | Sub-question |
|--------|----------------|
| Ethos | What makes King credible or trustworthy here? |
| Pathos | What emotions does King evoke here? |
| Logos | What reasoning or logic does King use here? |

---

### 3.4 Guided Observations (`/modules/2/observations/guided`)

Six passages from Assignment Definition (`observationSchema.guidedPassages`), one active passage at a time, plus a completion review.

| Dimension | Analysis |
|-----------|----------|
| **Question (per passage)** | Passage-specific `observationQuestion` (e.g. “What do you notice about how King builds credibility…?”) |
| **Thinking move** | **Guided close reading** — observe, connect to audience, purpose, essential question |
| **Working set** | Current passage quote + four scaffolded fields (`studentObservation`, `audienceEffect`, `purposeConnection`, `essentialQuestionConnection`) |
| **Reference set** | Essential question panel; strategy reminder; passage navigation strip; **Progress check** list of all six observations |
| **Artifact(s)** | **`student_observations`** rows — closest current store to canonical **`evidence`** artifacts (quote, observation, audience, purpose, EQ link, strategy tag) |
| **UI fit** | **Strong** relative to other M2 screens — **one passage at a time**, assignment-driven questions, review panel; still uses “Guided Observation 3 of 6” step language and competing progress UI (tabs + review panel + essential question card) |
| **→ Module 3** | **Strong** — guided observations are what Module 3 V2 prefers (`normalizeGuidedEvidence`); field structure (observation + connections) **aligns** with later evidence cards. Transition is smoother than t-chart-only paths |

**Completion screen**

| Dimension | Analysis |
|-----------|----------|
| **Question** | Have I finished the observations I need? |
| **Thinking move** | Review and confirm completeness |
| **Working set** | Review list of six saved observations |
| **Reference set** | Essential question |
| **Artifact(s)** | Full set of **evidence** rows |
| **UI fit** | **Partial** — “Guided Observations Complete” is software-success language |
| **→ Module 3** | **Strong** — explicit handoff intent (“help you build your thesis”) though routing goes to `/modules/2/success` not directly to Module 3 |

---

### 3.5 Legacy / Alternate Surfaces (Brief)

| Surface | Role | Architectural note |
|---------|------|-------------------|
| `/modules/2/source` + `/modules/2/letter` | APA citation + transcript capture | Pedagogy leans **bibliographic mechanics**; overlaps wizard stages 2–3. Not Assignment-Definition-rendered in the same way as guided passages |
| `/modules/2/form` | Older multi-category form | Parallel evidence path; increases Artifact Engine normalization burden |
| `/modules/2/success` | Celebration + `advanceCurrentModuleOnSuccess` | **Weak** question-centering (“You’ve Completed Module 2!”); weak teacher conversation |

These routes are evidence that Module 2 grew through **multiple implementations** rather than one module renderer expressing one assignment definition.

---

## 4. Alignment With Core Architecture Layers

### 4.1 Assignment Definition

**Strengths**

- `mlkAssignmentDefinition` already supplies source metadata, trusted archive copy, search queries, transcript placeholders, and **`observationSchema.guidedPassages`** with per-passage questions, field labels, placeholders, and strategy reminders.
- Guided observations are the **clearest example** of assignment-defined instructional content driving UI.
- Source intelligence (audience, purpose hints per source) appears in guided field coaching.

**Mismatches**

- The **7-stage source wizard** hardcodes MLK URLs, phrase checks, and stage copy in the page component rather than reading stage content from the assignment definition.
- **T-chart analysis** uses appeal taxonomy from assignment (`rhetoricalStrategies`) but layout and flow are **page-hardcoded**, not definition-driven stages.
- **Parallel routes** (wizard vs APA source pages vs form) mean the assignment definition does not yet **single-source** the Module 2 experience.
- Module 2 does not surface the assignment **essential question** or **essay prompt** as a persistent orienting frame (guided path does show essential question).

**Opportunity**

Assignment Definition V2’s direction — modules as **renderers** of assignment-defined stages — fits Module 2 well for **guided observations** and **source intelligence** first. Source gathering stages could become definition-driven without changing Module 2’s purpose.

---

### 4.2 Artifact Engine

**Strengths**

- Module 2 already produces durable student work the engine cares about:
  - **Source context** → `module2_sources`
  - **Evidence** → `student_observations` (strong shape) and `tchart_entries` (legacy shape)
- Guided observations align with the engine’s preferred **`evidence`** artifact candidate.
- Module 3 V2 already **reads** both paths — Module 2’s output is **load-bearing**.

**Mismatches**

- **Dual evidence pipelines** (t-chart vs guided) with different field shapes force normalization complexity (`parseModule2Observation`, combined observation strings).
- **Source artifacts** are table-shaped and MLK-specific, not yet first-class Canvas **source context artifacts**.
- **Patterns, ideas, claims** are not created in Module 2 — correctly — but the UI does not tell students these observations are **artifacts that will accumulate**, not disposable form answers.
- No explicit artifact identity in UI (Design System `ArtifactChip` / evidence labeling largely absent on M2 screens).

**Opportunity**

Artifact Engine thinking clarifies a **convergence target**: guided observation rows as canonical evidence, with t-chart as compatibility input. Module 2 could eventually present all collection surfaces as “saving evidence artifacts” without changing what students do.

---

### 4.3 Thinking Canvas

**Strengths**

- Module 2 creates the **earliest durable nodes** in the Canvas story: sources and evidence that later connect to patterns, ideas, claims, and thesis.
- Pedagogically, Module 2 is where the Canvas’s evidence layer **starts**.

**Mismatches**

- **No Canvas visibility** in Module 2 — students cannot see accumulating evidence as a developing library or relationship graph.
- No **notebook-style progress story** (Module 3’s sidebar) during collection.
- Students complete separate routes without a unified “what you’ve built so far” view.
- Teacher-facing continuity across M2 artifacts is not surfaced to students.

**Opportunity**

Thinking Canvas V1 does not require a visual graph in Module 2. A **read-only accumulation narrative** (“You have saved 4 observations from the speech”) would align M2 with M3’s notebook without changing persistence.

---

### 4.4 Working Set

**Strengths**

- **T-charts: one appeal at a time** — already a primitive Working Set (active appeal vs others in tab strip).
- **Guided observations: one passage at a time** — strong match to Working Set V1; quote + fields are desk material; other passages are shelf.
- **Source paste stages: one document at a time** (speech, then letter) — sequential bounding.

**Mismatches**

- Working Set is **implicit**, never named or visually framed (contrast Module 3’s Working set / Reference sections).
- **T-chart screen** stacks speech and letter tasks with **eight fields** — two sub-tasks on the desk simultaneously.
- **Source access panel** on t-charts competes at equal weight with writing fields — full texts are correctly Reference but presented as primary panels.
- **Progress navigation** (7-stage labels, appeal tabs, six passage chips, review panel) creates **multiple competing focal regions**.
- **Entire source texts** are not on the desk during observation (correct) but students lack a clear shelf metaphor — only external tabs.

**Opportunity**

Working Set V1 maps cleanly onto Module 2 with **low conceptual cost**:

| M2 context | Desk | Shelf |
|------------|------|-------|
| Source gather | Current paste buffer | Official source link + instructions |
| T-chart | Active appeal quotes + notes | Other appeals; open text links |
| Guided | Current passage + four fields | Other passages; essential question |

Module 2 already **behaves** like Working Set in places; it does not **teach** Working Set as a habit.

---

### 4.5 Design System

**Strengths**

- Uses shared primitives in places (`Panel`, `ProgressDots`, theme colors).
- Guided observations use restrained panels and readable typography.
- Calm, non-gamified tone in expository copy.

**Mismatches**

- Module 2 is **`Panel`-centric** and **`max-w-3xl` centered**; Module 3 uses **workspace layout** (sidebar notebook, teacher guide, center column, question hierarchy).
- **Stage labels** and **module titles** dominate headers (`Module 2: Gather Your Source Texts`) vs question-first hierarchy.
- Legacy APA flow uses **rainbow step cards** (red/orange/green/blue) — high visual noise relative to Design System V1 “low visual noise” principle.
- **Form-field labels** (`Speech full text`, `Quote from the Speech`) vs teacher-conversation prompts.
- No **teacher panel** or instructional rhythm (Question → Think → Try → Reflect) on M2 surfaces.

**Opportunity**

Design System V1’s “workspace instead of forms” direction applies directly to guided observations and t-charts — the content is already thinking work, not administrative data entry.

---

### 4.6 Question-Centered Learning

**Strengths**

- Guided passages embed real **observation questions** from the assignment definition.
- Strategy reminders include **“Ask yourself: …”** key questions.
- T-chart intros pose understandable tasks (“find one strong example…”).

**Mismatches**

- Most wizard screens are titled by **stage name**, not question (`Get the speech` vs “Do I have a trustworthy copy of the speech?”).
- Progress tracker shows **stage labels**, not questions.
- Knowledge check is **assessment-shaped**, not inquiry-shaped.
- Success screen is **completion-shaped**, not “what question’s next?”

**Opportunity**

Module 2’s **content** often contains implicit questions; the architecture needs **explicit question headers** the way Module 3 now does. Guided observations are the easiest lift because questions already exist in data.

---

### 4.7 Teacher Conversation

**Strengths**

- Expository copy sometimes sounds human (“Before strong analysis can happen, researchers need trustworthy versions…”).
- Strategy reminders read like mini-lessons.
- Field-level coaching text and sentence starters scaffold without grading tone.

**Mismatches**

- No dedicated **teacher voice** panel; coaching is inline or absent.
- **Submit Answer**, **Save Speech**, **Save & Continue**, **You’ve Completed Module 2** — software verbs.
- **Progress check** with Saved/Missing badges feels like LMS status, not a teacher noticing thinking.
- Multiple routes send inconsistent messages about what “finishing Module 2” means.

**Opportunity**

Teacher conversation patterns from Module 3 (calm sidebar reminders, “don’t worry if…”) map well onto observation writing — the pedagogical content is already there, scattered.

---

### 4.8 Student Cognitive Load

**Strengths**

- Sequential source gathering reduces simultaneous decisions.
- One appeal / one passage at a time reduces browse-and-compare overload.
- Guided scaffolding splits observation into four manageable fields.
- External text links respect that **full documents cannot fit on the desk**.

**Mismatches**

- **Route fragmentation** — students may not know which path is “real.”
- **Duplicate screens** (wizard stage 6 vs analysis page) add memory burden without new thinking.
- **Six passage chips + review panel + essential question** on guided screen — three navigation metaphors.
- **T-chart: eight fields** per appeal increases extraneous load vs one quote + one integrated note.
- **Appeal taxonomy** may force categorization before students naturally notice patterns — Module 3 later asks **student-defined** grouping.
- Transition to Module 3 can feel like a **category change** (ethos/pathos/logos → “quotes that belong together”).

---

## 5. Summary Tables

### 5.1 Strengths (Architecture Fit)

1. **Purpose alignment** — Module 2 collects sources and evidence before argumentation; matches Writing Learning Engine progression.
2. **Guided observations** — assignment-defined questions, scaffolded fields, one passage at a time; best structural match to Module 3 and Artifact Engine evidence model.
3. **Bounded tasks** — appeal-by-appeal and passage-by-passage flows anticipate Working Set logic.
4. **Durable artifacts** — outputs already feed Module 3; Module 2 is load-bearing in the real system.
5. **Source verification** — completeness checks protect downstream quote work.
6. **Instructional copy** — strategy reminders and observation questions are strong raw material for question-centered redesign.

### 5.2 Architectural Mismatches

1. **Multiple parallel routes** to similar outcomes (wizard, APA pages, form, guided).
2. **Assignment Definition partially adopted** — guided yes; wizard and t-charts largely hardcoded.
3. **Dual evidence shapes** — normalization burden between `tchart_entries` and `student_observations`.
4. **No Thinking Canvas presence** during collection.
5. **No explicit Working Set / Reference framing** despite implicit behavior.
6. **Design System drift** — Panel-and-step vs workspace-and-question model.
7. **Artifact identity not visible** to students during save.

### 5.3 Instructional Mismatches

1. **Step-first** language vs **question-first** (Module 3 direction).
2. **Software completion** framing vs natural “next question” handoff.
3. **Preset appeal grid** vs later **student-driven clustering** in Module 3.
4. **Duplicate orientation** screens (analysis bridge).
5. **Teacher voice** not consolidated; coaching scattered or quiz-like.
6. **Success celebration** breaks conversational tone before Module 3’s reflective entry.

---

## 6. Opportunities Revealed by Each Model

### Working Set

- Name the desk/shelf on every M2 screen without changing workflow: current passage, current appeal, current paste buffer vs library/navigation/other appeals.
- Move source-open buttons clearly to **Reference** on t-charts and guided screens.
- Treat review panels as **shelf summaries**, not co-equal primary content.

### Question-centered learning

- Promote assignment-defined `observationQuestion` and implicit wizard questions to **primary headings**.
- Replace stage labels in progress UI with **short question summaries** where possible.

### Artifact Engine

- Present saves as **evidence added to your library**, especially for guided observations.
- Orient students toward **one canonical evidence shape** conceptually, even while legacy paths persist.

### Assignment Definitions

- Extend the guided-passage pattern to **source-gathering stages** and **appeal introduction** copy.
- Single renderer expressing M2 stages from definition reduces route fragmentation over time.

### Thinking Canvas

- Lightweight **accumulation narrative** during M2 (“your evidence so far”) prepares students for Module 3 notebook and Canvas relationships.

### Design System + Teacher conversation

- Adopt workspace hierarchy and teacher sidebar patterns from Module 3 for observation-writing surfaces first — highest pedagogical return.

---

## 7. Could Module 2 Evolve Into the Same Writing Learning Engine Model Without Fundamentally Changing Its Purpose?

**Yes.**

Module 2’s **purpose** — obtain trustworthy sources, read closely, save evidence for later argument building — is already correct for the Writing Learning Engine. It does not need to become Module 3. It should not ask students to cluster quotes, form claims, or draft thesis sentences. Evidence collection before pattern discovery is a **pedagogical commitment**, not a legacy quirk.

What Module 2 lacks is **architectural expression**, not a new mission:

- Module 3 shows that the same underlying work (choosing quotes, writing about them, moving forward) can feel like **answering questions** with a **bounded working set** and quiet reference material, supported by a **notebook narrative** and **teacher voice**.
- Module 2 **already produces** the artifacts Module 3 and the Artifact Engine need. The friction is **fragmented routes**, **dual evidence shapes**, **step-oriented UI**, and **implicit rather than explicit** attention management.
- **Guided observations** prove Module 2 can align tightly with Assignment Definitions and evidence artifacts. The t-chart and wizard paths are **compatible predecessors** that need conceptual framing alignment, not replacement of their instructional intent.

Evolution would mean **one coherent student experience** of the same purpose: question-led screens, visible Working Set, shelf for sources and other passages, evidence framed as durable library growth, and a handoff to Module 3 that feels like **the next question** (“Which of these observations belong together?”) rather than a new module with a new ruleset.

That evolution changes **how Module 2 feels and how it presents information**. It does not require changing **what Module 2 is for**. For that reason, Module 2 can grow into the same Writing Learning Engine model Module 3 now represents — as the **evidence-gathering chapter** of one continuous thinking environment, not as a separate form-filling module glued before Module 3.

---

## Document Status

| Item | Value |
|------|-------|
| Version | V1 |
| Scope | Architectural analysis only |
| Code changes | None |
| Superseded by | — |
