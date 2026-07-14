/**
 * Deterministic derived pattern options from matrix ratings (CP-C).
 * Never writes thesis language.
 */

import {
  normalizeRating,
  ratingMap,
  readMatrixBundle,
} from "./rhetoricalMatrixHelpers.js";

const APPEALS = ["ethos", "pathos", "logos"];

function cellEvidenceIds(bundle, sourceType, appeal) {
  const cell = (bundle?.cells || []).find(
    (c) => c.sourceType === sourceType && c.appeal === appeal
  );
  return Array.isArray(cell?.evidenceIds) ? cell.evidenceIds : [];
}

function hasExplicitNone(bundle, sourceType, appeal) {
  const cell = (bundle?.cells || []).find(
    (c) => c.sourceType === sourceType && c.appeal === appeal
  );
  return Boolean(cell?.explicitNoEvidence);
}

function option({
  id,
  kind,
  label,
  why,
  ratings,
  evidenceIds,
  appeals = [],
}) {
  return {
    id,
    kind,
    label,
    why,
    provenance: {
      ratings,
      evidenceIds: [...new Set(evidenceIds || [])],
      appeals,
    },
  };
}

/**
 * @param {unknown} bundleRaw
 */
export function derivePatternOptions(bundleRaw) {
  const bundle = readMatrixBundle(bundleRaw);
  if (!bundle) {
    return {
      options: [],
      flags: { missingRatings: true, ratingWithoutEvidence: [], malformed: true },
    };
  }

  const R = ratingMap(bundle);
  const missingRatings = [];
  const ratingWithoutEvidence = [];

  for (const sourceType of ["speech", "letter"]) {
    for (const appeal of APPEALS) {
      if (R[sourceType][appeal] == null) {
        missingRatings.push(`${sourceType}:${appeal}`);
      } else {
        const rating = R[sourceType][appeal];
        const ids = cellEvidenceIds(bundle, sourceType, appeal);
        const none = hasExplicitNone(bundle, sourceType, appeal);
        if (rating > 0 && ids.length === 0) {
          ratingWithoutEvidence.push(`${sourceType}:${appeal}`);
        }
        if (rating === 0 && !none && ids.length === 0) {
          ratingWithoutEvidence.push(`${sourceType}:${appeal}:no-evidence-flag`);
        }
      }
    }
  }

  const options = [];

  // largest contrast
  const contrasts = APPEALS.map((appeal) => {
    const s = R.speech[appeal];
    const l = R.letter[appeal];
    if (s == null || l == null) return null;
    return {
      appeal,
      diff: Math.abs(s - l),
      speech: s,
      letter: l,
    };
  }).filter(Boolean);

  if (contrasts.length) {
    const maxDiff = Math.max(...contrasts.map((c) => c.diff));
    const tied = contrasts.filter((c) => c.diff === maxDiff && maxDiff > 0);
    for (const c of tied) {
      options.push(
        option({
          id: `largest_contrast:${c.appeal}`,
          kind: "largest_contrast",
          label: `Compare how King uses ${c.appeal} differently in the speech and the letter`,
          why: `Speech ${c.speech}/10 vs Letter ${c.letter}/10 (difference ${c.diff}). This is a direction to investigate — not a finished thesis.`,
          ratings: { speech: { [c.appeal]: c.speech }, letter: { [c.appeal]: c.letter } },
          evidenceIds: [
            ...cellEvidenceIds(bundle, "speech", c.appeal),
            ...cellEvidenceIds(bundle, "letter", c.appeal),
          ],
          appeals: [c.appeal],
        })
      );
    }
  }

  // meaningful similarity: both ≥5 and |diff|≤2; highest min wins; ties → multi
  const similarities = APPEALS.map((appeal) => {
    const s = R.speech[appeal];
    const l = R.letter[appeal];
    if (s == null || l == null) return null;
    if (s < 5 || l < 5) return null;
    if (Math.abs(s - l) > 2) return null;
    return { appeal, min: Math.min(s, l), speech: s, letter: l };
  }).filter(Boolean);

  if (similarities.length) {
    const bestMin = Math.max(...similarities.map((s) => s.min));
    for (const s of similarities.filter((x) => x.min === bestMin)) {
      options.push(
        option({
          id: `meaningful_similarity:${s.appeal}`,
          kind: "meaningful_similarity",
          label: `Compare the ${s.appeal} both works rely on, then explain why it affects each audience differently`,
          why: `Both works clearly use ${s.appeal} (Speech ${s.speech}/10, Letter ${s.letter}/10). Still explain audiences and purposes in your own words.`,
          ratings: {
            speech: { [s.appeal]: s.speech },
            letter: { [s.appeal]: s.letter },
          },
          evidenceIds: [
            ...cellEvidenceIds(bundle, "speech", s.appeal),
            ...cellEvidenceIds(bundle, "letter", s.appeal),
          ],
          appeals: [s.appeal],
        })
      );
    }
  }

  // dominant appeal per work
  for (const sourceType of ["speech", "letter"]) {
    const scores = APPEALS.map((appeal) => ({
      appeal,
      rating: R[sourceType][appeal],
    })).filter((x) => x.rating != null);
    if (!scores.length) continue;
    const max = Math.max(...scores.map((s) => s.rating));
    const tops = scores.filter((s) => s.rating === max);
    for (const top of tops) {
      options.push(
        option({
          id: `dominant_per_work:${sourceType}:${top.appeal}`,
          kind: "dominant_per_work",
          label: `Matrix note: ${top.appeal} rates highest in the ${sourceType}`,
          why: `${sourceType} rates ${top.appeal} highest at ${top.rating}/10${
            tops.length > 1 ? " (tie)" : ""
          }. This observation alone is not a full comparative essay direction.`,
          ratings: { [sourceType]: { [top.appeal]: top.rating } },
          evidenceIds: cellEvidenceIds(bundle, sourceType, top.appeal),
          appeals: [top.appeal],
        })
      );
    }
  }

  // high/high, low/low, high/low
  for (const appeal of APPEALS) {
    const s = R.speech[appeal];
    const l = R.letter[appeal];
    if (s == null || l == null) continue;
    const ratings = {
      speech: { [appeal]: s },
      letter: { [appeal]: l },
    };
    const evidenceIds = [
      ...cellEvidenceIds(bundle, "speech", appeal),
      ...cellEvidenceIds(bundle, "letter", appeal),
    ];
    if (s >= 7 && l >= 7) {
      options.push(
        option({
          id: `high_high:${appeal}`,
          kind: "high_high",
          label: `Matrix note: both works rate ${appeal} as strong`,
          why: `Both works rate ${appeal} at 7+ (Speech ${s}, Letter ${l}). Often overlaps a similarity direction — not a separate thesis.`,
          ratings,
          evidenceIds,
          appeals: [appeal],
        })
      );
    }
    if (s <= 3 && l <= 3) {
      options.push(
        option({
          id: `low_low:${appeal}`,
          kind: "low_low",
          label: `Matrix note: ${appeal} is limited in both works`,
          why: `Both works rate ${appeal} at 3 or below (Speech ${s}, Letter ${l}). Usually supporting context, not a standalone essay direction.`,
          ratings,
          evidenceIds,
          appeals: [appeal],
        })
      );
    }
    if ((s >= 7 && l <= 3) || (l >= 7 && s <= 3)) {
      options.push(
        option({
          id: `high_low:${appeal}`,
          kind: "high_low",
          label: `Compare a strong-versus-limited use of ${appeal} across the works`,
          why: `Speech ${s}/10 vs Letter ${l}/10 on ${appeal}. Direction frame only — write the claim yourself later.`,
          ratings,
          evidenceIds,
          appeals: [appeal],
        })
      );
    }
  }

  // student-created always available as advisory alternative
  options.push(
    option({
      id: "student_created",
      kind: "student_created",
      label: "Another pattern I notice",
      why: "You can name a direction the derived options did not capture.",
      ratings: R,
      evidenceIds: [],
      appeals: [],
    })
  );

  return {
    options,
    flags: {
      missingRatings: missingRatings.length > 0,
      missingRatingCells: missingRatings,
      ratingWithoutEvidence,
      tiesPresent: options.some((o) => /tie/i.test(o.why)),
    },
  };
}

