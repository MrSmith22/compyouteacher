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

Do not redesign Modules 2–9 in this pass; apply this standard at each later
checkpoint when that module’s persistence is touched.
