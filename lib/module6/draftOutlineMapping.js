/**
 * Module 6 CP-G — outline → draft section mapping and source signatures.
 * Pure helpers only.
 */

import {
  buildDraftSectionSteps,
  SECTION_TYPES,
} from "../../components/module6/module6StepPresentation.js";

export { SECTION_TYPES };

export const MODULE6_DRAFT_STAGE = Object.freeze({
  INTRO: "intro",
  BODY: "body",
  CONCLUSION: "conclusion",
  REVIEW: "review",
});

export const CPG_LAYOUT_CONTRACT = Object.freeze({
  viewports: [320, 390, 768, 1024, 1440],
  mobile: {
    singleColumn: true,
    minActionTargetPx: 44,
    noHorizontalOverflow: true,
  },
  desktop: {
    draftingMainComfortPx: 680,
    referenceShelfCompact: true,
  },
});

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function evidenceIdentity(item) {
  if (!item || typeof item !== "object") return "";
  return [
    safeText(item.evidenceKey),
    safeText(item.quote),
    safeText(item.observation),
  ].join("|");
}

/**
 * Expected prose section count from a finalized Module 5 outline.
 * Intro + body cards + conclusion. Never invents a third body.
 */
export function expectedProseSectionCount(outline) {
  const body = Array.isArray(outline?.body) ? outline.body : [];
  return 1 + body.length + 1;
}

/**
 * Empty local sections aligned to the outline (no write).
 */
export function createEmptyDraftSections(outline) {
  const count = expectedProseSectionCount(outline);
  return Array.from({ length: Math.max(count, 2) }, () => "");
}

/**
 * Enrich draft steps with Module 5 card identity for one-section presentation.
 */
export function buildModule6DraftingSteps(outline) {
  const steps = buildDraftSectionSteps(outline);
  const body = Array.isArray(outline?.body) ? outline.body : [];

  return steps.map((step) => {
    if (step.type !== SECTION_TYPES.BODY) return { ...step };
    const card = body[step.bodyIndex] || {};
    return {
      ...step,
      point: safeText(card.point) || safeText(card.bucket) || null,
      job: safeText(card.job) || step.job || null,
      jobId: safeText(card.jobId) || null,
      evidence: Array.isArray(card.evidence) ? card.evidence : [],
      reasoning: safeText(card.reasoning) || null,
      bucket: safeText(card.bucket) || null,
      points: Array.isArray(card.points) ? card.points : [],
      sourceSignature: safeText(card.sourceSignature) || null,
      orderedPosition: step.bodyIndex,
    };
  });
}

/**
 * UI stages = prose steps + final review (review is not a prose section).
 */
export function buildModule6UiStages(outline) {
  const proseSteps = buildModule6DraftingSteps(outline);
  return [
    ...proseSteps,
    {
      id: "stage-review",
      draftIndex: null,
      type: MODULE6_DRAFT_STAGE.REVIEW,
      title: "Review your draft",
      bodyIndex: -1,
    },
  ];
}

export const MODULE6_REVIEW_STAGE_ID = "stage-review";

/** Prose step ids in outline order (excludes review). */
export function expectedProseSectionIds(outline) {
  return buildDraftSectionSteps(outline).map((step) => String(step.id));
}

/** UI stage index for the non-prose review step. */
export function expectedReviewStageIndex(outline) {
  return buildModule6UiStages(outline).length - 1;
}

/**
 * Deterministic source signature from drafting-relevant Module 5 content.
 * Excludes timestamps and module5Ui presentation state.
 */
export function buildModule5DraftSourceSignature(outline = {}) {
  const body = Array.isArray(outline?.body) ? outline.body : [];
  const conclusion = outline?.conclusion || {};

  const bodyParts = body.map((card, index) => {
    const evidence = Array.isArray(card?.evidence)
      ? card.evidence.map(evidenceIdentity)
      : [];
    const pointKeys = Array.isArray(card?.points)
      ? card.points.map((p) => safeText(p))
      : [];
    return {
      order: typeof card?.order === "number" ? card.order : index,
      sourceParagraphIndex:
        typeof card?.sourceParagraphIndex === "number"
          ? card.sourceParagraphIndex
          : typeof card?.paragraphIndex === "number"
            ? card.paragraphIndex
            : index,
      point: safeText(card?.point) || safeText(card?.bucket),
      job: safeText(card?.job),
      jobId: safeText(card?.jobId),
      reasoning: safeText(card?.reasoning),
      evidence,
      points: pointKeys,
      sourceSignature: safeText(card?.sourceSignature),
    };
  });

  try {
    return JSON.stringify({
      thesis: safeText(outline?.thesis),
      bodyCount: body.length,
      body: bodyParts,
      conclusion: {
        summary: safeText(conclusion.summary),
        finalThought: safeText(conclusion.finalThought),
      },
    });
  } catch {
    return "";
  }
}

