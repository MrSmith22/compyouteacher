# Supabase Helper Layer Spec (Option A)

Goal: Stop writing raw Supabase queries all over the app. Create a small, reusable helper layer that components and API routes call consistently.

## Principles
- One place to read/write each kind of data.
- Never silently swallow Supabase errors.
- Always key by `user_email` (current system) and later we can migrate to `user_id`.
- Keep existing tables working, do not break current flows.

## File locations (target)
- `lib/supabase/` (or `lib/db/`)
  - `client.ts` (create client once)
  - `assignments.ts`
  - `module2.ts`
  - `drafts.ts`
  - `activity.ts`

## Helpers to implement

### 1) Assignment progress and resume path
**Function:** `upsertAssignmentResume({ userEmail, assignmentName, resumePath }): Promise<{ ok, row }>`
- Table: `student_assignments`
- Behavior:
  - If row exists (user_email + assignment_name), update `resume_path`, `current_module`, `status`, `updated_at`
  - If not, insert a new row
- Notes:
  - Derive `current_module` from resumePath like `/modules/2/tcharts` => 2
  - Always return the saved row
  - Never return "matched 0 rows" as success

**Function:** `getAssignmentResume({ userEmail, assignmentName }): Promise<{ ok, row }>`
- Table: `student_assignments`
- Returns resume_path and status fields

### 2) Module 2 sources (speech + letter)
**Function:** `getModule2Sources({ userEmail }): Promise<{ ok, row }>`
- Table: `module2_sources`
- Returns: `mlk_url, mlk_text, mlk_site_name, mlk_transcript_year, mlk_citation, lfbj_url, lfbj_text, lfbj_site_name, lfbj_transcript_year, lfbj_citation`

**Function:** `upsertModule2SpeechSource({ userEmail, ...speechFields }): Promise<{ ok }>`
- Updates ONLY speech columns without wiping letter columns (preserve existing letter data)

**Function:** `upsertModule2LetterSource({ userEmail, ...letterFields }): Promise<{ ok }>`
- Updates ONLY letter columns without wiping speech columns (preserve existing speech data)

### 3) Module 2 rhetorical T-Chart entries
**Function:** `saveTChartEntries({ userEmail, entries }): Promise<{ ok }>`
- Table: `tchart_entries` (or current table used by `/api/tchart/save`)
- Each entry includes:
  - category: ethos/pathos/logos
  - type: speech/letter
  - quote
  - observation
  - letter_url (if applicable)
- Behavior:
  - Use upsert strategy so repeated saves overwrite the same logical entry
  - The unique key should be (user_email, category, type) if possible

**Function:** `getTChartEntries({ userEmail }): Promise<{ ok, rows }>`
- Returns all rows for the student, ordered by category then type

### 4) Drafts and final text
**Function:** `getStudentDraft({ userEmail, module }): Promise<{ ok, row }>`
- Table: `student_drafts`
- Used in Modules 6-9

**Function:** `upsertStudentDraft({ userEmail, module, fields }): Promise<{ ok, row }>`
- Must not break Module 8 locking behavior
- Should support fields:
  - full_text
  - final_text
  - final_ready
  - revised
  - updated_at

### 5) Activity logging
**Function:** `logStudentActivity({ userEmail, eventType, meta }): Promise<{ ok }>`
- Table: `student_activity` (or current activity table)
- Stores:
  - user_email
  - event_type
  - module
  - meta JSON
  - created_at

## Cursor Implementation Notes
- Cursor should implement these helpers without changing UI behavior.
- Components and API routes should be refactored to call helpers only (no raw `.from()` calls in pages/components).
- Add minimal unit-like checks where possible (simple runtime guards, not a full test suite yet).

