import { NextResponse } from "next/server";
import { exportEssayToGoogleDocs } from "@/lib/exports/exportEssayToGoogleDocs";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const text = body?.text;
    const email = body?.email;

    if (!text || !email) {
      return NextResponse.json(
        { error: "Missing text or email" },
        { status: 400 }
      );
    }

    const result = await exportEssayToGoogleDocs({ email, text });
    return NextResponse.json({ url: result.webViewLink });
  } catch (err) {
    const message = err?.message || "Export failed";
    console.error("Export error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
