import type { SupabaseClient } from "@supabase/supabase-js";

type SaveReadAloudArgs = {
  supabase: SupabaseClient;
  userEmail: string;
  file: File;
  notes?: string;
  durationSeconds?: number | null;
  module?: number;
  transcript?: string | null;
};

type SaveReadAloudResult =
  | { ok: true; filename: string; publicUrl: string }
  | { ok: false; error: { message: string } };

type GetLatestReadAloudArgs = {
  supabase: SupabaseClient;
  userEmail: string;
  module?: number;
};

type GetLatestReadAloudResult =
  | { ok: true; publicUrl: string | null; durationSeconds: number | null }
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
  notes = "",
  durationSeconds = null,
  module = 7,
  transcript = null,
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

    const nowIso = new Date().toISOString();
    const insert = await supabase.from("student_readaloud").insert({
      user_email: userEmail,
      module,
      blob_url: publicUrl,
      duration_seconds: Number.isFinite(durationSeconds as any) ? durationSeconds : null,
      transcript,
      notes,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (insert.error) {
      return { ok: false, error: { message: insert.error.message } };
    }

    return { ok: true, filename, publicUrl };
  } catch (e: any) {
    return { ok: false, error: { message: e?.message || "Unexpected error" } };
  }
}

export async function getLatestReadAloud({
  supabase,
  userEmail,
  module = 7,
}: GetLatestReadAloudArgs): Promise<GetLatestReadAloudResult> {
  try {
    const { data, error } = await supabase
      .from("student_readaloud")
      .select("blob_url, duration_seconds, updated_at, created_at")
      .eq("user_email", userEmail)
      .eq("module", module)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { ok: false, error: { message: error.message } };
    }

    const durationRaw = (data as any)?.duration_seconds ?? null;
    const durationSeconds =
      typeof durationRaw === "number" && Number.isFinite(durationRaw) ? durationRaw : null;

    return {
      ok: true,
      publicUrl: data?.blob_url ?? null,
      durationSeconds,
    };
  } catch (e: any) {
    return { ok: false, error: { message: e?.message || "Unexpected error" } };
  }
}