-- Persist submitted PDF byte length for student receipt and teacher review.
-- Safe if the column already exists in a remote schema.
alter table public.student_exports
  add column if not exists file_size bigint;
