/**
 * WP-051 — Visible success criteria near forward actions (Modules 6–9).
 *
 * Forward-action audit matrix (Phase A): each Continue/Keep going/Finish/Upload
 * maps to substantive criteria, an existing checklist, a verified/mechanical gate,
 * or a proportionate micro-practice condition.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getModule6ReviewPresentation,
  getModule6StepPresentation,
  SECTION_TYPES,
} from "../components/module6/module6StepPresentation.js";
import {
  getModule7StepPresentation,
  MODULE7_STEP_TYPES,
} from "../components/module7/module7StepPresentation.js";
import { MODULE8_READY_CONFIDENCE_ITEMS } from "../components/module8/module8StepPresentation.js";
import { pickVisibleFinished } from "../components/shared/screenContractHelpers.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const VAGUE_ONLY =
  /\b(good|strong|enough|finished)\b(?!\s+(essay|writing|prose|paragraph|section|closing|thought|claim))/i;

/** Complete Modules 6–9 forward-action audit matrix. */
export const WP051_FORWARD_ACTION_MATRIX = Object.freeze([
  {
    id: "m6-intro-keep-going",
    module: 6,
    action: "Keep going",
    kind: "substantive",
    getItems: () =>
      getModule6StepPresentation({ type: SECTION_TYPES.INTRO }, { body: [{}] })
        .successLooksLike,
  },
  {
    id: "m6-body-keep-going",
    module: 6,
    action: "Keep going",
    kind: "substantive",
    getItems: () =>
      getModule6StepPresentation(
        { type: SECTION_TYPES.BODY, bodyIndex: 0 },
        { body: [{ point: "Credibility", job: "prove" }] }
      ).successLooksLike,
  },
  {
    id: "m6-conclusion-keep-going",
    module: 6,
    action: "Keep going",
    kind: "substantive",
    getItems: () =>
      getModule6StepPresentation({ type: SECTION_TYPES.CONCLUSION }, { body: [] })
        .successLooksLike,
  },
  {
    id: "m6-review-finish",
    module: 6,
    action: "Finish draft and continue",
    kind: "substantive",
    getItems: () => getModule6ReviewPresentation().successLooksLike,
  },
  {
    id: "m7-read-aloud-keep-going",
    module: 7,
    action: "Keep going",
    kind: "substantive",
    getItems: () =>
      getModule7StepPresentation({ type: MODULE7_STEP_TYPES.READ_ALOUD }, {
        body: [],
      }).successLooksLike,
  },
  {
    id: "m7-intro-keep-going",
    module: 7,
    action: "Keep going",
    kind: "substantive",
    getItems: () =>
      getModule7StepPresentation({ type: SECTION_TYPES.INTRO }, { body: [{}] })
        .successLooksLike,
  },
  {
    id: "m7-body-keep-going",
    module: 7,
    action: "Keep going",
    kind: "substantive",
    getItems: () =>
      getModule7StepPresentation(
        { type: SECTION_TYPES.BODY, bodyIndex: 0 },
        { body: [{ bucket: "Credibility" }] }
      ).successLooksLike,
  },
  {
    id: "m7-conclusion-keep-going",
    module: 7,
    action: "Keep going",
    kind: "substantive",
    getItems: () =>
      getModule7StepPresentation({ type: SECTION_TYPES.CONCLUSION }, { body: [] })
        .successLooksLike,
  },
  {
    id: "m7-final-finish",
    module: 7,
    action: "Finish revising and continue",
    kind: "substantive",
    getItems: () =>
      getModule7StepPresentation({ type: MODULE7_STEP_TYPES.FINAL_REVIEW }, {
        body: [],
      }).successLooksLike,
  },
  {
    id: "m8-create-keep-going",
    module: 8,
    action: "Keep going",
    kind: "verified_gate",
    evidence:
      "docVerifiedThisSession — SuccessCriteriaPanel gate + WP-030 verification",
  },
  {
    id: "m8-format-keep-going",
    module: 8,
    action: "Keep going",
    kind: "existing_checklist",
    evidence: "APA formatting checklist (checklistComplete)",
  },
  {
    id: "m8-ready-finish",
    module: 8,
    action: "Finish preparing your essay and continue",
    kind: "existing_checklist",
    evidence: "Ready confidence checklist + verified Doc + APA checklist",
    checklistItems: MODULE8_READY_CONFIDENCE_ITEMS,
  },
  {
    id: "m9-apa-continue",
    module: 9,
    action: "Continue / Finish these APA moves",
    kind: "micro",
    evidence: "Choose answer + read teaching feedback (canContinueApaConcept)",
  },
  {
    id: "m9-doc-continue",
    module: 9,
    action: "Continue after Doc verification",
    kind: "verified_gate",
    evidence: "docReady / verification + recovery Continue",
  },
  {
    id: "m9-format-continue",
    module: 9,
    action: "Continue to download and submit",
    kind: "existing_checklist",
    evidence: "Step 3 APA checklist (checklistComplete)",
  },
  {
    id: "m9-upload-final",
    module: 9,
    action: "Upload Final PDF",
    kind: "existing_checklist",
    evidence: "Step 4 FINAL_UPLOAD_CHECKLIST_ITEMS (5 local checks) + canUpload",
  },
]);

