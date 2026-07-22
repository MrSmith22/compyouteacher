/**
 * WP-092 — Compact seed for guided APA protocol states (development only).
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setModule9Shortcut } from "@/lib/dev/devPanelServer";
import { seedCompleteEssay } from "@/lib/dev/seeds/seedCompleteEssay";
import { seedModule9Ready } from "@/lib/dev/seeds/seedModule9Ready";
import { upsertModule9GuidedApaProtocolState } from "@/lib/supabase/helpers/module9GuidedApaProtocol";
import {
  createEmptyGuidedApaProtocolState,
  setGuidedApaMoveStatus,
  attachLegacyGuidedApaHistory,
} from "@/lib/module9/guidedApaProtocolState";

export const WP092_SEED_VARIANTS = Object.freeze([
  "module8DocReady",
  "midMoveNeedsHelp",
  "readyForPdf",
  "legacyChecklistHistory",
]);

/**
 * @param {string} userEmail
 * @param {{ variant?: string }} [options]
 */
export async function seedGuidedApaProtocol(
  userEmail: string,
  options: { variant?: string } = {}
) {
  const email = String(userEmail || "").trim().toLowerCase();
  if (!email) throw new Error("seedGuidedApaProtocol requires userEmail");

  const variant = options.variant || "module8DocReady";
  // Essay + Module 8 progress + Google Doc, without a final PDF so the guided
  // path can exercise moves / PDF steps (already-submitted short-circuits).
  const prior = await seedModule9Ready(email, {
    googleDoc: true,
    checklist: false,
    quiz: false,
    pdf: false,
    moduleComplete: false,
  });
  if (!prior.ok) return prior;

  // Ensure no durable receipt remains from earlier panel work.
  await setModule9Shortcut(email, "pdf", false);
  const supabase = getSupabaseAdmin();
  await supabase
    .from("student_exports")
    .delete()
    .eq("user_email", email)
    .eq("module", 9)
    .eq("kind", "final_pdf");

  let state = createEmptyGuidedApaProtocolState();

  if (variant === "midMoveNeedsHelp") {
    state = setGuidedApaMoveStatus(state, "page_setup", "looks_correct");
    state = setGuidedApaMoveStatus(state, "title_page", "needs_help", {
      helpCode: "student_requested_fix",
    });
  } else if (variant === "readyForPdf") {
    for (const id of [
      "page_setup",
      "title_page",
      "page_numbers",
      "body_layout",
      "in_text_citations",
      "references_page",
      "paper_order",
      "doc_inspection",
    ]) {
      state = setGuidedApaMoveStatus(state, id, "looks_correct");
    }
  } else if (variant === "legacyChecklistHistory") {
    state = attachLegacyGuidedApaHistory(state, {
      module9Items: [true, true, false, false, false, false],
      module9Quiz: { score: 5, total: 7, submitted_at: new Date().toISOString() },
    });
  }

  const saved = await upsertModule9GuidedApaProtocolState(email, state);
  return {
    ok: true,
    variant,
    schemaOk: saved.schemaOk !== false,
    state: saved.ok ? saved.state : state,
    warning: saved.ok ? null : saved.error,
    artifacts: prior.artifacts,
  };
}
