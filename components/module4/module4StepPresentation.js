import {
  STEP_B1_EVIDENCE,
  STEP_B1_REASONING,
  STEP_B1_ROLE,
  STEP_B1_SCAFFOLD,
  STEP_B2_EVIDENCE,
  STEP_B2_REASONING,
  STEP_B2_ROLE,
  STEP_B2_SCAFFOLD,
  STEP_B3_EVIDENCE,
  STEP_B3_REASONING,
  STEP_B3_ROLE,
  STEP_B3_SCAFFOLD,
  STEP_HANDOFF,
  STEP_PATTERN,
  STEP_REFLECTION,
  STEP_THIRD_DECISION,
} from "@/components/module4/module4FlowSteps";

export function bucketIndexForFlowStep(flowStep) {
  if (flowStep >= STEP_B1_SCAFFOLD && flowStep <= STEP_B1_REASONING) return 0;
  if (flowStep >= STEP_B2_SCAFFOLD && flowStep <= STEP_B2_REASONING) return 1;
  if (flowStep >= STEP_B3_SCAFFOLD && flowStep <= STEP_B3_REASONING) return 2;
  return -1;
}

export function completedBucketIndices(flowStep, buckets, plannedIndices = null) {
  if (Array.isArray(plannedIndices)) {
    return plannedIndices.filter((index) => index === 0 || index === 1 || index === 2);
  }

  // Legacy fallback: do not treat flow position alone as planned.
  // Prefer plannedParagraphIndices from module4ValidityHelpers.
  void flowStep;
  void buckets;
  return [];
}

function paragraphStepPresentation(paragraphNumber, phase) {
  const n = paragraphNumber;
  const sectionLabel = `Body Paragraph ${n}`;
  const phases = {
    scaffold: {
      question: `What point will ${sectionLabel} prove?`,
      whyMatters: [
        "The point is what this paragraph will prove.",
        "The job—how this paragraph fits the essay’s organization—comes next.",
      ],
      successLooksLike: [
        `${sectionLabel} has a clear point you could explain to a classmate.`,
        "The point sounds like your thinking, not a fill-in-the-blank answer.",
      ],
      workingSetLabel: `${sectionLabel} — paragraph point`,
      workingSetDescription:
        "On your desk: the point this paragraph will prove.",
      coachingMessage:
        "Choose a proof-plan note if it fits, then revise the wording until it sounds like you.",
      nextStepText: `Next you will choose the organizational job for ${sectionLabel}.`,
    },
    role: {
      question: `How will ${sectionLabel} do its part in the essay?`,
      whyMatters: [
        "The job is how this paragraph does one part of the essay’s compare-and-contrast work.",
        "Your paragraph point stays visible so the job matches what you are proving.",
      ],
      successLooksLike: [
        "You can say whether this paragraph analyzes one work, compares both, or traces a move across both texts.",
      ],
      workingSetLabel: `${sectionLabel} — paragraph job`,
      workingSetDescription:
        "On your desk: the organizational job this paragraph does in your essay.",
      coachingMessage:
        "Confirm the recommendation from your proof plan, or choose a different job that fits your point.",
      nextStepText: "Next you will choose the quotes that belong with this point and job.",
    },
    evidence: {
      question: `Which quotes belong in ${sectionLabel}?`,
      whyMatters: [
        "You are choosing lines that support this paragraph’s point and job—not collecting random quotes.",
        "Ask whether each quote really belongs with what this paragraph proves.",
      ],
      successLooksLike: [
        "At least one quote is checked for this paragraph.",
        "Each quote you chose fits the paragraph point you already wrote.",
      ],
      workingSetLabel: `${sectionLabel} — evidence`,
      workingSetDescription: "On your desk: the quotes you are assigning to this paragraph.",
      coachingMessage:
        "If a quote does not fit this paragraph point and job, leave it unchecked. You can use it elsewhere.",
      nextStepText: "Next you will explain how your evidence supports your thesis.",
    },
    reasoning: {
      question: `How does ${sectionLabel} support your thesis?`,
      whyMatters: [
        "Reasoning is where analysis becomes writing.",
        "This is where you connect your quotes to your thesis in your own words.",
      ],
      successLooksLike: [
        "Your explanation says what the evidence shows—not just what the quote says.",
        "A reader could see how this paragraph helps prove your thesis.",
      ],
      workingSetLabel: `${sectionLabel} — explanation`,
      workingSetDescription: "On your desk: the sentences that connect your evidence to your thesis.",
      coachingMessage:
        "Use a starter if it helps, then finish the thought in language you would actually say.",
      nextStepText:
        n < 3
          ? "When this paragraph feels clear, you will move to the next part of your argument."
          : "When this paragraph feels clear, you will reflect on your full plan.",
    },
  };

  return phases[phase] || phases.scaffold;
}

