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
    const job = String(card?.job || "").trim();
    steps.push({
      id: `section-${index + 1}`,
      draftIndex: index + 1,
      type: SECTION_TYPES.BODY,
      roman: index + 1,
      title: String(card?.bucket || card?.point || "").trim() || `Body paragraph ${index + 1}`,
      bodyIndex: index,
      // Additive CP-F context for later CP-G — legacy outlines omit job safely.
      job: job || null,
      sourceParagraphIndex:
        typeof card?.sourceParagraphIndex === "number"
          ? card.sourceParagraphIndex
          : typeof card?.paragraphIndex === "number"
            ? card.paragraphIndex
            : null,
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
      coachingMessage:
        "Follow Your job right now. Tap Need Help if you need your thesis or outline.",
      nextStepText: "",
      thesisCoach:
        "Your thesis is the main claim of the whole essay. Keep it in view so every section stays on track.",
      outlineCoach:
        "Your outline is the map. Draft only the section marked “drafting now.”",
      writerMoves: [],
      jobRightNow: {
        lead: "Write one section at a time using your outline.",
        steps: [
          {
            text: "Look at the outline section you are drafting now.",
            find: "outline",
          },
          "Turn those notes into complete sentences.",
          {
            text: "Keep your thesis in view so you stay on track.",
            find: "thesis",
          },
        ],
        findHint:
          "If you get stuck, open Need Help below for your thesis and outline.",
      },
      workingSetLabel: "Your draft",
      workingSetDescription: "On your desk: the section you are writing now.",
    };
  }

  if (step.type === SECTION_TYPES.INTRO) {
    return {
      question: "What's the first thing you want your reader to know?",
      whyMatters: [
        "Your reader was not in your head during planning. They need a clear starting place.",
        "If you begin with your thesis too soon, the reader may feel lost.",
        "You already chose your thesis. Now you lead the reader to it—step by step.",
      ],
      example: {
        sample:
          "Both King and the clergymen care about justice, but they speak to different audiences. In the speech, King moves a public crowd with hope. In the letter, he answers critics with careful reasoning. Although both texts argue for justice, King uses emotional appeals more openly in the speech and builds careful credibility in the letter so each audience will listen.",
        whyItWorks:
          "The writer first helps the reader understand the topic and situation. Only then does the reader arrive at the thesis—the destination of the introduction.",
      },
      successLooksLike: [
        "A reader would know what this essay is about from my first sentences.",
        "I gave enough background before my thesis.",
        "My introduction ends with the thesis I already planned—not a new idea.",
        "I can point to where I am leading my reader.",
      ],
      coachingMessage:
        "Think about your reader first. Your job right now tells you what to write. Need Help has your thesis—the place you are leading them.",
      nextStepText:
        body.length > 0
          ? "Next you will help your reader understand your first body idea."
          : "Next you will write your conclusion.",
      thesisCoach:
        "This is where you are leading your reader. Do not start the introduction with it—arrive here at the end.",
      outlineCoach:
        "Your outline reminds you what belongs in the introduction. Use it if you get stuck—not as a script to copy.",
      writerMoves: [
        "Tell the reader what the essay is about.",
        "Give the background they need.",
        "Lead them to your thesis.",
      ],
      jobRightNow: {
        lead: "Think about your reader.",
        steps: [
          "What do they need to understand before they reach your thesis?",
          "Write the opening of your essay by introducing your topic in your own words.",
          {
            text: "Then gradually lead your reader toward the thesis you already planned.",
            find: "thesis",
          },
        ],
        closing: "When you're ready, write that opening in the box below.",
        findHint:
          "Your thesis is shown under Need Help below (blue card). Outline reminders are there too (green card).",
      },
      thesisCardTitle: "Where you're leading your reader",
      thesisCardHint:
        "This is your thesis—the destination of your introduction. End here. Do not start here.",
      outlineHelpTitle: "A reminder from your outline",
      outlineHelpNote:
        "If you need a reminder of what you planned for the introduction, use these notes. They support your thinking; they are not another assignment.",
      workingSetLabel: "Introduction",
      workingSetDescription:
        "Talk to your reader. Start with what they need to know first.",
    };
  }

  if (step.type === SECTION_TYPES.BODY) {
    const card = body[step.bodyIndex] || {};
    const title =
      String(card.bucket || "").trim() || `Body paragraph ${step.bodyIndex + 1}`;
    const isLastBody = step.bodyIndex === body.length - 1;
    const pointCount = Array.isArray(card.points) ? card.points.length : 0;
    const paragraphNumber =
      typeof step.bodyIndex === "number" && step.bodyIndex >= 0
        ? step.bodyIndex + 1
        : 1;

    return {
      question: "What does your reader need to understand in this body paragraph?",
      whyMatters: [
        "This paragraph proves one part of your thesis—the idea you planned for this section.",
        "You are still translating notes into sentences, not inventing a new argument.",
        pointCount > 0
          ? "Your outline points under Need Help are your ingredients. Turn each useful point into a clear sentence, then explain how it supports your thesis."
          : "Use your paragraph plan and thesis under Need Help to build this section in complete sentences.",
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
        "Follow Your job right now. If you need evidence ideas, open Need Help for your thesis (blue) and outline points (green).",
      nextStepText: isLastBody
        ? "Next you will write your conclusion."
        : "Next you will draft your next body paragraph.",
      thesisCoach:
        "Keep asking: How does this paragraph help prove my thesis? If a sentence does not help, cut it or rewrite it.",
      outlineCoach:
        "Stay inside this outline section. Draft only these points now—save other outline rows for later paragraphs.",
      writerMoves: [
        "Start with a topic sentence that matches this outline section.",
        "Turn each useful outline point into a full sentence.",
        "Explain why the detail matters for your thesis.",
      ],
      jobRightNow: {
        lead: `Write Body Paragraph ${paragraphNumber} now.`,
        steps: [
          "State the main idea of this paragraph in your own words.",
          {
            text: "Use your evidence or example from the outline points for this section.",
            find: "outline",
          },
          "Explain why that evidence supports your main idea.",
          {
            text: "Connect back to your overall argument—your thesis.",
            find: "thesis",
          },
        ],
        findHint:
          "See your outline points under Need Help below (green card). Your thesis is there too (blue card).",
      },
      // Keep the student's planned section title on the writing box only—not in the page question.
      workingSetLabel: title,
      workingSetDescription:
        "On your desk: this body section only. Check Need Help if you forget your plan.",
      outlineHelpTitle: "Outline points for this paragraph",
      outlineHelpNote:
        "These are the notes you planned. Turn useful ones into sentences—you do not have to use every line.",
    };
  }

  const conclusion = outline?.conclusion || {};
  const hasConclusionPlan =
    String(conclusion.summary || "").trim() ||
    String(conclusion.finalThought || "").trim();

  return {
    question: "How will you leave your reader with a clear ending?",
    whyMatters: [
      "A conclusion wraps up your essay—it is not a second introduction or a new argument.",
      "You already planned how to return to your thesis and what final thought readers should leave with.",
      hasConclusionPlan
        ? "Use your conclusion notes under Need Help—turn them into a short closing in your own words."
        : "Bring your thesis back in fresh words, remind the reader of your strongest points, and end with one earned final thought.",
    ],
    example: {
      sample:
        "In both texts, King adapts ethos, pathos, and logos so his audience will listen. The speech inspires a public crowd with shared ideals and hope, while the letter carefully answers religious critics with respect and reasoned proof. Together, the texts show that effective persuasion depends on knowing who must be convinced.",
      whyItWorks:
        "It restates the thesis in new words, briefly reminds the reader of the main points, and ends with a final thought that grows out of the essay—not a brand-new main idea.",
    },
    successLooksLike: [
      "I restated my thesis in fresh words (not copied word-for-word).",
      "I briefly reminded the reader of my strongest points.",
      "I ended with one clear final thought—not a new body paragraph.",
      "My conclusion feels short and finished.",
    ],
    coachingMessage:
      "Follow Your job right now. Keep it short. Need Help has your thesis (blue) and conclusion notes (green).",
    nextStepText:
      "When this section feels ready, finish your draft and continue to revision.",
    thesisCoach:
      "Your thesis returns here in new wording so the reader hears your main idea one last time—do not invent a different main idea.",
    outlineCoach: hasConclusionPlan
      ? "Use the conclusion notes under Need Help. Turn those notes into a short closing paragraph."
      : "Use the conclusion notes under Need Help as your guide for what to restate and how to end.",
    writerMoves: [
      "Restate the thesis in fresh words.",
      "Remind the reader of your strongest points briefly.",
      "End with one earned final thought.",
    ],
    jobRightNow: {
      lead: "Write your conclusion in three moves.",
      steps: [
        {
          text: "Remind the reader of your main point—restate your thesis in fresh words.",
          find: "thesis",
        },
        "Bring together your strongest ideas from the essay.",
        hasConclusionPlan
          ? {
              text: "Leave the reader with one final thought from your conclusion notes.",
              find: "outline",
            }
          : "Leave the reader with one final thought.",
      ],
      findHint:
        "Your thesis is under Need Help below (blue card). Conclusion notes are there too (green card).",
    },
    workingSetLabel: "Conclusion",
    workingSetDescription:
      "On your desk: finish the essay you already planned. Need Help has your notes.",
    outlineHelpTitle: "Conclusion notes from your plan",
    outlineHelpNote:
      "Use these notes to wrap up—not to start a new argument.",
  };
}

export function romanNumeral(n) {
  return (
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] ||
    `${n + 1}`
  );
}
