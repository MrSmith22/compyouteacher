/**
 * WP-090 — Generalized transfer-oriented vocabulary lesson contracts.
 * Pure content; no student answers. One registry for all six canonical terms.
 *
 * Roles:
 * - umbrella: rhetoric
 * - appeal: ethos, pathos, logos
 * - situation: audience
 * - goal: purpose
 */

import { VOCABULARY_TERMS } from "./vocabularyTermHelpers.js";
import {
  ETHOS_KING_PASSAGE,
  ETHOS_ANALYTICAL_ANCHOR,
  ETHOS_TRANSFER_STEPS,
  getEthosTransferLessonContract as getLegacyEthosContract,
} from "./ethosTransferLessonContract.js";

export const VOCABULARY_TRANSFER_SCHEMA_VERSION = 2;
export const VOCABULARY_TRANSFER_TERM_STATE_VERSION = 1;

export const VOCABULARY_TRANSFER_TERM_IDS = Object.freeze(
  VOCABULARY_TERMS.map((t) => t.id)
);

export const SHARED_ANALYTICAL_ANCHOR = ETHOS_ANALYTICAL_ANCHOR;

export const TEACHING_FEEDBACK_HEADINGS = Object.freeze({
  correct: "That works.",
  incorrect: "Let’s look closer.",
});

/** Default microsteps for umbrella + appeal terms. */
export const DEFAULT_TRANSFER_STEPS = Object.freeze([
  "notice",
  "name_boundary",
  "audience_effect",
  "purpose",
  "king_apply",
  "assignment_transfer",
]);

export const AUDIENCE_TRANSFER_STEPS = Object.freeze([
  "notice",
  "name_boundary",
  "audience_fit",
  "king_apply",
  "assignment_transfer",
]);

export const PURPOSE_TRANSFER_STEPS = Object.freeze([
  "notice",
  "name_boundary",
  "purpose_result",
  "king_apply",
  "assignment_transfer",
]);

function freezeOptions(options) {
  return Object.freeze(options.map((o) => Object.freeze({ ...o })));
}

function passage(meta) {
  return Object.freeze({ ...meta });
}

/**
 * Verified King / assignment passages — quotations must match guidedPassages.
 */
export const VOCABULARY_TRANSFER_PASSAGES = Object.freeze({
  rhetoric: passage({
    sourceId: "speech",
    guidedPassageId: "speech-logos",
    quotation:
      "In a sense we've come to our nation's capital to cash a check, a check that will give us upon demand the riches of freedom and the security of justice.",
    passageLocator: "Dream speech — promissory-note / check metaphor",
    citationSafeNote:
      "Assignment-owned guided passage (speech-logos). Students later verify the full speech from their saved source.",
    whySafe:
      "King makes a deliberate rhetorical strategy: an extended metaphor that frames a political claim so the audience can follow it.",
  }),
  ethos: ETHOS_KING_PASSAGE,
  pathos: passage({
    sourceId: "speech",
    guidedPassageId: "speech-pathos",
    quotation:
      "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.",
    passageLocator: "Dream speech — children / character dream",
    citationSafeNote:
      "Assignment-owned guided passage (speech-pathos).",
    whySafe:
      "King invites hope and moral urgency through a vivid image of children and fairness—an emotional move in service of purpose.",
  }),
  logos: passage({
    sourceId: "letter",
    guidedPassageId: "letter-logos",
    quotation:
      "An unjust law is a human law that is not rooted in eternal law and natural law. Any law that uplifts human personality is just. Any law that degrades human personality is unjust.",
    passageLocator: "Letter — just vs unjust law definition",
    citationSafeNote:
      "Assignment-owned guided passage (letter-logos).",
    whySafe:
      "King connects definitions to a conclusion so readers can follow why some laws should be opposed.",
  }),
  audience: passage({
    sourceId: "letter",
    guidedPassageId: "letter-ethos",
    quotation:
      'My Dear Fellow Clergymen: While confined here in the Birmingham city jail, I came across your recent statement calling my present activities "unwise and untimely."',
    passageLocator: "Letter opening — address to fellow clergymen",
    citationSafeNote:
      "Assignment-owned guided passage (letter-ethos). Shows audience-specific address.",
    whySafe:
      "King names a particular audience (fellow clergymen) and answers their statement—fit depends on who is being addressed.",
    verifyNeedle: "My Dear Fellow Clergymen: While confined here in the Birmingham city jail",
  }),
  purpose: passage({
    sourceId: "letter",
    guidedPassageId: "letter-pathos",
    quotation:
      "But when you have seen vicious mobs lynch your mothers and fathers at will and drown your sisters and brothers at whim; when you have seen hate-filled policemen curse, kick and even kill your black brothers and sisters...",
    passageLocator: "Letter — confrontational catalogue of injustice",
    citationSafeNote:
      "Assignment-owned guided passage (letter-pathos).",
    whySafe:
      "King wants clergymen to confront delayed justice as urgent and morally serious—an intended result for that audience.",
  }),
});

