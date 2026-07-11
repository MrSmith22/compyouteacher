const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  MLK_RHETORICAL_SITUATIONS,
  MLK_SITUATION_COMPARISON,
} = require("../lib/assignments/rhetoricalSituations.js");

const {
  CONNECTION_OPTIONS,
  STRATEGY_OPTIONS,
  PATTERNS_NO_LENS_COACHING,
  getActivePatternCoaching,
  getConnectionOption,
  getNoticePatternsPhase,
  getPatternSourceContextStrip,
  canContinueFromPatterns,
  countChosenObservationLinks,
} = require("../lib/module3/noticePatternsHelpers.js");

const {
  getCompactSituationSummary,
  getQuotationSituationFooter,
  getRhetoricalSituationModel,
  getSituationComparisonModel,
} = require("../lib/shared/rhetoricalSituationHelpers.js");

const {
  PATTERNS_COMPASS_FOCUS_ID,
  PATTERNS_COMPASS_FRAMING_LINE,
  getPromptCompassModel,
} = require("../lib/module3/promptCompassHelpers.js");

function makeSpeechSource() {
  return {
    sourceType: "speech",
    label: "Speech",
    title: "I Have a Dream",
    audience: "Legacy speech audience",
    purpose: "Legacy speech purpose",
    rhetoricalSituation: MLK_RHETORICAL_SITUATIONS.speech,
  };
}

function makeLetterSource() {
  return {
    sourceType: "letter",
    label: "Letter",
    title: "Letter from Birmingham Jail",
    audience: "Legacy letter audience",
    purpose: "Legacy letter purpose",
    rhetoricalSituation: MLK_RHETORICAL_SITUATIONS.letter,
  };
}

