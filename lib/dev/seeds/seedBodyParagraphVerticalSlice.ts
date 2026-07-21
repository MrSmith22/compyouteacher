import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import { seedModule5 } from "@/lib/dev/seeds/seedModule5";
import {
  nowIso,
  seedEssayFullText,
  seedEssaySections,
  SEED_THESIS,
} from "@/lib/dev/seeds/seedContent";
import { assembleBodyParagraphProse } from "@/lib/module6/bodyParagraphMoves";

/**
 * WP-081 — Seed Body Paragraph 1 vertical-slice fixtures (dev only).
 * Synthetic prose for contract testing — not walkthrough-student hardcoding in product logic.
 */
export async function seedBodyParagraphVerticalSlice(userEmail: string) {
  const prior = await seedModule5(userEmail);
  if (!prior.ok) return prior;

  const supabase = getSupabaseAdmin();
  const now = nowIso();
  const sections = seedEssaySections();

  const bp1Moves = {
    point:
      "King earns trust differently in each text so each audience will listen to the call for justice.",
    evidence_context:
      "In the letter, King opens by addressing the clergymen as colleagues.",
    evidence:
      'He writes, "My Dear Fellow Clergymen," treating critics as peers rather than enemies.',
    explanation:
      "That respectful opening builds ethos with a skeptical religious audience before he argues.",
    thesis_connection:
      "This supports the thesis that credibility work differs by audience even when the justice goal is shared.",
    transition:
      "Next, the essay turns to how the speech uses emotion for a public crowd.",
  };
  sections[1] = assembleBodyParagraphProse(bp1Moves);

  const fullText = sections.join("\n\n");

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
        movesBySourceIndex: {
          "0": {
            activeMoveId: "thesis_connection",
            advancedMode: false,
            moves: bp1Moves,
          },
        },
      },
    },
    draft_revision: 1,
    updated_at: now,
  });
  if (m6Error) {
    return { ok: false as const, error: m6Error.message };
  }

  const { error: m7Error } = await supabase.from("student_drafts").insert({
    user_email: userEmail,
    module: 7,
    full_text: fullText,
    final_text: null,
    revised: false,
    final_ready: false,
    draft_meta: {
      verticalSlice: {
        revisionBySourceIndex: {
          "0": {
            before: sections[1],
            after: sections[1],
            targetId: null,
            clearerConfirmed: false,
          },
        },
      },
    },
    updated_at: now,
  });
  if (m7Error) {
    return { ok: false as const, error: m7Error.message };
  }

  // Ensure outline body cards carry sourceParagraphIndex + moveOrder for BP1.
  const { data: outlineRow } = await supabase
    .from("student_outlines")
    .select("outline")
    .eq("user_email", userEmail)
    .eq("module", 5)
    .maybeSingle();

  if (outlineRow?.outline?.body?.length) {
    const body = outlineRow.outline.body.map(
      (card: Record<string, unknown>, index: number) => ({
        ...card,
        sourceParagraphIndex:
          typeof card.sourceParagraphIndex === "number"
            ? card.sourceParagraphIndex
            : index,
        moveOrder:
          Array.isArray(card.moveOrder) && card.moveOrder.length
            ? card.moveOrder
            : [
                "point",
                "evidence_context",
                "evidence",
                "explanation",
                "thesis_connection",
                ...(index < outlineRow.outline.body.length - 1
                  ? ["transition"]
                  : []),
              ],
      })
    );
    await supabase
      .from("student_outlines")
      .update({
        outline: {
          ...outlineRow.outline,
          thesis: outlineRow.outline.thesis || SEED_THESIS,
          body,
        },
        updated_at: now,
      })
      .eq("user_email", userEmail)
      .eq("module", 5);
  }

  const progress = await setCurrentModule(userEmail, 6);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return { ok: true as const, currentModule: progress.module };
}
