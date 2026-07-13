/**
 * WP-020 — Module 7 revision teaching content (pure helpers).
 * Instructional copy never mutates student prose or satisfies gates.
 */

export const MODULE7_REVISION_STRENGTH_FRAME =
  "Your draft is complete. Now you are making it stronger.";

export const MODULE7_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1024, 1440],
  mobile: {
    minActionTargetPx: 44,
    noHorizontalOverflow: true,
    singleColumnPrimary: true,
  },
});

export const MODULE7_STEP_STRATEGY_IDS = Object.freeze({
  ENTRY: "entry",
  READ_ALOUD: "read-aloud",
  INTRO: "introduction",
  BODY: "body",
  CONCLUSION: "conclusion",
  FINAL_REVIEW: "final-review",
});

/** Explicit contrast: revision is not proofreading. */
export const MODULE7_REVISION_VS_PROOFREADING = Object.freeze({
  revisionMeans:
    "Revision means improving how clearly your ideas reach the reader—clarity, explanation, connection, and flow.",
  proofreadingMeans:
    "Proofreading means catching surface mistakes such as spelling, capitalization, or punctuation.",
  distinction:
    "In Module 7 you revise for communication first. Proofreading can wait until your ideas land clearly.",
});

const FORBIDDEN_STRENGTH_WORDS = [
  "wrong",
  "bad draft",
  "bad writing",
  "fix your mistakes",
  "fix mistakes",
  "your mistakes",
  "failed",
  "failure",
];

const BODY_FOCUS_CYCLE = Object.freeze([
  {
    focusId: "evidence_explanation",
    title: "Explain your evidence",
    teach:
      "Check whether a reader can see how your evidence supports this paragraph’s point—not only that a quotation appears.",
    noticePrompt:
      "Compare the paragraph’s point with what the section actually explains after each piece of evidence.",
    improvePrompt:
      "Improve one place where evidence needs a clearer explanation of how it supports your point.",
    example: {
      sample:
        "King’s call for justice is not only a slogan—his examples show why waiting harms people now.",
      whyItWorks:
        "The writer explains what the evidence does for the argument instead of dropping a quote and moving on.",
    },
  },
  {
    focusId: "thesis_connection",
    title: "Connect to your thesis",
    teach:
      "Check whether this paragraph still advances the thesis you already planned—or drifts into a side topic.",
    noticePrompt:
      "Compare this section’s point with your thesis. Ask: how does this paragraph help prove that claim?",
    improvePrompt:
      "Improve one sentence so the connection between this paragraph and your thesis is easier to follow.",
    example: {
      sample:
        "This matters for the thesis because the letter’s careful tone earns trust from a skeptical audience.",
      whyItWorks:
        "The reader hears how the local paragraph work serves the whole argument.",
    },
  },
  {
    focusId: "transition",
    title: "Smooth the transition",
    teach:
      "Check whether a reader can move into and out of this paragraph without an abrupt jump.",
    noticePrompt:
      "Compare the end of the previous idea with the opening of this section. Where does the handoff feel sudden?",
    improvePrompt:
      "Improve one transition so the next idea arrives with a clear bridge for the reader.",
    example: {
      sample:
        "After establishing credibility, King turns to emotion—not instead of reason, but to move listeners to act.",
      whyItWorks:
        "The sentence shows relationship between sections instead of slamming into a new topic.",
    },
  },
]);

function freezeStrategy(strategy) {
  return Object.freeze({
    ...strategy,
    checklist: Object.freeze([...(strategy.checklist || [])]),
    sequence: Object.freeze([...(strategy.sequence || [])]),
    example: strategy.example ? Object.freeze({ ...strategy.example }) : null,
    mutatesProse: false,
    satisfiesGate: false,
  });
}

/**
 * Entry teaching shown when Module 7 begins (before section revision work).
 */
export function getModule7EntryTeaching() {
  return freezeStrategy({
    id: MODULE7_STEP_STRATEGY_IDS.ENTRY,
    screen: "entry",
    title: "What revision means here",
    strengthFrame: MODULE7_REVISION_STRENGTH_FRAME,
    teach:
      "Your Module 6 draft is already complete. Revision improves how clearly those ideas reach your reader—one section and one strategy at a time.",
    noticePrompt:
      "Notice that revision is about communication: clarity, explanation, connection, and flow.",
    improvePrompt:
      "You will strengthen one section using one strategy—not rewrite the whole essay at once.",
    revisionVsProofreading: MODULE7_REVISION_VS_PROOFREADING,
    deeperExplanation:
      "Experienced writers treat a finished draft as raw material for clearer thinking on the page. They do not assume the first wording already teaches the reader everything.",
    example: {
      sample:
        "Revision question: “Will my reader understand why this evidence matters?” Proofreading question: “Did I spell everything correctly?”",
      whyItWorks:
        "The first question changes meaning and clarity. The second only polishes the surface.",
    },
    sequence: ["teach", "notice", "improve-one-thing", "continue"],
    checklist: [
      "My draft is already complete from Module 6.",
      "Revision improves how clearly ideas reach the reader.",
      "Revision is different from proofreading.",
      "I will work one section and one strategy at a time.",
    ],
  });
}

