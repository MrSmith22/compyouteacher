import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { verifySubmissionGoogleDocForUser } from "@/lib/exports/verifySubmissionGoogleDoc";
import { consumeTemporaryVerificationFailure } from "@/lib/dev/devSubmissionDocSimulations";
import { isDevToolingEnabled } from "@/lib/dev/isDevToolingEnabled";
import { SUBMISSION_DOC_VERIFICATION_STATUS } from "@/lib/exports/submissionDocVerification";

/**
 * WP-029 — Session-bound revisit verification.
 * Never accepts client email or documentId as authoritative.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    if (isDevToolingEnabled()) {
      const simulated = consumeTemporaryVerificationFailure(session.user.email);
      if (simulated) {
        console.info("[api/verify-submission-doc] simulated temporary failure");
        return NextResponse.json({
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
          sourceModule: null,
          code: "temporary_service_failure",
          simulated: true,
        });
      }
    }

    const result = await verifySubmissionGoogleDocForUser({
      userEmail: session.user.email,
    });

    return NextResponse.json({
      status: result.status,
      verified: result.verified,
      documentId: result.documentId,
      url: result.url,
      expectedParagraphCount: result.expectedParagraphCount,
      matchedParagraphCount: result.matchedParagraphCount,
      firstMissingParagraphIndex: result.firstMissingParagraphIndex,
      expectedWordCount: result.expectedWordCount,
      documentWordCount: result.documentWordCount,
      checkedAt: result.checkedAt,
      sourceModule: result.sourceModule ?? null,
    });
  } catch (err) {
    console.warn(
      "[api/verify-submission-doc]",
      err instanceof Error ? err.message : "failed"
    );
    return NextResponse.json(
      {
        status: "verification_error",
        verified: false,
        documentId: null,
        url: null,
        expectedParagraphCount: null,
        matchedParagraphCount: null,
        firstMissingParagraphIndex: null,
        expectedWordCount: null,
        documentWordCount: null,
        checkedAt: new Date().toISOString(),
        sourceModule: null,
        code: err?.code === "google_operation_timeout"
          ? "google_operation_timeout"
          : "temporary_service_failure",
      },
      { status: err?.code === "google_operation_timeout" ? 504 : 500 }
    );
  }
}
