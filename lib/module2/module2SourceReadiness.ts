import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** API response shape and/or raw `module2_sources` row. */
export type Module2SourcesLike = {
  speech_full_text?: string | null;
  letter_full_text?: string | null;
  mlk_text?: string | null;
  lfbj_text?: string | null;
};

export const SPEECH_MIN_LENGTH = 500;
export const LETTER_MIN_LENGTH = 1000;

export const SPEECH_PHRASES = [
  "five score years ago",
  "i have a dream",
  "let freedom ring",
  "free at last! free at last!",
] as const;

export const LETTER_PHRASES = [
  "my dear fellow clergymen",
  "injustice anywhere is a threat to justice everywhere",
  "justice too long delayed is justice denied",
  "wait has almost always meant never",
] as const;

export function getPersistedSpeechText(
  sources: Module2SourcesLike | null | undefined
): string {
  const raw = sources?.speech_full_text ?? sources?.mlk_text ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

export function getPersistedLetterText(
  sources: Module2SourcesLike | null | undefined
): string {
  const raw = sources?.letter_full_text ?? sources?.lfbj_text ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

export function hasPersistedSpeech(
  sources: Module2SourcesLike | null | undefined
): boolean {
  return getPersistedSpeechText(sources).length > 0;
}

export function hasPersistedLetter(
  sources: Module2SourcesLike | null | undefined
): boolean {
  return getPersistedLetterText(sources).length > 0;
}

/** Both working-copy source texts exist in persisted storage. */
export function isModule2SourcePreparationComplete(
  sources: Module2SourcesLike | null | undefined
): boolean {
  return hasPersistedSpeech(sources) && hasPersistedLetter(sources);
}

export function evaluatePersistedSpeech(
  sources: Module2SourcesLike | null | undefined
) {
  const text = getPersistedSpeechText(sources).toLowerCase();
  const allPhrasesFound = SPEECH_PHRASES.every((phrase) => text.includes(phrase));
  return {
    lengthOk: text.length >= SPEECH_MIN_LENGTH,
    allPhrasesFound,
    complete: text.length >= SPEECH_MIN_LENGTH && allPhrasesFound,
  };
}

export function evaluatePersistedLetter(
  sources: Module2SourcesLike | null | undefined
) {
  const text = getPersistedLetterText(sources).toLowerCase();
  const phraseCount = LETTER_PHRASES.filter((phrase) => text.includes(phrase)).length;
  const allPhrasesFound = phraseCount >= 2;
  return {
    lengthOk: text.length >= LETTER_MIN_LENGTH,
    allPhrasesFound,
    complete: text.length >= LETTER_MIN_LENGTH && allPhrasesFound,
  };
}

/** Client-side fetch of persisted sources via the existing API. */
export async function fetchModule2SourcesFromApi(): Promise<Module2SourcesLike | null> {
  const res = await fetch("/api/module2/sources");
  if (!res.ok) return null;
  return res.json();
}

/** Server-side check against `module2_sources`. */
export async function isModule2SourcePreparationCompleteForUser(
  userEmail: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("module2_sources")
    .select("mlk_text, lfbj_text")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (error) return false;
  return isModule2SourcePreparationComplete(data);
}

/** Module 2 subroutes that are part of source prep (not gated). */
export function isModule2SourcePrepPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === "/modules/2" ||
    pathname === "/modules/2/source" ||
    pathname === "/modules/2/letter"
  );
}

/** Module 2 analysis-phase routes that require both saved texts. */
export function isModule2AnalysisPhasePath(pathname: string | null | undefined): boolean {
  if (!pathname?.startsWith("/modules/2")) return false;
  return !isModule2SourcePrepPath(pathname);
}
