/**
 * WP-079 — Finite essay-direction universe for the rhetorical-strategy matrix.
 *
 * Separates:
 * - Matrix observation (what ratings show)
 * - Essay direction (comparison frame the student may investigate)
 * - Claim/Thesis (student-authored later — never generated here)
 *
 * Candidate generation is separate from ranking/presentation.
 */

import {
  normalizeRating,
  ratingMap,
  readMatrixBundle,
} from "./rhetoricalMatrixHelpers.js";

export const WP079_APPEALS = Object.freeze(["ethos", "pathos", "logos"]);
export const WP079_SOURCES = Object.freeze(["speech", "letter"]);

export const WP079_RELATIONSHIP = Object.freeze({
  STRONG_CONTRAST: "strong_contrast",
  MEANINGFUL_SIMILARITY: "meaningful_similarity",
  NUANCED_DIFFERENCE: "nuanced_difference",
  TOO_WEAK: "too_weak",
});

/** Absolute rating difference that can count as a same-appeal contrast direction. */
export const WP079_CONTRAST_MIN_DIFF = 3;
/** Both ratings at least this → similarity candidate (and |diff| ≤ SIMILARITY_MAX_DIFF). */
export const WP079_SIMILARITY_MIN = 5;
export const WP079_SIMILARITY_MAX_DIFF = 2;
/** Strong / central band for high-signal readings. */
export const WP079_HIGH = 7;
/** Limited / secondary / unused band. */
export const WP079_LOW = 3;
/** Cap for primary presentation (custom is separate). */
export const WP079_MAX_PRIMARY = 3;

export const WP079_RATING_DECISION = Object.freeze({
  keepScale: "0–10 centrality",
  separateRankingInput: false,
  rankingsDerivedFromRatings: true,
  zeroPreserved: true,
  precisionStance:
    "Provisional reasoned judgment supported by evidence — not objective measurement",
});

const APPEAL_LABEL = Object.freeze({
  ethos: "credibility",
  pathos: "emotional appeal",
  logos: "logic",
});

const APPEAL_LABEL_CAP = Object.freeze({
  ethos: "Credibility",
  pathos: "Emotional appeal",
  logos: "Logic",
});

function cellOf(bundle, sourceType, appeal) {
  return (bundle?.cells || []).find(
    (c) => c.sourceType === sourceType && c.appeal === appeal
  );
}

function cellEvidenceIds(bundle, sourceType, appeal) {
  const cell = cellOf(bundle, sourceType, appeal);
  return Array.isArray(cell?.evidenceIds) ? cell.evidenceIds : [];
}

function hasExplicitNone(bundle, sourceType, appeal) {
  return Boolean(cellOf(bundle, sourceType, appeal)?.explicitNoEvidence);
}

function cellEvidenceOk(bundle, sourceType, appeal, rating) {
  if (rating == null) return false;
  const ids = cellEvidenceIds(bundle, sourceType, appeal);
  if (ids.length > 0) return true;
  if (rating === 0 && hasExplicitNone(bundle, sourceType, appeal)) return true;
  return false;
}

/**
 * Family 1: three same-appeal frames + Family 2: six ordered distinct
 * dominant pairs + Family 3: custom. Nine canonical + custom.
 */
export function generateCanonicalDirectionFrames() {
  const sameAppeal = WP079_APPEALS.map((appeal) => ({
    frameId: `same_appeal:${appeal}`,
    family: "same_appeal",
    appeal,
    speechAppeal: appeal,
    letterAppeal: appeal,
  }));

  const cross = [];
  for (const speechAppeal of WP079_APPEALS) {
    for (const letterAppeal of WP079_APPEALS) {
      if (speechAppeal === letterAppeal) continue; // Family 1 covers same
      cross.push({
        frameId: `cross_dominant:${speechAppeal}:${letterAppeal}`,
        family: "cross_dominant",
        speechAppeal,
        letterAppeal,
      });
    }
  }

  const custom = {
    frameId: "student_created",
    family: "student_created",
    speechAppeal: null,
    letterAppeal: null,
  };

  return Object.freeze({
    sameAppeal: Object.freeze(sameAppeal),
    crossDominant: Object.freeze(cross),
    custom: Object.freeze(custom),
    all: Object.freeze([...sameAppeal, ...cross, custom]),
    canonicalCount: sameAppeal.length + cross.length, // 9
  });
}