/**
 * Soft coaching when student choice contradicts strongest derived signal.
 */
export function contradictoryChoiceCue(selectedOption, derived) {
  if (!selectedOption || !derived?.options) return null;
  const contrasts = derived.options.filter((o) => o.kind === "largest_contrast");
  const similarities = derived.options.filter(
    (o) => o.kind === "meaningful_similarity"
  );
  if (!contrasts.length) return null;

  const maxContrast = Math.max(
    ...contrasts.map((c) => {
      const appeal = c.provenance.appeals[0];
      const s = c.provenance.ratings?.speech?.[appeal];
      const l = c.provenance.ratings?.letter?.[appeal];
      return Math.abs((s ?? 0) - (l ?? 0));
    })
  );

  if (
    selectedOption.kind === "meaningful_similarity" &&
    maxContrast >= 5 &&
    similarities.length
  ) {
    return {
      kind: "contradictory_choice",
      message:
        "You chose a similarity direction while the matrix also shows a large contrast. You may keep this choice—just be ready to explain it.",
    };
  }
  return null;
}

export function buildSelectedPattern({
  option,
  customLabel = "",
  derived,
}) {
  const base = option || {
    id: "student_created",
    kind: "student_created",
    label: customLabel || "Another pattern I notice",
    why: "Student-created",
    provenance: { ratings: {}, evidenceIds: [], appeals: [] },
  };

  return {
    schemaVersion: 1,
    optionId: base.id,
    kind: base.kind,
    label:
      base.kind === "student_created" && customLabel
        ? customLabel.trim()
        : base.label,
    why: base.why,
    provenance: base.provenance,
    advisory: true,
    contradictoryCue: contradictoryChoiceCue(base, derived),
    selectedAt: new Date().toISOString(),
  };
}

export function reasoningMeetsThreshold(text, min = 20) {
  return String(text || "").trim().length >= min;
}
