import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');
const PW_ROOT = '/var/folders/40/jp6bnmgn5y950xz89_tqv_q40000gn/T/cursor-sandbox-cache/11a1f26d75ae6c1792c62133ad02dab4/npm/_npx/f0a362733743bae2/node_modules/playwright';
const { chromium } = require(PW_ROOT);

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const BASE = process.env.WP094_BASE || 'http://127.0.0.1:3000';
const email = (env.DEV_AUTH_EMAIL || 'dev-student@localhost').trim().toLowerCase();
const out = '/tmp/wp094-browser';
fs.mkdirSync(out, { recursive: true });
const results = [];
const check = (id, ok, detail = '') => {
  results.push({ id, ok: !!ok, detail: String(detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: ${detail}`);
};

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const QUIZ_ANSWERS = Array.from({ length: 10 }, (_, i) => `answer-${i + 1}`);

async function getFinalPdfRow() {
  const { data, error } = await supabase
    .from('student_exports')
    .select('*')
    .eq('user_email', email)
    .eq('module', 9)
    .eq('kind', 'final_pdf')
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function softHideReceipt(row) {
  if (!row) return null;
  const backup = { ...row };
  // web_view_link is NOT NULL — remove the row temporarily instead of nulling links.
  const { error } = await supabase.from('student_exports').delete().eq('id', row.id);
  if (error) throw error;
  return backup;
}

async function restoreReceipt(backup) {
  if (!backup) return;
  const insert = { ...backup };
  delete insert.id; // allow same natural key; keep id if schema allows
  // Prefer upsert with original id to keep references stable.
  const { error } = await supabase.from('student_exports').upsert(backup, { onConflict: 'id' });
  if (error) {
    const { error: insertError } = await supabase.from('student_exports').insert(backup);
    if (insertError) throw insertError;
  }
}

async function seedModule1Readiness() {
  const { data: promptBefore } = await supabase
    .from('module1_prompt_breakdown')
    .select('*')
    .eq('user_email', email)
    .maybeSingle();

  const promptPatch = {
    task_verb: 'Compare and contrast',
    task_type: 'A compare and contrast essay',
    analysis_focus: 'How Dr. King uses rhetorical appeals in two texts',
    required_angle: 'Specific evidence from both works',
    student_paraphrase:
      promptBefore?.student_paraphrase ||
      'Compare King’s speech and letter: how do his rhetorical choices fit each audience and purpose?',
  };

  if (promptBefore) {
    const { error } = await supabase
      .from('module1_prompt_breakdown')
      .update(promptPatch)
      .eq('user_email', email);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('module1_prompt_breakdown')
      .insert({ user_email: email, ...promptPatch, response_text: promptPatch.student_paraphrase });
    if (error) throw error;
  }

  const { data: quizBefore } = await supabase
    .from('module1_quiz_results')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false })
    .limit(1);

  let quizId = null;
  if (!quizBefore?.length) {
    const { data, error } = await supabase
      .from('module1_quiz_results')
      .insert({
        user_email: email,
        score: 9,
        total: 10,
        answers: QUIZ_ANSWERS,
        quiz_version: 2,
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) throw error;
    quizId = data.id;
  }

  return { promptBefore, quizIdInserted: quizId };
}

async function restoreModule1Seed(seed) {
  if (seed?.promptBefore) {
    await supabase
      .from('module1_prompt_breakdown')
      .update({
        task_verb: seed.promptBefore.task_verb,
        task_type: seed.promptBefore.task_type,
        analysis_focus: seed.promptBefore.analysis_focus,
        required_angle: seed.promptBefore.required_angle,
        student_paraphrase: seed.promptBefore.student_paraphrase,
      })
      .eq('user_email', email);
  }
  if (seed?.quizIdInserted) {
    await supabase.from('module1_quiz_results').delete().eq('id', seed.quizIdInserted);
  }
}

async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
}

async function primaryBeforeSecondary(page) {
  return page.evaluate(() => {
    const primary = document.querySelector('[data-testid="success-primary-action"], [data-testid="module1-continue-module2"], [data-testid="module8-success-continue"], [data-testid="module9-success-dashboard"]');
    const secondary = document.querySelector('[data-testid="success-secondary-action"], [data-testid="module9-success-open-pdf"]');
    if (!primary) return { ok: false, reason: 'no_primary' };
    if (!secondary) return { ok: true, reason: 'primary_only' };
    const pr = primary.getBoundingClientRect();
    const sr = secondary.getBoundingClientRect();
    const ok = pr.top < sr.top - 1 || (Math.abs(pr.top - sr.top) < 2 && pr.left <= sr.left + 1);
    return { ok, reason: ok ? 'order_ok' : `p=${pr.top},${pr.left} s=${sr.top},${sr.left}` };
  });
}

async function keyboardFocusVisible(page, testId) {
  // Move focus with Tab so :focus-visible applies.
  await page.locator('body').click({ position: { x: 2, y: 2 } }).catch(() => {});
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate((id) => document.activeElement?.getAttribute('data-testid') === id, testId);
    if (active) break;
  }
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el || document.activeElement !== el) {
      return { ok: false, reason: `active=${document.activeElement?.getAttribute('data-testid') || document.activeElement?.tagName}` };
    }
    const style = getComputedStyle(el);
    const ring = (style.boxShadow && style.boxShadow !== 'none') || style.outlineStyle !== 'none';
    return { ok: ring || el.matches(':focus-visible'), reason: `shadow=${style.boxShadow.slice(0, 100)} outline=${style.outline}` };
  }, testId);
}

async function lineLengthOk(page) {
  return page.evaluate(() => {
    const paras = [...document.querySelectorAll('[data-testid="success-experience-shell"] p, [data-testid="dashboard-completion-foundation"] p')];
    let max = 0;
    for (const p of paras) {
      const w = p.getBoundingClientRect().width;
      if (w > max) max = w;
    }
    return { ok: max === 0 || max <= 720, max };
  });
}

async function layoutShiftPrimary(page) {
  return page.evaluate(async () => {
    const sel = '[data-testid="success-primary-action"], [data-testid="module1-continue-module2"], [data-testid="module8-success-continue"], [data-testid="module9-success-dashboard"]';
    const el = document.querySelector(sel);
    if (!el) return { ok: true, reason: 'no_primary' };
    const before = el.getBoundingClientRect().top;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 400));
    const after = el.getBoundingClientRect().top;
    return { ok: Math.abs(after - before) < 24, before, after };
  });
}

(async () => {
  const { encode } = await import('next-auth/jwt');
  const token = await encode({
    token: { sub: email, email, name: 'Dev Student' },
    secret: env.NEXTAUTH_SECRET,
  });

  let module1Seed = null;
  let receiptBackup = null;
  module1Seed = await seedModule1Readiness();

  // Prove complete API is ready
  {
    const res = await fetch(`${BASE}/api/module1/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `next-auth.session-token=${token}`,
      },
      body: '{}',
    });
    const body = await res.json();
    check('m1_api_ready', Boolean(body.ok), JSON.stringify(body));
  }

  const browser = await chromium.launch({ headless: true });

  async function withAuthContext(opts = {}) {
    const context = await browser.newContext({
      viewport: opts.viewport,
      reducedMotion: opts.reducedMotion || null,
      colorScheme: 'light',
    });
    await context.addCookies([{
      name: 'next-auth.session-token',
      value: token,
      url: BASE,
      httpOnly: true,
      sameSite: 'Lax',
    }]);
    return context;
  }

  async function runViewport(width, height, tag) {
    const context = await withAuthContext({ viewport: { width, height } });
    const page = await context.newPage();

    // --- Module 1 ---
    await page.goto(`${BASE}/modules/1/success?score=90`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-testid="success-experience-shell"]', { timeout: 45000 });
    await page.locator('[data-testid="module1-continue-module2"]:not([disabled])').waitFor({ timeout: 45000 });
    await page.waitForTimeout(800);
    let t = await page.innerText('body');
    check(`m1_foundation_${tag}`, await page.locator('[data-testid="success-experience-shell"]').count() > 0, 'shell');
    check(`m1_variant_${tag}`, await page.locator('[data-testid="success-experience-shell"]').getAttribute('data-variant') === 'learning_milestone', 'variant');
    check(`m1_order_${tag}`, /You understand what this essay asks[\s\S]*Ethos, pathos[\s\S]*Continue to Module 2/i.test(t), 'accomplishment→evidence→cta');
    check(`m1_overflow_${tag}`, !(await overflow(page)), 'no h-overflow');
    const m1Order = await primaryBeforeSecondary(page);
    check(`m1_primary_order_${tag}`, m1Order.ok, m1Order.reason);
    const m1Focus = await keyboardFocusVisible(page, 'module1-continue-module2');
    check(`m1_focus_${tag}`, m1Focus.ok, m1Focus.reason);
    const m1Lines = await lineLengthOk(page);
    check(`m1_line_length_${tag}`, m1Lines.ok, `max=${m1Lines.max}`);
    const m1Shift = await layoutShiftPrimary(page);
    check(`m1_layout_shift_${tag}`, m1Shift.ok, JSON.stringify(m1Shift));
    await page.screenshot({ path: path.join(out, `m1-${tag}.png`), fullPage: true });

    await page.locator('[data-testid="module1-continue-module2"]').click();
    await page.waitForURL(/\/modules\/2/, { timeout: 20000 });
    check(`m1_continue_${tag}`, /\/modules\/2/.test(page.url()), page.url());

    await page.goto(`${BASE}/modules/1/success`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-testid="success-experience-shell"]', { timeout: 45000 });
    await page.waitForTimeout(1500);
    check(`m1_refresh_${tag}`, await page.locator('[data-testid="success-experience-shell"]').count() === 1, 'single shell after refresh');

    // --- Module 6 ---
    await page.goto(`${BASE}/modules/6/success`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    t = await page.innerText('body');
    const m6Shell = await page.locator('[data-testid="success-experience-shell"]').count();
    const m6Incomplete = /Finish your draft|Could not load your draft|draft is not ready|complete draft/i.test(t);
    check(`m6_foundation_or_honest_${tag}`, m6Shell > 0 || m6Incomplete, `shell=${m6Shell} incomplete=${m6Incomplete}`);
    if (m6Shell > 0) {
      check(`m6_variant_${tag}`, await page.locator('[data-testid="success-experience-shell"]').getAttribute('data-variant') === 'artifact_completed', 'variant');
      check(`m6_transition_${tag}`, /complete draft is ready to strengthen|revision/i.test(t), 'draft→revise');
      check(`m6_cta_${tag}`, /Continue to Module 7/i.test(t), 'cta');
      const m6Btn = page.locator('[data-testid="success-primary-action"]');
      if (await m6Btn.count() && await m6Btn.isEnabled()) {
        await m6Btn.click();
        await page.waitForURL(/\/modules\/7/, { timeout: 20000 }).catch(() => {});
        check(`m6_continue_${tag}`, /\/modules\/7/.test(page.url()), page.url());
      } else {
        check(`m6_continue_${tag}`, true, 'cta disabled/honest gate');
      }
    }
    check(`m6_no_essay_wall_${tag}`, !/Community gardens ask neighbors[\s\S]{500,}/i.test(t) && t.length < 12000, `len=${t.length}`);
    check(`m6_overflow_${tag}`, !(await overflow(page)), 'no h-overflow');
    await page.screenshot({ path: path.join(out, `m6-${tag}.png`), fullPage: true });

    // --- Module 8 ---
    await page.goto(`${BASE}/modules/8/success`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-testid="success-experience-shell"]', { timeout: 45000 });
    await page.waitForTimeout(1500);
    t = await page.innerText('body');
    check(`m8_foundation_${tag}`, await page.locator('[data-testid="success-experience-shell"]').count() > 0, 'shell');
    check(`m8_variant_${tag}`, await page.locator('[data-testid="success-experience-shell"]').getAttribute('data-variant') === 'phase_transition', 'variant');
    check(`m8_no_checklist_${tag}`, !/Times New Roman, size 12|Ready confidence|Format checklist/i.test(t), 'no apa checklist');
    check(`m8_transition_${tag}`, /submission document is ready|guided APA|Module 9/i.test(t), 'write→submit');
    check(`m8_cta_${tag}`, /Continue to Module 9/i.test(t), 'cta');
    check(`m8_overflow_${tag}`, !(await overflow(page)), 'no h-overflow');
    await page.screenshot({ path: path.join(out, `m8-${tag}.png`), fullPage: true });
    await page.locator('[data-testid="module8-success-continue"]:not([disabled])').waitFor({ timeout: 45000 });
    await page.locator('[data-testid="module8-success-continue"]').click();
    await page.waitForURL(/\/modules\/9/, { timeout: 20000 });
    check(`m8_continue_${tag}`, /\/modules\/9(\/?|$|\?)/.test(new URL(page.url()).pathname), page.url());

    // --- Module 9 valid receipt ---
    await page.goto(`${BASE}/modules/9/success`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4500);
    t = await page.innerText('body');
    const hasReceipt = await page.locator('[data-testid="module9-receipt-details"]').count() > 0
      || /Your paper was received/i.test(t);
    const missingNow = await page.locator('[data-testid="module9-receipt-missing"]').count() > 0;
    check(`m9_has_receipt_${tag}`, hasReceipt && !missingNow, hasReceipt ? 'receipt' : missingNow ? 'missing' : 'unknown');
    if (hasReceipt) {
      check(`m9_shell_${tag}`, await page.locator('[data-testid="success-experience-shell"]').count() > 0, 'shell');
      check(`m9_fields_${tag}`,
        await page.locator('[data-testid="module9-receipt-filename"]').count() > 0
        && await page.locator('[data-testid="module9-receipt-submitted-at"]').count() > 0
        && /Accepted and saved|File size/i.test(t),
        'fields');
      check(`m9_journey_${tag}`, await page.locator('[data-testid="success-journey-trail"]').count() > 0 && /Understand|Prepare|Submit/i.test(t), 'journey');
      check(`m9_celebration_${tag}`, await page.locator('[data-testid="success-celebration-motif"]').count() > 0, 'motif');
      const focused = await page.evaluate(() => document.activeElement?.id === 'module9-receipt-heading');
      check(`m9_focus_heading_${tag}`, focused, `active=${await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)}`);
      const order = await primaryBeforeSecondary(page);
      check(`m9_primary_order_${tag}`, order.ok, order.reason);
      const fileBefore = await page.locator('[data-testid="module9-receipt-filename"]').innerText().catch(() => '');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid="module9-receipt-details"]', { timeout: 45000 });
      await page.waitForTimeout(2000);
      const fileAfter = await page.locator('[data-testid="module9-receipt-filename"]').innerText().catch(() => '');
      check(`m9_refresh_${tag}`, fileBefore && fileBefore === fileAfter, `${fileBefore}→${fileAfter}`);
      await page.goto(`${BASE}/modules/9/success`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('[data-testid="module9-receipt-details"]', { timeout: 45000 });
      const fileReopen = await page.locator('[data-testid="module9-receipt-filename"]').innerText().catch(() => '');
      check(`m9_reopen_${tag}`, fileReopen === fileBefore, fileReopen);
    }
    check(`m9_overflow_${tag}`, !(await overflow(page)), 'no h-overflow');
    await page.screenshot({ path: path.join(out, `m9-${tag}.png`), fullPage: true });

    // --- Dashboard ---
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    t = await page.innerText('body');
    const dashFoundation = await page.locator('[data-testid="dashboard-completion-foundation"]').count();
    check(`dash_foundation_${tag}`, dashFoundation > 0, `count=${dashFoundation}`);
    if (dashFoundation > 0) {
      const submittedMatches = (t.match(/\bSubmitted\b/g) || []).length;
      check(`dash_status_once_${tag}`, submittedMatches >= 1 && !/Status:\s*Essay completed/i.test(t), `submitted=${submittedMatches}`);
      check(`dash_time_${tag}`, await page.locator('[data-testid="dashboard-submission-time"]').count() > 0, 'time');
      check(`dash_pdf_${tag}`, await page.locator('[data-testid="dashboard-open-final-pdf"]').count() > 0, 'pdf');
      check(`dash_receipt_${tag}`, await page.locator('[data-testid="dashboard-view-receipt"]').count() > 0, 'receipt');
      check(`dash_trail_${tag}`, await page.locator('[data-testid="dashboard-journey-trail"]').count() > 0, 'trail');
      check(`dash_policy_${tag}`, /Contact your teacher/i.test(t), 'policy');
      const foundationText = await page.locator('[data-testid="dashboard-completion-foundation"]').innerText();
      check(
        `dash_no_dev_panel_${tag}`,
        !/Developer Testing Panel|Seed guided APA|DevReset|Reset student/i.test(foundationText),
        'no dev tools inside completion surface'
      );
      const dashPdf = await page.locator('[data-testid="dashboard-open-final-pdf"]').getAttribute('href');
      check(`dash_pdf_href_${tag}`, !!dashPdf, dashPdf || 'missing');
    }
    check(`dash_overflow_${tag}`, !(await overflow(page)), 'no h-overflow');
    await page.screenshot({ path: path.join(out, `dash-${tag}.png`), fullPage: true });

    await context.close();
  }

  async function runReducedMotion() {
    const context = await withAuthContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/modules/9/success`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-testid="success-experience-shell"]', { timeout: 45000 });
    await page.waitForTimeout(2500);
    const motif = page.locator('[data-testid="success-celebration-motif"]');
    const hasMotif = await motif.count();
    const reducedAttr = hasMotif ? await motif.getAttribute('data-reduced-motion') : null;
    const t = await page.innerText('body');
    check('reduced_motion_complete', /Your paper was received|Submission receipt not found/i.test(t), 'page complete');
    check('reduced_motion_flag', !hasMotif || reducedAttr === 'true', `attr=${reducedAttr}`);
    check('reduced_motion_no_overflow', !(await overflow(page)), 'overflow');
    await page.screenshot({ path: path.join(out, 'm9-reduced-motion.png'), fullPage: true });

    await page.goto(`${BASE}/modules/1/success`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-testid="success-experience-shell"]', { timeout: 45000 });
    await page.waitForTimeout(1500);
    check('reduced_motion_m1', await page.locator('[data-testid="success-experience-shell"]').count() > 0, 'm1 ok');
    await page.screenshot({ path: path.join(out, 'm1-reduced-motion.png'), fullPage: true });
    await context.close();
  }

  async function runMissingReceipt() {
    const row = await getFinalPdfRow();
    check('missing_setup_had_row', !!row, row ? row.id : 'no row');
    if (!row) return;
    receiptBackup = await softHideReceipt(row);
    try {
      const context = await withAuthContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(`${BASE}/modules/9/success`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('[data-testid="module9-receipt-missing"], [data-testid="success-experience-shell"]', { timeout: 45000 });
      await page.waitForTimeout(2500);
      const t = await page.innerText('body');
      check('m9_missing_no_claim', /Submission receipt not found/i.test(t) && !/Your paper was received/i.test(t), 'no success claim');
      check('m9_missing_no_rich_celebration', await page.locator('[data-testid="success-celebration-motif"]').count() === 0, 'no motif');
      const primary = page.locator('[data-testid="success-primary-action"]');
      check('m9_missing_recovery_label', /Back to Module 9 upload/i.test(await primary.innerText()), await primary.innerText());
      await primary.click();
      await page.waitForURL(/\/modules\/9(\/?|$|\?)/, { timeout: 20000 });
      check('m9_missing_recovery_nav', /\/modules\/9(\/?|$|\?)/.test(new URL(page.url()).pathname), page.url());
      await page.screenshot({ path: path.join(out, 'm9-missing-mobile.png'), fullPage: true });
      await context.close();
    } finally {
      await restoreReceipt(receiptBackup);
      receiptBackup = null;
    }
  }

  async function runKeyboard() {
    const context = await withAuthContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE}/modules/8/success`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-testid="module8-success-continue"]', { timeout: 45000 });
    await page.locator('[data-testid="module8-success-continue"]:not([disabled])').waitFor({ timeout: 45000 });
    await page.waitForTimeout(800);
    const headingFocused = await page.evaluate(() => document.activeElement?.id?.includes('success') || document.activeElement?.tagName === 'H1');
    check('keyboard_initial_focus', headingFocused, await page.evaluate(() => document.activeElement?.outerHTML?.slice(0, 120)));
    const focus = await keyboardFocusVisible(page, 'module8-success-continue');
    check('keyboard_tab_to_primary', focus.ok, JSON.stringify(focus));
    check('keyboard_focus_visible', focus.ok, focus.reason);
    await context.close();
  }

  try {
    await runViewport(390, 844, 'mobile');
    await runViewport(1440, 900, 'desktop');
    await runReducedMotion();
    await runKeyboard();
    await runMissingReceipt();
  } finally {
    await browser.close();
    await restoreModule1Seed(module1Seed);
    if (receiptBackup) await restoreReceipt(receiptBackup);
  }

  const failed = results.filter((r) => !r.ok);
  const summary = {
    base: BASE,
    email,
    passed: results.length - failed.length,
    total: results.length,
    failed,
    results,
  };
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(summary, null, 2));
  console.log(`\nBrowser ${summary.passed}/${summary.total}`);
  if (failed.length) {
    console.log('FAILED:\n' + failed.map((f) => `- ${f.id}: ${f.detail}`).join('\n'));
    process.exitCode = 1;
  }
})().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
