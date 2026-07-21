-- WP-085: Writing-spine rollout mode on assignment_settings.
-- Default legacy for unknown rows. Explicitly enable rebuilt for MLK.

alter table public.assignment_settings
  add column if not exists writing_spine_mode text not null default 'legacy';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assignment_settings_writing_spine_mode_check'
  ) then
    alter table public.assignment_settings
      add constraint assignment_settings_writing_spine_mode_check
      check (writing_spine_mode in ('legacy', 'rebuilt'));
  end if;
end $$;

comment on column public.assignment_settings.writing_spine_mode is
  'WP-085 rollout: legacy = pre-rebuild presentation; rebuilt = Phase 2 Modules 4–7 spine. Ops may override via WRITING_SPINE_MODE_OVERRIDE.';

-- Promote the current MLK assignment to the rebuilt spine when a settings row exists.
update public.assignment_settings
set writing_spine_mode = 'rebuilt',
    updated_at = now()
where assignment_id = 'mlk-rhetorical-analysis';

-- Ensure an MLK row exists so production has an explicit mode (word-count stays off if new).
insert into public.assignment_settings (
  assignment_id,
  assignment_name,
  word_count_mode,
  word_count_min,
  word_count_max,
  writing_spine_mode,
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
  now(),
  'wp085-migration'
)
on conflict (assignment_id) do update
set writing_spine_mode = excluded.writing_spine_mode,
    updated_at = now();
