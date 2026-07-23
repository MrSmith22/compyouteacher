/**
 * WP-099 — Authority / attention / privacy tests for teacher progress projection.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  TEACHER_PROGRESS_PROJECTION_VERSION,
  hasDurableFinalPdfReceipt,
  isReceiptMetadataIncomplete,
  deriveHighestEarnedStageId,
  deriveOverallStatus,
  deriveAttentionReasons,
  projectTeacherStudentProgress,
  sortTeacherRosterRows,
  summarizeTeacherRoster,
  TEACHER_ATTENTION_CODES,
} from "../lib/teacher/teacherProgressProjection.js";
import {
  buildWp099SyntheticRosterRows,
  assertRosterRowPrivacy,
  WP099_SYNTHETIC_STUDENT_INPUTS,
} from "../lib/teacher/teacherProgressFixtures.js";
import { isTeacherProgressVisibilityFoundationEnabled } from "../lib/dev/isTeacherProgressVisibilityFoundationEnabled.js";

test("WP-099 projection version is frozen", () => {
  assert.equal(TEACHER_PROGRESS_PROJECTION_VERSION, 1);
});

test("WP-099 durable receipt wins Submitted over Doc / APA / final_ready / quiz", () => {
  const row = projectTeacherStudentProgress({
    studentId: "s1",
    currentModule: 9,
    artifacts: {
      hasGoogleDoc: true,
      guidedApaComplete: true,
      finalReady: true,
      hasRevisedText: true,
    },
    receipt: {
      hasReceiptRow: true,
      storagePath: "a/b.pdf",
      fileName: "essay.pdf",
      byteSize: 10,
      submittedAt: "2026-07-20T12:00:00.000Z",
    },
    historical: { hasQuizRecord: true, hasChecklistRecord: true },
  });
  assert.equal(row.overallStatus, "submitted");
  assert.equal(row.receiptStatus.submitted, true);
  assert.equal(row.currentWorkLabel, "Submitted");
});

test("WP-099 Doc + APA never certifies Submitted without receipt", () => {
  const row = projectTeacherStudentProgress({
    studentId: "s2",
    artifacts: {
      hasGoogleDoc: true,
      guidedApaComplete: true,
      hasRevisedText: true,
      finalReady: true,
    },
    receipt: null,
    historical: { hasQuizRecord: true },
  });
  assert.notEqual(row.overallStatus, "submitted");
  assert.equal(row.receiptStatus.submitted, false);
  assert.equal(row.overallStatus, "ready_for_next");
});

test("WP-099 activity count and current_module alone do not complete stages", () => {
  const earned = deriveHighestEarnedStageId({});
  assert.equal(earned, null);
  const status = deriveOverallStatus({
    currentModule: 9,
    artifacts: {},
    receipt: null,
  });
  // Ahead of artifacts → needs_attention, not submitted / completed
  assert.equal(status, "needs_attention");
  assert.ok(
    !hasDurableFinalPdfReceipt(null),
    "no receipt means no submit certification"
  );
});

test("WP-099 legacy quiz / checklist never certify readiness or submission", () => {
  const row = projectTeacherStudentProgress({
    studentId: "s3",
    artifacts: {},
    receipt: null,
    historical: { hasQuizRecord: true, hasChecklistRecord: true },
  });
  assert.equal(row.overallStatus, "not_started");
  assert.equal(row.historical.hasQuizRecord, true);
  assert.notEqual(row.overallStatus, "submitted");
});

test("WP-099 journey mapping earns stages from artifacts M1–revise", () => {
  assert.equal(
    deriveHighestEarnedStageId({ understandComplete: true }),
    "understand"
  );
  assert.equal(
    deriveHighestEarnedStageId({
      sourcesReady: true,
      directionReady: true,
    }),
    "read_and_notice"
  );
  assert.equal(
    deriveHighestEarnedStageId({ hasThesis: true, hasProofPlan: true }),
    "develop_argument"
  );
  assert.equal(
    deriveHighestEarnedStageId({ outlineFinalized: true }),
    "plan"
  );
  assert.equal(deriveHighestEarnedStageId({ hasDraft: true }), "draft");
  assert.equal(
    deriveHighestEarnedStageId({ hasRevisedText: true }),
    "revise"
  );
});

test("WP-099 attention: progression ahead of artifacts", () => {
  const reasons = deriveAttentionReasons({
    currentModule: 8,
    artifacts: { understandComplete: true },
  });
  assert.ok(
    reasons.some(
      (r) => r.code === TEACHER_ATTENTION_CODES.PROGRESSION_AHEAD_OF_ARTIFACT
    )
  );
});

test("WP-099 attention: receipt metadata incomplete", () => {
  assert.equal(
    isReceiptMetadataIncomplete({
      claimedSubmitted: true,
      hasReceiptRow: true,
    }),
    true
  );
  const reasons = deriveAttentionReasons({
    artifacts: { hasGoogleDoc: true },
    receipt: { claimedSubmitted: true, hasReceiptRow: true },
  });
  assert.ok(
    reasons.some(
      (r) => r.code === TEACHER_ATTENTION_CODES.RECEIPT_METADATA_INCOMPLETE
    )
  );
});

test("WP-099 attention: prepare claim without Doc", () => {
  const reasons = deriveAttentionReasons({
    artifacts: { prepareCompleteClaimed: true, hasGoogleDoc: false },
  });
  assert.ok(
    reasons.some(
      (r) => r.code === TEACHER_ATTENTION_CODES.PREPARE_CLAIM_WITHOUT_DOC
    )
  );
});

test("WP-099 attention excludes inactivity / quiz / ordinary incomplete", () => {
  const reasons = deriveAttentionReasons({
    currentModule: 3,
    artifacts: {
      understandComplete: true,
      sourcesReady: true,
      directionReady: true,
    },
    inactiveDays: 30,
    quizPercent: 40,
  });
  assert.equal(reasons.length, 0);
});

test("WP-099 roster projection excludes prose and private URLs", () => {
  for (const input of WP099_SYNTHETIC_STUDENT_INPUTS) {
    const row = projectTeacherStudentProgress({
      ...input,
      // Poison fields that must never appear on roster output
      artifacts: {
        ...input.artifacts,
        final_text: "SECRET PROSE",
        googleDocUrl: "https://docs.google.com/document/d/abc",
      },
    });
    assertRosterRowPrivacy(row);
    assert.equal(row.hasGoogleDoc, Boolean(input.artifacts?.hasGoogleDoc));
    assert.ok(!("final_text" in row));
    assert.ok(!("googleDocUrl" in row));
  }
});

test("WP-099 synthetic fixtures cover Prompt 20 status spread", () => {
  const rows = buildWp099SyntheticRosterRows();
  assert.equal(rows.length, 12);
  const summary = summarizeTeacherRoster(rows);
  assert.ok(summary.submitted >= 1);
  assert.ok(summary.needs_attention >= 1);
  assert.ok(summary.not_started >= 1);
  assert.ok(summary.in_progress + summary.ready_for_next >= 1);
  const sorted = sortTeacherRosterRows(rows);
  assert.equal(sorted[0].overallStatus, "needs_attention");
});

test("WP-099 gate is development-only", () => {
  const prev = process.env.TEACHER_PROGRESS_VISIBILITY_FOUNDATION;
  try {
    delete process.env.TEACHER_PROGRESS_VISIBILITY_FOUNDATION;
    if (process.env.NODE_ENV === "development") {
      assert.equal(isTeacherProgressVisibilityFoundationEnabled(), true);
    }
    process.env.TEACHER_PROGRESS_VISIBILITY_FOUNDATION = "off";
    assert.equal(isTeacherProgressVisibilityFoundationEnabled(), false);
  } finally {
    if (prev == null) delete process.env.TEACHER_PROGRESS_VISIBILITY_FOUNDATION;
    else process.env.TEACHER_PROGRESS_VISIBILITY_FOUNDATION = prev;
  }
});
