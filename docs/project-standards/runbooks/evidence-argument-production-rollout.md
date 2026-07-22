# Evidence-to-argument production rollout runbook (WP-088)

## Purpose

Promote the accepted Modules 2–3 evidence-to-argument spine (WP-086/WP-087) for `mlk-rhetorical-analysis` while keeping an operational rollback that does not delete rebuilt student data. Independent from Modules 4–7 `writing_spine_mode` (WP-085).

## Required migrations

1. `20260721020000_assignment_settings.sql` — teacher word-count settings  
2. `20260721140000_writing_spine_rollout.sql` — `writing_spine_mode` (must remain `rebuilt` for MLK)  
3. `20260721220000_evidence_argument_rollout.sql` — adds `evidence_argument_mode` and sets MLK to `rebuilt`

Apply on the remote Supabase project before claiming production-ready.

## Preflight

```bash
node scripts/wp088-evidence-argument-preflight.js
```

Optional reviewed enable (only if the row exists but mode is not rebuilt):

```bash
node scripts/wp088-evidence-argument-preflight.js --enable-mlk-rebuilt
```

Expect `PASS` for `assignment_settings_readable`, `mlk_row`, `evidence_argument_mode=rebuilt`, and `writing_spine_mode_unchanged`.

## How the current assignment is enabled

- Database: `assignment_settings.evidence_argument_mode = 'rebuilt'` for `mlk-rhetorical-analysis`
- Teacher/ops UI: Teacher Dashboard → “Evidence-to-argument presentation (ops)”
- API: `PATCH /api/teacher/evidence-argument-rollout` with `{ "mode": "rebuilt" }` (teacher role)

## Verify resolved mode

```bash
# Authenticated student or teacher session
curl -b COOKIES 'http://localhost:3000/api/assignment-rollout?assignmentId=mlk-rhetorical-analysis'
# Expect: "evidenceArgumentMode":"rebuilt","evidenceArgumentSource":"database"
# And independently: "mode":"rebuilt" for writing spine
```

## Emergency override

Set `EVIDENCE_ARGUMENT_MODE_OVERRIDE=legacy` or `rebuilt` in the server environment. This wins over the database for all assignments until removed. Does not change `WRITING_SPINE_MODE_OVERRIDE` / `writing_spine_mode`.

## Rollback

1. Prefer DB: set mode to `legacy` via Teacher Dashboard or teacher PATCH.  
2. Or set `EVIDENCE_ARGUMENT_MODE_OVERRIDE=legacy` and restart.  
3. Confirm `flow_state.evidenceArgumentSlice`, thesis, and proof plan remain.  
4. Confirm Modules 4–7 still resolve `writing_spine_mode=rebuilt`.  
5. Re-enable: set mode back to `rebuilt` (or remove override). Same evidence choices, prose, current step, and review state must return.

## Monitoring (safe logs)

Server logs may include `[wp088-rollout]` with `assignmentId`, `mode`, `writingSpineMode`, `updatedBy`. Do not log source text, quotations, explanations, thesis, or essay prose.

## Known adapter limits

- Multi-candidate evidence → student pick required; never silent selection.  
- Incomplete custom mapping → local mapping UI; staged Module 3 flow stays closed.  
- Legacy claim alone → `needs_review`; not auto-promoted to thesis.  
- Metadata upgrades happen only on authenticated save, never as a render side effect.

## Later removal criteria

Open a follow-up issue to remove the legacy Module 2–3 presentation path only after:

- all active cohorts have durable schema-v2 slice state or completed Module 3;
- rollback has been unused for an agreed window;
- adapters are unused in production telemetry.
