# Artifact Engine V1

## Purpose

This document defines the smallest viable **Artifact Engine V1** for the current Writing Processor codebase.

It is architectural only.

It does **not** propose immediate code changes, route changes, Supabase changes, helper rewrites, or module rewrites. Its purpose is to show how the current application can evolve into the future Writing Learning Engine and Thinking Canvas model with the fewest possible changes.

The core design principle is:

- treat existing durable module outputs as artifacts where possible
- preserve every current module
- preserve Module 4 and Module 5 compatibility
- avoid a storage rewrite
- add new storage only when a future module creates thinking objects the current system cannot represent

## Design Posture

The current app already has durable thinking objects, but they are split across multiple legacy and emerging storage patterns.

Today there are really two parallel systems:

- the **current working chain** used by downstream modules: `module2_sources` -> `tchart_entries` -> `module3_responses` -> `student_buckets` -> `student_outlines` -> `student_drafts`
- the **newer evidence path** that has started to look like the future engine: `student_observations`

Artifact Engine V1 should therefore begin as a **normalization layer over current storage**, not as a replacement storage model.

## 1. Current Thinking Objects

### 1.1 Source information

Current storage:

- Primary table: `module2_sources`
- Shape: one row per student, with MLK-specific paired columns for the speech and letter
- Important fields:
  - `mlk_url`, `mlk_text`, `mlk_site_name`, `mlk_transcript_year`, `mlk_citation`
  - `lfbj_url`, `lfbj_text`, `lfbj_site_name`, `lfbj_transcript_year`, `lfbj_citation`

Helper layer:

- `lib/supabase/helpers/module2Sources.ts`
- `getModule2Sources()`
- `upsertModule2SpeechSource()`
- `upsertModule2LetterSource()`

API routes:

- `app/api/module2/sources/route.js`

Pages and components:

- `app/modules/2/page.js`
- `app/modules/2/source/page.js`
- `app/modules/2/letter/page.js`
- `app/texts/speech/page.js`
- `app/texts/letter/page.js`
- `app/modules/2/tcharts/page.js`
- `app/modules/4/page.js`

Current role in the system:

- Stores the student's chosen source URLs, copied source texts, site names, transcript dates, and citations
- Feeds the student-facing saved text pages
- Feeds original source links back into later modules

Important notes:

- This is durable student work and should be treated as real source-context data
- It is **not assignment-scoped**
- It is also **hardcoded to exactly two MLK sources**
- Citation data already exists here, but only as fields inside a source row, not as first-class artifacts

### 1.2 Legacy evidence and rhetorical analysis notes

Current storage:

- Primary table: `tchart_entries`
- Shape: one row per student, appeal, and source type
- Important fields:
  - `category` for `ethos` / `pathos` / `logos`
  - `type` for `speech` / `letter`
  - `quote`
  - `observation`
  - `letter_url`

Helper layer:

- `lib/supabase/helpers/tchartEntries.ts`
- `getTChartEntries()`
- `getTChartEntriesAdmin()`
- `upsertTChartEntries()`

API routes:

- `app/api/tchart/save/route.js`

Pages and components:

- `app/modules/2/tcharts/page.js`
- `components/ModuleThreeForm.js`
- `app/modules/4/page.js`
- `components/ModuleFour.js`
- `components/ModuleFive.js`
- `components/ModuleSix.js`

Current role in the system:

- This is the **actual evidence store consumed by current downstream modules**
- Module 2 saves quote-plus-explanation analysis into this table
- Module 3 reuses it as scaffolded evidence for thesis work
- Module 4 links buckets back to these rows through `evidenceKeys`
- Module 5 seeds outline points from these rows through `student_buckets`
- Module 6 exposes them in the side panel while drafting

Important notes:

- The `observation` field is overloaded; it can contain a combined explanation, audience effect, and purpose connection separated by markers
- This table behaves like a legacy evidence system, but it is still the compatibility backbone for Modules 3-6
- It is **not assignment-scoped**
- It does not explicitly know about sources beyond `type`

### 1.3 Guided observations

Current storage:

