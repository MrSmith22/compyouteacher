-- Module 4: structured body-paragraph ("bucket") drafts keyed by student + module

CREATE TABLE IF NOT EXISTS public.student_buckets (
  user_email text NOT NULL,
  module integer NOT NULL DEFAULT 4,
  buckets jsonb NOT NULL DEFAULT '[]'::jsonb,
  reflection text,
  flow_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_buckets_pkey PRIMARY KEY (user_email, module)
);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION public.set_student_buckets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_student_buckets_updated_at ON public.student_buckets;

CREATE TRIGGER trg_student_buckets_updated_at
BEFORE UPDATE ON public.student_buckets
FOR EACH ROW
EXECUTE FUNCTION public.set_student_buckets_updated_at();

-- Row Level Security
ALTER TABLE public.student_buckets ENABLE ROW LEVEL SECURITY;

-- Students can read their own bucket data
CREATE POLICY "Students can view their own student_buckets"
ON public.student_buckets
FOR SELECT
USING (auth.jwt() ->> 'email' = user_email);

-- Students can insert their own bucket data
CREATE POLICY "Students can insert their own student_buckets"
ON public.student_buckets
FOR INSERT
WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Students can update their own bucket data
CREATE POLICY "Students can update their own student_buckets"
ON public.student_buckets
FOR UPDATE
USING (auth.jwt() ->> 'email' = user_email)
WITH CHECK (auth.jwt() ->> 'email' = user_email);