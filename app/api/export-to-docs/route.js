// app/api/export-to-docs/route.js
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (uses service role key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { text, email } = await req.json();
    if (!text || !email) {
      return NextResponse.json({ error: "Missing text or email" }, { status: 400 });
    }

    // Google auth with service account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/documents",
      ],
    });

    const authClient = await auth.getClient();
    const docs = google.docs({ version: "v1", auth: authClient });
    const drive = google.drive({ version: "v3", auth: authClient });

    // 1) Create empty doc
    const created = await docs.documents.create({
      requestBody: { title: "APA Final Essay" },
    });
    const documentId = created.data.documentId;

    // 2) Insert the essay text
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [{ insertText: { location: { index: 1 }, text } }],
      },
    });

    // 3) Share with the student as writer
    await drive.permissions.create({
      fileId: documentId,
      requestBody: { type: "user", role: "writer", emailAddress: email },
      sendNotificationEmail: false,
    });

    // 4) Make link viewable to anyone with the link (so teachers can view)
    await drive.permissions.create({
      fileId: documentId,
      requestBody: { type: "anyone", role: "reader" },
    });

    // 5) Get the webViewLink
    const file = await drive.files.get({
      fileId: documentId,
      fields: "webViewLink",
    });
    const url = file.data.webViewLink;

    // 6) Save (upsert) to Supabase
    const { error: upsertErr } = await supabase
      .from("exported_docs")
      .upsert({ user_email: email, document_id: documentId, web_view_link: url });
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