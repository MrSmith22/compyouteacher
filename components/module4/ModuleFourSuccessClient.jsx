"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import ArtifactChip from "@/components/ui/ArtifactChip";
import Card from "@/components/ui/Card";
import ProgressDots from "@/components/ui/ProgressDots";
import ModuleFourCompactPlanCard from "@/components/module4/ModuleFourCompactPlanCard";
import ModuleFourParagraphPlanArtifact from "@/components/module4/ModuleFourParagraphPlanArtifact";
import {
  MODULE_FOUR_SUCCESS_COMPLETED_MODULE,
  MODULE4_SUCCESS_PRIMARY_CTA_LABEL,
  MODULE4_SUCCESS_SECONDARY_REVIEW_LABEL,
} from "@/lib/module4/module4SuccessHelpers";
import {
  SUCCESS_EYEBROW,
  SUCCESS_STAGE_CELEBRATE,
  SUCCESS_STAGE_COUNT,
  SUCCESS_STAGE_EXPLORE,
  SUCCESS_STAGE_HANDOFF,
  SUCCESS_TRANSFORM_STEPS,
  getSuccessStageMeta,
  getSuccessTeacherGuidance,
  resolveSuccessInternalAdvance,
  resolveSuccessInternalBack,
} from "@/lib/module4/module4SuccessStageHelpers";

function sourceAccentClass(sourceType) {
  if (sourceType === "letter") {
    return "border-l-[3px] border-l-theme-orange";
  }
  return "border-l-[3px] border-l-theme-blue";
}

/** Build compact cards from success summary plans (presentation only). */
function compactCardsFromSummary(summary) {
  const plans = Array.isArray(summary?.paragraphPlans)
    ? summary.paragraphPlans
    : [];
  return plans.map((artifact) => ({
    paragraphIndex: artifact.paragraphIndex,
    paragraphNumber: artifact.paragraphNumber,
    jobLabel: artifact.job?.label || "Job not set yet",
    point: artifact.point?.text || "",
    evidenceCount: artifact.evidence?.count || 0,
    ready: Boolean(artifact.ready),
    speechCount: (artifact.evidence?.items || []).filter(
      (item) => item.sourceType === "speech"
    ).length,
    letterCount: (artifact.evidence?.items || []).filter(
      (item) => item.sourceType === "letter"
    ).length,
  }));
}

