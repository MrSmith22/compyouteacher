const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  IDEA_LEADING_QUESTIONS,
  IDEA_READY_MESSAGE,
  IDEA_SENTENCE_STARTERS,
  IDEA_STARTERS_LABEL,
  IDEA_STATEMENT_BLOCKED_MESSAGE,
  IDEA_STATEMENT_MINIMUM,
  IDEA_WHY_BLOCKED_MESSAGE,
  IDEA_WHY_LEADING_QUESTIONS,
  IDEA_WHY_MINIMUM,
  IDEA_WHY_NOT_THESIS_NOTE,
  canContinueFromExploreIdea,
  getExploreIdeaContinueHint,
  getExploreIdeaPhase,
  getExploreIdeaReadyMessage,
  isIdeaStatementReady,
  isIdeaWhyReady,
} = require("../lib/module3/exploreIdeaHelpers.js");

const {
  IDEA_COMPASS_FOCUS_ID,
  IDEA_COMPASS_FRAMING_LINE,
  getPromptCompassModel,
} = require("../lib/module3/promptCompassHelpers.js");

const {
  getQuotationSituationFooter,
} = require("../lib/shared/rhetoricalSituationHelpers.js");

const {
  MODULE_THREE_PHASES,
  getInitialModuleThreePhase,
} = require("../lib/module3/moduleThreePhaseModel.js");

describe("IDEA — Prompt Compass focus and framing", () => {
  it("1. IDEA focuses the comparison question with the approved framing line", () => {
    assert.equal(IDEA_COMPASS_FOCUS_ID, "compare");
    assert.equal(
      IDEA_COMPASS_FRAMING_LINE,
      "Right now, ask what the similarity, difference, or relationship you noticed might reveal about King’s rhetorical choices."
    );

    const model = getPromptCompassModel({
      assignmentPrompt: "Compare how King uses rhetorical appeals.",
      focusQuestionId: IDEA_COMPASS_FOCUS_ID,
    });
    const focused = model.questions.filter((q) => q.isFocus);
    assert.equal(focused.length, 1);
    assert.equal(focused[0].id, "compare");

    // Orientation tool only: no completion state, no gate fields.
    for (const question of model.questions) {
      assert.equal("complete" in question, false);
      assert.equal("done" in question, false);
      assert.equal("locked" in question, false);
    }
  });
});

describe("IDEA — comparison-oriented leading questions", () => {
  it("2. leading questions are the approved comparison lenses", () => {
    assert.equal(IDEA_LEADING_QUESTIONS.length, 5);
    const joined = IDEA_LEADING_QUESTIONS.join(" ");
    assert.match(joined, /similarity/i);
    assert.match(joined, /difference/i);
    assert.match(joined, /same appeal differently in the speech and the letter/i);
    assert.match(joined, /different appeals to accomplish a related purpose/i);
    assert.match(joined, /larger idea about King’s rhetorical choices/i);
  });

  it("3. audience/purpose interpretation coaching keeps the established appeal gloss", () => {
    const joined = IDEA_LEADING_QUESTIONS.join(" ");
    assert.match(joined, /audience/i);
    assert.match(joined, /purpose/i);
    // The established explanation of "rhetorical appeal" is retained.
    assert.match(joined, /ethos—trust/);
    assert.match(joined, /pathos—feeling/);
    assert.match(joined, /logos—reasoning/);
  });
});

describe("IDEA — optional sentence starters", () => {
  it("4. starters are labeled optional and never auto-fill the student's response", () => {
    assert.deepEqual(IDEA_SENTENCE_STARTERS, [
      "This pattern might show that King…",
      "In both works, King seems to…",
      "The difference between these quotations might matter because…",
      "King may change his approach because the audiences…",
      "Even though the situations are different, both quotations…",
    ]);
    assert.match(IDEA_STARTERS_LABEL, /optional/i);
    assert.match(IDEA_STARTERS_LABEL, /Ways to begin/);

    // No helper writes starter text into the saved statement: an empty
    // statement remains empty and not ready.
    const phase = getExploreIdeaPhase({ statement: "", whyMatters: "" });
    assert.equal(phase.statementReady, false);
    assert.equal(phase.primaryPhase, "interpret");
  });
});

describe("IDEA — fields and persistence shape", () => {
  it("5. the artifact still uses statement + whyMatters with the same helpers", () => {
    // Persistence shape: statement / whyMatters only. The phase helper reads
    // exactly these fields; nothing new is required to continue.
    assert.equal(typeof isIdeaStatementReady, "function");
    assert.equal(typeof isIdeaWhyReady, "function");

    const ok = canContinueFromExploreIdea({
      statement: "King may be adapting trust for doubtful readers.",
      whyMatters: "It could explain a difference between the works.",
    });
    assert.equal(ok, true);

    // No extra required keys: unknown fields are ignored, not demanded.
    const phase = getExploreIdeaPhase({
      statement: "King may be adapting trust for doubtful readers.",
      whyMatters: "It could explain a difference between the works.",
      claim: "",
      thesis: "",
    });
    assert.equal(phase.canContinue, true);
  });

  it("6. existing progressive-disclosure length gates are unchanged", () => {
    assert.equal(IDEA_STATEMENT_MINIMUM, 15);
    assert.equal(IDEA_WHY_MINIMUM, 15);

    const short = getExploreIdeaPhase({ statement: "Too short.", whyMatters: "" });
    assert.equal(short.statementReady, false);
    assert.equal(short.showWhyMatters, false);

    const statementOnly = getExploreIdeaPhase({
      statement: "This is a long enough developing idea.",
      whyMatters: "",
    });
    assert.equal(statementOnly.statementReady, true);
    assert.equal(statementOnly.showWhyMatters, true);
    assert.equal(statementOnly.whyReady, false);
    assert.equal(statementOnly.canContinue, false);
    assert.equal(statementOnly.primaryPhase, "why");

    const both = getExploreIdeaPhase({
      statement: "This is a long enough developing idea.",
      whyMatters: "This is a long enough why-matters answer.",
    });
    assert.equal(both.canContinue, true);
    assert.equal(both.showReadyFeedback, true);
    assert.equal(both.primaryPhase, "ready");
  });
});

