/**
 * WP-082 — Introduction / Conclusion health + revision diagnostics.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  diagnoseIntroductionHealth,
} = require("../lib/artifacts/introductionHealth.js");
const {
  diagnoseConclusionHealth,
} = require("../lib/artifacts/conclusionHealth.js");
const {
  diagnoseIntroductionRevision,
  getIntroductionRevisionFromDraftMeta,
  setIntroductionRevisionInDraftMeta,
  ensureRevisionBaseline,
  applyRevisionCompareState,
} = require("../lib/module7/introductionDiagnostics.js");
const {
  diagnoseConclusionRevision,
} = require("../lib/module7/conclusionDiagnostics.js");
const {
  diagnoseBodyParagraphHealth,
} = require("../lib/artifacts/bodyParagraphHealth.js");

const BANNED =
  /diagnostic|provenance|leverage|heuristic|artifact|alignment score|student-owned/i;

describe("WP-082 intro/conclusion diagnostics", () => {
  it("does not require body evidence for introduction health", () => {
    const health = diagnoseIntroductionHealth({
      assembledProse:
        "Civil rights speakers faced different audiences. King wrote to clergymen and spoke to crowds. He adjusted trust-building so each group would listen. King adjusts ethos and pathos by audience.",
      thesis: "King adjusts ethos and pathos by audience.",
      assignmentQuestion: "How does King adjust persuasion?",
    });
    assert.equal(
      health.some((s) => s.id === "missing_evidence"),
      false
    );
    const body = diagnoseBodyParagraphHealth({
      assembledProse: "Short.",
      evidence: [],
    });
    assert.ok(body.some((s) => s.id === "missing_evidence"));
  });

  it("flags missing thesis in the introduction", () => {
    const health = diagnoseIntroductionHealth({
      assembledProse:
        "Readers need context about the civil rights struggle and the two audiences King addressed in writing and speech before any claim appears.",
      thesis: "King adjusts ethos and pathos by audience.",
    });
    assert.ok(health.some((s) => s.id === "missing_thesis"));
  });

  it("flags verbatim thesis copy in the conclusion", () => {
    const thesis = "King adjusts ethos and pathos by audience.";
    const health = diagnoseConclusionHealth({
      assembledProse: thesis,
      thesis,
      bodyPurposes: ["Ethos", "Pathos"],
    });
    assert.ok(health.some((s) => s.id === "verbatim_thesis"));
  });

  it("flags listing body points without synthesis", () => {
    const health = diagnoseConclusionHealth({
      assembledProse:
        "First, Body Paragraph 1 proves ethos. Second, Body Paragraph 2 proves pathos. Third, Body Paragraph 3 wraps up.",
      thesis: "King adjusts ethos and pathos by audience.",
      bodyPurposes: ["Ethos in the letter", "Pathos in the speech"],
    });
    assert.ok(health.some((s) => s.id === "lists_body_points"));
  });

  it("flags new evidence at the end as advisory without rewriting prose", () => {
    const prose =
      "King matches persuasion to audience across both texts. The comparison shows that trust work differs by crowd. For example, he writes \"My Dear Fellow Clergymen\" at the very end.";
    const health = diagnoseConclusionHealth({
      assembledProse: prose,
      thesis: "King adjusts ethos and pathos by audience.",
    });
    assert.ok(health.some((s) => s.id === "new_evidence_at_end"));
    // Diagnostics never mutate the input prose.
    assert.equal(prose.includes("My Dear Fellow Clergymen"), true);
  });

  it("does not require transition-to-next-paragraph for conclusion", () => {
    const health = diagnoseConclusionHealth({
      assembledProse:
        "Across both texts, King adjusts how he earns trust. The letter and speech work together. The comparison shows matching rhetoric to audience. End with purpose.",
      thesis: "King adjusts ethos and pathos by audience.",
      bodyPurposes: ["Ethos", "Pathos"],
    });
    assert.equal(
      health.some((s) => /transition/i.test(s.id) || /transition/i.test(s.message)),
      false
    );
  });

  it("recommends student-facing targets without banned internal phrases", () => {
    const intro = diagnoseIntroductionRevision({
      assembledProse:
        "Context only without arriving at the planned claim about audience.",
      thesis: "King adjusts ethos and pathos by audience.",
    });
    assert.ok(intro.recommendedTarget?.title);
    assert.doesNotMatch(intro.recommendedTarget.title, BANNED);
    assert.doesNotMatch(intro.recommendedTarget.teach, BANNED);
    assert.doesNotMatch(intro.confidenceNote, BANNED);

    const conclusion = diagnoseConclusionRevision({
      assembledProse: "King adjusts ethos and pathos by audience.",
      thesis: "King adjusts ethos and pathos by audience.",
    });
    assert.equal(conclusion.recommendedTarget.id, "fresh_thesis");
    assert.doesNotMatch(conclusion.recommendedTarget.title, BANNED);
  });

  it("captures untouched revision baseline on unseeded path", () => {
    const original =
      "Original introduction from Module 6 that has not been revised yet.";
    const baseline = ensureRevisionBaseline(null, { prose: original });
    assert.equal(baseline.before, original);
    assert.equal(baseline.after, original);

    const again = ensureRevisionBaseline(baseline, {
      prose: "Edited after baseline — must not replace Before.",
    });
    assert.equal(again, null);

    const afterEdit = applyRevisionCompareState(baseline, {
      prose: "Edited introduction after diagnosis.",
      targetId: "thesis_destination",
      clearerConfirmed: true,
    });
    assert.equal(afterEdit.before, original);
    assert.equal(afterEdit.after, "Edited introduction after diagnosis.");

    const meta = setIntroductionRevisionInDraftMeta(null, afterEdit);
    const loaded = getIntroductionRevisionFromDraftMeta(meta);
    assert.equal(loaded.before, original);
    assert.equal(loaded.clearerConfirmed, true);
  });
});
