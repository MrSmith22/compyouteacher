import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import { seedModule5 } from "@/lib/dev/seeds/seedModule5";
import { nowIso, seedEssayFullText, seedEssaySections } from "@/lib/dev/seeds/seedContent";

/**
 * Seed a locked Module 6 draft so Module 7 can revise immediately.
 *
 * Module 7 Read Aloud prefers `student_drafts` where module=7 (`full_text`).
 * When that is missing it falls back to module=6 (`sections` / `full_text`).
 * Seed both so the essay area is never empty after a prior empty M7 row.
 */
export async function seedModule6(userEmail: string) {
  const prior = await seedModule5(userEmail);
  if (!prior.ok) return prior;

  const supabase = getSupabaseAdmin();
  const now = nowIso();
  const sections = seedEssaySections();
  const fullText = seedEssayFullText();

  // Clear stale drafts so Module 7 cannot prefer an empty/whitespace M7 row.
  await supabase
    .from("student_drafts")
    .delete()
    .eq("user_email", userEmail)
    .eq("module", 6);
  await supabase
    .from("student_drafts")
    .delete()
    .eq("user_email", userEmail)
    .eq("module", 7);

  const { error: m6Error } = await supabase.from("student_drafts").insert({
    user_email: userEmail,
    module: 6,
    sections,
    full_text: fullText,
    locked: true,
    draft_meta: {
      schemaVersion: 1,
      currentSectionIndex: sections.length,
      currentStageId: "stage-review",
      sourceOutlineSignature: "",
      completedSectionIds: [],
      outlineReviewRequired: false,
      outlineReviewAcknowledged: false,
    },
    draft_revision: 1,
    updated_at: now,
  });
  if (m6Error) {
    return { ok: false as const, error: m6Error.message };
  }

  // Module 7 loads this first for Read Aloud / revision sections.
  const { error: m7Error } = await supabase.from("student_drafts").insert({
    user_email: userEmail,
    module: 7,
    full_text: fullText,
    final_text: null,
    revised: false,
    final_ready: false,
    updated_at: now,
  });
  if (m7Error) {
    return { ok: false as const, error: m7Error.message };
  }

  const progress = await setCurrentModule(userEmail, 7);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return { ok: true as const, currentModule: progress.module };
}
