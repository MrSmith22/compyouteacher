/**
 * Server-side submission Google Doc verification (WP-029).
 * Session-bound callers must pass the authenticated student email only.
 */

import { createClient } from "@supabase/supabase-js";
import { selectEssayTextForExport } from "./selectEssayTextForExport.js";
import {
  SUBMISSION_DOC_VERIFICATION_STATUS,
  compareEssayToGoogleDocText,
  extractGoogleDocPlainText,
  toSafeVerificationResult,
} from "./submissionDocVerification.js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.");
  }
  return createClient(url, key);
}

function getPrivateKeyFromEnv() {
  const raw = process.env.GOOGLE_PRIVATE_KEY || "";
  const key = raw.replace(/\\n/g, "\n").trim();
  if (!key) {
    throw new Error("Missing GOOGLE_PRIVATE_KEY in environment variables.");
  }
  return key;
}

async function buildGoogleAuth() {
  // Lazy-load googleapis so unit tests with injectable deps do not import the client.
  const { google } = await import("googleapis");
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile) {
    return new google.auth.GoogleAuth({
      keyFile,
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/documents",
      ],
    });
  }
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!clientEmail) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL in environment variables."
    );
  }
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: getPrivateKeyFromEnv(),
    },
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
    ],
  });
}

function isNotFoundOrInaccessible(err) {
  const status = err?.code || err?.status || err?.response?.status;
  if (status === 404 || status === 403 || status === "404" || status === "403") {
    return true;
  }
  const message = String(err?.message || err || "").toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("404") ||
    message.includes("forbidden") ||
    message.includes("403")
  );
}

/**
 * Load authoritative essay text for a student (service role).
 */
export async function getAuthoritativeEssayTextForUser(userEmail, deps = {}) {
  const getRows =
    deps.getDraftRows ||
    (async (email) => {
      const supabase = getServiceSupabase();
      const [res7, res6] = await Promise.all([
        supabase
          .from("student_drafts")
          .select("final_text, full_text")
          .eq("user_email", email)
          .eq("module", 7)
          .maybeSingle(),
        supabase
          .from("student_drafts")
          .select("full_text")
          .eq("user_email", email)
          .eq("module", 6)
          .maybeSingle(),
      ]);
      return {
        module7: res7.error ? null : res7.data,
        module6: res6.error ? null : res6.data,
        module7Error: !!res7.error,
        module6Error: !!res6.error,
      };
    });

  const rows = await getRows(userEmail);
  return selectEssayTextForExport(rows);
}

/**
 * Load exported_docs row for a student (service role).
 */
export async function getExportedDocRowForUser(userEmail, deps = {}) {
  if (deps.getExportedDocRow) {
    return deps.getExportedDocRow(userEmail);
  }
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("exported_docs")
    .select("document_id, web_view_link")
    .eq("user_email", userEmail)
    .maybeSingle();
  if (error) {
    throw new Error("exported_docs_lookup_failed");
  }
  return data ?? null;
}

async function defaultGetDocument(documentId) {
  const { google } = await import("googleapis");
  const { withGoogleTimeout } = await import("./googleOperationTimeout.js");
  const auth = await buildGoogleAuth();
  const authClient = await withGoogleTimeout(auth.getClient(), {
    step: "auth.getClient",
  });
  const docs = google.docs({ version: "v1", auth: authClient });
  console.info("[verify] step", { step: "docs.get" });
  const res = await withGoogleTimeout(docs.documents.get({ documentId }), {
    step: "docs.get",
  });
  return res.data;
}

/**
 * Verify a known documentId against provided essay text (immediate write path).
 * Does not trust client essay unless caller already resolved it server-side.
 */
