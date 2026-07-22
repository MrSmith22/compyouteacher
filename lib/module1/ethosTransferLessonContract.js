/**
 * WP-089 — Transfer-oriented ethos lesson contract (pure content; no student answers).
 * Reusable shape for later terms without forcing identical pedagogy.
 *
 * Field classes:
 * - Term-generic (reusable later): termId, studentFacingName, analyticalAnchor,
 *   stepIds/order, schemaVersion, completion criteria shape, feedback headings.
 * - Ethos-specific (may vary later): familiarScenario, notice options, definition,
 *   example/nonexample, audience/purpose framing, King passage, application prompts.
 */

export const ETHOS_TRANSFER_SCHEMA_VERSION = 1;

export const ETHOS_TRANSFER_TERM_ID = "ethos";

/** Microstep order — notice before name/definition. */
export const ETHOS_TRANSFER_STEPS = Object.freeze([
  "notice",
  "name_boundary",
  "audience_effect",
  "purpose",
  "king_apply",
  "assignment_transfer",
]);

export const ETHOS_ANALYTICAL_ANCHOR = Object.freeze({
  label: "Rhetorical choice → effect on audience → contribution to purpose",
  choice: "Rhetorical choice",
  audienceEffect: "Effect on audience",
  purpose: "Contribution to purpose",
});

/**
 * Authoritative guided passage from the MLK assignment definition.
 * Do not invent quotation text.
 */
export const ETHOS_KING_PASSAGE = Object.freeze({
  sourceId: "speech",
  guidedPassageId: "speech-ethos",
  quotation:
    "Five score years ago, a great American, in whose symbolic shadow we stand today, signed the Emancipation Proclamation.",
  passageLocator: "Dream speech opening — Emancipation / Lincoln allusion",
  citationSafeNote:
    "Assignment-owned guided passage (speech-ethos). Students later verify the full speech from their saved source.",
  whyEthosSafe:
    "King builds credibility by linking his cause to shared national history and founding ideals before a public audience.",
});

/**
 * @returns {Readonly<object>}
 */
