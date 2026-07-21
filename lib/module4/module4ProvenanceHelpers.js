/**
 * Module 4 CP-E — read-only provenance personalization.
 *
 * Derives coaching (job recommendations + evidence priority cues) from the
 * adopted Module 3 matrix direction. Never writes Module 2/3 artifacts and
 * never mutates Module 4 paragraph plan fields.
 */

import { evidenceIdsMatch } from "../shared/evidenceIdAliases.js";
import {
  restoreActiveDirectionFromSavedPattern,
  resolveQualifyingEvidenceIds,
  dedupeEvidenceIds,
  sanitizeStudentFacingCopy,
  studentFacingCopyHasInternalIds,
  buildBecauseYouExplanationForPattern,
} from "../module3/moduleThreeMatrixHandoffHelpers.js";
import {
  labelForParagraphJob,
  recommendParagraphJob,
  PARAGRAPH_JOB_CHOICES,
} from "./module4PointJobHelpers.js";

export const MODULE4_PROVENANCE_REVIEW_HREF = "/modules/3";

export const CPE_LAYOUT_CONTRACT = {
  viewports: [320, 390, 768, 1440],
  mobile: {
    singleColumn: true,
    fullWidthPrimaryActions: true,
    teacherGuidanceBelow: true,
    noHorizontalOverflow: true,
    chipsWrap: true,
  },
  tablet: {
    pointJobTwoColumn: true,
  },
  desktop: {
    workspaceRail: true,
  },
};

export const EVIDENCE_PATTERN_PRIORITY_LABEL =
  "Connected to your selected pattern";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function emptyModel(partial = {}) {
  return {
    available: false,
    ready: false,
    needsReview: false,
    patternId: null,
    optionId: null,
    kind: null,
    label: "",
    signature: "",
    appeals: [],
    ratings: {},
    evidenceIds: [],
    readableRatingLines: [],
    readableEvidenceLines: [],
    audiencePurposeReasoning: "",
    becauseYouExplanation: "",
    reviewHref: MODULE4_PROVENANCE_REVIEW_HREF,
    ...partial,
  };
}

/**
 * Map Module 4 evidence pool rows into the record shape Module 3 helpers expect.
 * Read-only — does not mutate the pool.
 */
export function evidenceRecordsFromModule4Pool(evidencePool = []) {
  const list = Array.isArray(evidencePool) ? evidencePool : [];
  const out = [];
  for (const row of list) {
    const id = safeText(row?.evidenceKey || row?.id || "");
    if (!id) continue;
    out.push({
      id,
      sourceType:
        String(row?.type || row?.sourceType || "")
          .toLowerCase()
          .trim() === "letter"
          ? "letter"
          : "speech",
      appeal: String(row?.category || row?.appeal || "")
        .toLowerCase()
        .trim(),
      quotation: safeText(row?.quote || row?.quotation || ""),
    });
  }
  return out;
}

function classifyPatternFamily(kind) {
  const k = safeText(kind).toLowerCase();
  if (!k) return "generic";
  if (k === "student_created") return "custom";
  if (
    k.includes("contrast") ||
    k === "high_low" ||
    k === "largest_contrast"
  ) {
    return "contrast";
  }
  if (
    k.includes("similarity") ||
    k === "high_high" ||
    k === "low_low" ||
    k === "meaningful_similarity"
  ) {
    return "similarity";
  }
  if (k === "dominant_per_work") return "dominant_single";
  if (
    k === "combined_dominant_across_works" ||
    k.includes("dominant") ||
    k.includes("trace") ||
    k.includes("appeal")
  ) {
    return "trace";
  }
  return "generic";
}