function asRatingNumber(raw) {
  if (typeof raw === "number" && Number.isInteger(raw)) return raw;
  const normalized = normalizeRating(raw);
  return normalized.valid ? normalized.value : null;
}

export function classifySameAppealRelationship(speechRating, letterRating) {
  const s = asRatingNumber(speechRating);
  const l = asRatingNumber(letterRating);
  if (s == null || l == null) return WP079_RELATIONSHIP.TOO_WEAK;
  const diff = Math.abs(s - l);
  const max = Math.max(s, l);
  const min = Math.min(s, l);

  if (max <= WP079_LOW && min <= WP079_LOW) {
    return WP079_RELATIONSHIP.TOO_WEAK;
  }
  if (diff >= WP079_CONTRAST_MIN_DIFF && max >= WP079_SIMILARITY_MIN) {
    return WP079_RELATIONSHIP.STRONG_CONTRAST;
  }
  if (
    s >= WP079_SIMILARITY_MIN &&
    l >= WP079_SIMILARITY_MIN &&
    diff <= WP079_SIMILARITY_MAX_DIFF
  ) {
    return WP079_RELATIONSHIP.MEANINGFUL_SIMILARITY;
  }
  if (diff >= 1 && max >= WP079_SIMILARITY_MIN) {
    return WP079_RELATIONSHIP.NUANCED_DIFFERENCE;
  }
  return WP079_RELATIONSHIP.TOO_WEAK;
}

function dominantAppealsForWork(R, sourceType) {
  const scores = WP079_APPEALS.map((appeal) => ({
    appeal,
    rating: R[sourceType][appeal],
  })).filter((x) => x.rating != null);
  if (!scores.length) return [];
  const max = Math.max(...scores.map((s) => s.rating));
  if (max < WP079_SIMILARITY_MIN) return []; // too weak to call dominant
  return scores.filter((s) => s.rating === max).map((s) => s.appeal);
}

export function studentFacingSameAppealLabel(appeal, relationship) {
  const name = APPEAL_LABEL[appeal] || appeal;
  if (relationship === WP079_RELATIONSHIP.STRONG_CONTRAST) {
    return `Compare how King uses ${name} differently in the speech and the letter`;
  }
  if (relationship === WP079_RELATIONSHIP.MEANINGFUL_SIMILARITY) {
    return `Compare the ${name} both works rely on, then explain why it affects each audience differently`;
  }
  if (relationship === WP079_RELATIONSHIP.NUANCED_DIFFERENCE) {
    return `Explore a nuanced difference in how King uses ${name} across the two works`;
  }
  return `Look more closely at ${name} across the speech and letter`;
}

export function studentFacingCrossDominantLabel(speechAppeal, letterAppeal) {
  const s = APPEAL_LABEL[speechAppeal] || speechAppeal;
  const l = APPEAL_LABEL[letterAppeal] || letterAppeal;
  return `Explore why ${s} is strongest in the speech while ${l} is strongest in the letter`;
}

export function looksLikeCompletedClaimOrThesis(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  // Direction frames should not assert a finished comparative claim.
  if (/^although\b/i.test(t) && /\btherefore\b|\bmust conclude\b/i.test(t)) {
    return true;
  }
  if (/\bI will prove that\b|\bthis essay will argue that\b/i.test(t)) {
    return true;
  }
  return false;
}

