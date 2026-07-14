# Cognitive-load audit — Modules 1–6

> **Historical snapshot — not current product state.**  
> This audit was taken on **2026-07-12** against branch `observation-engine-redesign` @ commit **`6c378b8`**.  
> Many ranked findings were later addressed by checkpoints CP-A–H, Module 1–3 work, and walkthrough WPs.  
> **Do not treat the tables below as today’s backlog.** For current status use:
>
> - [Issue log](../walkthroughs/issue-log.md) (authoritative WP status)
> - [Mission-alignment roadmap](../roadmaps/cognitive-load-mission-alignment-roadmap.md) (checkpoint implementation status)
> - [Master walkthrough blueprint](../walkthroughs/master-walkthrough-blueprint.md) (beta-readiness handoff)
> - [Writing-artifact decision architecture](../writing-artifact-decision-architecture.md) (adopted vs fallback decisions)
>
> Original findings remain below **for traceability** so contributors can see why the implementation stream existed. Do not rewrite this document into present tense as if every “missing” finding is still open.

**Charter:** [cognitive-load-charter.md](../cognitive-load-charter.md)  
**Audit date:** 2026-07-12  
**Branch inspected:** `observation-engine-redesign` @ `6c378b8`  
**Note on working tree (historical):** At audit time, unrelated dirty Module 3 files were left unstaged; the audit used committed Module 4 plus on-disk Module 5/6. That dirty-tree constraint is **superseded** as of the Module 3 CP-D commit `f04ddbf` (2026-07-14).

## Baseline automated suites *(historical — audit snapshot)*

Command (non-mutating; as run on audit day):

```bash
node --test \
  tests/module4-checkpoint6-polish.test.js \
  tests/module4-dynamic-review-success.test.js \
  tests/module4-plan-artifact-helpers.test.js \
  tests/module4-validity-helpers.test.js \
  tests/module4-point-job-helpers.test.js \
  tests/module4-handoff-flow.test.js \
  tests/module4-evidence-continuity.test.js \
  tests/module4-saved-evidence-continuity.test.js \
  tests/build-argument-helpers.test.js \
  tests/evaluate-strength-helpers.test.js
```

**Historical result at `6c378b8`:** `202` pass, `0` fail.  
*(Do not replace this figure with later suite totals. Current automated baseline as of docs freeze `f04ddbf` is `1154/1154` on `tests/*.test.js` — see the blueprint and roadmap.)*

**True at audit snapshot only:** No Module 5–dedicated suite existed at `6c378b8`. Mapping continuity was asserted only via Module 4 tests that mocked the M5 card shape. Later work added Module 5/6 CP-F/G/H coverage; verify current files under `tests/` rather than assuming this sentence still holds.

Browser automation was not required for this documentation checkpoint. Human visual/instructional judgment remains necessary for matrix UX and density.

---

## Ranking criteria

Findings ranked by composite of:

1. Instructional harm (charter screen-contract failures)
2. Frequency on the happy path
3. Continuity risk (artifact lost / restart feel)
4. Implementation dependency (blocks personalization)
5. Opportunity to personalize later work

Severity: **Critical** / **High** / **Medium** / **Low**

---

## Whole-app ranked findings (top 20)

