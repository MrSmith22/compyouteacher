import { supabase } from "@/lib/supabaseClient";

type Module2SourcesRow = {
  user_email: string;
  mlk_url: string | null;
  mlk_text: string | null;
  mlk_site_name: string | null;
  mlk_transcript_year: string | null;
  mlk_citation: string | null;
  lfbj_url: string | null;
  lfbj_text: string | null;
  lfbj_site_name: string | null;
  lfbj_transcript_year: string | null;
  lfbj_citation: string | null;
  updated_at?: string | null;
};

export async function getModule2Sources({ userEmail }: { userEmail: string }) {
  return supabase
    .from("module2_sources")
    .select(
      "user_email, mlk_url, mlk_text, mlk_site_name, mlk_transcript_year, mlk_citation, lfbj_url, lfbj_text, lfbj_site_name, lfbj_transcript_year, lfbj_citation, updated_at"
    )
    .eq("user_email", userEmail)
    .maybeSingle();
}

export async function upsertModule2SpeechSource({
  userEmail,
  speechUrl,
  speechText,
  speechSiteName,
  speechTranscriptYear,
  speechCitation,
}: {
  userEmail: string;
  speechUrl: string;
  speechText: string;
  speechSiteName?: string | null;
  speechTranscriptYear?: string | null;
  speechCitation?: string | null;
}) {
  const now = new Date().toISOString();

  const row: Partial<Module2SourcesRow> = {
    user_email: userEmail,
    mlk_url: speechUrl,
    mlk_text: speechText,
    mlk_site_name: speechSiteName ?? null,
    mlk_transcript_year: speechTranscriptYear ?? null,
    mlk_citation: speechCitation ?? null,
    updated_at: now,
  };

  return supabase
    .from("module2_sources")
    .upsert(row, { onConflict: "user_email" })
    .select(
      "user_email, mlk_url, mlk_text, mlk_site_name, mlk_transcript_year, mlk_citation, lfbj_url, lfbj_text, lfbj_site_name, lfbj_transcript_year, lfbj_citation, updated_at"
    );
}

export async function upsertModule2LetterSource({
  userEmail,
  letterUrl,
  letterText,
  letterSiteName,
  letterTranscriptYear,
  letterCitation,
  speechUrl,
  speechText,
  speechSiteName,
  speechTranscriptYear,
  speechCitation,
}: {
  userEmail: string;
  letterUrl: string;
  letterText: string;
  letterSiteName?: string | null;
  letterTranscriptYear?: string | null;
  letterCitation?: string | null;
  speechUrl?: string | null;
  speechText?: string | null;
  speechSiteName?: string | null;
  speechTranscriptYear?: string | null;
  speechCitation?: string | null;
}) {
  const now = new Date().toISOString();

  const row: Partial<Module2SourcesRow> = {
    user_email: userEmail,
    lfbj_url: letterUrl,
    lfbj_text: letterText,
    lfbj_site_name: letterSiteName ?? null,
    lfbj_transcript_year: letterTranscriptYear ?? null,
    lfbj_citation: letterCitation ?? null,
    mlk_url: speechUrl ?? null,
    mlk_text: speechText ?? null,
    mlk_site_name: speechSiteName ?? null,
    mlk_transcript_year: speechTranscriptYear ?? null,
    mlk_citation: speechCitation ?? null,
    updated_at: now,
  };

  return supabase
    .from("module2_sources")
    .upsert(row, { onConflict: "user_email" })
    .select(
      "user_email, mlk_url, mlk_text, mlk_site_name, mlk_transcript_year, mlk_citation, lfbj_url, lfbj_text, lfbj_site_name, lfbj_transcript_year, lfbj_citation, updated_at"
    );
}