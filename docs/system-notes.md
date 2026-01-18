# The Writing Processor: System Notes

## Purpose
This document records the **current, observed behavior** of The Writing Processor,
including database structure, routing, code paths, and user-facing flows.

This document is **descriptive, not prescriptive**.
It documents what *exists*, not what *should exist*.

No fixes, refactors, or design decisions are implied unless explicitly stated.

## Documentation rules
- This file is the single source of truth for **current system behavior**
- Findings describe **observed reality**, not intent or future plans
- Each finding must include evidence from code, database state, or UI behavior
- If behavior changes, append a new finding or update an existing one with new evidence
- Design proposals, refactors, or engine abstractions belong in separate documents

## Current environment
- Local dev: http://localhost:3000
- Next.js version: 15.5.2
- Supabase project: euenxgjxuigavklrlgxc

## Findings log
Each finding includes: Observation, Evidence, Implication, Status.

### F001: student_assignments already has a uniqueness rule
**Observation**
student_assignments already enforces one row per (user_email, assignment_name).

**Evidence**
- Constraint exists: UNIQUE (user_email, assignment_name)
- Error seen when attempting to create it again:
  relation "student_assignments_user_assignment_unique" already exists

**Implication**
Any insert or upsert behavior must respect that uniqueness rule.

**Status**
Documented only.

### F002: Multiple code paths write to student_assignments
**Observation**
More than one page writes to student_assignments.

**Evidence**
- app/dashboard/page.js reads and creates rows if missing
- app/modules/page.js inserts or updates rows
- components/TeacherDashboard.js reads rows

**Implication**
State like current_module and status may be overwritten by whichever page runs last.

**Status**
Documented only.

### F003: /modules page forces current_module to 1
**Observation**
Visiting /modules creates or updates student_assignments and sets current_module to 1.

**Evidence**
- app/modules/page.js inserts current_module: 1
- app/modules/page.js updates current_module: 1

**Implication**
Any visit to /modules will push the assignment record back to Module 1.

**Status**
Documented only.

### F004: module9_quiz uses a composite primary key
**Observation**
module9_quiz has a composite primary key on (id, user_email).

**Evidence**
Constraint query output shows the same constraint name "module9_quiz_pkey" attached to:
- column id
- column user_email

Index output also shows a composite unique index:
- CREATE UNIQUE INDEX module9_quiz_pkey ON public.module9_quiz (id, user_email)

**Implication**
Upserts and conflict targets must include both id and user_email.

**Status**
Documented only.

### F005: student_assignments status values are inconsistent across code paths
**Observation**
Different pages write different status strings to the same table.

**Evidence**
- app/dashboard/page.js upsert writes: status: "in_progress"
- app/modules/page.js insert and update write: status: "in progress"
- app/dashboard/page.js logic checks:
  assignment.status === "not_started" OR missing
- table defaults observed elsewhere: 'not started'

**Implication**
UI logic that checks status may not match what gets saved, so labels and routing can behave unexpectedly.

**Status**
Documented only.

### F006: app/dashboard/page.js queries student_assignments by user_email only
**Observation**
Dashboard loads a single row by user_email without filtering by assignment_name.

**Evidence**
app/dashboard/page.js:
- .from("student_assignments").select("*").eq("user_email", email).maybeSingle();

**Implication**
If a student ever has more than one assignment row in the table, Dashboard may pick the wrong row or error because maybeSingle expects at most one match.

**Status**
Documented only.

### F007: app/dashboard/page.js uses upsert without specifying conflict target
**Observation**
Dashboard uses upsert() but does not declare onConflict, while the table primary key is id and there is also a unique constraint on (user_email, assignment_name).

**Evidence**
app/dashboard/page.js:
- .upsert({ user_email, assignment_name, current_module, status, started_at })

Database structure observed:
- student_assignments primary key is id (uuid)
- unique constraint exists on (user_email, assignment_name)

**Implication**
Upsert behavior may not target the intended unique constraint unless explicitly configured. Inserts could fail with a unique constraint error or behave inconsistently across environments.

**Status**
Documented only.

### F008: /modules route logs module_started for module 1 on every visit
**Observation**
Visiting /modules logs module_started with module: 1.

**Evidence**
app/modules/page.js:
- logActivity(email, "module_started", { module: 1 });

**Implication**
Activity logs can show Module 1 started even when the student did not actually start Module 1 intentionally, depending on navigation.

**Status**
Documented only.

### F009: Actual module routes are implemented as static folders /modules/1 through /modules/10
**Observation**
The app has explicit routes for each module folder, not a dynamic [id] route.

**Evidence**
File tree under app/modules shows:
- app/modules/1/page.js ... app/modules/9/page.js
- app/modules/10/page.js
- plus /success pages for most modules

**Implication**
Students likely should enter via /modules/1 (or /dashboard -> /modules/1), not /modules (directory), unless /modules is meant as a special landing page.

**Status**
Documented only.

### F010: /dashboard functions as the canonical student entry point

**Observation**
The intended student flow routes users from the homepage to `/dashboard`, which then controls assignment creation, continuation, and navigation into module pages.

**Evidence**
- Homepage displays “Go to Dashboard” button after sign-in
- Student Dashboard determines whether to show “Start Assignment” or “Continue”
- Dashboard routes students to `/modules/{current_module}`

