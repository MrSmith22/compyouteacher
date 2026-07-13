# Student writing record standard (minimum durable fields)

This standard guides Module 1 integrity work now and CP-E–H later. It is the
minimum record shape so assessment, grading, reporting, and future AI feedback
can reconstruct what a student did.

## Required fields (conceptual)

| Field | Purpose |
|---|---|
| Student identity | Stable user email / account id |
| Assignment identity | Which assignment produced the work |
| Module and step | Where in the sequence the artifact belongs |
| Artifact type | e.g. prompt breakdown, quiz attempt, pattern, claim |
| Artifact content | The student writing / answers / selections |
| Source / provenance | Evidence links, matrix direction, upstream signatures |
| Schema / content version | Which activity version produced the record |
| Created / updated / submitted timestamps | When work happened and was confirmed |
| Completion / readiness state | Whether the artifact satisfies its gate |
| Review state | Upstream-dependency review flags when applicable |
| Attempt identity | Distinguishes retries from the current result |

## Reconstruction goals

Downstream systems must be able to answer:

- What did the student write?
- What evidence did they use?
- What decisions did they make?
- Which version of the activity produced the record?
- What changed over time (attempt history)?

## Module 1 application (this repair)

- Prompt breakdown: durable row in `module1_prompt_breakdown` with the five
  canonical fields and timestamps.
- Quiz: **every attempt** is stored in `module1_quiz_results` (append-only).
  The current result is the latest attempt by `submitted_at` / `created_at`.
- Quiz content version: `quiz_version` (additive column; see migration).
- Completion: `/api/module1/complete` advances progression only after the
  readiness predicate confirms prompt + current quiz artifacts.

## Module 4 upstream-signature bookkeeping (CP-E)

Additive `flow_state.module4UpstreamSignature` may record which Module 3
matrix direction Module 4 coaching last confirmed against. Rules:

- **No write-on-read.** Opening Module 4, loading provenance, or deriving
  recommendations must not POST.
- **Baseline on first legitimate save.** New work establishes the current
  ready signature only when the student edits Module 4 work or Continue/Back
  intentionally persists progress.
- **Mismatch notice.** If a saved signature differs from the current ready
  upstream signature, show a quiet notice; keep the old signature until the
  student explicitly acknowledges. Passive reload must not clear the notice
  or POST.
- **Legacy plans without a signature.** Do not claim an upstream change.
  Establish a baseline only on the next student save (or acknowledgement).
- **`needs_review`.** Keep Module 3 confirmation guidance; never persist that
  signature as confirmed.

## Module 5 outline import / upstream change (CP-F)

Additive outline body fields carry Module 4 paragraph identity (`sourceParagraphIndex`,
`job`, `point`, `evidence`, `reasoning`, `sourceSignature`) while keeping legacy
`bucket` / `points` for Module 6.

- **First import:** create each required mechanically planned paragraph once.
- **Reload:** resume the saved Module 5 outline; never duplicate cards.
- **Upstream Module 4 change:** preserve Module 5 edits/order/conclusion; show
  which source paragraphs changed; apply updates only on explicit student action.
- **No write-on-read** when comparing upstream signatures.

## Module 6 draft sections / drafting position (CP-G)

Module 6 stores prose on `student_drafts` (`module = 6`):

- **`sections`:** ordered string array — Introduction, body paragraphs in Module 5
  order, Conclusion. Never invents a third body. Never stores metadata or job
  labels as prose.
- **`full_text`:** server-derived as `sections.join("\\n\\n")`. Clients must not
  be trusted as the authority for `full_text`.
- **`locked`:** only explicit Finish may set `true`. Autosave and navigation omit
  the lock field so a finalized draft cannot be unlocked by ordinary writes.
- **`draft_meta` (jsonb, additive):** drafting UI metadata only —
  `schemaVersion`, `currentSectionIndex` / `currentStageId`,
  `sourceOutlineSignature`, `completedSectionIds`, outline-review flags.
  Never put student prose in `draft_meta`.
- **`draft_revision` (bigint, additive):** monotonic CAS revision incremented
  on every accepted atomic write via `write_module6_draft_atomic`.

### Outline → draft mapping

Intro + each finalized Module 5 body card (preserving order, point, job,
evidence, reasoning, `sourceParagraphIndex`) + conclusion. UI may add a
non-prose Review stage before Finish.

### Upstream Module 5 change

If the drafting-relevant outline signature changes after drafting begins:
preserve every draft section; do not silently add/remove/reorder/rewrite prose;
show a review notice with a link to Module 5; require an explicit student
decision before treating the new signature as baseline.

### Module 7

Module 7 continues to consume Module 6 `sections[]` / `full_text` only. Additive
`draft_meta` and job fields on outline cards must not appear as prose.

Do not redesign Modules 2–9 in this pass; apply this standard at each later
checkpoint when that module’s persistence is touched.
