# Data Map (Current Implementation)

This document lists each major module/page and the data it reads or writes.
If something is unclear, it is marked as **uncertain**.

## Student Dashboard (`/dashboard`)
- Reads: `student_assignments`, `student_exports` (module 9, kind = final_pdf)
- Writes: `student_assignments` (upsert when missing)
- localStorage: none
- Data status: `student_assignments` = in-progress; `student_exports` = final

## Modules Landing (`/modules`)
- Reads: `student_assignments` (check existing row)
- Writes: `student_assignments` (insert/update), `student_activity_log` (module_started via `logActivity`)
- localStorage: none
- Data status: `student_assignments` = in-progress; `student_activity_log` = final (append-only log)

## Module 1 (`/modules/1`)
- Reads: none
- Writes: `module1_quiz_results` (quiz submission), `student_activity_log` (module_started, quiz_submitted, module_completed)
- localStorage: none
- Data status: `module1_quiz_results` = final; `student_activity_log` = final (append-only log)

## Module 1 Success (`/modules/1/success`)
- Reads: none
- Writes: none
- localStorage: none
- Data status: n/a

## Module 2 Entry (`/modules/2`)
- Reads: none
- Writes: `student_activity_log` (module_started)
- localStorage: none
- Data status: `student_activity_log` = final (append-only log)

## Module 2 Source (Speech) (`/modules/2/source`)
- Reads: `module2_sources` (mlk_* fields), localStorage fallback
- Writes: `module2_sources` (upsert), `student_activity_log` (speech_source_saved, speech_transcript_saved, speech_citation_saved)
- localStorage: `mlk_speech_url`, `mlk_speech_text`, `mlk_speech_site_name`, `mlk_speech_year`, `mlk_speech_citation`
- Data status: `module2_sources` = in-progress; localStorage = draft; `student_activity_log` = final

## Module 2 Source (Letter) (`/modules/2/letter`)
- Reads: `module2_sources` (lfbj_* fields), localStorage fallback
- Writes: `module2_sources` (upsert)
- localStorage: `mlk_letter_url`, `mlk_letter_text`, `mlk_letter_site_name`, `mlk_letter_year`, `mlk_letter_citation`
- Data status: `module2_sources` = in-progress; localStorage = draft

## Module 2 T-Charts (`/modules/2/tcharts`)
- Reads: localStorage only
- Writes: `tchart_entries` (via `/api/tchart/save`)
- localStorage: `mlk_speech_url`, `mlk_speech_text`, `mlk_letter_url`, `mlk_letter_text`,
  `tchart_ethos_speech_quote`, `tchart_ethos_speech_note`, `tchart_ethos_letter_quote`, `tchart_ethos_letter_note`,
  `tchart_pathos_speech_quote`, `tchart_pathos_speech_note`, `tchart_pathos_letter_quote`, `tchart_pathos_letter_note`,
  `tchart_logos_speech_quote`, `tchart_logos_speech_note`, `tchart_logos_letter_quote`, `tchart_logos_letter_note`
- Data status: `tchart_entries` = in-progress; localStorage = draft

## Module 2 Form (Legacy) (`/modules/2/form`)
- Reads: `tchart_entries`
- Writes: `tchart_entries`
- localStorage: none
- Data status: `tchart_entries` = in-progress

## Module 2 Success (`/modules/2/success`)
- Reads: none
- Writes: none
- localStorage: none
- Data status: n/a

## Module 3 (Thesis) (`/modules/3`)
- Reads: `module3_responses`
- Writes: `module3_responses` (autosave + submit), `student_activity_log` (module_started, thesis_step_viewed, thesis_saved, module_completed)
- localStorage: none
- Data status: `module3_responses` = in-progress (no explicit final flag); `student_activity_log` = final

## Module 3 Success (`/modules/3/success`)
- Reads: none
- Writes: none
- localStorage: none
- Data status: n/a

## Module 4 (Buckets) (`/modules/4`)
- Reads: `tchart_entries`, `bucket_groups`, `module3_responses`
- Writes: `bucket_groups` (autosave), `student_activity_log` (module_started, buckets_autosaved, bucket_created, bucket_item_added, bucket_extra_idea_added, module_completed)
- localStorage: none
- Data status: `bucket_groups` = in-progress; `student_activity_log` = final

## Module 4 Success (`/modules/4/success`)
- Reads: none
- Writes: none
- localStorage: none
- Data status: n/a

## Module 5 (Outline) (`/modules/5`)
- Reads: `student_outlines` (module 5), `module3_responses` (thesis), `bucket_groups`
- Writes: `student_outlines` (autosave + finalize), `student_activity_log` (module_started, outline_autosaved, module_completed)
- localStorage: none
- Data status: `student_outlines` = in-progress; becomes final when `finalized = true`; `student_activity_log` = final

## Module 5 Success (`/modules/5/success`)
- Reads: none
- Writes: none
- localStorage: none
- Data status: n/a

## Module 6 (Drafting) (`/modules/6`)
- Reads: `student_outlines` (module 5, finalized), `tchart_entries`, `student_drafts` (module 6)
- Writes: `student_drafts` (autosave + mark complete), `student_activity_log` (module_started, draft_autosaved, module_completed)
- localStorage: none
- Data status: `student_drafts` = in-progress; becomes final when `locked = true`; `student_activity_log` = final

## Module 6 Success (`/modules/6/success`)
- Reads: none
- Writes: none
- localStorage: none
- Data status: n/a

## Module 7 (Revision + Read Aloud) (`/modules/7`)
- Reads: `student_drafts` (module 6, module 7)
- Writes: `student_drafts` (module 7), `student_activity_log` (module_started, revision_saved, recording_started, recording_saved, recording_failed, module_completed)
- Storage: `student-audio` bucket (audio uploads)
- localStorage: `chosenMicId`
- Data status: `student_drafts` = in-progress; becomes final when `final_ready = true`; audio uploads = in-progress/final **uncertain**

## Module 7 Success (`/modules/7/success`)
- Reads: none
- Writes: none
- localStorage: none
- Data status: n/a

## Module 8 (Final Polish) (`/modules/8`)
- Reads: `student_drafts` (module 7, module 8)
- Writes: `student_drafts` (module 8), `student_activity_log` (module_started, module_completed)
- localStorage: none
- Data status: `student_drafts` = final when `final_ready = true`

## Module 8 Success (`/modules/8/success`)
- Reads: none
- Writes: none
- localStorage: none
- Data status: n/a

## Module 9 (APA + Submission) (`/modules/9`)
- Reads: `exported_docs`, `student_drafts` (module 7 or 6)
- Writes: `module9_quiz`, `exported_docs` (via `/api/export-to-docs`), `student_exports`, `student_activity_log` (module_started, quiz_submitted, pdf_uploaded)
- Storage: `final-pdfs` bucket (PDF uploads)
- localStorage: none
- Data status: `module9_quiz` = final; `exported_docs` = final; `student_exports` = final; `student_activity_log` = final

## Module 9 Success (`/modules/9/success`)
- Reads: none
- Writes: none
- localStorage: none
- Data status: n/a

## Module 10 (Teacher Dashboard) (`/modules/10`)
- Reads: `student_assignments`, `module_scores`, `module9_quiz`, `student_activity_log`, `student_exports`
- Writes: none
- localStorage: none
- Data status: n/a (read-only view)

## Module 10 Student Detail (`/modules/10/student/[email]`)
- Reads: `module1_quiz_results`, `module9_quiz`, `student_drafts`, `student_outlines`, `student_exports`, `student_activity_log`
- Writes: none
- localStorage: none
- Data status: n/a (read-only view)
