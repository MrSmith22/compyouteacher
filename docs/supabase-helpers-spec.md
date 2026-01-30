# Supabase Helper Layer Spec (Option A)

Goal:
Stop writing raw Supabase queries all over the app.
Create a small, reusable helper layer that components and API routes call consistently.

## Principles
- One place to read and write each kind of data.
- Never silently swallow Supabase errors in helpers.
- Always key by `user_email` (current system). Later we can migrate to `user_id`.
- Keep existing tables working and do not break current flows.
- Progress is authoritative in `student_assignments.current_module`.
- Progress only moves forward and must never regress.

## File locations (target)
- `lib/supabase/`
  - `helpers/` for domain helpers
  - `admin/` for server only service role client
  - `client/` for browser anon client
- `lib/storage/` for user scoped local fallback caching utilities

## Helpers to implement or maintain

### 1) Assignment progress
Source of truth:
- Table: `student_assignments`
- Key: `user_email` plus `assignment_name`

Required helpers:
- `getStudentAssignment({ userEmail, assignmentName })`
- `upsertStudentAssignment({ userEmail, assignmentName, patch })`
- `advanceCurrentModuleOnSuccess({ userEmail, assignmentName, completedModuleNumber })`
  - Must set `current_module` to `max(existing, completedModuleNumber + 1)`
  - Must never decrease `current_module`

### 2) Activity logging and defensive progress updates
Tables:
- `student_activity_log` for audit trail
- `student_assignments` for progress

Helpers and routes:
- `logStudentActivity({ userEmail, action, module, metadata })`
- API route `POST /api/activity/log`
  - Inserts into `student_activity_log`
  - May defensively advance `student_assignments.current_module` based on module number, forward only

### 3) Module 2 sources
Table:
- `module2_sources`

Helpers:
- `getModule2Sources({ userEmail })`
- `upsertModule2SpeechSource({ userEmail, ...speechFields })`
  - Updates only speech columns and preserves existing letter data
- `upsertModule2LetterSource({ userEmail, ...letterFields })`
  - Updates only letter columns and preserves existing speech data

Local fallback:
- If a page needs local fallback caching, it must be user scoped via `makeStudentKey(email, parts)`.

### 4) Module 2 T Chart entries
Table:
- `tchart_entries`

Helpers:
- `saveTChartEntries({ userEmail, entries })`
  - Prefer upsert strategy so repeated saves overwrite the same logical entry
- `getTChartEntries({ userEmail })`

### 5) Buckets
Table:
- `bucket_groups`

Helpers:
- `getBucketGroups({ userEmail })`
- `upsertBucketGroups({ userEmail, buckets, reflection })`

### 6) Outlines
Table:
- `student_outlines`

Helpers:
- `getStudentOutline({ userEmail, module })`
- `upsertStudentOutline({ userEmail, module, outline, finalized })`

### 7) Drafts and final text
Table:
- `student_drafts`

Helpers:
- `getStudentDraft({ userEmail, module })`
- `upsertStudentDraft({ userEmail, module, patch })`
  - Must preserve lock and final ready behavior

### 8) Exports and submissions
Tables:
- `student_exports`
- exported docs tracking table

Helpers:
- `getFinalPdfExport({ userEmail })`
- `upsertStudentExport({ userEmail, module, kind, ... })`

## Dev reset spec
API route:
- `POST /api/dev/reset-student` in development only
- Must only reset the signed in user
- Must clear progress tables, including `student_assignments`
- Front end dev reset button must clear user scoped localStorage keys and reload