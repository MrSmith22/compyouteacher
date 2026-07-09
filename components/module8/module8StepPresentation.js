import { SECTION_TYPES } from "@/components/module6/module6StepPresentation";

export function getModule8StepPresentation(step, outline) {
  const body = Array.isArray(outline?.body) ? outline.body : [];

  if (!step) {
    return {
      question:
        "How can you make your essay as clear and effective as possible before you format it?",
      whyMatters: [
        "You strengthened your ideas in Module 7.",
        "Polish strengthens how your writing reads—one section at a time.",
      ],
      successLooksLike: [
        "Each section reads clearly for a reader.",
        "Sentences flow smoothly with precise wording.",
        "You improved clarity without starting over.",
      ],
      coachingMessage:
        "Focus on the section on your desk. This is the same essay—you are polishing it.",
      nextStepText:
        "You will move through each section of the essay you revised in Module 7.",
      workingSetLabel: "Your polish",
      workingSetDescription: "On your desk: one section of your essay.",
    };
  }

  if (step.type === SECTION_TYPES.INTRO) {
    return {
      question: "How can you polish your introduction?",
      whyMatters: [
        "Your introduction sets direction for everything that follows.",
        "You are clarifying what you already wrote—not writing a new opening.",
      ],
      successLooksLike: [
        "A reader would know the topic and where the essay is headed.",
        "Your opening flows smoothly toward your thesis.",
        "Sentences are clear and precise.",
      ],
      coachingMessage:
        "Read this section slowly. Tighten any sentences that feel long or vague.",
      nextStepText:
        body.length > 0
          ? `Next you will polish your first body section: ${body[0]?.bucket || "your first paragraph plan"}.`
          : "Next you will polish your conclusion.",
      workingSetLabel: "Introduction",
      workingSetDescription: "On your desk: your opening section.",
    };
  }

  if (step.type === SECTION_TYPES.BODY) {
    const card = body[step.bodyIndex] || {};
    const title = String(card.bucket || "").trim() || `Body paragraph ${step.bodyIndex + 1}`;
    const isLastBody = step.bodyIndex === body.length - 1;

    return {
      question: `How can you polish this section: ${title}?`,
      whyMatters: [
        "Each body section proves one part of your argument.",
        "You are improving prose you already revised—not rebuilding from notes.",
      ],
      successLooksLike: [
        "This section connects clearly to your thesis.",
        "Your explanation is easy for a reader to follow.",
        "Transitions and sentences read smoothly.",
      ],
      coachingMessage:
        "Glance at the shelf for your paragraph plan. Polish clarity and flow—not rewrite from scratch.",
      nextStepText: isLastBody
        ? "Next you will polish your conclusion."
        : `Next you will polish: ${body[step.bodyIndex + 1]?.bucket || "the following section"}.`,
      workingSetLabel: title,
      workingSetDescription: "On your desk: this body section only.",
    };
  }

  return {
    question: "How can you polish your conclusion?",
    whyMatters: [
      "A conclusion shows the reader why your argument matters.",
      "You are improving the ending you already wrote—not inventing a new argument.",
    ],
    successLooksLike: [
      "Your closing brings the thesis back in fresh words.",
      "The ending feels earned by the sections before it.",
      "Sentences are clear and precise through the final lines.",
    ],
    coachingMessage:
      "Keep it focused. A conclusion should land the essay—not restart it.",
    nextStepText:
      "When every section reads clearly, finish polishing and continue to formatting.",
    workingSetLabel: "Conclusion",
    workingSetDescription: "On your desk: your closing section.",
  };
}
