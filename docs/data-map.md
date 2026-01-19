# Data Map (Current Implementation)

This document lists each major module/page and the data it reads or writes.
If something is unclear or missing, it is marked as **UNCERTAIN**.

## Student Dashboard (`/dashboard`)
- Reads (Supabase): `student_assignments` (select `*`), `student_exports` (select `*`, filters `module = 9`, `kind = "final_pdf"`)
- Writes (Supabase): `student_assignments` (upsert: `user_email`, `assignment_name`, `current_module`, `status`, `started_at`)
- localStorage: none
- Progress/resume: uses `student_assignments.current_module` + `status`; no `resume_path` writes observed

## Modules Landing (`/modules`)
- Reads (Supabase): `student_assignments` (select `id`, filter `user_email`, `assignment_name`)
- Writes (Supabase): `student_assignments` (insert/update: `user_email`, `assignment_name`, `current_module`, `status`), `student_activity_log` (via `logActivity`: `user_email`, `action`, `module`, `metadata`)
- localStorage: none
- Progress/resume: sets `current_module = 1` and `status = "in progress"`; no `resume_path` writes observed

## Module 1 (`/modules/1`)
- Reads (Supabase): none
- Writes (Supabase): `module1_quiz_results` (`user_email`, `score`, `total`, `answers`), `student_activity_log` (module_started, quiz_submitted, module_completed)
- localStorage: none
- Progress/resume: none observed

## Module 2 Entry (`/modules/2`)
- Reads (Supabase): none
- Writes (Supabase): `student_activity_log` (module_started)
- localStorage: none
- Progress/resume: none observed

## Module 2 Source (Speech) (`/modules/2/source`)
- Reads (Supabase): `module2_sources` (`mlk_url`, `mlk_text`, `mlk_site_name`, `mlk_transcript_year`, `mlk_citation`)
- Writes (Supabase): `module2_sources` (`user_email`, `mlk_url`, `mlk_text`, `mlk_site_name`, `mlk_transcript_year`, `mlk_citation`, `updated_at`), `student_activity_log` (speech_source_saved, speech_transcript_saved, speech_citation_saved)
- localStorage: `mlk_speech_url`, `mlk_speech_text`, `mlk_speech_site_name`, `mlk_speech_year`, `mlk_speech_citation`
- Progress/resume: none observed

## Module 2 Source (Letter) (`/modules/2/letter`)
- Reads (Supabase): `module2_sources` (`lfbj_url`, `lfbj_text`, `lfbj_site_name`, `lfbj_transcript_year`, `lfbj_citation`; also reads `mlk_*` fields to preserve existing speech data)
- Writes (Supabase): `module2_sources` (`user_email`, `lfbj_url`, `lfbj_text`, `lfbj_site_name`, `lfbj_transcript_year`, `lfbj_citation`, plus existing `mlk_*` fields, `updated_at`)
- localStorage: `mlk_letter_url`, `mlk_letter_text`, `mlk_letter_site_name`, `mlk_letter_year`, `mlk_letter_citation`
- Progress/resume: none observed

## Module 2 T-Charts (`/modules/2/tcharts`)
- Reads (Supabase): none
- Writes (Supabase): `tchart_entries` via `/api/tchart/save` (`user_email`, `category`, `type`, `quote`, `observation`, `letter_url`, `updated_at`)
- localStorage: `mlk_speech_url`, `mlk_speech_text`, `mlk_letter_url`, `mlk_letter_text`,
  `tchart_ethos_speech_quote`, `tchart_ethos_speech_note`, `tchart_ethos_letter_quote`, `tchart_ethos_letter_note`,
  `tchart_pathos_speech_quote`, `tchart_pathos_speech_note`, `tchart_pathos_letter_quote`, `tchart_pathos_letter_note`,
  `tchart_logos_speech_quote`, `tchart_logos_speech_note`, `tchart_logos_letter_quote`, `tchart_logos_letter_note`
- Progress/resume: none observed

## Module 2 Form (Legacy) (`/modules/2/form`)
- Reads (Supabase): `tchart_entries` (uses `category`, `letter_url`, and fields like `speech_note`, `letter_note`, `speech_quotes`, `letter_quotes` — **UNCERTAIN** schema match)
- Writes (Supabase): `tchart_entries` (`user_email`, `category`, `type`, `observation`, `quote`, `letter_url`, `updated_at`)
- localStorage: none
- Progress/resume: none observed

## Module 3 (Thesis) (`/modules/3`)
- Reads (Supabase): `module3_responses` (`responses`, `thesis`, `updated_at`)
- Writes (Supabase): `module3_responses` (`user_email`, `responses`, `thesis`, `updated_at`), `student_activity_log` (module_started, thesis_step_viewed, thesis_saved, module_completed)
- localStorage: none
- Progress/resume: none observed

