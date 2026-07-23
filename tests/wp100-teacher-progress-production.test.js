/**
 * WP-100 — Production promotion tests for teacher progress visibility.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  TEACHER_PROGRESS_PROJECTION_VERSION,
  projectTeacherStudentProgress,
  deriveOverallStatus,
  deriveAttentionReasons,
  TEACHER_ATTENTION_CODES,
} from "../lib/teacher/teacherProgressProjection.js";
import {
  buildWp099SyntheticRosterRows,
  assertRosterRowPrivacy,
} from "../lib/teacher/teacherProgressFixtures.js";
import { mapBatchRowsToArtifactInput } from "../lib/teacher/mapTeacherRosterArtifacts.js";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

test("WP-100 production dashboard no longer depends on development gate", () => {
  assert.equal(exists("lib/dev/isTeacherProgressVisibilityFoundationEnabled.js"), false);
  const dash = read("components/TeacherDashboard.js");
  assert.ok(dash.includes("TeacherProgressDashboard"));
  assert.ok(!dash.includes("isTeacherProgressVisibilityFoundationEnabled"));
  assert.ok(!dash.includes("LegacyTeacherDashboard"));
  const ui = read("components/teacher/TeacherProgressDashboard.jsx");
  assert.ok(ui.includes("data-wp100-teacher-progress"));
  assert.ok(!ui.includes("useFixtures"));
  assert.ok(!ui.includes("source=fixtures"));
});

test("WP-100 fixture imports absent from production API dependency paths", () => {
  const roster = read("app/api/teacher/roster/route.ts");
  const detail = read("app/api/teacher/student-progress/route.ts");
  const builder = read("lib/teacher/buildTeacherRosterReadModel.js");
  assert.ok(!roster.includes("teacherProgressFixtures"));
  assert.ok(!detail.includes("teacherProgressFixtures"));
  assert.ok(!builder.includes("teacherProgressFixtures"));
  assert.ok(!builder.includes("useFixtures"));
  assert.ok(roster.includes('source") === "fixtures"'));
  assert.ok(detail.includes('source") === "fixtures"'));
});

test("WP-100 legacy competing progress endpoints are removed", () => {
  assert.equal(exists("app/api/teacher/overview/route.js"), false);
  assert.equal(exists("app/api/teacher/dashboard/route.ts"), false);
  assert.equal(exists("app/api/teacher/student/route.js"), false);
});

test("WP-100 roster and detail routes use shared teacher session + no-store", () => {
  const roster = read("app/api/teacher/roster/route.ts");
  const detail = read("app/api/teacher/student-progress/route.ts");
  const notes = read("app/api/teacher/notes/route.ts");
  const grade = read("app/api/teacher/submissions/grade/route.ts");
  for (const src of [roster, detail, notes, grade]) {
    assert.ok(src.includes("requireTeacherSession"));
    assert.ok(src.includes("teacherJson"));
  }
  const helper = read("lib/teacher/requireTeacherSession.js");
  assert.ok(helper.includes('Cache-Control": "private, no-store"') || helper.includes("private, no-store"));
  assert.ok(helper.includes("role") && helper.includes("teacher"));
  assert.ok(helper.includes("401"));
  assert.ok(helper.includes("403"));
});

test("WP-100 detail requires assignment membership before student data", () => {
  const builder = read("lib/teacher/buildTeacherRosterReadModel.js");
  assert.ok(builder.includes("not_in_assignment"));
  assert.ok(builder.includes("assignment_name"));
  // Membership check precedes other artifact queries in detail builder
  const membershipIdx = builder.indexOf("not_in_assignment");
  const draftIdx = builder.indexOf('eq("module", 8)');
  assert.ok(membershipIdx > 0 && draftIdx > membershipIdx);
});

test("WP-100 projection version stable and receipt precedence preserved", () => {
  assert.equal(TEACHER_PROGRESS_PROJECTION_VERSION, 1);
  const submitted = projectTeacherStudentProgress({
    studentId: "a",
    artifacts: { hasGoogleDoc: true, guidedApaComplete: true, finalReady: true },
    receipt: {
      hasReceiptRow: true,
      storagePath: "x.pdf",
      fileName: "x.pdf",
      byteSize: 10,
    },
  });
  assert.equal(submitted.overallStatus, "submitted");
  const docOnly = deriveOverallStatus({
    artifacts: { hasGoogleDoc: true, guidedApaComplete: true },
    receipt: null,
  });
  assert.notEqual(docOnly, "submitted");
});

test("WP-100 attention remains explicit-only", () => {
  const reasons = deriveAttentionReasons({
    currentModule: 3,
    artifacts: {
      understandComplete: true,
      sourcesReady: true,
      directionReady: true,
    },
    inactiveDays: 40,
    quizPercent: 20,
  });
  assert.equal(reasons.length, 0);
  const ahead = deriveAttentionReasons({
    currentModule: 8,
    artifacts: { understandComplete: true },
  });
  assert.ok(
    ahead.some((r) => r.code === TEACHER_ATTENTION_CODES.PROGRESSION_AHEAD_OF_ARTIFACT)
  );
});

test("WP-100 compatibility matrix projects without crash", () => {
  const cases = [
    { studentId: "1", artifacts: {}, receipt: null },
    {
      studentId: "2",
      artifacts: {},
      receipt: null,
      historical: { hasQuizRecord: true, hasChecklistRecord: true },
    },
    {
      studentId: "3",
      artifacts: { vocabTransferReady: true, understandComplete: true },
    },
    {
      studentId: "4",
      artifacts: { sourcesReady: true, directionReady: true },
    },
    {
      studentId: "5",
      artifacts: { hasThesis: true, hasProofPlan: true },
    },
    {
      studentId: "6",
      artifacts: { hasPlans: true, outlineFinalized: true },
    },
    { studentId: "7", artifacts: { hasDraft: true, draftLocked: true } },
    { studentId: "8", artifacts: { hasRevisedText: true } },
    {
      studentId: "9",
      artifacts: { hasRevisedText: true, hasGoogleDoc: true, finalReady: true },
    },
    {
      studentId: "10",
      artifacts: {
        hasRevisedText: true,
        hasGoogleDoc: true,
        guidedApaComplete: true,
      },
    },
    {
      studentId: "11",
      artifacts: { hasGoogleDoc: true, guidedApaComplete: true },
      receipt: {
        hasReceiptRow: true,
        storagePath: "a",
        fileName: "a.pdf",
        byteSize: 1,
        submittedAt: "2026-07-20T00:00:00.000Z",
      },
      currentModule: 1,
    },
    {
      studentId: "12",
      artifacts: { hasGoogleDoc: true },
      receipt: { claimedSubmitted: true, hasReceiptRow: true },
    },
    {
      studentId: "13",
      artifacts: { malformedArtifact: true },
    },
  ];
  for (const input of cases) {
    const row = projectTeacherStudentProgress(input);
    assertRosterRowPrivacy(row);
    assert.ok(row.projectionVersion === 1);
  }
});

test("WP-100 mapper strips private URLs from projection input receipt", () => {
  const mapped = mapBatchRowsToArtifactInput({
    assignment: { user_email: "a@test.com", current_module: 9 },
    exportPdf: {
      storage_path: "p",
      file_name: "f.pdf",
      file_size: 9,
      public_url: "https://secret.example/pdf",
      uploaded_at: "2026-07-20T00:00:00.000Z",
    },
    exportedDoc: {
      document_id: "d",
      web_view_link: "https://docs.google.com/document/d/secret",
    },
    draft7: { has_final_text: true },
  });
  const row = projectTeacherStudentProgress(mapped);
  assertRosterRowPrivacy(row);
  assert.ok(!JSON.stringify(row).includes("https://"));
});

test("WP-100 grading route gates on durable receipt", () => {
  const grade = read("app/api/teacher/submissions/grade/route.ts");
  assert.ok(grade.includes("No durable submission receipt"));
  assert.ok(grade.includes("final_pdf"));
});

test("WP-100 synthetic fixtures remain available for unit tests only", () => {
  const rows = buildWp099SyntheticRosterRows();
  assert.equal(rows.length, 12);
  for (const row of rows) assertRosterRowPrivacy(row);
});

test("WP-100 UI has no Phase 1/2 labels and Progress is default", () => {
  const ui = read("components/teacher/TeacherProgressDashboard.jsx");
  assert.ok(!/Phase 1/i.test(ui));
  assert.ok(!/Phase 2/i.test(ui));
  assert.ok(ui.includes('useState("progress")'));
});