function scoreSameAppeal(relationship, speech, letter) {
  const diff = Math.abs(speech - letter);
  if (relationship === WP079_RELATIONSHIP.STRONG_CONTRAST) {
    return 100 + diff * 10 + Math.max(speech, letter);
  }
  if (relationship === WP079_RELATIONSHIP.MEANINGFUL_SIMILARITY) {
    return 80 + Math.min(speech, letter) * 2;
  }
  if (relationship === WP079_RELATIONSHIP.NUANCED_DIFFERENCE) {
    return 40 + diff * 3 + Math.max(speech, letter);
  }
  return 0;
}

function scoreCrossDominant(sRating, lRating) {
  return 90 + (sRating + lRating);
}

/**
 * Evaluate eligibility for all canonical frames against a completed (or partial) bundle.
 */
export function evaluateCanonicalFrames(bundleRaw) {
  const bundle = readMatrixBundle(bundleRaw);
  const universe = generateCanonicalDirectionFrames();
  if (!bundle) {
    return {
      frames: [],
      flags: { missingRatings: true, weakSignal: true },
      interpretation: "Complete the matrix before choosing an essay direction.",
    };
  }

  const R = ratingMap(bundle);
  const missing = [];
  for (const sourceType of WP079_SOURCES) {
    for (const appeal of WP079_APPEALS) {
      if (R[sourceType][appeal] == null) missing.push(`${sourceType}:${appeal}`);
    }
  }

  const evaluated = [];

  for (const frame of universe.sameAppeal) {
    const speech = R.speech[frame.appeal];
    const letter = R.letter[frame.appeal];
    const relationship = classifySameAppealRelationship(speech, letter);
    const speechOk = cellEvidenceOk(bundle, "speech", frame.appeal, speech);
    const letterOk = cellEvidenceOk(bundle, "letter", frame.appeal, letter);
    const bothWorksEvidence = speechOk && letterOk;
    const eligible =
      relationship !== WP079_RELATIONSHIP.TOO_WEAK &&
      speech != null &&
      letter != null &&
      bothWorksEvidence;

    const zeroInvolved = speech === 0 || letter === 0;
    const why = [
      `Speech ${APPEAL_LABEL_CAP[frame.appeal]} ${speech ?? "—"}/10; Letter ${APPEAL_LABEL_CAP[frame.appeal]} ${letter ?? "—"}/10.`,
      relationship === WP079_RELATIONSHIP.STRONG_CONTRAST
        ? zeroInvolved
          ? "That gap includes limited or unused appeal in one work — useful when you can explain the absence."
          : "That gap can support a comparison about why each audience needs a different emphasis."
        : relationship === WP079_RELATIONSHIP.MEANINGFUL_SIMILARITY
          ? "Both works clearly use this appeal; the essay still needs to explain audiences and purposes."
          : relationship === WP079_RELATIONSHIP.NUANCED_DIFFERENCE
            ? "The difference is real but not drastic — treat it carefully, not as a dramatic contrast."
            : "Signal is too weak to recommend this as a main essay direction.",
    ].join(" ");

    const compatKind =
      relationship === WP079_RELATIONSHIP.STRONG_CONTRAST ||
      relationship === WP079_RELATIONSHIP.NUANCED_DIFFERENCE
        ? "largest_contrast"
        : relationship === WP079_RELATIONSHIP.MEANINGFUL_SIMILARITY
          ? "meaningful_similarity"
          : "same_appeal_weak";
    const compatId =
      compatKind === "same_appeal_weak"
        ? frame.frameId
        : `${compatKind}:${frame.appeal}`;

    evaluated.push({
      ...frame,
      relationship,
      eligible,
      isDirection: eligible,
      isObservationOnly: !eligible,
      score: eligible ? scoreSameAppeal(relationship, speech, letter) : 0,
      label: studentFacingSameAppealLabel(frame.appeal, relationship),
      why,
      ratings: {
        speech: { [frame.appeal]: speech },
        letter: { [frame.appeal]: letter },
      },
      evidenceIds: [
        ...cellEvidenceIds(bundle, "speech", frame.appeal),
        ...cellEvidenceIds(bundle, "letter", frame.appeal),
      ],
      appeals: [frame.appeal],
      bothWorksEvidence,
      zeroInvolved,
      // Compatibility id/kind for Modules 3–5 and existing selectedPattern rows
      kind: compatKind,
      optionId: compatId,
    });
  }

  const speechDominants = dominantAppealsForWork(R, "speech");
  const letterDominants = dominantAppealsForWork(R, "letter");

  for (const frame of universe.crossDominant) {
    const isCurrentDominantPair =
      speechDominants.includes(frame.speechAppeal) &&
      letterDominants.includes(frame.letterAppeal);
    const sRating = R.speech[frame.speechAppeal];
    const lRating = R.letter[frame.letterAppeal];
    const speechOk = cellEvidenceOk(
      bundle,
      "speech",
      frame.speechAppeal,
      sRating
    );
    const letterOk = cellEvidenceOk(
      bundle,
      "letter",
      frame.letterAppeal,
      lRating
    );
    const bothWorksEvidence = speechOk && letterOk;
    // Eligible only when this ordered pair matches current dominants (ties → multiple)
    const eligible =
      isCurrentDominantPair &&
      sRating != null &&
      lRating != null &&
      bothWorksEvidence &&
      sRating >= WP079_SIMILARITY_MIN &&
      lRating >= WP079_SIMILARITY_MIN;

    evaluated.push({
      ...frame,
      relationship: "cross_dominant",
      eligible,
      isDirection: eligible,
      isObservationOnly: !eligible,
      score: eligible ? scoreCrossDominant(sRating, lRating) : 0,
      label: studentFacingCrossDominantLabel(
        frame.speechAppeal,
        frame.letterAppeal
      ),
      why: eligible
        ? `Speech rates ${APPEAL_LABEL[frame.speechAppeal]} highest at ${sRating}/10; Letter rates ${APPEAL_LABEL[frame.letterAppeal]} highest at ${lRating}/10. That can support an essay about why each audience needs a different leading appeal.`
        : `Not the strongest pair right now (Speech ${frame.speechAppeal} ${sRating ?? "—"}/10; Letter ${frame.letterAppeal} ${lRating ?? "—"}/10).`,
      ratings: {
        speech: { [frame.speechAppeal]: sRating },
        letter: { [frame.letterAppeal]: lRating },
      },
      evidenceIds: [
        ...cellEvidenceIds(bundle, "speech", frame.speechAppeal),
        ...cellEvidenceIds(bundle, "letter", frame.letterAppeal),
      ],
      appeals: [frame.speechAppeal, frame.letterAppeal],
      bothWorksEvidence,
      kind: "combined_dominant_across_works",
      optionId: `cross_dominant:${frame.speechAppeal}:${frame.letterAppeal}`,
    });
  }

  // Same-dominant: do not also emit a cross frame (already skipped by distinct pairs).
  // Deduplicate: if same appeal is dominant in both, Family 1 owns it.

  const eligible = evaluated.filter((f) => f.eligible);
  const weakSignal =
    missing.length > 0 ||
    eligible.length === 0 ||
    eligible.every((f) => f.score < 50);

  const interpretation = buildRatingsInterpretation(R, eligible, weakSignal);

  return {
    frames: evaluated,
    eligible,
    speechDominants,
    letterDominants,
    flags: {
      missingRatings: missing.length > 0,
      missingRatingCells: missing,
      weakSignal,
      tiesPresent: hasScoreTies(eligible),
    },
    interpretation,
  };
}

