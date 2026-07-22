-- WP-093: Modules 8–9 submission-protocol rollout mode.
-- Independent from writing_spine_mode, evidence_argument_mode, and vocabulary_transfer_mode.
-- Default legacy for unknown rows. Explicitly enable rebuilt for MLK.
-- Rollback contract: set submission_protocol_mode = 'legacy'. Does NOT delete
-- module9_guided_apa_protocol, module9_checklist, module9_quiz, exported_docs,
-- drafts, student_exports, or progression.

alter table public.assignment_settings
  add column if not exists submission_protocol_mode text not null default 'legacy';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assignment_settings_submission_protocol_mode_check'
  ) then
    alter table public.assignment_settings
      add constraint assignment_settings_submission_protocol_mode_check
      check (submission_protocol_mode in ('legacy', 'rebuilt'));
  end if;
end $$;

comment on column public.assignment_settings.submission_protocol_mode is
  'WP-093 rollout: legacy = pre-rebuild Module 8/9 checklists + quiz; rebuilt = accepted WP-092 guided APA protocol. Ops may override via SUBMISSION_PROTOCOL_MODE_OVERRIDE. Independent from writing_spine_mode, evidence_argument_mode, and vocabulary_transfer_mode. Rollback changes presentation only.';

-- Promote the current MLK assignment to rebuilt submission protocol.
-- Do not reset word-count or Modules 1–7 rollout modes.
update public.assignment_settings
set submission_protocol_mode = 'rebuilt',
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
  submission_protocol_mode,
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
  'rebuilt',
  now(),
  'wp093-migration'
)
on conflict (assignment_id) do update
set submission_protocol_mode = excluded.submission_protocol_mode,
    updated_at = now();
