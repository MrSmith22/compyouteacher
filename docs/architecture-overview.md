# Architecture Overview, The Writing Processor

This is a Next.js 15 app using the App Router, with NextAuth for authentication and Supabase for data storage.

## Core idea
The app is a guided, multi module writing workflow. A student moves through Modules 1 to 9, producing artifacts at each stage. Module 10 is a teacher dashboard for reviewing progress and artifacts.

## Auth
Authentication is handled by NextAuth using Google OAuth. On the client, components use `useSession()` to get the signed in user email. On the server, API routes use `getServerSession(authOptions)`.

The user email is the current primary key for student data. Most tables use `user_email` as the identifier.

## Data and progress
Supabase is the source of truth for student work. The canonical progress record is in `student_assignments` using:
- user_email
- assignment_name
- current_module
- status

Progress only moves forward. The dashboard uses `student_assignments.current_module` to decide where the Continue button routes.

Progress is advanced by:
1) Module success pages that call a helper to advance `current_module` to at least the next module.
2) The activity log route, which can defensively advance progress based on the module number in events.

## Activity logging
There is an activity log table `student_activity_log`:
- user_email
- action
- module
- metadata
- created_at

The client calls `POST /api/activity/log` for best effort logging. Logging should never block the app.

## Modules
Each module saves its own artifacts into module specific tables. Examples:
- Module 2 sources in `module2_sources`
- Module 2 T chart entries in `tchart_entries`
- Module 3 thesis in `module3_responses`
- Module 4 buckets in `bucket_groups`
- Module 5 outline in `student_outlines`
- Modules 6 to 8 draft and final text in `student_drafts`
- Module 9 quiz in `module9_quiz`
- Final submission metadata in `student_exports`

## Local caching
Some pages use localStorage as a fallback only. Keys must be user scoped using `lib/storage/studentCache.ts` so one user never sees another user’s cached data.

## Helper layer direction
A goal is to centralize Supabase reads and writes in helper modules under `lib/supabase/helpers/`. UI components should call helpers rather than writing raw `.from()` queries everywhere.

## Dev reset
In development only, a dev reset endpoint exists at `POST /api/dev/reset-student` to clear all data for the signed in test user. The dev reset button also clears user scoped localStorage keys in the browser and reloads.