function hasScoreTies(eligible) {
  if (eligible.length < 2) return false;
  const scores = eligible.map((e) => e.score);
  const max = Math.max(...scores);
  return scores.filter((s) => s === max).length > 1;
}

export function buildRatingsInterpretation(R, eligible = [], weakSignal = false) {
  if (weakSignal) {
    return "Your ratings do not yet point to one strong essay direction. You can still choose a careful comparison or write your own direction — just avoid pretending the matrix proves a dramatic contrast.";
  }
  const top = [...eligible].sort((a, b) => b.score - a.score)[0];
  if (!top) {
    return "Finish linking evidence for each rating so the matrix can recommend fair essay directions.";
  }
  if (top.family === "same_appeal") {
    return `Your ratings most clearly highlight ${APPEAL_LABEL[top.appeal]} across the speech and letter. Compare that pattern — do not treat the rating numbers as a finished thesis.`;
  }
  return `Your ratings suggest different leading appeals in each work. A strong essay direction compares those leading strategies for each audience — still in your own words.`;
}

/**
 * Rank eligible frames. Ties with equal score stay grouped; top-N is presentation only.
 */
export function rankEligibleFrames(evaluatedResult, { maxPrimary = WP079_MAX_PRIMARY } = {}) {
  const eligible = [...(evaluatedResult?.eligible || [])].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Deterministic tie-break by frameId (stable, visible — not array accident)
    return String(a.frameId).localeCompare(String(b.frameId));
  });

  const primary = [];
  const supporting = [];
  let i = 0;
  while (i < eligible.length) {
    const score = eligible[i].score;
    const tiedGroup = [];
    while (i < eligible.length && eligible[i].score === score) {
      tiedGroup.push(eligible[i]);
      i += 1;
    }
    for (const frame of tiedGroup) {
      if (primary.length < maxPrimary) {
        primary.push({
          ...frame,
          recommendationRank: primary.length + 1,
          tiedWith:
            tiedGroup.length > 1
              ? tiedGroup.map((t) => t.optionId || t.frameId)
              : null,
          comparative: true,
        });
      } else {
        supporting.push({
          ...frame,
          comparative: true,
          selectable: true,
          observationOnly: false,
        });
      }
    }
  }

  // Non-eligible frames that are still useful matrix observations (weak/low)
  for (const frame of evaluatedResult?.frames || []) {
    if (frame.eligible) continue;
    if (frame.family === "cross_dominant") continue; // don't flood with 6 inactive pairs
    if (frame.relationship === WP079_RELATIONSHIP.TOO_WEAK) {
      supporting.push({
        ...frame,
        label: `Matrix note: ${APPEAL_LABEL[frame.appeal]} is limited in both works`,
        why: `${frame.why} This is usually supporting context, not a standalone essay direction.`,
        comparative: false,
        selectable: true,
        observationOnly: true,
        kind: "low_low",
      });
    }
  }

  const custom = {
    id: "student_created",
    frameId: "student_created",
    kind: "student_created",
    family: "student_created",
    label: "Another pattern I notice",
    why: "You can name an evidence-supported direction the recommendations did not capture. You still choose the claim and thesis later.",
    provenance: { ratings: {}, evidenceIds: [], appeals: [] },
    comparative: true,
    selectable: true,
  };

  return {
    primary: primary.map(toOptionShape),
    supporting: supporting.map(toOptionShape),
    custom,
    maxPrimary,
    primaryCount: primary.length,
    interpretation: evaluatedResult?.interpretation || "",
    flags: evaluatedResult?.flags || {},
    speechDominants: evaluatedResult?.speechDominants || [],
    letterDominants: evaluatedResult?.letterDominants || [],
  };
}