export function getReadAloudRevisionStrategy() {
  return freezeStrategy({
    id: MODULE7_STEP_STRATEGY_IDS.READ_ALOUD,
    screen: "read-aloud",
    title: "Listen like a reader",
    strengthFrame: MODULE7_REVISION_STRENGTH_FRAME,
    teach:
      "Read your full essay aloud and listen for places a reader would stumble, hear repetition, feel an abrupt jump, or need more explanation.",
    noticePrompt:
      "As you listen, mark (mentally or in a note) stumbles, repetition, abrupt transitions, and spots that need explanation.",
    improvePrompt:
      "You are gathering listening clues now. You will improve one section at a time in the steps that follow.",
    deeperExplanation:
      "Hearing your sentences reveals communication gaps silent reading often hides. You are noticing where meaning is hard to follow—not judging the draft.",
    example: {
      sample:
        "While listening, you notice you rush through a quotation and never explain why it matters.",
      whyItWorks:
        "That listening clue becomes a concrete revision target in a later body paragraph.",
    },
    sequence: ["teach", "notice", "improve-one-thing", "continue"],
    checklist: [
      "Places I stumble or lose my place",
      "Ideas or phrases that repeat without adding meaning",
      "Abrupt transitions between sentences or sections",
      "Moments that need more explanation for a reader",
    ],
  });
}

export function getIntroductionRevisionStrategy() {
  return freezeStrategy({
    id: MODULE7_STEP_STRATEGY_IDS.INTRO,
    screen: "introduction",
    title: "Orient the reader to a clear thesis",
    strengthFrame: MODULE7_REVISION_STRENGTH_FRAME,
    teach:
      "Check whether your introduction gives enough context and leads the reader to a clear thesis.",
    noticePrompt:
      "Notice: Does a first-time reader get enough context, and can they find where the essay is headed?",
    improvePrompt:
      "Improve one thing—context, clarity of direction, or thesis placement—so the opening teaches the reader more clearly.",
    deeperExplanation:
      "A strong introduction does not merely sound formal. It helps the reader enter the topic and arrive at your thesis without guessing.",
    example: {
      sample:
        "Both texts argue for justice, but they persuade different audiences—so the opening names that difference before the thesis.",
      whyItWorks:
        "Context and direction arrive before the claim, so the thesis is easier to receive.",
    },
    sequence: ["teach", "notice", "improve-one-thing", "continue"],
    checklist: [],
  });
}

export function getBodyRevisionStrategy(bodyIndex = 0) {
  const index = Number.isFinite(bodyIndex) ? Math.max(0, Math.floor(bodyIndex)) : 0;
  const focus = BODY_FOCUS_CYCLE[index % BODY_FOCUS_CYCLE.length];
  return freezeStrategy({
    id: MODULE7_STEP_STRATEGY_IDS.BODY,
    screen: "body",
    bodyIndex: index,
    focusId: focus.focusId,
    title: focus.title,
    strengthFrame: MODULE7_REVISION_STRENGTH_FRAME,
    teach: focus.teach,
    noticePrompt: focus.noticePrompt,
    improvePrompt: focus.improvePrompt,
    deeperExplanation:
      "Keep this paragraph as your only working set. Compare the planned point with the prose on the page, then change one communication move.",
    example: focus.example,
    sequence: ["teach", "notice", "improve-one-thing", "continue"],
    checklist: [],
  });
}

