#!/usr/bin/env node
/**
 * WP-088 — Read-only production readiness preflight for evidence-to-argument rollout.
 * Usage: node scripts/wp088-evidence-argument-preflight.js
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
      "assignment_id, word_count_mode, writing_spine_mode, evidence_argument_mode, updated_at, updated_by"
    )
    .eq("assignment_id", "mlk-rhetorical-analysis")
    .maybeSingle();

  if (settingsErr) {
    fail(
      "assignment_settings",
      settingsErr.message.includes("evidence_argument_mode")
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
        `word_count_mode=${settings.word_count_mode}; writing_spine_mode=${settings.writing_spine_mode}`
      );
      if (settings.evidence_argument_mode === "rebuilt") {
        pass("evidence_argument_mode", "rebuilt (database-backed)");
      } else {
        fail(
          "evidence_argument_mode",
          `expected rebuilt, got ${settings.evidence_argument_mode || "null"}`
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

  // flow_state / slice shape probe — summarize counts without student text
  const { data: bucketProbe, error: bucketErr } = await s
    .from("student_buckets")
    .select("module, flow_state")
    .eq("module", 3)
    .limit(20);

  if (bucketErr) {
    fail("module3_flow_state", bucketErr.message);
  } else {
    let v1 = 0;
    let v2 = 0;
    let none = 0;
    for (const row of bucketProbe || []) {
      const slice = row?.flow_state?.evidenceArgumentSlice;
      if (!slice || typeof slice !== "object") {
        none += 1;
        continue;
      }
      const ver = Number(slice.schemaVersion) || 0;
      if (ver <= 1) v1 += 1;
      else v2 += 1;
    }
    pass(
      "slice_shape_summary",
      `sample=${(bucketProbe || []).length} none=${none} schema_v1=${v1} schema_v2=${v2}`
    );
  }

  // Source / matrix readability (no prose logged)
  const { error: srcErr } = await s
    .from("module2_sources")
    .select("user_email")
    .limit(1);
  if (srcErr) fail("module2_sources", srcErr.message);
  else pass("module2_sources", "readable");

  const enable = process.argv.includes("--enable-mlk-rebuilt");
  if (enable && settings && settings.evidence_argument_mode !== "rebuilt") {
    const { error: upErr } = await s
      .from("assignment_settings")
      .update({
        evidence_argument_mode: "rebuilt",
        updated_at: new Date().toISOString(),
        updated_by: "wp088-preflight",
      })
      .eq("assignment_id", "mlk-rhetorical-analysis");
    if (upErr) fail("enable_mlk_rebuilt", upErr.message);
    else pass("enable_mlk_rebuilt", "set evidence_argument_mode to rebuilt");
  }

  print(results);
  const failed = results.some((r) => !r.ok);
  process.exit(failed ? 1 : 0);
}

function print(results) {
  console.log("WP-088 evidence-to-argument preflight");
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id}: ${r.detail}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
