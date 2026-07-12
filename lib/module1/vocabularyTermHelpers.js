/**
 * Module 1 vocabulary term content + presentation helpers (CP-A).
 * Visual models are data for code-native diagrams — no stock art.
 */

export const ESSAY_USE_LABEL = "In this essay, you will";

/**
 * Vocabulary taught one term at a time.
 * essayUseAction is a direct action phrase (no leading "You will").
 */
export const VOCABULARY_TERMS = Object.freeze([
  {
    id: "rhetoric",
    term: "Rhetoric",
    definition:
      "Rhetoric is the use of communication strategies to persuade an audience.",
    plainLanguage:
      "Rhetoric is the larger category. When you analyze rhetoric in this assignment, you will look at the three main rhetorical appeals—ethos, pathos, and logos—and study how King chooses to use them.",
    example:
      "King uses different combinations of ethos, pathos, and logos to persuade the audiences of his speech and his letter.",
    essayUseAction:
      "Identify which appeals King uses and explain how his choices help persuade each audience.",
    sayAnotherWay:
      "Analyzing rhetoric means examining which appeals a writer chooses, how they are used, and why they fit the audience and purpose.",
    visual: Object.freeze({
      kind: "umbrella",
      caption:
        "Rhetoric is the umbrella. Ethos, pathos, and logos are the three main appeals under it.",
      root: "Rhetoric",
      children: Object.freeze([
        "Ethos — trust and credibility",
        "Pathos — emotion",
        "Logos — reasons and evidence",
      ]),
    }),
  },
  {
    id: "ethos",
    term: "Ethos",
    definition:
      "Ethos is a rhetorical appeal that tries to persuade an audience by making the writer or speaker seem trustworthy, credible, and worth believing.",
    plainLanguage:
      "Ethos asks the audience to think: “This person is someone I can trust.”",
    example:
      "King may refer to his experience, moral authority, leadership, or shared values so an audience sees him as a credible voice.",
    essayUseAction: "Look for how King tries to earn each audience’s trust.",
    sayAnotherWay:
      "Ethos is about credibility and trust—why the audience should believe the speaker.",
    visual: Object.freeze({
      kind: "chain",
      caption:
        "Ethos moves from the writer’s credibility and trust signals to the audience’s response: seeing the speaker as trustworthy.",
      steps: Object.freeze([
        "Writer or speaker",
        "Shows knowledge, character, experience, or shared values",
        "Audience sees the speaker as trustworthy",
      ]),
    }),
  },
  {
    id: "pathos",
    term: "Pathos",
    definition:
      "Pathos is a rhetorical appeal that tries to persuade by making the reader or listener feel emotions and respond because of those emotions.",
    plainLanguage:
      "Pathos asks the audience to feel something—such as hope, anger, sadness, empathy, pride, or urgency.",
    example:
      "King describes children, injustice, dreams, and delayed freedom in ways that can make an audience feel hope, pain, anger, or urgency.",
    essayUseAction:
      "Identify the emotions King tries to create and explain how those feelings may move each audience.",
    sayAnotherWay:
      "Pathos moves people by connecting the message to what they feel.",
    visual: Object.freeze({
      kind: "chain",
      caption:
        "Pathos moves from emotion to audience response: feeling influences how the audience reacts.",
      steps: Object.freeze([
        "Words and images",
        "Create emotion",
        "Emotion influences how the audience responds",
      ]),
    }),
  },
  {
    id: "logos",
    term: "Logos",
    definition:
      "Logos is a rhetorical appeal that tries to persuade through reasons, evidence, examples, facts, and logical connections.",
    plainLanguage:
      "Logos asks the audience to think: “This idea makes sense because it is supported.”",
    example:
      "King may use historical facts, examples, comparisons, cause-and-effect reasoning, or explanations to show why his argument makes sense.",
    essayUseAction:
      "Look for the reasons and evidence King uses, then explain how they support his argument.",
    sayAnotherWay:
      "Logos is persuasion through supported reasons—not feelings alone.",
    visual: Object.freeze({
      kind: "chain",
      caption:
        "Logos moves from reasons or evidence through a clear connection to a convincing conclusion.",
      steps: Object.freeze([
        "Reason or evidence",
        "Clear connection",
        "Convincing conclusion",
      ]),
    }),
  },
  {
    id: "audience",
    term: "Audience",
    definition:
      "The audience is the person or group a writer or speaker is trying to reach and persuade.",
    plainLanguage:
      "Ask: “Who is receiving this message, and what matters to them?”",
    example:
      "The public audience of King’s speech and the clergymen reading his letter may have different concerns, expectations, and beliefs.",
    essayUseAction:
      "Identify who King is addressing and consider what that audience may value, believe, fear, or hope for.",
    sayAnotherWay: "Audience means who the message is for.",
    visual: Object.freeze({
      kind: "chain",
      caption:
        "The message is directed to a particular audience—a group with its own beliefs, concerns, and expectations.",
      steps: Object.freeze([
        "King’s message",
        "Particular audience",
        "Audience’s beliefs, concerns, and expectations",
      ]),
    }),
  },
  {
    id: "purpose",
    term: "Purpose",
    definition:
      "Purpose is what the writer or speaker wants an audience to understand, feel, believe, or do.",
    plainLanguage:
      "Ask: “What result does the writer or speaker want from this audience?”",
    example:
      "King’s purpose in a speech to the public may differ from his purpose in a letter answering clergymen, so he may emphasize different appeals.",
    essayUseAction:
      "Explain what King wants each audience to understand, feel, believe, or do.",
    sayAnotherWay:
      "Purpose is the intended result of the message for that audience.",
    visual: Object.freeze({
      kind: "chain",
      caption:
        "Purpose is the intended effect on what the audience understands, feels, believes, or does.",
      steps: Object.freeze([
        "Message",
        "Intended effect",
        "What the audience thinks, feels, believes, or does",
      ]),
    }),
  },
]);

