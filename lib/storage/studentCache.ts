const PREFIX = "wp:";

/**
 * Build a user-scoped localStorage key.
 * @param email - Signed-in user email
 * @param parts - Key segments joined with ":"
 * @returns `wp:${email}:${parts.join(":")}`
 */
export function makeStudentKey(email: string, parts: string[]): string {
  return `${PREFIX}${email}:${parts.join(":")}`;
}

/**
 * Remove all localStorage keys starting with `wp:${email}:` and return the count removed.
 * Safe to call in browser only; no-op if localStorage is unavailable.
 */
export function clearStudentCache(email: string): number {
  if (typeof window === "undefined" || !window.localStorage) return 0;
  const prefix = `${PREFIX}${email}:`;
  let count = 0;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k != null && k.startsWith(prefix)) keys.push(k);
  }
  for (const k of keys) {
    window.localStorage.removeItem(k);
    count++;
  }
  return count;
}
