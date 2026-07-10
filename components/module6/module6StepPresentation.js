export const SECTION_TYPES = {
  INTRO: "intro",
  BODY: "body",
  CONCLUSION: "conclusion",
};

export function buildDraftSectionSteps(outline) {
  const body = Array.isArray(outline?.body) ? outline.body : [];
  const steps = [
    {
      id: "section-0",
      draftIndex: 0,
      type: SECTION_TYPES.INTRO,
      roman: 0,
      title: "Introduction",
      bodyIndex: -1,
    },
  ];

  body.forEach((card, index) => {
    steps.push({
      id: `section-${index + 1}`,
      draftIndex: index + 1,
      type: SECTION_TYPES.BODY,
      roman: index + 1,
      title: String(card?.bucket || "").trim() || `Body paragraph ${index + 1}`,
      bodyIndex: index,
    });
  });

  steps.push({
    id: `section-${body.length + 1}`,
    draftIndex: body.length + 1,
    type: SECTION_TYPES.CONCLUSION,
    roman: body.length + 1,
    title: "Conclusion",
    bodyIndex: -1,
  });

  return steps;
}

/**
 * Writing-language label for drafting/revision textboxes (Modules 6–7).
 * Planning labels (Roman numerals, bucket/claim titles) stay on shelves/maps.
 */
export function getWritingSectionLabel(step) {
  if (!step) return "Draft";
  if (step.type === SECTION_TYPES.INTRO) return "Introduction";
  if (step.type === SECTION_TYPES.CONCLUSION) return "Conclusion";
  if (step.type === SECTION_TYPES.BODY) {
    const n =
      typeof step.bodyIndex === "number" && step.bodyIndex >= 0
        ? step.bodyIndex + 1
        : 1;
    return `Body Paragraph ${n}`;
  }
  return "Draft";
}

/**
 * Instructional coaching for one Module 6 drafting step.
 * Returns copy only — no workflow changes.
 */
