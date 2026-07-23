/**
 * WP-097 — Coverage registry exhaustiveness and presentation contract.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  TASK_WORKSPACE_COVERAGE_FAMILIES,
  MODULE3_V2_STEP_IDS,
  collectProductionStepIds,
  resolveTaskWorkspaceCoverageFamily,
  assertCoverageForStepIds,
  listCoverageFamilyIds,
} = require("../lib/ui/taskWorkspaceCoverageRegistry.js");
const { PROMPT_STEP_KEYS } = require("../lib/module1/promptBreakdownHelpers.js");
const { STEP2_STAGES } = require("../lib/module1/step2MicrostageHelpers.js");
const { EVIDENCE_ARGUMENT_STEPS } = require("../lib/artifacts/evidenceArgumentContract.js");
const { MODULE5_STAGE } = require("../lib/module5/module5OutlineStageHelpers.js");
const { MATRIX_FLOW_STAGES } = require("../lib/module2/rhetoricalMatrixHelpers.js");
const { GUIDED_APA_MOVE_IDS } = require("../lib/module9/guidedApaRequirementsContract.js");
const { getJourneyStageForModule } = require("../lib/ui/writingJourneyStages.js");
const { TASK_WORKSPACE_COLOR_ROLES } = require("../lib/ui/taskWorkspaceContract.js");

const root = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

describe("WP-097 task-workspace coverage registry", () => {
  it("indexes every planned Module 1–9 family id", () => {
    const ids = listCoverageFamilyIds();
    for (const required of [
      "M1.PROMPT",
      "M1.TRANSFER",
      "M1.LEGACY_LEARN",
      "M1.QUIZ",
      "M2.WIZARD",
      "M2.GUIDED_OBS",
      "M2.TCHART",
      "M2.MATRIX",
      "M2.DIRECTION",
      "M3.EA",
      "M3.V2",
      "M3.HYDRATE",
      "M4.HANDOFF",
      "M4.PATTERN",
      "M4.BODY",
      "M4.THIRD",
      "M4.REVIEW",
      "M4.UPSTREAM",
      "M5.OUTLINE",
      "M5.VIEW_TOGGLE",
      "M5.MISMATCH",
      "M6.INTRO",
      "M6.BODY",
      "M6.CONCLUSION",
      "M6.ADVANCED",
      "M6.REVIEW",
      "M6.LEGACY_TEXTAREA",
      "M6.AUTOSAVE",
      "M7.RA",
      "M7.SECTION",
      "M7.WE",
      "M7.LEGACY_SEC",
      "M8.DOC",
      "M8.LEGACY",
      "M9.HAND",
      "M9.MOVE",
      "M9.DOCINS",
      "M9.PDF",
      "M9.ALREADY",
      "M9.REC",
      "M9.LEGACY",
    ]) {
      assert.ok(ids.includes(required), `missing family ${required}`);
    }
  });

  it("maps every collected production step id to exactly one family", () => {
    const universe = collectProductionStepIds();
    assert.ok(universe.length > 40, "expected a broad production id universe");
    for (const { module, stepId } of universe) {
      const family = resolveTaskWorkspaceCoverageFamily(stepId, { module });
      assert.ok(
        family,
        `no family for module ${module} step ${JSON.stringify(stepId)}`
      );
      assert.equal(family.module, module);
    }
    assertCoverageForStepIds(
      universe.map((row) => row.stepId).filter((_, i) => universe[i].module === 1),
      { module: 1 }
    );
  });

  it("fails clearly on unknown synthetic step ids", () => {
    assert.equal(
      resolveTaskWorkspaceCoverageFamily("totally_unknown_step_xyz", {
        module: 6,
      }),
      null
    );
    assert.throws(
      () => assertCoverageForStepIds(["totally_unknown_step_xyz"], { module: 6 }),
      /WP-097 coverage gap/
    );
  });

  it("stays in sync with live step registries (drift fails)", () => {
    for (const key of PROMPT_STEP_KEYS) {
      assert.equal(
        resolveTaskWorkspaceCoverageFamily(key, { module: 1 }).familyId,
        "M1.PROMPT"
      );
    }
    assert.equal(
      resolveTaskWorkspaceCoverageFamily(STEP2_STAGES.LEARN, { module: 1 })
        .familyId,
      "M1.TRANSFER"
    );
    assert.equal(
      resolveTaskWorkspaceCoverageFamily(STEP2_STAGES.QUIZ, { module: 1 })
        .familyId,
      "M1.QUIZ"
    );

    for (const step of EVIDENCE_ARGUMENT_STEPS) {
      assert.equal(
        resolveTaskWorkspaceCoverageFamily(step.id, { module: 3 }).familyId,
        "M3.EA"
      );
    }
    for (const id of MODULE3_V2_STEP_IDS) {
      assert.equal(
        resolveTaskWorkspaceCoverageFamily(id, { module: 3 }).familyId,
        "M3.V2"
      );
    }

    for (const stage of Object.values(MODULE5_STAGE)) {
      assert.equal(
        resolveTaskWorkspaceCoverageFamily(stage, { module: 5 }).familyId,
        "M5.OUTLINE"
      );
    }

    assert.equal(
      resolveTaskWorkspaceCoverageFamily(
        `matrix:${MATRIX_FLOW_STAGES.CELL}`,
        { module: 2 }
      ).familyId,
      "M2.MATRIX"
    );
    assert.equal(
      resolveTaskWorkspaceCoverageFamily(
        `matrix:${MATRIX_FLOW_STAGES.PATTERN}`,
        { module: 2 }
      ).familyId,
      "M2.DIRECTION"
    );

    for (const moveId of GUIDED_APA_MOVE_IDS) {
      const family = resolveTaskWorkspaceCoverageFamily(moveId, { module: 9 });
      assert.ok(family, moveId);
      if (moveId === "doc_inspection") {
        assert.equal(family.familyId, "M9.DOCINS");
      } else {
        assert.equal(family.familyId, "M9.MOVE");
      }
    }
  });

  it("keeps journeyStageId aligned with writingJourneyStages per module", () => {
    for (const entry of TASK_WORKSPACE_COVERAGE_FAMILIES) {
      const journey = getJourneyStageForModule(entry.module);
      assert.ok(journey, `module ${entry.module}`);
      assert.equal(
        entry.journeyStageId,
        journey.id,
        `${entry.familyId} journeyStageId`
      );
    }
  });

  it("forbids empty decorative desk/shelf without explicit none", () => {
    for (const entry of TASK_WORKSPACE_COVERAGE_FAMILIES) {
      assert.ok(
        typeof entry.deskSelector === "string" && entry.deskSelector.length > 0,
        entry.familyId
      );
      assert.ok(
        typeof entry.shelfSelector === "string" && entry.shelfSelector.length > 0,
        entry.familyId
      );
    }
  });

  it("preserves exact accepted color-role vocabulary", () => {
    assert.deepEqual(
      [
        TASK_WORKSPACE_COLOR_ROLES.job,
        TASK_WORKSPACE_COLOR_ROLES.desk,
        TASK_WORKSPACE_COLOR_ROLES.work,
        TASK_WORKSPACE_COLOR_ROLES.shelf,
        TASK_WORKSPACE_COLOR_ROLES.evidence,
      ],
      ["instruction", "student-thinking", "writing", "reference", "evidence"]
    );
  });

  it("documents adapter paths that exist on disk", () => {
    for (const entry of TASK_WORKSPACE_COVERAGE_FAMILIES) {
      const abs = path.join(root, entry.adapterPath);
      assert.ok(fs.existsSync(abs), `missing adapter ${entry.adapterPath}`);
    }
  });

  it("keeps presentation-only: registry has no completion/write helpers", () => {
    const src = read("lib/ui/taskWorkspaceCoverageRegistry.js");
    assert.equal(/completeModule|markComplete|upsertDraft|saveProgress/.test(src), false);
    assert.match(src, /Not a second router/);
  });
});
