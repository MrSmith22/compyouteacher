/**
 * WP-095 — Generalize and promote the success system.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  buildModule1SuccessExperience,
  buildModule2SuccessExperience,
  buildModule3SuccessExperience,
  buildModule4SuccessExperience,
  buildModule5SuccessExperience,
  buildModule6SuccessExperience,
  buildModule7SuccessExperience,
  buildModule8SuccessExperience,
  buildModule9ReceiptExperience,
} = require("../lib/ui/successExperienceContract.js");
const {
  getJourneyStageForModule,
  buildJourneyProgress,
} = require("../lib/ui/writingJourneyStages.js");
const {
  projectModule2SuccessEvidence,
} = require("../lib/module2/module2SuccessProjection.js");
const {
  projectModule7SuccessEvidence,
} = require("../lib/module7/module7SuccessProjection.js");

const root = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const PRIMARY_DESTINATIONS = {
  1: "/modules/2",
  2: "/modules/3",
  3: "/modules/4",
  4: "/modules/5",
  5: "/modules/6",
  6: "/modules/7",
  7: "/modules/8",
  8: "/modules/9",
  9: "/dashboard",
};

describe("WP-095 success builders M2–5/7", () => {
  it("builds complete and partial/missing evidence without inventing completion", () => {
    const m2empty = buildModule2SuccessExperience({});
    assert.equal(m2empty.ok, true);
    assert.equal(m2empty.experience.variant, "phase_transition");
    assert.equal(m2empty.experience.evidenceItems.length, 0);
    assert.match(m2empty.experience.title, /evidence set is ready/i);
    assert.match(m2empty.experience.explanation, /not finished yet/i);

    const m2full = buildModule2SuccessExperience({
      sourcesReady: true,
      speechTitle: "Speech",
      letterTitle: "Letter",
      directionLabel: "Same ethos emphasis",
      bothWorksEvidence: true,
    });
    assert.equal(m2full.experience.evidenceItems.length, 3);

    const m3partial = buildModule3SuccessExperience({ argumentReady: false });
    assert.match(m3partial.experience.title, /strengthening/i);
    const m3ready = buildModule3SuccessExperience({
      argumentReady: true,
      proofDirectionCount: 2,
      directionLabel: "Compare appeals",
      familyLabel: "Same appeal across both works",
    });
    assert.ok(m3ready.experience.evidenceItems.length >= 2);
    assert.equal(m3ready.experience.primaryAction.href, "/modules/4");

    const m4inc = buildModule4SuccessExperience({ incomplete: true });
    assert.equal(m4inc.experience.primaryAction.href, "/modules/4");
    assert.match(m4inc.experience.primaryAction.label, /Review Module 4/i);
    assert.equal(m4inc.experience.status, "plan_incomplete");
    const m4ok = buildModule4SuccessExperience({
      requiredPlanCount: 2,
      jobLabels: ["Compare", "Contrast"],
      bothWorksEvidence: true,
    });
    assert.match(m4ok.experience.title, /writing plan is ready/i);
    assert.equal(m4ok.experience.journeyStageId, "plan");

    const m5inc = buildModule5SuccessExperience({
      incomplete: true,
      readFailed: true,
    });
    assert.match(m5inc.experience.title, /Could not load/i);
    const m5ok = buildModule5SuccessExperience({
      bodyCount: 2,
      sectionMapLabel: "Introduction → Body 1 → Body 2 → Conclusion",
      expectedDraftSections: 4,
    });
    assert.equal(m5ok.experience.journeyStageId, "plan");
    assert.match(m5ok.experience.title, /outline is ready/i);
    assert.notEqual(m5ok.experience.explanation, m4ok.experience.explanation);

    const m7empty = buildModule7SuccessExperience({});
    assert.equal(m7empty.experience.evidenceItems.length, 0);
    assert.doesNotMatch(m7empty.experience.explanation, /submitted|APA done/i);
    const m7ok = buildModule7SuccessExperience({
      revisedEssaySaved: true,
      sectionCount: 4,
      wordTotal: 520,
    });
    assert.ok(m7ok.experience.evidenceItems.length >= 2);
    assert.equal(m7ok.experience.primaryAction.href, "/modules/8");
  });

  it("shares Plan stage for Modules 4 and 5 without inventing a duplicate stage", () => {
    assert.equal(getJourneyStageForModule(4).id, "plan");
    assert.equal(getJourneyStageForModule(5).id, "plan");
    const progress = buildJourneyProgress({ currentModule: 5 });
    const planRows = progress.filter((s) => s.id === "plan");
    assert.equal(planRows.length, 1);
    assert.equal(planRows[0].state, "current");
  });

  it("keeps one primary action and unchanged destinations for Modules 1–9", () => {
    const builders = [
      buildModule1SuccessExperience({}),
      buildModule2SuccessExperience({ sourcesReady: true }),
      buildModule3SuccessExperience({ argumentReady: true }),
      buildModule4SuccessExperience({ requiredPlanCount: 2 }),
      buildModule5SuccessExperience({ bodyCount: 2 }),
      buildModule6SuccessExperience({ sectionCount: 4, wordTotal: 400 }),
      buildModule7SuccessExperience({ revisedEssaySaved: true }),
      buildModule8SuccessExperience({ verifiedLabel: "Ready" }),
      buildModule9ReceiptExperience({
        hasDurableReceipt: true,
        fileName: "essay.pdf",
      }),
    ];
    builders.forEach((result, index) => {
      const moduleNumber = index + 1;
      assert.equal(result.ok, true, `module ${moduleNumber}`);
      assert.ok(result.experience.primaryAction?.label);
      assert.equal(
        result.experience.primaryAction.href,
        PRIMARY_DESTINATIONS[moduleNumber]
      );
    });
  });

  it("projections omit invented completion and prefer Module 7 essay text", () => {
    const empty2 = projectModule2SuccessEvidence({});
    assert.equal(empty2.sourcesReady, false);
    assert.equal(empty2.bothWorksEvidence, false);

    const m7 = projectModule7SuccessEvidence({
      module7: { final_text: "Revised body one. Revised body two." },
      module6: { full_text: "Older draft that should not win." },
      sectionCount: 3,
    });
    assert.equal(m7.revisedEssaySaved, true);
    assert.equal(m7.essaySource, "module7_final_text");
    assert.ok(m7.wordTotal > 0);

    const m6only = projectModule7SuccessEvidence({
      module6: { full_text: "Only module six text remains." },
    });
    assert.equal(m6only.revisedEssaySaved, false);
  });

  it("builders do not write progression or render-time CAS", () => {
    const contract = read("lib/ui/successExperienceContract.js");
    assert.doesNotMatch(contract, /advanceCurrentModuleOnSuccess/);
    assert.doesNotMatch(contract, /logActivity\(/);
  });
});

describe("WP-095 production presentation is always on", () => {
  it("removes the development presentation gate", () => {
    assert.equal(
      fs.existsSync(
        path.join(root, "lib/dev/isSuccessExperienceFoundationEnabled.js")
      ),
      false
    );
    for (const rel of [
      "app/modules/1/success/page.js",
      "app/modules/2/success/page.js",
      "app/modules/7/success/page.js",
      "app/modules/8/success/page.js",
      "app/modules/9/success/page.js",
      "app/dashboard/page.js",
      "components/module3/ModuleThreeSuccessClient.jsx",
      "components/module4/ModuleFourSuccessClient.jsx",
      "components/module5/ModuleFiveSuccessClient.jsx",
      "components/module6/ModuleSixSuccessClient.jsx",
    ]) {
      const src = read(rel);
      assert.doesNotMatch(src, /isSuccessExperienceFoundationEnabled/);
      assert.match(src, /SuccessExperienceShell|CompletedDashboardFoundation/);
    }
  });

  it("keeps fixture and panel strings out of student success contract", () => {
    const src = read("lib/ui/successExperienceContract.js");
    assert.doesNotMatch(src, /seedGuidedApaProtocol|DeveloperTestingPanel/);
    assert.doesNotMatch(src, /WP-094-FIXTURE|WP-095-FIXTURE|synthetic-evidence-seed/i);
  });
});
