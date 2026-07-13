export const MODULE8_STEP_TYPES = {
  CREATE_DOC: "create-doc",
  FORMAT: "format",
  READY: "ready",
};

export const MODULE8_WORKSPACE_STEPS = [
  { id: "create-doc", type: MODULE8_STEP_TYPES.CREATE_DOC },
  { id: "format", type: MODULE8_STEP_TYPES.FORMAT },
  { id: "ready", type: MODULE8_STEP_TYPES.READY },
];

/** WP-034 — Always-visible Format coaching (not only collapsed Why this matters). */
export const MODULE8_FORMAT_APA_DOES = Object.freeze([
  "Makes your paper consistent and easier to read.",
  "Shows your reader you prepared the work carefully.",
  "Changes how the paper looks—not your ideas or argument.",
]);

export const MODULE8_FORMAT_CHANGE_CATEGORIES = Object.freeze([
  "Font",
  "Spacing",
  "Margins",
  "Title page",
  "Page numbers",
  "References page",
]);

/** WP-035 — Ready-step confidence confirmations (local UI; not the APA checklist). */
export const MODULE8_READY_CONFIDENCE_ITEMS = Object.freeze([
  "My newest essay appears.",
  "My title page is correct.",
  "My references page is complete.",
  "Everything is double spaced.",
  "The paper looks the way I expect.",
]);

export function getModule8StepPresentation(step, { hasExistingDoc = false } = {}) {
  if (step?.type === MODULE8_STEP_TYPES.CREATE_DOC) {
    return {
      question: "How do you get your finished essay into a Google Doc?",
      whyMatters: [
        "Your writing is complete. You are no longer improving your ideas.",
        "Your finished essay stays here. Your Google Doc is the paper you will format and turn in.",
      ],
      successLooksLike: [
        "Your finished essay is in a Google Doc.",
        "You can open the document and see your title page.",
        "You understand this is preparation—not rewriting.",
      ],
      coachingMessage:
        "You are preparing the paper your teacher will read—not changing what you wrote.",
      nextStepText: "Next you will format your paper in APA style inside your Google Doc.",
      workingSetLabel: hasExistingDoc
        ? "Update your Google Doc"
        : "Create your Google Doc",
      workingSetDescription: hasExistingDoc
        ? "A Google Doc already exists for this assignment. Update it so it has your latest essay before you format."
        : "Your finished essay will be placed into a Google Doc—the paper you'll format before turning it in.",
    };
  }

  if (step?.type === MODULE8_STEP_TYPES.FORMAT) {
    return {
      question: "How do you format your paper so a reader can take it seriously?",
      whyMatters: [
        "Your finished essay and your turn-in paper are two different things.",
        "APA rules tell your reader you prepared your work carefully.",
      ],
      successLooksLike: [
        "Font, spacing, and margins match your teacher's expectations.",
        "Your title page and page numbers are in place.",
        "Your references page follows APA rules.",
      ],
      coachingMessage:
        "Most of the work in this step happens in your Google Doc. Come back here as you complete each formatting task. Do not edit your essay in the processor—you are only preparing how your paper looks.",
      nextStepText: "Next you will make sure you are ready to continue.",
      workingSetLabel: "Format your paper",
      workingSetDescription:
        "Your writing is finished. Use APA formatting in your Google Doc, then check off each item here.",
    };
  }

  if (step?.type === MODULE8_STEP_TYPES.READY) {
    return {
      question: "Is your paper ready to turn in?",
      whyMatters: [
        "You already finished writing. This is a quick check before submission.",
        "Module 9 is where you demonstrate your APA knowledge and upload your PDF.",
      ],
      successLooksLike: [
        "What is one formatting choice you made that helps your reader?",
      ],
      coachingMessage:
        "You are closing preparation—not starting another writing assignment. Your Google Doc is formatted; Module 9 is quiz and upload.",
      nextStepText: "In Module 9 you will take a short APA quiz and submit your final PDF.",
      workingSetLabel: "Make sure you're ready",
      workingSetDescription:
        "Confirm your Google Doc looks ready. These checks do not submit your paper—they prepare you for Module 9.",
    };
  }

  return getModule8StepPresentation(MODULE8_WORKSPACE_STEPS[0]);
}
