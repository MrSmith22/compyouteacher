/**
 * WP-032 — Verified export success confirmation (trust metadata).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildSubmissionDocSuccessConfirmation,
  formatSubmissionDocCompletedAt,
  getVerifiedExportSuccessStatement,
  SUBMISSION_DOC_READY_FOR_FORMATTING,
} from "../lib/exports/submissionDocSuccessConfirmation.js";
import { runExportEssayToGoogleDocs } from "../lib/exports/runExportEssayToGoogleDocs.js";
import {
  compareEssayToGoogleDocText,
  SUBMISSION_DOC_VERIFICATION_STATUS,
} from "../lib/exports/submissionDocVerification.js";
import {
  getSubmissionDocRecoveryPlan,
  SUBMISSION_DOC_RECOVERY_ACTIONS,
} from "../lib/exports/submissionDocRecovery.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

function essayDoc(text) {
  return {
    body: {
      content: [
        { endIndex: 1 },
        {
          endIndex: Math.max(2, text.length + 1),
          paragraph: {
            elements: [{ textRun: { content: `${text}\n` } }],
          },
        },
      ],
    },
  };
}

function makeDeps({
  existing = null,
  essayText = "Alpha paragraph one.\n\nBeta paragraph two.",
} = {}) {
  const calls = {
    createDocument: 0,
    batchUpdate: 0,
    shareDocument: 0,
    upsertExportedDoc: 0,
    getDocument: 0,
  };
  let docId = existing?.document_id || null;
  const docs = new Map();
  if (docId) docs.set(docId, essayDoc("stale content"));

  return {
    calls,
    deps: {
      getExportedDocRow: async () => existing,
      upsertExportedDoc: async (row) => {
        calls.upsertExportedDoc += 1;
        docId = row.document_id;
        existing = {
          document_id: row.document_id,
          web_view_link: row.web_view_link,
        };
      },
      createDocument: async () => {
        calls.createDocument += 1;
        docId = `doc_${calls.createDocument}`;
        docs.set(docId, essayDoc(""));
        return { documentId: docId };
      },
      getDocument: async (id) => {
        calls.getDocument += 1;
        return docs.get(id) || essayDoc("");
      },
      batchUpdate: async (id, requests) => {
        calls.batchUpdate += 1;
        const insert = requests.find((r) => r.insertText)?.insertText?.text;
        if (typeof insert === "string") {
          docs.set(id, essayDoc(insert));
        }
      },
      shareDocument: async () => {
        calls.shareDocument += 1;
        return { writers: [], publicReaderGranted: true, writerRecipientCount: 0 };
      },
      getWebViewLink: async (id) => `https://docs.google.com/document/d/${id}/edit`,
    },
    getDocId: () => docId,
    essayText,
  };
}

describe("WP-032 verified export success confirmation", () => {
  it("builds Create and Update statements with Ready for formatting", () => {
    assert.equal(
      getVerifiedExportSuccessStatement("updated"),
      "Your submission document has been updated successfully"
    );
    assert.equal(
      getVerifiedExportSuccessStatement("created"),
      "Your submission document has been created successfully"
    );
    assert.equal(
      getVerifiedExportSuccessStatement("replacement_created"),
      "Your new submission document has been created successfully"
    );

    const completedAt = "2026-07-13T21:00:00.000Z";
    const verification = {
      verified: true,
      expectedWordCount: 42,
      status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED,
    };

    const created = buildSubmissionDocSuccessConfirmation({
      operation: "created",
      verification,
      completedAt,
    });
    assert.ok(created);
    assert.equal(
      created.statement,
      "Your submission document has been created successfully"
    );
    assert.equal(created.completedAt, completedAt);
    assert.equal(created.wordCount, 42);
    assert.equal(created.statusLabel, SUBMISSION_DOC_READY_FOR_FORMATTING);

    const updated = buildSubmissionDocSuccessConfirmation({
      operation: "updated",
      verification: { ...verification, expectedWordCount: 99 },
      completedAt: "2026-07-13T22:00:00.000Z",
    });
    assert.equal(
      updated.statement,
      "Your submission document has been updated successfully"
    );
    assert.equal(updated.wordCount, 99);
    assert.equal(updated.completedAt, "2026-07-13T22:00:00.000Z");
  });

  it("formats completedAt in the requested locale", () => {
    const formatted = formatSubmissionDocCompletedAt(
      "2026-07-13T21:00:00.000Z",
      "en-US"
    );
    assert.ok(formatted.length > 0);
    assert.match(formatted, /2026|Jul|7/);
  });

  it("propagates timestamp and word count from verified Create and Update runs", async () => {
    const essayText = "First body paragraph here.\n\nSecond body paragraph here.";
    const expected = compareEssayToGoogleDocText({
      essayText,
      documentText: essayText,
    }).expectedWordCount;

    const createHarness = makeDeps({ essayText });
    const created = await runExportEssayToGoogleDocs({
      email: "student@example.edu",
      text: essayText,
      deps: createHarness.deps,
    });
    assert.equal(created.operation, "created");
    assert.equal(created.verification.verified, true);
    assert.ok(created.completedAt);
    assert.match(created.completedAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(created.verification.expectedWordCount, expected);

    const createConfirm = buildSubmissionDocSuccessConfirmation({
      operation: created.operation,
      verification: created.verification,
      completedAt: created.completedAt,
    });
    assert.ok(createConfirm);
    assert.equal(createConfirm.wordCount, expected);

    const updateHarness = makeDeps({
      existing: {
        document_id: created.documentId,
        web_view_link: created.webViewLink,
      },
      essayText,
    });
    // Seed doc map with current content so update path can read then rewrite.
    await updateHarness.deps.batchUpdate(created.documentId, [
      { insertText: { text: essayText } },
    ]);
    updateHarness.calls.batchUpdate = 0;

    const updatedEssay =
      "First body paragraph here with more words now.\n\nSecond body paragraph here.";
    const updatedExpected = compareEssayToGoogleDocText({
      essayText: updatedEssay,
      documentText: updatedEssay,
    }).expectedWordCount;

    await new Promise((r) => setTimeout(r, 5));

    const updated = await runExportEssayToGoogleDocs({
      email: "student@example.edu",
      text: updatedEssay,
      deps: updateHarness.deps,
    });
    assert.equal(updated.operation, "updated");
    assert.equal(updated.verification.verified, true);
    assert.ok(updated.completedAt);
    assert.match(updated.completedAt, /^\d{4}-\d{2}-\d{2}T/);
    // Re-export refreshes metadata (word count always; timestamp when clocks advance).
    assert.equal(updated.verification.expectedWordCount, updatedExpected);
    assert.notEqual(updatedExpected, expected);
    assert.ok(
      updated.completedAt >= created.completedAt,
      "re-export completion time should not move backward"
    );

    const updateConfirm = buildSubmissionDocSuccessConfirmation({
      operation: updated.operation,
      verification: updated.verification,
      completedAt: updated.completedAt,
    });
    assert.equal(updateConfirm.wordCount, updatedExpected);
    assert.notEqual(updateConfirm.wordCount, createConfirm.wordCount);
  });

  it("does not build rich success metadata on verification failure or temporary error", () => {
    assert.equal(
      buildSubmissionDocSuccessConfirmation({
        operation: "updated",
        verification: {
          verified: false,
          status: SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH,
          expectedWordCount: 40,
        },
        completedAt: "2026-07-13T21:00:00.000Z",
      }),
      null
    );

    assert.equal(
      buildSubmissionDocSuccessConfirmation({
        operation: "updated",
        verification: {
          verified: false,
          status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
          expectedWordCount: 40,
        },
        completedAt: "2026-07-13T21:00:00.000Z",
      }),
      null
    );

    assert.equal(
      buildSubmissionDocSuccessConfirmation({
        operation: "replacement_created",
        verification: { verified: false, expectedWordCount: 10 },
        completedAt: "2026-07-13T21:00:00.000Z",
      }),
      null
    );

    assert.equal(
      buildSubmissionDocSuccessConfirmation({
        operation: "updated",
        verification: { verified: true, expectedWordCount: 10 },
        completedAt: null,
      }),
      null
    );
  });

  it("wires confirmation through API, client, Module 8, and recovery panel", () => {
    const route = readSrc("app/api/export-to-docs/route.js");
    const client = readSrc(
      "lib/exports/createOrUpdateSubmissionGoogleDocClient.js"
    );
    const m8 = readSrc("components/ModuleEight.js");
    const panel = readSrc("components/exports/SubmissionDocRecoveryPanel.jsx");

    assert.ok(route.includes("buildSubmissionDocSuccessConfirmation"));
    assert.ok(route.includes("confirmation"));
    assert.ok(route.includes("completedAt"));
    assert.ok(!/essay\.text|essayText/.test(route.split("console.info")[1] || ""));

    assert.ok(client.includes("confirmation"));
    assert.ok(client.includes("buildSubmissionDocSuccessConfirmation"));
    assert.ok(client.includes("word_count: confirmation?.wordCount"));

    assert.ok(m8.includes("result.confirmation"));
    assert.ok(m8.includes("confirmation: result.confirmation"));
    assert.ok(m8.includes("confirmation: null"));

    assert.ok(panel.includes("success-confirmation"));
    assert.ok(panel.includes("SUBMISSION_DOC_READY_FOR_FORMATTING"));
    assert.ok(panel.includes("formatSubmissionDocCompletedAt"));
  });

  it("preserves WP-030 recovery and WP-031 button hierarchy contracts", () => {
    const mismatch = getSubmissionDocRecoveryPlan({
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH,
      hasUrl: true,
      contentVerified: false,
      requireSessionWrite: true,
    });
    assert.equal(mismatch.primaryAction, SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE);
    assert.equal(mismatch.allowProgression, false);

    const temp = getSubmissionDocRecoveryPlan({
      verificationStatus:
        SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
      hasUrl: true,
      contentVerified: false,
      requireSessionWrite: true,
    });
    assert.equal(temp.primaryAction, SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK);
    assert.equal(temp.allowProgression, false);

    const m8 = readSrc("components/ModuleEight.js");
    const panel = readSrc("components/exports/SubmissionDocRecoveryPanel.jsx");
    const wp031 = readSrc("tests/module8-wp031-action-buttons.test.js");

    assert.ok(m8.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m8.includes("showFooterKeepGoing"));
    assert.ok(m8.includes('data-testid="module8-format-open-doc"'));
    assert.ok(panel.includes("PRIMARY_BTN"));
    assert.ok(panel.includes("data-recovery-action"));
    assert.ok(wp031.includes("WP-031"));
  });
});
