// @ts-nocheck
/**
 * WP-087 — Configurable seed for evidence-to-argument slice families.
 * Dev-only. Does not hardcode walkthrough essay language into product logic.
 *
 * Variants: contrast | similarity | nuanced | cross | reverseCross | tied |
 * customMapped | customIncomplete | multiCandidate | legacyWp086 | directionChange
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import {
  SEED_LETTER_TEXT,
  SEED_SPEECH_TEXT,
  SEED_THESIS,
  SEED_PROOF_PLAN,
  nowIso,
} from "@/lib/dev/seeds/seedContent";
import {
  WP086_REPRESENTATIVE_OPTION_ID,
  WP086_WALKTHROUGH_RATINGS,
  createEmptyEvidenceArgumentSliceState,
  assembleModule4HandoffFromSlice,
  EVIDENCE_ARGUMENT_SCHEMA_VERSION_V1,
} from "@/lib/artifacts/evidenceArgumentContract";
import {
  createEmptyMatrixBundle,
  MATRIX_CELL_ORDER,
  FUNCTION_NOTE_MIN_LENGTH,
} from "@/lib/module2/rhetoricalMatrixHelpers";
import {
  studentFacingCrossDominantLabel,
  studentFacingSameAppealLabel,
  WP079_RELATIONSHIP,
} from "@/lib/module2/matrixEssayDirectionContract";
import { buildMatrixProvenanceSignature } from "@/lib/module3/moduleThreeMatrixHandoffHelpers";
import { mergeModule2ArtifactBundle } from "@/lib/module2/module2ArtifactBundle";

const SPEECH_PATHOS_QUOTE =
  "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.";

const LETTER_LOGOS_QUOTE =
  "Injustice anywhere is a threat to justice everywhere.";

const LETTER_PATHOS_QUOTE = 'This "Wait" has almost always meant "Never."';
const SPEECH_LOGOS_QUOTE =
  "We hold these truths to be self-evident, that all men are created equal.";
const SPEECH_ETHOS_QUOTE =
  "Five score years ago, a great American signed the Emancipation Proclamation.";
const LETTER_ETHOS_QUOTE = "My Dear Fellow Clergymen:";

/** Strong observations with audience/effect/purpose markers (not walkthrough essay prose). */
const STRONG_TCHART = [
  {
    category: "ethos",
    type: "speech",
    quote: SPEECH_ETHOS_QUOTE,
    observation: [
      "King links himself to Lincoln so the crowd trusts him.",
      "---AUDIENCE---",
      "A public celebration audience looks for shared national authority.",
      "---PURPOSE---",
      "Trust opens the door for a call to justice.",
    ].join("\n"),
  },
  {
    category: "pathos",
    type: "speech",
    quote: SPEECH_PATHOS_QUOTE,
    observation: [
      "King uses the image of children to make fairness feel urgent and hopeful.",
      "---AUDIENCE---",
      "A public crowd feels hope and responsibility together.",
      "---PURPOSE---",
      "The feeling supports a call for justice that cannot wait.",
    ].join("\n"),
  },
  {
    category: "logos",
    type: "speech",
    quote: SPEECH_LOGOS_QUOTE,
    observation: [
      "King cites a standard the nation already claims to believe.",
      "---AUDIENCE---",
      "Listeners recognize a familiar American creed.",
      "---PURPOSE---",
      "Shared standards make the demand for equality harder to dismiss.",
    ].join("\n"),
  },
  {
    category: "ethos",
    type: "letter",
    quote: LETTER_ETHOS_QUOTE,
    observation: [
      "King addresses the ministers as peers worth hearing.",
      "---AUDIENCE---",
      "Clergymen expect respectful religious address.",
      "---PURPOSE---",
      "Respect earns a careful hearing for his defense.",
    ].join("\n"),
  },
  {
    category: "pathos",
    type: "letter",
    quote: LETTER_PATHOS_QUOTE,
    observation: [
      "King makes delay feel painful rather than patient.",
      "---AUDIENCE---",
      "Clergymen confront the cost of asking people to wait.",
      "---PURPOSE---",
      "The pain challenges the idea that delay is neutral.",
    ].join("\n"),
  },
  {
    category: "logos",
    type: "letter",
    quote: LETTER_LOGOS_QUOTE,
    observation: [
      "King gives a clear reason why one city’s injustice matters everywhere.",
      "---AUDIENCE---",
      "Clergymen are asked to follow careful moral reasoning.",
      "---PURPOSE---",
      "The logic defends why action in Birmingham cannot be treated as local only.",
    ].join("\n"),
  },
];

