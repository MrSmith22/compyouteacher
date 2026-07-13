import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { runExportEssayToGoogleDocs } from "@/lib/exports/runExportEssayToGoogleDocs";
import { grantSubmissionDocPermissions } from "@/lib/exports/devGoogleDocEditorOverride";

function getPrivateKeyFromEnv() {
  const raw = process.env.GOOGLE_PRIVATE_KEY || "";
  const key = raw.replace(/\\n/g, "\n").trim();

  if (!key) {
    throw new Error("Missing GOOGLE_PRIVATE_KEY in environment variables.");
  }

  if (key.includes("BEGIN ENCRYPTED PRIVATE KEY")) {
    throw new Error(
      "GOOGLE_PRIVATE_KEY is encrypted. Create a new Google service account JSON key and use its private_key value."
    );
  }

  if (!key.includes("BEGIN PRIVATE KEY") || !key.includes("END PRIVATE KEY")) {
    throw new Error(
      "GOOGLE_PRIVATE_KEY must be an unencrypted PKCS8 key containing BEGIN PRIVATE KEY and END PRIVATE KEY."
    );
  }

  return key;
}

function buildGoogleAuth() {
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

  const privateKey = getPrivateKeyFromEnv();

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
    ],
  });
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.");
  }
  return createClient(url, key);
}

export type SubmissionDocPermissionResult = {
  documentId: string;
  studentWriterGranted: boolean;
  overrideWriterAttempted: boolean;
  overrideWriterGranted: boolean | null;
  publicReaderGranted: boolean;
  writerRecipientCount: number;
};

export type ExportEssayToGoogleDocsResult = {
  documentId: string;
  webViewLink: string;
  operation: "created" | "updated" | "recreated";
  permissions?: SubmissionDocPermissionResult | null;
};

export type ExportEssayToGoogleDocsDeps = {
  getExportedDocRow?: (
    email: string
  ) => Promise<{ document_id?: string | null; web_view_link?: string | null } | null>;
  upsertExportedDoc?: (row: {
    user_email: string;
    document_id: string;
    web_view_link: string;
  }) => Promise<void>;
  createDocument?: (title: string) => Promise<{ documentId: string }>;
  getDocument?: (documentId: string) => Promise<unknown>;
  batchUpdate?: (documentId: string, requests: object[]) => Promise<void>;
  shareDocument?: (
    documentId: string,
    email: string
  ) => Promise<SubmissionDocPermissionResult | void>;
  getWebViewLink?: (documentId: string) => Promise<string>;
};

async function createDefaultGoogleDeps() {
  const auth = buildGoogleAuth();
  const authClient = await auth.getClient();
  const docs = google.docs({ version: "v1", auth: authClient });
  const drive = google.drive({ version: "v3", auth: authClient });

  return {
    createDocument: async (title: string) => {
      const created = await docs.documents.create({
        requestBody: { title },
      });
      const documentId = created?.data?.documentId;
      if (!documentId) {
        throw new Error("Google Docs did not return a documentId");
      }
      return { documentId };
    },
    getDocument: async (documentId: string) => {
      const res = await docs.documents.get({ documentId });
      return res.data;
    },
    batchUpdate: async (documentId: string, requests: object[]) => {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
    },
    shareDocument: async (documentId: string, email: string) => {
      return grantSubmissionDocPermissions({
        documentId,
        studentEmail: email,
        createPermission: async ({ type, role, emailAddress }) => {
          await drive.permissions.create({
            fileId: documentId,
            requestBody: {
              type,
              role,
              ...(emailAddress ? { emailAddress } : {}),
            },
            sendNotificationEmail: false,
          });
        },
        env: process.env,
      });
    },
    getWebViewLink: async (documentId: string) => {
      const file = await drive.files.get({
        fileId: documentId,
        fields: "webViewLink",
      });
      const webViewLink = file?.data?.webViewLink;
      if (!webViewLink) {
        throw new Error("Google Drive did not return a webViewLink");
      }
      return webViewLink;
    },
  };
}

function createDefaultStoreDeps() {
  const supabase = getServiceSupabase();
  return {
    getExportedDocRow: async (email: string) => {
      const { data, error } = await supabase
        .from("exported_docs")
        .select("document_id, web_view_link")
        .eq("user_email", email)
        .maybeSingle();
      if (error) {
        console.warn("exported_docs lookup error:", error.message);
        return null;
      }
      return data ?? null;
    },
    upsertExportedDoc: async (row: {
      user_email: string;
      document_id: string;
      web_view_link: string;
    }) => {
      const { error: upsertErr } = await supabase.from("exported_docs").upsert(
        row,
        { onConflict: "user_email" }
      );
      if (upsertErr) {
        console.error("Supabase upsert error:", upsertErr);
      }
    },
  };
}

async function resolveDeps(deps: ExportEssayToGoogleDocsDeps = {}) {
  const needsGoogle =
    !deps.createDocument ||
    !deps.getDocument ||
    !deps.batchUpdate ||
    !deps.shareDocument ||
    !deps.getWebViewLink;
  const needsStore = !deps.getExportedDocRow || !deps.upsertExportedDoc;

  const googleDefaults = needsGoogle ? await createDefaultGoogleDeps() : {};
  const storeDefaults = needsStore ? createDefaultStoreDeps() : {};

  return {
    getExportedDocRow:
      deps.getExportedDocRow ?? storeDefaults.getExportedDocRow!,
    upsertExportedDoc:
      deps.upsertExportedDoc ?? storeDefaults.upsertExportedDoc!,
    createDocument: deps.createDocument ?? googleDefaults.createDocument!,
    getDocument: deps.getDocument ?? googleDefaults.getDocument!,
    batchUpdate: deps.batchUpdate ?? googleDefaults.batchUpdate!,
    shareDocument: deps.shareDocument ?? googleDefaults.shareDocument!,
    getWebViewLink: deps.getWebViewLink ?? googleDefaults.getWebViewLink!,
  };
}

/**
 * Production Google Doc export pipeline (shared by /api/export-to-docs and dev seeds).
 * Creates once; updates the same document_id in place when exported_docs already has a row.
 * Never silently recreates an inaccessible existing document.
 */
export async function exportEssayToGoogleDocs({
  email,
  text,
  deps = {},
}: {
  email: string;
  text: string;
  deps?: ExportEssayToGoogleDocsDeps;
}): Promise<ExportEssayToGoogleDocsResult> {
  const resolved = await resolveDeps(deps);
  return runExportEssayToGoogleDocs({ email, text, deps: resolved });
}

export {
  ExistingDocumentUnavailableError,
  isExistingDocumentUnavailableError,
  SUBMISSION_DOC_OPERATIONS,
  SUBMISSION_DOC_ERROR_CODES,
  buildReplaceGoogleDocBodyRequests,
  getGoogleDocBodyEndIndex,
  resolveSubmissionDocPlan,
} from "@/lib/exports/submissionGoogleDocHelpers";