| Rank | Sev | Locus | Finding |
|---:|---|---|---|
| 1 | Critical | M2 dual evidence paths | T-charts and guided observations both durable; M3 merges both namespaces. No single canonical evidence pipeline. |
| 2 | Critical | No rhetorical-strategy matrix | 2×3 appeal work exists as quote-collection cells, not provisional ratings + transparent derived comparisons. |
| 3 | Critical | M5 single page | Thesis + reorder/edit all bodies + two conclusion fields + preview = many independent decisions. |
| 4 | Critical | M4→M5 job drop | `paragraphRole` ignored in `outlineBodyFromStudentBuckets`; organizational decisions vanish before outlining/drafting. |
| 5 | Critical | M1 quiz | Ten MC items on one screen; submit allows empties; weak mastery gate. |
| 6 | High | M5 finalize | No mechanical content gates; empty outline can unlock M6. |
| 7 | High | M5 `finalized` | Client sends `finalized: true`; API/`upsertStudentOutline` ignore it. |
| 8 | High | M6 body drafting | Generic question; no paragraph point/job as dominant context; feels like restart. |
| 9 | High | M6 section gates | No non-empty section gate before next/finish. |
| 10 | High | M1 prompt breakdown | Five assignment-decode questions on one screen. |
| 11 | High | M3 review_evidence | Filters + select + name + lenses stack multiple decisions. |
| 12 | High | M3 develop_claim | Dense multi-panel builder; language scaffolds compete with analytical decision. |
| 13 | High | Personalization gap | Few transparent “because you…” links from ratings/choices; M4 job/recommendation is the rare exception. |
| 14 | High | M5 autosave race | Debounced save can fire before hydrate. |
| 15 | Medium | M3 thesis + proof plan | Thesis writing + three plan slots on one screen. |
| 16 | Medium | M4 point scaffold | Radio pick + textarea = two response modes. |
| 17 | Medium | M4 reflection | Compare prompts + reflection + finish; reflection unused downstream. |
| 18 | Medium | M2 situation answers | Completion timestamp saved; answers not reusable artifacts. |
| 19 | Medium | Static shelves | M4/M6 shelves often show maximum context, not required context. |
| 20 | Medium | Legacy M2 APA routes | `/modules/2/source` & `/letter` still present; premature citation drafting. |

---

## Module 1

### M1 · Prompt breakdown (`/modules/1/prompt`)

| Field | Value |
|---|---|
| Dominant question | Break down what this essay is asking |
| Thinking operation | Decode assignment (5 sub-decisions) |
| Required context | Full prompt |
| Displayed | Prompt often under Need Help |
| Response | 4 MC + paraphrase |
| Saved | `module1_prompt_breakdown` |
| Next consumer | M1 Step 2 sidebar paraphrase |
| Personalization | Reload only |
| Revision | Overwrite |
| Gate | MC + paraphrase ≥25 |
| Composition | Drafting desk; mobile stacks |
| Violations | **High** multi-decision; **Medium** prompt not always primary |
| Correction | One question per screen; prompt always visible |

### M1 · Vocabulary + quiz (`/modules/1`)

| Field | Value |
|---|---|
| Dominant question | Learn words for later analysis |
| Thinking operation | Acquire + check vocabulary |
| Response | Video + **10** selects |
| Saved | `module1_quiz_results` |
| Gate | Weak (empty allowed) |
| Violations | **Critical** 10 decisions; **High** weak gate |
| Correction | One item (or small set) per screen; require completeness |

### M1 · Success

Low charter risk; advances module.

---

## Module 2

### Wizard stages 0–6 (`/modules/2`)

| Step | Dominant | Artifact | Gate | Charter note |
|---|---|---|---|---|
| 0 Get ready | Orient | None | CTA | Low |
| 1 Trust sources | Multi-select trust | Ephemeral | Soft check | Medium ephemeral |
| 2–3 Save speech/letter | Paste sources | `module2_sources` | Persist verify | Strong one-job |
| 4 Notebook complete | Confirm | Sources | Both ready | Low |
| 5 Meet situations | One Q at a time | Timestamp only | Correctness on early Qs | **Medium:** answers not reusable |
| 6 Begin reading | Transition | resume → tcharts | Sources ready | Low |

### M2 · T-charts (`/modules/2/tcharts`) — primary applied E/P/L work

| Field | Value |
|---|---|
| Dominant (per phase) | Find appeal in one work → why → audience → purpose |
| Thinking | Identify + explain appeal |
| Saved | `tchart_entries` (2 texts × 3 appeals) |
| Gate | All fields per text; both texts per appeal |
| Matrix? | **Approximated as 6 cells, not ratings matrix** |
| Violations | **Medium** four subfields (mitigated by phases); **Critical architecture** dual path with guided |

### M2 · Guided observations (parallel)

Six fixed passages; four fields; `student_observations`. **Critical** if both paths remain canonical.

### M2 · Legacy `/source`, `/letter`, form

**Critical/High** — APA drafting + multi-job; quarantine from main path.

---

## Module 3

Phases (`MODULE_THREE_PHASES`): `review_evidence` → `notice_patterns` → `explore_idea` → `connect_evidence` → (`evaluate_strength` / `gather_more_evidence`) → `develop_claim` → `turn_claim_into_thesis`

