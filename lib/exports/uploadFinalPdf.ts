import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "final-pdfs";
const MODULE = 9;
const KIND = "final_pdf";

export type UploadFinalPdfResult = {
  publicUrl: string;
  webViewLink: string;
  storagePath: string;
  docId: string;
  fileName: string;
};

/**
 * Production final-PDF upload pipeline (shared by /api/final-pdf and dev seeds).
 * Uploads to the final-pdfs bucket and inserts student_exports.
 */
export async function uploadFinalPdf({
  userEmail,
  fileBytes,
  fileName,
  replaceExisting = false,
}: {
  userEmail: string;
  fileBytes: ArrayBuffer | Uint8Array;
  fileName: string;
  replaceExisting?: boolean;
}): Promise<UploadFinalPdfResult> {
  const supabase = getSupabaseAdmin();

  const existing = await supabase
    .from("student_exports")
    .select("id, storage_path")
    .eq("user_email", userEmail)
    .eq("module", MODULE)
    .eq("kind", KIND)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (existing.data) {
    if (!replaceExisting) {
      throw new Error("Final PDF already submitted");
    }
    if (existing.data.storage_path) {
      await supabase.storage.from(BUCKET).remove([existing.data.storage_path]);
    }
    await supabase.from("student_exports").delete().eq("id", existing.data.id);
  }

  const safeEmail = userEmail.replace(/[^a-zA-Z0-9._-]/g, "_");
  const originalName = (fileName || "document.pdf").replace(/\s+/g, "_");
  const path = `${safeEmail}/${Date.now()}-${originalName}`;

  const body =
    fileBytes instanceof Uint8Array ? fileBytes : new Uint8Array(fileBytes);

  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, body, {
    cacheControl: "3600",
    upsert: false,
    contentType: "application/pdf",
  });

  if (uploadErr) {
    throw new Error(uploadErr.message || "Upload failed");
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
    grading_status: "ungraded",
  });

  if (rowErr) {
    throw new Error(rowErr.message || "Save failed");
  }

  return {
    publicUrl,
    webViewLink: publicUrl,
    storagePath: path,
    docId,
    fileName: originalName,
  };
}