describe("WP-051 visible success criteria (Modules 6–9)", () => {
  it("audit matrix covers every Modules 6–9 forward action class", () => {
    for (const module of [6, 7, 8, 9]) {
      const rows = WP051_FORWARD_ACTION_MATRIX.filter((row) => row.module === module);
      assert.ok(rows.length >= 3, `module ${module} needs forward actions`);
    }
    const kinds = new Set(WP051_FORWARD_ACTION_MATRIX.map((row) => row.kind));
    assert.ok(kinds.has("substantive"));
    assert.ok(kinds.has("existing_checklist"));
    assert.ok(kinds.has("verified_gate"));
    assert.ok(kinds.has("micro"));
  });

  it("substantive actions expose 3–5 observable criteria", () => {
    for (const row of WP051_FORWARD_ACTION_MATRIX.filter(
      (item) => item.kind === "substantive"
    )) {
      const items = row.getItems();
      assert.ok(
        items.length >= 3 && items.length <= 5,
        `${row.id} needs 3–5 criteria, got ${items.length}`
      );
      for (const item of items) {
        assert.ok(String(item).trim().length > 12, `${row.id} too short: ${item}`);
        assert.equal(
          VAGUE_ONLY.test(item) && !/\b(prose|recording|thesis|paragraph|section|observation|strategy)\b/i.test(item),
          false,
          `${row.id} looks vague-only: ${item}`
        );
      }
    }
  });

  it("Module 6 review criteria expanded beyond a single summary line", () => {
    const items = getModule6ReviewPresentation().successLooksLike;
    assert.ok(items.length >= 3);
    assert.ok(items.some((item) => /Introduction has prose/i.test(item)));
    assert.ok(items.some((item) => /body paragraph/i.test(item)));
    assert.ok(items.some((item) => /Conclusion has prose/i.test(item)));
  });

  it("Module 7 read-aloud criteria align with recording + observation gates", () => {
    const items = getModule7StepPresentation(
      { type: MODULE7_STEP_TYPES.READ_ALOUD },
      { body: [] }
    ).successLooksLike;
    assert.ok(items.some((item) => /recording/i.test(item)));
    assert.ok(items.some((item) => /observation|noticed/i.test(item)));
    const gateSrc = readSrc("lib/module7/module7ReadAloudObservation.js");
    assert.ok(gateSrc.includes("need_recording"));
    assert.ok(gateSrc.includes("need_observation"));
  });

  it("Module 6 and 7 place SuccessCriteriaPanel before forward actions", () => {
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    assert.ok(m6.includes("SuccessCriteriaPanel"));
    assert.ok(m7.includes("SuccessCriteriaPanel"));
    assert.ok(m6.includes("deferSuccessCriteria"));
    assert.ok(m7.includes("deferSuccessCriteria"));
    const m6Panel = m6.indexOf("<SuccessCriteriaPanel");
    const m6Keep = m6.indexOf('data-hierarchy-action="primary"');
    const m6Finish = m6.indexOf('data-hierarchy-action="final"');
    assert.ok(m6Panel >= 0 && m6Panel < m6Keep && m6Panel < m6Finish);
    const m7Panel = m7.indexOf("<SuccessCriteriaPanel");
    const m7Keep = m7.indexOf('data-hierarchy-action="primary"');
    assert.ok(m7Panel >= 0 && m7Panel < m7Keep);
  });

  it("Module 8–9 reuse existing checklists instead of duplicating them", () => {
    const m8 = readSrc("components/ModuleEight.js");
    const m9 = readSrc("components/ModuleNine.js");
    const panel = readSrc("components/shared/SuccessCriteriaPanel.jsx");
    assert.ok(panel.includes('data-testid="success-criteria-panel"'));
    assert.ok(m8.includes("MODULE8_READY_CONFIDENCE_ITEMS") || m8.includes("confidence"));
    assert.ok(m8.includes("checklistComplete"));
    assert.ok(m8.includes('mode="gate"'));
    assert.equal(
      (m8.match(/<SuccessCriteriaPanel/g) || []).length,
      1,
      "Module 8 should only clarify Create verified gate, not duplicate Format/Ready checklists"
    );
    assert.ok(m9.includes("FINAL_UPLOAD_CHECKLIST_ITEMS"));
    assert.ok(m9.includes("checklistComplete"));
    assert.equal(m9.includes("<SuccessCriteriaPanel"), false);
    const lesson = readSrc("components/module9/ModuleNineApaLesson.jsx");
    assert.ok(lesson.includes("SuccessCriteriaPanel"));
    assert.ok(lesson.includes('mode="micro"'));
  });

  it("WP-048 cue remains a one-line summary while detailed panel can show the full set", () => {
    const review = getModule6ReviewPresentation();
    const finished = pickVisibleFinished(review.successLooksLike);
    assert.ok(finished);
    assert.ok(review.successLooksLike.length > 1);
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    assert.ok(frame.includes("deferSuccessCriteria"));
    assert.ok(frame.includes("ScreenContractCues"));
  });

  it("preserves WP-050 hierarchy markers and existing gates/handlers", () => {
    const panel = readSrc("components/shared/SuccessCriteriaPanel.jsx");
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    const m8 = readSrc("components/ModuleEight.js");
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(panel.includes("data-hierarchy-level"));
    assert.ok(m6.includes("atomicWriteModule6Draft") || m6.includes("finalize"));
    assert.ok(m7.includes("evaluateReadAloudAdvanceGate"));
    assert.ok(m8.includes("verifySubmissionGoogleDocContent"));
    assert.ok(m8.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m9.includes("canUpload"));
    assert.ok(m9.includes("/api/final-pdf"));
    assert.ok(m6.includes('data-testid="screen-contract-task"') || readSrc("components/module6/ModuleSixStepFrame.jsx").includes("screen-contract-task"));
    assert.ok(m6.includes("TaskRelevantArtifacts"));
  });
});
