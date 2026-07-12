"use client";

/**
 * Module 4 Checkpoint 5 — dynamic final review (ephemeral stages).
 * Durable flow stays on Reflection. Does not write plan artifacts itself.
 */

import { useMemo, useState } from "react";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import ArtifactChip from "@/components/ui/ArtifactChip";
import Card from "@/components/ui/Card";
import ProgressDots from "@/components/ui/ProgressDots";
import ModuleFourCompactPlanCard from "@/components/module4/ModuleFourCompactPlanCard";
import ModuleFourParagraphPlanArtifact from "@/components/module4/ModuleFourParagraphPlanArtifact";
import {
  REVIEW_COMPARE_PROMPTS,
  REVIEW_EYEBROW,
  REVIEW_STAGE_COMPARE,
  REVIEW_STAGE_COUNT,
  REVIEW_STAGE_MAP,
  REVIEW_STAGE_PLANS,
  buildFinalReviewPresentation,
  getReviewPrimaryActionLabel,
  getReviewStageMeta,
  getReviewTeacherGuidance,
  resolveReviewInternalAdvance,
  resolveReviewInternalBack,
} from "@/lib/module4/module4FinalReviewHelpers";
import {
  REFLECTION_INSTRUCTION,
  validateReflection,
} from "@/lib/module4/module4ValidityHelpers";
import { MODULE4_SUCCESS_TRANSITION } from "@/lib/module4/module4SuccessHelpers";

function FieldValidityStatus({ result }) {
  if (!result) return null;
  const tone =
    result.state === "ready"
      ? "text-theme-green"
      : result.state === "empty"
        ? "text-text-muted"
        : "text-theme-orange";
  return (
    <div className="mt-2 space-y-1" role="status">
      <p className={`text-xs font-semibold ${tone}`}>{result.message}</p>
      {result.countHelper ? (
        <p className="text-[11px] text-text-muted">{result.countHelper}</p>
      ) : null}
    </div>
  );
}