export const WP087_SEED_VARIANTS = Object.freeze([
  "contrast",
  "similarity",
  "nuanced",
  "cross",
  "reverseCross",
  "tied",
  "customMapped",
  "customIncomplete",
  "multiCandidate",
  "legacyWp086",
  "directionChange",
]);

function padFunctionNote(text: string) {
  const base = text.trim();
  if (base.length >= FUNCTION_NOTE_MIN_LENGTH) return base;
  return `${base} This rating reflects how central the appeal feels in the work.`;
}

type VariantConfig = {
  optionId: string;
  kind: string;
  label: string;
  why: string;
  ratings: number[];
  speechEvidenceId: string;
  letterEvidenceId: string;
  appeals: string[];
  ratingProvenance: Record<string, Record<string, number>>;
  customMapping?: Record<string, string> | null;
  schemaVersion?: number;
  currentStep?: string;
  priorOptionId?: string | null;
  clearCellLinks?: boolean;
  extraSpeechPathosId?: string | null;
};

function resolveVariant(variantRaw: string | undefined): VariantConfig {
  const variant = String(variantRaw || "legacyWp086").trim() || "legacyWp086";

  const baseRatings = [...WP086_WALKTHROUGH_RATINGS]; // speechE, letterE, speechP, letterP, speechL, letterL

  switch (variant) {
    case "contrast":
      // same_appeal:pathos with strong contrast (speech 10, letter 4)
      return {
        optionId: "same_appeal:pathos",
        kind: "same_appeal",
        label: studentFacingSameAppealLabel(
          "pathos",
          WP079_RELATIONSHIP.STRONG_CONTRAST
        ),
        why: "Pathos ratings differ sharply across works.",
        ratings: [6, 5, 10, 4, 5, 5],
        speechEvidenceId: "tchart:speech:pathos",
        letterEvidenceId: "tchart:letter:pathos",
        appeals: ["pathos"],
        ratingProvenance: { speech: { pathos: 10 }, letter: { pathos: 4 } },
      };
    case "similarity":
      return {
        optionId: "same_appeal:ethos",
        kind: "same_appeal",
        label: studentFacingSameAppealLabel(
          "ethos",
          WP079_RELATIONSHIP.MEANINGFUL_SIMILARITY
        ),
        why: "Both works rely strongly on credibility.",
        ratings: [8, 8, 5, 5, 4, 4],
        speechEvidenceId: "tchart:speech:ethos",
        letterEvidenceId: "tchart:letter:ethos",
        appeals: ["ethos"],
        ratingProvenance: { speech: { ethos: 8 }, letter: { ethos: 8 } },
      };
    case "nuanced":
      return {
        optionId: "same_appeal:logos",
        kind: "same_appeal",
        label: studentFacingSameAppealLabel(
          "logos",
          WP079_RELATIONSHIP.NUANCED_DIFFERENCE
        ),
        why: "Logic is present in both with a limited difference.",
        ratings: [5, 5, 4, 4, 8, 6],
        speechEvidenceId: "tchart:speech:logos",
        letterEvidenceId: "tchart:letter:logos",
        appeals: ["logos"],
        ratingProvenance: { speech: { logos: 8 }, letter: { logos: 6 } },
      };
    case "reverseCross":
      return {
        optionId: "cross_dominant:logos:pathos",
        kind: "cross_dominant",
        label: studentFacingCrossDominantLabel("logos", "pathos"),
        why: "Speech rates logos highest; letter rates pathos highest.",
        ratings: [5, 5, 6, 9, 10, 4],
        speechEvidenceId: "tchart:speech:logos",
        letterEvidenceId: "tchart:letter:pathos",
        appeals: ["logos", "pathos"],
        ratingProvenance: { speech: { logos: 10 }, letter: { pathos: 9 } },
      };
    case "tied":
      // Supporting/tied-feel same-appeal similarity (both high pathos)
      return {
        optionId: "same_appeal:pathos",
        kind: "same_appeal",
        label: studentFacingSameAppealLabel(
          "pathos",
          WP079_RELATIONSHIP.MEANINGFUL_SIMILARITY
        ),
        why: "Both works rate pathos highly with little difference.",
        ratings: [5, 5, 9, 9, 4, 4],
        speechEvidenceId: "tchart:speech:pathos",
        letterEvidenceId: "tchart:letter:pathos",
        appeals: ["pathos"],
        ratingProvenance: { speech: { pathos: 9 }, letter: { pathos: 9 } },
      };
    case "customMapped":
      return {
        optionId: "student_created",
        kind: "student_created",
        label: "I notice both works open by establishing trust first",
        why: "Student-created comparison with explicit mapping.",
        ratings: baseRatings,
        speechEvidenceId: "tchart:speech:ethos",
        letterEvidenceId: "tchart:letter:ethos",
        appeals: ["ethos"],
        ratingProvenance: { speech: { ethos: 6 }, letter: { ethos: 4 } },
        customMapping: {
          speechAppeal: "ethos",
          letterAppeal: "ethos",
          relationship: WP079_RELATIONSHIP.NUANCED_DIFFERENCE,
          speechEvidenceId: "tchart:speech:ethos",
          letterEvidenceId: "tchart:letter:ethos",
          label: "I notice both works open by establishing trust first",
        },
      };
    case "customIncomplete":
      return {
        optionId: "student_created",
        kind: "student_created",
        label: "Another pattern I am still mapping",
        why: "Student-created without complete mapping.",
        ratings: baseRatings,
        speechEvidenceId: "tchart:speech:pathos",
        letterEvidenceId: "tchart:letter:logos",
        appeals: [],
        ratingProvenance: {},
        customMapping: {
          speechAppeal: "pathos",
          letterAppeal: "",
          relationship: "",
          speechEvidenceId: "tchart:speech:pathos",
          letterEvidenceId: "",
          label: "Another pattern I am still mapping",
        },
      };
    case "multiCandidate":
      return {
        optionId: WP086_REPRESENTATIVE_OPTION_ID,
        kind: "cross_dominant",
        label: studentFacingCrossDominantLabel("pathos", "logos"),
        why: "Multiple speech pathos candidates require an explicit pick.",
        ratings: baseRatings,
        speechEvidenceId: "",
        letterEvidenceId: "tchart:letter:logos",
        appeals: ["pathos", "logos"],
        ratingProvenance: { speech: { pathos: 10 }, letter: { logos: 9 } },
        clearCellLinks: true,
        extraSpeechPathosId: "guided:speech:pathos:alt",
      };
    case "directionChange":
      return {
        optionId: "cross_dominant:logos:pathos",
        kind: "cross_dominant",
        label: studentFacingCrossDominantLabel("logos", "pathos"),
        why: "Direction changed from legacy pathos/logos.",
        ratings: [5, 5, 6, 9, 10, 4],
        speechEvidenceId: "tchart:speech:logos",
        letterEvidenceId: "tchart:letter:pathos",
        appeals: ["logos", "pathos"],
        ratingProvenance: { speech: { logos: 10 }, letter: { pathos: 9 } },
        priorOptionId: WP086_REPRESENTATIVE_OPTION_ID,
      };
    case "cross":
    case "legacyWp086":
    default:
      return {
        optionId: WP086_REPRESENTATIVE_OPTION_ID,
        kind: "cross_dominant",
        label: studentFacingCrossDominantLabel("pathos", "logos"),
        why: "Speech rates pathos highest; letter rates logos highest.",
        ratings: baseRatings,
        speechEvidenceId: "tchart:speech:pathos",
        letterEvidenceId: "tchart:letter:logos",
        appeals: ["pathos", "logos"],
        ratingProvenance: { speech: { pathos: 10 }, letter: { logos: 9 } },
        schemaVersion:
          variant === "legacyWp086"
            ? EVIDENCE_ARGUMENT_SCHEMA_VERSION_V1
            : undefined,
      };
  }
}

