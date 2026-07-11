const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  PROMPT_COMPASS_HEADING,
  PROMPT_COMPASS_QUESTIONS,
  REVIEW_COMPASS_FOCUS_ID,
  REVIEW_COMPASS_FRAMING_LINE,
  getPromptCompassModel,
} = require("../lib/module3/promptCompassHelpers.js");

const {
  REVIEW_HELP_GROUPING_LENSES,
  REVIEW_PRIMARY_GROUPING_LENSES,
  REVIEW_PROMPT_PRESENTATION,
  findDuplicateCluster,
  getAppealChipLabel,
  getReviewEvidencePhase,
  getSelectionSourceMix,
} = require("../lib/module3/reviewEvidenceHelpers.js");

const SAMPLE_PROMPT = `Write a compare and contrast essay explaining how Dr. Martin Luther King Jr. uses ethos, pathos, and logos in both "I Have a Dream" and "Letter from Birmingham Jail."

In your essay, you must:
• Compare how King uses rhetorical appeals in both texts`;

function quote(id, sourceType, tags = []) {
  return { id, sourceType, quote: `Quotation ${id}`, tags };
}

describe("prompt compass", () => {
  it("1. shows all four assignment requirements", () => {
    const model = getPromptCompassModel({ assignmentPrompt: SAMPLE_PROMPT });
    assert.equal(model.heading, PROMPT_COMPASS_HEADING);
    assert.equal(model.questions.length, 4);
    assert.match(model.questions[0].text, /ethos \(trust\), pathos \(feeling\), or logos \(reasoning\)/);
    assert.match(model.questions[1].text, /similar or different between the speech and the letter/);
    assert.match(model.questions[2].text, /audience and purpose/);
    assert.match(model.questions[3].text, /quotations from both works/);
  });

  it("2. full assignment text comes from the supplied prop", () => {
    const model = getPromptCompassModel({ assignmentPrompt: SAMPLE_PROMPT });
    assert.equal(model.fullPrompt, SAMPLE_PROMPT);
    assert.equal(model.hasFullPrompt, true);

    const empty = getPromptCompassModel({ assignmentPrompt: "" });
    assert.equal(empty.hasFullPrompt, false);
  });

  it("3. REVIEW emphasizes the comparison question", () => {
    assert.equal(REVIEW_COMPASS_FOCUS_ID, "compare");
    const model = getPromptCompassModel({
      assignmentPrompt: SAMPLE_PROMPT,
      focusQuestionId: REVIEW_COMPASS_FOCUS_ID,
    });
    const focused = model.questions.filter((question) => question.isFocus);
    assert.equal(focused.length, 1);
    assert.equal(focused[0].id, "compare");
    assert.match(REVIEW_COMPASS_FRAMING_LINE, /similarity or difference/);
    assert.equal(model.focusMarker, "Focus right now");
  });

  it("4. full prompt is not duplicated in the old Reference disclosure", () => {
    assert.equal(REVIEW_PROMPT_PRESENTATION.component, "prompt_compass");
    assert.equal(REVIEW_PROMPT_PRESENTATION.legacyReferenceDisclosure, false);
    assert.equal(REVIEW_PROMPT_PRESENTATION.fullPromptDuplicated, false);
  });

  it("compass questions carry no completion state", () => {
    for (const question of PROMPT_COMPASS_QUESTIONS) {
      assert.equal("done" in question, false);
      assert.equal("complete" in question, false);
    }
  });
});

describe("appeal chip helper", () => {
  it("5. recognizes ethos case-insensitively", () => {
    assert.equal(getAppealChipLabel(["Ethos"]), "Ethos · trust");
    assert.equal(getAppealChipLabel(["ETHOS"]), "Ethos · trust");
  });

  it("6. recognizes pathos case-insensitively", () => {
    assert.equal(getAppealChipLabel(["pathos"]), "Pathos · feeling");
    assert.equal(getAppealChipLabel(["Pathos "]), "Pathos · feeling");
  });

  it("7. recognizes logos case-insensitively", () => {
    assert.equal(getAppealChipLabel(["LoGoS"]), "Logos · reasoning");
  });

  it("8. ignores unrelated implementation tags", () => {
    assert.equal(
      getAppealChipLabel(["t-chart", "teacher-guided", "noticing", "pathos"]),
      "Pathos · feeling"
    );
  });

  it("9. returns no label when no appeal is known", () => {
    assert.equal(getAppealChipLabel(["t-chart", "teacher-guided"]), "");
    assert.equal(getAppealChipLabel([]), "");
    assert.equal(getAppealChipLabel(undefined), "");
  });
});