function toOptionShape(frame) {
  const id = frame.optionId || frame.frameId || frame.id;
  return {
    id,
    frameId: frame.frameId || id,
    kind: frame.kind,
    family: frame.family,
    label: frame.label,
    why: frame.why,
    provenance: {
      ratings: frame.ratings || {},
      evidenceIds: [...new Set(frame.evidenceIds || [])],
      appeals: frame.appeals || [],
    },
    recommendationRank: frame.recommendationRank,
    comparative: frame.comparative !== false,
    selectable: frame.selectable !== false,
    observationOnly: Boolean(frame.observationOnly),
    tiedWith: frame.tiedWith || null,
    relationship: frame.relationship,
    score: frame.score,
  };
}

/**
 * Full recommendation pack from a matrix bundle.
 */
export function buildEssayDirectionRecommendations(bundleRaw) {
  const evaluated = evaluateCanonicalFrames(bundleRaw);
  const ranked = rankEligibleFrames(evaluated);
  return {
    ...ranked,
    universe: generateCanonicalDirectionFrames(),
    evaluated,
  };
}

/**
 * Truthful downstream personalization map (WP-079).
 */
export function getDownstreamPersonalizationMap() {
  return Object.freeze({
    module3: Object.freeze({
      mode: "direct_selection_plus_provenance",
      studentAuthorsClaimThesis: true,
      retainChooseCustom: true,
      upstreamEditMarksReview: true,
    }),
    module4: Object.freeze({
      mode: "consumes_selected_pattern_kind_and_evidence_ids",
      recommendationsAdvisory: true,
      studentMayOverride: true,
    }),
    module5: Object.freeze({
      mode: "organization_guidance_from_pattern_family",
      autoAppliesOrder: false,
      studentMayReorder: true,
    }),
    module6: Object.freeze({
      mode: "inherited_via_outline_and_paragraph_plans",
      directMatrixPanel: false,
      note: "Module 6 does not read matrixProvenance directly; point/job/evidence come from Module 4–5 artifacts.",
    }),
  });
}

