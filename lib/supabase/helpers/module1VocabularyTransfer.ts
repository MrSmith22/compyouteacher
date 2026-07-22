/**
 * WP-091 — Server persistence for Module 1 vocabulary-transfer lesson state.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  VOCABULARY_TRANSFER_SCHEMA_VERSION,
  normalizeVocabularyTransferState,
} from "@/lib/module1/vocabularyTransferState";

function isMissingTableError(message: string) {
  return /module1_vocabulary_transfer|Could not find the table|relation .* does not exist/i.test(
    message
  );
}

/**
 * @param {string} userEmail
 */
export async function getModule1VocabularyTransferState(userEmail: string) {
  const email = String(userEmail || "").trim().toLowerCase();
  if (!email) {
    return { ok: false as const, error: "Missing user email", status: 400 };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module1_vocabulary_transfer")
      .select("user_email, schema_version, state, updated_at")
      .eq("user_email", email)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error.message)) {
        return {
          ok: false as const,
          error: "module1_vocabulary_transfer schema missing",
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
        vocabularyTransfer: null,
        updatedAt: null,
      };
    }

    return {
      ok: true as const,
      schemaOk: true,
      exists: true,
      vocabularyTransfer: normalizeVocabularyTransferState(data.state),
      schemaVersion: data.schema_version,
      updatedAt: data.updated_at || null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isMissingTableError(message)) {
      return {
        ok: false as const,
        error: "module1_vocabulary_transfer schema missing",
        status: 503,
        schemaOk: false,
      };
    }
    return { ok: false as const, error: message, status: 500 };
  }
}

/**
 * Upsert authoritative vocabulary transfer state. Never deletes on rollback of mode.
 * @param {string} userEmail
 * @param {unknown} vocabularyTransfer
 */
export async function upsertModule1VocabularyTransferState(
  userEmail: string,
  vocabularyTransfer: unknown
) {
  const email = String(userEmail || "").trim().toLowerCase();
  if (!email) {
    return { ok: false as const, error: "Missing user email", status: 400 };
  }

  const normalized = normalizeVocabularyTransferState(vocabularyTransfer);
  const now = new Date().toISOString();
  normalized.updatedAt = now;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module1_vocabulary_transfer")
      .upsert(
        {
          user_email: email,
          schema_version: VOCABULARY_TRANSFER_SCHEMA_VERSION,
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
          error: "module1_vocabulary_transfer schema missing",
          status: 503,
          schemaOk: false,
        };
      }
      return { ok: false as const, error: error.message, status: 500 };
    }

    return {
      ok: true as const,
      schemaOk: true,
      vocabularyTransfer: normalizeVocabularyTransferState(data?.state),
      updatedAt: data?.updated_at || now,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isMissingTableError(message)) {
      return {
        ok: false as const,
        error: "module1_vocabulary_transfer schema missing",
        status: 503,
        schemaOk: false,
      };
    }
    return { ok: false as const, error: message, status: 500 };
  }
}
