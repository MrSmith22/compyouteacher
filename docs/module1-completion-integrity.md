# Module 1 completion integrity

## Ordering

```text
Submit quiz
→ POST /api/module1/quiz-submit validates answers + scores server-side + persists attempt
→ client receives confirmed result
→ navigate to /modules/1/success
→ POST /api/module1/complete verifies prompt + quiz readiness
→ forward-only CAS advances assignment (1 → at least 2)
→ Continue to Module 2 enables
```

Progression never advances before required artifacts are durably stored.

## `/api/module1/complete`

- Completes **Module 1 only**.
- Does **not** accept a client `completedModuleNumber` (rejected if present).
- Session email is the only student identity.
- Assignment name is server-controlled (`MLK Essay Assignment`).
- Calls `evaluateModule1CompletionReadiness` before CAS.

## Quiz attempt policy

| Topic | Policy |
|---|---|
| Storage | **Every attempt** is retained in `module1_quiz_results` (insert, not overwrite). |
| Current result | Latest row by `submitted_at` (fallback `created_at`). |
| Retry after failed save | No row written → Retry inserts once on success. |
| Retry after successful save | Identical answers + version → `already_saved` (no duplicate row). |
| Different answers | New attempt row (history preserved). |
| Score authority | Server answer key only; client score ignored. |

## Versioning / legacy policy

| Row | Readable | Satisfies NEW Module 1 completion? |
|---|---|---|
| `quiz_version = 2` (current) + complete answers | Yes | Yes |
| `quiz_version` null (unversioned legacy) + complete | Yes | Yes (grandfather until/unless policy changes) |
| `quiz_version = 1` (video-era) + complete | Yes (historical) | No → `quiz_version_outdated` (retake current quiz) |
| Incomplete / missing answers | Partial | No |

## Migration required

File: `supabase/migrations/20260712220000_module1_quiz_assessment_version.sql`

Adds nullable `quiz_version` and `submitted_at` without rewriting student content.

**Before SQL is run:** the quiz-submit endpoint falls back to legacy columns
(`user_email`, `score`, `total`, `answers`) so saves still work. Completion
grandfathers complete unversioned rows.

**After SQL is run:** new attempts persist `quiz_version` + `submitted_at`.
No existing rows are deleted.

## Architectural gap (attempt identity)

Rows have a surrogate `id` as attempt identity. There is no separate
`attempt_number` / assignment-scoped attempt group yet. Restarts that clear
`module1_quiz_results` prevent reuse of old attempts as completion evidence.
Smallest later additive improvement: optional `attempt_group` / `restart_id`
tied to assignment restart events — not required for this repair.