export async function verifyDocumentContainsEssay({
  documentId,
  url = null,
  essayText,
  deps = {},
}) {
  if (!essayText?.trim()) {
    return toSafeVerificationResult(
      {
        status: SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_ESSAY,
        verified: false,
        expectedParagraphCount: 0,
        matchedParagraphCount: 0,
        firstMissingParagraphIndex: null,
        expectedWordCount: 0,
        documentWordCount: 0,
        checkedAt: new Date().toISOString(),
      },
      { documentId, url }
    );
  }

  if (!documentId) {
    return toSafeVerificationResult(
      {
        status: SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_DOCUMENT,
        verified: false,
        expectedParagraphCount: 0,
        matchedParagraphCount: 0,
        firstMissingParagraphIndex: null,
        expectedWordCount: 0,
        documentWordCount: 0,
        checkedAt: new Date().toISOString(),
      },
      { documentId: null, url }
    );
  }

  try {
    const getDocument = deps.getDocument || defaultGetDocument;
    const document = await getDocument(documentId);
    if (!document || typeof document !== "object") {
      return toSafeVerificationResult(
        {
          status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
          verified: false,
          expectedParagraphCount: 0,
          matchedParagraphCount: 0,
          firstMissingParagraphIndex: null,
          expectedWordCount: 0,
          documentWordCount: 0,
          checkedAt: new Date().toISOString(),
        },
        { documentId, url }
      );
    }

    const documentText = extractGoogleDocPlainText(document);
    const comparison = compareEssayToGoogleDocText({
      essayText,
      documentText,
    });
    return toSafeVerificationResult(comparison, { documentId, url });
  } catch (err) {
    if (isNotFoundOrInaccessible(err)) {
      return toSafeVerificationResult(
        {
          status: SUBMISSION_DOC_VERIFICATION_STATUS.DOCUMENT_UNAVAILABLE,
          verified: false,
          expectedParagraphCount: 0,
          matchedParagraphCount: 0,
          firstMissingParagraphIndex: null,
          expectedWordCount: 0,
          documentWordCount: 0,
          checkedAt: new Date().toISOString(),
        },
        { documentId, url }
      );
    }
    console.warn(
      "[verify] submission doc verification failed:",
      err instanceof Error ? err.message : "unknown_error"
    );
    return toSafeVerificationResult(
      {
        status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
        verified: false,
        expectedParagraphCount: 0,
        matchedParagraphCount: 0,
        firstMissingParagraphIndex: null,
        expectedWordCount: 0,
        documentWordCount: 0,
        checkedAt: new Date().toISOString(),
      },
      { documentId, url }
    );
  }
}

/**
 * Revisit verification for the authenticated student.
 * Resolves document_id and essay server-side from userEmail only.
 */
export async function verifySubmissionGoogleDocForUser({
  userEmail,
  deps = {},
}) {
  if (!userEmail?.trim()) {
    return toSafeVerificationResult(
      {
        status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
        verified: false,
        expectedParagraphCount: 0,
        matchedParagraphCount: 0,
        firstMissingParagraphIndex: null,
        expectedWordCount: 0,
        documentWordCount: 0,
        checkedAt: new Date().toISOString(),
      },
      {}
    );
  }

  const email = userEmail.trim();

  try {
    const essay = await getAuthoritativeEssayTextForUser(email, deps);
    if (essay.status !== "ok" || !essay.text?.trim()) {
      const status =
        essay.status === "missing"
          ? SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_ESSAY
          : SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR;
      return {
        ...toSafeVerificationResult(
          {
            status,
            verified: false,
            expectedParagraphCount: 0,
            matchedParagraphCount: 0,
            firstMissingParagraphIndex: null,
            expectedWordCount: 0,
            documentWordCount: 0,
            checkedAt: new Date().toISOString(),
          },
          {}
        ),
        sourceModule: essay.sourceModule,
      };
    }

    const row = await getExportedDocRowForUser(email, deps);
    const documentId =
      typeof row?.document_id === "string" ? row.document_id.trim() : "";
    const url =
      typeof row?.web_view_link === "string" ? row.web_view_link.trim() : null;

    if (!documentId) {
      return {
        ...toSafeVerificationResult(
          {
            status: SUBMISSION_DOC_VERIFICATION_STATUS.MISSING_DOCUMENT,
            verified: false,
            expectedParagraphCount: 0,
            matchedParagraphCount: 0,
            firstMissingParagraphIndex: null,
            expectedWordCount: 0,
            documentWordCount: 0,
            checkedAt: new Date().toISOString(),
          },
          { documentId: null, url }
        ),
        sourceModule: essay.sourceModule,
      };
    }

    const result = await verifyDocumentContainsEssay({
      documentId,
      url,
      essayText: essay.text,
      deps,
    });

    return {
      ...result,
      sourceModule: essay.sourceModule,
    };
  } catch (err) {
    console.warn(
      "[verify] revisit verification failed:",
      err instanceof Error ? err.message : "unknown_error"
    );
    return toSafeVerificationResult(
      {
        status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
        verified: false,
        expectedParagraphCount: 0,
        matchedParagraphCount: 0,
        firstMissingParagraphIndex: null,
        expectedWordCount: 0,
        documentWordCount: 0,
        checkedAt: new Date().toISOString(),
      },
      {}
    );
  }
}
