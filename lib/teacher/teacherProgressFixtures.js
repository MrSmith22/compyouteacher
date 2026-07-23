/**
 * WP-099 — Deterministic synthetic teacher roster fixtures (Prompt 20 cases).
 * Dev-only. Never import from production client chunks without a gate.
 */

import { projectTeacherStudentProgress } from "./teacherProgressProjection.js";

export const WP099_FIXTURE_ASSIGNMENT_ID = "mlk-rhetorical-analysis";

/** @type {ReadonlyArray<{
 *   studentId: string,
 *   displayName?: string|null,
 *   email?: string|null,
 *   assignmentId?: string|null,
 *   currentModule?: number|null,
 *   latestUpdateAt?: string|null,
 *   artifacts?: Record<string, unknown>,
 *   receipt?: Record<string, unknown>|null,
 *   historical?: { hasQuizRecord?: boolean, hasChecklistRecord?: boolean },
 * }>} */
export const WP099_SYNTHETIC_STUDENT_INPUTS = Object.freeze([
  {
    studentId: "wp099-not-started",
    displayName: "Avery Not Started",
    email: "wp099-not-started@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 1,
    latestUpdateAt: "2026-07-20T10:00:00.000Z",
    artifacts: {},
    receipt: null,
  },
  {
    studentId: "wp099-understand",
    displayName: "Blake Understand",
    email: "wp099-understand@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 2,
    latestUpdateAt: "2026-07-20T11:00:00.000Z",
    artifacts: {
      understandComplete: true,
      vocabTransferReady: true,
    },
    receipt: null,
  },
  {
    studentId: "wp099-read-notice",
    displayName: "Casey Read Notice",
    email: "wp099-read-notice@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 3,
    latestUpdateAt: "2026-07-20T12:00:00.000Z",
    artifacts: {
      understandComplete: true,
      sourcesReady: true,
      directionReady: true,
    },
    receipt: null,
  },
  {
    studentId: "wp099-argument",
    displayName: "Devon Argument",
    email: "wp099-argument@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 4,
    latestUpdateAt: "2026-07-20T13:00:00.000Z",
    artifacts: {
      understandComplete: true,
      sourcesReady: true,
      directionReady: true,
      hasThesis: true,
      hasProofPlan: true,
    },
    receipt: null,
  },
  {
    studentId: "wp099-plan",
    displayName: "Ellis Plan",
    email: "wp099-plan@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 5,
    latestUpdateAt: "2026-07-20T14:00:00.000Z",
    artifacts: {
      understandComplete: true,
      sourcesReady: true,
      directionReady: true,
      hasThesis: true,
      hasProofPlan: true,
      hasPlans: true,
      outlineFinalized: true,
    },
    receipt: null,
  },
  {
    studentId: "wp099-draft",
    displayName: "Finley Draft",
    email: "wp099-draft@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 6,
    latestUpdateAt: "2026-07-20T15:00:00.000Z",
    artifacts: {
      understandComplete: true,
      sourcesReady: true,
      directionReady: true,
      hasThesis: true,
      hasProofPlan: true,
      hasPlans: true,
      outlineFinalized: true,
      hasDraft: true,
    },
    receipt: null,
  },
  {
    studentId: "wp099-revise",
    displayName: "Gray Revise",
    email: "wp099-revise@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 7,
    latestUpdateAt: "2026-07-20T16:00:00.000Z",
    artifacts: {
      understandComplete: true,
      sourcesReady: true,
      directionReady: true,
      hasThesis: true,
      hasProofPlan: true,
      hasPlans: true,
      outlineFinalized: true,
      hasDraft: true,
      hasRevisedText: true,
    },
    receipt: null,
  },
  {
    studentId: "wp099-prepare-doc",
    displayName: "Harper Prepare",
    email: "wp099-prepare-doc@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 8,
    latestUpdateAt: "2026-07-20T17:00:00.000Z",
    artifacts: {
      understandComplete: true,
      sourcesReady: true,
      directionReady: true,
      hasThesis: true,
      hasProofPlan: true,
      hasPlans: true,
      outlineFinalized: true,
      hasDraft: true,
      hasRevisedText: true,
      hasGoogleDoc: true,
      // Legacy misleading signals — must NOT certify submitted
      finalReady: true,
    },
    receipt: null,
    historical: { hasChecklistRecord: true },
  },
  {
    studentId: "wp099-ready-submit",
    displayName: "Indigo Ready Submit",
    email: "wp099-ready-submit@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 9,
    latestUpdateAt: "2026-07-20T18:00:00.000Z",
    artifacts: {
      understandComplete: true,
      sourcesReady: true,
      directionReady: true,
      hasThesis: true,
      hasProofPlan: true,
      hasPlans: true,
      outlineFinalized: true,
      hasDraft: true,
      hasRevisedText: true,
      hasGoogleDoc: true,
      guidedApaComplete: true,
    },
    receipt: null,
    historical: { hasQuizRecord: true, hasChecklistRecord: true },
  },
  {
    studentId: "wp099-submitted",
    displayName: "Jordan Submitted",
    email: "wp099-submitted@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 9,
    latestUpdateAt: "2026-07-20T19:00:00.000Z",
    artifacts: {
      understandComplete: true,
      sourcesReady: true,
      directionReady: true,
      hasThesis: true,
      hasProofPlan: true,
      hasPlans: true,
      outlineFinalized: true,
      hasDraft: true,
      hasRevisedText: true,
      hasGoogleDoc: true,
      guidedApaComplete: true,
    },
    receipt: {
      hasReceiptRow: true,
      storagePath: "exports/wp099-submitted/final.pdf",
      fileName: "final.pdf",
      byteSize: 120000,
      submittedAt: "2026-07-20T19:00:00.000Z",
    },
  },
  {
    studentId: "wp099-attention-ahead",
    displayName: "Kai Needs Attention",
    email: "wp099-attention-ahead@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 8,
    latestUpdateAt: "2026-07-20T20:00:00.000Z",
    artifacts: {
      understandComplete: true,
      // missing middle artifacts while orientation is at prepare
    },
    receipt: null,
  },
  {
    studentId: "wp099-attention-receipt",
    displayName: "Logan Receipt Gap",
    email: "wp099-attention-receipt@example.test",
    assignmentId: WP099_FIXTURE_ASSIGNMENT_ID,
    currentModule: 9,
    latestUpdateAt: "2026-07-20T21:00:00.000Z",
    artifacts: {
      understandComplete: true,
      hasRevisedText: true,
      hasGoogleDoc: true,
      guidedApaComplete: true,
      prepareCompleteClaimed: true,
    },
    receipt: {
      claimedSubmitted: true,
      hasReceiptRow: true,
      // missing path / name → incomplete metadata
      byteSize: 0,
    },
  },
]);

/**
 * @returns {ReturnType<typeof projectTeacherStudentProgress>[]}
 */
export function buildWp099SyntheticRosterRows() {
  return WP099_SYNTHETIC_STUDENT_INPUTS.map((row) =>
    projectTeacherStudentProgress(row)
  );
}

/**
 * Assert roster rows never contain private prose / URLs / notes.
 * @param {object} row
 */
export function assertRosterRowPrivacy(row) {
  const json = JSON.stringify(row);
  const forbidden = [
    "final_text",
    "full_text",
    "https://docs.google.com",
    "drive.google.com",
    "teacher_notes",
    "privateUrl",
    "pdfUrl",
  ];
  for (const token of forbidden) {
    if (json.includes(token)) {
      throw new Error(`Roster privacy leak: found ${token}`);
    }
  }
}
