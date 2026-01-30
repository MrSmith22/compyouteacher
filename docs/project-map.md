# Project Map

A single reference for structure, key files, data flow, and common dev tasks. Structure follows `docs/project-tree.txt`; filenames follow `docs/project-files.txt`. No middleware file exists in the repo.

---

## 1. Project overview

### Next.js App Router structure

Next.js 15 with the App Router. Routes live under `app/`: `app/page.js` (landing), `app/dashboard/page.js` (student dashboard), `app/modules/` (modules 1–10), and `app/api/` for API routes. Layout and globals are in `app/layout.js` and `app/globals.css`. Session is provided via `app/SessionProvider.js`.

### NextAuth auth flow

Auth is NextAuth with Google OAuth. Config: `app/api/auth/[...nextauth]/authOptions.js` and `app/api/auth/[...nextauth]/route.js`. Client components use `useSession()`; server API routes use `getServerSession(authOptions)`. User email is the primary identifier for student data.

### Supabase usage

- **Student flows (browser):** Use the **anon** client from `lib/supabaseClient.ts` (e.g. dashboard, module pages, success pages). RLS applies; the client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Server routes:** Use the **admin** (service role) client from `lib/supabase/admin.ts` via `getSupabaseAdmin()` so API routes can read/write without RLS (e.g. activity log, dev reset, teacher dashboard).

### Helper layer intent and current state

Goal: centralize Supabase access in `lib/supabase/helpers/` so UI and API routes call helpers instead of raw `.from()` everywhere. Helpers key by `user_email`; progress lives in `student_assignments.current_module` and only moves forward. Current state: helpers exist for assignments, activity, module2 sources, outlines, tchart, readaloud, teacher dashboard; dashboard and some module pages still call Supabase directly in places. Direction: move those calls behind helpers over time.

---

## 2. Repo map

Focused tree (app, components, lib, docs, and important root files). No `middleware.ts` in the repo.

```
.
├── app
│   ├── api
│   │   ├── activity/log/route.ts
│   │   ├── assignments/create-doc/route.js, mlk-essay/page.js, resume/route.js
│   │   ├── auth/[...nextauth]/authOptions.js, route.js
│   │   ├── dev/reset-student/route.ts
│   │   ├── drive/route.js
│   │   ├── export-to-docs/route.js
│   │   ├── outlines/route.js
│   │   ├── readaloud/route.ts
│   │   ├── role/route.ts
│   │   ├── tchart/save/route.js
│   │   └── teacher/dashboard/route.ts
│   ├── dashboard
│   │   ├── components/Sidebar.js, StudentResponses.js
│   │   └── page.js
│   ├── drive/test/page.tsx
│   ├── lib/supabaseClient.js
│   ├── modules
│   │   ├── 1..9/page.js (and 7/page.tsx), success/page.js
│   │   ├── 10/page.js, student/[email]/page.js
│   │   ├── 2/form, letter, source, tcharts (page.js each)
│   │   ├── page.js, ReadAloud.tsx
│   │   └── 7/ReadAloud.tsx
│   ├── favicon.ico, globals.css, layout.js, page.js, SessionProvider.js
│   └── ...
├── components
│   ├── CreateTChartDocButton.tsx
│   ├── dev/DevResetStudentButton.tsx
│   ├── ModuleOne.js … ModuleNine.js, ModuleSystem.js
│   ├── ModuleTwoForm.js, ModuleThreeForm.js
│   ├── SortableItem.js, TeacherDashboard.js
│   └── ...
├── lib
│   ├── logActivity.js
│   ├── progression/guards.ts, useModuleGate.ts
│   ├── storage/studentCache.ts
│   ├── supabase
│   │   ├── admin.ts
│   │   └── helpers
│   │       ├── module2Sources.ts, readAloud.ts, studentActivity.ts
│   │       ├── studentAssignments.ts, studentOutlines.ts
│   │       ├── tchartEntries.ts, teacherDashboard.ts
│   │       └── ...
│   ├── supabaseClient.ts
│   └── useRole.ts
├── docs
│   ├── architecture-overview.md, data-map.md, data-plan-draft.md
│   ├── pedagogical-flow.md, project-map.md, supabase-helpers-spec.md
│   └── ...
├── next.config.mjs, package.json, pnpm-lock.yaml, pnpm-workspace.yaml
├── postcss.config.js, postcss.config.mjs
├── tailwind.config.js, tsconfig.json
└── utils/googleDrive.js
```

---

## 3. Key files and responsibilities

### app/dashboard/page.js

Student dashboard (client component). Loads `student_assignments` and `student_exports` (final PDF) for the signed-in user via the anon Supabase client. Uses `current_module` and final PDF to choose button label and target: "Start Assignment" → module 1, "Continue with Module N" → module N, or "Review Assignment" → module 9. **Creates** the assignment row when the user clicks Start and no row exists (upserts `user_email`, `assignment_name`, `current_module`, `status`, `started_at`). Renders the dev reset button and sign out.

### app/api/activity/log/route.ts