- Primary table: `student_observations`
- Shape: one row per saved guided observation
- Important fields:
  - `assignment_id`
  - `source_id`
  - `source_title`
  - `source_type`
  - `quote`
  - `student_observation`
  - `rhetorical_strategy`
  - `audience_effect`
  - `purpose_connection`
  - `essential_question_connection`
  - `observation_stage`
  - `teacher_guided`
  - `used_in_thesis`
  - `used_in_paragraph`

Helper layer:

- `lib/supabase/helpers/studentObservations.ts`
- `getStudentObservations()`
- `getStudentObservationBySourceId()`
- `saveStudentObservation()`
- `updateStudentObservation()`
- `deleteStudentObservation()`

API routes:

- `app/api/module2/observations/guided/route.js`

Pages and components:

- `app/modules/2/observations/guided/page.js`

Current role in the system:

- Stores guided passage-by-passage evidence observations tied to assignment and source
- This is the most artifact-like evidence model in the current app

Important notes:

- This table already looks much closer to a future `evidence` artifact store than `tchart_entries`
- It is assignment-aware and source-aware
- However, it is **not yet the evidence system that later modules consume**
- The `used_in_thesis` and `used_in_paragraph` fields suggest planned relationship tracking, but they are not yet the active downstream mechanism

### 1.4 Module 3 reasoning, structure choice, and thesis

Current storage:

- Primary table: `module3_responses`
- Shape: one row per student
- Important fields used in the app:
  - `responses`
  - `thesis`
  - `structure_choice`
  - teacher-facing fields such as `teacher_comment` and `teacher_score`

Helper layer:

- No dedicated helper file currently exists
- Components read and write this table directly through Supabase

API routes:

- No dedicated Module 3 artifact route currently exists

Pages and components:

- `app/modules/3/page.js`
- `components/ModuleThreeForm.js`
- `app/modules/4/page.js`
- `components/ModuleFive.js`
- `app/dashboard/components/StudentResponses.js`

Current role in the system:

- Stores four short grounding answers about audience and purpose
- Stores twelve appeal-analysis responses in a positional `responses` array
- Stores the student's selected organization pattern in `structure_choice`
- Stores the final thesis statement in `thesis`

Important notes:

- This table stores several different kinds of thinking in one coarse row
- The `responses` array is positional and module-specific, not artifact-shaped
- The thesis is durable and reusable
- The rest of the row is mostly compatibility scaffolding for the current Module 3 flow

### 1.5 Buckets and paragraph planning

Current storage:

- Primary table: `student_buckets`
- Legacy fallback still read in Module 5: `bucket_groups`
- Important fields in `student_buckets`:
  - `buckets`
  - `reflection`
  - `flow_state`

Bucket item shape in practice:

- `claim`
- `reasoning`
- `evidenceKeys`
- `evidenceSnippets`
- `paragraphRole`
- `suggestionId`

Helper layer:

- `lib/supabase/helpers/studentBuckets.ts`
- `getStudentBuckets()`
- `upsertStudentBuckets()`

API routes:

- `app/api/module4/buckets/route.js`

Pages and components:

- `app/modules/4/page.js`
- `components/ModuleFour.js`
- `components/ModuleFive.js`
- `lib/module4/mapStudentBucketsToOutline.ts`

Current role in the system:

- Stores paragraph-level planning work for Module 4
- Connects paragraph ideas to selected evidence through `evidenceKeys`
- Carries module flow state such as step position and pattern choice

Important notes:

- This is already very close to a `paragraph_plan` artifact
- The `flow_state.patternChoice` field is a weak signal of pattern thinking, but it is not a durable evidence-backed `pattern` artifact
- Relationships to thesis and evidence are mostly implicit except for `evidenceKeys`

### 1.6 Outline

Current storage:

- Primary table: `student_outlines`
- Important fields used in the app:
  - `outline`
  - `finalized`

Outline shape in practice:

- `thesis`
- `body` as ordered paragraph cards
- `conclusion`

Helper layer:

- `lib/supabase/helpers/studentOutlines.ts`
- `getStudentOutline()`
- `upsertStudentOutline()`

API routes:

- `app/api/outlines/route.js`

Pages and components:

- `app/modules/5/page.js`
- `components/ModuleFive.js`
- `components/ModuleSix.js`
- `lib/progression/guards.ts`
- `app/modules/10/student/[email]/page.js`

Current role in the system:

