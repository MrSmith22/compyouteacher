-- Module 2 rhetorical-situation lesson completion
-- Durable per-student completion timestamp (no score).
-- Grandfathering for existing downstream work is handled in application logic.

ALTER TABLE public.module2_sources
  ADD COLUMN IF NOT EXISTS rhetorical_situation_completed_at timestamptz NULL;

COMMENT ON COLUMN public.module2_sources.rhetorical_situation_completed_at IS
  'Set when the student finishes Meet the two situations (Speech, Letter, compare, and the five-question check). No score is stored.';
