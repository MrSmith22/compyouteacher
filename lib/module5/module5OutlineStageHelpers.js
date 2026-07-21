/**
 * Module 5 CP-F — sequenced outline stages, gates, merge, and order guidance.
 * Presentation + pure decision logic. Persistence stays in outlinePersistenceHelpers.
 */

import { withOutlineMoveOrder } from "../artifacts/bodyParagraphSliceContract.js";
import { jobLabelForOutline } from "../module4/mapStudentBucketsToOutline.js";

export const MODULE5_STAGE = Object.freeze({
  BRING_IN: 1,
  ORDER: 2,
  REVIEW_BODY: 3,
  CONCLUSION: 4,
  FINALIZE: 5,
});

export const MODULE5_STAGE_COUNT = 5;

export const CPF_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1440],
  mobile: {
    singleColumn: true,
    fullWidthPrimaryActions: true,
    teacherGuidanceBelow: true,
    noHorizontalOverflow: true,
    minActionTargetPx: 44,
  },
  tablet: {
    // Below lg: keep a single readable column (no Module 3 three-column squeeze).
    singleColumnBelowLg: true,
    stackedOrTwoColumnSummaries: true,
  },
  desktop: {
    // ModuleFiveStepFrame — not ModuleThreeStepFrame / WorkspaceColumns default.
    shellMaxPx: 1180,
    mainWorkspaceMaxPx: 820,
    mainWorkspaceMinComfortPx: 680,
    teacherRailAtLg: true,
    noEmptyLeftSidebar: true,
    workspaceRail: true,
  },
});

export const MODULE5_IMPORT_MERGE_POLICY = Object.freeze({
  firstImportCreatesOnce: true,
  reloadResumesSavedOutline: true,
  noDuplicateOnReload: true,
  upstreamChangePreservesEdits: true,
  upstreamChangeNeverSilentReplace: true,
  conclusionNeverErasedByUpstream: true,
  noWriteOnPassiveComparison: true,
});

export const CONCLUSION_SUMMARY_MIN = 12;
export const CONCLUSION_FINAL_THOUGHT_MIN = 12;

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getModule5StagePresentation(stage, extras = {}) {
  const bodyIndex =
    typeof extras.bodyReviewIndex === "number" ? extras.bodyReviewIndex : 0;
  const bodyCount = Array.isArray(extras.body) ? extras.body.length : 0;
  const paragraphLabel = `Body Paragraph ${bodyIndex + 1}`;

  switch (Number(stage)) {
    case MODULE5_STAGE.BRING_IN:
      return {
        stage: MODULE5_STAGE.BRING_IN,
        question: "What paragraph plans am I bringing into my outline?",
        whyMatters: [
          "Module 5 arranges paragraph plans you already finished in Module 4.",
          "You are not recreating points, evidence, reasoning, or jobs—only organizing them.",
        ],
        primaryActionLabel: "Arrange my body paragraphs",
        nextStepText: "Next you will choose the order of your body paragraphs.",
        coachingMessage:
          "Skim the cards. Confirm your thesis and which paragraph plans came with you.",
      };
    case MODULE5_STAGE.ORDER:
      return {
        stage: MODULE5_STAGE.ORDER,
        question: "What order will make my argument easiest to follow?",
        whyMatters: [
          "Order helps a reader follow your compare-and-contrast work.",
          "Any suggestion is guidance only—you decide the final sequence.",
        ],
        primaryActionLabel: "Review the first paragraph",
        nextStepText: "Next you will review one body paragraph at a time.",
        coachingMessage:
          "Use Move earlier / Move later. Keep every paragraph exactly once.",
      };
    case MODULE5_STAGE.REVIEW_BODY:
      return {
        stage: MODULE5_STAGE.REVIEW_BODY,
        question: "Does this outline paragraph still say what I mean?",
        whyMatters: [
          "You are checking the outline representation—not rewriting Module 4 from scratch.",
          "Imported valid content can stay as written.",
        ],
        primaryActionLabel:
          bodyIndex + 1 >= bodyCount
            ? "Plan the conclusion"
            : "Next paragraph",
        nextStepText:
          bodyIndex + 1 >= bodyCount
            ? "Next you will plan how the essay closes."
            : `Next you will review Body Paragraph ${bodyIndex + 2}.`,
        coachingMessage: `Focus on ${paragraphLabel} only. Reviewed paragraphs stay available as compact summaries.`,
        bodyReviewIndex: bodyIndex,
      };
    case MODULE5_STAGE.CONCLUSION: {
      const micro = Number(extras.conclusionMicro || 0);
      if (micro <= 0) {
        return {
          stage: MODULE5_STAGE.CONCLUSION,
          conclusionMicro: 0,
          question:
            "What should the reader understand after the body paragraphs?",
          whyMatters: [
            "The conclusion gathers the argument—it does not invent a new claim.",
          ],
          primaryActionLabel: "Continue",
          nextStepText: "Next you will decide why this argument matters.",
          coachingMessage:
            "Write a short reminder of the main point—not a polished final paragraph.",
        };
      }
      if (micro === 1) {
        return {
          stage: MODULE5_STAGE.CONCLUSION,
          conclusionMicro: 1,
          question: "Why does this argument matter?",
          whyMatters: [
            "A final thought should feel earned by the evidence and comparison you planned.",
          ],
          primaryActionLabel: "Review conclusion plan",
          nextStepText: "Next you will review the full conclusion plan.",
          coachingMessage: "Leave the reader with one clear closing idea.",
        };
      }
      return {
        stage: MODULE5_STAGE.CONCLUSION,
        conclusionMicro: 2,
        question: "Is this conclusion plan ready for drafting?",
        whyMatters: [
          "Module 6 will draft from this plan. Keep it short and usable.",
        ],
        primaryActionLabel: "Review the full outline",
        nextStepText: "Next you will review thesis, body order, and conclusion together.",
        coachingMessage: "Confirm both conclusion notes before the final review.",
      };
    }
    case MODULE5_STAGE.FINALIZE:
    default:
      return {
        stage: MODULE5_STAGE.FINALIZE,
        question: "Is this outline ready for Module 6 drafting?",
        whyMatters: [
          "Finishing locks the outline you will draft from.",
          "You can still review it afterward, but Module 6 expects this structure.",
        ],
        primaryActionLabel: "Finish my outline",
        nextStepText: "Next you will draft one section at a time in Module 6.",
        coachingMessage:
          "Scan the hierarchy: thesis → ordered body paragraphs → conclusion.",
      };
  }
}

