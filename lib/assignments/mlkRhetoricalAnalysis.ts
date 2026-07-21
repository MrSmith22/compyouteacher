import { MLK_ASSIGNMENT_ID } from "./identity";

export type RhetoricalStrategy = "ethos" | "pathos" | "logos";

export type SourceType = "speech" | "letter";

export type GuidedObservationFieldDefinition = {
  label: string;
  placeholder: string;
  sentenceStarter: string;
  coachingText?: string;
};

export type GuidedObservationStrategyReminder = {
  title: string;
  definition: string;
  lookFor: string;
  keyQuestion: string;
};

export type GuidedPassage = {
  id: string;
  sourceId: SourceType;
  rhetoricalStrategy: RhetoricalStrategy;
  rhetoricalStrategyLabel: string;
  quotedPassage: string;
  observationQuestion: string;
  strategyReminder: GuidedObservationStrategyReminder;
  fields: {
    studentObservation: GuidedObservationFieldDefinition;
    audienceEffect: GuidedObservationFieldDefinition;
    purposeConnection: GuidedObservationFieldDefinition;
    essentialQuestionConnection: GuidedObservationFieldDefinition;
  };
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

const GUIDED_OBSERVATION_SCAFFOLDING: Record<
  RhetoricalStrategy,
  Omit<GuidedPassage, "id" | "sourceId" | "quotedPassage" | "observationQuestion">
> = {
  ethos: {
    rhetoricalStrategy: "ethos",
    rhetoricalStrategyLabel: "Ethos",
    strategyReminder: {
      title: "Strategy reminder — Ethos",
      definition: "Ethos is about credibility and trust.",
      lookFor:
        "Look for how King presents himself as trustworthy, moral, knowledgeable, fair, religious, patriotic, or connected to respected ideas.",
      keyQuestion: "Why should this audience believe him?",
    },
    fields: {
      studentObservation: {
        label: "What do you notice about how King builds credibility or earns trust here?",
        placeholder: "King builds credibility here by…",
        sentenceStarter: "King builds credibility here by…",
      },
      audienceEffect: {
        label: "What effect might this have on King's audience?",
        placeholder: "King wants his audience to feel…",
        sentenceStarter: "King wants his audience to feel…",
        coachingText:
          "Ethos hint: How might credibility or trust affect this audience?",
      },
      purposeConnection: {
        label: "How does this help King accomplish his purpose?",
        placeholder: "By using ethos, King…",
        sentenceStarter: "By using ethos, King…",
        coachingText:
          "Ethos hint: How might building trust help King accomplish his purpose with this audience?",
      },
      essentialQuestionConnection: {
        label: "How does this connect to the essential question?",
        placeholder:
          "This shows how King uses ethos differently with this audience because…",
        sentenceStarter:
          "This shows how King uses ethos differently with this audience because…",
        coachingText:
          "Ethos hint: How does King's credibility work differently with this audience than with another?",
      },
    },
  },
  pathos: {
    rhetoricalStrategy: "pathos",
    rhetoricalStrategyLabel: "Pathos",
    strategyReminder: {
      title: "Strategy reminder — Pathos",
      definition: "Pathos is about emotion.",
      lookFor:
        "Look for words or images that make the audience feel hope, anger, sadness, urgency, guilt, pride, or sympathy.",
      keyQuestion: "What feeling is King trying to create?",
    },
    fields: {
      studentObservation: {
        label: "What do you notice about how King creates emotion here?",
        placeholder: "King creates emotion here by…",
        sentenceStarter: "King creates emotion here by…",
      },
      audienceEffect: {
        label: "What effect might this have on King's audience?",
        placeholder: "King wants his audience to feel…",
        sentenceStarter: "King wants his audience to feel…",
        coachingText: "Pathos hint: What might this make the audience feel?",
      },
      purposeConnection: {
        label: "How does this help King accomplish his purpose?",
        placeholder: "By using pathos, King…",
        sentenceStarter: "By using pathos, King…",
        coachingText:
          "Pathos hint: How might this emotion help King accomplish his purpose with this audience?",
      },
      essentialQuestionConnection: {
        label: "How does this connect to the essential question?",
        placeholder:
          "This shows how King uses pathos differently with this audience because…",
        sentenceStarter:
          "This shows how King uses pathos differently with this audience because…",
        coachingText:
          "Pathos hint: How does King use emotion differently with this audience than with another?",
      },
    },
  },
  logos: {
    rhetoricalStrategy: "logos",
    rhetoricalStrategyLabel: "Logos",
    strategyReminder: {
      title: "Strategy reminder — Logos",
      definition: "Logos is about reasoning.",
      lookFor:
        "Look for definitions, examples, cause and effect, comparisons, facts, or logical explanations.",
      keyQuestion: "How is King trying to make his argument make sense?",
    },
    fields: {
      studentObservation: {
        label: "What do you notice about how King uses reasoning or explanation here?",
        placeholder: "King uses reasoning here by…",
        sentenceStarter: "King uses reasoning here by…",
      },
      audienceEffect: {
        label: "What effect might this have on King's audience?",
        placeholder: "King wants his audience to feel…",
        sentenceStarter: "King wants his audience to feel…",
        coachingText:
          "Logos hint: How might this reasoning help the audience understand his argument?",
      },
      purposeConnection: {
        label: "How does this help King accomplish his purpose?",
        placeholder: "By using logos, King…",
        sentenceStarter: "By using logos, King…",
        coachingText:
          "Logos hint: How might this logical explanation help King accomplish his purpose?",
      },
      essentialQuestionConnection: {
        label: "How does this connect to the essential question?",
        placeholder:
          "This shows how King uses logos differently with this audience because…",
        sentenceStarter:
          "This shows how King uses logos differently with this audience because…",
        coachingText:
          "Logos hint: How does King's reasoning work differently with this audience than with another?",
      },
    },
  },
};

export const mlkRhetoricalAnalysisAssignment: MlkRhetoricalAnalysisAssignment = {
  assignmentId: MLK_ASSIGNMENT_ID,
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
      sourceId: "speech",
      quotedPassage:
        "Five score years ago, a great American, in whose symbolic shadow we stand today, signed the Emancipation Proclamation.",
      observationQuestion:
        "Read this passage carefully. What do you notice about how King builds credibility by connecting his cause to American history and founding ideals?",
      ...GUIDED_OBSERVATION_SCAFFOLDING.ethos,
    },
    {
      id: "speech-pathos",
      sourceId: "speech",
      quotedPassage:
        "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.",
      observationQuestion:
        "Read this passage carefully. What emotions does King invite his audience to feel, and how might that strengthen his message?",
      ...GUIDED_OBSERVATION_SCAFFOLDING.pathos,
    },
    {
      id: "speech-logos",
      sourceId: "speech",
      quotedPassage:
        "In a sense we've come to our nation's capital to cash a check, a check that will give us upon demand the riches of freedom and the security of justice.",
      observationQuestion:
        "Read this passage carefully. What logical claim is King making about America's promises, and how does the metaphor support that claim?",
      ...GUIDED_OBSERVATION_SCAFFOLDING.logos,
    },
    {
      id: "letter-ethos",
      sourceId: "letter",
      quotedPassage:
        "My Dear Fellow Clergymen: While confined here in the Birmingham city jail, I came across your recent statement calling my present activities \"unwise and untimely.\"",
      observationQuestion:
        "Read this passage carefully. What do you notice about how King establishes his credibility and relationship to his readers?",
      ...GUIDED_OBSERVATION_SCAFFOLDING.ethos,
    },
    {
      id: "letter-pathos",
      sourceId: "letter",
      quotedPassage:
        "But when you have seen vicious mobs lynch your mothers and fathers at will and drown your sisters and brothers at whim; when you have seen hate-filled policemen curse, kick and even kill your black brothers and sisters...",
      observationQuestion:
        "Read this passage carefully. What feelings does King ask his readers to confront, and why might that matter for his argument?",
      ...GUIDED_OBSERVATION_SCAFFOLDING.pathos,
    },
    {
      id: "letter-logos",
      sourceId: "letter",
      quotedPassage:
        "An unjust law is a human law that is not rooted in eternal law and natural law. Any law that uplifts human personality is just. Any law that degrades human personality is unjust.",
      observationQuestion:
        "Read this passage carefully. What reasoning does King use to define just and unjust laws, and how does that logic support his position?",
      ...GUIDED_OBSERVATION_SCAFFOLDING.logos,
    },
  ],
};