/**
 * Deterministic scenario fixtures A–H for WP-079 tests.
 * Rating arrays are MATRIX_CELL_ORDER: speech/letter × ethos, pathos, logos.
 */
export function wp079ScenarioFixtures() {
  return Object.freeze({
    A_same_appeal_contrast: Object.freeze({
      id: "A",
      ratings: [8, 3, 4, 4, 3, 2],
      expectKind: "largest_contrast",
      expectAppeal: "ethos",
    }),
    B_same_appeal_similarity: Object.freeze({
      id: "B",
      ratings: [4, 4, 8, 7, 3, 3],
      expectKind: "meaningful_similarity",
      expectAppeal: "pathos",
    }),
    C_different_dominant: Object.freeze({
      id: "C",
      ratings: [3, 3, 9, 4, 4, 8],
      expectCross: true,
      speechDominant: "pathos",
      letterDominant: "logos",
    }),
    D_same_dominant: Object.freeze({
      id: "D",
      ratings: [9, 8, 4, 3, 2, 2],
      expectNoDuplicateCrossForEthos: true,
      speechDominant: "ethos",
      letterDominant: "ethos",
    }),
    E_ties: Object.freeze({
      id: "E",
      // Equal ethos & logos contrasts of 5
      ratings: [8, 3, 4, 4, 8, 3],
      expectTiedContrasts: true,
    }),
    F_weak_signal: Object.freeze({
      id: "F",
      ratings: [3, 3, 2, 2, 3, 2],
      expectWeakSignal: true,
    }),
    G_explicit_zero: Object.freeze({
      id: "G",
      ratings: [8, 0, 4, 4, 3, 3],
      expectZeroContrast: true,
      expectAppeal: "ethos",
    }),
    H_custom: Object.freeze({
      id: "H",
      ratings: [6, 5, 6, 5, 6, 5],
      expectCustomAvailable: true,
    }),
  });
}

export function assertNoInternalRuleIdsInLabel(label) {
  const text = String(label || "");
  const forbidden = [
    /largest_contrast/i,
    /combined_dominant_across_works/i,
    /high\/high/i,
    /low\/low/i,
    /meaningful_similarity:/i,
    /topic generated/i,
  ];
  return !forbidden.some((re) => re.test(text));
}