export const VOCAB_TERM_COUNT = VOCABULARY_TERMS.length;

export function getVocabularyTerm(index) {
  const i = Math.max(0, Math.min(VOCAB_TERM_COUNT - 1, Number(index) || 0));
  return VOCABULARY_TERMS[i];
}

export function getTermProgressLabel(index) {
  const i = Math.max(0, Math.min(VOCAB_TERM_COUNT - 1, Number(index) || 0));
  return `Term ${i + 1} of ${VOCAB_TERM_COUNT}`;
}

export function advanceTermIndex(index, direction) {
  const max = VOCAB_TERM_COUNT - 1;
  const current = Math.max(0, Math.min(max, Number(index) || 0));
  if (direction === "back") return Math.max(0, current - 1);
  if (direction === "next") return Math.min(max, current + 1);
  return current;
}

export function canFinishVocabulary(termIndex) {
  return Number(termIndex) >= VOCAB_TERM_COUNT - 1;
}

/**
 * Guard against awkward “Later you will use it to: You will…” phrasing.
 * @param {object} term
 */
export function formatEssayUseLine(term) {
  const action = String(term?.essayUseAction || "").trim();
  return {
    label: ESSAY_USE_LABEL,
    action,
    combined: `${ESSAY_USE_LABEL} ${action}`,
    awkwardLegacyPattern: false,
  };
}

export function vocabularyTermHasRequiredFields(term) {
  return Boolean(
    term?.definition &&
      term?.plainLanguage &&
      term?.example &&
      term?.essayUseAction &&
      term?.visual?.kind &&
      term?.visual?.caption &&
      ((term.visual.kind === "umbrella" &&
        term.visual.root &&
        Array.isArray(term.visual.children) &&
        term.visual.children.length >= 3) ||
        (term.visual.kind === "chain" &&
          Array.isArray(term.visual.steps) &&
          term.visual.steps.length >= 2))
  );
}

export function audienceDistinctFromPurpose() {
  const audience = VOCABULARY_TERMS.find((t) => t.id === "audience");
  const purpose = VOCABULARY_TERMS.find((t) => t.id === "purpose");
  return {
    ok:
      audience &&
      purpose &&
      audience.definition !== purpose.definition &&
      /reach and persuade/i.test(audience.definition) &&
      /understand, feel, believe, or do/i.test(purpose.definition),
    audienceDefinition: audience?.definition,
    purposeDefinition: purpose?.definition,
  };
}

/**
 * Accessible figcaption must carry the essential relationship when the
 * decorative diagram is aria-hidden.
 * @param {object} term
 */
export function vocabularyCaptionCommunicatesRelationship(term) {
  const caption = String(term?.visual?.caption || "");
  const checks = {
    rhetoric:
      /rhetoric/i.test(caption) &&
      /ethos/i.test(caption) &&
      /pathos/i.test(caption) &&
      /logos/i.test(caption),
    ethos: /(credib|trust)/i.test(caption) && /audience/i.test(caption),
    pathos: /emotion/i.test(caption) && /audience|respond/i.test(caption),
    logos: /(reason|evidence)/i.test(caption) && /conclusion/i.test(caption),
    audience:
      /audience/i.test(caption) && /(belief|concern|expectation)/i.test(caption),
    purpose: /(effect|understand|feel|believe|does)/i.test(caption),
  };
  return Boolean(checks[term?.id]);
}
