# Assignment Definition Engine

**Status:** Architecture specification (documentation only — no implementation in this document)  
**Goal:** Convert the existing MLK assignment into a **configurable assignment template** while preserving all current module functionality, routes, progress semantics, and Supabase artifact tables.  
**Related:** [writing-learning-engine-vision.md](./writing-learning-engine-vision.md), [architecture-overview.md](./architecture-overview.md), [data-map.md](./data-map.md), [pedagogical-flow.md](./pedagogical-flow.md)

---

## 1. Purpose

The Writing Processor ships one fully implemented assignment: the MLK rhetorical compare-and-contrast essay. Most instructional content — prompts, source metadata, validation rules, scaffolds, quiz items, and author-facing copy — is **embedded in page and component files**. A small partial config exists in `lib/assignments/`, and guided observations already read from it.

The **Assignment Definition Engine** is the layer that:

1. Declares all assignment-specific content in one **assignment definition** (template).
2. **Resolves** the active assignment for a student session.
3. **Feeds** module UIs and API routes through a stable interface so modules stay generic.

This document inventories every hardcoded MLK location found in the current codebase and specifies how each maps into the engine. It does not prescribe implementation steps beyond architectural boundaries.

---

## 2. Design constraints

These constraints come from the live product and [writing-learning-engine-vision.md](./writing-learning-engine-vision.md):

| Constraint | Implication for the engine |
|------------|---------------------------|
| No rewrite | Module routes (`/modules/1` … `/modules/10`), success pages, gates, and artifact tables remain |
| `student_assignments` progress model | `assignment_name` stays the progress key; engine must bind `assignment_name` ↔ definition |
| Observation → thesis → outline → drafting workflows | Definition configures *content* inside fixed workflow shapes |
| Supabase as source of truth | Definition is read-mostly config; student work still writes to existing tables |
| Helpers over raw queries | Engine exposes typed config; helpers accept resolved `assignmentId` / `assignmentName` |

---

## 3. Current state: two partial configs and a split identity

### 3.1 Existing config files (incomplete)

| File | What it holds | What still hardcodes elsewhere |
|------|---------------|-------------------------------|
| `lib/assignments/mlkRhetoricalAnalysis.ts` | `assignmentId`, title, essential question, speech/letter audience & purpose, `guidedPassages`, `rhetoricalStrategies` | Essay prompt, Module 1 quiz, source URLs, validation phrases, thesis scaffolds, bucket templates, drafting prompts, APA quiz, dashboard copy |
| `lib/assignments/mlkEssayPrompt.js` | Full essay prompt string | Duplicated verbatim in `app/modules/1/prompt/page.js`; checklist keywords in `ModuleOne.js` |

### 3.2 Split assignment identity (must unify)

The codebase uses **two different identifiers** for the same assignment:

| Identifier | Value | Used by |
|------------|-------|---------|
| `assignment_name` | `"MLK Essay Assignment"` | `student_assignments`, dashboard, gates, resume API, teacher notes |
| `assignment_id` | `"mlk-rhetorical-analysis"` | `student_observations`, guided observations API |
| `title` (config) | `"Comparing King's Speech and Letter"` | `mlkRhetoricalAnalysis.ts` only |

The engine must expose a single definition object that carries **all three display fields** and treats `assignment_name` + `assignment_id` as a fixed pair for the MLK template.

### 3.3 Config consumers today

Only these paths read centralized assignment config:

- `app/modules/2/observations/guided/page.js` → `mlkRhetoricalAnalysisAssignment` (+ local `STRATEGY_SCAFFOLDING`)
- `app/api/module2/observations/guided/route.js` → `assignmentId`, `guidedPassages` ids

Everything else hardcodes MLK content inline or uses `"MLK Essay Assignment"` as a string constant.

---

## 4. Hardcoded inventory

Every location below was found by static analysis of the repo. **Category** indicates the engine field group it should move into. **Priority** reflects how blocking it is for a second assignment instance.

Legend: **P0** = must be in definition before a second assignment can run; **P1** = strongly assignment-specific but MLK-only product tolerates temporarily; **P2** = instructional copy or polish; **Schema** = database/API shape coupling, not just strings.

---

### 4.1 Assignment identity and binding (P0)

