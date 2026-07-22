/**
 * WP-092 — Server persistence for guided APA protocol state.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  GUIDED_APA_STATE_SCHEMA_VERSION,
  normalizeGuidedApaProtocolState,
  isGuidedApaWriteStale,
} from "@/lib/module9/guidedApaProtocolState";

function isMissingTableError(message: string) {
  return /module9_guided_apa_protocol|Could not find the table|relation .* does not exist/i.test(
    message
  );
}

export async function getModule9GuidedApaProtocolState(userEmail: string) {
  const email = String(userEmail || "").trim().toLowerCase();
  if (!email) {
    return { ok: false as const, error: "Missing user email", status: 400 };
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module9_guided_apa_protocol")
      .select("user_email, schema_version, state, updated_at")
      .eq("user_email", email)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error.message)) {
        return {
          ok: false as const,
          error: "module9_guided_apa_protocol schema missing",
          status: 503,
          schemaOk: false,
        };
      }
      return { ok: false as const, error: error.message, status: 500 };
    }
    if (!data) {
      return {
        ok: true as const,
        schemaOk: true,
        exists: false,
        state: null,
        updatedAt: null,
      };
    }
    return {
      ok: true as const,
      schemaOk: true,
      exists: true,
      state: normalizeGuidedApaProtocolState(data.state),
      updatedAt: data.updated_at || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isMissingTableError(message)) {
      return {
        ok: false as const,
        error: "module9_guided_apa_protocol schema missing",
        status: 503,
        schemaOk: false,
      };
    }
    return { ok: false as const, error: message, status: 500 };
  }
}

export async function upsertModule9GuidedApaProtocolState(
  userEmail: string,
  state: unknown
) {
  const email = String(userEmail || "").trim().toLowerCase();
  if (!email) {
    return { ok: false as const, error: "Missing user email", status: 400 };
  }
  const normalized = normalizeGuidedApaProtocolState(state);
  const now = new Date().toISOString();
  try {
    const existing = await getModule9GuidedApaProtocolState(email);
    // Compare against semantic state.updatedAt — not row.updated_at.
    // The table trigger advances row.updated_at with Postgres now(), which can
    // be ~100ms after the JSON timestamp and false-stale legitimate saves.
    const existingStateUpdatedAt = existing.state?.updatedAt || null;
    if (
      existing.ok &&
      existing.exists &&
      isGuidedApaWriteStale(normalized.updatedAt, existingStateUpdatedAt)
    ) {
      return {
        ok: true as const,
        schemaOk: true,
        stale: true as const,
        state: existing.state,
        updatedAt: existingStateUpdatedAt || existing.updatedAt,
      };
    }

    // Persist wall-clock on write so later clients can detect stale autosaves.
    normalized.updatedAt = now;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module9_guided_apa_protocol")
      .upsert(
        {
          user_email: email,
          schema_version: GUIDED_APA_STATE_SCHEMA_VERSION,
          state: normalized,
          updated_at: now,
        },
        { onConflict: "user_email" }
      )
      .select("user_email, schema_version, state, updated_at")
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error.message)) {
        return {
          ok: false as const,
          error: "module9_guided_apa_protocol schema missing",
          status: 503,
          schemaOk: false,
        };
      }
      return { ok: false as const, error: error.message, status: 500 };
    }
    return {
      ok: true as const,
      schemaOk: true,
      stale: false as const,
      state: normalizeGuidedApaProtocolState(data?.state),
      updatedAt: data?.updated_at || now,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isMissingTableError(message)) {
      return {
        ok: false as const,
        error: "module9_guided_apa_protocol schema missing",
        status: 503,
        schemaOk: false,
      };
    }
    return { ok: false as const, error: message, status: 500 };
  }
}
