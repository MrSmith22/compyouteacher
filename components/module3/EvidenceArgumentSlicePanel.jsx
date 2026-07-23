"use client";

/**
 * WP-087 — Gated Module 3 staged evidence-to-argument builder.
 * One decision per screen; explicit Continue only (no character auto-advance).
 * Driven by direction descriptor (all WP-079 families).
 */

import { useMemo } from "react";
import Card from "@/components/ui/Card";
import {
  EVIDENCE_ARGUMENT_STEPS,
  evaluateBothWorkReadiness,
  diagnoseEvidenceHealth,
  buildArgumentMapPresentation,
  assembleModule4HandoffFromSlice,
} from "@/lib/artifacts/evidenceArgumentContract";
import { relationshipCoachingPrompt } from "@/lib/module2/evidenceArgumentDirectionDescriptor";
import ReopenSourceTextsControl from "@/components/sources/ReopenSourceTextsControl";
import { isTaskWorkspaceHierarchyFoundationEnabled } from "@/lib/dev/isTaskWorkspaceHierarchyFoundationEnabled";
import {
  HIERARCHY_DESK_CLASS,
  HIERARCHY_LEVELS,
  HIERARCHY_MODULE_CHROME_CLASS,
  HIERARCHY_TASK_CLASS,
} from "@/lib/ui/hierarchyContract";
import { resolveTaskWorkspacePresentation } from "@/lib/ui/taskWorkspaceContract";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

const TEXTAREA_CLASS =
  "mt-3 min-h-[120px] w-full rounded-xl border-2 border-theme-dark/20 bg-white p-4 text-base leading-relaxed text-text-primary focus:border-theme-dark/35 focus:outline-none focus:ring-4 focus:ring-theme-dark/[0.06]";

const FAMILY_LABEL = Object.freeze({
  same_appeal: "Same appeal across both works",
  cross_dominant: "Different leading appeals",
  student_created: "Your own comparison",
});

export function getEvidenceArgumentStepDefinition(stepId) {
  return (
    EVIDENCE_ARGUMENT_STEPS.find((s) => s.id === stepId) ||
    EVIDENCE_ARGUMENT_STEPS[0]
  );
}

export function canContinueEvidenceArgumentStep({
  stepId,
  slice,
  speechEvidence,
  letterEvidence,
  speechText = "",
  letterText = "",
  selectedOptionId = "",
  selectedDirectionSignature = "",
  directionDescriptor = null,
} = {}) {
  const s = slice || {};
  switch (stepId) {
    case "ea_reorient":
      return (
        Boolean(selectedOptionId) &&
        (!directionDescriptor || directionDescriptor.mappingComplete !== false) &&
        !s.needsDirectionReview
      );
    case "ea_reread":
      return Boolean(
        safeText(speechEvidence?.quotation || speechEvidence?.quote) &&
          safeText(letterEvidence?.quotation || letterEvidence?.quote)
      );
    case "ea_repair": {
      const speechFindings = diagnoseEvidenceHealth(speechEvidence, {
        speechText,
        letterText,
        expectedSourceKind: "speech",
      });
      const letterFindings = diagnoseEvidenceHealth(letterEvidence, {
        speechText,
        letterText,
        expectedSourceKind: "letter",
      });
      const blocking = [...speechFindings, ...letterFindings].filter(
        (f) => f.severity === "blocking"
      );
      return (
        Boolean(speechEvidence && letterEvidence) &&
        !blocking.some((f) => f.code === "wrong_source" || f.code === "quote_not_in_source")
      );
    }
    case "ea_explain":
      return Boolean(
        safeText(speechEvidence?.audienceEffect || speechEvidence?.audienceNote) &&
          safeText(
            speechEvidence?.purposeContribution || speechEvidence?.purposeNote
          ) &&
          safeText(letterEvidence?.audienceEffect || letterEvidence?.audienceNote) &&
          safeText(
            letterEvidence?.purposeContribution || letterEvidence?.purposeNote
          )
      );
    case "ea_pattern":
      return Boolean(safeText(s.patternText));
    case "ea_significance":
      return Boolean(safeText(s.significanceText));
    case "ea_larger_point":
      return Boolean(safeText(s.largerPointText || s.thesisText));
    case "ea_proof_directions": {
      const filled = (s.proofDirections || [])
        .map((p) => safeText(p.text))
        .filter(Boolean);
      return filled.length >= 2;
    }
    case "ea_argument_map": {
      const readiness = evaluateBothWorkReadiness({
        speechSourceText: speechText,
        letterSourceText: letterText,
        speechEvidence,
        letterEvidence,
        selectedOptionId,
        selectedDirectionSignature,
        reviewedUpstreamSignature: s.reviewedUpstreamSignature || "",
        patternText: s.patternText,
        thesisText: s.thesisText || s.largerPointText,
        proofDirections: s.proofDirections,
        directionDescriptor,
        customMapping: s.customMapping,
        needsDirectionReview: s.needsDirectionReview,
        speechFindings: diagnoseEvidenceHealth(speechEvidence, {
          speechText,
          letterText,
          expectedSourceKind: "speech",
        }),
        letterFindings: diagnoseEvidenceHealth(letterEvidence, {
          speechText,
          letterText,
          expectedSourceKind: "letter",
        }),
      });
      return readiness.ready && Boolean(s.argumentMapConfirmed);
    }
    default:
      return false;
  }
}

