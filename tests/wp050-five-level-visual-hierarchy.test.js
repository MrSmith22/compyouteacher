/**
 * WP-050 — Five-level visual hierarchy (Modules 6–9 pilot).
 *
 * Audit matrix (Phase A): representative states and level assignments.
 * Enforce treatment differences via shared contract tokens + semantic markers—
 * not data-attributes alone.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  HIERARCHY_ACTION_FINAL_CLASS,
  HIERARCHY_ACTION_PRIMARY_CLASS,
  HIERARCHY_ACTION_SECONDARY_CLASS,
  HIERARCHY_DESK_CLASS,
  HIERARCHY_INSTRUCTION_CLASS,
  HIERARCHY_LEVELS,
  HIERARCHY_MODULE_CHROME_CLASS,
  HIERARCHY_OBJECTIVE_CLASS,
  HIERARCHY_TASK_CLASS,
  HIERARCHY_WORK_SURFACE_CLASS,
} from "../lib/ui/hierarchyContract.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

/** Explicit Modules 6–9 hierarchy audit matrix. */
export const WP050_AUDIT_MATRIX = Object.freeze([
  {
    module: 6,
    stateId: "m6-body",
    label: "Module 6 body drafting",
    levels: {
      task: "frame H1 question",
      objective: "ScreenContractCues purpose/finished",
      instruction: "Your job right now",
      work: "desk support + WorkingSet textarea",
      reference: "More saved work / Need Help / guide",
      forward: "Keep going",
    },
    competingBefore: [
      "JobRightNow orange heavy card ≈ working set weight",
      "Need Help jump competed with instruction",
      "Desk shadow similar to work surface",
    ],
  },
  {
    module: 6,
    stateId: "m6-review",
    label: "Module 6 whole-draft review",
    levels: {
      task: "frame H1",
      objective: "purpose + finished cues",
      instruction: "JobRightNow review steps",
      work: "section readiness cards",
      reference: "collapsed More saved work",
      forward: "Finish draft and continue (orange)",
    },
    competingBefore: ["Finish and review cards shared similar card chrome"],
  },
  {
    module: 7,
    stateId: "m7-read-aloud",
    label: "Module 7 read aloud",
    levels: {
      task: "frame H1",
      objective: "cues",
      instruction: "read-aloud task card / strategy",
      work: "essay + recorder",
      reference: "collapsed shelf",
      forward: "Keep going (gated)",
    },
    competingBefore: ["Strategy blue card equal weight to essay surface"],
  },
  {
    module: 7,
    stateId: "m7-section",
    label: "Module 7 section revision",
    levels: {
      task: "frame H1",
      objective: "cues",
      instruction: "strategy card",
      work: "desk + revision textarea",
      reference: "More saved work",
      forward: "Keep going over Save/Back",
    },
    competingBefore: ["Strategy and work surfaces both border-2 colored cards"],
  },
  {
    module: 8,
    stateId: "m8-create",
    label: "Module 8 Create/Update Doc",
    levels: {
      task: "frame H1",
      objective: "cues",
      instruction: "framing callout",
      work: "WorkingSetSection",
      reference: "sidebar shelf",
      forward: "Keep going",
    },
    competingBefore: ["Blue framing band equal to work chrome"],
  },
  {
    module: 8,
    stateId: "m8-format",
    label: "Module 8 Format",
    levels: {
      task: "frame H1",
      objective: "cues",
      instruction: "APA stages",
      work: "checklist / Open Doc",
      reference: "shelf links",
      forward: "Keep going",
    },
    competingBefore: ["Multiple blue bands shared primary visual weight"],
  },
  {
    module: 8,
    stateId: "m8-ready",
    label: "Module 8 Ready",
    levels: {
      task: "frame H1",
      objective: "cues",
      instruction: "confidence checklist coaching",
      work: "ready checklist",
      reference: "shelf / escape hatches",
      forward: "Finish preparing (orange)",
    },
    competingBefore: ["Secondary Update competed with Finish visually"],
  },
  {
    module: 9,
    stateId: "m9-learn",
    label: "Module 9 APA learning",
    levels: {
      task: "step H2 journey task",
      objective: "ScreenContractCues",
      instruction: "APA lesson teaching",
      work: "decision controls",
      reference: "module chrome + quick guide",
      forward: "Continue within lesson / step",
    },
    competingBefore: [
      "Module title text-3xl extrabold overpowered step task",
      "Step task only text-xl",
    ],
  },
  {
    module: 9,
    stateId: "m9-doc",
    label: "Module 9 Google Doc step",
    levels: {
      task: "step H2",
      objective: "cues",
      instruction: "open/verify coaching",
      work: "recovery / open actions",
      reference: "chrome journey",
      forward: "primary Continue/Open path",
    },
    competingBefore: ["Equal white shadow cards for chrome and step"],
  },
  {
    module: 9,
    stateId: "m9-format",
    label: "Module 9 formatting checklist",
    levels: {
      task: "step H2",
      objective: "cues",
      instruction: "do-not-rewrite + guide",
      work: "checklist",
      reference: "quick guide disclosures",
      forward: "Continue to download",
    },
    competingBefore: ["Checklist and chrome shared identical card weight"],
  },
  {
    module: 9,
    stateId: "m9-pdf",
    label: "Module 9 PDF upload",
    levels: {
      task: "step H2",
      objective: "cues",
      instruction: "download/upload coaching",
      work: "file select + final checklist",
      reference: "optional help",
      forward: "Upload Final PDF (orange)",
    },
    competingBefore: ["Upload button used smaller rounded styling than M6–8"],
  },
]);

