import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAssignmentWritingSpineRollout } from "@/lib/supabase/helpers/writingSpineRolloutSettings";
import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments/identity";
import { setWritingSpineModeCache } from "@/lib/assignments/writingSpineModeCache";

/**
 * Authenticated read of the resolved writing-spine rollout mode (WP-085).
 * Students and teachers may read; writes stay on the teacher route.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const url = new URL(request.url);
  const assignmentId =
    url.searchParams.get("assignmentId") || DEFAULT_ASSIGNMENT_ID;
  const result = await getAssignmentWritingSpineRollout(assignmentId);
  setWritingSpineModeCache(result.mode);

  return NextResponse.json({
    ok: true,
    assignmentId: result.assignmentId,
    mode: result.mode,
    capabilities: result.capabilities,
    source: result.source,
    schemaOk: result.schemaOk,
    warning: result.warning || null,
  });
}
