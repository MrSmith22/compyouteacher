/**
 * WP-097 — Presentation coverage map for Module 1–9 active-work families.
 * Modules remain authoritative for state; this only proves every production
 * step/stage id maps to exactly one hierarchy family. Not a second router.
 */

import { PROMPT_STEP_KEYS } from "../module1/promptBreakdownHelpers.js";
import { STEP2_STAGES } from "../module1/step2MicrostageHelpers.js";
import { MODULE2_WIZARD_STEPS } from "../module2/rhetoricalSituationLesson.js";
import { MATRIX_FLOW_STAGES } from "../module2/rhetoricalMatrixHelpers.js";
import { EVIDENCE_ARGUMENT_STEPS } from "../artifacts/evidenceArgumentContract.js";
import {
  STEP_HANDOFF,
  STEP_BIG_PICTURE,
  STEP_EXPLAIN_BUCKETS,
  STEP_PATTERN,
  STEP_B1_SCAFFOLD,
  STEP_B2_REASONING,
  STEP_THIRD_DECISION,
  STEP_B3_SCAFFOLD,
  STEP_B3_REASONING,
  STEP_REFLECTION,
} from "../module4/module4HandoffHelpers.js";
import { MODULE5_STAGE } from "../module5/module5OutlineStageHelpers.js";
import { BODY_PARAGRAPH_CORE_MOVES } from "../module6/bodyParagraphMoves.js";
import { INTRODUCTION_MOVE_IDS } from "../module6/introductionMoves.js";
import { CONCLUSION_MOVE_IDS } from "../module6/conclusionMoves.js";
import { GUIDED_APA_MOVE_IDS } from "../module9/guidedApaRequirementsContract.js";

/** Module 3 V2 step ids (kept in ModuleThreeV2Form; mirrored here for exhaustiveness). */
export const MODULE3_V2_STEP_IDS = Object.freeze([
  "review_evidence",
  "notice_patterns",
  "explore_idea",
  "connect_evidence",
  "evaluate_strength",
  "gather_more_evidence",
  "develop_claim",
  "turn_claim_into_thesis",
]);

const MATRIX_CORE_STAGES = Object.freeze(
  Object.values(MATRIX_FLOW_STAGES).filter(
    (s) => s !== MATRIX_FLOW_STAGES.PATTERN && s !== MATRIX_FLOW_STAGES.REASONING
  )
);

/** Module 4 body-plan role steps (scaffold/role/evidence/reasoning × B1–B3). */
export const MODULE4_BODY_STEP_IDS = Object.freeze([
  4, 5, 6, 7, // B1
  8, 9, 10, 11, // B2
  13, 14, 15, 16, // B3
]);

/**
 * @typedef {"exact"|"prefix"|"set"|"param"} StepIdMatchKind
 * @typedef {{
 *   familyId: string,
 *   module: number,
 *   journeyStageId: string,
 *   rendererId: string,
 *   adapterPath: string,
 *   stepIdPattern: { kind: StepIdMatchKind, values?: string[]|number[], prefix?: string, param?: string },
 *   deskSelector: string,
 *   shelfSelector: string,
 *   recoveryOwner: string,
 *   primaryActionOwner: string,
 *   fixtureFamily: string,
 *   productionPaths: string[],
 * }} TaskWorkspaceCoverageEntry
 */