export function normalizeOutlineBodyOrder(body = []) {
  return (Array.isArray(body) ? body : []).map((card, index) => ({
    ...card,
    order: index,
    paragraphIndex:
      typeof card?.paragraphIndex === "number"
        ? card.paragraphIndex
        : typeof card?.sourceParagraphIndex === "number"
          ? card.sourceParagraphIndex
          : index,
    sourceParagraphIndex:
      typeof card?.sourceParagraphIndex === "number"
        ? card.sourceParagraphIndex
        : typeof card?.paragraphIndex === "number"
          ? card.paragraphIndex
          : index,
    job: safeText(card?.job) || jobLabelForOutline(card?.jobId) || "",
    point: safeText(card?.point) || safeText(card?.bucket) || "",
  }));
}

export function moveOutlineBodyCard(body = [], fromIndex, toIndex) {
  const list = normalizeOutlineBodyOrder(body);
  const from = Number(fromIndex);
  const to = Number(toIndex);
  if (
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length ||
    from === to
  ) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  const ordered = normalizeOutlineBodyOrder(next);
  // WP-083: refresh transition adjacency after reorder without inventing new identity.
  return ordered.map((card, essayOrderIndex) =>
    withOutlineMoveOrder(card, {
      essayOrderIndex,
      bodyCount: ordered.length,
      forceRefresh: true,
    })
  );
}

export function reorderBodyIdsUnique(body = []) {
  const list = Array.isArray(body) ? body : [];
  const ids = list.map((card, index) => {
    if (typeof card?.sourceParagraphIndex === "number") {
      return card.sourceParagraphIndex;
    }
    if (typeof card?.paragraphIndex === "number") {
      return card.paragraphIndex;
    }
    return index;
  });
  const unique = new Set(ids);
  return unique.size === ids.length && ids.length === list.length;
}

function evidenceCount(card) {
  if (Array.isArray(card?.evidence) && card.evidence.length) {
    return card.evidence.filter(
      (e) => safeText(e?.quote) || safeText(e?.observation)
    ).length;
  }
  const points = Array.isArray(card?.points) ? card.points : [];
  const reasoning = safeText(card?.reasoning);
  return points.filter((p) => {
    const t = safeText(p);
    return t && t !== reasoning;
  }).length;
}

