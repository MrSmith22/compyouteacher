/**
 * WP-058 — Distinct psychological mode cues for Modules 3–9 (M3 model-only).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  MODULE_PSYCHOLOGICAL_MODE_ORDER,
  MODULE_PSYCHOLOGICAL_MODES,
  getModulePsychologicalMode,
} from "../lib/ui/modulePsychologicalModes.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const EXPECTED_ORDER = [
  "discovery",
  "organization",
  "planning",
  "writing",
  "revision",
  "preparation",
  "submission",
];

describe("WP-058 pure psychological mode model", () => {
  it("1–4. Modules 3–9 defined with unique labels, order, and transformations", () => {
    assert.deepEqual([...MODULE_PSYCHOLOGICAL_MODE_ORDER], EXPECTED_ORDER);
    assert.equal(MODULE_PSYCHOLOGICAL_MODES.length, 7);
    const modes = new Set();
    const labels = new Set();
    for (let i = 0; i < MODULE_PSYCHOLOGICAL_MODES.length; i += 1) {
      const entry = MODULE_PSYCHOLOGICAL_MODES[i];
      assert.equal(entry.module, i + 3);
      assert.equal(entry.mode, EXPECTED_ORDER[i]);
      assert.ok(entry.label.includes("mode"));
      assert.ok(String(entry.coaching).trim().length >= 20);
      assert.ok(String(entry.primaryArtifact).trim());
      assert.ok(String(entry.transformation).trim());
      assert.equal(modes.has(entry.mode), false);
      assert.equal(labels.has(entry.label), false);
      modes.add(entry.mode);
      labels.add(entry.label);
      assert.equal(getModulePsychologicalMode(entry.module)?.mode, entry.mode);
    }
  });

  it("5. Module 3 exists in the model only — no Module 3 product integration", () => {
    assert.equal(getModulePsychologicalMode(3)?.mode, "discovery");
    const productPaths = [
      "components/ModuleThreeV2Form.jsx",
      "components/module3/ModuleThreeStepFrame.jsx",
      "components/module3/ModuleThreeExploreIdeaStep.jsx",
    ];
    for (const p of productPaths) {
      const src = readSrc(p);
      assert.doesNotMatch(src, /ModuleModeCue|modulePsychologicalModes|module-mode-cue/);
    }
  });
});

describe("WP-058 Modules 4–9 cue integration", () => {
  it("6–9. each module renders exactly one cue with hooks; not in disclosure/live", () => {
    const integrations = [
      { module: 4, path: "components/ModuleFour.js" },
      { module: 5, path: "components/module5/ModuleFiveStepFrame.jsx" },
      { module: 6, path: "components/module6/ModuleSixStepFrame.jsx" },
      { module: 7, path: "components/ModuleSeven.js" },
      { module: 8, path: "components/ModuleEight.js" },
      { module: 9, path: "components/ModuleNine.js" },
    ];

    for (const row of integrations) {
      const src = readSrc(row.path);
      if (row.module === 4 || row.module === 9) {
        assert.match(src, /ModuleModeCue/);
        assert.equal((src.match(/<ModuleModeCue/g) || []).length, 1);
      } else if (row.module === 5) {
        assert.match(src, /ModuleModeCue/);
        assert.equal((src.match(/<ModuleModeCue/g) || []).length, 1);
      } else if (row.module === 6) {
        assert.match(src, /ModuleModeCue/);
        assert.match(src, /psychologicalModule/);
      } else if (row.module === 7) {
        assert.match(src, /psychologicalModule=\{7\}/);
      } else if (row.module === 8) {
        assert.match(src, /psychologicalModule=\{8\}/);
      }
    }

    assert.match(readSrc("components/ModuleSix.js"), /psychologicalModule=\{6\}/);

    const cue = readSrc("components/shared/ModuleModeCue.jsx");
    assert.match(cue, /data-testid="module-mode-cue"/);
    assert.match(cue, /data-module=/);
    assert.match(cue, /data-mode=/);
    assert.match(cue, /aria-label=\{`Module \$\{entry\.module\} \$\{entry\.mode\} mode`\}/);
    assert.doesNotMatch(cue, /aria-live|role="status"|onClick|button|details|InstructionalDisclosure/);
    assert.doesNotMatch(cue, /HIERARCHY_TASK_CLASS|<h1/);
  });

  it("10. cue hierarchy is objective-level (quieter than task)", () => {
    const cue = readSrc("components/shared/ModuleModeCue.jsx");
    assert.match(cue, /HIERARCHY_LEVELS\.objective|hierarchy-level.*objective/);
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    const cueIdx = frame.indexOf("<ModuleModeCue");
    const taskIdx = frame.indexOf('data-testid="screen-contract-task"');
    assert.ok(cueIdx > 0 && taskIdx > cueIdx, "mode cue appears before task heading");
  });
});

describe("WP-058 mode-language alignment", () => {
  it("11–16. coaching and key surfaces match each mode", () => {
    const m4 = getModulePsychologicalMode(4);
    assert.match(m4.label, /Organization/i);
    assert.match(m4.coaching, /paragraph plans/i);
    assert.doesNotMatch(m4.coaching, /draft the essay|write your essay/i);
    assert.match(readSrc("components/ModuleFour.js"), /ModuleModeCue/);

    const m5 = getModulePsychologicalMode(5);
    assert.match(m5.label, /Planning/i);
    assert.match(m5.coaching, /outline/i);
    assert.doesNotMatch(m5.coaching, /write prose|finished paper/i);
    assert.match(
      readSrc("components/ModuleFive.js"),
      /paragraph plans you already completed|arrange/i
    );

    const m6 = getModulePsychologicalMode(6);
    assert.match(m6.label, /Writing/i);
    assert.match(m6.coaching, /planned section|readable prose/i);

    const m7 = getModulePsychologicalMode(7);
    assert.match(m7.label, /Revision/i);
    assert.match(m7.coaching, /completed draft|Strengthen/i);
    assert.doesNotMatch(m7.coaching, /start a new draft/i);

    const m8 = getModulePsychologicalMode(8);
    assert.match(m8.label, /Preparation/i);
    assert.match(m8.coaching, /finished essay|paper you will submit/i);
    assert.match(
      readSrc("components/ModuleEight.js"),
      /not rewriting|writing is complete/i
    );

    const m9 = getModulePsychologicalMode(9);
    assert.match(m9.label, /Submission/i);
    assert.match(m9.coaching, /Review, check, and turn in/i);
    assert.doesNotMatch(m9.coaching, /rewrite|improve the argument/i);
  });

  it("17. pulled-forward artifacts agree with each mode", () => {
    assert.match(
      getModulePsychologicalMode(4).primaryArtifact,
      /evidence|thesis|patterns/i
    );
    assert.match(
      getModulePsychologicalMode(5).primaryArtifact,
      /paragraph plans/i
    );
    assert.match(getModulePsychologicalMode(6).primaryArtifact, /outline/i);
    assert.match(getModulePsychologicalMode(7).primaryArtifact, /draft/i);
    assert.match(getModulePsychologicalMode(8).primaryArtifact, /essay/i);
    assert.match(
      getModulePsychologicalMode(9).primaryArtifact,
      /Google Doc|PDF/i
    );
  });

  it("18–19. cue is not a WP-052/056 duplicate; no persistence/route wiring", () => {
    const model = readSrc("lib/ui/modulePsychologicalModes.js");
    assert.doesNotMatch(model, /ModuleRoleTransitionCard|progressCelebration|localStorage|supabase|router\.push/);
    const cue = readSrc("components/shared/ModuleModeCue.jsx");
    assert.doesNotMatch(
      cue,
      /You've gathered evidence|Next we'll organize|progress-celebration-bridge|module-role-transition/
    );
    assert.match(model, /Presentation-only|presentation-only/i);
  });
});
