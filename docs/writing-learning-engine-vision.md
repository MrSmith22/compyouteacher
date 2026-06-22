# Writing Learning Engine — Product Vision

**Status:** Authoritative product vision for future development  
**Audience:** Product, engineering, instructional design  
**Supersedes:** Ad hoc feature plans that conflict with this document  
**Related docs:** [architecture-overview.md](./architecture-overview.md), [pedagogical-flow.md](./pedagogical-flow.md), [data-map.md](./data-map.md), [data-plan-draft.md](./data-plan-draft.md), [module-data-notes.md](./module-data-notes.md), [supabase-helpers-spec.md](./supabase-helpers-spec.md), [project-map.md](./project-map.md)

---

## 1. Purpose

The Writing Processor is a working instructional product: a guided, multi-module writing workflow where students produce artifacts at each stage and teachers review progress in Module 10. That product is the starting point.

This document describes how the Writing Processor **evolves** into a **Writing Learning Engine** — the same application, same routes, same data foundations, extended so that assignments, sources, scaffolds, and workflows can be configured without rebuilding the system.

This is not a rewrite. Future work adds configuration layers, completes the helper abstraction, and generalizes assignment-specific content. Existing student data, module tables, and progress semantics remain valid.

---

## 2. What Exists Today

### 2.1 Product shape

The Writing Processor is a Next.js 15 App Router application with NextAuth (Google OAuth) and Supabase as the system of record. Students move through Modules 1–9; Module 10 is the teacher dashboard.

The canonical student journey for the MLK rhetorical analysis assignment is documented in [pedagogical-flow.md](./pedagogical-flow.md) and [module-data-notes.md](./module-data-notes.md). The implementation map is in [data-map.md](./data-map.md).

### 2.2 Architectural commitments already in place

| Layer | Current state |
|-------|---------------|
| **Routing** | `app/modules/1` … `app/modules/10`, success pages, subroutes (e.g. Module 2 source gathering, analysis, observations) |
| **Auth** | NextAuth session; `user_email` as primary student key |
| **Progress** | `student_assignments.current_module` is authoritative; progress only moves forward |
| **Artifacts** | Module-specific Supabase tables (`module2_sources`, `tchart_entries`, `module3_responses`, `bucket_groups`, `student_outlines`, `student_drafts`, etc.) |
| **Audit** | `student_activity_log` via `POST /api/activity/log` (best-effort, non-blocking) |
| **Helpers** | Growing layer under `lib/supabase/helpers/`; direction in [supabase-helpers-spec.md](./supabase-helpers-spec.md) |
| **Gates** | `lib/progression/guards.ts`, `lib/supabase/helpers/moduleGate.ts`, module layouts |
| **Local fallback** | User-scoped `localStorage` via `lib/storage/studentCache.ts` — never system of record |

### 2.3 First steps toward configurability

The codebase already contains early engine primitives:

- **`lib/assignments/mlkRhetoricalAnalysis.ts`** — typed assignment config: `assignmentId`, essential question, source metadata, rhetorical strategies, and `guidedPassages` for teacher-selected quotes.
- **`student_observations`** — normalized observation records keyed by `assignment_id`, with stages (`guided`, and room for `independent`), rhetorical strategy, audience/purpose connections, and downstream flags (`used_in_thesis`, `used_in_paragraph`).
- **`/modules/2/observations/guided`** — guided observation workflow driven by assignment config, not hardcoded page copy alone.

These are the pattern for future configuration: **assignment config in code (later DB) → workflow UI reads config → artifacts persist in Supabase via helpers.**

---

## 3. Vision: The Writing Learning Engine

### 3.1 Definition

The **Writing Learning Engine** is the Writing Processor with a **configuration layer** that defines:

- What texts students analyze and how sources are validated
- What rhetorical or analytical frameworks apply
- Which guided passages, prompts, and scaffolds appear at each step
- How modules connect (observation → thesis → outline → draft) for a given assignment
- What teachers see in the dashboard for that assignment