function ratingValue(ratings, sourceType, appeal) {
  const slice = ratings?.[sourceType];
  if (!slice || typeof slice !== "object") return null;
  const raw = slice[appeal];
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function dominantWorkFromRatings(ratings = {}) {
  let speechMax = -1;
  let letterMax = -1;
  for (const appeal of ["ethos", "pathos", "logos"]) {
    const s = ratingValue(ratings, "speech", appeal);
    const l = ratingValue(ratings, "letter", appeal);
    if (s != null && s > speechMax) speechMax = s;
    if (l != null && l > letterMax) letterMax = l;
  }
  if (speechMax < 0 && letterMax < 0) return null;
  if (speechMax > letterMax) return "speech";
  if (letterMax > speechMax) return "letter";
  return "both";
}

function dominantAppealLabel(appeals = [], ratings = {}) {
  if (appeals.length === 1) return appeals[0];
  let best = null;
  let bestScore = -1;
  for (const appeal of ["ethos", "pathos", "logos"]) {
    const s = ratingValue(ratings, "speech", appeal) ?? -1;
    const l = ratingValue(ratings, "letter", appeal) ?? -1;
    const score = Math.max(s, l);
    if (score > bestScore) {
      bestScore = score;
      best = appeal;
    }
  }
  return best || appeals[0] || "";
}

function contrastPhrase(model) {
  const lines = model.readableRatingLines || [];
  if (lines.length >= 2) {
    return `a contrast between ${lines[0].sourceLabel} ${lines[0].appeal} and ${lines[1].sourceLabel} ${lines[1].appeal}`;
  }
  if (lines.length === 1) {
    return `a contrast involving ${lines[0].sourceLabel} ${lines[0].appeal}`;
  }
  return "a contrast from your matrix";
}

function similarityPhrase(model) {
  const appeal = dominantAppealLabel(model.appeals, model.ratings);
  if (appeal) return `a shared ${appeal} pattern`;
  return "a similarity from your matrix";
}

function makeRec(jobId, reason, isPrimary = false) {
  return {
    jobId,
    jobLabel: labelForParagraphJob(jobId),
    reason: sanitizeStudentFacingCopy(reason),
    isPrimary: Boolean(isPrimary),
    source: "matrix_provenance",
  };
}

/**
 * Build candidate job recommendations from pattern family (before paragraph trim).
 */
export function buildJobRecommendationCandidates(model) {
  if (!model?.ready) return [];
  const family = classifyPatternFamily(model.kind);
  const because = safeText(model.becauseYouExplanation);
  const contrast = contrastPhrase(model);
  const similarity = similarityPhrase(model);
  const appeal = dominantAppealLabel(model.appeals, model.ratings);
  const work = dominantWorkFromRatings(model.ratings);
  const label = safeText(model.label) || "your selected direction";

  if (family === "contrast") {
    return [
      makeRec(
        "show_difference",
        `Recommended because you selected ${contrast}.`,
        true
      ),
      makeRec(
        work === "letter" ? "analyze_letter" : "analyze_speech",
        `Recommended because one side of ${contrast} can carry its own paragraph.`
      ),
      makeRec(
        "compare_both",
        `Recommended because ${contrast} can also be shown side by side.`
      ),
    ];
  }

  if (family === "similarity") {
    return [
      makeRec(
        "show_similarity",
        `Recommended because you selected ${similarity}.`,
        true
      ),
      makeRec(
        "compare_both",
        `Recommended because your pattern follows a shared idea across both works.`
      ),
      makeRec(
        "trace_appeal",
        appeal
          ? `Recommended because your pattern follows ${appeal} across both works.`
          : `Recommended because your pattern follows an appeal across both works.`
      ),
    ];
  }

  if (family === "dominant_single") {
    const primaryJob =
      work === "letter" ? "analyze_letter" : "analyze_speech";
    const secondaryJob =
      primaryJob === "analyze_speech" ? "analyze_letter" : "analyze_speech";
    const workLabel =
      primaryJob === "analyze_speech" ? "Speech" : "Letter";
    return [
      makeRec(
        primaryJob,
        `Recommended because your pattern focuses on a strong move in the ${workLabel}.`,
        true
      ),
      makeRec(
        secondaryJob,
        `Recommended because a later paragraph can cover the other work.`
      ),
      makeRec(
        "compare_both",
        `Recommended because you can also put both works side by side.`
      ),
    ];
  }

  if (family === "trace") {
    return [
      makeRec(
        "trace_appeal",
        appeal
          ? `Recommended because your pattern follows ${appeal} across both works.`
          : `Recommended because your pattern follows one appeal across both works.`,
        true
      ),
      makeRec(
        "compare_both",
        `Recommended because a combined pattern often compares both works.`
      ),
      makeRec(
        "show_similarity",
        `Recommended because tracing one appeal can also highlight what stays the same.`
      ),
    ];
  }

  if (family === "custom") {
    const ids = model.evidenceIds || [];
    const speechish = ids.some((id) => /speech/i.test(String(id)));
    const letterish = ids.some((id) => /letter/i.test(String(id)));
    const primary =
      speechish && letterish
        ? "compare_both"
        : letterish
          ? "analyze_letter"
          : speechish
            ? "analyze_speech"
            : "compare_both";
    return [
      makeRec(
        primary,
        `Recommended because you created “${label}” and linked evidence for it.`,
        true
      ),
      makeRec(
        "show_difference",
        `Recommended if your custom direction highlights an important difference.`
      ),
      makeRec(
        "show_similarity",
        `Recommended if your custom direction highlights an important similarity.`
      ),
    ].slice(0, 3);
  }

  // generic with ready provenance
  return [
    makeRec(
      "compare_both",
      because
        ? `Recommended because ${because.replace(/^Because you/i, "you").replace(/\.$/, "")}.`
        : `Recommended because of your selected pattern: ${label}.`,
      true
    ),
    makeRec(
      "show_difference",
      `Recommended if this paragraph should highlight an important difference.`
    ),
    makeRec(
      "show_similarity",
      `Recommended if this paragraph should highlight an important similarity.`
    ),
  ];
}

/**
 * Paragraph-aware trim: prefer complementary jobs; never auto-select.
 * Optional Paragraph 3 only when the student is planning it.
 */
export function recommendParagraphJobsFromProvenance({
  provenanceModel = null,
  paragraphIndex = 0,
  plannedJobs = [],
  planningParagraph3 = false,
} = {}) {
  if (!provenanceModel?.ready) {
    return {
      available: false,
      recommendations: [],
      primary: null,
      becauseYouExplanation: "",
    };
  }

  if (paragraphIndex === 2 && !planningParagraph3) {
    return {
      available: true,
      recommendations: [],
      primary: null,
      becauseYouExplanation: provenanceModel.becauseYouExplanation || "",
      omittedOptionalThird: true,
    };
  }

  const used = new Set(
    (Array.isArray(plannedJobs) ? plannedJobs : [])
      .map((role) => safeText(role))
      .filter(Boolean)
  );

  let candidates = buildJobRecommendationCandidates(provenanceModel);

  // Rotate primary for later paragraphs when the prior job matched the first pick.
  if (paragraphIndex > 0 && candidates.length > 1) {
    const firstId = candidates[0].jobId;
    const priorUsedFirst = used.has(firstId);
    if (priorUsedFirst) {
      const rotated = [...candidates.slice(1), candidates[0]].map((rec, idx) => ({
        ...rec,
        isPrimary: idx === 0,
      }));
      candidates = rotated;
    } else if (paragraphIndex === 1 && classifyPatternFamily(provenanceModel.kind) === "contrast") {
      // Complementary: prefer the alternate work / compare after a difference opener.
      const prefer =
        used.has("show_difference") || used.has("analyze_speech")
          ? ["analyze_letter", "compare_both", "show_difference"]
          : used.has("analyze_letter")
            ? ["analyze_speech", "compare_both", "show_difference"]
            : null;
      if (prefer) {
        const byId = new Map(candidates.map((c) => [c.jobId, c]));
        const ordered = [];
        for (const id of prefer) {
          if (byId.has(id)) ordered.push(byId.get(id));
        }
        for (const c of candidates) {
          if (!ordered.some((o) => o.jobId === c.jobId)) ordered.push(c);
        }
        candidates = ordered.slice(0, 3).map((rec, idx) => ({
          ...rec,
          isPrimary: idx === 0,
          reason:
            idx === 0
              ? sanitizeStudentFacingCopy(
                  `Recommended because Body Paragraph ${paragraphIndex} already covered related work—this job complements ${contrastPhrase(provenanceModel)}.`
                )
              : rec.reason,
        }));
      }
    }
  }

  // Drop jobs already selected earlier from primary slot when alternatives exist.
  const filtered = [];
  for (const rec of candidates) {
    if (filtered.length >= 3) break;
    if (used.has(rec.jobId) && filtered.length === 0 && candidates.length > 1) {
      continue;
    }
    filtered.push(rec);
  }
  // Ensure we still have up to 3 if we skipped.
  if (filtered.length < 3) {
    for (const rec of candidates) {
      if (filtered.length >= 3) break;
      if (!filtered.some((f) => f.jobId === rec.jobId)) filtered.push(rec);
    }
  }

  const recommendations = filtered.slice(0, 3).map((rec, idx) => ({
    ...rec,
    isPrimary: idx === 0,
  }));

  return {
    available: true,
    recommendations,
    primary: recommendations[0] || null,
    becauseYouExplanation: provenanceModel.becauseYouExplanation || "",
  };
}

/**
 * Unified job recommendations: matrix-first when ready, else legacy proof-plan.
 * Recommendation alone never counts as selection.
 */
export function resolveModule4JobRecommendations({
  provenanceModel = null,
  proofPlan = [],
  suggestionId = "",
  paragraphIndex = 0,
  plannedJobs = [],
  planningParagraph3 = false,
  currentRole = "",
} = {}) {
  const fromMatrix = recommendParagraphJobsFromProvenance({
    provenanceModel,
    paragraphIndex,
    plannedJobs,
    planningParagraph3,
  });

  if (fromMatrix.available && fromMatrix.recommendations.length > 0) {
    return {
      source: "matrix_provenance",
      recommendations: fromMatrix.recommendations,
      primary: fromMatrix.primary,
      becauseYouExplanation: fromMatrix.becauseYouExplanation,
      // Explicit selection only — currentRole unchanged by this call.
      selectedJobId: safeText(currentRole),
      recommendationCountsAsSelection: false,
    };
  }

  const legacy = recommendParagraphJob({
    proofPlan,
    suggestionId,
    paragraphIndex,
  });

  if (!legacy?.jobId) {
    return {
      source: "legacy_neutral",
      recommendations: [],
      primary: null,
      becauseYouExplanation: "",
      selectedJobId: safeText(currentRole),
      recommendationCountsAsSelection: false,
    };
  }

  const rec = {
    jobId: legacy.jobId,
    jobLabel: legacy.jobLabel,
    reason: "Recommended from your proof plan — choose or confirm it below.",
    isPrimary: true,
    source: "proof_plan",
    slot: legacy.slot,
  };

  return {
    source: "proof_plan",
    recommendations: [rec],
    primary: rec,
    becauseYouExplanation: "",
    selectedJobId: safeText(currentRole),
    recommendationCountsAsSelection: false,
  };
}

/**
 * Canonical Module 4 provenance coaching model from saved Module 3 pattern.
 * Read-only. Viewing this does not write or normalize upstream artifacts.
 */
export function buildModule4ProvenanceModel({
  selectedPattern = null,
  evidencePool = [],
  matrixProvenance = null,
  matrixReview = null,
} = {}) {
  const pattern = selectedPattern || null;
  if (!pattern) {
    return emptyModel({ available: false, ready: false });
  }

  const prov =
    matrixProvenance ||
    pattern.matrixProvenance ||
    null;
  const review = matrixReview || pattern.matrixReview || null;
  const needsReview = Boolean(review?.needsReview);
  const evidenceRecords = evidenceRecordsFromModule4Pool(evidencePool);

  // Confirmed matrix direction path
  if (prov?.selectedPatternOptionId) {
    const active = restoreActiveDirectionFromSavedPattern({
      pattern: {
        ...pattern,
        matrixProvenance: prov,
        text: pattern.text,
        evidenceIds: pattern.evidenceIds,
      },
      evidenceRecords,
    });

    if (!active) {
      return emptyModel({
        available: true,
        ready: false,
        needsReview,
        patternId: pattern.id || null,
        label: sanitizeStudentFacingCopy(pattern.text || ""),
      });
    }

    const because = needsReview
      ? ""
      : sanitizeStudentFacingCopy(active.becauseYouExplanation || "");

    return emptyModel({
      available: true,
      ready: !needsReview,
      needsReview,
      patternId: pattern.id || null,
      optionId: active.optionId,
      kind: active.kind,
      label: sanitizeStudentFacingCopy(active.label || pattern.text || ""),
      signature: active.signature || prov.signature || "",
      appeals: [...(active.appeals || [])],
      ratings: active.ratings || {},
      evidenceIds: [...(active.evidenceIds || [])],
      readableRatingLines: active.readableRatingLines || [],
      readableEvidenceLines: active.readableEvidenceLines || [],
      audiencePurposeReasoning: sanitizeStudentFacingCopy(
        active.audiencePurposeReasoning || ""
      ),
      becauseYouExplanation: because,
    });
  }

  // Legacy Module 3 pattern without matrix provenance — supported fallback.
  const legacyIds = resolveQualifyingEvidenceIds(
    dedupeEvidenceIds(pattern.evidenceIds || []),
    evidenceRecords
  );
  const legacyLabel = sanitizeStudentFacingCopy(pattern.text || "");

  return emptyModel({
    available: true,
    ready: false,
    needsReview: false,
    patternId: pattern.id || null,
    optionId: null,
    kind: null,
    label: legacyLabel,
    signature: "",
    appeals: [],
    ratings: {},
    evidenceIds: legacyIds,
    readableRatingLines: [],
    readableEvidenceLines: [],
    audiencePurposeReasoning: "",
    becauseYouExplanation: legacyLabel
      ? "You saved this pattern in Module 3. Choose paragraph jobs from your proof plan or pick the job that fits."
      : "",
    legacyFallback: true,
  });
}

/**
 * Quiet evidence priority cue. Never auto-selects or disables options.
 */
export function getEvidenceProvenancePriorityCue({
  evidenceKey = "",
  provenanceModel = null,
  evidenceRow = null,
} = {}) {
  if (!provenanceModel?.ready) {
    return { show: false, label: "", detail: "", prioritized: false };
  }

  const key = safeText(evidenceKey);
  if (!key) {
    return { show: false, label: "", detail: "", prioritized: false };
  }

  const linked = (provenanceModel.evidenceIds || []).some((id) =>
    evidenceIdsMatch(id, key)
  );
  if (!linked) {
    // Also try synthetic row identity
    const alt = safeText(
      evidenceRow?.evidenceKey || evidenceRow?.id || ""
    );
    const linkedAlt =
      alt &&
      (provenanceModel.evidenceIds || []).some((id) =>
        evidenceIdsMatch(id, alt)
      );
    if (!linkedAlt) {
      return { show: false, label: "", detail: "", prioritized: false };
    }
  }

  const lines = provenanceModel.readableEvidenceLines || [];
  const matchLine = lines.find(
    (line) =>
      evidenceIdsMatch(line.evidenceId, key) ||
      (evidenceRow &&
        evidenceIdsMatch(
          line.evidenceId,
          evidenceRow.evidenceKey || evidenceRow.id
        ))
  );

  let detail = "";
  if (matchLine?.visibleLabel) {
    detail = sanitizeStudentFacingCopy(
      `This evidence helped create your ${matchLine.visibleLabel.replace(/^This evidence:\s*/i, "")}.`
    );
    // Prefer rating-oriented wording when we can parse source+appeal from row
    const source =
      String(evidenceRow?.type || evidenceRow?.sourceType || "").toLowerCase() ===
      "letter"
        ? "Letter"
        : "Speech";
    const appeal = String(
      evidenceRow?.category || evidenceRow?.appeal || ""
    ).toLowerCase();
    if (appeal && ["ethos", "pathos", "logos"].includes(appeal)) {
      detail = sanitizeStudentFacingCopy(
        `This evidence helped create your ${source} ${appeal} rating.`
      );
    }
  } else if (evidenceRow) {
    const source =
      String(evidenceRow?.type || evidenceRow?.sourceType || "").toLowerCase() ===
      "letter"
        ? "Letter"
        : "Speech";
    const appeal = String(
      evidenceRow?.category || evidenceRow?.appeal || ""
    ).toLowerCase();
    if (appeal && ["ethos", "pathos", "logos"].includes(appeal)) {
      detail = sanitizeStudentFacingCopy(
        `This evidence helped create your ${source} ${appeal} rating.`
      );
    }
  }

  return {
    show: true,
    prioritized: true,
    label: EVIDENCE_PATTERN_PRIORITY_LABEL,
    detail,
  };
}

/**
 * Short point-step provenance blurb (not the full matrix).
 */
export function getPointStepProvenanceBlurb(provenanceModel) {
  if (!provenanceModel?.available) return null;
  if (provenanceModel.needsReview) {
    return {
      kind: "needs_review",
      text: "Confirm your Module 3 direction before personalized Module 4 guidance is reliable.",
      href: MODULE4_PROVENANCE_REVIEW_HREF,
    };
  }
  if (!provenanceModel.ready) {
    if (provenanceModel.legacyFallback) {
      return {
        kind: "legacy",
        text: provenanceModel.label
          ? `Your Module 3 pattern: ${provenanceModel.label}`
          : null,
      };
    }
    return null;
  }
  const label = provenanceModel.label;
  const because = provenanceModel.becauseYouExplanation;
  return {
    kind: "ready",
    text: because
      ? sanitizeStudentFacingCopy(because)
      : label
        ? sanitizeStudentFacingCopy(`Your adopted direction: ${label}`)
        : null,
    label: label || "",
  };
}

/**
 * Reasoning-step reminder connecting pattern to audience/purpose.
 */
export function getReasoningProvenanceReminder(provenanceModel) {
  if (!provenanceModel?.ready) return null;
  const ap = safeText(provenanceModel.audiencePurposeReasoning);
  const label = safeText(provenanceModel.label);
  if (ap) {
    return sanitizeStudentFacingCopy(
      `Keep your adopted direction in mind: ${label || "your Module 3 pattern"} — ${ap}`
    );
  }
  if (provenanceModel.becauseYouExplanation) {
    return sanitizeStudentFacingCopy(provenanceModel.becauseYouExplanation);
  }
  return label
    ? sanitizeStudentFacingCopy(
        `Keep connecting this paragraph to your adopted direction: ${label}.`
      )
    : null;
}

/**
 * Quiet upstream-change / needs_review notice.
 * Does not mark paragraphs incomplete.
 *
 * Legacy Module 4 plans with no saved signature never produce
 * `direction_changed` (see MODULE4_UPSTREAM_SIGNATURE_BASELINE_POLICY).
 * A missing saved signature is not treated as a detected change.
 */
export function getUpstreamProvenanceChangeNotice({
  provenanceModel = null,
  seenSignature = "",
  hasPlannedContent = false,
} = {}) {
  if (!provenanceModel?.available) return null;

  if (provenanceModel.needsReview) {
    return {
      kind: "needs_review",
      title: "Confirm your Module 3 direction",
      message:
        "Your matrix direction still needs review in Module 3 before personalized Module 4 guidance is reliable. You can keep planning with the usual steps, or confirm the direction first.",
      href: MODULE4_PROVENANCE_REVIEW_HREF,
      hrefLabel: "Open Module 3 to confirm",
      marksIncomplete: false,
    };
  }

  const current = safeText(provenanceModel.signature);
  const seen = safeText(seenSignature);
  // Legacy / first-visit baseline: no saved signature → no change claim.
  if (!seen) return null;

  if (
    provenanceModel.ready &&
    hasPlannedContent &&
    current &&
    seen !== current
  ) {
    return {
      kind: "direction_changed",
      title: "Your Module 3 direction changed",
      message:
        "Your saved paragraph plans stayed as you wrote them. Review jobs and evidence that may need to fit the updated direction—recommendations below are guidance only.",
      href: null,
      marksIncomplete: false,
    };
  }

  return null;
}

/**
 * Whether Module 4 buckets already have student-authored plan content.
 */
export function module4BucketsHavePlanContent(buckets = []) {
  const list = Array.isArray(buckets) ? buckets : [];
  return list.some((b) => {
    if (!b) return false;
    if (safeText(b.claim)) return true;
    if (safeText(b.paragraphRole)) return true;
    if (safeText(b.reasoning)) return true;
    if (Array.isArray(b.evidenceKeys) && b.evidenceKeys.some((k) => safeText(k))) {
      return true;
    }
    return false;
  });
}

/**
 * Decide next seen-signature for display/bookkeeping helpers.
 * Persistence must use resolveModule4UpstreamSignatureForPersist instead —
 * this helper must not be used to seed writes on passive view.
 *
 * @deprecated Prefer resolveModule4UpstreamSignatureForPersist for saves.
 */
export function nextSeenUpstreamSignature({
  provenanceModel = null,
  seenSignature = "",
  acknowledgeChange = false,
  hasPlannedContent = false,
} = {}) {
  if (!provenanceModel?.ready || !provenanceModel.signature) {
    return safeText(seenSignature) || "";
  }
  if (provenanceModel.needsReview) {
    return safeText(seenSignature) || "";
  }
  const current = provenanceModel.signature;
  const seen = safeText(seenSignature);
  if (!seen) {
    // Do not invent a baseline during passive view; callers that persist
    // must use the save coordinator on a legitimate student save.
    return "";
  }
  if (seen === current) return current;
  if (acknowledgeChange) return current;
  if (hasPlannedContent) return seen;
  return seen;
}

export function studentFacingProvenanceTextsHaveInternalIds(model) {
  if (!model) return false;
  const parts = [
    model.label,
    model.becauseYouExplanation,
    model.audiencePurposeReasoning,
    ...(model.readableRatingLines || []).map((l) => l.visibleLabel),
    ...(model.readableEvidenceLines || []).map((l) => l.visibleLabel),
  ];
  return parts.some((t) => studentFacingCopyHasInternalIds(t));
}

export {
  labelForParagraphJob,
  PARAGRAPH_JOB_CHOICES,
  studentFacingCopyHasInternalIds,
};
