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

export function getModule6StepPresentation(step, outline) {
  const body = Array.isArray(outline?.body) ? outline.body : [];

  if (!step) {
    return {
      question: "How will you turn your outline into a draft?",
      whyMatters: [
        "Drafting makes your thinking readable.",
        "You already organized your argument—now you write it one section at a time.",
      ],
      successLooksLike: [],
      coachingMessage: "Focus on the section in front of you.",
      nextStepText: "",
      workingSetLabel: "Your draft",
      workingSetDescription: "On your desk: the section you are writing now.",
    };
  }

  if (step.type === SECTION_TYPES.INTRO) {
    return {
      question: "How will you open your essay?",
      whyMatters: [
        "Your introduction sets direction for everything that follows.",
        "You are not writing a new thesis—you are leading the reader toward the one in your outline.",
      ],
      successLooksLike: [
        "You gave enough context for your reader to understand the topic.",
        "You built toward the thesis from your outline.",
        "A reader would know where the essay is headed.",
      ],
      coachingMessage:
        "Draft in your own words. Glance at the shelf for your thesis and outline when you need a reminder.",
      nextStepText:
        body.length > 0
          ? `Next you will draft your first body section: ${body[0]?.bucket || "your first paragraph plan"}.`
          : "Next you will draft your conclusion.",
      workingSetLabel: "Introduction",
      workingSetDescription: "On your desk: your opening section.",
    };
  }

  if (step.type === SECTION_TYPES.BODY) {
    const card = body[step.bodyIndex] || {};
    const title = String(card.bucket || "").trim() || `Body paragraph ${step.bodyIndex + 1}`;
    const isLastBody = step.bodyIndex === body.length - 1;

    return {
      question: `How will you draft this section: ${title}?`,
      whyMatters: [
        "Each body section proves one part of your argument.",
        "This section grows from the paragraph plan and outline points you already built.",
      ],
      successLooksLike: [
        "Your section connects clearly to your thesis.",
        "You used supporting details from your outline in full sentences.",
        "You explained how your evidence supports your point.",
      ],
      coachingMessage:
        "Use the supporting details on the shelf as a guide—not a script. Turn notes into your own prose.",
      nextStepText: isLastBody
        ? "Next you will draft your conclusion."
        : `Next you will draft: ${body[step.bodyIndex + 1]?.bucket || "the following section"}.`,
      workingSetLabel: title,
      workingSetDescription: "On your desk: this body section only.",
    };
  }

  return {
    question: "How will you close your essay?",
    whyMatters: [
      "A conclusion shows the reader why your argument matters.",
      "You are finishing the draft you built section by section—not starting a new idea.",
    ],
    successLooksLike: [
      "You brought your thesis back in fresh words.",
      "You reminded the reader of your strongest points.",
      "You ended with a thought that feels earned by your argument.",
    ],
    coachingMessage:
      "Keep it short. A conclusion should feel like a landing, not a second introduction.",
    nextStepText: "When this section feels ready, finish your draft and continue to revision.",
    workingSetLabel: "Conclusion",
    workingSetDescription: "On your desk: your closing section.",
  };
}

export function romanNumeral(n) {
  return (
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] ||
    `${n + 1}`
  );
}
