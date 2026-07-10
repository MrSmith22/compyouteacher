import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule, setModule9Shortcut } from "@/lib/dev/devPanelServer";
import { seedCompleteEssay } from "@/lib/dev/seeds/seedCompleteEssay";
import { nowIso } from "@/lib/dev/seeds/seedContent";

export type SeedModule9Options = {
  googleDoc?: boolean;
  checklist?: boolean;
  quiz?: boolean;
  pdf?: boolean;
  moduleComplete?: boolean;
};

/**
 * Seed a complete essay plus Module 9 readiness flags.
 * Defaults leave the student on Module 9 with common completion stubs on.
 */
export async function seedModule9Ready(
  userEmail: string,
  options: SeedModule9Options = {}
) {
  const {
    googleDoc = true,
    checklist = true,
    quiz = true,
    pdf = true,
    moduleComplete = false,
  } = options;

  const prior = await seedCompleteEssay(userEmail);
  if (!prior.ok) return prior;

  // Keep current_module at 9 unless moduleComplete is requested.
  if (!moduleComplete) {
    const progress = await setCurrentModule(userEmail, 9);
    if (!progress.ok) {
      return { ok: false as const, error: progress.error || "Failed to set module" };
    }
  }

  if (checklist) {
    const result = await setModule9Shortcut(userEmail, "checklist", true);
    if (!result.ok) return { ok: false as const, error: result.error || "checklist failed" };
  }

  if (quiz) {
    const result = await setModule9Shortcut(userEmail, "quiz", true);
    if (!result.ok) return { ok: false as const, error: result.error || "quiz failed" };
  }

  if (pdf) {
    const result = await setModule9Shortcut(userEmail, "pdf", true);
    if (!result.ok) return { ok: false as const, error: result.error || "pdf failed" };
  }

  if (googleDoc) {
    // Stub server-side so seed stays one-shot (no client Google OAuth roundtrip).
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("exported_docs").upsert(
      {
        user_email: userEmail,
        document_id: `dev-doc-seed-${Date.now()}`,
        web_view_link: "https://docs.google.com/document/d/dev-seed-stub/edit",
        updated_at: nowIso(),
      },
      { onConflict: "user_email" }
    );
    if (error) {
      return { ok: false as const, error: error.message };
    }
  }

  if (moduleComplete) {
    const result = await setModule9Shortcut(userEmail, "moduleComplete", true);
    if (!result.ok) {
      return { ok: false as const, error: result.error || "moduleComplete failed" };
    }
  }

  return {
    ok: true as const,
    currentModule: moduleComplete ? 10 : 9,
    options: { googleDoc, checklist, quiz, pdf, moduleComplete },
  };
}
