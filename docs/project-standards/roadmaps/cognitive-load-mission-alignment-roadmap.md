# Cognitive-load mission-alignment roadmap

| | |
|---|---|
| **Document role** | Executed checkpoint record + remaining verification roadmap |
| **Status (2026-07-14)** | Architecture package **reconciled**; CP-A–H **implementation largely complete**; live/manual acceptance still open for many instructional WPs |
| **Does not claim** | Beta-readiness, production-readiness, or market-ready shipping |
| **Depends on** | [Cognitive Load Charter](../cognitive-load-charter.md) · [Historical audit](../audits/cognitive-load-audit-modules-1-6.md) · [Writing-artifact decision architecture](../writing-artifact-decision-architecture.md) |
| **Authoritative issue status** | [Issue log](../walkthroughs/issue-log.md) |
| **Next phase** | Manual beta-readiness sweep guided by the [master walkthrough blueprint](../walkthroughs/master-walkthrough-blueprint.md) — **verification, not another broad redesign** |

> **Historical (superseded):** This document originally said “Implementation plan only — do not begin until architecture PASS.” That gate is obsolete. The checkpoint stream already ran on `observation-engine-redesign`. Keep the original checkpoint designs below as the planned shape; use the **Checkpoint implementation status** table for current truth.

**Automated baseline at docs freeze:** `1154/1154` on `tests/*.test.js` @ `f04ddbf`.

---

## Checkpoint implementation status (CP-A through CP-H)

Distinguish **code implemented** from **manual verification**. “Implemented (automated)” means commit + suite evidence; browser/human acceptance may still be **Needs Verification**.

| ID | Name | Implementation status | Primary evidence | Manual verification |
|---|---|---|---|---|
| **CP-A** | M1 load reduction (welcome/prompt/quiz path) | Implemented (automated) | `e314a31`, `a61c36d`, `f46be20`; WP-078 Resolved; WP-055 Needs Verification | Partial historical browser; re-verify on beta sweep |
| **CP-B** | Canonical evidence path + situation artifacts | Adopted with compatibility fallback | `7e102f0` evidence summary / reader path; dual T-chart+guided still readable | Needs current manual verification |
| **CP-C** | Rhetorical matrix + pattern selection | Implemented (automated) | `7e102f0`; `tests/module2-cpc-rhetorical-matrix.test.js` | Needs current manual verification |
| **CP-D0** | Module 5 persistence safety | Folded into CP-F | Persistence/hydrate safety lands with `06bbb67` (not a separate production ship commit) | Covered with M5 sweep |
| **CP-D** | Module 3 matrix handoff + argument building | Implemented (automated) | `f04ddbf`; `tests/module3-cpd-matrix-handoff.test.js` + build/evaluate helper suites | Needs current manual verification |
| **CP-E** | Module 4 provenance consumers | Implemented (automated) | `ff19654` | Needs current manual verification |
| **CP-F** | Module 5 sequenced outline + job-preserving map | Implemented (automated) | `06bbb67` | Needs current manual verification |
| **CP-G** | Module 6 personalized drafting + gates | Implemented (automated) | `41cfa00`, `9182967` | Needs Verification (WP-073–077 and related) |
| **CP-H** | Success surfaces + a11y/responsive polish | Implemented (automated) for M5/M6 success/polish scope | `680f14d` | Needs current manual verification; app-wide a11y/production readiness remains future |

Related app-wide instructional work **outside** the original CP letters (WP-048–063) is tracked in the issue log: most **Needs Verification**; WP-063 planning-support fade **Resolved** in `1b25ee2`.

---

## Guiding rules for phases

1. Work **upstream → downstream** so later modules never depend on missing artifacts.
2. Prefer **few substantial checkpoints** with automated sub-gates.
3. Reuse Module 4 continuity, validity, responsive, and dynamic-presentation foundations.
4. No black-box AI grading; deterministic provenance only.
5. ~~Preserve unrelated dirty Module 3 / walkthrough files unless a checkpoint explicitly owns them.~~ **Superseded (2026-07-14):** Module 3 CP-D and this architecture package are now committed; do not reintroduce that pause as an active constraint.

---

## Checkpoint map (overview)

