"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import ModuleThreeEvidenceCard from "@/components/module3/ModuleThreeEvidenceCard";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import {
  EVALUATE_NEXT_ACTIONS,
  EVALUATE_PATH_CHOICES,
  EVALUATE_REFLECTION_OPTIONS,
  buildEvaluateChecklist,
  buildEvaluateProofItems,
  canContinueFromEvaluate,
  getEvaluateContinueHint,
  getEvaluateNextAction,
  getEvaluateReadyMessage,
  mapEvaluateNextActionToState,
} from "@/lib/module3/evaluateStrengthHelpers";

const QUIET_TEXTAREA_CLASS =
  "min-h-[80px] w-full rounded-lg border border-border-soft/80 bg-white p-3 text-sm leading-relaxed text-text-primary focus:border-theme-blue/30 focus:outline-none focus:ring-2 focus:ring-theme-blue/10";

function ChecklistItem({ item }) {
  const isPass = item.status === "pass";
  return (
    <li
      className={`rounded-xl border px-4 py-3 text-left ${
        isPass
          ? "border-theme-green/30 bg-theme-green/10"
          : "border-theme-orange/30 bg-theme-orange/10"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            isPass
              ? "bg-theme-green/15 text-theme-green"
              : "bg-theme-orange/15 text-theme-orange"
          }`}
        >
          {isPass ? "Looks ready" : "Look closely"}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          {item.kind === "signal" ? "Signal" : "Check"}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-text-primary">{item.label}</p>
      <p className="mt-1 text-sm leading-relaxed text-text-muted">{item.detail}</p>
    </li>
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
}) {
  const [checklistAcknowledged, setChecklistAcknowledged] = useState(false);
  const [reflectionChoice, setReflectionChoice] = useState("");
  const [nextActionId, setNextActionId] = useState("");
  const [optionalNote, setOptionalNote] = useState("");

  const proofItems = useMemo(
    () =>
      buildEvaluateProofItems({
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

  const action = getEvaluateNextAction(nextActionId);

  const continueHint = getEvaluateContinueHint({
    checklistAcknowledged,
    reflectionChoice,
    nextActionId,
    evidenceStrength,
    pathDecision,
    gapNote,
  });

  const ready = canContinueFromEvaluate({
    evidenceStrength,
    gapNote,
    pathDecision,
  });

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
    });

    onEvaluateStateChange?.({
      evidenceStrength: patch.evidenceStrength,
      pathDecision: patch.pathDecision,
      gapNote: patch.gapNote,
    });
  }

  function handleNextAction(id) {
    setNextActionId(id);
    const actionDef = getEvaluateNextAction(id);
    applyMappedState({
      actionId: id,
      path: actionDef?.requiresPathChoice ? "" : actionDef?.pathDecision || "",
      note: optionalNote,
    });
  }

  function handlePathDecision(value) {
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
            You are checking whether your evidence is ready—not grading your idea.
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
              Check whether your evidence is ready to support a claim.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
              You are not grading your idea. You are checking what your evidence can
              honestly help you prove.
            </p>
          </header>

          <section className="space-y-4" aria-labelledby="evaluate-proof-heading">
            <div className="text-left">
              <h2
                id="evaluate-proof-heading"
                className="text-lg font-semibold text-text-primary md:text-xl"
              >
                Your idea and evidence connections.
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">
                Read the proof you already built before you decide what comes next.
              </p>
            </div>

            <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/[0.06] px-4 py-4 md:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
                Your developing idea
              </p>
              <p className="mt-2 text-base leading-relaxed text-text-primary">
                {ideaStatement || "Your idea will appear here."}
              </p>
            </div>

            {proofItems.length === 0 ? (
              <p
                role="status"
                className="rounded-xl border border-theme-orange/35 bg-theme-orange/10 px-4 py-3 text-sm text-text-primary"
              >
                Go back and connect at least two quotations to your idea first.
              </p>
            ) : (
              <ol className="space-y-4">
                {proofItems.map((item, index) => (
                  <li
                    key={`proof-${item.evidence.id}`}
                    className="rounded-xl border border-border-soft/80 bg-white p-4 shadow-soft"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Quotation {index + 1}
                    </p>
                    <div className="mt-3">
                      <ModuleThreeEvidenceCard
                        evidence={item.evidence}
                        grouping
                        showArtifactLabel={false}
                      />
                    </div>
                    <div className="mt-3 rounded-lg border border-theme-blue/20 bg-theme-blue/[0.05] px-3 py-2">
                      <p className="text-xs font-medium text-theme-blue">
                        Relationship: {item.relationLabel}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-text-primary">
                        <span className="font-medium">Your explanation: </span>
                        {item.note}
                      </p>
                    </div>
                    {index < proofItems.length - 1 ? (
                      <p
                        className="mt-3 text-center text-xs text-text-muted"
                        aria-hidden="true"
                      >
                        ↓
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
              Your job right now
            </p>
            <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
              Check whether this evidence is ready to support a claim.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text-primary">
              <li>Read your idea.</li>
              <li>Look at how each quotation supports, complicates, or sharpens it.</li>
              <li>Check whether your explanations are clear and specific.</li>
              <li>Decide what your evidence needs next.</li>
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
                These are facts the page can check. “Look closely” does not mean you failed—it
                means you should examine that part carefully.
              </p>
            </div>
            <ul className="space-y-3">
              {checklist.map((item) => (
                <ChecklistItem key={item.id} item={item} />
              ))}
            </ul>
            <p className="text-sm leading-relaxed text-text-muted">
              The page cannot tell whether your explanations are insightful. Only you can judge
              whether they point to specific details and truly fit the idea.
            </p>
            {!checklistAcknowledged ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setChecklistAcknowledged(true)}
              >
                I’ve reviewed the checklist
              </Button>
            ) : null}
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
            </section>
          ) : null}

          {checklistAcknowledged && reflectionChoice ? (
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

              <div className="grid gap-2">
                {EVALUATE_NEXT_ACTIONS.map((option) => {
                  const selected = nextActionId === option.id;
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
                        name="evaluate-next-action"
                        className="mt-1 accent-theme-blue"
                        checked={selected}
                        onChange={() => handleNextAction(option.id)}
                      />
                      <span className="text-sm leading-relaxed text-text-primary">
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {action?.id === "not_sure" ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-theme-orange/35 bg-theme-orange/10 px-4 py-3 text-sm text-text-primary"
                >
                  {action.coaching}
                </p>
              ) : null}

              {action?.requiresPathChoice ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-text-primary">
                    How do you want to handle that gap?
                  </p>
                  {EVALUATE_PATH_CHOICES.map((choice) => (
                    <label
                      key={choice.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-left ${
                        pathDecision === choice.id
                          ? "border-theme-blue/40 bg-theme-blue/[0.07]"
                          : "border-border-soft/80 bg-surface-soft/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="evaluate-path"
                        className="mt-1 accent-theme-blue"
                        checked={pathDecision === choice.id}
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
                  ))}
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
            <p
              role="status"
              aria-live="polite"
              className="rounded-xl border border-theme-green/35 bg-theme-green/10 px-4 py-3 text-sm text-text-primary"
            >
              {getEvaluateReadyMessage()}
            </p>
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
                  What makes an explanation specific?
                </p>
                <p className="mt-1">
                  It points to a word, phrase, or detail in the quotation and shows how that
                  detail helps the idea—not just a retelling of the quotation.
                </p>
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  What if my quotations do not work together?
                </p>
                <p className="mt-1">
                  Choose another quotation, or look for one that helps connect the two texts.
                  Needing a better match is part of checking your proof.
                </p>
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  Does needing more evidence mean my idea is bad?
                </p>
                <p className="mt-1">
                  No. Needing more evidence does not mean the idea failed. It means the writer
                  learned what the idea still needs.
                </p>
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  How do I know whether I am ready to build a claim?
                </p>
                <p className="mt-1">
                  You can point to at least two quotations, explain how each helps the idea, and
                  honestly say the support is clear enough to argue.
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
              Check the evidence you already wrote. Honesty here saves you from arguing a point
              you cannot prove yet.
            </p>
          </div>
          <div className="space-y-2 border-t border-border-soft/60 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              What comes next
            </p>
            <p className="text-sm leading-relaxed text-text-muted">{whatComesNext}</p>
          </div>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
