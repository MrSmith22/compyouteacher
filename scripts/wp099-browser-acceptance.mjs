/**
 * WP-099 — Browser acceptance for teacher progress visibility foundation.
 * Evidence under /tmp/wp099-browser (not committed).
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

const BASE = process.env.WP099_BASE || "http://127.0.0.1:3000";
const email = (env.DEV_AUTH_EMAIL || "dev-student@localhost").trim().toLowerCase();
const out = "/tmp/wp099-browser";
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

(async () => {
  const { encode } = await import("next-auth/jwt");
  const token = await encode({
    token: { sub: email, email, name: "Dev Teacher" },
    secret: env.NEXTAUTH_SECRET,
  });

  const panelGet = await fetch(`${BASE}/api/dev/panel`, {
    headers: { Cookie: `next-auth.session-token=${token}` },
  });
  check("dev_panel_auth", panelGet.status === 200, `status=${panelGet.status}`);

  const roleRes = await panel(token, { action: "ensureDevTeacherRole" });
  check(
    "ensure_teacher_role",
    roleRes.status === 200 && roleRes.json?.ok === true,
    JSON.stringify(roleRes.json).slice(0, 160)
  );

  const rosterRes = await fetch(`${BASE}/api/teacher/roster?source=fixtures`, {
    headers: { Cookie: `next-auth.session-token=${token}` },
  });
  const rosterJson = await rosterRes.json().catch(() => ({}));
  check("roster_api_fixtures", rosterRes.status === 200 && rosterJson.ok === true, `n=${rosterJson.students?.length}`);
  check(
    "roster_no_urls",
    !JSON.stringify(rosterJson.students || []).includes("https://"),
    "no https in roster students"
  );
  check(
    "roster_no_final_text",
    !JSON.stringify(rosterJson).includes("final_text"),
    "no final_text"
  );
  check(
    "roster_has_attention_and_submitted",
    (rosterJson.summary?.needs_attention || 0) >= 1 &&
      (rosterJson.summary?.submitted || 0) >= 1,
    JSON.stringify(rosterJson.summary)
  );

  const unauth = await fetch(`${BASE}/api/teacher/roster?source=fixtures`);
  check("roster_unauth_401_or_403", unauth.status === 401 || unauth.status === 403, `status=${unauth.status}`);

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

  for (const [w, h, tag] of [
    [390, 844, "mobile"],
    [1440, 900, "desktop"],
  ]) {
    const context = await withAuth({ width: w, height: h });
    const page = await context.newPage();
    await page.goto(`${BASE}/modules/10?wp099Fixtures=1`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(1800);

    const foundation = await page.locator('[data-wp099-teacher-progress-foundation="1"]');
    check(`${tag}_foundation_visible`, await foundation.count() > 0, "foundation root");

    const h1 = await page.locator("h1").first().innerText().catch(() => "");
    check(`${tag}_h1_progress`, /Student progress/i.test(h1), h1);

    const phaseLabels = await page.locator("text=Phase 1").count();
    check(`${tag}_no_phase1_label`, phaseLabels === 0, `phase1=${phaseLabels}`);

    await page.locator('[role="tab"]:has-text("Progress")').click();
    check(`${tag}_roster_table`, (await page.locator("[data-wp099-roster]").count()) > 0, "roster");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    check(`${tag}_no_overflow`, !overflow, "no h-overflow");

    // Filter needs attention
    await page.selectOption("#wp099-filter", "needs_attention");
    await page.waitForTimeout(300);
    const attentionRows = await page.locator("[data-wp099-roster] tbody tr").count();
    check(`${tag}_filter_attention`, attentionRows >= 1, `rows=${attentionRows}`);

    // Open detail + focus trap / Escape
    await page.selectOption("#wp099-filter", "all");
    await page.waitForTimeout(200);
    const viewBtn = page.locator("[data-wp099-view-student]").first();
    await viewBtn.click();
    await page.waitForSelector("[data-wp099-student-detail]", { timeout: 10000 });
    await page.waitForSelector("text=Artifact trail", { timeout: 10000 });
    check(
      `${tag}_detail_dialog`,
      (await page.locator('[data-wp099-student-detail][role="dialog"]').count()) > 0,
      "dialog open"
    );

    // No full final_text prose dump in detail
    const detailText = await page.locator("[data-wp099-student-detail]").innerText();
    check(`${tag}_detail_no_secret_prose`, !/SECRET PROSE/i.test(detailText), "no leaked prose");
    check(
      `${tag}_detail_has_trail`,
      /Artifact trail/i.test(detailText),
      "trail present"
    );

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    check(
      `${tag}_detail_escape_closes`,
      (await page.locator("[data-wp099-student-detail]").count()) === 0,
      "closed"
    );

    // Submissions tab — receipt only
    await page.locator('[role="tab"]:has-text("Submissions")').click();
    await page.waitForTimeout(400);
    check(
      `${tag}_submissions_panel`,
      (await page.locator("[data-wp099-submissions]").count()) > 0,
      "submissions"
    );
    const subText = await page.locator("[data-wp099-submissions]").innerText();
    check(
      `${tag}_submissions_has_jordan`,
      /Jordan Submitted/i.test(subText),
      "receipt-backed student"
    );

    // Settings tab — rollouts under disclosure
    await page.locator('[role="tab"]:has-text("Settings")').click();
    await page.waitForTimeout(400);
    check(
      `${tag}_settings_panel`,
      (await page.locator("[data-wp099-settings]").count()) > 0,
      "settings"
    );
    check(
      `${tag}_settings_expectations`,
      /Student expectations/i.test(await page.locator("[data-wp099-settings]").innerText()),
      "expectations"
    );

    // Keyboard: Progress tab focusable
    await page.locator('[role="tab"]:has-text("Progress")').focus();
    const active = await page.evaluate(() => document.activeElement?.getAttribute("role"));
    check(`${tag}_tab_keyboard_focus`, active === "tab", active);

    await page.screenshot({
      path: path.join(out, `teacher-${tag}.png`),
      fullPage: true,
    });

    // 200% zoom probe (desktop only once)
    if (tag === "desktop") {
      await page.evaluate(() => {
        document.documentElement.style.zoom = "2";
      });
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(out, "teacher-desktop-200zoom.png"),
        fullPage: true,
      });
      const stillFoundation =
        (await page.locator('[data-wp099-teacher-progress-foundation="1"]').count()) > 0;
      check("desktop_200zoom_foundation", stillFoundation, "visible at 200%");
      await page.evaluate(() => {
        document.documentElement.style.zoom = "1";
      });
    }

    await context.close();
  }

  // Detail isolation: open A then B — no cached leak of A's email as title for B
  {
    const context = await withAuth({ width: 1440, height: 900 });
    const page = await context.newPage();
    await page.goto(`${BASE}/modules/10?wp099Fixtures=1`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(1500);
    await page.locator('[data-wp099-view-student="wp099-submitted"]').click();
    await page.waitForTimeout(700);
    const firstEmail = await page.locator("[data-wp099-student-detail]").innerText();
    check("detail_first_jordan", /Jordan Submitted|wp099-submitted/i.test(firstEmail), firstEmail.slice(0, 80));
    await page.locator("[data-wp099-close-detail]").click();
    await page.waitForTimeout(300);
    await page.locator('[data-wp099-view-student="wp099-not-started"]').click();
    await page.waitForTimeout(700);
    const second = await page.locator("[data-wp099-student-detail]").innerText();
    check(
      "detail_isolation_no_jordan_leak",
      /Avery Not Started|wp099-not-started/i.test(second) && !/Jordan Submitted/i.test(second),
      second.slice(0, 120)
    );
    await context.close();
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2)
  );
  console.log(`\nWP-099 browser: ${results.length - failed.length}/${results.length}`);
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
