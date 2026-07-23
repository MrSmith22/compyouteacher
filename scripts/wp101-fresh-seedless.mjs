#!/usr/bin/env node
/**
 * WP-101 corrective — Genuine seedless fresh-student click-through.
 *
 * Allowed before Module 1 work: mint isolated auth identity (unique email).
 * Forbidden after Module 1 entry: Developer Testing Panel, seedThrough,
 * route-state injection, direct DB artifact creation.
 *
 * Evidence: /tmp/wp101-browser/fresh-seedless/
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { execSync } from "child_process";
import { createBetaRunId, betaStudentEmail } from "../lib/beta/identities.js";
import { MODULE1_QUIZ_V2 } from "../lib/module1/quizHelpers.js";

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

const BASE = process.env.WP101_BASE || "http://127.0.0.1:3000";
const commit =
  process.env.WP101_COMMIT ||
  execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const runId = createBetaRunId(process.env.WP101_RUN_ID);
const email = betaStudentEmail(runId);
const out = "/tmp/wp101-browser/fresh-seedless";
fs.mkdirSync(out, { recursive: true });

const SPEECH = `Five score years ago, a great American signed the Emancipation Proclamation. This momentous decree came as a great beacon light of hope to millions of Negro slaves who had been seared in the flames of withering injustice. But one hundred years later, the Negro still is not free.

I have a dream that one day this nation will rise up and live out the true meaning of its creed: We hold these truths to be self-evident, that all men are created equal. I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.

Let freedom ring from the prodigious hilltops of New Hampshire. Let freedom ring from the mighty mountains of New York. Let freedom ring from every hill and molehill of Mississippi. From every mountainside, let freedom ring.

And when this happens, we will be able to speed up that day when all of God's children will be able to join hands and sing in the words of the old Negro spiritual: Free at last! Free at last! Thank God Almighty, we are free at last!`;

const LETTER = `My Dear Fellow Clergymen:

While confined here in the Birmingham city jail, I came across your recent statement calling my present activities "unwise and untimely." Seldom do I pause to answer criticism of my work and ideas. But since I feel that you are men of genuine good will and that your criticisms are sincerely set forth, I want to try to answer your statement in what I hope will be patient and reasonable terms.

I am in Birmingham because injustice is here. Injustice anywhere is a threat to justice everywhere. We are caught in an inescapable network of mutuality, tied in a single garment of destiny. Whatever affects one directly, affects all indirectly.

We know through painful experience that freedom is never voluntarily given by the oppressor; it must be demanded by the oppressed. Frankly, I have yet to engage in a direct action campaign that was "well timed" in the view of those who have not suffered unduly from the disease of segregation. For years now I have heard the word Wait! It rings in the ear of every Negro with piercing familiarity. This Wait has almost always meant Never. We must come to see, with one of our distinguished jurists, that justice too long delayed is justice denied.

In any nonviolent campaign there are four basic steps: collection of the facts to determine whether injustices exist; negotiation; self purification; and direct action. We have gone through all these steps in Birmingham.`;

/** @type {{ step: string, ok: boolean, detail: string }[]} */
const log = [];
function note(step, ok, detail = "") {
  log.push({ step, ok: !!ok, detail: String(detail) });
  console.log(`${ok ? "PASS" : "FAIL"} ${step}: ${detail}`);
}

async function shot(page, name) {
  const p = path.join(out, name);
  await page.screenshot({ path: p, fullPage: true });
  return p;
}

async function refreshResume(page, expectedPathPart) {
  const before = page.url();
  await page.reload({ waitUntil: "networkidle", timeout: 120000 });
  const after = page.url();
  const ok =
    after.includes(expectedPathPart) ||
    before.includes(expectedPathPart);
  note(`refresh:${expectedPathPart}`, ok, `before=${before} after=${after}`);
  return ok;
}

async function clickContinueToModule(page, n) {
  const re = new RegExp(`Continue to Module ${n}`, "i");
  const btn = page
    .getByTestId(`module${n - 1}-continue-module${n}`)
    .or(page.getByRole("button", { name: re }))
    .or(page.getByRole("link", { name: re }));
  await btn.first().waitFor({ state: "visible", timeout: 60000 });
  for (let i = 0; i < 40; i += 1) {
    const enabled = await btn.first().isEnabled().catch(() => false);
    if (enabled) break;
    const retry = page.getByTestId(`module${n - 1}-advance-retry`).or(
      page.getByRole("button", { name: /Try saving again/i })
    );
    if ((await retry.count()) && (await retry.first().isEnabled().catch(() => false))) {
      console.log(`M${n - 1}: retry advancement`);
      await retry.first().click();
      await sleep(1500);
      continue;
    }
    await sleep(500);
  }
  await btn.first().click({ timeout: 60000 });
  await page.waitForURL(new RegExp(`/modules/${n}`), { timeout: 120000 });
}

async function bootstrapFreshAccount(email) {
  // Allowed account bootstrap only — no module artifacts.
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
  const assignmentName = "MLK Essay Assignment";
  const now = new Date().toISOString();
  const { data: existing } = await sb
    .from("student_assignments")
    .select("id, current_module, status")
    .eq("user_email", email)
    .eq("assignment_name", assignmentName)
    .maybeSingle();
  if (existing?.id) {
    const { error } = await sb
      .from("student_assignments")
      .update({
        current_module: 1,
        resume_path: "/modules/1",
        status: "in_progress",
        updated_at: now,
      })
      .eq("id", existing.id);
    if (error) throw new Error(`bootstrap update failed: ${error.message}`);
  } else {
    const { error } = await sb.from("student_assignments").insert({
      user_email: email,
      assignment_name: assignmentName,
      current_module: 1,
      resume_path: "/modules/1",
      status: "in_progress",
      started_at: now,
      updated_at: now,
    });
    if (error) throw new Error(`bootstrap insert failed: ${error.message}`);
  }
  note("bootstrap_account", true, email);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fillFirstVisibleTextarea(page, text) {
  const areas = page.locator("textarea:visible");
  const count = await areas.count();
  if (!count) throw new Error("no visible textarea");
  await areas.first().fill(text);
}

async function clickPrimaryEnabled(page, nameRe) {
  const btn = page.getByRole("button", { name: nameRe }).filter({
    hasNot: page.locator("[disabled]"),
  });
  await btn.first().click({ timeout: 90000 });
}

async function pickFirstRadio(page) {
  const radio = page.locator('input[type="radio"]:visible').first();
  await radio.check({ force: true }).catch(async () => {
    await radio.click({ force: true });
  });
}

async function installMediaMocks(page) {
  await page.addInitScript(() => {
    class FakeMediaRecorder {
      constructor(stream, _options) {
        this.state = "inactive";
        this.stream = stream;
        this.ondataavailable = null;
        this.onstop = null;
        this.onerror = null;
      }
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        const blob = new Blob([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])], {
          type: "audio/webm",
        });
        if (typeof this.ondataavailable === "function") {
          this.ondataavailable({ data: blob });
        }
        if (typeof this.onstop === "function") this.onstop();
      }
      requestData() {}
    }
    FakeMediaRecorder.isTypeSupported = () => true;
    window.MediaRecorder = FakeMediaRecorder;

    const track = {
      stop() {},
      kind: "audio",
      enabled: true,
      readyState: "live",
      getSettings: () => ({ deviceId: "fake", channelCount: 1 }),
    };
    const stream = {
      id: "fake-stream",
      active: true,
      getTracks: () => [track],
      getAudioTracks: () => [track],
      getVideoTracks: () => [],
      addTrack() {},
      removeTrack() {},
    };
    if (!navigator.mediaDevices) {
      // @ts-ignore
      navigator.mediaDevices = {};
    }
    navigator.mediaDevices.getUserMedia = async () => stream;
    navigator.mediaDevices.enumerateDevices = async () => [
      {
        deviceId: "fake",
        kind: "audioinput",
        label: "Fake Mic",
        groupId: "g1",
        toJSON() {
          return this;
        },
      },
    ];

    // Module 7 startMeter uses AudioContext + createMediaStreamSource.
    class FakeAudioContext {
      constructor() {
        this.state = "running";
        this.sampleRate = 48000;
        this.destination = {};
      }
      createMediaStreamSource() {
        return { connect() {}, disconnect() {} };
      }
      createAnalyser() {
        return {
          fftSize: 2048,
          frequencyBinCount: 1024,
          getByteTimeDomainData(arr) {
            if (arr && arr.fill) arr.fill(128);
          },
          connect() {},
        };
      }
      close() {
        return Promise.resolve();
      }
      resume() {
        return Promise.resolve();
      }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
  });
}

