"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import ModuleThreeEvidenceCard from "@/components/module3/ModuleThreeEvidenceCard";
import ModuleThreePromptCompass from "@/components/module3/ModuleThreePromptCompass";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import {
  BOTH_WORKS_REQUIREMENT_LABEL,
  EVALUATE_AUDIENCE_PURPOSE_PROMPT,
  EVALUATE_COMPARISON_FOLLOW_UP,
  EVALUATE_COMPARISON_HEADING,
  EVALUATE_COMPARISON_OPTIONS,
  EVALUATE_COMPARISON_QUESTION,
  EVALUATE_READY_MESSAGE,
  EVALUATE_REFLECTION_OPTIONS,
  buildEvaluateChecklist,
  buildEvaluateSourceProofCards,
  canContinueFromEvaluate,
  getBothWorksEvidenceStatus,
  getEvaluateContinueHint,
  getEvaluateNextAction,
  getEvaluateNextActionsForContext,
  getEvaluatePathChoicesForContext,
  getEvaluateReadyMessage,
  mapEvaluateNextActionToState,
} from "@/lib/module3/evaluateStrengthHelpers";
import {
  EVALUATE_COMPASS_FOCUS_ID,
  EVALUATE_COMPASS_FRAMING_LINE,
} from "@/lib/module3/promptCompassHelpers";
import { getAppealChipLabel } from "@/lib/module3/reviewEvidenceHelpers";
import { getQuotationSituationFooter } from "@/lib/shared/rhetoricalSituationHelpers";

const QUIET_TEXTAREA_CLASS =
  "min-h-[80px] w-full rounded-lg border border-border-soft/80 bg-white p-3 text-sm leading-relaxed text-text-primary focus:border-theme-blue/30 focus:outline-none focus:ring-2 focus:ring-theme-blue/10";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sourceAccentClass(sourceType) {
  if (sourceType === "letter") return "border-l-[3px] border-l-theme-orange";
  return "border-l-[3px] border-l-theme-blue";
}

function ChecklistItem({ item }) {
  const isPass = item.status === "pass";
  return (
    <li
      className={`rounded-xl border-2 px-4 py-3 text-left ${
        isPass
          ? "border-theme-green/35 bg-theme-green/10"
          : "border-theme-orange/35 bg-theme-orange/10"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden="true" className="text-sm font-semibold">
          {isPass ? "✓" : "○"}
        </span>
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            isPass
              ? "bg-theme-green/15 text-theme-green"
              : "bg-theme-orange/15 text-theme-orange"
          }`}
        >
          {isPass ? "Requirement met" : "Still needed"}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Objective check
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-text-primary">{item.label}</p>
      <p className="mt-1 text-sm leading-relaxed text-text-muted">{item.detail}</p>
    </li>
  );
}