describe("WP-050 five-level visual hierarchy (Modules 6–9)", () => {
  it("audit matrix covers representative Modules 6–9 states", () => {
    for (const module of [6, 7, 8, 9]) {
      const rows = WP050_AUDIT_MATRIX.filter((row) => row.module === module);
      assert.ok(rows.length >= 2, `module ${module} needs states`);
    }
    for (const row of WP050_AUDIT_MATRIX) {
      assert.ok(row.levels.task && row.levels.objective && row.levels.instruction);
      assert.ok(row.levels.work && row.levels.reference && row.levels.forward);
    }
  });

  it("shared hierarchy contract defines distinct level treatments", () => {
    assert.ok(HIERARCHY_TASK_CLASS.includes("text-[1.95rem]"));
    assert.ok(HIERARCHY_TASK_CLASS.includes("font-bold"));
    assert.ok(HIERARCHY_OBJECTIVE_CLASS.includes("text-text-muted"));
    assert.ok(!HIERARCHY_OBJECTIVE_CLASS.includes("md:text-base"));
    assert.ok(HIERARCHY_INSTRUCTION_CLASS.includes("border-border-soft"));
    assert.ok(!HIERARCHY_INSTRUCTION_CLASS.includes("border-2"));
    assert.ok(!HIERARCHY_INSTRUCTION_CLASS.includes("shadow-soft"));
    assert.ok(HIERARCHY_DESK_CLASS.includes("bg-surface-soft/30"));
    assert.ok(!HIERARCHY_DESK_CLASS.includes("shadow-soft"));
    assert.ok(HIERARCHY_WORK_SURFACE_CLASS.includes("border-2"));
    assert.ok(HIERARCHY_WORK_SURFACE_CLASS.includes("shadow-md"));
    assert.ok(HIERARCHY_ACTION_PRIMARY_CLASS.includes("font-semibold"));
    assert.ok(HIERARCHY_ACTION_SECONDARY_CLASS.includes("border"));
    assert.ok(HIERARCHY_ACTION_FINAL_CLASS.includes("bg-theme-orange"));
    assert.ok(HIERARCHY_MODULE_CHROME_CLASS.includes("text-lg"));
    assert.notEqual(HIERARCHY_TASK_CLASS, HIERARCHY_MODULE_CHROME_CLASS);
    assert.deepEqual(Object.values(HIERARCHY_LEVELS).sort(), [
      "instruction",
      "objective",
      "reference",
      "task",
      "work",
    ]);
  });

  it("ModuleSixStepFrame marks task/instruction/work/reference with real treatments", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    assert.ok(frame.includes("HIERARCHY_TASK_CLASS"));
    assert.ok(frame.includes('data-hierarchy-level={HIERARCHY_LEVELS.task}'));
    assert.ok(frame.includes("HIERARCHY_INSTRUCTION_CLASS"));
    assert.ok(frame.includes('data-hierarchy-level={HIERARCHY_LEVELS.instruction}'));
    assert.ok(frame.includes('data-hierarchy-emphasis="active"'));
    assert.ok(frame.includes('data-hierarchy-level={HIERARCHY_LEVELS.reference}'));
    assert.ok(frame.includes("HIERARCHY_REFERENCE_CLASS"));
    assert.equal(frame.includes("border-theme-orange/40 bg-theme-orange/10"), false);
  });

  it("objective cues are subordinate to the task treatment", () => {
    const cues = readSrc("components/shared/ScreenContractCues.jsx");
    assert.ok(cues.includes("HIERARCHY_OBJECTIVE_CLASS"));
    assert.ok(cues.includes('data-hierarchy-level={HIERARCHY_LEVELS.objective}'));
    assert.equal(cues.includes("md:text-base"), false);
    assert.equal(cues.includes("font-semibold text-text-primary"), false);
  });

  it("desk artifacts are quieter than active work surfaces", () => {
    const desk = readSrc("components/shared/TaskRelevantArtifacts.jsx");
    assert.ok(desk.includes("HIERARCHY_DESK_CLASS"));
    assert.ok(desk.includes('data-hierarchy-emphasis="support"'));
    assert.equal(desk.includes("shadow-soft"), false);
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m6.includes("HIERARCHY_WORK_SURFACE_CLASS"));
    assert.ok(m7.includes("HIERARCHY_WORK_SURFACE_CLASS"));
    assert.ok(m8.includes("HIERARCHY_WORK_SURFACE_CLASS"));
  });

  it("reference shelves remain secondary or collapsed", () => {
    const m6Shelf = readSrc("components/module6/ModuleSixReferenceShelf.jsx");
    const m7Shelf = readSrc("components/module7/ModuleSevenReferenceShelf.jsx");
    assert.ok(m6Shelf.includes('data-hierarchy-level="reference"'));
    assert.ok(m7Shelf.includes('data-hierarchy-level="reference"'));
    assert.ok(m6Shelf.includes("More saved work"));
    assert.ok(m7Shelf.includes("More saved work"));
    assert.equal(/data-testid="module6-more-saved-work"[^>]*\sopen=/.test(m6Shelf), false);
  });

  it("intended forward actions are stronger than secondary actions", () => {
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    const m8 = readSrc("components/ModuleEight.js");
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m6.includes("HIERARCHY_ACTION_PRIMARY_CLASS"));
    assert.ok(m6.includes("HIERARCHY_ACTION_FINAL_CLASS"));
    assert.ok(m6.includes("HIERARCHY_ACTION_SECONDARY_CLASS"));
    assert.ok(m6.includes('data-hierarchy-action="primary"'));
    assert.ok(m7.includes('data-hierarchy-action="primary"'));
    assert.ok(m8.includes('data-hierarchy-action="primary"'));
    assert.ok(m8.includes('data-hierarchy-action="final"'));
    assert.ok(m9.includes("HIERARCHY_ACTION_PRIMARY_CLASS"));
    assert.ok(m9.includes("HIERARCHY_ACTION_FINAL_CLASS"));
    assert.ok(HIERARCHY_ACTION_PRIMARY_CLASS.includes("bg-theme-blue"));
    assert.ok(HIERARCHY_ACTION_SECONDARY_CLASS.includes("bg-surface-soft"));
    assert.notEqual(HIERARCHY_ACTION_PRIMARY_CLASS, HIERARCHY_ACTION_SECONDARY_CLASS);
  });

  it("preserves heading semantics, WP-048 cues, and WP-049 desk pull-forward", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    const cues = readSrc("components/shared/ScreenContractCues.jsx");
    const desk = readSrc("components/shared/TaskRelevantArtifacts.jsx");
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    assert.ok(frame.includes("<h1"));
    assert.ok(frame.includes('data-testid="screen-contract-task"'));
    assert.ok(cues.includes('data-testid="screen-contract-purpose"'));
    assert.ok(desk.includes('data-testid="task-relevant-artifacts"'));
    assert.ok(m6.includes("TaskRelevantArtifacts"));
    assert.ok(m7.includes("TaskRelevantArtifacts"));
    assert.ok(frame.includes("focus-visible:ring-2") || frame.includes("focus-visible:ring-2"));
  });

  it("Module 9 demotes chrome and elevates active journey tasks", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes("HIERARCHY_MODULE_CHROME_CLASS"));
    assert.ok(m9.includes("HIERARCHY_TASK_CLASS"));
    assert.ok(m9.includes('data-hierarchy-level={HIERARCHY_LEVELS.task}'));
    assert.equal(m9.includes("text-3xl font-extrabold text-theme-blue"), false);
    assert.ok(m9.includes("MODULE9_SCREEN_CONTRACT"));
    assert.ok(m9.includes('data-testid="module9-journey-progress"'));
  });

  it("Tailwind scans hierarchy contract tokens so size classes compile", () => {
    const tw = readSrc("tailwind.config.js");
    assert.ok(tw.includes("./lib/ui/**/*.{js,ts,jsx,tsx}"));
    const readAloud = readSrc("components/module7/ModuleSevenReadAloudTaskCard.jsx");
    assert.ok(readAloud.includes("HIERARCHY_INSTRUCTION_CLASS"));
    assert.equal(readAloud.includes("border-theme-orange/45"), false);
  });

  it("preserves Module 6–9 persistence, gates, recovery, upload, and navigation handlers", () => {
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    const m8 = readSrc("components/ModuleEight.js");
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m6.includes("atomicWriteModule6Draft") || m6.includes("finalize"));
    assert.ok(m7.includes("evaluateReadAloudAdvanceGate"));
    assert.ok(m8.includes("verifySubmissionGoogleDocContent"));
    assert.ok(m9.includes("/api/final-pdf"));
    assert.ok(m9.includes("canUpload"));
    assert.ok(m8.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m9.includes("SubmissionDocRecoveryPanel"));
  });
});
