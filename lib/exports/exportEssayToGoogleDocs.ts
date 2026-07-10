import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

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

export type ExportEssayToGoogleDocsResult = {
  documentId: string;
  webViewLink: string;
};

/**
 * Production Google Doc export pipeline (shared by /api/export-to-docs and dev seeds).
 * Creates a Docs file, shares it, upserts exported_docs, returns document_id + link.
 */
export async function exportEssayToGoogleDocs({
  email,
  text,
}: {
  email: string;
  text: string;
}): Promise<ExportEssayToGoogleDocsResult> {
  if (!text?.trim() || !email?.trim()) {
    throw new Error("Missing text or email");
  }

  const auth = buildGoogleAuth();
  const authClient = await auth.getClient();
  const docs = google.docs({ version: "v1", auth: authClient });
  const drive = google.drive({ version: "v3", auth: authClient });

  const created = await docs.documents.create({
    requestBody: { title: "APA Final Essay" },
  });

  const documentId = created?.data?.documentId;
  if (!documentId) {
    throw new Error("Google Docs did not return a documentId");
  }

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [{ insertText: { location: { index: 1 }, text } }],
    },
  });

  try {
    await drive.permissions.create({
      fileId: documentId,
      requestBody: { type: "user", role: "writer", emailAddress: email },
      sendNotificationEmail: false,
    });
  } catch (permErr) {
    console.warn(
      "Could not grant writer permission to user:",
      permErr instanceof Error ? permErr.message : permErr
    );
  }

  await drive.permissions.create({
    fileId: documentId,
    requestBody: { type: "anyone", role: "reader" },
  });

  const file = await drive.files.get({
    fileId: documentId,
    fields: "webViewLink",
  });

  const webViewLink = file?.data?.webViewLink;
  if (!webViewLink) {
    throw new Error("Google Drive did not return a webViewLink");
  }

  const supabase = getServiceSupabase();
  const { error: upsertErr } = await supabase.from("exported_docs").upsert(
    {
      user_email: email,
      document_id: documentId,
      web_view_link: webViewLink,
    },
    { onConflict: "user_email" }
  );

  if (upsertErr) {
    console.error("Supabase upsert error:", upsertErr);
    // Match production route: do not fail the export if logging fails.
  }

  return { documentId, webViewLink };
}
