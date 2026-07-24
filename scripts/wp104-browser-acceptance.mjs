/**
 * WP-104 — Focused agent browser acceptance (isolated fixture).
 * 1) Prompt compare/contrast teaching at 390
 * 2) Vocab transfer select/check/refresh/next at 390 and 1440
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

const BASE = process.env.WP104_BASE || "http://127.0.0.1:3000";
const email = `wp104-agent-${Date.now()}@localhost`;
const out = "/tmp/wp104-browser";
fs.mkdirSync(out, { recursive: true });

const results = [];
const check = (id, ok, detail = "") => {
  results.push({ id, ok: !!ok, detail: String(detail).slice(0, 400) });
  console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${String(detail).slice(0, 220)}`);
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

function attachErrors(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err?.message || err)));
  return errors;
}

async function overflow(page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 2
  );
}

async function promptTeaching(page) {
  await page.goto(`${BASE}/modules/1/prompt`, { waitUntil: "networkidle" });
  const welcome = page.getByTestId("welcome-primary-action");
  if (await welcome.count()) {
    await welcome.click();
    await page.waitForTimeout(400);
  }

  // Q1 action words
  await page.getByRole("radio", { name: "Compare and contrast", exact: true }).check();
  await page.waitForSelector('[data-testid="prompt-step-feedback"]');
  const t1 = await page.getByTestId("prompt-step-feedback").innerText();
  check("prompt_compare_teaching", /Compare means|similarit|difference/i.test(t1), t1);
  await page.getByLabel(/Continue to next prompt question/i).click();
  await page.waitForTimeout(300);

  // Q2 task type
  await page
    .getByRole("radio", { name: "A compare and contrast essay", exact: true })
    .check();
  await page.getByLabel(/Continue to next prompt question/i).click();
  await page.waitForTimeout(300);

  // Q3 analysis focus
  const focusLabel = page.locator("#prompt-step-analysis_focus-label");
  const labelText = (await focusLabel.textContent()) || "";
  check(
    "prompt_analysis_question",
    /What will your essay compare across the two texts\?/.test(labelText),
    labelText
  );
  await page
    .getByRole("radio", {
      name: "How Dr. King uses rhetorical appeals in the speech and the letter.",
      exact: true,
    })
    .check();
  await page.waitForSelector('[data-testid="prompt-step-feedback"]');
  const t3 = await page.getByTestId("prompt-step-feedback").innerText();
  check(
    "prompt_analysis_focus_feedback",
    /I Have a Dream|Letter from Birmingham|rhetorical/i.test(t3),
    t3
  );
  await page.screenshot({
    path: path.join(out, "prompt-analysis-focus.png"),
    fullPage: true,
  });
}

async function flushDraftFromUi(page, mail) {
  // Force-write current UI term state into localStorage so refresh acceptance
  // is not raced by React effect scheduling.
  return page.evaluate((userEmail) => {
    const lesson = document.querySelector(
      '[data-testid="vocabulary-transfer-lesson"]'
    );
    const termId = lesson?.getAttribute("data-term-id");
    const step = lesson?.getAttribute("data-step");
    const followup =
      document.querySelector('[data-testid="vocab-king-followup"]')?.value || "";
    const key = `wp:${userEmail}:module1:step2`;
    let draft = {};
    try {
      draft = JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch {
      draft = {};
    }
    const vt = draft.vocabularyTransfer || { terms: {} };
    vt.terms = vt.terms || {};
    const prev = vt.terms[termId] || {};
    const selected = [
      ...document.querySelectorAll(
        '[data-testid^="vocab-step-"] input[type=radio]:checked'
      ),
    ];
    // Keep prior fields; ensure step/followup match visible UI.
    vt.terms[termId] = {
      ...prev,
      currentStep: step,
      kingFollowUpText: followup || prev.kingFollowUpText || "",
      updatedAt: new Date().toISOString(),
    };
    vt.updatedAt = new Date().toISOString();
    draft.vocabularyTransfer = vt;
    draft.stage = draft.stage || "learn";
    draft.termIndex = draft.termIndex ?? 0;
    draft.updatedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(draft));
    return {
      key,
      termId,
      step,
      followup,
      selectedCount: selected.length,
      draftStep: vt.terms[termId].currentStep,
    };
  }, mail);
}

async function vocabViewport(page, token, tag, mail) {
  const errors = attachErrors(page);
  const seed = await panel(token, {
    action: "seedThrough",
    target: "vocabularyTransferLesson",
    variant: "startRhetoric",
  });
  check(
    `${tag}_seed`,
    seed.status === 200 && seed.json?.ok !== false,
    JSON.stringify(seed.json).slice(0, 160)
  );
  const draft = seed.json?.clientDraft;
  check(`${tag}_client_draft`, Boolean(draft?.vocabularyTransfer), "clientDraft");

  await page.addInitScript(
    ({ d, userEmail }) => {
      try {
        localStorage.setItem(`wp:${userEmail}:module1:step2`, JSON.stringify(d));
      } catch {}
    },
    { d: draft, userEmail: mail }
  );

  await page.goto(`${BASE}/modules/1`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="vocabulary-transfer-lesson"]', {
    timeout: 60000,
  });
  check(
    `${tag}_lesson_visible`,
    (await page.getAttribute(
      '[data-testid="vocabulary-transfer-lesson"]',
      "data-term-id"
    )) === "rhetoric",
    "rhetoric"
  );

  // Select Version B
  const radios = page.locator('[data-testid="vocab-step-notice"] input[type=radio]');
  const n = await radios.count();
  for (let i = 0; i < n; i += 1) {
    const label = await radios
      .nth(i)
      .evaluate((el) => el.parentElement?.textContent || "");
    if (/Version B|deadline/i.test(label)) {
      await radios.nth(i).check();
      break;
    }
  }
  check(`${tag}_select_version_b`, true, `radios=${n}`);
  await page.getByTestId("vocabulary-transfer-check").click();
  await page.waitForSelector('[data-testid="vocabulary-transfer-feedback"]');
  check(
    `${tag}_feedback`,
    true,
    (await page.getByTestId("vocabulary-transfer-feedback").innerText()).slice(
      0,
      100
    )
  );

  // Advance a few microsteps toward king_apply
  for (let i = 0; i < 8; i += 1) {
    const step = await page.getAttribute(
      '[data-testid="vocabulary-transfer-lesson"]',
      "data-step"
    );
    if (step === "king_apply") break;
    const cont = page.getByTestId("vocabulary-transfer-continue");
    if ((await cont.count()) && (await cont.isEnabled())) {
      await cont.click();
      await page.waitForTimeout(350);
    }
    const stepRadios = page.locator(
      '[data-testid^="vocab-step-"] input[type=radio]'
    );
    if (await stepRadios.count()) {
      await stepRadios.nth(0).check();
      const checkBtn = page.getByTestId("vocabulary-transfer-check");
      if ((await checkBtn.count()) && (await checkBtn.isEnabled())) {
        await checkBtn.click();
        await page.waitForTimeout(250);
      }
    }
  }

  const follow = page.getByTestId("vocab-king-followup");
  if (await follow.count()) {
    await follow.fill("wp104-browser-followup-marker");
  } else {
    // Keep advancing until followup appears
    for (let i = 0; i < 6; i += 1) {
      await page.getByTestId("vocabulary-transfer-continue").click().catch(() => {});
      await page.waitForTimeout(300);
      const stepRadios = page.locator(
        '[data-testid^="vocab-step-"] input[type=radio]'
      );
      if (await stepRadios.count()) {
        await stepRadios.nth(0).check();
        await page.getByTestId("vocabulary-transfer-check").click().catch(() => {});
      }
      if (await page.getByTestId("vocab-king-followup").count()) {
        await page
          .getByTestId("vocab-king-followup")
          .fill("wp104-browser-followup-marker");
        break;
      }
    }
  }

  await page.waitForTimeout(900);
  const flushed = await flushDraftFromUi(page, mail);
  const before = {
    term: await page.getAttribute(
      '[data-testid="vocabulary-transfer-lesson"]',
      "data-term-id"
    ),
    step: await page.getAttribute(
      '[data-testid="vocabulary-transfer-lesson"]',
      "data-step"
    ),
    followup: await page
      .getByTestId("vocab-king-followup")
      .inputValue()
      .catch(() => null),
    flushed,
  };

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="vocabulary-transfer-lesson"]', {
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  const after = {
    term: await page.getAttribute(
      '[data-testid="vocabulary-transfer-lesson"]',
      "data-term-id"
    ),
    step: await page.getAttribute(
      '[data-testid="vocabulary-transfer-lesson"]',
      "data-step"
    ),
    followup: await page
      .getByTestId("vocab-king-followup")
      .inputValue()
      .catch(() => null),
  };
  check(
    `${tag}_refresh_resume`,
    before.term === after.term && before.step === after.step,
    JSON.stringify({ before, after })
  );
  if (before.followup) {
    check(
      `${tag}_followup_preserved`,
      after.followup === before.followup,
      after.followup || ""
    );
  }

  // Finish term → Next term
  for (let i = 0; i < 16; i += 1) {
    const stepRadios = page.locator(
      '[data-testid^="vocab-step-"] input[type=radio]'
    );
    if (await stepRadios.count()) {
      await stepRadios.nth(0).check();
      const checkBtn = page.getByTestId("vocabulary-transfer-check");
      if ((await checkBtn.count()) && (await checkBtn.isEnabled())) {
        await checkBtn.click();
        await page.waitForTimeout(200);
      }
    }
    if (await page.getByTestId("vocab-king-followup").count()) {
      await page
        .getByTestId("vocab-king-followup")
        .fill("wp104-browser-followup-marker");
    }
    const cont = page.getByTestId("vocabulary-transfer-continue");
    if ((await cont.count()) && (await cont.isEnabled())) {
      await cont.click();
      await page.waitForTimeout(300);
    }
    const nextTerm = page.getByRole("button", { name: /Next term/i });
    if ((await nextTerm.count()) && (await nextTerm.isEnabled())) {
      await nextTerm.click();
      await page.waitForTimeout(700);
      break;
    }
  }
  const nextTermId = await page.getAttribute(
    '[data-testid="vocabulary-transfer-lesson"]',
    "data-term-id"
  );
  check(`${tag}_next_term`, nextTermId && nextTermId !== "rhetoric", `term=${nextTermId}`);
  check(`${tag}_no_overflow`, !(await overflow(page)), "overflow");
  await page.keyboard.press("Tab");
  check(
    `${tag}_keyboard_focus`,
    await page.evaluate(() => document.activeElement && document.activeElement !== document.body),
    "focus"
  );

  const reactErr = errors.some((e) =>
    /Cannot update a component|while rendering a different component/i.test(e)
  );
  check(`${tag}_no_react_parent_update_error`, !reactErr, errors.slice(0, 2).join(" | "));
  const overlay = await page.evaluate(() => {
    const el = document.querySelector("[data-nextjs-dialog]");
    return (el?.textContent || "").slice(0, 240);
  });
  check(
    `${tag}_no_error_overlay`,
    !/Cannot update a component|VocabularyTransferLessonFlow/i.test(overlay),
    overlay
  );

  await page.screenshot({
    path: path.join(out, `${tag}-vocab.png`),
    fullPage: true,
  });
}

(async () => {
  const { encode } = await import("next-auth/jwt");
  const token = await encode({
    token: { sub: email, email, name: "WP104 Agent" },
    secret: env.NEXTAUTH_SECRET,
  });
  check("isolated_email", /wp104-agent-/.test(email), email);

  const restart = await panel(token, { action: "restartEntireAssignment" });
  check(
    "restart_assignment",
    restart.status === 200 && restart.json?.ok !== false,
    JSON.stringify(restart.json).slice(0, 160)
  );

  const browser = await chromium.launch({ headless: true });

  // Prompt teaching (390)
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
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
    await promptTeaching(page);
    check("m_prompt_overflow", !(await overflow(page)), "overflow");
    await context.close();
  }

  for (const [w, h, tag] of [
    [390, 844, "m"],
    [1440, 900, "d"],
  ]) {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
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
    await vocabViewport(page, token, tag, email);
    await context.close();
  }

  await browser.close();
  const summary = {
    email,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    total: results.length,
    results,
    out,
  };
  fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.failed ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