describe("structured rhetorical-situation context", () => {
  it("1. structured Speech context exists", () => {
    const speech = MLK_RHETORICAL_SITUATIONS.speech;
    assert.equal(speech.date, "August 28, 1963");
    assert.match(speech.occasion, /March on Washington for Jobs and Freedom/);
    assert.equal(speech.form, "Public speech");
    assert.match(speech.immediateAudience, /More than 250,000 marchers/);
    assert.match(speech.broaderAudience, /across the nation/);
    assert.match(speech.audienceSituation, /Many marchers/);
    assert.match(speech.historicalContext, /Lincoln Memorial/);
    assert.match(speech.whyFormMatters, /heard out loud/);
  });

  it("2. structured Letter context exists", () => {
    const letter = MLK_RHETORICAL_SITUATIONS.letter;
    assert.equal(letter.date, "April 16, 1963");
    assert.match(letter.occasion, /Birmingham Campaign/);
    assert.match(letter.form, /Written letter/);
    assert.match(letter.immediateAudience, /Eight white Alabama clergymen/);
    assert.match(letter.immediateAudience, /unwise and untimely/);
    assert.match(letter.broaderAudience, /White moderates/);
    assert.match(letter.audienceSituation, /questioned whether/);
    assert.match(letter.whyFormMatters, /point by point/);
  });

  it("3. immediate and broader audiences remain distinct", () => {
    for (const key of ["speech", "letter"]) {
      const situation = MLK_RHETORICAL_SITUATIONS[key];
      assert.ok(situation.immediateAudience);
      assert.ok(situation.broaderAudience);
      assert.notEqual(situation.immediateAudience, situation.broaderAudience);
    }
  });

  it("4. purpose arrays are present", () => {
    assert.ok(MLK_RHETORICAL_SITUATIONS.speech.purposes.length >= 3);
    assert.ok(MLK_RHETORICAL_SITUATIONS.letter.purposes.length >= 3);
    assert.match(
      MLK_RHETORICAL_SITUATIONS.speech.purposes[0],
      /Inspire hope and unite supporters/
    );
    assert.match(
      MLK_RHETORICAL_SITUATIONS.letter.purposes[0],
      /Defend nonviolent direct action/
    );
  });

  it("5. authoritative-source metadata exists", () => {
    const speechSources = MLK_RHETORICAL_SITUATIONS.speech.authoritativeSources;
    const letterSources = MLK_RHETORICAL_SITUATIONS.letter.authoritativeSources;
    assert.equal(speechSources.length, 3);
    assert.equal(letterSources.length, 2);
    assert.ok(
      speechSources.every((source) => source.name && source.url.startsWith("https://"))
    );
    assert.ok(
      letterSources.every((source) =>
        source.url.startsWith("https://kinginstitute.stanford.edu/")
      )
    );
    assert.ok(
      MLK_SITUATION_COMPARISON.caveat.includes(
        "tendencies to test against the text"
      )
    );
  });

  it("6. missing structured context falls back safely", () => {
    const legacyOnly = getRhetoricalSituationModel({
      sourceType: "speech",
      label: "Speech",
      title: "I Have a Dream",
      audience: "A large crowd at the March on Washington",
      purpose: "Inspire hope and call the nation to act",
    });
    assert.equal(legacyOnly.hasStructuredContext, false);
    assert.equal(legacyOnly.hasRenderableContext, true);
    assert.equal(
      legacyOnly.immediateAudience,
      "A large crowd at the March on Washington"
    );
    assert.deepEqual(legacyOnly.purposes, [
      "Inspire hope and call the nation to act",
    ]);

    const nothing = getRhetoricalSituationModel({
      sourceType: "speech",
      title: "Untitled",
    });
    assert.equal(nothing.hasRenderableContext, false);

    const emptyInput = getRhetoricalSituationModel(undefined);
    assert.equal(emptyInput.hasRenderableContext, false);
  });

  it("7. compare mode includes both source labels", () => {
    const speech = getRhetoricalSituationModel(makeSpeechSource());
    const letter = getRhetoricalSituationModel(makeLetterSource());
    assert.equal(speech.label, "Speech");
    assert.equal(letter.label, "Letter");
    assert.equal(speech.hasRenderableContext, true);
    assert.equal(letter.hasRenderableContext, true);

    const comparison = getSituationComparisonModel(MLK_SITUATION_COMPARISON);
    assert.equal(comparison.hasRenderableComparison, true);
    assert.equal(comparison.shared.length, 4);
    assert.equal(comparison.different.length, 4);
    assert.match(comparison.caveat, /not rules/);
  });

  it("8. compact mode does not crash with partial context", () => {
    const partial = getCompactSituationSummary({
      sourceType: "letter",
      label: "Letter",
      title: "Letter from Birmingham Jail",
      rhetoricalSituation: { form: "Written letter" },
    });
    assert.equal(partial.form, "Written letter");
    assert.equal(partial.audienceLine, "");
    assert.deepEqual(partial.purposeLines, []);

    const empty = getCompactSituationSummary({});
    assert.equal(empty.hasRenderableContext, false);

    const full = getCompactSituationSummary(makeSpeechSource());
    assert.equal(full.hasRenderableContext, true);
    assert.equal(full.purposeLines.length, 2);
    assert.match(full.audienceLine, /marchers/);
  });
});

