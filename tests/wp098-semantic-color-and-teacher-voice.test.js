/**
 * WP-098 — Semantic color roles + teacher-voice contract.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  ACCEPTED_INSTRUCTIONAL_ROLE_IDS,
  MODULE7_REVISION_ROLE_MAP,
  assertCoverageFamilyInstructionalRoles,
  assertModule7RevisionRoleMap,
  isAcceptedInstructionalRoleId,
} = require("../lib/ui/taskWorkspaceColorRoleCoverage.js");
const {
  TASK_WORKSPACE_COLOR_ROLES,
  describeTaskWorkspaceRegion,
} = require("../lib/ui/taskWorkspaceContract.js");
const {
  TEACHER_VOICE_STRING_JOBS,
  TECHNICAL_INSTRUCTION_VERBS,
  findForbiddenStudentJargon,
  assertNoForbiddenStudentJargon,
  classifyStudentFacingCopy,
} = require("../lib/ui/teacherVoiceContract.js");
const {
  WP061_ACTION_STATUS_RECONCILIATION,
} = require("../lib/ui/instructionalColorContract.js");

const root = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

describe("WP-098 instructional color coverage", () => {
  it("accepts only the six exact role ids", () => {
    assert.deepEqual(ACCEPTED_INSTRUCTIONAL_ROLE_IDS, [
      "instruction",
      "student-thinking",
      "evidence",
      "writing",
      "revision",
      "reference",
    ]);
    assert.equal(isAcceptedInstructionalRoleId("revision"), true);
    assert.equal(isAcceptedInstructionalRoleId("accent"), false);
  });

  it("declares valid roles or neutral treatment for every coverage family", () => {
    assertCoverageFamilyInstructionalRoles();
  });

  it("fails clearly on unknown role ids", () => {
    assert.throws(() => {
      if (!isAcceptedInstructionalRoleId("neon-glow")) {
        throw new Error("WP-098 unknown role neon-glow");
      }
    }, /unknown role/);
  });

  it("maps Module 7 revision families completely", () => {
    assertModule7RevisionRoleMap();
    assert.equal(MODULE7_REVISION_ROLE_MAP.body_matched_evidence, "evidence");
    assert.equal(MODULE7_REVISION_ROLE_MAP.section_revision_diagnosis, "revision");
  });

  it("allows work-region revision override without changing default writing", () => {
    assert.equal(TASK_WORKSPACE_COLOR_ROLES.work, "writing");
    assert.equal(TASK_WORKSPACE_COLOR_ROLES.revision, "revision");
    assert.equal(describeTaskWorkspaceRegion("work").colorRoleId, "writing");
    assert.equal(
      describeTaskWorkspaceRegion("work", { revisionWorkSurface: true }).colorRoleId,
      "revision"
    );
  });

  it("keeps action/status distinct from instructional roles", () => {
    assert.match(WP061_ACTION_STATUS_RECONCILIATION.finalAction, /not revision/);
    assert.match(WP061_ACTION_STATUS_RECONCILIATION.successStatus, /not student-thinking/);
  });

  it("wires Module 7 slice panels to revision roles with labels", () => {
    for (const rel of [
      "components/module7/SectionRevisionPanel.jsx",
      "components/module7/BodyParagraphRevisionPanel.jsx",
    ]) {
      const src = read(rel);
      assert.match(src, /data-instructional-color-role="revision"/);
      assert.match(src, /text-role-revision/);
      assert.doesNotMatch(
        src,
        /data-instructional-color-role="writing"[\s\S]{0,80}editor/i
      );
    }
    const we = read("components/module7/WholeEssayReviewPanel.jsx");
    assert.match(we, /whole-essay-active-finding[\s\S]*revision/);
    assert.doesNotMatch(
      we,
      /whole-essay-word-expectation[\s\S]{0,200}data-instructional-color-role/
    );
  });
});

describe("WP-098 teacher-voice contract", () => {
  it("covers required string jobs", () => {
    for (const job of [
      "task_question",
      "coaching",
      "teaching_feedback",
      "status",
      "recovery",
      "technical_instruction",
      "success",
      "reference",
      "action",
    ]) {
      assert.ok(TEACHER_VOICE_STRING_JOBS.includes(job), job);
    }
  });

  it("flags scoped jargon without banning technical Doc/PDF verbs", () => {
    assert.equal(findForbiddenStudentJargon("edit in the processor").ok, false);
    assert.equal(findForbiddenStudentJargon("Create Google Doc").ok, true);
    for (const verb of TECHNICAL_INSTRUCTION_VERBS) {
      assert.equal(classifyStudentFacingCopy(verb).keepTechnical, true);
    }
  });

  it("keeps high-traffic registries free of forbidden jargon", () => {
    const surfaces = [
      "components/module8/module8StepPresentation.js",
      "lib/transitions/moduleRoleTransitions.js",
      "lib/exports/submissionDocRecovery.js",
      "lib/ui/successExperienceContract.js",
      "components/module3/ModuleThreeBuildArgumentStep.jsx",
    ];
    const strings = [];
    for (const rel of surfaces) {
      const src = read(rel);
      for (const m of src.matchAll(/["'`]([^"'`]{8,200})["'`]/g)) {
        strings.push(m[1]);
      }
    }
    assertNoForbiddenStudentJargon(strings);
  });

  it("documents the teacher-voice guide", () => {
    const guide = read("docs/project-standards/teacher-voice-contract.md");
    assert.match(guide, /technical_instruction/);
    assert.match(guide, /Create Google Doc/);
    assert.match(guide, /The Writing Processor/);
  });
});
