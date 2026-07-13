/**
 * WP-029 — submission Google Doc content verification.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  SUBMISSION_DOC_VERIFICATION_STATUS,
  extractGoogleDocPlainText,
  normalizeSubmissionDocText,
  splitEssayIntoParagraphs,
  compareEssayToGoogleDocText,
  toSafeVerificationResult,
} = require("../lib/exports/submissionDocVerification.js");
const {
  selectEssayTextForExport,
} = require("../lib/exports/selectEssayTextForExport.js");
const {
  runExportEssayToGoogleDocs,
} = require("../lib/exports/runExportEssayToGoogleDocs.js");
const {
  verifyDocumentContainsEssay,
  verifySubmissionGoogleDocForUser,
} = require("../lib/exports/verifySubmissionGoogleDoc.js");

function readSrc(rel) {
  return fs.readFileSync(path.join(__dirname, rel), "utf8");
}

function docWithParagraphs(lines, documentId = "doc-1") {
  return {
    documentId,
    body: {
      content: [
        { endIndex: 1 },
        ...lines.map((text, i) => ({
          startIndex: i + 1,
          endIndex: i + 2,
          paragraph: {
            elements: [{ textRun: { content: `${text}\n` } }],
          },
        })),
      ],
    },
  };
}

const ESSAY = [
  "First paragraph about King and justice.",
  "Second paragraph compares speech and letter.",
  "Third paragraph concludes the analysis.",
].join("\n\n");

describe("WP-029 text extraction and comparison", () => {
  it("1–2. extracts paragraphs and nested table text safely", () => {
    const plain = extractGoogleDocPlainText({
      body: {
        content: [
          {
            paragraph: {
              elements: [{ textRun: { content: "Intro\n" } }],
            },
          },
          {
            table: {
              tableRows: [
                {
                  tableCells: [
                    {
                      content: [
                        {
                          paragraph: {
                            elements: [{ textRun: { content: "Cell A\n" } }],
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    });
    assert.match(plain, /Intro/);
    assert.match(plain, /Cell A/);
    assert.equal(extractGoogleDocPlainText(null), "");
    assert.equal(extractGoogleDocPlainText({}), "");
  });

  it("3–6. whitespace / title page / references / headings still verify", () => {
    const essayParas = splitEssayIntoParagraphs(ESSAY);
    assert.equal(essayParas.length, 3);

    const withExtras = [
      "Title Page",
      "Alex Rivera",
      "",
      essayParas[0],
      "",
      "Heading: Audience",
      essayParas[1].replace(/ /g, "  "),
      "",
      essayParas[2],
      "",
      "References",
      "King, M. L., Jr. (1963).",
    ].join("\n");

    const result = compareEssayToGoogleDocText({
      essayText: ESSAY,
      documentText: withExtras,
    });
    assert.equal(result.status, SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED);
    assert.equal(result.verified, true);
    assert.equal(result.matchedParagraphCount, 3);
  });

  it("7–10. changed / missing / truncated / reordered paragraphs fail", () => {
    const changed = compareEssayToGoogleDocText({
      essayText: ESSAY,
      documentText: ESSAY.replace("justice", "fairness"),
    });
    assert.equal(changed.verified, false);
    assert.equal(changed.status, SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH);

    const missing = compareEssayToGoogleDocText({
      essayText: ESSAY,
      documentText: splitEssayIntoParagraphs(ESSAY).slice(0, 2).join("\n\n"),
    });
    assert.equal(missing.verified, false);
    assert.equal(missing.firstMissingParagraphIndex, 2);

    const truncated = compareEssayToGoogleDocText({
      essayText: ESSAY,
      documentText: ESSAY.slice(0, 40),
    });
    assert.equal(truncated.verified, false);

    const paras = splitEssayIntoParagraphs(ESSAY);
    const reordered = compareEssayToGoogleDocText({
      essayText: ESSAY,
      documentText: [paras[1], paras[0], paras[2]].join("\n\n"),
    });
    assert.equal(reordered.verified, false);
  });

  it("11. empty/malformed document returns safe failure", () => {
    const empty = compareEssayToGoogleDocText({
      essayText: ESSAY,
      documentText: "",
    });
    assert.equal(empty.verified, false);
    assert.equal(empty.status, SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH);

    const safe = toSafeVerificationResult(empty, { documentId: "x", url: "u" });
    assert.equal(JSON.stringify(safe).includes(ESSAY), false);
    assert.equal(safe.documentId, "x");
  });
});

describe("WP-029 essay selection + immediate write verification", () => {
  it("selects Module 7 final_text over full_text over Module 6", () => {
    const selected = selectEssayTextForExport({
      module7: { final_text: "Final", full_text: "Full" },
      module6: { full_text: "Draft6" },
    });
    assert.equal(selected.text, "Final");
    assert.equal(selected.sourceModule, 7);
  });

  it("12–14. create/update verify after write; mismatch cannot be verified", async () => {
    const bodies = new Map();
    const essay = "Alpha paragraph one.\n\nBeta paragraph two.";

    const deps = {
      getExportedDocRow: async () => null,
      upsertExportedDoc: async () => {},
      createDocument: async () => {
        bodies.set("new-doc", {
          documentId: "new-doc",
          body: {
            content: [
              { endIndex: 1 },
              {
                paragraph: { elements: [{ textRun: { content: "\n" } }] },
              },
            ],
          },
        });
        return { documentId: "new-doc" };
      },
      getDocument: async (id) => bodies.get(id),
      batchUpdate: async (id, requests) => {
        const text = requests.find((r) => r.insertText)?.insertText?.text || "";
        bodies.set(id, {
          documentId: id,
          body: {
            content: [
              {
                paragraph: {
                  elements: [{ textRun: { content: `${text}\n` } }],
                },
              },
            ],
          },
        });
      },
      shareDocument: async () => ({ publicReaderGranted: true }),
      getWebViewLink: async (id) =>
        `https://docs.google.com/document/d/${id}/edit`,
    };

    const created = await runExportEssayToGoogleDocs({
      email: "student@school.edu",
      text: essay,
      deps,
    });
    assert.equal(created.operation, "created");
    assert.equal(created.verification.verified, true);
    assert.equal(
      created.verification.status,
      SUBMISSION_DOC_VERIFICATION_STATUS.VERIFIED
    );

    // Force mismatch on next get by corrupting body after write path uses confirmed
    const updateDeps = {
      ...deps,
      getExportedDocRow: async () => ({
        document_id: "new-doc",
        web_view_link: created.webViewLink,
      }),
      createDocument: async () => {
        throw new Error("should not create");
      },
      batchUpdate: async (id) => {
        bodies.set(id, {
          documentId: id,
          body: {
            content: [
              {
                paragraph: {
                  elements: [{ textRun: { content: "Wrong content only\n" } }],
                },
              },
            ],
          },
        });
      },
    };

    const updated = await runExportEssayToGoogleDocs({
      email: "student@school.edu",
      text: essay,
      deps: updateDeps,
    });
    assert.equal(updated.operation, "updated");
    assert.equal(updated.documentId, "new-doc");
    assert.equal(updated.webViewLink, created.webViewLink);
    assert.equal(updated.verification.verified, false);
    assert.equal(
      updated.verification.status,
      SUBMISSION_DOC_VERIFICATION_STATUS.MISMATCH
    );
  });
});

describe("WP-029 revisit verification + auth boundary", () => {
  it("15–16. revisit uses server essay + saved document id", async () => {
    const essay = "Paragraph A stays intact.\n\nParagraph B stays intact.";
    const result = await verifySubmissionGoogleDocForUser({
      userEmail: "dev-student@localhost",
      deps: {
        getDraftRows: async () => ({
          module7: { final_text: essay, full_text: "" },
          module6: null,
        }),
        getExportedDocRow: async () => ({
          document_id: "saved-doc",
          web_view_link: "https://docs.google.com/document/d/saved-doc/edit",
        }),
        getDocument: async () =>
          docWithParagraphs([
            "Title",
            "Paragraph A stays intact.",
            "Heading",
            "Paragraph B stays intact.",
          ], "saved-doc"),
      },
    });
    assert.equal(result.verified, true);
    assert.equal(result.documentId, "saved-doc");
    assert.equal(result.sourceModule, 7);
  });

  it("17. verify API route rejects trusting client email/documentId", () => {
    const route = readSrc("../app/api/verify-submission-doc/route.js");
    assert.ok(route.includes("getServerSession"));
    assert.ok(route.includes("verifySubmissionGoogleDocForUser"));
    assert.equal(route.includes("body.email"), false);
    assert.equal(route.includes("body.documentId"), false);

    const exportRoute = readSrc("../app/api/export-to-docs/route.js");
    assert.ok(exportRoute.includes("getServerSession"));
    assert.ok(exportRoute.includes("getAuthoritativeEssayTextForUser"));
    assert.ok(exportRoute.includes('body.email !== userEmail'));
  });
});

describe("WP-029 Module 8/9 gates and UX wiring", () => {
  it("18–22. Module gates, mismatch Update, retry vs mismatch", () => {
    const m8 = readSrc("../components/ModuleEight.js");
    const m9 = readSrc("../components/ModuleNine.js");
    const client = readSrc(
      "../lib/exports/createOrUpdateSubmissionGoogleDocClient.js"
    );

    assert.ok(m8.includes("contentVerified"));
    assert.ok(m8.includes("setDocVerifiedThisSession(true)"));
    assert.ok(m8.includes("setDocVerifiedThisSession(false)"));
    assert.ok(m8.includes("verifySubmissionGoogleDocContent"));

    assert.ok(m9.includes("docContentVerified"));
    assert.ok(m9.includes("docReady"));
    assert.ok(m9.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m9.includes("forceCreate"));
    assert.ok(m9.includes("handleRetryVerification"));
    assert.equal(m9.includes('2. Google Doc {exportUrl ? "✓"'), false);
    assert.ok(m9.includes("docReady ? \"✓\""));

    assert.ok(client.includes("submission_doc_verification_started"));
    assert.ok(client.includes("submission_doc_verified"));
    assert.ok(client.includes("submission_doc_mismatch"));
    assert.ok(client.includes("submission_doc_verification_failed"));

    // Shared recovery labels live in the recovery model; Module 9 uses the panel.
    const recovery = readSrc("../lib/exports/submissionDocRecovery.js");
    assert.ok(recovery.includes("Update Google Doc") || recovery.includes('"update"'));
    assert.ok(recovery.includes("Retry check") || recovery.includes("retry_check"));
    assert.ok(m9.includes("Retry check") || m9.includes("onRetry={handleRetryVerification}"));
    assert.ok(client.includes("verificationInFlightRef") === false);
    assert.ok(client.includes("safeVerificationLogPayload"));
    assert.equal(client.includes("DEV_GOOGLE_DOC_EDITOR_EMAIL"), false);
  });

  it("23–24. activity payload helpers omit essay/dev email; client logs once per call", () => {
    const client = readSrc(
      "../lib/exports/createOrUpdateSubmissionGoogleDocClient.js"
    );
    assert.equal((client.match(/submission_doc_verification_started/g) || []).length, 1);
    assert.ok(client.includes("expected_paragraph_count"));
    assert.equal(client.includes("essayText"), false);
    assert.equal(client.includes("documentText"), false);
  });

  it("25–26. WP-028 / Module 9 APA wiring still present", () => {
    const m9 = readSrc("../components/ModuleNine.js");
    assert.ok(m9.includes("ModuleNineApaLesson"));
    assert.ok(m9.includes("CHECKLIST_ITEMS"));
    assert.ok(m9.includes("/api/final-pdf"));
    assert.ok(m9.includes("alreadySubmitted"));
    assert.ok(m9.includes("createOrUpdateSubmissionGoogleDoc"));

    const pathway = readSrc(
      "../tests/module8-module9-submission-doc-pathway.test.js"
    );
    assert.ok(pathway.includes("runExportEssayToGoogleDocs"));
  });
});

describe("WP-029 normalization utilities", () => {
  it("normalizes CRLF, NBSP, and zero-width characters", () => {
    const normalized = normalizeSubmissionDocText(
      "A\r\nB\u00a0C\u200B"
    );
    assert.equal(normalized.includes("\r"), false);
    assert.equal(normalized.includes("\u00a0"), false);
    assert.equal(normalized.includes("\u200B"), false);
  });
});
