/**
 * Module 1 prompt-breakdown sequencing helpers (CP-A).
 * Persistence payload shape stays the five existing fields.
 */

export const PARAPHRASE_MIN_LENGTH = 25;

export const PROMPT_STEP_KEYS = Object.freeze([
  "task_verb",
  "task_type",
  "analysis_focus",
  "required_angle",
  "student_paraphrase",
]);

export const PROMPT_STEP_COUNT = PROMPT_STEP_KEYS.length;

export const PROMPT_MC = Object.freeze({
  task_verb: {
    label: "What are the main action word(s) in this assignment?",
    help: "This tells you the main verb of the essay task.",
    choices: ["Summarize", "Persuade", "Compare and contrast", "Describe"],
    correct: "Compare and contrast",
    emptyNudge: "Pick the main action word(s) the assignment asks you to do.",
    wrongNudge:
      "This assignment is compare and contrast. Your action word(s) should reflect that.",
  },
  task_type: {
    label: "What are you producing?",
    help: "This tells you what kind of writing you must create.",
    choices: [
      "A poem",
      "A compare and contrast essay",
      "A speech",
      "A book report",
    ],
    correct: "A compare and contrast essay",
    emptyNudge: "Name what you are producing. Example: compare and contrast essay.",
    wrongNudge: "You are writing an essay, not just answers or a summary.",
  },
  analysis_focus: {
    label: "What are you comparing?",
    help: "This tells you which ideas or texts the essay must analyze.",
    choices: [
      "Martin Luther King Jr. and Malcolm X",
      "Two historical events",
      "How Dr. King uses rhetorical appeals in two texts",
      "The civil rights movement and World War II",
    ],
    correct: "How Dr. King uses rhetorical appeals in two texts",
    emptyNudge:
      "What are you comparing? Think: King’s rhetoric in the speech and the letter.",
    wrongNudge: "Include both texts: the speech and the letter.",
  },
  required_angle: {
    label: "What evidence should you use?",
    help: "This tells you what support your essay must include.",
    choices: [
      "Personal opinions only",
      "Information from social media",
      "Specific evidence from both works",
      "Information from any source you choose",
    ],
    correct: "Specific evidence from both works",
    emptyNudge: "What evidence should you use? Read the assignment carefully.",
    wrongNudge: "Your essay must use specific evidence from both King texts.",
  },
});

export const PARAPHRASE_STEP = Object.freeze({
  label: "In your own words, what is this essay asking you to do?",
  help: "Putting the prompt in your own words checks that you understand the task before you start analyzing.",
  emptyNudge: "Write the assignment in your own words in one or two sentences.",
  shortNudge: `Add a little more detail (at least ${PARAPHRASE_MIN_LENGTH} characters).`,
});

/** @param {string} field @param {string} value */
export function nudge(field, value) {
  const mc = PROMPT_MC[field];
  if (mc) {
    const v = (value || "").trim();
    if (!v) return mc.emptyNudge;
    if (v === mc.correct) return null;
    if (field === "task_verb" && (v.includes("compare") || v.includes("contrast"))) {
      return null;
    }
    if (field === "task_type" && v.toLowerCase().includes("essay")) return null;
    if (
      field === "analysis_focus" &&
      v.toLowerCase().includes("speech") &&
      v.toLowerCase().includes("letter")
    ) {
      return null;
    }
    return mc.wrongNudge;
  }

  if (field === "student_paraphrase") {
    const trimmed = (value || "").trim();
    if (!trimmed) return PARAPHRASE_STEP.emptyNudge;
    if (trimmed.length < PARAPHRASE_MIN_LENGTH) return PARAPHRASE_STEP.shortNudge;
    return null;
  }

  return null;
}

/** @param {Record<string, string>} answers */
export function getAnswerForStep(answers, stepKey) {
  return String(answers?.[stepKey] ?? "");
}

/** @param {Record<string, string>} answers @param {number} stepIndex */
export function canAdvanceFromStep(answers, stepIndex) {
  const key = PROMPT_STEP_KEYS[stepIndex];
  if (!key) return false;
  return nudge(key, getAnswerForStep(answers, key)) === null;
}

/** @param {Record<string, string>} answers */
export function isPromptBreakdownComplete(answers) {
  return PROMPT_STEP_KEYS.every(
    (key) => nudge(key, getAnswerForStep(answers, key)) === null
  );
}

/**
 * Resume at first incomplete step; if all complete, stay on last (paraphrase).
 * @param {Record<string, string>} answers
 */
export function getResumeStepIndex(answers) {
  for (let i = 0; i < PROMPT_STEP_KEYS.length; i += 1) {
    if (!canAdvanceFromStep(answers, i)) return i;
  }
  return PROMPT_STEP_KEYS.length - 1;
}

/** @param {number} stepIndex @param {"back"|"next"} direction */
export function advancePromptStep(stepIndex, direction) {
  const max = PROMPT_STEP_KEYS.length - 1;
  const current = Math.max(0, Math.min(max, Number(stepIndex) || 0));
  if (direction === "back") return Math.max(0, current - 1);
  if (direction === "next") return Math.min(max, current + 1);
  return current;
}

/**
 * Canonical persistence payload — must stay compatible with module1_prompt_breakdown.
 * @param {Record<string, string>} answers
 */
export function buildPromptPersistencePayload(answers) {
  return {
    task_verb: String(answers?.task_verb ?? ""),
    task_type: String(answers?.task_type ?? ""),
    analysis_focus: String(answers?.analysis_focus ?? ""),
    required_angle: String(answers?.required_angle ?? ""),
    student_paraphrase: String(answers?.student_paraphrase ?? ""),
  };
}

/**
 * Hydrate answers from API/DB without wiping completed fields.
 * @param {unknown} saved
 */
export function hydratePromptAnswers(saved) {
  const row = saved && typeof saved === "object" ? saved : {};
  return buildPromptPersistencePayload(row);
}

/** Layout / a11y contracts for sequenced prompt UI. */
export const PROMPT_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1440],
  oneDominantQuestion: true,
  fullPromptVisible: true,
  progressShowsCurrentOnly: true,
  primaryActionMinHeightPx: 44,
  noHorizontalOverflow: true,
});

export function getPromptStepStatusLabel(stepIndex) {
  const step = Math.max(0, Math.min(PROMPT_STEP_COUNT - 1, stepIndex));
  return `Question ${step + 1} of ${PROMPT_STEP_COUNT}`;
}
