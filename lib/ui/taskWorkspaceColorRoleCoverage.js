/**
 * WP-098 — Instructional role coverage for WP-097 families + Module 7 revision map.
 * Roles must be exact INSTRUCTIONAL_COLOR_ROLE ids or explicit neutral.
 */

import { INSTRUCTIONAL_COLOR_ROLE_ORDER } from "./instructionalColorContract.js";
import { listCoverageFamilyIds } from "./taskWorkspaceCoverageRegistry.js";

export const ACCEPTED_INSTRUCTIONAL_ROLE_IDS = Object.freeze([
  ...INSTRUCTIONAL_COLOR_ROLE_ORDER,
]);

/**
 * Per coverage-family instructional roles (or neutralOk).
 * Neutral families intentionally use action/status/chrome only.
 */
export const COVERAGE_FAMILY_INSTRUCTIONAL_ROLES = Object.freeze({
  "M1.PROMPT": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking"]),
    neutralOk: false,
  }),
  "M1.TRANSFER": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking", "writing"]),
    neutralOk: false,
  }),
  "M1.LEGACY_LEARN": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking"]),
    neutralOk: false,
  }),
  "M1.QUIZ": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking"]),
    neutralOk: false,
  }),
  "M1.TRANSITION": Object.freeze({
    roles: Object.freeze(["instruction"]),
    neutralOk: false,
  }),
  "M2.WIZARD": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking", "evidence"]),
    neutralOk: false,
  }),
  "M2.GUIDED_OBS": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking", "evidence"]),
    neutralOk: false,
  }),
  "M2.TCHART": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking", "evidence"]),
    neutralOk: false,
  }),
  "M2.MATRIX": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking", "evidence", "reference"]),
    neutralOk: false,
  }),
  "M2.DIRECTION": Object.freeze({
    roles: Object.freeze(["evidence", "student-thinking", "instruction"]),
    neutralOk: false,
  }),
  "M3.EA": Object.freeze({
    roles: Object.freeze(["instruction", "evidence", "student-thinking"]),
    neutralOk: false,
  }),
  "M3.V2": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking", "reference"]),
    neutralOk: false,
  }),
  "M3.HYDRATE": Object.freeze({
    roles: Object.freeze([]),
    neutralOk: true,
  }),
  "M4.HANDOFF": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking", "reference"]),
    neutralOk: false,
  }),
  "M4.PATTERN": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking"]),
    neutralOk: false,
  }),
  "M4.BODY": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking", "evidence", "reference"]),
    neutralOk: false,
  }),
  "M4.THIRD": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking"]),
    neutralOk: false,
  }),
  "M4.REVIEW": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking", "reference"]),
    neutralOk: false,
  }),
  "M4.UPSTREAM": Object.freeze({
    roles: Object.freeze([]),
    neutralOk: true,
  }),
  "M5.OUTLINE": Object.freeze({
    roles: Object.freeze(["instruction", "writing", "reference"]),
    neutralOk: false,
  }),
  "M5.VIEW_TOGGLE": Object.freeze({
    roles: Object.freeze(["instruction", "writing"]),
    neutralOk: false,
  }),
  "M5.MISMATCH": Object.freeze({
    roles: Object.freeze([]),
    neutralOk: true,
  }),
  "M6.INTRO": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking", "writing", "reference"]),
    neutralOk: false,
  }),
  "M6.BODY": Object.freeze({
    roles: Object.freeze([
      "instruction",
      "student-thinking",
      "evidence",
      "writing",
      "reference",
    ]),
    neutralOk: false,
  }),
  "M6.CONCLUSION": Object.freeze({
    roles: Object.freeze(["instruction", "student-thinking", "writing", "reference"]),
    neutralOk: false,
  }),
  "M6.ADVANCED": Object.freeze({
    roles: Object.freeze(["writing", "reference"]),
    neutralOk: false,
  }),
  "M6.REVIEW": Object.freeze({
    roles: Object.freeze(["writing", "reference"]),
    neutralOk: false,
  }),
  "M6.LEGACY_TEXTAREA": Object.freeze({
    roles: Object.freeze(["writing", "reference"]),
    neutralOk: false,
  }),
  "M6.AUTOSAVE": Object.freeze({
    roles: Object.freeze([]),
    neutralOk: true,
  }),
  "M7.RA": Object.freeze({
    roles: Object.freeze(["instruction", "writing", "student-thinking", "reference"]),
    neutralOk: false,
  }),
  "M7.SECTION": Object.freeze({
    roles: Object.freeze([
      "revision",
      "student-thinking",
      "evidence",
      "writing",
      "reference",
    ]),
    neutralOk: false,
  }),
  "M7.WE": Object.freeze({
    roles: Object.freeze(["writing", "revision", "reference"]),
    neutralOk: false,
  }),
  "M7.LEGACY_SEC": Object.freeze({
    roles: Object.freeze(["revision", "reference"]),
    neutralOk: false,
  }),
  "M8.DOC": Object.freeze({
    roles: Object.freeze(["instruction", "writing", "reference"]),
    neutralOk: false,
  }),
  "M8.LEGACY": Object.freeze({
    roles: Object.freeze(["instruction", "reference"]),
    neutralOk: false,
  }),
  "M9.HAND": Object.freeze({
    roles: Object.freeze(["instruction"]),
    neutralOk: false,
  }),
  "M9.MOVE": Object.freeze({
    roles: Object.freeze(["instruction", "reference", "student-thinking"]),
    neutralOk: false,
  }),
  "M9.DOCINS": Object.freeze({
    roles: Object.freeze(["instruction", "reference"]),
    neutralOk: false,
  }),
  "M9.PDF": Object.freeze({
    roles: Object.freeze(["instruction", "reference"]),
    neutralOk: false,
  }),
  "M9.ALREADY": Object.freeze({
    roles: Object.freeze([]),
    neutralOk: true,
  }),
  "M9.REC": Object.freeze({
    roles: Object.freeze([]),
    neutralOk: true,
  }),
  "M9.LEGACY": Object.freeze({
    roles: Object.freeze(["instruction", "reference"]),
    neutralOk: false,
  }),
});

