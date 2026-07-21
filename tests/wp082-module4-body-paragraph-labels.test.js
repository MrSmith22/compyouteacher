/**
 * WP-082 corrective — Module 4 Body Paragraph N section labels.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const {
  getBodyParagraphLabel,
  getIntroductionLabel,
  getConclusionLabel,
} = require("../lib/essaySectionLabels.js");
const {
  pointStepQuestion,
  jobStepQuestion,
} = require("../lib/module4/module4PointJobHelpers.js");
const {
  MODULE4_HANDOFF_CTA_LABEL,
} = require("../lib/module4/module4HandoffHelpers.js");
const {
  formatAlreadyUsedLabel,
} = require("../lib/module4/module4EvidenceCoachingHelpers.js");
const {
  reasoningReadyNextActionLabel,
} = require("../lib/module4/module4ParagraphPlanArtifactHelpers.js");

const read = (rel) =>
  fs.readFileSync(path.join(__dirname, "..", rel), "utf8");

describe("WP-082 Module 4 Body Paragraph N labels", () => {
  it("uses Body Paragraph N for named essay sections", () => {
    assert.equal(getBodyParagraphLabel(0), "Body Paragraph 1");
    assert.equal(getBodyParagraphLabel(1), "Body Paragraph 2");
    assert.equal(getIntroductionLabel(), "Introduction");
    assert.equal(getConclusionLabel(), "Conclusion");
  });

  it("surfaces Body Paragraph N in Module 4 presentation and cards", () => {
    const presentation = read("components/module4/module4StepPresentation.js");
    assert.match(presentation, /Body Paragraph \$\{n\}/);
    assert.match(presentation, /What point will \$\{sectionLabel\} prove\?/);
    assert.doesNotMatch(
      presentation,
      /What point will Paragraph \$\{n\} prove\?/
    );

    const compact = read("components/module4/ModuleFourCompactPlanCard.jsx");
    assert.match(compact, /Body Paragraph \{card\.paragraphNumber\}/);
    assert.doesNotMatch(compact, /(?<!Body )Paragraph \{card\.paragraphNumber\}/);

    const moduleFour = read("components/ModuleFour.js");
    assert.match(moduleFour, /getBodyParagraphLabel/);
    assert.doesNotMatch(
      moduleFour,
      /Paragraph 1: build a paragraph that proves part of your thesis/
    );
  });

  it("keeps generic lowercase paragraph pedagogy without bare Paragraph N names", () => {
    assert.equal(pointStepQuestion(1), "What point will Body Paragraph 1 prove?");
    assert.equal(
      jobStepQuestion(2),
      "How will Body Paragraph 2 do its part in the essay?"
    );
    assert.equal(MODULE4_HANDOFF_CTA_LABEL, "Start Body Paragraph 1");
    assert.equal(
      formatAlreadyUsedLabel([1]),
      "Already used in Body Paragraph 1"
    );
    assert.equal(
      reasoningReadyNextActionLabel({ paragraphIndex: 0 }),
      "Plan Body Paragraph 2"
    );
  });
});