function buildEthosContractFromLegacy() {
  const legacy = getLegacyEthosContract();
  return Object.freeze({
    termId: "ethos",
    studentFacingName: "Ethos",
    role: "appeal",
    schemaVersion: VOCABULARY_TRANSFER_TERM_STATE_VERSION,
    analyticalAnchor: SHARED_ANALYTICAL_ANCHOR,
    stepIds: ETHOS_TRANSFER_STEPS,
    familiarScenario: legacy.familiarScenario,
    definition: legacy.definition,
    boundary: Object.freeze({
      prompt: legacy.exampleNonexample.prompt,
      options: legacy.exampleNonexample.options,
    }),
    audienceEffect: legacy.audienceEffect,
    purposeConnection: legacy.purposeConnection,
    audienceFit: null,
    purposeResult: null,
    kingPassage: legacy.kingPassage,
    kingApplication: legacy.kingApplication,
    assignmentTransfer: Object.freeze({
      ...legacy.assignmentTransfer,
      transferStatement:
        "Your essay will compare how King’s credibility choices fit different audiences and purposes. Ethos is one lens: notice a trust-building choice, predict how it may affect an audience, and explain how that response could help the purpose.",
    }),
    conceptMap: null,
    teachingFeedback: legacy.teachingFeedback,
    completionCriteria: legacy.completionCriteria,
    cumulativeCue: "Ethos: a choice may build credibility or trust.",
  });
}

function getRhetoricContract() {
  return Object.freeze({
    termId: "rhetoric",
    studentFacingName: "Rhetoric",
    role: "umbrella",
    schemaVersion: VOCABULARY_TRANSFER_TERM_STATE_VERSION,
    analyticalAnchor: SHARED_ANALYTICAL_ANCHOR,
    stepIds: DEFAULT_TRANSFER_STEPS,
    familiarScenario: Object.freeze({
      id: "group_project_message",
      title: "Same update, different wording",
      situation:
        "You need your group to finish a project by Friday. Version A: “Hey — can you try to wrap your part when you get a chance?” Version B: “We need each part done by Thursday night so we can revise Friday.”",
      audience: "Your project group",
      purpose: "Get the project finished on time with room to revise",
      noticePrompt:
        "Before we name any academic term: which message makes a clearer strategic choice for this goal?",
      noticeOptions: freezeOptions([
        {
          id: "version_b_deadline",
          label: "Version B — it sets a clear timeline tied to the shared goal",
          isTarget: true,
          explanation:
            "That works. Version B makes a purposeful communication choice: a specific timeline that helps the group act.",
        },
        {
          id: "version_a_vague",
          label: "Version A — “when you get a chance” is friendlier, so it must be better",
          isTarget: false,
          explanation:
            "Let’s look closer. Friendliness alone is not the strategic choice here. Rhetoric is about purposeful choices for audience and goal—not just sounding nice.",
        },
      ]),
      communicationChoice:
        "Choosing wording that makes the timeline and shared goal clearer for the group",
    }),
    definition: Object.freeze({
      academic:
        "Rhetoric is the use of communication strategies to persuade an audience.",
      plainLanguage:
        "Rhetoric is the larger category of purposeful communication choices—not just fancy words or “spin.”",
      bridge:
        "You noticed a strategic wording choice. Analyzing rhetoric means studying choices like that—and the appeals that often support them.",
    }),
    boundary: Object.freeze({
      prompt:
        "Which statement correctly describes rhetoric for this assignment?",
      options: freezeOptions([
        {
          id: "umbrella_correct",
          label:
            "Example: Rhetoric is the umbrella of strategic choices; ethos, pathos, and logos are important lenses under it.",
          kind: "example",
          isTarget: true,
          explanation:
            "That works. Rhetoric is the larger category. Ethos, pathos, and logos are key analytical lenses inside that umbrella—not the whole of rhetoric by themselves.",
        },
        {
          id: "only_appeals",
          label:
            "Nonexample: Rhetoric means only ethos, pathos, and logos—and nothing else counts as a rhetorical choice.",
          kind: "nonexample",
          isTarget: false,
          explanation:
            "Let’s look closer. Those three appeals are central here, but rhetoric is broader: any purposeful communication strategy for an audience and goal.",
        },
      ]),
    }),
    audienceEffect: Object.freeze({
      namedAudience: "Your project group",
      audienceContext: "They need a clear plan so the project can be finished on time.",
      prompt:
        "If you choose Version B’s clear timeline, what might that choice make this audience think or do?",
      options: freezeOptions([
        {
          id: "more_ready_to_act",
          label: "They may be more ready to plan and finish on time",
          isTarget: true,
          explanation:
            "That works. A clear strategic choice can make an audience more ready to act—without guaranteeing everyone will.",
        },
        {
          id: "definitely_angry",
          label: "They will definitely feel attacked and quit the group",
          isTarget: false,
          explanation:
            "Let’s look closer. We cannot claim certainty about every reaction, and the goal here is clarity for shared work—not predicting collapse.",
        },
      ]),
      uncertaintyCue: "Use “may” or “could”—audience effects are likely, not certain.",
    }),
    purposeConnection: Object.freeze({
      communicatorPurpose: "Get the project finished on time with room to revise",
      prompt:
        "How could that audience response help accomplish the purpose?",
      options: freezeOptions([
        {
          id: "action_supports_deadline",
          label:
            "If the group acts sooner, they are more likely to finish with time to revise",
          isTarget: true,
          explanation:
            "That works. The wording choice supports the purpose by making timely action more likely.",
        },
        {
          id: "wording_irrelevant",
          label: "Wording never matters if the topic is the same",
          isTarget: false,
          explanation:
            "Let’s look closer. Rhetoric is about how choices shape audience response toward a result—not only what topic is named.",
        },
      ]),
    }),
    audienceFit: null,
    purposeResult: null,
    kingPassage: VOCABULARY_TRANSFER_PASSAGES.rhetoric,
    kingApplication: Object.freeze({
      prompt:
        "King chooses an extended “cash a check” metaphor. What strategic rhetorical choice is he making?",
      options: freezeOptions([
        {
          id: "metaphor_strategy",
          label:
            "He frames America’s promise as a check that should be honored—so the audience can follow a clear claim",
          isTarget: true,
          explanation:
            "That works. The metaphor is a deliberate rhetorical strategy that helps the audience grasp the claim.",
        },
        {
          id: "only_emotion_label",
          label: "He is only listing random feelings with no strategy",
          isTarget: false,
          explanation:
            "Let’s look closer. This line builds a purposeful comparison; rhetoric is about strategic choices, not random emotion labels.",
        },
        {
          id: "only_credentials",
          label: "He is mainly listing his personal awards and titles",
          isTarget: false,
          explanation:
            "Let’s look closer. This passage is a reasoned metaphor about national promises, not a résumé of credentials.",
        },
      ]),
      followUpStem:
        "This choice may help his audience follow the argument because…",
      followUpPlaceholder: "Finish with one short reason (optional but helpful).",
      requiresTransferNotDefinition: true,
    }),
    assignmentTransfer: Object.freeze({
      deskLabel: "What this assignment asks",
      transferStatement:
        "Your essay studies how King chooses different rhetorical resources in a speech and a letter. Rhetoric is the umbrella: notice a strategic choice, consider the audience, and explain how the response could serve the purpose.",
      essayUseCue:
        "Identify which appeals King uses and explain how his choices help persuade each audience.",
      confirmPrompt: "Ready to use this umbrella lens for the next terms?",
      confirmLabel: "Yes — I’ll use choice → audience effect → purpose",
    }),
    conceptMap: null,
    teachingFeedback: Object.freeze({ headings: TEACHING_FEEDBACK_HEADINGS }),
    completionCriteria: Object.freeze({
      requireNoticeDecision: true,
      requireDefinitionSeen: true,
      requireBoundaryDecision: true,
      requireAudienceEffectDecision: true,
      requirePurposeConnection: true,
      requireKingApplication: true,
      requireAssignmentTransferSeen: true,
      notByTextLength: true,
    }),
    cumulativeCue: "Rhetoric: communicators make strategic choices.",
  });
}

