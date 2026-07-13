/**
 * WP-033 — Module 8 submission-document framing (regression).
 * Framing already lives in the always-visible Prepare panel + Create working-set copy.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getModule8StepPresentation,
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

const CREATE_STEP = MODULE8_WORKSPACE_STEPS.find(
  (s) => s.type === MODULE8_STEP_TYPES.CREATE_DOC
);

describe("WP-033 Module 8 Google Doc submission framing", () => {
  it("shows submission-document framing on Create introduction", () => {
    const create = getModule8StepPresentation(CREATE_STEP, {
      hasExistingDoc: false,
    });
    assert.match(create.workingSetLabel, /Create your Google Doc/i);
    assert.match(
      create.workingSetDescription,
      /Google Doc.*paper you'll format before turning it in/i
    );
    assert.match(create.workingSetDescription, /finished essay/i);

    // Always-visible Prepare panel (not only collapsed Why this matters).
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes('data-testid="module8-submission-doc-framing"'));
    assert.ok(m8.includes("Prepare Your Essay for Submission"));
    assert.ok(m8.includes("Your writing is complete."));
    assert.ok(m8.includes("You are no longer improving your ideas."));
    assert.ok(m8.includes("You are preparing the paper your teacher will read."));
    assert.ok(m8.includes("Your Google Doc is what you will"));
    assert.ok(m8.includes("format and turn in."));
  });

  it("keeps framing visible for Update (existing document) state", () => {
    const update = getModule8StepPresentation(CREATE_STEP, {
      hasExistingDoc: true,
    });
    assert.match(update.workingSetLabel, /Update your Google Doc/i);
    assert.match(update.workingSetDescription, /before you format/i);

    // Shared always-visible framing still present alongside Update working set.
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes('data-testid="module8-submission-doc-framing"'));
    assert.ok(m8.includes("paper your teacher will read"));
    assert.ok(m8.includes("format and turn in"));
  });

  it("distinguishes finished writing from remaining formatting work", () => {
    const create = getModule8StepPresentation(CREATE_STEP, {
      hasExistingDoc: false,
    });
    const joined = [
      ...create.whyMatters,
      create.coachingMessage,
      create.nextStepText,
      create.workingSetDescription,
    ].join(" ");

    assert.match(joined, /writing is complete|no longer improving your ideas/i);
    assert.match(joined, /Google Doc/i);
    assert.match(joined, /format/i);
    assert.doesNotMatch(joined, /rewrite your essay|revise your ideas/i);

    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m8.includes("Your writing is complete."));
    assert.ok(m8.includes("You are no longer improving your ideas."));
    assert.ok(m8.includes("format and turn in"));
    assert.ok(!/rewrite your essay|start revising again/i.test(m8));
  });

  it("preserves WP-030–032 recovery, buttons, and verified success contracts", () => {
    const mismatch = getSubmissionDocRecoveryPlan({
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH,
      hasUrl: true,
      contentVerified: false,
      requireSessionWrite: true,
    });
    assert.equal(mismatch.primaryAction, SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE);
    assert.equal(mismatch.allowProgression, false);

    const confirmation = buildSubmissionDocSuccessConfirmation({
      operation: "updated",
      verification: {
        verified: true,
        expectedWordCount: 120,
        status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED,
      },
      completedAt: "2026-07-13T22:00:00.000Z",
    });
    assert.equal(confirmation.statusLabel, SUBMISSION_DOC_READY_FOR_FORMATTING);

    const m8 = readSrc("components/ModuleEight.js");
    const panel = readSrc("components/exports/SubmissionDocRecoveryPanel.jsx");
    assert.ok(m8.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m8.includes("showFooterKeepGoing"));
    assert.ok(m8.includes('data-testid="module8-format-open-doc"'));
    assert.ok(m8.includes("result.confirmation"));
    assert.ok(panel.includes("PRIMARY_BTN"));
    assert.ok(panel.includes("success-confirmation"));
  });
});