export function getEthosTransferLessonContract() {
  return Object.freeze({
    schemaVersion: ETHOS_TRANSFER_SCHEMA_VERSION,
    termId: ETHOS_TRANSFER_TERM_ID,
    studentFacingName: "Ethos",
    analyticalAnchor: ETHOS_ANALYTICAL_ANCHOR,
    stepIds: ETHOS_TRANSFER_STEPS,

    familiarScenario: Object.freeze({
      id: "campus_safety_advice",
      title: "Whose safety advice do you trust?",
      situation:
        "Your school sends a message about staying safe after dark. One tip comes from the campus safety officer, who lists training and years on the job. Another tip is an anonymous post that only says “Trust me — I know what I’m talking about.”",
      audience: "Students deciding which tip to follow",
      purpose: "Help students choose advice that will keep them safer",
      noticePrompt:
        "Before we name any academic term: which tip gives students a clearer reason to trust the communicator?",
      noticeOptions: Object.freeze([
        Object.freeze({
          id: "officer_training",
          label:
            "The campus safety officer’s tip — it names training and experience",
          isTarget: true,
          explanation:
            "That works. Naming training and experience gives students a concrete reason to see the communicator as reliable.",
        }),
        Object.freeze({
          id: "anonymous_claim",
          label:
            "The anonymous post — it says “trust me” without explaining why",
          isTarget: false,
          explanation:
            "Let’s look closer. Saying “trust me” alone does not give the audience a reason to see the communicator as credible.",
        }),
      ]),
      communicationChoice:
        "Showing relevant experience and training so the audience has a reason to see the speaker as reliable",
    }),

    definition: Object.freeze({
      academic:
        "Ethos is a rhetorical appeal that tries to persuade an audience by making the writer or speaker seem trustworthy, credible, and worth believing.",
      plainLanguage:
        "Ethos asks the audience to think: “This person is someone I can trust.”",
      bridge:
        "You just noticed a credibility choice. Writers and speakers use the same kind of move when they build ethos.",
    }),

    exampleNonexample: Object.freeze({
      prompt:
        "Which choice is mainly about building credibility (ethos), not mainly about emotion or evidence alone?",
      options: Object.freeze([
        Object.freeze({
          id: "example_credibility",
          label:
            "Example: A coach explains a training plan by naming certifications and years working with student athletes.",
          kind: "example",
          isTarget: true,
          explanation:
            "That works because the coach gives the audience a concrete reason to see the speaker as reliable—training and experience.",
        }),
        Object.freeze({
          id: "nonexample_emotion",
          label:
            "Nonexample: A coach tells a dramatic story meant mainly to make athletes feel pumped up for the game.",
          kind: "nonexample",
          isTarget: false,
          explanation:
            "Let’s look closer. A dramatic story may use emotion (pathos). Ethos is specifically about credibility and trustworthiness—not every persuasive move.",
        }),
      ]),
    }),

    audienceEffect: Object.freeze({
      namedAudience: "Students deciding which tip to follow",
      audienceContext: "They need advice they can rely on for their safety.",
      prompt:
        "If the safety officer names training and experience, what might that choice make this audience think or do?",
      options: Object.freeze([
        Object.freeze({
          id: "more_willing_to_trust",
          label:
            "They may be more willing to trust and follow the officer’s tip",
          isTarget: true,
          explanation:
            "That works. A credibility signal can make an audience more willing to listen—without guaranteeing they will.",
        }),
        Object.freeze({
          id: "feel_scared_only",
          label: "They will definitely feel scared and stop thinking",
          isTarget: false,
          explanation:
            "Let’s look closer. Ethos is about trustworthiness. Fear alone is closer to emotion, and we cannot claim certainty about how every student will feel.",
        }),
        Object.freeze({
          id: "prove_statistics",
          label: "It proves the tip with statistics and studies",
          isTarget: false,
          explanation:
            "Let’s look closer. Naming experience builds credibility. Statistics would be a reasoning/evidence move (logos), not ethos by itself.",
        }),
      ]),
      uncertaintyCue: "Use “may” or “could”—audience effects are likely, not certain.",
    }),

    purposeConnection: Object.freeze({
      communicatorPurpose: "Help students choose advice that will keep them safer",
      prompt:
        "How could that audience response help the communicator accomplish the purpose?",
      options: Object.freeze([
        Object.freeze({
          id: "trust_supports_safety",
          label:
            "If students trust the tip, they are more likely to follow advice that supports safety",
          isTarget: true,
          explanation:
            "That works. Trust can help the purpose by making the audience more willing to act on the message.",
        }),
        Object.freeze({
          id: "trust_unrelated",
          label: "Trust does not matter as long as the tip is short",
          isTarget: false,
          explanation:
            "Let’s look closer. For this purpose, willingness to trust the tip is part of why the credibility choice matters.",
        }),
      ]),
    }),

    kingPassage: ETHOS_KING_PASSAGE,

    kingApplication: Object.freeze({
      prompt:
        "Apply the same lens to King’s line. What credibility choice does this opening make?",
      options: Object.freeze([
        Object.freeze({
          id: "shared_national_authority",
          label:
            "He connects his cause to American history and a trusted national figure (Lincoln / Emancipation)",
          isTarget: true,
          explanation:
            "That works. Linking to shared history and founding ideals can make King seem aligned with values his audience already respects.",
        }),
        Object.freeze({
          id: "only_sad_story",
          label: "He mainly tries to make the audience cry about children",
          isTarget: false,
          explanation:
            "Let’s look closer. This opening line is about shared history and authority, not primarily an emotional story about children.",
        }),
        Object.freeze({
          id: "lists_statistics",
          label: "He lists research studies to prove his claim",
          isTarget: false,
          explanation:
            "Let’s look closer. This sentence does not present studies; it builds credibility through historical association.",
        }),
      ]),
      followUpStem:
        "This may make his audience more willing to listen because…",
      followUpPlaceholder: "Finish with one short reason (optional but helpful).",
      requiresTransferNotDefinition: true,
    }),

    assignmentTransfer: Object.freeze({
      deskLabel: "What this assignment asks",
      transferStatement:
        "Your essay will compare how King’s rhetorical choices fit different audiences and purposes. Ethos is one lens: notice a credibility choice, predict how it may affect an audience, and explain how that response could help the purpose.",
      essayUseCue: "Look for how King tries to earn each audience’s trust.",
      confirmPrompt:
        "Ready to keep this lens for the rest of Module 1 vocabulary and Module 2 analysis?",
      confirmLabel: "Yes — I’ll use choice → audience effect → purpose",
    }),

    teachingFeedback: Object.freeze({
      headings: Object.freeze({
        correct: "That works.",
        incorrect: "Let’s look closer.",
      }),
    }),

    completionCriteria: Object.freeze({
      requireNoticeDecision: true,
      requireDefinitionSeen: true,
      requireExampleNonexampleDecision: true,
      requireAudienceEffectDecision: true,
      requirePurposeConnection: true,
      requireKingApplication: true,
      requireAssignmentTransferSeen: true,
      notByTextLength: true,
      notByPerfectTerminology: true,
    }),
  });
}

/**
 * @param {string} stepId
 * @returns {number}
 */
