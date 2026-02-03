import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "final-pdfs";
const MODULE = 9;
const KIND = "final_pdf";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const userEmail = session.user.email;

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const file = formData.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("student_exports")
      .select("id")
      .eq("user_email", userEmail)
      .eq("module", MODULE)
      .eq("kind", KIND)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Final PDF already submitted" },
        { status: 409 }
      );
    }

    const safeEmail = userEmail.replace(/[^a-zA-Z0-9._-]/g, "_");
    const originalName = (file.name || "document.pdf").replace(/\s+/g, "_");
    const path = `${safeEmail}/${Date.now()}-${originalName}`;

    const buffer = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf",
      });

    if (uploadErr) {
      console.error("[final-pdf] upload error:", uploadErr);
      return NextResponse.json(
        { error: uploadErr.message || "Upload failed" },
        { status: 500 }
      );
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub?.publicUrl || "";

    const docId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { error: rowErr } = await supabase.from("student_exports").insert({
      doc_id: docId,
      user_email: userEmail,
      module: MODULE,
      kind: KIND,
      file_name: originalName,
      storage_path: path,
      public_url: publicUrl,
      web_view_link: publicUrl,
      uploaded_at: new Date().toISOString(),
    });

    if (rowErr) {
      console.error("[final-pdf] student_exports insert error:", rowErr);
      return NextResponse.json(
        { error: rowErr.message || "Save failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      publicUrl,
      webViewLink: publicUrl,
      storage_path: path,
    });
  } catch (err) {
    console.error("[final-pdf] error:", err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
