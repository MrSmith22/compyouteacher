/**
 * Development Google Doc editor override (DEV_GOOGLE_DOC_EDITOR_EMAIL).
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  sanitizeGoogleEditorEmail,
  resolveDevGoogleDocEditorOverride,
  resolveWriterRecipientEmails,
  grantSubmissionDocPermissions,
} = require("../lib/exports/devGoogleDocEditorOverride.js");
const {
  runExportEssayToGoogleDocs,
} = require("../lib/exports/runExportEssayToGoogleDocs.js");

function readSrc(rel) {
  return fs.readFileSync(path.join(__dirname, rel), "utf8");
}

const DEV_STUDENT = "dev-student@localhost";
const REAL_EDITOR = "dev.tester@example.com";
const REAL_STUDENT = "student@school.edu";

describe("DEV_GOOGLE_DOC_EDITOR_EMAIL policy helpers", () => {
  it("1. no override when the environment variable is absent", () => {
    const result = resolveDevGoogleDocEditorOverride({
      studentEmail: DEV_STUDENT,
      editorEmail: "",
      nodeEnv: "development",
    });
    assert.equal(result.eligible, false);
    assert.equal(result.reason, "missing");
    assert.deepEqual(
      resolveWriterRecipientEmails({
        studentEmail: DEV_STUDENT,
        editorEmail: "",
        nodeEnv: "development",
      }).writers,
      [DEV_STUDENT]
    );
  });

  it("2. no override in production", () => {
    const result = resolveDevGoogleDocEditorOverride({
      studentEmail: DEV_STUDENT,
      editorEmail: REAL_EDITOR,
      nodeEnv: "production",
      devAuthEnabled: false,
    });
    assert.equal(result.eligible, false);
    assert.equal(result.reason, "not_dev_runtime");
    assert.deepEqual(
      resolveWriterRecipientEmails({
        studentEmail: REAL_STUDENT,
        editorEmail: REAL_EDITOR,
        nodeEnv: "production",
      }).writers,
      [REAL_STUDENT]
    );
  });

  it("3. valid override in development", () => {
    const result = resolveDevGoogleDocEditorOverride({
      studentEmail: DEV_STUDENT,
      editorEmail: `  ${REAL_EDITOR.toUpperCase()}  `,
      nodeEnv: "development",
    });
    assert.equal(result.eligible, true);
    assert.equal(result.editorEmail, REAL_EDITOR);
  });

  it("4. invalid/local override is rejected", () => {
    assert.equal(sanitizeGoogleEditorEmail("dev-student@localhost"), null);
    assert.equal(sanitizeGoogleEditorEmail("not-an-email"), null);
    assert.equal(
      resolveDevGoogleDocEditorOverride({
        studentEmail: DEV_STUDENT,
        editorEmail: "someone@localhost",
        nodeEnv: "development",
      }).eligible,
      false
    );
  });

  it("5. real student email remains a recipient in production", () => {
    const { writers } = resolveWriterRecipientEmails({
      studentEmail: REAL_STUDENT,
      editorEmail: REAL_EDITOR,
      nodeEnv: "production",
    });
    assert.deepEqual(writers, [REAL_STUDENT]);
  });

  it("6. duplicate student/override email is granted only once", () => {
    const { writers } = resolveWriterRecipientEmails({
      studentEmail: REAL_EDITOR,
      editorEmail: REAL_EDITOR,
      // Student must be localhost for override eligibility; when student is
      // a real email matching override, override is not eligible.
      nodeEnv: "development",
    });
    assert.deepEqual(writers, [REAL_EDITOR]);

    // Eligible localhost student + same editor as a second distinct recipient
    // already covered; when student equals override after sanitize, once:
    const dup = resolveWriterRecipientEmails({
      studentEmail: DEV_STUDENT,
      editorEmail: REAL_EDITOR,
      nodeEnv: "development",
    });
    assert.deepEqual(dup.writers, [DEV_STUDENT, REAL_EDITOR]);
    assert.equal(new Set(dup.writers.map((w) => w.toLowerCase())).size, 2);
  });
});

describe("grantSubmissionDocPermissions + export create/update", () => {
  it("7. create grants the eligible dev editor writer access", async () => {
    const granted = [];
    const result = await grantSubmissionDocPermissions({
      documentId: "doc-create-1",
      studentEmail: DEV_STUDENT,
      createPermission: async (body) => {
        granted.push(body);
      },
      env: {
        NODE_ENV: "development",
        DEV_GOOGLE_DOC_EDITOR_EMAIL: REAL_EDITOR,
      },
    });

    assert.equal(result.overrideWriterAttempted, true);
    assert.equal(result.overrideWriterGranted, true);
    assert.equal(result.studentWriterGranted, true);
    assert.equal(result.publicReaderGranted, true);
    assert.ok(
      granted.some(
        (g) =>
          g.type === "user" &&
          g.role === "writer" &&
          g.emailAddress === REAL_EDITOR
      )
    );
    assert.ok(
      granted.some(
        (g) =>
          g.type === "user" &&
          g.role === "writer" &&
          g.emailAddress === DEV_STUDENT
      )
    );
    assert.ok(granted.some((g) => g.type === "anyone" && g.role === "reader"));
  });

  it("8–9. update grants/repairs eligible editor without creating; same ID/URL", async () => {
    const shareCalls = [];
    const createCalls = [];
    const existingUrl =
      "https://docs.google.com/document/d/existing-doc-9/edit";

    const result = await runExportEssayToGoogleDocs({
      email: DEV_STUDENT,
      text: "Updated essay for permission repair",
      deps: {
        getExportedDocRow: async () => ({
          document_id: "existing-doc-9",
          web_view_link: existingUrl,
        }),
        upsertExportedDoc: async () => {},
        createDocument: async () => {
          createCalls.push(true);
          return { documentId: "should-not-create" };
        },
        getDocument: async (documentId) => ({
          documentId,
          body: {
            content: [{ endIndex: 1 }, { startIndex: 1, endIndex: 40 }],
          },
        }),
        batchUpdate: async () => {},
        shareDocument: async (documentId, email) => {
          shareCalls.push({ documentId, email });
          return grantSubmissionDocPermissions({
            documentId,
            studentEmail: email,
            createPermission: async () => {},
            env: {
              NODE_ENV: "development",
              DEV_GOOGLE_DOC_EDITOR_EMAIL: REAL_EDITOR,
            },
          });
        },
        getWebViewLink: async () => existingUrl,
      },
    });

    assert.equal(createCalls.length, 0);
    assert.equal(shareCalls.length, 1);
    assert.equal(shareCalls[0].documentId, "existing-doc-9");
    assert.equal(shareCalls[0].email, DEV_STUDENT);
    assert.equal(result.operation, "updated");
    assert.equal(result.documentId, "existing-doc-9");
    assert.equal(result.webViewLink, existingUrl);
    assert.equal(result.permissions?.overrideWriterGranted, true);
  });

  it("override failure is reported accurately (not claimed granted)", async () => {
    const result = await grantSubmissionDocPermissions({
      documentId: "doc-fail",
      studentEmail: DEV_STUDENT,
      createPermission: async (body) => {
        if (body.emailAddress === REAL_EDITOR) {
          throw new Error("insufficientPermissions");
        }
      },
      env: {
        NODE_ENV: "development",
        DEV_GOOGLE_DOC_EDITOR_EMAIL: REAL_EDITOR,
      },
    });
    assert.equal(result.overrideWriterAttempted, true);
    assert.equal(result.overrideWriterGranted, false);
    assert.equal(result.studentWriterGranted, true);
    assert.equal(result.publicReaderGranted, true);
  });
});

describe("client/API surface stays free of override email", () => {
  it("10. environment email never appears in client source or API response", () => {
    const client = readSrc(
      "../lib/exports/createOrUpdateSubmissionGoogleDocClient.js"
    );
    const messages = readSrc(
      "../lib/exports/submissionGoogleDocClientMessages.js"
    );
    const route = readSrc("../app/api/export-to-docs/route.js");
    const panel = readSrc("../components/dev/DeveloperTestingPanel.jsx");
    const m8 = readSrc("../components/ModuleEight.js");
    const m9 = readSrc("../components/ModuleNine.js");

    for (const src of [client, messages, route, panel, m8, m9]) {
      assert.equal(src.includes("DEV_GOOGLE_DOC_EDITOR_EMAIL"), false);
      assert.equal(src.includes(REAL_EDITOR), false);
    }

    assert.ok(route.includes("url: result.webViewLink"));
    assert.ok(route.includes("documentId: result.documentId"));
    assert.ok(route.includes("operation: result.operation"));
    assert.equal(route.includes("permissions"), false);
    assert.equal(route.includes("overrideWriter"), false);

    const example = readSrc("../.env.example");
    assert.ok(example.includes("DEV_GOOGLE_DOC_EDITOR_EMAIL="));
  });
});