## Module 4 (Buckets) (`/modules/4`)
- Reads (Supabase): `tchart_entries` (select `*`), `bucket_groups` (select `*`, uses `buckets`, `reflection`), `module3_responses` (`responses`, `thesis`)
- Writes (Supabase): `bucket_groups` (`user_email`, `buckets`, `reflection`, `updated_at`), `student_activity_log` (module_started, buckets_autosaved, bucket_created, bucket_item_added, bucket_extra_idea_added, module_completed)
- localStorage: none
- Progress/resume: none observed

## Module 5 (Outline) (`/modules/5`)
- Reads (Supabase): `student_outlines` (`outline`, `finalized`, filters `module = 5`), `module3_responses` (`thesis`), `bucket_groups` (`buckets`)
- Writes (Supabase): `student_outlines` (`user_email`, `module`, `outline`, `updated_at`, `finalized`), `student_activity_log` (module_started, outline_autosaved, module_completed)
- localStorage: none
- Progress/resume: none observed

## Module 6 (Drafting) (`/modules/6`)
- Reads (Supabase): `student_outlines` (`outline`, `finalized`, module 5), `tchart_entries` (select `*`), `student_drafts` (`sections`, `locked`, module 6)
- Writes (Supabase): `student_drafts` (`user_email`, `module`, `sections`, `full_text`, `locked`, `updated_at`), `student_activity_log` (module_started, draft_autosaved, module_completed)
- localStorage: none
- Progress/resume: none observed

## Module 7 (Revision + Read Aloud) (`/modules/7`)
- Reads (Supabase): `student_drafts` (`full_text`, `revised`, `final_ready`, `audio_url`, module 7; fallback to module 6 `full_text`)
- Writes (Supabase): `student_drafts` (`user_email`, `module`, `full_text`, `final_text`, `revised`, `final_ready`, `audio_url`, `updated_at`), `student_activity_log` (module_started, revision_saved, recording_started, recording_saved, recording_failed, module_completed)
- localStorage: `chosenMicId`
- Progress/resume: none observed

## Module 8 (Final Polish) (`/modules/8`)
- Reads (Supabase): `student_drafts` (`full_text`, `final_text`, `final_ready`, modules 7 and 8)
- Writes (Supabase): `student_drafts` (`user_email`, `module`, `full_text`, `final_text`, `revised`, `final_ready`, `updated_at`), `student_activity_log` (module_started, module_completed)
- localStorage: none
- Progress/resume: none observed

## Module 9 (APA + Submission) (`/modules/9`)
- Reads (Supabase): `exported_docs` (`web_view_link`), `student_drafts` (`final_text` from module 7 or `full_text` from module 6)
- Writes (Supabase): `module9_quiz` (`user_email`, `score`, `total`, `submitted_at`), `exported_docs` (via `/api/export-to-docs`: `user_email`, `document_id`, `web_view_link`), `student_exports` (`doc_id`, `user_email`, `module`, `kind`, `file_name`, `storage_path`, `public_url`, `web_view_link`, `uploaded_at`), `student_activity_log` (module_started, quiz_submitted, pdf_uploaded)
- localStorage: none
- Progress/resume: none observed

## Module 10 (Teacher Dashboard) (`/modules/10`)
- Reads (Supabase): `student_assignments` (select `*`), `module_scores` (select `*` — **UNCERTAIN** columns), `module9_quiz` (select `*`), `student_activity_log` (select `*`), `student_exports` (select `*`, filter `kind = "final_pdf"`)
- Writes (Supabase): none
- localStorage: none
- Progress/resume: none observed

## Module 10 Student Detail (`/modules/10/student/[email]`)
- Reads (Supabase): `module1_quiz_results` (`score`, `total`, `created_at`), `module9_quiz` (`score`, `total`, `submitted_at`), `student_drafts` (`module`, `full_text`, `final_text`, `final_ready`, `updated_at`), `student_outlines` (`module`, `outline`, `finalized`, `updated_at`), `student_exports` (`module`, `file_name`, `public_url`, `uploaded_at`, `kind`), `student_activity_log` (`action`, `module`, `metadata`, `created_at`)
- Writes (Supabase): none
- localStorage: none
- Progress/resume: none observed

## Key API Routes

### `POST /api/tchart/save`
- Reads (Supabase): none
- Writes (Supabase): `tchart_entries` (`user_email`, `category`, `type`, `quote`, `observation`, `letter_url`, `updated_at`)
- localStorage: none
- Progress/resume: none observed

### `POST /api/export-to-docs`
- Reads (Supabase): none
- Writes (Supabase): `exported_docs` (`user_email`, `document_id`, `web_view_link`)
- localStorage: none
- Progress/resume: none observed

### `GET /api/role`
- Reads (Supabase): `app_roles` (`role`, filter `user_email`)
- Writes (Supabase): none
- localStorage: none
- Progress/resume: none observed

### `POST /api/assignments/resume`
- File missing in workspace: **UNCERTAIN**
- Reads/Writes: **UNCERTAIN**
- localStorage: none
- Progress/resume: **UNCERTAIN**


