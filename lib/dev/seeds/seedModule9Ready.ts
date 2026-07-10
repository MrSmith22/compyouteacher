import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule, setModule9Shortcut } from "@/lib/dev/devPanelServer";
import { seedCompleteEssay } from "@/lib/dev/seeds/seedCompleteEssay";
import { buildDevEssayPdf } from "@/lib/dev/seeds/buildDevEssayPdf";
import { seedEssayFullText } from "@/lib/dev/seeds/seedContent";
import { exportEssayToGoogleDocs } from "@/lib/exports/exportEssayToGoogleDocs";
import { uploadFinalPdf } from "@/lib/exports/uploadFinalPdf";

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

async function getEssayTextForSeed(userEmail: string) {
  const supabase = getSupabaseAdmin();
  const res7 = await supabase
    .from("student_drafts")
    .select("final_text, full_text")
    .eq("user_email", userEmail)
    .eq("module", 7)
    .maybeSingle();
  const m7Final = String(res7.data?.final_text ?? "").trim();
  if (m7Final) return m7Final;
  const m7Full = String(res7.data?.full_text ?? "").trim();
  if (m7Full) return m7Full;

  const res6 = await supabase
    .from("student_drafts")
    .select("full_text")
    .eq("user_email", userEmail)
    .eq("module", 6)
    .maybeSingle();
  const m6Text = String(res6.data?.full_text ?? "").trim();
  if (m6Text) return m6Text;

  return seedEssayFullText();
}

async function seedGoogleDocViaPipeline(userEmail: string, essayText: string) {
  try {
    const result = await exportEssayToGoogleDocs({
      email: userEmail,
      text: essayText,
    });
    return {
      ok: true as const,
      source: "production_pipeline" as const,
      documentId: result.documentId,
      webViewLink: result.webViewLink,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[seedModule9Ready] Google Doc export failed, using stub:", message);

    const supabase = getSupabaseAdmin();
    const documentId = `dev-doc-seed-${Date.now()}`;
    const { error } = await supabase.from("exported_docs").upsert(
      {
        user_email: userEmail,
        document_id: documentId,
        web_view_link: DEV_GOOGLE_DOC_LINK,
      },
      { onConflict: "user_email" }
    );
    if (error) {
      return { ok: false as const, error: error.message };
    }
    return {
      ok: true as const,
      source: "placeholder_fallback" as const,
      documentId,
      webViewLink: DEV_GOOGLE_DOC_LINK,
      fallbackReason: message,
    };
  }
}

async function seedPdfViaPipeline(userEmail: string, essayText: string) {
  try {
    const pdfBytes = buildDevEssayPdf(essayText);
    const result = await uploadFinalPdf({
      userEmail,
      fileBytes: pdfBytes,
      fileName: "seeded-final-essay.pdf",
      replaceExisting: true,
    });
    return {
      ok: true as const,
      source: "production_pipeline" as const,
      publicUrl: result.publicUrl,
      webViewLink: result.webViewLink,
      storagePath: result.storagePath,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[seedModule9Ready] PDF upload failed, using stub:", message);

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
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

    return {
      ok: true as const,
      source: "placeholder_fallback" as const,
      publicUrl: DEV_PDF_LINK,
      webViewLink: DEV_PDF_LINK,
      fallbackReason: message,
    };
  }
}

/**
 * Seed a complete essay plus Module 9 readiness flags.
 *
 * Prefers the production Google Doc export and final-PDF upload pipelines.
 * Falls back to placeholder URLs only when those pipelines fail.
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

  const essayText = await getEssayTextForSeed(userEmail);
  const artifacts: {
    googleDoc?: Awaited<ReturnType<typeof seedGoogleDocViaPipeline>>;
    pdf?: Awaited<ReturnType<typeof seedPdfViaPipeline>>;
  } = {};

  if (pdf) {
    const pdfResult = await seedPdfViaPipeline(userEmail, essayText);
    if (!pdfResult.ok) return pdfResult;
    artifacts.pdf = pdfResult;
  }

  if (googleDoc) {
    const docResult = await seedGoogleDocViaPipeline(userEmail, essayText);
    if (!docResult.ok) return docResult;
    artifacts.googleDoc = docResult;
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
    artifacts,
  };
}
