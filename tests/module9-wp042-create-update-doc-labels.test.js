/**
 * WP-042 — Module 9 Create/Update Google Doc labels (no student-facing “Export”).
 * Evidence: shared recovery plan + Module 9 panel wiring; no product copy change.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getRecoveryActionLabel,
  getSubmissionDocRecoveryPlan,
  SUBMISSION_DOC_RECOVERY_ACTIONS,
  SUBMISSION_DOC_REPLACEMENT_CONFIRMATION,
} from "../lib/exports/submissionDocRecovery.js";
import { SUBMISSION_DOC_VERIFICATION_STATUS } from "../lib/exports/submissionDocVerification.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

describe("WP-042 Module 9 Create/Update Doc labels", () => {
  it("exposes no student-facing Export terminology in Module 9 or recovery panel", () => {
    const m9 = readSrc("components/ModuleNine.js");
    const panel = readSrc("components/exports/SubmissionDocRecoveryPanel.jsx");
    const recovery = readSrc("lib/exports/submissionDocRecovery.js");

    assert.equal(m9.includes("Export Final Draft to Google Docs"), false);
    assert.equal(m9.includes("handleExportToGoogleDocs"), false);
    assert.equal(/Export to Google Docs/i.test(m9), false);
    assert.equal(/Export Final Draft/i.test(panel), false);
    assert.equal(/Export Final Draft/i.test(recovery), false);

    // Labels come from shared helper — no Export in label strings
    for (const action of Object.values(SUBMISSION_DOC_RECOVERY_ACTIONS)) {
      const idle = getRecoveryActionLabel(action, { busy: false });
      const busy = getRecoveryActionLabel(action, { busy: true });
      assert.equal(/export/i.test(idle), false, idle);
      assert.equal(/export/i.test(busy), false, busy);
    }
  });

  it("uses Create vs Update vs Create-new language with busy variants", () => {
    assert.equal(
      getRecoveryActionLabel(SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE),
      "Create your Google Doc"
    );
    assert.equal(
      getRecoveryActionLabel(SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE, {
        busy: true,
      }),
      "Creating your Google Doc…"
    );
    assert.equal(
      getRecoveryActionLabel(SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE),
      "Update Google Doc"
    );
    assert.equal(
      getRecoveryActionLabel(SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE, {
        busy: true,
      }),
      "Updating your Google Doc…"
    );
    assert.equal(
      getRecoveryActionLabel(SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW),
      "Create a new Google Doc"
    );
    assert.equal(
      getRecoveryActionLabel(SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW, {
        busy: true,
      }),
      "Creating a new Google Doc…"
    );
    assert.equal(
      SUBMISSION_DOC_REPLACEMENT_CONFIRMATION.confirmLabel,
      "Create new Google Doc"
    );
  });

  it("selects Create when no document and Update when hasUrl via shared plan", () => {
    const createPlan = getSubmissionDocRecoveryPlan({
      hasUrl: false,
      verificationStatus: null,
      contentVerified: false,
    });
    assert.equal(
      createPlan.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE
    );
    assert.match(createPlan.title, /Create your Google Doc/i);

    const updatePlan = getSubmissionDocRecoveryPlan({
      hasUrl: true,
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH,
      contentVerified: false,
    });
    assert.equal(
      updatePlan.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE
    );

    const confirmPlan = getSubmissionDocRecoveryPlan({
      hasUrl: true,
      verificationStatus: null,
      contentVerified: false,
    });
    assert.equal(
      confirmPlan.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE
    );
  });

  it("wires Module 9 panel with hasUrl so Create versus Update can resolve", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m9.includes("hasUrl={!!exportUrl}"));
    assert.ok(m9.includes("verificationStatus={verificationStatus}"));
    assert.ok(m9.includes("contentVerified={docContentVerified}"));
    assert.ok(m9.includes("onUpdate="));
    assert.ok(m9.includes("onCreate="));
    assert.ok(m9.includes("onCreateNew="));
    assert.ok(m9.includes('testIdPrefix="module9-doc"'));

    const panel = readSrc("components/exports/SubmissionDocRecoveryPanel.jsx");
    assert.ok(panel.includes("getSubmissionDocRecoveryPlan"));
    assert.ok(panel.includes("getRecoveryActionLabel"));
  });
});
