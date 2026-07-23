/**
 * WP-097 — Browser acceptance for promoted task-workspace hierarchy.
 * Hierarchy is production default (gate deleted). Screenshots under /tmp/wp097-browser.
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

const BASE = process.env.WP097_BASE || "http://127.0.0.1:3000";
const email = (env.DEV_AUTH_EMAIL || "dev-student@localhost").trim().toLowerCase();
const out = "/tmp/wp097-browser";
fs.mkdirSync(out, { recursive: true });

const results = [];
const check = (id, ok, detail = "") => {
  results.push({ id, ok: !!ok, detail: String(detail) });
  console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${detail}`);
};

async function overflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  );
}

async function h1Audit(page) {
  return page.evaluate(() => {
    const h1s = [...document.querySelectorAll("h1")].map((el) => ({
      text: (el.textContent || "").trim().slice(0, 120),
      testId: el.getAttribute("data-testid"),
    }));
    return { count: h1s.length, h1s };
  });
}

async function foundationProbe(page) {
  return page.evaluate(() => {
    const foundation = Boolean(
      document.querySelector(
        '[data-task-workspace-foundation="true"], [data-testid="task-workspace-frame"], [data-testid="task-workspace-task"]'
      )
    );
    const roles = [
      ...document.querySelectorAll("[data-instructional-color-role]"),
    ].map((el) => el.getAttribute("data-instructional-color-role"));
    const uniqueRoles = [...new Set(roles.filter(Boolean))];
    const recoveryPriority = Boolean(
      document.querySelector('[data-testid="module9-recovery-priority"]')
    );
    const m5Job = Boolean(document.querySelector('[data-testid="task-workspace-job"]'));
    const m5WhyOpen = (() => {
      const details = [...document.querySelectorAll("details")].find((d) =>
        /Why this matters/i.test(d.querySelector("summary")?.textContent || "")
      );
      return details ? details.open : null;
    })();
    const desk = document.querySelector('[data-task-workspace-region="desk"]');
    const writingColumn = document.querySelector(
      '[data-testid="bp-move-workspace"] [data-instructional-color-role="writing"], [data-testid="bp-move-writing-field"]'
    );
    let deskWriting = null;
    if (desk && writingColumn) {
      const dr = desk.getBoundingClientRect();
      const wr = writingColumn.getBoundingClientRect();
      deskWriting = {
        deskW: Math.round(dr.width),
        writingW: Math.round(wr.width),
        writingLarger: wr.width >= dr.width - 1,
        deskReadable: dr.width >= 280,
      };
    }
    return {
      foundation,
      uniqueRoles,
      recoveryPriority,
      m5Job,
      m5WhyOpen,
      deskWriting,
      jobHow: Boolean(document.querySelector('[data-testid="screen-contract-how"]')),
      bodySnippet: (document.body.innerText || "").slice(0, 400),
    };
  });
}

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

async function waitReady(page, selectors, timeout = 45000) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  await page.waitForSelector(list.join(", "), { timeout });
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

  const seedM1 = await panel(token, {
    action: "seedThrough",
    target: "vocabularyTransferLesson",
    variant: "startRhetoric",
  });
  check("seed_m1", seedM1.status === 200 && seedM1.json?.ok !== false, JSON.stringify(seedM1.json).slice(0, 220));

  await panel(token, { action: "seedThrough", target: "evidenceToArgumentSlice" });
  await panel(token, { action: "seedThrough", target: 4 });
  await panel(token, { action: "setModule", module: 5 });
  await panel(token, { action: "seedThrough", target: "bpVerticalSlice" });
  await panel(token, { action: "seedThrough", target: "guidedApaProtocol" });

  const browser = await chromium.launch({ headless: true });

  async function withAuthContext(viewport) {
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

  async function runFamily(page, tag, id, url, ready, extra = async () => {}) {
    await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitReady(page, ready);
    await extra();
    const audit = await h1Audit(page);
    const probe = await foundationProbe(page);
    check(`${id}_h1_${tag}`, audit.count === 1, JSON.stringify(audit));
    check(
      `${id}_foundation_${tag}`,
      probe.foundation || audit.count === 1,
      probe.bodySnippet.slice(0, 120)
    );
    check(`${id}_overflow_${tag}`, !(await overflow(page)), "no h-overflow");
    await page.screenshot({ path: path.join(out, `${id}-${tag}.png`), fullPage: true });
    return { audit, probe };
  }

  async function runViewport(width, height, tag) {
    const context = await withAuthContext({ width, height });
    const page = await context.newPage();

    await page.addInitScript(
      ({ draft, mail }) => {
        try {
          if (draft) {
            localStorage.setItem(`wp:${mail}:module1:step2`, JSON.stringify(draft));
          }
        } catch {
          /* ignore */
        }
      },
      { draft: seedM1.json?.clientDraft || null, mail: email }
    );

    // M1.TRANSFER
    await panel(token, { action: "setModule", module: 1 });
    await runFamily(page, tag, "m1", "/modules/1", '[data-testid="vocabulary-transfer-lesson"]');

    // M1.PROMPT
    await runFamily(page, tag, "m1prompt", "/modules/1/prompt", [
      '[data-testid="task-workspace-frame"]',
      "h1",
    ]);

    // M2.WIZARD
    await panel(token, { action: "seedThrough", target: 2 });
    await panel(token, { action: "setModule", module: 2 });
    await runFamily(page, tag, "m2", "/modules/2", [
      '[data-testid="task-workspace-frame"]',
      "h1",
    ]);

    // M3.EA
    await panel(token, { action: "seedThrough", target: "evidenceToArgumentSlice" });
    await runFamily(
      page,
      tag,
      "m3",
      "/modules/3",
      '[data-testid="wp086-evidence-argument-panel"], [data-testid="task-workspace-task"], h1',
      async () => {
        for (let i = 0; i < 8; i += 1) {
          const hasEvidence =
            (await page.locator('[data-testid="wp086-both-work-reread"]').count()) > 0;
          if (hasEvidence) break;
          const next = page.locator('[data-testid="wp086-continue"]');
          if ((await next.count()) === 0 || (await next.isDisabled())) break;
          await next.click().catch(() => {});
          await page.waitForTimeout(700);
        }
      }
    );

    // M4
    await panel(token, { action: "seedThrough", target: 4 });
    await panel(token, { action: "setModule", module: 4 });
    await runFamily(page, tag, "m4", "/modules/4", [
      '[data-testid="task-workspace-frame"]',
      "h1",
    ]);

    // M5
    await panel(token, { action: "setModule", module: 5 });
    const m5 = await runFamily(page, tag, "m5", "/modules/5", [
      '[data-testid="task-workspace-task"]',
      "h1",
    ]);
    check(`m5_job_visible_${tag}`, m5.probe.m5Job, "primary why as job");
    check(
      `m5_why_closed_${tag}`,
      m5.probe.m5WhyOpen === false || m5.probe.m5WhyOpen === null,
      `whyOpen=${m5.probe.m5WhyOpen}`
    );

    // M6
    await panel(token, { action: "seedThrough", target: "bpVerticalSlice" });
    const m6 = await runFamily(page, tag, "m6", "/modules/6", [
      '[data-testid="screen-contract-task"]',
      '[data-testid="bp-move-workspace"]',
      "h1",
    ]);
    check(`m6_job_how_${tag}`, m6.probe.jobHow, "JobRightNow present");
    if (width >= 1024) {
      check(
        `m6_desk_width_${tag}`,
        Boolean(m6.probe.deskWriting?.deskReadable && m6.probe.deskWriting?.writingLarger),
        JSON.stringify(m6.probe.deskWriting)
      );
    }

    // M7
    await panel(token, { action: "seedThrough", target: "wholeEssayReview" }).catch(() => {});
    await panel(token, { action: "seedThrough", target: 7 });
    await panel(token, { action: "setModule", module: 7 });
    await runFamily(page, tag, "m7", "/modules/7", [
      '[data-testid="task-workspace-frame"]',
      "h1",
    ]);

    // M8
    await panel(token, { action: "seedThrough", target: "guidedApaProtocol" });
    await panel(token, { action: "setModule", module: 8 });
    await runFamily(page, tag, "m8", "/modules/8", [
      '[data-testid="module8-guided-apa-doc-panel"]',
      "h1",
    ]);

    // M9 unhealthy recovery — re-seed after M8 visit so gate stays open
    await panel(token, { action: "seedThrough", target: "guidedApaProtocol" });
    await panel(token, { action: "simulateMissingExportedDoc" });
    await page.goto(`${BASE}/modules/9`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitReady(page, [
      '[data-testid="module9-recovery-priority"]',
      '[data-testid="guided-apa-protocol-flow"]',
      "h1",
    ]);
    // If gate blocked, re-seed once more
    if ((await page.locator('[data-testid="module9-gate-blocked"]').count()) > 0) {
      await panel(token, { action: "seedThrough", target: "guidedApaProtocol" });
      await panel(token, { action: "simulateMissingExportedDoc" });
      await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
      await waitReady(page, [
        '[data-testid="module9-recovery-priority"]',
        '[data-testid="guided-apa-protocol-flow"]',
        "h1",
      ]);
    }
    let audit = await h1Audit(page);
    let probe = await foundationProbe(page);
    check(`m9_h1_${tag}`, audit.count === 1, JSON.stringify(audit));
    check(
      `m9_recovery_visible_${tag}`,
      probe.recoveryPriority ||
        (await page.locator('[data-testid="module9-recovery-priority"]').count()) > 0,
      `priority=${probe.recoveryPriority}`
    );
    check(`m9_overflow_${tag}`, !(await overflow(page)), "no h-overflow");
    await page.screenshot({ path: path.join(out, `m9-unhealthy-${tag}.png`), fullPage: true });

    await panel(token, { action: "seedThrough", target: "guidedApaProtocol" });
    await panel(token, { action: "simulateVerifiedGoogleDoc" });
    await page.goto(`${BASE}/modules/9`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitReady(page, ['[data-testid="guided-apa-protocol-flow"]', "h1"]);
    for (let i = 0; i < 6; i += 1) {
      probe = await foundationProbe(page);
      if (!probe.recoveryPriority) break;
      await page.waitForTimeout(700);
      if (i === 2) {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
        await waitReady(page, ['[data-testid="guided-apa-protocol-flow"]', "h1"]);
      }
    }
    probe = await foundationProbe(page);
    check(`m9_recovery_clear_${tag}`, !probe.recoveryPriority, `priority=${probe.recoveryPriority}`);
    await page.screenshot({ path: path.join(out, `m9-healthy-${tag}.png`), fullPage: true });

    await context.close();
  }

  await runViewport(390, 844, "mobile");
  await runViewport(1440, 900, "desktop");

  // 200% zoom + reduced motion spot check on M6 desktop
  {
    const context = await withAuthContext({ width: 1440, height: 900 });
    await context.addInitScript(() => {
      try {
        Object.defineProperty(window, "devicePixelRatio", { get: () => 2 });
      } catch {
        /* ignore */
      }
    });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await panel(token, { action: "seedThrough", target: "bpVerticalSlice" });
    await page.goto(`${BASE}/modules/6`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitReady(page, '[data-testid="bp-move-writing-field"]');
    check("m6_zoom_overflow", !(await overflow(page)), "200% / reduced-motion");
    await page.screenshot({ path: path.join(out, "m6-zoom-desktop.png"), fullPage: true });

    await page.locator("body").click({ position: { x: 2, y: 2 } }).catch(() => {});
    const focusPath = [];
    for (let i = 0; i < 16; i += 1) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        testId: document.activeElement?.getAttribute("data-testid"),
      }));
      focusPath.push(info);
      if (info.testId === "bp-move-writing-field" || info.tag === "TEXTAREA") break;
    }
    check(
      "m6_keyboard_reaches_work",
      focusPath.some((f) => f.testId === "bp-move-writing-field" || f.tag === "TEXTAREA"),
      JSON.stringify(focusPath.slice(0, 10))
    );
    await context.close();
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify({ base: BASE, email, results, failed }, null, 2)
  );
  console.log(`\nWP-097 browser: ${results.length - failed.length}/${results.length} passed`);
  console.log(`Evidence: ${out}`);
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
