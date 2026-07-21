import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import { seedAllRequiredBodyParagraphs } from "@/lib/dev/seeds/seedAllRequiredBodyParagraphs";
import { upsertAssignmentWordCountSettings } from "@/lib/supabase/helpers/assignmentSettings";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
} from "@/lib/assignments/identity";
import { nowIso } from "@/lib/dev/seeds/seedContent";

/**
 * WP-084 — Seed whole-essay review path with a labeled 300-word advisory minimum.
 * Synthetic fixture for acceptance — not a universal high-school rule.
 */
export async function seedWholeEssayReview(userEmail: string) {
  const prior = await seedAllRequiredBodyParagraphs(userEmail);
  if (!prior.ok) return prior;

  const settings = await upsertAssignmentWordCountSettings(
    {
      assignmentId: DEFAULT_ASSIGNMENT_ID,
      assignmentName: DEFAULT_ASSIGNMENT_NAME,
      mode: "advisory_minimum",
      minimum: 300,
      maximum: null,
    },
    { updatedBy: "dev-seed-wp084" }
  );
  if (!settings.ok) {
    // Table may be missing until migration is applied — seed student work anyway.
    console.warn("WP-084 settings seed warning:", settings.error);
  }

  const supabase = getSupabaseAdmin();
  const now = nowIso();

  // Point Module 7 at final review (index N+1: Read Aloud + N sections).
  const { data: m7 } = await supabase
    .from("student_drafts")
    .select("full_text, draft_meta, sections")
    .eq("user_email", userEmail)
    .eq("module", 7)
    .maybeSingle();

  if (m7) {
    const sectionCount = Array.isArray(m7.sections) ? m7.sections.length : 5;
    const finalReviewIndex = sectionCount + 1;
    const draftMeta = {
      ...(m7.draft_meta && typeof m7.draft_meta === "object" ? m7.draft_meta : {}),
      currentStepIndex: finalReviewIndex,
      resume: {
        kind: "module7",
        currentStepIndex: finalReviewIndex,
        sectionType: null,
        draftIndex: null,
        returnTo: null,
      },
    };
    await supabase
      .from("student_drafts")
      .update({
        draft_meta: draftMeta,
        revised: true,
        final_ready: false,
        final_text: null,
        updated_at: now,
      })
      .eq("user_email", userEmail)
      .eq("module", 7);
  }

  const progress = await setCurrentModule(userEmail, 7);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return {
    ok: true as const,
    currentModule: progress.module,
    wordCountSettings: settings.ok ? settings.settings : null,
    settingsWarning: settings.ok ? null : settings.error,
  };
}
