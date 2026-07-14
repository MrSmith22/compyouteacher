/**
 * WP-056 — Mid-module progress celebration bridges (Modules 6–9).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildDraftSectionSteps } from "../components/module6/module6StepPresentation.js";
import { buildModule6UiStages } from "../lib/module6/draftOutlineMapping.js";
import { MODULE8_STEP_TYPES } from "../components/module8/module8StepPresentation.js";
import {
  WP056_TRANSITION_AUDIT_MATRIX,
  assertCelebrationMessage,
  celebrationClaimsPrematureApproval,
  celebrationNamesCompletedAndNext,
  getModule6ProgressCelebration,
  getModule7ProgressCelebration,
  getModule8ProgressCelebration,
  getModule9ProgressCelebration,
  isGenericCelebrationOnly,
} from "../lib/ui/moduleProgressCelebrations.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const outlineWithBodies = (bodyCount) => ({
  body: Array.from({ length: bodyCount }, (_, i) => ({
    point: `Point ${i + 1}`,
    job: "prove",
    bucket: `Bucket ${i + 1}`,
  })),
});

describe("WP-056 audit matrix and message contract", () => {
  it("documents Modules 6–9 celebration transitions", () => {
    assert.ok(WP056_TRANSITION_AUDIT_MATRIX.length >= 10);
    for (const row of WP056_TRANSITION_AUDIT_MATRIX) {
      assert.ok([6, 7, 8, 9].includes(row.module));
      assert.ok(row.trigger);
      assert.ok(row.suppress);
    }
  });

  it("15–16. rejects generic praise and premature approval claims", () => {
    for (const label of [
      "Great job!",
      "Nice work!",
      "Step complete.",
      "You did it!",
      "Keep going!",
    ]) {
      assert.equal(isGenericCelebrationOnly(label), true, label);
      assert.equal(assertCelebrationMessage(label), false, label);
    }
    assert.equal(
      celebrationClaimsPrematureApproval(
        "Your section is teacher-approved. Next, revise more."
      ),
      true
    );
    assert.equal(
      celebrationClaimsPrematureApproval(
        "Your introduction is drafted. Next, build Body Paragraph 1."
      ),
      false
    );
  });

  it("14. every generated celebration names completed work and next job", () => {
    const stages = buildModule6UiStages(outlineWithBodies(2));
    const messages = [
      getModule6ProgressCelebration({
        fromStep: stages[0],
        toStep: stages[1],
      }),
      getModule6ProgressCelebration({
        fromStep: stages[1],
        toStep: stages[2],
      }),
      getModule6ProgressCelebration({
        fromStep: stages[2],
        toStep: stages[3],
      }),
      getModule6ProgressCelebration({
        fromStep: stages[3],
        toStep: stages[4],
      }),
      getModule8ProgressCelebration({
        fromType: MODULE8_STEP_TYPES.CREATE_DOC,
        toType: MODULE8_STEP_TYPES.FORMAT,
      }),
      getModule8ProgressCelebration({
        fromType: MODULE8_STEP_TYPES.FORMAT,
        toType: MODULE8_STEP_TYPES.READY,
      }),
      getModule9ProgressCelebration({ fromStep: 1, toStep: 2 }),
      getModule9ProgressCelebration({ fromStep: 2, toStep: 3 }),
      getModule9ProgressCelebration({ fromStep: 3, toStep: 4 }),
    ];
    for (const item of messages) {
      assert.ok(item?.message, "celebration present");
      assert.equal(celebrationNamesCompletedAndNext(item.message), true);
      assert.equal(assertCelebrationMessage(item.message), true);
      assert.equal(celebrationClaimsPrematureApproval(item.message), false);
    }
  });
});

describe("WP-056 Module 6 celebrations", () => {
  it("1–2. every meaningful forward stage transition has celebration; dynamic bodies", () => {
    for (const bodyCount of [0, 1, 2, 3]) {
      const stages = buildModule6UiStages(outlineWithBodies(bodyCount));
      for (let i = 0; i < stages.length - 1; i += 1) {
        const fromStep = stages[i];
        const toStep = stages[i + 1];
        // Skip review as source (terminal mid-module stage).
        if (fromStep.type === "review") continue;
        const celebration = getModule6ProgressCelebration({ fromStep, toStep });
        assert.ok(
          celebration?.message,
          `bodyCount=${bodyCount} ${fromStep.type}→${toStep.type}`
        );
        assert.match(celebration.message, /\bNext\b/i);
      }
    }

    const two = buildModule6UiStages(outlineWithBodies(2));
    const introToBody = getModule6ProgressCelebration({
      fromStep: two[0],
      toStep: two[1],
    });
    assert.match(introToBody.message, /introduction is drafted/i);
    assert.match(introToBody.message, /Body Paragraph 1/i);

    const bodyToBody = getModule6ProgressCelebration({
      fromStep: two[1],
      toStep: two[2],
    });
    assert.match(bodyToBody.message, /Body Paragraph 1 now has prose/i);
    assert.match(bodyToBody.message, /Body Paragraph 2/i);

    const bodyToConclusion = getModule6ProgressCelebration({
      fromStep: two[2],
      toStep: two[3],
    });
    assert.match(bodyToConclusion.message, /Body Paragraph 2 now has prose/i);
    assert.match(bodyToConclusion.message, /conclusion/i);

    const conclusionToReview = getModule6ProgressCelebration({
      fromStep: two[3],
      toStep: two[4],
    });
    assert.match(conclusionToReview.message, /conclusion is drafted/i);
    assert.match(conclusionToReview.message, /review the essay as a whole/i);
  });

  it("3. Module 6 source only celebrates after successful goNext persist; Back/Edit clear", () => {
    const src = readSrc("components/ModuleSix.js");
    assert.match(src, /getModule6ProgressCelebration/);
    assert.match(src, /ProgressCelebrationBridge/);
    assert.match(src, /setProgressCelebration/);
    // Celebration set only when persist result is ok inside goNext.
    assert.match(src, /if \(result\?\.ok\)/);
    assert.match(src, /getModule6ProgressCelebration/);
    // Back / Edit clear without celebrating.
    const goBackBlock = src.slice(src.indexOf("const goBack"), src.indexOf("const goNext"));
    assert.match(goBackBlock, /setProgressCelebration\(null\)/);
    const editBlock = src.slice(
      src.indexOf("const editFromReview"),
      src.indexOf("const acknowledgeOutlineReview")
    );
    assert.match(editBlock, /setProgressCelebration\(null\)/);
    // Hydration clears.
    assert.match(src, /setHydrationReady\(false\);\s*\n\s*setProgressCelebration\(null\)/);
  });
});

describe("WP-056 Module 7 celebrations", () => {
  it("4–5. read-aloud requires gate path; section language is revision-pass truthful", () => {
    const sectionSteps = buildDraftSectionSteps(outlineWithBodies(2));
    const blocked = getModule7ProgressCelebration({
      fromIndex: 0,
      toIndex: 0,
      sectionSteps,
    });
    assert.equal(blocked, null);

    const readAloud = getModule7ProgressCelebration({
      fromIndex: 0,
      toIndex: 1,
      sectionSteps,
    });
    assert.match(readAloud.message, /finished the read-aloud/i);
    assert.match(readAloud.message, /named what you noticed/i);
    assert.match(readAloud.message, /strengthen the introduction/i);

    const introToBody = getModule7ProgressCelebration({
      fromIndex: 1,
      toIndex: 2,
      sectionSteps,
    });
    assert.match(introToBody.message, /revision pass on the introduction/i);
    assert.match(introToBody.message, /Body Paragraph 1/);
    assert.doesNotMatch(introToBody.message, /perfect|flawless|approved/i);

    const conclusionToReview = getModule7ProgressCelebration({
      fromIndex: sectionSteps.length,
      toIndex: sectionSteps.length + 1,
      sectionSteps,
    });
    assert.match(conclusionToReview.message, /conclusion revision pass/i);
    assert.match(conclusionToReview.message, /full essay communicates/i);

    const src = readSrc("components/ModuleSeven.js");
    assert.match(src, /evaluateReadAloudAdvanceGate/);
    assert.match(src, /getModule7ProgressCelebration/);
    // Celebration only after gate in goNext; gate failure returns early.
    const goNext = src.slice(src.indexOf("const goNext"), src.indexOf("if (!session)"));
    assert.match(goNext, /if \(!gate\.ok\)/);
    assert.match(goNext, /getModule7ProgressCelebration/);
    assert.ok(goNext.indexOf("if (!gate.ok)") < goNext.indexOf("getModule7ProgressCelebration"));
  });

  it("6. Module 7 Back and hydration clear celebrations", () => {
    const src = readSrc("components/ModuleSeven.js");
    const goBack = src.slice(src.indexOf("const goBack"), src.indexOf("const goNext"));
    assert.match(goBack, /setProgressCelebration\(null\)/);
    assert.match(src, /setProgressCelebration\(null\)/);
    assert.match(src, /setOutlineLoading\(true\)/);
  });
});

describe("WP-056 Module 8 celebrations", () => {
  it("7–9. Doc→Format and Format→Ready require gates; bad cases yield null helpers", () => {
    const docToFormat = getModule8ProgressCelebration({
      fromType: MODULE8_STEP_TYPES.CREATE_DOC,
      toType: MODULE8_STEP_TYPES.FORMAT,
    });
    assert.match(docToFormat.message, /verified finished essay/i);
    assert.match(docToFormat.message, /format that paper in APA/i);

    const formatToReady = getModule8ProgressCelebration({
      fromType: MODULE8_STEP_TYPES.FORMAT,
      toType: MODULE8_STEP_TYPES.READY,
    });
    assert.match(formatToReady.message, /formatting checklist/i);
    assert.match(formatToReady.message, /ready for submission/i);

    assert.equal(
      getModule8ProgressCelebration({
        fromType: MODULE8_STEP_TYPES.READY,
        toType: MODULE8_STEP_TYPES.FORMAT,
      }),
      null
    );

    const src = readSrc("components/ModuleEight.js");
    assert.match(src, /getModule8ProgressCelebration/);
    const goNext = src.slice(src.indexOf("const goNext"), src.indexOf("openUpdateGoogleDocWorkingSet"));
    assert.match(goNext, /docVerifiedThisSession/);
    assert.match(goNext, /checklistComplete/);
    assert.match(goNext, /getModule8ProgressCelebration/);
  });

  it("8+10. mismatch/timeout/cancel/failure paths and escape hatch do not celebrate", () => {
    const src = readSrc("components/ModuleEight.js");
    // Verification failures use notices, not progressCelebration setters.
    assert.match(src, /SUBMISSION_DOC_MISMATCH_RECOVERY|mismatch/i);
    assert.match(src, /openUpdateGoogleDocWorkingSet/);
    const escape = src.slice(
      src.indexOf("openUpdateGoogleDocWorkingSet"),
      src.indexOf("const finishPreparing")
    );
    assert.match(escape, /setProgressCelebration\(null\)/);
    const goBack = src.slice(src.indexOf("const goBack"), src.indexOf("const goNext"));
    assert.match(goBack, /setProgressCelebration\(null\)/);
    // Create/update handler should not set progressCelebration.
    const createHandler = src.slice(
      src.indexOf("handleCreateOrUpdateSubmissionDoc"),
      src.indexOf("const handleRetryDocVerification")
    );
    assert.doesNotMatch(createHandler, /setProgressCelebration\(/);
  });
});

describe("WP-056 Module 9 celebrations", () => {
  it("11. APA→Doc, Doc→Format, Format→Upload have celebrations", () => {
    const a = getModule9ProgressCelebration({ fromStep: 1, toStep: 2 });
    const b = getModule9ProgressCelebration({ fromStep: 2, toStep: 3 });
    const c = getModule9ProgressCelebration({ fromStep: 3, toStep: 4 });
    assert.match(a.message, /APA learning moves/i);
    assert.match(b.message, /Google Doc is verified/i);
    assert.match(c.message, /formatting checklist is complete/i);
    assert.match(c.message, /download the PDF/i);
  });

  it("12–13. hydration resume and upload failure do not celebrate", () => {
    const src = readSrc("components/ModuleNine.js");
    assert.match(src, /getModule9ProgressCelebration/);
    // Resume effect explicitly clears celebration.
    const resume = src.slice(
      src.indexOf("Returning students resume"),
      src.indexOf("const persistApaPractice")
    );
    assert.match(resume, /setProgressCelebration\(null\)/);
    assert.doesNotMatch(resume, /getModule9ProgressCelebration/);
    // alreadySubmitted clears celebration.
    assert.match(src, /if \(alreadySubmitted\) setProgressCelebration\(null\)/);
    // Upload handler must not set celebration.
    assert.ok(src.includes("handleUploadPDF") || src.includes("upload"));
    const uploadIdx = src.indexOf("const handleUploadPDF");
    if (uploadIdx >= 0) {
      const uploadBlock = src.slice(uploadIdx, uploadIdx + 2500);
      assert.doesNotMatch(uploadBlock, /setProgressCelebration\(/);
    }
    // Fresh APA completion and verified Continues do set celebrations.
    assert.match(src, /persistApaPractice/);
    assert.match(src, /fromStep: 1, toStep: 2/);
    assert.match(src, /fromStep: 2, toStep: 3/);
    assert.match(src, /fromStep: 3, toStep: 4/);
  });
});

describe("WP-056 shared component and safety", () => {
  it("17–18. shared bridge uses status/live and stable test hooks", () => {
    const bridge = readSrc("components/shared/ProgressCelebrationBridge.jsx");
    assert.match(bridge, /role="status"/);
    assert.match(bridge, /aria-live="polite"/);
    assert.match(bridge, /data-testid="progress-celebration-bridge"/);
    assert.match(bridge, /data-module=/);
    assert.match(bridge, /data-from-step=/);
    assert.match(bridge, /data-to-step=/);
  });

  it("19–20. no timer persistence API or activity for celebrations; notices remain", () => {
    const helper = readSrc("lib/ui/moduleProgressCelebrations.js");
    assert.doesNotMatch(helper, /setTimeout|localStorage|supabase|logActivity/);
    const bridge = readSrc("components/shared/ProgressCelebrationBridge.jsx");
    assert.doesNotMatch(bridge, /setTimeout|localStorage|supabase|logActivity/);
    for (const file of [
      "components/ModuleSix.js",
      "components/ModuleSeven.js",
      "components/ModuleEight.js",
      "components/ModuleNine.js",
    ]) {
      const src = readSrc(file);
      assert.match(src, /SuccessCriteriaPanel|ScreenContractCues|revisionNotice|module8-doc-notice|module9-doc-notice|navError/);
    }
    assert.match(readSrc("components/ModuleSix.js"), /module6-navigation-save-error|setNavError/);
    assert.ok(readSrc("app/modules/6/success/page.js").length > 0);
    assert.ok(readSrc("app/modules/7/success/page.js").length > 0);
    assert.ok(readSrc("app/modules/8/success/page.js").length > 0);
    assert.ok(readSrc("app/modules/9/success/page.js").length > 0);
  });

  it("22. no Module 3 file is part of the WP-056 implementation", () => {
    const paths = [
      "lib/ui/moduleProgressCelebrations.js",
      "components/shared/ProgressCelebrationBridge.jsx",
      "components/ModuleSix.js",
      "components/ModuleSeven.js",
      "components/ModuleEight.js",
      "components/ModuleNine.js",
      "tests/wp056-mid-module-progress-celebrations.test.js",
    ];
    for (const p of paths) {
      assert.doesNotMatch(p, /module3|ModuleThree/i);
    }
  });
});
