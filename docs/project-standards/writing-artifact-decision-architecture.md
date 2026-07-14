# Writing artifact and decision architecture

| | |
|---|---|
| **Document role** | Architectural decision record (ADR-style) |
| **Original intent** | Implementation-ready specification written before/during the checkpoint stream |
| **Status (2026-07-14)** | Core decisions **adopted**; see **Decision status** below for implemented vs compatibility fallback vs future |
| **Does not claim** | Beta-readiness, production-readiness, or market-ready shipping |
| **Charter** | [cognitive-load-charter.md](cognitive-load-charter.md) |
| **Companion audit** | [cognitive-load-audit-modules-1-6.md](audits/cognitive-load-audit-modules-1-6.md) *(historical)* |
| **Roadmap** | [cognitive-load-mission-alignment-roadmap.md](roadmaps/cognitive-load-mission-alignment-roadmap.md) |
| **Issue log** | [issue-log.md](walkthroughs/issue-log.md) |

## Decision status (compact)

Statuses distinguish code presence from human acceptance. **Needs Verification** means implementation exists or partially exists but live/manual acceptance is incomplete.

| Decision | Status | Evidence / notes |
|---|---|---|
| Module 2 owns the rhetorical-strategy matrix | **Adopted and implemented** | `7e102f0`; matrix helpers + Module 2 UI |
| Single rating dimension (0–10 anchors) for v1 | **Adopted and implemented** | Matrix cell ratings; frequency-vs-importance split deferred |
| Matrix bundle as versioned JSON (not a new dedicated table) | **Adopted with compatibility fallback** | Stored via Module 2 artifact / flow paths readable by M3; “dedicated table later” remains **Future production architecture** |
| Dual T-chart + guided evidence → canonical reader | **Adopted with compatibility fallback** | `normalizeEvidenceForModule3` / Module 2–3 readers still union legacy rows; not a hard cutover wipe |
| Module 3 consumes selected direction + provenance | **Adopted and implemented** | CP-D `f04ddbf`; additive `matrixProvenance` / `matrixReview` |
| Module 3 legacy path when no matrix | **Adopted and implemented** | `useLegacyPatternPath` / invent-pattern fallback |
| Upstream signature change → needs review, no silent rewrite | **Adopted and implemented** | Review banners + confirm; student prose preserved |
| Students author Claim / Thesis / draft / revision | **Adopted and implemented** | Starters optional; never auto-fill essay prose |
| Module 4 provenance personalization | **Adopted and implemented** | CP-E `ff19654` |
| Module 5 sequenced outline + job-preserving map | **Adopted and implemented** | CP-F `06bbb67` |
| Module 6 personalized drafting + section gates | **Adopted and implemented** | CP-G `41cfa00` |
| Planning vs writing representation (no outline chrome in prose) | **Adopted and Implemented** | WP-001 / WP-065 / WP-066 / WP-063 (`1b25ee2`) |
| Full task-contract decision engine (every microtask as typed graph) | **Future production architecture** | Spec below remains normative target; not a claim that every screen already exposes all contract fields |
| App-wide WP-048–062 instructional UX | **Partially implemented / Needs Verification** | Code landed; issue log remains **Needs Verification** until manual acceptance |

## Design stance

- Prefer **transparent deterministic rules** over black-box grading.
- Every arrow in the chain is a **comprehensible transformation**.
- Personalization is **advisory, reversible, provenance-visible**.
- Mechanical gates verify **process observables**, not correctness of ideas.
- Thinking support precedes optional language scaffolds.

---

## Task contract (future decision engine)

Every microtask implements:

| Field | Requirement |
|---|---|
| `strategyExplanation` | Why writers do this kind of thinking |
| `dominantQuestion` | Exactly one |
| `requiredInputs` | Artifact IDs / fields needed |
| `visibleContext` | Required inputs only; reference collapsed |
| `responseMode` | One primary control type |
| `mechanicalCompletion` | Observable predicate |
| `outputArtifact` | Type + fields written |
| `nextTaskRules` | Deterministic graph edges |
| `revisionDependencies` | Downstream IDs marked `needs_review` on edit |

---

## Canonical artifact chain

```
assignment_orientation
→ source_observation
→ evidence_record
→ appeal_evaluation (matrix cell)
→ comparison_matrix (aggregate view)
→ derived_comparison_options
→ selected_pattern
→ audience_purpose_reasoning
→ claim
→ thesis + proof_directions
→ paragraph_point
→ paragraph_job
→ paragraph_evidence
→ paragraph_reasoning
→ outline_order + outline_sections
→ draft_section
→ revision_observation / revision_decision
```

