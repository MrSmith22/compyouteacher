/**
 * Module 1 first-visit assignment welcome (CP-A cognitive-load extension).
 * Orientation only — server remains authority for durable prompt answers.
 */

export const ASSIGNMENT_WELCOME_VERSION = 1;

export const MODULE_1_WELCOME_CACHE_PARTS = Object.freeze(["module1", "welcome"]);

export const ASSIGNMENT_PROCESS_PREVIEW = Object.freeze([
  "Understand the assignment",
  "Study the two texts",
  "Notice a meaningful pattern",
  "Plan each paragraph",
  "Build the draft",
  "Revise and finish",
]);

export const ASSIGNMENT_WELCOME_COPY = Object.freeze({
  whereYouAre: "Module 1 · Assignment introduction",
  eyebrow: "Welcome to your writing process",
  welcomingLine: "You already have a path forward.",
  dominantHeading:
    "You are going to build this essay one small decision at a time.",
  introParagraphs: Object.freeze([
    "You will write a compare-and-contrast essay about how Dr. Martin Luther King Jr. uses rhetorical choices in a speech and a letter.",
    "You do not need to plan or write the whole essay now. This process will show you what to think about at each step and carry your decisions forward.",
  ]),
  /** Kept for tests/helpers; UI uses welcomingLine + path to avoid repeating the same promise. */
  promise:
    "Each decision will make the next one easier—so you never have to hold the whole essay in mind at once.",
  immediateTaskLabel: "Your only job next",
  immediateTask:
    "Figure out exactly what the assignment is asking you to do.",
  immediateSupport: "You are not writing the essay yet.",
  savingReassurance:
    "Your work is saved and carried into later steps, so you will not have to start over.",
  primaryActionStart: "Start with the assignment",
  primaryActionReturn: "Return to my question",
  teacherGuidance:
    "Feeling overwhelmed does not mean you cannot write. It usually means you are trying to hold too many decisions in mind at once. This process will help you focus on one decision at a time.",
  whereThisIsGoing:
    "Next, you will look at the assignment prompt and identify its main action.",
  reopenControlLabel: "How this writing process works",
  pathCurrentIndex: 0,
  destinationLabel: "Finished essay",
});

/** Prompt Question presentation framing (exact prompt text stays assignment-defined). */
export const PROMPT_ASSIGNMENT_CARD_COPY = Object.freeze({
  label: "Your teacher’s assignment",
  introduction:
    "This is the goal your teacher has given you. It may look complicated at first, but you are going to break it down one part at a time until you can state the question clearly in your own words.",
  teacherGuidance:
    "The prompt may look intimidating because it contains several requirements. You are going to separate those requirements and handle one at a time.",
});

/** Accurate post-prompt next-step copy (video is optional, not required). */
export const MODULE1_AFTER_PROMPT_COPY = Object.freeze({
  sidebarNext: "Next: learn key vocabulary one term at a time",
  guideNext:
    "After you finish breaking down the prompt, you will learn the key vocabulary one term at a time and then check your understanding.",
  saveContinueLabel: "Save and continue to vocabulary",
  saveContinueAria:
    "Save prompt breakdown and continue to vocabulary and quiz",
  needHelpVocabNote:
    "Words like ethos, pathos, and logos come next, one term at a time. For now, focus on the direction of the assignment.",
});

export const ASSIGNMENT_WELCOME_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1440],
  oneDominantQuestion: true,
  onePrimaryAction: true,
  processPreviewSteps: 6,
  noPromptControls: true,
  noFullAssignmentPrompt: true,
  noQuiz: true,
  noRequiredVideo: true,
  primaryActionMinHeightPx: 44,
  fullWidthPrimaryActionOnMobile: true,
  teacherGuidanceBelowOnNarrow: true,
  noHorizontalOverflow: true,
  requireAccessibleNames: true,
  visibleFocus: true,
  oneSemanticH1: true,
});

/**
 * Canonical welcome key — matches makeStudentKey(email, ["module1", "welcome"]).
 * @param {string} email
 */
export function getModule1WelcomeCacheKey(email) {
  return `wp:${String(email || "")}:module1:welcome`;
}

/**
 * Safely hydrate welcome cache. Malformed/missing → not completed.
 * @param {unknown} raw
 */
export function hydrateWelcomeRecord(raw) {
  if (raw == null || raw === "") {
    return {
      completed: false,
      version: null,
      completedAt: null,
      malformed: false,
    };
  }

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        completed: false,
        version: null,
        completedAt: null,
        malformed: true,
      };
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      completed: false,
      version: null,
      completedAt: null,
      malformed: true,
    };
  }

  const completed = parsed.completed === true;
  const version =
    typeof parsed.version === "number" ? parsed.version : null;
  const completedAt =
    typeof parsed.completedAt === "string" ? parsed.completedAt : null;

  return {
    completed,
    version,
    completedAt,
    malformed: false,
  };
}

export function buildWelcomeCompletionRecord(now = new Date()) {
  return {
    completed: true,
    version: ASSIGNMENT_WELCOME_VERSION,
    completedAt: now.toISOString(),
  };
}

