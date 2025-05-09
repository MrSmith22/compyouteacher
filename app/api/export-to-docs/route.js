// JavaScript source code
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { text, email } = await req.json();

    // Step 1: Authenticate using service account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/documents"],
    });

    const authClient = await auth.getClient();
    const docs = google.docs({ version: "v1", auth: authClient });
    const drive = google.drive({ version: "v3", auth: authClient });

    // Step 2: Create a new Google Doc
    const docRes = await docs.documents.create({
      requestBody: {
        title: "APA Final Essay",
      },
    });

    const documentId = docRes.data.documentId;

    // Step 3: Insert the essay text into the document
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: text,
            },
          },
        ],
      },
    });

    // Step 4: Share the doc with the student email
    await drive.permissions.create({
  fileId: documentId,
  requestBody: {
    type: "anyone",
    role: "writer"
  },
});


    // Step 5: Get the public URL
    const file = await drive.files.get({
      fileId: documentId,
      fields: "webViewLink",
    });

    return NextResponse.json({ url: file.data.webViewLink });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
