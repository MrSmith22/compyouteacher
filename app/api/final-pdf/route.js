import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { uploadFinalPdf } from "@/lib/exports/uploadFinalPdf";
import {
  FINAL_PDF_ERRORS,
  validateFinalPdfMetadata,
  validateFinalPdfPayload,
} from "@/lib/exports/finalPdfValidation";

function isValidationMessage(message) {
  return Object.values(FINAL_PDF_ERRORS).includes(message);
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const userEmail = session.user.email;

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const file = formData.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: FINAL_PDF_ERRORS.MISSING }, { status: 400 });
    }

    const fileName = file.name || "document.pdf";
    const meta = validateFinalPdfMetadata({
      name: fileName,
      type: file.type || "",
      size: typeof file.size === "number" ? file.size : undefined,
    });
    if (!meta.ok) {
      return NextResponse.json({ error: meta.error }, { status: 400 });
    }

    try {
      const buffer = await file.arrayBuffer();
      const payload = validateFinalPdfPayload({
        name: fileName,
        type: file.type || "",
        size: buffer.byteLength,
        bytes: buffer,
      });
      if (!payload.ok) {
        return NextResponse.json({ error: payload.error }, { status: 400 });
      }

      const result = await uploadFinalPdf({
        userEmail,
        fileBytes: buffer,
        fileName,
        replaceExisting: false,
      });

      return NextResponse.json({
        ok: true,
        publicUrl: result.publicUrl,
        webViewLink: result.webViewLink,
        storage_path: result.storagePath,
        file_name: result.fileName,
        file_size: result.fileSize,
        uploaded_at: result.uploadedAt,
        doc_id: result.docId,
      });
    } catch (err) {
      const message = err?.message || "Upload failed";
      if (message === "Final PDF already submitted") {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      if (isValidationMessage(message)) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      console.error("[final-pdf] error:", err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (err) {
    console.error("[final-pdf] error:", err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
