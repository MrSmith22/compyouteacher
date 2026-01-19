import { supabase } from "@/lib/supabaseClient";

type TChartEntry = {
  category: string;
  type: string;
  quote?: string;
  observation?: string;
  letter_url?: string | null;
};

export async function upsertTChartEntries({
  userEmail,
  entries,
}: {
  userEmail: string;
  entries: TChartEntry[];
}) {
  const now = new Date().toISOString();

  const rows = entries.map((entry) => ({
    user_email: userEmail,
    category: entry.category,
    type: entry.type,
    quote: entry.quote || "",
    observation: entry.observation || "",
    letter_url: entry.letter_url || null,
    updated_at: now,
  }));

  return supabase
    .from("tchart_entries")
    .upsert(rows, {
      onConflict: "user_email,category,type",
      ignoreDuplicates: false,
    })
    .select();
}
