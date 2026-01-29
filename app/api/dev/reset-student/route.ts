import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type DeletedCounts = {
  student_activity_log: number;
  tchart_entries: number;
  student_outlines: number;
  student_drafts: number;
  student_readaloud: number;
};

type ResetResponse =
  | { ok: true; email: string; deleted: DeletedCounts }
  | { ok: false; email?: string; deleted: DeletedCounts; reason?: string };

const RESET_TABLES: (keyof DeletedCounts)[] = [
  "student_activity_log",
  "tchart_entries",
  "student_outlines",
  "student_drafts",
  "student_readaloud",
];

function createEmptyDeleted(): DeletedCounts {
  return {
    student_activity_log: 0,
    tchart_entries: 0,
    student_outlines: 0,
    student_drafts: 0,
    student_readaloud: 0,
  };
}

async function deleteForUser(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  table: keyof DeletedCounts,
  userEmail: string
): Promise<{ count: number; error: boolean }> {
  try {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq("user_email", userEmail)
      .select("id");

    if (error) {
      return { count: 0, error: true };
    }
    const count = Array.isArray(data) ? data.length : 0;
    return { count, error: false };
  } catch {
    return { count: 0, error: true };
  }
}

export async function POST(req: Request) {
  const deleted = createEmptyDeleted();
  let report: ResetResponse = { ok: false, deleted, reason: undefined };

  try {
    if (process.env.NODE_ENV === "production") {
      report.reason = "disabled_in_production";
      return NextResponse.json(report, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const callerEmail = session?.user?.email;
    if (!callerEmail) {
      report.reason = "not_signed_in";
      return NextResponse.json(report, { status: 401 });
    }

    const secret = req.headers.get("x-dev-reset-secret") ?? "";
    const expected = process.env.DEV_RESET_SECRET ?? "";
    if (!expected || secret !== expected) {
      report.reason = "invalid_secret";
      return NextResponse.json(report, { status: 403 });
    }

    const userEmail = callerEmail.trim().toLowerCase();
    const supabase = getSupabaseAdmin();

    let anyDeleteFailed = false;
    for (const table of RESET_TABLES) {
      const { count, error } = await deleteForUser(supabase, table, userEmail);
      deleted[table] = count;
      if (error) {
        anyDeleteFailed = true;
      }
    }

    if (anyDeleteFailed) {
      report.ok = false;
      report.email = userEmail;
      report.deleted = deleted;
      return NextResponse.json(report, { status: 200 });
    }

    report = { ok: true, email: userEmail, deleted };
    return NextResponse.json(report, { status: 200 });
  } catch {
    const errorReport: ResetResponse = {
      ok: false,
      deleted,
      reason: "unknown_error",
    };
    return NextResponse.json(errorReport, { status: 200 });
  }
}