| ID | Name | Prerequisite | Rollback boundary |
|---|---|---|---|
| **CP-A** | Mission docs freeze + M1 load reduction (prompt/quiz sequencing) | Docs PASS | Revert M1 routes only |
| **CP-B** | Canonical evidence path + situation artifacts | CP-A or parallel after docs | M2 evidence APIs |
| **CP-C** | Rhetorical matrix microtasks + derivation + pattern selection | CP-B | Module 2 matrix bundle only; M3 legacy fallback |
| **CP-D0** | Module 5 persistence safety (optional parallel) | Docs PASS | outlines API/helper only |
| **CP-D** | Module 3 consumes matrix/selection | CP-C | M3 pattern/claim UI + hydration |
| **CP-E** | Module 4 provenance consumers (jobs/evidence tips) | CP-C, CP-D | M4 helpers/UI only; flow numbers stable |
| **CP-F** | Module 5 sequenced outline + job-preserving map | CP-E, CP-D0 | M5 + mapper; M6 still reads body |
| **CP-G** | Module 6 personalized section drafting + gates | CP-F | M6 presentation/gates |
| **CP-H** | Success surfaces + a11y/responsive polish sweep | CP-G | Presentation only |

---

## CP-A — M1 cognitive-load reductions

### Scope
- Sequence prompt breakdown to one dominant question per screen.
- Sequence vocabulary quiz to one (or small set) item per screen with completeness gate.
- Keep video as optional/prior context, not simultaneous with all items.

### Files likely affected
`app/modules/1/prompt/page.js`, `components/ModuleOne.js`, Module 1 APIs/tests if present.

### Persistence / migration risk
Low — same tables; possibly add `prompt_step` ephemeral or flow index.

### Automated tests
- Prompt step advance/back; paraphrase gate unchanged threshold.
- Quiz requires all answered; empty submit blocked.
- Saved payloads unchanged shape.

### Browser checks (Cursor)
- 390px and 1440px: one question visible; primary CTA reachable.

### Human judgment
- Whether quiz chunking feels motivating vs tedious.

### Definition of done
Charter screen questions 1–8 pass for M1 prompt and quiz; suites green; no M2+ changes.

---

## CP-B — Canonical evidence + situation artifacts

### Scope
- Declare one durable evidence pipeline (T-chart **or** merged evidence_record).
- Quarantine/redirect legacy APA `/modules/2/source` & `/letter` from main path.
- Persist rhetorical-situation answers as reusable summary artifact.
- Alias-aware IDs remain.

### Files likely affected
`app/modules/2/**`, `lib/module2/**`, observation/tchart APIs, M3 evidence loaders, nav.

### Persistence / migration risk
**High** — dual `tchart_entries` + `student_observations`. Must map both into canonical reader without wiping rows.

### Automated tests
- Reader returns union without duplicate alias cards.
- Situation summary round-trip.
- Legacy rows still hydrate M3.
- Write-safety: viewing does not upsert.

### Browser checks
- Main M2 exit path never lands on APA form.
- Evidence appears once in M3 review.

### Human judgment
- Acceptable temporary UX while guided path is merged/retired.

### Definition of done
Single evidence reader used by M3; situation summary visible beside later tasks; dual-canon critical finding closed or explicitly time-boxed with fallback.

---

## CP-C — Rhetorical matrix + pattern selection (upstream core)

### Scope
Implement architecture matrix microtasks U0–U9 in Module 2:
- scale teaching;
- one-cell-at-a-time rating + evidence link + function note;
- gradual matrix reveal;
- derived options with provenance;
- student pattern choice + audience/purpose reasoning;
- revision without silent downstream rewrites.

### Files likely affected
New `lib/module2/matrix*` helpers/UI; Module 2 page/wizard; persistence bundle; seeds; M3 hydration fallback hooks (read-only).

### Persistence / migration risk
**High** — new schemaVersioned bundle; migrate evidence links from T-chart/guided; never delete M3 patterns.

### Automated tests (mandatory)
- Derivation: contrast, similarity, dominant, ties, missing, no-evidence flags.
- Provenance strings include exact ratings + evidence IDs.
- Selection override / student_created path.
- Edit cell → dependents `needs_review` (unit), no auto thesis change.
- Legacy: no matrix → M3 unchanged behavior.
- Mobile/desktop layout contracts (one cell; matrix strip chips).
- Read/write safety on review.

