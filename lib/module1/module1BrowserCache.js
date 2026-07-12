/**
 * Module 1 browser-cache helpers (client-safe).
 * Flow keys: welcome + Step 2 draft. Never wipe Module 2+ local drafts.
 */

export const MODULE_1_FLOW_KEY_SPECS = Object.freeze([
  Object.freeze(["module1", "welcome"]),
  Object.freeze(["module1", "step2"]),
]);

/**
 * @param {string} email
 * @param {readonly string[]} parts
 */
export function buildModule1FlowKey(email, parts) {
  return `wp:${String(email || "")}:${parts.join(":")}`;
}

export function getModule1WelcomeCacheKey(email) {
  return buildModule1FlowKey(email, ["module1", "welcome"]);
}

export function getModule1Step2CacheKey(email) {
  return buildModule1FlowKey(email, ["module1", "step2"]);
}

export function listModule1FlowCacheKeys(email) {
  return MODULE_1_FLOW_KEY_SPECS.map((parts) =>
    buildModule1FlowKey(email, parts)
  );
}

/**
 * Clear Module 1 flow keys (welcome + step2) from a Map store.
 * Preserves Module 2+ keys.
 * @param {Map<string, string>} store
 * @param {string} email
 */
export function clearModule1FlowCacheFromStore(store, email) {
  const keys = listModule1FlowCacheKeys(email);
  const removedKeys = [];
  for (const key of keys) {
    if (store.delete(key)) removedKeys.push(key);
  }
  return {
    removedKeys,
    preservedKeys: [...store.keys()],
    keysTargeted: keys,
  };
}

/**
 * Narrow: Step 2 draft only (e.g. after quiz submit).
 * @param {Map<string, string>} store
 * @param {string} email
 */
export function clearModule1Step2DraftFromStore(store, email) {
  const key = getModule1Step2CacheKey(email);
  const removed = store.delete(key);
  return { removed, key, preservedKeys: [...store.keys()] };
}

/**
 * Browser: clear welcome + Step 2. Prefer for Restart Module 1.
 * @param {string} email
 * @returns {number} keys removed
 */
export function clearModule1FlowCache(email) {
  if (typeof window === "undefined" || !window.localStorage || !email) {
    return 0;
  }
  let removed = 0;
  for (const key of listModule1FlowCacheKeys(email)) {
    if (window.localStorage.getItem(key) != null) {
      window.localStorage.removeItem(key);
      removed += 1;
    }
  }
  return removed;
}

/**
 * Browser: clear only Step 2 draft (quiz completion).
 * @param {string} email
 */
export function clearModule1Step2Draft(email) {
  if (typeof window === "undefined" || !window.localStorage || !email) {
    return false;
  }
  const key = getModule1Step2CacheKey(email);
  const had = window.localStorage.getItem(key) != null;
  window.localStorage.removeItem(key);
  return had;
}

/**
 * Full user-scoped wipe on a Map (models clearStudentCache for tests).
 * @param {Map<string, string>} store
 * @param {string} email
 */
export function clearAllUserScopedCacheFromStore(store, email) {
  const prefix = `wp:${email}:`;
  const removed = [];
  for (const k of [...store.keys()]) {
    if (k.startsWith(prefix) || k.startsWith("tchart_")) {
      store.delete(k);
      removed.push(k);
    }
  }
  return removed;
}