| Location | Hardcoded value | Engine field |
|----------|-----------------|--------------|
| `lib/supabase/helpers/studentAssignments.ts` | `DEFAULT_ASSIGNMENT_NAME = "MLK Essay Assignment"` | `definition.assignmentName` |
| `app/dashboard/page.js` | `ASSIGNMENT_NAME`, dashboard title/description | `definition.assignmentName`, `definition.dashboard` |
| `app/modules/page.js` | `"MLK Essay Assignment"` insert/update; page title "MLK Essay Modules" | `definition.assignmentName`, `definition.modulesLanding` |
| `app/modules/2/layout.js` | `ASSIGNMENT_NAME` | `definition.assignmentName` |
| `app/modules/2/analysis/page.js` | `ASSIGNMENT_NAME`, resume body | `definition.assignmentName` |
| `app/modules/2/page.js` | `assignment_name: "MLK Essay Assignment"` in resume POST | `definition.assignmentName` |
| `app/modules/5/success/page.js` | `ASSIGNMENT_NAME` for resume + advance | `definition.assignmentName` |
| `components/ModuleSystem.js` | `ASSIGNMENT_NAME` | `definition.assignmentName` |
| `components/ModuleSix.js` | `assignmentName: "MLK Essay Assignment"` | `definition.assignmentName` |
| `components/ModuleNine.js` | `ASSIGNMENT_NAME` | `definition.assignmentName` |
| `components/TeacherDashboard.js` | `ASSIGNMENT_NAME`, notes storage key fallback | `definition.assignmentName` |
| `lib/assignments/mlkRhetoricalAnalysis.ts` | `assignmentId: "mlk-rhetorical-analysis"` | `definition.assignmentId` |

---

### 4.2 Essay prompt and essential question (P0)

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `lib/assignments/mlkEssayPrompt.js` | Full `MLK_ESSAY_PROMPT` | `definition.prompt.essayText` |
| `app/modules/1/prompt/page.js` | Same essay prompt duplicated (lines 271–278) | `definition.prompt.essayText` |
| `components/ModuleOne.js` | Imports `MLK_ESSAY_PROMPT`; paraphrase placeholder mentions King/speech/letter | `definition.prompt.essayText`, `definition.prompt.paraphrasePlaceholder` |
| `lib/assignments/mlkRhetoricalAnalysis.ts` | `essentialQuestion` | `definition.prompt.essentialQuestion` |
| `app/modules/2/observations/guided/page.js` | Essential question displayed from config | Already wired |

---

### 4.3 Module 1 — rhetorical primer and prompt breakdown (P0–P1)

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `components/ModuleOne.js` | `modules[0].content.quiz` — 10 ethos/pathos/logos questions | `definition.modules[1].quiz` |
| `components/ModuleOne.js` | `videoFile: "/videos/Ethos Pathos and Logos Explained.mp4"` | `definition.modules[1].media.videoUrl` |
| `components/ModuleSystem.js` | Duplicate quiz array + same video path | Same (single source) |
| `components/ModuleOne.js` | `getChecklistStatus()` keywords: compare/contrast, ethos/pathos/logos, speech/letter/dream/birmingham | `definition.prompt.checklistRules` |
| `app/modules/1/prompt/page.js` | `PROMPT_MC` — 4 multiple-choice breakdown questions with MLK-specific choices and nudges | `definition.modules[1].promptBreakdown` |
| `app/modules/1/prompt/page.js` | `nudge()` paraphrase rules referencing speech + letter | `definition.modules[1].promptBreakdown.paraphraseRules` |
| `app/api/module1/prompt/route.js` | *(no content — persists breakdown only)* | N/A |

Module 1 quiz content is **generic rhetoric**, not MLK-specific, but it is still hardcoded in components rather than the definition. For template reuse, it belongs in `definition.modules[1]` so assignments can swap or disable it.

---

