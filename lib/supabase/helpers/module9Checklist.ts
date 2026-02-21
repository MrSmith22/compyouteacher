const EXPECTED_ITEMS_LENGTH = 6;

function normalizeItems(items: unknown): boolean[] {
  if (!Array.isArray(items) || items.length !== EXPECTED_ITEMS_LENGTH) {
    return Array(EXPECTED_ITEMS_LENGTH).fill(false);
  }
  return items.slice(0, EXPECTED_ITEMS_LENGTH).map(Boolean);
}

/**
 * Fetch the Module 9 APA checklist via NextAuth-validated API.
 * Returns { data, error }. Session cookie is sent automatically.
 */
export async function getModule9Checklist(_opts?: { userEmail?: string }) {
  try {
    const res = await fetch("/api/module9/checklist", { credentials: "include" });
    if (res.status === 401) {
      return { data: null, error: { message: "Not signed in" } };
    }
    const json = await res.json();
    if (!res.ok) {
      const msg = typeof json?.error === "string" ? json.error : "Could not load checklist";
      return { data: null, error: { message: msg } };
    }
    if (json === null) {
      return { data: null, error: null };
    }
    const items = normalizeItems(json.items);
    return {
      data: {
        items,
        complete: !!json.complete,
        updated_at: json.updated_at ?? null,
      },
      error: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not load checklist";
    return { data: null, error: { message: msg } };
  }
}

/**
 * Upsert the Module 9 APA checklist via NextAuth-validated API.
 * Returns { data, error }. Session cookie is sent automatically.
 */
export async function upsertModule9Checklist({
  userEmail: _userEmail,
  items,
}: {
  userEmail: string;
  items: boolean[];
}) {
  const normalized = normalizeItems(items);
  try {
    const res = await fetch("/api/module9/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: normalized }),
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) {
      return { data: null, error: { message: "Not signed in" } };
    }
    if (res.status === 400) {
      const msg = typeof json?.error === "string" ? json.error : "Invalid items";
      return { data: null, error: { message: msg } };
    }
    if (!res.ok) {
      const msg = typeof json?.error === "string" ? json.error : "Could not save checklist";
      return { data: null, error: { message: msg } };
    }
    const itemsOut = normalizeItems(json.items);
    return {
      data: {
        items: itemsOut,
        complete: !!json.complete,
        updated_at: json.updated_at ?? null,
      },
      error: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not save checklist";
    return { data: null, error: { message: msg } };
  }
}
