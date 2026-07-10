import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import { seedModule6 } from "@/lib/dev/seeds/seedModule6";
import { nowIso, seedEssayFullText } from "@/lib/dev/seeds/seedContent";

/**
 * Seed a finalized Module 7 revision so Module 8 can load immediately.
 */
export async function seedModule7(userEmail: string) {
  const prior = await seedModule6(userEmail);
  if (!prior.ok) return prior;

  const supabase = getSupabaseAdmin();
  const now = nowIso();
  const text = seedEssayFullText();

  const { error } = await supabase.from("student_drafts").upsert(
    {
      user_email: userEmail,
      module: 7,
      full_text: text,
      final_text: text,
      revised: true,
      final_ready: true,
      updated_at: now,
    },
    { onConflict: "user_email,module" }
  );
  if (error) {
    return { ok: false as const, error: error.message };
  }

  const progress = await setCurrentModule(userEmail, 8);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return { ok: true as const, currentModule: progress.module };
}
