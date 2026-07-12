"use client";

/**
 * Module 4 Checkpoint 2 — guided handoff with ephemeral internal stages.
 * Presentation-only. Start Paragraph 1 is the only durable flow advance.
 */

import { useMemo, useState } from "react";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import ArtifactChip from "@/components/ui/ArtifactChip";
import Card from "@/components/ui/Card";
import ProgressDots from "@/components/ui/ProgressDots";
import {
  HANDOFF_STAGE_ARGUMENT,
  HANDOFF_STAGE_MODEL,
  HANDOFF_STAGE_READY,
  MODULE4_HANDOFF_CTA_LABEL,
  MODULE4_HANDOFF_EYEBROW,
  PARAGRAPH_PLAN_FUNCTIONS,
  buildHandoffFunctionDemos,
  getHandoffPrimaryActionLabel,
  getHandoffStageMeta,
  getHandoffTeacherGuidance,
  resolveHandoffInternalAdvance,
  resolveHandoffInternalBack,
} from "@/lib/module4/module4HandoffHelpers";

function sourceAccentClass(sourceType) {
  if (sourceType === "letter") {
    return "border-l-[3px] border-l-theme-orange";
  }
  if (sourceType === "speech") {
    return "border-l-[3px] border-l-theme-blue";
  }
  return "border-l-[3px] border-l-theme-dark/20";
}

function JobCard({ title, children }) {
  return (
    <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-4 shadow-soft ring-1 ring-theme-orange/15">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
        Your job right now
      </p>
      <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
        {title}
      </p>
      {children ? <div className="mt-2 text-sm text-text-muted">{children}</div> : null}
    </div>
  );
}