**Implication**
Student navigation should be driven by `/dashboard`, not by visiting `/modules` directly.
Any logic that mutates assignment state on `/modules` may conflict with dashboard-controlled flow.

**Status**
Documented only.

## Table snapshots

### exported_docs
- Columns: user_email (PK), document_id, web_view_link, created_at
- RLS: disabled

### module1_quiz_results
- Columns: id (uuid PK), user_email, score, total, answers (jsonb), created_at
- RLS: disabled

### module9_quiz
- Columns: id, user_email, score, total, submitted_at, created_at
- PK: (id, user_email)
- RLS: disabled

### module3_responses
- Columns: id (uuid PK), user_email (unique), responses (json), thesis, teacher_comment, teacher_score, created_at, updated_at
- RLS: disabled

### student_exports
- RLS: enabled
- Policies include dev wide open policies plus “students can read own exports”

## Known logs and behavior

### student_activity_log
**Observed**
Module 1 and Module 2 actions are being logged.
In some cases module_started appears twice for the same visit.

**Evidence**
- module_started duplicated timestamps close together
- module_completed and quiz_submitted appear correctly
- module1_quiz_results rows match quiz_submitted metadata

**Implication**
Some pages might log module_started in more than one place, or React effects might run more than once during development.

**Status**
Documented only.

## Route map

| Route | File | Notes |
| --- | --- | --- |
| / | app/page.js | Signed in view shows Teacher Dashboard link to /modules/10 |
| /dashboard | app/dashboard/page.js | Reads student_assignments and student_exports. Creates assignment row if missing |
| /modules | app/modules/page.js | Logs module_started and forces student_assignments current_module to 1 |
| /modules/1 | app/modules/1/page.js | Module 1 entry page exists (static folder) |
| /modules/1/success | app/modules/1/success/page.js | Module 1 success page |
| /modules/2 | app/modules/2/page.js | Module 2 entry |
| /modules/2/source | app/modules/2/source/page.js | Module 2 source step |
| /modules/2/form | app/modules/2/form/page.js | Module 2 form step |
| /modules/2/tcharts | app/modules/2/tcharts/page.js | Module 2 T-charts step |
| /modules/2/letter | app/modules/2/letter/page.js | Module 2 letter step |
| /modules/2/success | app/modules/2/success/page.js | Module 2 success |
| /modules/3 | app/modules/3/page.js | Module 3 entry |
| /modules/3/success | app/modules/3/success/page.js | Module 3 success |
| /modules/4 | app/modules/4/page.js | Module 4 entry |
| /modules/4/success | app/modules/4/success/page.js | Module 4 success |
| /modules/5 | app/modules/5/page.js | Module 5 entry |
| /modules/5/success | app/modules/5/success/page.js | Module 5 success |
| /modules/6 | app/modules/6/page.js | Module 6 entry |
| /modules/6/success | app/modules/6/success/page.js | Module 6 success |
| /modules/7 | app/modules/7/page.tsx | Module 7 entry (TypeScript) |
| /modules/7/success | app/modules/7/success/page.js | Module 7 success |
| /modules/8 | app/modules/8/page.js | Module 8 entry |
| /modules/8/success | app/modules/8/success/page.js | Module 8 success |
| /modules/9 | app/modules/9/page.js | Module 9 entry |
| /modules/9/success | app/modules/9/success/page.js | Module 9 success |
| /modules/10 | app/modules/10/page.js | Renders components/TeacherDashboard.js |
| /modules/10/student/[email] | app/modules/10/student/[email]/page.js | Teacher per-student view |
| /api/role | app/api/role/route.ts | Uses getServerSession + app_roles lookup via supabaseAdmin |
| /api/export-to-docs | app/api/export-to-docs/route.js | Creates Google Doc via service account, upserts exported_docs |

## File tree snapshot
Captured from:
ls -R app/modules | sed -n '1,200p'

Observed top-level entries:
- 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
- page.js (directory landing)
- ReadAloud.tsx (shared module component)

## Known code facts

### K001: /api/role is working
Evidence
- GET /api/role returns {"role":"teacher"}

### K002: Sidebar component exists but is not used anywhere
Evidence
- grep shows only definition at app/dashboard/components/Sidebar.js
- no imports found

Implication
- Sidebar is currently dead code unless a layout renders it

### K003: Root layout constrains width globally
Evidence
- app/layout.js wraps children in a centered container max-w-3xl

Implication
- Dashboard and Teacher Dashboard will inherit that constraint unless overridden

## SQL we almost ran

### S001: Add uniqueness constraint to student_assignments
Intent
- Ensure one assignment row per user per assignment

SQL
- ALTER TABLE public.student_assignments
  ADD CONSTRAINT student_assignments_user_assignment_unique
  UNIQUE (user_email, assignment_name);

What happened
- Error: relation "student_assignments_user_assignment_unique" already exists

Conclusion
- The uniqueness rule already exists.

## Questions to answer next
- Should the /modules route continue to exist now that /dashboard is the canonical entry point
- Which route should be the single writer of student_assignments.current_module
- Should student_assignments be scoped strictly by (user_email, assignment_name) in all reads
- How assignment identity should be represented when supporting multiple essay workflows