### 4.4 Module 2 — sources and validation (P0)

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `app/modules/2/page.js` | Default URLs: National Archives speech PDF, UPenn letter HTML | `definition.sources[].defaultUrl` |
| `app/modules/2/page.js` | `SPEECH_PHRASES`, `LETTER_PHRASES`, min lengths 500/1000 | `definition.sources[].validation` |
| `app/modules/2/page.js` | Trustworthiness knowledge-check options (Archives, Stanford institute) | `definition.modules[2].sourceGathering.trustCheck` |
| `app/modules/2/page.js` | Stage labels, instructional copy naming I Have a Dream / Letter from Birmingham Jail | `definition.modules[2].sourceGathering.steps` |
| `app/modules/2/page.js` | Fallback titles: `"I Have a Dream"`, `"Letter from Birmingham Jail"`, `"National Archives"` | `definition.sources[].title`, `siteName` |
| `app/modules/2/source/page.js` | Google search query `"full text Letter from Birmingham Jail"`; speech/letter instructional copy | `definition.sources[].searchHints`, `gatheringCopy` |
| `app/modules/2/letter/page.js` | Same search query; APA citation examples for King letter | `definition.sources[].citationExamples` |
| `app/api/module2/sources/route.js` | `SPEECH_RESPONSE_DEFAULTS`, `LETTER_RESPONSE_DEFAULTS` (titles, site names, author) | `definition.sources[]` metadata |
| `lib/module4/resolveModuleSourceUrls.js` | Fallback Archives + Stanford URLs | `definition.sources[].fallbackUrl` |
| `lib/supabase/helpers/module2Sources.ts` | *(logic only)* reads `mlk_*` / `lfbj_*` columns | **Schema** — see §4.14 |
| `app/texts/speech/page.js` | Title "I Have a Dream"; `SPEECH_START_PHRASE` / `SPEECH_END_PHRASE`; archival header patterns; King-specific display copy | `definition.sources[speech].reader` |
| `app/texts/letter/page.js` | Title "Letter from Birmingham Jail" | `definition.sources[letter].reader` |

**Route coupling:** `/texts/speech` and `/texts/letter` are fixed paths referenced from Module 2, 3, 4, and tcharts. The engine should map `sourceId` → reader route (e.g. `/texts/{sourceId}`) while keeping existing routes as aliases during migration.

---

### 4.5 Module 2 — observation workflow (P0)

#### 4.5.1 Guided observations (partially configured)

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `lib/assignments/mlkRhetoricalAnalysis.ts` | `guidedPassages[]` (6 quotes + instructions) | `definition.observation.guidedPassages` |
| `lib/assignments/mlkRhetoricalAnalysis.ts` | `speech` / `letter` audience & purpose | `definition.sources[].audience`, `purpose` |
| `lib/assignments/mlkRhetoricalAnalysis.ts` | `rhetoricalStrategies: ["ethos","pathos","logos"]` | `definition.rhetoricalStrategies` |
| `app/modules/2/observations/guided/page.js` | `STRATEGY_SCAFFOLDING` — definitions, lookFor, prompts, placeholders (all King-specific) | `definition.observation.strategyScaffolding[strategy]` |
| `app/modules/2/observations/guided/page.js` | `SOURCE_TYPE_LABELS` speech/letter | `definition.sources[].label` |
| `app/api/module2/observations/guided/route.js` | Validates `source_id` against config passage ids | Engine loader (already pattern-correct) |

#### 4.5.2 T-chart / independent observations (legacy path)

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `app/modules/2/tcharts/page.js` | `APPEALS`, fallback URLs, `introCopy` per appeal (King-specific) | `definition.rhetoricalStrategies`, `definition.observation.tchartScaffolding` |
| `app/modules/2/tcharts/page.js` | Copy: "compare how King uses rhetorical strategies" | `definition.observation.introCopy` |
| `app/modules/2/tcharts/page.js` | `makeStudentKey(..., ["mlk", ...])` | `definition.assignmentId` in cache namespace — see §4.15 |
| `app/modules/2/analysis/page.js` | Ethos/pathos/logos sequencing copy; King as subject | `definition.observation.analysisIntro` |
| `components/ModuleTwoForm.js` | Video `/videos/IHaveADreamSpeech.mp4`; search instructions for Dream speech + Birmingham letter | `definition.modules[2].legacyForm` (deprecate or align with guided path) |
| `components/ModuleTwo.js` | Same video + Dream speech references | Same |

#### 4.5.3 Success copy

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `app/modules/2/success/page.js` | "Dr. King's I Have a Dream speech and Letter from Birmingham Jail" | `definition.modules[2].successMessage` |

---

