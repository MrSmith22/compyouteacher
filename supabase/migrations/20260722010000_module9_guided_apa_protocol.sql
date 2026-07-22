-- WP-092: Durable Module 9 guided APA protocol state (development Phase 5).
-- Additive. Does not delete module9_checklist or module9_quiz history.

create table if not exists public.module9_guided_apa_protocol (
  user_email text primary key,
  schema_version integer not null default 1,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.module9_guided_apa_protocol is
  'WP-092 semantic guided-APA protocol state. Legacy module9_checklist/quiz remain historical only.';

create or replace function public.module9_guided_apa_protocol_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists module9_guided_apa_protocol_updated_at
  on public.module9_guided_apa_protocol;

create trigger module9_guided_apa_protocol_updated_at
  before update on public.module9_guided_apa_protocol
  for each row
  execute procedure public.module9_guided_apa_protocol_set_updated_at();

alter table public.module9_guided_apa_protocol enable row level security;

drop policy if exists "Students can read their guided apa protocol"
  on public.module9_guided_apa_protocol;
create policy "Students can read their guided apa protocol"
  on public.module9_guided_apa_protocol
  for select
  using (auth.jwt() ->> 'email' = user_email);

drop policy if exists "Students can insert their guided apa protocol"
  on public.module9_guided_apa_protocol;
create policy "Students can insert their guided apa protocol"
  on public.module9_guided_apa_protocol
  for insert
  with check (auth.jwt() ->> 'email' = user_email);

drop policy if exists "Students can update their guided apa protocol"
  on public.module9_guided_apa_protocol;
create policy "Students can update their guided apa protocol"
  on public.module9_guided_apa_protocol
  for update
  using (auth.jwt() ->> 'email' = user_email)
  with check (auth.jwt() ->> 'email' = user_email);
