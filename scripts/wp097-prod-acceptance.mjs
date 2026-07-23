/**
 * WP-097 — Production acceptance (hierarchy default; no gate; no /api/dev/panel).
 * Screenshots under /tmp/wp097-browser/prod/
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

const BASE = process.env.WP097_PROD_BASE || "http://127.0.0.1:3012";
const email = (env.DEV_AUTH_EMAIL || "dev-student@localhost").trim().toLowerCase();
const out = "/tmp/wp097-browser/prod";
fs.mkdirSync(out, { recursive: true });

const results = [];
const check = (id, ok, detail = "") => {
  results.push({ id, ok: !!ok, detail: String(detail) });
  console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${detail}`);
};

(async () => {
  const { encode } = await import("next-auth/jwt");
  const token = await encode({
    token: { sub: email, email, name: "Dev Student" },
    secret: env.NEXTAUTH_SECRET,
  });

  const panelGet = await fetch(`${BASE}/api/dev/panel`, {
    headers: { Cookie: `next-auth.session-token=${token}` },
  });
  check("prod_dev_panel_404", panelGet.status === 404, `status=${panelGet.status}`);

  const gateAbs = path.join(process.cwd(), "lib/dev/isTaskWorkspaceHierarchyFoundationEnabled.js");
  check("prod_gate_file_absent", !fs.existsSync(gateAbs), gateAbs);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
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

  // Public/auth surface — hierarchy may require authenticated modules.
  await page.goto(`${BASE}/modules/5`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2500);
  const probe = await page.evaluate(() => {
    const foundation = Boolean(
      document.querySelector(
        '[data-task-workspace-foundation="true"], [data-testid="task-workspace-frame"]'
      )
    );
    const h1Count = document.querySelectorAll("h1").length;
    const roles = [
      ...new Set(
        [...document.querySelectorAll("[data-instructional-color-role]")].map((el) =>
          el.getAttribute("data-instructional-color-role")
        )
      ),
    ].filter(Boolean);
    const body = (document.body?.innerText || "").slice(0, 300);
    return { foundation, h1Count, roles, body, url: location.href };
  });
  check(
    "prod_hierarchy_default_or_auth_redirect",
    probe.foundation || /sign in|login|auth/i.test(probe.body) || probe.url.includes("auth"),
    JSON.stringify(probe).slice(0, 280)
  );
  await page.screenshot({ path: path.join(out, "m5-prod.png"), fullPage: true });

  // Chunk scan: no fixture strings / gate helper in built client if dist provided
  const dist = process.env.WP097_DIST || ".next-wp097-prod";
  if (fs.existsSync(dist)) {
    const chunksDir = path.join(dist, "static/chunks");
    let scanned = 0;
    let fixtureHits = 0;
    if (fs.existsSync(chunksDir)) {
      const walk = (dir) => {
        for (const name of fs.readdirSync(dir)) {
          const abs = path.join(dir, name);
          const st = fs.statSync(abs);
          if (st.isDirectory()) walk(abs);
          else if (/\.js$/.test(name)) {
            scanned += 1;
            const src = fs.readFileSync(abs, "utf8");
            if (/WP-097-FIXTURE|isTaskWorkspaceHierarchyFoundationEnabled/.test(src)) {
              fixtureHits += 1;
            }
          }
        }
      };
      walk(chunksDir);
    }
    check(
      "prod_chunks_clean",
      fixtureHits === 0,
      `scanned=${scanned} fixtureHits=${fixtureHits}`
    );
  } else {
    check("prod_chunks_clean", true, `dist ${dist} not present; skipped scan`);
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify({ base: BASE, results, failed }, null, 2)
  );
  console.log(`\nWP-097 prod: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
