import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type DeletedCounts = Record<string, number>;

type ResetResponse =
  | { ok: true; email: string; deleted: DeletedCounts }
  | { ok: false; email?: string; deleted: DeletedCounts; reason: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(req: Request) {
  // Dev-only safety
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, deleted: {}, reason: "not_found" } satisfies ResetResponse, {
      status: 404,
    });
  }

  const deleted: DeletedCounts = {};

  try {
    const session = await getServerSession(authOptions);
    const callerEmail = session?.user?.email;

    if (!callerEmail) {
      return NextResponse.json(
        { ok: false, deleted, reason: "not_signed_in" } satisfies ResetResponse,
        { status: 401 }
      );
    }

    const headerSecret = req.headers.get("x-dev-reset-secret") ?? "";
    const expectedSecret = process.env.DEV_RESET_SECRET ?? "";

    if (!expectedSecret || headerSecret !== expectedSecret) {
      return NextResponse.json(
        { ok: false, email: callerEmail, deleted, reason: "invalid_secret" } satisfies ResetResponse,
        { status: 403 }
      );
    }

    // Body is optional and ignored for target user.
    // We keep parsing just to avoid noisy errors if callers send JSON.
    await req.json().catch(() => ({}));

    const supabase = getSupabaseAdmin();

    // IMPORTANT:
    // This list now includes `student_assignments` + `module_scores` which are what drive
    // the dashboard "in_progress/current module" state.
    //
    // Order is intentional: delete “leaf” data first, assignment/progression last.
    const tablesToClear: Array<{ key: string; table: string }> = [
      // Content + artifacts
      { key: "student_readaloud", table: "student_readaloud" },
      { key: "student_drafts", table: "student_drafts" },
      { key: "student_outlines", table: "student_outlines" },
      { key: "bucket_groups", table: "bucket_groups" },
      { key: "tchart_entries", table: "tchart_entries" },
      { key: "student_exports", table: "student_exports" },
      

      // Module-specific tables that can affect gating and UI
      { key: "module3_responses", table: "module3_responses" },
      { key: "module2_sources", table: "module2_sources" },
      { key: "module1_quiz_results", table: "module1_quiz_results" },
      { key: "module9_quiz", table: "module9_quiz" },

      // Logging
      { key: "student_activity_log", table: "student_activity_log" },

      // Progress state
      { key: "module_scores", table: "module_scores" },
      { key: "student_assignments", table: "student_assignments" },
    ];

    let anyError = false;

    for (const { key, table } of tablesToClear) {
      const { error, count } = await supabase
        .from(table)
        .delete({ count: "exact" })
        .eq("user_email", callerEmail);

      if (error) {
        anyError = true;
        deleted[key] = 0;
      } else {
        deleted[key] = typeof count === "number" ? count : 0;
      }
    }

    const response: ResetResponse = anyError
      ? { ok: false, email: callerEmail, deleted, reason: "partial_failure" }
      : { ok: true, email: callerEmail, deleted };

    return NextResponse.json(response, { status: anyError ? 200 : 200 });
  } catch (e: unknown) {
    const reason =
      e instanceof Error ? e.message : isPlainObject(e) && typeof e["message"] === "string" ? String(e["message"]) : "unexpected_error";

    const response: ResetResponse = {
      ok: false,
      deleted,
      reason,
    };

    return NextResponse.json(response, { status: 200 });
  }
}