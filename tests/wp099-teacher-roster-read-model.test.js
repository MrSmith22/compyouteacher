/**
 * WP-099 — Roster read-model privacy / mapping / empty-vs-failure tests.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  mapBatchRowsToArtifactInput,
} from "../lib/teacher/mapTeacherRosterArtifacts.js";
import {
  projectTeacherStudentProgress,
  sortTeacherRosterRows,
  summarizeTeacherRoster,
} from "../lib/teacher/teacherProgressProjection.js";
import {
  assertRosterRowPrivacy,
  buildWp099SyntheticRosterRows,
} from "../lib/teacher/teacherProgressFixtures.js";

test("WP-099 mapBatchRows: receipt without URL on projected roster", () => {
  const mapped = mapBatchRowsToArtifactInput({
    assignment: {
      user_email: "a@test.com",
      current_module: 9,
      updated_at: "2026-07-20T12:00:00.000Z",
    },
    exportPdf: {
      storage_path: "exports/a/final.pdf",
      file_name: "final.pdf",
      file_size: 1000,
      public_url: "https://example.com/secret.pdf",
      web_view_link: "https://example.com/secret.pdf",
      uploaded_at: "2026-07-20T12:00:00.000Z",
      grading_status: "ungraded",
    },
    exportedDoc: {
      document_id: "doc1",
      web_view_link: "https://docs.google.com/document/d/secret",
      created_at: "2026-07-20T11:00:00.000Z",
    },
    draft7: { has_final_text: true, updated_at: "2026-07-20T10:00:00.000Z" },
  });

  const row = projectTeacherStudentProgress(mapped);
  assert.equal(row.overallStatus, "submitted");
  assert.equal(row.hasGoogleDoc, true);
  assertRosterRowPrivacy(row);
  assert.ok(!JSON.stringify(row).includes("https://"));
  assert.ok(mapped._detail.pdfUrl.includes("secret"));
});

test("WP-099 mapBatchRows: Doc pointer without certifying submit", () => {
  const mapped = mapBatchRowsToArtifactInput({
    assignment: { user_email: "b@test.com", current_module: 8 },
    exportedDoc: { document_id: "x", has_pointer: true },
    draft7: { has_final_text: true },
    draft8: { final_ready: true },
  });
  const row = projectTeacherStudentProgress(mapped);
  assert.notEqual(row.overallStatus, "submitted");
  assert.equal(row.hasGoogleDoc, true);
});

test("WP-099 empty roster is success with zero students", () => {
  const students = [];
  const summary = summarizeTeacherRoster(students);
  assert.equal(summary.total, 0);
  assert.deepEqual(summary, {
    total: 0,
    not_started: 0,
    in_progress: 0,
    ready_for_next: 0,
    submitted: 0,
    needs_attention: 0,
  });
});

test("WP-099 fixture roster privacy and sort", () => {
  const rows = sortTeacherRosterRows(buildWp099SyntheticRosterRows());
  for (const row of rows) assertRosterRowPrivacy(row);
  assert.equal(rows[0].overallStatus, "needs_attention");
  const submitted = rows.filter((r) => r.overallStatus === "submitted");
  assert.ok(submitted.length >= 1);
});

test("WP-099 activity-count fields are not part of projection input authority", () => {
  const row = projectTeacherStudentProgress({
    studentId: "x",
    artifacts: {},
    receipt: null,
    // Misleading legacy fields must be ignored if somehow passed
    modulesCompletedCount: 9,
    activityCount: 40,
  });
  assert.notEqual(row.overallStatus, "submitted");
});