function getPathosContract() {
  return Object.freeze({
    termId: "pathos",
    studentFacingName: "Pathos",
    role: "appeal",
    schemaVersion: VOCABULARY_TRANSFER_TERM_STATE_VERSION,
    analyticalAnchor: SHARED_ANALYTICAL_ANCHOR,
    stepIds: DEFAULT_TRANSFER_STEPS,
    familiarScenario: Object.freeze({
      id: "tryout_message",
      title: "How do you ask teammates to show up?",
      situation:
        "Your coach needs everyone at an early practice. Message A lists the time only. Message B adds: “We’ve worked too hard to let one missed morning erase our shot at finals—let’s show up for each other.”",
      audience: "The team",
      purpose: "Get teammates to arrive ready and committed",
      noticePrompt:
        "Before we name any academic term: which message makes a deliberate emotional choice?",
      noticeOptions: freezeOptions([
        {
          id: "message_b_emotion",
          label: "Message B — it tries to create shared urgency and loyalty",
          isTarget: true,
          explanation:
            "That works. Message B deliberately shapes feeling so the team may respond with commitment.",
        },
        {
          id: "message_a_time_only",
          label: "Message A — listing the time is already an emotional appeal",
          isTarget: false,
          explanation:
            "Let’s look closer. A bare time listing is not mainly an emotional strategy. Pathos is a purposeful feeling move, not every mention of a schedule.",
        },
      ]),
      communicationChoice:
        "Using shared effort and “finals” stakes to create urgency and loyalty",
    }),
    definition: Object.freeze({
      academic:
        "Pathos is a rhetorical appeal that tries to persuade by making the reader or listener feel emotions and respond because of those emotions.",
      plainLanguage:
        "Pathos asks the audience to feel something—and to respond because of that feeling.",
      bridge:
        "You noticed a deliberate emotional choice. That is the kind of move pathos names.",
    }),
    boundary: Object.freeze({
      prompt:
        "Which choice is mainly pathos—purposeful emotional appeal—not just emotional subject matter?",
      options: freezeOptions([
        {
          id: "pathos_example",
          label:
            "Example: A speaker describes a delayed chance at fairness so the audience feels urgency to act now.",
          kind: "example",
          isTarget: true,
          explanation:
            "That works. The feeling is used on purpose to move the audience toward a response.",
        },
        {
          id: "pathos_nonexample",
          label:
            "Nonexample: A text mentions “children” once while mainly listing statistics, so it must be pathos.",
          kind: "nonexample",
          isTarget: false,
          explanation:
            "Let’s look closer. Naming an emotional topic is not automatically pathos. Pathos is a choice meant to shape feeling in service of purpose.",
        },
      ]),
    }),
    audienceEffect: Object.freeze({
      namedAudience: "The team",
      audienceContext: "They need a reason to care enough to arrive early.",
      prompt:
        "If Message B creates shared urgency, what might that choice make this audience feel or do?",
      options: freezeOptions([
        {
          id: "more_willing_to_commit",
          label:
            "They may feel more urgency and be more willing to show up for the group",
          isTarget: true,
          explanation:
            "That works. Pathos can make an audience more ready to act—without claiming every person will feel the same.",
        },
        {
          id: "prove_with_stats",
          label: "It proves the practice time with research studies",
          isTarget: false,
          explanation:
            "Let’s look closer. Studies would be a reasoning move (logos). Pathos is about feeling and readiness to respond.",
        },
      ]),
      uncertaintyCue: "Use “may” or “could”—not everyone feels the same thing.",
    }),
    purposeConnection: Object.freeze({
      communicatorPurpose: "Get teammates to arrive ready and committed",
      prompt:
        "How could that emotional response help the coach’s purpose?",
      options: freezeOptions([
        {
          id: "feeling_supports_attendance",
          label:
            "If teammates feel urgency and loyalty, they are more likely to arrive ready",
          isTarget: true,
          explanation:
            "That works. Feeling can support the purpose by making attendance and effort more likely.",
        },
        {
          id: "feeling_irrelevant",
          label: "Feelings never matter if the time is printed somewhere",
          isTarget: false,
          explanation:
            "Let’s look closer. For this purpose, willingness to care and show up is part of why the emotional choice matters.",
        },
      ]),
    }),
    audienceFit: null,
    purposeResult: null,
    kingPassage: VOCABULARY_TRANSFER_PASSAGES.pathos,
    kingApplication: Object.freeze({
      prompt:
        "What emotional move does this King line mainly make?",
      options: freezeOptions([
        {
          id: "hope_urgency_children",
          label:
            "It invites hope and moral urgency through the image of children and fair judgment",
          isTarget: true,
          explanation:
            "That works. The image is meant to shape feeling so the audience cares about justice now.",
        },
        {
          id: "only_credentials",
          label: "It mainly lists King’s titles so the audience trusts him",
          isTarget: false,
          explanation:
            "Let’s look closer. Credentials would be closer to ethos. This line leans on feeling and moral imagination.",
        },
        {
          id: "only_definitions",
          label: "It mainly defines legal terms with no emotional pull",
          isTarget: false,
          explanation:
            "Let’s look closer. This is not a legal definition passage; it invites feeling about fairness and the future.",
        },
      ]),
      followUpStem:
        "This may make his audience more ready to support justice because…",
      followUpPlaceholder: "Finish with one short reason (optional but helpful).",
      requiresTransferNotDefinition: true,
    }),
    assignmentTransfer: Object.freeze({
      deskLabel: "What this assignment asks",
      transferStatement:
        "In your essay, pathos helps you explain how King shapes feeling for different audiences—and why that feeling may support each purpose. Do not treat every emotional topic as automatic pathos.",
      essayUseCue:
        "Identify the emotions King tries to create and explain how those feelings may move each audience.",
      confirmPrompt: "Ready to keep pathos as a feeling→response lens?",
      confirmLabel: "Yes — I’ll track feeling choices and likely responses",
    }),
    conceptMap: null,
    teachingFeedback: Object.freeze({ headings: TEACHING_FEEDBACK_HEADINGS }),
    completionCriteria: Object.freeze({
      requireNoticeDecision: true,
      requireDefinitionSeen: true,
      requireBoundaryDecision: true,
      requireAudienceEffectDecision: true,
      requirePurposeConnection: true,
      requireKingApplication: true,
      requireAssignmentTransferSeen: true,
      notByTextLength: true,
    }),
    cumulativeCue: "Pathos: a choice may shape feeling or emotional urgency.",
  });
}

