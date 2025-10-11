// /app/api/assignments/create-doc/route.js

import { google } from "googleapis";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function POST(request) {
  const body = await request.json();
  const { templateId, email } = body;

  if (!templateId || !email) {
    return NextResponse.json({ error: "Missing templateId or email" }, { status: 400 });
  }

  try {
    const serviceAccountKey = JSON.parse(
      readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    );

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    const copy = await drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: `MLK T-Chart - ${email}`,
      },
    });

    await drive.permissions.create({
      fileId: copy.data.id,
      requestBody: {
        type: "user",
        role: "writer",
        emailAddress: email,
      },
    });

    return NextResponse.json({
      docUrl: `https://docs.google.com/document/d/${copy.data.id}/edit`,
    });
  } catch (error) {
    console.error("Google Docs API error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
