"use client";

/**
 * WP-089 — Staged transfer-oriented ethos lesson (development-gated).
 * One decision per microstep; teaching feedback before Continue.
 */

import { useMemo, useState } from "react";
import {
  ETHOS_TRANSFER_STEPS,
  getEthosTransferLessonContract,
  normalizeEthosTransferState,
  evaluateEthosTransferReadiness,
  buildPromptInterpretationSignature,
} from "@/lib/module1/ethosTransferLessonContract";
import {
  ASSIGNMENT_INTERPRETATION_LABEL,
  resolveAssignmentInterpretationCarryForward,
} from "@/lib/module1/assignmentInterpretationCarryForward";
import { getTeachingFeedbackPresentation } from "@/lib/ui/teachingFeedbackContract";

function stepTitle(stepId) {
  switch (stepId) {
    case "notice":
      return "Notice a communication choice";
    case "name_boundary":
      return "Name the idea: ethos";
    case "audience_effect":
      return "Predict the audience effect";
    case "purpose":
      return "Connect effect to purpose";
    case "king_apply":
      return "Try the lens with King";
    case "assignment_transfer":
      return "Connect it to your assignment";
    default:
      return "Ethos";
  }
}

function findOption(options, id) {
  return (options || []).find((o) => o.id === id) || null;
}