export function isOutlineBodyCardValid(card, { allowMissingJob = false } = {}) {
  const point = safeText(card?.point) || safeText(card?.bucket);
  const job = safeText(card?.job) || jobLabelForOutline(card?.jobId);
  const reasoning =
    safeText(card?.reasoning) ||
    (Array.isArray(card?.points) ? safeText(card.points[card.points.length - 1]) : "");
  const count = evidenceCount(card);

  if (point.length < 1) {
    return { valid: false, field: "point", message: "Add a paragraph point." };
  }
  if (!allowMissingJob && !job) {
    return {
      valid: false,
      field: "job",
      message: "Choose or describe this paragraph’s organizational job.",
    };
  }
  if (count < 1) {
    return {
      valid: false,
      field: "evidence",
      message: "Keep at least one evidence note for this paragraph.",
    };
  }
  if (reasoning.length < 1) {
    return {
      valid: false,
      field: "reasoning",
      message: "Keep the reasoning or outline notes for this paragraph.",
    };
  }
  return { valid: true, field: null, message: "" };
}

export function isLegacyMissingJobCard(card) {
  if (!card) return false;
  const hasJobField = "job" in card || "jobId" in card;
  if (!hasJobField) return true;
  return !safeText(card.job) && !safeText(card.jobId);
}

export function validateOutlineBodyCardForGate(card) {
  if (isLegacyMissingJobCard(card)) {
    return isOutlineBodyCardValid(card, { allowMissingJob: true });
  }
  return isOutlineBodyCardValid(card, { allowMissingJob: false });
}

export function validateConclusionPlan(conclusion = {}) {
  const summary = safeText(conclusion?.summary);
  const finalThought = safeText(conclusion?.finalThought);
  if (summary.length < CONCLUSION_SUMMARY_MIN) {
    return {
      valid: false,
      field: "summary",
      message: "Add a short note about what the reader should understand.",
      count: summary.length,
      minimum: CONCLUSION_SUMMARY_MIN,
    };
  }
  if (finalThought.length < CONCLUSION_FINAL_THOUGHT_MIN) {
    return {
      valid: false,
      field: "finalThought",
      message: "Add a short note about why this argument matters.",
      count: finalThought.length,
      minimum: CONCLUSION_FINAL_THOUGHT_MIN,
    };
  }
  return { valid: true, field: null, message: "" };
}

export function evaluateModule5StageGate({
  stage,
  thesis = "",
  body = [],
  conclusion = {},
  bodyReviewIndex = 0,
  conclusionMicro = 0,
  requiredBodyCount = null,
} = {}) {
  const list = normalizeOutlineBodyOrder(body);
  const thesisOk = safeText(thesis).length > 0;
  const expectedCount =
    requiredBodyCount == null ? list.length : Number(requiredBodyCount);

  switch (Number(stage)) {
    case MODULE5_STAGE.BRING_IN: {
      if (!thesisOk) {
        return {
          ok: false,
          message: "Bring in your thesis from Module 3 before arranging paragraphs.",
        };
      }
      if (list.length < 2) {
        return {
          ok: false,
          message:
            "Finish the required paragraph plans in Module 4, then return here.",
        };
      }
      if (expectedCount && list.length < expectedCount) {
        return {
          ok: false,
          message:
            "Some required Module 4 paragraph plans are still incomplete.",
        };
      }
      return { ok: true, message: "" };
    }
    case MODULE5_STAGE.ORDER: {
      if (list.length < 2) {
        return { ok: false, message: "Need at least two body paragraphs to order." };
      }
      if (!reorderBodyIdsUnique(list)) {
        return {
          ok: false,
          message: "Every paragraph must appear exactly once in the order.",
        };
      }
      return { ok: true, message: "" };
    }
    case MODULE5_STAGE.REVIEW_BODY: {
      const card = list[bodyReviewIndex];
      if (!card) {
        return { ok: false, message: "Select a body paragraph to review." };
      }
      const result = validateOutlineBodyCardForGate(card);
      if (!result.valid) {
        return { ok: false, message: result.message, field: result.field };
      }
      return { ok: true, message: "" };
    }
    case MODULE5_STAGE.CONCLUSION: {
      if (Number(conclusionMicro) < 2) {
        // Micro-steps 0–1 only need their own field partially filled for Continue.
        if (Number(conclusionMicro) === 0) {
          const summary = safeText(conclusion?.summary);
          if (summary.length < CONCLUSION_SUMMARY_MIN) {
            return {
              ok: false,
              message: "Add a short note about what the reader should understand.",
            };
          }
          return { ok: true, message: "" };
        }
        const finalThought = safeText(conclusion?.finalThought);
        if (finalThought.length < CONCLUSION_FINAL_THOUGHT_MIN) {
          return {
            ok: false,
            message: "Add a short note about why this argument matters.",
          };
        }
        return { ok: true, message: "" };
      }
      return validateConclusionPlan(conclusion).valid
        ? { ok: true, message: "" }
        : {
            ok: false,
            message: validateConclusionPlan(conclusion).message,
          };
    }
    case MODULE5_STAGE.FINALIZE: {
      if (!thesisOk) {
        return { ok: false, message: "Confirm your thesis before finishing." };
      }
      if (!reorderBodyIdsUnique(list) || list.length < 2) {
        return {
          ok: false,
          message: "Body paragraphs must be complete and listed once each.",
        };
      }
      for (let i = 0; i < list.length; i += 1) {
        const result = validateOutlineBodyCardForGate(list[i]);
        if (!result.valid) {
          return {
            ok: false,
            message: `Body Paragraph ${i + 1}: ${result.message}`,
          };
        }
      }
      const concl = validateConclusionPlan(conclusion);
      if (!concl.valid) {
        return { ok: false, message: concl.message };
      }
      return { ok: true, message: "" };
    }
    default:
      return { ok: false, message: "Unknown stage." };
  }
}

