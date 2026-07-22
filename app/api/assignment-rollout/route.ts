import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAssignmentWritingSpineRollout } from "@/lib/supabase/helpers/writingSpineRolloutSettings";
import { getAssignmentEvidenceArgumentRollout } from "@/lib/supabase/helpers/evidenceArgumentRolloutSettings";
import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments/identity";
import { setWritingSpineModeCache } from "@/lib/assignments/writingSpineModeCache";
import { setEvidenceArgumentModeCache } from "@/lib/assignments/evidenceArgumentModeCache";

/**
 * Authenticated read of rollout modes (WP-085 writing spine + WP-088 evidence-argument).
 * Students and teachers may read; writes stay on teacher routes.
 * Modes are independent so rollback of one spine does not flip the other.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const url = new URL(request.url);
  const assignmentId =
    url.searchParams.get("assignmentId") || DEFAULT_ASSIGNMENT_ID;

  const [writingSpine, evidenceArgument] = await Promise.all([
    getAssignmentWritingSpineRollout(assignmentId),
    getAssignmentEvidenceArgumentRollout(assignmentId),
  ]);

  setWritingSpineModeCache(writingSpine.mode);
  setEvidenceArgumentModeCache(evidenceArgument.mode);

  return NextResponse.json({
    ok: true,
    assignmentId: writingSpine.assignmentId,
    // WP-085 fields (backward compatible)
    mode: writingSpine.mode,
    capabilities: writingSpine.capabilities,
    source: writingSpine.source,
    schemaOk: writingSpine.schemaOk,
    warning: writingSpine.warning || null,
    // WP-088 independent evidence-to-argument rollout
    evidenceArgumentMode: evidenceArgument.mode,
    evidenceArgumentCapabilities: evidenceArgument.capabilities,
    evidenceArgumentSource: evidenceArgument.source,
    evidenceArgumentSchemaOk: evidenceArgument.schemaOk,
    evidenceArgumentWarning: evidenceArgument.warning || null,
  });
}
