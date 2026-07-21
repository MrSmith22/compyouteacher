#!/usr/bin/env node
/**
 * WP-085 — Read-only production readiness preflight for the writing spine.
 * Usage: node scripts/wp085-writing-spine-preflight.js
 * Does not write student prose or mutate data unless --enable-mlk-rebuilt is passed
 * (reviewed ops enable only).
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
      "assignment_id, word_count_mode, writing_spine_mode, updated_at, updated_by"
    )
    .eq("assignment_id", "mlk-rhetorical-analysis")
    .maybeSingle();

  if (settingsErr) {
    fail(
      "assignment_settings",
      settingsErr.message.includes("writing_spine_mode")
        ? `Schema incomplete: ${settingsErr.message}`
        : settingsErr.message
    );
  } else {
    pass("assignment_settings_readable", "service-role select ok");
    if (!settings) {
      fail("mlk_row", "No assignment_settings row for mlk-rhetorical-analysis");
    } else {
      pass("mlk_row", `word_count_mode=${settings.word_count_mode}`);
      if (settings.writing_spine_mode === "rebuilt") {
        pass("writing_spine_mode", "rebuilt");
      } else {
        fail(
          "writing_spine_mode",
          `expected rebuilt, got ${settings.writing_spine_mode || "null"}`
        );
      }
    }
  }

  const localFallback = fs.existsSync(
    path.join(process.cwd(), ".dev-assignment-settings.json")
  );
  if (env.NODE_ENV === "production" && localFallback) {
    fail("local_fallback", ".dev-assignment-settings.json must not be relied on in production");
  } else {
    pass(
      "local_fallback",
      localFallback
        ? "file present (dev only — must not be production source of truth)"
        : "no local fallback file"
    );
  }

  // draft_meta availability (shape probe — no prose logged)
  const { data: draftProbe, error: draftErr } = await s
    .from("student_drafts")
    .select("module, draft_meta")
    .eq("module", 6)
    .limit(1)
    .maybeSingle();
  if (draftErr) {
    fail("draft_meta", draftErr.message);
  } else {
    pass(
      "draft_meta",
      draftProbe
        ? `sample module 6 has draft_meta=${draftProbe.draft_meta != null}`
        : "no module 6 rows (ok)"
    );
  }

  const enable = process.argv.includes("--enable-mlk-rebuilt");
  if (enable && settings && settings.writing_spine_mode !== "rebuilt") {
    const { error: upErr } = await s
      .from("assignment_settings")
      .update({
        writing_spine_mode: "rebuilt",
        updated_at: new Date().toISOString(),
        updated_by: "wp085-preflight",
      })
      .eq("assignment_id", "mlk-rhetorical-analysis");
    if (upErr) fail("enable_mlk_rebuilt", upErr.message);
    else pass("enable_mlk_rebuilt", "set to rebuilt");
  }

  print(results);
  const failed = results.some((r) => !r.ok);
  process.exit(failed ? 1 : 0);
}

function print(results) {
  console.log("WP-085 writing-spine preflight");
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id}: ${r.detail}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