export async function seedEvidenceToArgumentSlice(
  userEmail: string,
  options: { variant?: string } = {}
) {
  const supabase = getSupabaseAdmin();
  const now = nowIso();
  const config = resolveVariant(options.variant);

  const { error: sourcesError } = await supabase.from("module2_sources").upsert(
    {
      user_email: userEmail,
      mlk_url: "https://www.archives.gov/files/press/exhibits/dream-speech.pdf",
      mlk_text: SEED_SPEECH_TEXT,
      mlk_site_name: "National Archives",
      mlk_transcript_year: "1963",
      mlk_citation:
        "King, M. L., Jr. (1963). I have a dream [Speech transcript]. National Archives.",
      lfbj_url: "https://www.africa.upenn.edu/Articles_Gen/Letter_Birmingham.html",
      lfbj_text: SEED_LETTER_TEXT,
      lfbj_site_name: "University of Pennsylvania",
      lfbj_transcript_year: "1963",
      lfbj_citation: "King, M. L., Jr. (1963). Letter from Birmingham Jail.",
      updated_at: now,
    },
    { onConflict: "user_email" }
  );
  if (sourcesError) {
    return { ok: false as const, error: sourcesError.message };
  }

  for (const row of STRONG_TCHART) {
    const { error } = await supabase.from("tchart_entries").upsert(
      {
        user_email: userEmail,
        category: row.category,
        type: row.type,
        quote: row.quote,
        observation: row.observation,
        letter_url: null,
        updated_at: now,
      },
      { onConflict: "user_email,category,type" }
    );
    if (error) {
      return { ok: false as const, error: error.message };
    }
  }

  const { error: guidedError } = await supabase.from("student_observations").insert({
    user_email: userEmail,
    assignment_id: "mlk-rhetorical-analysis",
    source_id: "speech-pathos",
    source_title: "I Have a Dream",
    source_type: "speech",
    quote:
      "An unjust law is a human law that is not rooted in eternal law and natural law.",
    student_observation: "This note was saved under the speech but uses letter wording.",
    rhetorical_strategy: "pathos",
    audience_effect: "",
    purpose_connection: "",
    observation_stage: "guided",
    teacher_guided: false,
    created_at: now,
    updated_at: now,
  });
  if (guidedError) {
    console.warn("[wp087-seed] guided mismatch row skipped:", guidedError.message);
  }

  if (config.extraSpeechPathosId) {
    await supabase.from("student_observations").insert({
      user_email: userEmail,
      assignment_id: "mlk-rhetorical-analysis",
      source_id: "speech-pathos-alt",
      source_title: "I Have a Dream",
      source_type: "speech",
      quote:
        "I have a dream that one day this nation will rise up and live out the true meaning of its creed.",
      student_observation: [
        "A second pathos passage also fits the direction.",
        "---AUDIENCE---",
        "The crowd hears a shared national hope.",
        "---PURPOSE---",
        "Hope supports the call for justice.",
      ].join("\n"),
      rhetorical_strategy: "pathos",
      audience_effect: "The crowd hears a shared national hope.",
      purpose_connection: "Hope supports the call for justice.",
      observation_stage: "guided",
      teacher_guided: false,
      created_at: now,
      updated_at: now,
    });
  }

  const evidenceByCell: Record<string, string[]> = {
    "speech:ethos": ["tchart:speech:ethos"],
    "letter:ethos": ["tchart:letter:ethos"],
    "speech:pathos": config.clearCellLinks ? [] : ["tchart:speech:pathos"],
    "letter:pathos": ["tchart:letter:pathos"],
    "speech:logos": ["tchart:speech:logos"],
    "letter:logos": config.clearCellLinks
      ? ["tchart:letter:logos"]
      : ["tchart:letter:logos"],
  };

  const bundle = createEmptyMatrixBundle();
  MATRIX_CELL_ORDER.forEach(({ sourceType, appeal }, index) => {
    const rating = config.ratings[index];
    const key = `${sourceType}:${appeal}`;
    Object.assign(bundle.cells[index], {
      rating,
      evidenceIds: evidenceByCell[key] || [],
      functionNote: padFunctionNote(
        `${sourceType} ${appeal} feels about ${rating}/10 for this audience.`
      ),
      explicitNoEvidence: false,
      revisionState: "complete",
      updatedAt: now,
    });
  });

  const selectedPattern = {
    schemaVersion: 1,
    optionId: config.optionId,
    kind: config.kind,
    label: config.label,
    why: config.why,
    provenance: {
      ratings: config.ratingProvenance,
      evidenceIds: [config.speechEvidenceId, config.letterEvidenceId].filter(
        Boolean
      ),
      appeals: config.appeals,
    },
    advisory: true,
    contradictoryCue: null,
    selectedAt: now,
    ...(config.customMapping ? { customMapping: config.customMapping } : {}),
  };
  bundle.selectedPattern = selectedPattern;
  bundle.audiencePurposeReasoning =
    "Each audience needs a different mix of trust, feeling, and careful reasoning.";
  bundle.updatedAt = now;

  const signature = buildMatrixProvenanceSignature({
    selectedPattern,
    audiencePurposeReasoning: bundle.audiencePurposeReasoning,
  });

  const { data: m2row } = await supabase
    .from("student_buckets")
    .select("flow_state, buckets, reflection")
    .eq("user_email", userEmail)
    .eq("module", 2)
    .maybeSingle();

  const m2Flow = mergeModule2ArtifactBundle(m2row?.flow_state || {}, {
    matrixBundle: bundle,
  });

  const { error: m2Error } = await supabase.from("student_buckets").upsert(
    {
      user_email: userEmail,
      module: 2,
      buckets: m2row?.buckets || [],
      reflection: m2row?.reflection || "WP-087 matrix seed",
      flow_state: m2Flow,
      updated_at: now,
    },
    { onConflict: "user_email,module" }
  );
  if (m2Error) {
    return { ok: false as const, error: m2Error.message };
  }

  const sliceBase = {
    ...createEmptyEvidenceArgumentSliceState(),
    ...(config.schemaVersion
      ? { schemaVersion: config.schemaVersion }
      : {}),
    currentStep: config.currentStep || "ea_reorient",
    speechEvidenceId: config.speechEvidenceId || null,
    letterEvidenceId: config.letterEvidenceId || null,
    patternText:
      "The two works use different leading appeals for different audiences.",
    significanceText:
      "Each audience needs a different leading appeal to take the same justice goal seriously.",
    largerPointText: SEED_THESIS,
    thesisText: SEED_THESIS,
    proofDirections: [
      {
        role: "speech",
        text: SEED_PROOF_PLAN[0],
        evidenceId: config.speechEvidenceId || null,
      },
      {
        role: "letter",
        text: SEED_PROOF_PLAN[2] || SEED_PROOF_PLAN[1],
        evidenceId: config.letterEvidenceId || null,
      },
      {
        role: "comparison",
        text: "Explain why the leading appeals differ for each audience.",
        evidenceId: null,
      },
    ],
    upstreamSignature: signature,
    reviewedUpstreamSignature: config.priorOptionId ? null : signature,
    argumentMapConfirmed: false,
    updatedAt: now,
    customMapping: config.customMapping || null,
    legacyClaimForReview:
      "King uses ethos and pathos differently in the speech and the letter to reach each audience.",
    ...(config.priorOptionId
      ? {
          needsDirectionReview: true,
          priorProseForReview: {
            patternText: "Earlier prose from the previous direction.",
            fromOptionId: config.priorOptionId,
          },
          directionDescriptor: {
            optionId: config.priorOptionId,
            family: "cross_dominant",
          },
        }
      : {}),
  };

  // For legacyWp086, strip v2-only fields so normalize path is exercised.
  const slice =
    config.schemaVersion === EVIDENCE_ARGUMENT_SCHEMA_VERSION_V1
      ? (({
          schemaVersion: EVIDENCE_ARGUMENT_SCHEMA_VERSION_V1,
          currentStep: sliceBase.currentStep,
          repairReturnStep: null,
          speechEvidenceId: sliceBase.speechEvidenceId,
          letterEvidenceId: sliceBase.letterEvidenceId,
          patternText: sliceBase.patternText,
          significanceText: sliceBase.significanceText,
          largerPointText: sliceBase.largerPointText,
          thesisText: sliceBase.thesisText,
          proofDirections: sliceBase.proofDirections,
          upstreamSignature: sliceBase.upstreamSignature,
          reviewedUpstreamSignature: sliceBase.reviewedUpstreamSignature,
          argumentMapConfirmed: false,
          updatedAt: now,
          legacyClaimForReview: sliceBase.legacyClaimForReview,
        }) as ReturnType<typeof createEmptyEvidenceArgumentSliceState>)
      : sliceBase;

  const handoff = assembleModule4HandoffFromSlice(slice);

  const flowState = {
    v: 1,
    step: 1,
    evidenceArgumentSlice: slice,
    module3Patterns: [
      {
        id: "wp087-pattern-1",
        text: slice.patternText,
        evidenceIds: [config.speechEvidenceId, config.letterEvidenceId].filter(
          Boolean
        ),
        createdAt: now,
        updatedAt: now,
        matrixProvenance: {
          schemaVersion: 1,
          signature,
          selectedPatternOptionId: config.optionId,
          selectedPatternKind: config.kind,
          selectedPatternLabel: selectedPattern.label,
          evidenceIds: [config.speechEvidenceId, config.letterEvidenceId].filter(
            Boolean
          ),
          appeals: config.appeals,
          ratings: selectedPattern.provenance.ratings,
          audiencePurposeReasoning: bundle.audiencePurposeReasoning,
          ...(config.customMapping
            ? { customMapping: config.customMapping }
            : {}),
        },
      },
    ],
    module3SelectedPatternId: "wp087-pattern-1",
    module3Idea: {
      statement: slice.significanceText,
      whyMatters: slice.significanceText,
      clusterId: "wp087-cluster-1",
      patternId: "wp087-pattern-1",
      evidenceMap: {
        [config.speechEvidenceId || "tchart:speech:pathos"]: {
          selected: true,
          relation: "supports",
          note: "Speech evidence supports the comparison.",
        },
        [config.letterEvidenceId || "tchart:letter:logos"]: {
          selected: true,
          relation: "supports",
          note: "Letter evidence supports the comparison.",
        },
      },
    },
    module3Claim: {
      workingClaim: slice.legacyClaimForReview,
      supportRationale:
        "Public listeners and clergymen need different leading appeals.",
      clusterId: "wp087-cluster-1",
      patternId: "wp087-pattern-1",
    },
    module3Thesis: {
      thesis: handoff.thesis,
      proofPlan: handoff.proofPlan,
      clusterId: "wp087-cluster-1",
      patternId: "wp087-pattern-1",
      matrixProvenance: {
        schemaVersion: 1,
        signature,
        selectedPatternOptionId: config.optionId,
        ...(config.customMapping
          ? { customMapping: config.customMapping }
          : {}),
      },
    },
  };

  const { error: m3Error } = await supabase.from("student_buckets").upsert(
    {
      user_email: userEmail,
      module: 3,
      buckets: [
        {
          id: "wp087-cluster-1",
          name: config.label.slice(0, 80),
          reflection: `WP-087 seed variant ${options.variant || "legacyWp086"}`,
          evidenceIds: [config.speechEvidenceId, config.letterEvidenceId].filter(
            Boolean
          ),
          createdAt: now,
          updatedAt: now,
        },
      ],
      reflection: "WP-087 evidence-to-argument slice seed",
      flow_state: flowState,
      updated_at: now,
    },
    { onConflict: "user_email,module" }
  );
  if (m3Error) {
    return { ok: false as const, error: m3Error.message };
  }

  await supabase.from("module3_responses").upsert(
    {
      user_email: userEmail,
      thesis: handoff.thesis,
      structure_choice: "wp087-pattern-1",
      responses: [],
      updated_at: now,
    },
    { onConflict: "user_email" }
  );

  const progress = await setCurrentModule(userEmail, 3);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return {
    ok: true as const,
    currentModule: progress.module,
    optionId: config.optionId,
    variant: options.variant || "legacyWp086",
  };
}
