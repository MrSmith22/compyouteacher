/**
 * WP-061 — Instructional color semantics (Modules 6–9 pilot).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  INSTRUCTIONAL_COLOR_ROLE_ORDER,
  INSTRUCTIONAL_COLOR_ROLES,
  WP061_ACTION_STATUS_RECONCILIATION,
  WP061_APPLICATION_MATRIX,
  WP061_ARTIFACT_REGISTRY_DECISION,
  allInstructionalRoleTextColorsMeetAa,
  contrastRatio,
  getInstructionalColorRole,
  meetsWcagAaNormalText,
} from "../lib/ui/instructionalColorContract.js";
import {
  HIERARCHY_ACTION_FINAL_CLASS,
  HIERARCHY_ACTION_PRIMARY_CLASS,
  HIERARCHY_DESK_CLASS,
  HIERARCHY_FOCUS_RING_CLASS,
  HIERARCHY_INSTRUCTION_CLASS,
} from "../lib/ui/hierarchyContract.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const ARTIFACT_KEYS = [
  "source",
  "evidence",
  "evidence_cluster",
  "pattern",
  "idea",
  "claim",
  "thesis",
  "proof_plan",
  "outline",
  "draft",
];

describe("WP-061 instructional color semantics (Modules 6–9)", () => {
  it("1–3. six roles with labels, tokens, surfaces, borders, accents", () => {
    assert.deepEqual([...INSTRUCTIONAL_COLOR_ROLE_ORDER], [
      "instruction",
      "student-thinking",
      "evidence",
      "writing",
      "revision",
      "reference",
    ]);
    for (const id of INSTRUCTIONAL_COLOR_ROLE_ORDER) {
      const role = getInstructionalColorRole(id);
      assert.ok(role, id);
      assert.ok(role.label);
      assert.ok(role.description);
      assert.ok(role.colorToken.startsWith("role-"));
      assert.ok(role.softSurfaceClass.includes(role.colorToken));
      assert.ok(role.borderClass.includes(role.colorToken));
      assert.ok(role.accentClass.includes(role.colorToken));
      assert.ok(role.labelClass.includes(role.colorToken));
      assert.ok(Array.isArray(role.permittedSurfaces));
    }
  });

  it("4. role text colors meet WCAG AA against white (real contrast)", () => {
    assert.equal(allInstructionalRoleTextColorsMeetAa(), true);
    for (const id of INSTRUCTIONAL_COLOR_ROLE_ORDER) {
      const ratio = contrastRatio(INSTRUCTIONAL_COLOR_ROLES[id].hex, "#FFFFFF");
      assert.ok(
        meetsWcagAaNormalText(INSTRUCTIONAL_COLOR_ROLES[id].hex),
        `${id} contrast ${ratio.toFixed(2)}`
      );
      assert.ok(ratio >= 4.5);
    }
    // Lighter palette gold is intentionally not used as normal evidence text.
    assert.equal(meetsWcagAaNormalText("#B08A00"), false);
  });

  it("5–6. Tailwind defines role tokens and scans class registries", () => {
    const tw = readSrc("tailwind.config.js");
    for (const token of [
      "role-instruction",
      "role-thinking",
      "role-evidence",
      "role-writing",
      "role-revision",
      "role-reference",
    ]) {
      assert.match(tw, new RegExp(`"${token}"\\s*:\\s*"#`));
    }
    assert.match(tw, /\.\/lib\/ui\/\*\*\/\*\.\{js,ts,jsx,tsx\}/);
    assert.match(tw, /lib\/artifacts\/artifactPresentation\.ts/);
  });

  it("7–12. Modules 6–7 instruction / thinking / evidence / writing / revision", () => {
    assert.match(HIERARCHY_INSTRUCTION_CLASS, /role-instruction/);
    assert.match(HIERARCHY_DESK_CLASS, /role-thinking/);

    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    assert.match(frame, /data-instructional-color-role="instruction"/);
    assert.match(frame, /data-instructional-color-role="reference"/);

    const desk = readSrc("components/shared/TaskRelevantArtifacts.jsx");
    assert.match(desk, /data-instructional-color-role="student-thinking"/);
    assert.match(desk, /text-role-thinking/);

    const notebook = readSrc("components/shared/WorkingNotebookCurrentPage.jsx");
    assert.match(notebook, /data-instructional-color-role="student-thinking"/);

    const m6 = readSrc("components/ModuleSix.js");
    assert.match(m6, /ROLE_WRITING_WORK_SURFACE_CLASS|role-writing/);
    assert.match(m6, /data-instructional-color-role="writing"/);

    const artifactSrc = readSrc("lib/artifacts/artifactPresentation.ts");
    assert.match(artifactSrc, /key: "evidence"/);
    assert.match(artifactSrc, /label: "Evidence"/);
    assert.match(artifactSrc, /colorToken: "role-evidence"/);
    assert.match(artifactSrc, /text-role-evidence/);

    const strategy = readSrc("components/module7/ModuleSevenStrategyCard.jsx");
    assert.match(strategy, /data-instructional-color-role="revision"/);
    assert.match(strategy, /INSTRUCTIONAL_COLOR_ROLES\.revision|REVISION\.softSurfaceClass/);
    assert.match(
      INSTRUCTIONAL_COLOR_ROLES.revision.softSurfaceClass,
      /role-revision/
    );

    const readTask = readSrc("components/module7/ModuleSevenReadAloudTaskCard.jsx");
    assert.match(readTask, /data-instructional-color-role="instruction"/);
    assert.match(readTask, /HIERARCHY_INSTRUCTION_CLASS/);

    const m7 = readSrc("components/ModuleSeven.js");
    assert.match(m7, /ROLE_REVISION_WORK_SURFACE_CLASS|data-instructional-color-role="revision"/);
    assert.match(m7, /ROLE_WRITING_|data-instructional-color-role="writing"/);
  });

  it("13–17. Modules 8–9 preparation, thinking, APA instruction, reference, final upload", () => {
    const m8 = readSrc("components/ModuleEight.js");
    assert.match(m8, /module8-submission-doc-framing/);
    assert.match(m8, /data-instructional-color-role="instruction"/);
    assert.match(m8, /module8-ready-confidence-checklist/);
    assert.match(m8, /data-instructional-color-role="student-thinking"/);
    assert.match(m8, /role-thinking/);
    assert.match(m8, /HIERARCHY_ACTION_FINAL_CLASS/);
    assert.match(HIERARCHY_ACTION_FINAL_CLASS, /bg-theme-orange/);

    const apa = readSrc("components/module9/ModuleNineApaLesson.jsx");
    assert.match(apa, /role-instruction/);
    assert.doesNotMatch(
      apa.slice(apa.indexOf("module9-apa-concept"), apa.indexOf("module9-apa-try-it")),
      /theme-orange/
    );
    assert.match(apa, /data-instructional-color-role="student-thinking"/);

    const guide = readSrc("components/module9/ModuleNineApaQuickGuide.jsx");
    assert.match(guide, /data-instructional-color-role="reference"/);
    assert.match(guide, /role-reference/);

    const m9 = readSrc("components/ModuleNine.js");
    assert.match(m9, /HIERARCHY_ACTION_FINAL_CLASS/);
    assert.match(m9, /module9-upload-final-pdf/);
    assert.match(m9, /data-instructional-color-role="instruction"/);
  });

  it("18–22. action/status preserved; yellow recorder removed; evidence not for actions", () => {
    assert.match(HIERARCHY_ACTION_PRIMARY_CLASS, /bg-theme-blue/);
    assert.match(HIERARCHY_ACTION_FINAL_CLASS, /bg-theme-orange/);
    assert.ok(WP061_ACTION_STATUS_RECONCILIATION.successStatus.includes("theme-green"));
    assert.ok(WP061_ACTION_STATUS_RECONCILIATION.errorDestructive.includes("theme-red"));

    const recorder = readSrc("components/module7/ModuleSevenReadAloud.jsx");
    assert.doesNotMatch(recorder, /yellow-500/);
    assert.doesNotMatch(recorder, /bg-role-evidence/);
    assert.match(recorder, /HIERARCHY_ACTION_PRIMARY_CLASS/);
    assert.match(recorder, /bg-theme-orange/);
    assert.match(recorder, /aria-label="Stop recording"/);

    const m9 = readSrc("components/ModuleNine.js");
    assert.match(m9, /theme-red|theme-green/);
    assert.doesNotMatch(
      m9.slice(
        m9.indexOf("module9-pdf-download-instructions"),
        m9.indexOf("module9-upload-final-pdf")
      ),
      /role-evidence/
    );
  });

  it("23–25. labels accompany role color; focus remains; no color-only meaning", () => {
    for (const row of WP061_APPLICATION_MATRIX) {
      assert.ok(row.module && row.surface && row.classify);
    }
    const desk = readSrc("components/shared/TaskRelevantArtifacts.jsx");
    assert.match(desk, /aria-label=\{heading\}/);
    assert.match(HIERARCHY_FOCUS_RING_CLASS, /focus-visible:ring-2/);
    const strategy = readSrc("components/module7/ModuleSevenStrategyCard.jsx");
    assert.match(strategy, /Revision strategy:/);
    const obs = readSrc("components/module7/ModuleSevenReadAloudObservation.jsx");
    assert.match(obs, /Your thinking/);
    assert.match(obs, /Selected/);
  });

  it("26. artifact keys/labels/descriptions unchanged; only presentation tokens for evidence/draft", () => {
    const artifactSrc = readSrc("lib/artifacts/artifactPresentation.ts");
    assert.match(
      artifactSrc,
      /description: "Quotes, observations, and supporting details"/
    );
    assert.match(
      artifactSrc,
      /description: "Draft writing and section development"/
    );
    assert.match(artifactSrc, /label: "Evidence"/);
    assert.match(artifactSrc, /label: "Draft"/);
    assert.match(artifactSrc, /colorToken: "role-evidence"/);
    assert.match(artifactSrc, /colorToken: "role-writing"/);
    assert.doesNotMatch(
      artifactSrc,
      /evidence:[\s\S]*?colorToken: "theme-green"/
    );
    assert.doesNotMatch(artifactSrc, /draft:[\s\S]*?colorToken: "theme-blue"/);
    assert.deepEqual([...WP061_ARTIFACT_REGISTRY_DECISION.changedKeys], [
      "evidence",
      "draft",
    ]);
    for (const key of ARTIFACT_KEYS) {
      assert.match(artifactSrc, new RegExp(`key: "${key}"`));
      assert.match(artifactSrc, new RegExp(`${key}: \\{`));
    }
  });

  it("27. WP-048–060 protection hooks remain present", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    const m8 = readSrc("components/ModuleEight.js");
    const m9 = readSrc("components/ModuleNine.js");
    assert.match(frame, /ScreenContractCues/);
    assert.match(m6, /SuccessCriteriaPanel|TaskRelevantArtifacts/);
    assert.match(m7, /ModuleSevenReadAloudObservation/);
    assert.match(m8, /SubmissionDocRecoveryPanel/);
    assert.match(m9, /InstructionalDisclosure/);
    assert.equal(existsSync(join(root, "lib/ui/instructionalRhythmContract.js")), true);
    assert.equal(existsSync(join(root, "lib/ui/workingNotebook.js")), true);
    assert.equal(existsSync(join(root, "lib/ui/progressiveDisclosureContract.js")), true);
  });

  it("28. no Module 3 product file is part of WP-061 implementation", () => {
    const paths = [
      "tailwind.config.js",
      "lib/ui/instructionalColorContract.js",
      "lib/ui/hierarchyContract.js",
      "lib/artifacts/artifactPresentation.ts",
      "docs/design-system-v1.md",
      "components/shared/TaskRelevantArtifacts.jsx",
      "components/shared/WorkingNotebookCurrentPage.jsx",
      "components/module6/ModuleSixStepFrame.jsx",
      "components/module6/ModuleSixReferenceShelf.jsx",
      "components/ModuleSix.js",
      "components/ModuleSeven.js",
      "components/module7/ModuleSevenStrategyCard.jsx",
      "components/module7/ModuleSevenReadAloud.jsx",
      "components/module7/ModuleSevenReadAloudTaskCard.jsx",
      "components/module7/ModuleSevenReadAloudObservation.jsx",
      "components/module7/ModuleSevenReferenceShelf.jsx",
      "components/ModuleEight.js",
      "components/ModuleNine.js",
      "components/module9/ModuleNineApaLesson.jsx",
      "components/module9/ModuleNineApaQuickGuide.jsx",
      "components/module9/ModuleNineApaVisual.jsx",
      "components/module9/ModuleNinePdfDownloadVisual.jsx",
      "tests/wp061-instructional-color-semantics.test.js",
      "tests/wp050-five-level-visual-hierarchy.test.js",
    ];
    for (const p of paths) {
      assert.doesNotMatch(p, /module3\/|ModuleThree/);
      assert.equal(existsSync(join(root, p)), true, `missing ${p}`);
    }
  });
});
