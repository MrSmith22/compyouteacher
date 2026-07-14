/**
 * WP-063 — Planning-support fade schedule (Modules 5–7).
 *
 * Architectural rule: planning representation ≠ writing representation.
 * Useful desk support (thesis, claim, evidence, reasoning) is separate from
 * leaked outline chrome (Roman numerals, bucket titles as essay headings,
 * planning metadata concatenated into prose).
 *
 * Assembly stays prose-only via deriveModule6FullText / joinSections /
 * getEssayProseBlocks / EssayProseView (WP-001). Writing labels use
 * getWritingSectionLabel (WP-065/066). Working-set chrome must match.
 */

export const WP063_FADE_MODULES = Object.freeze([5, 6, 7]);

export const WP063_REPRESENTATION = Object.freeze({
  PLANNING: "planning",
  WRITING: "writing",
  REFERENCE_SUPPORT: "reference_support",
});

/**
 * @typedef {object} FadeSurfaceRow
 * @property {string} id
 * @property {number} module
 * @property {string} surface
 * @property {"planning"|"writing"|"reference_support"} representation
 * @property {boolean} planningLabelsAllowed
 * @property {boolean} studentProseShown
 * @property {string} textSource
 * @property {boolean} compliant
 * @property {string|null} leak
 * @property {string} remedy
 * @property {boolean} [repaired]
 */

/** @type {ReadonlyArray<FadeSurfaceRow>} */
export const WP063_FADE_MATRIX = Object.freeze([
  Object.freeze({
    id: "m5-outline-order",
    module: 5,
    surface: "Outline ordering / paragraph-plan identity",
    representation: WP063_REPRESENTATION.PLANNING,
    planningLabelsAllowed: true,
    studentProseShown: false,
    textSource: "ModuleFive outline stages; paragraph-plan cards",
    compliant: true,
    leak: null,
    remedy: "Retain planning language intentionally",
  }),
  Object.freeze({
    id: "m5-claims-buckets",
    module: 5,
    surface: "Claims/buckets and supporting points",
    representation: WP063_REPRESENTATION.PLANNING,
    planningLabelsAllowed: true,
    studentProseShown: false,
    textSource: "Module 5 success / bring-in / review maps",
    compliant: true,
    leak: null,
    remedy: "Do not weaken Module 5 for later-module cleanliness",
  }),
  Object.freeze({
    id: "m6-step-construction",
    module: 6,
    surface: "buildDraftSectionSteps (internal mapping)",
    representation: WP063_REPRESENTATION.PLANNING,
    planningLabelsAllowed: true,
    studentProseShown: false,
    textSource:
      "step.roman / step.title / step.job / bodyIndex — shelves & mapping only",
    compliant: true,
    leak: null,
    remedy: "Keep metadata off writing chrome and out of full_text",
  }),
  Object.freeze({
    id: "m6-writing-textbox-labels",
    module: 6,
    surface: "Active drafting textbox labels",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "getWritingSectionLabel(step)",
    compliant: true,
    leak: null,
    remedy: "WP-065 — Introduction / Body Paragraph N / Conclusion",
  }),
  Object.freeze({
    id: "m6-working-set-chrome",
    module: 6,
    surface: "Working-set label above drafting surface",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "getModule6StepPresentation → workingSetLabel",
    compliant: true,
    leak: "Body steps previously used outline bucket/point as workingSetLabel",
    remedy: "workingSetLabel = getWritingSectionLabel(step)",
    repaired: true,
  }),
  Object.freeze({
    id: "m6-section-persistence",
    module: 6,
    surface: "Section persistence shape",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "sections: string[] via draft array",
    compliant: true,
    leak: null,
    remedy: "Persist prose slots only",
  }),
  Object.freeze({
    id: "m6-full-text",
    module: 6,
    surface: "Derived full_text",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "deriveModule6FullText(sections) — join section prose",
    compliant: true,
    leak: null,
    remedy: "Never serialize roman/title/bucket into full_text",
  }),
  Object.freeze({
    id: "m6-whole-draft-review",
    module: 6,
    surface: "Whole-draft review section headers + prose preview",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "getWritingSectionLabel + draft[step.draftIndex]",
    compliant: true,
    leak: "Review headers previously appended step.job (organizational job)",
    remedy: "Writing labels only; preview is section prose",
    repaired: true,
  }),
  Object.freeze({
    id: "m6-need-help-shelf",
    module: 6,
    surface: "Need Help / outline shelf / desk support",
    representation: WP063_REPRESENTATION.REFERENCE_SUPPORT,
    planningLabelsAllowed: true,
    studentProseShown: false,
    textSource: "ModuleSixReferenceShelf; selectTaskRelevantArtifacts",
    compliant: true,
    leak: null,
    remedy: "Planning OK as separate support (WP-049 desk intact)",
  }),
  Object.freeze({
    id: "m7-hydration",
    module: 7,
    surface: "Hydration from Module 6 sections or full_text",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "M6 sections preferred; else splitDraftIntoSections(full_text)",
    compliant: true,
    leak: null,
    remedy: "Align empty/missing slots; no outline chrome injected",
  }),
  Object.freeze({
    id: "m7-read-aloud",
    module: 7,
    surface: "Read Aloud essay view",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "EssayProseView ← getEssayProseBlocks",
    compliant: true,
    leak: null,
    remedy: "WP-001 — prose paragraphs only",
  }),
  Object.freeze({
    id: "m7-section-revision-labels",
    module: 7,
    surface: "Section-revision textbox labels / aria",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "getWritingSectionLabel(currentRevisionStep)",
    compliant: true,
    leak: null,
    remedy: "WP-066 — match Module 6 writing language",
  }),
  Object.freeze({
    id: "m7-working-set-chrome",
    module: 7,
    surface: "Working-set label on revision surface",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "getModule7StepPresentation → workingSetLabel",
    compliant: true,
    leak: "Body steps previously used outline bucket as workingSetLabel",
    remedy: "workingSetLabel = getWritingSectionLabel(step)",
    repaired: true,
  }),
  Object.freeze({
    id: "m7-final-review",
    module: 7,
    surface: "Final review assembled essay",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "EssayProseView ← getEssayProseBlocks",
    compliant: true,
    leak: null,
    remedy: "Prose-only blocks; no outline wrap",
  }),
  Object.freeze({
    id: "m7-saved-full-text",
    module: 7,
    surface: "Saved full_text / persistence join",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "joinSections(sections)",
    compliant: true,
    leak: null,
    remedy: "Section prose only — no sanitizing regex on student text",
  }),
  Object.freeze({
    id: "m7-desk-support",
    module: 7,
    surface: "Desk thesis/claim/evidence/reasoning support",
    representation: WP063_REPRESENTATION.REFERENCE_SUPPORT,
    planningLabelsAllowed: false,
    studentProseShown: false,
    textSource: "selectTaskRelevantArtifacts (WP-049)",
    compliant: true,
    leak: null,
    remedy: "Keep task-relevant support; not essay headings",
  }),
  Object.freeze({
    id: "m8-finished-essay",
    module: 8,
    surface: "Finished-essay preview / export input (downstream)",
    representation: WP063_REPRESENTATION.WRITING,
    planningLabelsAllowed: false,
    studentProseShown: true,
    textSource: "EssayProseView; getFinalTextForExport prose",
    compliant: true,
    leak: null,
    remedy: "Regression check — planning shelf may still show outline map",
  }),
]);