/**
 * Compare saved draft source signature to current outline.
 * Never mutates draft sections.
 */
export function resolveModule6OutlineChangeReview({
  savedSignature = "",
  currentOutline = null,
} = {}) {
  const current = buildModule5DraftSourceSignature(currentOutline || {});
  if (!savedSignature) {
    return {
      required: false,
      reason: "no_baseline",
      currentSignature: current,
      changed: [],
    };
  }
  if (savedSignature === current) {
    return {
      required: false,
      reason: "unchanged",
      currentSignature: current,
      changed: [],
    };
  }

  let previous = null;
  try {
    previous = JSON.parse(savedSignature);
  } catch {
    previous = null;
  }

  const changed = [];
  if (!previous) {
    changed.push({ kind: "signature", label: "Outline content changed" });
  } else {
    if (safeText(previous.thesis) !== safeText(currentOutline?.thesis)) {
      changed.push({ kind: "thesis", label: "Thesis changed" });
    }
    const prevBody = Array.isArray(previous.body) ? previous.body : [];
    const nextBody = Array.isArray(currentOutline?.body) ? currentOutline.body : [];
    if (prevBody.length !== nextBody.length) {
      changed.push({
        kind: "body_count",
        label: `Body paragraph count changed (${prevBody.length} → ${nextBody.length})`,
      });
    } else {
      for (let i = 0; i < nextBody.length; i += 1) {
        const a = prevBody[i] || {};
        const b = nextBody[i] || {};
        const nextPoint = safeText(b.point) || safeText(b.bucket);
        if (
          a.point !== nextPoint ||
          a.job !== safeText(b.job) ||
          a.jobId !== safeText(b.jobId) ||
          a.reasoning !== safeText(b.reasoning) ||
          JSON.stringify(a.evidence || []) !==
            JSON.stringify(
              (Array.isArray(b.evidence) ? b.evidence : []).map(evidenceIdentity)
            ) ||
          a.sourceParagraphIndex !==
            (typeof b.sourceParagraphIndex === "number"
              ? b.sourceParagraphIndex
              : i)
        ) {
          changed.push({
            kind: "body_card",
            index: i,
            label: `Body paragraph ${i + 1} plan changed`,
          });
        }
      }
      // Order change: compare sourceParagraphIndex sequences
      const prevOrder = prevBody.map((c) => c.sourceParagraphIndex);
      const nextOrder = nextBody.map((c, i) =>
        typeof c.sourceParagraphIndex === "number" ? c.sourceParagraphIndex : i
      );
      if (JSON.stringify(prevOrder) !== JSON.stringify(nextOrder)) {
        changed.push({ kind: "body_order", label: "Body paragraph order changed" });
      }
    }
    const prevC = previous.conclusion || {};
    const nextC = currentOutline?.conclusion || {};
    if (
      safeText(prevC.summary) !== safeText(nextC.summary) ||
      safeText(prevC.finalThought) !== safeText(nextC.finalThought)
    ) {
      changed.push({ kind: "conclusion", label: "Conclusion plan changed" });
    }
  }

  return {
    required: changed.length > 0,
    reason: "meaningful_change",
    currentSignature: current,
    changed,
    preservesDraft: true,
    silentRemap: false,
  };
}

/**
 * Student-facing job sentence for a body step.
 */
export function bodyJobSentence(step) {
  const job = safeText(step?.job);
  if (job) {
    const lower = job.charAt(0).toLowerCase() + job.slice(1);
    if (/^this paragraph/i.test(job)) return job;
    return `This paragraph ${lower.replace(/\.$/, "")}.`;
  }
  const jobId = safeText(step?.jobId).toLowerCase();
  if (jobId.includes("letter")) return "This paragraph analyzes the letter.";
  if (jobId.includes("speech")) return "This paragraph analyzes the speech.";
  if (jobId.includes("compare") || jobId.includes("both")) {
    return "This paragraph compares both works.";
  }
  if (jobId.includes("diff") || jobId.includes("contrast")) {
    return "This paragraph shows an important difference.";
  }
  if (jobId.includes("similar")) {
    return "This paragraph shows an important similarity.";
  }
  return "This paragraph develops one part of your thesis.";
}

/**
 * Align saved sections to expected count without inventing structure remaps
 * when outline review is required — caller decides.
 */
export function alignDraftSectionsToExpected(sections, expectedCount) {
  const list = Array.isArray(sections) ? sections.map((s) => String(s ?? "")) : [];
  if (expectedCount <= 0) return list;
  if (list.length === expectedCount) return list;
  if (list.length < expectedCount) {
    return [...list, ...Array(expectedCount - list.length).fill("")];
  }
  // Do not silently drop prose: keep extras joined into last slot only when
  // caller explicitly allows structural align (legacy length drift).
  const head = list.slice(0, expectedCount - 1);
  const tail = list.slice(expectedCount - 1).join("\n\n");
  return [...head, tail];
}