---

## Artifact catalog

### 1. Assignment and audience/purpose orientation

| Field | Spec |
|---|---|
| Purpose | Externalize what the essay asks and who/why each King work addresses |
| Producing microtasks | M1 prompt decode (sequenced); M2 meet-situations (persisted answers) |
| Required inputs | Assignment text; speech/letter situations |
| Persisted shape | `module1_prompt_breakdown`; **new** `rhetorical_situation_summary` (speech/letter audience+purpose notes) |
| Provenance | Assignment ID + module |
| Consumers | All later “why this matters” rails; matrix cell audience questions |
| Mechanical validity | Required MC/paraphrase; situation answers present |
| Edit behavior | Editable; marks claim/thesis `needs_review` only if paraphrase meaning changes (soft) |
| Domain | Assignment-specific orientation; process reusable |

### 2. Source observations / evidence records

| Field | Spec |
|---|---|
| Purpose | Durable quote + student note + appeal + work |
| Producing microtasks | One-cell evidence capture (canonical path; retire dual guided/T-chart as twin canons) |
| Required inputs | Saved source texts; appeal+work cell ID |
| Persisted shape | Canonical `evidence_record`: `{ id, sourceType: speech\|letter, appeal, quote, observation, audienceNote?, purposeNote?, schemaVersion }` |
| Provenance | Cell ID + source URLs |
| Consumers | Matrix cell evidence linkage; M3 clusters; M4 evidence |
| Mechanical validity | Non-empty quote + observation (thresholds TBD modest) |
| Edit behavior | Edit marks linked evaluations/connections `needs_review` |
| Legacy | Map `tchart_entries` + `student_observations` via existing alias helpers |
| Domain | Reusable evidence object |

### 3. Rhetorical-appeal evaluation (matrix cell)

| Field | Spec |
|---|---|
| Purpose | Provisional judgment of how strongly an appeal operates in one work |
| Producing microtasks | One cell at a time (see Matrix specification) |
| Required inputs | Cell ID; ≥1 linked evidence_record for that cell (or explicit “none”) |
| Persisted shape | See Matrix persistence |
| Consumers | Derived comparisons; pattern options; coaching |
| Mechanical validity | Rating selected; evidence rule satisfied; function note threshold |
| Edit behavior | Recalculate derived options; mark selected_pattern `needs_review` if ranking changes |
| Domain | Assignment-specific appeals; matrix pattern reusable |

### 4. Comparison matrix (aggregate)

| Field | Spec |
|---|---|
| Purpose | Visual accumulation of six cells — **review artifact**, not simultaneous input form |
| Producing | Derived from cells |
| Persisted | Optional denormalized snapshot + always recompute from cells |
| Consumers | Review screens; provenance displays |

### 5. Derived comparison options

| Field | Spec |
|---|---|
| Purpose | Transparent candidate directions (not thesis text) |
| Rules | Deterministic (see Matrix) |
| Persisted | Ephemeral compute + optional cache with rule IDs |
| Consumers | Pattern selection UI |

### 6. Selected pattern

| Field | Spec |
|---|---|
| Purpose | Student-chosen analytical direction |
| Inputs | Derived options + optional student-authored pattern |
| Shape | `{ id, kind, label, provenanceRuleIds, evidenceIds[], studentOverrideNote?, schemaVersion }` |
| Consumers | Idea/claim/thesis coaching; M4 proof-plan recommendations; evidence filters |
| Validity | Kind chosen; provenance shown; override allowed |
| Edit | Marks claim/thesis/proof/paragraphs `needs_review` |

### 7. Audience/purpose reasoning

| Field | Spec |
|---|---|
| Purpose | Explain why the selected pattern fits audiences/purposes |
| Inputs | Situation summary + selected pattern + matrix cells |
| Consumers | Claim/thesis context |
| Validity | Modest length threshold |

### 8. Claim

| Field | Spec |
|---|---|
| Purpose | Point the evidence helps prove |
| Inputs | Pattern, connections, assignment |
| Persist | Existing claim artifact / `workingClaim` |
| Consumers | Thesis |
| Validity | Length + support rationale (existing M3, refine density) |

### 9. Thesis and proof directions

