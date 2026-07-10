import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import { seedModule7 } from "@/lib/dev/seeds/seedModule7";
import { nowIso, seedEssayFullText } from "@/lib/dev/seeds/seedContent";

/**
 * Seed Modules 1–8 so the student appears to have completed a full essay.
 */
export async function seedCompleteEssay(userEmail: string) {
  const prior = await seedModule7(userEmail);
  if (!prior.ok) return prior;

  const supabase = getSupabaseAdmin();
  const now = nowIso();
  const text = seedEssayFullText();

  const { error } = await supabase.from("student_drafts").upsert(
    {
      user_email: userEmail,
      module: 8,
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

  const progress = await setCurrentModule(userEmail, 9);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return { ok: true as const, currentModule: progress.module };
}
