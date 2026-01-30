# Pedagogical Flow (MLK Assignment)

## Goal
Describe the student journey step by step, what they do, what they produce, what gets saved.

## Progress Rule
The student dashboard resume behavior is driven by `student_assignments.current_module`.
Completion of each module advances progress forward, typically on the module success page.
Progress may also advance defensively based on `/api/activity/log`.

## Modules and Steps

### Module 1
What students do:
- Read the prompt and complete the initial quiz or check.
What gets saved:
- Quiz results in `module1_quiz_results`
- Activity events in `student_activity_log`
- Progress advanced on Module 1 success

### Module 2
Speech source page:
- Provide and save MLK speech source URL, transcript text, and citation details
Letter source page:
- Provide and save Letter from Birmingham Jail source URL, text, and citation details
T Charts page:
- Record ethos, pathos, logos comparisons, quotes, and observations
What gets saved:
- Sources in `module2_sources`
- T chart entries in `tchart_entries`
- Activity events in `student_activity_log`
- Progress advanced on Module 2 success

### Module 3
Thesis work:
- Guided responses and thesis drafting
What gets saved:
- Thesis work in `module3_responses`
- Activity events in `student_activity_log`
- Progress advanced on Module 3 success

### Module 4
Buckets grouping:
- Group ideas into buckets and write a reflection
What gets saved:
- Buckets and reflection in `bucket_groups`
- Activity events in `student_activity_log`
- Progress advanced on Module 4 success

### Module 5
Outline:
- Build a structured outline from thesis and buckets
What gets saved:
- Outline in `student_outlines`
- Activity events in `student_activity_log`
- Progress advanced on Module 5 success

### Module 6
Drafting:
- Draft essay sections based on outline and evidence
What gets saved:
- Draft sections and full text in `student_drafts`
- Activity events in `student_activity_log`
- Progress advanced on Module 6 success

### Module 7
Revision and Read Aloud:
- Revise draft, optionally record read aloud audio, reflect on clarity
What gets saved:
- Revised text fields in `student_drafts`
- Audio metadata in `student_readaloud` or related storage table
- Activity events in `student_activity_log`
- Progress advanced on Module 7 success

### Module 8
Final polish:
- Final editing, locking final ready state
What gets saved:
- Final text and final ready state in `student_drafts`
- Activity events in `student_activity_log`
- Progress advanced on Module 8 success

### Module 9
APA quiz, export, final PDF upload:
- Take APA mini quiz
- Export to Google Docs
- Upload final PDF
What gets saved:
- Quiz results in `module9_quiz`
- Export tracking records
- Final PDF metadata in `student_exports`
- Activity events in `student_activity_log`
- Progress advanced on Module 9 success

### Module 10
Teacher dashboard:
- Teacher views student progress and artifacts
What it shows:
- Assignment progress from `student_assignments`
- Activity timeline from `student_activity_log`
- Key artifacts from module tables
- Final submission status from `student_exports`