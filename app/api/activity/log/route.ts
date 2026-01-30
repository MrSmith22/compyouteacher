import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Decide if an action should count as "module completed" for progress tracking.
 * Completion: action contains "complete" OR "submitted" OR "success".
 */
function isCompletionAction(action: string): boolean {
  const a = action.toLowerCase();
  if (a.includes("complete")) return true;
  if (a.includes("submitted")) return true;
  if (a.includes("success")) return true;
  return false;
}

function clampModule(n: number): number {
  // Your app currently uses modules 1 to 10
  if (n < 1) return 1;
  if (n > 10) return 10;
  return n;
}

type LogBody = Record<string, unknown>;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    // Logging is best effort; never block the app
    if (!email) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    const body: LogBody = await req.json().catch(() => ({}));

    // Support both legacy and current client payloads
    const actionRaw =
      (typeof body?.action === "string" && body.action.trim()) ||
      (typeof body?.eventType === "string" && body.eventType.trim()) ||
      "";
    const action = typeof actionRaw === "string" ? actionRaw : "";

    if (!action) {
      return NextResponse.json(
        { ok: true, skipped: true, reason: "missing_action" },
        { status: 200 }
      );
    }

    const moduleValue = asNumber(body?.module);

    // Preferred metadata; legacy meta
    const metadataRaw = isObject(body?.metadata)
      ? body.metadata
      : isObject(body?.meta)
        ? body.meta
        : null;

    const supabase = getSupabaseAdmin();

    let storedActivity = false;
    let updatedAssignment = false;
    let previousModule: number | null = null;
    let newModule: number | null = null;

    // 1) Store activity log (best effort)
    try {
      const { error } = await supabase.from("student_activity_log").insert({
        user_email: email,
        action,
        module: moduleValue,
        metadata: metadataRaw,
      });
      storedActivity = !error;
    } catch {
      // swallow
    }

    // 2) Update student_assignments when body.module is a number (never decrease current_module)
    const assignmentName = "MLK Essay Assignment";
    const MAX_MODULE = 10;

    try {
      if (moduleValue != null) {
        const moduleNumber = clampModule(moduleValue);
        let targetModule = moduleNumber;

        if (isCompletionAction(action)) {
          const nextModule = Math.min(moduleNumber + 1, MAX_MODULE);
          targetModule = Math.max(targetModule, nextModule);

          // Upsert module_scores on completion (best effort)
          let score: number | null = null;
          if (metadataRaw && isObject(metadataRaw)) {
            score = asNumber(metadataRaw["score"]) ?? asNumber(metadataRaw["percent"]) ?? null;
          }
          score = score ?? asNumber(body?.score) ?? null;
          try {
            await supabase
              .from("module_scores")
              .upsert(
                {
                  user_email: email,
                  module: moduleNumber,
                  score,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_email,module" }
              );
          } catch {
            // swallow
          }
        }

        let existingCurrent: number | null = null;
        try {
          const { data: aRow } = await supabase
            .from("student_assignments")
            .select("current_module")
            .eq("user_email", email)
            .eq("assignment_name", assignmentName)
            .maybeSingle();
          const row = aRow as { current_module?: number } | null;
          if (row && typeof row.current_module === "number") {
            existingCurrent = row.current_module;
          }
        } catch {
          // swallow
        }

        previousModule = existingCurrent;
        const currentModuleToWrite =
          existingCurrent == null
            ? targetModule
            : Math.max(existingCurrent, targetModule);
        newModule = currentModuleToWrite;

        try {
          const { error: upsertErr } = await supabase
            .from("student_assignments")
            .upsert(
              {
                user_email: email,
                assignment_name: assignmentName,
                current_module: currentModuleToWrite,
                status: "in_progress",
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_email,assignment_name" }
            );
          updatedAssignment = !upsertErr;
        } catch {
          // swallow
        }
      }
    } catch {
      // swallow
    }

    const payload: Record<string, unknown> = { ok: true };
    if (process.env.NODE_ENV === "development") {
      payload.storedActivity = storedActivity;
      payload.updatedAssignment = updatedAssignment;
      payload.previousModule = previousModule;
      payload.newModule = newModule;
    }
    return NextResponse.json(payload, { status: 200 });
  } catch {
    // Absolute last resort safety net
    return NextResponse.json({ ok: true, stored: false }, { status: 200 });
  }
}