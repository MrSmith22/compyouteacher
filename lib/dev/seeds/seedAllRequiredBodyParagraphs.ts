import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import { seedModule5 } from "@/lib/dev/seeds/seedModule5";
import { nowIso } from "@/lib/dev/seeds/seedContent";
import {
  buildWp083Module5Outline,
  buildWp083MovesBySourceIndex,
  buildWp083SectionsFromMoves,
} from "@/lib/dev/seeds/buildWp083AllBodyParagraphs";

/**
 * WP-083 — Seed all-required-body-paragraph vertical-slice fixtures (dev only).
 * Three distinct body plans, multi-evidence on sourceParagraphIndex 1, M6+M7 state
 * keyed by sourceParagraphIndex. Synthetic prose for acceptance — not product hardcoding.
 */
export async function seedAllRequiredBodyParagraphs(userEmail: string) {
  const prior = await seedModule5(userEmail);
  if (!prior.ok) return prior;

  const supabase = getSupabaseAdmin();
  const now = nowIso();
  const outline = buildWp083Module5Outline({ bodyCount: 3 });
  const movesBySourceIndex = buildWp083MovesBySourceIndex();
  const sections = buildWp083SectionsFromMoves(movesBySourceIndex, 3);
  const fullText = sections.join("\n\n");

  const { error: outlineError } = await supabase.from("student_outlines").upsert(
    {
      user_email: userEmail,
      module: 5,
      outline,
      finalized: true,
      updated_at: now,
    },
    { onConflict: "user_email,module" }
  );
  if (outlineError) {
    return { ok: false as const, error: outlineError.message };
  }

  await supabase
    .from("student_drafts")
    .delete()
    .eq("user_email", userEmail)
    .in("module", [6, 7]);

  const { error: m6Error } = await supabase.from("student_drafts").insert({
    user_email: userEmail,
    module: 6,
    sections,
    full_text: fullText,
    locked: false,
    draft_meta: {
      schemaVersion: 1,
      currentSectionIndex: 1,
      currentStageId: "section-1",
      sourceOutlineSignature: "",
      completedSectionIds: ["section-0"],
      outlineReviewRequired: false,
      outlineReviewAcknowledged: false,
      verticalSlice: {
        movesBySourceIndex,
      },
    },
    draft_revision: 1,
    updated_at: now,
  });
  if (m6Error) {
    return { ok: false as const, error: m6Error.message };
  }

  const revisionBySourceIndex: Record<
    string,
    {
      before: string;
      after: string;
      targetId: string | null;
      clearerConfirmed: boolean;
    }
  > = {};
  for (let i = 0; i < 3; i += 1) {
    revisionBySourceIndex[String(i)] = {
      before: sections[i + 1],
      after: sections[i + 1],
      targetId: null,
      clearerConfirmed: false,
    };
  }

  const { error: m7Error } = await supabase.from("student_drafts").insert({
    user_email: userEmail,
    module: 7,
    full_text: fullText,
    final_text: null,
    revised: false,
    final_ready: false,
    draft_meta: {
      currentStepIndex: 1,
      resume: { currentStepIndex: 1 },
      verticalSlice: {
        revisionBySourceIndex,
        movesBySourceIndex,
      },
    },
    updated_at: now,
  });
  if (m7Error) {
    return { ok: false as const, error: m7Error.message };
  }

  const progress = await setCurrentModule(userEmail, 6);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return { ok: true as const, currentModule: progress.module };
}