function getLogosContract() {
  return Object.freeze({
    termId: "logos",
    studentFacingName: "Logos",
    role: "appeal",
    schemaVersion: VOCABULARY_TRANSFER_TERM_STATE_VERSION,
    analyticalAnchor: SHARED_ANALYTICAL_ANCHOR,
    stepIds: DEFAULT_TRANSFER_STEPS,
    familiarScenario: Object.freeze({
      id: "phone_policy_debate",
      title: "Which claim is actually supported?",
      situation:
        "Your class debates a phone policy. Claim A: “Phones are bad.” Claim B: “When phones stay away during work time, more students finish the practice set before the bell—so a short phone-free block helps learning.”",
      audience: "Classmates deciding what policy to support",
      purpose: "Help the class choose a policy that supports learning",
      noticePrompt:
        "Before we name any academic term: which claim gives a clearer reason the audience can follow?",
      noticeOptions: freezeOptions([
        {
          id: "claim_b_supported",
          label: "Claim B — it connects a reason to a result the class cares about",
          isTarget: true,
          explanation:
            "That works. Claim B links evidence/reasoning to a conclusion the audience can follow.",
        },
        {
          id: "claim_a_bare",
          label: "Claim A — a short opinion is always stronger logos",
          isTarget: false,
          explanation:
            "Let’s look closer. A bare assertion is not logos. Logos needs a reason or evidence connected to a claim.",
        },
      ]),
      communicationChoice:
        "Connecting a concrete reason (finished practice) to a policy recommendation",
    }),
    definition: Object.freeze({
      academic:
        "Logos is a rhetorical appeal that tries to persuade through reasons, evidence, examples, facts, and logical connections.",
      plainLanguage:
        "Logos asks the audience to think: “This idea makes sense because it is supported.”",
      bridge:
        "You chose the supported reason. Logos names that kind of connected reasoning—not a random fact by itself.",
    }),
    boundary: Object.freeze({
      prompt:
        "Which choice is mainly logos—connected reasoning—not credentials or emotion alone?",
      options: freezeOptions([
        {
          id: "logos_example",
          label:
            "Example: A writer defines a key term and uses that definition to explain why an action is justified.",
          kind: "example",
          isTarget: true,
          explanation:
            "That works. The audience can follow how the reason supports the conclusion.",
        },
        {
          id: "logos_nonexample",
          label:
            "Nonexample: A writer drops a large number with no link to the claim, or tells a sad story instead of a reason.",
          kind: "nonexample",
          isTarget: false,
          explanation:
            "Let’s look closer. A disconnected statistic is not enough, and a sad story alone is closer to pathos. Logos needs a clear connection.",
        },
      ]),
    }),
    audienceEffect: Object.freeze({
      namedAudience: "Classmates deciding what policy to support",
      audienceContext: "They need to understand why a rule would help learning.",
      prompt:
        "If Claim B connects reason to result, what might that make this audience able to do?",
      options: freezeOptions([
        {
          id: "follow_the_case",
          label:
            "They may be better able to follow why the policy could help learning",
          isTarget: true,
          explanation:
            "That works. Logos can make a case feel understandable and plausible—without “proving” it automatically.",
        },
        {
          id: "auto_proof",
          label: "It automatically proves the policy is perfect for every school",
          isTarget: false,
          explanation:
            "Let’s look closer. Reasoning can support a claim; it does not magically prove every possible conclusion.",
        },
      ]),
      uncertaintyCue: "Reasoning supports understanding; it does not guarantee proof.",
    }),
    purposeConnection: Object.freeze({
      communicatorPurpose: "Help the class choose a policy that supports learning",
      prompt:
        "How could clearer understanding help that purpose?",
      options: freezeOptions([
        {
          id: "understanding_supports_choice",
          label:
            "If classmates can follow the reason, they are more likely to support a learning-focused policy",
          isTarget: true,
          explanation:
            "That works. Understanding can help the purpose by making a sound choice more available.",
        },
        {
          id: "understanding_irrelevant",
          label: "Reasons never matter if people already have opinions",
          isTarget: false,
          explanation:
            "Let’s look closer. For this purpose, being able to follow the case is part of why the logos choice matters.",
        },
      ]),
    }),
    audienceFit: null,
    purposeResult: null,
    kingPassage: VOCABULARY_TRANSFER_PASSAGES.logos,
    kingApplication: Object.freeze({
      prompt:
        "What reasoning move does King make in this letter passage?",
      options: freezeOptions([
        {
          id: "define_then_conclude",
          label:
            "He defines just and unjust laws, then uses that definition to support his position",
          isTarget: true,
          explanation:
            "That works. The audience can follow how the definition connects to his conclusion.",
        },
        {
          id: "random_number",
          label: "He mainly drops an unrelated statistic with no connection",
          isTarget: false,
          explanation:
            "Let’s look closer. This passage builds a definitional chain, not a disconnected number.",
        },
        {
          id: "only_tears",
          label: "He mainly tries to make readers cry without any reasoning",
          isTarget: false,
          explanation:
            "Let’s look closer. Feeling may appear elsewhere; this line is a reasoning structure about laws.",
        },
      ]),
      followUpStem:
        "This may help clergymen follow his case because…",
      followUpPlaceholder: "Finish with one short reason (optional but helpful).",
      requiresTransferNotDefinition: true,
    }),
    assignmentTransfer: Object.freeze({
      deskLabel: "What this assignment asks",
      transferStatement:
        "In your essay, logos helps you explain how King connects reasons and evidence so each audience can follow his case—not how he “drops a fact” once.",
      essayUseCue:
        "Look for the reasons and evidence King uses, then explain how they support his argument.",
      confirmPrompt: "Ready to treat logos as connected support?",
      confirmLabel: "Yes — I’ll look for reasons linked to claims",
    }),
    conceptMap: null,
    teachingFeedback: Object.freeze({ headings: TEACHING_FEEDBACK_HEADINGS }),
    completionCriteria: Object.freeze({
      requireNoticeDecision: true,
      requireDefinitionSeen: true,
      requireBoundaryDecision: true,
      requireAudienceEffectDecision: true,
      requirePurposeConnection: true,
      requireKingApplication: true,
      requireAssignmentTransferSeen: true,
      notByTextLength: true,
    }),
    cumulativeCue: "Logos: a choice may help the audience follow reasoning or evidence.",
  });
}