export function getModule6StepPresentation(step, outline) {
  const body = Array.isArray(outline?.body) ? outline.body : [];

  if (!step) {
    return {
      question: "How will you turn your outline into a draft?",
      whyMatters: [
        "Drafting makes your thinking readable for someone who was not in your head.",
        "You already organized your argument—now you write it one section at a time.",
      ],
      example: {
        sample:
          "Instead of inventing a new idea, a writer looks at one outline section and turns each note into a clear sentence.",
        whyItWorks:
          "The outline already chose the ideas. Drafting only changes notes into readable prose.",
      },
      successLooksLike: [
        "I know which outline section I am writing right now.",
        "I am using my thesis and notes—not inventing a new argument.",
      ],
      coachingMessage: "Focus on the section in front of you.",
      nextStepText: "",
      thesisCoach:
        "Your thesis is the main claim of the whole essay. Keep it in view so every section stays on track.",
      outlineCoach:
        "Your outline is the map. Draft only the section marked “drafting now.”",
      writerMoves: [],
      jobRightNow: {
        lead: "Write one section at a time using your outline.",
        steps: [
          "Look at the outline section you are drafting now.",
          "Turn those notes into complete sentences.",
          "Keep your thesis in view so you stay on track.",
        ],
      },
      workingSetLabel: "Your draft",
      workingSetDescription: "On your desk: the section you are writing now.",
    };
  }

  if (step.type === SECTION_TYPES.INTRO) {
    return {
      question: "How will you open your essay from the outline you already built?",
      whyMatters: [
        "Your introduction is the doorway into the essay—not a new assignment.",
        "Readers need a little context first, then your thesis, so they know where the essay is headed.",
        "You already chose your thesis in planning. Your job now is to lead the reader to it in complete sentences.",
      ],
      example: {
        sample:
          "Both King and the clergymen care about justice, but they speak to different audiences. In the speech, King moves a public crowd with hope. In the letter, he answers critics with careful reasoning. Although both texts argue for justice, King uses emotional appeals more openly in the speech and builds careful credibility in the letter so each audience will listen.",
        whyItWorks:
          "It introduces the topic, gives short context, and ends with the thesis the student already planned—without inventing a new claim.",
      },
      successLooksLike: [
        "I introduced the topic so a reader knows what the essay is about.",
        "I gave a little context before stating my claim.",
        "My introduction ends with my existing thesis (not a new one).",
        "A classmate could tell where the essay is headed.",
      ],
      coachingMessage:
        "A strong introduction usually does three things: introduce the topic, give context, then end with your thesis. You already planned that thesis—write toward it in your own words.",
      nextStepText:
        body.length > 0
          ? `Next you will draft your first body section: ${body[0]?.bucket || "your first paragraph plan"}.`
          : "Next you will draft your conclusion.",
      thesisCoach:
        "Use your thesis as the destination of this paragraph. Do not rewrite it into a different claim—lead the reader to the thesis you already wrote.",
      outlineCoach:
        "For the introduction, use the Introduction row on your outline. You are opening the essay, not proving a body point yet.",
      writerMoves: [
        "Introduce the topic in plain language.",
        "Add a little context so the reader is not lost.",
        "End with your existing thesis.",
      ],
      jobRightNow: {
        lead: "Write your introduction in three short moves. Look at Your thesis (already written) for Step 3.",
        steps: [
          "Introduce the topic in your own words.",
          "Give the reader the background they need.",
          "End with the thesis you already planned (the one in the blue card above).",
        ],
      },
      workingSetLabel: "Introduction",
      workingSetDescription:
        "On your desk: turn your outline notes into opening sentences.",
    };
  }

  if (step.type === SECTION_TYPES.BODY) {
    const card = body[step.bodyIndex] || {};
    const title =
      String(card.bucket || "").trim() || `Body paragraph ${step.bodyIndex + 1}`;
    const isLastBody = step.bodyIndex === body.length - 1;
    const pointCount = Array.isArray(card.points) ? card.points.length : 0;

    return {
      question: `How will you draft this section from your outline: ${title}?`,
      whyMatters: [
        `This paragraph proves one part of your thesis—the idea in “${title}.”`,
        "You are still translating notes into sentences, not inventing a new argument.",
        pointCount > 0
          ? "The outline points under this section are your ingredients. Turn each useful point into a clear sentence, then explain how it supports your thesis."
          : "Use your paragraph plan and thesis to build this section in complete sentences.",
      ],
      example: {
        sample:
          "First, King builds credibility in ways that fit each audience. In the speech, he begins with “five score years ago,” connecting his message to Lincoln so listeners trust him as a national voice. In the letter, he opens with respect for the clergymen’s calling. These choices help each group take him seriously before he asks them to change.",
        whyItWorks:
          "It starts with a clear point, uses specific evidence, explains what the evidence shows, and ties the point back to the larger argument—the same moves your outline is asking you to make.",
      },
      successLooksLike: [
        "My first sentence states the point of this paragraph (from my outline).",
        "I turned outline notes into complete sentences—not a list of fragments.",
        "I explained how my evidence or details support this point.",
        "A reader can see how this paragraph connects to my thesis.",
      ],
      coachingMessage:
        "Experienced writers do not dump notes into a paragraph. They introduce a point, bring in evidence, explain it, and connect it back to the thesis. Use your outline points as a guide—not a script to copy word for word.",
      nextStepText: isLastBody
        ? "Next you will draft your conclusion."
        : `Next you will draft: ${body[step.bodyIndex + 1]?.bucket || "the following section"}.`,
      thesisCoach:
        "Keep asking: How does this paragraph help prove my thesis? If a sentence does not help, cut it or rewrite it.",
      outlineCoach: `Stay inside this outline section (“${title}”). Draft only these points now—save other outline rows for later paragraphs.`,
      writerMoves: [
        "Start with a topic sentence that matches this outline section.",
        "Turn each useful outline point into a full sentence.",
        "Explain why the detail matters for your thesis.",
      ],
      jobRightNow: {
        lead: `Write this body paragraph now. Use the Outline guide for “${title},” and keep Your thesis in view for Step 4.`,
        steps: [
          `State the main idea of this paragraph (match the outline section “${title}”).`,
          "Use your evidence or example from the outline points listed above.",
          "Explain why that evidence supports your claim.",
          "Connect back to your overall argument (Your thesis above).",
        ],
      },
      workingSetLabel: title,
      workingSetDescription: "On your desk: this body section only—from your plan.",
    };
  }

  const conclusion = outline?.conclusion || {};
  const hasConclusionPlan =
    String(conclusion.summary || "").trim() ||
    String(conclusion.finalThought || "").trim();

  return {
    question: "How will you close your essay using what you already planned?",
    whyMatters: [
      "A conclusion is a landing, not a second introduction or a new argument.",
      "You already planned how to return to your thesis and what final thought readers should leave with.",
      hasConclusionPlan
        ? "Use your conclusion notes from the outline—translate them into a short closing in your own words."
        : "Bring your thesis back in fresh words, remind the reader of your strongest points, and end with one earned final thought.",
    ],
    example: {
      sample:
        "In both texts, King adapts ethos, pathos, and logos so his audience will listen. The speech inspires a public crowd with shared ideals and hope, while the letter carefully answers religious critics with respect and reasoned proof. Together, the texts show that effective persuasion depends on knowing who must be convinced.",
      whyItWorks:
        "It restates the thesis in new words, briefly reminds the reader of the main points, and ends with a final thought that grows out of the essay—not a brand-new claim.",
    },
    successLooksLike: [
      "I restated my thesis in fresh words (not copied word-for-word).",
      "I briefly reminded the reader of my strongest points.",
      "I ended with one clear final thought—not a new body paragraph.",
      "My conclusion feels short and finished.",
    ],
    coachingMessage:
      "Keep it short. Restate your thesis, echo your main points, and land on one final thought you already planned. Do not open a new argument here.",
    nextStepText:
      "When this section feels ready, finish your draft and continue to revision.",
    thesisCoach:
      "Your thesis returns here in new wording so the reader hears your main claim one last time—do not invent a different claim.",
    outlineCoach: hasConclusionPlan
      ? "Use the Conclusion row on your outline (summary and final thought). Turn those notes into a short closing paragraph."
      : "Use the Conclusion row on your outline as your guide for what to restate and how to end.",
    writerMoves: [
      "Restate the thesis in fresh words.",
      "Remind the reader of your strongest points briefly.",
      "End with one earned final thought.",
    ],
    jobRightNow: {
      lead: hasConclusionPlan
        ? "Write your conclusion in three moves. Use Your thesis and the Outline guide notes above."
        : "Write your conclusion in three moves. Keep Your thesis in view for Step 1.",
      steps: [
        "Remind the reader of your main point (restate Your thesis in fresh words).",
        "Bring together your strongest ideas from the essay.",
        hasConclusionPlan
          ? "Leave the reader with one final thought (use your Outline guide final thought)."
          : "Leave the reader with one final thought.",
      ],
    },
    workingSetLabel: "Conclusion",
    workingSetDescription: "On your desk: close the essay you already planned.",
  };
}

export function romanNumeral(n) {
  return (
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] ||
    `${n + 1}`
  );
}
