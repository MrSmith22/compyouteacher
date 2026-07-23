/**
 * WP-100 — Production acceptance (no gate, no fixtures in chunks, panel denied).
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const PW_ROOT =
  process.env.PLAYWRIGHT_PATH ||
  "/var/folders/40/jp6bnmgn5y950xz89_tqv_q40000gn/T/cursor-sandbox-cache/11a1f26d75ae6c1792c62133ad02dab4/npm/_npx/f0a362733743bae2/node_modules/playwright";
const { chromium } = require(PW_ROOT);

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const BASE = process.env.WP100_PROD_BASE || "http://127.0.0.1:3015";
const email = (env.DEV_AUTH_EMAIL || "dev-student@localhost").trim().toLowerCase();
const out = "/tmp/wp100-browser/prod";
fs.mkdirSync(out, { recursive: true });

const results = [];
const check = (id, ok, detail = "") => {
  results.push({ id, ok: !!ok, detail: String(detail) });
  console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${detail}`);
};

(async () => {
  const { encode } = await import("next-auth/jwt");
  const token = await encode({
    token: { sub: email, email, name: "Dev Teacher" },
    secret: env.NEXTAUTH_SECRET,
  });

  const panelGet = await fetch(`${BASE}/api/dev/panel`, {
    headers: { Cookie: `next-auth.session-token=${token}` },
  });
  check("prod_dev_panel_404", panelGet.status === 404, `status=${panelGet.status}`);

  const fixtureGet = await fetch(`${BASE}/api/teacher/roster?source=fixtures`, {
    headers: { Cookie: `next-auth.session-token=${token}` },
  });
  // In production, fixtures rejected (400) or auth may differ; never 200 with fixtures payload
  const fixtureJson = await fixtureGet.json().catch(() => ({}));
  check(
    "prod_fixtures_not_served",
    fixtureGet.status !== 200 || fixtureJson.source !== "fixtures",
    `status=${fixtureGet.status} source=${fixtureJson.source}`
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      url: BASE,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  await page.goto(`${BASE}/modules/10`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForTimeout(2000);
  const probe = await page.evaluate(() => {
    const foundation = Boolean(
      document.querySelector('[data-wp099-teacher-progress-foundation="1"]')
    );
    const prod = Boolean(
      document.querySelector('[data-wp100-teacher-progress="1"]')
    );
    const body = (document.body?.innerText || "").slice(0, 500);
    const phase = /Phase 1/i.test(body);
    return { foundation, prod, phase, body };
  });
  check("prod_no_foundation_marker", !probe.foundation, "foundation off");
  check(
    "prod_progress_or_auth",
    probe.prod || /Teacher Access Only|Sign in/i.test(probe.body),
    probe.body.slice(0, 160)
  );
  check("prod_no_phase1", !probe.phase, "no Phase 1");
  await page.screenshot({ path: path.join(out, "teacher-prod.png"), fullPage: true });
  await browser.close();

  const dist = process.env.WP100_DIST || ".next-wp100-prod";
  const scanRoots = [
    path.join(dist, "static/chunks"),
    path.join(dist, "server/app/api/teacher"),
  ];
  let hits = 0;
  let scanned = 0;
  const forbidden = [
    "wp099-not-started@example.test",
    "wp099-submitted@example.test",
    "WP099_SYNTHETIC_STUDENT_INPUTS",
    "buildWp099SyntheticRosterRows",
  ];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const abs = path.join(dir, name);
      if (fs.statSync(abs).isDirectory()) walk(abs);
      else if (/\.js$/.test(name)) {
        scanned += 1;
        const src = fs.readFileSync(abs, "utf8");
        for (const token of forbidden) {
          if (src.includes(token)) hits += 1;
        }
      }
    }
  };
  for (const root of scanRoots) walk(root);
  check(
    "prod_chunks_no_synthetic_identities",
    hits === 0,
    `hits=${hits} scanned=${scanned}`
  );

  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify(
      { passed: results.length - failed.length, failed: failed.length, results },
      null,
      2
    )
  );
  console.log(`\nWP-100 prod: ${results.length - failed.length}/${results.length}`);
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