/**
 * First import vs reload vs upstream Module 4 change.
 * Never writes; never silently replaces student outline text.
 */
export function resolveModule5ImportDecision({
  savedBody = [],
  importedBody = [],
  savedConclusion = null,
} = {}) {
  const saved = Array.isArray(savedBody) ? savedBody : [];
  const imported = Array.isArray(importedBody) ? importedBody : [];

  if (saved.length === 0) {
    return {
      action: "first_import",
      body: normalizeOutlineBodyOrder(imported),
      preserveConclusion: true,
      conclusion: savedConclusion,
      changedSources: [],
    };
  }

  // Reload: keep saved outline; do not recreate/duplicate.
  const changedSources = [];
  for (const card of saved) {
    const sourceIndex =
      typeof card?.sourceParagraphIndex === "number"
        ? card.sourceParagraphIndex
        : null;
    if (sourceIndex == null) continue;
    const upstream = imported.find(
      (c) => c.sourceParagraphIndex === sourceIndex
    );
    if (!upstream) continue;
    const savedSig = safeText(card.sourceSignature);
    const nextSig = safeText(upstream.sourceSignature);
    if (savedSig && nextSig && savedSig !== nextSig) {
      changedSources.push({
        sourceParagraphIndex: sourceIndex,
        label: safeText(card.point) || safeText(card.bucket) || `Body Paragraph ${sourceIndex + 1}`,
      });
    }
  }

  return {
    action: changedSources.length ? "upstream_review" : "resume_saved",
    body: normalizeOutlineBodyOrder(saved),
    preserveConclusion: true,
    conclusion: savedConclusion,
    changedSources,
    // Explicit update only — caller must request applyUpstreamBodyUpdate.
  };
}

/**
 * Explicit student action to refresh one source paragraph from Module 4.
 * Preserves order position and never clears conclusion.
 */
export function applyUpstreamBodyCardUpdate({
  savedBody = [],
  importedBody = [],
  sourceParagraphIndex,
} = {}) {
  const saved = normalizeOutlineBodyOrder(savedBody);
  const imported = Array.isArray(importedBody) ? importedBody : [];
  const upstream = imported.find(
    (c) => c.sourceParagraphIndex === sourceParagraphIndex
  );
  if (!upstream) return saved;
  return saved.map((card) => {
    if (card.sourceParagraphIndex !== sourceParagraphIndex) return card;
    return {
      ...upstream,
      order: card.order,
      // Keep student outline edits to point/job/reasoning if they diverged?
      // Spec: explicit update — refresh from upstream for that card.
    };
  });
}

/**
 * Pattern-based order guidance — never mutates order.
 */
