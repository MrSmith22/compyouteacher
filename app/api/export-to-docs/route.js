import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  ExistingDocumentUnavailableError,
  exportEssayToGoogleDocs,
  isExistingDocumentUnavailableError,
  SUBMISSION_DOC_ERROR_CODES,
} from "@/lib/exports/exportEssayToGoogleDocs";
import { getAuthoritativeEssayTextForUser } from "@/lib/exports/verifySubmissionGoogleDoc";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const userEmail = session.user.email;

    // Ignore client-supplied email/text for authority; resolve server-side.
    const body = await req.json().catch(() => null);
    if (body?.email && body.email !== userEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const essay = await getAuthoritativeEssayTextForUser(userEmail);
    if (essay.status !== "ok" || !essay.text?.trim()) {
      return NextResponse.json(
        {
          error:
            essay.status === "missing"
              ? "Missing essay text"
              : "Could not load essay text",
          code:
            essay.status === "missing" ? "missing_essay" : "essay_load_error",
        },
        { status: 400 }
      );
    }

    const result = await exportEssayToGoogleDocs({
      email: userEmail,
      text: essay.text,
    });

    return NextResponse.json({
      url: result.webViewLink,
      documentId: result.documentId,
      operation: result.operation,
      verification: result.verification || null,
      sourceModule: essay.sourceModule,
    });
  } catch (err) {
    const message = err?.message || "Export failed";
    console.error("Export error:", err);

    if (
      err instanceof ExistingDocumentUnavailableError ||
      isExistingDocumentUnavailableError(err)
    ) {
      return NextResponse.json(
        {
          error: message,
          code: SUBMISSION_DOC_ERROR_CODES.EXISTING_DOCUMENT_UNAVAILABLE,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