### 4.6 Module 3 — thesis workflow (P0)

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `components/ModuleThreeForm.js` | `guidedFields` — audience/purpose questions naming I Have a Dream / Birmingham Jail | `definition.thesis.guidedFields` |
| `components/ModuleThreeForm.js` | `appealGroups` — speech/letter × audience/purpose steps | `definition.thesis.appealSteps` |
| `components/ModuleThreeForm.js` | Dynamic labels template: "how does King use Ethos…" (12 variants) | `definition.thesis.appealQuestionTemplate` + `definition.author.name` |
| `components/ModuleThreeForm.js` | `structureChoice` options: similarities-then-differences, differences-then-similarities, appeals-organization (labels + descriptions) | `definition.thesis.structureChoices` |
| `components/ModuleThreeForm.js` | Welcome/thesis step copy referencing King, comparative thesis | `definition.thesis.stepCopy` |
| `components/ModuleThreeForm.js` | `FALLBACK_SPEECH_SOURCE_URL`, `FALLBACK_LETTER_SOURCE_URL` | `definition.sources[].fallbackUrl` |
| `components/ModuleThreeForm.js` | `GROUNDING_REMINDER_*`, `AUDIENCE_TIP`, `PURPOSE_TIP` | `definition.thesis.scaffoldingTips` |
| `components/ModuleThreeForm.js` | `/texts/speech`, `/texts/letter` links | `definition.sources[].readerPath` |
| `components/ModuleThreeForm.js` | `/videos/thesis-intro.mp4` | `definition.modules[3].media.videoUrl` |
| `lib/assignments/mlkRhetoricalAnalysis.ts` | Default audience/purpose strings for speech and letter | Should be **single source** for thesis hints and guided observations |

---

### 4.7 Module 4 — buckets workflow (P0)

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `components/ModuleFour.js` | `APPEALS`, bucket suggestion templates (ethos-para, speech-emotion, letter-logic, etc.) | `definition.buckets.suggestionTemplates` |
| `components/ModuleFour.js` | Ethos reflection chips ("King presents himself as morally responsible", etc.) | `definition.buckets.reflectionPrompts` |
| `components/ModuleFour.js` | Sentence frames: "This shows that King is…", "King uses ___ to ___" | `definition.buckets.sentenceFrames` |
| `components/ModuleFour.js` | Structure-choice-dependent bucket sets keyed to `similarities-then-differences` etc. | `definition.buckets.templatesByStructureChoice` |
| `components/ModuleFour.js` | UI labels: Speech — *I Have a Dream* / Letter — *Letter from Birmingham Jail* | `definition.sources[].title` |
| `components/ModuleFour.js` | `GROUNDING_REMINDER` referencing King's words | `definition.buckets.groundingReminder` |
| `app/modules/4/page.js` | Selects `mlk_url`, `lfbj_url` from `module2_sources` | **Schema** — see §4.14 |

---

### 4.8 Module 5 — outline workflow (P1)

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `components/ModuleFive.js` | Copy referencing "comparing the speech and the letter" | `definition.outline.instructionCopy` |
| `components/ModuleFive.js` | Thesis/bucket integration logic (generic shape, MLK nouns in strings) | `definition.outline.stepCopy` |

Outline **structure** (ordered paragraphs JSON in `student_outlines`) is assignment-agnostic; only instructional strings are MLK-specific.

---

### 4.9 Modules 6–8 — drafting workflow (P1)

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `components/ModuleSix.js` | Introduction checklist: "introduce Dr. King and the two works" | `definition.drafting.module6.introChecklist` |
| `components/ModuleSix.js` | Body paragraph guidance: ethos/pathos/logos, speech and letter | `definition.drafting.module6.bodyGuidance` |
| `components/ModuleSix.js` | Conclusion prompt about King's message | `definition.drafting.module6.conclusionGuidance` |
| `components/ModuleSeven.js` | Revision prompt mentioning ethos/pathos/logos in each text | `definition.drafting.module7.revisionFocus` |
| `components/ModuleEight.js` | *(mostly generic polish — verify on change)* | `definition.drafting.module8` |
| Success pages `6/success`, `7/success`, `8/success` | Generic drafting messages | `definition.modules[n].successMessage` (optional) |

Draft **persistence** (`student_drafts`, lock/finalize gates) is not assignment-specific.

---

### 4.10 Module 9 — APA and submission (P1)

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `components/ModuleNine.js` | `questions[]` — 9 APA items; **Q8** cites MLK speech and letter as primary sources | `definition.submission.apaQuiz` |
| `components/ModuleNine.js` | `CHECKLIST_ITEMS` — 6 APA formatting rules | `definition.submission.formatChecklist` |
| `app/api/export-to-docs/route.js` | Google Doc title `"APA Final Essay"` | `definition.submission.exportDocTitle` |
| `components/ModuleNine.js` | Guided export steps (generic APA workflow) | `definition.submission.workflowSteps` |

Citation style (APA) and checklist items are assignment-configurable per [module-data-notes.md](./module-data-notes.md) MLA future note.