export function buildOutlineOrderGuidance({
  provenanceModel = null,
  body = [],
} = {}) {
  const list = normalizeOutlineBodyOrder(body);
  if (!provenanceModel?.ready || list.length < 2) {
    return { available: false, suggestion: null, reason: "" };
  }

  const kind = String(provenanceModel.kind || "").toLowerCase();
  const jobs = list.map((c) => safeText(c.jobId || "").toLowerCase());

  let suggestedOrder = null;
  let reason = "";

  if (kind.includes("contrast") || kind === "high_low" || kind === "largest_contrast") {
    const speechIdx = list.findIndex((c) =>
      /speech/i.test(c.jobId || c.job || "")
    );
    const letterIdx = list.findIndex((c) =>
      /letter/i.test(c.jobId || c.job || "")
    );
    if (speechIdx >= 0 && letterIdx >= 0 && speechIdx !== letterIdx) {
      suggestedOrder = list.map((_, i) => i);
      // Prefer speech then letter when both analyze jobs exist
      if (speechIdx > letterIdx) {
        suggestedOrder = moveOutlineBodyCard(list, speechIdx, 0).map(
          (_, i) => i
        );
        // Build indices by source order preference
        const preferred = [];
        preferred.push(speechIdx, letterIdx);
        list.forEach((_, i) => {
          if (!preferred.includes(i)) preferred.push(i);
        });
        suggestedOrder = preferred;
      }
      reason =
        "Suggested because your argument begins with a contrast between the works—Speech then Letter often reads clearly.";
    } else {
      reason =
        "Suggested because you selected a contrast—keep related sides of the difference in a clear sequence.";
    }
  } else if (
    kind.includes("similarity") ||
    kind === "high_high" ||
    kind === "low_low" ||
    kind === "meaningful_similarity"
  ) {
    reason =
      "Suggested because your argument begins with shared ground—keep the similarity paragraph early when it helps the reader.";
  } else if (kind.includes("dominant") || kind.includes("trace") || kind.includes("appeal")) {
    reason =
      "Suggested because your pattern follows a strong appeal—lead with the clearest paragraph when it helps.";
  } else if (kind === "student_created") {
    return {
      available: false,
      suggestion: null,
      reason: "",
      inventsOrder: false,
    };
  } else {
    reason = provenanceModel.becauseYouExplanation
      ? `Suggested because ${String(provenanceModel.becauseYouExplanation)
          .replace(/^Because you/i, "you")
          .replace(/\.$/, "")}.`
      : "";
  }

  return {
    available: Boolean(reason),
    suggestion: suggestedOrder,
    reason,
    inventsOrder: false,
    appliesAutomatically: false,
  };
}

export function outlineCardEvidenceCount(card) {
  return evidenceCount(card);
}

export function outlineCardReasoningReady(card) {
  return safeText(card?.reasoning).length > 0 || evidenceCount(card) > 0;
}

export function syncLegacyPointsFromStructuredFields(card) {
  const evidence = Array.isArray(card?.evidence) ? card.evidence : [];
  const reasoning = safeText(card?.reasoning);
  const point = safeText(card?.point) || safeText(card?.bucket);
  const points = evidence
    .map((s) => {
      const obs = safeText(s?.observation);
      const quote = safeText(s?.quote);
      return `${obs}${quote ? ` — "${quote}"` : ""}`.trim();
    })
    .filter(Boolean);
  if (reasoning) points.push(reasoning);
  return {
    ...card,
    bucket: point || card?.bucket || "Body paragraph",
    point,
    points: points.length ? points : [""],
    job: safeText(card?.job) || jobLabelForOutline(card?.jobId) || card?.job,
  };
}

/**
 * Ephemeral UI stage in outline JSON (additive). Durable artifact stays outlines row.
 */
export function readModule5UiState(outline) {
  const ui = outline?.module5Ui || {};
  return {
    stage: Number(ui.stage) || MODULE5_STAGE.BRING_IN,
    bodyReviewIndex: Number(ui.bodyReviewIndex) || 0,
    conclusionMicro: Number(ui.conclusionMicro) || 0,
    reviewedBodyIndices: Array.isArray(ui.reviewedBodyIndices)
      ? ui.reviewedBodyIndices
      : [],
  };
}

export function writeModule5UiState(outline, uiState = {}) {
  return {
    ...(outline || {}),
    module5Ui: {
      stage: Number(uiState.stage) || MODULE5_STAGE.BRING_IN,
      bodyReviewIndex: Number(uiState.bodyReviewIndex) || 0,
      conclusionMicro: Number(uiState.conclusionMicro) || 0,
      reviewedBodyIndices: Array.isArray(uiState.reviewedBodyIndices)
        ? [...uiState.reviewedBodyIndices]
        : [],
    },
  };
}
