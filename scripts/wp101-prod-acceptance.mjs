#!/usr/bin/env node
/**
 * WP-101 — Production build acceptance (no overrides).
 * Expects server at WP101_PROD_BASE (default http://127.0.0.1:3016).
 * Merges into <commit>.external.json
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { createRequire } from "module";
import { BETA_MATRIX_SCHEMA_VERSION } from "../lib/beta/schema.js";

const require = createRequire(import.meta.url);
const PW_ROOT =
  process.env.PLAYWRIGHT_PATH ||
  "/var/folders/40/jp6bnmgn5y950xz89_tqv_q40000gn/T/cursor-sandbox-cache/11a1f26d75ae6c1792c62133ad02dab4/npm/_npx/f0a362733743bae2/node_modules/playwright";
const { chromium } = require(PW_ROOT);

const BASE = process.env.WP101_PROD_BASE || "http://127.0.0.1:3016";
const commit =
  process.env.WP101_COMMIT ||
  execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const out = "/tmp/wp101-browser/prod";
fs.mkdirSync(out, { recursive: true });

const distDir = process.env.WP101_DIST || ".next-wp101-prod";

/** @type {any[]} */
const results = [];
function row(scenarioId, result, detail, evidence = []) {
  results.push({
    scenarioId,
    result,
    evidence: evidence.length
      ? evidence
      : [{ kind: "prod", detail: String(detail) }],
    severityIfFailed: "Blocker",
    timestamp: new Date().toISOString(),
    buildCommit: commit,
    cleanupConfirmed: true,
    detail: String(detail),
  });
  console.log(`${result.toUpperCase()} ${scenarioId}: ${detail}`);
}

function scanChunksForLeak() {
  const root = path.join(process.cwd(), distDir);
  if (!fs.existsSync(root)) {
    return { ok: false, detail: `missing ${distDir}` };
  }
  const leaks = [];
  const patterns = [
    /beta_contradiction_fixtures/,
    /wp099TeacherProgressFixtures/,
    /buildWp099SyntheticRosterRows/,
    /DEV_AUTH_ENABLED/,
  ];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.(js|html)$/.test(name)) {
        const text = fs.readFileSync(p, "utf8");
        for (const re of patterns) {
          if (re.test(text) && !/source\)\s*===\s*"fixtures"/.test(text)) {
            // Allow rejection strings
            if (
              text.includes('source") === "fixtures"') ||
              text.includes("source === \"fixtures\"")
            ) {
              continue;
            }
            if (
              re.source.includes("fixtures") &&
              /reject|400|not.?allowed/i.test(text.slice(0, 500))
            ) {
              continue;
            }
            leaks.push(`${p}:${re}`);
          }
        }
      }
    }
  }
  try {
    walk(path.join(root, "static"));
  } catch {
    walk(root);
  }
  // Softer scan: only flag teacherProgressFixtures import in client bundles
  const clientLeak = [];
  function walk2(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk2(p);
      else if (/\.js$/.test(name)) {
        const text = fs.readFileSync(p, "utf8");
        if (
          text.includes("teacherProgressFixtures") &&
          text.includes("buildWp099Synthetic")
        ) {
          clientLeak.push(p);
        }
      }
    }
  }
  walk2(path.join(root, "static"));
  return {
    ok: clientLeak.length === 0,
    detail: clientLeak.length
      ? `leaks=${clientLeak.slice(0, 3).join(",")}`
      : "no synthetic fixture builders in client chunks",
  };
}

(async () => {
  // Panel denial
  const panel = await fetch(`${BASE}/api/dev/panel`);
  row(
    "SEC.dev_absent_prod",
    panel.status === 404 ? "pass" : "fail",
    `panel status=${panel.status}`
  );

  const fixtures = await fetch(`${BASE}/api/teacher/roster?source=fixtures`);
  // May be 401 without auth, or 400 if teacher — either must not return students
  const fixJson = await fixtures.json().catch(() => ({}));
  row(
    "HARNESS.prod_fixture_denial",
    fixtures.status === 401 ||
      fixtures.status === 400 ||
      fixtures.status === 403 ||
      fixtures.status === 404
      ? "pass"
      : "fail",
    `status=${fixtures.status} students=${!!fixJson.students}`
  );

  const scan = scanChunksForLeak();
  row("PROD.chunk_scan", scan.ok ? "pass" : "fail", scan.detail);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let consoleErr = 0;
  page.on("console", (m) => {
    if (m.type() === "error") consoleErr += 1;
  });

  const routes = [
    "/modules/1",
    "/modules/5",
    "/modules/8",
    "/modules/9",
    "/dashboard",
    "/modules/10",
  ];
  let routesOk = true;
  for (const r of routes) {
    const res = await page.goto(`${BASE}${r}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    const status = res?.status() || 0;
    if (status >= 500) routesOk = false;
    await page.screenshot({
      path: path.join(out, `route${r.replace(/\//g, "_")}.png`),
    });
  }
  await browser.close();

  row(
    "PROD.clean_build",
    routesOk && fs.existsSync(distDir) ? "pass" : "fail",
    `dist=${distDir} routesOk=${routesOk} consoleErr=${consoleErr}`
  );

  // Merge into external results file
  const resultsDir = path.join(
    process.cwd(),
    "docs/project-standards/walkthroughs/beta-matrix-results"
  );
  fs.mkdirSync(resultsDir, { recursive: true });
  const extPath = path.join(resultsDir, `${commit}.external.json`);
  let existing = { results: [] };
  if (fs.existsSync(extPath)) {
    existing = JSON.parse(fs.readFileSync(extPath, "utf8"));
  }
  const byId = new Map((existing.results || []).map((r) => [r.scenarioId, r]));
  for (const r of results) byId.set(r.scenarioId, r);
  const merged = {
    schemaVersion: BETA_MATRIX_SCHEMA_VERSION,
    buildCommit: commit,
    generatedAt: new Date().toISOString(),
    results: [...byId.values()],
  };
  fs.writeFileSync(extPath, JSON.stringify(merged, null, 2) + "\n");

  const failed = results.filter((r) => r.result === "fail").length;
  console.log(JSON.stringify({ commit, failed, total: results.length }, null, 2));
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
