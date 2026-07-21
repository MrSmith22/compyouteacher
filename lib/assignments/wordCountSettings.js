/**
 * WP-084 — Teacher-owned word-count expectation (assignment settings).
 * Existing assignments default to mode "off" — never silently impose a requirement.
 */

/** Match lib/assignments/identity.ts — kept inline so Node tests can require this file. */
const DEFAULT_ASSIGNMENT_ID = "mlk-rhetorical-analysis";
const DEFAULT_ASSIGNMENT_NAME = "MLK Essay Assignment";

/** @typedef {"off"|"advisory_minimum"|"required_minimum"|"advisory_range"|"required_range"} WordCountMode */

export const WORD_COUNT_MODES = Object.freeze([
  "off",
  "advisory_minimum",
  "required_minimum",
  "advisory_range",
  "required_range",
]);

export const DEFAULT_WORD_COUNT_SETTINGS = Object.freeze({
  assignmentId: DEFAULT_ASSIGNMENT_ID,
  assignmentName: DEFAULT_ASSIGNMENT_NAME,
  mode: /** @type {WordCountMode} */ ("off"),
  minimum: null,
  maximum: null,
});

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isNonNegativeWholeNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    Math.floor(value) === value
  );
}

/**
 * Normalize raw settings. Does not throw — use validateWordCountSettings for writes.
 * @param {unknown} raw
 * @param {{ assignmentId?: string, assignmentName?: string }} [defaults]
 */
export function normalizeWordCountSettings(raw = {}, defaults = {}) {
  const assignmentId =
    typeof raw?.assignmentId === "string" && raw.assignmentId.trim()
      ? raw.assignmentId.trim()
      : defaults.assignmentId || DEFAULT_ASSIGNMENT_ID;
  const assignmentName =
    typeof raw?.assignmentName === "string" && raw.assignmentName.trim()
      ? raw.assignmentName.trim()
      : defaults.assignmentName || DEFAULT_ASSIGNMENT_NAME;
  const modeRaw = String(raw?.mode || "off").trim();
  const mode = WORD_COUNT_MODES.includes(modeRaw)
    ? /** @type {WordCountMode} */ (modeRaw)
    : "off";

  let minimum =
    raw?.minimum == null || raw?.minimum === ""
      ? null
      : Number(raw.minimum);
  let maximum =
    raw?.maximum == null || raw?.maximum === ""
      ? null
      : Number(raw.maximum);

  if (mode === "off") {
    minimum = null;
    maximum = null;
  } else if (mode === "advisory_minimum" || mode === "required_minimum") {
    maximum = null;
  }

  return {
    assignmentId,
    assignmentName,
    mode,
    minimum: isNonNegativeWholeNumber(minimum) ? minimum : null,
    maximum: isNonNegativeWholeNumber(maximum) ? maximum : null,
  };
}

/**
 * Server-side validation for teacher writes. Invalid config is rejected —
 * never presented as a student failure.
 * @param {unknown} raw
 * @returns {{ ok: true, settings: ReturnType<typeof normalizeWordCountSettings> } | { ok: false, error: string }}
 */
