/**
 * Matrix orchestration — revision-safe persistence, resume, handoff, presentation.
 * Pure helpers for UI + race-safe tests (deferred promises).
 */

import {
  FUNCTION_NOTE_MIN_LENGTH,
  MATRIX_FLOW_STAGES,
  RATING_ANCHORS,
  allCellsComplete,
  canAdvanceMicrotask,
  createEmptyMatrixBundle,
  dominantQuestionForMicrotask,
  getMatrixProgress,
  normalizeRating,
  readMatrixBundle,
  updateCellInBundle,
} from "./rhetoricalMatrixHelpers.js";
import {
  derivePatternOptions,
  reasoningMeetsThreshold,
} from "./matrixDerivationHelpers.js";
import { buildEssayDirectionRecommendations } from "./matrixEssayDirectionContract.js";

export const CUSTOM_PATTERN_MIN_LENGTH = 15;
export const MAX_PRIMARY_RECOMMENDATIONS = 3;

/** Substantive cell fields that trigger dependency review when pattern exists. */
const SUBSTANTIVE_KEYS = new Set([
  "rating",
  "evidenceIds",
  "functionNote",
  "explicitNoEvidence",
]);

/**
 * First incomplete microtask inside a cell (or null if complete).
 * @param {object} cell
 * @returns {"rate"|"evidence"|"function"|null}
 */
export function getFirstIncompleteMicrotask(cell) {
  if (!cell) return "rate";
  const rating = normalizeRating(cell.rating);
  if (!rating.valid) return "rate";

  if (rating.value === 0) {
    if (!cell.explicitNoEvidence) return "evidence";
  } else if (
    !Array.isArray(cell.evidenceIds) ||
    cell.evidenceIds.length === 0
  ) {
    return "evidence";
  }

  if (
    String(cell.functionNote || "").trim().length < FUNCTION_NOTE_MIN_LENGTH
  ) {
    return "function";
  }

  return null;
}

/**
 * Resume target from a saved bundle.
 * @param {unknown} bundleRaw
 */
export function resolveMatrixResumeTarget(bundleRaw) {
  const bundle = readMatrixBundle(bundleRaw) || createEmptyMatrixBundle();

  // Incomplete cells → first incomplete cell + first incomplete microtask
  for (let i = 0; i < bundle.cells.length; i += 1) {
    const micro = getFirstIncompleteMicrotask(bundle.cells[i]);
    if (micro) {
      return {
        stage: MATRIX_FLOW_STAGES.CELL,
        cellIndex: i,
        microtask: micro,
        reason: "incomplete_cell",
      };
    }
  }

  // Dependency review unresolved → review/reconfirm
  if (bundle.reviewState?.dependentsNeedReview) {
    return {
      stage: MATRIX_FLOW_STAGES.REVIEW,
      cellIndex: 0,
      microtask: "rate",
      reason: "dependents_need_review",
    };
  }

  // All cells complete, no selection → review / pattern
  if (!bundle.selectedPattern) {
    return {
      stage: MATRIX_FLOW_STAGES.REVIEW,
      cellIndex: 5,
      microtask: "function",
      reason: "awaiting_pattern_selection",
    };
  }

  // Custom pattern too short
  if (
    bundle.selectedPattern.kind === "student_created" &&
    String(bundle.selectedPattern.label || "").trim().length <
      CUSTOM_PATTERN_MIN_LENGTH
  ) {
    return {
      stage: MATRIX_FLOW_STAGES.PATTERN,
      cellIndex: 5,
      microtask: "function",
      reason: "custom_pattern_incomplete",
    };
  }

  // Selection saved, reasoning incomplete → reasoning
  if (!reasoningMeetsThreshold(bundle.audiencePurposeReasoning)) {
    return {
      stage: MATRIX_FLOW_STAGES.REASONING,
      cellIndex: 5,
      microtask: "function",
      reason: "reasoning_incomplete",
    };
  }

  if (isMatrixHandoffReady(bundle)) {
    return {
      stage: MATRIX_FLOW_STAGES.COMPLETE,
      cellIndex: 5,
      microtask: "function",
      reason: "handoff_ready",
    };
  }

  // Malformed / contradictory → earliest safe incomplete stage
  return {
    stage: MATRIX_FLOW_STAGES.REVIEW,
    cellIndex: 0,
    microtask: "rate",
    reason: "safe_fallback_review",
  };
}

/**
 * Complete handoff predicate.
 * @param {unknown} bundleRaw
 */
