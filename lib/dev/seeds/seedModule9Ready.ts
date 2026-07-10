import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule, setModule9Shortcut } from "@/lib/dev/devPanelServer";
import { seedCompleteEssay } from "@/lib/dev/seeds/seedCompleteEssay";

export type SeedModule9Options = {
  googleDoc?: boolean;
  checklist?: boolean;
  quiz?: boolean;
  pdf?: boolean;
  moduleComplete?: boolean;
};

const DEV_GOOGLE_DOC_LINK =
  "https://docs.google.com/document/d/dev-seed-stub/edit";
const DEV_PDF_LINK = "https://example.com/dev-stub.pdf";

/**
 * Seed a complete essay plus Module 9 readiness flags.
 *
 * Module 9 "Open Google Doc" / "Open Final PDF" buttons render only when:
 * - exported_docs.web_view_link is readable (exportUrl)
 * - student_exports row exists for module=9, kind=final_pdf with public_url/web_view_link
 *   (alreadySubmitted)
 *
 * Stubs match the production export/upload field shapes (no extra columns).
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

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (pdf) {
    const existing = await supabase
      .from("student_exports")
      .select("id")
      .eq("user_email", userEmail)
      .eq("module", 9)
      .eq("kind", "final_pdf")
      .maybeSingle();

    if (existing.error) {
      return { ok: false as const, error: existing.error.message };
    }

    if (existing.data?.id) {
      const { error } = await supabase
        .from("student_exports")
        .update({
          file_name: "dev-stub.pdf",
          storage_path: `dev/${userEmail}/dev-stub.pdf`,
          public_url: DEV_PDF_LINK,
          web_view_link: DEV_PDF_LINK,
          uploaded_at: now,
          grading_status: "ungraded",
        })
        .eq("id", existing.data.id);
      if (error) return { ok: false as const, error: error.message };
    } else {
      const { error } = await supabase.from("student_exports").insert({
        doc_id: `dev_${Date.now()}`,
        user_email: userEmail,
        module: 9,
        kind: "final_pdf",
        file_name: "dev-stub.pdf",
        storage_path: `dev/${userEmail}/dev-stub.pdf`,
        public_url: DEV_PDF_LINK,
        web_view_link: DEV_PDF_LINK,
        uploaded_at: now,
        grading_status: "ungraded",
      });
      if (error) return { ok: false as const, error: error.message };
    }
  }

  if (googleDoc) {
    // Same shape as /api/export-to-docs (service-role upsert).
    // Always stub here so Seed Module 9 Ready does not depend on Google OAuth.
    const { error } = await supabase.from("exported_docs").upsert(
      {
        user_email: userEmail,
        document_id: `dev-doc-seed-${Date.now()}`,
        web_view_link: DEV_GOOGLE_DOC_LINK,
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
