/**
 * Module 7 Conclusion → Final Review navigation bounds.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const bounds = require("../lib/module7/module7StepBounds.js");

function readSrc(rel) {
  return fs.readFileSync(path.join(__dirname, rel), "utf8");
}

describe("Module 7 Final Review navigation bounds", () => {
  const sectionCount = 5; // intro + 3 body + conclusion

  it("1. Conclusion is at index sectionSteps.length", () => {
    assert.equal(bounds.isModule7ConclusionIndex(sectionCount, sectionCount), true);
    assert.equal(bounds.getModule7StepKind(sectionCount, sectionCount), "section");
    assert.equal(bounds.getModule7MaxStepIndex(sectionCount), sectionCount + 1);
    assert.equal(bounds.getModule7TotalSteps(sectionCount), sectionCount + 2);
  });

  it("2. Keep going from Conclusion advances to Final Review", () => {
    const next = bounds.advanceModule7StepIndex(sectionCount, sectionCount);
    assert.equal(next, sectionCount + 1);
    assert.equal(bounds.getModule7StepKind(next, sectionCount), "final-review");
  });

  it("3. Bounds guard does not clamp a valid Final Review index", () => {
    const finalIndex = sectionCount + 1;
    assert.equal(
      bounds.clampModule7StepIndex(finalIndex, sectionCount),
      finalIndex
    );
    const modSeven = readSrc("../components/ModuleSeven.js");
    assert.ok(modSeven.includes("clampModule7StepIndex"));
    assert.ok(modSeven.includes("getModule7MaxStepIndex"));
    assert.equal(modSeven.includes("const maxIndex = sectionSteps.length;"), false);
  });

  it("4. Final Review UI wires Compare, essay, Back, and Finish", () => {
    const modSeven = readSrc("../components/ModuleSeven.js");
    assert.ok(
      modSeven.includes('revisionStage={isFinalReviewStep ? "compare" : "change"}')
    );
    assert.ok(modSeven.includes("MODULE7_COMPARE_STAGE_LABEL") === false);
    assert.ok(modSeven.includes("isFinalReviewStep"));
    assert.ok(modSeven.includes("EssayProseView"));
    assert.ok(modSeven.includes("Finish revising and continue"));
    assert.ok(modSeven.includes("goBack"));
    assert.ok(modSeven.includes("{!isFirstStep ? ("));

    const card = readSrc("../components/module7/ModuleSevenStrategyCard.jsx");
    assert.ok(card.includes("MODULE7_COMPARE_STAGE_LABEL"));
    assert.ok(card.includes("NOW: COMPARE") || card.includes("MODULE7_COMPARE_STAGE_LABEL"));
  });

  it("5. Back from Final Review returns to Conclusion", () => {
    const back = bounds.retreatModule7StepIndex(sectionCount + 1, sectionCount);
    assert.equal(back, sectionCount);
    assert.equal(bounds.isModule7ConclusionIndex(back, sectionCount), true);
  });

  it("6. Index beyond Final Review is clamped safely", () => {
    assert.equal(
      bounds.clampModule7StepIndex(sectionCount + 5, sectionCount),
      sectionCount + 1
    );
    assert.equal(
      bounds.advanceModule7StepIndex(sectionCount + 1, sectionCount),
      sectionCount + 1
    );
  });

  it("7. Read Aloud and section indexes are unchanged", () => {
    assert.equal(bounds.getModule7StepKind(0, sectionCount), "read-aloud");
    assert.equal(bounds.clampModule7StepIndex(0, sectionCount), 0);
    assert.equal(bounds.advanceModule7StepIndex(0, sectionCount), 1);
    assert.equal(bounds.getModule7StepKind(1, sectionCount), "section");
    assert.equal(bounds.getModule7StepKind(sectionCount, sectionCount), "section");
    assert.equal(bounds.retreatModule7StepIndex(0, sectionCount), 0);
    assert.equal(bounds.getModule7StepKind(-1, sectionCount), "invalid");
    assert.equal(bounds.clampModule7StepIndex(-3, sectionCount), 0);
  });
});