function getAudienceContract() {
  return Object.freeze({
    termId: "audience",
    studentFacingName: "Audience",
    role: "situation",
    schemaVersion: VOCABULARY_TRANSFER_TERM_STATE_VERSION,
    analyticalAnchor: SHARED_ANALYTICAL_ANCHOR,
    stepIds: AUDIENCE_TRANSFER_STEPS,
    familiarScenario: Object.freeze({
      id: "same_request_two_audiences",
      title: "Same request, two audiences",
      situation:
        "You need a quiet place to study. Message to a younger sibling: “Can you keep it down for an hour? I’ve got a quiz tomorrow.” Message to a teacher: “Could I use the study room after school? I need a quiet place to prepare for tomorrow’s quiz.”",
      audience: "Two different people you are asking for help",
      purpose: "Get a quiet study situation",
      noticePrompt:
        "Before we name any academic term: which difference matters most between the two messages?",
      noticeOptions: freezeOptions([
        {
          id: "fit_to_audience",
          label:
            "The wording changes to fit who is being asked—sibling vs teacher",
          isTarget: true,
          explanation:
            "That works. The same need is phrased differently because the audience’s role and expectations differ.",
        },
        {
          id: "topic_is_audience",
          label: "The audience is just the topic “studying,” so the wording should be identical",
          isTarget: false,
          explanation:
            "Let’s look closer. Audience is the people addressed—not the topic. Topic can stay the same while audience changes.",
        },
      ]),
      communicationChoice:
        "Adjusting tone and detail to fit the person being asked",
    }),
    definition: Object.freeze({
      academic:
        "The audience is the person or group a writer or speaker is trying to reach and persuade.",
      plainLanguage:
        "Ask: “Who is receiving this message, and what matters to them?”",
      bridge:
        "You noticed that the same request changes for different people. That is what audience names.",
    }),
    boundary: Object.freeze({
      prompt: "Which statement correctly separates audience from purpose or topic?",
      options: freezeOptions([
        {
          id: "audience_example",
          label:
            "Example: Audience is who receives the message (their beliefs, needs, expectations, situation).",
          kind: "example",
          isTarget: true,
          explanation:
            "That works. Audience is the people addressed—not the result you want or the subject alone.",
        },
        {
          id: "audience_nonexample",
          label:
            "Nonexample: Audience means the topic, or “everyone,” or the purpose of the message.",
          kind: "nonexample",
          isTarget: false,
          explanation:
            "Let’s look closer. Topic is the subject; purpose is the intended result; “everyone” erases the particular group King addresses.",
        },
      ]),
    }),
    audienceEffect: null,
    purposeConnection: null,
    audienceFit: Object.freeze({
      prompt:
        "A choice is made for an audience → likely effect → purpose. Which option best completes that chain for the sibling message?",
      options: freezeOptions([
        {
          id: "sibling_fit_chain",
          label:
            "Casual wording fits a sibling → they may cooperate quickly → you get quiet study time",
          isTarget: true,
          explanation:
            "That works. You named audience fit, a likely effect, and the purpose without treating audience as the topic.",
        },
        {
          id: "confuse_purpose",
          label:
            "Audience means “to persuade,” so sibling and teacher should get the identical email",
          isTarget: false,
          explanation:
            "Let’s look closer. “To persuade” is closer to purpose. Audience is who you are persuading—and that changes the fit.",
        },
      ]),
    }),
    purposeResult: null,
    kingPassage: VOCABULARY_TRANSFER_PASSAGES.audience,
    kingApplication: Object.freeze({
      prompt:
        "Why does this letter opening show an audience-specific choice?",
      options: freezeOptions([
        {
          id: "fellow_clergymen",
          label:
            "King addresses “Fellow Clergymen” and answers their statement—fit depends on that particular group",
          isTarget: true,
          explanation:
            "That works. The greeting and reply are shaped for clergymen who called his actions unwise and untimely.",
        },
        {
          id: "everyone_same",
          label: "Audience means anyone who might ever read anything, so the greeting does not matter",
          isTarget: false,
          explanation:
            "Let’s look closer. King names a particular group. Audience is not a vague “everyone.”",
        },
        {
          id: "topic_only",
          label: "The audience is simply the topic “jail,” not the clergymen",
          isTarget: false,
          explanation:
            "Let’s look closer. Jail is context. The audience is the clergymen he addresses.",
        },
      ]),
      followUpStem:
        "A public speech audience may need different choices because…",
      followUpPlaceholder: "Finish with one short contrast (optional but helpful).",
      requiresTransferNotDefinition: true,
    }),
    assignmentTransfer: Object.freeze({
      deskLabel: "What this assignment asks",
      transferStatement:
        "Your essay compares how King’s choices fit different audiences—the public speech crowd and the clergymen of the letter. Audience is who is addressed, not the topic alone.",
      essayUseCue:
        "Identify who King is addressing and consider what that audience may value, believe, fear, or hope for.",
      confirmPrompt: "Ready to keep audience distinct from purpose and topic?",
      confirmLabel: "Yes — I’ll name who is addressed before I claim fit",
    }),
    conceptMap: null,
    teachingFeedback: Object.freeze({ headings: TEACHING_FEEDBACK_HEADINGS }),
    completionCriteria: Object.freeze({
      requireNoticeDecision: true,
      requireDefinitionSeen: true,
      requireBoundaryDecision: true,
      requireAudienceFitDecision: true,
      requireKingApplication: true,
      requireAssignmentTransferSeen: true,
      notByTextLength: true,
    }),
    cumulativeCue:
      "Audience: choices should account for the people being addressed.",
  });
}