| Field | Spec |
|---|---|
| Purpose | Main claim + up to three planning notes |
| Inputs | Claim + pattern |
| Persist | Thesis artifact + `proofPlan[0..2]` |
| Consumers | M4 paragraph points/jobs |
| Validity | Thesis ready; ≥1 proof note (prefer split UI: thesis then plans) |

### 10–13. Paragraph point, job, evidence, reasoning

| Field | Spec |
|---|---|
| Purpose | Body-paragraph plan parts (Module 4 — largely charter-aligned) |
| Persist | `student_buckets.buckets[]` fields `claim`, `paragraphRole`, `evidenceKeys`, `evidenceSnippets`, `reasoning`, `suggestionId` |
| Consumers | Outline cards (**must include job**), draft coaching |
| Validity | Existing mechanical gates (point≥15, job, ≥1 evidence, reasoning≥20) |
| Edit | Existing; mark outline/draft sections `needs_review` |

### 14. Outline order and sections

| Field | Spec |
|---|---|
| Purpose | Ordered essay map + conclusion plan |
| Inputs | Required M4 plans (+ jobs), thesis |
| Persist | `student_outlines.outline` extended: `body[].job`, `body[].paragraphIndex`, `body[].suggestionId?` |
| Validity | Thesis non-empty; ≥2 body cards with title+point; conclusion text |
| Edit | Reorder/edit; mark draft sections |

### 15. Draft sections

| Field | Spec |
|---|---|
| Purpose | Prose from outline |
| Inputs | Active outline section + point/job/evidence notes |
| Persist | `student_drafts` |
| Validity | Per-section non-empty before advance (new) |

### 16. Revision observations / decisions

| Field | Spec |
|---|---|
| Purpose | Later modules; out of immediate implementation |
| Note | Must consume draft + upstream provenance, not restart analysis |

---

## Invalidation / review policy

When artifact A is edited:

1. Do **not** silently rewrite student conclusions (claim, thesis, pattern choice text).
2. Mark dependent artifacts `needs_review` with reason codes (`upstream_rating_changed`, `evidence_removed`, …).
3. Show a review queue: “Your thesis still says X; your matrix now shows Y — keep or revise?”
4. Recompute **derived** options only; never auto-select a new pattern.

---

# Rhetorical-strategy matrix specification

## Placement decision

**Recommended home: Module 2 (canonical appeal evaluation), after notebook + rhetorical-situation readiness, interleaved with or immediately after one-cell evidence capture; pattern selection is the Module 2 exit into Module 3.**

### Why not Module 3 first?

Module 3 already owns grouping → idea → claim → thesis. Inserting six new ratings there would restart appeal analysis after evidence was “finished.”

### Why not Module 4/5?

Those modules consume a chosen direction; they should not invent the appeal matrix.

### Relationship to current T-charts

Today’s T-chart cell collects quote + why + audience + purpose **without** a provisional reliance rating or derived cross-work comparisons. The matrix **adds** ratings and transparent derivation. Implementation may:

- **Preferred:** one-cell microtask that (1) links/selects evidence, (2) rates reliance, (3) states audience function — retiring four simultaneous fields;
- **Migration:** hydrate evidence from `tchart_entries` / guided observations; ask for ratings in a second pass if evidence already exists.

---

## Microtask sequence

1. **Orientation + scale teaching** — What a 0–10 provisional judgment means (anchors); not scientific precision.
2. **Cell loop (×6):** for each `(sourceType, appeal)` in fixed order (speech ethos → speech pathos → speech logos → letter ethos → letter pathos → letter logos) **or** speech-then-letter per appeal (match current T-chart order for familiarity):
   - Dominant Q1: How strongly does King rely on this appeal in this work?
   - Dominant Q2: Which saved evidence best supports that evaluation? (or capture evidence if missing)
   - Dominant Q3: What does this appeal help King accomplish with this audience?
   - Reveal filled cell on matrix strip after each cell completes.
3. **Completed-matrix review** — Read-only 2×3 with provenance chips.
4. **Derived comparison options** — Show rule-based candidates with ratings/evidence.
5. **Student pattern choice** — Select option or “another pattern I notice.”
6. **Audience/purpose reasoning** — Why this direction fits the two situations.
7. **Revision** — Return to any cell; dependents marked needs_review.

One dominant question on screen at a time within the cell loop.

---

## Scale design

**Single rating (0–10) = rhetorical importance / centrality for persuading that work’s audience**, not raw frequency count and not aesthetic “quality.”

Anchors (charter):

