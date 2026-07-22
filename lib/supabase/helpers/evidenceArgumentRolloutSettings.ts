/**
 * WP-088 — Read / write assignment evidence-to-argument rollout mode.
 * Independent from writing_spine_mode so rollback boundaries stay separate.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
} from "@/lib/assignments/identity";
import {
  resolveEvidenceArgumentMode,
  validateEvidenceArgumentMode,
  evidenceArgumentCapabilities,
  EVIDENCE_ARGUMENT_MODE_LEGACY,
} from "@/lib/assignments/evidenceArgumentRollout";

function isMissingColumnOrTableError(message: string) {
  return /evidence_argument_mode|assignment_settings|Could not find the table|column .* does not exist/i.test(
    message
  );
}

/**
 * @param {string} [assignmentId]
 */
export async function getAssignmentEvidenceArgumentRollout(
  assignmentId: string = DEFAULT_ASSIGNMENT_ID
) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("assignment_settings")
      .select(
        "assignment_id, assignment_name, evidence_argument_mode, writing_spine_mode, updated_at, updated_by"
      )
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (error) {
      const schemaMissing = isMissingColumnOrTableError(error.message);
      console.warn("evidence_argument_mode read failed:", error.message);
      const mode = resolveEvidenceArgumentMode({
        assignmentId,
        storedMode: null,
      });
      return {
        ok: true as const,
        assignmentId,
        mode,
        capabilities: evidenceArgumentCapabilities(mode),
        source: schemaMissing ? "schema_missing" : "default_legacy",
        schemaOk: !schemaMissing,
        warning: error.message,
      };
    }

    const storedMode = data?.evidence_argument_mode ?? null;
    const mode = resolveEvidenceArgumentMode({
      assignmentId,
      storedMode,
    });

    return {
      ok: true as const,
      assignmentId,
      assignmentName: data?.assignment_name || DEFAULT_ASSIGNMENT_NAME,
      mode,
      storedMode: storedMode || null,
      capabilities: evidenceArgumentCapabilities(mode),
      source: data ? "database" : "default_legacy",
      schemaOk: true,
      updatedAt: data?.updated_at || null,
      updatedBy: data?.updated_by || null,
      writingSpineMode: data?.writing_spine_mode || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const schemaMissing = isMissingColumnOrTableError(message);
    const mode = resolveEvidenceArgumentMode({ assignmentId, storedMode: null });
    return {
      ok: true as const,
      assignmentId,
      mode,
      capabilities: evidenceArgumentCapabilities(mode),
      source: schemaMissing ? "schema_missing" : "default_legacy",
      schemaOk: !schemaMissing,
      warning: message,
    };
  }
}

/**
 * Ops/teacher write — does not delete rebuilt student artifacts.
 * Preserves word-count and writing_spine_mode on the same row.
 * @param {unknown} rawMode
 * @param {{ assignmentId?: string, assignmentName?: string, updatedBy?: string | null }} [opts]
 */
export async function upsertAssignmentEvidenceArgumentRollout(
  rawMode: unknown,
  opts: {
    assignmentId?: string;
    assignmentName?: string;
    updatedBy?: string | null;
  } = {}
) {
  const validated = validateEvidenceArgumentMode(rawMode);
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
        "assignment_id, word_count_mode, word_count_min, word_count_max, assignment_name, writing_spine_mode, evidence_argument_mode"
      )
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (existing.error && isMissingColumnOrTableError(existing.error.message)) {
      return {
        ok: false as const,
        error:
          "evidence_argument_mode schema is missing. Apply migration 20260721220000_evidence_argument_rollout before enabling rollout.",
        status: 503,
        source: "schema_missing",
      };
    }

    const payload: Record<string, unknown> = {
      assignment_id: assignmentId,
      assignment_name:
        existing.data?.assignment_name || assignmentName || DEFAULT_ASSIGNMENT_NAME,
      word_count_mode: existing.data?.word_count_mode || "off",
      word_count_min: existing.data?.word_count_min ?? null,
      word_count_max: existing.data?.word_count_max ?? null,
      evidence_argument_mode: validated.mode,
      updated_at: new Date().toISOString(),
      updated_by: opts.updatedBy || null,
    };

    // Preserve writing_spine_mode when present so M2–3 writes never flip M4–7.
    if (existing.data?.writing_spine_mode) {
      payload.writing_spine_mode = existing.data.writing_spine_mode;
    }

    const { data, error } = await supabase
      .from("assignment_settings")
      .upsert(payload, { onConflict: "assignment_id" })
      .select(
        "assignment_id, assignment_name, evidence_argument_mode, writing_spine_mode, updated_at, updated_by"
      )
      .maybeSingle();

    if (error) {
      if (isMissingColumnOrTableError(error.message)) {
        return {
          ok: false as const,
          error:
            "evidence_argument_mode schema is missing. Apply migration 20260721220000_evidence_argument_rollout before enabling rollout.",
          status: 503,
          source: "schema_missing",
        };
      }
      return { ok: false as const, error: error.message, status: 500 };
    }

    const mode = resolveEvidenceArgumentMode({
      assignmentId,
      storedMode: data?.evidence_argument_mode,
    });

    console.info("[wp088-rollout]", {
      assignmentId,
      mode,
      writingSpineMode: data?.writing_spine_mode || null,
      updatedBy: opts.updatedBy || null,
      // no student prose
    });

    return {
      ok: true as const,
      assignmentId,
      mode,
      capabilities: evidenceArgumentCapabilities(mode),
      source: "database",
      schemaOk: true,
      updatedAt: data?.updated_at || null,
      updatedBy: data?.updated_by || null,
      writingSpineMode: data?.writing_spine_mode || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false as const, error: message, status: 500 };
  }
}

export { EVIDENCE_ARGUMENT_MODE_LEGACY };