describe("live selection source mix", () => {
  it("10. zero selected produces no source-mix coaching", () => {
    const mix = getSelectionSourceMix([]);
    assert.equal(mix.show, false);
    assert.equal(mix.countLine, "");
    assert.equal(mix.message, "");
  });

  it("11. one Speech selection reports Speech: 1 · Letter: 0", () => {
    const mix = getSelectionSourceMix([quote("a", "speech")]);
    assert.equal(mix.show, true);
    assert.equal(mix.countLine, "Speech: 1 · Letter: 0");
    assert.equal(mix.message, "");
  });

  it("12. mixed selection reports counts and the both-works line", () => {
    const mix = getSelectionSourceMix([
      quote("a", "speech"),
      quote("b", "letter"),
    ]);
    assert.equal(mix.countLine, "Speech: 1 · Letter: 1");
    assert.equal(mix.message, "This group includes both works.");
    assert.doesNotMatch(mix.message, /great|perfect|successful/i);
  });

  it("13. speech-only 2+ selection produces the exploration message", () => {
    const mix = getSelectionSourceMix([
      quote("a", "speech"),
      quote("b", "speech"),
    ]);
    assert.equal(mix.countLine, "Speech: 2 · Letter: 0");
    assert.equal(
      mix.message,
      "This group uses only the speech. That’s fine while exploring—your final argument will need evidence from both works."
    );
  });

  it("14. letter-only 2+ selection produces the exploration message", () => {
    const mix = getSelectionSourceMix([
      quote("a", "letter"),
      quote("b", "letter"),
    ]);
    assert.equal(
      mix.message,
      "This group uses only the letter. That’s fine while exploring—your final argument will need evidence from both works."
    );
  });

  it("15. source mix does not alter save readiness", () => {
    // Speech-only selection: naming and saving still unlock from count + name.
    const phase = getReviewEvidencePhase({
      selectedCount: 2,
      groupName: "Urgency",
      savedGroupCount: 0,
    });
    assert.equal(phase.showNaming, true);
    assert.equal(phase.canSave, true);

    const mix = getSelectionSourceMix([
      quote("a", "speech"),
      quote("b", "speech"),
    ]);
    assert.equal("canSave" in mix, false);
    assert.equal("blocked" in mix, false);
  });

  it("16. existing duplicate-group behavior remains unchanged", () => {
    const clusters = [{ id: "cluster-1", name: "Hope", evidenceIds: ["q1", "q2"] }];
    assert.equal(findDuplicateCluster(clusters, ["q2", "q1"])?.id, "cluster-1");
    assert.equal(findDuplicateCluster(clusters, ["q1", "q3"]), null);
  });

  it("17. helpers do not mutate evidence data", () => {
    const evidence = Object.freeze([
      Object.freeze(quote("a", "speech", Object.freeze(["Pathos", "t-chart"]))),
      Object.freeze(quote("b", "letter", Object.freeze([]))),
    ]);

    assert.doesNotThrow(() => {
      getSelectionSourceMix(evidence);
      getAppealChipLabel(evidence[0].tags);
    });
    assert.equal(evidence[0].tags[0], "Pathos");
  });
});

describe("grouping lenses", () => {
  it("shows exactly two lenses in the primary workspace", () => {
    assert.equal(REVIEW_PRIMARY_GROUPING_LENSES.length, 2);
    assert.match(REVIEW_PRIMARY_GROUPING_LENSES[0], /same rhetorical appeal/);
    assert.match(REVIEW_PRIMARY_GROUPING_LENSES[1], /problem or value/);
  });

  it("keeps the remaining lenses in Need Help", () => {
    assert.equal(REVIEW_HELP_GROUPING_LENSES.length, 5);
    assert.ok(
      REVIEW_HELP_GROUPING_LENSES.some((lens) =>
        /different appeals for a similar purpose/.test(lens)
      )
    );
    // No overlap with the primary lenses.
    for (const lens of REVIEW_PRIMARY_GROUPING_LENSES) {
      assert.equal(REVIEW_HELP_GROUPING_LENSES.includes(lens), false);
    }
  });
});