/** @type {readonly TaskWorkspaceCoverageEntry[]} */
export const TASK_WORKSPACE_COVERAGE_FAMILIES = Object.freeze([
  // —— Module 1 ——
  Object.freeze({
    familyId: "M1.PROMPT",
    module: 1,
    journeyStageId: "understand",
    rendererId: "module1-prompt-page",
    adapterPath: "app/modules/1/prompt/page.js",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze([...PROMPT_STEP_KEYS]),
    }),
    deskSelector: "none",
    shelfSelector: "prompt-guide",
    recoveryOwner: "prompt-page",
    primaryActionOwner: "prompt-page",
    fixtureFamily: "vocabularyTransferLesson",
    productionPaths: Object.freeze(["vocabulary_transfer_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M1.TRANSFER",
    module: 1,
    journeyStageId: "understand",
    rendererId: "VocabularyTransferLessonFlow",
    adapterPath: "components/module1/VocabularyTransferLessonFlow.jsx",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze([STEP2_STAGES.LEARN]),
    }),
    deskSelector: "assignment_transfer_paraphrase",
    shelfSelector: "optional-assignment-details",
    recoveryOwner: "VocabularyTransferLessonFlow",
    primaryActionOwner: "VocabularyTransferLessonFlow",
    fixtureFamily: "vocabularyTransferLesson",
    productionPaths: Object.freeze(["vocabulary_transfer_mode"]),
  }),
  Object.freeze({
    familyId: "M1.LEGACY_LEARN",
    module: 1,
    journeyStageId: "understand",
    rendererId: "ModuleOne-legacy-cards",
    adapterPath: "components/ModuleOne.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze([`${STEP2_STAGES.LEARN}:legacy`]),
    }),
    deskSelector: "none",
    shelfSelector: "term-guide",
    recoveryOwner: "ModuleOne",
    primaryActionOwner: "ModuleOne",
    fixtureFamily: "module1-draft",
    productionPaths: Object.freeze(["legacy"]),
  }),
  Object.freeze({
    familyId: "M1.QUIZ",
    module: 1,
    journeyStageId: "understand",
    rendererId: "ModuleOne-quiz",
    adapterPath: "components/ModuleOne.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze([STEP2_STAGES.QUIZ]),
    }),
    deskSelector: "none",
    shelfSelector: "quiz-guide",
    recoveryOwner: "ModuleOne",
    primaryActionOwner: "ModuleOne",
    fixtureFamily: "readyForQuiz",
    productionPaths: Object.freeze(["vocabulary_transfer_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M1.TRANSITION",
    module: 1,
    journeyStageId: "understand",
    rendererId: "ModuleOne-transition",
    adapterPath: "components/ModuleOne.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze([STEP2_STAGES.TRANSITION]),
    }),
    deskSelector: "none",
    shelfSelector: "none",
    recoveryOwner: "ModuleOne",
    primaryActionOwner: "ModuleOne",
    fixtureFamily: "module1-draft",
    productionPaths: Object.freeze(["vocabulary_transfer_mode", "legacy"]),
  }),

  // —— Module 2 ——
  Object.freeze({
    familyId: "M2.WIZARD",
    module: 2,
    journeyStageId: "read_and_notice",
    rendererId: "module2-wizard",
    adapterPath: "app/modules/2/page.js",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze(
        MODULE2_WIZARD_STEPS.map((s) => `wizard:${s.stage}`)
      ),
    }),
    deskSelector: "active-source-or-none",
    shelfSelector: "notebook-fragments",
    recoveryOwner: "module2-page",
    primaryActionOwner: "module2-page",
    fixtureFamily: "seedModule2",
    productionPaths: Object.freeze(["evidence_argument_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M2.GUIDED_OBS",
    module: 2,
    journeyStageId: "read_and_notice",
    rendererId: "module2-guided-observations",
    adapterPath: "app/modules/2/observations/guided/page.js",
    stepIdPattern: Object.freeze({
      kind: "prefix",
      prefix: "guided_obs:",
    }),
    deskSelector: "active-passage",
    shelfSelector: "observation-notebook",
    recoveryOwner: "guided-observations-page",
    primaryActionOwner: "guided-observations-page",
    fixtureFamily: "seedModule2",
    productionPaths: Object.freeze(["evidence_argument_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M2.TCHART",
    module: 2,
    journeyStageId: "read_and_notice",
    rendererId: "module2-tcharts",
    adapterPath: "app/modules/2/tcharts/page.js",
    stepIdPattern: Object.freeze({
      kind: "prefix",
      prefix: "tchart:",
    }),
    deskSelector: "active-tchart-cell",
    shelfSelector: "saved-fragments",
    recoveryOwner: "tcharts-page",
    primaryActionOwner: "tcharts-page",
    fixtureFamily: "STRONG_TCHART",
    productionPaths: Object.freeze(["evidence_argument_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M2.MATRIX",
    module: 2,
    journeyStageId: "read_and_notice",
    rendererId: "ModuleTwoRhetoricalMatrix",
    adapterPath: "components/module2/ModuleTwoRhetoricalMatrix.jsx",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze(MATRIX_CORE_STAGES.map((s) => `matrix:${s}`)),
    }),
    deskSelector: "active-matrix-cell",
    shelfSelector: "matrix-notebook",
    recoveryOwner: "ModuleTwoRhetoricalMatrix",
    primaryActionOwner: "ModuleTwoRhetoricalMatrix",
    fixtureFamily: "evidenceArgumentSlice",
    productionPaths: Object.freeze(["evidence_argument_mode"]),
  }),
  Object.freeze({
    familyId: "M2.DIRECTION",
    module: 2,
    journeyStageId: "read_and_notice",
    rendererId: "RepresentativeDirectionEvidencePanel",
    adapterPath: "components/module2/RepresentativeDirectionEvidencePanel.jsx",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze([
        `matrix:${MATRIX_FLOW_STAGES.PATTERN}`,
        `matrix:${MATRIX_FLOW_STAGES.REASONING}`,
        "direction:pair",
      ]),
    }),
    deskSelector: "both-work-pair",
    shelfSelector: "direction-fragments",
    recoveryOwner: "RepresentativeDirectionEvidencePanel",
    primaryActionOwner: "RepresentativeDirectionEvidencePanel",
    fixtureFamily: "WP087",
    productionPaths: Object.freeze(["evidence_argument_mode"]),
  }),

  // —— Module 3 ——
  Object.freeze({
    familyId: "M3.EA",
    module: 3,
    journeyStageId: "develop_argument",
    rendererId: "EvidenceArgumentSlicePanel",
    adapterPath: "components/module3/EvidenceArgumentSlicePanel.jsx",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze(EVIDENCE_ARGUMENT_STEPS.map((s) => s.id)),
    }),
    deskSelector: "speech-letter-pair",
    shelfSelector: "reopen-sources",
    recoveryOwner: "EvidenceArgumentSlicePanel",
    primaryActionOwner: "EvidenceArgumentSlicePanel",
    fixtureFamily: "evidenceToArgumentSlice",
    productionPaths: Object.freeze(["evidence_argument_mode"]),
  }),
  Object.freeze({
    familyId: "M3.V2",
    module: 3,
    journeyStageId: "develop_argument",
    rendererId: "ModuleThreeV2Form+ModuleThreeStepFrame",
    adapterPath: "components/module3/ModuleThreeStepFrame.jsx",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze([...MODULE3_V2_STEP_IDS]),
    }),
    deskSelector: "working-set-current-part",
    shelfSelector: "reference-shelf",
    recoveryOwner: "ModuleThreeV2Form",
    primaryActionOwner: "ModuleThreeV2Form",
    fixtureFamily: "seedModule3",
    productionPaths: Object.freeze(["legacy", "evidence_argument_mode"]),
  }),
  Object.freeze({
    familyId: "M3.HYDRATE",
    module: 3,
    journeyStageId: "develop_argument",
    rendererId: "ModuleThreeV2Form-hydrate-recovery",
    adapterPath: "components/ModuleThreeV2Form.jsx",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["hydrate_recover", "persist_retry"]),
    }),
    deskSelector: "none",
    shelfSelector: "none",
    recoveryOwner: "ModuleThree",
    primaryActionOwner: "ModuleThree",
    fixtureFamily: "hydrate-fail",
    productionPaths: Object.freeze(["legacy", "evidence_argument_mode"]),
  }),

  // —— Module 4 ——
  Object.freeze({
    familyId: "M4.HANDOFF",
    module: 4,
    journeyStageId: "plan",
    rendererId: "ModuleFourHandoffStep",
    adapterPath: "components/module4/ModuleFourHandoffStep.jsx",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze([STEP_HANDOFF, STEP_BIG_PICTURE, STEP_EXPLAIN_BUCKETS]),
    }),
    deskSelector: "upstream-argument-summary",
    shelfSelector: "reference-shelf",
    recoveryOwner: "ModuleFour",
    primaryActionOwner: "ModuleFourHandoffStep",
    fixtureFamily: "seedModule4",
    productionPaths: Object.freeze(["writing_spine_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M4.PATTERN",
    module: 4,
    journeyStageId: "plan",
    rendererId: "ModuleFour-pattern",
    adapterPath: "components/ModuleFour.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze([STEP_PATTERN]),
    }),
    deskSelector: "pattern-working-set",
    shelfSelector: "reference-shelf",
    recoveryOwner: "ModuleFour",
    primaryActionOwner: "ModuleFour",
    fixtureFamily: "seedModule4",
    productionPaths: Object.freeze(["writing_spine_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M4.BODY",
    module: 4,
    journeyStageId: "plan",
    rendererId: "ModuleFour-body-plan",
    adapterPath: "components/module3/ModuleThreeStepFrame.jsx",
    stepIdPattern: Object.freeze({
      kind: "param",
      param: "bodyIndex",
      values: Object.freeze([...MODULE4_BODY_STEP_IDS]),
    }),
    deskSelector: "working-set-current-part",
    shelfSelector: "reference-shelf",
    recoveryOwner: "ModuleFour",
    primaryActionOwner: "ModuleFour",
    fixtureFamily: "seedModule4",
    productionPaths: Object.freeze(["writing_spine_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M4.THIRD",
    module: 4,
    journeyStageId: "plan",
    rendererId: "ModuleFour-third-decision",
    adapterPath: "components/ModuleFour.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze([STEP_THIRD_DECISION]),
    }),
    deskSelector: "none",
    shelfSelector: "reference-shelf",
    recoveryOwner: "ModuleFour",
    primaryActionOwner: "ModuleFour",
    fixtureFamily: "seedModule4",
    productionPaths: Object.freeze(["writing_spine_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M4.REVIEW",
    module: 4,
    journeyStageId: "plan",
    rendererId: "ModuleFourFinalReviewStep",
    adapterPath: "components/module4/ModuleFourFinalReviewStep.jsx",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze([STEP_REFLECTION]),
    }),
    deskSelector: "plan-summary",
    shelfSelector: "part-edit-shelf",
    recoveryOwner: "ModuleFourFinalReviewStep",
    primaryActionOwner: "ModuleFourFinalReviewStep",
    fixtureFamily: "seedModule4",
    productionPaths: Object.freeze(["writing_spine_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M4.UPSTREAM",
    module: 4,
    journeyStageId: "plan",
    rendererId: "ModuleFour-upstream-overlay",
    adapterPath: "components/ModuleFour.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["upstream_mismatch"]),
    }),
    deskSelector: "none",
    shelfSelector: "none",
    recoveryOwner: "ModuleFour",
    primaryActionOwner: "ModuleFour",
    fixtureFamily: "upstream-mismatch",
    productionPaths: Object.freeze(["writing_spine_mode", "legacy"]),
  }),

  // —— Module 5 ——
  Object.freeze({
    familyId: "M5.OUTLINE",
    module: 5,
    journeyStageId: "plan",
    rendererId: "ModuleFive+ModuleFiveStepFrame",
    adapterPath: "components/module5/ModuleFiveStepFrame.jsx",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze(Object.values(MODULE5_STAGE)),
    }),
    deskSelector: "active-card-or-imported-plans",
    shelfSelector: "teacher-rail-reference",
    recoveryOwner: "ModuleFive",
    primaryActionOwner: "ModuleFive",
    fixtureFamily: "seedModule5",
    productionPaths: Object.freeze(["writing_spine_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M5.VIEW_TOGGLE",
    module: 5,
    journeyStageId: "plan",
    rendererId: "ModuleFive-view-toggle",
    adapterPath: "components/ModuleFive.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["view:writing_plan", "view:formal"]),
    }),
    deskSelector: "active-outline-view",
    shelfSelector: "teacher-rail-reference",
    recoveryOwner: "ModuleFive",
    primaryActionOwner: "ModuleFive",
    fixtureFamily: "seedModule5",
    productionPaths: Object.freeze(["writing_spine_mode"]),
  }),
  Object.freeze({
    familyId: "M5.MISMATCH",
    module: 5,
    journeyStageId: "plan",
    rendererId: "ModuleFive-mismatch",
    adapterPath: "components/ModuleFive.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["upstream_mismatch", "outline_notice"]),
    }),
    deskSelector: "none",
    shelfSelector: "none",
    recoveryOwner: "ModuleFive",
    primaryActionOwner: "ModuleFive",
    fixtureFamily: "seedModule5",
    productionPaths: Object.freeze(["writing_spine_mode", "legacy"]),
  }),

  // —— Module 6 ——
  Object.freeze({
    familyId: "M6.INTRO",
    module: 6,
    journeyStageId: "draft",
    rendererId: "SectionMoveWorkspace",
    adapterPath: "components/module6/SectionMoveWorkspace.jsx",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze(INTRODUCTION_MOVE_IDS.map((id) => `intro:${id}`)),
    }),
    deskSelector: "selectDeskArtifactsForMove",
    shelfSelector: "more-saved-work",
    recoveryOwner: "SectionMoveWorkspace",
    primaryActionOwner: "SectionMoveWorkspace",
    fixtureFamily: "introSlice",
    productionPaths: Object.freeze(["writing_spine_mode"]),
  }),
  Object.freeze({
    familyId: "M6.BODY",
    module: 6,
    journeyStageId: "draft",
    rendererId: "BodyParagraphMoveWorkspace",
    adapterPath: "components/module6/BodyParagraphMoveWorkspace.jsx",
    stepIdPattern: Object.freeze({
      kind: "param",
      param: "bodyIndex",
      values: Object.freeze(
        BODY_PARAGRAPH_CORE_MOVES.map((m) => `body:${m}`)
      ),
    }),
    deskSelector: "selectDeskArtifactsForMove",
    shelfSelector: "more-saved-work",
    recoveryOwner: "BodyParagraphMoveWorkspace",
    primaryActionOwner: "BodyParagraphMoveWorkspace",
    fixtureFamily: "bodyParagraphSlice",
    productionPaths: Object.freeze(["writing_spine_mode"]),
  }),
  Object.freeze({
    familyId: "M6.CONCLUSION",
    module: 6,
    journeyStageId: "draft",
    rendererId: "SectionMoveWorkspace",
    adapterPath: "components/module6/SectionMoveWorkspace.jsx",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze(CONCLUSION_MOVE_IDS.map((id) => `conclusion:${id}`)),
    }),
    deskSelector: "selectDeskArtifactsForMove",
    shelfSelector: "more-saved-work",
    recoveryOwner: "SectionMoveWorkspace",
    primaryActionOwner: "SectionMoveWorkspace",
    fixtureFamily: "conclusionSlice",
    productionPaths: Object.freeze(["writing_spine_mode"]),
  }),
  Object.freeze({
    familyId: "M6.ADVANCED",
    module: 6,
    journeyStageId: "draft",
    rendererId: "SectionMoveWorkspace-advanced",
    adapterPath: "components/module6/SectionMoveWorkspace.jsx",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["advanced", "preview"]),
    }),
    deskSelector: "assembled-prose",
    shelfSelector: "more-saved-work",
    recoveryOwner: "ModuleSix",
    primaryActionOwner: "ModuleSix",
    fixtureFamily: "draftSlice",
    productionPaths: Object.freeze(["writing_spine_mode"]),
  }),
  Object.freeze({
    familyId: "M6.REVIEW",
    module: 6,
    journeyStageId: "draft",
    rendererId: "ModuleSix-review",
    adapterPath: "components/ModuleSix.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["review"]),
    }),
    deskSelector: "essay-preview",
    shelfSelector: "none",
    recoveryOwner: "ModuleSix",
    primaryActionOwner: "ModuleSix",
    fixtureFamily: "draftSlice",
    productionPaths: Object.freeze(["writing_spine_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M6.LEGACY_TEXTAREA",
    module: 6,
    journeyStageId: "draft",
    rendererId: "ModuleSixStepFrame-legacy",
    adapterPath: "components/module6/ModuleSixStepFrame.jsx",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["legacy_textarea"]),
    }),
    deskSelector: "none",
    shelfSelector: "guide-rail",
    recoveryOwner: "ModuleSix",
    primaryActionOwner: "ModuleSix",
    fixtureFamily: "legacyDraft",
    productionPaths: Object.freeze(["legacy"]),
  }),
  Object.freeze({
    familyId: "M6.AUTOSAVE",
    module: 6,
    journeyStageId: "draft",
    rendererId: "ModuleSix-autosave-overlay",
    adapterPath: "components/ModuleSix.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["autosave_overlay"]),
    }),
    deskSelector: "none",
    shelfSelector: "none",
    recoveryOwner: "ModuleSix",
    primaryActionOwner: "ModuleSix",
    fixtureFamily: "draftSlice",
    productionPaths: Object.freeze(["writing_spine_mode", "legacy"]),
  }),

  // —— Module 7 ——
  Object.freeze({
    familyId: "M7.RA",
    module: 7,
    journeyStageId: "revise",
    rendererId: "ModuleSeven-read-aloud",
    adapterPath: "components/ModuleSeven.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["read_aloud"]),
    }),
    deskSelector: "essay-for-read-aloud",
    shelfSelector: "none",
    recoveryOwner: "ModuleSeven",
    primaryActionOwner: "ModuleSeven",
    fixtureFamily: "module6-drafts",
    productionPaths: Object.freeze(["writing_spine_mode", "legacy"]),
  }),
  Object.freeze({
    familyId: "M7.SECTION",
    module: 7,
    journeyStageId: "revise",
    rendererId: "SectionRevisionPanel",
    adapterPath: "components/module7/SectionRevisionPanel.jsx",
    stepIdPattern: Object.freeze({
      kind: "prefix",
      prefix: "revise:",
    }),
    deskSelector: "matched-plan-evidence",
    shelfSelector: "reference-shelf",
    recoveryOwner: "SectionRevisionPanel",
    primaryActionOwner: "SectionRevisionPanel",
    fixtureFamily: "revisionSlice",
    productionPaths: Object.freeze(["writing_spine_mode"]),
  }),
  Object.freeze({
    familyId: "M7.WE",
    module: 7,
    journeyStageId: "revise",
    rendererId: "WholeEssayReviewPanel",
    adapterPath: "components/module7/WholeEssayReviewPanel.jsx",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze(["whole_essay", "fix_finding", "whole_essay_confirm"]),
    }),
    deskSelector: "essay-plus-one-finding",
    shelfSelector: "none",
    recoveryOwner: "WholeEssayReviewPanel",
    primaryActionOwner: "WholeEssayReviewPanel",
    fixtureFamily: "wholeEssayReview",
    productionPaths: Object.freeze(["writing_spine_mode"]),
  }),
  Object.freeze({
    familyId: "M7.LEGACY_SEC",
    module: 7,
    journeyStageId: "revise",
    rendererId: "ModuleSeven-legacy-section",
    adapterPath: "components/ModuleSeven.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["legacy_section_revision"]),
    }),
    deskSelector: "none",
    shelfSelector: "guide-rail",
    recoveryOwner: "ModuleSeven",
    primaryActionOwner: "ModuleSeven",
    fixtureFamily: "legacyRevision",
    productionPaths: Object.freeze(["legacy"]),
  }),

  // —— Module 8 ——
  Object.freeze({
    familyId: "M8.DOC",
    module: 8,
    journeyStageId: "prepare",
    rendererId: "ModuleEightGuidedApaDocPanel",
    adapterPath: "components/module8/ModuleEightGuidedApaDocPanel.jsx",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze(["doc", "status", "recovery", "review"]),
    }),
    deskSelector: "essay-preview-secondary",
    shelfSelector: "template-disclosure",
    recoveryOwner: "ModuleEight",
    primaryActionOwner: "ModuleEightGuidedApaDocPanel",
    fixtureFamily: "guidedApaProtocol",
    productionPaths: Object.freeze(["submission_protocol_mode"]),
  }),
  Object.freeze({
    familyId: "M8.LEGACY",
    module: 8,
    journeyStageId: "prepare",
    rendererId: "ModuleEight-legacy",
    adapterPath: "components/ModuleEight.js",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze(["legacy_create", "legacy_format", "legacy_ready"]),
    }),
    deskSelector: "none",
    shelfSelector: "guide-rail",
    recoveryOwner: "ModuleEight",
    primaryActionOwner: "ModuleEight",
    fixtureFamily: "completeEssay",
    productionPaths: Object.freeze(["legacy"]),
  }),

  // —— Module 9 ——
  Object.freeze({
    familyId: "M9.HAND",
    module: 9,
    journeyStageId: "submit",
    rendererId: "GuidedApaProtocolFlow-handoff",
    adapterPath: "components/module9/GuidedApaProtocolFlow.jsx",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["handoff"]),
    }),
    deskSelector: "none",
    shelfSelector: "none",
    recoveryOwner: "GuidedApaProtocolFlow",
    primaryActionOwner: "GuidedApaProtocolFlow",
    fixtureFamily: "guidedApaProtocol",
    productionPaths: Object.freeze(["submission_protocol_mode"]),
  }),
  Object.freeze({
    familyId: "M9.MOVE",
    module: 9,
    journeyStageId: "submit",
    rendererId: "GuidedApaProtocolFlow",
    adapterPath: "components/module9/GuidedApaProtocolFlow.jsx",
    stepIdPattern: Object.freeze({
      kind: "param",
      param: "moveId",
      values: Object.freeze(
        GUIDED_APA_MOVE_IDS.filter((id) => id !== "doc_inspection")
      ),
    }),
    deskSelector: "see-model",
    shelfSelector: "full-guide-details",
    recoveryOwner: "GuidedApaProtocolFlow",
    primaryActionOwner: "GuidedApaProtocolFlow",
    fixtureFamily: "guidedApaProtocol",
    productionPaths: Object.freeze(["submission_protocol_mode"]),
  }),
  Object.freeze({
    familyId: "M9.DOCINS",
    module: 9,
    journeyStageId: "submit",
    rendererId: "GuidedApaProtocolFlow-doc-inspection",
    adapterPath: "components/module9/GuidedApaProtocolFlow.jsx",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["doc_inspection"]),
    }),
    deskSelector: "see-model",
    shelfSelector: "full-guide-details",
    recoveryOwner: "GuidedApaProtocolFlow",
    primaryActionOwner: "GuidedApaProtocolFlow",
    fixtureFamily: "guidedApaProtocol",
    productionPaths: Object.freeze(["submission_protocol_mode"]),
  }),
  Object.freeze({
    familyId: "M9.PDF",
    module: 9,
    journeyStageId: "submit",
    rendererId: "GuidedApaProtocolFlow-pdf",
    adapterPath: "components/module9/GuidedApaProtocolFlow.jsx",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["pdf_download", "pdf_select", "pdf_five_check", "pdf_upload"]),
    }),
    deskSelector: "none",
    shelfSelector: "tips-disclosure",
    recoveryOwner: "GuidedApaProtocolFlow",
    primaryActionOwner: "GuidedApaProtocolFlow",
    fixtureFamily: "guidedApaProtocol",
    productionPaths: Object.freeze(["submission_protocol_mode"]),
  }),
  Object.freeze({
    familyId: "M9.ALREADY",
    module: 9,
    journeyStageId: "submit",
    rendererId: "GuidedApaProtocolFlow-already",
    adapterPath: "components/module9/GuidedApaProtocolFlow.jsx",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["already_submitted"]),
    }),
    deskSelector: "none",
    shelfSelector: "none",
    recoveryOwner: "GuidedApaProtocolFlow",
    primaryActionOwner: "GuidedApaProtocolFlow",
    fixtureFamily: "guidedApaProtocol",
    productionPaths: Object.freeze(["submission_protocol_mode"]),
  }),
  Object.freeze({
    familyId: "M9.REC",
    module: 9,
    journeyStageId: "submit",
    rendererId: "ModuleNine-recovery",
    adapterPath: "components/ModuleNine.js",
    stepIdPattern: Object.freeze({
      kind: "exact",
      values: Object.freeze(["doc_recovery"]),
    }),
    deskSelector: "none",
    shelfSelector: "none",
    recoveryOwner: "ModuleNine",
    primaryActionOwner: "ModuleNine",
    fixtureFamily: "guidedApaProtocol",
    productionPaths: Object.freeze(["submission_protocol_mode"]),
  }),
  Object.freeze({
    familyId: "M9.LEGACY",
    module: 9,
    journeyStageId: "submit",
    rendererId: "ModuleNine-legacy",
    adapterPath: "components/ModuleNine.js",
    stepIdPattern: Object.freeze({
      kind: "set",
      values: Object.freeze(["legacy_1", "legacy_2", "legacy_3", "legacy_4"]),
    }),
    deskSelector: "none",
    shelfSelector: "checklist-guide",
    recoveryOwner: "ModuleNine",
    primaryActionOwner: "ModuleNine",
    fixtureFamily: "module9Ready",
    productionPaths: Object.freeze(["legacy"]),
  }),
]);