/**
 * Module 7 revision-family surface → role map (Prompt 19 closure).
 */
export const MODULE7_REVISION_ROLE_MAP = Object.freeze({
  read_aloud_prose: "writing",
  read_aloud_observation: "student-thinking",
  read_aloud_coaching: "instruction",
  read_aloud_secondary_teaching: "reference",
  section_revision_editor: "revision",
  section_revision_diagnosis: "revision",
  section_revision_before_after: "revision",
  section_revision_clearer: "revision",
  section_plan_notes: "student-thinking",
  body_revision_editor: "revision",
  body_revision_diagnosis: "revision",
  body_revision_before_after: "revision",
  body_revision_clearer: "revision",
  body_purpose_notes: "student-thinking",
  body_matched_evidence: "evidence",
  body_prior_paragraph: "writing",
  whole_essay_prose: "writing",
  whole_essay_finding: "revision",
  whole_essay_word_count: null, // status only
  whole_essay_shelf: "reference",
  legacy_section_editor: "revision",
  strategy_card: "revision",
});

export function isAcceptedInstructionalRoleId(roleId) {
  return ACCEPTED_INSTRUCTIONAL_ROLE_IDS.includes(roleId);
}

/**
 * @param {string} familyId
 */
export function getCoverageFamilyInstructionalRoles(familyId) {
  return COVERAGE_FAMILY_INSTRUCTIONAL_ROLES[familyId] || null;
}

/**
 * Assert every WP-097 family declares valid roles or explicit neutral treatment.
 */
export function assertCoverageFamilyInstructionalRoles() {
  const missing = [];
  const invalid = [];
  for (const familyId of listCoverageFamilyIds()) {
    const entry = COVERAGE_FAMILY_INSTRUCTIONAL_ROLES[familyId];
    if (!entry) {
      missing.push(familyId);
      continue;
    }
    if (entry.neutralOk) {
      if (entry.roles.length > 0) {
        invalid.push(`${familyId}: neutralOk with non-empty roles`);
      }
      continue;
    }
    if (!Array.isArray(entry.roles) || entry.roles.length === 0) {
      invalid.push(`${familyId}: expected roles or neutralOk`);
      continue;
    }
    for (const role of entry.roles) {
      if (!isAcceptedInstructionalRoleId(role)) {
        invalid.push(`${familyId}: unknown role ${role}`);
      }
    }
  }
  if (missing.length || invalid.length) {
    throw new Error(
      `WP-098 instructional role coverage failed: missing=[${missing.join(", ")}] invalid=[${invalid.join(", ")}]`
    );
  }
  return true;
}

/**
 * Assert Module 7 revision map uses only accepted roles (or null status).
 */
export function assertModule7RevisionRoleMap() {
  const required = [
    "section_revision_editor",
    "body_revision_editor",
    "whole_essay_finding",
    "whole_essay_word_count",
    "read_aloud_prose",
    "legacy_section_editor",
  ];
  for (const key of required) {
    if (!(key in MODULE7_REVISION_ROLE_MAP)) {
      throw new Error(`WP-098 Module 7 map missing ${key}`);
    }
  }
  for (const [key, role] of Object.entries(MODULE7_REVISION_ROLE_MAP)) {
    if (role == null) continue;
    if (!isAcceptedInstructionalRoleId(role)) {
      throw new Error(`WP-098 Module 7 map unknown role ${role} for ${key}`);
    }
  }
  if (MODULE7_REVISION_ROLE_MAP.section_revision_editor !== "revision") {
    throw new Error("WP-098 section editor must be revision");
  }
  if (MODULE7_REVISION_ROLE_MAP.body_revision_editor !== "revision") {
    throw new Error("WP-098 body editor must be revision");
  }
  if (MODULE7_REVISION_ROLE_MAP.whole_essay_finding !== "revision") {
    throw new Error("WP-098 whole-essay finding must be revision");
  }
  if (MODULE7_REVISION_ROLE_MAP.whole_essay_word_count !== null) {
    throw new Error("WP-098 word-count must be status-only (null role)");
  }
  if (MODULE7_REVISION_ROLE_MAP.read_aloud_prose !== "writing") {
    throw new Error("WP-098 read-aloud prose must stay writing until edit");
  }
  return true;
}
