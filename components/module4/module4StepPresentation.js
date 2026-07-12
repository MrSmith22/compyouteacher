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

export function completedBucketIndices(flowStep, buckets) {
  const list = Array.isArray(buckets) ? buckets : [];
  const done = [];

  if (flowStep > STEP_B1_REASONING && (list[0]?.claim || "").trim()) {
    done.push(0);
  }
  if (flowStep > STEP_B2_REASONING && (list[1]?.claim || "").trim()) {
    done.push(1);
  }
  if (flowStep > STEP_B3_REASONING && (list[2]?.claim || "").trim()) {
    done.push(2);
  }

  return done;
}

function paragraphStepPresentation(paragraphNumber, phase) {
  const n = paragraphNumber;
  const phases = {
    scaffold: {
      question: `What is paragraph ${n} going to prove?`,
      whyMatters: [
        "Each body paragraph should prove one part of your thesis.",
        "You are building one piece of your argument at a time—not the whole essay at once.",
      ],
      successLooksLike: [
        `Paragraph ${n} has a clear idea you could explain to a classmate.`,
        "The idea sounds like your thinking, not a fill-in-the-blank answer.",
      ],
      workingSetLabel: `Paragraph ${n} — main idea`,
      workingSetDescription: "On your desk: the idea you are shaping for this paragraph.",
      coachingMessage:
        "Pick a suggestion if it helps you start, then revise the wording until it sounds like you.",
      nextStepText: `Next you will decide what job this paragraph does, then choose evidence and explanation.`,
    },
    role: {
      question: `What job does paragraph ${n} do in your essay?`,
      whyMatters: [
        "Essays move in steps—not as a list of quotes.",
        "Naming the job of this paragraph helps you line it up with your thesis.",
      ],
      successLooksLike: [
        "You can say whether this paragraph shows a similarity, a difference, or a rhetorical move.",
      ],
      workingSetLabel: `Paragraph ${n} — its job`,
      workingSetDescription: "On your desk: the role this paragraph plays in your argument.",
      coachingMessage:
        "Choose the option that matches what this paragraph is actually doing—not what sounds impressive.",
      nextStepText: "Next you will choose the quotes that belong in this paragraph.",
    },
    evidence: {
      question: `Which quotes belong in paragraph ${n}?`,
      whyMatters: [
        "You are not collecting random quotes—you are choosing lines that belong to this paragraph's job.",
        "Ask whether each quote really supports this paragraph idea.",
      ],
      successLooksLike: [
        "At least one quote is checked for this paragraph.",
        "Each quote you chose fits the paragraph idea you already wrote.",
      ],
      workingSetLabel: `Paragraph ${n} — evidence`,
      workingSetDescription: "On your desk: the quotes you are assigning to this paragraph.",
      coachingMessage:
        "If a quote does not fit this paragraph idea, leave it unchecked. You can use it elsewhere.",
      nextStepText: "Next you will explain how your evidence supports your thesis.",
    },
    reasoning: {
      question: `How does paragraph ${n} support your thesis?`,
      whyMatters: [
        "Reasoning is where analysis becomes writing.",
        "This is where you connect your quotes to your thesis in your own words.",
      ],
      successLooksLike: [
        "Your explanation says what the evidence shows—not just what the quote says.",
        "A reader could see how this paragraph helps prove your thesis.",
      ],
      workingSetLabel: `Paragraph ${n} — explanation`,
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