/**
 * Any non-empty durable prompt field counts as prompt progress.
 * @param {Record<string, string> | null | undefined} answers
 */
export function hasAnyPromptProgress(answers) {
  if (!answers || typeof answers !== "object") return false;
  return Object.values(answers).some(
    (v) => String(v || "").trim().length > 0
  );
}

/**
 * Decide whether the first-visit welcome should appear.
 *
 * @param {{
 *   welcomeRecord?: ReturnType<typeof hydrateWelcomeRecord>,
 *   promptAnswers?: Record<string, string>,
 *   promptComplete?: boolean,
 * }} input
 * @returns {{
 *   showWelcome: boolean,
 *   reason: string,
 *   resumePrompt: boolean,
 * }}
 */
export function resolveAssignmentWelcomeDisplay(input = {}) {
  const record =
    input.welcomeRecord &&
    typeof input.welcomeRecord === "object" &&
    "completed" in input.welcomeRecord
      ? {
          completed: Boolean(input.welcomeRecord.completed),
          version: input.welcomeRecord.version ?? null,
          completedAt: input.welcomeRecord.completedAt ?? null,
          malformed: Boolean(input.welcomeRecord.malformed),
        }
      : hydrateWelcomeRecord(input.welcomeRaw ?? null);

  const answers = input.promptAnswers || {};
  const hasProgress = hasAnyPromptProgress(answers);
  const promptComplete = Boolean(
    input.promptComplete ?? input.isPromptComplete
  );

  // Durable prompt work wins — never interrupt with welcome
  if (hasProgress || promptComplete) {
    return {
      showWelcome: false,
      reason: promptComplete
        ? "completed_prompt_preserves_resume"
        : "partial_prompt_bypasses_welcome",
      resumePrompt: true,
    };
  }

  if (record.completed) {
    return {
      showWelcome: false,
      reason: "welcome_completed_show_question_1",
      resumePrompt: true,
    };
  }

  // Malformed with no prompt evidence → safe first-visit welcome
  if (record.malformed) {
    return {
      showWelcome: true,
      reason: "malformed_welcome_fallback_show",
      resumePrompt: false,
    };
  }

  return {
    showWelcome: true,
    reason: "brand_new_show_welcome",
    resumePrompt: false,
  };
}

/**
 * Presentation model for welcome / reopen reference.
 * @param {{ mode?: "first_visit"|"reference", returnStepIndex?: number }} opts
 */
export function getAssignmentWelcomePresentation(opts = {}) {
  const mode = opts.mode === "reference" ? "reference" : "first_visit";
  const copy = ASSIGNMENT_WELCOME_COPY;
  return {
    mode,
    whereYouAre: copy.whereYouAre,
    eyebrow: copy.eyebrow,
    welcomingLine: copy.welcomingLine,
    dominantHeading: copy.dominantHeading,
    dominantQuestion: copy.dominantHeading,
    introParagraphs: [...copy.introParagraphs],
    promise: copy.promise,
    processPreview: [...ASSIGNMENT_PROCESS_PREVIEW],
    pathCurrentIndex: copy.pathCurrentIndex,
    destinationLabel: copy.destinationLabel,
    immediateTaskLabel: copy.immediateTaskLabel,
    immediateTask: copy.immediateTask,
    immediateSupport: copy.immediateSupport,
    savingReassurance: copy.savingReassurance,
    primaryActionLabel:
      mode === "reference"
        ? copy.primaryActionReturn
        : copy.primaryActionStart,
    teacherGuidance: copy.teacherGuidance,
    whereThisIsGoing: copy.whereThisIsGoing,
    reopenControlLabel: copy.reopenControlLabel,
    returnStepIndex:
      typeof opts.returnStepIndex === "number" ? opts.returnStepIndex : null,
    showPromptControls: false,
    showFullAssignmentPrompt: false,
    showQuiz: false,
    showVocabulary: false,
    showOptionalVideo: false,
    showCompletionPercent: false,
    writingPathVisual: true,
    layout: ASSIGNMENT_WELCOME_LAYOUT_CONTRACT,
  };
}

/**
 * Count near-identical “one … decision at a time” promises in welcome presentation copy.
 * Used to keep the screen vivid without repeating the same reassurance.
 */
export function countOneDecisionAtATimePhrases(presentation) {
  const blobs = [
    presentation?.dominantHeading,
    presentation?.welcomingLine,
    presentation?.promise,
    ...(presentation?.introParagraphs || []),
  ]
    .filter(Boolean)
    .join(" \n ");
  const matches = blobs.match(/one (small )?decision at a time/gi) || [];
  return matches.length;
}

/**
 * Completing welcome must not mutate prompt answers.
 */
export function applyWelcomeCompletion({ answers, welcomeCompleted }) {
  return {
    answers: { ...(answers || {}) },
    welcomeCompleted: Boolean(welcomeCompleted),
    answersUnchanged: true,
  };
}
