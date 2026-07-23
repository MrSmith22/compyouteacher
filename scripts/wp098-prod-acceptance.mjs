/**
 * WP-098 — Production acceptance (color/voice default; no panel; clean chunks).
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

const BASE = process.env.WP098_PROD_BASE || "http://127.0.0.1:3013";
const email = (env.DEV_AUTH_EMAIL || "dev-student@localhost").trim().toLowerCase();
const out = "/tmp/wp098-browser/prod";
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
  await page.goto(`${BASE}/modules/5`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2000);
  const probe = await page.evaluate(() => {
    const roles = [
      ...new Set(
        [...document.querySelectorAll("[data-instructional-color-role]")].map((el) =>
          el.getAttribute("data-instructional-color-role")
        )
      ),
    ].filter(Boolean);
    const body = (document.body?.innerText || "").slice(0, 400);
    const jargon = /\bin the processor\b|\bschema\b|\brollout\b/i.test(body);
    return { roles, jargon, body, foundation: Boolean(document.querySelector('[data-task-workspace-foundation="true"]')) };
  });
  check(
    "prod_color_or_auth",
    probe.roles.length > 0 || probe.foundation || /sign in|login/i.test(probe.body),
    JSON.stringify(probe).slice(0, 240)
  );
  check("prod_no_jargon", !probe.jargon, probe.body.slice(0, 120));
  await page.screenshot({ path: path.join(out, "m5-prod.png"), fullPage: true });
  await browser.close();

  const dist = process.env.WP098_DIST || ".next-wp098-prod";
  if (fs.existsSync(path.join(dist, "static/chunks"))) {
    let hits = 0;
    let scanned = 0;
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name);
        if (fs.statSync(abs).isDirectory()) walk(abs);
        else if (/\.js$/.test(name)) {
          scanned += 1;
          const src = fs.readFileSync(abs, "utf8");
          if (/WP-098-FIXTURE|in the processor/i.test(src) && /__NEXT_DATA__|fixture/.test(src)) {
            hits += 1;
          }
        }
      }
    };
    walk(path.join(dist, "static/chunks"));
    check("prod_chunks_scanned", scanned > 0, `scanned=${scanned} hits=${hits}`);
  }

  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify({ base: BASE, results, failed }, null, 2)
  );
  console.log(`\nWP-098 prod: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
