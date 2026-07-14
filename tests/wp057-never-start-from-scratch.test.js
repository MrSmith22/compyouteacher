/**
 * WP-057 — “Never start from scratch” / build-forward framing (Modules 4–9).
 * Module 3 excluded. Prefer hooks on existing copy over duplicate panels.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  WP057_BUILD_FORWARD_AUDIT,
  getBuildForwardAuditEntry,
  isBlankPageInstruction,
  namesPriorAndTransformation,
} from "../lib/ui/buildForwardContract.js";
import {
  SUCCESS_STAGE_CELEBRATE,
  SUCCESS_STAGE_HANDOFF,
  getSuccessTeacherGuidance,
} from "../lib/module4/module4SuccessStageHelpers.js";
import {
  MODULE5_SUCCESS_STAGES,
  getModule5SuccessStageMeta,
} from "../lib/module5/module5SuccessHelpers.js";
import { MODULE9_SCREEN_CONTRACT } from "../lib/module9/module9ScreenContract.js";
import { MODULE7_REVISION_STRENGTH_FRAME } from "../lib/module7/module7RevisionStrategy.js";
import {
  getModule6StepPresentation,
  SECTION_TYPES,
} from "../components/module6/module6StepPresentation.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-057 build-forward audit matrix", () => {
  it("1–2. Modules 4–9 audit names prior artifact and transformation", () => {
    assert.ok(WP057_BUILD_FORWARD_AUDIT.length >= 10);
    const modules = new Set(WP057_BUILD_FORWARD_AUDIT.map((r) => r.module));
    for (const m of [4, 5, 6, 7, 8, 9]) {
      assert.ok(modules.has(m), `module ${m}`);
    }
    assert.equal(modules.has(3), false);
    for (const row of WP057_BUILD_FORWARD_AUDIT) {
      assert.equal(namesPriorAndTransformation(row), true, row.id);
      assert.equal(row.compliant, true, row.id);
    }
  });
});

describe("WP-057 Modules 4–5 carry-forward", () => {
  it("3. Module 4 carries paragraph plans into Module 5 without starting over", () => {
    const coach = getSuccessTeacherGuidance({ stage: SUCCESS_STAGE_CELEBRATE });
    assert.match(coach.coaching, /not starting over in Module 5/i);
    const handoff = getSuccessTeacherGuidance({ stage: SUCCESS_STAGE_HANDOFF });
    assert.match(handoff.coaching, /plans you already built/i);
    assert.match(handoff.nextStep, /outline/i);
    const entry = getBuildForwardAuditEntry("m4-success-handoff");
    assert.ok(entry);
    assert.match(entry.priorArtifact, /paragraph plans/i);
  });

  it("4. Module 5 carries outline into Module 6 drafting", () => {
    const m5 = readSrc("components/ModuleFive.js");
    assert.match(m5, /data-testid="module5-build-forward-framing"/);
    assert.match(m5, /paragraph plans you already completed/i);
    assert.match(m5, /not recreate them/i);
    const handoff = getModule5SuccessStageMeta(MODULE5_SUCCESS_STAGES.HANDOFF);
    assert.match(handoff.heading, /draft from this outline/i);
    const celebrate = getModule5SuccessStageMeta(MODULE5_SUCCESS_STAGES.CELEBRATE);
    assert.match(celebrate.heading, /outline is finished/i);
  });
});

describe("WP-057 Module 6 drafting build-forward", () => {
  it("5. first-stage framing always visible and says not starting over", () => {
    const m6 = readSrc("components/ModuleSix.js");
    assert.match(m6, /data-testid="module6-build-forward-framing"/);
    assert.match(m6, /data-build-forward-module="6"/);
    assert.match(m6, /You are not starting over/);
    assert.match(
      m6,
      /You already figured out what you want\s+to say/
    );
    // Promoted out of Need Help / InfoCallout — not disclosure-only.
    assert.doesNotMatch(m6, /InfoCallout/);
    assert.ok(m6.includes('data-testid="module6-build-forward-framing"'));
    assert.ok(
      m6.includes("isFirstStage && !locked"),
      "first-stage gated always-visible strip"
    );
  });

  it("6. drafting uses outline/thesis/task-relevant prior work", () => {
    const intro = getModule6StepPresentation(
      { type: SECTION_TYPES.INTRO, bodyIndex: -1 },
      { body: [{ point: "A" }] }
    );
    assert.match(JSON.stringify(intro.whyMatters), /You already chose your thesis/i);
    assert.match(JSON.stringify(intro.jobRightNow), /thesis you already planned/i);
    const m6 = readSrc("components/ModuleSix.js");
    assert.match(m6, /TaskRelevantArtifacts/);
    assert.match(intro.outlineCoach || "", /outline/i);
    const entry = getModule6StepPresentation(null, { body: [] });
    assert.match(entry.outlineCoach, /outline is the map/i);
  });
});

describe("WP-057 Module 7 build-forward", () => {
  it("7. read-aloud visibly identifies completed Module 6 draft", () => {
    const m7 = readSrc("components/ModuleSeven.js");
    assert.match(m7, /data-testid="module7-build-forward-framing"/);
    assert.match(
      m7,
      /Your Module 6 draft is already on your desk\. You are listening for\s+what to strengthen—not starting a new draft\./
    );
    // Keep compact in progress framing — not a new card component import.
    assert.doesNotMatch(m7, /BuildForwardCard|NeverStartPanel/);
  });

  it("8. revision frames strengthening the existing draft", () => {
    assert.match(MODULE7_REVISION_STRENGTH_FRAME, /draft is complete/i);
    assert.match(MODULE7_REVISION_STRENGTH_FRAME, /making it stronger/i);
    const m7 = readSrc("components/ModuleSeven.js");
    assert.match(m7, /data-testid="module7-revision-build-forward-framing"/);
    assert.match(m7, /strengthFrame/);
  });
});

describe("WP-057 Module 8 persistent framing", () => {
  it("9–10. writing complete / not rewriting shared across steps", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.match(m8, /data-testid="module8-submission-doc-framing"/);
    assert.match(m8, /data-build-forward-module="8"/);
    assert.match(m8, /Your writing is complete/);
    assert.match(m8, /not rewriting it/);
    // One persistent framing block — not duplicated per step.
    const matches = m8.match(/data-testid="module8-submission-doc-framing"/g) || [];
    assert.equal(matches.length, 1);
    assert.doesNotMatch(m8, /You are not starting over/);
  });
});

describe("WP-057 Module 9 journey continuity", () => {
  it("11–13. APA, Doc reuse, format/upload frame existing finished paper", () => {
    assert.match(
      MODULE9_SCREEN_CONTRACT[1].purpose,
      /not your ideas|not rewriting your essay/i
    );
    assert.match(MODULE9_SCREEN_CONTRACT[2].purpose, /reuse the Google Doc from Module 8/i);
    assert.match(
      MODULE9_SCREEN_CONTRACT[3].purpose,
      /already written and prepared/i
    );
    assert.match(MODULE9_SCREEN_CONTRACT[3].purpose, /APA presentation/i);
    assert.match(
      MODULE9_SCREEN_CONTRACT[4].purpose,
      /writing and formatting work are finished/i
    );
    assert.match(MODULE9_SCREEN_CONTRACT[4].purpose, /newest PDF/i);

    const m9 = readSrc("components/ModuleNine.js");
    for (const step of [1, 2, 3, 4]) {
      assert.match(m9, new RegExp(`data-testid="module9-build-forward-step-${step}"`));
    }
    assert.match(m9, /Optional template \(if you need a blank APA layout\)/);
  });
});

describe("WP-057 blank-page dominance and non-duplication", () => {
  it("14–16. no blank-page instruction; framing always-visible; templates are optional", () => {
    const surfaces = [
      readSrc("components/ModuleFive.js"),
      readSrc("components/ModuleSix.js"),
      readSrc("components/ModuleSeven.js"),
      readSrc("components/ModuleEight.js"),
      readSrc("components/ModuleNine.js"),
      readSrc("lib/module9/module9ScreenContract.js"),
    ].join("\n");
    assert.equal(isBlankPageInstruction(surfaces), false);
    assert.doesNotMatch(
      surfaces,
      /begin (your|the) essay from (a )?blank page|create ideas from scratch/i
    );

    // Key build-forward hooks are not nested only inside InstructionalDisclosure titles.
    const m6 = readSrc("components/ModuleSix.js");
    const m6Hook = m6.indexOf('data-testid="module6-build-forward-framing"');
    const disclosureNearHook = m6
      .slice(Math.max(0, m6Hook - 400), m6Hook + 200)
      .includes("InstructionalDisclosure");
    assert.equal(disclosureNearHook, false);

    const m7 = readSrc("components/ModuleSeven.js");
    const m7Hook = m7.indexOf('data-testid="module7-build-forward-framing"');
    assert.ok(m7Hook > 0);
    assert.equal(
      m7.slice(Math.max(0, m7Hook - 300), m7Hook).includes("InstructionalDisclosure"),
      false
    );

    // Optional APA templates remain labeled optional/reference.
    assert.match(
      readSrc("components/ModuleNine.js"),
      /Optional template[\s\S]{0,80}blank APA layout/
    );
  });

  it("17–18. task-relevant desks remain; no duplicate build-forward panels", () => {
    for (const file of [
      "components/ModuleSix.js",
      "components/ModuleSeven.js",
    ]) {
      assert.match(readSrc(file), /TaskRelevantArtifacts/);
    }
    const m6 = readSrc("components/ModuleSix.js");
    assert.equal(
      (m6.match(/data-testid="module6-build-forward-framing"/g) || []).length,
      1
    );
    const m8 = readSrc("components/ModuleEight.js");
    assert.equal(
      (m8.match(/You are not starting over/g) || []).length,
      0,
      "Module 8 should keep its existing framing, not a second slogan panel"
    );
    // WP-056 celebrations remain a separate system.
    assert.match(m6, /ProgressCelebrationBridge/);
    assert.match(readSrc("components/ModuleSeven.js"), /ProgressCelebrationBridge/);
  });

  it("20. no Module 3 file in WP-057 implementation set", () => {
    const paths = [
      "lib/ui/buildForwardContract.js",
      "components/ModuleFive.js",
      "components/ModuleSix.js",
      "components/ModuleSeven.js",
      "components/ModuleEight.js",
      "components/ModuleNine.js",
      "lib/module9/module9ScreenContract.js",
      "tests/wp057-never-start-from-scratch.test.js",
    ];
    for (const p of paths) {
      assert.doesNotMatch(p, /module3|ModuleThree/i);
    }
  });
});
