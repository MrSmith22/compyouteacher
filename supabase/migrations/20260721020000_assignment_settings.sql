-- WP-084: Teacher-owned assignment settings (word-count expectation).
-- Existing assignments have no row → application defaults to mode "off".

create table if not exists public.assignment_settings (
  assignment_id text primary key,
  assignment_name text not null,
  word_count_mode text not null default 'off'
    check (
      word_count_mode in (
        'off',
        'advisory_minimum',
        'required_minimum',
        'advisory_range',
        'required_range'
      )
    ),
  word_count_min integer null
    check (word_count_min is null or word_count_min >= 0),
  word_count_max integer null
    check (word_count_max is null or word_count_max >= 0),
  updated_at timestamptz not null default now(),
  updated_by text null
);

comment on table public.assignment_settings is
  'Assignment-owned teacher settings (WP-084). Missing row means word-count mode off.';

create index if not exists assignment_settings_name_idx
  on public.assignment_settings (assignment_name);
