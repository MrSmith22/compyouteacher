-- Additive: persist Module 3 thesis structure choice (existing rows stay valid with NULL).
ALTER TABLE public.module3_responses
  ADD COLUMN IF NOT EXISTS structure_choice text;
