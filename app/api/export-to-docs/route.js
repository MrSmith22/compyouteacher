import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  ExistingDocumentUnavailableError,
  exportEssayToGoogleDocs,
  isExistingDocumentUnavailableError,
  isGoogleOperationTimeoutError,
  SUBMISSION_DOC_ERROR_CODES,
} from "@/lib/exports/exportEssayToGoogleDocs";
import { getAuthoritativeEssayTextForUser } from "@/lib/exports/verifySubmissionGoogleDoc";
import { SUBMISSION_DOC_VERIFICATION_STATUS } from "@/lib/exports/submissionDocVerification";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const userEmail = session.user.email;

    // Ignore client-supplied email/text/documentId for authority; resolve server-side.
    // Only forceCreate (boolean) is accepted as an intentional recovery signal.
    const body = await req.json().catch(() => null);
    if (body?.email && body.email !== userEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const forceCreate = body?.forceCreate === true;

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
      forceCreate,
    });

    console.info("[export-to-docs]", {
      operation: result.operation,
      documentId: result.documentId || null,
      previousDocumentId: result.previousDocumentId || null,
      pointerReplaced: !!result.pointerReplaced,
      verificationStatus: result.verification?.status || null,
      verified: !!result.verification?.verified,
      forceCreate,
      // Never log essay text, Doc body, credentials, or override email.
    });

    return NextResponse.json({
      url: result.webViewLink,
      documentId: result.documentId,
      operation: result.operation,
      verification: result.verification || null,
      sourceModule: essay.sourceModule,
      previousDocumentId: result.previousDocumentId || null,
      pointerReplaced: !!result.pointerReplaced,
    });
  } catch (err) {
    const message = err?.message || "Export failed";
    console.error("Export error:", {
      message,
      code: err?.code || null,
      step: err?.step || null,
      previousDocumentId: err?.previousDocumentId || null,
      pointerPreserved: !!err?.pointerPreserved,
    });

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

    if (err?.code === "replacement_verification_failed") {
      return NextResponse.json(
        {
          error: message,
          code: "replacement_verification_failed",
          verification: err.verification || null,
          previousDocumentId: err.previousDocumentId || null,
          pointerPreserved: true,
        },
        { status: 502 }
      );
    }

    if (isGoogleOperationTimeoutError(err)) {
      return NextResponse.json(
        {
          error:
            "We could not finish updating your Google Doc right now. This may be a temporary connection problem.",
          code: SUBMISSION_DOC_ERROR_CODES.GOOGLE_OPERATION_TIMEOUT,
          step: err?.step || null,
          verification: {
            status: SUBMISSION_DOC_VERIFICATION_STATUS.VERIFICATION_ERROR,
            verified: false,
            documentId: null,
            url: null,
            expectedParagraphCount: null,
            matchedParagraphCount: null,
            firstMissingParagraphIndex: null,
            expectedWordCount: null,
            documentWordCount: null,
            checkedAt: new Date().toISOString(),
          },
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: message,
        code: SUBMISSION_DOC_ERROR_CODES.TEMPORARY_SERVICE_FAILURE,
      },
      { status: 500 }
    );
  }
}