const STEP_PRESENTATION = {
  [STEP_HANDOFF]: {
    question: "How will my Module 3 argument become paragraph plans?",
    whyMatters: [
      "Module 4 turns your Module 3 argument into paragraph plans—one paragraph at a time.",
      "You are organizing thinking you already started, not rewriting your thesis or drafting the essay yet.",
    ],
    successLooksLike: [
      "You can see your thesis, proof plan, and pattern together.",
      "You understand the five jobs inside a paragraph plan before you start Paragraph 1.",
    ],
    workingSetLabel: "Module 3 → Module 4 handoff",
    workingSetDescription:
      "On your desk: your argument coming with you, plus how paragraph plans work.",
    coachingMessage:
      "Skim the chain, study the five-part model, then start Paragraph 1 when you are ready.",
    nextStepText: "Next you will write the main idea for Paragraph 1.",
  },
  [STEP_PATTERN]: {
    question: "What pattern connects your evidence?",
    whyMatters: [
      "Module 4 needs one clear pattern so paragraph plans stay connected.",
      "No saved Module 3 pattern was found, so this short recovery step gives Paragraph 1 a foundation.",
    ],
    successLooksLike: [
      "You can name an idea that repeats or connects across your texts.",
    ],
    workingSetLabel: "Pattern recovery",
    workingSetDescription:
      "On your desk: choose or identify a pattern so Paragraph 1 has a foundation.",
    coachingMessage:
      "Look for something that shows up in more than one place across your evidence.",
    nextStepText: "Next you will plan your first body paragraph idea.",
  },
  [STEP_THIRD_DECISION]: {
    question: "Do you need a third body paragraph?",
    whyMatters: [
      "Some thesis plans need three body moves; others are stronger with two tight paragraphs.",
      "Choose what matches the argument you are actually making.",
    ],
    successLooksLike: [
      "You made a clear choice—two paragraphs or three.",
    ],
    workingSetLabel: "Third paragraph",
    workingSetDescription: "On your desk: deciding whether your thesis needs one more body paragraph.",
    coachingMessage:
      "Two strong paragraphs beat three thin ones. Add a third only if your thesis truly needs another layer.",
    nextStepText: "Next you will look back at the paragraph plans you built.",
  },
  [STEP_REFLECTION]: {
    question: "How do your paragraph plans work together?",
    whyMatters: [
      "Look back at the paragraph moves you planned.",
      "Notice how they work together to prove your thesis—and what you might deepen in Module 5.",
    ],
    successLooksLike: [
      "You wrote a few honest sentences about your plan.",
      "You can name one strength or one gap in how your paragraphs support your thesis.",
    ],
    workingSetLabel: "Reflection",
    workingSetDescription: "On your desk: looking back at the paragraph plans you built.",
    coachingMessage:
      "A short, honest reflection is enough. You are noticing your thinking—not performing perfection.",
    nextStepText: "When you finish, you will move on to outlining in Module 5.",
  },
};

export function getModule4StepPresentation(flowStep) {
  const bucketIndex = bucketIndexForFlowStep(flowStep);

  if (flowStep === STEP_B1_SCAFFOLD) {
    return paragraphStepPresentation(1, "scaffold");
  }
  if (flowStep === STEP_B1_ROLE) {
    return paragraphStepPresentation(1, "role");
  }
  if (flowStep === STEP_B1_EVIDENCE) {
    return paragraphStepPresentation(1, "evidence");
  }
  if (flowStep === STEP_B1_REASONING) {
    return paragraphStepPresentation(1, "reasoning");
  }
  if (flowStep === STEP_B2_SCAFFOLD) {
    return paragraphStepPresentation(2, "scaffold");
  }
  if (flowStep === STEP_B2_ROLE) {
    return paragraphStepPresentation(2, "role");
  }
  if (flowStep === STEP_B2_EVIDENCE) {
    return paragraphStepPresentation(2, "evidence");
  }
  if (flowStep === STEP_B2_REASONING) {
    return paragraphStepPresentation(2, "reasoning");
  }
  if (flowStep === STEP_B3_SCAFFOLD) {
    return paragraphStepPresentation(3, "scaffold");
  }
  if (flowStep === STEP_B3_ROLE) {
    return paragraphStepPresentation(3, "role");
  }
  if (flowStep === STEP_B3_EVIDENCE) {
    return paragraphStepPresentation(3, "evidence");
  }
  if (flowStep === STEP_B3_REASONING) {
    return paragraphStepPresentation(3, "reasoning");
  }

  return (
    STEP_PRESENTATION[flowStep] || {
      question: "What are you working on right now?",
      whyMatters: ["Keep your thinking tied to your thesis."],
      successLooksLike: [],
      workingSetLabel: "Your work",
      workingSetDescription: "",
      coachingMessage: "Take it one paragraph at a time.",
      nextStepText: "",
    }
  );
}
