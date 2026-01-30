# Data Map (Current Implementation)

This document lists each major module or page and the data it reads or writes.
If something is unclear or missing, it is marked as **UNCERTAIN**.

Important note about progress:
Progress is authoritative in `student_assignments.current_module` for the active assignment.
Progress can be advanced in two ways:
1) Success pages advance progress via `advanceCurrentModuleOnSuccess`.
2) `/api/activity/log` can also advance progress defensively based on the module in the activity event.

Local caching note:
Some Module 2 pages use user scoped `localStorage` keys via `lib/storage/studentCache.ts` using a prefix like `wp:{email}:...`.
Dev reset clears these user scoped keys.

## Student Dashboard (`/dashboard`)
- Reads (Supabase): `student_assignments` (select `*`, filtered by `user_email` and assignment where applicable), `student_exports` (select `*`, filters `module = 9`, `kind = "final_pdf"`)
- Writes (Supabase): `student_assignments` (upsert on first start, sets `assignment_name`, `current_module`, `status`, `started_at`)
- localStorage: none
- Progress: uses `student_assignments.current_module` to label and route the main Continue button

## Modules Landing (`/modules`)
- Reads (Supabase): `student_assignments` (select `id`, filter `user_email`, `assignment_name`)
- Writes (Supabase): `student_assignments` (insert or update), `student_activity_log` (via activity logging)
- localStorage: none
- Progress: can initialize assignment state if needed

## Module 1 (`/modules/1`)
- Reads (Supabase): none
- Writes (Supabase): `module1_quiz_results` (`user_email`, `score`, `total`, `answers`), `student_activity_log` (module started, quiz submitted, module completed)
- localStorage: none
- Progress: module completion is recorded by Module 1 success page and possibly by activity log

## Module 1 Success (`/modules/1/success`)
- Reads: none
- Writes (Supabase): advances `student_assignments.current_module` via `advanceCurrentModuleOnSuccess` (to at least 2)
- Progress: advances forward only, never regresses

## Module 2 Entry (`/modules/2`)
- Reads (Supabase): none
- Writes (Supabase): `student_activity_log` (module started)
- localStorage: none
- Progress: module completion is recorded by Module 2 success page and possibly by activity log

## Module 2 Source Speech (`/modules/2/source`)
- Reads (Supabase): `module2_sources` (`mlk_url`, `mlk_text`, `mlk_site_name`, `mlk_transcript_year`, `mlk_citation`)
- Writes (Supabase): `module2_sources` (speech fields only, preserves letter fields), `student_activity_log` (speech source saved, transcript saved, citation saved)
- localStorage: user scoped keys via `makeStudentKey(email, ["mlk","module2",...])` as a fallback only
- Progress: none directly, content is persisted for later modules

## Module 2 Source Letter (`/modules/2/letter`)
- Reads (Supabase): `module2_sources` (`lfbj_*` fields and may read `mlk_*` fields to preserve)
- Writes (Supabase): `module2_sources` (letter fields only, preserves speech fields)
- localStorage: user scoped keys via `makeStudentKey(email, ["mlk","module2",...])` as a fallback only
- Progress: none directly, content is persisted for later modules

## Module 2 T Charts (`/modules/2/tcharts`)
- Reads (Supabase): **UNCERTAIN** (may rely on existing saved entries, depends on implementation)
- Writes (Supabase): `tchart_entries` via `/api/tchart/save`
- localStorage: legacy keys may exist in some components, but goal is to keep data in Supabase; verify as needed
- Progress: module completion is recorded by Module 2 success page and possibly by activity log

## Module 2 Success (`/modules/2/success`)
- Reads: none
- Writes (Supabase): advances `student_assignments.current_module` via `advanceCurrentModuleOnSuccess` (to at least 3)
- Progress: advances forward only, never regresses

## Module 3 Thesis (`/modules/3`)
- Reads (Supabase): `module3_responses` (`responses`, `thesis`, `updated_at`)
- Writes (Supabase): `module3_responses`, `student_activity_log` (module started, step viewed, thesis saved, module completed)
- localStorage: none
- Progress: module completion is recorded by Module 3 success page and possibly by activity log

## Module 3 Success (`/modules/3/success`)
- Reads: none
- Writes (Supabase): advances `student_assignments.current_module` via `advanceCurrentModuleOnSuccess` (to at least 4)
- Progress: advances forward only, never regresses