---

### 4.11 Teacher and dashboard surfaces (P1)

| Location | Hardcoded content | Engine field |
|----------|-------------------|--------------|
| `app/dashboard/page.js` | "MLK Essay Assignment" card title and description | `definition.dashboard` |
| `components/TeacherDashboard.js` | Filters tied to `ASSIGNMENT_NAME` | `definition.assignmentName` |
| `app/api/assignments/mlk-essay/page.js` | Legacy assignment info page (King rhetorical strategies) | Remove or generate from definition |
| `app/api/assignments/create-doc/route.js` | Doc name `MLK T-Chart – ${email}` | `definition.integrations.tchartDocTitleTemplate` |

Teacher artifact views read module tables generically; they inherit MLK context only through student `assignment_name`.

---

### 4.12 Media assets (P1)

| Path | Used by | Engine field |
|------|---------|--------------|
| `/videos/Ethos Pathos and Logos Explained.mp4` | `ModuleOne.js`, `ModuleSystem.js` | `definition.modules[1].media.videoUrl` |
| `/videos/IHaveADreamSpeech.mp4` | `ModuleTwoForm.js` | `definition.modules[2].media` (legacy) |
| `/videos/thesis-intro.mp4` | `ModuleThreeForm.js` | `definition.modules[3].media.videoUrl` |

---

### 4.13 localStorage cache namespaces (P0)

| Location | Pattern | Engine field |
|----------|---------|--------------|
| `app/modules/2/source/page.js` | `makeStudentKey(email, ["mlk", "module2", ...])` | `definition.cacheNamespace` (= `assignmentId`) |
| `app/modules/2/tcharts/page.js` | `["mlk", "module2", "tcharts", ...]` | Same |

User-scoped cache keys must use `assignmentId`, not the literal `"mlk"`, so multiple assignments do not collide.

---

### 4.14 Schema coupling (P0 — not strings, but assignment-shaped)

These are **structural** hardcodings that assume exactly two sources named speech and letter:

| Area | Coupling | Engine / migration approach |
|------|----------|-------------------------------|
| `module2_sources` table | Columns `mlk_*`, `lfbj_*` | Keep for MLK; API maps `definition.sources[0|1]` ↔ columns. Long-term: `assignment_sources` JSON or normalized rows keyed by `source_id` |
| `tchart_entries` | `category` + `type` speech/letter | Map from `definition.sources[].id`; observation unification via `student_observations` |
| `module3_responses` | 16-slot `responses` array layout | Defined by `definition.thesis.responseSchema` |
| `student_observations` | `assignment_id`, `source_type` speech/letter | Already assignment-aware; extend `source_type` to `source_id` |
| `resolveModuleOriginalUrls.js` | `mlk_url` / `lfbj_url` | Resolver reads definition source order |
| Text reader routes | `/texts/speech`, `/texts/letter` | Parameterize to `/texts/[sourceId]` with MLK aliases |

**Preservation rule:** MLK columns and routes remain valid for existing student rows. The engine adds a mapping layer; it does not require immediate schema migration.

---

### 4.15 Summary counts

| Category | Files with hardcoding | Already in partial config |
|----------|----------------------|---------------------------|
| Assignment identity | 12 | `assignmentId` only |
| Essay prompt | 3 | `mlkEssayPrompt.js` (not wired everywhere) |
| Module 1 | 3 | 0 |
| Module 2 sources | 8 | 0 |
| Module 2 observations | 6 | Guided passages + audience/purpose |
| Module 3 thesis | 1 (large) | Audience/purpose duplicates config |
| Module 4 buckets | 2 | 0 |
| Module 5 outline | 1 | 0 |
| Modules 6–8 drafting | 3 | 0 |
| Module 9 submission | 2 | 0 |
| Teacher/dashboard | 4 | 0 |
| Schema coupling | 6+ helpers/routes | 0 |

---

## 5. Assignment definition schema

The engine exposes one resolved object per request/session. TypeScript types live in `lib/assignments/types.ts` (proposed); MLK fills `lib/assignments/mlkRhetoricalAnalysis.ts` until DB-backed definitions exist.

### 5.1 Top-level shape