function reorientCopy(descriptor, selectedDirectionLabel) {
  if (selectedDirectionLabel) {
    return `You chose: ${selectedDirectionLabel}. Next you will reread one passage from each work.`;
  }
  if (descriptor?.label) {
    return `You chose: ${descriptor.label}. Next you will reread one passage from each work.`;
  }
  return "You chose a comparison direction. Next you will reread one passage from each work.";
}

export default function EvidenceArgumentSlicePanel({
  stepId,
  slice,
  onChangeSlice,
  speechEvidence,
  letterEvidence,
  speechText = "",
  letterText = "",
  selectedDirectionLabel = "",
  selectedOptionId = "",
  selectedDirectionSignature = "",
  directionDescriptor = null,
  speechCandidates = [],
  letterCandidates = [],
  legacyClaimForReview = "",
}) {
  const step = getEvidenceArgumentStepDefinition(stepId);
  const readiness = useMemo(
    () =>
      evaluateBothWorkReadiness({
        speechSourceText: speechText,
        letterSourceText: letterText,
        speechEvidence,
        letterEvidence,
        selectedOptionId,
        selectedDirectionSignature,
        reviewedUpstreamSignature: slice?.reviewedUpstreamSignature || "",
        patternText: slice?.patternText,
        thesisText: slice?.thesisText || slice?.largerPointText,
        proofDirections: slice?.proofDirections,
        directionDescriptor,
        customMapping: slice?.customMapping,
        needsDirectionReview: slice?.needsDirectionReview,
      }),
    [
      speechText,
      letterText,
      speechEvidence,
      letterEvidence,
      selectedOptionId,
      selectedDirectionSignature,
      directionDescriptor,
      slice,
    ]
  );

  const argumentMap = useMemo(
    () =>
      buildArgumentMapPresentation({
        selectedDirectionLabel:
          selectedDirectionLabel || directionDescriptor?.label || "",
        speechEvidence,
        letterEvidence,
        thesisText: slice?.thesisText || slice?.largerPointText,
        proofDirections: slice?.proofDirections,
      }),
    [selectedDirectionLabel, directionDescriptor, speechEvidence, letterEvidence, slice]
  );

  const handoffPreview = useMemo(
    () => assembleModule4HandoffFromSlice(slice),
    [slice]
  );

  const coachingPrompt = useMemo(
    () =>
      directionDescriptor?.coachingPrompt ||
      relationshipCoachingPrompt(directionDescriptor?.relationship, {
        speechAppeal: directionDescriptor?.speechAppeal,
        letterAppeal: directionDescriptor?.letterAppeal,
      }),
    [directionDescriptor]
  );

  function patch(partial) {
    onChangeSlice?.({ ...(slice || {}), ...partial, updatedAt: new Date().toISOString() });
  }

  const familyLabel =
    FAMILY_LABEL[directionDescriptor?.family] ||
    (directionDescriptor?.family ? String(directionDescriptor.family) : "");
  const foundation = isTaskWorkspaceHierarchyFoundationEnabled();
  const workspacePresentation = resolveTaskWorkspacePresentation({
    moduleNumber: 3,
    stepLabel: step.label || stepId,
    taskHeading: step.question,
    desktopWidthIntent: "single",
  });

  return (
    <div
      className="space-y-4"
      data-testid="wp086-evidence-argument-panel"
      data-step={stepId}
      data-family={directionDescriptor?.family || ""}
      data-option-id={selectedOptionId || ""}
      data-task-workspace-foundation={foundation ? "true" : undefined}
      data-task-workspace-contract={
        foundation ? workspacePresentation.journeyStageId : undefined
      }
    >
      <Card className="border-theme-blue/25 bg-white">
        <p
          className={
            foundation
              ? `${HIERARCHY_MODULE_CHROME_CLASS} text-[11px] !font-semibold uppercase tracking-[0.18em] text-text-muted`
              : "text-xs font-semibold uppercase tracking-wide text-text-muted"
          }
        >
          Your comparison
          {foundation && (selectedDirectionLabel || directionDescriptor?.label)
            ? ` · ${selectedDirectionLabel || directionDescriptor?.label}`
            : ""}
        </p>
        <h1
          className={
            foundation
              ? `mt-2 ${HIERARCHY_TASK_CLASS}`
              : "mt-1 text-xl font-bold text-text-primary"
          }
          data-testid={foundation ? "task-workspace-task" : undefined}
          data-hierarchy-level={foundation ? HIERARCHY_LEVELS.task : undefined}
        >
          {step.question}
        </h1>
        {!foundation && (selectedDirectionLabel || directionDescriptor?.label) ? (
          <p className="mt-2 text-sm text-text-muted" data-testid="wp086-selected-direction">
            Direction: {selectedDirectionLabel || directionDescriptor?.label}
          </p>
        ) : null}
        {foundation && (selectedDirectionLabel || directionDescriptor?.label) ? (
          <p className="sr-only" data-testid="wp086-selected-direction">
            Direction: {selectedDirectionLabel || directionDescriptor?.label}
          </p>
        ) : null}
        {familyLabel ? (
          <p className="mt-1 text-xs text-text-muted" data-testid="wp087-active-family">
            {familyLabel}
          </p>
        ) : null}
        <div className="mt-3">
          <ReopenSourceTextsControl />
        </div>
      </Card>

      {stepId === "ea_reorient" ? (
        <Card data-testid="wp086-step-reorient">
          <p className="text-sm text-text-primary">
            {reorientCopy(directionDescriptor, selectedDirectionLabel)}
          </p>
          {legacyClaimForReview ? (
            <p className="mt-3 rounded border border-border-soft bg-surface-soft/50 px-3 py-2 text-sm text-text-muted">
              Saved earlier claim (kept for you to review): {legacyClaimForReview}
            </p>
          ) : null}
          {slice?.priorProseForReview ? (
            <p
              className="mt-3 rounded border border-theme-orange/30 bg-theme-orange/5 px-3 py-2 text-sm text-text-muted"
              data-testid="wp087-prior-prose-review"
            >
              You changed comparison directions. Earlier writing is kept here for
              review — rewrite what no longer fits.
            </p>
          ) : null}
          {slice?.needsDirectionReview ? (
            <label className="mt-3 flex min-h-[44px] items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={false}
                onChange={(e) => {
                  if (e.target.checked) {
                    patch({
                      needsDirectionReview: false,
                      reviewedUpstreamSignature:
                        selectedDirectionSignature || slice.upstreamSignature,
                    });
                  }
                }}
                data-testid="wp087-acknowledge-direction-review"
              />
              I reviewed my earlier writing for this new direction.
            </label>
          ) : null}
        </Card>
      ) : null}

      {stepId === "ea_reread" || stepId === "ea_repair" || stepId === "ea_explain" ? (
        <div
          className={`grid gap-3 md:grid-cols-2 ${foundation ? HIERARCHY_DESK_CLASS : ""}`}
          data-testid="wp086-both-work-reread"
          data-task-workspace-region={foundation ? "desk" : undefined}
          data-instructional-color-role={foundation ? "evidence" : undefined}
          data-hierarchy-level={foundation ? HIERARCHY_LEVELS.work : undefined}
        >
          <Card>
            <h2 className="text-sm font-bold">Speech</h2>
            <p className="mt-2 text-sm text-text-primary">
              “{safeText(speechEvidence?.quotation || speechEvidence?.quote) || "No passage yet"}”
            </p>
            {stepId === "ea_explain" ? (
              <div className="mt-3 space-y-2 text-sm text-text-muted">
                <p>
                  <span className="font-medium text-text-primary">What it may do for the audience: </span>
                  {safeText(speechEvidence?.audienceEffect || speechEvidence?.audienceNote) || "Missing — repair in Module 2 or replace."}
                </p>
                <p>
                  <span className="font-medium text-text-primary">How it supports the purpose: </span>
                  {safeText(speechEvidence?.purposeContribution || speechEvidence?.purposeNote) || "Missing — repair in Module 2 or replace."}
                </p>
              </div>
            ) : null}
            {speechCandidates.length > 1 ? (
              <label className="mt-3 block text-xs text-text-muted">
                Replace speech evidence
                <select
                  className="mt-1 w-full rounded border px-2 py-1 text-sm"
                  value={speechEvidence?.id || ""}
                  onChange={(e) => patch({ speechEvidenceId: e.target.value })}
                  aria-label="Replace speech evidence"
                >
                  {speechCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.quotation || c.id).slice(0, 70)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </Card>
          <Card>
            <h2 className="text-sm font-bold">Letter</h2>
            <p className="mt-2 text-sm text-text-primary">
              “{safeText(letterEvidence?.quotation || letterEvidence?.quote) || "No passage yet"}”
            </p>
            {stepId === "ea_explain" ? (
              <div className="mt-3 space-y-2 text-sm text-text-muted">
                <p>
                  <span className="font-medium text-text-primary">What it may do for the audience: </span>
                  {safeText(letterEvidence?.audienceEffect || letterEvidence?.audienceNote) || "Missing — repair in Module 2 or replace."}
                </p>
                <p>
                  <span className="font-medium text-text-primary">How it supports the purpose: </span>
                  {safeText(letterEvidence?.purposeContribution || letterEvidence?.purposeNote) || "Missing — repair in Module 2 or replace."}
                </p>
              </div>
            ) : null}
            {letterCandidates.length > 1 ? (
              <label className="mt-3 block text-xs text-text-muted">
                Replace letter evidence
                <select
                  className="mt-1 w-full rounded border px-2 py-1 text-sm"
                  value={letterEvidence?.id || ""}
                  onChange={(e) => patch({ letterEvidenceId: e.target.value })}
                  aria-label="Replace letter evidence"
                >
                  {letterCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.quotation || c.id).slice(0, 70)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </Card>
        </div>
      ) : null}

      {stepId === "ea_pattern" ? (
        <Card data-testid="wp086-step-pattern">
          <label className="block text-sm font-medium text-text-primary" htmlFor="wp086-pattern">
            Your comparison
          </label>
          <p className="mt-1 text-sm text-text-muted" data-testid="wp087-pattern-coaching">
            {coachingPrompt}
          </p>
          <textarea
            id="wp086-pattern"
            className={TEXTAREA_CLASS}
            value={slice?.patternText || ""}
            onChange={(e) => patch({ patternText: e.target.value })}
            placeholder={coachingPrompt}
          />
        </Card>
      ) : null}

      {stepId === "ea_significance" ? (
        <Card data-testid="wp086-step-significance">
          <label className="block text-sm font-medium text-text-primary" htmlFor="wp086-significance">
            Why it matters
          </label>
          <textarea
            id="wp086-significance"
            className={TEXTAREA_CLASS}
            value={slice?.significanceText || ""}
            onChange={(e) => patch({ significanceText: e.target.value })}
            placeholder="Why does that difference matter for audience or purpose?"
          />
        </Card>
      ) : null}

      {stepId === "ea_larger_point" ? (
        <Card data-testid="wp086-step-larger-point">
          <label className="block text-sm font-medium text-text-primary" htmlFor="wp086-thesis">
            Your thesis
          </label>
          <textarea
            id="wp086-thesis"
            className={TEXTAREA_CLASS}
            value={slice?.largerPointText || slice?.thesisText || ""}
            onChange={(e) =>
              patch({
                largerPointText: e.target.value,
                thesisText: e.target.value,
              })
            }
            placeholder="What larger point can the essay prove about both works?"
          />
        </Card>
      ) : null}

      {stepId === "ea_proof_directions" ? (
        <Card data-testid="wp086-step-proof-directions">
          <p className="text-sm text-text-muted">
            How you will prove it — keep proof-plan requirements visible before Module 4.
          </p>
          {(slice?.proofDirections || []).map((slot, index) => (
            <label
              key={slot.role || index}
              className="mt-3 block text-sm font-medium text-text-primary"
            >
              {slot.role === "speech"
                ? "Speech proof"
                : slot.role === "letter"
                  ? "Letter proof"
                  : "Comparison proof"}
              <textarea
                className={TEXTAREA_CLASS}
                value={slot.text || ""}
                onChange={(e) => {
                  const next = [...(slice.proofDirections || [])];
                  next[index] = { ...next[index], text: e.target.value };
                  patch({ proofDirections: next });
                }}
                aria-label={`Proof direction ${index + 1}`}
              />
            </label>
          ))}
        </Card>
      ) : null}

      {stepId === "ea_argument_map" ? (
        <Card data-testid="wp086-step-argument-map">
          <h2 className="text-lg font-bold">Your argument map</h2>
          {familyLabel ? (
            <p className="mt-1 text-xs text-text-muted" data-testid="wp087-map-family">
              {familyLabel}
            </p>
          ) : null}
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-text-primary">
            <li>Direction → {argumentMap.direction || "—"}</li>
            <li>
              Speech proof → “{argumentMap.speechProof.quote.slice(0, 80)}
              {argumentMap.speechProof.quote.length > 80 ? "…" : ""}”
            </li>
            <li>
              Letter proof → “{argumentMap.letterProof.quote.slice(0, 80)}
              {argumentMap.letterProof.quote.length > 80 ? "…" : ""}”
            </li>
            <li>Your thesis → {argumentMap.thesis || "—"}</li>
            <li>
              How you will prove it →{" "}
              {argumentMap.proofDirections.join(" · ") || "—"}
            </li>
          </ol>
          {!readiness.ready ? (
            <ul
              className="mt-4 space-y-1 text-sm text-theme-orange"
              role="alert"
              data-testid="wp086-readiness-blockers"
            >
              {readiness.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-theme-green" role="status">
              Both works are represented. Confirm the map to finish Module 3.
            </p>
          )}
          <label className="mt-4 flex min-h-[44px] items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(slice?.argumentMapConfirmed)}
              disabled={!readiness.ready}
              onChange={(e) => patch({ argumentMapConfirmed: e.target.checked })}
              data-testid="wp086-confirm-argument-map"
            />
            I confirm this is the argument I earned.
          </label>
          <p className="mt-2 text-xs text-text-muted">
            Module 4 will receive your thesis and planning notes
            ({handoffPreview.proofPlan.filter(Boolean).length} notes).
          </p>
        </Card>
      ) : null}
    </div>
  );
}
