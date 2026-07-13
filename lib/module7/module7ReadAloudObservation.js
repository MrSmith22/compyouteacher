/**
 * WP-020 — Read Aloud observation (Listen → Notice → Name).
 * Instructional reflection never mutates student prose.
 */

export const MODULE7_REVISION_CYCLE = Object.freeze([
  "Listen",
  "Notice",
  "Name",
  "Change",
  "Compare",
]);

export const MODULE7_REVISION_CYCLE_LABEL =
  "Revision cycle: Listen → Notice → Name → Change → Compare";

export const MODULE7_READ_ALOUD_STAGE_LABEL =
  "On this step: Listen, Notice, and Name. Next: Change one section at a time.";

export const MODULE7_CHANGE_STAGE_LABEL = "NOW: CHANGE";
export const MODULE7_CHANGE_STAGE_HINT =
  "Use the strategy below to strengthen one place in this section.";

export const MODULE7_COMPARE_STAGE_LABEL = "NOW: COMPARE";
export const MODULE7_COMPARE_STAGE_HINT =
  "Read the revised essay as a whole. Is the place you strengthened clearer for a reader now?";

export const MODULE7_OBSERVATION_NOTE_MAX = 240;

export const MODULE7_OBSERVATION_CATEGORIES = Object.freeze([
  {
    id: "stumble",
    label: "I stumbled or lost my place.",
  },
  {
    id: "repetition",
    label: "An idea repeated without adding meaning.",
  },
  {
    id: "abrupt",
    label: "The writing jumped abruptly.",
  },
  {
    id: "explanation",
    label: "A reader may need more explanation.",
  },
  {
    id: "other",
    label: "Something else stood out.",
  },
]);

export const MODULE7_READ_ALOUD_GATE = Object.freeze({
  NEED_RECORDING: "Record and play back your essay before you keep going.",
  NEED_OBSERVATION:
    "Choose one thing you noticed so you know what to look for as you revise.",
});

export function emptyReadAloudObservation() {
  return { categoryId: "", note: "" };
}

export function isValidObservationCategory(categoryId) {
  return MODULE7_OBSERVATION_CATEGORIES.some((item) => item.id === categoryId);
}

export function normalizeObservationNote(note) {
  const text = typeof note === "string" ? note : "";
  return text.slice(0, MODULE7_OBSERVATION_NOTE_MAX);
}

/**
 * Keep Going on Read Aloud requires recording + named category.
 * Optional note is never required.
 */
export function evaluateReadAloudAdvanceGate({
  audioURL = null,
  observation = null,
} = {}) {
  if (!audioURL) {
    return {
      ok: false,
      reason: "need_recording",
      message: MODULE7_READ_ALOUD_GATE.NEED_RECORDING,
    };
  }
  const categoryId = observation?.categoryId || "";
  if (!isValidObservationCategory(categoryId)) {
    return {
      ok: false,
      reason: "need_observation",
      message: MODULE7_READ_ALOUD_GATE.NEED_OBSERVATION,
    };
  }
  return { ok: true, reason: "ready", message: "" };
}

/**
 * Explicit no-op: observation never rewrites prose sections.
 */
export function applyObservationWithoutMutatingProse(observation, sections) {
  void observation;
  return Array.isArray(sections) ? sections.map((s) => String(s ?? "")) : [];
}

export function observationTouchesProseFields(payload = {}) {
  const banned = ["full_text", "final_text", "sections"];
  return banned.some((key) =>
    Object.prototype.hasOwnProperty.call(payload || {}, key)
  );
}
