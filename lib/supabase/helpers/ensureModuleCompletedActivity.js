/**
 * Idempotent Module completion activity for success/receipt surfaces.
 * Refresh and direct navigation must not duplicate module_completed rows.
 */

/**
 * @param {{
 *   supabase: { from: Function },
 *   userEmail: string,
 *   moduleNumber: number,
 *   metadata?: Record<string, unknown> | null,
 * }} args
 * @returns {Promise<{ ok: true, alreadyLogged: boolean, id?: string } | { ok: false, error: string }>}
 */
export async function ensureModuleCompletedActivity({
  supabase,
  userEmail,
  moduleNumber,
  metadata = null,
}) {
  if (!userEmail || typeof moduleNumber !== "number") {
    return { ok: false, error: "missing_user_or_module" };
  }

  const existing = await supabase
    .from("student_activity_log")
    .select("id")
    .eq("user_email", userEmail)
    .eq("action", "module_completed")
    .eq("module", moduleNumber)
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    return { ok: false, error: existing.error.message };
  }

  if (existing.data?.id) {
    return { ok: true, alreadyLogged: true, id: existing.data.id };
  }

  const insert = await supabase.from("student_activity_log").insert({
    user_email: userEmail,
    action: "module_completed",
    module: moduleNumber,
    metadata,
  }).select("id").maybeSingle();

  if (insert.error) {
    // Race: another refresh may have inserted first — treat as already logged.
    const raced = await supabase
      .from("student_activity_log")
      .select("id")
      .eq("user_email", userEmail)
      .eq("action", "module_completed")
      .eq("module", moduleNumber)
      .limit(1)
      .maybeSingle();
    if (raced.data?.id) {
      return { ok: true, alreadyLogged: true, id: raced.data.id };
    }
    return { ok: false, error: insert.error.message };
  }

  return { ok: true, alreadyLogged: false, id: insert.data?.id };
}
