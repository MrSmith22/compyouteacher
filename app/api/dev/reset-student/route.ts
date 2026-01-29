import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type ResetReport = {
  ok: boolean;
  email?: string;
  skipped?: boolean;
  reason?: string;
  deleted?: Record<string, number>;
  storage?: Record<string, { removed: number; errors: number }>;
};

function normalizeEmail(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase();
}

// Your Storage folders appear to be email with "@" replaced by "_"
function emailToFolder(email: string): string {
  return email.replace("@", "_");
}

async function removeAllInFolder(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  bucket: string;
  folder: string; // top level folder
}): Promise<{ removed: number; errors: number }> {
  const { supabase, bucket, folder } = params;

  let removed = 0;
  let errors = 0;

  async function walk(path: string): Promise<void> {
    // list contents of current path
    const { data, error } = await supabase.storage.from(bucket).list(path, {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      errors += 1;
      return;
    }

    if (!data || data.length === 0) return;

    const filesToRemove: string[] = [];

    for (const item of data) {
      const itemPath = path ? `${path}/${item.name}` : item.name;

      // Supabase Storage "folders" typically come back with metadata null
      const isFolder = item.metadata === null;

      if (isFolder) {
        await walk(itemPath);
      } else {
        filesToRemove.push(itemPath);
      }
    }

    if (filesToRemove.length > 0) {
      const { error: removeError } = await supabase.storage.from(bucket).remove(filesToRemove);
      if (removeError) {
        errors += 1;
      } else {
        removed += filesToRemove.length;
      }
    }
  }

  // Try walking the folder. If it does not exist, list will just return empty.
  await walk(folder);

  return { removed, errors };
}

export async function POST(req: Request) {
  const report: ResetReport = { ok: false };

  try {
    // Hard stop in production
    if (process.env.NODE_ENV === "production") {
      report.reason = "disabled_in_production";
      return NextResponse.json(report, { status: 404 });
    }

    // Require signed in user
    const session = await getServerSession(authOptions);
    const callerEmail = session?.user?.email;
    if (!callerEmail) {
      report.reason = "not_signed_in";
      return NextResponse.json(report, { status: 401 });
    }

    // Require secret header
    const secret = req.headers.get("x-dev-reset-secret") ?? "";
    const expected = process.env.DEV_RESET_SECRET ?? "";
    if (!expected || secret !== expected) {
      report.reason = "invalid_secret";
      return NextResponse.json(report, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);

    if (!email) {
      report.reason = "missing_email";
      return NextResponse.json(report, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Tables you want wiped for a student
    // If a table does not have user_email, it will just error and we record 0.
    // Adjust list if you add new per student tables.
    const deleteByUserEmailTables = [
      "student_assignments",
      "tchart_entries",
      "module2_sources",
      "module3_responses",
      "bucket_groups",
      "student_outlines",
      "student_drafts",
      "student_readaloud",
      "student_activity_log",
      "module_scores",
      "module1_quiz_results",
      "module9_quiz",
      "student_exports",
      "exported_docs",
      "student_letter_urls",
      "student_sources",
      "user_resources",
      "app_roles",
      "user_roles",
    ] as const;

    const deletedCounts: Record<string, number> = {};

    for (const table of deleteByUserEmailTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .delete()
          .eq("user_email", email)
          .select("id");

        if (error) {
          // Some tables may not have user_email. Treat as 0 and continue.
          deletedCounts[table] = 0;
        } else {
          deletedCounts[table] = Array.isArray(data) ? data.length : 0;
        }
      } catch {
        deletedCounts[table] = 0;
      }
    }

    // Storage wipe: remove everything under the per user folder in each bucket
    const folder = emailToFolder(email);
    const buckets = ["final-pdfs", "final-submissions", "student-pdfs", "student-audio"] as const;

    const storageResults: Record<string, { removed: number; errors: number }> = {};

    for (const bucket of buckets) {
      storageResults[bucket] = await removeAllInFolder({
        supabase,
        bucket,
        folder,
      });
    }

    report.ok = true;
    report.email = email;
    report.deleted = deletedCounts;
    report.storage = storageResults;

    return NextResponse.json(report, { status: 200 });
  } catch {
    report.reason = "unknown_error";
    return NextResponse.json(report, { status: 200 });
  }
}