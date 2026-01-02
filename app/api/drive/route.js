import { google } from "googleapis";

export async function GET(req) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    const res = await drive.files.list({
      pageSize: 5,
      fields: "files(id, name)",
    });

    return Response.json({ success: true, files: res.data.files });
  } catch (error) {
    console.error("Error accessing Google Drive API:", error);
    return Response.json({ success: false, error: error.message });
  }
}

