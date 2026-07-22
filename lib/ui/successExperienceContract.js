/**
 * WP-094 — Pure presentation contract for the success-screen family.
 * Deterministic. Never writes completion, invents artifacts, or reads rollout modes as evidence.
 */

import {
  buildJourneyProgress,
  getJourneyStageForModule,
} from "./writingJourneyStages.js";

export const SUCCESS_EXPERIENCE_VARIANTS = Object.freeze([
  "learning_milestone",
  "artifact_completed",
  "phase_transition",
  "final_receipt",
]);

export const SUCCESS_CELEBRATION_INTENSITY = Object.freeze({
  learning_milestone: "light",
  artifact_completed: "medium",
  phase_transition: "medium",
  final_receipt: "rich",
});

/**
 * @typedef {{ id: string, label: string, detail?: string|null }} SuccessEvidenceItem
 * @typedef {{
 *   label: string,
 *   href?: string|null,
 *   explanation?: string|null,
 *   kind?: "primary"|"secondary"|"recovery",
 *   enabled?: boolean,
 * }} SuccessAction
 */

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Keep at most three truthful evidence items; drop empty labels.
 * @param {SuccessEvidenceItem[]|null|undefined} items
 */
export function normalizeSuccessEvidence(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => {
      const label = trimText(item?.label);
      if (!label) return null;
      return Object.freeze({
        id: trimText(item?.id) || `evidence-${index + 1}`,
        label,
        detail: trimText(item?.detail) || null,
      });
    })
    .filter(Boolean)
    .slice(0, 3);
}

/**
 * @param {unknown} variant
 */
export function normalizeSuccessVariant(variant) {
  const value = String(variant || "").trim();
  return SUCCESS_EXPERIENCE_VARIANTS.includes(value) ? value : null;
}

/**
 * Final receipt may not claim submission without durable receipt truth.
 * @param {{
 *   hasDurableReceipt?: boolean,
 *   fileName?: string|null,
 *   submittedAtLabel?: string|null,
 *   fileSizeLabel?: string|null,
 *   receiptId?: string|null,
 *   statusLabel?: string|null,
 *   pdfHref?: string|null,
 * }} receipt
 */
export function normalizeReceiptFields(receipt = {}) {
  if (!receipt?.hasDurableReceipt) {
    return Object.freeze({
      hasDurableReceipt: false,
      fileName: null,
      submittedAtLabel: null,
      fileSizeLabel: null,
      receiptId: null,
      statusLabel: null,
      pdfHref: null,
    });
  }
  return Object.freeze({
    hasDurableReceipt: true,
    fileName: trimText(receipt.fileName) || "document.pdf",
    submittedAtLabel: trimText(receipt.submittedAtLabel) || "Saved",
    fileSizeLabel: trimText(receipt.fileSizeLabel) || null,
    receiptId: trimText(receipt.receiptId) || null,
    statusLabel: trimText(receipt.statusLabel) || "Submitted",
    pdfHref: trimText(receipt.pdfHref) || null,
  });
}

/**
 * @param {{
 *   variant: string,
 *   moduleNumber: number,
 *   status?: string|null,
 *   title: string,
 *   explanation: string,
 *   evidenceItems?: SuccessEvidenceItem[],
 *   primaryAction: SuccessAction,
 *   secondaryAction?: SuccessAction|null,
 *   recoveryAction?: SuccessAction|null,
 *   receipt?: object|null,
 *   allJourneyCompleted?: boolean,
 *   loading?: boolean,
 *   unavailable?: boolean,
 *   unavailableMessage?: string|null,
 * }} input
 */
