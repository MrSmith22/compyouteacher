CREATE TABLE IF NOT EXISTS public.module1_prompt_breakdown (
  user_email text PRIMARY KEY,
  task_verb text NOT NULL DEFAULT '',
  task_type text NOT NULL DEFAULT '',
  analysis_focus text NOT NULL DEFAULT '',
  required_angle text NOT NULL DEFAULT '',
  student_paraphrase text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.module1_prompt_breakdown_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS module1_prompt_breakdown_updated_at ON public.module1_prompt_breakdown;

CREATE TRIGGER module1_prompt_breakdown_updated_at
  BEFORE UPDATE ON public.module1_prompt_breakdown
  FOR EACH ROW
  EXECUTE PROCEDURE public.module1_prompt_breakdown_set_updated_at();

ALTER TABLE public.module1_prompt_breakdown ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read their prompt breakdown"
  ON public.module1_prompt_breakdown
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Students can insert their prompt breakdown"
  ON public.module1_prompt_breakdown
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Students can update their prompt breakdown"
  ON public.module1_prompt_breakdown
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Ensure columns exist (handles tables created with older schema)
ALTER TABLE public.module1_prompt_breakdown ADD COLUMN IF NOT EXISTS task_verb text NOT NULL DEFAULT '';
ALTER TABLE public.module1_prompt_breakdown ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT '';
ALTER TABLE public.module1_prompt_breakdown ADD COLUMN IF NOT EXISTS analysis_focus text NOT NULL DEFAULT '';
ALTER TABLE public.module1_prompt_breakdown ADD COLUMN IF NOT EXISTS required_angle text NOT NULL DEFAULT '';
ALTER TABLE public.module1_prompt_breakdown ADD COLUMN IF NOT EXISTS student_paraphrase text NOT NULL DEFAULT '';
ALTER TABLE public.module1_prompt_breakdown ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();