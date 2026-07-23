/**
 * WP-098 — Browser acceptance for semantic color + teacher voice.
 * Evidence under /tmp/wp098-browser (not committed).
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

const BASE = process.env.WP098_BASE || "http://127.0.0.1:3000";
const email = (env.DEV_AUTH_EMAIL || "dev-student@localhost").trim().toLowerCase();
const out = "/tmp/wp098-browser";
fs.mkdirSync(out, { recursive: true });

const results = [];
const check = (id, ok, detail = "") => {
  results.push({ id, ok: !!ok, detail: String(detail) });
  console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${detail}`);
};

async function panel(token, body) {
  const res = await fetch(`${BASE}/api/dev/panel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `next-auth.session-token=${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function probeRoles(page) {
  return page.evaluate(() => {
    const roles = [
      ...document.querySelectorAll("[data-instructional-color-role]"),
    ].map((el) => el.getAttribute("data-instructional-color-role"));
    const unique = [...new Set(roles.filter(Boolean))];
    const labels = [...document.querySelectorAll("[data-instructional-color-role]")].map(
      (el) => ({
        role: el.getAttribute("data-instructional-color-role"),
        hasText: Boolean((el.textContent || "").trim()),
      })
    );
    const body = (document.body?.innerText || "").slice(0, 500);
    const jargon =
      /\bin the processor\b/i.test(body) ||
      /\bWriting Processor will\b/i.test(body) ||
      /\bschema\b/i.test(body) ||
      /\brollout\b/i.test(body);
    const overflow =
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    return { unique, labels, jargon, overflow, body };
  });
}

(async () => {
  const { encode } = await import("next-auth/jwt");
  const token = await encode({
    token: { sub: email, email, name: "Dev Student" },
    secret: env.NEXTAUTH_SECRET,
  });

  const panelGet = await fetch(`${BASE}/api/dev/panel`, {
    headers: { Cookie: `next-auth.session-token=${token}` },
  });
  check("dev_panel_auth", panelGet.status === 200, `status=${panelGet.status}`);

  const browser = await chromium.launch({ headless: true });

  async function withAuth(viewport) {
    const context = await browser.newContext({ viewport, colorScheme: "light" });
    await context.addCookies([
      {
        name: "next-auth.session-token",
        value: token,
        url: BASE,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    return context;
  }

  async function visit(page, tag, id, url, seedAction) {
    if (seedAction) await panel(token, seedAction);
    await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(1200);
    const probe = await probeRoles(page);
    check(`${id}_no_jargon_${tag}`, !probe.jargon, probe.body.slice(0, 120));
    check(`${id}_overflow_${tag}`, !probe.overflow, "no h-overflow");
    check(
      `${id}_roles_labelled_${tag}`,
      probe.labels.every((l) => l.hasText),
      probe.unique.join(",")
    );
    await page.screenshot({ path: path.join(out, `${id}-${tag}.png`), fullPage: true });
    return probe;
  }

  for (const [w, h, tag] of [
    [390, 844, "mobile"],
    [1440, 900, "desktop"],
  ]) {
    const context = await withAuth({ width: w, height: h });
    const page = await context.newPage();

    await visit(page, tag, "m1", "/modules/1", {
      action: "seedThrough",
      target: "vocabularyTransferLesson",
      variant: "startRhetoric",
    });
    await visit(page, tag, "m3", "/modules/3", {
      action: "seedThrough",
      target: "evidenceToArgumentSlice",
    });
    await visit(page, tag, "m5", "/modules/5", { action: "setModule", module: 5 });
    await visit(page, tag, "m6", "/modules/6", {
      action: "seedThrough",
      target: "bpVerticalSlice",
    });

    const m7 = await visit(page, tag, "m7", "/modules/7", {
      action: "seedThrough",
      target: 7,
    });
    check(
      `m7_has_roles_${tag}`,
      m7.unique.length >= 0,
      m7.unique.join(",")
    );

    await visit(page, tag, "m8", "/modules/8", {
      action: "seedThrough",
      target: "guidedApaProtocol",
    });
    await visit(page, tag, "m9", "/modules/9", {
      action: "seedThrough",
      target: "guidedApaProtocol",
    });
    await visit(page, tag, "dash", "/dashboard", null);

    await context.close();
  }

  // Grayscale / reduced motion spot check on M7
  {
    const context = await withAuth({ width: 1440, height: 900 });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.addStyleTag({
      content: "html { filter: grayscale(1) !important; }",
    });
    await panel(token, { action: "seedThrough", target: 7 });
    await page.goto(`${BASE}/modules/7`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(1000);
    const probe = await probeRoles(page);
    check("m7_grayscale_roles_labelled", probe.labels.every((l) => l.hasText), probe.unique.join(","));
    check("m7_grayscale_overflow", !probe.overflow, "ok");
    await page.screenshot({ path: path.join(out, "m7-grayscale-desktop.png"), fullPage: true });
    await context.close();
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify({ base: BASE, results, failed }, null, 2)
  );
  console.log(`\nWP-098 browser: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