function getPurposeContract() {
  const cumulativeMap = Object.freeze([
    "Rhetoric: communicators make strategic choices.",
    "Ethos: a choice may build credibility or trust.",
    "Pathos: a choice may shape feeling or emotional urgency.",
    "Logos: a choice may help the audience follow reasoning or evidence.",
    "Audience: choices should account for the people being addressed.",
    "Purpose: choices and audience effects matter because the communicator wants a result.",
  ]);

  return Object.freeze({
    termId: "purpose",
    studentFacingName: "Purpose",
    role: "goal",
    schemaVersion: VOCABULARY_TRANSFER_TERM_STATE_VERSION,
    analyticalAnchor: SHARED_ANALYTICAL_ANCHOR,
    stepIds: PURPOSE_TRANSFER_STEPS,
    familiarScenario: Object.freeze({
      id: "same_topic_two_results",
      title: "Same topic, different intended result",
      situation:
        "Two posts about the same school recycling bins. Post A wants students to feel proud of a clean campus. Post B wants students to put bottles in the correct bin starting today.",
      audience: "Students who see the posts",
      purpose: "(Different for each post—that is the point of this lesson)",
      noticePrompt:
        "Before we name any academic term: what is the clearest difference between Post A and Post B?",
      noticeOptions: freezeOptions([
        {
          id: "different_intended_result",
          label:
            "They aim for different results—pride vs a specific action today",
          isTarget: true,
          explanation:
            "That works. Purpose is the intended result for the audience—not merely the shared topic of recycling.",
        },
        {
          id: "topic_is_purpose",
          label: "Purpose is just the topic “recycling,” so both posts have the same purpose",
          isTarget: false,
          explanation:
            "Let’s look closer. Topic can stay the same while the intended result changes. Purpose is what you want the audience to understand, feel, believe, or do.",
        },
      ]),
      communicationChoice:
        "Aiming the same topic at different intended results for the audience",
    }),
    definition: Object.freeze({
      academic:
        "Purpose is what the writer or speaker wants an audience to understand, feel, believe, or do.",
      plainLanguage:
        "Ask: “What result does the writer or speaker want from this audience?”",
      bridge:
        "You separated topic from intended result. Purpose names that intended result.",
    }),
    boundary: Object.freeze({
      prompt: "Which statement correctly separates purpose from audience or topic?",
      options: freezeOptions([
        {
          id: "purpose_example",
          label:
            "Example: Purpose is the intended result—what the audience should understand, feel, believe, or do.",
          kind: "example",
          isTarget: true,
          explanation:
            "That works. Purpose is the result sought from an audience, not who the audience is or what the subject is called.",
        },
        {
          id: "purpose_nonexample",
          label:
            "Nonexample: Purpose means the audience itself, the topic label, or a vague “to inform” with no concrete result.",
          kind: "nonexample",
          isTarget: false,
          explanation:
            "Let’s look closer. Audience is who; topic is subject; purpose needs a concrete intended result for that audience.",
        },
      ]),
    }),
    audienceEffect: null,
    purposeConnection: null,
    audienceFit: null,
    purposeResult: Object.freeze({
      prompt:
        "For Post B, which option best names purpose as an intended audience result?",
      options: freezeOptions([
        {
          id: "action_today",
          label:
            "Get students to put bottles in the correct bin starting today",
          isTarget: true,
          explanation:
            "That works. You named a concrete do-result for the audience—not only the topic “recycling.”",
        },
        {
          id: "vague_inform",
          label: "Purpose = “to inform students about recycling” with no specific result",
          isTarget: false,
          explanation:
            "Let’s look closer. “To inform” without a concrete understand/feel/believe/do result is too vague for strong analysis.",
        },
      ]),
    }),
    kingPassage: VOCABULARY_TRANSFER_PASSAGES.purpose,
    kingApplication: Object.freeze({
      prompt:
        "In this letter passage, what intended result for the clergymen does King most clearly push toward?",
      options: freezeOptions([
        {
          id: "confront_urgency",
          label:
            "He wants them to understand injustice as urgent and morally serious—not easy to postpone",
          isTarget: true,
          explanation:
            "That works. The catalogue of harm aims at a concrete believe/feel/understand result for that audience.",
        },
        {
          id: "topic_only_purpose",
          label: "His purpose is simply the topic word “police,” nothing more",
          isTarget: false,
          explanation:
            "Let’s look closer. Topic words are not purpose. Purpose is the result he wants from the clergymen.",
        },
        {
          id: "audience_is_purpose",
          label: "Purpose means the clergymen themselves",
          isTarget: false,
          explanation:
            "Let’s look closer. The clergymen are the audience. Purpose is what he wants them to understand, feel, believe, or do.",
        },
      ]),
      followUpStem:
        "A visible choice that supports that purpose is…",
      followUpPlaceholder: "Name one brief link (optional but helpful).",
      requiresTransferNotDefinition: true,
    }),
    assignmentTransfer: Object.freeze({
      deskLabel: "What this assignment asks",
      transferStatement:
        "Your essay must explain what King wants each audience to understand, feel, believe, or do—and how his choices support those results. Purpose completes the chain: rhetorical choice → effect on audience → contribution to purpose.",
      essayUseCue:
        "Explain what King wants each audience to understand, feel, believe, or do.",
      confirmPrompt: "Ready to take this full lens into the vocabulary quiz?",
      confirmLabel: "Yes — I’ll use the full six-term lens",
    }),
    conceptMap: cumulativeMap,
    teachingFeedback: Object.freeze({ headings: TEACHING_FEEDBACK_HEADINGS }),
    completionCriteria: Object.freeze({
      requireNoticeDecision: true,
      requireDefinitionSeen: true,
      requireBoundaryDecision: true,
      requirePurposeResultDecision: true,
      requireKingApplication: true,
      requireAssignmentTransferSeen: true,
      notByTextLength: true,
    }),
    cumulativeCue:
      "Purpose: choices and audience effects matter because the communicator wants a result.",
  });
}

