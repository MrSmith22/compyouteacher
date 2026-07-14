const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const m1 = require("../lib/module1/module1SuccessAdvancement.js");
const m2 = require("../lib/module2/module2EntryGate.js");

describe("Module 1 → Module 2 transition — Module 1 advancement", () => {
  it("1. Continue unavailable while advancement is in flight (saving)", () => {
    assert.equal(
      m1.canNavigateToModule2(m1.MODULE1_ADVANCE_STATES.SAVING),
      false
    );
    assert.equal(
      m1.canNavigateToModule2(m1.MODULE1_ADVANCE_STATES.IDLE),
      false
    );
    assert.equal(
      m1.canStartModule1Advancement(m1.MODULE1_ADVANCE_STATES.SAVING, {
        inFlight: true,
      }),
      false
    );
  });

  it("2. Successful advancement enables Module 2 navigation", () => {
    assert.equal(
      m1.canNavigateToModule2(m1.MODULE1_ADVANCE_STATES.READY),
      true
    );
    const write = m1.interpretModule1AdvancementWrite({
      writeError: null,
      alreadyAdvanced: false,
    });
    assert.equal(write.ok, true);
    assert.equal(write.state, m1.MODULE1_ADVANCE_STATES.READY);
  });

  it("3. Failed advancement yields error state for alert + Retry", () => {
    const write = m1.interpretModule1AdvancementWrite({
      writeError: { message: "network" },
    });
    assert.equal(write.ok, false);
    assert.equal(write.state, m1.MODULE1_ADVANCE_STATES.ERROR);
    assert.match(write.message, /Could not save/i);
    assert.equal(
      m1.canStartModule1Advancement(m1.MODULE1_ADVANCE_STATES.ERROR),
      true
    );
  });

  it("4 + 10. Idempotent reload: already-advanced is success without write", () => {
    const read = m1.interpretModule1AdvancementRead({
      assignment: { current_module: 2, status: "in_progress" },
      completedModuleNumber: 1,
    });
    assert.equal(read.ok, true);
    assert.equal(read.alreadyAdvanced, true);
    assert.equal(read.shouldWrite, false);

    const write = m1.interpretModule1AdvancementWrite({
      alreadyAdvanced: true,
    });
    assert.equal(write.ok, true);
    assert.equal(write.state, m1.MODULE1_ADVANCE_STATES.READY);
  });

  it("11. Rapid/double clicks cannot start conflicting writes", () => {
    const controller = m1.createModule1AdvancementController();
    const first = controller.begin();
    const second = controller.begin();
    assert.equal(first.accepted, true);
    assert.equal(second.accepted, false);
    controller.end(first.generation);
    const third = controller.begin();
    assert.equal(third.accepted, true);
  });

  it("developer jump already past Module 2 is not treated as needing write", () => {
    const read = m1.interpretModule1AdvancementRead({
      assignment: { current_module: 5, status: "in_progress" },
      completedModuleNumber: 1,
    });
    assert.equal(read.alreadyAdvanced, true);
    assert.equal(read.shouldWrite, false);
  });
});

describe("Module 1 → Module 2 transition — Module 2 entry gate", () => {
  it("5. Never treats /modules/2 → /modules/2 as a valid denial redirect", () => {
    assert.equal(m2.isSelfRedirect("/modules/2", "/modules/2"), true);
    assert.equal(
      m2.resolveModule2RedirectTarget({
        pathname: "/modules/2",
        proposedRedirect: "/modules/2",
        reason: "module_access_denied",
      }),
      m2.MODULE2_SAFE_DENIAL_PATH
    );
    assert.equal(
      m2.resolveModule2WaitingExhausted({ pathname: "/modules/2" }).redirectTo,
      "/modules/1/success"
    );
  });

  it("6–7. Arrival before advancement waits, then successful recheck opens", () => {
    const waiting = m2.interpretModule2EntryAccess({
      currentModule: 1,
      minModule: 2,
    });
    assert.equal(
      waiting.state,
      m2.MODULE2_ENTRY_GATE_STATES.WAITING_FOR_PROGRESS
    );
    assert.equal(
      m2.shouldRecheckModule2Entry({
        state: waiting.state,
        attempt: 1,
        maxAttempts: 5,
      }),
      true
    );

    const allowed = m2.interpretModule2EntryAccess({
      currentModule: 2,
      minModule: 2,
    });
    assert.equal(allowed.state, m2.MODULE2_ENTRY_GATE_STATES.ALLOWED);
    assert.equal(
      m2.shouldRecheckModule2Entry({
        state: allowed.state,
        attempt: 1,
      }),
      false
    );
  });

  it("8. True denial returns to Module 1 success", () => {
    const denied = m2.resolveModule2WaitingExhausted({
      pathname: "/modules/2",
    });
    assert.equal(denied.state, m2.MODULE2_ENTRY_GATE_STATES.DENIED);
    assert.equal(denied.redirectTo, "/modules/1/success");
    assert.match(denied.message, /Module 1 progress must finish saving/i);
  });

  it("9. Gate request error is distinct from denial (Retry, no redirect)", () => {
    const errored = m2.interpretModule2EntryAccess({
      fetchError: true,
    });
    assert.equal(errored.state, m2.MODULE2_ENTRY_GATE_STATES.ERROR);
    assert.equal(errored.redirectTo, null);
    assert.match(errored.message, /Could not verify Module 2 access/i);
  });

  it("bounded recheck does not poll forever", () => {
    assert.equal(
      m2.shouldRecheckModule2Entry({
        state: m2.MODULE2_ENTRY_GATE_STATES.WAITING_FOR_PROGRESS,
        attempt: m2.MODULE2_ENTRY_RECHECK.maxAttempts,
        maxAttempts: m2.MODULE2_ENTRY_RECHECK.maxAttempts,
      }),
      false
    );
  });

  it("analysis-phase self destination does not invent a loop", () => {
    assert.equal(
      m2.resolveAnalysisPhaseRedirect({
        pathname: "/modules/2",
        proposedRedirect: "/modules/2",
      }),
      null
    );
    assert.equal(
      m2.resolveAnalysisPhaseRedirect({
        pathname: "/modules/2/tcharts",
        proposedRedirect: "/modules/2",
      }),
      "/modules/2"
    );
  });
});