POST handler for activity logging. Uses `getServerSession(authOptions)` for email and `getSupabaseAdmin()` for DB. Accepts `action` (or legacy `eventType`), optional `module`, and optional `metadata`. Inserts into `student_activity_log`; best-effort (always returns 200, never blocks the app). Does not currently advance `student_assignments.current_module`; the spec allows that as an optional defensive update.

### app/api/dev/reset-student/route.ts

Dev-only POST route. Returns 404 in production. Requires session and `x-dev-reset-secret` header matching `DEV_RESET_SECRET`. Uses `getSupabaseAdmin()` to delete all rows for the signed-in user from a fixed list of tables (e.g. student_readaloud, student_drafts, student_outlines, bucket_groups, tchart_entries, module3_responses, module2_sources, module1_quiz_results, module9_quiz, student_activity_log, module_scores, student_assignments). Returns `{ ok, email, deleted }` or error payload.

### lib/supabase/helpers/studentAssignments.ts

Helpers for `student_assignments`. Uses the root Supabase client (anon). `getStudentAssignment({ userEmail, assignmentName })` fetches the row. `upsertResumePath({ userEmail, assignmentName, resumePath, currentModule })` upserts resume path and module. `advanceCurrentModuleOnSuccess({ userEmail, assignmentName, completedModuleNumber })` advances `current_module` to at least `completedModuleNumber + 1` when status is `in_progress`, never backward. Called from success pages (and resume flow) to advance progress.

### lib/storage/studentCache.ts

User-scoped localStorage utilities. `makeStudentKey(email, parts)` returns `wp:${email}:${parts.join(":")}` so cache keys are per user. `clearStudentCache(email)` removes all keys with that prefix. Used by Module 2 source page for fallback cache and by the dev reset button to clear local state after a reset.

---

## 4. Data and progress flow

### Where student_assignments.current_module is set

- **Created:** On the student dashboard when the user has no assignment row and clicks the main CTA; dashboard upserts a row with `current_module: 1` (or the target module). Also created from `app/modules/page.js` in some flows with `current_module: 1`.
- **Updated:** Success pages (e.g. `app/modules/1/success/page.js` through module 9) call `advanceCurrentModuleOnSuccess()` in a `useEffect` when the user is signed in. That helper sets `current_module` to `max(existing, completedModuleNumber + 1)`. The resume API/helper can also set it via `upsertResumePath`.

### What advances progress

- **Success pages:** Visiting a module’s `success` page (after completing the module) triggers `advanceCurrentModuleOnSuccess`, which moves `current_module` forward.
- **Activity log:** The activity log route only writes to `student_activity_log`; it does not currently update `current_module` (optional defensive advance is not implemented).

### Where activity logging happens

- **API:** `POST /api/activity/log` (implemented in `app/api/activity/log/route.ts`).
- **Client:** `lib/logActivity.js` builds the payload and calls that API. Used from: auth (signIn event in authOptions), module pages (e.g. module_started), module components (module_completed, draft_autosaved, quiz_submitted, etc.), and `lib/progression/useModuleGate.ts` (module_blocked). Logging is best-effort and non-blocking.

### localStorage and user scoping

- **Scoping:** All cache keys must be built with `makeStudentKey(email, parts)` from `lib/storage/studentCache.ts` so data is per user.
- **Usage:** Module 2 source page uses it for fallback (e.g. speech URL, transcript, citation) with keys like `makeStudentKey(email, ["mlk", "module2", "speechUrl"])`.
- **Dev reset:** After a successful reset, `DevResetStudentButton` calls `clearStudentCache(email)` and reloads so no stale local data remains.

---

## 5. Common dev tasks

### Run dev server

```bash
pnpm dev
```

### Lint

```bash
pnpm lint
```

### Dev reset (button)

1. Sign in as the student you want to reset.
2. Open the student dashboard (`/dashboard`).
3. Click **Dev: Reset this student**, confirm, and type OK.
4. Ensure `NEXT_PUBLIC_DEV_RESET_SECRET` matches `DEV_RESET_SECRET` so the request is accepted. After success, localStorage for that user is cleared and the page reloads.

### Dev reset (API)

```bash
curl -X POST http://localhost:3000/api/dev/reset-student \
  -H "Content-Type: application/json" \
  -H "x-dev-reset-secret: YOUR_DEV_RESET_SECRET" \
  -b "next-auth.session-token=YOUR_SESSION_COOKIE" \
  -d '{}'
```

Use the same secret as in `.env`; the session cookie is from a signed-in browser session (e.g. copy from DevTools → Application → Cookies).

### Verify progress updates in Supabase

1. **Before:** In Supabase, open `student_assignments` and note `current_module` (and row existence) for the test user’s email.
2. **Action:** Sign in as that user, go to dashboard, start or continue to a module, complete it, and land on that module’s success page (e.g. Module 1 → complete quiz → `/modules/1/success`).
3. **After:** In `student_assignments`, the row for that user should have `current_module` at least one higher (or 2 if they started at 1 and finished module 1). Optionally check `student_activity_log` for new rows (e.g. `module_completed`, `module_started`).