export function getWp063ModulesCovered() {
  return [
    ...new Set(WP063_FADE_MATRIX.map((row) => row.module)),
  ].sort((a, b) => a - b);
}

export function getWp063NonCompliantRows() {
  return WP063_FADE_MATRIX.filter((row) => row.compliant !== true);
}

export function getWp063WritingSurfaces() {
  return WP063_FADE_MATRIX.filter(
    (row) => row.representation === WP063_REPRESENTATION.WRITING
  );
}

export function planningLabelsForbiddenOnWritingSurface(row) {
  return (
    row.representation === WP063_REPRESENTATION.WRITING &&
    row.planningLabelsAllowed === false
  );
}

/**
 * Hostile outline fixture: planning identity must stay in step metadata,
 * never in assembled prose helpers.
 */
export function wp063HostileOutlineFixture() {
  return {
    introduction: { notes: "Lead with context." },
    body: [
      {
        bucket: "II. PLANNING LABEL",
        point: "II. PLANNING LABEL",
        job: "analyze_speech",
        points: ["note A"],
      },
      {
        bucket: "III. Another outline heading",
        point: "credibility bucket",
        job: "analyze_letter",
        points: ["note B"],
      },
    ],
    conclusion: { summary: "Close.", finalThought: "So what." },
  };
}

export function assembledProseExcludesPlanningMetadata(
  assembledText,
  planningStrings
) {
  const text = String(assembledText ?? "");
  const hits = (Array.isArray(planningStrings) ? planningStrings : []).filter(
    (s) => {
      const needle = String(s || "").trim();
      return needle.length > 0 && text.includes(needle);
    }
  );
  return hits.length === 0;
}
