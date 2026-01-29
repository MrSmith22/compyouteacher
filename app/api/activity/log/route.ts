import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    // Logging is best-effort; never block the app
    if (!email) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    const body = await req.json().catch(() => ({}));

    // Support both legacy + current client payloads
    const action =
      (typeof body?.action === "string" && body.action.trim()) ||
      (typeof body?.eventType === "string" && body.eventType.trim()) ||
      "";

    if (!action) {
      return NextResponse.json(
        { ok: true, skipped: true, reason: "missing_action" },
        { status: 200 }
      );
    }

    const moduleValue = typeof body?.module === "number" ? body.module : null;

    // Preferred: metadata; legacy: meta
    const metadata =
      body?.metadata != null && typeof body.metadata === "object"
        ? body.metadata
        : body?.meta != null && typeof body.meta === "object"
          ? body.meta
          : null;

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("student_activity_log").insert({
      user_email: email,
      action,
      module: moduleValue,
      metadata,
    });

    if (error) {
      // Never surface logging failures to the client
      return NextResponse.json(
        { ok: true, stored: false },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true, stored: true }, { status: 200 });
  } catch {
    // Absolute last-resort safety net
    return NextResponse.json({ ok: true, stored: false }, { status: 200 });
  }
}