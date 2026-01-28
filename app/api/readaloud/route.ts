// app/api/readaloud/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { saveReadAloud } from "@/lib/supabase/helpers/readAloud";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
    }

    const file = form.get("file");
    const moduleRaw = (form.get("module") as string | null) ?? "7";
    const module = moduleRaw ? Number(moduleRaw) : 7;

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing audio file" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const result = await saveReadAloud({
      supabase,
      userEmail: email,
      file,
      module: Number.isFinite(module) ? module : 7,
    });

    if (!result.ok) {
      console.error("[readaloud] save failed:", result.error);
      return NextResponse.json(
        { ok: false, error: result.error?.message ?? "Save failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      publicUrl: result.publicUrl,
      filename: result.filename,
    });
  } catch (e: any) {
    console.error("[readaloud] unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}