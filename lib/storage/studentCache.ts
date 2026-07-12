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
 * Module 1 Step 2 draft key.
 * Same as makeStudentKey(email, ["module1", "step2"]).
 */
export function getModule1Step2CacheKey(email: string): string {
  return makeStudentKey(email, ["module1", "step2"]);
}

/**
 * Module 1 assignment-welcome key.
 * Same as makeStudentKey(email, ["module1", "welcome"]).
 */
export function getModule1WelcomeCacheKey(email: string): string {
  return makeStudentKey(email, ["module1", "welcome"]);
}

/**
 * Clear Module 1 flow cache: welcome + Step 2 draft only.
 * Does not touch Module 2+ keys.
 * @returns number of keys removed
 */
export function clearModule1FlowCache(email: string): number {
  if (typeof window === "undefined" || !window.localStorage || !email) {
    return 0;
  }
  const keys = [
    getModule1WelcomeCacheKey(email),
    getModule1Step2CacheKey(email),
  ];
  let removed = 0;
  for (const key of keys) {
    if (window.localStorage.getItem(key) != null) {
      window.localStorage.removeItem(key);
      removed += 1;
    }
  }
  return removed;
}

/**
 * Remove only the Module 1 Step 2 draft (e.g. after quiz submit).
 * Does not clear the welcome orientation flag.
 * @returns true when a value was removed
 */
export function clearModule1Step2Draft(email: string): boolean {
  if (typeof window === "undefined" || !window.localStorage || !email) {
    return false;
  }
  const key = getModule1Step2CacheKey(email);
  const had = window.localStorage.getItem(key) != null;
  window.localStorage.removeItem(key);
  return had;
}

/**
 * Remove all localStorage keys starting with `wp:${email}:` and legacy unscoped
 * Module 2 T Chart keys starting with `tchart_`. Returns the count removed.
 * Safe to call in browser only; no-op if localStorage is unavailable.
 */
export function clearStudentCache(email: string): number {
  if (typeof window === "undefined" || !window.localStorage) return 0;
  const prefix = `${PREFIX}${email}:`;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k != null && (k.startsWith(prefix) || k.startsWith("tchart_"))) keys.push(k);
  }
  for (const k of keys) {
    window.localStorage.removeItem(k);
  }
  return keys.length;
}
