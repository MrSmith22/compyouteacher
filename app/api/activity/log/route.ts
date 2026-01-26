import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    // If not signed in, do not treat as an error.
    // Logging is best effort and should never break the app.
    if (!email) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    const body = await req.json().catch(() => ({}));

    // Support both payload shapes:
    // - new client helper uses: { action, module, assignment, meta, path, ts }
    // - legacy may use: { eventType, module, meta }
    const eventType =
      (typeof body?.eventType === "string" && body.eventType.trim()) ||
      (typeof body?.action === "string" && body.action.trim()) ||
      "";

    if (!eventType) {
      return NextResponse.json({ ok: true, skipped: true, reason: "missing_eventType" }, { status: 200 });
    }

    const moduleValue = typeof body?.module === "number" ? body.module : null;

    // Keep meta small and safe.
    const meta =
      body?.meta && typeof body.meta === "object"
        ? body.meta
        : null;

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("student_activity_log").insert({
      user_email: email,
      event_type: eventType,
      module: moduleValue,
      meta,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Never return 500 for logging. Just report "stored: false".
      return NextResponse.json(
        { ok: true, stored: false, error: error.message ?? "insert_failed" },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true, stored: true }, { status: 200 });
  } catch (err) {
    // Absolute last resort: still never fail the request.
    return NextResponse.json({ ok: true, stored: false }, { status: 200 });
  }
}