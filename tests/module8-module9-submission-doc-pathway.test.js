/**
 * WP-028 — submission Google Doc create vs update-in-place.
 * Behavioral tests with injectable deps + pure helpers.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  SUBMISSION_DOC_OPERATIONS,
  SUBMISSION_DOC_ERROR_CODES,
  ExistingDocumentUnavailableError,
  getGoogleDocBodyEndIndex,
  buildReplaceGoogleDocBodyRequests,
  resolveSubmissionDocPlan,
} = require("../lib/exports/submissionGoogleDocHelpers.js");
const {
  runExportEssayToGoogleDocs,
} = require("../lib/exports/runExportEssayToGoogleDocs.js");
const {
  getSubmissionDocStatusMessage,
  SUBMISSION_DOC_STATUS,
} = require("../lib/exports/submissionGoogleDocClientMessages.js");

function readSrc(rel) {
  return fs.readFileSync(path.join(__dirname, rel), "utf8");
}

function emptyDoc(documentId = "doc-new") {
  return {
    documentId,
    body: {
      content: [{ endIndex: 1 }, { startIndex: 1, endIndex: 2 }],
    },
  };
}

function populatedDoc(documentId, endIndex = 50) {
  return {
    documentId,
    body: {
      content: [
        { endIndex: 1 },
        { startIndex: 1, endIndex },
      ],
    },
  };
}

function makeDeps({
  existingRow = null,
  documentBodies = new Map(),
  createId = "doc-created-1",
  webViewLink = "https://docs.google.com/document/d/doc-created-1/edit",
} = {}) {
  const calls = {
    createDocument: 0,
    getDocument: 0,
    batchUpdate: 0,
    shareDocument: 0,
    getWebViewLink: 0,
    upsertExportedDoc: 0,
    getExportedDocRow: 0,
    batchRequests: [],
    upsertedRows: [],
  };

  const bodies = new Map(documentBodies);

  return {
    calls,
    deps: {
      getExportedDocRow: async () => {
        calls.getExportedDocRow += 1;
        return existingRow;
      },
      upsertExportedDoc: async (row) => {
        calls.upsertExportedDoc += 1;
        calls.upsertedRows.push(row);
      },
      createDocument: async () => {
        calls.createDocument += 1;
        bodies.set(createId, emptyDoc(createId));
        return { documentId: createId };
      },
      getDocument: async (documentId) => {
        calls.getDocument += 1;
        if (!bodies.has(documentId)) {
          const err = new Error("Not Found");
          err.code = 404;
          throw err;
        }
        return bodies.get(documentId);
      },
      batchUpdate: async (documentId, requests) => {
        calls.batchUpdate += 1;
        calls.batchRequests.push({ documentId, requests });
        const textReq = requests.find((r) => r.insertText);
        const text = textReq?.insertText?.text || "";
        bodies.set(documentId, {
          documentId,
          body: {
            content: [
              { endIndex: 1 },
              {
                startIndex: 1,
                endIndex: Math.max(2, 1 + text.length + 1),
                paragraph: {
                  elements: [{ textRun: { content: `${text}\n` } }],
                },
              },
            ],
          },
        });
      },
      shareDocument: async () => {
        calls.shareDocument += 1;
        return {
          studentWriterGranted: true,
          overrideWriterAttempted: false,
          overrideWriterGranted: null,
          publicReaderGranted: true,
          writerRecipientCount: 1,
        };
      },
      getWebViewLink: async (documentId) => {
        calls.getWebViewLink += 1;
        if (existingRow?.document_id === documentId && existingRow?.web_view_link) {
          return existingRow.web_view_link;
        }
        return webViewLink.replace("doc-created-1", documentId);
      },
    },
  };
}

describe("WP-028 Google Doc helpers (ranges + plan)", () => {
  it("empty-document replacement uses insert-only valid range", () => {
    const endIndex = getGoogleDocBodyEndIndex(emptyDoc());
    assert.equal(endIndex, 2);
    const requests = buildReplaceGoogleDocBodyRequests({
      endIndex,
      text: "Hello essay",
    });
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0], {
      insertText: { location: { index: 1 }, text: "Hello essay" },
    });
  });

  it("populated-document replacement deletes then inserts with valid indices", () => {
    const endIndex = getGoogleDocBodyEndIndex(populatedDoc("doc-1", 80));
    assert.equal(endIndex, 80);
    const requests = buildReplaceGoogleDocBodyRequests({
      endIndex,
      text: "Latest essay",
    });
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[0], {
      deleteContentRange: {
        range: { startIndex: 1, endIndex: 79 },
      },
    });
    assert.deepEqual(requests[1], {
      insertText: { location: { index: 1 }, text: "Latest essay" },
    });
  });

  it("resolveSubmissionDocPlan chooses create vs update from stored row", () => {
    assert.equal(resolveSubmissionDocPlan(null).mode, "create");
    assert.equal(resolveSubmissionDocPlan({}).mode, "create");
    const plan = resolveSubmissionDocPlan({
      document_id: "abc",
      web_view_link: "https://docs.google.com/document/d/abc/edit",
    });
    assert.equal(plan.mode, "update");
    assert.equal(plan.documentId, "abc");
  });
});

describe("WP-028 runExportEssayToGoogleDocs create/update", () => {
  it("1. no existing row calls Google Docs create", async () => {
    const { deps, calls } = makeDeps({ existingRow: null });
    const result = await runExportEssayToGoogleDocs({
      email: "student@school.edu",
      text: "Essay body",
      deps,
    });
    assert.equal(calls.createDocument, 1);
    assert.equal(result.operation, SUBMISSION_DOC_OPERATIONS.CREATED);
    assert.equal(result.documentId, "doc-created-1");
  });

  it("2–4. existing row does not create; updates stored id; same URL", async () => {
    const existingUrl =
      "https://docs.google.com/document/d/existing-doc-9/edit";
    const { deps, calls } = makeDeps({
      existingRow: {
        document_id: "existing-doc-9",
        web_view_link: existingUrl,
      },
      documentBodies: new Map([
        ["existing-doc-9", populatedDoc("existing-doc-9", 40)],
      ]),
    });

    const result = await runExportEssayToGoogleDocs({
      email: "student@school.edu",
      text: "Updated essay body",
      deps,
    });

    assert.equal(calls.createDocument, 0);
    assert.equal(calls.batchUpdate, 1);
    assert.equal(calls.shareDocument, 1);
    assert.equal(calls.upsertExportedDoc, 1);
    assert.equal(result.operation, SUBMISSION_DOC_OPERATIONS.UPDATED);
    assert.equal(result.documentId, "existing-doc-9");
    assert.equal(result.webViewLink, existingUrl);
    assert.equal(calls.upsertedRows[0].document_id, "existing-doc-9");
    assert.equal(calls.upsertedRows[0].web_view_link, existingUrl);
    assert.equal(calls.batchRequests[0].documentId, "existing-doc-9");
  });

  it("5–6. empty and populated replacement ranges are valid on update", async () => {
    const emptyCase = makeDeps({
      existingRow: {
        document_id: "empty-doc",
        web_view_link: "https://docs.google.com/document/d/empty-doc/edit",
      },
      documentBodies: new Map([["empty-doc", emptyDoc("empty-doc")]]),
    });
    await runExportEssayToGoogleDocs({
      email: "a@b.edu",
      text: "New",
      deps: emptyCase.deps,
    });
    const emptyReqs = emptyCase.calls.batchRequests[0].requests;
    assert.equal(emptyReqs.some((r) => r.deleteContentRange), false);
    assert.equal(emptyReqs[0].insertText.location.index, 1);

    const populatedCase = makeDeps({
      existingRow: {
        document_id: "full-doc",
        web_view_link: "https://docs.google.com/document/d/full-doc/edit",
      },
      documentBodies: new Map([["full-doc", populatedDoc("full-doc", 25)]]),
    });
    await runExportEssayToGoogleDocs({
      email: "a@b.edu",
      text: "New",
      deps: populatedCase.deps,
    });
    const fullReqs = populatedCase.calls.batchRequests[0].requests;
    assert.equal(fullReqs[0].deleteContentRange.range.startIndex, 1);
    assert.equal(fullReqs[0].deleteContentRange.range.endIndex, 24);
    assert.equal(fullReqs[1].insertText.location.index, 1);
  });

  it("7. inaccessible existing document yields existing_document_unavailable", async () => {
    const { deps, calls } = makeDeps({
      existingRow: {
        document_id: "missing-doc",
        web_view_link: "https://docs.google.com/document/d/missing-doc/edit",
      },
      documentBodies: new Map(),
    });

    await assert.rejects(
      () =>
        runExportEssayToGoogleDocs({
          email: "student@school.edu",
          text: "Essay",
          deps,
        }),
      (err) => {
        assert.ok(err instanceof ExistingDocumentUnavailableError);
        assert.equal(
          err.code,
          SUBMISSION_DOC_ERROR_CODES.EXISTING_DOCUMENT_UNAVAILABLE
        );
        return true;
      }
    );
    assert.equal(calls.createDocument, 0);
    assert.equal(calls.upsertExportedDoc, 0);
  });

  it("9. one export run performs one write path (create XOR update)", async () => {
    const createRun = makeDeps({ existingRow: null });
    await runExportEssayToGoogleDocs({
      email: "a@b.edu",
      text: "T",
      deps: createRun.deps,
    });
    assert.equal(createRun.calls.createDocument, 1);
    assert.equal(createRun.calls.batchUpdate, 1);
    assert.equal(createRun.calls.upsertExportedDoc, 1);

    const updateRun = makeDeps({
      existingRow: {
        document_id: "d1",
        web_view_link: "https://docs.google.com/document/d/d1/edit",
      },
      documentBodies: new Map([["d1", populatedDoc("d1", 10)]]),
    });
    await runExportEssayToGoogleDocs({
      email: "a@b.edu",
      text: "T",
      deps: updateRun.deps,
    });
    assert.equal(updateRun.calls.createDocument, 0);
    assert.equal(updateRun.calls.batchUpdate, 1);
    assert.equal(updateRun.calls.shareDocument, 1);
    assert.equal(updateRun.calls.upsertExportedDoc, 1);
  });
});

describe("WP-028 client messaging uses server operation", () => {
  it("8. success messages and status follow server operation, not client hadExistingDoc", () => {
    assert.equal(
      getSubmissionDocStatusMessage(SUBMISSION_DOC_STATUS.READY, {
        operation: "created",
        hadExistingDoc: true,
      }),
      "Your Google Doc is ready. Open it to continue formatting."
    );
    assert.match(
      getSubmissionDocStatusMessage(SUBMISSION_DOC_STATUS.UPDATE_SUCCEEDED, {
        operation: "updated",
        hadExistingDoc: false,
      }),
      /same Google Doc.*Review your APA formatting/i
    );
    assert.match(
      getSubmissionDocStatusMessage(
        SUBMISSION_DOC_STATUS.EXISTING_DOCUMENT_UNAVAILABLE
      ),
      /could not be opened or updated/i
    );
  });

  it("client records server operation for activity (source)", () => {
    const shared = readSrc(
      "../lib/exports/createOrUpdateSubmissionGoogleDocClient.js"
    );
    assert.ok(shared.includes("operation,"));
    assert.ok(shared.includes('updated_existing: operation === "updated"'));
    assert.ok(shared.includes("result.operation"));
    assert.ok(shared.includes("existing_document_unavailable"));
    assert.equal(shared.includes("updated_existing: hadExistingDoc"), false);
  });
});

describe("WP-028 Module 8/9 pathway wiring", () => {
  it("shared pathway + single server pipeline + seeds use production export", () => {
    const shared = readSrc(
      "../lib/exports/createOrUpdateSubmissionGoogleDocClient.js"
    );
    const route = readSrc("../app/api/export-to-docs/route.js");
    const server = readSrc("../lib/exports/exportEssayToGoogleDocs.ts");
    const core = readSrc("../lib/exports/runExportEssayToGoogleDocs.js");
    const seed = readSrc("../lib/dev/seeds/seedModule9Ready.ts");
    const m8 = readSrc("../components/ModuleEight.js");
    const m9 = readSrc("../components/ModuleNine.js");

    assert.ok(shared.includes("createOrUpdateSubmissionGoogleDoc"));
    assert.ok(shared.includes('fetch("/api/export-to-docs"'));
    assert.ok(route.includes("exportEssayToGoogleDocs"));
    assert.ok(route.includes("operation: result.operation"));
    assert.ok(server.includes("runExportEssayToGoogleDocs"));
    assert.ok(core.includes("docs.documents.create") === false);
    assert.ok(core.includes("createDocument"));
    assert.ok(seed.includes("exportEssayToGoogleDocs"));
    assert.ok(m8.includes("createOrUpdateSubmissionGoogleDoc"));
    assert.ok(m9.includes("createOrUpdateSubmissionGoogleDoc"));
    assert.equal(m8.includes('fetch("/api/export-to-docs"'), false);
    assert.equal(m9.includes('fetch("/api/export-to-docs"'), false);
  });

  it("10. Module 8 WP-002 session verification remains intact", () => {
    const m8 = readSrc("../components/ModuleEight.js");
    assert.ok(m8.includes("docVerifiedThisSession"));
    assert.ok(m8.includes("setDocVerifiedThisSession(false)"));
    assert.ok(m8.includes("setDocVerifiedThisSession(true)"));
    assert.ok(m8.includes("canAdvanceFromStep1"));
    assert.ok(m8.includes("handleCreateOrUpdateSubmissionDoc"));
  });

  it("11. Module 9 APA/checklist/PDF behavior remains intact", () => {
    const m9 = readSrc("../components/ModuleNine.js");
    assert.ok(m9.includes("ModuleNineApaLesson"));
    assert.ok(m9.includes("ModuleNineApaQuickGuide"));
    assert.ok(m9.includes("CHECKLIST_ITEMS"));
    assert.ok(m9.includes("/api/final-pdf"));
    assert.ok(m9.includes("alreadySubmitted"));
    assert.ok(m9.includes("Update with your latest essay"));
    assert.ok(m9.includes("hydrateSubmissionGoogleDoc"));
  });

  it("12. one click → one attempt + one outcome activity", () => {
    const shared = readSrc(
      "../lib/exports/createOrUpdateSubmissionGoogleDocClient.js"
    );
    assert.equal((shared.match(/export_to_docs_attempt/g) || []).length, 1);
    assert.ok(shared.includes('logActivity(userEmail, "export_to_docs"'));
    assert.ok(shared.includes('logActivity(userEmail, "export_to_docs_failed"'));
  });
});
