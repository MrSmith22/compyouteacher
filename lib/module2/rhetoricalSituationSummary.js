/**
 * Rhetorical-situation summary artifact (CP-B).
 * Versioned Speech/Letter audience + purpose conclusions for later matrix context.
 */

import { MLK_RHETORICAL_SITUATIONS } from "../assignments/rhetoricalSituations.js";

export const SITUATION_SUMMARY_SCHEMA_VERSION = 1;

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function situationSlice(key) {
  const s = MLK_RHETORICAL_SITUATIONS?.[key] || {};
  return {
    form: safeText(s.form),
    immediateAudience: safeText(s.immediateAudience),
    broaderAudience: safeText(s.broaderAudience),
    audienceSituation: safeText(s.audienceSituation),
    purposes: Array.isArray(s.purposes) ? s.purposes.map(safeText).filter(Boolean) : [],
    compactAudience: safeText(s.compactCue?.audience),
    compactPurpose: safeText(s.compactCue?.purpose),
  };
}

/**
 * Build a reusable summary from lesson answers + curriculum situations.
 * Student answers are recorded for provenance; audience/purpose text comes from
 * the student-facing situation conclusions (compact cues + structured facts).
 *
 * @param {{ answers?: Record<string, string>, completedAt?: string | null }} input
 */
export function buildRhetoricalSituationSummary(input = {}) {
  const answers =
    input.answers && typeof input.answers === "object" ? input.answers : {};
  const speech = situationSlice("speech");
  const letter = situationSlice("letter");

  return {
    schemaVersion: SITUATION_SUMMARY_SCHEMA_VERSION,
    completedAt: input.completedAt || new Date().toISOString(),
    speech: {
      audience: speech.compactAudience || speech.immediateAudience,
      purpose: speech.compactPurpose || (speech.purposes[0] || ""),
      immediateAudience: speech.immediateAudience,
      broaderAudience: speech.broaderAudience,
      audienceSituation: speech.audienceSituation,
      purposes: speech.purposes,
      form: speech.form,
    },
    letter: {
      audience: letter.compactAudience || letter.immediateAudience,
      purpose: letter.compactPurpose || (letter.purposes[0] || ""),
      immediateAudience: letter.immediateAudience,
      broaderAudience: letter.broaderAudience,
      audienceSituation: letter.audienceSituation,
      purposes: letter.purposes,
      form: letter.form,
    },
    studentAnswers: {
      q1: safeText(answers.q1),
      q2: safeText(answers.q2),
      q3: safeText(answers.q3),
      q4: safeText(answers.q4),
      q5: safeText(answers.q5),
    },
  };
}

/**
 * Safe read — malformed/partial/legacy → null (caller uses fallback).
 * @param {unknown} raw
 */
export function readRhetoricalSituationSummary(raw) {
  if (!raw || typeof raw !== "object") return null;
  try {
    const speech = raw.speech && typeof raw.speech === "object" ? raw.speech : null;
    const letter = raw.letter && typeof raw.letter === "object" ? raw.letter : null;
    if (!speech && !letter) return null;
    return {
      schemaVersion: Number(raw.schemaVersion) || SITUATION_SUMMARY_SCHEMA_VERSION,
      completedAt: raw.completedAt || null,
      speech: {
        audience: safeText(speech?.audience),
        purpose: safeText(speech?.purpose),
        immediateAudience: safeText(speech?.immediateAudience),
        broaderAudience: safeText(speech?.broaderAudience),
        audienceSituation: safeText(speech?.audienceSituation),
        purposes: Array.isArray(speech?.purposes)
          ? speech.purposes.map(safeText).filter(Boolean)
          : [],
        form: safeText(speech?.form),
      },
      letter: {
        audience: safeText(letter?.audience),
        purpose: safeText(letter?.purpose),
        immediateAudience: safeText(letter?.immediateAudience),
        broaderAudience: safeText(letter?.broaderAudience),
        audienceSituation: safeText(letter?.audienceSituation),
        purposes: Array.isArray(letter?.purposes)
          ? letter.purposes.map(safeText).filter(Boolean)
          : [],
        form: safeText(letter?.form),
      },
      studentAnswers:
        raw.studentAnswers && typeof raw.studentAnswers === "object"
          ? raw.studentAnswers
          : {},
    };
  } catch {
    return null;
  }
}

/**
 * Legacy students without a summary continue via curriculum fallback.
 */
export function getSituationSummaryOrFallback(raw) {
  const stored = readRhetoricalSituationSummary(raw);
  if (stored) return { summary: stored, fromLegacyFallback: false };
  return {
    summary: buildRhetoricalSituationSummary({ answers: {} }),
    fromLegacyFallback: true,
  };
}

/** Editing summary must not rewrite claims/patterns/theses — documented contract. */
export const SITUATION_SUMMARY_DOES_NOT_REWRITE_DOWNSTREAM = true;
