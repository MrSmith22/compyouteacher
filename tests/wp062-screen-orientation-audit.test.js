/**
 * WP-062 — Screen orientation reconciliation (Modules 6–9).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  SCREEN_ORIENTATION_NEXT_TEST_ID,
  WP062_ORIENTATION_MATRIX,
  getWp062ModulesCovered,
  getWp062NonCompliantRows,
  matrixUsesModeOrJourneyForWhere,
  orientationAnswerNotDisclosureBound,
  orientationAnswersAlwaysVisible,
} from "../lib/ui/screenOrientationContract.js";
import { getModule6StepPresentation } from "../components/module6/module6StepPresentation.js";
import { SECTION_TYPES } from "../components/module6/module6StepPresentation.js";
import { MODULE9_SCREEN_CONTRACT } from "../lib/module9/module9ScreenContract.js";
import { HIERARCHY_TASK_CLASS } from "../lib/ui/hierarchyContract.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const REQUIRED_STATE_IDS = [
  "m6-intro",
  "m6-body",
  "m6-conclusion",
  "m6-review",
  "m6-save-failure",
  "m7-read-aloud-before",
  "m7-read-aloud-after",
  "m7-intro-revision",
  "m7-body-revision",
  "m7-conclusion-revision",
  "m7-final-review",
  "m8-create",
  "m8-create-recovery",
  "m8-format",
  "m8-ready",
  "m9-apa-lesson",
  "m9-google-doc",
  "m9-format",
  "m9-upload",
  "m9-already-submitted",
  "m9-gate-blocked",
  "m9-success",
];

describe("WP-062 screen orientation audit (Modules 6–9)", () => {
  it("1–3. matrix covers Modules 6–9 stages with always-visible answers", () => {
    assert.deepEqual(getWp062ModulesCovered(), [6, 7, 8, 9]);
    const ids = WP062_ORIENTATION_MATRIX.map((row) => row.id);
    for (const id of REQUIRED_STATE_IDS) {
      assert.ok(ids.includes(id), `missing ${id}`);
    }
    assert.equal(getWp062NonCompliantRows().length, 0);
    for (const row of WP062_ORIENTATION_MATRIX) {
      assert.equal(orientationAnswersAlwaysVisible(row), true, row.id);
      assert.equal(orientationAnswerNotDisclosureBound(row), true, row.id);
      for (const key of ["where", "what", "connection", "next"]) {
        assert.ok(String(row[key].answer || "").trim(), `${row.id}.${key}`);
        assert.ok(String(row[key].source || "").trim(), `${row.id}.${key}.source`);
      }
    }
  });

  it("4–6. where uses mode/journey; task heading stays dominant; work targets stay specific", () => {
    for (const row of WP062_ORIENTATION_MATRIX) {
      assert.equal(matrixUsesModeOrJourneyForWhere(row), true, row.id);
    }
    assert.match(HIERARCHY_TASK_CLASS, /text-\[1\.95rem\]|font-bold/);
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    assert.match(frame, /HIERARCHY_TASK_CLASS/);
    assert.match(frame, /data-testid="screen-contract-task"/);
    assert.match(frame, /data-testid="screen-orientation-next"/);
    // Next is subordinate prose, not a competing H1.
    const nextAt = frame.indexOf('data-testid="screen-orientation-next"');
    const h1At = frame.indexOf("screen-contract-task");
    assert.ok(h1At > 0 && nextAt > h1At);

    const body = getModule6StepPresentation(
      { type: SECTION_TYPES.BODY, bodyIndex: 0 },
      { body: [{ point: "Audience ethics" }, { point: "Hope" }] }
    );
    assert.match(body.question || "", /this point|reader/i);
    assert.match(String(body.workingSetLabel || body.jobRightNow?.lead || ""), /./);
  });

  it("7–8. continuity uses real prior artifacts; next matches handlers/gates", () => {
    const conclusion = getModule6StepPresentation(
      { type: SECTION_TYPES.CONCLUSION, bodyIndex: -1 },
      { body: [{ point: "A" }], conclusion: { summary: "x" } }
    );
    assert.match(
      conclusion.nextStepText,
      /review the whole draft/i
    );
    assert.doesNotMatch(conclusion.nextStepText, /continue to revision/i);

    const format = readSrc("components/module8/module8StepPresentation.js");
    assert.match(format, /ready check before Module 9/);
    assert.doesNotMatch(
      format,
      /Next you will make sure you are ready to continue/
    );

    for (const step of [1, 2, 3, 4]) {
      assert.ok(MODULE9_SCREEN_CONTRACT[step].next);
    }
    assert.match(MODULE9_SCREEN_CONTRACT[4].next, /upload fails|stay here/i);
  });

  it("9. mobile does not rely solely on WorkspaceGuide for next", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    assert.match(frame, /data-testid="screen-orientation-next"/);
    // Center column next is inside WorkspaceCenter before WorkspaceGuide.
    const centerNext = frame.indexOf('data-testid="screen-orientation-next"');
    const guide = frame.indexOf("<WorkspaceGuide");
    assert.ok(centerNext > 0 && guide > centerNext);
  });

  it("10–12. recovery/upload failure/already-submitted/terminal next are truthful", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.match(m8, /SubmissionDocRecoveryPanel/);
    assert.match(m8, /requireSessionWrite|docVerifiedThisSession|SuccessCriteriaPanel/);

    const m9 = readSrc("components/ModuleNine.js");
    assert.match(m9, /Upload failed\. Please try again/);
    assert.match(m9, /module9-already-submitted/);
    assert.match(m9, /module9-back-dashboard/);
    assert.match(m9, /no further Module 9 instructional step/i);
    assert.match(m9, /module9-gate-blocked/);
    assert.match(m9, /module9-go-module-8/);
    assert.match(
      MODULE9_SCREEN_CONTRACT[4].next,
      /nothing has been submitted yet/i
    );

    const success = readSrc("app/modules/9/success/page.js");
    assert.match(success, /dashboard|Dashboard/i);
  });

  it("13. no duplicate orientation dashboard / competing banner system", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    assert.doesNotMatch(frame, /OrientationDashboard|FourQuestionBanner|LostStudentPanel/);
    assert.match(frame, /ModuleModeCue/);
    assert.match(frame, /ScreenContractCues/);
    // Single center next line; Guide may echo the same text.
    const centerMatches = frame.match(
      /data-testid="screen-orientation-next"/g
    );
    assert.equal(centerMatches?.length, 1);
    assert.equal(SCREEN_ORIENTATION_NEXT_TEST_ID, "screen-orientation-next");
  });

  it("14. WP-048–061 protection hooks remain intact", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    const m8 = readSrc("components/ModuleEight.js");
    const m9 = readSrc("components/ModuleNine.js");
    assert.match(frame, /ScreenContractCues/);
    assert.match(frame, /ModuleModeCue/);
    assert.match(frame, /role-instruction|HIERARCHY_INSTRUCTION/);
    assert.match(m6, /TaskRelevantArtifacts|WorkingNotebookCurrentPage|selectTaskRelevantArtifacts/);
    assert.match(m6, /SuccessCriteriaPanel/);
    assert.match(m7, /ModuleSevenReadAloudObservation/);
    assert.match(m8, /SubmissionDocRecoveryPanel/);
    assert.match(m9, /InstructionalDisclosure/);
    assert.equal(existsSync(join(root, "lib/ui/instructionalColorContract.js")), true);
    assert.equal(existsSync(join(root, "lib/ui/instructionalRhythmContract.js")), true);
    assert.equal(existsSync(join(root, "lib/ui/progressiveDisclosureContract.js")), true);
  });

  it("15. no Module 3 product file is part of WP-062 implementation", () => {
    const paths = [
      "lib/ui/screenOrientationContract.js",
      "components/module6/ModuleSixStepFrame.jsx",
      "components/module6/module6StepPresentation.js",
      "components/module8/module8StepPresentation.js",
      "lib/module9/module9ScreenContract.js",
      "components/ModuleSix.js",
      "components/ModuleSeven.js",
      "components/ModuleNine.js",
      "tests/wp062-screen-orientation-audit.test.js",
      "tests/wp057-never-start-from-scratch.test.js",
    ];
    for (const p of paths) {
      assert.doesNotMatch(p, /module3\/|ModuleThree/);
      assert.equal(existsSync(join(root, p)), true, `missing ${p}`);
    }
  });
});