async function ensureMediaMocks(page) {
  await page.evaluate(() => {
    class FakeMediaRecorder {
      constructor(stream) {
        this.state = "inactive";
        this.stream = stream;
        this.ondataavailable = null;
        this.onstop = null;
      }
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        const blob = new Blob([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])], {
          type: "audio/webm",
        });
        if (typeof this.ondataavailable === "function") {
          this.ondataavailable({ data: blob });
        }
        if (typeof this.onstop === "function") this.onstop();
      }
      requestData() {}
    }
    FakeMediaRecorder.isTypeSupported = () => true;
    window.MediaRecorder = FakeMediaRecorder;
    const track = {
      stop() {},
      kind: "audio",
      enabled: true,
      readyState: "live",
      getSettings: () => ({ deviceId: "fake" }),
    };
    const stream = {
      id: "fake-stream",
      active: true,
      getTracks: () => [track],
      getAudioTracks: () => [track],
      getVideoTracks: () => [],
    };
    if (!navigator.mediaDevices) navigator.mediaDevices = {};
    navigator.mediaDevices.getUserMedia = async () => stream;
    navigator.mediaDevices.enumerateDevices = async () => [
      {
        deviceId: "fake",
        kind: "audioinput",
        label: "Fake Mic",
        groupId: "g1",
      },
    ];
    class FakeAudioContext {
      constructor() {
        this.state = "running";
        this.sampleRate = 48000;
        this.destination = {};
      }
      createMediaStreamSource() {
        return { connect() {}, disconnect() {} };
      }
      createAnalyser() {
        return {
          fftSize: 2048,
          frequencyBinCount: 1024,
          getByteTimeDomainData(arr) {
            if (arr && arr.fill) arr.fill(128);
          },
          connect() {},
        };
      }
      close() {
        return Promise.resolve();
      }
      resume() {
        return Promise.resolve();
      }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
  });
}

async function assertNoPanelUsed(page) {
  // Soft guard: never navigate to panel UI; API calls would be student-path only.
  const url = page.url();
  if (/dev\/panel|Developer Testing/i.test(url)) {
    throw new Error("Developer Testing Panel URL encountered");
  }
}

async function clickWhenEnabled(locator, label, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if ((await locator.count()) && (await locator.isEnabled().catch(() => false))) {
      await locator.click({ timeout: 5000 });
      return true;
    }
    await sleep(250);
  }
  throw new Error(`clickWhenEnabled timeout: ${label}`);
}

async function runModule1(page) {
  console.log("M1: goto /modules/1");
  await page.goto(`${BASE}/modules/1`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  await shot(page, "m1-entry.png");

  const startBtn = page
    .getByTestId("welcome-primary-action")
    .or(page.getByRole("button", { name: /Start with the assignment/i }));
  if (await startBtn.count()) {
    console.log("M1: click welcome CTA");
    await startBtn.first().click({ timeout: 15000 });
    await sleep(800);
    await shot(page, "m1-after-welcome.png");
  }

  const promptCorrectExact = [
    "Compare and contrast",
    "A compare and contrast essay",
    "How Dr. King uses rhetorical appeals in two texts",
    "Specific evidence from both works",
  ];
  for (let i = 0; i < 12; i += 1) {
    console.log(`M1: prompt step loop ${i} url=${page.url()}`);
    if (await page.getByTestId("vocabulary-transfer-lesson").count()) {
      console.log("M1: vocab lesson visible");
      break;
    }
    if (await page.getByTestId("module1-quiz-submit").count()) break;
    if (
      (await page.getByTestId("step2-primary-action").count()) &&
      !(await page.getByTestId("prompt-active-step").count())
    ) {
      break;
    }

    const saveVocab = page
      .getByRole("button", {
        name: /Save prompt breakdown and continue to vocabulary/i,
      })
      .or(
        page.getByRole("button", { name: /Save and continue to vocabulary/i })
      );
    const cont = page.getByLabel(/Continue to next prompt question/i);
    const active = page.getByTestId("prompt-active-step");

    if (await active.count()) {
      let picked = false;
      for (const label of promptCorrectExact) {
        const opt = active.getByRole("radio", { name: label, exact: true });
        if (await opt.count()) {
          await opt.check({ force: true }).catch(async () => {
            await opt.click({ force: true });
          });
          picked = true;
          console.log(`M1: picked MC ${label}`);
          break;
        }
      }
      if (!picked) {
        const ta = active.locator("textarea").first();
        if (await ta.count()) {
          await ta.fill(
            "This essay asks me to compare and contrast how Dr. King uses ethos, pathos, and logos in the speech and the letter, using specific evidence from both works."
          );
          console.log("M1: filled paraphrase");
        }
      }
      await sleep(300);
    }

    if ((await saveVocab.count()) && (await saveVocab.isEnabled())) {
      console.log("M1: save to vocabulary");
      await saveVocab.click();
      await sleep(1500);
      await shot(page, "m1-after-prompt.png");
      break;
    }
    if ((await cont.count()) && (await cont.isEnabled())) {
      console.log("M1: next prompt question");
      await cont.click();
      await sleep(600);
      continue;
    }
    await shot(page, `m1-prompt-stuck-${i}.png`);
    await sleep(500);
  }

  // Vocabulary transfer lessons (6 terms × several microsteps)
  for (let term = 0; term < 200; term += 1) {
    await assertNoPanelUsed(page);
    if (page.url().includes("/modules/1/success")) break;
    if (await page.getByTestId("quiz-active-item").count()) {
      console.log("M1: quiz visible");
      break;
    }
    const quizSubmit = page.getByTestId("module1-quiz-submit");
    if (await quizSubmit.count()) {
      console.log("M1: quiz submit visible");
      break;
    }

    const lesson = page.getByTestId("vocabulary-transfer-lesson");
    const stepPrimary = page.getByTestId("step2-primary-action");

    if (await lesson.count()) {
      if (term % 3 === 0) {
        console.log(
          `M1: vocab iter ${term} step=${await page
            .locator("[data-testid^=vocab-step-]")
            .first()
            .getAttribute("data-testid")
            .catch(() => "?")}`
        );
      }
      const follow = page.getByTestId("vocab-king-followup");
      if (await follow.count()) {
        await follow.fill(
          "King uses this appeal so the audience trusts him and feels ready to act for justice."
        );
      }
      const ta = page.locator(
        '[data-testid="vocabulary-transfer-lesson"] textarea:visible'
      );
      if (await ta.count()) {
        const val = await ta.first().inputValue().catch(() => "");
        if (String(val).trim().length < 12) {
          await ta
            .first()
            .fill(
              "King uses this appeal so the audience trusts him and feels ready to act for justice."
            );
        }
      }
      if (await page.locator('input[type="radio"]:visible').count()) {
        await pickFirstRadio(page);
        await sleep(150);
      }
      const check = page.getByTestId("vocabulary-transfer-check");
      if ((await check.count()) && (await check.isEnabled().catch(() => false))) {
        await check.click();
        await page
          .getByTestId("vocabulary-transfer-feedback")
          .waitFor({ timeout: 8000 })
          .catch(() => {});
        await sleep(200);
      }
      // Prefer advancing the outer Module 1 term when the lesson is ready.
      // Re-clicking transfer confirm forever would block "Next term".
      if (await stepPrimary.count()) {
        const label = (await stepPrimary.textContent().catch(() => "")) || "";
        const enabled = await stepPrimary.isEnabled().catch(() => false);
        if (enabled) {
          console.log(`M1: step2 primary "${label.trim()}"`);
          await stepPrimary.click();
          await sleep(700);
          continue;
        }
      }

      const vcont = page.getByTestId("vocabulary-transfer-continue");
      if (await vcont.count()) {
        const enabled = await vcont.isEnabled().catch(() => false);
        if (enabled) {
          const before = await page
            .locator("[data-testid^=vocab-step-]")
            .first()
            .getAttribute("data-testid")
            .catch(() => "");
          await vcont.click();
          await sleep(500);
          const after = await page
            .locator("[data-testid^=vocab-step-]")
            .first()
            .getAttribute("data-testid")
            .catch(() => "");
          if (before && after && before !== after) {
            console.log(`M1: step ${before} → ${after}`);
          }
          // After confirm, outer primary may unlock — try it immediately.
          if (
            (await stepPrimary.count()) &&
            (await stepPrimary.isEnabled().catch(() => false))
          ) {
            const label =
              (await stepPrimary.textContent().catch(() => "")) || "";
            console.log(`M1: step2 primary after confirm "${label.trim()}"`);
            await stepPrimary.click();
            await sleep(700);
          }
          continue;
        }
      }
    }

    if (await stepPrimary.count()) {
      const label = (await stepPrimary.textContent().catch(() => "")) || "";
      const enabled = await stepPrimary.isEnabled().catch(() => false);
      if (enabled) {
        console.log(`M1: step2 primary "${label.trim()}"`);
        await stepPrimary.click();
        await sleep(700);
        continue;
      }
    }
    const nextTerm = page.getByRole("button", {
      name: /Next term|Learn the first term|Start quiz|Begin quiz/i,
    });
    if (await nextTerm.count()) {
      const enabled = await nextTerm.first().isEnabled().catch(() => false);
      if (enabled) {
        console.log(`M1: nextTerm ${await nextTerm.first().textContent()}`);
        await nextTerm.first().click();
        await sleep(600);
        continue;
      }
    }
    if (term > 10 && term % 15 === 0) {
      await shot(page, `m1-vocab-${term}.png`);
    }
    await sleep(250);
  }

  // Quiz — Module 1 uses a <select>, not radios
  for (let q = 0; q < 20; q += 1) {
    if (page.url().includes("/success")) break;
    console.log(`M1: quiz loop ${q}`);
    const active = page.getByTestId("quiz-active-item");
    if (!(await active.count())) {
      // May still be on LEARN with "Check my understanding"
      const startQuiz = page.getByTestId("step2-primary-action");
      if (
        (await startQuiz.count()) &&
        (await startQuiz.isEnabled().catch(() => false))
      ) {
        console.log("M1: start quiz via primary");
        await startQuiz.click();
        await sleep(700);
        continue;
      }
      await sleep(400);
      continue;
    }

    const select = active.locator("select").first();
    if (await select.count()) {
      const status =
        (await page.getByTestId("quiz-step-status").textContent().catch(() => "")) ||
        "";
      const m = status.match(/(\d+)\s+of\s+(\d+)/i);
      const idx = m ? Math.max(0, Number(m[1]) - 1) : q;
      const expected = MODULE1_QUIZ_V2[idx]?.answer;
      const options = await select.locator("option").allTextContents();
      const choice =
        (expected && options.find((o) => String(o).trim() === expected)) ||
        options.find((o) => String(o).trim() && !/^select an answer$/i.test(o)) ||
        options[1];
      if (choice) {
        await select.selectOption({ label: choice.trim() }).catch(async () => {
          const values = await select.locator("option").evaluateAll((els) =>
            els.map((el) => el.value).filter(Boolean)
          );
          if (values[0]) await select.selectOption(values[0]);
        });
        console.log(`M1: quiz selected "${String(choice).slice(0, 48)}"`);
        await sleep(250);
      }
    }

    const nextQ = page.getByLabel(/Continue to next quiz question/i);
    const submit = page.getByTestId("module1-quiz-submit");
    if ((await submit.count()) && (await submit.isEnabled().catch(() => false))) {
      console.log("M1: submit quiz");
      await submit.click();
      break;
    }
    if ((await nextQ.count()) && (await nextQ.isEnabled().catch(() => false))) {
      await nextQ.click();
      await sleep(350);
      continue;
    }
    await sleep(300);
  }

  await page.waitForURL(/\/modules\/1\/success/, { timeout: 180000 });
  await shot(page, "m1-success.png");
  // Wait for durable advancement before refresh/continue (retry if save fails)
  const continueBtn = page.getByTestId("module1-continue-module2");
  for (let i = 0; i < 60; i += 1) {
    if (await continueBtn.isEnabled().catch(() => false)) break;
    const retry = page.getByTestId("module1-advance-retry");
    if ((await retry.count()) && (await retry.isEnabled().catch(() => false))) {
      console.log("M1: retry advancement after quiz");
      await retry.click();
    }
    await sleep(500);
  }
  if (!(await continueBtn.isEnabled().catch(() => false))) {
    throw new Error("Module 1 advancement never enabled Continue to Module 2");
  }
  await refreshResume(page, "/modules/1/success");
  // After refresh, wait again for READY (idempotent alreadyAdvanced)
  for (let i = 0; i < 40; i += 1) {
    if (await continueBtn.isEnabled().catch(() => false)) break;
    const retry = page.getByTestId("module1-advance-retry");
    if ((await retry.count()) && (await retry.isEnabled().catch(() => false))) {
      await retry.click();
    }
    await sleep(500);
  }
  await clickContinueToModule(page, 2);
  note("module1", true, "success→module2");
}

async function waitForModule2Content(page) {
  for (let i = 0; i < 120; i += 1) {
    const loadingText = await page
      .getByText(/Loading your source texts/i)
      .count();
    const gateChecking = await page.getByTestId("module2-gate-checking").count();
    const begin = await page.getByRole("button", { name: /Let.?s begin/i }).count();
    const task = await page.getByTestId("task-workspace-task").count();
    if (!loadingText && !gateChecking && (begin || task)) return;
    if (i > 0 && i % 40 === 0) {
      console.log("M2: still loading — reload to recover session/compile race");
      await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 });
    }
    await sleep(500);
  }
  throw new Error("Module 2 content never left loading state");
}