export function resolveSuccessExperience(input = {}) {
  const variant = normalizeSuccessVariant(input.variant);
  if (!variant) {
    return Object.freeze({
      ok: false,
      error: "unknown_variant",
      experience: null,
    });
  }

  const moduleNumber = Number(input.moduleNumber);
  const journeyStage = getJourneyStageForModule(moduleNumber);
  const receipt = normalizeReceiptFields(input.receipt || {});

  if (variant === "final_receipt" && !receipt.hasDurableReceipt) {
    return Object.freeze({
      ok: true,
      experience: Object.freeze({
        variant,
        moduleNumber,
        journeyStageId: journeyStage?.id || "submit",
        journeyStageLabel: journeyStage?.label || "Submit",
        status: "receipt_missing",
        title: trimText(input.title) || "Submission receipt not found",
        explanation:
          trimText(input.explanation) ||
          "We could not find a saved final PDF for this assignment. Your paper has not been recorded as submitted from this screen.",
        evidenceItems: [],
        journey: buildJourneyProgress({ currentModule: 9, allCompleted: false }),
        primaryAction: Object.freeze({
          label:
            trimText(input.recoveryAction?.label) ||
            "Back to Module 9 upload",
          href: trimText(input.recoveryAction?.href) || "/modules/9",
          explanation:
            trimText(input.recoveryAction?.explanation) ||
            "Return to Module 9 to select and upload your PDF.",
          kind: "recovery",
          enabled: true,
        }),
        secondaryAction: null,
        recoveryAction: null,
        celebrationIntensity: "light",
        receipt,
        loading: Boolean(input.loading),
        unavailable: false,
        unavailableMessage: null,
        claimsSubmission: false,
      }),
    });
  }

  const primaryLabel = trimText(input.primaryAction?.label);
  if (!primaryLabel) {
    return Object.freeze({
      ok: false,
      error: "missing_primary_action",
      experience: null,
    });
  }

  const allCompleted =
    Boolean(input.allJourneyCompleted) ||
    (variant === "final_receipt" && receipt.hasDurableReceipt);

  const experience = Object.freeze({
    variant,
    moduleNumber,
    journeyStageId: journeyStage?.id || null,
    journeyStageLabel: journeyStage?.label || null,
    status: trimText(input.status) || "complete",
    title: trimText(input.title) || "Complete",
    explanation: trimText(input.explanation) || "",
    evidenceItems: normalizeSuccessEvidence(input.evidenceItems),
    journey: buildJourneyProgress({
      currentModule: allCompleted ? null : moduleNumber,
      allCompleted,
    }),
    primaryAction: Object.freeze({
      label: primaryLabel,
      href: trimText(input.primaryAction?.href) || null,
      explanation: trimText(input.primaryAction?.explanation) || null,
      kind: "primary",
      enabled: input.primaryAction?.enabled !== false,
    }),
    secondaryAction: input.secondaryAction?.label
      ? Object.freeze({
          label: trimText(input.secondaryAction.label),
          href: trimText(input.secondaryAction.href) || null,
          explanation: trimText(input.secondaryAction.explanation) || null,
          kind: "secondary",
          enabled: input.secondaryAction.enabled !== false,
        })
      : null,
    recoveryAction: null,
    celebrationIntensity: SUCCESS_CELEBRATION_INTENSITY[variant],
    receipt: variant === "final_receipt" ? receipt : normalizeReceiptFields({}),
    loading: Boolean(input.loading),
    unavailable: Boolean(input.unavailable),
    unavailableMessage: trimText(input.unavailableMessage) || null,
    claimsSubmission:
      variant === "final_receipt" && receipt.hasDurableReceipt === true,
  });

  return Object.freeze({ ok: true, experience });
}

/**
 * Compact completed-dashboard projection from the same journey + receipt truth.
 * @param {{
 *   hasDurableReceipt?: boolean,
 *   submittedAtLabel?: string|null,
 *   fileName?: string|null,
 *   pdfHref?: string|null,
 *   receiptHref?: string|null,
 *   assignmentCompleteWithoutReceipt?: boolean,
 * }} input
 */
export function resolveCompletedDashboardPresentation(input = {}) {
  const hasReceipt = Boolean(input.hasDurableReceipt);
  const assignmentCompleteWithoutReceipt = Boolean(
    input.assignmentCompleteWithoutReceipt
  );

  if (!hasReceipt && assignmentCompleteWithoutReceipt) {
    return Object.freeze({
      statusLabel: "Submission record missing",
      statusOnce: true,
      submittedAtLabel: null,
      primaryArtifactLabel: null,
      primaryArtifactHref: null,
      receiptLabel: "View submission receipt",
      receiptHref: trimText(input.receiptHref) || "/modules/9/success",
      journey: buildJourneyProgress({ allCompleted: false, currentModule: 9 }),
      resubmissionPolicy:
        "Contact your teacher before attempting to replace an accepted submission.",
      recoveryMessage:
        "This assignment looks finished, but we could not find the saved final PDF. Open the receipt page or contact your teacher.",
      hasDurableReceipt: false,
    });
  }

  if (!hasReceipt) {
    return null;
  }

  return Object.freeze({
    statusLabel: "Submitted",
    statusOnce: true,
    submittedAtLabel: trimText(input.submittedAtLabel) || null,
    primaryArtifactLabel: "Open final PDF",
    primaryArtifactHref: trimText(input.pdfHref) || null,
    receiptLabel: "View submission receipt",
    receiptHref: trimText(input.receiptHref) || "/modules/9/success",
    journey: buildJourneyProgress({ allCompleted: true }),
    resubmissionPolicy:
      "Contact your teacher before attempting to replace an accepted submission.",
    recoveryMessage: null,
    hasDurableReceipt: true,
    fileName: trimText(input.fileName) || null,
  });
}

/**
 * Representative builders used by gated surfaces (pure; callers supply evidence).
 */
export function buildModule1SuccessExperience({
  quizScoreLabel = null,
  conceptsCompleted = null,
  continueEnabled = true,
} = {}) {
  const evidence = [];
  if (conceptsCompleted) {
    evidence.push({
      id: "concepts",
      label: conceptsCompleted,
      detail: "Ready to use while reading sources",
    });
  }
  if (quizScoreLabel) {
    evidence.push({
      id: "check-in",
      label: quizScoreLabel,
      detail: "Optional check-in — understanding matters more than the score",
    });
  }

  return resolveSuccessExperience({
    variant: "learning_milestone",
    moduleNumber: 1,
    status: "milestone",
    title: "You understand what this essay asks",
    explanation:
      "You explained the assignment in your own words and practiced the rhetorical vocabulary you will use while reading King.",
    evidenceItems: evidence,
    primaryAction: {
      label: "Continue to Module 2 — save your source texts",
      href: "/modules/2",
      explanation:
        "Next you will save working copies of both texts and collect evidence—not start over.",
      enabled: continueEnabled,
    },
  });
}

