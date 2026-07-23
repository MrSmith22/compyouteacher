/**
 * Browser session helpers for assignment progress (NextAuth ≠ Supabase Auth JWT).
 */

/**
 * @returns {Promise<{ ok: boolean, currentModule: number, reason?: string }>}
 */
export async function fetchSessionAssignmentProgress() {
  const res = await fetch("/api/assignments/progress", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return {
    ok: Boolean(data?.ok),
    currentModule:
      typeof data?.currentModule === "number" ? data.currentModule : 0,
    reason: typeof data?.reason === "string" ? data.reason : undefined,
  };
}

/**
 * @param {{ minModule: number }} args
 * @returns {Promise<{ ok: boolean }>}
 */
export async function requireSessionModuleAccess({ minModule }) {
  const progress = await fetchSessionAssignmentProgress();
  if (!progress.ok) return { ok: false };
  return { ok: progress.currentModule >= minModule };
}

/**
 * @param {{ completedModuleNumber: number }} args
 */
export async function advanceSessionModuleOnSuccess({
  completedModuleNumber,
}) {
  const res = await fetch("/api/assignments/progress", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completedModuleNumber }),
  });
  const data = await res.json().catch(() => ({}));
  return {
    ok: Boolean(data?.ok),
    reason: data?.reason,
    alreadyAdvanced: Boolean(data?.alreadyAdvanced),
    currentModule:
      typeof data?.currentModule === "number" ? data.currentModule : null,
    error: data?.error,
    attempts: data?.attempts,
  };
}