export function isMatrixHandoffReady(bundleRaw) {
  const bundle = readMatrixBundle(bundleRaw);
  if (!bundle) return false;
  if (!allCellsComplete(bundle)) return false;
  if (!bundle.selectedPattern) return false;
  if (
    bundle.selectedPattern.kind === "student_created" &&
    String(bundle.selectedPattern.label || "").trim().length <
      CUSTOM_PATTERN_MIN_LENGTH
  ) {
    return false;
  }
  if (!reasoningMeetsThreshold(bundle.audiencePurposeReasoning)) return false;
  if (bundle.reviewState?.dependentsNeedReview) return false;
  return true;
}

/**
 * Whether a patch changes substantive fields relative to the current cell.
 */
export function isSubstantiveCellChange(cell, patch) {
  if (!patch || typeof patch !== "object") return false;
  for (const key of Object.keys(patch)) {
    if (!SUBSTANTIVE_KEYS.has(key)) continue;
    if (key === "evidenceIds") {
      const prev = JSON.stringify([...(cell?.evidenceIds || [])].sort());
      const next = JSON.stringify([...(patch.evidenceIds || [])].sort());
      if (prev !== next) return true;
      continue;
    }
    if (cell?.[key] !== patch[key]) return true;
  }
  return false;
}

/**
 * Dedupe review reasons by code+cellId; merge changedCellIds.
 */
export function mergeReviewState(existing, cellId, reason) {
  const prev = existing && typeof existing === "object" ? existing : {};
  const reasons = Array.isArray(prev.reasons) ? [...prev.reasons] : [];
  const key = `${reason.code}:${cellId}`;
  const already = reasons.some((r) => `${r.code}:${r.cellId}` === key);
  if (!already) {
    reasons.push({ ...reason, cellId });
  }
  const changedCellIds = new Set(
    Array.isArray(prev.changedCellIds) ? prev.changedCellIds : []
  );
  changedCellIds.add(cellId);
  return {
    dependentsNeedReview: true,
    reasons,
    changedCellIds: [...changedCellIds],
  };
}

/**
 * UI/state path for applying a cell patch (dependency-aware).
 * Typing-only local updates should NOT call this until Continue.
 */
export function applyMatrixCellPatchViaUiPath({
  bundle,
  cellId,
  patch,
}) {
  const previous = readMatrixBundle(bundle) || createEmptyMatrixBundle();
  const cell = previous.cells.find((c) => c.id === cellId);
  const hasSelection = Boolean(previous.selectedPattern);
  const substantive = isSubstantiveCellChange(cell, patch);

  if (hasSelection && substantive) {
    const next = updateCellInBundle(previous, cellId, patch);
    const reviewState = mergeReviewState(
      previous.reviewState,
      cellId,
      {
        code: "upstream_rating_changed",
        message: "A matrix cell changed after you selected a pattern.",
      }
    );
    const bundle = {
      ...next,
      selectedPattern: previous.selectedPattern,
      reviewState,
    };
    return {
      bundle,
      usedDependencyReview: true,
      selectionPreserved: true,
      downstreamTextsRewritten: false,
      derived: derivePatternOptions(bundle),
    };
  }

  const next = updateCellInBundle(previous, cellId, patch);
  return {
    bundle: next,
    usedDependencyReview: false,
    selectionPreserved: hasSelection,
    downstreamTextsRewritten: false,
    derived: derivePatternOptions(next),
  };
}

/**
 * Revision-safe, ordered save controller for matrix transitions.
 * Full-bundle POSTs execute serially. Queued revisions coalesce to the newest.
 * Invariant: the newest accepted local revision is the final server write.
 */
