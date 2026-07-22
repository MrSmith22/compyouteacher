// @ts-nocheck
/**
 * WP-090 — Dev seed for generalized vocabulary transfer lessons.
 * Configurable variants; returns clientDraft for localStorage.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import {
  createEmptyVocabularyTransferState,
  createEmptyTermTransferState,
  migrateEthosV1ToTermState,
  termStateToEthosV1,
} from "@/lib/module1/vocabularyTransferState";
import {
  buildPromptInterpretationSignature,
  VOCABULARY_TRANSFER_TERM_IDS,
} from "@/lib/module1/vocabularyTransferLessonContract";
import {
  createEmptyEthosTransferState,
} from "@/lib/module1/ethosTransferLessonContract";
import { STEP2_STAGES } from "@/lib/module1/step2MicrostageHelpers";
import { QUIZ_CONTENT_VERSION } from "@/lib/module1/quizHelpers";

export const WP090_SEED_VARIANTS = Object.freeze([
  "startRhetoric",
  "midPathos",
  "midLogos",
  "audiencePurpose",
  "purposeMap",
  "partialAllSix",
  "readyForQuiz",
  "legacyEthosV1",
  "paraphraseChanged",
]);

const SYNTHETIC_PARAPHRASE =
  "I need to compare how King builds trust and other appeals for different audiences so I can explain which choices fit each purpose.";

function markCompleted(termId, patches = {}) {
  const base = createEmptyTermTransferState(termId);
  return {
    ...base,
    ...patches,
    noticeFeedbackSeen: true,
    definitionSeen: true,
    boundaryFeedbackSeen: true,
    assignmentTransferSeen: true,
    completed: true,
    currentStep: "assignment_transfer",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * @param {string} userEmail
 * @param {{ variant?: string }} [opts]
 */
