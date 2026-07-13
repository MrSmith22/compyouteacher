/**
 * WP-034 — Module 8 APA formatting how/why coaching.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getModule8StepPresentation,
  MODULE8_FORMAT_APA_DOES,
  MODULE8_FORMAT_CHANGE_CATEGORIES,
  MODULE8_STEP_TYPES,
  MODULE8_WORKSPACE_STEPS,
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

const FORMAT_STEP = MODULE8_WORKSPACE_STEPS.find(
  (s) => s.type === MODULE8_STEP_TYPES.FORMAT
);

describe("WP-034 Module 8 APA formatting coaching", () => {
  it("shows how/why coaching before the checklist in source order", () => {
    const m8 = readSrc("components/ModuleEight.js");
    const doesIdx = m8.indexOf('data-testid="module8-format-what-apa-does"');
    const changeIdx = m8.indexOf('data-testid="module8-format-what-you-change"');
    const checklistIdx = m8.indexOf('data-testid="module8-format-checklist"');
    const continueIdx = m8.indexOf('data-testid="module8-format-continue-cue"');

    assert.ok(doesIdx > 0);
    assert.ok(changeIdx > doesIdx);
    assert.ok(checklistIdx > changeIdx);
    assert.ok(continueIdx > checklistIdx);

    assert.ok(m8.includes("What APA formatting does"));
    assert.ok(m8.includes("What you will change"));
    assert.ok(m8.includes("Formatting checklist"));
    assert.ok(MODULE8_FORMAT_APA_DOES.length === 3);
    assert.match(MODULE8_FORMAT_APA_DOES.join(" "), /consistent and easier to read/i);
    assert.match(MODULE8_FORMAT_APA_DOES.join(" "), /prepared the work carefully/i);
    assert.match(
      MODULE8_FORMAT_APA_DOES.join(" "),
      /not your ideas or argument/i
    );
  });

  it("previews the six formatting categories and says writing is finished in the Google Doc", () => {
    assert.deepEqual([...MODULE8_FORMAT_CHANGE_CATEGORIES], [
      "Font",
      "Spacing",
      "Margins",
      "Title page",
      "Page numbers",
      "References page",
    ]);

    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes("MODULE8_FORMAT_CHANGE_CATEGORIES"));
    assert.ok(m8.includes("Your writing is finished."));
    assert.ok(m8.includes("Do not rewrite your essay here"));
    assert.ok(m8.includes("formatting changes inside your Google Doc"));
    assert.ok(m8.includes('data-testid="module8-format-open-doc"'));

    const format = getModule8StepPresentation(FORMAT_STEP);
    assert.match(format.workingSetDescription, /writing is finished/i);
    assert.match(format.workingSetDescription, /Google Doc/i);
  });

  it("keeps a single checklist with Continue gated by checklistComplete", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes("const CHECKLIST_ITEMS = ["));
    assert.equal((m8.match(/CHECKLIST_ITEMS\.map/g) || []).length, 1);
    assert.ok(m8.includes("canAdvanceFromStep2 = checklistComplete"));
    assert.ok(m8.includes("currentStepIndex === 1 && !canAdvanceFromStep2"));
    assert.ok(m8.includes("upsertModule9Checklist"));
    assert.ok(m8.includes("getModule9Checklist"));
    assert.ok(m8.includes("module8-format-continue-cue"));
    assert.ok(m8.includes("Keep going unlocks after every checklist item"));
  });

  it("keeps APA resources as optional shelf links and does not expand into WP-035 Ready coaching", () => {
    const shelf = readSrc("components/module8/ModuleEightReferenceShelf.jsx");
    assert.ok(shelf.includes('data-testid="module8-apa-template-link"'));
    assert.ok(shelf.includes('data-testid="module8-apa-sample-link"'));
    assert.ok(shelf.includes('data-testid="module8-apa-owl-link"'));
    assert.match(shelf, /<a[\s\S]*?module8-apa-template-link/);

    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(!m8.includes("newest essay appears"));
    assert.ok(!m8.includes("confidence checklist"));
  });

  it("preserves WP-030–033 recovery, buttons, success confirmation, and framing", () => {
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
        expectedWordCount: 50,
        status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED,
      },
      completedAt: "2026-07-13T23:00:00.000Z",
    });
    assert.equal(confirmation.statusLabel, SUBMISSION_DOC_READY_FOR_FORMATTING);

    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m8.includes("showFooterKeepGoing"));
    assert.ok(m8.includes('data-testid="module8-submission-doc-framing"'));
    assert.ok(m8.includes("result.confirmation"));
  });
});
