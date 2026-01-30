import { google } from "googleapis";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (service role key, server only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function buildGoogleAuth() {
  // Option A: Use a service account JSON file on disk (your current setup)
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

  // Option B: Use env vars (useful for deploy later)
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !rawPrivateKey) {
    throw new Error(
      "Google service account credentials missing. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY."
    );
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
    ],
  });
}

export async function POST(req) {
  try {
    const { text, email } = await req.json();

    if (!text || !email) {
      return NextResponse.json(
        { error: "Missing text or email" },
        { status: 400 }
      );
    }

    // Build auth from either GOOGLE_APPLICATION_CREDENTIALS or env vars
    const auth = buildGoogleAuth();

    const authClient = await auth.getClient();
    const docs = google.docs({ version: "v1", auth: authClient });
    const drive = google.drive({ version: "v3", auth: authClient });

    // 1) Create empty doc
    const created = await docs.documents.create({
      requestBody: { title: "APA Final Essay" },
    });

    const documentId = created.data.documentId;
    if (!documentId) {
      return NextResponse.json(
        { error: "Google Docs did not return a documentId" },
        { status: 500 }
      );
    }

    // 2) Insert the essay text
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [{ insertText: { location: { index: 1 }, text } }],
      },
    });

    // 3) Share with the student as writer (best effort)
    try {
      await drive.permissions.create({
        fileId: documentId,
        requestBody: { type: "user", role: "writer", emailAddress: email },
        sendNotificationEmail: false,
      });
    } catch (permErr) {
      console.warn("Could not grant writer permission to user:", permErr?.message || permErr);
    }

    // 4) Make link viewable to anyone with the link (so teacher can view)
    await drive.permissions.create({
      fileId: documentId,
      requestBody: { type: "anyone", role: "reader" },
    });

    // 5) Get the webViewLink
    const file = await drive.files.get({
      fileId: documentId,
      fields: "webViewLink",
    });

    const url = file?.data?.webViewLink;
    if (!url) {
      return NextResponse.json(
        { error: "Google Drive did not return a webViewLink" },
        { status: 500 }
      );
    }

    // 6) Save (upsert) to Supabase
    const { error: upsertErr } = await supabase
      .from("exported_docs")
      .upsert(
        { user_email: email, document_id: documentId, web_view_link: url },
        { onConflict: "user_email" }
      );

    if (upsertErr) {
      console.error("Supabase upsert error:", upsertErr);
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: err?.message || "Export failed" },
      { status: 500 }
    );
  }
}