export function buildModule6SuccessExperience({
  sectionCount = null,
  wordTotal = null,
  sectionSummary = null,
  continueEnabled = true,
} = {}) {
  const evidence = [];
  if (sectionCount != null) {
    evidence.push({
      id: "sections",
      label: `${sectionCount} draft section${Number(sectionCount) === 1 ? "" : "s"} locked`,
      detail: "Introduction, body, and conclusion are saved as prose",
    });
  }
  if (wordTotal != null && Number(wordTotal) > 0) {
    evidence.push({
      id: "words",
      label: `${wordTotal} words in your complete draft`,
      detail: "Derived from your saved Module 6 draft",
    });
  }
  if (sectionSummary) {
    evidence.push({
      id: "map",
      label: sectionSummary,
      detail: "Compact section map — not the full essay",
    });
  }

  return resolveSuccessExperience({
    variant: "artifact_completed",
    moduleNumber: 6,
    status: "draft_ready",
    title: "Your complete draft is ready to strengthen",
    explanation:
      "You finished drafting. The next job is revision—improve the writing you already have, not start a new essay.",
    evidenceItems: evidence,
    primaryAction: {
      label: "Continue to Module 7 — strengthen your draft",
      href: "/modules/7",
      explanation: "Revision uses this draft as the baseline.",
      enabled: continueEnabled,
    },
    secondaryAction: {
      label: "Review Module 6 draft",
      href: "/modules/6",
      kind: "secondary",
    },
  });
}

export function buildModule8SuccessExperience({
  docTitle = null,
  verifiedLabel = null,
  wordCount = null,
  continueEnabled = true,
} = {}) {
  const evidence = [];
  if (verifiedLabel) {
    evidence.push({
      id: "verified",
      label: verifiedLabel,
      detail: "Writing is finished — Module 9 formats and submits this Doc",
    });
  }
  if (docTitle) {
    evidence.push({
      id: "doc",
      label: docTitle,
      detail: "Submission Google Doc",
    });
  }
  if (wordCount != null && Number(wordCount) > 0) {
    evidence.push({
      id: "words",
      label: `${wordCount} words in the verified essay`,
    });
  }

  return resolveSuccessExperience({
    variant: "phase_transition",
    moduleNumber: 8,
    status: "prepared",
    title: "Your submission document is ready",
    explanation:
      "You prepared the verified Google Doc. Next comes guided APA formatting, PDF download and inspection, then upload—not more essay drafting.",
    evidenceItems: evidence,
    primaryAction: {
      label: "Continue to Module 9 — review APA and submit",
      href: "/modules/9",
      explanation:
        "One concise sequence: format moves → inspect Doc → download PDF → upload.",
      enabled: continueEnabled,
    },
  });
}

export function buildModule9ReceiptExperience({
  hasDurableReceipt = false,
  fileName = null,
  submittedAtLabel = null,
  fileSizeLabel = null,
  receiptId = null,
  pdfHref = null,
  docHref = null,
} = {}) {
  const resolved = resolveSuccessExperience({
    variant: "final_receipt",
    moduleNumber: 9,
    status: hasDurableReceipt ? "submitted" : "receipt_missing",
    title: hasDurableReceipt
      ? "Your paper was received"
      : "Submission receipt not found",
    explanation: hasDurableReceipt
      ? "You completed the whole writing process. This page is your lasting receipt—the details below come from the PDF saved for your teacher."
      : "We could not find a saved final PDF for this assignment. Your paper has not been recorded as submitted from this screen.",
    evidenceItems: hasDurableReceipt
      ? [
          {
            id: "process",
            label: "Full writing process completed",
            detail: "Understand through Submit",
          },
        ]
      : [],
    primaryAction: {
      label: "Back to Dashboard",
      href: "/dashboard",
      explanation: "Returns you to your class dashboard. Your submission stays saved.",
      enabled: true,
    },
    secondaryAction: pdfHref
      ? {
          label: "View submitted PDF",
          href: pdfHref,
          kind: "secondary",
        }
      : docHref
        ? {
            label: "Open your Google Doc",
            href: docHref,
            kind: "secondary",
          }
        : null,
    recoveryAction: {
      label: "Back to Module 9 upload",
      href: "/modules/9",
    },
    receipt: {
      hasDurableReceipt,
      fileName,
      submittedAtLabel,
      fileSizeLabel,
      receiptId,
      statusLabel: "Submitted",
      pdfHref,
    },
    allJourneyCompleted: hasDurableReceipt,
  });

  return resolved;
}