export default function ModuleFourFinalReviewStep({
  buckets = [],
  wantThirdBucket = null,
  getEvidenceSlots = () => [],
  thesis = "",
  proofPlan = [],
  reflection = "",
  onReflectionChange = null,
  onEditPart = null,
  onFinish = null,
  canFinish = false,
}) {
  const [stage, setStage] = useState(REVIEW_STAGE_MAP);
  const [planIndex, setPlanIndex] = useState(0);

  const presentation = useMemo(
    () =>
      buildFinalReviewPresentation({
        buckets,
        wantThirdBucket,
        getEvidenceSlots,
        thesis,
        proofPlan,
      }),
    [buckets, wantThirdBucket, getEvidenceSlots, thesis, proofPlan]
  );

  const planCount = presentation.planCount || 1;
  const stageMeta = getReviewStageMeta(stage);
  const guidance = getReviewTeacherGuidance({ stage, planIndex, planCount });
  const primaryLabel = getReviewPrimaryActionLabel({
    stage,
    planIndex,
    planCount,
  });
  const reflectionResult = validateReflection(reflection);
  const activePlan = presentation.planArtifacts[planIndex] || null;
  const reviewedCards = presentation.compactCards.slice(0, planIndex);

  const handlePrimary = () => {
    if (stage === REVIEW_STAGE_COMPARE) {
      if (!canFinish || typeof onFinish !== "function") return;
      onFinish();
      return;
    }
    const next = resolveReviewInternalAdvance({ stage, planIndex, planCount });
    setStage(next.stage);
    setPlanIndex(next.planIndex);
  };

  const handleBack = () => {
    const prev = resolveReviewInternalBack({ stage, planIndex });
    setStage(prev.stage);
    setPlanIndex(prev.planIndex);
  };

  let workspace = null;

  if (stage === REVIEW_STAGE_MAP) {
    workspace = (
      <div className="space-y-4">
        <Card
          padding="sm"
          elevation="soft"
          className="border-2 border-theme-orange/35 bg-theme-orange/[0.06]"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ArtifactChip artifactType="thesis" label="Thesis" />
          </div>
          <p className="text-base leading-relaxed text-text-primary whitespace-pre-wrap break-words">
            {presentation.thesis ||
              "Your thesis will appear here when it is saved."}
          </p>
        </Card>

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
          Thesis → paragraph jobs and points
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {presentation.compactCards.map((card) => (
            <ModuleFourCompactPlanCard
              key={`map-${card.paragraphNumber}`}
              card={card}
            />
          ))}
        </div>
      </div>
    );
  } else if (stage === REVIEW_STAGE_PLANS) {
    workspace = (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-theme-blue">
          {guidance.planProgressLabel ||
            `Paragraph ${planIndex + 1} of ${planCount}`}
        </p>

        {reviewedCards.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-green">
              Already reviewed
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {reviewedCards.map((card) => (
                <ModuleFourCompactPlanCard
                  key={`reviewed-${card.paragraphNumber}`}
                  card={card}
                  reviewed
                />
              ))}
            </div>
          </div>
        ) : null}

        {activePlan ? (
          <ModuleFourParagraphPlanArtifact
            artifact={activePlan}
            showEditActions
            compactEvidence
            onEditPart={onEditPart}
            className="border-2 border-theme-blue/30 shadow-soft"
          />
        ) : null}
      </div>
    );
  } else {
    workspace = (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {presentation.compactCards.map((card) => (
            <ModuleFourCompactPlanCard
              key={`compare-${card.paragraphNumber}`}
              card={card}
              reviewed={card.ready}
            />
          ))}
        </div>

        <Card padding="sm" elevation="soft" surface="soft" className="bg-white/90">
          <div className="mb-2 flex items-center gap-2">
            <ArtifactChip artifactType="thesis" label="Thesis" />
          </div>
          <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
            {presentation.thesis || "—"}
          </p>
        </Card>

        <ul className="space-y-2 rounded-xl border border-theme-orange/25 bg-theme-orange/[0.05] px-4 py-3">
          {REVIEW_COMPARE_PROMPTS.map((prompt) => (
            <li
              key={prompt}
              className="text-sm leading-relaxed text-text-primary list-disc ml-4"
            >
              {prompt}
            </li>
          ))}
        </ul>

        <p className="text-sm font-semibold text-text-primary leading-relaxed">
          {MODULE4_SUCCESS_TRANSITION}
        </p>

        <div>
          <label className="block text-sm font-bold text-theme-dark mb-1">
            Your reflection
          </label>
          <p className="text-sm text-theme-dark/80 mb-2">{REFLECTION_INSTRUCTION}</p>
          <textarea
            value={reflection}
            onChange={(e) => onReflectionChange?.(e.target.value)}
            className="w-full rounded-lg border border-theme-dark/20 bg-white px-3 py-2 text-base text-theme-dark min-h-[140px]"
            placeholder="Name a strength, a connection across paragraphs, or what you may adjust in Module 5."
          />
          <FieldValidityStatus result={reflectionResult} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.34fr)] xl:gap-8">
      <WorkspaceCenter>
        <div className="space-y-5 text-left">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              {REVIEW_EYEBROW}
            </p>
            <ProgressDots
              total={REVIEW_STAGE_COUNT}
              activeStep={stage}
              label={`Final review · stage ${stage} of ${REVIEW_STAGE_COUNT}`}
            />
            <header className="space-y-2 rounded-xl border border-theme-blue/20 bg-theme-blue/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-blue">
                {stageMeta.label}
              </p>
              <h1 className="max-w-3xl text-xl font-extrabold leading-tight text-text-primary sm:text-2xl break-words">
                {stageMeta.question}
              </h1>
            </header>
          </div>

          {workspace}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-theme-blue/15 bg-theme-blue/[0.03] px-4 py-3">
            <div>
              {stage !== REVIEW_STAGE_MAP ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg bg-surface-soft px-4 py-2 text-sm text-text-primary hover:bg-border-soft/60"
                >
                  Back
                </button>
              ) : (
                <span className="text-xs text-text-muted">
                  Review before outlining
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handlePrimary}
              disabled={stage === REVIEW_STAGE_COMPARE && !canFinish}
              className="w-full sm:w-auto rounded-lg bg-theme-blue px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </WorkspaceCenter>

      <WorkspaceGuide className="opacity-90">
        <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-4 py-5 text-left xl:sticky xl:top-6">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              From your teacher
            </p>
            <p className="text-sm leading-relaxed text-text-primary">
              {guidance.coaching}
            </p>
          </div>
          <div className="space-y-2 border-t border-border-soft/60 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              Where this is going
            </p>
            <p className="text-sm leading-relaxed text-text-muted">
              {guidance.nextStep}
            </p>
          </div>
        </aside>
      </WorkspaceGuide>
    </div>
  );
}