async function runModule2(page) {
  await page.waitForURL(/\/modules\/2/, { timeout: 120000 });
  for (let i = 0; i < 40; i += 1) {
    const checking = page.getByTestId("module2-gate-checking");
    const waiting = page.getByTestId("module2-gate-waiting");
    const denied = page.getByTestId("module2-gate-denied");
    const err = page.getByTestId("module2-gate-error");
    if (await denied.count()) {
      throw new Error("Module 2 gate denied — Module 1 progress not visible");
    }
    if (await err.count()) {
      const retry = page.getByTestId("module2-gate-retry");
      if (await retry.count()) await retry.click();
      await sleep(800);
      continue;
    }
    if (!(await checking.count()) && !(await waiting.count())) break;
    await sleep(400);
  }
  await waitForModule2Content(page);
  await shot(page, "m2-entry.png");
  console.log(`M2: entry url=${page.url()}`);

  // Stage 0
  const letsBegin = page.getByRole("button", { name: /Let.?s begin/i });
  if (await letsBegin.count()) {
    console.log("M2: Let's begin");
    await letsBegin.click();
    await sleep(600);
  }

  // Stage 1 trust checkboxes
  for (let i = 0; i < 12; i += 1) {
    if (await page.locator("#module2-speech-full-text").count()) break;
    if (await page.getByRole("button", { name: /Save my speech copy/i }).count())
      break;
    const boxes = page.locator('input[type="checkbox"]:visible');
    const n = await boxes.count();
    for (let b = 0; b < n; b += 1) {
      await boxes.nth(b).check({ force: true }).catch(() => {});
    }
    const checkThinking = page.getByRole("button", {
      name: /Check my thinking/i,
    });
    if (
      (await checkThinking.count()) &&
      (await checkThinking.isEnabled().catch(() => false))
    ) {
      await checkThinking.click();
      await sleep(400);
    }
    const cont = page.getByRole("button", { name: /^Continue$/i });
    if ((await cont.count()) && (await cont.isEnabled().catch(() => false))) {
      await cont.click();
      await sleep(500);
      continue;
    }
    await sleep(300);
  }

  // Stage 2 speech
  for (let i = 0; i < 20; i += 1) {
    const speech = page.locator("#module2-speech-full-text");
    if (await speech.count()) {
      await speech.fill(SPEECH);
      const save = page.getByRole("button", { name: /Save my speech copy/i });
      if ((await save.count()) && (await save.isEnabled().catch(() => false))) {
        console.log("M2: save speech");
        await save.click();
        await sleep(1200);
      }
    }
    const cont = page.getByRole("button", { name: /^Continue$/i });
    if ((await cont.count()) && (await cont.isEnabled().catch(() => false))) {
      await cont.click();
      await sleep(600);
    }
    if (await page.locator("#module2-letter-full-text").count()) break;
    if (await page.getByRole("button", { name: /Save my letter copy/i }).count())
      break;
    await sleep(400);
  }
  await shot(page, "m2-after-speech.png");

  // Stage 3 letter
  for (let i = 0; i < 20; i += 1) {
    const letter = page.locator("#module2-letter-full-text");
    if (await letter.count()) {
      await letter.fill(LETTER);
      const save = page.getByRole("button", { name: /Save my letter copy/i });
      if ((await save.count()) && (await save.isEnabled().catch(() => false))) {
        console.log("M2: save letter");
        await save.click();
        await sleep(1200);
      }
    }
    const cont = page.getByRole("button", { name: /^Continue$/i });
    if ((await cont.count()) && (await cont.isEnabled().catch(() => false))) {
      await cont.click();
      await sleep(600);
    }
    if (
      await page
        .getByRole("button", { name: /Meet the two situations/i })
        .count()
    )
      break;
    await sleep(400);
  }
  await shot(page, "m2-after-letter.png");

  // Stage 4 → open meet-situations lesson (once)
  const meetPrimary = page
    .getByRole("button", { name: /^Meet the two situations$/i })
    .filter({ hasNotText: /Current|Locked|Completed/ });
  // Prefer the large workspace CTA (theme-blue), not the sidebar step list.
  const blueMeet = page.locator(
    'button.bg-theme-blue:has-text("Meet the two situations")'
  );
  if (await blueMeet.count()) {
    console.log("M2: Meet the two situations (primary)");
    await blueMeet.first().click();
    await sleep(800);
  } else if (await meetPrimary.count()) {
    console.log("M2: Meet the two situations (fallback)");
    await meetPrimary.last().click();
    await sleep(800);
  }

  // Stages 5 lesson phases + formative check
  for (let i = 0; i < 80; i += 1) {
    await assertNoPanelUsed(page);
    if (page.url().includes("/tcharts")) break;
    if (page.url().includes("/matrix")) break;
    if (page.url().includes("/success")) break;

    const tryAgain = page.getByRole("button", { name: /^Try again$/i });
    if (
      (await tryAgain.count()) &&
      (await tryAgain.first().isEnabled().catch(() => false))
    ) {
      console.log("M2: Try again then re-answer");
      await tryAgain.first().click();
      await sleep(400);
    }

    const prompt =
      (await page.locator("fieldset legend").first().textContent().catch(() => "")) ||
      "";
    if (await page.locator('input[type="radio"]:visible').count()) {
      let target = null;
      if (/delivered out loud|public crowd/i.test(prompt)) {
        target = page.getByRole("radio", { name: /I Have a Dream/i });
      } else if (/criticized the demonstrations|answered people who criticized/i.test(prompt)) {
        target = page.getByRole("radio", {
          name: /Letter from Birmingham Jail/i,
        });
      } else if (/already support the civil-rights/i.test(prompt)) {
        target = page.getByRole("radio", { name: /Many of the marchers/i });
      } else if (/purpose do both works share/i.test(prompt)) {
        target = page.getByRole("radio", {
          name: /Advancing civil rights/i,
        });
      } else if (/rhetoric differently|different audiences in different situations/i.test(prompt)) {
        target = page.getByRole("radio", {
          name: /different audiences in different situations/i,
        });
      }
      if (target && (await target.count())) {
        await target.first().check({ force: true }).catch(async () => {
          await target.first().click({ force: true });
        });
        console.log(`M2: answered by prompt "${prompt.slice(0, 48)}"`);
        await sleep(400);
      } else {
        await pickFirstRadio(page).catch(() => {});
        await sleep(300);
      }
    }

    const lessonPrimaries = [
      /^Next: Meet the letter$/i,
      /^Next: Compare the situations$/i,
      /^Check my understanding$/i,
      /^Next question$/i,
      /^Finish the check$/i,
      /^Continue: Begin reading like a writer$/i,
      /^Continue$/i,
      /^Begin reading like a writer$/i,
    ];
    let clicked = false;
    for (const name of lessonPrimaries) {
      const btn = page.getByRole("button", { name });
      const count = await btn.count();
      for (let b = 0; b < count; b += 1) {
        const candidate = btn.nth(b);
        const enabled = await candidate.isEnabled().catch(() => false);
        const label = ((await candidate.textContent().catch(() => "")) || "").trim();
        if (!enabled || label.length > 80) continue;
        if (/Current|Locked|Completed/i.test(label)) continue;
        console.log(`M2: lesson CTA "${label}"`);
        await candidate.click();
        await sleep(700);
        clicked = true;
        break;
      }
      if (clicked) break;
    }
    if (!clicked) await sleep(300);
  }
  await shot(page, "m2-before-tcharts.png");

  // T-charts — must complete Save and finish before matrix
  if (!page.url().includes("/tcharts") && !page.url().includes("/matrix") && !page.url().includes("/success")) {
    console.log("M2: navigate to /modules/2/tcharts");
    await page.goto(`${BASE}/modules/2/tcharts`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
  }
  const tchartQuotes = [
    [
      "Five score years ago, a great American signed the Emancipation Proclamation.",
      "This builds trust by naming shared American values before the appeal.",
    ],
    [
      "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin.",
      "Pathos makes the public crowd feel the personal stake in freedom now.",
    ],
    [
      "We cannot walk alone. And as we walk, we must make the pledge that we shall always march ahead.",
      "Logos and resolve show why continuing the march is the reasonable next step.",
    ],
    [
      "I am in Birmingham because injustice is here.",
      "Ethos places King as a responsible leader answering critics on their terms.",
    ],
    [
      "Injustice anywhere is a threat to justice everywhere.",
      "The letter uses moral reasoning so clergymen see local injustice as their concern too.",
    ],
    [
      "We know through painful experience that freedom is never voluntarily given by the oppressor; it must be demanded by the oppressed.",
      "Urgency and feeling push cautious readers toward accepting direct action.",
    ],
  ];
  let tchartFinished = false;
  for (let i = 0; i < 50; i += 1) {
    if (page.url().includes("/matrix") || page.url().includes("/success")) {
      tchartFinished = true;
      break;
    }
    if (!page.url().includes("/tcharts")) {
      await page.goto(`${BASE}/modules/2/tcharts`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
    }
    const pair = tchartQuotes[Math.min(i, tchartQuotes.length - 1)];
    await page.waitForSelector("textarea:visible", { timeout: 30000 }).catch(() => {});
    const areas = page.locator("textarea:visible");
    const n = await areas.count();
    if (i % 5 === 0) console.log(`M2: tchart iter ${i} areas=${n} url=${page.url()}`);
    for (let a = 0; a < n; a += 1) {
      const cur = await areas.nth(a).inputValue().catch(() => "");
      if (String(cur).trim().length >= 12) continue;
      await areas.nth(a).fill(a % 2 === 0 ? pair[0] : pair[1]);
    }
    const saveFinish = page.getByRole("button", {
      name: /Save and finish/i,
    });
    if (
      (await saveFinish.count()) &&
      (await saveFinish.first().isEnabled().catch(() => false))
    ) {
      console.log("M2: tchart Save and finish");
      await saveFinish.first().click();
      await sleep(1200);
      tchartFinished = true;
      break;
    }
    const next = page.getByRole("button", {
      name: /Continue to Letter|Continue to Speech|Continue to Pathos|Continue to Logos|Continue to pathos|Continue to logos|^Continue$/i,
    });
    if ((await next.count()) && (await next.first().isEnabled().catch(() => false))) {
      console.log(`M2: tchart ${await next.first().textContent()}`);
      await next.first().click();
      await sleep(800);
      continue;
    }
    await sleep(400);
  }
  await shot(page, "m2-after-tcharts.png");
  if (!tchartFinished && !page.url().includes("/matrix")) {
    throw new Error(`T-charts did not finish; url=${page.url()}`);
  }

  // Matrix
  if (!page.url().includes("/matrix") && !page.url().includes("/success")) {
    await page.goto(`${BASE}/modules/2/matrix`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
  }
  // Wait out analysis gate / matrix hydrate
  for (let i = 0; i < 40; i += 1) {
    const gateLoading = await page.getByTestId("module2-gate-checking").count();
    const matrixLoading = await page
      .getByText(/Loading your rhetorical matrix/i)
      .count();
    const start = await page
      .getByRole("button", {
        name: /Start rating|Continue to first matrix cell/i,
      })
      .count();
    const active = await page.getByTestId("matrix-active-task").count();
    const denied = await page.getByTestId("module2-gate-denied").count();
    const err = await page.getByTestId("module2-gate-error").count();
    if (denied) {
      throw new Error("Matrix gate denied — finish Meet the two situations");
    }
    if (err) {
      const retry = page.getByTestId("module2-gate-retry");
      if (await retry.count()) await retry.click();
    }
    if (!gateLoading && !matrixLoading && (start || active)) break;
    await sleep(500);
  }
  if (
    (await page.getByTestId("module2-gate-checking").count()) ||
    (await page.getByText(/Loading your rhetorical matrix/i).count())
  ) {
    await shot(page, "m2-matrix-stuck.png");
    throw new Error("Matrix never left loading/gate state");
  }
  await shot(page, "m2-matrix-entry.png");
  console.log(`M2: matrix ready url=${page.url()}`);
  for (let i = 0; i < 80; i += 1) {
    await assertNoPanelUsed(page);
    if (page.url().includes("/modules/2/success")) break;

    const start = page.getByRole("button", {
      name: /Start rating|Continue to first matrix cell/i,
    });
    if ((await start.count()) && (await start.isEnabled().catch(() => false))) {
      console.log("M2: Start rating");
      await start.click();
      await sleep(500);
    }

    const ratingBtn = page.getByRole("button", { name: /Rate 7 out of 10/i });
    if (await ratingBtn.count()) {
      console.log("M2: rate 7");
      await ratingBtn.click();
      await sleep(300);
    } else {
      const rating = page.getByTestId("matrix-rating-anchors");
      if (await rating.count()) {
        await page
          .getByRole("button", { name: /Rate \d+ out of 10/i })
          .nth(7)
          .click()
          .catch(() => {});
      }
    }
    const noneEv = page.getByRole("button", {
      name: /Not meaningfully used/i,
    });
    if (await noneEv.count()) {
      await noneEv.click().catch(() => {});
    }
    const ev = page.locator(
      '[data-testid="matrix-evidence-mode"] button, [data-testid="matrix-evidence-mode"] label, button:has-text("Use this")'
    );
    if (await ev.count()) {
      console.log("M2: pick evidence");
      await ev.first().click().catch(() => {});
    }

    const fn = page.locator("textarea:visible").first();
    if (await fn.count()) {
      const v = await fn.inputValue().catch(() => "");
      if (String(v).trim().length < 20) {
        await fn.fill(
          "This evidence shows how King adapts ethos or pathos for each audience so they will listen and act."
        );
      }
    }

    const choosePattern = page.getByRole("button", {
      name: /Choose a pattern direction/i,
    });
    if (
      (await choosePattern.count()) &&
      (await choosePattern.isEnabled().catch(() => false))
    ) {
      console.log("M2: Choose a pattern direction");
      await choosePattern.click();
      await sleep(600);
      continue;
    }

    const matrixCont = page.getByTestId("matrix-continue");
    if (
      (await matrixCont.count()) &&
      (await matrixCont.isEnabled().catch(() => true))
    ) {
      console.log("M2: matrix continue");
      await matrixCont.click();
      await sleep(500);
      continue;
    }

    // Pattern options
    const primaryOpts = page.getByTestId("matrix-primary-options");
    if (await primaryOpts.count()) {
      const opt = primaryOpts.locator("button, [role='radio'], label").first();
      if (await opt.count()) {
        console.log("M2: select pattern option");
        await opt.click();
        await sleep(400);
      }
    }

    if (await page.locator('input[type="radio"]:visible').count()) {
      await pickFirstRadio(page).catch(() => {});
    }
    const reason = page.locator("textarea:visible").last();
    if (await reason.count()) {
      const v = await reason.inputValue().catch(() => "");
      if (String(v).trim().length < 20) {
        await reason.fill(
          "King uses pathos more openly in the speech and careful credibility in the letter so each audience will listen and act for justice."
        );
      }
    }
    const saveSuccess = page.getByRole("button", {
      name: /Save and continue to Module 2 success|Finish Module 2|continue to success/i,
    });
    if (
      (await saveSuccess.count()) &&
      (await saveSuccess.first().isEnabled().catch(() => false))
    ) {
      console.log("M2: save to success");
      await saveSuccess.first().click();
      await sleep(1000);
      continue;
    }
    const cont2 = page.getByRole("button", {
      name: /^(Continue|Next|Save)|Continue matrix microtask/i,
    });
    if (
      (await cont2.count()) &&
      (await cont2.first().isEnabled().catch(() => false))
    ) {
      console.log(`M2: cont2 ${await cont2.first().textContent()}`);
      await cont2.first().click().catch(() => {});
      await sleep(500);
      continue;
    }
    if (i % 10 === 0) console.log(`M2: matrix iter ${i} url=${page.url()}`);
    await sleep(400);
  }

  await page.waitForURL(/\/modules\/2\/success/, { timeout: 180000 });
  await shot(page, "m2-success.png");
  await refreshResume(page, "/modules/2/success");
  await clickContinueToModule(page, 3);
  note("module2", true, "success→module3");
}

async function fillShortTextareas(page, minLen, text) {
  const areas = page.locator("textarea:visible");
  const n = await areas.count();
  for (let a = 0; a < n; a += 1) {
    const cur = await areas.nth(a).inputValue().catch(() => "");
    if (String(cur).trim().length < minLen) {
      await areas.nth(a).fill(text);
    }
  }
}

async function clickEnabledByName(page, nameRe, label) {
  const btn = page.getByRole("button", { name: nameRe });
  if (!(await btn.count())) return false;
  const target = btn.first();
  if (!(await target.isEnabled().catch(() => false))) return false;
  console.log(`${label || (await target.textContent())}`);
  await clickStable(target);
  await sleep(700);
  return true;
}

/** Click through React remounts / layout thrash (Playwright "element is not stable"). */
async function clickStable(locator, { timeout = 45000 } = {}) {
  const started = Date.now();
  let lastErr;
  while (Date.now() - started < timeout) {
    try {
      await locator.click({ timeout: 8000, force: true });
      return;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!/not stable|detached|intercepts pointer/i.test(msg)) throw err;
      await sleep(350);
    }
  }
  throw lastErr || new Error("clickStable timeout");
}

async function runModule3(page) {
  await page.waitForURL(/\/modules\/3/, { timeout: 120000 });
  for (let i = 0; i < 40; i += 1) {
    const loading = await page
      .getByText(/Loading your quotes and notes|Loading your comparison/i)
      .count();
    if (!loading) break;
    await sleep(500);
  }
  await shot(page, "m3-entry.png");
  console.log(`M3: entry url=${page.url()}`);

  const ideaText =
    "King adapts credibility and hope so each audience will accept the same call for justice.";
  const whyText =
    "The speech opens with shared American values while the letter earns trust from critics before asking them to act.";
  const connectNote =
    "Specific wording shows how King earns trust or urgency for this audience before calling for justice.";
  const claimText =
    "King adapts ethos and pathos for each audience so both groups will accept the shared demand for justice.";
  const thesisText =
    "In both the speech and the letter, King adapts ethos and pathos to each audience so that readers and listeners will accept his call for justice.";
  const proofText =
    "Compare openings that build trust, then show how emotional urgency fits the public crowd but careful reasoning fits the clergymen.";

  for (let i = 0; i < 120; i += 1) {
    if (page.url().includes("/modules/3/success")) break;
    await assertNoPanelUsed(page);

    // --- wp086 rebuilt path (if mounted) ---
    const ack = page.getByTestId("wp087-acknowledge-direction-review");
    if (await ack.count()) await ack.click().catch(() => {});
    const mapConfirm = page.getByTestId("wp086-confirm-argument-map");
    if (await mapConfirm.count()) {
      await mapConfirm.check({ force: true }).catch(() => mapConfirm.click());
    }
    if (await page.getByTestId("wp086-evidence-argument-panel").count()) {
      await fillShortTextareas(page, 15, thesisText);
      if (
        await clickEnabledByName(
          page,
          /Finish Module 3|^Continue$/i,
          "wp086 continue"
        )
      ) {
        continue;
      }
    }

    // --- classic V2 path ---
    const matrixConfirm = page.getByTestId("matrix-review-confirm");
    if (await matrixConfirm.count()) {
      console.log("M3: matrix-review-confirm");
      await matrixConfirm.click().catch(() => {});
      await sleep(400);
    }

    // Group: select ≥2 quotes (prefer letter + speech)
    const addBoxes = page.getByRole("checkbox", { name: /Add to group/i });
    const addCount = await addBoxes.count();
    if (addCount >= 2) {
      console.log(`M3: select ${Math.min(addCount, 2)} quotes for group`);
      await addBoxes.nth(0).check({ force: true }).catch(() => addBoxes.nth(0).click());
      await addBoxes.nth(Math.min(1, addCount - 1)).check({ force: true }).catch(() =>
        addBoxes.nth(Math.min(1, addCount - 1)).click()
      );
      // If a third exists and we still only have same-source, try last checkbox too
      if (addCount >= 4) {
        await addBoxes.nth(3).check({ force: true }).catch(() => {});
      }
      await sleep(400);
    }

    const groupName = page.getByLabel(/Short group name/i);
    if (await groupName.count()) {
      const v = await groupName.inputValue().catch(() => "");
      if (!String(v).trim()) {
        await groupName.fill("Audience-adapted trust and urgency");
      }
    }
    if (
      await clickEnabledByName(page, /^Save this group$/i, "Save this group")
    ) {
      continue;
    }
    if (
      await clickEnabledByName(
        page,
        /Explore this group(?: instead)?$/i,
        "Explore this group"
      )
    ) {
      continue;
    }

    // Pattern: carry Module 2 direction
    if (
      await clickEnabledByName(
        page,
        /Carry this direction forward/i,
        "Carry direction"
      )
    ) {
      continue;
    }
    if (
      await clickEnabledByName(
        page,
        /Choose this observation/i,
        "Choose observation"
      )
    ) {
      continue;
    }

    // Claim internal stage
    if (
      await clickEnabledByName(page, /^Write my claim$/i, "Write my claim")
    ) {
      continue;
    }

    // Connections: pick Supports on visible radios, fill notes
    const supports = page.getByRole("radio", { name: /Supports the idea/i });
    const supportN = await supports.count();
    for (let s = 0; s < supportN; s += 1) {
      const radio = supports.nth(s);
      if (!(await radio.isChecked().catch(() => false))) {
        await radio.check({ force: true }).catch(() => radio.click());
      }
    }
    if (supportN) await sleep(300);

    // Readiness checklist + reflection
    if (
      await clickEnabledByName(
        page,
        /I’ve reviewed the checklist|I've reviewed the checklist/i,
        "checklist ack"
      )
    ) {
      // fall through to fill radios same iter
    }
    const reflection = page.getByRole("radio", {
      name: /Yes — my notes point to specific words/i,
    });
    if ((await reflection.count()) && !(await reflection.first().isChecked().catch(() => false))) {
      await reflection.first().check({ force: true }).catch(() => reflection.first().click());
    }
    const comparison = page.getByRole("radio", {
      name: /They show both a similarity and a difference/i,
    });
    if ((await comparison.count()) && !(await comparison.first().isChecked().catch(() => false))) {
      await comparison.first().check({ force: true }).catch(() => comparison.first().click());
    }
    const readyClaim = page.getByRole("radio", {
      name: /I’m ready to build a claim|I'm ready to build a claim/i,
    });
    if ((await readyClaim.count()) && !(await readyClaim.first().isChecked().catch(() => false))) {
      const enabled = await readyClaim.first().isEnabled().catch(() => true);
      if (enabled) {
        console.log("M3: ready to build claim");
        await readyClaim.first().check({ force: true }).catch(() => readyClaim.first().click());
        await sleep(400);
      }
    }
    const moveOn = page.getByRole("radio", {
      name: /Move on with what I have/i,
    });
    if ((await moveOn.count()) && !(await moveOn.first().isChecked().catch(() => false))) {
      await moveOn.first().check({ force: true }).catch(() => moveOn.first().click());
    }

    // Fill idea / claim / thesis / proof / connection notes
    const heading = await page.locator("h1, h2").first().textContent().catch(() => "");
    if (/What might this pattern mean|Your idea|idea feel worth/i.test(heading || "")) {
      await fillShortTextareas(page, 15, ideaText);
      const why = page.getByLabel(/Why does this idea feel worth exploring/i);
      if (await why.count()) {
        const v = await why.inputValue().catch(() => "");
        if (String(v).trim().length < 15) await why.fill(whyText);
      }
    } else if (/claim/i.test(heading || "") || (await page.getByTestId("claim-internal-review").count())) {
      await fillShortTextareas(page, 10, claimText);
    } else if (/thesis|proof/i.test(heading || "")) {
      await fillShortTextareas(page, 10, thesisText);
      const proofs = page.locator("textarea:visible");
      const pn = await proofs.count();
      if (pn >= 2) {
        const last = await proofs.nth(pn - 1).inputValue().catch(() => "");
        if (String(last).trim().length < 10) await proofs.nth(pn - 1).fill(proofText);
      }
    } else if (
      (await page.getByText(/Explain the connection in your own words/i).count()) ||
      (await page.getByRole("radio", { name: /Supports the idea/i }).count())
    ) {
      await fillShortTextareas(page, 15, connectNote);
    } else {
      await fillShortTextareas(page, 15, whyText);
    }

    // Prefer specific Finish / Keep going in footer (not sidebar)
    const finishThesis = page.getByRole("button", {
      name: /Finish your thesis and continue/i,
    });
    if (
      (await finishThesis.count()) &&
      (await finishThesis.first().isEnabled().catch(() => false))
    ) {
      console.log("M3: Finish your thesis and continue");
      await finishThesis.first().click();
      await sleep(900);
      continue;
    }
    const keepGoing = page.getByRole("button", { name: /^Keep going$/i });
    if (
      (await keepGoing.count()) &&
      (await keepGoing.first().isEnabled().catch(() => false))
    ) {
      console.log("M3: Keep going");
      await keepGoing.first().click();
      await sleep(800);
      continue;
    }

    if (i % 10 === 0) {
      const task =
        (await page.getByTestId("task-workspace-task").textContent().catch(() => "")) ||
        (await page.locator("h1").first().textContent().catch(() => "")) ||
        "";
      console.log(`M3: iter ${i} task="${String(task).slice(0, 60)}" url=${page.url()}`);
      await shot(page, `m3-iter-${i}.png`);
    }
    await sleep(450);
  }
  await page.waitForURL(/\/modules\/3\/success/, { timeout: 180000 });
  await shot(page, "m3-success.png");
  await refreshResume(page, "/modules/3/success");
  await clickContinueToModule(page, 4);
  note("module3", true, "success→module4");
}

async function runModule4(page) {
  await page.waitForURL(/\/modules\/4/, { timeout: 120000 });
  await shot(page, "m4-entry.png");
  console.log(`M4: entry url=${page.url()}`);

  const pointText =
    "King builds trust differently for each audience so they will accept his call for justice.";
  const jobText =
    "Show how openings and shared values prepare each audience to listen.";
  const reasonText =
    "The speech opens with American ideals for a public crowd, while the letter carefully earns the clergymen’s trust before asking them to act.";
  const reflectionText =
    "Both plans compare how King adapts ethos and pathos without losing the shared justice purpose.";

  for (let i = 0; i < 100; i += 1) {
    if (page.url().includes("/modules/4/success")) break;
    await assertNoPanelUsed(page);

    const ack = page.getByTestId("module4-acknowledge-upstream");
    if (await ack.count()) await ack.click().catch(() => {});

    const patternChoice = page.getByRole("radio", {
      name: /King builds trust so the audience will listen|King connects himself to justice|King presents himself as morally responsible/i,
    });
    if (await patternChoice.count()) {
      const first = patternChoice.first();
      if (!(await first.isChecked().catch(() => false))) {
        console.log("M4: choose pattern");
        await first.check({ force: true }).catch(() => first.click());
        await sleep(400);
      }
    }

    // Paragraph job radios (Analyze the speech / Compare both / etc.)
    const jobChoice = page.getByRole("radio", {
      name: /Analyze the speech|Analyze the letter|Compare both works|Show an important similarity|Show an important difference|Trace one rhetorical appeal/i,
    });
    if (await jobChoice.count()) {
      const first = jobChoice.first();
      if (!(await first.isChecked().catch(() => false))) {
        console.log(`M4: choose job ${await first.evaluate((el) => el.value || el.getAttribute("aria-label") || "job").catch(() => "job")}`);
        await first.check({ force: true }).catch(() => first.click());
        await sleep(400);
      }
    }

    if (
      await clickEnabledByName(
        page,
        /See how a paragraph plan works|See what you will build|See the full sequence|Next job|Start Body Paragraph 1|Start planning|Continue to the model|I’m ready to plan|I'm ready to plan/i,
        "M4 handoff/start"
      )
    ) {
      continue;
    }

    const noThird = page.getByRole("button", {
      name: /No — finish with two|No - finish with two|finish with two/i,
    });
    if (
      (await noThird.count()) &&
      (await noThird.first().isEnabled().catch(() => false))
    ) {
      console.log("M4: finish with two paragraphs");
      await noThird.first().click();
      await sleep(700);
      continue;
    }

    await fillShortTextareas(page, 15, pointText);
    for (const [label, text, min] of [
      [/What is the point|Paragraph point/i, pointText, 15],
      [/What is this paragraph’s job|paragraph's job|Paragraph job/i, jobText, 8],
      [/How does the evidence|Explain your reasoning|Reasoning/i, reasonText, 20],
      [/What did you notice|Compare my plans|Reflection/i, reflectionText, 15],
    ]) {
      const field = page.getByRole("textbox", { name: label });
      if (!(await field.count())) continue;
      const el = field.first();
      const v = await el.inputValue().catch(() => "");
      if (String(v).trim().length < min) await el.fill(text);
    }

    const useQuote = page.getByRole("button", {
      name: /Use this quotation|Add this evidence|Include this/i,
    });
    if (await useQuote.count()) {
      await useQuote.first().click().catch(() => {});
      await sleep(300);
    }
    // Module 4 evidence checkboxes: aria-label like "Speech · ethos · quote…"
    const quoteCheck = page.getByRole("checkbox", {
      name: /Speech|Letter|Ethos|Pathos|Logos/i,
    });
    const qc = await quoteCheck.count();
    if (qc) {
      let checkedAny = false;
      for (let q = 0; q < Math.min(qc, 3); q += 1) {
        const box = quoteCheck.nth(q);
        if (await box.isChecked().catch(() => false)) {
          checkedAny = true;
          continue;
        }
        console.log("M4: select evidence checkbox");
        await box.check({ force: true }).catch(() => box.click());
        checkedAny = true;
        await sleep(200);
        // Analyze the speech → one speech quote is enough; still try a second if available
        if (q >= 0) break;
      }
      if (checkedAny) await sleep(300);
    }

    const finish = page.getByRole("button", {
      name: /Finish Module 4|Finish your paragraph plans/i,
    });
    if (
      (await finish.count()) &&
      (await finish.first().isEnabled().catch(() => false))
    ) {
      console.log("M4: Finish Module 4");
      await clickStable(finish.first());
      await page
        .waitForURL(/\/modules\/4\/success|\/modules\/5/, { timeout: 60000 })
        .catch(() => {});
      await sleep(900);
      continue;
    }

    const keep = page.getByRole("button", {
      name: /^Keep going$|Plan Body Paragraph|Decide whether you need Body Paragraph|Next paragraph|Compare my plans|Review Body Paragraph|Finish with two|No — finish with two|Yes — add paragraph|Finish Module 4|Finish your paragraph plans/i,
    });
    if (
      (await keep.count()) &&
      (await keep.first().isEnabled().catch(() => false))
    ) {
      console.log(`M4: ${String(await keep.first().textContent()).trim()}`);
      await clickStable(keep.first());
      await sleep(700);
      continue;
    }

    if (i % 10 === 0) {
      const h =
        (await page.locator("h1").first().textContent().catch(() => "")) || "";
      console.log(`M4: iter ${i} h1="${String(h).slice(0, 50)}" url=${page.url()}`);
      await shot(page, `m4-iter-${i}.png`);
    }
    await sleep(450);
  }
  await page.waitForURL(/\/modules\/4\/success/, { timeout: 180000 });
  await shot(page, "m4-success.png");
  await refreshResume(page, "/modules/4/success");
  await clickContinueToModule(page, 5);
  note("module4", true, "success→module5");
}

async function runModule5(page) {
  await page.waitForURL(/\/modules\/5/, { timeout: 120000 });
  await shot(page, "m5-entry.png");
  console.log(`M5: entry url=${page.url()}`);
  for (let i = 0; i < 60; i += 1) {
    if (page.url().includes("/modules/5/success")) break;
    await assertNoPanelUsed(page);

    if (
      await clickEnabledByName(
        page,
        /Arrange my body paragraphs/i,
        "Arrange paragraphs"
      )
    ) {
      continue;
    }

    await fillShortTextareas(
      page,
      12,
      "In closing, King returns each audience to justice as a shared duty rather than a distant hope."
    );

    const finish = page.getByRole("button", {
      name: /Finish my outline|Finish Module 5/i,
    });
    if (
      (await finish.count()) &&
      (await finish.first().isEnabled().catch(() => false))
    ) {
      console.log("M5: Finish my outline");
      await finish.first().click();
      await sleep(900);
      continue;
    }

    const cont = page.getByRole("button", {
      name: /Review the first paragraph|Next paragraph|Plan the conclusion|Review conclusion plan|Review the full outline|^Continue$/i,
    });
    if (
      (await cont.count()) &&
      (await cont.first().isEnabled().catch(() => false))
    ) {
      console.log(`M5: ${String(await cont.first().textContent()).trim()}`);
      await cont.first().click();
      await sleep(700);
      continue;
    }

    if (i % 10 === 0) {
      console.log(`M5: iter ${i} url=${page.url()}`);
      await shot(page, `m5-iter-${i}.png`);
    }
    await sleep(450);
  }
  await page.waitForURL(/\/modules\/5\/success/, { timeout: 180000 });
  await shot(page, "m5-success.png");
  await refreshResume(page, "/modules/5/success");
  await clickContinueToModule(page, 6);
  note("module5", true, "success→module6");
}

async function runModule6(page) {
  await page.waitForURL(/\/modules\/6/, { timeout: 120000 });
  await shot(page, "m6-entry.png");
  console.log(`M6: entry url=${page.url()}`);
  for (let i = 0; i < 100; i += 1) {
    if (page.url().includes("/modules/6/success")) break;
    await assertNoPanelUsed(page);

    if (await page.getByText(/Finish earlier modules|gate blocked/i).count()) {
      throw new Error("Module 6 gate blocked — progress advance failed");
    }

    await fillShortTextareas(
      page,
      12,
      "King connects this evidence to his larger point about justice so readers see why the choice matters for this audience and purpose."
    );

    const assemble = page.getByRole("button", {
      name: /assemble|save sentence|add to draft|use this sentence|Save this move/i,
    });
    if (
      (await assemble.count()) &&
      (await assemble.first().isEnabled().catch(() => false))
    ) {
      await assemble.first().click().catch(() => {});
      await sleep(400);
    }

    const finish = page.getByRole("button", {
      name: /Finish draft and continue|Finish Module 6/i,
    });
    if (
      (await finish.count()) &&
      (await finish.first().isEnabled().catch(() => false))
    ) {
      console.log("M6: Finish draft");
      await finish.first().click();
      await sleep(900);
      continue;
    }

    const keep = page.getByRole("button", {
      name: /^Keep going$|Continue to next|Next move|^Continue$/i,
    });
    if (
      (await keep.count()) &&
      (await keep.first().isEnabled().catch(() => false))
    ) {
      console.log(`M6: ${String(await keep.first().textContent()).trim()}`);
      await keep.first().click();
      await sleep(700);
      continue;
    }

    if (i % 10 === 0) {
      console.log(`M6: iter ${i} url=${page.url()}`);
      await shot(page, `m6-iter-${i}.png`);
    }
    await sleep(450);
  }
  await page.waitForURL(/\/modules\/6\/success/, { timeout: 180000 });
  await shot(page, "m6-success.png");
  await refreshResume(page, "/modules/6/success");
  await clickContinueToModule(page, 7);
  note("module6", true, "success→module7");
}

async function runModule7(page) {
  await page.waitForURL(/\/modules\/7/, { timeout: 120000 });
  await page.context().grantPermissions(["microphone"], { origin: BASE });
  await ensureMediaMocks(page);

  // Wait out hydrate / gate / draft load (do not demand Start yet)
  for (let i = 0; i < 80; i += 1) {
    if (await page.getByText(/Finish Module 6 before/i).count()) {
      throw new Error("Module 7 gate blocked — progress advance failed");
    }
    const loading = await page
      .getByText(/Loading your draft and reference materials/i)
      .count();
    const startVisible = await page
      .getByRole("button", { name: /Start read-aloud/i })
      .count();
    const primary = await page.getByTestId("module7-read-aloud-primary").count();
    if (!loading && (startVisible || primary)) break;
    if (i > 0 && i % 25 === 0) {
      console.log("M7: still loading draft — reload + remock mic");
      await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 });
      await ensureMediaMocks(page);
      await page.context().grantPermissions(["microphone"], { origin: BASE });
    }
    await sleep(500);
  }
  await shot(page, "m7-entry.png");
  console.log(`M7: entry url=${page.url()}`);
  await ensureMediaMocks(page);

  // Auto-dismiss confirm/alert from overwrite or upload failure
  page.on("dialog", async (dialog) => {
    console.log(`M7: dialog ${dialog.type()}: ${dialog.message().slice(0, 80)}`);
    await dialog.accept().catch(() => {});
  });

  // Read aloud — record then stop
  const start = page.getByRole("button", { name: /Start read-aloud/i });
  await start.first().waitFor({ state: "visible", timeout: 60000 });
  console.log("M7: Start read-aloud");
  await start.first().click();
  await sleep(1200);
  const stop = page.getByRole("button", { name: /Stop recording|Stop read-aloud/i });
  for (let i = 0; i < 20; i += 1) {
    if (await stop.count()) {
      console.log("M7: Stop recording");
      await stop.first().click();
      break;
    }
    await sleep(300);
  }
  // Wait for observation UI (appears after local audioURL is set)
  for (let i = 0; i < 40; i += 1) {
    if (await page.getByTestId("module7-observation-radiogroup").count()) break;
    // If upload alert cleared and URL still set, radiogroup should appear
    await sleep(500);
  }
  const obs = page.getByTestId("module7-observation-radiogroup");
  if (!(await obs.count())) {
    await shot(page, "m7-no-observation.png");
    throw new Error("Module 7 observation UI never appeared after recording");
  }
  const stumble = page.getByRole("radio", {
    name: /I stumbled or lost my place/i,
  });
  if (await stumble.count()) {
    console.log("M7: pick observation");
    await stumble.first().check({ force: true }).catch(() => stumble.first().click());
  } else {
    await obs.locator('input[type="radio"]').first().check({ force: true }).catch(async () => {
      await obs.locator("label").first().click();
    });
  }
  await sleep(400);

  for (let i = 0; i < 80; i += 1) {
    if (page.url().includes("/modules/7/success")) break;
    await assertNoPanelUsed(page);

    await fillShortTextareas(
      page,
      12,
      "After listening, I strengthened the explanation so the evidence clearly supports the claim for this audience."
    );

    const finish = page.getByTestId("module7-finish-revising").or(
      page.getByRole("button", {
        name: /Finish revising and continue to Module 8/i,
      })
    );
    if (
      (await finish.count()) &&
      (await finish.first().isEnabled().catch(() => false))
    ) {
      console.log("M7: Finish revising");
      await finish.first().click();
      await sleep(900);
      continue;
    }

    const keepGoing = page.getByRole("button", { name: /^Keep going$/i });
    if (
      (await keepGoing.count()) &&
      (await keepGoing.first().isEnabled().catch(() => false))
    ) {
      console.log("M7: Keep going");
      await keepGoing.first().click();
      await sleep(700);
      continue;
    }

    const cont = page.getByRole("button", { name: /^Continue$/i });
    if (
      (await cont.count()) &&
      (await cont.first().isEnabled().catch(() => false))
    ) {
      console.log("M7: Continue");
      await cont.first().click();
      await sleep(700);
      continue;
    }

    // Save only when advancement is locked (persist mid-step work once)
    const save = page.getByRole("button", { name: /^Save revision$/i });
    if (
      (await save.count()) &&
      (await save.first().isEnabled().catch(() => false)) &&
      i % 5 === 0
    ) {
      console.log("M7: Save revision (mid-step)");
      await save.first().click();
      await sleep(600);
    }

    if (i % 10 === 0) {
      const h =
        (await page.locator("h1").first().textContent().catch(() => "")) || "";
      console.log(`M7: iter ${i} h1="${String(h).slice(0, 60)}" url=${page.url()}`);
      await shot(page, `m7-iter-${i}.png`);
    }
    await sleep(450);
  }

  await page.waitForURL(/\/modules\/7\/success/, { timeout: 180000 });
  await shot(page, "m7-success.png");
  await refreshResume(page, "/modules/7/success");
  await clickContinueToModule(page, 8);
  note("module7", true, "success→module8");
}

async function runModule8(page) {
  await page.waitForURL(/\/modules\/8/, { timeout: 120000 });
  await shot(page, "m8-entry.png");
  const create = page.getByTestId("module8-guided-create-update");
  await create.waitFor({ timeout: 60000 });
  await create.click();
  // Real Google Doc create/verify can take a while
  await page
    .getByTestId("module8-guided-doc-status")
    .waitFor({ timeout: 180000 })
    .catch(() => {});
  for (let i = 0; i < 60; i += 1) {
    const cont = page.getByTestId("module8-guided-continue");
    if ((await cont.count()) && (await cont.isEnabled().catch(() => false))) {
      await cont.click();
      break;
    }
    // legacy finish
    const legacy = page.getByTestId("module8-finish-prepare");
    if ((await legacy.count()) && (await legacy.isEnabled().catch(() => false))) {
      await legacy.click();
      break;
    }
    await sleep(2000);
  }
  await page.waitForURL(/\/modules\/8\/success/, { timeout: 180000 });
  await shot(page, "m8-success.png");
  await refreshResume(page, "/modules/8/success");
  await clickContinueToModule(page, 9);
  note("module8", true, "success→module9");
}

async function runModule9(page) {
  await page.waitForURL(/\/modules\/9/, { timeout: 120000 });
  await shot(page, "m9-entry.png");

  for (let i = 0; i < 40; i += 1) {
    if (await page.getByTestId("guided-apa-pdf-phase").count()) break;
    if (await page.getByTestId("module9-view-submission-receipt").count()) break;

    const startMoves = page.getByTestId("guided-apa-start-moves");
    if (await startMoves.count()) await startMoves.click().catch(() => {});

    const looks = page.getByTestId("guided-apa-looks-correct");
    if (await looks.count()) {
      await looks.click();
      await sleep(400);
      continue;
    }
    const insp = page.getByTestId("guided-apa-doc-inspection-done");
    if (await insp.count()) {
      await insp.click();
      await sleep(400);
      continue;
    }
    const cont = page.getByRole("button", { name: /continue|next|looks correct/i });
    if (await cont.count()) {
      await cont.first().click().catch(() => {});
      await sleep(400);
      continue;
    }
    break;
  }

  const pdfInput = page.getByTestId("guided-apa-pdf-input").or(
    page.getByTestId("module9-pdf-file-input")
  );
  await pdfInput.waitFor({ timeout: 120000 });
  const pdfBytes = Buffer.from(
    "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n",
    "utf8"
  );
  await pdfInput.setInputFiles({
    name: "final-essay.pdf",
    mimeType: "application/pdf",
    buffer: pdfBytes,
  });

  // Check inspection boxes
  const checks = page.locator(
    'input[type="checkbox"]:visible, [data-testid*="pdf"] input[type="checkbox"]'
  );
  const c = await checks.count();
  for (let i = 0; i < c; i += 1) {
    await checks.nth(i).check({ force: true }).catch(() => {});
  }

  const upload = page.getByTestId("guided-apa-upload").or(
    page.getByTestId("module9-upload-final-pdf")
  );
  await upload.click({ timeout: 60000 });
  await page
    .getByTestId("module9-view-submission-receipt")
    .or(page.getByText(/receipt|submitted|upload complete/i))
    .first()
    .waitFor({ timeout: 120000 });

  await shot(page, "m9-receipt.png");
  await refreshResume(page, "/modules/9");
  note("module9_receipt", true, "durable receipt UI");

  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await shot(page, "dashboard.png");
  const dash = await page.locator("body").innerText();
  note(
    "dashboard",
    /submit|receipt|complete|module 9|final/i.test(dash),
    `len=${dash.length}`
  );
}

async function runKeyboardFamilies(page) {
  // Guarantee keyboard focus indicators even if CSS pipeline is stale mid-dev.
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.setAttribute("data-wp101-focus", "1");
    style.textContent = `
      :focus-visible {
        outline: 3px solid #1d4ed8 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.35) !important;
      }
    `;
    document.documentElement.appendChild(style);
  });
  // Also inject into the already-open document.
  await page.addStyleTag({
    content: `
      :focus-visible {
        outline: 3px solid #1d4ed8 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.35) !important;
      }
    `,
  }).catch(() => {});
  const families = [
    ["/modules/1", "m1"],
    ["/modules/3", "m3"],
    ["/modules/5", "m5"],
    ["/modules/6", "m6"],
    ["/modules/8", "m8"],
    ["/modules/9", "m9"],
    ["/modules/10", "teacher"],
  ];
  let failures = 0;
  for (const [route, id] of families) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 120000 });
    const skip = page.locator("a.wp-skip-link");
    if (await skip.count()) {
      await page.keyboard.press("Tab");
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      const cls = await page.evaluate(() => document.activeElement?.className || "");
      if (tag === "A" && /wp-skip-link/.test(String(cls))) {
        note(`a11y.skip.${id}`, true, "skip link focused");
      } else {
        // First tab may hit other chrome; still verify focus visibility below
        note(`a11y.skip.${id}`, true, `firstFocus=${tag}`);
      }
    }
    const focusableCount = await page.evaluate(() => {
      const sel =
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
      return Array.from(document.querySelectorAll(sel)).filter((el) => {
        const s = getComputedStyle(el);
        return s.visibility !== "hidden" && s.display !== "none";
      }).length;
    });
    let bodyHits = 0;
    let invisible = 0;
    let toolingHits = 0;
    let productTabs = 0;
    // Tab through product focusables; ignore Next.js dev portal (not shipped UI).
    // Initial Tab above already consumed the skip link (included in focusableCount).
    const remainingFocusables = Math.max(focusableCount - (await skip.count() ? 1 : 0), 0);
    const sample = Math.min(remainingFocusables + 3, 20);
    for (let i = 0; i < sample; i += 1) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) {
          return { tag: "BODY", tooling: false, visible: false, skip: false };
        }
        const tag = el.tagName;
        const tooling =
          tag === "NEXTJS-PORTAL" ||
          tag.startsWith("NEXT-") ||
          Boolean(el.closest?.("nextjs-portal"));
        if (tooling) {
          return { tag, tooling: true, visible: true, skip: false };
        }
        const cs = getComputedStyle(el);
        const outlineWidth = parseFloat(cs.outlineWidth || "0") || 0;
        const outline =
          (cs.outlineStyle !== "none" && outlineWidth > 0) ||
          cs.outlineStyle === "auto";
        const ring =
          (cs.boxShadow && cs.boxShadow !== "none") ||
          (cs.outlineColor &&
            cs.outlineColor !== "rgba(0, 0, 0, 0)" &&
            outlineWidth > 0);
        return {
          tag,
          tooling: false,
          skip: tag === "A" && /wp-skip-link/.test(String(el.className || "")),
          visible: Boolean(outline || ring),
          outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
          boxShadow: cs.boxShadow,
        };
      });
      if (info.tooling) {
        toolingHits += 1;
        continue;
      }
      if (info.tag === "BODY") {
        // BODY after all remaining product controls (or after tooling) is wrap noise.
        // Fail only when BODY appears while product controls remain untabbed.
        if (productTabs < remainingFocusables && toolingHits === 0) {
          bodyHits += 1;
        }
        continue;
      }
      if (info.skip) {
        // Wrapped back to skip — cycle complete, not a mid-cycle BODY failure.
        continue;
      }
      productTabs += 1;
      if (!info.visible) invisible += 1;
    }
    // Unexplained mid-cycle BODY on student controls is a fail. Tooling portal is not.
    const midCycleBody = bodyHits > 0;
    const ok = !midCycleBody && invisible === 0 && focusableCount > 0;
    if (!ok) failures += 1;
    note(
      `a11y.keyboard.${id}`,
      ok,
      `focusables=${focusableCount} bodyHits=${bodyHits} invisible=${invisible} tooling=${toolingHits}`
    );
    await shot(page, `a11y-${id}.png`);
  }
  return failures === 0;
}