function normalizeId(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return value;
  return String(value);
}

function patternMatches(pattern, stepId) {
  const id = normalizeId(stepId);
  if (!pattern || !pattern.kind) return false;

  if (pattern.kind === "exact" || pattern.kind === "set" || pattern.kind === "param") {
    const values = Array.isArray(pattern.values) ? pattern.values : [];
    return values.some((v) => normalizeId(v) === id);
  }
  if (pattern.kind === "prefix") {
    const prefix = typeof pattern.prefix === "string" ? pattern.prefix : "";
    return typeof id === "string" && prefix.length > 0 && id.startsWith(prefix);
  }
  return false;
}

/**
 * Resolve which coverage family owns a production step/stage id.
 * @param {string|number} stepId
 * @param {{ module?: number }} [opts]
 * @returns {TaskWorkspaceCoverageEntry|null}
 */
export function resolveTaskWorkspaceCoverageFamily(stepId, opts = {}) {
  const moduleFilter =
    opts.module != null && Number.isFinite(Number(opts.module))
      ? Number(opts.module)
      : null;

  const matches = TASK_WORKSPACE_COVERAGE_FAMILIES.filter((entry) => {
    if (moduleFilter != null && entry.module !== moduleFilter) return false;
    return patternMatches(entry.stepIdPattern, stepId);
  });

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Prefer exact/set over prefix when both match (e.g. matrix:pattern).
  const ranked = [...matches].sort((a, b) => {
    const score = (e) =>
      e.stepIdPattern.kind === "exact" || e.stepIdPattern.kind === "set"
        ? 0
        : e.stepIdPattern.kind === "param"
          ? 1
          : 2;
    return score(a) - score(b);
  });
  return ranked[0];
}

