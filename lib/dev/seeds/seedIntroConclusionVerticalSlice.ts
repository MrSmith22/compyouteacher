import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import { seedModule5 } from "@/lib/dev/seeds/seedModule5";
import {
  nowIso,
  SEED_BODY_1,
  SEED_BODY_2,
  SEED_THESIS,
} from "@/lib/dev/seeds/seedContent";
import { assembleIntroductionProse } from "@/lib/module6/introductionMoves";
import { assembleConclusionProse } from "@/lib/module6/conclusionMoves";
import {
  assertWp082Module5OutlineContract,
  buildWp082Module5Outline,
} from "@/lib/dev/seeds/buildWp082Module5Outline";

/**
 * WP-082 — Seed Introduction + Conclusion vertical-slice fixtures (dev only).
 * Synthetic prose for contract testing — not walkthrough-student hardcoding.
 * Section count matches Module 5 CP-F outline (intro + 2 body + conclusion).
 */
export async function seedIntroConclusionVerticalSlice(userEmail: string) {
  const prior = await seedModule5(userEmail);
  if (!prior.ok) return prior;

  const supabase = getSupabaseAdmin();
  const now = nowIso();

  const introMoves = {
    opening_context:
      "Civil rights leaders often had to decide how to speak to different audiences in the same struggle.",
    background_relationship:
      "King's letter to clergymen and his speech to a public crowd show two ways of building that hearing.",
    bridge_to_argument:
      "Those choices matter because each audience needed a different kind of trust before they would listen.",
    thesis_destination: SEED_THESIS,
  };
  const conclusionMoves = {
    return_to_thesis:
      "Across both texts, King adjusts how he earns trust so each audience can hear the call for justice.",
    synthesize_body:
      "The letter builds peer credibility while the speech stirs shared feeling—together they prove the same claim in different keys.",
    comparison_insight:
      "The comparison shows that persuasion is not one style; it is matching rhetorical work to the people who must act.",
    final_thought:
      "Readers who notice that match can better judge when an argument is shaped for them—and when it is not.",
  };

  const sections = [
    assembleIntroductionProse(introMoves),
    SEED_BODY_1,
    SEED_BODY_2,
    assembleConclusionProse(conclusionMoves),
  ];

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
    locked: true,
    draft_meta: {
      schemaVersion: 1,
      currentSectionIndex: 0,
      currentStageId: "section-0",
      sourceOutlineSignature: "",
      completedSectionIds: [],
      outlineReviewRequired: false,
      outlineReviewAcknowledged: false,
      verticalSlice: {
        movesBySectionType: {
          intro: {
            activeMoveId: "thesis_destination",
            advancedMode: false,
            advancedProse: "",
            moves: introMoves,
            moveOrder: [
              "opening_context",
              "background_relationship",
              "bridge_to_argument",
              "thesis_destination",
            ],
          },
          conclusion: {
            activeMoveId: "final_thought",
            advancedMode: false,
            advancedProse: "",
            moves: conclusionMoves,
            moveOrder: [
              "return_to_thesis",
              "synthesize_body",
              "comparison_insight",
              "final_thought",
            ],
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
      currentStepIndex: 0,
      resume: {
        kind: "module7",
        currentStepIndex: 0,
        sectionType: null,
        draftIndex: null,
      },
      verticalSlice: {
        revisionBySectionType: {
          intro: {
            before: sections[0],
            after: sections[0],
            targetId: null,
            clearerConfirmed: false,
          },
          conclusion: {
            before: sections[sections.length - 1],
            after: sections[sections.length - 1],
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

  // Rebuild Module 5 outline from seeded Module 4 plans (CP-F shape).
  const { data: bucketRow, error: bucketError } = await supabase
    .from("student_buckets")
    .select("buckets, flow_state")
    .eq("user_email", userEmail)
    .eq("module", 4)
    .maybeSingle();
  if (bucketError) {
    return { ok: false as const, error: bucketError.message };
  }

  const { data: tchartRows, error: tchartError } = await supabase
    .from("tchart_entries")
    .select("*")
    .eq("user_email", userEmail);
  if (tchartError) {
    return { ok: false as const, error: tchartError.message };
  }

  const outline = buildWp082Module5Outline({
    buckets: bucketRow?.buckets || [],
    wantThirdBucket: bucketRow?.flow_state?.wantThirdBucket ?? false,
    tchartRows: tchartRows || [],
    thesis: SEED_THESIS,
  });
  const contract = assertWp082Module5OutlineContract(outline);
  if (!contract.ok) {
    return {
      ok: false as const,
      error: `WP-082 Module 5 outline contract failed: ${contract.error}`,
    };
  }

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

  const progress = await setCurrentModule(userEmail, 7);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return { ok: true as const, currentModule: progress.module };
}
