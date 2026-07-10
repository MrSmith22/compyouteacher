/** Routes for persisted Module 2 working copies. */
export const SAVED_SOURCE_PATHS = {
  speech: "/texts/speech",
  letter: "/texts/letter",
};

/** Stable window names so reopen focuses an existing tab instead of duplicating. */
export const SAVED_SOURCE_WINDOW_NAMES = {
  speech: "wp-saved-speech",
  letter: "wp-saved-letter",
};

/**
 * Open (or focus) a saved source working copy in a named tab.
 * Returns the Window reference when the browser allows it (may be null with popup blockers).
 */
export function openSavedSourceText(kind) {
  const href = SAVED_SOURCE_PATHS[kind];
  const name = SAVED_SOURCE_WINDOW_NAMES[kind];
  if (!href || !name || typeof window === "undefined") return null;
  return window.open(href, name);
}

/**
 * Open (or focus) the saved speech and/or letter working copies.
 * Does not touch Module 3 analysis state — navigation only.
 */
export function openSavedSourceTexts({ speech = true, letter = true } = {}) {
  const opened = { speech: null, letter: null };
  if (speech) opened.speech = openSavedSourceText("speech");
  if (letter) opened.letter = openSavedSourceText("letter");
  return opened;
}

export function isSourceWindowOpen(win) {
  return Boolean(win && typeof win.closed === "boolean" && !win.closed);
}
