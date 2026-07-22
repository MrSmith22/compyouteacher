/**
 * WP-091 — Read / write assignment vocabulary-transfer rollout mode.
 * Independent from writing_spine_mode and evidence_argument_mode.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
} from "@/lib/assignments/identity";
import {
  resolveVocabularyTransferMode,
  validateVocabularyTransferMode,
  vocabularyTransferCapabilities,
} from "@/lib/assignments/vocabularyTransferRollout";

function isMissingColumnOrTableError(message: string) {
  return /vocabulary_transfer_mode|assignment_settings|Could not find the table|column .* does not exist/i.test(
    message
  );
}

/**
 * @param {string} [assignmentId]
 */
export async function getAssignmentVocabularyTransferRollout(
  assignmentId: string = DEFAULT_ASSIGNMENT_ID
) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("assignment_settings")
      .select(
        "assignment_id, assignment_name, vocabulary_transfer_mode, writing_spine_mode, evidence_argument_mode, updated_at, updated_by"
      )
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (error) {
      const schemaMissing = isMissingColumnOrTableError(error.message);
      console.warn("vocabulary_transfer_mode read failed:", error.message);
      const mode = resolveVocabularyTransferMode({
        assignmentId,
        storedMode: null,
      });
      return {
        ok: true as const,
        assignmentId,
        mode,
        capabilities: vocabularyTransferCapabilities(mode),
        source: schemaMissing ? "schema_missing" : "default_legacy",
        schemaOk: !schemaMissing,
        warning: error.message,
      };
    }

    const storedMode = data?.vocabulary_transfer_mode ?? null;
    const mode = resolveVocabularyTransferMode({
      assignmentId,
      storedMode,
    });

    return {
      ok: true as const,
      assignmentId,
      assignmentName: data?.assignment_name || DEFAULT_ASSIGNMENT_NAME,
      mode,
      storedMode: storedMode || null,
      capabilities: vocabularyTransferCapabilities(mode),
      source: data ? "database" : "default_legacy",
      schemaOk: true,
      updatedAt: data?.updated_at || null,
      updatedBy: data?.updated_by || null,
      writingSpineMode: data?.writing_spine_mode || null,
      evidenceArgumentMode: data?.evidence_argument_mode || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const schemaMissing = isMissingColumnOrTableError(message);
    const mode = resolveVocabularyTransferMode({
      assignmentId,
      storedMode: null,
    });
    return {
      ok: true as const,
      assignmentId,
      mode,
      capabilities: vocabularyTransferCapabilities(mode),
      source: schemaMissing ? "schema_missing" : "default_legacy",
      schemaOk: !schemaMissing,
      warning: message,
    };
  }
}

/**
 * Ops/teacher write — does not delete rebuilt student lesson state.
 * Preserves word-count, writing_spine_mode, and evidence_argument_mode.
 */
export async function upsertAssignmentVocabularyTransferRollout(
  rawMode: unknown,
  opts: {
    assignmentId?: string;
    assignmentName?: string;
    updatedBy?: string | null;
  } = {}
) {
  const validated = validateVocabularyTransferMode(rawMode);
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
        "assignment_id, word_count_mode, word_count_min, word_count_max, assignment_name, writing_spine_mode, evidence_argument_mode, vocabulary_transfer_mode"
      )
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (existing.error && isMissingColumnOrTableError(existing.error.message)) {
      return {
        ok: false as const,
        error:
          "vocabulary_transfer_mode schema missing — apply WP-091 migration.",
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
      vocabulary_transfer_mode: validated.mode,
      updated_at: now,
      updated_by: opts.updatedBy || null,
    };

    const { data, error } = await supabase
      .from("assignment_settings")
      .upsert(row, { onConflict: "assignment_id" })
      .select(
        "assignment_id, vocabulary_transfer_mode, writing_spine_mode, evidence_argument_mode, updated_at, updated_by"
      )
      .maybeSingle();

    if (error) {
      if (isMissingColumnOrTableError(error.message)) {
        return {
          ok: false as const,
          error:
            "vocabulary_transfer_mode schema missing — apply WP-091 migration.",
          status: 503,
          schemaOk: false,
        };
      }
      return { ok: false as const, error: error.message, status: 500 };
    }

    const mode = resolveVocabularyTransferMode({
      assignmentId,
      storedMode: data?.vocabulary_transfer_mode,
    });

    return {
      ok: true as const,
      assignmentId,
      mode,
      capabilities: vocabularyTransferCapabilities(mode),
      source: "database",
      schemaOk: true,
      updatedAt: data?.updated_at || now,
      updatedBy: data?.updated_by || opts.updatedBy || null,
      writingSpineMode: data?.writing_spine_mode || null,
      evidenceArgumentMode: data?.evidence_argument_mode || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isMissingColumnOrTableError(message)) {
      return {
        ok: false as const,
        error:
          "vocabulary_transfer_mode schema missing — apply WP-091 migration.",
        status: 503,
        schemaOk: false,
      };
    }
    return { ok: false as const, error: message, status: 500 };
  }
}