function ArgumentArtifacts({ presentation, compact = false }) {
  const p = presentation || {};
  const proofItems = Array.isArray(p.proofPlanItems) ? p.proofPlanItems : [];
  const foundation = p.evidenceFoundation || {};

  if (compact) {
    return (
      <details className="rounded-xl border border-theme-green/30 bg-theme-green/5 px-3 py-2">
        <summary className="cursor-pointer text-xs font-bold text-theme-green">
          Your Module 3 argument is ready
        </summary>
        <div className="mt-2 space-y-2 text-xs text-text-primary">
          {p.thesis ? (
            <p>
              <span className="font-semibold">Thesis: </span>
              <span className="whitespace-pre-wrap break-words">{p.thesis}</span>
            </p>
          ) : null}
          {p.patternText ? (
            <p>
              <span className="font-semibold">Pattern: </span>
              {p.patternText}
            </p>
          ) : null}
          <p className="text-text-muted">{foundation.summary}</p>
        </div>
      </details>
    );
  }

  return (
    <div className="space-y-3">
      <Card
        padding="sm"
        elevation="soft"
        surface="soft"
        className="border-2 border-theme-orange/35 bg-theme-orange/[0.06]"
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ArtifactChip artifactType="thesis" label="Thesis" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-theme-green">
            Saved
          </span>
        </div>
        <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
          {p.thesis || "Your thesis from Module 3 will appear here when it is saved."}
        </p>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ArtifactChip artifactType="proof_plan" label="Proof plan" />
        </div>
        {proofItems.length === 0 ? (
          <p className="text-xs text-text-muted">
            Proof-plan notes appear here when saved.
          </p>
        ) : (
          <ol className="space-y-2">
            {proofItems.map((item) => (
              <li key={`${item.slotIndex}-${item.label}`}>
                <Card padding="sm" elevation="soft" surface="soft" className="bg-white/80">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-orange">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm text-text-primary whitespace-pre-wrap break-words">
                    {item.text}
                  </p>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </div>

      {p.patternText ? (
        <div className="inline-flex max-w-full min-w-0 items-start gap-2 rounded-full border border-theme-orange/30 bg-theme-orange/10 px-3 py-1.5">
          <ArtifactChip artifactType="pattern" label="Pattern" />
          <span className="min-w-0 text-xs leading-snug text-text-primary whitespace-pre-wrap break-words">
            {p.patternText}
          </span>
        </div>
      ) : null}

      <Card
        padding="sm"
        elevation="soft"
        surface="soft"
        className="border border-theme-green/30 bg-theme-green/5"
      >
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <ArtifactChip artifactType="evidence" label="Evidence foundation" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-theme-green">
            Ready
          </span>
        </div>
        <p className="text-sm text-text-primary">{foundation.summary}</p>
        {foundation.bothWorks ? (
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="rounded-md border border-theme-blue/25 bg-theme-blue/5 px-2 py-0.5 text-theme-blue">
              Speech confirmed
            </span>
            <span className="rounded-md border border-theme-orange/25 bg-theme-orange/5 px-2 py-0.5 text-theme-orange">
              Letter confirmed
            </span>
          </div>
        ) : null}
        <p className="mt-1 text-xs text-text-muted">{foundation.note}</p>
      </Card>
    </div>
  );
}

function FunctionDemoCard({ demo }) {
  if (!demo) return null;
  return (
    <div
      className={[
        "mt-3 rounded-lg border border-border-soft/80 bg-white/90 px-3 py-3",
        sourceAccentClass(demo.sourceType),
      ].join(" ")}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
        {demo.artifactLabel}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
        {demo.kind === "quotation" ? (
          <span className="italic">&ldquo;{demo.body}&rdquo;</span>
        ) : (
          demo.body
        )}
      </p>
      <p className="mt-2 text-[10px] font-medium text-text-muted">
        Saved student work · example of this function — not finished paragraph prose
      </p>
    </div>
  );
}

function FivePartProgress({ activeIndex, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Paragraph plan functions">
      {PARAGRAPH_PLAN_FUNCTIONS.map((fn, index) => {
        const isActive = index === activeIndex;
        const done = index < activeIndex;
        return (
          <button
            key={fn.id}
            type="button"
            role="listitem"
            onClick={() => onSelect?.(index)}
            className={[
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              isActive
                ? "border-theme-blue bg-theme-blue text-white"
                : done
                  ? "border-theme-green/40 bg-theme-green/10 text-theme-green"
                  : "border-border-soft bg-white/70 text-text-muted",
            ].join(" ")}
            aria-current={isActive ? "step" : undefined}
          >
            {index + 1}. {isActive || done ? fn.title : "·"}
          </button>
        );
      })}
    </div>
  );
}

export default function ModuleFourHandoffStep({
  presentation,
  onStartParagraph1,
}) {
  const p = presentation || {};
  const [stage, setStage] = useState(HANDOFF_STAGE_ARGUMENT);
  const [functionIndex, setFunctionIndex] = useState(0);
  const [showCompleteModel, setShowCompleteModel] = useState(false);

  const stageMeta = getHandoffStageMeta(stage);
  const guidance = useMemo(
    () =>
      getHandoffTeacherGuidance({
        stage,
        functionIndex,
        showCompleteModel,
      }),
    [stage, functionIndex, showCompleteModel]
  );

  const functionDemos = useMemo(() => {
    if (Array.isArray(p.functionDemos) && p.functionDemos.length) {
      return p.functionDemos;
    }
    return buildHandoffFunctionDemos(p);
  }, [p]);

  const activeDemo = functionDemos[functionIndex] || null;
  const primaryLabel = getHandoffPrimaryActionLabel({
    stage,
    showCompleteModel,
    functionIndex,
  });

  const applyInternal = (next) => {
    if (!next) return;
    if (next.advancesDurableFlow) {
      onStartParagraph1?.();
      return;
    }
    setStage(next.stage);
    setFunctionIndex(next.functionIndex);
    setShowCompleteModel(next.showCompleteModel);
  };

  const handlePrimary = () => {
    applyInternal(
      resolveHandoffInternalAdvance({
        stage,
        functionIndex,
        showCompleteModel,
      })
    );
  };

  const handleBack = () => {
    const next = resolveHandoffInternalBack({
      stage,
      functionIndex,
      showCompleteModel,
    });
    if (!next) return;
    setStage(next.stage);
    setFunctionIndex(next.functionIndex);
    setShowCompleteModel(next.showCompleteModel);
  };

  let workspace = null;

  if (stage === HANDOFF_STAGE_ARGUMENT) {
    workspace = (
      <div className="space-y-4">
        <JobCard title="Bring your Module 3 argument into Module 4.">
          Check that your thesis, proof plan, pattern, and evidence foundation are here.
        </JobCard>
        <p className="text-sm leading-relaxed text-text-muted">
          {p.accomplishment ||
            "In Module 3 you developed an idea, connected evidence, built a claim, and wrote a thesis."}
        </p>
        <ArgumentArtifacts presentation={p} />
      </div>
    );
  } else if (stage === HANDOFF_STAGE_MODEL) {
    workspace = (
      <div className="space-y-4">
        <ArgumentArtifacts presentation={p} compact />
        <JobCard
          title={
            showCompleteModel
              ? "See the full paragraph-plan sequence."
              : `Learn this job: ${activeDemo?.title || "Main idea"}`
          }
        >
          {showCompleteModel
            ? "These five functions stay in order when you plan a paragraph."
            : activeDemo?.description}
        </JobCard>

        {!showCompleteModel ? (
          <>
            <FivePartProgress
              activeIndex={functionIndex}
              onSelect={(index) => {
                if (index <= functionIndex) setFunctionIndex(index);
              }}
            />
            <Card
              padding="sm"
              elevation="soft"
              className="border-2 border-theme-blue/30 bg-theme-blue/[0.04]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-blue">
                Function {functionIndex + 1} of {PARAGRAPH_PLAN_FUNCTIONS.length}
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-text-primary">
                {activeDemo?.title}
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                {activeDemo?.description}
              </p>
              <FunctionDemoCard demo={activeDemo?.demo} />
            </Card>
          </>
        ) : (
          <Card padding="sm" elevation="soft" surface="soft" className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-theme-green">
              Complete five-part sequence
            </p>
            <p className="text-xs text-text-muted">{p.planVersusProse}</p>
            <ol className="space-y-1.5">
              {PARAGRAPH_PLAN_FUNCTIONS.map((fn, index) => (
                <li
                  key={fn.id}
                  className="flex gap-2 rounded-lg border border-border-soft/70 bg-white/80 px-2.5 py-1.5 text-sm"
                >
                  <span className="font-extrabold text-theme-blue">{index + 1}.</span>
                  <span>
                    <span className="font-bold">{fn.title}</span>
                    <span className="text-text-muted"> — {fn.description}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>
    );
  } else {
    workspace = (
      <div className="space-y-4">
        <JobCard title="Get ready to plan Paragraph 1.">
          You know the argument you are carrying and the jobs inside a paragraph plan.
        </JobCard>
        <ArgumentArtifacts presentation={p} compact />
        <Card padding="sm" elevation="soft" surface="soft" className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-theme-blue">
            What you will build
          </p>
          <ul className="space-y-1.5 text-sm text-text-primary">
            {(p.stage3Expectations || []).map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-theme-green font-bold">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card padding="sm" elevation="soft" className="border border-theme-green/25 bg-theme-green/5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-theme-green">
            Five-part model · ready
          </p>
          <ol className="mt-2 flex flex-wrap gap-1.5">
            {PARAGRAPH_PLAN_FUNCTIONS.map((fn, index) => (
              <li
                key={fn.id}
                className="rounded-full border border-theme-green/30 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-text-primary"
              >
                {index + 1}. {fn.title}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.34fr)] xl:gap-8">
      <WorkspaceCenter>
        <div className="space-y-5 text-left">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              {MODULE4_HANDOFF_EYEBROW}
            </p>
            <ProgressDots
              total={3}
              activeStep={stage}
              label={`Module 4 handoff · stage ${stage} of 3`}
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
              {stage !== HANDOFF_STAGE_ARGUMENT ||
              functionIndex > 0 ||
              showCompleteModel ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={
                    stage === HANDOFF_STAGE_ARGUMENT &&
                    functionIndex === 0 &&
                    !showCompleteModel
                  }
                  className="rounded-lg bg-surface-soft px-4 py-2 text-sm text-text-primary hover:bg-border-soft/60 disabled:opacity-40"
                >
                  Back
                </button>
              ) : (
                <span className="text-xs text-text-muted">Module 4 guided start</span>
              )}
            </div>
            <button
              type="button"
              onClick={handlePrimary}
              className="rounded-lg bg-theme-blue px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
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
          {stage === HANDOFF_STAGE_READY ? (
            <p className="rounded-lg border border-theme-blue/20 bg-theme-blue/5 px-3 py-2 text-xs font-semibold text-theme-blue">
              Next durable step: {MODULE4_HANDOFF_CTA_LABEL}
            </p>
          ) : null}
        </aside>
      </WorkspaceGuide>
    </div>
  );
}