export function createMatrixSaveController() {
  let revisionCounter = 0;
  let lastAcceptedRevision = 0;
  /** @type {{ revision: number, send: Function, resolvers: Function[], ticket: object } | null} */
  let pending = null;
  let active = null;
  let pumping = false;

  function settleResolvers(job, result) {
    for (const resolve of job.resolvers) {
      resolve(result);
    }
  }

  async function pump() {
    if (pumping) return;
    pumping = true;
    try {
      while (pending) {
        const job = pending;
        pending = null;
        active = job;

        let sendResult;
        try {
          sendResult = await job.send(job.ticket);
        } catch (err) {
          sendResult = {
            ok: false,
            error:
              err?.message || "Could not save your matrix. Please try again.",
            bundle: null,
          };
        }

        active = null;

        // A newer job arrived while we were writing — this write already hit
        // the server in order; UI must not advance; newer job will write next.
        const superseded = Boolean(pending && pending.revision > job.revision);

        if (superseded) {
          settleResolvers(job, {
            ok: false,
            stale: true,
            advanced: false,
            error: null,
            bundle: sendResult?.bundle ?? null,
            ticket: job.ticket,
            wrote: Boolean(sendResult?.ok),
          });
          continue;
        }

        if (!sendResult?.ok) {
          settleResolvers(job, {
            ok: false,
            stale: false,
            advanced: false,
            error:
              sendResult?.error ||
              "Could not save your matrix. Please try again.",
            bundle: sendResult?.bundle ?? null,
            ticket: job.ticket,
            wrote: false,
          });
          continue;
        }

        lastAcceptedRevision = job.revision;
        settleResolvers(job, {
          ok: true,
          stale: false,
          advanced: true,
          error: null,
          bundle: sendResult.bundle ?? null,
          ticket: job.ticket,
          wrote: true,
        });
      }
    } finally {
      pumping = false;
      if (pending) {
        // re-enter if something arrived in the finally window
        void pump();
      }
    }
  }

  return {
    getRevision: () => revisionCounter,
    getLastAcceptedRevision: () => lastAcceptedRevision,
    isBusy: () => Boolean(active || pending || pumping),
    getActiveRevision: () => active?.revision ?? null,
    getPendingRevision: () => pending?.revision ?? null,

    /**
     * Enqueue a full-bundle save. Serializes server writes; coalesces waiting jobs.
     * @param {(ticket: { revision: number }) => Promise<{ ok: boolean, error?: string, bundle?: object }>} send
     */
    saveForTransition(send) {
      revisionCounter += 1;
      const ticket = { revision: revisionCounter };

      return new Promise((resolve) => {
        if (pending) {
          // Coalesce: older waiting revision never reaches the server.
          settleResolvers(pending, {
            ok: false,
            stale: true,
            advanced: false,
            error: null,
            bundle: null,
            ticket: pending.ticket,
            wrote: false,
            coalesced: true,
          });
        }

        pending = {
          revision: ticket.revision,
          send,
          resolvers: [resolve],
          ticket,
        };

        void pump();
      });
    },

    shouldApplyRemoteResult(responseRevision) {
      return Number(responseRevision) >= lastAcceptedRevision;
    },

    isTransitionAllowed(result) {
      return Boolean(result?.ok && result?.advanced && !result?.stale);
    },
  };
}

/**
 * Pure helper: whether a transition may change stage/cell/route after a save.
 */
export function mayNavigateAfterSave(result) {
  return Boolean(result && result.ok === true && result.advanced === true && !result.stale);
}

/**
 * Pure transition gate used by UI and tests.
 * On save failure/stale, freeze stage/cell/microtask/route.
 */
export function resolveMatrixNavigationGate({
  saveResult,
  stage,
  cellIndex,
  microtask,
  route = "/modules/2/matrix",
}) {
  if (!saveResult || saveResult.ok !== true || saveResult.stale) {
    return {
      allow: false,
      stage,
      cellIndex,
      microtask,
      route,
      error: saveResult?.stale
        ? null
        : saveResult?.error || "Could not save your matrix. Please try again.",
    };
  }
  return {
    allow: true,
    stage,
    cellIndex,
    microtask,
    route,
    error: null,
  };
}

/**
 * Presentation model for the active matrix screen.
 */
export function getMatrixPresentationModel({
  stage,
  bundle,
  cellIndex = 0,
  microtask = "rate",
  localFunctionNote,
}) {
  const safe = readMatrixBundle(bundle) || createEmptyMatrixBundle();
  const cell = safe.cells[cellIndex] || safe.cells[0];
  const note =
    localFunctionNote != null ? localFunctionNote : cell?.functionNote || "";
  const workingCell = { ...cell, functionNote: note };
  const progress = getMatrixProgress({ cellIndex, microtask });

  return {
    stage,
    cellIndex,
    microtask,
    cellId: cell?.id || null,
    dominantQuestion: dominantQuestionForMicrotask(workingCell, microtask),
    responseMode: microtask,
    progressLabel: progress.label,
    ratingAnchorsVisible: microtask === "rate",
    ratingAnchors: RATING_ANCHORS,
    continueEnabled: canAdvanceMicrotask(workingCell, microtask),
    continueGate: {
      ratingOk: canAdvanceMicrotask(workingCell, "rate"),
      evidenceOk: canAdvanceMicrotask(workingCell, "evidence"),
      functionOk: canAdvanceMicrotask(
        { ...workingCell, functionNote: note },
        "function"
      ),
    },
  };
}

