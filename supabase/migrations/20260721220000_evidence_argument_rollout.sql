-- WP-088: Evidence-to-argument rollout mode on assignment_settings.
-- Independent from writing_spine_mode so Modules 2–3 rollback does not flip Modules 4–7.
-- Default legacy for unknown rows. Explicitly enable rebuilt for MLK.

alter table public.assignment_settings
  add column if not exists evidence_argument_mode text not null default 'legacy';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assignment_settings_evidence_argument_mode_check'
  ) then
    alter table public.assignment_settings
      add constraint assignment_settings_evidence_argument_mode_check
      check (evidence_argument_mode in ('legacy', 'rebuilt'));
  end if;
end $$;

comment on column public.assignment_settings.evidence_argument_mode is
  'WP-088 rollout: legacy = pre-rebuild Module 2–3 presentation; rebuilt = accepted WP-086/WP-087 evidence-to-argument spine. Ops may override via EVIDENCE_ARGUMENT_MODE_OVERRIDE. Independent from writing_spine_mode.';

-- Promote the current MLK assignment to the rebuilt evidence-to-argument spine.
-- Do not reset word-count or writing_spine_mode.
update public.assignment_settings
set evidence_argument_mode = 'rebuilt',
    updated_at = now()
where assignment_id = 'mlk-rhetorical-analysis';

-- Ensure an MLK row exists with an explicit evidence-argument mode.
insert into public.assignment_settings (
  assignment_id,
  assignment_name,
  word_count_mode,
  word_count_min,
  word_count_max,
  writing_spine_mode,
  evidence_argument_mode,
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
  now(),
  'wp088-migration'
)
on conflict (assignment_id) do update
set evidence_argument_mode = excluded.evidence_argument_mode,
    updated_at = now();