| Score | Meaning |
|---:|---|
| 0 | Not meaningfully used |
| 3 | Limited or secondary |
| 5 | Clearly present |
| 7 | Strong and important |
| 10 | Central to how the audience is persuaded |

**Sufficiency of one dimension:** One rating is instructionally sufficient for v1 if always paired with evidence + audience-function note. Adding a second dimension (e.g. frequency vs importance) doubles cell cost; **defer** unless pilot shows systematic confusion between “shows up often” and “matters most.”

UI copy must state: provisional judgment; editable; not an objective measurement.

---

## Derived pattern rules (deterministic)

Let cells be `R[speech|letter][ethos|pathos|logos] ∈ 0..10 | null`.

**Preconditions:** Prefer all six rated. If missing ratings, still compute with available cells and flag gaps.

| Option kind | Rule (summary) | Provenance display |
|---|---|---|
| `largest_contrast` | Max \|R[speech][a]−R[letter][a]\| over appeals; ties → list all tied appeals | Show both ratings + linked evidence IDs |
| `meaningful_similarity` | Appeals where both ≥5 and \|diff\|≤2; pick highest min(R_s,R_l); tie → multi | Show both ratings |
| `dominant_per_work` | Argmax appeal per work; ties allowed | Show top score(s) |
| `secondary_present` | Appeals with 3≤R≤5 | Listed as secondary |
| `high_high` | Both works ≥7 on same appeal | — |
| `low_low` | Both ≤3 on same appeal | — |
| `high_low` | One ≥7 and other ≤3 | — |
| `missing_rating` | Any null | Block “complete” until filled or explicit skip policy |
| `rating_without_evidence` | Rated but no linked evidence (unless rating=0 with “none”) | Flag; allow intentional continue with cue |
| `student_created` | Free-text pattern | Student owns text; still store evidence picks |
| `contradictory_choice` | Student picks similarity while largest contrast ≫ similarity | Soft cue; allow override |

**Never** auto-write thesis text from these rules.

---

## Persistence

### Canonical cell IDs

`matrix:{assignmentId}:{sourceType}:{appeal}`  
Examples: `matrix:mlk:speech:ethos`, `matrix:mlk:letter:logos`

### Cell record

```ts
{
  id: string;                 // canonical cell ID
  schemaVersion: 1;
  sourceType: "speech" | "letter";
  appeal: "ethos" | "pathos" | "logos";
  rating: number | null;      // 0–10
  evidenceIds: string[];      // alias-aware evidence IDs
  functionNote: string;       // audience/purpose function
  updatedAt: string;
}
```

### Matrix + selection bundle (storage)

**Adopted implementation:** versioned JSON bundle (cells, selected pattern, audience/purpose reasoning) readable by Modules 3–6 without requiring Module 2 UI — typically via Module 2 artifact / student bucket flow state, **not** a dedicated production matrix table.

**Future production architecture (optional):** a dedicated table or Artifact Engine store if operational needs require it. Do not describe that table as current truth.

```ts
{
  schemaVersion: 1;
  cells: CellRecord[];
  selectedPattern: SelectedPattern | null;
  audiencePurposeReasoning: string;
}
```

### Migration from current M2/M3

| Legacy | Migration |
|---|---|
| `tchart_entries` | Create/link `evidence_record`; leave rating null until matrix pass |
| `student_observations` | Same via guided IDs + aliases |
| M3 `module3Patterns` | If matrix selection absent, keep legacy pattern path |
| Downstream | Prefer `selectedPattern`; fallback to current pattern artifact |

### Legacy fallback

If no matrix cells: Module 3 behaves as today. If cells without selection: show review CTA before claim. Never wipe M3/M4 saves.

---

## Downstream personalization map

| Stage | How matrix/selection appears |
|---|---|
| M3 connect / idea | Prefill prompts: “Because you rated… / selected…”; filter evidence IDs from provenance |
| M3 claim/thesis | Proof-direction starters tied to selected kind (contrast vs similarity vs trace appeal) |
| M4 point/job | Stronger job recommendations from pattern kind + proof slots; evidence coaching uses matrix-linked IDs |
| M4 evidence | Prefer linked evidence; reuse/alignment cues cite matrix |
| M5 order | Suggest order from pattern (e.g. contrast → speech then letter analysis then compare); student overrides |
| M6 draft | Dominant question = paragraph point; required context includes job + matrix provenance chip |
| Revision | needs_review when ratings/selection change |