export default function ModuleFourSuccessClient({ summary }) {
  const { data: session } = useSession();
  const headingRef = useRef(null);
  const [stage, setStage] = useState(SUCCESS_STAGE_CELEBRATE);
  const [planIndex, setPlanIndex] = useState(0);

  useEffect(() => {
    if (!session?.user?.email) return;
    if (summary?.incomplete) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: MODULE_FOUR_SUCCESS_COMPLETED_MODULE,
    }).catch(() => {});
  }, [session?.user?.email, summary?.incomplete]);

  useEffect(() => {
    headingRef.current?.focus?.();
  }, [stage]);

  const plans = useMemo(
    () => (Array.isArray(summary?.paragraphPlans) ? summary.paragraphPlans : []),
    [summary?.paragraphPlans]
  );
  const compactCards = useMemo(() => compactCardsFromSummary(summary), [summary]);
  const foundation = summary?.evidenceFoundation;
  const thesis = summary?.thesis;
  const stageMeta = getSuccessStageMeta(stage);
  const guidance = getSuccessTeacherGuidance({
    stage,
    planIndex,
    planArtifacts: plans,
  });
  const activePlan = plans[planIndex] || null;

  if (summary?.incomplete) {
    return (
      <div className="min-h-screen bg-theme-light px-4 py-10 text-theme-dark">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <header className="space-y-3 text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Module 4
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-3xl font-extrabold leading-tight text-theme-dark outline-none md:text-4xl"
            >
              Finish your paragraph plans
            </h1>
            <p
              role="status"
              className="rounded-lg border border-theme-orange/35 bg-theme-orange/5 px-4 py-3 text-sm leading-relaxed text-theme-dark"
            >
              {summary.incompleteMessage}
            </p>
          </header>
          <Link
            href={summary.secondaryReviewHref || "/modules/4"}
            className="inline-flex w-full items-center justify-center rounded-xl bg-theme-blue px-6 py-3 text-center text-base font-semibold text-white shadow-soft transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-theme-blue/25 sm:w-auto"
          >
            {summary.secondaryReviewLabel || MODULE4_SUCCESS_SECONDARY_REVIEW_LABEL}
          </Link>
        </div>
      </div>
    );
  }

  const handlePrimary = () => {
    const next = resolveSuccessInternalAdvance({ stage });
    if (next.exit) return;
    setStage(next.stage);
    if (next.stage === SUCCESS_STAGE_EXPLORE) setPlanIndex(0);
  };

  const handleBack = () => {
    const prev = resolveSuccessInternalBack({ stage });
    setStage(prev.stage);
  };

  let workspace = null;

  if (stage === SUCCESS_STAGE_CELEBRATE) {
    workspace = (
      <div
        className="space-y-5"
        data-testid="module-role-transition"
        data-from-module="4"
        data-to-module="5"
        data-presentation="reuse"
        aria-label="Module role transition"
      >
        <p className="text-base leading-relaxed text-theme-dark md:text-lg">
          {summary?.accomplishment}
        </p>

        <Card
          padding="sm"
          elevation="soft"
          className="border-2 border-theme-orange/35 bg-theme-orange/[0.06]"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ArtifactChip artifactType="thesis" label="Your thesis" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-theme-green">
              Saved
            </span>
          </div>
          {thesis?.available ? (
            <p className="text-base font-medium leading-relaxed text-text-primary whitespace-pre-wrap break-words">
              {thesis.text}
            </p>
          ) : (
            <p className="text-sm text-text-muted">{thesis?.fallback || thesis?.text}</p>
          )}
        </Card>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-theme-green">
            Your paragraph plans · complete
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {compactCards.map((card) => (
              <ModuleFourCompactPlanCard
                key={`celebrate-${card.paragraphNumber}`}
                card={card}
                reviewed
              />
            ))}
          </div>
        </div>
      </div>
    );
  } else if (stage === SUCCESS_STAGE_EXPLORE) {
    workspace = (
      <div className="space-y-5">
        <details className="rounded-xl border border-border-soft bg-white/80 px-3 py-2">
          <summary className="cursor-pointer text-xs font-bold text-text-muted">
            Thesis reference
          </summary>
          <p className="mt-2 text-sm whitespace-pre-wrap break-words text-text-primary">
            {thesis?.text}
          </p>
        </details>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Paragraph plans">
          {plans.map((plan, index) => (
            <button
              key={`tab-${plan.paragraphNumber}`}
              type="button"
              role="tab"
              aria-selected={index === planIndex}
              aria-label={`Body Paragraph ${plan.paragraphNumber} plan`}
              onClick={() => setPlanIndex(index)}
              className={[
                "min-h-[44px] rounded-lg border px-3 py-2 text-sm font-semibold transition w-full sm:w-auto",
                index === planIndex
                  ? "border-theme-blue bg-theme-blue text-white"
                  : "border-border-soft bg-white text-text-primary hover:bg-theme-blue/5",
              ].join(" ")}
            >
              Body Paragraph {plan.paragraphNumber}
            </button>
          ))}
        </div>

        {activePlan ? (
          <ModuleFourParagraphPlanArtifact
            artifact={activePlan}
            compactEvidence
            showThesisConnection={false}
            className="border-2 border-theme-blue/25 max-w-3xl"
          />
        ) : null}

        <Card padding="sm" elevation="soft" surface="soft" className="space-y-3">
          <h3 className="text-sm font-bold text-text-primary">
            Your evidence foundation
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            <li className="rounded-lg border border-border-soft bg-white px-3 py-2 text-sm">
              Completed plans:{" "}
              <strong>{foundation?.completedPlanCount ?? 0}</strong>
            </li>
            <li className="rounded-lg border border-border-soft bg-white px-3 py-2 text-sm">
              Qualifying evidence:{" "}
              <strong>{foundation?.totalQualifyingEvidence ?? 0}</strong>
            </li>
            {(foundation?.speechCount || 0) > 0 ? (
              <li
                className={`rounded-lg border border-theme-blue/25 bg-theme-blue/[0.05] px-3 py-2 text-sm ${sourceAccentClass(
                  "speech"
                )}`}
              >
                Speech: <strong>{foundation.speechCount}</strong>
              </li>
            ) : null}
            {(foundation?.letterCount || 0) > 0 ? (
              <li
                className={`rounded-lg border border-theme-orange/25 bg-theme-orange/[0.05] px-3 py-2 text-sm ${sourceAccentClass(
                  "letter"
                )}`}
              >
                Letter: <strong>{foundation.letterCount}</strong>
              </li>
            ) : null}
          </ul>
          <p className="text-sm text-text-muted">{foundation?.bothWorksMessage}</p>
        </Card>
      </div>
    );
  } else {
    workspace = (
      <div className="space-y-5">
        <Card
          padding="md"
          elevation="soft"
          className="border-2 border-theme-blue/25 bg-theme-blue/[0.04]"
        >
          <p className="text-center text-sm font-semibold text-theme-blue sm:text-base">
            Saved thesis + paragraph plans → Module 5 outline
          </p>
        </Card>

        <ul className="space-y-2">
          {Array.isArray(SUCCESS_TRANSFORM_STEPS) &&
            SUCCESS_TRANSFORM_STEPS.map((line) => (
            <li
              key={line}
              className="flex gap-2 rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-text-primary"
            >
              <span className="font-bold text-theme-green" aria-hidden="true">
                →
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <p className="text-sm leading-relaxed text-text-muted md:text-base">
          {summary?.module5Handoff}
        </p>

        <div className="flex flex-col gap-3 sm:items-start">
          <Link
            href={summary?.primaryCtaHref || "/modules/5"}
            className="inline-flex w-full items-center justify-center rounded-xl bg-theme-blue px-6 py-3 text-center text-base font-semibold text-white shadow-soft transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-theme-blue/25 sm:w-auto"
          >
            {summary?.primaryCtaLabel || MODULE4_SUCCESS_PRIMARY_CTA_LABEL}
          </Link>
          <Link
            href={summary?.secondaryReviewHref || "/modules/4"}
            className="text-sm font-medium text-theme-blue underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-theme-blue/30"
          >
            {summary?.secondaryReviewLabel || MODULE4_SUCCESS_SECONDARY_REVIEW_LABEL}
          </Link>
        </div>
      </div>
    );
  }

  const primaryLabel =
    stage === SUCCESS_STAGE_HANDOFF
      ? null
      : stageMeta.primaryActionLabel;

  return (
    <div className="min-h-screen bg-theme-light px-4 py-8 text-theme-dark sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.34fr)] xl:gap-8">
          <WorkspaceCenter>
            <div className="space-y-5 text-left">
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                  {SUCCESS_EYEBROW}
                </p>
                <ProgressDots
                  total={SUCCESS_STAGE_COUNT}
                  activeStep={stage}
                  label={`Success · ${stage} of ${SUCCESS_STAGE_COUNT}`}
                />
                <header className="space-y-2 rounded-xl border border-theme-green/25 bg-theme-green/[0.05] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-green">
                    {stageMeta.label}
                  </p>
                  <h1
                    ref={headingRef}
                    tabIndex={-1}
                    className="max-w-3xl text-2xl font-extrabold leading-tight text-theme-green outline-none sm:text-3xl break-words"
                  >
                    {stage === SUCCESS_STAGE_CELEBRATE
                      ? stageMeta.heading
                      : stageMeta.question}
                  </h1>
                </header>
              </div>

              {workspace}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-theme-blue/15 bg-theme-blue/[0.03] px-4 py-3">
                <div>
                  {stage !== SUCCESS_STAGE_CELEBRATE ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="rounded-lg bg-surface-soft px-4 py-2 text-sm text-text-primary hover:bg-border-soft/60"
                    >
                      Back
                    </button>
                  ) : (
                    <span className="text-xs text-text-muted">
                      Module 4 complete
                    </span>
                  )}
                </div>
                {primaryLabel ? (
                  <button
                    type="button"
                    onClick={handlePrimary}
                    className="w-full sm:w-auto rounded-lg bg-theme-blue px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
                  >
                    {primaryLabel}
                  </button>
                ) : null}
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
      </div>
    </div>
  );
}