- Stores the student's ordered essay outline
- Preserves thesis, paragraph order, supporting points, and conclusion planning
- Acts as the gate into Module 6 when finalized

Important notes:

- This is a strong `outline` artifact candidate
- It is durable, reusable, and downstream-visible
- It is still module-scoped rather than assignment-scoped
- The helper layer currently reads and writes the outline JSON but does not fully reflect the `finalized` behavior that the rest of the app expects

### 1.7 Drafting, revision, and final text

Current storage:

- Primary table: `student_drafts`
- Important fields used in the app:
  - `sections`
  - `full_text`
  - `final_text`
  - `locked`
  - `revised`
  - `final_ready`

Helper layer:

- `lib/supabase/helpers/studentDrafts.ts`
- `getStudentDraft()`
- `getFinalTextForExport()`

API routes:

- No dedicated student draft write route; Modules 6-8 write directly to Supabase
- Teacher summary route reads Module 8 final text: `app/api/teacher/student/route.js`

Pages and components:

- `app/modules/6/page.js`
- `components/ModuleSix.js`
- `app/modules/7/page.tsx`
- `components/ModuleSeven.js`
- `app/modules/8/page.js`
- `components/ModuleEight.js`
- `app/modules/9/page.js`
- `components/ModuleNine.js`
- `app/modules/10/student/[email]/page.js`

Current role in the system:

- Module 6 stores section-based drafting work and combined `full_text`
- Module 7 stores revised text, plus optional `final_text` when revision is finalized
- Module 8 stores a locked final version for polish
- Module 9 exports the best available final text from Module 7 or falls back to Module 6

Important notes:

- This is clearly a draft artifact family
- The current granularity is coarse: rows are module-level, not section-level artifacts
- Revision work is stored mainly as overwritten draft text, not as separate `revision_note` objects

### 1.8 Non-canonical local fallback storage

The current app also stores some Module 2 work in user-scoped `localStorage` as a fallback:

- source gathering values on `app/modules/2/source/page.js` and `app/modules/2/letter/page.js`
- T-chart values on `app/modules/2/tcharts/page.js`

This should not be treated as Artifact Engine storage. It is a resilience layer, not a system of record.

## 2. Artifact Candidates

### `student_observations`

Recommendation:

- **Yes. This should become the canonical `evidence` artifact source over time.**

Why:

- It already has one-row-per-observation shape
- It is assignment-aware
- It is source-aware
- It separates quote, observation, audience effect, purpose connection, and essential-question connection cleanly

Why not use it as the only evidence source immediately:

- Current Modules 3-6 do not consume it
- Replacing `tchart_entries` immediately would break the current compatibility chain

V1 posture:

- Treat `student_observations` as the future-facing evidence artifact model
- Keep `tchart_entries` active until downstream modules are refactored

### `tchart_entries`

Recommendation:

- **No as a canonical artifact store. Yes as a compatibility evidence projection.**

Why:

- It is heavily reused downstream today
- It already provides evidence rows that later modules know how to consume

Why not make it the long-term artifact model:

- It is not assignment-scoped
- It collapses several concepts into a single row
- It ties evidence to fixed MLK appeal categories and source types
- It is shaped like a specific module worksheet, not a reusable engine primitive

V1 posture:

- Keep it as a compatibility read/write layer for current modules
- Do not center the future artifact vocabulary on it

### `module2_sources`

Recommendation:

- **Partially. Treat it as a temporary source-context and citation backing store, not as a clean one-artifact-per-row model.**

Why:

- It contains durable student source selection work
- It contains copied source text students reuse across later modules
- It already stores citation strings

Why it should not become the permanent artifact model as-is:

- One row contains two hardcoded sources
- The schema is MLK-specific
- It is not assignment-scoped
- It mixes source metadata, source text, and citation output in one structure

V1 posture:

- Recognize the data as valid artifact content
- Do not define `module2_sources` itself as the long-term generic artifact shape

### `module3_responses`

Recommendation:

- **Partially. Keep the row as a compatibility projection; treat only some contents as artifact-worthy.**

What should count:

- `thesis`
- possibly `structure_choice` as a weak bridge toward proof planning

What should not count as first-class artifacts:

- the entire positional `responses` array

Why:

