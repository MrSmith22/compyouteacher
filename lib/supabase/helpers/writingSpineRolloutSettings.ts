/**
 * WP-085 — Read / write assignment writing-spine rollout mode.
 * Separate from ordinary student word-count settings surface.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
} from "@/lib/assignments/identity";
import {
  resolveWritingSpineMode,
  validateWritingSpineMode,
  writingSpineCapabilities,
  WRITING_SPINE_MODE_LEGACY,
} from "@/lib/assignments/writingSpineRollout";

function isMissingColumnOrTableError(message: string) {
  return /writing_spine_mode|assignment_settings|Could not find the table|column .* does not exist/i.test(
    message
  );
}

/**
 * @param {string} [assignmentId]
 */
export async function getAssignmentWritingSpineRollout(
  assignmentId: string = DEFAULT_ASSIGNMENT_ID
) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("assignment_settings")
      .select(
        "assignment_id, assignment_name, writing_spine_mode, updated_at, updated_by"
      )
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (error) {
      const schemaMissing = isMissingColumnOrTableError(error.message);
      console.warn("writing_spine_mode read failed:", error.message);
      const mode = resolveWritingSpineMode({
        assignmentId,
        storedMode: null,
      });
      return {
        ok: true as const,
        assignmentId,
        mode,
        capabilities: writingSpineCapabilities(mode),
        source: schemaMissing ? "schema_missing" : "default_legacy",
        schemaOk: !schemaMissing,
        warning: error.message,
      };
    }

    const storedMode = data?.writing_spine_mode ?? null;
    const mode = resolveWritingSpineMode({
      assignmentId,
      storedMode,
    });

    return {
      ok: true as const,
      assignmentId,
      assignmentName: data?.assignment_name || DEFAULT_ASSIGNMENT_NAME,
      mode,
      storedMode: storedMode || null,
      capabilities: writingSpineCapabilities(mode),
      source: data ? "database" : "default_legacy",
      schemaOk: true,
      updatedAt: data?.updated_at || null,
      updatedBy: data?.updated_by || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const schemaMissing = isMissingColumnOrTableError(message);
    const mode = resolveWritingSpineMode({ assignmentId, storedMode: null });
    return {
      ok: true as const,
      assignmentId,
      mode,
      capabilities: writingSpineCapabilities(mode),
      source: schemaMissing ? "schema_missing" : "default_legacy",
      schemaOk: !schemaMissing,
      warning: message,
    };
  }
}

/**
 * Ops/teacher write — does not delete rebuilt student artifacts.
 * @param {unknown} rawMode
 * @param {{ assignmentId?: string, assignmentName?: string, updatedBy?: string | null }} [opts]
 */
export async function upsertAssignmentWritingSpineRollout(
  rawMode: unknown,
  opts: {
    assignmentId?: string;
    assignmentName?: string;
    updatedBy?: string | null;
  } = {}
) {
  const validated = validateWritingSpineMode(rawMode);
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
        "assignment_id, word_count_mode, word_count_min, word_count_max, assignment_name"
      )
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (existing.error && isMissingColumnOrTableError(existing.error.message)) {
      return {
        ok: false as const,
        error:
          "writing_spine_mode schema is missing. Apply migration 20260721140000_writing_spine_rollout before enabling rollout.",
        status: 503,
        source: "schema_missing",
      };
    }

    const payload = {
      assignment_id: assignmentId,
      assignment_name:
        existing.data?.assignment_name || assignmentName || DEFAULT_ASSIGNMENT_NAME,
      word_count_mode: existing.data?.word_count_mode || "off",
      word_count_min: existing.data?.word_count_min ?? null,
      word_count_max: existing.data?.word_count_max ?? null,
      writing_spine_mode: validated.mode,
      updated_at: new Date().toISOString(),
      updated_by: opts.updatedBy || null,
    };

    const { data, error } = await supabase
      .from("assignment_settings")
      .upsert(payload, { onConflict: "assignment_id" })
      .select(
        "assignment_id, assignment_name, writing_spine_mode, updated_at, updated_by"
      )
      .maybeSingle();

    if (error) {
      if (isMissingColumnOrTableError(error.message)) {
        return {
          ok: false as const,
          error:
            "writing_spine_mode schema is missing. Apply migration 20260721140000_writing_spine_rollout before enabling rollout.",
          status: 503,
          source: "schema_missing",
        };
      }
      return { ok: false as const, error: error.message, status: 500 };
    }

    const mode = resolveWritingSpineMode({
      assignmentId,
      storedMode: data?.writing_spine_mode,
    });

    console.info("[wp085-rollout]", {
      assignmentId,
      mode,
      updatedBy: opts.updatedBy || null,
      // no student prose
    });

    return {
      ok: true as const,
      assignmentId,
      mode,
      capabilities: writingSpineCapabilities(mode),
      source: "database",
      schemaOk: true,
      updatedAt: data?.updated_at || null,
      updatedBy: data?.updated_by || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false as const, error: message, status: 500 };
  }
}

export { WRITING_SPINE_MODE_LEGACY };