## Module 4 Buckets (`/modules/4`)
- Reads (Supabase): `tchart_entries`, `bucket_groups`, `module3_responses`
- Writes (Supabase): `bucket_groups`, `student_activity_log`
- localStorage: none
- Progress: module completion is recorded by Module 4 success page and possibly by activity log

## Module 4 Success (`/modules/4/success`)
- Reads: none
- Writes (Supabase): advances `student_assignments.current_module` via `advanceCurrentModuleOnSuccess` (to at least 5)
- Progress: advances forward only, never regresses

## Module 5 Outline (`/modules/5`)
- Reads (Supabase): `student_outlines` (module 5), `module3_responses`, `bucket_groups`
- Writes (Supabase): `student_outlines`, `student_activity_log`
- localStorage: none
- Progress: module completion is recorded by Module 5 success page and possibly by activity log

## Module 5 Success (`/modules/5/success`)
- Reads: none
- Writes (Supabase): advances `student_assignments.current_module` via `advanceCurrentModuleOnSuccess` (to at least 6)
- Progress: advances forward only, never regresses

## Module 6 Drafting (`/modules/6`)
- Reads (Supabase): `student_outlines` (module 5), `tchart_entries`, `student_drafts` (module 6)
- Writes (Supabase): `student_drafts`, `student_activity_log`
- localStorage: none
- Progress: module completion is recorded by Module 6 success page and possibly by activity log

## Module 6 Success (`/modules/6/success`)
- Reads: none
- Writes (Supabase): advances `student_assignments.current_module` via `advanceCurrentModuleOnSuccess` (to at least 7)
- Progress: advances forward only, never regresses

## Module 7 Revision and Read Aloud (`/modules/7`)
- Reads (Supabase): `student_drafts` (module 7, fallback to module 6), `student_readaloud` or similar if implemented
- Writes (Supabase): `student_drafts`, `student_readaloud` (if separate table), `student_activity_log`
- localStorage: `chosenMicId` (device preference)
- Progress: module completion is recorded by Module 7 success page and possibly by activity log

## Module 7 Success (`/modules/7/success`)
- Reads: none
- Writes (Supabase): advances `student_assignments.current_module` via `advanceCurrentModuleOnSuccess` (to at least 8)
- Progress: advances forward only, never regresses

## Module 8 Final Polish (`/modules/8`)
- Reads (Supabase): `student_drafts` (modules 7 and 8)
- Writes (Supabase): `student_drafts`, `student_activity_log`
- localStorage: none
- Progress: module completion is recorded by Module 8 success page and possibly by activity log

## Module 8 Success (`/modules/8/success`)
- Reads: none
- Writes (Supabase): advances `student_assignments.current_module` via `advanceCurrentModuleOnSuccess` (to at least 9)
- Progress: advances forward only, never regresses

## Module 9 APA and Submission (`/modules/9`)
- Reads (Supabase): exported doc record, `student_drafts` (final text)
- Writes (Supabase): `module9_quiz`, export to docs tables, `student_exports` (final pdf), `student_activity_log`
- localStorage: none
- Progress: module completion is recorded by Module 9 success page and possibly by activity log

## Module 9 Success (`/modules/9/success`)
- Reads: none
- Writes (Supabase): advances `student_assignments.current_module` via `advanceCurrentModuleOnSuccess` (to at least 10)
- Progress: advances forward only, never regresses

## Module 10 Teacher Dashboard (`/modules/10`)
- Reads (Supabase): `student_assignments`, `module_scores` (if used), `module9_quiz`, `student_activity_log`, `student_exports`
- Writes (Supabase): none
- localStorage: none

## Module 10 Student Detail (`/modules/10/student/[email]`)
- Reads (Supabase): `module1_quiz_results`, `module9_quiz`, `student_drafts`, `student_outlines`, `student_exports`, `student_activity_log`
- Writes (Supabase): none
- localStorage: none

## Key API Routes

### `POST /api/tchart/save`
- Writes (Supabase): `tchart_entries`

### `POST /api/export-to-docs`
- Writes (Supabase): exported doc tracking table

### `GET /api/role`
- Reads (Supabase): `app_roles`

### `POST /api/activity/log`
- Writes (Supabase): `student_activity_log`
- Progress: may advance `student_assignments.current_module` defensively based on module number in the event

### `POST /api/dev/reset-student` (dev only)
- Deletes (Supabase): clears current user rows across core tables, including assignment progress
- Also clears user scoped localStorage keys in the browser via the dev reset button