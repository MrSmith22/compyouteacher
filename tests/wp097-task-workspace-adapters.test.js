/**
 * WP-097 — Adapter wiring and promotion readiness checks.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const ADAPTERS = [
  "app/modules/1/prompt/page.js",
  "components/ModuleOne.js",
  "components/module1/VocabularyTransferLessonFlow.jsx",
  "app/modules/2/page.js",
  "app/modules/2/tcharts/page.js",
  "app/modules/2/observations/guided/page.js",
  "components/module2/ModuleTwoRhetoricalMatrix.jsx",
  "components/module2/ModuleTwoMeetSituationsStep.jsx",
  "components/module2/RepresentativeDirectionEvidencePanel.jsx",
  "components/module3/EvidenceArgumentSlicePanel.jsx",
  "components/module3/ModuleThreeStepFrame.jsx",
  "components/ModuleFour.js",
  "components/module5/ModuleFiveStepFrame.jsx",
  "components/module6/ModuleSixStepFrame.jsx",
  "components/module6/BodyParagraphMoveWorkspace.jsx",
  "components/module6/SectionMoveWorkspace.jsx",
  "components/module7/SectionRevisionPanel.jsx",
  "components/module7/BodyParagraphRevisionPanel.jsx",
  "components/module7/WholeEssayReviewPanel.jsx",
  "components/module8/ModuleEightGuidedApaDocPanel.jsx",
  "components/ModuleNine.js",
  "components/module9/GuidedApaProtocolFlow.jsx",
];

describe("WP-097 adapter coverage under hierarchy composition", () => {
  it("wires foundation contract markers across Module 1–9 adapter paths", () => {
    for (const rel of ADAPTERS) {
      const source = read(rel);
      assert.ok(fs.existsSync(path.join(root, rel)), rel);
      assert.match(
        source,
        /data-task-workspace-(foundation|region|contract)|resolveTaskWorkspacePresentation|moduleNumber=\{4\}/,
        `adapter markers missing in ${rel}`
      );
    }
  });

  it("keeps Module 4 journey moduleNumber on ModuleThreeStepFrame", () => {
    assert.match(read("components/ModuleFour.js"), /moduleNumber=\{4\}/);
  });

  it("uses only accepted instructional color-role ids in adapters", () => {
    const allowed = new Set([
      "instruction",
      "student-thinking",
      "evidence",
      "writing",
      "reference",
    ]);
    for (const rel of ADAPTERS) {
      const source = read(rel);
      const matches = source.matchAll(
        /data-instructional-color-role=\{?(?:foundation \? )?"([a-z-]+)"/g
      );
      for (const m of matches) {
        assert.ok(
          allowed.has(m[1]),
          `${rel} uses non-contract color role ${m[1]}`
        );
      }
      assert.doesNotMatch(
        source,
        /data-instructional-color-role=["']revision["']/
      );
    }
  });

  it("does not invent a DB presentation rollout mode", () => {
    const registry = read("lib/ui/taskWorkspaceCoverageRegistry.js");
    assert.doesNotMatch(registry, /task_workspace_mode|presentation_mode/);
  });

  it("deletes the WP-096 development gate after promotion", () => {
    assert.equal(
      fs.existsSync(
        path.join(root, "lib/dev/isTaskWorkspaceHierarchyFoundationEnabled.js")
      ),
      false
    );
    for (const rel of ADAPTERS) {
      assert.doesNotMatch(
        read(rel),
        /isTaskWorkspaceHierarchyFoundationEnabled/,
        `${rel} still imports the deleted WP-096 gate`
      );
    }
  });
});
