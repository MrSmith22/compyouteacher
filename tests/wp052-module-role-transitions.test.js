/**
 * WP-052 — Module role transitions (psychological boundaries Modules 3–9).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  MODULE_ROLE_ORDER,
  MODULE_ROLE_TRANSITIONS,
  formatRoleTransitionHandoff,
  getModuleRoleTransition,
} from "../lib/transitions/moduleRoleTransitions.js";
import {
  HANDOFF_STAGE1_ACCOMPLISHMENT,
  HANDOFF_TRANSITION_SENTENCES,
  MODULE4_HANDOFF_CTA_LABEL,
} from "../lib/module4/module4HandoffHelpers.js";
import {
  MODULE4_SUCCESS_ACCOMPLISHMENT,
  MODULE4_SUCCESS_MODULE5_HANDOFF,
  MODULE4_SUCCESS_PRIMARY_CTA_LABEL,
} from "../lib/module4/module4SuccessHelpers.js";
import {
  MODULE5_SUCCESS_ACCOMPLISHMENT,
  MODULE5_SUCCESS_HANDOFF,
  MODULE5_SUCCESS_PRIMARY_CTA,
} from "../lib/module5/module5SuccessHelpers.js";
import {
  MODULE6_SUCCESS_ACCOMPLISHMENT,
  MODULE6_SUCCESS_HANDOFF,
  MODULE6_SUCCESS_PRIMARY_CTA,
} from "../lib/module6/module6SuccessHelpers.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const REQUIRED_BOUNDARIES = [
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, null],
];

describe("WP-052 module role transitions", () => {
  it("models every required 3–9 boundary with accomplishment, next role, and continuity", () => {
    for (const [from, to] of REQUIRED_BOUNDARIES) {
      const row = getModuleRoleTransition(from, to);
      assert.ok(row, `missing transition ${from}→${to}`);
      assert.ok(row.accomplishment.trim().length > 20);
      assert.ok(row.nextRole.trim().length > 20);
      assert.ok(row.continuity.trim().length > 20);
      assert.ok(row.actionLabel.trim().length > 3);
      assert.ok(row.headline.trim().length > 10);
      assert.ok(!/^Module \d+ complete!?$/i.test(row.headline));
      assert.ok(!/^Module \d+ complete!?$/i.test(row.accomplishment));
    }
    assert.equal(MODULE_ROLE_TRANSITIONS.length, REQUIRED_BOUNDARIES.length);
  });

  it("keeps the discovery → organization → planning → writing → revision → preparation → submission order", () => {
    assert.deepEqual([...MODULE_ROLE_ORDER], [
      "discovery",
      "organization",
      "planning",
      "writing",
      "revision",
      "preparation",
      "submission",
    ]);
    const pathRoles = REQUIRED_BOUNDARIES.slice(0, 6).map(([from, to]) => {
      const row = getModuleRoleTransition(from, to);
      return [row.fromRole, row.toRole];
    });
    assert.deepEqual(pathRoles, [
      ["discovery", "organization"],
      ["organization", "planning"],
      ["planning", "writing"],
      ["writing", "revision"],
      ["revision", "preparation"],
      ["preparation", "submission"],
    ]);
  });

  it("implements 3→4 on the Module 4 handoff side without Module 3 file edits", () => {
    const t = getModuleRoleTransition(3, 4);
    assert.equal(t.surface, "module4-handoff");
    assert.equal(t.presentation, "reuse");
    assert.ok(HANDOFF_STAGE1_ACCOMPLISHMENT.includes("gathered") || /organize/i.test(HANDOFF_STAGE1_ACCOMPLISHMENT));
    assert.ok(HANDOFF_TRANSITION_SENTENCES[0].includes(t.accomplishment.slice(0, 20)));
    assert.equal(MODULE4_HANDOFF_CTA_LABEL, t.actionLabel);
    const handoff = readSrc("components/module4/ModuleFourHandoffStep.jsx");
    assert.ok(handoff.includes('data-testid="module-role-transition"'));
    assert.ok(handoff.includes('data-from-module="3"'));
    assert.ok(handoff.includes('data-to-module="4"'));
    assert.equal(handoff.includes("ModuleRoleTransitionCard"), false);
    assert.equal(
      readSrc("components/ModuleThreeV2Form.jsx").includes("module-role-transition"),
      false
    );
  });

  it("reuses Module 4–6 success experiences instead of duplicating cards", () => {
    for (const [from, to, surface, clientRel] of [
      [4, 5, "module4-success", "components/module4/ModuleFourSuccessClient.jsx"],
      [5, 6, "module5-success", "components/module5/ModuleFiveSuccessClient.jsx"],
      [6, 7, "module6-success", "components/module6/ModuleSixSuccessClient.jsx"],
    ]) {
      const t = getModuleRoleTransition(from, to);
      assert.equal(t.presentation, "reuse");
      assert.equal(t.surface, surface);
      const src = readSrc(clientRel);
      assert.ok(src.includes('data-testid="module-role-transition"'));
      assert.ok(src.includes(`data-from-module="${from}"`));
      assert.ok(src.includes(`data-to-module="${to}"`));
      assert.equal(src.includes("ModuleRoleTransitionCard"), false);
    }
    assert.equal(MODULE4_SUCCESS_ACCOMPLISHMENT, getModuleRoleTransition(4, 5).accomplishment);
    assert.equal(
      MODULE4_SUCCESS_MODULE5_HANDOFF,
      formatRoleTransitionHandoff(getModuleRoleTransition(4, 5))
    );
    assert.equal(MODULE4_SUCCESS_PRIMARY_CTA_LABEL, getModuleRoleTransition(4, 5).actionLabel);
    assert.equal(MODULE5_SUCCESS_ACCOMPLISHMENT, getModuleRoleTransition(5, 6).accomplishment);
    assert.equal(MODULE5_SUCCESS_HANDOFF, formatRoleTransitionHandoff(getModuleRoleTransition(5, 6)));
    assert.equal(MODULE5_SUCCESS_PRIMARY_CTA, getModuleRoleTransition(5, 6).actionLabel);
    assert.equal(MODULE6_SUCCESS_ACCOMPLISHMENT, getModuleRoleTransition(6, 7).accomplishment);
    assert.equal(MODULE6_SUCCESS_HANDOFF, formatRoleTransitionHandoff(getModuleRoleTransition(6, 7)));
    assert.equal(MODULE6_SUCCESS_PRIMARY_CTA, getModuleRoleTransition(6, 7).actionLabel);
  });

  it("uses the shared card for Module 7–9 thin success screens with stable hooks", () => {
    for (const rel of [
      "app/modules/7/success/page.js",
      "app/modules/8/success/page.js",
      "app/modules/9/success/page.js",
      "components/transitions/ModuleRoleTransitionCard.jsx",
    ]) {
      const src = readSrc(rel);
      assert.ok(src.includes("module-role-transition") || src.includes("ModuleRoleTransitionCard"));
    }
    const card = readSrc("components/transitions/ModuleRoleTransitionCard.jsx");
    assert.ok(card.includes('data-testid="module-role-transition"'));
    assert.ok(card.includes("data-from-module"));
    assert.ok(card.includes("data-to-module"));
    assert.ok(card.includes("aria-labelledby"));
  });

  it("corrects 8→9 copy: no demonstrate-APA, writing finished", () => {
    const t = getModuleRoleTransition(8, 9);
    const blob = `${t.accomplishment} ${t.nextRole} ${t.continuity} ${t.headline}`;
    assert.equal(/demonstrate/i.test(blob), false);
    assert.ok(/writing is finished|no more essay|finished/i.test(blob));
    assert.ok(/APA|review|submit|download/i.test(blob));
    const page = readSrc("app/modules/8/success/page.js");
    assert.equal(/demonstrate/i.test(page), false);
    assert.ok(page.includes("getModuleRoleTransition(8, 9)"));
    assert.ok(page.includes('data-testid="module8-success-continue"'));
    assert.ok(page.includes("advanceCurrentModuleOnSuccess"));
    assert.ok(page.includes('router.push("/modules/9")'));
  });

  it("celebrates Module 9 as the transferable whole process", () => {
    const t = getModuleRoleTransition(9, null);
    assert.equal(t.isTerminal, true);
    const blob = `${t.eyebrow} ${t.accomplishment} ${t.nextRole} ${t.continuity} ${t.headline}`;
    for (const token of [
      "observing",
      "organizing",
      "planning",
      "drafting",
      "revising",
      "formatting",
      "submitting",
    ]) {
      assert.ok(new RegExp(token, "i").test(blob), `missing ${token}`);
    }
    assert.ok(/transferable|future writing/i.test(blob));
    assert.ok(/Writing Processor complete/i.test(blob));
    assert.ok(/Great work/i.test(blob));
    assert.ok(/Be proud of the work you/i.test(blob));
    const page = readSrc("app/modules/9/success/page.js");
    assert.ok(page.includes("ModuleRoleTransitionCard"));
    assert.ok(page.includes("getModuleRoleTransition(9, null)"));
    assert.ok(page.includes("advanceCurrentModuleOnSuccess"));
    assert.ok(page.includes("logActivity"));
    assert.ok(page.includes('router.push("/dashboard")'));
    assert.ok(/Contact your teacher before you try to change or resubmit/i.test(page));
  });

  it("preserves routes, handlers, and primary action destinations", () => {
    const m7 = readSrc("app/modules/7/success/page.js");
    const m8 = readSrc("app/modules/8/success/page.js");
    assert.ok(m7.includes('href="/modules/8"'));
    assert.ok(m7.includes("completedModuleNumber: 7"));
    assert.ok(m8.includes("completedModuleNumber: 8"));
    assert.ok(m8.includes('router.push("/modules/9")'));
    assert.ok(readSrc("lib/module4/module4HandoffHelpers.js").includes("STEP_HANDOFF"));
    assert.ok(readSrc("lib/module5/module5SuccessHelpers.js").includes("MODULE5_SUCCESS_NEXT_HREF"));
    assert.ok(readSrc("lib/module6/module6SuccessHelpers.js").includes("MODULE6_SUCCESS_NEXT_HREF"));
  });
});