### Browser checks
- Complete two cells; matrix strip fills; recommendations show numbers.
- 320/390/768/1440 widths: no six inputs at once; no horizontal overflow.

### Human judgment
- Anchor wording clarity; whether one rating dimension suffices; order of cells (appeal-major vs work-major).

### Definition of done
All six cells completable; selection saved; provenance visible; tests green; M3 still works via fallback.

---

## CP-D0 — Module 5 persistence safety (optional parallel)

### Scope
- Persist `finalized` through outlines API/helper.
- Hydrate flag before autosave.
- Do **not** redesign M5 UI here.

### Files
`app/api/outlines/route.js`, `lib/supabase/helpers/studentOutlines.ts`, `components/ModuleFive.js` (hydrate guard only).

### Tests
- finalized round-trip; autosave does not clear finalized; no empty POST before hydrate.

### Definition of done
Lock-on-revisit works when finalized; no UI charter fix claimed yet.

---

## CP-D — Module 3 consumes matrix/selection

### Scope
- Pattern step offers derived options + custom.
- Idea/claim/thesis show “because you…” provenance.
- Split densest screens (review filters progressive; claim vs starters; thesis vs proof plan).
- needs_review when matrix/selection changes.

### Files
`components/module3/**`, `lib/module3/**`, pattern/claim/thesis APIs.

### Persistence risk
Medium — extend flow_state; keep legacy patterns.

### Tests
- Options render from fixture matrix.
- Custom pattern allowed.
- Upstream edit marks review, does not rewrite thesis text.
- Existing connect/evaluate suites remain green.

### Human judgment
- Density of claim screen after split.

### Definition of done
Happy path uses selectedPattern; legacy path intact; charter 1–8 improved on pattern/claim/thesis.

---

## CP-E — Module 4 provenance consumers

### Scope
- Job recommendations + evidence prioritization cite selectedPattern / matrix-linked IDs.
- Keep flow step numbers and mechanical gates.
- Optional: reduce dual response on point scaffold.

### Files
`lib/module4/*PointJob*`, evidence coaching, `ModuleFour.js` presentation.

### Tests
- Full Module 4 CP1–6 suites remain green.
- New provenance tip tests; override still works.

### Definition of done
Transparent personalization on job/evidence; no persistence shape break.

---

## CP-F — Module 5 outline redesign + job-preserving map

### Scope
- Extend mapper: preserve `job` (+ optional `suggestionId`, `paragraphIndex`).
- Re-filter import with `wantThirdBucket`.
- Sequence: thesis → order cards → edit one card → conclusion → review/finalize.
- Mechanical finalize gates.
- WorkspaceCenter/Guide parity with M4.

### Files
`mapStudentBucketsToOutline.ts`, `ModuleFive.js`, outlines API, success page, tests.

### Persistence risk
Medium — additive outline fields; M6 must tolerate missing job on legacy outlines.

### Tests
- Real `outlineBodyFromStudentBuckets` unit tests.
- wantThird true/false.
- Finalize gates.
- Job present on cards.
- M6 `buildDraftSectionSteps` length unchanged for N bodies.

### Browser checks
- One active outline job at a time; mobile stack; DnD or explicit reorder controls accessible.

### Definition of done
Critical M5 multi-decision and job-drop findings closed; mapping tests call real mapper.

---

## CP-G — Module 6 personalized drafting

### Scope
- Dominant question uses paragraph point; required context shows job + outline notes.
- Per-section non-empty gate.
- Collapse shelf to active section by default.

### Files
`ModuleSix.js`, `module6StepPresentation.js`, `ModuleSixStepFrame.jsx`, shelf.

### Tests
- Gate blocks empty next.
- Presentation includes point/job when present.
- Legacy outlines without job still draft.

### Definition of done
Body drafting no longer feels like restart; gates mechanical only.

---

## CP-H — Success + a11y/responsive sweep

### Scope
- M5/M6 success read-only summaries (artifact maps).
- Accessible names for delete/drag/tabs; focus; status not color-only.
- Layout contracts 320–1440.

