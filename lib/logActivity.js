// lib/logActivity.js
// Client side helper: logs activity by calling the server API route.
// Server derives user email from the session, so we do not send email from the client.
// Supports logActivity(eventType, meta) and logActivity(email, eventType, meta).

export async function logActivity(a1, a2 = {}, a3) {
  try {
    const hasEmail = typeof a1 === "string" && a1.includes("@") && typeof a2 === "string";
    const eventType = hasEmail ? a2 : a1;
    const meta = (hasEmail ? a3 : a2) && typeof (hasEmail ? a3 : a2) === "object" ? (hasEmail ? a3 : a2) : {};

    if (!eventType || typeof eventType !== "string") return;

    const module =
      typeof meta?.module === "number"
        ? meta.module
        : null;

    const payload = {
      eventType,
      module,
      meta,
    };

    const res = await fetch("/api/activity/log", {
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