import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import {
  SEED_LETTER_TEXT,
  SEED_SPEECH_TEXT,
  SEED_TCHART,
  nowIso,
} from "@/lib/dev/seeds/seedContent";

/**
 * Seed Module 2 sources + T-chart observations so Module 3 can open.
 */
export async function seedModule2(userEmail: string) {
  const supabase = getSupabaseAdmin();
  const now = nowIso();

  const { error: sourcesError } = await supabase.from("module2_sources").upsert(
    {
      user_email: userEmail,
      mlk_url: "https://www.archives.gov/files/press/exhibits/dream-speech.pdf",
      mlk_text: SEED_SPEECH_TEXT,
      mlk_site_name: "National Archives",
      mlk_transcript_year: "1963",
      mlk_citation:
        "King, M. L., Jr. (1963). I have a dream [Speech transcript]. National Archives.",
      lfbj_url: "https://www.africa.upenn.edu/Articles_Gen/Letter_Birmingham.html",
      lfbj_text: SEED_LETTER_TEXT,
      lfbj_site_name: "University of Pennsylvania",
      lfbj_transcript_year: "1963",
      lfbj_citation:
        "King, M. L., Jr. (1963). Letter from Birmingham Jail.",
      updated_at: now,
    },
    { onConflict: "user_email" }
  );
  if (sourcesError) {
    return { ok: false as const, error: sourcesError.message };
  }

  for (const row of SEED_TCHART) {
    const { error } = await supabase.from("tchart_entries").upsert(
      {
        user_email: userEmail,
        category: row.category,
        type: row.type,
        quote: row.quote,
        observation: row.observation,
        letter_url: null,
        updated_at: now,
      },
      { onConflict: "user_email,category,type" }
    );
    if (error) {
      return { ok: false as const, error: error.message };
    }
  }

  const progress = await setCurrentModule(userEmail, 3);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return { ok: true as const, currentModule: progress.module };
}