function ProofConnectionCard({ item, assignmentSources }) {
  if (!item) return null;
  const evidence = item.evidence;
  const sourceDefinition = assignmentSources?.[evidence.sourceType] || null;
  const situationFooter = sourceDefinition
    ? getQuotationSituationFooter(sourceDefinition)
    : null;
  const appealChip = getAppealChipLabel(evidence.tags);

  return (
    <article
      className={`min-w-0 rounded-xl border border-border-soft/80 bg-white px-4 py-4 ${sourceAccentClass(
        evidence.sourceType
      )}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        {evidence.sourceLabel || evidence.sourceType} evidence connection
      </p>
      <div className="mt-3">
        <ModuleThreeEvidenceCard
          evidence={evidence}
          grouping
          showArtifactLabel={false}
          appealChip={appealChip}
          situationFooter={situationFooter}
        />
      </div>
      <div className="mt-3 space-y-1 border-t border-border-soft/60 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-theme-blue">
          {item.relationLabel}
        </p>
        <p className="text-sm leading-relaxed text-text-primary">
          <span className="font-medium">Your explanation: </span>
          {item.note}
        </p>
      </div>
    </article>
  );
}

export default function ModuleThreeEvaluateStrengthStep({
  selectedCluster = null,
  selectedPattern = null,
  ideaStatement = "",
  selectedClusterEvidence = [],
  evidenceConnections = {},
  evidenceStrength = "",
  gapNote = "",
  pathDecision = "",
  onEvaluateStateChange,
  progressCompleted = [],
  progressNext = "",
  assignmentPrompt = "",
  assignmentSources = null,
}) {
  const [checklistAcknowledged, setChecklistAcknowledged] = useState(false);
  const [reflectionChoice, setReflectionChoice] = useState("");
  const [comparisonChoice, setComparisonChoice] = useState("");
  const [nextActionId, setNextActionId] = useState("");
  const [optionalNote, setOptionalNote] = useState("");

  const bothWorks = useMemo(
    () =>
      getBothWorksEvidenceStatus({
        selectedClusterEvidence,
        evidenceConnections,
      }),
    [evidenceConnections, selectedClusterEvidence]
  );

  const proofCards = useMemo(
    () =>
      buildEvaluateSourceProofCards({
        selectedClusterEvidence,
        evidenceConnections,
      }),
    [evidenceConnections, selectedClusterEvidence]
  );

  const checklist = useMemo(
    () =>
      buildEvaluateChecklist({
        ideaStatement,
        selectedClusterEvidence,
        evidenceConnections,
      }),
    [evidenceConnections, ideaStatement, selectedClusterEvidence]
  );

  const nextActions = useMemo(
    () =>
      getEvaluateNextActionsForContext({
        bothWorksReady: bothWorks.bothWorksReady,
        missingSource: bothWorks.missingSource,
      }),
    [bothWorks.bothWorksReady, bothWorks.missingSource]
  );

  const pathChoices = useMemo(
    () =>
      getEvaluatePathChoicesForContext({
        bothWorksReady: bothWorks.bothWorksReady,
      }),
    [bothWorks.bothWorksReady]
  );

  const action = getEvaluateNextAction(nextActionId);
  const selectedNextAction =
    nextActions.find((item) => item.id === nextActionId) || null;

  const continueHint = getEvaluateContinueHint({
    checklistAcknowledged,
    reflectionChoice,
    comparisonChoice,
    nextActionId,
    evidenceStrength,
    pathDecision,
    gapNote,
    bothWorksReady: bothWorks.bothWorksReady,
    missingSource: bothWorks.missingSource,
  });

  const ready = canContinueFromEvaluate({
    evidenceStrength,
    gapNote,
    pathDecision,
    bothWorksReady: bothWorks.bothWorksReady,
  });

  const patternText = safeText(selectedPattern?.text);
  const groupName = selectedCluster?.name || "Your group";

  function applyMappedState({
    actionId = nextActionId,
    path = pathDecision,
    note = optionalNote,
  } = {}) {
    const actionDef = getEvaluateNextAction(actionId);
    if (!actionDef) {
      onEvaluateStateChange?.({
        evidenceStrength: "",
        pathDecision: "",
        gapNote: "",
      });
      return;
    }

    const patch = mapEvaluateNextActionToState({
      nextActionId: actionId,
      pathDecision: path,
      optionalNote: note,
      bothWorksReady: bothWorks.bothWorksReady,
      missingSource: bothWorks.missingSource,
    });

    onEvaluateStateChange?.({
      evidenceStrength: patch.evidenceStrength,
      pathDecision: patch.pathDecision,
      gapNote: patch.gapNote,
    });
  }

  function handleNextAction(id) {
    const option = nextActions.find((item) => item.id === id);
    if (option && option.available === false) {
      return;
    }
    setNextActionId(id);
    const actionDef = getEvaluateNextAction(id);
    applyMappedState({
      actionId: id,
      path: actionDef?.requiresPathChoice ? "" : actionDef?.pathDecision || "",
      note: optionalNote,
    });
  }

  function handlePathDecision(value) {
    const choice = pathChoices.find((item) => item.id === value);
    if (choice && choice.available === false) {
      return;
    }
    applyMappedState({
      actionId: nextActionId,
      path: value,
      note: optionalNote,
    });
  }

  function handleOptionalNote(value) {
    setOptionalNote(value);
    applyMappedState({
      actionId: nextActionId,
      path: pathDecision,
      note: value,
    });
  }

  const whatComesNext = ready
    ? evidenceStrength === "strong" || pathDecision === "move_forward"
      ? "Next, you’ll turn this supported idea into a claim you can prove."
      : "Next, you’ll look for evidence that fills the gap you identified."
    : "After you finish this check, you will either gather more evidence or build a claim.";

  return (
    <WorkspaceColumns className="gap-6 xl:gap-10">
      <WorkspaceSidebar className="opacity-90">
        <aside className="space-y-4 rounded-xl bg-surface-soft/60 px-4 py-4 text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Where you are
          </p>
          <p className="text-sm leading-relaxed text-text-muted">
            You are checking whether your evidence can support a claim—not grading your idea.
          </p>
          {progressCompleted.length > 0 ? (
            <ul className="space-y-2">
              {progressCompleted.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2 text-sm leading-relaxed text-text-muted"
                >
                  <span aria-hidden="true" className="mt-0.5 text-text-muted/50">
                    ·
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {progressNext ? (
            <div className="border-t border-border-soft/60 pt-3">
              <p className="text-xs text-text-muted">Right now</p>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">{progressNext}</p>
            </div>
          ) : null}
        </aside>
      </WorkspaceSidebar>

      <WorkspaceCenter>
        <div className="space-y-8 md:space-y-10">
          <header className="space-y-3 py-1 text-left md:py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Start here
            </p>
            <h1 className="max-w-3xl text-[1.75rem] font-bold leading-[1.12] tracking-tight text-text-primary md:text-[2.35rem] md:leading-[1.1]">
              Is my support strong enough yet?
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
              Before you build a claim, check whether your explained evidence can honestly
              support the assignment—including evidence from both works.
            </p>
          </header>

          <ModuleThreePromptCompass
            assignmentPrompt={assignmentPrompt}
            focusQuestionId={EVALUATE_COMPASS_FOCUS_ID}
            framingLine={EVALUATE_COMPASS_FRAMING_LINE}
          />

          <section className="space-y-4" aria-labelledby="evaluate-proof-heading">
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary">
                Readiness dashboard
              </p>
              <h2
                id="evaluate-proof-heading"
                className="mt-1.5 text-lg font-semibold text-text-primary md:text-xl"
              >
                Idea → Speech support + Letter support → readiness decision
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Group: <span className="font-medium text-text-primary">{groupName}</span>
              </p>
            </div>

            <div className="rounded-xl border border-theme-blue/25 bg-theme-blue/[0.05] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-blue">
                Chosen observation
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-primary">
                {patternText || "Your chosen observation will appear here."}
              </p>
            </div>

            <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/[0.06] px-4 py-4 md:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
                Developing idea
              </p>
              <p className="mt-2 text-base leading-relaxed text-text-primary">
                {ideaStatement || "Your idea will appear here."}
              </p>
            </div>

            {proofCards.items.length === 0 ? (
              <p
                role="status"
                className="rounded-xl border border-theme-orange/35 bg-theme-orange/10 px-4 py-3 text-sm text-text-primary"
              >
                Go back and connect at least two quotations to your idea first. Short notes
                do not count yet.
              </p>
            ) : (
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                {proofCards.speech ? (
                  <ProofConnectionCard
                    item={proofCards.speech}
                    assignmentSources={assignmentSources}
                  />
                ) : (
                  <div
                    role="status"
                    className="min-w-0 rounded-xl border-2 border-dashed border-theme-orange/40 bg-theme-orange/10 px-4 py-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
                      Speech evidence connection
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-text-primary">
                      Still needed — connect a Speech quotation with a clear explanation.
                    </p>
                  </div>
                )}
                {proofCards.letter ? (
                  <ProofConnectionCard
                    item={proofCards.letter}
                    assignmentSources={assignmentSources}
                  />
                ) : (
                  <div
                    role="status"
                    className="min-w-0 rounded-xl border-2 border-dashed border-theme-orange/40 bg-theme-orange/10 px-4 py-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
                      Letter evidence connection
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-text-primary">
                      Still needed — connect a Letter quotation with a clear explanation.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-border-soft/80 bg-surface-soft/40 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                Readiness decision
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-primary">
                {bothWorks.statusMessage}
              </p>
            </div>
          </section>

          <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
              Your job right now
            </p>
            <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
              Check whether this evidence is ready to support a claim.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text-primary">
              <li>Review your real evidence connections from both works.</li>
              <li>Check the objective requirements.</li>
              <li>Reflect on your explanations and the comparison.</li>
              <li>Choose what your evidence needs next.</li>
            </ol>
          </div>

          <section className="space-y-4" aria-labelledby="evaluate-checklist-heading">
            <div className="text-left">
              <h2
                id="evaluate-checklist-heading"
                className="text-lg font-semibold text-text-primary md:text-xl"
              >
                Evidence checklist.
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">
                These are requirements the page can check. Comparison quality remains your
                judgment—not a machine grade.
              </p>
            </div>
            <ul className="space-y-3">
              {checklist.map((item) => (
                <ChecklistItem key={item.id} item={item} />
              ))}
            </ul>
            <p className="rounded-lg bg-surface-soft/60 px-3 py-2 text-sm leading-relaxed text-text-muted">
              {BOTH_WORKS_REQUIREMENT_LABEL} Count explained connections—not just quotations
              sitting in your group.
            </p>
            {!checklistAcknowledged ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setChecklistAcknowledged(true)}
                >
                  I’ve reviewed the checklist
                </Button>
                <p className="text-sm text-text-muted">
                  Review the evidence checklist first. That unlocks the reflection questions.
                </p>
              </div>
            ) : (
              <p
                role="status"
                className="rounded-lg border border-theme-green/30 bg-theme-green/10 px-3 py-2 text-sm text-text-primary"
              >
                Checklist reviewed. Continue with the explanation question below.
              </p>
            )}
          </section>

          {checklistAcknowledged ? (
            <section className="space-y-4" aria-labelledby="evaluate-reflection-heading">
              <div className="text-left">
                <h2
                  id="evaluate-reflection-heading"
                  className="text-lg font-semibold text-text-primary md:text-xl"
                >
                  Guided reflection.
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  Do my explanations point to specific words or details in the quotations?
                </p>
              </div>
              <div className="grid gap-2">
                {EVALUATE_REFLECTION_OPTIONS.map((option) => {
                  const selected = reflectionChoice === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-left ${
                        selected
                          ? "border-theme-blue/40 bg-theme-blue/[0.07]"
                          : "border-border-soft/80 bg-surface-soft/40 hover:border-theme-blue/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="evaluate-reflection"
                        className="mt-1 accent-theme-blue"
                        checked={selected}
                        onChange={() => setReflectionChoice(option.id)}
                      />
                      <span className="text-sm leading-relaxed text-text-primary">
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
              {!reflectionChoice ? (
                <p
                  role="status"
                  className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm text-text-primary"
                >
                  Answer the explanation question before choosing your next step.
                </p>
              ) : null}
            </section>
          ) : null}

          {checklistAcknowledged && reflectionChoice ? (
            <section className="space-y-4" aria-labelledby="evaluate-comparison-heading">
              <div className="text-left">
                <h2
                  id="evaluate-comparison-heading"
                  className="text-lg font-semibold text-text-primary md:text-xl"
                >
                  {EVALUATE_COMPARISON_HEADING}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  {EVALUATE_COMPARISON_QUESTION}
                </p>
              </div>
              <div className="grid gap-2">
                {EVALUATE_COMPARISON_OPTIONS.map((option) => {
                  const selected = comparisonChoice === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-left ${
                        selected
                          ? "border-theme-blue/40 bg-theme-blue/[0.07]"
                          : "border-border-soft/80 bg-surface-soft/40 hover:border-theme-blue/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="evaluate-comparison"
                        className="mt-1 accent-theme-blue"
                        checked={selected}
                        onChange={() => setComparisonChoice(option.id)}
                      />
                      <span className="text-sm leading-relaxed text-text-primary">
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
              {comparisonChoice ? (
                <div className="space-y-2 rounded-xl border border-theme-blue/20 bg-theme-blue/[0.05] px-4 py-3">
                  <p className="text-sm leading-relaxed text-text-primary">
                    {EVALUATE_COMPARISON_FOLLOW_UP}
                  </p>
                  <p className="text-sm leading-relaxed text-text-muted">
                    {EVALUATE_AUDIENCE_PURPOSE_PROMPT}
                  </p>
                </div>
              ) : (
                <p
                  role="status"
                  className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm text-text-primary"
                >
                  Look across the speech and letter before choosing your next step.
                </p>
              )}
            </section>
          ) : null}

          {checklistAcknowledged && reflectionChoice && comparisonChoice ? (
            <section className="space-y-4" aria-labelledby="evaluate-next-heading">
              <div className="text-left">
                <h2
                  id="evaluate-next-heading"
                  className="text-lg font-semibold text-text-primary md:text-xl"
                >
                  What does your evidence need next?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  Choose one clear next step. You are deciding what to do—not giving yourself a
                  grade.
                </p>
              </div>

              {!bothWorks.bothWorksReady && bothWorks.repairActionLabel ? (
                <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
                    Dominant repair action
                  </p>
                  <p className="mt-2 text-base font-semibold text-text-primary">
                    {bothWorks.repairActionLabel}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{bothWorks.statusMessage}</p>
                  <Button
                    type="button"
                    className="mt-3"
                    onClick={() => handleNextAction("need_another_quotation")}
                  >
                    {bothWorks.repairActionLabel}
                  </Button>
                </div>
              ) : null}

              <div className="grid gap-2">
                {nextActions.map((option) => {
                  const selected = nextActionId === option.id;
                  const unavailable = option.available === false;
                  return (
                    <div key={option.id} className="space-y-1">
                      <label
                        className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left ${
                          unavailable
                            ? "cursor-not-allowed border-dashed border-border-soft bg-surface-soft/30 opacity-80"
                            : selected
                              ? "cursor-pointer border-theme-blue/40 bg-theme-blue/[0.07]"
                              : "cursor-pointer border-border-soft/80 bg-surface-soft/40 hover:border-theme-blue/20"
                        }`}
                      >
                        <input
                          type="radio"
                          name="evaluate-next-action"
                          className="mt-1 accent-theme-blue"
                          checked={selected}
                          disabled={unavailable}
                          onChange={() => handleNextAction(option.id)}
                        />
                        <span className="text-sm leading-relaxed text-text-primary">
                          {option.label}
                          {unavailable ? (
                            <span className="mt-1 block text-xs font-medium uppercase tracking-wide text-text-muted">
                              Locked
                            </span>
                          ) : null}
                        </span>
                      </label>
                      {unavailable && option.blockedMessage ? (
                        <p
                          role="status"
                          className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm text-text-primary"
                        >
                          {option.blockedMessage}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {selectedNextAction?.id === "not_sure" ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-theme-orange/35 bg-theme-orange/10 px-4 py-3 text-sm text-text-primary"
                >
                  {action?.coaching}
                </p>
              ) : null}

              {action?.requiresPathChoice ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-text-primary">
                    How do you want to handle that gap?
                  </p>
                  {pathChoices.map((choice) => {
                    const unavailable = choice.available === false;
                    return (
                      <div key={choice.id} className="space-y-1">
                        <label
                          className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left ${
                            unavailable
                              ? "cursor-not-allowed border-dashed border-border-soft bg-surface-soft/30 opacity-80"
                              : pathDecision === choice.id
                                ? "cursor-pointer border-theme-blue/40 bg-theme-blue/[0.07]"
                                : "cursor-pointer border-border-soft/80 bg-surface-soft/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name="evaluate-path"
                            className="mt-1 accent-theme-blue"
                            checked={pathDecision === choice.id}
                            disabled={unavailable}
                            onChange={() => handlePathDecision(choice.id)}
                          />
                          <span>
                            <span className="block text-sm font-medium text-text-primary">
                              {choice.label}
                            </span>
                            <span className="mt-0.5 block text-sm text-text-muted">
                              {choice.description}
                            </span>
                          </span>
                        </label>
                        {unavailable && choice.blockedMessage ? (
                          <p
                            role="status"
                            className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-sm text-text-primary"
                          >
                            {choice.blockedMessage}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {action?.showOptionalNote ? (
                <label className="block text-left">
                  <span className="mb-2 block text-sm font-medium text-text-primary">
                    Optional: add a short note about the gap you noticed.
                  </span>
                  <textarea
                    value={optionalNote}
                    onChange={(event) => handleOptionalNote(event.target.value)}
                    placeholder="Name one specific thing your evidence still needs"
                    className={QUIET_TEXTAREA_CLASS}
                  />
                </label>
              ) : null}
            </section>
          ) : null}

          {ready ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border-2 border-theme-green/35 bg-theme-green/10 px-4 py-4 text-sm text-text-primary"
            >
              <p className="text-base font-semibold">
                {getEvaluateReadyMessage({
                  bothWorksReady: bothWorks.bothWorksReady,
                })}
              </p>
            </div>
          ) : continueHint ? (
            <p
              role="status"
              aria-live="polite"
              className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-4 py-3 text-sm text-text-primary"
            >
              {continueHint}
            </p>
          ) : null}

          <details className="rounded-xl border border-border-soft/70 bg-surface-soft/30 px-4 py-3 md:px-5">
            <summary className="cursor-pointer list-none text-sm font-medium text-theme-blue">
              Need Help
            </summary>
            <div className="mt-3 space-y-4 border-t border-border-soft/60 pt-3 text-sm leading-relaxed text-text-muted">
              <div>
                <p className="font-medium text-text-primary">
                  Why do I need both the speech and the letter?
                </p>
                <p className="mt-1">{BOTH_WORKS_REQUIREMENT_LABEL}</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  What makes an explanation specific?
                </p>
                <p className="mt-1">
                  It points to a word, phrase, or detail in the quotation and shows how that
                  detail helps the idea—not just a retelling of the quotation.
                </p>
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  Does needing more evidence mean my idea is bad?
                </p>
                <p className="mt-1">
                  No. Needing more evidence means you learned what the idea still needs before
                  you argue it.
                </p>
              </div>
            </div>
          </details>
        </div>
      </WorkspaceCenter>

      <WorkspaceGuide className="opacity-90">
        <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-4 py-5 text-left">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              From your teacher
            </p>
            <p className="text-sm leading-relaxed text-text-primary">
              Honesty here saves you from arguing a point you cannot prove yet. Evidence from
              both works is part of the assignment—not optional polish.
            </p>
          </div>
          <div className="space-y-2 border-t border-border-soft/60 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              What comes next
            </p>
            <p className="text-sm leading-relaxed text-text-muted">{whatComesNext}</p>
            {ready && evidenceStrength === "strong" ? (
              <p className="text-sm leading-relaxed text-text-primary">{EVALUATE_READY_MESSAGE}</p>
            ) : null}
          </div>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
