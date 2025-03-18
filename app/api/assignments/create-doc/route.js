import { google } from "googleapis";

export async function POST(req) {
  try {
    // Safely parse the request body
    const { studentEmail } = await req.json();

    if (!studentEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing studentEmail" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authenticate using the Service Account
    const auth = new google.auth.GoogleAuth({
      keyFile: "service-account.json", // Make sure this file is in your project root!
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Copy the template document for the student
   const response = await drive.files.copy({
  fileId: "1g4LujJZYEymrC5qIWDMSZandCd1F_b12YCfCZg37LyU",
  requestBody: {
    name: `MLK Essay - ${studentEmail}`,
    parents: ["root"],  // Ensures it goes to "My Drive"
  },
});


    // Grant student access to the file
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "writer",
        type: "user",
        emailAddress: studentEmail,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        documentUrl: `https://docs.google.com/document/d/${response.data.id}`,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
