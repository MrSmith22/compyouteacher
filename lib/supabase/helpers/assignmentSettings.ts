/**
 * WP-084 — Persist / read assignment word-count settings.
 * Prefers `assignment_settings` table. In development, if the table is missing,
 * falls back to `.dev-assignment-settings.json` so teacher/student acceptance
 * can proceed before migration is applied on remote Supabase.
 */

import fs from "node:fs";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_WORD_COUNT_SETTINGS,
  normalizeWordCountSettings,
  validateWordCountSettings,
} from "@/lib/assignments/wordCountSettings";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
} from "@/lib/assignments/identity";

function rowToSettings(row: Record<string, unknown> | null) {
  if (!row) return { ...DEFAULT_WORD_COUNT_SETTINGS };
  return normalizeWordCountSettings({
    assignmentId: row.assignment_id,
    assignmentName: row.assignment_name,
    mode: row.word_count_mode,
    minimum: row.word_count_min,
    maximum: row.word_count_max,
  });
}

function devFallbackPath() {
  return path.join(process.cwd(), ".dev-assignment-settings.json");
}

function readDevFallback(assignmentId: string) {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const raw = fs.readFileSync(devFallbackPath(), "utf8");
    const all = JSON.parse(raw);
    const row = all?.[assignmentId];
    if (!row) return null;
    return {
      settings: normalizeWordCountSettings(row),
      updatedAt: row.updatedAt || null,
      updatedBy: row.updatedBy || null,
    };
  } catch {
    return null;
  }
}

function writeDevFallback(
  settings: ReturnType<typeof normalizeWordCountSettings>,
  updatedBy: string | null
) {
  if (process.env.NODE_ENV === "production") {
    return { ok: false as const, error: "Dev fallback disabled in production" };
  }
  let all: Record<string, unknown> = {};
  try {
    all = JSON.parse(fs.readFileSync(devFallbackPath(), "utf8"));
  } catch {
    all = {};
  }
  all[settings.assignmentId] = {
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  fs.writeFileSync(devFallbackPath(), JSON.stringify(all, null, 2), "utf8");
  return {
    ok: true as const,
    settings,
    source: "dev_fallback" as const,
    updatedAt: all[settings.assignmentId]
      ? (all[settings.assignmentId] as { updatedAt?: string }).updatedAt
      : null,
    updatedBy,
  };
}

function isMissingTableError(message: string) {
  return /relation .*assignment_settings.* does not exist|Could not find the table/i.test(
    message
  );
}

/**
 * @param {string} [assignmentId]
 */
export async function getAssignmentWordCountSettings(
  assignmentId: string = DEFAULT_ASSIGNMENT_ID
) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("assignment_settings")
      .select(
        "assignment_id, assignment_name, word_count_mode, word_count_min, word_count_max, updated_at, updated_by"
      )
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (error) {
      console.warn("assignment_settings read failed:", error.message);
      // File fallback only when the table is missing — not when a row is absent.
      if (isMissingTableError(error.message)) {
        if (process.env.NODE_ENV === "production") {
          return {
            ok: false as const,
            settings: {
              ...DEFAULT_WORD_COUNT_SETTINGS,
              assignmentId,
            },
            source: "schema_missing",
            warning: error.message,
          };
        }
        const fallback = readDevFallback(assignmentId);
        if (fallback) {
          return {
            ok: true as const,
            settings: fallback.settings,
            source: "dev_fallback",
            updatedAt: fallback.updatedAt,
            updatedBy: fallback.updatedBy,
            warning: error.message,
          };
        }
      }
      return {
        ok: true as const,
        settings: {
          ...DEFAULT_WORD_COUNT_SETTINGS,
          assignmentId,
        },
        source: "default_off",
        warning: error.message,
      };
    }

    if (!data) {
      // Table exists; missing row is the safe default (off), not the local file.
      return {
        ok: true as const,
        settings: {
          ...DEFAULT_WORD_COUNT_SETTINGS,
          assignmentId,
          assignmentName: DEFAULT_ASSIGNMENT_NAME,
        },
        source: "default_off",
      };
    }

    return {
      ok: true as const,
      settings: rowToSettings(data),
      source: "database",
      updatedAt: data.updated_at || null,
      updatedBy: data.updated_by || null,
    };
  } catch (err) {
    console.warn("assignment_settings read exception:", err);
    const message = err instanceof Error ? err.message : String(err);
    if (isMissingTableError(message)) {
      const fallback = readDevFallback(assignmentId);
      if (fallback) {
        return {
          ok: true as const,
          settings: fallback.settings,
          source: "dev_fallback",
          updatedAt: fallback.updatedAt,
          updatedBy: fallback.updatedBy,
        };
      }
    }
    return {
      ok: true as const,
      settings: {
        ...DEFAULT_WORD_COUNT_SETTINGS,
        assignmentId,
      },
      source: "default_off",
      warning: message,
    };
  }
}

/**
 * @param {unknown} raw
 * @param {{ updatedBy?: string | null }} [opts]
 */
export async function upsertAssignmentWordCountSettings(
  raw: unknown,
  opts: { updatedBy?: string | null } = {}
) {
  const validated = validateWordCountSettings(raw);
  if (!validated.ok) {
    return { ok: false as const, error: validated.error, status: 400 };
  }
  const settings = validated.settings;

  try {
    const supabase = getSupabaseAdmin();
    const payload = {
      assignment_id: settings.assignmentId,
      assignment_name: settings.assignmentName,
      word_count_mode: settings.mode,
      word_count_min: settings.minimum,
      word_count_max: settings.maximum,
      updated_at: new Date().toISOString(),
      updated_by: opts.updatedBy || null,
    };
    const { data, error } = await supabase
      .from("assignment_settings")
      .upsert(payload, { onConflict: "assignment_id" })
      .select(
        "assignment_id, assignment_name, word_count_mode, word_count_min, word_count_max, updated_at, updated_by"
      )
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error.message)) {
        const fallback = writeDevFallback(settings, opts.updatedBy || null);
        if (fallback.ok) return { ...fallback, status: 200 };
      }
      return {
        ok: false as const,
        error: error.message,
        status: 500,
      };
    }

    return {
      ok: true as const,
      settings: rowToSettings(data),
      source: "database",
      updatedAt: data?.updated_at || null,
      updatedBy: data?.updated_by || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isMissingTableError(message)) {
      const fallback = writeDevFallback(settings, opts.updatedBy || null);
      if (fallback.ok) return { ...fallback, status: 200 };
    }
    return {
      ok: false as const,
      error: message,
      status: 500,
    };
  }
}