- The thesis is durable and reused later
- The row is currently the compatibility surface that Module 4 and Module 5 still expect

Why not make the full row the future artifact model:

- It bundles many distinct thinking moves into one module-specific record
- The meaning of the `responses` array is encoded by index

V1 posture:

- Keep `module3_responses` as the compatibility record for current modules
- Treat only its durable outputs as future artifact candidates

### `student_buckets`

Recommendation:

- **Yes. This should become the first practical `paragraph_plan` artifact source.**

Why:

- It already stores paragraph claims, reasoning, paragraph roles, and linked evidence
- It already supports downstream reuse in Module 5

Why it is not yet the full future model:

- It is still module-shaped
- It stores flow UI state beside durable planning content
- It does not explicitly relate to thesis, claim, or proof-plan ids

V1 posture:

- Treat the `buckets[*]` items as inferred paragraph-plan artifacts

### `student_outlines`

Recommendation:

- **Yes. This is already an `outline` artifact.**

Why:

- It is durable
- It is user-authored
- It is reused by the drafting module
- It preserves order and structure

V1 posture:

- Treat it as a first-class existing artifact without changing its storage

### `student_drafts`

Recommendation:

- **Yes. This is already a draft artifact family, but at coarse granularity.**

Why:

- It stores the actual student draft text
- It preserves stages of drafting, revision, and finalization
- It feeds export and teacher review flows

Why it is only a partial match for the future model:

- It stores module-level text blobs rather than section-level durable objects
- Module 7 revision work is mostly text overwrite, not revision-note tracking

V1 posture:

- Treat it as an existing draft artifact store
- Do not try to force section-level normalization yet

### `student_exports`

Recommendation:

- **No for Artifact Engine V1.**

Why:

- It is publication/output tracking, not student thinking development
- It belongs more naturally to export/submission infrastructure than to the core artifact engine

## 3. Missing Artifact Types

### `assignment_understanding`

Current status:

- No durable assignment-understanding artifact currently exists

Natural fit:

- A future Module 1 output, likely tied to assignment framing, prompt understanding, and learning goal understanding

### `pattern`

Current status:

- No first-class pattern artifact exists
- The closest current signal is `student_buckets.flow_state.patternChoice`, but that is module flow state, not a durable evidence-backed pattern record

Natural fit:

- The first screens of Module 3 V2, after reviewing the evidence library

### `idea`

Current status:

- No first-class idea artifact exists

Natural fit:

- Module 3 V2 after selecting one pattern worth exploring

### `evidence_map`

Current status:

- No first-class evidence-to-idea or evidence-to-claim map exists
- The closest current signal is `student_buckets.evidenceKeys`, but that only links paragraph planning to legacy evidence rows

Natural fit:

- Module 3 V2 between exploratory idea formation and claim development

### `claim`

Current status:

- No first-class claim artifact exists
- The current app jumps from Module 2 evidence work into a Module 3 thesis record

Natural fit:

- Module 3 V2 immediately before thesis writing

### `proof_plan`

Current status:

- No clean proof-plan artifact exists
- Current approximations:
  - `module3_responses.structure_choice`
  - Module 4 paragraph scaffolding

Natural fit:

- End of Module 3 V2 and beginning of Module 4

### `paragraph_plan`

Current status:

- Partially exists already through `student_buckets`
- Further formalized in `student_outlines`

Natural fit:

- Existing Module 4 and Module 5 outputs

### `revision_note`

Current status:

- No first-class revision-note artifact exists
- Revision is mostly represented by changed draft text and `final_ready` flags

Natural fit:

- Module 7, attached to draft sections or revision passes

### `graphic_organizer`

Current status:

- No reusable graphic-organizer artifact exists
- The current app has fixed organizer surfaces instead:
  - the Module 2 T-chart
  - the Module 4 bucket workflow

Natural fit:

- As an optional artifact family for evidence comparison and planning, but not necessary for the smallest V1

### `citation`

Current status:

- Citation content already exists in `module2_sources`
- It does not exist as a first-class artifact type

Natural fit:

- Either as part of a future source artifact model or as a small standalone artifact if assignments later require multiple citations, versions, or citation checks

## 4. Relationship Opportunities

### Relationships already explicit in current storage

