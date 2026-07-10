/**
 * Shared MLK-themed placeholder content for developer seeds.
 * Coherent enough for walkthrough testing — not lorem ipsum.
 */

export const SEED_THESIS =
  "Although both the speech and the letter argue for justice, King uses emotional appeals more openly in the speech and builds careful credibility in the letter so each audience will listen.";

export const SEED_PROOF_PLAN = [
  "King builds trust differently for each audience.",
  "King uses emotional language to move public listeners.",
  "King uses logic and moral reasoning to answer the clergymen.",
];

export const SEED_SPEECH_TEXT = `
Five score years ago, a great American signed the Emancipation Proclamation. This momentous decree came as a great beacon light of hope to millions of Negro slaves who had been seared in the flames of withering injustice. But one hundred years later, the Negro still is not free.

I have a dream that one day this nation will rise up and live out the true meaning of its creed: We hold these truths to be self-evident, that all men are created equal. I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.

Let freedom ring from the prodigious hilltops of New Hampshire. Let freedom ring from the mighty mountains of New York. Let freedom ring from every hill and molehill of Mississippi. From every mountainside, let freedom ring.

And when this happens, we will be able to speed up that day when all of God's children will be able to join hands and sing in the words of the old Negro spiritual: Free at last! Free at last! Thank God Almighty, we are free at last!
`.trim();

export const SEED_LETTER_TEXT = `
My Dear Fellow Clergymen:

While confined here in the Birmingham city jail, I came across your recent statement calling my present activities "unwise and untimely." Seldom do I pause to answer criticism of my work and ideas. But since I feel that you are men of genuine good will and that your criticisms are sincerely set forth, I want to try to answer your statement in what I hope will be patient and reasonable terms.

I am in Birmingham because injustice is here. Injustice anywhere is a threat to justice everywhere. We are caught in an inescapable network of mutuality, tied in a single garment of destiny. Whatever affects one directly, affects all indirectly.

We know through painful experience that freedom is never voluntarily given by the oppressor; it must be demanded by the oppressed. Frankly, I have yet to engage in a direct action campaign that was "well timed" in the view of those who have not suffered unduly from the disease of segregation. For years now I have heard the word Wait! It rings in the ear of every Negro with piercing familiarity. This Wait has almost always meant Never. We must come to see, with one of our distinguished jurists, that justice too long delayed is justice denied.

In any nonviolent campaign there are four basic steps: collection of the facts to determine whether injustices exist; negotiation; self purification; and direct action. We have gone through all these steps in Birmingham.
`.trim();

export const SEED_TCHART = [
  {
    category: "ethos",
    type: "speech",
    quote:
      "Five score years ago, a great American signed the Emancipation Proclamation.",
    observation:
      "King connects himself to Lincoln and American history so the crowd trusts him as a serious national voice.",
  },
  {
    category: "pathos",
    type: "speech",
    quote:
      "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.",
    observation:
      "King uses the image of children to make the audience feel hope and urgency about fairness.",
  },
  {
    category: "logos",
    type: "speech",
    quote:
      "We hold these truths to be self-evident, that all men are created equal.",
    observation:
      "King uses the Declaration of Independence as a clear standard the nation already claims to believe.",
  },
  {
    category: "ethos",
    type: "letter",
    quote: "My Dear Fellow Clergymen:",
    observation:
      "King addresses the ministers respectfully, showing he is a fellow religious leader worth hearing.",
  },
  {
    category: "pathos",
    type: "letter",
    quote:
      'This "Wait" has almost always meant "Never."',
    observation:
      "King makes the pain of delay feel personal so the clergymen understand why waiting is not neutral.",
  },
  {
    category: "logos",
    type: "letter",
    quote: "Injustice anywhere is a threat to justice everywhere.",
    observation:
      "King gives a clear logical reason why Birmingham's problem matters beyond one city.",
  },
] as const;

export const SEED_OUTLINE = {
  thesis: SEED_THESIS,
  body: [
    {
      bucket: "King builds credibility for each audience in different ways",
      points: [
        "In the speech, he links himself to Lincoln and shared American ideals.",
        "In the letter, he speaks as a fellow clergyman with careful respect.",
      ],
    },
    {
      bucket: "King uses emotional appeals to move listeners toward justice",
      points: [
        "The dream of children being judged by character creates hope.",
        "The letter shows how the word Wait has meant Never for Black Americans.",
      ],
    },
    {
      bucket: "King uses logical arguments to prove that action is necessary",
      points: [
        "He cites the nation's own creed that all men are created equal.",
        "He argues that injustice anywhere threatens justice everywhere.",
      ],
    },
  ],
  conclusion: {
    summary:
      "King adapts ethos, pathos, and logos so each audience can accept his call for justice.",
    finalThought:
      "The same moral goal can require different rhetorical choices depending on who must be persuaded.",
  },
};

export const SEED_INTRO = `Martin Luther King Jr. wrote and spoke to different audiences during the civil rights movement, but his goal stayed the same: to demand justice. In the "I Have a Dream" speech, he addresses a large public crowd. In "Letter from Birmingham Jail," he answers white clergymen who criticized his protests. ${SEED_THESIS}`;

export const SEED_BODY_1 = `First, King builds credibility in ways that fit each audience. In the speech, he begins with "five score years ago," connecting his message to Lincoln and American history so listeners trust him as a national voice. In the letter, he opens with "My Dear Fellow Clergymen," showing respect and reminding the ministers that he shares their religious calling. These choices help each group take him seriously before he asks them to change.`;

export const SEED_BODY_2 = `Second, King uses emotional appeals to make injustice feel urgent. When he describes his dream for his four little children, the crowd can feel hope and responsibility at the same time. In the letter, he explains that the word "Wait" has almost always meant "Never," turning delay into something painful rather than patient. By making the cost of waiting vivid, King pushes both audiences to care about timing as well as fairness.`;

export const SEED_BODY_3 = `Third, King supports his call for action with clear reasoning. He quotes the Declaration of Independence to show that equality is already part of America's stated creed. He also argues that "injustice anywhere is a threat to justice everywhere," giving a logical reason why Birmingham matters beyond one city. These arguments make his protest look necessary, not reckless.`;

export const SEED_CONCLUSION = `In both texts, King adapts ethos, pathos, and logos so his audience will listen. The speech inspires a public crowd with shared ideals and emotional hope, while the letter carefully answers religious critics with respect and reasoned proof. Together, the texts show that effective persuasion depends on knowing who must be convinced and choosing the right tools for that audience.`;

export function seedEssaySections() {
  return [SEED_INTRO, SEED_BODY_1, SEED_BODY_2, SEED_BODY_3, SEED_CONCLUSION];
}

export function seedEssayFullText() {
  return seedEssaySections().join("\n\n");
}

export function nowIso() {
  return new Date().toISOString();
}