/**
 * Missing-evidence recovery model.
 */
export function getMissingEvidenceRecovery({ cell, matchingEvidenceCount = 0 }) {
  const rating = normalizeRating(cell?.rating);
  const needsEvidence =
    rating.valid &&
    rating.value > 0 &&
    matchingEvidenceCount === 0;

  if (!needsEvidence) {
    return { needed: false };
  }

  return {
    needed: true,
    message:
      "This rating needs supporting evidence before you can continue. A rating of 0 uses the “not meaningfully used” path instead.",
    actions: [
      {
        id: "add_evidence",
        label: `Add or review evidence for ${cell.sourceType} ${cell.appeal}`,
        href: `/modules/2/tcharts?focus=${encodeURIComponent(
          `${cell.sourceType}:${cell.appeal}`
        )}`,
        preserveMatrixProgress: true,
      },
      {
        id: "revise_rating",
        label: "Revise this rating",
        href: null,
        preserveMatrixProgress: true,
      },
    ],
    canAdvance: false,
  };
}

/**
 * Build student-readable provenance while keeping internal IDs.
 * @param {object} option
 * @param {object[]} evidenceRecords normalized evidence
 */
export function buildReadableProvenance(option, evidenceRecords = []) {
  const byId = new Map(
    (evidenceRecords || []).map((e) => [e.id, e])
  );
  const evidenceIds = option?.provenance?.evidenceIds || [];
  const ratings = option?.provenance?.ratings || {};
  const appeals = option?.provenance?.appeals || [];

  const evidenceLabels = evidenceIds.map((id) => {
    const rec = byId.get(id);
    const quote = String(rec?.quotation || rec?.quote || "").trim();
    const short =
      quote.length > 60 ? `${quote.slice(0, 57)}…` : quote || "Saved evidence";
    const sourceType =
      rec?.sourceType ||
      (String(id).includes(":letter:") ? "letter" : "speech");
    const appeal =
      rec?.appeal ||
      appeals[0] ||
      String(id).split(":").pop() ||
      "";
    return {
      evidenceId: id,
      sourceLabel: sourceType === "letter" ? "Letter" : "Speech",
      appeal,
      quotation: short,
      visibleLabel: `${sourceType === "letter" ? "Letter" : "Speech"} · ${appeal} — “${short}”`,
    };
  });

  const ratingLines = [];
  for (const sourceType of ["speech", "letter"]) {
    const slice = ratings[sourceType] || {};
    for (const [appeal, value] of Object.entries(slice)) {
      ratingLines.push({
        sourceLabel: sourceType === "letter" ? "Letter" : "Speech",
        appeal,
        rating: value,
        visibleLabel: `${sourceType === "letter" ? "Letter" : "Speech"} ${appeal}: ${value}/10`,
      });
    }
  }

  return {
    evidenceIds,
    ratings,
    appeals,
    whyAppeared: option?.why || "",
    readable: {
      why: option?.why || "",
      ratings: ratingLines,
      evidence: evidenceLabels,
    },
  };
}

/**
 * Rank essay directions into ≤3 primary recommendations + selectable supporting + custom.
 *
 * Prefer the WP-079 canonical frame engine when a matrix bundle is provided.
 * Falls back to legacy observation ranking for callers that only pass derived options.
 *
 * @param {object} derivedResult
 * @param {unknown} [bundleRaw]
 */