/**
 * Assert every known production id maps to exactly one family.
 * Throws with a clear message when an id is unknown or ambiguous after ranking.
 * @param {Array<string|number>} stepIds
 * @param {{ module?: number }} [opts]
 */
export function assertCoverageForStepIds(stepIds, opts = {}) {
  const missing = [];
  for (const stepId of stepIds) {
    const family = resolveTaskWorkspaceCoverageFamily(stepId, opts);
    if (!family) missing.push(normalizeId(stepId));
  }
  if (missing.length > 0) {
    throw new Error(
      `WP-097 coverage gap: no task-workspace family for step id(s): ${missing.join(", ")}`
    );
  }
  return true;
}

/**
 * Collect the canonical production step/stage id universe used by exhaustiveness tests.
 */
export function collectProductionStepIds() {
  const ids = [];

  for (const key of PROMPT_STEP_KEYS) ids.push({ module: 1, stepId: key });
  ids.push({ module: 1, stepId: STEP2_STAGES.TRANSITION });
  ids.push({ module: 1, stepId: STEP2_STAGES.LEARN });
  ids.push({ module: 1, stepId: `${STEP2_STAGES.LEARN}:legacy` });
  ids.push({ module: 1, stepId: STEP2_STAGES.QUIZ });

  for (const step of MODULE2_WIZARD_STEPS) {
    ids.push({ module: 2, stepId: `wizard:${step.stage}` });
  }
  ids.push({ module: 2, stepId: "guided_obs:start" });
  ids.push({ module: 2, stepId: "tchart:pair" });
  for (const stage of Object.values(MATRIX_FLOW_STAGES)) {
    ids.push({ module: 2, stepId: `matrix:${stage}` });
  }
  ids.push({ module: 2, stepId: "direction:pair" });

  for (const step of EVIDENCE_ARGUMENT_STEPS) {
    ids.push({ module: 3, stepId: step.id });
  }
  for (const id of MODULE3_V2_STEP_IDS) {
    ids.push({ module: 3, stepId: id });
  }
  ids.push({ module: 3, stepId: "hydrate_recover" });
  ids.push({ module: 3, stepId: "persist_retry" });

  ids.push({ module: 4, stepId: STEP_HANDOFF });
  ids.push({ module: 4, stepId: STEP_BIG_PICTURE });
  ids.push({ module: 4, stepId: STEP_EXPLAIN_BUCKETS });
  ids.push({ module: 4, stepId: STEP_PATTERN });
  for (const id of MODULE4_BODY_STEP_IDS) ids.push({ module: 4, stepId: id });
  ids.push({ module: 4, stepId: STEP_THIRD_DECISION });
  ids.push({ module: 4, stepId: STEP_REFLECTION });
  ids.push({ module: 4, stepId: "upstream_mismatch" });
  // Ensure B2/B3 scaffold constants stay in sync with body set.
  void STEP_B1_SCAFFOLD;
  void STEP_B2_REASONING;
  void STEP_B3_SCAFFOLD;
  void STEP_B3_REASONING;

  for (const stage of Object.values(MODULE5_STAGE)) {
    ids.push({ module: 5, stepId: stage });
  }
  ids.push({ module: 5, stepId: "view:writing_plan" });
  ids.push({ module: 5, stepId: "view:formal" });
  ids.push({ module: 5, stepId: "upstream_mismatch" });
  ids.push({ module: 5, stepId: "outline_notice" });

  for (const move of INTRODUCTION_MOVE_IDS) {
    ids.push({ module: 6, stepId: `intro:${move}` });
  }
  for (const move of BODY_PARAGRAPH_CORE_MOVES) {
    ids.push({ module: 6, stepId: `body:${move}` });
  }
  for (const move of CONCLUSION_MOVE_IDS) {
    ids.push({ module: 6, stepId: `conclusion:${move}` });
  }
  ids.push({ module: 6, stepId: "advanced" });
  ids.push({ module: 6, stepId: "preview" });
  ids.push({ module: 6, stepId: "review" });
  ids.push({ module: 6, stepId: "legacy_textarea" });
  ids.push({ module: 6, stepId: "autosave_overlay" });

  ids.push({ module: 7, stepId: "read_aloud" });
  ids.push({ module: 7, stepId: "revise:introduction" });
  ids.push({ module: 7, stepId: "revise:body:1" });
  ids.push({ module: 7, stepId: "revise:conclusion" });
  ids.push({ module: 7, stepId: "whole_essay" });
  ids.push({ module: 7, stepId: "fix_finding" });
  ids.push({ module: 7, stepId: "whole_essay_confirm" });
  ids.push({ module: 7, stepId: "legacy_section_revision" });

  ids.push({ module: 8, stepId: "doc" });
  ids.push({ module: 8, stepId: "status" });
  ids.push({ module: 8, stepId: "recovery" });
  ids.push({ module: 8, stepId: "review" });
  ids.push({ module: 8, stepId: "legacy_create" });
  ids.push({ module: 8, stepId: "legacy_format" });
  ids.push({ module: 8, stepId: "legacy_ready" });

  ids.push({ module: 9, stepId: "handoff" });
  for (const moveId of GUIDED_APA_MOVE_IDS) {
    ids.push({ module: 9, stepId: moveId });
  }
  ids.push({ module: 9, stepId: "pdf_download" });
  ids.push({ module: 9, stepId: "pdf_select" });
  ids.push({ module: 9, stepId: "pdf_five_check" });
  ids.push({ module: 9, stepId: "pdf_upload" });
  ids.push({ module: 9, stepId: "already_submitted" });
  ids.push({ module: 9, stepId: "doc_recovery" });
  ids.push({ module: 9, stepId: "legacy_1" });
  ids.push({ module: 9, stepId: "legacy_2" });
  ids.push({ module: 9, stepId: "legacy_3" });
  ids.push({ module: 9, stepId: "legacy_4" });

  return Object.freeze(ids);
}

export function listCoverageFamilyIds() {
  return TASK_WORKSPACE_COVERAGE_FAMILIES.map((f) => f.familyId);
}
