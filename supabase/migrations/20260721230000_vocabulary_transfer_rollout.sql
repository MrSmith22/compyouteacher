-- WP-091: Module 1 vocabulary-transfer rollout mode + durable lesson state.
-- Independent from writing_spine_mode and evidence_argument_mode.
-- Default legacy for unknown rows. Explicitly enable rebuilt for MLK.

alter table public.assignment_settings
  add column if not exists vocabulary_transfer_mode text not null default 'legacy';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assignment_settings_vocabulary_transfer_mode_check'
  ) then
    alter table public.assignment_settings
      add constraint assignment_settings_vocabulary_transfer_mode_check
      check (vocabulary_transfer_mode in ('legacy', 'rebuilt'));
  end if;
end $$;

comment on column public.assignment_settings.vocabulary_transfer_mode is
  'WP-091 rollout: legacy = pre-rebuild Module 1 vocabulary presentation; rebuilt = accepted WP-089/WP-090 transfer lessons. Ops may override via VOCABULARY_TRANSFER_MODE_OVERRIDE. Independent from writing_spine_mode and evidence_argument_mode.';

-- Promote the current MLK assignment to rebuilt vocabulary transfer.
-- Do not reset word-count, writing_spine_mode, or evidence_argument_mode.
update public.assignment_settings
set vocabulary_transfer_mode = 'rebuilt',
    updated_at = now()
where assignment_id = 'mlk-rhetorical-analysis';

insert into public.assignment_settings (
  assignment_id,
  assignment_name,
  word_count_mode,
  word_count_min,
  word_count_max,
  writing_spine_mode,
  evidence_argument_mode,
  vocabulary_transfer_mode,
  updated_at,
  updated_by
)
values (
  'mlk-rhetorical-analysis',
  'MLK Essay Assignment',
  'off',
  null,
  null,
  'rebuilt',
  'rebuilt',
  'rebuilt',
  now(),
  'wp091-migration'
)
on conflict (assignment_id) do update
set vocabulary_transfer_mode = excluded.vocabulary_transfer_mode,
    updated_at = now();

-- Durable Module 1 vocabulary-transfer lesson state (assignment-scoped by user).
create table if not exists public.module1_vocabulary_transfer (
  user_email text primary key,
  schema_version integer not null default 2,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.module1_vocabulary_transfer is
  'WP-091 authoritative in-progress Module 1 transfer vocabulary state. Browser localStorage is a cache only.';

create or replace function public.module1_vocabulary_transfer_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists module1_vocabulary_transfer_updated_at
  on public.module1_vocabulary_transfer;

create trigger module1_vocabulary_transfer_updated_at
  before update on public.module1_vocabulary_transfer
  for each row
  execute procedure public.module1_vocabulary_transfer_set_updated_at();

alter table public.module1_vocabulary_transfer enable row level security;

drop policy if exists "Students can read their vocabulary transfer"
  on public.module1_vocabulary_transfer;
create policy "Students can read their vocabulary transfer"
  on public.module1_vocabulary_transfer
  for select
  using (auth.jwt() ->> 'email' = user_email);

drop policy if exists "Students can insert their vocabulary transfer"
  on public.module1_vocabulary_transfer;
create policy "Students can insert their vocabulary transfer"
  on public.module1_vocabulary_transfer
  for insert
  with check (auth.jwt() ->> 'email' = user_email);

drop policy if exists "Students can update their vocabulary transfer"
  on public.module1_vocabulary_transfer;
create policy "Students can update their vocabulary transfer"
  on public.module1_vocabulary_transfer
  for update
  using (auth.jwt() ->> 'email' = user_email)
  with check (auth.jwt() ->> 'email' = user_email);
