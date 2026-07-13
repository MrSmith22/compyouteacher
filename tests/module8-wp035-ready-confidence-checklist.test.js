/**
 * WP-035 — Module 8 Ready-step confidence checklist (separate from APA checklist).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  MODULE8_READY_CONFIDENCE_ITEMS,
  MODULE8_FORMAT_CHANGE_CATEGORIES,
  MODULE8_STEP_TYPES,
  MODULE8_WORKSPACE_STEPS,
  getModule8StepPresentation,
} from "../components/module8/module8StepPresentation.js";
import {
  getSubmissionDocRecoveryPlan,
  SUBMISSION_DOC_RECOVERY_ACTIONS,
} from "../lib/exports/submissionDocRecovery.js";
import {
  buildSubmissionDocSuccessConfirmation,
  SUBMISSION_DOC_READY_FOR_FORMATTING,
} from "../lib/exports/submissionDocSuccessConfirmation.js";
import { SUBMISSION_DOC_VERIFICATION_STATUS } from "../lib/exports/submissionDocVerification.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-035 Module 8 Ready confidence checklist", () => {
  it("shows exactly five Before continuing confirmations on the Ready step", () => {
    assert.equal(MODULE8_READY_CONFIDENCE_ITEMS.length, 5);
    assert.deepEqual([...MODULE8_READY_CONFIDENCE_ITEMS], [
      "My newest essay appears.",
      "My title page is correct.",
      "My references page is complete.",
      "Everything is double spaced.",
      "The paper looks the way I expect.",
    ]);

    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes('data-testid="module8-ready-confidence-checklist"'));
    assert.ok(m8.includes("Before continuing"));
    assert.ok(m8.includes("MODULE8_READY_CONFIDENCE_ITEMS.map"));
    assert.ok(
      m8.includes("These checks do not submit your paper")
    );

    const readyIdx = m8.indexOf("MODULE8_STEP_TYPES.READY");
    const confidenceIdx = m8.indexOf(
      'data-testid="module8-ready-confidence-checklist"'
    );
    const finishBtnIdx = m8.indexOf('data-testid="module8-finish-prepare"');
    assert.ok(confidenceIdx > readyIdx);
    assert.ok(finishBtnIdx > confidenceIdx);
  });

  it("keeps confidence items separate from the six-item APA CHECKLIST_ITEMS", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes("const CHECKLIST_ITEMS = ["));
    assert.ok(m8.includes("MODULE8_READY_CONFIDENCE_ITEMS"));
    assert.ok(m8.includes("confidenceState"));
    assert.ok(m8.includes("checklistState"));

    for (const item of MODULE8_READY_CONFIDENCE_ITEMS) {
      assert.ok(
        !m8.includes(`"${item}"`),
        `confidence item should not be hardcoded in CHECKLIST_ITEMS: ${item}`
      );
    }

    assert.equal(MODULE8_FORMAT_CHANGE_CATEGORIES.length, 6);
    assert.notEqual(
      MODULE8_READY_CONFIDENCE_ITEMS.join("|"),
      MODULE8_FORMAT_CHANGE_CATEGORIES.join("|")
    );
  });

  it("gates Finish on confidence plus verified Doc and APA checklist", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes("confidenceComplete = confidenceState.every(Boolean)"));
    assert.match(
      m8,
      /canFinish\s*=\s*[\s\S]*?docVerifiedThisSession[\s\S]*?submissionDocUrl[\s\S]*?checklistComplete[\s\S]*?confidenceComplete/
    );
    assert.ok(m8.includes("disabled={!canFinish}"));
    assert.ok(m8.includes('data-testid="module8-finish-prepare"'));

    // Handler cannot bypass the confidence gate.
    const handlerStart = m8.indexOf("const finishPreparing = async");
    const handlerEnd = m8.indexOf("navigatedToSuccessRef.current = true", handlerStart);
    const handler = m8.slice(handlerStart, handlerEnd);
    assert.ok(handler.includes("!confidenceComplete"));
    assert.ok(handler.includes("!checklistComplete"));
    assert.ok(handler.includes("!docVerifiedThisSession"));
    assert.ok(handler.includes("return;"));

    // Previously finalized revisit lands on Ready (not success) until confidence completes.
    assert.ok(
      m8.includes("setCurrentStepIndex(MODULE8_WORKSPACE_STEPS.length - 1)")
    );
    assert.ok(
      !/previouslyFinalized[\s\S]{0,400}router\.push\("\/modules\/8\/success"\)/.test(
        m8
      )
    );
  });

  it("explains the checks do not submit and keeps Ready presentation compact", () => {
    const ready = getModule8StepPresentation(
      MODULE8_WORKSPACE_STEPS.find((s) => s.type === MODULE8_STEP_TYPES.READY)
    );
    assert.match(ready.workingSetDescription, /do not submit/i);
    assert.match(ready.workingSetDescription, /Module 9/i);

    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes("What is one formatting choice you made that helps your reader?"));
    assert.ok(!m8.includes("Am I submitting the newest essay?"));
    assert.ok(!m8.includes("module9-upload"));
  });

  it("preserves WP-030–034 recovery, buttons, success metadata, framing, and APA coaching", () => {
    const mismatch = getSubmissionDocRecoveryPlan({
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH,
      hasUrl: true,
      contentVerified: false,
      requireSessionWrite: true,
    });
    assert.equal(mismatch.primaryAction, SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE);

    const confirmation = buildSubmissionDocSuccessConfirmation({
      operation: "updated",
      verification: {
        verified: true,
        expectedWordCount: 80,
        status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED,
      },
      completedAt: "2026-07-13T23:30:00.000Z",
    });
    assert.equal(confirmation.statusLabel, SUBMISSION_DOC_READY_FOR_FORMATTING);

    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m8.includes("showFooterKeepGoing"));
    assert.ok(m8.includes('data-testid="module8-submission-doc-framing"'));
    assert.ok(m8.includes('data-testid="module8-format-what-apa-does"'));
    assert.ok(m8.includes("CHECKLIST_ITEMS.map"));
    assert.ok(m8.includes("result.confirmation"));
  });
});