The **engine** is the reusable machinery: progress, gates, artifact persistence, activity logging, teacher review, and (eventually) AI coaching inputs. The **assignment** is the configurable curriculum instance run on that engine.

Today's MLK essay assignment is **Assignment Instance #1**, not the product itself.

### 3.2 What changes vs. what stays

| Stays the same | Evolves |
|----------------|---------|
| Next.js App Router, page-per-module structure | Assignment-specific strings and passages move into config |
| Supabase as source of truth | New `assignments` / config tables; additive columns where needed |
| `student_assignments` progress model | `assignment_name` / `assignment_id` link to config records |
| Module numbers 1–10 as pedagogical spine | Module *content* and *substeps* driven by assignment config |
| Observation → thesis → outline → drafting sequence | Scaffolds, rubrics, and source sets vary per assignment |
| Helper layer and API route patterns | Helpers accept `assignmentId` consistently |
| Teacher dashboard (Module 10) | Filters and artifact views per assignment |

---

## 4. Non-Negotiables

All future development must preserve these properties.

### 4.1 Next.js architecture

- App Router pages under `app/modules/` remain the student experience shell.
- Client components use `useSession()`; server routes use `getServerSession(authOptions)`.
- API routes (`app/api/`) remain the boundary for privileged writes (admin Supabase client).
- Module layouts and gates (`moduleGate`, `guards`, `useModuleGate`) continue to enforce access from `student_assignments.current_module`.
- UI components call helpers; raw `.from()` queries in components are phased out, not multiplied.

### 4.2 Supabase architecture

- Student work lives in Supabase tables, not localStorage.
- Browser client uses anon key + RLS; server routes use service role where required.
- Module-specific tables remain valid; normalization is **additive** (see §7).
- Dev reset stays scoped to signed-in user in development only.

### 4.3 `student_assignments` progress model

Progress semantics are fixed:

```
user_email + assignment_name → current_module, status, resume_path
```

- `current_module` is the **only** authoritative resume pointer for the dashboard Continue button.
- Progress **only moves forward**, via success pages (`advanceCurrentModuleOnSuccess`) and optionally defensive updates from activity log.
- `resume_path` supports granular resume within a module family (e.g. `/modules/2/analysis`).
- New assignments get new `assignment_name` / `assignment_id` values; the progress machinery does not change.

### 4.4 Core writing workflows

The pedagogical spine is fixed. Configuration changes *what students analyze and what prompts they see*, not *whether these stages exist*:

1. **Observation** — gather evidence from sources; explain rhetorical choices
2. **Thesis** — move from analysis to arguable claim aligned with audience and purpose
3. **Outline** — structure argument from grouped evidence
4. **Drafting** — produce prose from outline; revise; lock final text; submit

Modules 1, 4, 7–9 (quiz, buckets, revision, APA/submission) remain part of the engine; their depth of configurability increases over time, but the workflows are not removed.

---

## 5. Assignment Configuration Model

### 5.1 Near term: typed config modules

Continue the pattern in `lib/assignments/mlkRhetoricalAnalysis.ts`:

```ts
// Conceptual shape — grows from existing types
type WritingAssignmentConfig = {
  assignmentId: string;
  displayName: string;           // maps to student_assignments.assignment_name
  essentialQuestion: string;
  sources: SourceConfig[];       // speech, letter, or N texts
  rhetoricalStrategies: string[]; // ethos | pathos | logos | custom
  guidedPassages: GuidedPassage[];
  thesisScaffold: ThesisScaffoldConfig;
  outlineRules: OutlineConfig;
  draftingConfig: DraftingConfig;
  submissionConfig: SubmissionConfig;
};
```

Pages and API routes import the active assignment config (initially one assignment; later selected by enrollment or teacher assignment).

### 5.2 Medium term: Supabase-backed assignment definitions

Move config to tables so teachers or curriculum authors can author without deploys:

| Table (proposed) | Purpose |
|------------------|---------|
| `assignments` | `id`, `slug`, `title`, `essential_question`, `status`, `created_by` |
| `assignment_sources` | URLs, titles, validation rules, citation templates per source |
| `assignment_passages` | Guided observation passages: quote, strategy, source, instructions |
| `assignment_prompts` | Step-level prompts for thesis, buckets, outline, drafting |
| `assignment_module_settings` | Per-module toggles, min lengths, rubric references |

**Migration rule:** MLK assignment rows are seeded from existing TypeScript config. Runtime reads DB first with TS fallback until migration is complete.

### 5.3 Assignment instance binding

Every student artifact row should eventually include `assignment_id` (alongside existing `user_email`). Until columns exist on all tables, `assignment_name` on `student_assignments` is the binding key. Helpers resolve `assignment_name` → `assignment_id` at the boundary.

---

## 6. Workflow Preservation — How Each Stage Evolves

### 6.1 Observation workflow

**Today:** Module 2 combines source gathering (`module2_sources`), T-chart analysis (`tchart_entries`), and an emerging guided observation path (`student_observations`, `/modules/2/observations/guided`).

**Engine behavior (preserved):**
- Students work from **their saved copies** of configured sources.
- Observations capture: quote, rhetorical strategy, student explanation, audience effect, purpose connection, essential-question connection.
- Guided observations use teacher-selected passages from assignment config.
- Independent observations (student-selected quotes) remain supported via T-chart / future `observation_stage: "independent"`.

**Evolution:**
- Guided passages come from `assignment_passages` (or config file), not scattered constants.
- `student_observations` becomes the **primary** observation store; `tchart_entries` remains for backward compatibility and is populated or migrated from observations for Modules 3–6 consumers.
- Module 4 buckets link to observation IDs (`linked_analysis_ids`, `used_in_paragraph`) rather than opaque legacy keys.
- Scaffolding copy (strategy definitions, sentence starters) lives in config, as in `STRATEGY_SCAFFOLDING` today.

**Success criteria:** A new assignment with different texts and passages runs the same Module 2 routes and observation API shape.

### 6.2 Thesis workflow

**Today:** Module 3 (`ModuleThreeForm`, `module3_responses`) walks students through audience/purpose phrases, appeal-level reasoning, structure choice, and final thesis text.

**Engine behavior (preserved):**
- Multi-step wizard: welcome → guided audience/purpose → per-appeal reasoning → thesis composition.
- Responses stored in `module3_responses` (`responses`, `thesis`, `structure_choice`).
- Thesis step pulls evidence from prior observation work (T-chart / observations).
- Activity events: `thesis_saved`, `module_completed`.

**Evolution:**
- Audience/purpose defaults and appeal labels come from assignment config (`speech.audience`, `letter.purpose`, etc. — already in `mlkRhetoricalAnalysis.ts`).
- Appeal groups and question counts are configurable per assignment (compare/contrast vs. single-text argument).
- `used_in_thesis` flags on `student_observations` connect evidence to thesis reasoning.
- Structure choices (e.g. block vs. point-by-point) are enumerated in config, not hardcoded.

**Success criteria:** Module 3 page layout unchanged; a second assignment swaps prompts, source labels, and appeal framework via config.

### 6.3 Outline workflow

**Today:** Module 5 (`student_outlines`) builds a structured outline from thesis and Module 4 buckets; finalization gates Module 6 via `canEnterModule`.

**Engine behavior (preserved):**
- Read thesis (`module3_responses`) and buckets (`bucket_groups`).
- Ordered paragraphs with topic sentences, supporting points, conclusion fields.
- `finalized` boolean on outline; Module 6 requires finalized Module 5 outline.
- Roman numeral preview and reorder UX remain.

**Evolution:**
- Bucket → paragraph mapping rules in config (min paragraphs, required conclusion elements).
- Outline template type per assignment (rhetorical comparison, argument, literary analysis).
- Helper `getStudentOutline({ userEmail, assignmentId, module })` becomes standard.

**Success criteria:** Gate from Module 5 → 6 unchanged; outline schema stable with optional config-driven validation messages.

### 6.4 Drafting workflow

**Today:** Modules 6–8 (`student_drafts`) — first draft, revision/read-aloud, final polish/lock; Module 9 export and PDF submission.

