# Data Plan Draft (AI Ready)

## Purpose
Define the core student work artifacts we store, why we store them, and how AI will use them later.

## Design Principles
- Store student work in Supabase as the source of truth.
- Keep progress authoritative in `student_assignments.current_module`.
- Progress only moves forward and should never regress.
- Log student actions for auditability in `student_activity_log`.
- Use localStorage only as a user scoped, best effort fallback for resilience, never as the system of record.
- Use consistent keys for all rows: `user_email`, `assignment_name` when relevant, `module` when relevant, timestamps.
- Prefer helper functions for all Supabase reads and writes to reduce duplicated logic.
- Keep dev reset safe and scoped to signed in user and development mode only.

## Current Tables (Core)
- `student_assignments`
  - Purpose: authoritative assignment state and progress.
  - Key fields: `user_email`, `assignment_name`, `current_module`, `status`, timestamps.
- `student_activity_log`
  - Purpose: audit trail of student actions, optional defensive progress signal.
  - Key fields: `user_email`, `action`, `module`, `metadata`, `created_at`.
- `module2_sources`
  - Purpose: raw source URLs, text, citation metadata for MLK speech and Letter from Birmingham Jail.
- `tchart_entries`
  - Purpose: ethos, pathos, logos comparisons, quotes and observations.
- `module3_responses`
  - Purpose: thesis building work and responses.
- `bucket_groups`
  - Purpose: grouping ideas into buckets and reflection for Module 4.
- `student_outlines`
  - Purpose: outline structure for Module 5.
- `student_drafts`
  - Purpose: drafting, revision, final text state for Modules 6 to 8.
- `module9_quiz`
  - Purpose: APA quiz results.
- `student_exports`
  - Purpose: final PDF upload and related metadata for submission.
- `student_readaloud` (if separate table)
  - Purpose: read aloud audio metadata and URLs.

## Target Long Term Shape (Draft)
Long term, we want a normalized and AI friendly model that can represent any student artifact in a consistent way while still allowing module specific tables when needed.

Proposed core concept: a unified artifacts table or a consistent artifact envelope.

Example envelope fields:
- `user_email`
- `assignment_name`
- `module`
- `step`
- `artifact_type` (source, tchart, thesis, bucket, outline, draft, revision_note, audio, quiz_result, export)
- `content` (text or structured JSON)
- `metadata` (JSON for citations, rubric signals, UI context)
- `created_at`, `updated_at`

This structure is AI friendly because it supports:
- retrieving all student work chronologically
- retrieving a specific artifact type for targeted coaching
- storing multiple versions of a single artifact over time

## AI Interaction Logging (Future)
Add a coaching or grading interaction log table for auditability and replay:
- `user_email`
- `assignment_name`
- `module`, `step`
- `artifact_snapshot` (what student work was used as input)
- `prompt_template_id` (or version)
- `model` and parameters (optional)
- `response` (AI output)
- `scores` (optional rubric aligned JSON)
- `created_at`

Key rule: AI logs must be append only and never overwrite past interactions.