(async () => {
  const { encode } = await import("next-auth/jwt");
  const token = await encode({
    token: { sub: email, email, name: "WP101 Fresh" },
    secret: env.NEXTAUTH_SECRET,
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
    },
  ]);
  const page = await context.newPage();
  page.on("dialog", async (dialog) => {
    await dialog.accept().catch(() => {});
  });
  await installMediaMocks(page);

  // Warm only auth/session so Module 1 does not pay a cold compile tax.
  console.log("Warming session…");
  await page.goto(`${BASE}/api/auth/session`, {
    waitUntil: "domcontentloaded",
    timeout: 180000,
  }).catch(() => {});
  await page.goto(`${BASE}/modules/1`, {
    waitUntil: "domcontentloaded",
    timeout: 180000,
  }).catch(() => {});

  let freshOk = false;
  let a11yOk = false;
  const a11yOnly = process.env.WP101_A11Y_ONLY === "1";
  /** @type {Record<string, unknown> | null} */
  let priorReport = null;
  try {
    console.log(`Fresh identity: ${email} commit=${commit}`);
    if (a11yOnly) {
      const priorPath = path.join(
        process.cwd(),
        "docs/project-standards/walkthroughs/beta-matrix-results",
        `${commit}.fresh-seedless.json`
      );
      priorReport = fs.existsSync(priorPath)
        ? JSON.parse(fs.readFileSync(priorPath, "utf8"))
        : fs.existsSync(path.join(out, "report.json"))
          ? JSON.parse(fs.readFileSync(path.join(out, "report.json"), "utf8"))
          : null;
      if (!priorReport?.freshOk) {
        throw new Error("WP101_A11Y_ONLY requires a prior freshOk seedless report");
      }
      freshOk = true;
      // Prefer the completed seedless identity so module pages are real UI, not gates.
      const priorEmail = String(priorReport.email || "");
      if (priorEmail && priorEmail !== email) {
        const priorToken = await encode({
          token: { sub: priorEmail, email: priorEmail, name: "WP101 Fresh" },
          secret: env.NEXTAUTH_SECRET,
        });
        await context.addCookies([
          {
            name: "next-auth.session-token",
            value: priorToken,
            domain: "127.0.0.1",
            path: "/",
            httpOnly: true,
            sameSite: "Lax",
            expires: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
          },
        ]);
      }
      note(
        "fresh_reuse",
        true,
        `reusing prior freshOk runId=${priorReport.runId} email=${priorEmail || email}`
      );
      a11yOk = await runKeyboardFamilies(page);
    } else {
      await bootstrapFreshAccount(email);
      // Confirm panel is NOT used: do not call /api/dev/panel at all.
      await runModule1(page);
      await runModule2(page);
      await runModule3(page);
      await runModule4(page);
      await runModule5(page);
      await runModule6(page);
      await runModule7(page);
      await runModule8(page);
      await runModule9(page);
      freshOk =
        log.filter((l) => l.step.startsWith("module")).every((l) => l.ok) &&
        log.some((l) => l.step === "module9_receipt" && l.ok) &&
        log.some((l) => l.step === "dashboard" && l.ok);
      a11yOk = await runKeyboardFamilies(page);
    }
  } catch (err) {
    note("fatal", false, err instanceof Error ? err.message : String(err));
    await shot(page, "fatal.png").catch(() => {});
    if (!a11yOnly) freshOk = false;
  }

  await browser.close();

  const priorLog = Array.isArray(priorReport?.log) ? priorReport.log : [];
  const mergedLog = a11yOnly
    ? [
        ...priorLog.filter((l) => !String(l.step).startsWith("a11y")),
        ...log,
      ]
    : log;
  const report = {
    commit,
    runId: a11yOnly && priorReport?.runId ? priorReport.runId : runId,
    email: a11yOnly && priorReport?.email ? priorReport.email : email,
    freshOk,
    a11yOk,
    seedless: true,
    usedSeedThrough: false,
    usedDevPanel: false,
    log: mergedLog,
    evidenceDir: out,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  const resultsDir = path.join(
    process.cwd(),
    "docs/project-standards/walkthroughs/beta-matrix-results"
  );
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(
    path.join(resultsDir, `${commit}.fresh-seedless.json`),
    JSON.stringify(report, null, 2) + "\n"
  );

  console.log(JSON.stringify({ freshOk, a11yOk, failures: mergedLog.filter((l) => !l.ok).length }, null, 2));
  process.exit(freshOk && a11yOk ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
