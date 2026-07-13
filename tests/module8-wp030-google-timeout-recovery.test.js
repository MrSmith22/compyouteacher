/**
 * WP-030 hang/timeout recovery — stalled Google ops must fail safely.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  withGoogleTimeout,
  GoogleOperationTimeoutError,
  isGoogleOperationTimeoutError,
  GOOGLE_OPERATION_TIMEOUT_MS,
} = require("../lib/exports/googleOperationTimeout.js");
const {
  runExportEssayToGoogleDocs,
  isNotFoundOrInaccessible,
} = require("../lib/exports/runExportEssayToGoogleDocs.js");
const {
  getSubmissionDocRecoveryPlan,
  SUBMISSION_DOC_RECOVERY_ACTIONS,
  SUBMISSION_DOC_RECOVERY_STATES,
} = require("../lib/exports/submissionDocRecovery.js");
const {
  SUBMISSION_DOC_VERIFICATION_STATUS,
} = require("../lib/exports/submissionDocVerification.js");
const {
  SUBMISSION_DOC_STATUS,
} = require("../lib/exports/submissionGoogleDocClientMessages.js");
const {
  isGrantableGoogleWriterEmail,
  resolveWriterRecipientEmails,
} = require("../lib/exports/devGoogleDocEditorOverride.js");
const {
  armTemporaryVerificationFailure,
  consumeTemporaryVerificationFailure,
} = require("../lib/dev/devSubmissionDocSimulations.js");

function readSrc(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

describe("WP-030 Google operation timeouts", () => {
  it("stalled external Google call times out with structured error", async () => {
    const never = new Promise(() => {});
    await assert.rejects(
      () =>
        withGoogleTimeout(never, {
          step: "docs.batchUpdate",
          timeoutMs: 40,
        }),
      (err) =>
        err instanceof GoogleOperationTimeoutError &&
        err.code === "google_operation_timeout" &&
        err.step === "docs.batchUpdate"
    );
  });

  it("update path maps a stalled shareDocument to timeout (not unavailable / not replacement)", async () => {
    const essay = "Timeout regression essay paragraph.";
    let upserts = 0;
    let creates = 0;

    await assert.rejects(
      () =>
        runExportEssayToGoogleDocs({
          email: "dev-student@localhost",
          text: essay,
          deps: {
            getExportedDocRow: async () => ({
              document_id: "same-doc",
              web_view_link: "https://docs.google.com/document/d/same-doc/edit",
            }),
            upsertExportedDoc: async () => {
              upserts += 1;
            },
            createDocument: async () => {
              creates += 1;
              return { documentId: "new-should-not" };
            },
            getDocument: async (id) => ({
              documentId: id,
              body: {
                content: [
                  { endIndex: 1 },
                  {
                    startIndex: 1,
                    endIndex: 20,
                    paragraph: {
                      elements: [{ textRun: { content: `${essay}\n` } }],
                    },
                  },
                ],
              },
            }),
            batchUpdate: async () => {},
            shareDocument: async () =>
              withGoogleTimeout(new Promise(() => {}), {
                step: "drive.permissions.writer",
                timeoutMs: 35,
              }),
            getWebViewLink: async () =>
              "https://docs.google.com/document/d/same-doc/edit",
          },
        }),
      (err) => isGoogleOperationTimeoutError(err)
    );

    assert.equal(creates, 0);
    assert.equal(upserts, 0);
    assert.equal(isNotFoundOrInaccessible({ code: "google_operation_timeout" }), false);
  });

  it("timeout is recognized as temporary recovery (Retry), not mismatch", () => {
    const plan = getSubmissionDocRecoveryPlan({
      verificationStatus:
        SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
      exportStatus: SUBMISSION_DOC_STATUS.API_FAILED,
      hasUrl: true,
      contentVerified: false,
    });
    assert.equal(plan.state, SUBMISSION_DOC_RECOVERY_STATES.VERIFICATION_ERROR);
    assert.equal(plan.primaryAction, SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK);
    assert.ok(plan.secondaryActions.includes(SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN));
    assert.notEqual(plan.primaryAction, SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE);
    assert.notEqual(
      plan.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW
    );
    assert.equal(plan.allowProgression, false);
  });

  it("Retry check wiring never exports; temporary sim is one-shot", () => {
    const client = readSrc(
      "lib/exports/createOrUpdateSubmissionGoogleDocClient.js"
    );
    const verifyFn = client.slice(
      client.indexOf("export async function verifySubmissionGoogleDocContent"),
      client.indexOf("export async function createOrUpdateSubmissionGoogleDoc")
    );
    assert.ok(verifyFn.includes("/api/verify-submission-doc"));
    assert.ok(!verifyFn.includes("/api/export-to-docs"));
    assert.ok(verifyFn.includes("AbortController"));

    const email = "dev-student@localhost";
    armTemporaryVerificationFailure(email);
    const first = consumeTemporaryVerificationFailure(email);
    const second = consumeTemporaryVerificationFailure(email);
    assert.ok(first);
    assert.equal(second, null);
  });

  it("client clears busy path on timeout codes; double-click guards present", () => {
    const client = readSrc(
      "lib/exports/createOrUpdateSubmissionGoogleDocClient.js"
    );
    const m8 = readSrc("components/ModuleEight.js");
    const panel = readSrc("components/exports/SubmissionDocRecoveryPanel.jsx");
    const route = readSrc("app/api/export-to-docs/route.js");

    assert.ok(client.includes("google_operation_timeout"));
    assert.ok(client.includes("temporaryFailure"));
    assert.ok(client.includes("AbortController"));
    assert.ok(m8.includes("exportInFlightRef"));
    assert.ok(panel.includes("inFlightRef"));
    assert.ok(route.includes("504"));
    assert.ok(route.includes("GOOGLE_OPERATION_TIMEOUT"));
    assert.ok(route.includes("isGoogleOperationTimeoutError"));
  });

  it("localhost student emails are not granted as Drive writers", () => {
    assert.equal(isGrantableGoogleWriterEmail("dev-student@localhost"), false);
    assert.equal(isGrantableGoogleWriterEmail("teacher@school.edu"), true);
    const { writers } = resolveWriterRecipientEmails({
      studentEmail: "dev-student@localhost",
      editorEmail: "editor@school.edu",
      nodeEnv: "development",
    });
    assert.deepEqual(writers, ["editor@school.edu"]);
  });

  it("default timeout constant is bounded", () => {
    assert.ok(GOOGLE_OPERATION_TIMEOUT_MS >= 5000);
    assert.ok(GOOGLE_OPERATION_TIMEOUT_MS <= 60_000);
  });
});