```ts
type AssignmentDefinition = {
  // Identity — both keys required
  assignmentId: string;           // slug, e.g. "mlk-rhetorical-analysis"
  assignmentName: string;         // student_assignments key, e.g. "MLK Essay Assignment"
  title: string;                  // display title
  version: string;                // semver for template changes

  prompt: PromptConfig;
  author: AuthorConfig;           // "Dr. Martin Luther King Jr." / "King"
  sources: SourceConfig[];        // ordered; MLK has length 2
  rhetoricalStrategies: StrategyConfig[];
  essentialQuestion: string;      // alias for prompt.essentialQuestion

  observation: ObservationConfig;
  thesis: ThesisConfig;
  buckets: BucketsConfig;
  outline: OutlineConfig;
  drafting: DraftingConfig;
  submission: SubmissionConfig;

  modules: Record<ModuleNumber, ModuleShellConfig>;  // per-module media, quiz, success copy
  dashboard: DashboardConfig;
  cacheNamespace: string;         // === assignmentId
};
```

### 5.2 Source config (replaces speech/letter hardcoding)

```ts
type SourceConfig = {
  id: string;                     // "speech" | "letter" for MLK
  label: string;                  // "Speech" | "Letter"
  title: string;                  // "I Have a Dream"
  author: string;
  defaultUrl: string;
  fallbackUrl: string;
  siteName: string;
  audience: string;               // instructional default
  purpose: string;
  readerPath: string;             // "/texts/speech"
  searchHints: string[];          // Google suggest queries
  validation: {
    minTextLength: number;
    requiredPhrases: string[];    // lowercase match
  };
  reader: {
    startPhrase?: string;
    endPhrase?: string;
    archivalHeaderPatterns?: string[];
    displayNotes?: string;
  };
  citationExamples?: string[];
};
```

### 5.3 Observation config

```ts
type ObservationConfig = {
  guidedPassages: GuidedPassage[];  // existing type
  strategyScaffolding: Record<string, StrategyScaffold>;
  tchartScaffolding: Record<string, string>;  // per-strategy intro
  introCopy: string;
  analysisIntro: string;
};

type StrategyScaffold = {
  definition: string;
  lookFor: string;
  keyQuestion: string;
  observationPrompt: string;
  observationPlaceholder: string;
  sentenceStarter: string;
  audienceHint: string;
  purposeHint: string;
  essentialQuestionHint: string;
};
```

`StrategyScaffold` text templates accept `{author}` interpolation so "King" is not baked into the engine.

### 5.4 Thesis config

```ts
type ThesisConfig = {
  guidedFields: Array<{
    focus: "audience" | "purpose";
    sourceId: string;
    responseIndex: number;
    label: string;
    hint: string;
  }>;
  appealSteps: Array<{
    title: string;
    sourceId: string;
    showTchart: boolean;
  }>;
  appealQuestionTemplate: string;  // "In the {sourceLabel}, how does {author} use {strategy}…"
  structureChoices: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  stepCopy: Record<string, string>;
  scaffoldingTips: Record<string, string>;
  responseSchema: { slotCount: number };  // 16 for MLK
};
```

### 5.5 Buckets, outline, drafting, submission

```ts
type BucketsConfig = {
  suggestionTemplates: Record<string, BucketSuggestion[]>;
  templatesByStructureChoice: Record<string, BucketSuggestion[]>;
  reflectionPrompts: ReflectionChip[];
  sentenceFrames: SentenceFrame[];
  groundingReminder: string;
};

type OutlineConfig = {
  instructionCopy: Record<string, string>;
};

type DraftingConfig = {
  module6: { introChecklist: string[]; bodyGuidance: string[]; conclusionGuidance: string };
  module7: { revisionFocus: string[] };
  module8: Record<string, string>;
};

type SubmissionConfig = {
  citationStyle: "APA" | "MLA";
  apaQuiz: QuizItem[];
  formatChecklist: string[];
  exportDocTitle: string;
};
```

### 5.6 Module 1 prompt breakdown

```ts
type PromptBreakdownConfig = {
  fields: Record<string, {
    label: string;
    choices: string[];
    correct: string;
    emptyNudge: string;
    wrongNudge: string;
  }>;
  paraphraseRules: {
    minLength: number;
    requiredTerms: string[];      // ["speech", "letter"] for MLK
    nudges: Record<string, string>;
  };
};
```

---

## 6. Engine architecture

### 6.1 Components

