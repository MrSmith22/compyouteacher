// lib/logActivity.js
// Client side helper: logs activity by calling the server API route.
// Server derives user email from the session, so we do not send email from the client.
// Supports logActivity(eventType, meta) and logActivity(email, eventType, meta).

function getLogUrl() {
  if (typeof window !== "undefined") return "/api/activity/log";
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/activity/log`;
}

export async function logActivity(a1, a2 = {}, a3) {
  try {
    const hasEmail =
      typeof a1 === "string" && a1.includes("@") && typeof a2 === "string";

    const eventType = hasEmail ? a2 : a1;

    const rawMeta = hasEmail ? a3 : a2;
    const meta =
      rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta) ? rawMeta : {};

    if (!eventType || typeof eventType !== "string") return;

    // Do NOT create a variable named `module` (Next.js lint rule).
    const moduleNumber = typeof meta?.module === "number" ? meta.module : null;

    const payload = {
      eventType,
      module: moduleNumber, // payload field name can stay "module"
      meta,
    };

    const res = await fetch(getLogUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Best effort logging: do not block UI if logging fails
    if (!res.ok) {
      let details = "";
      try {
        const json = await res.json();
        details = json?.error ? ` ${json.error}` : "";
      } catch {}
      console.warn(`[logActivity] ${res.status}.${details}`);
    }
  } catch (err) {
    console.warn("[logActivity] failed", err);
  }
}