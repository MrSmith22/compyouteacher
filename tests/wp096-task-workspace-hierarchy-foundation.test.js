/**
 * WP-096/WP-097 — Task-workspace hierarchy is the promoted production default.
 * The WP-096 development gate has been deleted; every representative family
 * now renders the shared task/desk/work/shelf composition unconditionally.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  TASK_WORKSPACE_REGION_IDS,
  TASK_WORKSPACE_COLOR_ROLES,
  resolveTaskWorkspacePresentation,
  describeTaskWorkspaceRegion,
  taskWorkspaceMobileOrderClass,
  assertSingleTaskHeading,
} = require("../lib/ui/taskWorkspaceContract.js");
const {
  selectDeskArtifactsForMove,
} = require("../lib/module6/bodyParagraphMoves.js");

const root = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

describe("WP-096 shared task-workspace contract", () => {
  it("normalizes one stable region order for mobile and keyboard flow", () => {
    assert.deepEqual(TASK_WORKSPACE_REGION_IDS, [
      "orientation",
      "task",
      "job",
      "desk",
      "work",
      "feedback",
      "readiness",
      "actions",
      "shelf",
    ]);
    assert.deepEqual(
      TASK_WORKSPACE_REGION_IDS.map(taskWorkspaceMobileOrderClass),
      [
        "order-1",
        "order-2",
        "order-3",
        "order-4",
        "order-5",
        "order-6",
        "order-7",
        "order-8",
        "order-9",
      ]
    );
  });

  it("uses accepted semantic color roles with structural labels", () => {
    assert.deepEqual(TASK_WORKSPACE_COLOR_ROLES, {
      orientation: null,
      task: null,
      job: "instruction",
      desk: "student-thinking",
      work: "writing",
      feedback: "instruction",
      readiness: null,
      actions: null,
      shelf: "reference",
      evidence: "evidence",
    });
    for (const id of ["job", "desk", "work", "feedback", "shelf"]) {
      const region = describeTaskWorkspaceRegion(id);
      assert.ok(region.colorRoleId, id);
      assert.ok(region.colorRoleLabel, id);
      assert.equal(region.testId, `task-workspace-${id}`);
    }
    assert.equal(
      describeTaskWorkspaceRegion("desk", { evidenceSurface: true }).colorRoleId,
      "evidence"
    );
  });

  it("projects journey, step, task, and width without owning behavior", () => {
    const presentation = resolveTaskWorkspacePresentation({
      moduleNumber: 6,
      stepIndex: 2,
      stepCount: 5,
      taskHeading: "Explain the evidence",
      desktopWidthIntent: "drafting",
    });
    assert.equal(presentation.journeyStageId, "draft");
    assert.equal(presentation.stepProgress, "Step 2 of 5");
    assert.equal(presentation.taskHeading, "Explain the evidence");
    assert.equal(presentation.desktopWidthIntent, "drafting");
    assert.deepEqual(assertSingleTaskHeading("Explain the evidence"), {
      ok: true,
      heading: "Explain the evidence",
    });
    assert.equal("response" in presentation, false);
    assert.equal("complete" in presentation, false);
    assert.equal("navigate" in presentation, false);
  });

  it("keeps the desk move-specific and never silently substitutes unrelated work", () => {
    const desk = {
      purpose: "Show how the example supports the claim.",
      thesis: "The writers adapt evidence for different audiences.",
      evidence: "A verified passage",
      reasoning: "This wording makes the consequence concrete.",
      unrelatedHistory: "Older full notebook content",
    };
    const evidenceRows = selectDeskArtifactsForMove("evidence", desk);
    assert.deepEqual(evidenceRows.map((row) => row.field), ["evidence"]);
    assert.equal(evidenceRows.some((row) => row.field === "unrelatedHistory"), false);
    const missing = selectDeskArtifactsForMove("evidence", {
      unrelatedHistory: "Do not choose this",
    });
    assert.deepEqual(missing, []);
  });
});

describe("WP-097 promoted task-workspace hierarchy is the production default", () => {
  it("deletes the WP-096 development gate rather than returning true", () => {
    assert.equal(
      fs.existsSync(
        path.join(root, "lib/dev/isTaskWorkspaceHierarchyFoundationEnabled.js")
      ),
      false
    );
  });

  it("wires all five representative families unconditionally, with no gate import", () => {
    for (const rel of [
      "components/module1/VocabularyTransferLessonFlow.jsx",
      "components/module3/EvidenceArgumentSlicePanel.jsx",
      "components/module5/ModuleFiveStepFrame.jsx",
      "components/module6/ModuleSixStepFrame.jsx",
      "components/module9/GuidedApaProtocolFlow.jsx",
    ]) {
      const source = read(rel);
      assert.doesNotMatch(source, /isTaskWorkspaceHierarchyFoundationEnabled/);
      assert.match(source, /resolveTaskWorkspacePresentation/);
      assert.match(source, /data-task-workspace-foundation/);
      assert.match(source, /data-task-workspace-contract/);
    }
  });

  it("keeps required teaching visible while shelves remain optional", () => {
    const frame = read("components/workspace/TaskWorkspaceFrame.jsx");
    assert.match(frame, /regionId="job"/);
    assert.match(frame, /regionId="work"/);
    assert.match(frame, /regionId="shelf"/);
    assert.doesNotMatch(frame, /<details[\s\S]*regionId="job"/);
    assert.match(frame, /task-workspace-desk-work-grid/);
  });

  it("makes Module 6 writing larger than its contextual desk and fixes mobile shelf order", () => {
    const body = read("components/module6/BodyParagraphMoveWorkspace.jsx");
    assert.match(body, /minmax\(300px,0\.65fr\).*minmax\(0,1\.35fr\)/s);
    assert.match(body, /data-task-workspace-region=.*desk/);
    assert.match(body, /data-testid="bp-move-writing-field"/);
    const frame = read("components/module6/ModuleSixStepFrame.jsx");
    assert.match(frame, /order-9 lg:order-1/);
    assert.match(frame, /order-1 lg:order-2/);
    assert.match(frame, /order-10 lg:order-3/);
  });

  it("keeps the promoted composition unconditional across representative adapters", () => {
    for (const rel of [
      "components/ModuleOne.js",
      "components/module3/EvidenceArgumentSlicePanel.jsx",
      "components/module5/ModuleFiveStepFrame.jsx",
      "components/module6/ModuleSixStepFrame.jsx",
      "components/ModuleNine.js",
      "components/module9/GuidedApaProtocolFlow.jsx",
    ]) {
      assert.doesNotMatch(read(rel), /isTaskWorkspaceHierarchyFoundationEnabled/);
    }
    for (const rel of [
      "components/ModuleOne.js",
      "components/module3/EvidenceArgumentSlicePanel.jsx",
      "components/module5/ModuleFiveStepFrame.jsx",
      "components/module6/ModuleSixStepFrame.jsx",
      "components/module9/GuidedApaProtocolFlow.jsx",
    ]) {
      assert.match(read(rel), /data-task-workspace-foundation/);
    }
    assert.match(read("components/ModuleNine.js"), /GuidedApaProtocolFlow/);
  });
});
