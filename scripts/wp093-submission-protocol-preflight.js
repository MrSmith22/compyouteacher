#!/usr/bin/env node
/**
 * WP-093 — Read-only production readiness preflight for Modules 8–9 submission-protocol rollout.
 * Usage: node scripts/wp093-submission-protocol-preflight.js
 * Optional: --enable-mlk-rebuilt (reviewed ops enable only).
 */

const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split("\n")
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1)];
      })
  );
}

async function main() {
  const env = { ...process.env, ...loadEnv() };
  const results = [];
  const fail = (id, detail) => results.push({ id, ok: false, detail });
  const pass = (id, detail) => results.push({ id, ok: true, detail });

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    fail("env", "Missing Supabase URL or service role key");
    print(results);
    process.exit(1);
  }

  const { createClient } = require("@supabase/supabase-js");
  const s = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: settings, error: settingsErr } = await s
    .from("assignment_settings")
    .select(
      "assignment_id, word_count_mode, writing_spine_mode, evidence_argument_mode, vocabulary_transfer_mode, submission_protocol_mode, updated_at, updated_by"
    )
    .eq("assignment_id", "mlk-rhetorical-analysis")
    .maybeSingle();

  if (settingsErr) {
    fail(
      "assignment_settings",
      settingsErr.message.includes("submission_protocol_mode")
        ? `Schema incomplete: ${settingsErr.message}`
        : settingsErr.message
    );
  } else {
    pass("assignment_settings_readable", "service-role select ok");
    if (!settings) {
      fail("mlk_row", "No assignment_settings row for mlk-rhetorical-analysis");
    } else {
      pass(
        "mlk_row",
        `word_count_mode=${settings.word_count_mode}; writing_spine_mode=${settings.writing_spine_mode}; evidence_argument_mode=${settings.evidence_argument_mode}; vocabulary_transfer_mode=${settings.vocabulary_transfer_mode}`
      );
      if (settings.submission_protocol_mode === "rebuilt") {
        pass("submission_protocol_mode", "rebuilt (database-backed)");
      } else {
        fail(
          "submission_protocol_mode",
          `expected rebuilt, got ${settings.submission_protocol_mode || "null"}`
        );
      }
      if (settings.writing_spine_mode === "rebuilt") {
        pass("writing_spine_mode_unchanged", "Modules 4–7 remain rebuilt");
      } else {
        fail(
          "writing_spine_mode_unchanged",
          `expected writing_spine_mode=rebuilt, got ${settings.writing_spine_mode || "null"}`
        );
      }
      if (settings.evidence_argument_mode === "rebuilt") {
        pass("evidence_argument_mode_unchanged", "Modules 2–3 remain rebuilt");
      } else {
        fail(
          "evidence_argument_mode_unchanged",
          `expected evidence_argument_mode=rebuilt, got ${settings.evidence_argument_mode || "null"}`
        );
      }
      if (settings.vocabulary_transfer_mode === "rebuilt") {
        pass("vocabulary_transfer_mode_unchanged", "Module 1 remains rebuilt");
      } else {
        fail(
          "vocabulary_transfer_mode_unchanged",
          `expected vocabulary_transfer_mode=rebuilt, got ${settings.vocabulary_transfer_mode || "null"}`
        );
      }
    }
  }

  const { error: guidedErr } = await s
    .from("module9_guided_apa_protocol")
    .select("user_email")
    .limit(1);
  if (guidedErr) {
    fail(
      "module9_guided_apa_protocol",
      guidedErr.message.includes("module9_guided_apa_protocol")
        ? `Schema incomplete: ${guidedErr.message}`
        : guidedErr.message
    );
  } else {
    pass("module9_guided_apa_protocol", "table readable");
  }

  for (const table of [
    "module9_quiz",
    "module9_checklist",
    "exported_docs",
    "student_exports",
  ]) {
    const { error: tErr } = await s.from(table).select("*").limit(1);
    if (tErr) {
      fail(table, tErr.message);
    } else {
      pass(table, "readable");
    }
  }

  const localFallback = fs.existsSync(
    path.join(process.cwd(), ".dev-assignment-settings.json")
  );
  if (env.NODE_ENV === "production" && localFallback) {
    fail(
      "local_fallback",
      ".dev-assignment-settings.json must not be relied on in production"
    );
  } else {
    pass(
      "local_fallback",
      localFallback
        ? "file present (dev only — must not be production source of truth)"
        : "no local fallback file"
    );
  }

  const enable = process.argv.includes("--enable-mlk-rebuilt");
  if (enable && settings && settings.submission_protocol_mode !== "rebuilt") {
    const { error: upErr } = await s
      .from("assignment_settings")
      .update({
        submission_protocol_mode: "rebuilt",
        updated_at: new Date().toISOString(),
        updated_by: "wp093-preflight",
      })
      .eq("assignment_id", "mlk-rhetorical-analysis");
    if (upErr) fail("enable_mlk_rebuilt", upErr.message);
    else pass("enable_mlk_rebuilt", "set submission_protocol_mode=rebuilt");
  }

  print(results);
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

function print(results) {
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"} ${r.id}: ${r.detail}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
