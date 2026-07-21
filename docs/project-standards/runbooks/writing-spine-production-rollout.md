# Writing-spine production rollout runbook (WP-085)

## Purpose

Promote the accepted Modules 4–7 rebuilt writing spine for `mlk-rhetorical-analysis` while keeping an operational rollback that does not delete rebuilt student data.

## Required migrations

1. `20260721020000_assignment_settings.sql` — teacher word-count settings  
2. `20260721140000_writing_spine_rollout.sql` — adds `writing_spine_mode` and sets MLK to `rebuilt`

Apply on the remote Supabase project before claiming production-ready.

## Preflight

```bash
node scripts/wp085-writing-spine-preflight.js
```

Optional reviewed enable (only if the row exists but mode is not rebuilt):

```bash
node scripts/wp085-writing-spine-preflight.js --enable-mlk-rebuilt
```

Expect `PASS` for `assignment_settings_readable`, `mlk_row`, and `writing_spine_mode=rebuilt`.

## How the current assignment is enabled

- Database: `assignment_settings.writing_spine_mode = 'rebuilt'` for `mlk-rhetorical-analysis`
- Teacher/ops UI: Teacher Dashboard → “Writing-spine presentation (ops)”
- API: `PATCH /api/teacher/assignment-rollout` with `{ "mode": "rebuilt" }` (teacher role)

## Verify resolved mode

```bash
# Authenticated student or teacher session
curl -b COOKIES 'http://localhost:3000/api/assignment-rollout?assignmentId=mlk-rhetorical-analysis'
# Expect: "mode":"rebuilt","source":"database"
```

## Emergency override

Set `WRITING_SPINE_MODE_OVERRIDE=legacy` or `rebuilt` in the server environment. This wins over the database for all assignments until removed.

## Rollback

1. Prefer DB: set mode to `legacy` via Teacher Dashboard or teacher PATCH.  
2. Or set `WRITING_SPINE_MODE_OVERRIDE=legacy` and restart.  
3. Confirm rebuilt `draft_meta.verticalSlice`, revisions, and `final_text` remain in `student_drafts`.  
4. Re-enable: set mode back to `rebuilt` (or remove override). Same moves/Before/After/resume must return.

## Monitoring (safe logs)

Server logs may include `[wp085-rollout]` with `assignmentId`, `mode`, `updatedBy`. Do not log essay prose.

## Known legacy adapter limits

- Duplicate `sourceParagraphIndex` values → local review flag, no guess.  
- Legacy M6 prose opens as advanced whole-section text; sentence moves are not invented.  
- Metadata upgrades happen only on authenticated save, never as a render side effect.

## Later removal criteria

Open a follow-up issue to remove the legacy presentation path only after:

- all active cohorts have durable rebuilt metadata or completed Module 7;
- rollback has been unused for an agreed window;
- adapters are unused in production telemetry.