**Engine behavior (preserved):**
- Module 6: section-based drafting from outline + evidence references.
- Module 7: revision; optional read-aloud (`student_readaloud`).
- Module 8: `final_ready`, `final_text` as export source of truth.
- Module 9: APA quiz, Google Docs export, PDF upload (`student_exports`).
- `locked` on Module 6 draft gates Module 7.

**Evolution:**
- Draft section prompts and checklists from assignment config.
- Citation style (APA, MLA) as `submissionConfig` — [module-data-notes.md](./module-data-notes.md) already notes MLA as future expansion.
- Draft helpers always keyed by `user_email`, `module`, and `assignment_id`.
- AI coaching (future) reads draft + outline + linked observations; never overwrites student text without explicit action.

**Success criteria:** Draft lifecycle Module 6 → 7 → 8 → 9 unchanged; only prompts, checklists, and citation rules vary.

---

## 7. Data Architecture Evolution

Follow principles from [data-plan-draft.md](./data-plan-draft.md).

### 7.1 Additive, not replacement

Existing tables remain. New assignments may add rows to shared tables via `assignment_id`. MLK data needs no migration for the engine to support a second assignment.

### 7.2 Artifact envelope (long term)

Introduce a consistent artifact envelope for AI and teacher tooling:

```
user_email, assignment_id, module, step, artifact_type, content, metadata, timestamps
```

Module-specific tables map to artifact types (`source`, `observation`, `thesis`, `bucket`, `outline`, `draft`, `export`). Helpers write to module tables first; envelope is a read projection or parallel write for analytics — not a big-bang cutover.

### 7.3 Observation and analysis unification

| Store | Role going forward |
|-------|-------------------|
| `student_observations` | Canonical observation artifact; guided + independent |
| `tchart_entries` | Legacy/compatibility; fed from observations for Modules 3–6 until consumers updated |
| `module2_sources` | Per-user saved source text and citation metadata |

### 7.4 AI interaction log (future)

Append-only table for coaching and grading audit (from [data-plan-draft.md](./data-plan-draft.md)):

- Input artifact snapshot
- Prompt template version
- Model response
- Optional rubric scores

AI logs never overwrite student artifacts.

### 7.5 Helper layer completion

All reads/writes go through `lib/supabase/helpers/` per [supabase-helpers-spec.md](./supabase-helpers-spec.md). Every helper that touches student work accepts `assignmentId` or resolves it from `assignmentName`. Errors surface to callers; helpers do not silently swallow failures.

---

