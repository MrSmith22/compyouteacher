# Modules 8–9 submission-protocol production rollout runbook (WP-093)

## Purpose

Promote the accepted Module 8–9 guided APA protocol (WP-092) for `mlk-rhetorical-analysis` while keeping an operational rollback that does not delete guided semantic state, legacy quiz/checklist history, Google Docs, PDFs, or receipts. Independent from Module 1 `vocabulary_transfer_mode` (WP-091), Modules 2–3 `evidence_argument_mode` (WP-088), and Modules 4–7 `writing_spine_mode` (WP-085).

## Required migrations

1. Prior assignment_settings / writing-spine / evidence-argument / vocabulary-transfer migrations (must remain intact)
2. `20260722010000_module9_guided_apa_protocol.sql` — durable guided state (WP-092; already applied)
3. `20260722020000_submission_protocol_rollout.sql` — adds `submission_protocol_mode`, sets MLK to `rebuilt`

Apply on the remote Supabase project before claiming production-ready.

### Minimal idempotent SQL (if automated apply unavailable)

```sql
alter table public.assignment_settings
  add column if not exists submission_protocol_mode text not null default 'legacy';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'assignment_settings_submission_protocol_mode_check'
  ) then
    alter table public.assignment_settings
      add constraint assignment_settings_submission_protocol_mode_check
      check (submission_protocol_mode in ('legacy', 'rebuilt'));
  end if;
end $$;

update public.assignment_settings
set submission_protocol_mode = 'rebuilt', updated_at = now()
where assignment_id = 'mlk-rhetorical-analysis';
```

## Preflight

```bash
node scripts/wp093-submission-protocol-preflight.js
```

Optional reviewed enable (only if the row exists but mode is not rebuilt):

```bash
node scripts/wp093-submission-protocol-preflight.js --enable-mlk-rebuilt
```

Expect `PASS` for `assignment_settings_readable`, `mlk_row`, `submission_protocol_mode=rebuilt`, `writing_spine_mode_unchanged`, `evidence_argument_mode_unchanged`, `vocabulary_transfer_mode_unchanged`, and `module9_guided_apa_protocol`.

## How the current assignment is enabled

- Database: `assignment_settings.submission_protocol_mode = 'rebuilt'` for `mlk-rhetorical-analysis`
- Teacher/ops UI: Teacher Dashboard → “Modules 8–9 submission protocol (ops)”
- API: `PATCH /api/teacher/submission-protocol-rollout` with `{ "mode": "rebuilt" }` (teacher role)

## Verify resolved mode

```bash
# Authenticated student or teacher session
curl -b COOKIES 'http://localhost:3000/api/assignment-rollout?assignmentId=mlk-rhetorical-analysis'
# Expect: "submissionProtocolMode":"rebuilt","submissionProtocolSource":"database","submissionProtocolSchemaOk":true
# And independently: vocabularyTransferMode / evidenceArgumentMode / mode (writing spine) unchanged
```

## Persistence contract

- Authoritative guided state: `module9_guided_apa_protocol` (authenticated GET/POST `/api/module9/guided-apa-protocol`)
- Legacy `module9_quiz` / `module9_checklist` remain historical only in rebuilt mode
- Module 8 Doc identity: existing `exported_docs` / verification path (WP-080/WP-092)
- Final receipt: `student_exports` — highest-authority terminal state across modes
- Save failures stay recoverable with Retry; UI must not claim durable save when the server write failed

## Emergency override

Set `SUBMISSION_PROTOCOL_MODE_OVERRIDE=legacy` or `rebuilt` in the server environment. This wins over the database until removed. Does not change `VOCABULARY_TRANSFER_MODE_OVERRIDE`, `EVIDENCE_ARGUMENT_MODE_OVERRIDE`, or `WRITING_SPINE_MODE_OVERRIDE`.

## Rollback

1. Prefer DB: set mode to `legacy` via Teacher Dashboard or teacher PATCH.
2. Or set `SUBMISSION_PROTOCOL_MODE_OVERRIDE=legacy` and restart.
3. Confirm `module9_guided_apa_protocol` rows remain.
4. Confirm Modules 1–7 modes are unchanged.
5. Re-enable: set mode back to `rebuilt` (or remove override). Same move statuses, document signature, help/fix state, and terminal receipt must return.

## Monitoring (safe logs)

Server logs may include `[wp093-rollout]` with `assignmentId`, `mode`, `updatedBy`. Do not log essay text, formatting selections, citation text, external Doc URLs, or credentials.

## Later removal criteria

Open a follow-up issue to remove legacy Module 8/9 checklist/quiz presentation only after:

- active cohorts have durable guided state or completed submission;
- rollback has been unused for an agreed window;
- production telemetry no longer depends on legacy gates as the sole resume path.
