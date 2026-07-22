/**
 * WP-093 — Read / write assignment submission-protocol rollout mode.
 * Independent from writing_spine_mode, evidence_argument_mode, and vocabulary_transfer_mode.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
} from "@/lib/assignments/identity";
import {
  resolveSubmissionProtocolMode,
  validateSubmissionProtocolMode,
  submissionProtocolCapabilities,
  normalizeSubmissionProtocolMode,
} from "@/lib/assignments/submissionProtocolRollout";

function isMissingColumnOrTableError(message: string) {
  return /submission_protocol_mode|assignment_settings|Could not find the table|column .* does not exist/i.test(
    message
  );
}

function resolvedSource(opts: {
  schemaMissing?: boolean;
  hasRow?: boolean;
}) {
  const envOverride = normalizeSubmissionProtocolMode(
    process.env.SUBMISSION_PROTOCOL_MODE_OVERRIDE
  );
  if (envOverride) return "env_override" as const;
  if (opts.schemaMissing) return "schema_missing" as const;
  if (opts.hasRow) return "database" as const;
  return "default_legacy" as const;
}

/**
 * @param {string} [assignmentId]
 */
export async function getAssignmentSubmissionProtocolRollout(
  assignmentId: string = DEFAULT_ASSIGNMENT_ID
) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("assignment_settings")
      .select(
        "assignment_id, assignment_name, submission_protocol_mode, writing_spine_mode, evidence_argument_mode, vocabulary_transfer_mode, updated_at, updated_by"
      )
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (error) {
      const schemaMissing = isMissingColumnOrTableError(error.message);
      console.warn("submission_protocol_mode read failed:", error.message);
      const mode = resolveSubmissionProtocolMode({
        assignmentId,
        storedMode: null,
      });
      const source = resolvedSource({ schemaMissing });
      return {
        ok: true as const,
        assignmentId,
        mode,
        capabilities: submissionProtocolCapabilities(mode),
        source,
        schemaOk: source === "env_override" ? true : !schemaMissing,
        warning: error.message,
      };
    }

    const storedMode = data?.submission_protocol_mode ?? null;
    const mode = resolveSubmissionProtocolMode({
      assignmentId,
      storedMode,
    });

    return {
      ok: true as const,
      assignmentId,
      assignmentName: data?.assignment_name || DEFAULT_ASSIGNMENT_NAME,
      mode,
      storedMode: storedMode || null,
      capabilities: submissionProtocolCapabilities(mode),
      source: resolvedSource({ hasRow: Boolean(data) }),
      schemaOk: true,
      updatedAt: data?.updated_at || null,
      updatedBy: data?.updated_by || null,
      writingSpineMode: data?.writing_spine_mode || null,
      evidenceArgumentMode: data?.evidence_argument_mode || null,
      vocabularyTransferMode: data?.vocabulary_transfer_mode || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const schemaMissing = isMissingColumnOrTableError(message);
    const mode = resolveSubmissionProtocolMode({
      assignmentId,
      storedMode: null,
    });
    const source = resolvedSource({ schemaMissing });
    return {
      ok: true as const,
      assignmentId,
      mode,
      capabilities: submissionProtocolCapabilities(mode),
      source,
      schemaOk: source === "env_override" ? true : !schemaMissing,
      warning: message,
    };
  }
}

/**
 * Ops/teacher write — does not delete guided or legacy Module 8/9 state.
 * Preserves word-count and all earlier independent rollout modes.
 */
export async function upsertAssignmentSubmissionProtocolRollout(
  rawMode: unknown,
  opts: {
    assignmentId?: string;
    assignmentName?: string;
    updatedBy?: string | null;
  } = {}
) {
  const validated = validateSubmissionProtocolMode(rawMode);
  if (!validated.ok) {
    return { ok: false as const, error: validated.error, status: 400 };
  }
  const assignmentId: string = opts.assignmentId || DEFAULT_ASSIGNMENT_ID;
  const assignmentName: string = opts.assignmentName || DEFAULT_ASSIGNMENT_NAME;

  try {
    const supabase = getSupabaseAdmin();
    const existing = await supabase
      .from("assignment_settings")
      .select(
        "assignment_id, word_count_mode, word_count_min, word_count_max, assignment_name, writing_spine_mode, evidence_argument_mode, vocabulary_transfer_mode, submission_protocol_mode"
      )
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (existing.error && isMissingColumnOrTableError(existing.error.message)) {
      return {
        ok: false as const,
        error:
          "submission_protocol_mode schema missing — apply WP-093 migration.",
        status: 503,
        schemaOk: false,
      };
    }

    const now = new Date().toISOString();
    const row = {
      assignment_id: assignmentId,
      assignment_name:
        existing.data?.assignment_name || assignmentName || DEFAULT_ASSIGNMENT_NAME,
      word_count_mode: existing.data?.word_count_mode || "off",
      word_count_min: existing.data?.word_count_min ?? null,
      word_count_max: existing.data?.word_count_max ?? null,
      writing_spine_mode: existing.data?.writing_spine_mode || "legacy",
      evidence_argument_mode: existing.data?.evidence_argument_mode || "legacy",
      vocabulary_transfer_mode:
        existing.data?.vocabulary_transfer_mode || "legacy",
      submission_protocol_mode: validated.mode,
      updated_at: now,
      updated_by: opts.updatedBy || null,
    };

    const { data, error } = await supabase
      .from("assignment_settings")
      .upsert(row, { onConflict: "assignment_id" })
      .select(
        "assignment_id, submission_protocol_mode, writing_spine_mode, evidence_argument_mode, vocabulary_transfer_mode, updated_at, updated_by"
      )
      .maybeSingle();

    if (error) {
      if (isMissingColumnOrTableError(error.message)) {
        return {
          ok: false as const,
          error:
            "submission_protocol_mode schema missing — apply WP-093 migration.",
          status: 503,
          schemaOk: false,
        };
      }
      return { ok: false as const, error: error.message, status: 500 };
    }

    const mode = resolveSubmissionProtocolMode({
      assignmentId,
      storedMode: data?.submission_protocol_mode,
    });

    console.info("[wp093-rollout]", {
      assignmentId,
      mode,
      updatedBy: opts.updatedBy || null,
    });

    return {
      ok: true as const,
      assignmentId,
      mode,
      capabilities: submissionProtocolCapabilities(mode),
      source: "database",
      schemaOk: true,
      updatedAt: data?.updated_at || now,
      updatedBy: data?.updated_by || opts.updatedBy || null,
      writingSpineMode: data?.writing_spine_mode || null,
      evidenceArgumentMode: data?.evidence_argument_mode || null,
      vocabularyTransferMode: data?.vocabulary_transfer_mode || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isMissingColumnOrTableError(message)) {
      return {
        ok: false as const,
        error:
          "submission_protocol_mode schema missing — apply WP-093 migration.",
        status: 503,
        schemaOk: false,
      };
    }
    return { ok: false as const, error: message, status: 500 };
  }
}
