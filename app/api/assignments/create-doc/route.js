// app/api/assignments/create-doc/route.js
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";

export async function POST(request) {
  const body = await request.json();
  const { templateId, email } = body;

  if (!templateId || !email) {
    return NextResponse.json({ error: "Missing templateId or email" }, { status: 400 });
  }

  try {
    // Read key from path set in .env.local:
    // GOOGLE_APPLICATION_CREDENTIALS=/Users/jasonsmith/.keys/service-account.json
    const raw = readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS).toString();
    const key = JSON.parse(raw);

    // Use JWT client explicitly (fixes invalid_grant issues)
    const jwtClient = new google.auth.JWT({
      email: key.client_email,
      key: (key.private_key || "").replace(/\\n/g, "\n"), // normalize newlines
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    // Ensure we have a valid access token
    await jwtClient.authorize();

    // Drive client
    const drive = google.drive({ version: "v3", auth: jwtClient });

    // Copy the template
    const copy = await drive.files.copy({
      fileId: templateId,
      requestBody: { name: `MLK T-Chart – ${email}` },
    });

    // Share with the specified user (writer)
    await drive.permissions.create({
      fileId: copy.data.id,
      requestBody: {
        type: "user",
        role: "writer",
        emailAddress: email,
      },
      sendNotificationEmail: false,
    });

    return NextResponse.json({
      docUrl: `https://docs.google.com/document/d/${copy.data.id}/edit`,
    });
  } catch (error) {
    console.error("Google Docs API error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}