| Phase | One decision? | Artifact | Main violation |
|---|---|---|---|
| review_evidence | No — filter+select+name | Cluster | High density |
| notice_patterns | Partial | Patterns + selection | Medium multi-op |
| explore_idea | Mostly (progressive) | Idea | Low–Medium |
| connect_evidence | Mostly one-quote focus | evidenceMap | Low |
| evaluate_strength | Stacked metacognition | Mostly ephemeral | Medium |
| develop_claim | Dense | Claim | High density / language scaffolds |
| thesis + proof plan | Two ops | Thesis + proofPlan | Medium |

**Strength:** Explicit anti-restart framing toward Module 4; both-works readiness gate before claim.

**Gap:** No appeal-rating matrix feeding transparent pattern options; pattern noticing is student-invented without derived contrast/similarity from ratings.

---

## Module 4

Durable steps (`FLOW_VERSION` 3): handoff(0) → pattern recovery(3) → P1 point(4)/job(5)/evidence(6)/reasoning(7) → P2(8–11) → third(12) → P3(13–16) → reflection(17)

| Area | Charter fit |
|---|---|
| Point→job→evidence→reasoning | **Strong** one-job sequence + mechanical gates |
| Handoff / final review / success stages | **Strong** dynamic workspace language |
| Job recommendation | Transparent, overridable personalization |
| Point scaffold radio+textarea | Medium dual response mode |
| Evidence shelf density | Medium max-context |
| Reflection unused in M5 | Medium fragmentation |
| Job lost at M5 boundary | **Critical continuity** (downstream) |

---

## Module 5

No durable step numbers. One page: thesis + DnD body cards + conclusion + preview + finish.

| Field | Value |
|---|---|
| Violations | **Critical** multi-decision static form; **High** no content gates; **High** finalized not persisted; **High** job/provenance drop; **Medium** autosave race |
| Composition | `max-w-4xl` document, not WorkspaceCenter/Guide |
| Correction | Sequenced outline microtasks; carry job; gates; design-system parity |

Success page: static card (pre–M3/M4 success quality).

---

## Module 6

`buildDraftSectionSteps`: intro + N body + conclusion. Workspace drafting frame.

| Area | Charter fit |
|---|---|
| One section at a time | Strong |
| Need Help thesis/outline | Good required context |
| Body dominant question | **High** — generic, ignores saved point/job |
| Section emptiness gate | **High** — missing |
| Shelf density | Medium |
| Continuity copy | Present but undercut by lost job |

---

## Cognitive-load failure classes observed

1. Multiple independent decisions on one screen (M1 quiz/prompt, M3 review/claim, M5 whole page)
2. Remembering off-screen work (situation answers; jobs after M4)
3. Irrelevant / maximum shelf context
4. Full matrix/form too early (M1 quiz; M5 outline; no true ratings matrix yet)
5. Data collected but unused (M4 reflection; M2 situation answers)
6. Recommendations without provenance (scarce outside M4 job tip)
7. Downstream restart feel (M5 worksheet; M6 generic body prompts)
8. Language scaffolds before analytical decision (claim starters density)
9. Steps with weak reusable artifacts (trust check; soft quiz)
10. Unclear purpose screens (legacy APA)

---

## Files inspected (summary)

Module 1–3: `ModuleOne.js`, `app/modules/1/**`, Module 2 wizard/tcharts/guided/legacy routes, `ModuleThreeV2Form.jsx`, `components/module3/**`, `lib/module3/**`  
Module 4–6: `ModuleFour.js`, `components/module4/**`, `lib/module4/**`, `ModuleFive.js`, `app/modules/5/**`, outlines API/helpers, `ModuleSix.js`, `components/module6/**`  
Charter saved this checkpoint: `docs/project-standards/cognitive-load-charter.md`

---

## Implications for matrix placement

Module 2 already owns the **Speech/Letter × Ethos/Pathos/Logos** evidence cells. Module 3 owns pattern → claim → thesis. The charter matrix (ratings + evidence + audience function + derived comparisons + student pattern choice) should therefore live **in Module 2 after notebook/situation readiness**, as the analytical evaluation layer over (or interleaved with) evidence cells, with **pattern selection as the Module 2→3 handoff artifact**—not as a Module 5 or Module 4 invention.
