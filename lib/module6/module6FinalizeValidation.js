/**
 * Server-side Module 6 finalize validation against canonical Module 5 outline.
 * Pure helpers live in module6DraftWriteValidation.js for Node test compatibility.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export {
  parseMandatoryExpectedRevision,
  parseStrictFinalizeDraftMeta,
  validateModule6FinalizeAgainstOutline,
  validateModule6FinalizeRequestBody,
  validateModule6OrdinaryWriteBody,
} from "./module6DraftWriteValidation.js";

export async function loadFinalizedModule5Outline(userEmail) {
  const res = await getSupabaseAdmin()
    .from("student_outlines")
    .select("outline, finalized")
    .eq("user_email", userEmail)
    .eq("module", 5)
    .maybeSingle();

  if (res.error) {
    return {
      ok: false,
      status: 500,
      error: res.error.message || "Failed to load Module 5 outline",
      code: "outline_read_failed",
    };
  }

  const row = res.data;
  if (!row?.outline) {
    return {
      ok: false,
      status: 422,
      error: "Module 5 outline is missing. Finalize your outline before drafting.",
      code: "outline_missing",
    };
  }

  if (row.finalized !== true) {
    return {
      ok: false,
      status: 422,
      error: "Module 5 outline is not finalized yet.",
      code: "outline_not_finalized",
    };
  }

  return {
    ok: true,
    outline: row.outline,
    finalized: true,
  };
}
