# Module 1 vocabulary-transfer production rollout runbook (WP-091)

## Purpose

Promote the accepted Module 1 transfer vocabulary lessons (WP-089/WP-090) for `mlk-rhetorical-analysis` while keeping an operational rollback that does not delete rebuilt student lesson state. Independent from Modules 2–3 `evidence_argument_mode` (WP-088) and Modules 4–7 `writing_spine_mode` (WP-085).

## Required migrations

1. Prior assignment_settings / writing-spine / evidence-argument migrations (must remain intact)
2. `20260721230000_vocabulary_transfer_rollout.sql` — adds `vocabulary_transfer_mode`, sets MLK to `rebuilt`, creates `module1_vocabulary_transfer`

Apply on the remote Supabase project before claiming production-ready.

## Preflight

```bash
node scripts/wp091-vocabulary-transfer-preflight.js
```

Optional reviewed enable (only if the row exists but mode is not rebuilt):

```bash
node scripts/wp091-vocabulary-transfer-preflight.js --enable-mlk-rebuilt
```

Expect `PASS` for `assignment_settings_readable`, `mlk_row`, `vocabulary_transfer_mode=rebuilt`, `writing_spine_mode_unchanged`, `evidence_argument_mode_unchanged`, and `module1_vocabulary_transfer`.

## How the current assignment is enabled

- Database: `assignment_settings.vocabulary_transfer_mode = 'rebuilt'` for `mlk-rhetorical-analysis`
- Teacher/ops UI: Teacher Dashboard → “Module 1 vocabulary presentation (ops)”
- API: `PATCH /api/teacher/vocabulary-transfer-rollout` with `{ "mode": "rebuilt" }` (teacher role)

## Verify resolved mode

```bash
# Authenticated student or teacher session
curl -b COOKIES 'http://localhost:3000/api/assignment-rollout?assignmentId=mlk-rhetorical-analysis'
# Expect: "vocabularyTransferMode":"rebuilt","vocabularyTransferSource":"database"
# And independently: evidenceArgumentMode / mode (writing spine) unchanged
```

## Persistence contract

- Authoritative lesson state: `module1_vocabulary_transfer` (authenticated GET/POST `/api/module1/vocabulary-transfer`)
- Browser `localStorage` (`wp:{email}:module1:step2`) is a cache only
- Local-only progress is imported to the server on first rebuilt-mode load; richer server records are not silently overwritten
- Save failures stay recoverable with Retry; UI must not claim durable save when the server write failed

## Emergency override

Set `VOCABULARY_TRANSFER_MODE_OVERRIDE=legacy` or `rebuilt` in the server environment. This wins over the database until removed. Does not change `EVIDENCE_ARGUMENT_MODE_OVERRIDE` or `WRITING_SPINE_MODE_OVERRIDE`.

## Rollback

1. Prefer DB: set mode to `legacy` via Teacher Dashboard or teacher PATCH.
2. Or set `VOCABULARY_TRANSFER_MODE_OVERRIDE=legacy` and restart.
3. Confirm `module1_vocabulary_transfer` rows remain.
4. Confirm Modules 2–3 and 4–7 modes are unchanged.
5. Re-enable: set mode back to `rebuilt` (or remove override). Same term, microstep, responses, and completion flags must return.

## Monitoring (safe logs)

Server logs may include `[wp091-rollout]` with `assignmentId`, `mode`, `updatedBy`. Do not log student choices, King follow-up prose, prompt paraphrases, or quiz answers.

## Later removal criteria

Open a follow-up issue to remove the legacy Module 1 vocabulary presentation only after:

- active cohorts have durable transfer state or completed Module 1;
- rollback has been unused for an agreed window;
- local-only drafts are no longer the sole resume path in production telemetry.
