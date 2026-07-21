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

    // Success/receipt refreshes must not duplicate completion proof.
    if (action === "module_completed" && moduleValue != null) {
      const existing = await supabase
        .from("student_activity_log")
        .select("id")
        .eq("user_email", email)
        .eq("action", "module_completed")
        .eq("module", moduleValue)
        .limit(1)
        .maybeSingle();

      if (!existing.error && existing.data?.id) {
        return NextResponse.json(
          { ok: true, stored: false, alreadyLogged: true },
          { status: 200 }
        );
      }
    }

    const { error } = await supabase.from("student_activity_log").insert({
      user_email: email,
      action,
      module: moduleValue,
      metadata,
    });

    if (error) {
      if (action === "module_completed" && moduleValue != null) {
        const raced = await supabase
          .from("student_activity_log")
          .select("id")
          .eq("user_email", email)
          .eq("action", "module_completed")
          .eq("module", moduleValue)
          .limit(1)
          .maybeSingle();
        if (!raced.error && raced.data?.id) {
          return NextResponse.json(
            { ok: true, stored: false, alreadyLogged: true },
            { status: 200 }
          );
        }
      }
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