describe("IDEA — rhetorical-situation cues", () => {
  it("7. situation cues degrade safely when source context is unavailable", () => {
    assert.equal(getQuotationSituationFooter({}), null);
    assert.equal(getQuotationSituationFooter(null ?? {}), null);
    assert.equal(getQuotationSituationFooter(undefined), null);

    const footer = getQuotationSituationFooter({
      rhetoricalSituation: {
        compactCue: {
          form: "Public speech",
          audience: "Marchers and a national audience",
          purpose: "Inspire and call the nation to act",
        },
      },
    });
    assert.equal(footer.form, "Public speech");
    assert.equal(footer.audience, "Marchers and a national audience");
    assert.equal(footer.purpose, "Inspire and call the nation to act");
  });
});

describe("IDEA — no premature claim or thesis", () => {
  it("8. nothing requires the student to write a claim or thesis yet", () => {
    // Continuing requires only the two idea fields.
    assert.equal(
      canContinueFromExploreIdea({
        statement: "A developing idea long enough to continue.",
        whyMatters: "A worth-exploring answer long enough too.",
      }),
      true
    );

    // Coaching says explicitly that the student is not committing to a thesis.
    assert.match(IDEA_WHY_NOT_THESIS_NOTE, /not committing to a final thesis/i);

    // No blocked message or question demands a claim/thesis.
    const guidance = [
      IDEA_STATEMENT_BLOCKED_MESSAGE,
      IDEA_WHY_BLOCKED_MESSAGE,
      ...IDEA_LEADING_QUESTIONS,
    ].join(" ");
    assert.doesNotMatch(guidance, /write (a|your) (claim|thesis)/i);

    // "Eventually defend" framing is allowed as future orientation only.
    assert.match(
      IDEA_WHY_LEADING_QUESTIONS.join(" "),
      /eventually defend/i
    );
  });
});

describe("IDEA — readiness and blocked-state messages", () => {
  it("9. readiness and blocked-state messages are explicit", () => {
    assert.equal(
      IDEA_READY_MESSAGE,
      "Your developing idea is ready to test against the quotations."
    );
    assert.equal(getExploreIdeaReadyMessage(), IDEA_READY_MESSAGE);

    // Blocked before the statement: says what to write and what it unlocks.
    const beforeStatement = getExploreIdeaContinueHint({
      statement: "",
      whyMatters: "",
    });
    assert.equal(beforeStatement, IDEA_STATEMENT_BLOCKED_MESSAGE);
    assert.match(beforeStatement, /unlocks/i);

    // Blocked before whyMatters: says what to write next.
    const beforeWhy = getExploreIdeaContinueHint({
      statement: "This is a long enough developing idea.",
      whyMatters: "",
    });
    assert.equal(beforeWhy, IDEA_WHY_BLOCKED_MESSAGE);

    // Ready: no blocking hint remains.
    const ready = getExploreIdeaContinueHint({
      statement: "This is a long enough developing idea.",
      whyMatters: "This is a long enough why-matters answer.",
    });
    assert.equal(ready, "");
  });
});

describe("IDEA — downstream CONNECT compatibility", () => {
  it("10. CONNECT receives the same saved idea artifacts as before", () => {
    // The phase model still resumes a saved idea into CONNECT exactly as
    // before: statement present + fewer than the connect minimum.
    const cluster = {
      payload: {
        id: "c1",
        name: "Justice group",
        evidenceIds: ["e1", "e2"],
      },
    };
    const pattern = {
      payload: {
        id: "p1",
        text: "Both warn about delay.",
        evidenceIds: ["e1", "e2"],
        isSelected: true,
      },
    };
    const idea = {
      payload: {
        statement: "King may show that delay is part of the injustice.",
        whyMatters: "It could explain a similarity across both works.",
        clusterId: "c1",
        patternId: "p1",
        evidenceMap: {},
      },
    };

    const resumed = getInitialModuleThreePhase({
      clusterArtifacts: [cluster],
      patternArtifacts: [pattern],
      ideaArtifact: idea,
    });
    assert.equal(resumed.phase, MODULE_THREE_PHASES.CONNECT);
    assert.equal(resumed.clusterId, "c1");
    assert.equal(resumed.patternId, "p1");

    // Phase constants are untouched.
    assert.equal(MODULE_THREE_PHASES.IDEA, "explore_idea");
    assert.equal(MODULE_THREE_PHASES.CONNECT, "connect_evidence");
  });
});