describe("Module 1 → Module 2 transition — production wiring", () => {
  it("Module 1 success page gates Continue and shows alert/retry", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/modules/1/success/page.js"),
      "utf8"
    );
    assert.match(src, /MODULE1_SAVING_MESSAGE|Saving your Module 1 progress/);
    assert.match(src, /canNavigateToModule2/);
    assert.match(src, /role="alert"/);
    assert.match(src, /Try saving again/);
    assert.match(src, /module1-continue-module2-disabled/);
    assert.match(src, /\/api\/module1\/complete/);
    assert.match(src, /requestModule1Completion|fetch\(/);
    assert.doesNotMatch(src, /advanceCurrentModuleOnSuccess/);
    assert.match(src, /createModule1AdvancementController/);
    assert.doesNotMatch(
      src,
      /<Link\s+href="\/modules\/2"\s*\n\s*className="inline-block bg-theme-blue/
    );
  });

  it("Module 2 layout never self-replaces /modules/2 and uses gate states", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/modules/2/layout.js"),
      "utf8"
    );
    assert.match(src, /MODULE2_ENTRY_GATE_STATES/);
    assert.match(src, /WAITING_FOR_PROGRESS/);
    assert.match(src, /MODULE2_SAFE_DENIAL_PATH/);
    assert.match(src, /shouldRecheckModule2Entry/);
    assert.match(src, /module2-gate-retry/);
    assert.match(src, /role="alert"/);
    // The broken pattern: deny by replacing current path with itself
    assert.doesNotMatch(src, /router\.replace\(\s*["']\/modules\/2["']\s*\)/);
    assert.match(src, /resolveModule2WaitingExhausted|Return to Module 1 success/);
  });

  it("advanceCurrentModuleOnSuccess uses CAS orchestration (no stale upsert)", () => {
    const src = fs.readFileSync(
      path.join(
        __dirname,
        "../lib/supabase/helpers/studentAssignments.ts"
      ),
      "utf8"
    );
    assert.match(src, /advanceModuleProgressionWithStore/);
    assert.match(src, /createSupabaseAssignmentProgressStore/);
    const advanceFn = src.slice(
      src.indexOf("export async function advanceCurrentModuleOnSuccess")
    );
    assert.doesNotMatch(advanceFn, /\.upsert\(/);

    const storeSrc = fs.readFileSync(
      path.join(__dirname, "../lib/module1/assignmentProgressStore.js"),
      "utf8"
    );
    assert.match(storeSrc, /compareAndSet/);
    assert.match(storeSrc, /\.eq\(\s*["']current_module["']/);
    assert.match(storeSrc, /\.update\(/);
    assert.doesNotMatch(storeSrc, /\.upsert\(/);
  });
});

describe("Module 1 advancement CAS race tests (mutable store)", () => {
  const progress = require("../lib/module1/advanceModuleProgression.js");

  function baseRow(overrides = {}) {
    return {
      user_email: "student@example.com",
      assignment_name: "mlk",
      current_module: 1,
      status: "in_progress",
      updated_at: "2026-01-01T00:00:00.000Z",
      ...overrides,
    };
  }

  it("1. concurrent jump to Module 5 is not overwritten by delayed completion", async () => {
    const store = progress.createMutableAssignmentProgressStore(baseRow());
    const release = store.armPauseBeforeCommit();
    const pending = progress.advanceModuleProgressionWithStore({
      completedModuleNumber: 1,
      store,
    });
    for (let i = 0; i < 50 && store.casAttempts < 1; i += 1) {
      await new Promise((r) => setTimeout(r, 1));
    }
    assert.ok(store.casAttempts >= 1, "CAS should have started");
    store.replace(baseRow({ current_module: 5 }));
    release();
    const result = await pending;
    assert.equal(store.snapshot().current_module, 5);
    assert.equal(result.ok, true);
    assert.equal(result.reason, progress.ADVANCE_REASONS.ALREADY_ADVANCED);
    assert.equal(result.alreadyAdvanced, true);
  });

  it("2. concurrent full restart/state replacement is not revived", async () => {
    const store = progress.createMutableAssignmentProgressStore(baseRow());
    const release = store.armPauseBeforeCommit();
    const pending = progress.advanceModuleProgressionWithStore({
      completedModuleNumber: 1,
      store,
    });
    for (let i = 0; i < 50 && store.casAttempts < 1; i += 1) {
      await new Promise((r) => setTimeout(r, 1));
    }
    // Full restart replaces the row with a wiped / non-active assignment.
    store.replace(
      baseRow({
        current_module: 1,
        status: "abandoned",
        updated_at: "2026-07-12T00:00:00.000Z",
      })
    );
    release();
    const result = await pending;
    assert.equal(store.snapshot().status, "abandoned");
    assert.equal(store.snapshot().current_module, 1);
    assert.equal(result.ok, false);
    assert.equal(
      result.reason,
      progress.ADVANCE_REASONS.CONCURRENT_STATE_CHANGE
    );
  });

  it("3. concurrent completed/abandoned status is not restored to in_progress", async () => {
    const store = progress.createMutableAssignmentProgressStore(baseRow());
    const release = store.armPauseBeforeCommit();
    const pending = progress.advanceModuleProgressionWithStore({
      completedModuleNumber: 1,
      store,
    });
    for (let i = 0; i < 50 && store.casAttempts < 1; i += 1) {
      await new Promise((r) => setTimeout(r, 1));
    }
    store.replace(baseRow({ status: "completed", current_module: 1 }));
    release();
    const result = await pending;
    assert.equal(store.snapshot().status, "completed");
    assert.notEqual(store.snapshot().status, "in_progress");
    assert.equal(result.ok, false);
    assert.equal(
      result.reason,
      progress.ADVANCE_REASONS.CONCURRENT_STATE_CHANGE
    );
  });

  it("4. two simultaneous Module 1 completions converge on Module 2", async () => {
    const store = progress.createMutableAssignmentProgressStore(baseRow());
    const [a, b] = await Promise.all([
      progress.advanceModuleProgressionWithStore({
        completedModuleNumber: 1,
        store,
      }),
      progress.advanceModuleProgressionWithStore({
        completedModuleNumber: 1,
        store,
      }),
    ]);
    assert.equal(store.snapshot().current_module, 2);
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    const reasons = [a.reason, b.reason].sort();
    assert.deepEqual(reasons, [
      progress.ADVANCE_REASONS.ADVANCED,
      progress.ADVANCE_REASONS.ALREADY_ADVANCED,
    ].sort());
  });

  it("5. already at Module 4 returns success without a write", async () => {
    const store = progress.createMutableAssignmentProgressStore(
      baseRow({ current_module: 4 })
    );
    const before = store.casAttempts;
    const result = await progress.advanceModuleProgressionWithStore({
      completedModuleNumber: 1,
      store,
    });
    assert.equal(result.ok, true);
    assert.equal(result.alreadyAdvanced, true);
    assert.equal(result.reason, progress.ADVANCE_REASONS.ALREADY_ADVANCED);
    assert.equal(store.snapshot().current_module, 4);
    assert.equal(store.casAttempts, before);
  });

  it("6. ordinary Module 1 completion advances exactly once to Module 2", async () => {
    const store = progress.createMutableAssignmentProgressStore(baseRow());
    const result = await progress.advanceModuleProgressionWithStore({
      completedModuleNumber: 1,
      store,
    });
    assert.equal(result.ok, true);
    assert.equal(result.reason, progress.ADVANCE_REASONS.ADVANCED);
    assert.equal(result.alreadyAdvanced, false);
    assert.equal(store.snapshot().current_module, 2);

    const again = await progress.advanceModuleProgressionWithStore({
      completedModuleNumber: 1,
      store,
    });
    assert.equal(again.ok, true);
    assert.equal(again.alreadyAdvanced, true);
    assert.equal(store.snapshot().current_module, 2);
  });

  it("7. CAS conflict re-reads and resolves within a bounded attempt count", async () => {
    const store = progress.createMutableAssignmentProgressStore(baseRow());
    let flips = 0;
    const originalCas = store.compareAndSet.bind(store);
    store.compareAndSet = async (args) => {
      // First attempt: pretend concurrent writer changed module after read.
      if (flips === 0) {
        flips += 1;
        store.replace(baseRow({ current_module: 1 }));
        return { updated: false, data: null, error: null };
      }
      return originalCas(args);
    };

    const result = await progress.advanceModuleProgressionWithStore({
      completedModuleNumber: 1,
      store,
      maxAttempts: progress.ADVANCE_CAS_MAX_ATTEMPTS,
    });
    assert.equal(result.ok, true);
    assert.equal(store.snapshot().current_module, 2);
    assert.ok(result.attempts >= 2);
    assert.ok(result.attempts <= progress.ADVANCE_CAS_MAX_ATTEMPTS);
  });

  it("production advanceCurrentModuleOnSuccess delegates to the same CAS helper", () => {
    const src = fs.readFileSync(
      path.join(
        __dirname,
        "../lib/supabase/helpers/studentAssignments.ts"
      ),
      "utf8"
    );
    assert.match(
      src,
      /return advanceModuleProgressionWithStore\(/
    );
  });

  it("5b. legacy active statuses (in progress / null / not_started) advance safely", async () => {
    for (const status of ["in progress", null, "not_started", ""]) {
      const store = progress.createMutableAssignmentProgressStore(
        baseRow({ status })
      );
      const result = await progress.advanceModuleProgressionWithStore({
        completedModuleNumber: 1,
        store,
      });
      assert.equal(result.ok, true, `status=${JSON.stringify(status)}`);
      assert.equal(store.snapshot().current_module, 2);
      assert.equal(store.snapshot().status, "in_progress");
    }
  });
});

describe("Module 1 complete API boundary", () => {
  it("1. success page calls /api/module1/complete without module number authority", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/modules/1/success/page.js"),
      "utf8"
    );
    assert.match(src, /fetch\(\s*["']\/api\/module1\/complete["']/);
    assert.doesNotMatch(src, /completedModuleNumber/);
  });

  it("2. server derives email from session, not request body", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/api/module1/complete/route.js"),
      "utf8"
    );
    assert.match(src, /getServerSession/);
    assert.match(src, /session\?\.user\?\.email/);
    assert.doesNotMatch(src, /body\?\.userEmail|body\.email/);
    assert.match(src, /getSupabaseAdmin/);
    assert.match(src, /advanceModuleProgressionWithStore/);
  });

  it("3–6. active / legacy / inactive status rules", () => {
    const status = require("../lib/assignments/assignmentActivityStatus.js");
    assert.equal(status.isAssignmentStatusActive("in_progress"), true);
    assert.equal(status.isAssignmentStatusActive("in progress"), true);
    assert.equal(status.isAssignmentStatusActive(null), true);
    assert.equal(status.isAssignmentStatusActive("not_started"), true);
    assert.equal(status.isAssignmentStatusActive("completed"), false);
    assert.equal(status.isAssignmentStatusActive("abandoned"), false);
  });

  it("8–9. API returns structured reason codes; UI maps failures to alert", () => {
    const route = fs.readFileSync(
      path.join(__dirname, "../app/api/module1/complete/route.js"),
      "utf8"
    );
    assert.match(route, /ADVANCE_REASONS/);
    assert.match(route, /alreadyAdvanced/);
    const page = fs.readFileSync(
      path.join(__dirname, "../app/modules/1/success/page.js"),
      "utf8"
    );
    assert.match(page, /interpretModule1AdvancementWrite/);
    assert.match(page, /module1-advance-retry/);
    assert.match(page, /MODULE1_ADVANCE_STATES\.READY|canNavigateToModule2/);
  });

  it("UI converts failure reason into alert + Retry, then ready enables Continue", () => {
    const writeFail = m1.interpretModule1AdvancementWrite({
      writeError: { message: "x" },
      reason: "write_failure",
    });
    assert.equal(writeFail.ok, false);
    assert.equal(writeFail.state, m1.MODULE1_ADVANCE_STATES.ERROR);

    const writeOk = m1.interpretModule1AdvancementWrite({
      reason: "advanced",
    });
    assert.equal(writeOk.ok, true);
    assert.equal(m1.canNavigateToModule2(writeOk.state), true);

    const already = m1.interpretModule1AdvancementWrite({
      reason: "already_advanced",
      alreadyAdvanced: true,
    });
    assert.equal(already.ok, true);
  });
});
