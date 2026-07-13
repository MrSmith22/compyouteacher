/**
 * WP-030 — Module 8/9 submission Doc recovery actions.
 * Behavioral tests: recovery model, replacement transaction, auth boundaries.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  SUBMISSION_DOC_OPERATIONS,
} = require("../lib/exports/submissionGoogleDocHelpers.js");
const {
  runExportEssayToGoogleDocs,
} = require("../lib/exports/runExportEssayToGoogleDocs.js");
const {
  SUBMISSION_DOC_STATUS,
  reasonFromSubmissionDocOperation,
  SUBMISSION_DOC_OPERATION_MESSAGES,
} = require("../lib/exports/submissionGoogleDocClientMessages.js");
const {
  SUBMISSION_DOC_VERIFICATION_STATUS,
} = require("../lib/exports/submissionDocVerification.js");
const {
  getSubmissionDocRecoveryPlan,
  resolveSubmissionDocRecoveryStateId,
  SUBMISSION_DOC_RECOVERY_ACTIONS,
  SUBMISSION_DOC_RECOVERY_STATES,
} = require("../lib/exports/submissionDocRecovery.js");

function readSrc(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

function essayDoc(documentId, essayText) {
  return {
    documentId,
    body: {
      content: [
        { endIndex: 1 },
        {
          startIndex: 1,
          endIndex: 2 + essayText.length,
          paragraph: {
            elements: [{ textRun: { content: `${essayText}\n` } }],
          },
        },
      ],
    },
  };
}

function makeDeps({
  existingRow = null,
  createId = "doc-new-1",
  webViewLink = "https://docs.google.com/document/d/doc-new-1/edit",
  failAfterCreateVerify = false,
} = {}) {
  const calls = {
    createDocument: 0,
    deleteDocument: 0,
    upsertExportedDoc: 0,
    batchUpdate: 0,
    shareDocument: 0,
    upsertedRows: [],
    createdIds: [],
  };
  const bodies = new Map();

  return {
    calls,
    deps: {
      getExportedDocRow: async () => existingRow,
      upsertExportedDoc: async (row) => {
        calls.upsertExportedDoc += 1;
        calls.upsertedRows.push({ ...row });
        existingRow = { ...row };
      },
      createDocument: async () => {
        calls.createDocument += 1;
        calls.createdIds.push(createId);
        bodies.set(createId, essayDoc(createId, ""));
        return { documentId: createId };
      },
      getDocument: async (documentId) => {
        if (!bodies.has(documentId)) {
          const err = new Error("Not Found");
          err.code = 404;
          throw err;
        }
        return bodies.get(documentId);
      },
      batchUpdate: async (documentId, requests) => {
        calls.batchUpdate += 1;
        const text = requests.find((r) => r.insertText)?.insertText?.text || "";
        if (failAfterCreateVerify) {
          bodies.set(documentId, essayDoc(documentId, "WRONG BODY ONLY"));
        } else {
          bodies.set(documentId, essayDoc(documentId, text));
        }
      },
      shareDocument: async () => {
        calls.shareDocument += 1;
        return { publicReaderGranted: true };
      },
      getWebViewLink: async (documentId) => {
        if (existingRow?.document_id === documentId && existingRow?.web_view_link) {
          return existingRow.web_view_link;
        }
        return webViewLink.replace("doc-new-1", documentId);
      },
      // Intentionally absent — replacement must never delete Drive files
      deleteDocument: async () => {
        calls.deleteDocument += 1;
      },
    },
  };
}

describe("WP-030 recovery state model", () => {
  it("1. maps every core state to expected actions / progression", () => {
    const cases = [
      {
        name: "verified",
        input: {
          verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED,
          hasUrl: true,
          contentVerified: true,
        },
        state: SUBMISSION_DOC_RECOVERY_STATES.VERIFIED,
        primary: SUBMISSION_DOC_RECOVERY_ACTIONS.CONTINUE,
        allow: true,
      },
      {
        name: "mismatch",
        input: {
          verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH,
          hasUrl: true,
        },
        state: SUBMISSION_DOC_RECOVERY_STATES.MISMATCH,
        primary: SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE,
        allow: false,
      },
      {
        name: "missing_document",
        input: {
          verificationStatus:
            SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_DOCUMENT,
          hasUrl: false,
        },
        state: SUBMISSION_DOC_RECOVERY_STATES.MISSING_DOCUMENT,
        primary: SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE,
        allow: false,
      },
      {
        name: "existing_document_unavailable",
        input: {
          verificationStatus:
            SUBMISSION_DOC_VERIFICATION_STATUS.DOCUMENT_UNAVAILABLE,
          hasUrl: true,
        },
        state: SUBMISSION_DOC_RECOVERY_STATES.EXISTING_DOCUMENT_UNAVAILABLE,
        primary: SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW,
        allow: false,
      },
      {
        name: "verification_error",
        input: {
          verificationStatus:
            SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
          hasUrl: true,
        },
        state: SUBMISSION_DOC_RECOVERY_STATES.VERIFICATION_ERROR,
        primary: SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK,
        allow: false,
      },
      {
        name: "missing_essay",
        input: {
          verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_ESSAY,
          hasUrl: false,
        },
        state: SUBMISSION_DOC_RECOVERY_STATES.MISSING_ESSAY,
        primary: SUBMISSION_DOC_RECOVERY_ACTIONS.FINISH_ESSAY,
        allow: false,
      },
    ];

    for (const c of cases) {
      const plan = getSubmissionDocRecoveryPlan(c.input);
      assert.equal(plan.state, c.state, c.name);
      assert.equal(plan.primaryAction, c.primary, c.name);
      assert.equal(plan.allowProgression, c.allow, c.name);
    }
  });

  it("2. mismatch makes Update primary", () => {
    const plan = getSubmissionDocRecoveryPlan({
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH,
      hasUrl: true,
    });
    assert.equal(plan.primaryAction, SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE);
    assert.ok(plan.secondaryActions.includes(SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN));
    assert.ok(
      plan.secondaryActions.includes(SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK)
    );
    assert.ok(
      plan.secondaryActions.includes(SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW)
    );
  });

  it("3. temporary verification failure makes Retry primary (not mismatch / not create-new)", () => {
    const plan = getSubmissionDocRecoveryPlan({
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
      hasUrl: true,
    });
    assert.equal(
      plan.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.RETRY_CHECK
    );
    assert.notEqual(plan.state, SUBMISSION_DOC_RECOVERY_STATES.MISMATCH);
    assert.notEqual(
      plan.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW
    );
  });

  it("4. unavailable document makes Create-new primary", () => {
    const plan = getSubmissionDocRecoveryPlan({
      exportStatus: SUBMISSION_DOC_STATUS.EXISTING_DOCUMENT_UNAVAILABLE,
      hasUrl: true,
    });
    assert.equal(
      plan.primaryAction,
      SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW
    );
    assert.equal(plan.requireReplacementConfirmation, true);
  });

  it("5. missing row uses normal Create, not replacement copy", () => {
    const plan = getSubmissionDocRecoveryPlan({
      hasUrl: false,
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_DOCUMENT,
    });
    assert.equal(plan.primaryAction, SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE);
    assert.equal(plan.requireReplacementConfirmation, false);
    assert.ok(!/new Google Doc/i.test(plan.title));
    assert.ok(!/old document/i.test(plan.explanation));
  });

  it("6. verified keeps recovery actions secondary under disclosure", () => {
    const plan = getSubmissionDocRecoveryPlan({
      contentVerified: true,
      hasUrl: true,
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED,
    });
    assert.equal(plan.allowProgression, true);
    assert.equal(plan.showSecondaryDisclosure, true);
    assert.equal(plan.primaryAction, SUBMISSION_DOC_RECOVERY_ACTIONS.CONTINUE);
    assert.ok(
      plan.secondaryActions.includes(SUBMISSION_DOC_RECOVERY_ACTIONS.CREATE_NEW)
    );
  });

  it("Module 8 requireSessionWrite keeps revisit-verified as confirm/update", () => {
    const state = resolveSubmissionDocRecoveryStateId({
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED,
      hasUrl: true,
      contentVerified: false,
      requireSessionWrite: true,
    });
    assert.equal(state, SUBMISSION_DOC_RECOVERY_STATES.IDLE);
    const plan = getSubmissionDocRecoveryPlan({
      verificationStatus: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED,
      hasUrl: true,
      contentVerified: false,
      requireSessionWrite: true,
    });
    assert.equal(plan.allowProgression, false);
    assert.equal(plan.primaryAction, SUBMISSION_DOC_RECOVERY_ACTIONS.UPDATE);
  });
});

describe("WP-030 replacement + update operations", () => {
  it("9. Update keeps the same document ID/URL", async () => {
    const essay = "Authoritative essay paragraph one.";
    const existingUrl =
      "https://docs.google.com/document/d/same-doc/edit";
    const { deps, calls } = makeDeps({
      existingRow: {
        document_id: "same-doc",
        web_view_link: existingUrl,
      },
    });
    // Seed body so getDocument works before update
    deps.getDocument = async (id) => essayDoc(id, "old");
    const result = await runExportEssayToGoogleDocs({
      email: "student@school.edu",
      text: essay,
      deps: {
        ...deps,
        getDocument: async (id) => {
          if (!calls._seeded) {
            calls._seeded = true;
            return essayDoc(id, "old");
          }
          return essayDoc(id, essay);
        },
        batchUpdate: async (id, requests) => {
          calls.batchUpdate += 1;
          const text =
            requests.find((r) => r.insertText)?.insertText?.text || "";
          calls._lastText = text;
        },
      },
    });
    assert.equal(result.operation, SUBMISSION_DOC_OPERATIONS.UPDATED);
    assert.equal(result.documentId, "same-doc");
    assert.equal(result.webViewLink, existingUrl);
    assert.equal(calls.createDocument, 0);
  });

  it("10–14. Create-new generates new id; pointer swaps only after verify; no Drive delete", async () => {
    const essay = "Replacement essay body that must appear.";
    let stored = {
      document_id: "old-doc",
      web_view_link: "https://docs.google.com/document/d/old-doc/edit",
    };
    const calls = {
      create: 0,
      upsert: 0,
      delete: 0,
      upserted: [],
    };
    const bodies = new Map([["old-doc", essayDoc("old-doc", "old")]]);

    const deps = {
      getExportedDocRow: async () => stored,
      upsertExportedDoc: async (row) => {
        calls.upsert += 1;
        calls.upserted.push({ ...row });
        stored = { ...row };
      },
      createDocument: async () => {
        calls.create += 1;
        bodies.set("new-doc", essayDoc("new-doc", ""));
        return { documentId: "new-doc" };
      },
      getDocument: async (id) => {
        if (!bodies.has(id)) {
          const err = new Error("Not Found");
          err.code = 404;
          throw err;
        }
        return bodies.get(id);
      },
      batchUpdate: async (id, requests) => {
        const text = requests.find((r) => r.insertText)?.insertText?.text || "";
        bodies.set(id, essayDoc(id, text));
      },
      shareDocument: async () => ({ ok: true }),
      getWebViewLink: async (id) =>
        `https://docs.google.com/document/d/${id}/edit`,
    };

    const result = await runExportEssayToGoogleDocs({
      email: "student@school.edu",
      text: essay,
      deps,
      forceCreate: true,
    });

    assert.equal(result.operation, SUBMISSION_DOC_OPERATIONS.REPLACEMENT_CREATED);
    assert.equal(result.documentId, "new-doc");
    assert.notEqual(result.documentId, "old-doc");
    assert.equal(result.previousDocumentId, "old-doc");
    assert.equal(result.pointerReplaced, true);
    assert.equal(calls.create, 1);
    assert.equal(calls.upsert, 1);
    assert.equal(stored.document_id, "new-doc");
    assert.equal(calls.delete, 0);
    assert.ok(bodies.has("old-doc"), "old Drive document body remains");
    assert.equal(result.verification.verified, true);
  });

  it("11–12. failed replacement preserves old pointer; never returns as update", async () => {
    let stored = {
      document_id: "old-doc",
      web_view_link: "https://docs.google.com/document/d/old-doc/edit",
    };
    const upserts = [];
    const bodies = new Map([["old-doc", essayDoc("old-doc", "old")]]);

    const deps = {
      getExportedDocRow: async () => stored,
      upsertExportedDoc: async (row) => {
        upserts.push(row);
        stored = { ...row };
      },
      createDocument: async () => {
        bodies.set("orphan-doc", essayDoc("orphan-doc", ""));
        return { documentId: "orphan-doc" };
      },
      getDocument: async (id) => bodies.get(id),
      batchUpdate: async (id) => {
        bodies.set(id, essayDoc(id, "CORRUPTED NOT ESSAY"));
      },
      shareDocument: async () => ({}),
      getWebViewLink: async (id) =>
        `https://docs.google.com/document/d/${id}/edit`,
    };

    await assert.rejects(
      () =>
        runExportEssayToGoogleDocs({
          email: "student@school.edu",
          text: "Expected essay text",
          deps,
          forceCreate: true,
        }),
      (err) => err.code === "replacement_verification_failed"
    );

    assert.equal(upserts.length, 0);
    assert.equal(stored.document_id, "old-doc");
  });

  it("15–16. first create without existing row is created (not replacement); empty essay throws", async () => {
    const { deps, calls } = makeDeps({ existingRow: null });
    const result = await runExportEssayToGoogleDocs({
      email: "student@school.edu",
      text: "First time essay",
      deps,
      forceCreate: true,
    });
    assert.equal(result.operation, SUBMISSION_DOC_OPERATIONS.CREATED);
    assert.equal(calls.createDocument, 1);

    await assert.rejects(
      () =>
        runExportEssayToGoogleDocs({
          email: "student@school.edu",
          text: "   ",
          deps,
        }),
      /Missing text or email/
    );
  });
});

describe("WP-030 messaging + operation naming", () => {
  it("never uses recreated; replacement_created has distinct copy", () => {
    assert.equal(
      reasonFromSubmissionDocOperation("replacement_created"),
      SUBMISSION_DOC_STATUS.REPLACEMENT_SUCCEEDED
    );
    assert.ok(SUBMISSION_DOC_OPERATION_MESSAGES.replacement_created);
    assert.equal(SUBMISSION_DOC_OPERATION_MESSAGES.recreated, undefined);

    const helpers = readSrc("lib/exports/submissionGoogleDocHelpers.js");
    const messages = readSrc(
      "lib/exports/submissionGoogleDocClientMessages.js"
    );
    const exportTs = readSrc("lib/exports/exportEssayToGoogleDocs.ts");
    assert.ok(!helpers.includes("RECREATED"));
    assert.ok(!helpers.includes('"recreated"'));
    assert.ok(!messages.includes("recreated"));
    assert.ok(!exportTs.includes("recreated"));
    assert.ok(helpers.includes("REPLACEMENT_CREATED"));
  });
});

describe("WP-030 wiring + safety integrity", () => {
  it("17–26. confirmation UI, buttons, no silent recreate, WP paths intact", () => {
    const panel = readSrc(
      "components/exports/SubmissionDocRecoveryPanel.jsx"
    );
    const m8 = readSrc("components/ModuleEight.js");
    const m9 = readSrc("components/ModuleNine.js");
    const client = readSrc(
      "lib/exports/createOrUpdateSubmissionGoogleDocClient.js"
    );
    const route = readSrc("app/api/export-to-docs/route.js");
    const runExport = readSrc("lib/exports/runExportEssayToGoogleDocs.js");
    const verifyRoute = readSrc("app/api/verify-submission-doc/route.js");
    const m9Apa = readSrc("components/ModuleNine.js");
    const recovery = readSrc("lib/exports/submissionDocRecovery.js");
    const devPanel = readSrc("components/dev/DeveloperTestingPanel.jsx");
    const devServer = readSrc("lib/dev/devPanelServer.ts");

    // 17 confirmation required
    assert.ok(recovery.includes("Create a new Google Doc?"));
    assert.ok(panel.includes("SUBMISSION_DOC_REPLACEMENT_CONFIRMATION"));
    assert.ok(panel.includes("aria-describedby"));
    assert.ok(panel.includes('role="dialog"'));
    assert.ok(panel.includes("Escape"));
    assert.ok(!m8.includes("window.confirm"));
    assert.ok(!m9.includes("window.confirm"));

    // 18 double-submit guards
    assert.ok(panel.includes("inFlightRef"));
    assert.ok(m8.includes("exportInFlightRef"));
    assert.ok(panel.includes("min-h-[44px]"));

    // 8 Open never mutates — Open uses window.open only
    assert.ok(panel.includes("SUBMISSION_DOC_RECOVERY_ACTIONS.OPEN"));
    assert.ok(panel.includes("window.open(docUrl"));

    // 21–23 WP-002 / 028 / 029 still wired
    assert.ok(m8.includes("docVerifiedThisSession"));
    assert.ok(runExport.includes("forceCreate"));
    assert.ok(runExport.includes("ExistingDocumentUnavailableError"));
    assert.ok(verifyRoute.length > 0);
    assert.ok(client.includes("verifySubmissionGoogleDocContent"));
    assert.ok(client.includes("forceCreate"));

    // 25 no essay bodies / override email in recovery logs
    assert.ok(client.includes("submission_doc_recovery_started"));
    assert.ok(client.includes("submission_doc_recovery_succeeded"));
    assert.ok(client.includes("submission_doc_recovery_failed"));
    assert.ok(client.includes("submission_doc_replacement_cancelled"));
    assert.ok(!client.includes("DEV_GOOGLE_DOC_EDITOR_EMAIL"));
    assert.ok(route.includes("Never log essay text"));

    // 26 actions are buttons
    assert.ok(panel.includes("<button"));
    assert.ok(panel.includes("data-recovery-action"));

    // Shared recovery model used by both modules
    assert.ok(m8.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m9.includes("SubmissionDocRecoveryPanel"));
    assert.ok(recovery.includes("getSubmissionDocRecoveryPlan"));

    // Dev simulations present and labeled
    assert.ok(devPanel.includes("WP-030 Doc recovery simulations"));
    assert.ok(devPanel.includes("Simulate: stale document ID"));
    assert.ok(devServer.includes("simulateStaleGoogleDoc"));
    assert.ok(/does not delete/i.test(devServer));

    // Module 9 APA checklist/PDF gates still depend on docReady
    assert.ok(m9Apa.includes("docReady"));
    assert.ok(m9Apa.includes("checklistComplete"));
  });

  it("Retry verification never exports", () => {
    const client = readSrc(
      "lib/exports/createOrUpdateSubmissionGoogleDocClient.js"
    );
    const verifyFn = client.slice(
      client.indexOf("export async function verifySubmissionGoogleDocContent"),
      client.indexOf("export async function createOrUpdateSubmissionGoogleDoc")
    );
    assert.ok(verifyFn.includes("/api/verify-submission-doc"));
    assert.ok(!verifyFn.includes("/api/export-to-docs"));
  });

  it("API accepts only forceCreate boolean; ignores client essay/doc id authority", () => {
    const route = readSrc("app/api/export-to-docs/route.js");
    assert.ok(route.includes("forceCreate === true"));
    assert.ok(route.includes("getAuthoritativeEssayTextForUser"));
    assert.ok(route.includes("session.user.email"));
    assert.ok(!route.includes("body.documentId"));
    assert.ok(!route.includes("body.text"));
  });
});
