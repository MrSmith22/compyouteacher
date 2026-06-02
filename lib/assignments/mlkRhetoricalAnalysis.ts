export type RhetoricalStrategy = "ethos" | "pathos" | "logos";

export type SourceType = "speech" | "letter";

export type GuidedPassage = {
  id: string;
  sourceType: SourceType;
  strategy: RhetoricalStrategy;
  quote: string;
  shortInstruction: string;
};

export type MlkRhetoricalAnalysisAssignment = {
  assignmentId: string;
  title: string;
  essentialQuestion: string;
  speech: {
    title: string;
    audience: string;
    purpose: string;
  };
  letter: {
    title: string;
    audience: string;
    purpose: string;
  };
  rhetoricalStrategies: readonly RhetoricalStrategy[];
  guidedPassages: readonly GuidedPassage[];
};

export const mlkRhetoricalAnalysisAssignment: MlkRhetoricalAnalysisAssignment = {
  assignmentId: "mlk-rhetorical-analysis",
  title: "Comparing King's Speech and Letter",
  essentialQuestion:
    "How do King's rhetorical choices help him achieve different purposes with different audiences?",

  speech: {
    title: "I Have a Dream",
    audience:
      "A large, multiracial crowd gathered at the March on Washington for Jobs and Freedom",
    purpose:
      "Inspire hope and call the nation to act on civil rights and racial justice",
  },

  letter: {
    title: "Letter from Birmingham Jail",
    audience:
      "White clergymen and other moderate readers who questioned his methods and timing",
    purpose:
      "Defend nonviolent direct action and explain why civil rights cannot wait",
  },

  rhetoricalStrategies: ["ethos", "pathos", "logos"],

  guidedPassages: [
    {
      id: "speech-ethos",
      sourceType: "speech",
      strategy: "ethos",
      quote:
        "Five score years ago, a great American, in whose symbolic shadow we stand today, signed the Emancipation Proclamation.",
      shortInstruction:
        "Read this passage carefully. What do you notice about how King builds credibility by connecting his cause to American history and founding ideals?",
    },
    {
      id: "speech-pathos",
      sourceType: "speech",
      strategy: "pathos",
      quote:
        "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.",
      shortInstruction:
        "Read this passage carefully. What emotions does King invite his audience to feel, and how might that strengthen his message?",
    },
    {
      id: "speech-logos",
      sourceType: "speech",
      strategy: "logos",
      quote:
        "In a sense we've come to our nation's capital to cash a check, a check that will give us upon demand the riches of freedom and the security of justice.",
      shortInstruction:
        "Read this passage carefully. What logical claim is King making about America's promises, and how does the metaphor support that claim?",
    },
    {
      id: "letter-ethos",
      sourceType: "letter",
      strategy: "ethos",
      quote:
        "My Dear Fellow Clergymen: While confined here in the Birmingham city jail, I came across your recent statement calling my present activities \"unwise and untimely.\"",
      shortInstruction:
        "Read this passage carefully. What do you notice about how King establishes his credibility and relationship to his readers?",
    },
    {
      id: "letter-pathos",
      sourceType: "letter",
      strategy: "pathos",
      quote:
        "But when you have seen vicious mobs lynch your mothers and fathers at will and drown your sisters and brothers at whim; when you have seen hate-filled policemen curse, kick and even kill your black brothers and sisters...",
      shortInstruction:
        "Read this passage carefully. What feelings does King ask his readers to confront, and why might that matter for his argument?",
    },
    {
      id: "letter-logos",
      sourceType: "letter",
      strategy: "logos",
      quote:
        "An unjust law is a human law that is not rooted in eternal law and natural law. Any law that uplifts human personality is just. Any law that degrades human personality is unjust.",
      shortInstruction:
        "Read this passage carefully. What reasoning does King use to define just and unjust laws, and how does that logic support his position?",
    },
  ],
};