---

## UI composition (matrix)

### Desktop

- Active cell workspace + thin accumulated matrix strip (filled cells green/ready; current blue; empty muted)
- Teacher rail: strategy + anchors + next step
- Provenance under recommendations

### Tablet

- Matrix strip above or below active task; two-column when space allows

### Mobile

- Single column; matrix as compact 2×3 chips (tap opens read-only cell); primary task full width; guidance below
- Never six rating inputs visible at once

---

## Upstream microtask sequence (implementation-ready summary)

| # | Dominant question | Student action | Saved | Gate |
|---|---|---|---|---|
| U0 | What does this rating mean? | Acknowledge anchors | orientation flag | Ack |
| U1–U6 | (per cell) How strongly…? / Which evidence…? / What does it accomplish…? | Rate → link evidence → note | cell record | rating + evidence rule + note |
| U7 | What does my completed matrix show? | Review | — | all cells complete |
| U8 | Which direction should my essay explore? | Choose derived option or custom | selectedPattern | choice |
| U9 | Why does this direction fit these audiences? | Short explanation | audiencePurposeReasoning | length |

Teacher guidance and next-step copy must change per step; recommendation cards always show provenance.

**Analytical vs language support:** Rating/evidence/function are analytical. Optional sentence openings only after the decision, never as the only path.

**Remain / change / remove / migrate**

| Current | Action |
|---|---|
| M2 save sources + situations | Remain (persist situation answers) |
| T-chart four-field cell | Change → matrix microtasks; migrate rows to evidence |
| Guided observations dual path | Remove as parallel canon or merge into evidence_record |
| M3 notice_patterns blank invent | Change → seed from derived options + allow custom |
| M1 quiz 10-up | Change (separate checkpoint) |
| M4 paragraph sequence | Remain foundation; add provenance consumers |
| M5 single page | Change (downstream roadmap) |

---

## Downstream revision roadmap (Modules 3–6)

### Module 3

| | Spec |
|---|---|
| New inputs | Matrix cells, selectedPattern, audiencePurposeReasoning |
| Unchanged | Connection/claim/thesis persistence shapes (extend, don’t replace blindly) |
| Obsolete | Pure invent-pattern as only path |
| UI | Pattern step shows provenance options; claim/thesis denser screens split |
| Gates | Pattern selection required before idea (with legacy fallback) |
| Review states | needs_review badges when matrix edits |
| Tests | Derivation; selection provenance; legacy fallback; no silent thesis rewrite |

### Module 4

| | Spec |
|---|---|
| New inputs | Pattern kind + matrix-linked evidence IDs |
| Unchanged | Point/job/evidence/reasoning gates and flow numbers (prefer) |
| UI | Job tips cite pattern; evidence pool prioritization |
| Tests | Recommendation provenance; override; continuity suites remain green |

### Module 5

| | Spec |
|---|---|
| New inputs | Jobs + suggested order from pattern |
| Persistence | `finalized` round-trip; body.job fields; hydrate-safe autosave |
| UI | Sequenced steps; Workspace parity |
| Gates | Mechanical outline completeness |
| Tests | Import filter wantThird; job preserved; finalize gates; mapper unit tests |

### Module 6

| | Spec |
|---|---|
| New inputs | Point + job + outline notes as required context |
| UI | Personalized dominant questions per section |
| Gates | Non-empty section advance |
| Tests | Section steps length; context chips; empty blocked |

---

## Compatibility note

Passing Module 4 checkpoints proved continuity/validity/dynamic-presentation foundations. Mission alignment **reuses** those foundations while allowing artifact-chain upgrades (especially job preservation and matrix provenance). Prior PASS ≠ permanent exemption from mission-driven revision.

## Canonical flow (current product)

```
Module 2: source observation → evidence records (legacy dual-read OK)
       → rhetorical-strategy matrix cells → derived options
       → student-selected direction + audience/purpose reasoning
Module 3: consume selection (or legacy invent path) → pattern/idea/claim/thesis
       → additive matrixProvenance / matrixReview; needs review on upstream change
Module 4: paragraph plans consume pattern provenance (jobs/evidence tips)
Module 5: outline preserves jobs; sequenced outline stages
Module 6–7: drafting/revision use writing representation; planning fades from prose
Module 8–9: export / APA / submission coaching (walkthrough WPs)
```

Students remain authors of Claim, Thesis, draft, and revision prose. Provenance is support and review metadata — never automatic essay generation.
