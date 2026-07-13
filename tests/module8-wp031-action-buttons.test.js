/**
 * WP-031 — Module 8 workflow actions as buttons; reference resources stay links.
 * Preserves WP-030 recovery / progression contracts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getSubmissionDocRecoveryPlan,
  SUBMISSION_DOC_RECOVERY_ACTIONS,
} from "../lib/exports/submissionDocRecovery.js";
import { SUBMISSION_DOC_VERIFICATION_STATUS } from "../lib/exports/submissionDocVerification.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-031 Module 8 action affordances", () => {
  it("required Module 8 workflow actions render as buttons", () => {
    const m8 = readSrc("components/ModuleEight.js");
    const panel = readSrc("components/exports/SubmissionDocRecoveryPanel.jsx");
    const success = readSrc("app/modules/8/success/page.js");

    // Format-step Open is a button (not an underline link)
    assert.ok(m8.includes('data-testid="module8-format-open-doc"'));
    assert.ok(m8.includes("openSubmissionGoogleDoc"));
    assert.ok(!/Open your Google Doc[\s\S]{0,40}<\/a>/.test(m8));
    assert.match(
      m8,
      /<button[\s\S]*?data-testid="module8-format-open-doc"[\s\S]*?>[\s\S]*?Open your Google Doc/
    );

    // Gate / required-next actions are buttons
    assert.ok(m8.includes('data-testid="module8-go-module-5"'));
    assert.ok(m8.includes('data-testid="module8-go-module-7"'));
    assert.ok(!m8.includes('href="/modules/5"'));
    assert.ok(!m8.includes('href="/modules/7"'));

    // Progression / Continue controls are buttons
    assert.ok(m8.includes('data-testid="module8-keep-going"'));
    assert.ok(m8.includes('data-testid="module8-finish-prepare"'));
    assert.ok(m8.includes('data-testid="module8-locked-continue"'));
    assert.ok(success.includes('data-testid="module8-success-continue"'));
    assert.ok(success.includes("<button"));
    assert.ok(!success.includes("<Link"));
    assert.ok(!success.includes('href="/modules/9"'));

    // Recovery panel actions remain accessible buttons with hierarchy tokens
    assert.ok(panel.includes("PRIMARY_BTN"));
    assert.ok(panel.includes("SECONDARY_BTN"));
    assert.ok(panel.includes("data-recovery-action"));
    assert.ok(panel.includes('type="button"'));
    assert.ok(panel.includes("min-h-[44px]"));
  });

  it("reference and navigation resources remain semantic links", () => {
    const shelf = readSrc("components/module8/ModuleEightReferenceShelf.jsx");
    const m8 = readSrc("components/ModuleEight.js");

    assert.ok(shelf.includes('data-testid="module8-apa-template-link"'));
    assert.ok(shelf.includes('data-testid="module8-apa-sample-link"'));
    assert.ok(shelf.includes('data-testid="module8-apa-owl-link"'));
    assert.match(
      shelf,
      /<a[\s\S]*?data-testid="module8-apa-template-link"[\s\S]*?>/
    );
    assert.match(
      shelf,
      /<a[\s\S]*?data-testid="module8-apa-sample-link"[\s\S]*?>/
    );
    assert.match(shelf, /<a[\s\S]*?data-testid="module8-apa-owl-link"[\s\S]*?>/);

    // Sign-in remains a navigation Link (not a workflow Create/Update/Open action)
    assert.ok(m8.includes('href="/api/auth/signin"'));
  });

  it("avoids competing primary Continue after verified create-doc step", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes("showFooterKeepGoing"));
    assert.ok(m8.includes("MODULE8_STEP_TYPES.CREATE_DOC"));
    assert.ok(m8.includes("docVerifiedThisSession"));
    assert.ok(m8.includes("showProgressContinue={docVerifiedThisSession}"));
  });

  it("WP-030 recovery actions and progression behavior remain unchanged", () => {
    const mismatch = getSubmissionDocRecoveryPlan({
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH,
      hasUrl: true,
      contentVerified: false,
      requireSessionWrite: true,
    });
    assert.equal(mismatch.primaryAction, SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE);
    assert.ok(
      mismatch.secondaryActions.includes(SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN)
    );
    assert.ok(
      mismatch.secondaryActions.includes(
        SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW
      )
    );
    assert.equal(mismatch.allowProgression, false);

    const tempFail = getSubmissionDocRecoveryPlan({
      verificationStatus:
        SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
      hasUrl: true,
      contentVerified: false,
      requireSessionWrite: true,
    });
    assert.equal(
      tempFail.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK
    );
    assert.ok(
      tempFail.secondaryActions.includes(SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN)
    );
    assert.equal(
      tempFail.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK
    );
    assert.notEqual(
      tempFail.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW
    );
    assert.equal(tempFail.allowProgression, false);

    const verified = getSubmissionDocRecoveryPlan({
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED,
      hasUrl: true,
      contentVerified: true,
      requireSessionWrite: true,
      operation: "updated",
    });
    assert.equal(verified.allowProgression, true);
    assert.equal(
      verified.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.CONTINUE
    );
    assert.ok(verified.showSecondaryDisclosure);

    const m8 = readSrc("components/ModuleEight.js");
    const panel = readSrc("components/exports/SubmissionDocRecoveryPanel.jsx");
    const runExport = readSrc("lib/exports/runExportEssayToGoogleDocs.js");
    assert.ok(m8.includes("forceCreate: true"));
    assert.ok(m8.includes("forceCreate: false"));
    assert.ok(m8.includes("SubmissionDocRecoveryPanel"));
    assert.ok(panel.includes("window.open(docUrl"));
    assert.ok(!m8.includes("window.confirm"));
    assert.ok(runExport.includes("forceCreate"));
    assert.ok(m8.includes("docVerifiedThisSession"));
  });
});