- `student_observations` already explicitly belongs to an assignment through `assignment_id`
- `student_observations` already explicitly belongs to a source through `source_id` and `source_type`
- `student_buckets.buckets[*].evidenceKeys` already explicitly point back to `tchart_entries`
- `student_outlines.finalized` and `student_drafts.locked` already express stage transitions used by progression gates

### Relationships already present, but only implicitly

- Source information in `module2_sources` belongs to the current assignment only by convention, not by assignment key
- `tchart_entries` belongs to an assignment, source, and appeal only by `user_email`, `type`, and `category`
- The Module 3 thesis belongs to Module 2 evidence only because the module sequence reuses it, not because the row links to evidence ids
- `student_buckets` belongs to the thesis only because Module 4 loads `module3_responses` and `student_buckets` together for the same user
- `student_outlines` belongs to Module 4 buckets because it is imported from them, not because it keeps explicit bucket ids
- Draft sections in Module 6 belong to outline sections only by array position
- Module 7 revision text belongs to the Module 6 draft only by module sequence and user identity

### Relationships that should become explicit later

- evidence -> pattern
- evidence -> idea
- evidence -> claim
- idea -> claim
- claim -> thesis
- thesis -> proof_plan
- proof_plan -> paragraph_plan
- paragraph_plan -> draft_section
- draft_section -> revision_note

### Practical V1 relationship rule

Artifact Engine V1 should **derive relationships from current data wherever possible** instead of introducing a relationship table immediately.

For the current app, the safest derived links are:

- assignment link from `student_observations.assignment_id`
- source link from `student_observations.source_id` and `module2_sources`
- evidence link from `student_buckets.evidenceKeys`
- thesis-to-outline link from shared student/module context and embedded outline thesis
- outline-to-draft link from module sequence and section order

## 5. Existing Helper Layer

### What the helper layer already does well

The helper layer under `lib/supabase/helpers` already follows a useful pattern:

- one helper file per data domain
- small, direct `get...` and `upsert...` functions
- low ceremony
- clear call sites from routes and pages

This pattern is already suitable for an artifact adapter layer.

### What the helper layer can support without redesign

The current pattern can naturally support:

- `readArtifact()`
- `listArtifacts()`
- `createArtifact()`
- `updateArtifact()`

But only if those functions are implemented as a **dispatcher over existing domain helpers**, not as a demand for one universal storage schema immediately.

In other words:

- `readArtifact("outline", ...)` can delegate to `getStudentOutline()`
- `readArtifact("paragraph_plan", ...)` can delegate to `getStudentBuckets()`
- `readArtifact("evidence", ...)` can delegate to `getStudentObservations()` or to a legacy `tchart_entries` adapter
- `createArtifact("outline", ...)` can delegate to `upsertStudentOutline()`
- `updateArtifact("paragraph_plan", ...)` can delegate to `upsertStudentBuckets()`

### What makes a fully generic layer awkward today

- Not all current storage domains have helpers; `module3_responses` is still queried directly
- Some helpers use the browser Supabase client, some use the admin client
- Payload shapes vary widely across tables
- Many components still query Supabase directly instead of going through helpers
- `studentDrafts.ts` is mostly read-oriented, not a complete upsert boundary
- `studentOutlines.ts` does not currently capture all of the `finalized` behavior used elsewhere in the app
- Legacy tables are not consistently assignment-scoped

### Helper-layer conclusion

The current helper pattern is good enough for Artifact Engine V1 **if V1 is an adapter layer**, not a schema-first rewrite.

## 6. Recommended V1

### Recommendation summary

The smallest possible Artifact Engine V1 should be:

- an **artifact vocabulary**
- an **adapter layer over existing tables**
- a **derived relationship model**
- a **compatibility-first posture**

It should not begin with a new database-centered abstraction.

### Recommended V1 artifact map

Use the current system as the backing store for these artifact types:

- `evidence`
  - future-facing canonical source: `student_observations`
  - current compatibility source: `tchart_entries`
- `source_context`
  - temporary backing store: `module2_sources`
- `citation`
  - temporary backing store: `module2_sources`
- `thesis`
  - backing store: `module3_responses.thesis`
- `paragraph_plan`
  - backing store: `student_buckets.buckets[*]`