```
┌──────────────────────────────────────────────────────────────┐
│  AssignmentRegistry                                           │
│  - register(definition)                                       │
│  - getById(assignmentId)                                      │
│  - getByName(assignmentName)                                  │
│  - getDefault() → MLK definition                              │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│  AssignmentResolver                                           │
│  - resolveForStudent(userEmail) → definition                │
│    1. read student_assignments.assignment_name                │
│    2. map to definition (fallback: default MLK)               │
└────────────────────────────┬─────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
  App Router pages     API routes          Server components
  useAssignment()      getAssignment()     getAssignment()
```

### 6.2 Proposed module boundaries (no implementation)

| Module | Responsibility |
|--------|----------------|
| `lib/assignments/types.ts` | All config types |
| `lib/assignments/registry.ts` | In-memory registry of definitions |
| `lib/assignments/mlk/index.ts` | Composes full MLK `AssignmentDefinition` from split files if needed |
| `lib/assignments/resolve.ts` | `resolveAssignment({ userEmail })`, `resolveByName`, `resolveById` |
| `lib/assignments/context.tsx` | Client `AssignmentProvider` + `useAssignment()` hook |
| `lib/assignments/interpolate.ts` | Replace `{author}`, `{sourceTitle}`, etc. in scaffold strings |

### 6.3 Server vs client resolution

| Context | Resolution source |
|---------|-------------------|
| Client pages (`"use client"`) | `AssignmentProvider` at `app/modules/layout.js` or per-module layout; loads via `GET /api/assignments/active` |
| Server pages (`app/modules/4/page.js`) | `resolveAssignment` in RSC with session email |
| API routes | `resolveById` from request body or session's active assignment |

**New API (proposed):** `GET /api/assignments/active` returns the resolved definition (or a safe subset — prompts + sources + scaffolds, not internal version metadata).

### 6.4 Binding to progress

```
student_assignments.assignment_name
        │
        ▼
AssignmentRegistry.getByName()
        │
        ▼
AssignmentDefinition
        │
        ├──► UI scaffolds, prompts, validation
        ├──► student_observations.assignment_id  (= definition.assignmentId)
        └──► localStorage namespace              (= definition.cacheNamespace)
```

`advanceCurrentModuleOnSuccess` continues to receive `assignmentName` from the definition. No change to forward-only progress semantics.

---

## 7. MLK template: unifying the definition

The MLK template is the **first registered definition**. It merges today's fragments:

| Current fragment | Merged into |
|------------------|-------------|
| `mlkRhetoricalAnalysis.ts` | `sources`, `guidedPassages`, `rhetoricalStrategies`, `essentialQuestion` |
| `mlkEssayPrompt.js` | `prompt.essayText` |
| All §4 inventory items | Respective config sections |
| Implicit `"MLK Essay Assignment"` | `assignmentName` |

Recommended file layout (proposed, not implemented):

```
lib/assignments/
  types.ts
  registry.ts
  resolve.ts
  interpolate.ts
  mlk/
    index.ts              # exports mlkAssignmentDefinition
    prompt.ts
    sources.ts
    observation.ts
    thesis.ts
    buckets.ts
    drafting.ts
    submission.ts
    module1.ts
```

`mlk/index.ts` is the single import for registry seeding. Deprecate duplicate `mlkEssayPrompt.js` once all consumers import from the composed definition.

---

## 8. Module-by-module extraction map

How each module **preserves functionality** while reading from the definition:

| Module | Behavior preserved | Config drives |
|--------|-------------------|---------------|
| **1** | Quiz flow, prompt breakdown save, activity log | Essay prompt, breakdown MC, quiz items, video URL, checklist rules |
| **2 gather** | Multi-stage source wizard, phrase validation, save to `module2_sources` | Source URLs, validation phrases, trust check, step copy |
| **2 observe** | Guided + tchart paths, save to `student_observations` / `tchart_entries` | Passages, scaffolds, strategy list, intro copy |
| **3** | Wizard steps, `module3_responses` upsert, structure choice | Field labels, appeal templates, structure choices, tips, media |
| **4** | Bucket builder, `student_buckets` save, thesis/tchart read | Suggestion templates, frames, source titles |
| **5** | Outline editor, finalize gate | Instruction strings only |
| **6–8** | Draft save, lock/finalize gates | Section checklists and guidance copy |
| **9** | APA quiz, checklist, export, PDF upload | Quiz items, checklist, doc title, citation style |
| **10** | Teacher views of artifacts | Assignment filter, display title |

**No module route changes** are required for MLK parity. Extraction is replacing string literals with `const def = useAssignment()` (or server equivalent).

---

## 9. Interpolation and author abstraction

Many strings hardcode "King" or "Dr. King". The engine should support token replacement at render time:

