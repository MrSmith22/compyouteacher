/**
 * WP-060 — Instructional rhythm (whitespace + semantic card chunking).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  RHYTHM_ACTION_ZONE_CLASS,
  RHYTHM_INSTRUCTION_CARD_CLASS,
  RHYTHM_MAJOR_SECTION_CLASS,
  RHYTHM_MOBILE_SAFE_CLASS,
  RHYTHM_PAGE_CLASS,
  RHYTHM_PROSE_CLASS,
  RHYTHM_WITHIN_SURFACE_CLASS,
  WP060_RHYTHM_AUDIT_MATRIX,
  getWp060AdditionalAuditedStates,
  getWp060AlreadyCompliantStateIds,
  getWp060ChangedStateIds,
  getWp060RankedTopTen,
  getWp060RemediatedOrCompliantTopTen,
  rhythmCardPaddingUsableAt390,
  rhythmNestedCardDepthOk,
  rhythmProseHasReadableMeasure,
  rhythmTokenIncludesMobileAndDesktop,
} from "../lib/ui/instructionalRhythmContract.js";
import {
  WP054_ALWAYS_VISIBLE,
  WP054_DENSITY_MATRIX,
} from "../lib/ui/progressiveDisclosureContract.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const REQUIRED_MATRIX_FIELDS = [
  "id",
  "module",
  "state",
  "visibleTopLevelBlocks",
  "activeWorkType",
  "currentVerticalRhythm",
  "longTextRisk",
  "cardChunking",
  "nestedCardDepth",
  "compliant",
  "remedy",
];

describe("WP-060 instructional rhythm (Modules 6–9)", () => {
  it("1–3. density/rhythm audit matrix exists; top ten ranked; each remediated or compliant", () => {
    assert.ok(WP060_RHYTHM_AUDIT_MATRIX.length >= 10);
    for (const row of WP060_RHYTHM_AUDIT_MATRIX) {
      for (const field of REQUIRED_MATRIX_FIELDS) {
        assert.ok(field in row, `${row.id} missing ${field}`);
      }
      assert.ok([6, 7, 8, 9].includes(row.module));
      assert.ok(rhythmNestedCardDepthOk(row), `${row.id} nested too deep`);
    }

    const top = getWp060RankedTopTen();
    assert.equal(top.length, 10);
    assert.deepEqual(
      top.map((r) => r.densityRank),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    );
    assert.equal(getWp060RemediatedOrCompliantTopTen(), true);
    for (const row of top) {
      assert.equal(row.compliant, true, `${row.id} not compliant`);
      assert.ok(String(row.remedy || "").length > 0);
    }

    const extra = getWp060AdditionalAuditedStates();
    assert.ok(extra.some((r) => r.id === "m8-ready"));
    assert.ok(extra.some((r) => r.id === "m7-final-review"));
    assert.ok(extra.some((r) => r.id === "m9-doc"));
    assert.ok(getWp060ChangedStateIds().length >= 5);
    assert.ok(getWp060AlreadyCompliantStateIds().includes("m6-drafting"));
  });

  it("4–6. shared rhythm tokens define spacing, usable padding, readable prose", () => {
    assert.equal(rhythmTokenIncludesMobileAndDesktop(RHYTHM_PAGE_CLASS), true);
    assert.equal(
      rhythmTokenIncludesMobileAndDesktop(RHYTHM_MAJOR_SECTION_CLASS),
      true
    );
    assert.equal(
      rhythmTokenIncludesMobileAndDesktop(RHYTHM_WITHIN_SURFACE_CLASS),
      true
    );
    assert.equal(
      rhythmCardPaddingUsableAt390(RHYTHM_INSTRUCTION_CARD_CLASS),
      true
    );
    assert.equal(rhythmProseHasReadableMeasure(RHYTHM_PROSE_CLASS), true);
    assert.match(RHYTHM_ACTION_ZONE_CLASS, /border-t/);
    assert.match(RHYTHM_MOBILE_SAFE_CLASS, /overflow-x-hidden/);
    assert.match(RHYTHM_MOBILE_SAFE_CLASS, /min-w-0/);
  });

  it("7–8. Module 6 frame gives drafting/review consistent major-section rhythm", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    assert.match(frame, /RHYTHM_PAGE_CLASS/);
    assert.match(frame, /RHYTHM_MAJOR_SECTION_CLASS/);
    assert.match(frame, /RHYTHM_PROSE_CLASS/);
    assert.match(frame, /data-rhythm-contract="page"/);
    assert.match(frame, /data-rhythm-contract="major-section"/);
    assert.doesNotMatch(frame, /ModuleThreeDeskFrame/);

    const m6 = readSrc("components/ModuleSix.js");
    assert.match(m6, /RHYTHM_WITHIN_SURFACE_CLASS/);
    assert.match(m6, /module6-review-section-list/);
  });

  it("9–10. Module 7 read-aloud and revision chunk meaningfully", () => {
    const m7 = readSrc("components/ModuleSeven.js");
    assert.match(m7, /RHYTHM_PAGE_CLASS/);
    assert.match(m7, /module7-read-aloud-primary/);
    assert.match(m7, /data-rhythm-chunk="essay"/);
    assert.match(m7, /data-rhythm-chunk="recording"/);
    assert.match(m7, /data-rhythm-chunk="observation"/);
    assert.match(m7, /data-rhythm-chunk="strategy"/);
    assert.match(m7, /data-rhythm-chunk="artifacts"/);
    assert.match(m7, /data-rhythm-chunk="textarea"/);
    assert.match(m7, /data-rhythm-chunk="criteria"/);
    assert.match(m7, /data-rhythm-chunk="actions"/);

    const essayAt = m7.indexOf('data-rhythm-chunk="essay"');
    const recordingAt = m7.indexOf('data-rhythm-chunk="recording"');
    const observationAt = m7.indexOf('data-rhythm-chunk="observation"');
    assert.ok(essayAt > 0 && recordingAt > essayAt && observationAt > recordingAt);

    const strategyAt = m7.indexOf('data-rhythm-chunk="strategy"');
    const artifactsAt = m7.indexOf('data-rhythm-chunk="artifacts"');
    const textareaAt = m7.indexOf('data-rhythm-chunk="textarea"');
    const criteriaAt = m7.indexOf('data-rhythm-chunk="criteria"');
    const actionsAt = m7.indexOf('data-rhythm-chunk="actions"');
    assert.ok(
      strategyAt > 0 &&
        artifactsAt > strategyAt &&
        textareaAt > artifactsAt &&
        criteriaAt > textareaAt &&
        actionsAt > criteriaAt
    );
  });

  it("11–13. Module 8 Create / Format / Ready separate major roles", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.match(m8, /RHYTHM_WITHIN_SURFACE_CLASS/);
    assert.match(m8, /RHYTHM_ACTION_ZONE_CLASS/);
    assert.match(m8, /module8-prepare-cluster/);
    assert.match(m8, /data-rhythm-chunk="framing"/);
    assert.match(m8, /data-rhythm-chunk="doc-work"/);
    assert.match(m8, /module8-create-working-set/);
    assert.match(m8, /data-rhythm-chunk="format-explanation"/);
    assert.match(m8, /data-rhythm-chunk="format-checklist"/);
    assert.match(m8, /data-rhythm-chunk="format-actions"/);
    assert.match(m8, /data-rhythm-chunk="ready-status"/);
    assert.match(m8, /data-rhythm-chunk="ready-confidence"/);
    assert.match(m8, /data-rhythm-chunk="ready-escape"/);
    assert.match(m8, /data-rhythm-chunk="ready-finish"/);

    const framingAt = m8.indexOf('data-rhythm-chunk="framing"');
    const docWorkAt = m8.indexOf('data-rhythm-chunk="doc-work"');
    assert.ok(framingAt > 0 && docWorkAt > framingAt);

    const explAt = m8.indexOf('data-rhythm-chunk="format-explanation"');
    const checkAt = m8.indexOf('data-rhythm-chunk="format-checklist"');
    const actAt = m8.indexOf('data-rhythm-chunk="format-actions"');
    assert.ok(explAt > 0 && checkAt > explAt && actAt > checkAt);

    const statusAt = m8.indexOf('data-rhythm-chunk="ready-status"');
    const confAt = m8.indexOf('data-rhythm-chunk="ready-confidence"');
    const escAt = m8.indexOf('data-rhythm-chunk="ready-escape"');
    const finAt = m8.indexOf('data-rhythm-chunk="ready-finish"');
    assert.ok(statusAt > 0 && confAt > statusAt && escAt > confAt && finAt > escAt);
  });

  it("14–17. Module 9 APA / Doc / Format / Upload chunking", () => {
    const apa = readSrc("components/module9/ModuleNineApaLesson.jsx");
    assert.match(apa, /RHYTHM_PAGE_CLASS/);
    assert.match(apa, /RHYTHM_PROSE_CLASS/);
    assert.match(apa, /data-rhythm-chunk="apa-teaching"/);
    assert.match(apa, /data-rhythm-chunk="apa-visual"/);
    assert.match(apa, /data-rhythm-chunk="apa-practice"/);
    assert.match(apa, /data-rhythm-chunk="apa-feedback"/);
    assert.match(apa, /data-rhythm-chunk="apa-actions"/);

    const m9 = readSrc("components/ModuleNine.js");
    assert.match(m9, /data-rhythm-chunk="doc-recovery"/);
    assert.match(m9, /data-rhythm-chunk="doc-reference"/);
    assert.match(m9, /module9-format-checklist-work/);
    assert.match(m9, /data-rhythm-chunk="format-checklist"/);
    assert.match(m9, /RHYTHM_PAGE_CLASS/);
    // WP-061: download chunk uses instruction-role surface (card padding retained).
    assert.match(m9, /role-instruction|RHYTHM_INSTRUCTION_CARD_CLASS/);
    assert.match(m9, /module9-upload-working-set/);
    assert.match(m9, /data-rhythm-chunk="download"/);
    assert.match(m9, /data-rhythm-chunk="upload-coaching"/);
    assert.match(m9, /data-rhythm-chunk="file-select"/);
    assert.match(m9, /data-rhythm-chunk="selected-file"/);
    assert.match(m9, /data-rhythm-chunk="final-checklist"/);
    assert.match(m9, /data-rhythm-chunk="upload-action"/);
    assert.match(m9, /module9-final-upload-checklist/);
    assert.match(m9, /not the Step 3 APA formatting checklist/);

    const recoveryAt = m9.indexOf('data-rhythm-chunk="doc-recovery"');
    const referenceAt = m9.indexOf('data-rhythm-chunk="doc-reference"');
    assert.ok(recoveryAt > 0 && referenceAt > recoveryAt);

    const downloadAt = m9.indexOf('data-rhythm-chunk="download"');
    const fileAt = m9.indexOf('data-rhythm-chunk="file-select"');
    const selectedAt = m9.indexOf('data-rhythm-chunk="selected-file"');
    const finalAt = m9.indexOf('data-rhythm-chunk="final-checklist"');
    const uploadAt = m9.indexOf('data-rhythm-chunk="upload-action"');
    assert.ok(
      downloadAt > 0 &&
        fileAt > downloadAt &&
        selectedAt > fileAt &&
        finalAt > selectedAt &&
        uploadAt > finalAt
    );
  });

  it("18–20. WP-054 always-visible content stayed visible; no extra layers; nesting ≤2", () => {
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
    for (const row of WP054_DENSITY_MATRIX) {
      assert.ok(Array.isArray(row.preWorkLayers));
    }

    const m9 = readSrc("components/ModuleNine.js");
    // Required upload coaching remains outside collapsed-only paths
    assert.match(m9, /Download your Google Doc as a PDF/);
    assert.match(m9, /Upload your PDF/);
    assert.match(m9, /Confirm this PDF before you upload/);
    assert.match(m9, /module9-pdf-file-input/);

    for (const row of getWp060RankedTopTen()) {
      assert.ok(row.nestedCardDepth <= 2);
      assert.ok(row.visibleTopLevelBlocks >= 4);
    }
  });

  it("21–23. no empty instructional cards; work before criteria/actions; mobile-safe classes", () => {
    const disclosure = readSrc("components/shared/InstructionalDisclosure.jsx");
    assert.match(disclosure, /if \(!hasContent\) return null/);

    const m7 = readSrc("components/ModuleSeven.js");
    const workAt = m7.indexOf('data-rhythm-chunk="textarea"');
    const criteriaAt = m7.indexOf('data-rhythm-chunk="criteria"');
    const actionsAt = m7.indexOf('data-rhythm-chunk="actions"');
    assert.ok(workAt > 0 && criteriaAt > workAt && actionsAt > criteriaAt);

    const m9 = readSrc("components/ModuleNine.js");
    assert.match(m9, /RHYTHM_MOBILE_SAFE_CLASS/);
    assert.doesNotMatch(RHYTHM_INSTRUCTION_CARD_CLASS, /px-10|px-12|py-10/);
    assert.match(RHYTHM_INSTRUCTION_CARD_CLASS, /px-4/);
  });

  it("24. WP-048–059 protection hooks remain present", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    const m8 = readSrc("components/ModuleEight.js");
    const m9 = readSrc("components/ModuleNine.js");

    assert.match(frame, /ScreenContractCues/);
    assert.match(frame, /ModuleModeCue/);
    assert.match(m6, /TaskRelevantArtifacts|WorkingNotebookCurrentPage|selectTaskRelevantArtifacts/);
    assert.match(m6, /SuccessCriteriaPanel/);
    assert.match(m7, /SuccessCriteriaPanel/);
    assert.match(m7, /ModuleSevenReadAloudObservation/);
    assert.match(m8, /SubmissionDocRecoveryPanel/);
    assert.match(m8, /HIERARCHY_ACTION_PRIMARY_CLASS|HIERARCHY_ACTION_FINAL_CLASS/);
    assert.match(m9, /InstructionalDisclosure/);
    assert.match(m9, /ModuleNineApaQuickGuide/);

    assert.equal(existsSync(join(root, "lib/ui/hierarchyContract.js")), true);
    assert.equal(existsSync(join(root, "lib/ui/progressiveDisclosureContract.js")), true);
    assert.equal(existsSync(join(root, "lib/ui/workingNotebook.js")), true);
    assert.equal(existsSync(join(root, "lib/ui/buildForwardContract.js")), true);
    assert.equal(existsSync(join(root, "lib/ui/modulePsychologicalModes.js")), true);
  });

  it("25. no Module 3 file is part of the WP-060 implementation", () => {
    const paths = [
      "lib/ui/instructionalRhythmContract.js",
      "components/module6/ModuleSixStepFrame.jsx",
      "components/ModuleSix.js",
      "components/ModuleSeven.js",
      "components/ModuleEight.js",
      "components/ModuleNine.js",
      "components/module9/ModuleNineApaLesson.jsx",
      "tests/wp060-instructional-rhythm.test.js",
    ];
    for (const p of paths) {
      assert.doesNotMatch(p, /module3\/|ModuleThree/);
      assert.equal(existsSync(join(root, p)), true, `missing ${p}`);
    }
    assert.equal(existsSync(join(root, "components/shared/InstructionalChunk.jsx")), false);
  });
});
