import { SECTION_TYPES } from "@/components/module6/module6StepPresentation";

export const MODULE7_STEP_TYPES = {
  READ_ALOUD: "read-aloud",
};

export function getModule7StepPresentation(step, outline) {
  const body = Array.isArray(outline?.body) ? outline.body : [];

  if (step?.type === MODULE7_STEP_TYPES.READ_ALOUD) {
    return {
      question: "How does your essay sound when you hear it aloud?",
      whyMatters: [
        "Strong writers often hear problems they miss while silently reading.",
      ],
      successLooksLike: [
        "What is one thing you noticed while listening to yourself?",
      ],
      coachingMessage:
        "As you read and listen, notice where you stumbled, which sentences sounded awkward, where ideas repeated, which transitions felt abrupt, and where you needed more explanation.",
      nextStepText: "Next you will revise your introduction—one section at a time.",
      workingSetLabel: "Your entire essay",
      workingSetDescription: "On your desk: your full draft, ready to read aloud.",
    };
  }

  if (!step) {
    return {
      question: "How can you make your draft clearer and stronger for your reader?",
      whyMatters: [
        "You already planned, outlined, and drafted your essay.",
        "Revision strengthens what you built—one section at a time.",
      ],
      successLooksLike: [
        "Each section clearly supports your thesis.",
        "Sentences are easier for a reader to follow.",
        "You improved clarity without starting over.",
      ],
      coachingMessage:
        "Focus on the section on your desk. Glance at the shelf when you need a reminder of your plan.",
      nextStepText: "You will move through each section of the draft you wrote in Module 6.",
      workingSetLabel: "Your revision",
      workingSetDescription: "On your desk: one section of your draft.",
    };
  }

  if (step.type === SECTION_TYPES.INTRO) {
    return {
      question: "How can you strengthen your introduction?",
      whyMatters: [
        "Your introduction sets direction for everything that follows.",
        "You are clarifying what you already wrote—not writing a new opening from scratch.",
      ],
      successLooksLike: [
        "A reader would know the topic and where the essay is headed.",
        "Your opening builds toward the thesis you already planned.",
        "Sentences sound clear when you read them aloud.",
      ],
      coachingMessage:
        "Reread this section slowly. Tighten sentences that feel long or vague.",
      nextStepText:
        body.length > 0
          ? `Next you will revise your first body section: ${body[0]?.bucket || "your first paragraph plan"}.`
          : "Next you will revise your conclusion.",
      workingSetLabel: "Introduction",
      workingSetDescription: "On your desk: your opening section.",
    };
  }

  if (step.type === SECTION_TYPES.BODY) {
    const card = body[step.bodyIndex] || {};
    const title = String(card.bucket || "").trim() || `Body paragraph ${step.bodyIndex + 1}`;
    const isLastBody = step.bodyIndex === body.length - 1;

    return {
      question: `How can you strengthen this section: ${title}?`,
      whyMatters: [
        "Each body section proves one part of your argument.",
        "You are improving prose you already drafted from your paragraph plan and outline.",
      ],
      successLooksLike: [
        "This section connects clearly to your thesis.",
        "Your reasoning is easy for a reader to follow.",
        "Awkward or repetitive sentences are cleaned up.",
      ],
      coachingMessage:
        "Check the shelf for your paragraph plan and outline points. Strengthen connections—not rewrite from notes.",
      nextStepText: isLastBody
        ? "Next you will revise your conclusion."
        : `Next you will revise: ${body[step.bodyIndex + 1]?.bucket || "the following section"}.`,
      workingSetLabel: title,
      workingSetDescription: "On your desk: this body section only.",
    };
  }

  return {
    question: "How can you strengthen your conclusion?",
    whyMatters: [
      "A conclusion shows the reader why your argument matters.",
      "You are improving the ending you already drafted—not inventing a new argument.",
    ],
    successLooksLike: [
      "Your closing brings the thesis back in fresh words.",
      "The ending feels earned by the sections before it.",
      "Nothing new appears that belongs in a body paragraph.",
    ],
    coachingMessage:
      "Keep it focused. A conclusion should land the essay—not restart it.",
    nextStepText:
      "When every section feels stronger, finish revising and continue to final polish.",
    workingSetLabel: "Conclusion",
    workingSetDescription: "On your desk: your closing section.",
  };
}