export default function EthosTransferLessonFlow({
  savedStudentParaphrase = "",
  initialState = null,
  onStateChange,
  onLessonComplete,
}) {
  const contract = useMemo(() => getEthosTransferLessonContract(), []);
  const [state, setState] = useState(() => {
    const base = normalizeEthosTransferState(initialState);
    const sig = buildPromptInterpretationSignature(savedStudentParaphrase);
    if (sig && base.promptInterpretationSignature && sig !== base.promptInterpretationSignature) {
      return {
        ...base,
        promptInterpretationSignature: sig,
        promptInterpretationNeedsReview: true,
      };
    }
    if (sig && !base.promptInterpretationSignature) {
      return { ...base, promptInterpretationSignature: sig };
    }
    return base;
  });
  const [pendingFeedback, setPendingFeedback] = useState(null);

  const carryForward = useMemo(
    () =>
      resolveAssignmentInterpretationCarryForward({
        studentParaphrase: savedStudentParaphrase,
      }),
    [savedStudentParaphrase]
  );

  const stepIndex = Math.max(0, ETHOS_TRANSFER_STEPS.indexOf(state.currentStep));
  const trail = ETHOS_TRANSFER_STEPS.slice(0, stepIndex);

  function commit(nextPatch, { advanceTo = null, complete = false } = {}) {
    setState((prev) => {
      const merged = normalizeEthosTransferState({
        ...prev,
        ...nextPatch,
        updatedAt: new Date().toISOString(),
        ...(advanceTo ? { currentStep: advanceTo } : {}),
        ...(complete ? { completed: true, assignmentTransferSeen: true } : {}),
      });
      onStateChange?.(merged);
      if (complete) {
        const readiness = evaluateEthosTransferReadiness(merged, contract);
        if (readiness.ready) onLessonComplete?.(merged);
      }
      return merged;
    });
    setPendingFeedback(null);
  }

  /** Patch without advancing — keeps parent/localStorage in sync for refresh. */
  function patchState(nextPatch) {
    setState((prev) => {
      const merged = normalizeEthosTransferState({
        ...prev,
        ...nextPatch,
        updatedAt: new Date().toISOString(),
      });
      onStateChange?.(merged);
      return merged;
    });
  }

  function showFeedback(option) {
    const correct = Boolean(option?.isTarget);
    const presentation = getTeachingFeedbackPresentation({
      correct,
      explanation: option?.explanation || "",
    });
    setPendingFeedback({
      correct,
      heading: presentation.heading,
      explanation: option?.explanation || presentation.explanation,
      optionId: option?.id,
    });
  }

  const shelfParaphrase =
    state.currentStep !== "assignment_transfer" ? (
      <details className="rounded-lg border border-border-soft/60 bg-white/70 px-4 py-2">
        <summary className="cursor-pointer text-sm font-medium text-text-muted">
          Optional: {ASSIGNMENT_INTERPRETATION_LABEL}
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          {carryForward.text}
          {carryForward.isFallback ? (
            <span className="block mt-1 text-xs">(Assignment wording — add your own paraphrase in Step 1 if you have not yet.)</span>
          ) : null}
        </p>
      </details>
    ) : null;

  return (
    <section
      className="space-y-4 rounded-xl border-2 border-theme-blue/35 bg-theme-blue/5 px-4 py-5 shadow-soft sm:px-5"
      data-testid="ethos-transfer-lesson"
      data-step={state.currentStep}
      aria-labelledby="ethos-transfer-heading"
    >
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
          {state.currentStep === "notice"
            ? `Transfer lesson · Step ${stepIndex + 1} of ${ETHOS_TRANSFER_STEPS.length}`
            : `Transfer lesson · Ethos · Step ${stepIndex + 1} of ${ETHOS_TRANSFER_STEPS.length}`}
        </p>
        <h2
          id="ethos-transfer-heading"
          className="text-lg font-semibold text-text-primary"
          data-testid="ethos-transfer-step-title"
        >
          {stepTitle(state.currentStep)}
        </h2>
        <p className="text-xs text-text-muted">{contract.analyticalAnchor.label}</p>
      </div>

      {trail.length > 0 ? (
        <ol
          className="flex flex-wrap gap-2 text-[11px] text-text-muted"
          data-testid="ethos-transfer-trail"
        >
          {trail.map((id) => (
            <li
              key={id}
              className="rounded-full border border-border-soft/70 bg-white/80 px-2 py-0.5"
            >
              {stepTitle(id)}
            </li>
          ))}
        </ol>
      ) : null}

      {state.promptInterpretationNeedsReview &&
      state.currentStep === "assignment_transfer" ? (
        <p
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-text-primary"
          role="status"
        >
          Your prompt paraphrase changed. Review how ethos connects to what this
          assignment asks—your earlier ethos decisions are still saved.
        </p>
      ) : null}

      {/* NOTICE — do not put “ethos” in the primary task before noticing */}
      {state.currentStep === "notice" ? (
        <div className="space-y-3" data-testid="ethos-step-notice">
          <p className="text-sm font-medium text-text-primary">
            {contract.familiarScenario.title}
          </p>
          <p className="text-sm leading-relaxed text-text-primary">
            {contract.familiarScenario.situation}
          </p>
          <p className="text-sm font-semibold text-text-primary">
            {contract.familiarScenario.noticePrompt}
          </p>
          <div className="space-y-2" role="radiogroup" aria-label="Notice the choice">
            {contract.familiarScenario.noticeOptions.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer gap-3 rounded-lg border border-border-soft/70 bg-white/90 px-3 py-3 text-sm"
              >
                <input
                  type="radio"
                  name="ethos-notice"
                  className="mt-1"
                  checked={state.noticeChoiceId === opt.id}
                  onChange={() => {
                    setPendingFeedback(null);
                    patchState({ noticeChoiceId: opt.id });
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {pendingFeedback ? (
            <FeedbackBlock feedback={pendingFeedback} />
          ) : null}
          <PrimaryRow
            onCheck={() => {
              const opt = findOption(
                contract.familiarScenario.noticeOptions,
                state.noticeChoiceId
              );
              if (!opt) return;
              showFeedback(opt);
            }}
            checkDisabled={!state.noticeChoiceId}
            onContinue={() => {
              const opt = findOption(
                contract.familiarScenario.noticeOptions,
                state.noticeChoiceId
              );
              if (!pendingFeedback || !opt) return;
              commit(
                {
                  noticeChoiceId: opt.id,
                  noticeFeedbackSeen: true,
                  definitionSeen: true,
                },
                { advanceTo: "name_boundary" }
              );
            }}
            continueDisabled={!pendingFeedback}
          />
        </div>
      ) : null}

      {state.currentStep === "name_boundary" ? (
        <div className="space-y-3" data-testid="ethos-step-name">
          <p className="text-sm leading-relaxed text-text-primary">
            {contract.definition.bridge}
          </p>
          <div className="rounded-lg border border-border-soft/70 bg-white/90 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
              Ethos
            </p>
            <p className="mt-2 text-base font-semibold text-text-primary">
              {contract.definition.academic}
            </p>
            <p className="mt-2 text-sm text-text-muted">
              {contract.definition.plainLanguage}
            </p>
          </div>
          <p className="text-sm font-semibold text-text-primary">
            {contract.exampleNonexample.prompt}
          </p>
          <div className="space-y-2" role="radiogroup" aria-label="Example or nonexample">
            {contract.exampleNonexample.options.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer gap-3 rounded-lg border border-border-soft/70 bg-white/90 px-3 py-3 text-sm"
              >
                <input
                  type="radio"
                  name="ethos-boundary"
                  className="mt-1"
                  checked={state.exampleNonexampleChoiceId === opt.id}
                  onChange={() => {
                    setPendingFeedback(null);
                    patchState({
                      exampleNonexampleChoiceId: opt.id,
                      definitionSeen: true,
                    });
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {pendingFeedback ? <FeedbackBlock feedback={pendingFeedback} /> : null}
          <PrimaryRow
            onCheck={() => {
              const opt = findOption(
                contract.exampleNonexample.options,
                state.exampleNonexampleChoiceId
              );
              if (!opt) return;
              showFeedback(opt);
            }}
            checkDisabled={!state.exampleNonexampleChoiceId}
            onContinue={() => {
              if (!pendingFeedback) return;
              commit(
                {
                  exampleNonexampleChoiceId: state.exampleNonexampleChoiceId,
                  exampleNonexampleFeedbackSeen: true,
                  definitionSeen: true,
                },
                { advanceTo: "audience_effect" }
              );
            }}
            continueDisabled={!pendingFeedback}
            onBack={() => commit({}, { advanceTo: "notice" })}
          />
        </div>
      ) : null}

      {state.currentStep === "audience_effect" ? (
        <div className="space-y-3" data-testid="ethos-step-audience">
          <p className="text-sm text-text-muted">
            Audience: <strong className="text-text-primary">{contract.audienceEffect.namedAudience}</strong>
          </p>
          <p className="text-sm text-text-muted">{contract.audienceEffect.audienceContext}</p>
          <p className="text-sm font-semibold text-text-primary">
            {contract.audienceEffect.prompt}
          </p>
          <p className="text-xs text-text-muted">{contract.audienceEffect.uncertaintyCue}</p>
          <div className="space-y-2" role="radiogroup" aria-label="Audience effect">
            {contract.audienceEffect.options.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer gap-3 rounded-lg border border-border-soft/70 bg-white/90 px-3 py-3 text-sm"
              >
                <input
                  type="radio"
                  name="ethos-audience"
                  className="mt-1"
                  checked={state.audienceEffectChoiceId === opt.id}
                  onChange={() => {
                    setPendingFeedback(null);
                    patchState({ audienceEffectChoiceId: opt.id });
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {pendingFeedback ? <FeedbackBlock feedback={pendingFeedback} /> : null}
          <PrimaryRow
            onCheck={() => {
              const opt = findOption(
                contract.audienceEffect.options,
                state.audienceEffectChoiceId
              );
              if (!opt) return;
              showFeedback(opt);
            }}
            checkDisabled={!state.audienceEffectChoiceId}
            onContinue={() => {
              if (!pendingFeedback) return;
              commit(
                {
                  audienceEffectChoiceId: state.audienceEffectChoiceId,
                  audienceEffectFeedbackSeen: true,
                },
                { advanceTo: "purpose" }
              );
            }}
            continueDisabled={!pendingFeedback}
            onBack={() => commit({}, { advanceTo: "name_boundary" })}
          />
        </div>
      ) : null}

      {state.currentStep === "purpose" ? (
        <div className="space-y-3" data-testid="ethos-step-purpose">
          <p className="text-sm text-text-muted">
            Purpose: <strong className="text-text-primary">{contract.purposeConnection.communicatorPurpose}</strong>
          </p>
          <div
            className="rounded-lg border border-theme-blue/25 bg-white/80 px-3 py-2 text-sm"
            data-testid="ethos-anchor-complete"
          >
            <p className="font-medium text-text-primary">Your three-part lens so far</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-text-muted">
              <li>{contract.familiarScenario.communicationChoice}</li>
              <li>
                {findOption(
                  contract.audienceEffect.options,
                  state.audienceEffectChoiceId
                )?.label || "Audience effect"}
              </li>
              <li>How that response supports the purpose (choose below)</li>
            </ol>
          </div>
          <p className="text-sm font-semibold text-text-primary">
            {contract.purposeConnection.prompt}
          </p>
          <div className="space-y-2" role="radiogroup" aria-label="Purpose connection">
            {contract.purposeConnection.options.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer gap-3 rounded-lg border border-border-soft/70 bg-white/90 px-3 py-3 text-sm"
              >
                <input
                  type="radio"
                  name="ethos-purpose"
                  className="mt-1"
                  checked={state.purposeChoiceId === opt.id}
                  onChange={() => {
                    setPendingFeedback(null);
                    patchState({ purposeChoiceId: opt.id });
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {pendingFeedback ? <FeedbackBlock feedback={pendingFeedback} /> : null}
          <PrimaryRow
            onCheck={() => {
              const opt = findOption(
                contract.purposeConnection.options,
                state.purposeChoiceId
              );
              if (!opt) return;
              showFeedback(opt);
            }}
            checkDisabled={!state.purposeChoiceId}
            onContinue={() => {
              if (!pendingFeedback) return;
              commit(
                {
                  purposeChoiceId: state.purposeChoiceId,
                  purposeFeedbackSeen: true,
                },
                { advanceTo: "king_apply" }
              );
            }}
            continueDisabled={!pendingFeedback}
            onBack={() => commit({}, { advanceTo: "audience_effect" })}
          />
        </div>
      ) : null}

      {state.currentStep === "king_apply" ? (
        <div className="space-y-3" data-testid="ethos-step-king">
          <figure className="rounded-lg border border-border-soft/70 bg-white/90 px-4 py-3">
            <blockquote
              className="text-sm font-medium leading-relaxed text-text-primary"
              data-testid="ethos-king-passage"
            >
              “{contract.kingPassage.quotation}”
            </blockquote>
            <figcaption className="mt-2 text-xs text-text-muted">
              Source: Dream speech ({contract.kingPassage.guidedPassageId}) ·{" "}
              {contract.kingPassage.passageLocator}
            </figcaption>
          </figure>
          <p className="text-sm font-semibold text-text-primary">
            {contract.kingApplication.prompt}
          </p>
          <div className="space-y-2" role="radiogroup" aria-label="King application">
            {contract.kingApplication.options.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer gap-3 rounded-lg border border-border-soft/70 bg-white/90 px-3 py-3 text-sm"
              >
                <input
                  type="radio"
                  name="ethos-king"
                  className="mt-1"
                  checked={state.kingChoiceId === opt.id}
                  onChange={() => {
                    setPendingFeedback(null);
                    patchState({ kingChoiceId: opt.id });
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          <label className="block text-sm text-text-primary">
            {contract.kingApplication.followUpStem}
            <textarea
              className="mt-2 min-h-[72px] w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
              value={state.kingFollowUpText}
              placeholder={contract.kingApplication.followUpPlaceholder}
              onChange={(e) => patchState({ kingFollowUpText: e.target.value })}
              data-testid="ethos-king-followup"
            />
          </label>
          {pendingFeedback ? <FeedbackBlock feedback={pendingFeedback} /> : null}
          <PrimaryRow
            onCheck={() => {
              const opt = findOption(
                contract.kingApplication.options,
                state.kingChoiceId
              );
              if (!opt) return;
              showFeedback(opt);
            }}
            checkDisabled={!state.kingChoiceId}
            onContinue={() => {
              if (!pendingFeedback) return;
              commit(
                {
                  kingChoiceId: state.kingChoiceId,
                  kingFollowUpText: state.kingFollowUpText,
                  kingFeedbackSeen: true,
                },
                { advanceTo: "assignment_transfer" }
              );
            }}
            continueDisabled={!pendingFeedback}
            onBack={() => commit({}, { advanceTo: "purpose" })}
          />
        </div>
      ) : null}

      {state.currentStep === "assignment_transfer" ? (
        <div className="space-y-3" data-testid="ethos-step-transfer">
          <div
            className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-4 py-3"
            data-testid="ethos-assignment-desk"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
              {carryForward.label}
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-text-primary">
              {carryForward.text}
            </p>
            {!carryForward.isFallback ? (
              <p className="mt-1 text-xs text-text-muted">Your saved wording</p>
            ) : (
              <p className="mt-1 text-xs text-text-muted">Assignment wording (fallback)</p>
            )}
          </div>
          <p className="text-sm leading-relaxed text-text-primary">
            {contract.assignmentTransfer.transferStatement}
          </p>
          <p className="text-sm text-text-muted">
            In this essay, you will:{" "}
            <strong className="text-text-primary">
              {contract.assignmentTransfer.essayUseCue}
            </strong>
          </p>
          <PrimaryRow
            checkLabel={null}
            onCheck={null}
            checkDisabled
            continueLabel={contract.assignmentTransfer.confirmLabel}
            onContinue={() => {
              commit(
                {
                  assignmentTransferSeen: true,
                  promptInterpretationNeedsReview: false,
                },
                { complete: true }
              );
            }}
            continueDisabled={false}
            onBack={() => commit({}, { advanceTo: "king_apply" })}
          />
        </div>
      ) : null}

      {shelfParaphrase}
    </section>
  );
}

function FeedbackBlock({ feedback }) {
  return (
    <div
      className="rounded-lg border border-border-soft/70 bg-white px-4 py-3"
      role="status"
      aria-live="polite"
      data-testid="ethos-transfer-feedback"
      data-feedback-correct={feedback.correct ? "true" : "false"}
    >
      <p className="text-sm font-semibold text-text-primary">{feedback.heading}</p>
      <p className="mt-1 text-sm leading-relaxed text-text-muted">
        {feedback.explanation}
      </p>
    </div>
  );
}

function PrimaryRow({
  onCheck,
  checkDisabled,
  onContinue,
  continueDisabled,
  onBack,
  checkLabel = "Check",
  continueLabel = "Continue",
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {onBack ? (
        <button
          type="button"
          className="min-h-[44px] rounded-md border border-border-soft bg-white px-4 text-sm font-medium text-text-primary"
          onClick={onBack}
          data-testid="ethos-transfer-back"
        >
          Back
        </button>
      ) : null}
      {onCheck && checkLabel ? (
        <button
          type="button"
          className="min-h-[44px] rounded-md border border-theme-blue bg-white px-4 text-sm font-semibold text-theme-blue disabled:opacity-50"
          disabled={checkDisabled}
          onClick={onCheck}
          data-testid="ethos-transfer-check"
        >
          {checkLabel}
        </button>
      ) : null}
      <button
        type="button"
        className="min-h-[44px] rounded-md bg-theme-blue px-4 text-sm font-semibold text-white disabled:opacity-50"
        disabled={continueDisabled}
        onClick={onContinue}
        data-testid="ethos-transfer-continue"
      >
        {continueLabel}
      </button>
    </div>
  );
}