### Tests
- Success read no-write.
- A11y label contracts; layout contracts.

### Definition of done
Success quality comparable to M3/M4; checklist from charter Q11–Q12 pass.

---

## Upstream redesign (detail pointer)

Full microtask copy, gates, and UI rules: **Matrix + Upstream sections** in  
`writing-artifact-decision-architecture.md` (U0–U9, placement, derivation, persistence).

CP-C implements that spec; CP-B prepares evidence prerequisites.

---

## Downstream personalization summary

| Module | Personalizes from |
|---|---|
| 3 | selectedPattern + cell provenance → pattern/claim/thesis prompts |
| 4 | pattern kind + linked evidence → job tips + evidence priority |
| 5 | jobs + suggested order from pattern kind |
| 6 | point + job + outline notes as required context |

---

## Verification matrix (how Cursor should test)

| Concern | Automated | Browser | Human |
|---|---|---|---|
| Derivation / ties / missing | Yes | Spot-check | Anchors clarity |
| Provenance strings | Yes | Yes | Wording tone |
| Legacy fallback | Yes | Yes | — |
| needs_review without silent rewrite | Yes | Yes | — |
| Mobile one-cell / no overflow | Contracts + browser | Yes | Visual polish |
| Write-on-read safety | Yes | — | — |
| Mapper / finalize / section gates | Yes | Yes | — |
| Instructional density | — | — | **Required** |

---

## Historical approval gate *(superseded — decisions recorded)*

> Originally titled “Smallest human approvals needed before implementation.” The gate ran; the implementation stream followed. Keep this as the dated decision record — not as an active blocker.

### Decisions made (2026 checkpoint stream)

1. **Architecture package** — charter + audit + decision architecture + roadmap treated as adopted guidance for the implementation stream (this freeze reconciles docs to code).
2. **Matrix placement** — rhetorical-strategy matrix lives in **Module 2**; selection is the M2→M3 handoff (`7e102f0`, `f04ddbf`).
3. **Rating model** — single provisional rating dimension with anchored scale for v1 (frequency-vs-importance split deferred).
4. **CP-D0** — Module 5 persistence safety folded into **CP-F** rather than blocking matrix work.
5. **Canonical evidence** — matrix-first with **dual-read compatibility fallback** (T-chart + guided still hydrate); hard wipe/merge of legacy stores was not required for CP-C/D.

---

## Historical non-goals until PASS *(superseded)*

> Originally titled “Explicit non-goals until PASS.” These were constraints **before** architecture acceptance. They are **not** active instructions.

- ~~Do not implement the matrix.~~ → Implemented in Module 2 (`7e102f0`).
- ~~Do not alter production flows, persistence, migrations, seeds, or step numbers.~~ → Checkpoints intentionally altered approved surfaces; avoid unrelated churn during **verification**.
- ~~Do not resume prior Module 5 Checkpoint 1 UI redesign.~~ → Persistence/sequencing shipped via CP-F; further redesign only if beta sweep opens a new issue.
- ~~Do not stage unrelated Module 3 dirty files or the walkthrough blueprint.~~ → Module 3 CP-D committed (`f04ddbf`); this architecture package ships the remaining docs.

---

## Beta-readiness handoff (next phase)

The next phase is **verification**, not another broad redesign.

1. Freeze implementation changes except narrowly scoped FAIL follow-ups.
2. Confirm clean branch + automated baseline (`1154/1154` @ freeze commit).
3. Perform a bounded but complete student-path manual sweep (see blueprint).
4. Record PASS/FAIL evidence in the issue log.
5. Open narrowly scoped follow-up issues for failures.
6. Then decide whether the next **external beta** can begin.

**Manual sweep will later need to cover:** fresh/reset and returning-student paths; backward/forward navigation; Modules 1→9; 390×844 and 1440×900; source access and matrix reasoning; artifact continuity; drafting/revision prose; Google Doc create/update/recovery; APA learning/formatting; PDF selection/check/upload; final success and dashboard; accessibility basics; recovery/error states; no horizontal overflow; no stale or duplicate documents.

Passing automated tests is **necessary** but **not sufficient** for beta-readiness or production-readiness.