const CONTRACT_BUILDERS = Object.freeze({
  rhetoric: getRhetoricContract,
  ethos: buildEthosContractFromLegacy,
  pathos: getPathosContract,
  logos: getLogosContract,
  audience: getAudienceContract,
  purpose: getPurposeContract,
});

/**
 * @param {string} termId
 */
export function getVocabularyTransferLessonContract(termId) {
  const id = String(termId || "").trim();
  const builder = CONTRACT_BUILDERS[id];
  if (!builder) return null;
  return builder();
}

export function listVocabularyTransferLessonContracts() {
  return VOCABULARY_TRANSFER_TERM_IDS.map((id) =>
    getVocabularyTransferLessonContract(id)
  );
}

export function vocabularyTransferStepIndex(termId, stepId) {
  const contract = getVocabularyTransferLessonContract(termId);
  if (!contract) return -1;
  return contract.stepIds.indexOf(String(stepId || ""));
}

export function isValidVocabularyTransferStep(termId, stepId) {
  return vocabularyTransferStepIndex(termId, stepId) >= 0;
}

export function stepTitleFor(termId, stepId) {
  const contract = getVocabularyTransferLessonContract(termId);
  const name = contract?.studentFacingName || "Term";
  switch (stepId) {
    case "notice":
      return "Notice a communication choice";
    case "name_boundary":
      return `Name the idea: ${name.toLowerCase()}`;
    case "audience_effect":
      return "Predict the audience effect";
    case "purpose":
      return "Connect effect to purpose";
    case "audience_fit":
      return "Fit the choice to the audience";
    case "purpose_result":
      return "Name the intended result";
    case "king_apply":
      return "Try the lens with King";
    case "assignment_transfer":
      return "Connect it to your assignment";
    default:
      return name;
  }
}

/**
 * Lightweight signature so paraphrase edits can flag transfer review.
 * @param {unknown} paraphrase
 */
export function buildPromptInterpretationSignature(paraphrase) {
  const text = String(paraphrase || "").trim().replace(/\s+/g, " ");
  if (!text) return null;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return `p:${text.length}:${hash}`;
}