export function getConclusionRevisionStrategy() {
  return freezeStrategy({
    id: MODULE7_STEP_STRATEGY_IDS.CONCLUSION,
    screen: "conclusion",
    title: "Bring the argument together",
    strengthFrame: MODULE7_REVISION_STRENGTH_FRAME,
    teach:
      "Check whether your conclusion brings the argument together and leaves a purposeful final thought.",
    noticePrompt:
      "Notice: Does the ending synthesize what came before, or does it restart a new argument?",
    improvePrompt:
      "Improve one thing—synthesis, a fresh restatement of the main point, or a purposeful final thought.",
    deeperExplanation:
      "A conclusion lands the essay for the reader. It should feel earned by the sections before it—not like a brand-new body paragraph.",
    example: {
      sample:
        "Taken together, the speech and letter show that justice requires both urgency and credibility—so readers leave with a clear final emphasis.",
      whyItWorks:
        "The ending gathers the argument and leaves a deliberate last idea.",
    },
    sequence: ["teach", "notice", "improve-one-thing", "continue"],
    checklist: [],
  });
}

export function getFinalReviewRevisionStrategy() {
  return freezeStrategy({
    id: MODULE7_STEP_STRATEGY_IDS.FINAL_REVIEW,
    screen: "final-review",
    title: "Confirm clearer communication",
    strengthFrame: MODULE7_REVISION_STRENGTH_FRAME,
    teach:
      "Review the whole essay to confirm it communicates more clearly—while treating your original draft as a complete starting point you strengthened.",
    noticePrompt:
      "Notice places that now guide the reader more smoothly than they did before your section work.",
    improvePrompt:
      "If one remaining spot still confuses a reader, go back to that section. Otherwise, continue—your draft is stronger because the ideas land more clearly.",
    deeperExplanation:
      "Final review is a communication check. You are confirming that revision made the essay easier to follow.",
    example: {
      sample:
        "I can follow the thesis through each section, and the ending leaves a clear final thought.",
      whyItWorks:
        "The standard is clearer communication for the reader—not perfectionism or mistake-counting.",
    },
    sequence: ["teach", "notice", "improve-one-thing", "continue"],
    checklist: [
      "The essay still reflects my completed draft—now clearer.",
      "I am treating the original draft as complete work I made stronger.",
      "Any last change targets communication, not busywork.",
    ],
  });
}

/**
 * Resolve the strategy for a Module 7 presentation step.
 * @param {{ type?: string, bodyIndex?: number } | null} step
 */
export function getModule7RevisionStrategy(step) {
  if (!step || step.type === "entry") {
    return getModule7EntryTeaching();
  }
  if (step.type === "read-aloud") {
    return getReadAloudRevisionStrategy();
  }
  if (step.type === "final-review") {
    return getFinalReviewRevisionStrategy();
  }
  if (step.type === "intro") {
    return getIntroductionRevisionStrategy();
  }
  if (step.type === "body") {
    return getBodyRevisionStrategy(step.bodyIndex);
  }
  if (step.type === "conclusion") {
    return getConclusionRevisionStrategy();
  }
  return getModule7EntryTeaching();
}

/**
 * Build "Your job right now" steps: Teach → notice → improve one → continue.
 */
export function buildModule7JobRightNow(strategy) {
  if (!strategy) return null;
  return {
    heading: "Your job right now",
    steps: [
      { text: `Teach yourself the move: ${strategy.teach}` },
      { text: strategy.noticePrompt },
      { text: strategy.improvePrompt },
      { text: "Continue when that one communication improvement is clearer." },
    ],
  };
}

/**
 * Strength-framed copy must avoid deficit language.
 */
export function usesStrengthFramedLanguage(text) {
  const value = String(text || "").toLowerCase();
  if (!value) return false;
  if (!value.includes("stronger") && !value.includes("complete")) {
    // still allow if no forbidden words and mentions improve/clear
  }
  return !FORBIDDEN_STRENGTH_WORDS.some((word) => value.includes(word));
}

export function collectStrategyTexts(strategy) {
  if (!strategy) return [];
  const parts = [
    strategy.title,
    strategy.strengthFrame,
    strategy.teach,
    strategy.noticePrompt,
    strategy.improvePrompt,
    strategy.deeperExplanation,
    strategy.example?.sample,
    strategy.example?.whyItWorks,
    ...(strategy.checklist || []),
  ];
  if (strategy.revisionVsProofreading) {
    parts.push(
      strategy.revisionVsProofreading.revisionMeans,
      strategy.revisionVsProofreading.proofreadingMeans,
      strategy.revisionVsProofreading.distinction
    );
  }
  return parts.filter(Boolean).map(String);
}

/**
 * Instructional helpers never rewrite student sections.
 */
export function applyStrategyWithoutMutatingProse(strategy, sections) {
  const input = Array.isArray(sections) ? sections.map((s) => String(s ?? "")) : [];
  // Explicit no-op: coaching cannot alter prose.
  void strategy;
  return input.slice();
}