export function selectPrimaryPatternRecommendations(derivedResult, bundleRaw = null) {
  if (bundleRaw) {
    const pack = buildEssayDirectionRecommendations(bundleRaw);
    return {
      primary: pack.primary,
      supporting: pack.supporting,
      custom: pack.custom,
      maxPrimary: pack.maxPrimary,
      primaryCount: pack.primaryCount,
      interpretation: pack.interpretation,
      flags: pack.flags,
      engine: "wp079_canonical_frames",
    };
  }

  // Legacy fallback (observation bag) — kept for older call sites/tests.
  const options = Array.isArray(derivedResult?.options)
    ? derivedResult.options
    : [];

  const byKind = (kind) => options.filter((o) => o.kind === kind);
  const primary = [];
  const supporting = [];

  const contrasts = byKind("largest_contrast");
  if (contrasts.length) {
    // Keep equal-score ties visible in primary until the cap fills.
    for (const c of contrasts) {
      if (primary.length < MAX_PRIMARY_RECOMMENDATIONS) {
        primary.push({
          ...c,
          recommendationRank: primary.length + 1,
          comparative: true,
          selectable: true,
        });
      } else {
        supporting.push({ ...c, selectable: true, comparative: true });
      }
    }
  }

  const similarities = byKind("meaningful_similarity");
  for (const s of similarities) {
    if (primary.length < MAX_PRIMARY_RECOMMENDATIONS) {
      primary.push({
        ...s,
        recommendationRank: primary.length + 1,
        comparative: true,
        selectable: true,
      });
    } else {
      supporting.push({ ...s, selectable: true, comparative: true });
    }
  }

  const dominants = byKind("dominant_per_work");
  const speechDom = dominants.find((o) => String(o.id).includes(":speech:"));
  const letterDom = dominants.find((o) => String(o.id).includes(":letter:"));
  const sAppeal = speechDom?.provenance?.appeals?.[0] || null;
  const lAppeal = letterDom?.provenance?.appeals?.[0] || null;
  if (
    speechDom &&
    letterDom &&
    sAppeal &&
    lAppeal &&
    sAppeal !== lAppeal &&
    primary.length < MAX_PRIMARY_RECOMMENDATIONS
  ) {
    const sRating = speechDom?.provenance?.ratings?.speech?.[sAppeal] ?? null;
    const lRating = letterDom?.provenance?.ratings?.letter?.[lAppeal] ?? null;
    primary.push({
      id: `cross_dominant:${sAppeal}:${lAppeal}`,
      kind: "combined_dominant_across_works",
      label: `Explore why ${sAppeal} is strongest in the speech while ${lAppeal} is strongest in the letter`,
      why: [
        `Speech relies most on ${sAppeal} at ${sRating}/10.`,
        `Letter relies most on ${lAppeal} at ${lRating}/10.`,
        "This is a direction to investigate — not a finished thesis.",
      ].join(" "),
      provenance: {
        ratings: {
          ...(speechDom?.provenance?.ratings || {}),
          ...(letterDom?.provenance?.ratings || {}),
        },
        evidenceIds: [
          ...(speechDom?.provenance?.evidenceIds || []),
          ...(letterDom?.provenance?.evidenceIds || []),
        ],
        appeals: [sAppeal, lAppeal],
      },
      recommendationRank: primary.length + 1,
      comparative: true,
      selectable: true,
    });
  }
  // Single-work dominants are matrix observations, not comparative directions.
  for (const d of dominants) {
    supporting.push({
      ...d,
      label: `Matrix note: ${d.label}`,
      comparative: false,
      selectable: true,
      observationOnly: true,
    });
  }

  for (const o of options) {
    if (
      o.kind === "student_created" ||
      o.kind === "largest_contrast" ||
      o.kind === "meaningful_similarity" ||
      o.kind === "dominant_per_work"
    ) {
      continue;
    }
    const observationOnly = o.kind === "high_high" || o.kind === "low_low";
    supporting.push({
      ...o,
      selectable: true,
      comparative: !observationOnly,
      observationOnly,
    });
  }

  const capped = primary.slice(0, MAX_PRIMARY_RECOMMENDATIONS);
  const custom =
    options.find((o) => o.kind === "student_created") ||
    {
      id: "student_created",
      kind: "student_created",
      label: "Another pattern I notice",
      why: "You can name a direction the recommendations did not capture.",
      provenance: { ratings: {}, evidenceIds: [], appeals: [] },
      selectable: true,
    };

  return {
    primary: capped,
    supporting,
    custom,
    maxPrimary: MAX_PRIMARY_RECOMMENDATIONS,
    primaryCount: capped.length,
    interpretation: "",
    engine: "legacy_observation_bag",
  };
}

/**
 * Pattern Continue gate.
 */
export function canContinuePatternSelection({
  selectedOptionId,
  customLabel = "",
}) {
  if (!selectedOptionId) return false;
  if (selectedOptionId === "student_created") {
    return String(customLabel || "").trim().length >= CUSTOM_PATTERN_MIN_LENGTH;
  }
  return true;
}

/**
 * Clear dependency review after student reconfirms pattern.
 */
export function clearDependencyReview(bundle) {
  const safe = readMatrixBundle(bundle) || createEmptyMatrixBundle();
  return {
    ...safe,
    reviewState: {
      dependentsNeedReview: false,
      reasons: [],
      changedCellIds: [],
    },
  };
}
