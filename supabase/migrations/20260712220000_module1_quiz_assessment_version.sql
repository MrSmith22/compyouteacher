-- Module 1 quiz assessment integrity (additive, idempotent).
-- Preserve every attempt; do not rewrite or delete existing student rows.
-- Run manually in Supabase SQL editor if not already applied.

ALTER TABLE public.module1_quiz_results
  ADD COLUMN IF NOT EXISTS quiz_version integer;

ALTER TABLE public.module1_quiz_results
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- Backfill submitted_at from created_at when present; leave quiz_version null
-- for legacy rows (treated as outdated for NEW Module 1 completion readiness).
UPDATE public.module1_quiz_results
SET submitted_at = created_at
WHERE submitted_at IS NULL
  AND created_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS module1_quiz_results_user_time_idx
  ON public.module1_quiz_results (
    user_email,
    submitted_at DESC NULLS LAST,
    created_at DESC
  );

COMMENT ON COLUMN public.module1_quiz_results.quiz_version IS
  'Quiz content version (Module 1 vocabulary quiz). Null = legacy unversioned row.';

COMMENT ON COLUMN public.module1_quiz_results.submitted_at IS
  'Server-confirmed submission timestamp. Prefer over created_at for attempt ordering.';
