-- Module 9 APA checklist persistence
-- Run this migration in your Supabase SQL editor or via supabase db push

CREATE TABLE IF NOT EXISTS public.module9_checklist (
  user_email text PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger function to update updated_at on row change
CREATE OR REPLACE FUNCTION public.module9_checklist_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS module9_checklist_updated_at ON public.module9_checklist;
CREATE TRIGGER module9_checklist_updated_at
  BEFORE UPDATE ON public.module9_checklist
  FOR EACH ROW
  EXECUTE PROCEDURE public.module9_checklist_set_updated_at();

ALTER TABLE public.module9_checklist ENABLE ROW LEVEL SECURITY;

-- Students can read their own checklist
CREATE POLICY "Students can read their checklist"
  ON public.module9_checklist
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

-- Students can insert their checklist
CREATE POLICY "Students can insert their checklist"
  ON public.module9_checklist
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Students can update their checklist
CREATE POLICY "Students can update their checklist"
  ON public.module9_checklist
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);
