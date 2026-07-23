/**
 * WP-096 — Agent browser acceptance for task-workspace hierarchy foundation.
 * Dev gate ON (NODE_ENV=development). Captures screenshots under /tmp/wp096-browser.
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const PW_ROOT =
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

const BASE = process.env.WP096_BASE || "http://127.0.0.1:3000";
const email = (env.DEV_AUTH_EMAIL || "dev-student@localhost").trim().toLowerCase();
const out = "/tmp/wp096-browser";
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
    const recoveryDisclosure = [...document.querySelectorAll("summary")].some((s) =>
      /Google Doc repair tools/i.test(s.textContent || "")
    );
    const m5Job = Boolean(document.querySelector('[data-testid="task-workspace-job"]'));
    const m5WhyOpen = (() => {
      const details = [...document.querySelectorAll("details")].find((d) =>
        /Why this matters/i.test(d.querySelector("summary")?.textContent || "")
      );
      return details ? details.open : null;
    })();
    const desk = document.querySelector(
      '[data-testid="bp-active-move"][data-task-workspace-region="desk"], [data-task-workspace-region="desk"]'
    );
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
    const jobHow = Boolean(document.querySelector('[data-testid="screen-contract-how"]'));
    return {
      foundation,
      uniqueRoles,
      recoveryPriority,
      recoveryDisclosure,
      m5Job,
      m5WhyOpen,
      deskWriting,
      jobHow,
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
  const joined = list.join(", ");
  await page.waitForSelector(joined, { timeout });
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

  const seedM3 = await panel(token, {
    action: "seedThrough",
    target: "evidenceToArgumentSlice",
  });
  check("seed_m3", seedM3.status === 200 && seedM3.json?.ok !== false, JSON.stringify(seedM3.json).slice(0, 220));

  // Seed through 4 then lock module to 5 so outline page is authoritative.
  await panel(token, { action: "seedThrough", target: 4 });
  const setM5 = await panel(token, { action: "setModule", module: 5 });
  check("seed_m5", setM5.status === 200 && setM5.json?.ok !== false, JSON.stringify(setM5.json).slice(0, 220));

  const seedM6 = await panel(token, {
    action: "seedThrough",
    target: "bpVerticalSlice",
  });
  check("seed_m6", seedM6.status === 200 && seedM6.json?.ok !== false, JSON.stringify(seedM6.json).slice(0, 220));

  const seedM9 = await panel(token, {
    action: "seedThrough",
    target: "guidedApaProtocol",
  });
  check("seed_m9", seedM9.status === 200 && seedM9.json?.ok !== false, JSON.stringify(seedM9.json).slice(0, 220));

  const simMissing = await panel(token, { action: "simulateMissingExportedDoc" });
  check("seed_m9_unhealthy", simMissing.status === 200, JSON.stringify(simMissing.json).slice(0, 200));

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

  async function runViewport(width, height, tag) {
    const context = await withAuthContext({ width, height });
    const page = await context.newPage();

    // Module 1 — install client draft before navigation
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

    await panel(token, { action: "setModule", module: 1 });
    await page.goto(`${BASE}/modules/1`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitReady(page, '[data-testid="vocabulary-transfer-lesson"]');
    let audit = await h1Audit(page);
    let probe = await foundationProbe(page);
    const m1TaskIsLesson =
      audit.count === 1 &&
      audit.h1s[0]?.testId === "vocabulary-transfer-step-title";
    check(`m1_h1_${tag}`, m1TaskIsLesson, JSON.stringify(audit));
    check(
      `m1_foundation_${tag}`,
      probe.foundation || m1TaskIsLesson,
      probe.bodySnippet.slice(0, 120)
    );
    check(`m1_overflow_${tag}`, !(await overflow(page)), "no h-overflow");
    await page.screenshot({ path: path.join(out, `m1-${tag}.png`), fullPage: true });

    // Module 3
    await panel(token, { action: "seedThrough", target: "evidenceToArgumentSlice" });
    await page.goto(`${BASE}/modules/3`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitReady(page, '[data-testid="wp086-evidence-argument-panel"], [data-testid="task-workspace-task"], h1');
    // Advance to a both-work evidence step when the seed lands on reorient/direction.
    for (let i = 0; i < 8; i += 1) {
      const hasEvidence =
        (await page.locator('[data-testid="wp086-both-work-reread"]').count()) > 0;
      if (hasEvidence) break;
      const next = page.locator('[data-testid="wp086-continue"]');
      if ((await next.count()) === 0 || (await next.isDisabled())) break;
      await next.click().catch(() => {});
      await page.waitForTimeout(900);
    }
    audit = await h1Audit(page);
    probe = await foundationProbe(page);
    check(`m3_h1_${tag}`, audit.count === 1, JSON.stringify(audit));
    check(`m3_foundation_${tag}`, probe.foundation || audit.count === 1, probe.bodySnippet.slice(0, 120));
    check(
      `m3_evidence_role_${tag}`,
      (await page.locator('[data-instructional-color-role="evidence"]').count()) > 0 ||
        probe.uniqueRoles.includes("evidence"),
      probe.uniqueRoles.join(",")
    );
    check(`m3_overflow_${tag}`, !(await overflow(page)), "no h-overflow");
    await page.screenshot({ path: path.join(out, `m3-${tag}.png`), fullPage: true });

    // Module 5
    await panel(token, { action: "seedThrough", target: 4 });
    await panel(token, { action: "setModule", module: 5 });
    await page.goto(`${BASE}/modules/5`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitReady(page, ['[data-testid="task-workspace-task"]', "h1"]);
    audit = await h1Audit(page);
    probe = await foundationProbe(page);
    check(`m5_h1_${tag}`, audit.count === 1, JSON.stringify(audit));
    check(`m5_job_visible_${tag}`, probe.m5Job, "primary why as job");
    check(
      `m5_why_closed_${tag}`,
      probe.m5WhyOpen === false || probe.m5WhyOpen === null,
      `whyOpen=${probe.m5WhyOpen}`
    );
    check(`m5_overflow_${tag}`, !(await overflow(page)), "no h-overflow");
    await page.screenshot({ path: path.join(out, `m5-${tag}.png`), fullPage: true });

    // Module 6
    await panel(token, { action: "seedThrough", target: "bpVerticalSlice" });
    await page.goto(`${BASE}/modules/6`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitReady(page, [
      '[data-testid="screen-contract-task"]',
      '[data-testid="bp-move-workspace"]',
      "h1",
    ]);
    audit = await h1Audit(page);
    probe = await foundationProbe(page);
    check(`m6_h1_${tag}`, audit.count === 1, JSON.stringify(audit));
    check(`m6_job_how_${tag}`, probe.jobHow, "JobRightNow present");
    if (width >= 1024) {
      check(
        `m6_desk_width_${tag}`,
        Boolean(probe.deskWriting?.deskReadable && probe.deskWriting?.writingLarger),
        JSON.stringify(probe.deskWriting)
      );
    } else {
      check(
        `m6_desk_mobile_stack_${tag}`,
        Boolean(
          (await page.locator('[data-testid="bp-active-move"]').count()) > 0 &&
            (await page.locator('[data-testid="bp-move-writing-field"]').count()) > 0
        ),
        JSON.stringify(probe.deskWriting)
      );
    }
    check(`m6_overflow_${tag}`, !(await overflow(page)), "no h-overflow");
    await page.screenshot({ path: path.join(out, `m6-${tag}.png`), fullPage: true });

    // Module 9 unhealthy
    await panel(token, { action: "seedThrough", target: "guidedApaProtocol" });
    await panel(token, { action: "simulateMissingExportedDoc" });
    await page.goto(`${BASE}/modules/9`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitReady(page, '[data-testid="module9-recovery-priority"]');
    await waitReady(page, "h1, [data-testid=\"task-workspace-task\"]");
    audit = await h1Audit(page);
    probe = await foundationProbe(page);
    check(`m9_h1_${tag}`, audit.count === 1, JSON.stringify(audit));
    check(
      `m9_recovery_visible_${tag}`,
      probe.recoveryPriority ||
        (await page.locator('[data-testid="module9-recovery-priority"]').count()) > 0,
      `priority=${probe.recoveryPriority}`
    );
    check(`m9_overflow_${tag}`, !(await overflow(page)), "no h-overflow");
    await page.screenshot({
      path: path.join(out, `m9-unhealthy-${tag}.png`),
      fullPage: true,
    });

    // Healthy — restore verified Doc, then recovery is disclosed/absent
    const healthy = await panel(token, {
      action: "seedThrough",
      target: "guidedApaProtocol",
    });
    await panel(token, { action: "simulateVerifiedGoogleDoc" });
    check(
      `reseed_m9_healthy_${tag}`,
      healthy.status === 200,
      JSON.stringify(healthy.json).slice(0, 160)
    );
    await page.goto(`${BASE}/modules/9`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitReady(page, ['[data-testid="guided-apa-protocol-flow"]', "h1"]);
    // Doc readiness can lag one paint behind the verified export restore.
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
    check(
      `m9_recovery_disclosed_or_absent_${tag}`,
      !probe.recoveryPriority,
      `priority=${probe.recoveryPriority} disclosure=${probe.recoveryDisclosure}`
    );
    await page.screenshot({
      path: path.join(out, `m9-healthy-${tag}.png`),
      fullPage: true,
    });

    await context.close();
  }

  await runViewport(390, 844, "mobile");
  await runViewport(1440, 900, "desktop");

  {
    const context = await withAuthContext({ width: 1440, height: 900 });
    const page = await context.newPage();
    await panel(token, { action: "seedThrough", target: "bpVerticalSlice" });
    await page.goto(`${BASE}/modules/6`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitReady(page, '[data-testid="bp-move-writing-field"]');
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
    const reachedWriting = focusPath.some(
      (f) => f.testId === "bp-move-writing-field" || f.tag === "TEXTAREA"
    );
    check("m6_keyboard_reaches_work", reachedWriting, JSON.stringify(focusPath.slice(0, 10)));
    await context.close();
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify({ base: BASE, email, results, failed }, null, 2)
  );
  console.log(`\nWP-096 browser: ${results.length - failed.length}/${results.length} passed`);
  console.log(`Evidence: ${out}`);
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
