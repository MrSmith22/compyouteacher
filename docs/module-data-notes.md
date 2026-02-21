# Module Data Notes (Modules 1–9)

Purpose: Document what each module collects, why it exists instructionally, and what teachers need to see in the dashboard.

Source of truth: This document should match current code behavior.

---

# Module 1 – Ethos, Pathos, Logos Quiz

## Student Actions
- Watch instructional video
- Complete 10-question quiz
- Submit responses

## Teacher Intent
- Early low-stakes checkpoint
- Diagnostic for rhetorical vocabulary understanding
- Identifies misconceptions before deeper analysis begins

This evaluates concept readiness, not writing skill.

## Data Created

### Table: module1_quiz_results
- user_email
- score
- total
- raw_answers
- submitted_at

### Additional Logging
Table: student_activity_log
- module_started
- quiz_submitted
- module_completed

## What Teachers Need
Minimum:
- Percent score for gradebook

Preferred:
- Per-question correctness view
- Identify misunderstanding of ethos vs pathos vs logos

## Instructional Notes
Incorrect answers signal conceptual gaps that should be addressed before students move forward.

Future improvement:
Store per-question correctness flags for easier remediation and AI feedback.

---

# Module 2 – Source Gathering (Speech & Letter)

## Student Actions
For both:
- Locate full transcript
- Paste transcript URL
- Paste full transcript text
- Extract citation elements
- Construct APA reference

## Teacher Intent
- Teach source literacy
- Ensure students work from complete primary texts
- Practice citation structure
- Prevent analysis of incomplete or unreliable sources

## Data Created

### Table: module2_sources

Speech:
- user_email
- mlk_url
- mlk_text
- mlk_site_name
- mlk_transcript_year
- mlk_citation
- timestamps

Letter:
- lfbj_url
- lfbj_text
- lfbj_site_name
- lfbj_transcript_year
- lfbj_citation
- timestamps

Stored together keyed by user_email.

### Logging
student_activity_log:
- module_started
- speech_saved
- letter_saved
- module_completed

## What Teachers Need
- Verify legitimate full transcripts
- Spot citation errors early
- Confirm source accuracy before analysis

## Instructional Notes
This module is completion-based but foundational.

Common issues:
- Using summaries instead of transcripts
- Incorrect publication year
- APA formatting errors

Transcript storage is a long-term strategic AI asset.

---

# Module 2 – T-Charts (Comparative Rhetorical Analysis)

## Student Actions
- Select quotes for Ethos, Pathos, Logos (speech and letter)
- Write explanations for each
- Save and submit

12 total analytical entries.

## Teacher Intent
- Move from vocabulary recognition to interpretive reasoning
- Practice selecting evidence
- Explain rhetorical appeals
- Compare genre differences

## Data Created

### Table: tchart_entries
- user_email
- category (ethos | pathos | logos)
- speech_quote
- speech_explanation
- letter_quote
- letter_explanation
- timestamps

## What Teachers Need
- Quality of explanation
- Strength of evidence selection
- Misidentification patterns

## AI Value
Quote + explanation pairs are high-value coaching inputs.

---

# Module 2 – Success Page

## Student Actions
- Completion confirmation
- Advance to Module 3

## Data Impact
- Advances student_assignments.current_module
- Logs module_completed

No new artifacts created.

---

# Module 3 – Thesis Construction

## Student Actions
- Identify audience and purpose for both texts
- Explain rhetorical appeals tied to audience and purpose
- Select thesis organization pattern
- Write full comparative thesis

## Teacher Intent
- Transition from analysis to argument
- Teach audience-aware reasoning
- Build defensible thesis

## Data Created

### Table: module3_responses
- user_email
- speech_audience
- speech_purpose
- letter_audience
- letter_purpose
- appeal responses (12 fields)
- thesis_choice
- final_thesis_text
- timestamps

## What Teachers Need
- Alignment between analysis and thesis
- Detect persistent misunderstandings
- Evaluate claim quality

---

# Module 4 – Buckets (Pre-Outline Organization)

## Student Actions
- Review thesis and analysis
- Create paragraph buckets
- Assign evidence to buckets
- Add supporting ideas
- Write reflection

## Teacher Intent
- Teach idea grouping
- Move from isolated evidence to paragraph-level thinking
- Prepare for outline construction