| Token | MLK value |
|-------|-----------|
| `{author}` | Dr. Martin Luther King Jr. |
| `{authorShort}` | King |
| `{sourceA.title}` | I Have a Dream |
| `{sourceB.title}` | Letter from Birmingham Jail |
| `{essentialQuestion}` | (from definition) |

This reduces duplicate scaffold blocks between guided observations and thesis appeals.

---

## 10. Phased extraction order (architecture only)

| Phase | Scope | Outcome |
|-------|-------|---------|
| **A** | Identity + registry + resolver | Single `assignmentName` ↔ `assignmentId` pair; all `ASSIGNMENT_NAME` constants replaced |
| **B** | Prompt + Module 1 | One essay prompt source; prompt breakdown from definition |
| **C** | Module 2 sources + reader pages | Source config drives URLs, validation, reader; cache namespace uses `assignmentId` |
| **D** | Observation | Move `STRATEGY_SCAFFOLDING` + tchart copy into definition; guided API unchanged |
| **E** | Thesis + buckets | Largest inline blocks; structure choices and bucket templates from definition |
| **F** | Drafting + Module 9 | Checklists and APA quiz from definition |
| **G** | Dashboard + teacher | Display metadata from definition |
| **H** | DB-backed definitions (optional) | Seed MLK row from TS; runtime loader with TS fallback |

Each phase is independently shippable; MLK behavior must remain byte-for-byte equivalent unless intentionally improving copy.

---

## 11. Validation rules

The registry validates definitions at load time:

- `assignmentId` and `assignmentName` are unique in the registry
- `sources.length >= 1`
- Every `guidedPassages[].sourceType` matches a `sources[].id`
- `rhetoricalStrategies` referenced by passages exist in `strategyScaffolding`
- `thesis.responseSchema.slotCount` matches appeal step layout
- `cacheNamespace === assignmentId`
- Module 2 `validation.requiredPhrases` are non-empty for MLK-style completeness checks

Invalid definitions fail at build/startup in development, not at student runtime.

---

## 12. Testing strategy (when implemented)

| Test type | Asserts |
|-----------|---------|
| Registry | MLK definition loads; `getByName("MLK Essay Assignment")` === `getById("mlk-rhetorical-analysis")` |
| Snapshot | Resolved MLK prompt + 6 guided passages match current production strings |
| Module smoke | Each module page renders with MLK definition mock without throwing |
| Progress | `advanceCurrentModuleOnSuccess` still uses `assignmentName` from definition |
| Cache | `makeStudentKey(email, [assignmentId, ...])` does not use literal `"mlk"` |

---

## 13. Out of scope for this engine

- Replacing module numbers or success-page progression
- Migrating `module2_sources` column names (mapping layer only for now)
- Teacher authoring UI for definitions
- Multi-assignment enrollment (resolver returns default until enrollment exists)
- AI coaching prompt templates (separate log table per [data-plan-draft.md](./data-plan-draft.md))

---

## 14. Decision record

| Question | Answer |
|----------|--------|
| Where does assignment content live? | `AssignmentDefinition`, registered in `AssignmentRegistry` |
| How does UI get it? | `useAssignment()` / `getAssignment()` — not direct imports of `mlkRhetoricalAnalysis` in pages |
| What ties student to assignment? | `student_assignments.assignment_name` → definition |
| What about `student_observations`? | `definition.assignmentId` |
| Can MLK keep `mlk_url` columns? | Yes; source adapter maps `sources[0]` ↔ speech columns |
| Must `/texts/speech` keep working? | Yes; alias to `sources` reader path during migration |
| Is this a rewrite? | No; string and config extraction only |

---

## 15. Glossary

| Term | Meaning |
|------|---------|
| **Assignment definition** | Complete template for one writing assignment instance |
| **Assignment registry** | In-memory catalog of definitions (later backed by Supabase) |
| **Resolver** | Maps a student's `assignment_name` to a definition |
| **Source** | A primary text the student gathers and analyzes (MLK: speech, letter) |
| **Scaffold** | Instructional copy, sentence starters, and hints — not student artifacts |
| **Schema coupling** | DB columns or routes that assume MLK's two-source shape |

---

*When implementation begins, update [data-map.md](./data-map.md) for any new API routes and [supabase-helpers-spec.md](./supabase-helpers-spec.md) for helper signature changes. This document remains the authoritative map from hardcoded MLK content to configurable assignment templates.*
