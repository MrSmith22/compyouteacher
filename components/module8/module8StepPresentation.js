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

export function getModule8StepPresentation(step) {
  if (step?.type === MODULE8_STEP_TYPES.CREATE_DOC) {
    return {
      question: "How do you create the paper you will turn in?",
      whyMatters: [
        "Your writing is finished. The paper you turn in is a separate step.",
        "Your finished essay stays here. Your Google Doc is the paper you will format and submit.",
      ],
      successLooksLike: [
        "You created a Google Doc with your finished essay.",
        "You can open the document and see your title page.",
        "You understand this is preparation—not rewriting.",
      ],
      coachingMessage:
        "You are not changing your ideas. You are creating the document your teacher will read.",
      nextStepText: "Next you will format your paper in APA style inside your Google Doc.",
      workingSetLabel: "Create your submission document",
      workingSetDescription: "On your desk: create the Google Doc you will turn in.",
    };
  }

  if (step?.type === MODULE8_STEP_TYPES.FORMAT) {
    return {
      question: "How do you format your paper so a reader can take it seriously?",
      whyMatters: [
        "Finished writing and a ready-to-turn-in paper are different things.",
        "APA rules tell your reader you prepared your work carefully.",
      ],
      successLooksLike: [
        "Font, spacing, and margins match your teacher's expectations.",
        "Your title page and page numbers are in place.",
        "Your references page follows APA rules.",
      ],
      coachingMessage:
        "Most of this step happens in your Google Doc. Return here as you complete each formatting item. You are not rewriting—you are preparing how your paper looks.",
      nextStepText: "Next you will make sure you are ready to continue to submission.",
      workingSetLabel: "Format your paper",
      workingSetDescription: "On your desk: your APA formatting checklist.",
    };
  }

  if (step?.type === MODULE8_STEP_TYPES.READY) {
    return {
      question: "How do you know your paper is ready to turn in?",
      whyMatters: [
        "Taking a moment to check your work prevents last-minute surprises.",
        "You already did the hard part—your writing is complete.",
      ],
      successLooksLike: [
        "What is one formatting choice you made that helps your reader?",
      ],
      coachingMessage:
        "Writing is finished. You prepared the paper someone else will read. Module 9 is where you confirm your APA knowledge and upload your final PDF.",
      nextStepText: "In Module 9 you will take a short APA quiz and submit your final PDF.",
      workingSetLabel: "Make sure you're ready",
      workingSetDescription: "On your desk: a quick check before you continue.",
    };
  }

  return getModule8StepPresentation(MODULE8_WORKSPACE_STEPS[0]);
}