## Data Created

### Table: bucket_groups
- user_email
- bucket_title
- linked_analysis_ids
- supporting_ideas
- reflection_text
- timestamps

## What Teachers Need
- Strength of paragraph concepts
- Evidence balance
- Logical grouping quality

This module captures structural thinking.

---

# Module 5 – Outline Construction

## Student Actions
- Revise thesis
- Rename buckets as topic sentences
- Edit and reorder paragraphs
- Add supporting details
- Plan conclusion
- View Roman numeral preview

## Teacher Intent
- Teach argument architecture
- Separate structure from prose
- Prevent drafting chaos

## Data Created

### Table: student_outlines
- user_email
- module (5)
- thesis_text
- ordered_paragraphs (JSON)
- conclusion_summary
- conclusion_final_thought
- timestamps

## What Teachers Need
- Structural alignment
- Logical paragraph sequence
- Supporting detail sufficiency

---

# Module 6 – First Draft

## Student Actions
- Write full introduction
- Write body paragraphs
- Write conclusion
- Mark draft complete

## Teacher Intent
- Turn outline into prose
- Practice paragraph construction
- Produce baseline draft

## Data Created

### Table: student_drafts (module = 6)
- user_email
- full_text or structured sections
- timestamps

## What Teachers Need
- Draft completeness
- Evidence integration
- Structural execution

This becomes baseline for revision.

---

# Module 7 – Revision and Read Aloud

## Student Actions
- Revise draft
- Optionally record read aloud
- Save revision

## Teacher Intent
- Teach revision discipline
- Improve clarity and flow
- Use read aloud as editing strategy

## Data Created

### Table: student_drafts (module = 7)
- user_email
- full_text
- audio_url (if saved)
- timestamps

Note:
Module 6 and Module 7 are separate checkpoints.

No version history inside Module 7 yet.

## What Teachers Need
- Revised draft
- Evidence revision occurred

---

# Module 8 – Final Polish and Lock

## Student Actions
- Final sentence-level edits
- Review checklist
- Lock content

## Teacher Intent
- Separate content from formatting
- Create stable final content version

## Data Created

### Table: student_drafts (module = 8)
- user_email
- full_text
- final_text
- final_ready (boolean)
- timestamps

final_text is source of truth for export.

---

# Module 9 – APA Formatting and Final Submission

## Student Actions
- Take APA mini quiz
- Export final draft to Google Docs
- Apply APA formatting
- Download PDF
- Upload PDF
- Reach success page

## Teacher Intent
- Teach presentation standards
- Produce single gradeable PDF artifact
- Separate content from formatting

## Data Created

### Table: module9_quiz
- user_email
- score
- total
- submitted_at

### Table: student_exports (via helpers)
Export metadata:
- user_email
- module (9)
- google_doc_url
- kind ("final_pdf")
- public_url
- storage_path
- timestamps

### Storage Bucket
Final PDF stored in Supabase Storage
URL saved in export record.

### Table: module9_checklist
- user_email (primary key)
- items (jsonb, array of 6 booleans)
- complete (boolean, true when all 6 items checked)
- created_at, updated_at

Persistence replaces former localStorage. Teachers see checklist status (complete/incomplete, updated_at) in the student drawer.

## Logging
student_activity_log:
- quiz_submitted
- export_attempt
- export_success
- export_failure
- pdf_uploaded
- module_completed

## What Teachers Need
Minimum:
- Quiz percent
- Final PDF link

Preferred:
- Google Doc link
- Submission timestamp
- Confirmation submission complete

## Known Issues
- Quiz questions 8 and 9 need revision
- APA scaffolding is light
- Export workflow friction remains a risk area

Future expansion possibility:
- MLA option
- Dual-template support

---

# Master Data Map Summary

Core Tables:
- module1_quiz_results
- module2_sources
- tchart_entries
- module3_responses
- bucket_groups
- student_outlines
- student_drafts
- module9_quiz
- module9_checklist
- student_exports
- student_activity_log

Primary Writing Artifact Lifecycle:
Module 6 draft → Module 7 revision → Module 8 locked final_text → Module 9 exported & submitted PDF

This document defines the instructional and data architecture for Modules 1–9.