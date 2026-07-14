import { SECTION_TYPES } from "../module6/module6StepPresentation.js";
import {
  buildModule7JobRightNow,
  getModule7RevisionStrategy,
  MODULE7_REVISION_STRENGTH_FRAME,
} from "../../lib/module7/module7RevisionStrategy.js";

export const MODULE7_STEP_TYPES = {
  READ_ALOUD: "read-aloud",
  FINAL_REVIEW: "final-review",
};

function withStrategy(base, step) {
  const strategy = getModule7RevisionStrategy(step);
  return {
    ...base,
    strategy,
    jobRightNow: buildModule7JobRightNow(strategy),
    strengthFrame: MODULE7_REVISION_STRENGTH_FRAME,
  };
}

export function getModule7StepPresentation(step, outline) {
  const body = Array.isArray(outline?.body) ? outline.body : [];

  if (step?.type === MODULE7_STEP_TYPES.READ_ALOUD) {
    return withStrategy(
      {
        question: "How does your essay sound when you hear it aloud?",
        whyMatters: [
          "Hearing the essay helps you notice places a reader might stumble.",
          "You are listening for clarity—not starting a new draft.",
        ],
        successLooksLike: [
          "You recorded and listened to the essay at least once.",
          "You noticed at least one place that could be clearer for a reader.",
          "You are ready to revise one section at a time.",
        ],
        example: "",
        howToSucceed:
          "Record the essay, listen once for clarity, then move on to revise one section.",
        coachingMessage:
          "Record the essay on your desk, listen once, then move on to revise one section at a time.",
        nextStepText: "Next you will revise your introduction—one section at a time.",
        workingSetLabel: "Your current essay",
        workingSetDescription:
          "On your desk: the draft you completed in Module 6. Read this version aloud.",
      },
      step
    );
  }

  if (step?.type === MODULE7_STEP_TYPES.FINAL_REVIEW) {
    return withStrategy(
      {
        question: "Does your essay communicate more clearly now?",
        whyMatters: [
          "Final review confirms clearer communication for your reader.",
          "Your original draft was complete work—you strengthened how the ideas land.",
        ],
        successLooksLike: [
          "You can follow the thesis through the essay more easily.",
          "You treat the first draft as complete work you made stronger.",
          "You are ready to finish revising and move toward submission prep.",
        ],
        coachingMessage:
          "Confirm the essay communicates more clearly. If one spot still confuses a reader, go back to that section.",
        nextStepText:
          "When you finish revising, you will prepare this essay for submission in Module 8.",
        workingSetLabel: "Full essay review",
        workingSetDescription:
          "On your desk: your revised essay as prose. Confirm clearer communication—then continue.",
      },
      step
    );
  }

  if (!step) {
    return withStrategy(
      {
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
      },
      { type: "entry" }
    );
  }

  if (step.type === SECTION_TYPES.INTRO) {
    return withStrategy(
      {
        question: "Does your introduction give context and reach a clear thesis?",
        whyMatters: [
          "Your introduction sets direction for everything that follows.",
          "You are clarifying what you already wrote—not writing a new opening from scratch.",
        ],
        successLooksLike: [
          "A reader would know the topic and where the essay is headed.",
          "Your opening builds toward the thesis you already planned.",
          "You improved one communication move—not the whole essay at once.",
        ],
        coachingMessage:
          "Check context and thesis placement. Improve one thing so the reader arrives at your claim clearly.",
        nextStepText:
          body.length > 0
            ? `Next you will revise your first body section: ${body[0]?.bucket || "your first paragraph plan"}.`
            : "Next you will revise your conclusion.",
        workingSetLabel: "Introduction",
        workingSetDescription: "On your desk: your opening section only.",
      },
      step
    );
  }

  if (step.type === SECTION_TYPES.BODY) {
    const card = body[step.bodyIndex] || {};
    const title = String(card.bucket || "").trim() || `Body paragraph ${step.bodyIndex + 1}`;
    const isLastBody = step.bodyIndex === body.length - 1;
    const strategy = getModule7RevisionStrategy(step);

    return withStrategy(
      {
        question: `How can you strengthen this section: ${title}?`,
        whyMatters: [
          "Each body section proves one part of your argument.",
          "Compare the paragraph’s point with what the section actually explains—then improve one strategy.",
        ],
        successLooksLike: [
          `You used this screen’s strategy: ${strategy.title}.`,
          "This section connects more clearly for a reader.",
          "You improved one communication move in this section only.",
        ],
        coachingMessage: `${strategy.teach} Keep this section as your only working set.`,
        nextStepText: isLastBody
          ? "Next you will revise your conclusion."
          : `Next you will revise: ${body[step.bodyIndex + 1]?.bucket || "the following section"}.`,
        workingSetLabel: title,
        workingSetDescription: "On your desk: this body section only.",
      },
      step
    );
  }

  return withStrategy(
    {
      question: "Does your conclusion bring the argument together?",
      whyMatters: [
        "A conclusion shows the reader why your argument matters.",
        "You are improving the ending you already drafted—not inventing a new argument.",
      ],
      successLooksLike: [
        "Your closing brings the thesis back in fresh words.",
        "The ending feels earned by the sections before it.",
        "You leave a purposeful final thought.",
      ],
      coachingMessage:
        "Check synthesis and final thought. Improve one thing so the ending lands for the reader.",
      nextStepText:
        "Next you will review the full essay to confirm clearer communication.",
      workingSetLabel: "Conclusion",
      workingSetDescription: "On your desk: your closing section only.",
    },
    step?.type ? step : { type: "conclusion" }
  );
}