- `outline`
  - backing store: `student_outlines.outline`
- `draft_section` or `draft`
  - backing store: `student_drafts`

### Recommended V1 compatibility rule

For the current application:

- do **not** replace `tchart_entries`
- do **not** replace `module3_responses`
- do **not** replace `student_buckets`
- do **not** replace `student_outlines`
- do **not** replace `student_drafts`

Instead:

- name them in artifact vocabulary
- read them through an artifact-aware adapter later
- keep legacy module reads intact until each downstream module is refactored

### Recommended V1 write rule

Only add new write storage when a module needs to create an artifact the current system truly cannot express.

That means:

- no new table is required just to label current objects as artifacts
- the first likely new write need is Module 3 V2 for `pattern`, `idea`, `evidence_map`, `claim`, and `proof_plan`

### Recommended V1 relationship rule

Do not introduce a dedicated relationship table in the first implementation phase.

Instead:

- derive current relationships from existing fields and module sequence
- reserve explicit relationship storage for the first truly new artifacts created by Module 3 V2

### Recommended V1 migration posture

The safest rollout path is:

1. Define the artifact vocabulary and mapping over existing tables
2. Keep all current module reads and writes working exactly as they do now
3. Treat `student_observations` as the preferred long-term evidence shape
4. Preserve `tchart_entries` as the compatibility evidence source until Modules 3-6 are refactored
5. Preserve `module3_responses` as the compatibility handoff to Modules 4 and 5
6. Introduce new storage only for missing Module 3 V2 artifacts

### Why this is the right V1

This approach:

- changes almost nothing
- introduces almost no duplication beyond unavoidable compatibility overlap
- preserves every existing module
- preserves Module 4 and Module 5 compatibility
- requires the fewest database changes possible

## 7. Risks

### 7.1 Most legacy thinking tables are not assignment-scoped

This is the largest long-term risk.

Current risk areas:

- `module2_sources`
- `tchart_entries`
- `module3_responses`
- `student_buckets`
- `student_outlines`
- `student_drafts`

All of these are effectively keyed by student and module, not by assignment instance.

If this is ignored, the app will remain tied to one active assignment per student and later artifact reuse across assignments will be much harder.

### 7.2 There are already two evidence systems

Current evidence is split between:

- `tchart_entries`
- `student_observations`

If this split continues without a clear V1 posture, evidence migration later will become confusing and expensive.

### 7.3 `module2_sources` is structurally assignment-specific

The current source row is hardcoded around exactly two MLK texts.

That is acceptable for today, but it cannot be the generic long-term source artifact model.

### 7.4 `module3_responses` is too coarse and too positional

A single row currently stores:

- audience grounding
- purpose grounding
- twelve appeal explanations
- structure choice
- thesis

The positional `responses` array is especially brittle and should not become the long-term artifact representation.

### 7.5 Relationships are mostly inferred, not durable

Many current links are based on:

- shared user identity
- module number
- section order
- import sequence

This works today, but it limits teacher visibility, relationship reuse, and future AI coaching.

### 7.6 Draft revision is stored as text overwrite instead of revision objects

Module 7 produces real revision work, but that work is not stored as explicit `revision_note` artifacts.

If this is ignored too long, the app will lose valuable visibility into how revision happened.

### 7.7 Helper boundaries are incomplete

The helper pattern is good, but it is not universal yet.

Current risks include:

- direct Supabase calls in components
- missing Module 3 helper coverage
- partial helper behavior around outline finalization and draft updates

If a generic artifact layer is added before those boundaries are respected, the result could become confusing rather than simplifying.

### 7.8 Module numbers currently stand in for stage identity

Today the module sequence is the main organizing principle.

That is acceptable for the current app, but artifact relationships should eventually rely more on assignment- and artifact-level identities than on module numbers alone.

## Closing Recommendation

Artifact Engine V1 should begin as a **compatibility-first artifact adapter over current storage**.

The correct first move is not to replace tables. The correct first move is to:

- recognize which current objects are already artifacts
- define which current rows are only compatibility projections
- preserve the working module chain
- reserve new storage for the first future module outputs that cannot be represented cleanly today

That gives the Writing Processor a realistic bridge from the current module application into the future Writing Learning Engine without breaking the application that already works.