## 8. Application Architecture — Engine Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Assignment Config (TS modules → Supabase assignments)        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  App Router UI (app/modules/*, components/*)                  │
│  — renders scaffolds from config                            │
│  — calls helpers; logs activity                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Engine Services                                            │
│  — progression: student_assignments, gates, success pages   │
│  — activity: student_activity_log                           │
│  — artifacts: per-module helpers                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Supabase (RLS + module tables + assignment config tables)   │
└─────────────────────────────────────────────────────────────┘
```

**Config resolution:** At session start or module entry, resolve `activeAssignment` from enrollment, dashboard selection, or default (`mlk-rhetorical-analysis`). Pass `assignmentId` through helpers, not global constants in components.

**Resume:** Dashboard reads `student_assignments.current_module` and `resume_path` — unchanged. Config does not replace progress; it contextualizes content.

---

## 9. Teacher Experience (Module 10)

Module 10 remains the teacher hub. Evolution adds assignment-aware views:

- Filter students by `assignment_name` / `assignment_id`
- Observation review: guided passages vs. student reasoning quality
- Thesis alignment: thesis text vs. linked observations
- Outline structure and draft progression
- Submission status from `student_exports`

Teacher dashboard helpers (`teacherDashboard.ts`) aggregate across artifact tables using the same assignment key students use. No separate teacher data model.

Future: assignment authoring UI (sources, passages, prompts) for curriculum owners — still stored in Supabase, still served through the same Module 1–10 routes for students.

---

## 10. AI and Adaptive Learning (Future-Ready)

The engine is **AI-ready** when:

1. Observations, thesis, outline, and drafts are retrievable by `assignment_id` chronologically.
2. Activity log provides behavioral signals (time on step, resubmissions).
3. Coaching interactions are logged append-only with artifact snapshots.

AI features are **additive services** on top of the engine:

- Observation feedback after save (quote quality, strategy mislabeling)
- Thesis strength check against evidence links
- Outline gap detection before drafting
- Revision suggestions in Module 7 (student accepts or rejects)

AI must not block progression unless a teacher configures mandatory review. Logging remains best-effort for student actions; AI calls may be async.

---

## 11. Phased Roadmap

Phases are sequential priorities, not a rewrite schedule. Each phase ships production value on the existing app.

### Phase 1 — Consolidate the engine (current → near term)

- Complete helper migration per [supabase-helpers-spec.md](./supabase-helpers-spec.md)
- Standardize `assignmentId` in observation, thesis, and activity helpers
- Finish guided observation workflow; wire Module 3–4 to `student_observations` where beneficial
- Extract remaining MLK hardcoded strings into `mlkRhetoricalAnalysis.ts` and `mlkEssayPrompt.js`
- Document active assignment resolution (single assignment default)

### Phase 2 — Configuration in the database

- Seed `assignments` and related tables from MLK config
- Runtime loader: DB config with TS fallback
- Teacher dashboard: filter by assignment
- Add `assignment_id` column to new writes on core artifact tables

### Phase 3 — Second assignment instance

- Prove configurability: new texts, passages, and essential question
- Same module routes and progress model
- Validate gates, resume, and teacher review for two parallel assignments

### Phase 4 — Authoring and AI coaching

- Teacher/admin authoring for sources and guided passages
- Artifact envelope or analytics projections for AI retrieval
- Coaching log table and first targeted feedback surfaces (observation, thesis)

### Phase 5 — Scale and polish

- Enrollment / class assignment binding
- Rubric-aligned scoring in teacher dashboard
- MLA or dual citation templates
- Per-question quiz analytics (Module 1, Module 9)

---

## 12. Explicitly Out of Scope

To avoid drift toward a rewrite, the following are **not** goals:

- Replacing Next.js or migrating to a separate SPA
- Replacing Supabase or moving student artifacts to a document store
- Collapsing Modules 1–10 into a single generic step builder (modules stay numbered pedagogical stages)
- Breaking `student_assignments.current_module` semantics
- Big-bang migration that invalidates existing MLK student data
- Real-time collaborative editing or LMS replacement in the first engine phases

---

## 13. Decision Record — When in Doubt

| Question | Answer |
|----------|--------|
| Where does progress live? | `student_assignments.current_module` |
| Can progress go backward? | No |
| Where does student work live? | Supabase module tables (+ `student_observations` growing) |
| How does a new assignment differ? | Config (sources, passages, prompts), not new progress machinery |
| Component vs. helper vs. API route? | UI in components; DB in helpers; privileged writes in API routes |
| localStorage? | User-scoped fallback only ([studentCache.ts](../lib/storage/studentCache.ts)) |
| Is this a rewrite? | No — extend, configure, and normalize additively |

---

## 14. Glossary

| Term | Meaning |
|------|---------|
| **Writing Processor** | The product as shipped today: MLK assignment on the module spine |
| **Writing Learning Engine** | The configurable platform: same spine, assignment-driven content |
| **Assignment instance** | One configured curriculum (e.g. MLK rhetorical analysis) |
| **Workflow** | Observation, thesis, outline, or drafting — fixed sequence, configurable content |
| **Artifact** | Durable student work product stored in Supabase |
| **Scaffold** | Instructions, prompts, and sentence starters shown during a step |
| **Gate** | Rule preventing module entry until prerequisites are met |

---

*This document should be updated when major architectural decisions are made. Implementation details belong in [data-map.md](./data-map.md), [supabase-helpers-spec.md](./supabase-helpers-spec.md), and module-specific notes — not duplicated here.*
