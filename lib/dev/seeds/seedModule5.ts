import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import { seedModule4 } from "@/lib/dev/seeds/seedModule4";
import { SEED_OUTLINE, nowIso } from "@/lib/dev/seeds/seedContent";

/**
 * Seed a finalized Module 5 outline so Module 6 can draft immediately.
 */
export async function seedModule5(userEmail: string) {
  const prior = await seedModule4(userEmail);
  if (!prior.ok) return prior;

  const supabase = getSupabaseAdmin();
  const now = nowIso();

  const { error } = await supabase.from("student_outlines").upsert(
    {
      user_email: userEmail,
      module: 5,
      outline: SEED_OUTLINE,
      finalized: true,
      updated_at: now,
    },
    { onConflict: "user_email,module" }
  );
  if (error) {
    return { ok: false as const, error: error.message };
  }

  const progress = await setCurrentModule(userEmail, 6);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return { ok: true as const, currentModule: progress.module };
}
