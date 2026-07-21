import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAssignmentWordCountSettings } from "@/lib/supabase/helpers/assignmentSettings";
import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments/identity";

/**
 * Student-readable assignment word-count expectation (WP-084).
 * Authenticated students may read; writes stay on the teacher route.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const url = new URL(request.url);
  const assignmentId =
    url.searchParams.get("assignmentId") || DEFAULT_ASSIGNMENT_ID;
  const result = await getAssignmentWordCountSettings(assignmentId);
  return NextResponse.json({
    ok: true,
    settings: result.settings,
    source: result.source,
  });
}