describe("PATTERNS audience correction", () => {
  const allOptionText = CONNECTION_OPTIONS.concat(STRATEGY_OPTIONS)
    .flatMap((option) => [
      option.label || "",
      option.coaching || "",
      option.starter || "",
      ...(option.coachingSteps || []),
    ])
    .join("\n");

  it("9. PATTERNS no longer contains hearing both passages", () => {
    assert.doesNotMatch(allOptionText, /hearing both passages/i);
    assert.doesNotMatch(allOptionText, /a listener or reader/i);
    assert.doesNotMatch(PATTERNS_NO_LENS_COACHING, /listener or reader/i);
  });

  it("10. comparative audience coaching never uses one shared audience", () => {
    const audienceOption = getConnectionOption("audience");
    const differentOption = getConnectionOption("different_audiences");
    const comparativeText = [audienceOption, differentOption]
      .flatMap((option) => [
        option.label,
        option.starter,
        ...(option.coachingSteps || []),
      ])
      .join("\n");

    assert.doesNotMatch(comparativeText, /\bthe audience\b/i);
    assert.doesNotMatch(comparativeText, /These passages affect the audience by/);
    assert.match(comparativeText, /audiences/);
  });

  it("11. audience option uses the exact different-audiences framing", () => {
    const option = getConnectionOption("audience");
    assert.equal(
      option.label,
      "Do they create a similar effect on their different audiences?"
    );
  });

  it("12. audience coaching follows Speech → Letter → Compare", () => {
    const coaching = getActivePatternCoaching({ connectionChoice: "audience" });
    assert.equal(coaching.coachingSteps.length, 3);
    assert.match(coaching.coachingSteps[0], /^First consider the speech/);
    assert.match(coaching.coachingSteps[0], /marchers and the watching nation/);
    assert.match(coaching.coachingSteps[1], /^Then consider the letter/);
    assert.match(coaching.coachingSteps[1], /clergymen and other doubtful readers/);
    assert.match(coaching.coachingSteps[2], /^Now compare/);
    assert.equal(
      coaching.starter,
      "The speech’s audience might…, while the letter’s readers might…"
    );
  });

  it("13. same-appeal option says rhetorical appeal", () => {
    const option = getConnectionOption("strategy");
    assert.equal(option.label, "Do the quotations use the same rhetorical appeal?");
    assert.doesNotMatch(option.label, /rhetorical strategy/);
    assert.equal(option.needsStrategyFollowUp, true);

    // Ethos/pathos/logos follow-up still works.
    const followUp = getActivePatternCoaching({
      connectionChoice: "strategy",
      strategyChoice: "pathos",
    });
    assert.equal(followUp.awaitingStrategy, false);
    assert.match(followUp.coaching, /feeling/i);
  });

  it("14. different-appeals/similar-purpose option exists", () => {
    const option = getConnectionOption("different_appeals");
    assert.equal(option.label, "Does King use different appeals for a similar purpose?");
    assert.match(option.coachingSteps[0], /speech/);
    assert.match(option.coachingSteps[1], /letter/);
    assert.match(option.coachingSteps[2], /broad goal/);
  });

  it("15. different-audiences option exists with hedged coaching", () => {
    const option = getConnectionOption("different_audiences");
    assert.equal(
      option.label,
      "Do they affect their audiences differently because the audiences differ?"
    );
    assert.match(option.coachingSteps[0], /Many marchers/);
    assert.match(option.coachingSteps[1], /clergymen questioned/i);
    assert.match(option.coachingSteps[2], /different starting points/);
    assert.doesNotMatch(option.coachingSteps.join(" "), /everyone|all of them/i);
  });

  it("16. shared broad-purpose option exists", () => {
    const option = getConnectionOption("purpose");
    assert.equal(
      option.label,
      "Do they share a broad purpose even though each work has its own immediate goal?"
    );
    assert.match(
      option.coachingSteps[0],
      /speech can inspire and mobilize, while the letter can defend/
    );
    assert.match(option.coachingSteps[1], /What do you notice/);
  });

  it("17. no guided choice writes an observation", () => {
    for (const option of CONNECTION_OPTIONS) {
      // Starters are open-ended hints, never completed sentences.
      if (option.starter) {
        assert.ok(
          option.starter.includes("…"),
          `starter for ${option.id} should be an open-ended hint`
        );
      }
      assert.equal("observationText" in option, false);
      assert.equal("autofill" in option, false);
    }

    const coaching = getActivePatternCoaching({ connectionChoice: "audience" });
    assert.equal("observationText" in coaching, false);
  });

  it("18. existing pattern persistence format remains unchanged", () => {
    // Persisted notices remain { id, text, evidenceIds }; guided choices are UI-only.
    const notice = {
      id: "pattern-1",
      text: "Both works press urgency on their different audiences.",
      evidenceIds: ["q1", "q2"],
    };
    assert.equal(countChosenObservationLinks(notice, ["q1", "q2"]), 2);
    assert.deepEqual(Object.keys(notice), ["id", "text", "evidenceIds"]);
  });

  it("19. two-observation and evidence-link gates remain unchanged", () => {
    assert.equal(
      canContinueFromPatterns({
        filledObservationCount: 1,
        selectedPattern: { text: "x", evidenceIds: ["q1", "q2"] },
        groupEvidenceIds: ["q1", "q2"],
      }),
      false
    );
    assert.equal(
      canContinueFromPatterns({
        filledObservationCount: 2,
        selectedPattern: { text: "x", evidenceIds: ["q1"] },
        groupEvidenceIds: ["q1", "q2"],
      }),
      false
    );
    assert.equal(
      canContinueFromPatterns({
        filledObservationCount: 2,
        selectedPattern: { text: "x", evidenceIds: ["q1", "q2"] },
        groupEvidenceIds: ["q1", "q2"],
      }),
      true
    );

    // New option ids still unlock the first observation field.
    const phase = getNoticePatternsPhase({
      connectionChoice: "different_audiences",
      firstObservationText: "",
      filledObservationCount: 0,
    });
    assert.equal(phase.showFirstObservation, true);
  });

  it("20. prompt compass emphasizes comparison on PATTERNS", () => {
    assert.equal(PATTERNS_COMPASS_FOCUS_ID, "compare");
    assert.match(PATTERNS_COMPASS_FRAMING_LINE, /look inside your chosen group/);
    assert.match(
      PATTERNS_COMPASS_FRAMING_LINE,
      /similarity, difference, or relationship/
    );

    const model = getPromptCompassModel({
      assignmentPrompt: "Full prompt",
      focusQuestionId: PATTERNS_COMPASS_FOCUS_ID,
    });
    const focused = model.questions.filter((question) => question.isFocus);
    assert.equal(focused.length, 1);
    assert.equal(focused[0].id, "compare");
  });

  it("provides in-card Form/Audience/Purpose footers derived from assignment data", () => {
    const speechFooter = getQuotationSituationFooter(makeSpeechSource());
    assert.equal(speechFooter.sourceType, "speech");
    assert.equal(speechFooter.label, "Speech");
    assert.equal(speechFooter.form, "Public speech at the March on Washington");
    assert.equal(speechFooter.audience, "Marchers and a broader national audience");
    assert.equal(
      speechFooter.purpose,
      "Inspire, unite, create urgency, and call the nation to act"
    );

    const letterFooter = getQuotationSituationFooter(makeLetterSource());
    assert.equal(letterFooter.sourceType, "letter");
    assert.equal(letterFooter.label, "Letter");
    assert.equal(letterFooter.form, "Written reply from Birmingham Jail");
    assert.equal(letterFooter.audience, "Clergymen and other doubtful readers");
    assert.equal(
      letterFooter.purpose,
      "Defend direct action, answer criticism, and explain why justice cannot wait"
    );

    // Each card exposes Form, Audience, and Purpose.
    for (const footer of [speechFooter, letterFooter]) {
      assert.ok(footer.form);
      assert.ok(footer.audience);
      assert.ok(footer.purpose);
    }

    // Detached strips no longer render.
    assert.equal(getPatternSourceContextStrip("speech"), null);
    assert.equal(getPatternSourceContextStrip("letter"), null);
    assert.equal(getPatternSourceContextStrip(), null);

    // Missing structured context degrades safely.
    assert.equal(getQuotationSituationFooter({}), null);
    assert.equal(getQuotationSituationFooter(undefined), null);

    const legacyOnly = getQuotationSituationFooter({
      sourceType: "speech",
      label: "Speech",
      audience: "A large crowd",
      purpose: "Inspire hope",
    });
    assert.equal(legacyOnly.audience, "A large crowd");
    assert.equal(legacyOnly.purpose, "Inspire hope");
  });
});