export function validateWordCountSettings(raw = {}) {
  const modeRaw = String(raw?.mode || "").trim();
  if (!WORD_COUNT_MODES.includes(modeRaw)) {
    return {
      ok: false,
      error: "Choose a valid word-count mode.",
    };
  }
  const mode = /** @type {WordCountMode} */ (modeRaw);

  if (mode === "off") {
    return {
      ok: true,
      settings: normalizeWordCountSettings({ ...raw, mode: "off" }),
    };
  }

  const minRaw = raw?.minimum;
  const maxRaw = raw?.maximum;
  const minimum =
    minRaw == null || minRaw === "" ? null : Number(minRaw);
  const maximum =
    maxRaw == null || maxRaw === "" ? null : Number(maxRaw);

  if (mode === "advisory_minimum" || mode === "required_minimum") {
    if (!isNonNegativeWholeNumber(minimum)) {
      return {
        ok: false,
        error: "Enter a whole-number minimum word count (0 or greater).",
      };
    }
    return {
      ok: true,
      settings: normalizeWordCountSettings({
        ...raw,
        mode,
        minimum,
        maximum: null,
      }),
    };
  }

  // range modes
  if (!isNonNegativeWholeNumber(minimum)) {
    return {
      ok: false,
      error: "Enter a whole-number minimum for the range.",
    };
  }
  if (!isNonNegativeWholeNumber(maximum)) {
    return {
      ok: false,
      error: "Enter a whole-number maximum for the range.",
    };
  }
  if (maximum < minimum) {
    return {
      ok: false,
      error: "Maximum must be greater than or equal to the minimum.",
    };
  }
  return {
    ok: true,
    settings: normalizeWordCountSettings({
      ...raw,
      mode,
      minimum,
      maximum,
    }),
  };
}

/**
 * Compare current count to teacher settings.
 * @param {number} currentCount
 * @param {ReturnType<typeof normalizeWordCountSettings>} settings
 */
export function evaluateWordCountStatus(currentCount, settings) {
  const count =
    typeof currentCount === "number" && Number.isFinite(currentCount)
      ? Math.max(0, Math.floor(currentCount))
      : 0;
  const cfg = normalizeWordCountSettings(settings);
  const mode = cfg.mode;

  if (mode === "off") {
    return {
      mode,
      current: count,
      minimum: null,
      maximum: null,
      status: "off",
      blocksCompletion: false,
      expectationLabel: null,
      coachingKind: null,
    };
  }

  const minimum = cfg.minimum;
  const maximum = cfg.maximum;
  const isRequired = mode === "required_minimum" || mode === "required_range";
  const isRange = mode === "advisory_range" || mode === "required_range";

  let status = "within";
  let coachingKind = null;
  if (typeof minimum === "number" && count < minimum) {
    status = "below";
    coachingKind = "develop";
  } else if (isRange && typeof maximum === "number" && count > maximum) {
    status = "above";
    coachingKind = "focus";
  }

  const requirementTag = isRequired
    ? "required for this assignment"
    : "advisory target for this assignment";
  const expectationLabel = isRange
    ? `${minimum}–${maximum} words (${requirementTag})`
    : `at least ${minimum} words (${requirementTag})`;

  const blocksCompletion =
    isRequired && (status === "below" || status === "above");

  return {
    mode,
    current: count,
    minimum,
    maximum,
    status,
    blocksCompletion,
    expectationLabel,
    coachingKind,
    isRequired,
    isAdvisory: !isRequired,
  };
}

/**
 * Student-facing one-line status (high-school language).
 * @param {ReturnType<typeof evaluateWordCountStatus>} evaluation
 */
export function formatWordCountStudentMessage(evaluation) {
  if (!evaluation || evaluation.mode === "off") {
    return "Your teacher did not set a word-count target for this assignment.";
  }
  const { current, minimum, maximum, status, isRequired, mode } = evaluation;
  const range =
    mode === "advisory_range" || mode === "required_range"
      ? `${minimum}–${maximum}`
      : String(minimum);
  if (status === "below") {
    return isRequired
      ? `Your essay is ${current} words. Your teacher requires at least ${minimum}. Develop an idea that needs more explanation—do not add filler.`
      : `Your essay is ${current} words. Your teacher’s advisory target is at least ${minimum}. Consider developing an idea that still needs explanation.`;
  }
  if (status === "above") {
    return isRequired
      ? `Your essay is ${current} words. Your teacher requires ${range}. Cut repeated or off-topic material where you can.`
      : `Your essay is ${current} words. Your teacher’s advisory range is ${range}. Consider cutting repeated or off-topic material.`;
  }
  return `Your essay is ${current} words — within your teacher’s expectation (${range}).`;
}