export async function seedVocabularyTransferLesson(userEmail, opts = {}) {
  const email = String(userEmail || "").trim().toLowerCase();
  if (!email) return { ok: false as const, error: "Missing user email" };

  const variant = WP090_SEED_VARIANTS.includes(opts.variant || "")
    ? opts.variant
    : "startRhetoric";

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const paraphrase =
    variant === "paraphraseChanged"
      ? "Compare King’s speech and letter: how do his rhetorical choices fit each audience and purpose?"
      : SYNTHETIC_PARAPHRASE;

  const { error: promptErr } = await supabase.from("module1_prompt_breakdown").upsert(
    {
      user_email: email,
      task_verb: "compare",
      task_type: "rhetorical analysis",
      analysis_focus: "rhetorical appeals",
      required_angle: "audience and purpose",
      student_paraphrase: paraphrase,
      response_text: paraphrase,
      updated_at: now,
    },
    { onConflict: "user_email" }
  );
  if (promptErr) {
    return { ok: false as const, error: promptErr.message };
  }

  await supabase.from("module1_quiz_results").delete().eq("user_email", email);

  const moduleResult = await setCurrentModule(email, 1);
  if (!moduleResult.ok) {
    return { ok: false as const, error: moduleResult.error || "Could not set Module 1" };
  }

  const sig = buildPromptInterpretationSignature(paraphrase);
  let vocabularyTransfer = createEmptyVocabularyTransferState();
  let termIndex = 0;
  let legacyEthos = null;

  if (variant === "startRhetoric") {
    termIndex = 0;
    vocabularyTransfer.terms.rhetoric = {
      ...createEmptyTermTransferState("rhetoric"),
      promptInterpretationSignature: sig,
    };
  }

  if (variant === "midPathos") {
    termIndex = 2;
    vocabularyTransfer.terms.rhetoric = markCompleted("rhetoric", {
      noticeChoiceId: "version_b_deadline",
      boundaryChoiceId: "umbrella_correct",
      audienceEffectChoiceId: "more_ready_to_act",
      purposeChoiceId: "action_supports_deadline",
      kingChoiceId: "metaphor_strategy",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.ethos = markCompleted("ethos", {
      noticeChoiceId: "officer_training",
      boundaryChoiceId: "example_credibility",
      exampleNonexampleChoiceId: "example_credibility",
      audienceEffectChoiceId: "more_willing_to_trust",
      purposeChoiceId: "trust_supports_safety",
      kingChoiceId: "shared_national_authority",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.pathos = {
      ...createEmptyTermTransferState("pathos"),
      currentStep: "king_apply",
      noticeChoiceId: "message_b_emotion",
      noticeFeedbackSeen: true,
      definitionSeen: true,
      boundaryChoiceId: "pathos_example",
      boundaryFeedbackSeen: true,
      audienceEffectChoiceId: "more_willing_to_commit",
      audienceEffectFeedbackSeen: true,
      purposeChoiceId: "feeling_supports_attendance",
      purposeFeedbackSeen: true,
      promptInterpretationSignature: sig,
    };
  }

  if (variant === "midLogos") {
    termIndex = 3;
    for (const id of ["rhetoric", "ethos", "pathos"]) {
      vocabularyTransfer.terms[id] = markCompleted(id, {
        noticeChoiceId: "x",
        boundaryChoiceId: "x",
        kingChoiceId: "x",
        promptInterpretationSignature: sig,
      });
    }
    // Fix real choice ids for completed appeal terms
    vocabularyTransfer.terms.rhetoric = markCompleted("rhetoric", {
      noticeChoiceId: "version_b_deadline",
      boundaryChoiceId: "umbrella_correct",
      audienceEffectChoiceId: "more_ready_to_act",
      purposeChoiceId: "action_supports_deadline",
      kingChoiceId: "metaphor_strategy",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.ethos = markCompleted("ethos", {
      noticeChoiceId: "officer_training",
      boundaryChoiceId: "example_credibility",
      exampleNonexampleChoiceId: "example_credibility",
      audienceEffectChoiceId: "more_willing_to_trust",
      purposeChoiceId: "trust_supports_safety",
      kingChoiceId: "shared_national_authority",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.pathos = markCompleted("pathos", {
      noticeChoiceId: "message_b_emotion",
      boundaryChoiceId: "pathos_example",
      audienceEffectChoiceId: "more_willing_to_commit",
      purposeChoiceId: "feeling_supports_attendance",
      kingChoiceId: "hope_urgency_children",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.logos = {
      ...createEmptyTermTransferState("logos"),
      currentStep: "name_boundary",
      noticeChoiceId: "claim_b_supported",
      noticeFeedbackSeen: true,
      definitionSeen: true,
      promptInterpretationSignature: sig,
    };
  }

  if (variant === "audiencePurpose") {
    termIndex = 4;
    for (const id of ["rhetoric", "ethos", "pathos", "logos"]) {
      vocabularyTransfer.terms[id] = markCompleted(id, {
        noticeChoiceId:
          id === "rhetoric"
            ? "version_b_deadline"
            : id === "ethos"
              ? "officer_training"
              : id === "pathos"
                ? "message_b_emotion"
                : "claim_b_supported",
        boundaryChoiceId:
          id === "rhetoric"
            ? "umbrella_correct"
            : id === "ethos"
              ? "example_credibility"
              : id === "pathos"
                ? "pathos_example"
                : "logos_example",
        audienceEffectChoiceId:
          id === "rhetoric"
            ? "more_ready_to_act"
            : id === "ethos"
              ? "more_willing_to_trust"
              : id === "pathos"
                ? "more_willing_to_commit"
                : "follow_the_case",
        purposeChoiceId:
          id === "rhetoric"
            ? "action_supports_deadline"
            : id === "ethos"
              ? "trust_supports_safety"
              : id === "pathos"
                ? "feeling_supports_attendance"
                : "understanding_supports_choice",
        kingChoiceId:
          id === "rhetoric"
            ? "metaphor_strategy"
            : id === "ethos"
              ? "shared_national_authority"
              : id === "pathos"
                ? "hope_urgency_children"
                : "define_then_conclude",
        promptInterpretationSignature: sig,
      });
    }
    vocabularyTransfer.terms.audience = {
      ...createEmptyTermTransferState("audience"),
      currentStep: "audience_fit",
      noticeChoiceId: "fit_to_audience",
      noticeFeedbackSeen: true,
      definitionSeen: true,
      boundaryChoiceId: "audience_example",
      boundaryFeedbackSeen: true,
      promptInterpretationSignature: sig,
    };
  }

  if (variant === "purposeMap") {
    termIndex = 5;
    for (const id of VOCABULARY_TRANSFER_TERM_IDS.slice(0, 5)) {
      vocabularyTransfer.terms[id] = markCompleted(id, {
        noticeChoiceId: "placeholder",
        boundaryChoiceId: "placeholder",
        kingChoiceId: "placeholder",
        promptInterpretationSignature: sig,
      });
    }
    // overwrite with real ids for first five
    vocabularyTransfer.terms.rhetoric = markCompleted("rhetoric", {
      noticeChoiceId: "version_b_deadline",
      boundaryChoiceId: "umbrella_correct",
      audienceEffectChoiceId: "more_ready_to_act",
      purposeChoiceId: "action_supports_deadline",
      kingChoiceId: "metaphor_strategy",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.ethos = markCompleted("ethos", {
      noticeChoiceId: "officer_training",
      boundaryChoiceId: "example_credibility",
      exampleNonexampleChoiceId: "example_credibility",
      audienceEffectChoiceId: "more_willing_to_trust",
      purposeChoiceId: "trust_supports_safety",
      kingChoiceId: "shared_national_authority",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.pathos = markCompleted("pathos", {
      noticeChoiceId: "message_b_emotion",
      boundaryChoiceId: "pathos_example",
      audienceEffectChoiceId: "more_willing_to_commit",
      purposeChoiceId: "feeling_supports_attendance",
      kingChoiceId: "hope_urgency_children",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.logos = markCompleted("logos", {
      noticeChoiceId: "claim_b_supported",
      boundaryChoiceId: "logos_example",
      audienceEffectChoiceId: "follow_the_case",
      purposeChoiceId: "understanding_supports_choice",
      kingChoiceId: "define_then_conclude",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.audience = markCompleted("audience", {
      noticeChoiceId: "fit_to_audience",
      boundaryChoiceId: "audience_example",
      audienceFitChoiceId: "sibling_fit_chain",
      kingChoiceId: "fellow_clergymen",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.purpose = {
      ...createEmptyTermTransferState("purpose"),
      currentStep: "assignment_transfer",
      noticeChoiceId: "different_intended_result",
      noticeFeedbackSeen: true,
      definitionSeen: true,
      boundaryChoiceId: "purpose_example",
      boundaryFeedbackSeen: true,
      purposeResultChoiceId: "action_today",
      purposeResultFeedbackSeen: true,
      kingChoiceId: "confront_urgency",
      kingFeedbackSeen: true,
      promptInterpretationSignature: sig,
    };
  }

  if (variant === "partialAllSix") {
    termIndex = 1;
    vocabularyTransfer.terms.rhetoric = markCompleted("rhetoric", {
      noticeChoiceId: "version_b_deadline",
      boundaryChoiceId: "umbrella_correct",
      audienceEffectChoiceId: "more_ready_to_act",
      purposeChoiceId: "action_supports_deadline",
      kingChoiceId: "metaphor_strategy",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.ethos = {
      ...createEmptyTermTransferState("ethos"),
      currentStep: "audience_effect",
      noticeChoiceId: "officer_training",
      noticeFeedbackSeen: true,
      definitionSeen: true,
      boundaryChoiceId: "example_credibility",
      exampleNonexampleChoiceId: "example_credibility",
      boundaryFeedbackSeen: true,
      promptInterpretationSignature: sig,
    };
  }

  if (variant === "readyForQuiz") {
    termIndex = 5;
    vocabularyTransfer.terms.rhetoric = markCompleted("rhetoric", {
      noticeChoiceId: "version_b_deadline",
      boundaryChoiceId: "umbrella_correct",
      audienceEffectChoiceId: "more_ready_to_act",
      purposeChoiceId: "action_supports_deadline",
      kingChoiceId: "metaphor_strategy",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.ethos = markCompleted("ethos", {
      noticeChoiceId: "officer_training",
      boundaryChoiceId: "example_credibility",
      exampleNonexampleChoiceId: "example_credibility",
      audienceEffectChoiceId: "more_willing_to_trust",
      purposeChoiceId: "trust_supports_safety",
      kingChoiceId: "shared_national_authority",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.pathos = markCompleted("pathos", {
      noticeChoiceId: "message_b_emotion",
      boundaryChoiceId: "pathos_example",
      audienceEffectChoiceId: "more_willing_to_commit",
      purposeChoiceId: "feeling_supports_attendance",
      kingChoiceId: "hope_urgency_children",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.logos = markCompleted("logos", {
      noticeChoiceId: "claim_b_supported",
      boundaryChoiceId: "logos_example",
      audienceEffectChoiceId: "follow_the_case",
      purposeChoiceId: "understanding_supports_choice",
      kingChoiceId: "define_then_conclude",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.audience = markCompleted("audience", {
      noticeChoiceId: "fit_to_audience",
      boundaryChoiceId: "audience_example",
      audienceFitChoiceId: "sibling_fit_chain",
      kingChoiceId: "fellow_clergymen",
      promptInterpretationSignature: sig,
    });
    vocabularyTransfer.terms.purpose = markCompleted("purpose", {
      noticeChoiceId: "different_intended_result",
      boundaryChoiceId: "purpose_example",
      purposeResultChoiceId: "action_today",
      kingChoiceId: "confront_urgency",
      promptInterpretationSignature: sig,
    });
  }

  if (variant === "legacyEthosV1") {
    termIndex = 1;
    legacyEthos = createEmptyEthosTransferState();
    legacyEthos.currentStep = "king_apply";
    legacyEthos.noticeChoiceId = "officer_training";
    legacyEthos.noticeFeedbackSeen = true;
    legacyEthos.definitionSeen = true;
    legacyEthos.exampleNonexampleChoiceId = "example_credibility";
    legacyEthos.exampleNonexampleFeedbackSeen = true;
    legacyEthos.audienceEffectChoiceId = "more_willing_to_trust";
    legacyEthos.audienceEffectFeedbackSeen = true;
    legacyEthos.purposeChoiceId = "trust_supports_safety";
    legacyEthos.purposeFeedbackSeen = true;
    legacyEthos.kingChoiceId = "shared_national_authority";
    legacyEthos.kingFollowUpText = "legacy-v1-restore-marker";
    legacyEthos.promptInterpretationSignature = sig;
    // Leave vocabularyTransfer without ethos progress so hydrate migrates
    vocabularyTransfer = createEmptyVocabularyTransferState();
    vocabularyTransfer.terms.rhetoric = markCompleted("rhetoric", {
      noticeChoiceId: "version_b_deadline",
      boundaryChoiceId: "umbrella_correct",
      audienceEffectChoiceId: "more_ready_to_act",
      purposeChoiceId: "action_supports_deadline",
      kingChoiceId: "metaphor_strategy",
      promptInterpretationSignature: sig,
    });
  }

  if (variant === "paraphraseChanged") {
    termIndex = 1;
    vocabularyTransfer.terms.rhetoric = markCompleted("rhetoric", {
      noticeChoiceId: "version_b_deadline",
      boundaryChoiceId: "umbrella_correct",
      audienceEffectChoiceId: "more_ready_to_act",
      purposeChoiceId: "action_supports_deadline",
      kingChoiceId: "metaphor_strategy",
      promptInterpretationSignature: "p:stale:0",
    });
    vocabularyTransfer.terms.ethos = {
      ...createEmptyTermTransferState("ethos"),
      currentStep: "assignment_transfer",
      noticeChoiceId: "officer_training",
      noticeFeedbackSeen: true,
      definitionSeen: true,
      boundaryChoiceId: "example_credibility",
      exampleNonexampleChoiceId: "example_credibility",
      boundaryFeedbackSeen: true,
      audienceEffectChoiceId: "more_willing_to_trust",
      audienceEffectFeedbackSeen: true,
      purposeChoiceId: "trust_supports_safety",
      purposeFeedbackSeen: true,
      kingChoiceId: "shared_national_authority",
      kingFeedbackSeen: true,
      promptInterpretationSignature: "p:stale:0",
      promptInterpretationNeedsReview: true,
    };
  }

  vocabularyTransfer.updatedAt = now;

  // For legacyEthosV1, client draft carries ethosTransfer only for migration path
  const ethosTransfer =
    variant === "legacyEthosV1"
      ? legacyEthos
      : termStateToEthosV1(vocabularyTransfer.terms.ethos);

  const clientDraft = {
    stage: STEP2_STAGES.LEARN,
    termIndex,
    quizIndex: 0,
    quizAnswers: Array.from({ length: 10 }, () => ""),
    quizVersion: QUIZ_CONTENT_VERSION,
    vocabularyTransfer:
      variant === "legacyEthosV1"
        ? {
            ...vocabularyTransfer,
            terms: {
              ...vocabularyTransfer.terms,
              ethos: createEmptyTermTransferState("ethos"),
            },
          }
        : vocabularyTransfer,
    ethosTransfer,
    updatedAt: now,
  };

  return {
    ok: true as const,
    variant,
    termIds: VOCABULARY_TRANSFER_TERM_IDS,
    paraphrase,
    clientDraft,
    resumePath: "/modules/1",
    migratedEthosPreview:
      variant === "legacyEthosV1"
        ? migrateEthosV1ToTermState(legacyEthos)
        : null,
  };
}

// WP-089 alias lives in seedEthosTransferLesson.ts