export function ethosTransferStepIndex(stepId) {
  return ETHOS_TRANSFER_STEPS.indexOf(String(stepId || ""));
}

/**
 * @param {string} stepId
 */
export function isValidEthosTransferStep(stepId) {
  return ethosTransferStepIndex(stepId) >= 0;
}

/**
 * Empty persisted student state for the representative lesson.
 * @returns {object}
 */
export function createEmptyEthosTransferState() {
  return {
    schemaVersion: ETHOS_TRANSFER_SCHEMA_VERSION,
    termId: ETHOS_TRANSFER_TERM_ID,
    currentStep: "notice",
    noticeChoiceId: null,
    noticeFeedbackSeen: false,
    definitionSeen: false,
    exampleNonexampleChoiceId: null,
    exampleNonexampleFeedbackSeen: false,
    audienceEffectChoiceId: null,
    audienceEffectFeedbackSeen: false,
    purposeChoiceId: null,
    purposeFeedbackSeen: false,
    kingChoiceId: null,
    kingFollowUpText: "",
    kingFeedbackSeen: false,
    assignmentTransferSeen: false,
    completed: false,
    promptInterpretationSignature: null,
    promptInterpretationNeedsReview: false,
    updatedAt: null,
  };
}

/**
 * @param {unknown} raw
 * @returns {object}
 */
export function normalizeEthosTransferState(raw) {
  const empty = createEmptyEthosTransferState();
  if (!raw || typeof raw !== "object") return empty;
  const step = isValidEthosTransferStep(raw.currentStep)
    ? raw.currentStep
    : empty.currentStep;
  return {
    ...empty,
    ...raw,
    schemaVersion: ETHOS_TRANSFER_SCHEMA_VERSION,
    termId: ETHOS_TRANSFER_TERM_ID,
    currentStep: step,
    noticeChoiceId:
      typeof raw.noticeChoiceId === "string" ? raw.noticeChoiceId : null,
    exampleNonexampleChoiceId:
      typeof raw.exampleNonexampleChoiceId === "string"
        ? raw.exampleNonexampleChoiceId
        : null,
    audienceEffectChoiceId:
      typeof raw.audienceEffectChoiceId === "string"
        ? raw.audienceEffectChoiceId
        : null,
    purposeChoiceId:
      typeof raw.purposeChoiceId === "string" ? raw.purposeChoiceId : null,
    kingChoiceId:
      typeof raw.kingChoiceId === "string" ? raw.kingChoiceId : null,
    kingFollowUpText:
      typeof raw.kingFollowUpText === "string" ? raw.kingFollowUpText : "",
    noticeFeedbackSeen: Boolean(raw.noticeFeedbackSeen),
    definitionSeen: Boolean(raw.definitionSeen),
    exampleNonexampleFeedbackSeen: Boolean(raw.exampleNonexampleFeedbackSeen),
    audienceEffectFeedbackSeen: Boolean(raw.audienceEffectFeedbackSeen),
    purposeFeedbackSeen: Boolean(raw.purposeFeedbackSeen),
    kingFeedbackSeen: Boolean(raw.kingFeedbackSeen),
    assignmentTransferSeen: Boolean(raw.assignmentTransferSeen),
    completed: Boolean(raw.completed),
    promptInterpretationSignature:
      typeof raw.promptInterpretationSignature === "string"
        ? raw.promptInterpretationSignature
        : null,
    promptInterpretationNeedsReview: Boolean(
      raw.promptInterpretationNeedsReview
    ),
    updatedAt: raw.updatedAt || null,
  };
}

/**
 * @param {object} state
 * @param {ReturnType<typeof getEthosTransferLessonContract>} [contract]
 */
export function evaluateEthosTransferReadiness(
  state,
  contract = getEthosTransferLessonContract()
) {
  const s = normalizeEthosTransferState(state);
  const missing = [];
  if (!s.noticeChoiceId) missing.push("notice");
  if (!s.definitionSeen) missing.push("definition");
  if (!s.exampleNonexampleChoiceId) missing.push("example_nonexample");
  if (!s.audienceEffectChoiceId) missing.push("audience_effect");
  if (!s.purposeChoiceId) missing.push("purpose");
  if (!s.kingChoiceId) missing.push("king_apply");
  if (!s.assignmentTransferSeen) missing.push("assignment_transfer");
  return {
    ready: missing.length === 0,
    missing,
    completed: Boolean(s.completed) && missing.length === 0,
    contractVersion: contract.schemaVersion,
  };
}

/**
 * Lightweight signature so paraphrase edits can flag transfer review
 * without erasing vocabulary progress.
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
