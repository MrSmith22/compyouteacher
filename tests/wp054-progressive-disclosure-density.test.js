/**
 * WP-054 — Progressive disclosure density (Modules 6–9 pilot).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  WP054_ALWAYS_VISIBLE,
  WP054_DENSE_LAYER_THRESHOLD,
  WP054_DISCLOSE_ON_DEMAND,
  WP054_DENSITY_MATRIX,
  countPreWorkLayers,
  getWp054DenseStates,
  getWp054RemediatedStates,
  isMateriallyDense,
} from "../lib/ui/progressiveDisclosureContract.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-054 progressive disclosure density (Modules 6–9)", () => {
  it("includes a complete Modules 6–9 density matrix", () => {
    const modules = new Set(WP054_DENSITY_MATRIX.map((row) => row.module));
    assert.deepEqual([...modules].sort(), [6, 7, 8, 9]);
    for (const row of WP054_DENSITY_MATRIX) {
      assert.ok(row.id && row.state && row.plan);
      assert.ok(Array.isArray(row.preWorkLayers));
      assert.equal(
        Boolean(row.dense),
        isMateriallyDense(row),
        `${row.id} dense flag mismatch (layers=${countPreWorkLayers(row)})`
      );
      assert.ok(countPreWorkLayers(row) >= 1);
    }
    assert.equal(WP054_DENSE_LAYER_THRESHOLD, 4);
  });

  it("remediates every materially dense state (at least five when present)", () => {
    const dense = getWp054DenseStates();
    const remediated = getWp054RemediatedStates();
    assert.ok(dense.length >= 5, `expected ≥5 dense states, found ${dense.length}`);
    assert.equal(remediated.length, dense.length);
    for (const row of dense) {
      assert.equal(row.plan, "remediate");
      assert.ok(String(row.remedy || "").length > 20);
    }
  });

  it("documents always-visible versus disclose-on-demand categories", () => {
    for (const key of [
      "task",
      "orientation_cues",
      "current_work",
      "success_criteria",
      "active_errors_gates",
      "primary_action",
    ]) {
      assert.ok(WP054_ALWAYS_VISIBLE.includes(key));
    }
    for (const key of [
      "examples",
      "extended_explanations",
      "full_reference_shelves",
      "inactive_troubleshooting",
    ]) {
      assert.ok(WP054_DISCLOSE_ON_DEMAND.includes(key));
    }
  });

  it("uses a shared InstructionalDisclosure with a11y and empty-safe behavior", () => {
    const shared = readSrc("components/shared/InstructionalDisclosure.jsx");
    assert.ok(shared.includes("aria-expanded"));
    assert.ok(shared.includes("aria-controls"));
    assert.ok(shared.includes("min-h-[44px]"));
    assert.ok(shared.includes("HIERARCHY_FOCUS_RING_CLASS"));
    assert.ok(shared.includes("if (!hasContent) return null"));
    assert.ok(shared.includes('data-testid={testId || "instructional-disclosure"}'));
    assert.equal(shared.includes("advanceCurrentModuleOnSuccess"), false);
    assert.equal(shared.includes("upsertModule"), false);
    assert.equal(shared.includes("handleUpload"), false);

    const m7 = readSrc("components/module7/ModuleSevenDisclosure.jsx");
    const m9 = readSrc("components/module9/ModuleNineDisclosure.jsx");
    assert.ok(m7.includes("InstructionalDisclosure"));
    assert.ok(m9.includes("InstructionalDisclosure"));
  });

  it("Module 6 keeps job/cues/work; migrates supporting details to shared disclosure", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    assert.ok(frame.includes("InstructionalDisclosure"));
    assert.ok(frame.includes("More about why this matters"));
    assert.ok(frame.includes("See an example"));
    assert.ok(frame.includes("ScreenContractCues"));
    assert.ok(frame.includes("jobRightNow") || frame.includes("Your job right now"));
  });

  it("Module 7 revision keeps strategy + desk + criteria; tips/examples are disclosed", () => {
    const strategy = readSrc("components/module7/ModuleSevenStrategyCard.jsx");
    const m7 = readSrc("components/ModuleSeven.js");
    assert.ok(strategy.includes("noticePrompt"));
    assert.ok(strategy.includes("improvePrompt"));
    assert.ok(strategy.includes("Keep in mind tips (optional)"));
    assert.ok(strategy.includes("See an example"));
    assert.ok(strategy.includes("ModuleSevenDisclosure"));
    assert.ok(m7.includes("TaskRelevantArtifacts"));
    assert.ok(m7.includes("SuccessCriteriaPanel"));
    assert.ok(m7.includes("deferSuccessCriteria"));
    assert.ok(m7.includes("ModuleSevenReadAloud"));
  });

  it("Module 8 Format/Ready retain checklists; dense framing/APA/reflection are disclosed", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes('data-testid="module8-format-checklist"'));
    assert.ok(m8.includes('data-testid="module8-ready-confidence-checklist"'));
    assert.ok(m8.includes('data-testid="module8-submission-reassurance"'));
    assert.ok(m8.includes("Nothing has been submitted yet"));
    assert.ok(m8.includes("More about APA formatting"));
    assert.ok(m8.includes("More about preparing your paper"));
    assert.ok(m8.includes("Preparation progress"));
    assert.ok(m8.includes("Reflection (optional)"));
    assert.ok(m8.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m8.includes('data-testid="module8-format-update-doc-escape"'));
    assert.ok(m8.includes('data-testid="module8-ready-update-doc-escape"'));
  });

  it("Module 9 APA/upload retain required controls; supplemental steps disclose", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const lesson = readSrc("components/module9/ModuleNineApaLesson.jsx");
    assert.ok(lesson.includes("ModuleNineApaVisual") || lesson.includes("Evaluate"));
    assert.ok(m9.includes('data-testid="module9-pdf-download-instructions"'));
    assert.ok(m9.includes("ModuleNinePdfDownloadVisual"));
    assert.ok(m9.includes('data-testid="module9-pdf-file-input"'));
    assert.ok(m9.includes('data-testid="module9-pdf-selected"'));
    assert.ok(m9.includes('data-testid="module9-final-upload-checklist"'));
    assert.ok(m9.includes('data-testid="module9-upload-final-pdf"'));
    assert.ok(m9.includes('data-testid="module9-wrong-pdf-reassurance"'));
    assert.ok(m9.includes("More download steps"));
    assert.ok(m9.includes("More upload steps"));
    assert.ok(m9.includes("File tips before you choose"));
    assert.ok(m9.includes("ModuleNineApaQuickGuide"));
  });

  it("preserves WP-048–053 contracts and recovery reachability", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    const m8 = readSrc("components/ModuleEight.js");
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(frame.includes("ScreenContractCues"));
    assert.ok(m8.includes("HIERARCHY_ACTION_PRIMARY_CLASS"));
    assert.ok(m8.includes("SuccessCriteriaPanel") || m9.includes("SuccessCriteriaPanel"));
    assert.ok(m9.includes("openExternalResource") || m9.includes("HIERARCHY_ACTION_SECONDARY_CLASS"));
    assert.ok(m8.includes("SubmissionDocRecoveryPanel"));
    const panel = readSrc("components/exports/SubmissionDocRecoveryPanel.jsx");
    assert.ok(panel.includes("showSecondaryDisclosure"));
  });

  it("design-system documents progressive disclosure", () => {
    const ds = readSrc("docs/design-system-v1.md");
    assert.ok(/progressive disclosure/i.test(ds));
    assert.ok(/Always visible/i.test(ds));
    assert.ok(/Disclose on demand/i.test(ds));
  });
});
