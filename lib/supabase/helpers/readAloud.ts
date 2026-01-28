// lib/supabase/helpers/readAloud.ts
import type { SupabaseClient } from "@supabase/supabase-js";

type SaveReadAloudArgs = {
  supabase: SupabaseClient;
  userEmail: string;
  file: File;
  notes?: string;
  durationSeconds?: number | null;
  module?: number;
};

type SaveReadAloudResult =
  | { ok: true; filename: string; publicUrl: string }
  | { ok: false; error: { message: string } };

function safeEmail(email: string) {
  return (email || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function pickExtension(file: File) {
  const t = (file.type || "").toLowerCase();
  if (t.includes("webm")) return "webm";
  if (t.includes("mp4")) return "m4a";
  if (t.includes("aac")) return "m4a";
  if (t.includes("mpeg")) return "mp3";
  if (t.includes("wav")) return "wav";
  return "webm";
}

export async function saveReadAloud({
  supabase,
  userEmail,
  file,
  module = 7,
}: SaveReadAloudArgs): Promise<SaveReadAloudResult> {
  try {
    const ext = pickExtension(file);
    const emailSafe = safeEmail(userEmail);
    const filename = `readaloud/${emailSafe}/${crypto.randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const upload = await supabase.storage.from("student-audio").upload(filename, bytes, {
      contentType: file.type || "audio/*",
      upsert: true,
    });

    if (upload.error) {
      return { ok: false, error: { message: upload.error.message } };
    }

    const { data: urlData } = supabase.storage.from("student-audio").getPublicUrl(filename);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      return { ok: false, error: { message: "Could not generate public URL" } };
    }

    return { ok: true, filename, publicUrl };
  } catch (e: any) {
    return { ok: false, error: { message: e?.message || "Unexpected error" } };
  }
}