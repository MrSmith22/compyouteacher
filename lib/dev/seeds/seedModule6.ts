import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import { seedModule5 } from "@/lib/dev/seeds/seedModule5";
import { nowIso, seedEssayFullText, seedEssaySections } from "@/lib/dev/seeds/seedContent";

/**
 * Seed a locked Module 6 draft so Module 7 can revise immediately.
 */
export async function seedModule6(userEmail: string) {
  const prior = await seedModule5(userEmail);
  if (!prior.ok) return prior;

  const supabase = getSupabaseAdmin();
  const now = nowIso();
  const sections = seedEssaySections();
  const fullText = seedEssayFullText();

  const { error } = await supabase.from("student_drafts").upsert(
    {
      user_email: userEmail,
      module: 6,
      sections,
      full_text: fullText,
      locked: true,
      updated_at: now,
    },
    { onConflict: "user_email,module" }
  );
  if (error) {
    return { ok: false as const, error: error.message };
  }

  const progress = await setCurrentModule(userEmail, 7);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return { ok: true as const, currentModule: progress.module };
}
