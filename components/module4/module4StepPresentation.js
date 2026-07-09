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
  STEP_BIG_PICTURE,
  STEP_EXPLAIN_BUCKETS,
  STEP_PATTERN,
  STEP_REFLECTION,
  STEP_THIRD_DECISION,
  STEP_WELCOME,
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
  [STEP_WELCOME]: {
    question: "How do I turn my thesis into paragraph plans?",
    whyMatters: [
      "You already did close reading and built a thesis in Module 3.",
      "This module shows how to turn that work into clear paragraph ideas—one small step at a time.",
    ],
    successLooksLike: [
      "You understand that each paragraph plan becomes a body paragraph later.",
    ],
    workingSetLabel: "Getting started",
    workingSetDescription: "On your desk: what this module will help you build.",
    coachingMessage:
      "You are not writing the whole essay here—just making the next layer of your argument clear.",
    nextStepText: "First, reconnect to the thesis and proof directions you built in Module 3.",
  },
  [STEP_BIG_PICTURE]: {
    question: "What am I trying to prove in this essay?",
    whyMatters: [
      "Before you plan paragraphs, reconnect to the argument you already built.",
      "Every paragraph idea should help prove your thesis—not wander off on its own.",
    ],
    successLooksLike: [
      "You can name your thesis in your own words.",
      "You see how your proof directions connect to that thesis.",
    ],
    workingSetLabel: "Your argument so far",
    workingSetDescription: "On your desk: reconnecting to your thesis before you plan paragraphs.",
    coachingMessage:
      "Keep asking: does this idea help prove my thesis? That question stays with you through every paragraph.",
    nextStepText: "Next you will learn what a paragraph plan includes.",
  },
  [STEP_EXPLAIN_BUCKETS]: {
    question: "What is a paragraph plan?",
    whyMatters: [
      "A paragraph plan holds the main idea, the quotes, and the explanation for one body paragraph.",
      "You will build at least two paragraph plans. A third is optional if your thesis needs another layer.",
    ],
    successLooksLike: [
      "You can explain what goes inside one paragraph plan.",
    ],
    workingSetLabel: "Paragraph plans",
    workingSetDescription: "On your desk: learning what you are building in this module.",
    coachingMessage:
      "Each paragraph plan becomes a body paragraph later. You are planning the thinking first.",
    nextStepText: "Next you will reconnect to a pattern—or notice one—that can anchor your paragraphs.",
  },
  [STEP_PATTERN]: {
    question: "What pattern connects your evidence?",
    whyMatters: [
      "A pattern is something you notice that shows up in more than one place.",
      "Strong paragraphs grow from real connections—not random details.",
    ],
    successLooksLike: [
      "You can name an idea that repeats or connects across your texts.",
    ],
    workingSetLabel: "Pattern",
    workingSetDescription: "On your desk: the connection you will build paragraphs from.",
    coachingMessage:
      "There is not always one right label. The goal is to name what repeats so your paragraphs have a center.",
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
