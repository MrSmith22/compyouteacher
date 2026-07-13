-- CP-G Module 6: additive draft_meta, monotonic draft_revision, atomic write RPC.
-- Idempotent. Safe on legacy rows. Apply manually in Supabase SQL editor if needed.
--
-- Security: SECURITY DEFINER with fixed search_path. EXECUTE granted only to
-- service_role (used by getSupabaseAdmin). Client/anon cannot call directly.
-- Session email is enforced by the application before invoking this function.
--
-- Revision contract: p_expected_revision is mandatory (no default). First insert
-- requires 0. Every accepted write increments draft_revision by 1.
-- pg_advisory_xact_lock serializes concurrent first inserts per user/module.

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------

ALTER TABLE public.student_drafts
  ADD COLUMN IF NOT EXISTS draft_meta jsonb;

ALTER TABLE public.student_drafts
  ADD COLUMN IF NOT EXISTS draft_revision bigint NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.student_drafts.draft_meta IS
  'Module 6 additive UI metadata (current section, source outline signature, completed ids). Never store student prose here.';

COMMENT ON COLUMN public.student_drafts.draft_revision IS
  'Monotonic Module 6 write revision for CAS stale detection. Incremented on every accepted autosave/navigate/finalize.';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.module6_sections_to_full_text(p_sections jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT string_agg(elem, E'\n\n' ORDER BY ord)
      FROM jsonb_array_elements_text(
        CASE
          WHEN jsonb_typeof(p_sections) = 'array' THEN p_sections
          ELSE '[]'::jsonb
        END
      ) WITH ORDINALITY AS t(elem, ord)
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.module6_sections_json_equal(a jsonb, b jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(a, '[]'::jsonb) = COALESCE(b, '[]'::jsonb);
$$;

-- ---------------------------------------------------------------------------
-- Atomic write RPC
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.write_module6_draft_atomic(
  p_user_email text,
  p_action text,
  p_sections jsonb,
  p_draft_meta jsonb,
  p_expected_revision bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.student_drafts%ROWTYPE;
  v_full_text text;
  v_new_revision bigint;
  v_now timestamptz := now();
  v_sections jsonb;
BEGIN
  IF p_user_email IS NULL OR btrim(p_user_email) = '' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'status', 'error',
      'error', 'missing_user_email'
    );
  END IF;

  IF p_action IS NULL OR p_action NOT IN ('autosave', 'navigate', 'finalize') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'status', 'error',
      'error', 'unsupported_action'
    );
  END IF;

  IF p_sections IS NULL OR jsonb_typeof(p_sections) <> 'array' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'status', 'error',
      'error', 'invalid_sections'
    );
  END IF;

  IF p_expected_revision IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'status', 'error',
      'error', 'missing_revision',
      'code', 'missing_revision'
    );
  END IF;

  IF p_expected_revision < 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'status', 'error',
      'error', 'invalid_revision',
      'code', 'invalid_revision'
    );
  END IF;

  IF p_action = 'finalize' THEN
    IF p_draft_meta IS NULL OR jsonb_typeof(p_draft_meta) <> 'object' THEN
      RETURN jsonb_build_object(
        'ok', false,
        'status', 'error',
        'error', 'missing_draft_meta',
        'code', 'missing_metadata'
      );
    END IF;
  END IF;

  v_sections := p_sections;
  v_full_text := public.module6_sections_to_full_text(v_sections);

  -- Serialize all Module 6 writes for this user, including concurrent first inserts.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_email), 6);

  SELECT *
  INTO v_row
  FROM public.student_drafts
  WHERE user_email = p_user_email
    AND module = 6
  FOR UPDATE;

  IF FOUND THEN
    IF COALESCE(v_row.locked, false) = true THEN
      IF p_action = 'finalize' THEN
        IF public.module6_sections_json_equal(v_row.sections::jsonb, v_sections) THEN
          RETURN jsonb_build_object(
            'ok', true,
            'status', 'already_finalized',
            'locked', true,
            'revision', COALESCE(v_row.draft_revision, 0),
            'full_text', COALESCE(v_row.full_text, v_full_text)
          );
        END IF;
        RETURN jsonb_build_object(
          'ok', false,
          'status', 'locked',
          'locked', true,
          'revision', COALESCE(v_row.draft_revision, 0),
          'error', 'draft_already_locked'
        );
      END IF;

      RETURN jsonb_build_object(
        'ok', false,
        'status', 'locked',
        'locked', true,
        'revision', COALESCE(v_row.draft_revision, 0),
        'error', 'draft_locked'
      );
    END IF;

    IF COALESCE(v_row.draft_revision, 0) <> p_expected_revision THEN
      RETURN jsonb_build_object(
        'ok', false,
        'status', 'stale',
        'locked', COALESCE(v_row.locked, false),
        'revision', COALESCE(v_row.draft_revision, 0),
        'error', 'revision_mismatch'
      );
    END IF;

    v_new_revision := COALESCE(v_row.draft_revision, 0) + 1;

    UPDATE public.student_drafts
    SET
      sections = v_sections,
      full_text = v_full_text,
      draft_meta = CASE
        WHEN p_draft_meta IS NOT NULL THEN p_draft_meta
        ELSE draft_meta
      END,
      locked = CASE WHEN p_action = 'finalize' THEN true ELSE locked END,
      draft_revision = v_new_revision,
      updated_at = v_now
    WHERE user_email = p_user_email
      AND module = 6;

    RETURN jsonb_build_object(
      'ok', true,
      'status', CASE WHEN p_action = 'finalize' THEN 'finalized' ELSE 'saved' END,
      'locked', (p_action = 'finalize'),
      'revision', v_new_revision,
      'full_text', v_full_text
    );
  END IF;

  -- No row yet — first creation requires revision 0.
  IF p_expected_revision <> 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'status', 'stale',
      'locked', false,
      'revision', 0,
      'error', 'revision_mismatch'
    );
  END IF;

  v_new_revision := 1;

  INSERT INTO public.student_drafts (
    user_email,
    module,
    sections,
    full_text,
    locked,
    draft_meta,
    draft_revision,
    updated_at
  ) VALUES (
    p_user_email,
    6,
    v_sections,
    v_full_text,
    (p_action = 'finalize'),
    p_draft_meta,
    v_new_revision,
    v_now
  );

  RETURN jsonb_build_object(
    'ok', true,
    'status', CASE WHEN p_action = 'finalize' THEN 'finalized' ELSE 'saved' END,
    'locked', (p_action = 'finalize'),
    'revision', v_new_revision,
    'full_text', v_full_text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.write_module6_draft_atomic(text, text, jsonb, jsonb, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.write_module6_draft_atomic(text, text, jsonb, jsonb, bigint) TO service_role;
