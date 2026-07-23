"use client";

/**
 * WP-090 — Shared transfer-oriented vocabulary lesson renderer.
 * Contract-driven microsteps; one decision per screen; feedback before Continue.
 */

import { useMemo, useState } from "react";
import {
  getVocabularyTransferLessonContract,
  stepTitleFor,
  SHARED_ANALYTICAL_ANCHOR,
} from "@/lib/module1/vocabularyTransferLessonContract";
import {
  normalizeTermTransferState,
  evaluateTermTransferReadiness,
  applyParaphraseSignatureToTermState,
} from "@/lib/module1/vocabularyTransferState";
import {
  ASSIGNMENT_INTERPRETATION_LABEL,
  resolveAssignmentInterpretationCarryForward,
} from "@/lib/module1/assignmentInterpretationCarryForward";
import { getTeachingFeedbackPresentation } from "@/lib/ui/teachingFeedbackContract";
import {
  HIERARCHY_LEVELS,
  HIERARCHY_TASK_CLASS,
} from "@/lib/ui/hierarchyContract";
import { resolveTaskWorkspacePresentation } from "@/lib/ui/taskWorkspaceContract";

function findOption(options, id) {
  return (options || []).find((o) => o.id === id) || null;
}

export default function VocabularyTransferLessonFlow({
  termId,
  savedStudentParaphrase = "",
  initialState = null,
  completedTrail = [],
  onStateChange,
  onLessonComplete,
}) {
  const contract = useMemo(
    () => getVocabularyTransferLessonContract(termId),
    [termId]
  );
  const steps = contract?.stepIds || [];

  const [state, setState] = useState(() => {
    const base = normalizeTermTransferState(termId, initialState);
    return applyParaphraseSignatureToTermState(base, savedStudentParaphrase);
  });
  const [pendingFeedback, setPendingFeedback] = useState(null);

  const carryForward = useMemo(
    () =>
      resolveAssignmentInterpretationCarryForward({
        studentParaphrase: savedStudentParaphrase,
      }),
    [savedStudentParaphrase]
  );

  if (!contract) {
    return (
      <p className="text-sm text-text-muted" role="status">
        This vocabulary term is not available in the transfer lesson.
      </p>
    );
  }

  const stepIndex = Math.max(0, steps.indexOf(state.currentStep));
  const trail = steps.slice(0, stepIndex);

  function commit(nextPatch, { advanceTo = null, complete = false } = {}) {
    setState((prev) => {
      const merged = normalizeTermTransferState(termId, {
        ...prev,
        ...nextPatch,
        updatedAt: new Date().toISOString(),
        ...(advanceTo ? { currentStep: advanceTo } : {}),
        ...(complete ? { completed: true, assignmentTransferSeen: true } : {}),
      });
      onStateChange?.(merged);
      if (complete) {
        const readiness = evaluateTermTransferReadiness(termId, merged);
        if (readiness.ready) onLessonComplete?.(merged);
      }
      return merged;
    });
    setPendingFeedback(null);
  }

  function patchState(nextPatch) {
    setState((prev) => {
      const merged = normalizeTermTransferState(termId, {
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

  function nextStepAfter(current) {
    const i = steps.indexOf(current);
    return i >= 0 && i < steps.length - 1 ? steps[i + 1] : null;
  }

  function prevStepBefore(current) {
    const i = steps.indexOf(current);
    return i > 0 ? steps[i - 1] : null;
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
            <span className="mt-1 block text-xs">
              (Assignment wording — add your own paraphrase in Step 1 if you have
              not yet.)
            </span>
          ) : null}
        </p>
      </details>
    ) : null;

  const eyebrow =
    state.currentStep === "notice"
      ? `Transfer lesson · Step ${stepIndex + 1} of ${steps.length}`
      : `Transfer lesson · ${contract.studentFacingName} · Step ${stepIndex + 1} of ${steps.length}`;
  const workspacePresentation = resolveTaskWorkspacePresentation({
    moduleNumber: 1,
    stepIndex: stepIndex + 1,
    stepCount: steps.length,
    taskHeading: stepTitleFor(termId, state.currentStep),
    desktopWidthIntent: "single",
  });

  return (
    <section
      className="space-y-4 rounded-xl border-2 border-theme-blue/35 bg-theme-blue/5 px-4 py-5 shadow-soft sm:px-5"
      data-testid="vocabulary-transfer-lesson"
      data-term-id={termId}
      data-step={state.currentStep}
      data-task-workspace-foundation="true"
      data-task-workspace-contract={workspacePresentation.journeyStageId}
      aria-labelledby="vocabulary-transfer-heading"
    >
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
          {eyebrow}
        </p>
        <h1
          id="vocabulary-transfer-heading"
          className={HIERARCHY_TASK_CLASS}
          data-testid="vocabulary-transfer-step-title"
          data-hierarchy-level={HIERARCHY_LEVELS.task}
        >
          {stepTitleFor(termId, state.currentStep)}
        </h1>
        <p className="text-xs text-text-muted">
          {SHARED_ANALYTICAL_ANCHOR.label}
        </p>
      </div>

      {completedTrail.length > 0 ? (
        <div
          className="rounded-lg border border-border-soft/60 bg-white/70 px-3 py-2"
          data-testid="vocabulary-cumulative-trail"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            What you’ve learned
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-text-muted">
            {completedTrail.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {trail.length > 0 ? (
        <ol
          className="flex flex-wrap gap-2 text-[11px] text-text-muted"
          data-testid="vocabulary-transfer-trail"
        >
          {trail.map((id) => (
            <li
              key={id}
              className="rounded-full border border-border-soft/70 bg-white/80 px-2 py-0.5"
            >
              {stepTitleFor(termId, id)}
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
          Your prompt paraphrase changed. Review how {contract.studentFacingName.toLowerCase()}{" "}
          connects to what this assignment asks—your earlier decisions are still
          saved.
        </p>
      ) : null}

      {state.currentStep === "notice" ? (
        <ChoiceStep
          testId="vocab-step-notice"
          title={contract.familiarScenario.title}
          body={contract.familiarScenario.situation}
          prompt={contract.familiarScenario.noticePrompt}
          options={contract.familiarScenario.noticeOptions}
          groupName={`vocab-notice-${termId}`}
          selectedId={state.noticeChoiceId}
          onSelect={(id) => {
            setPendingFeedback(null);
            patchState({ noticeChoiceId: id });
          }}
          pendingFeedback={pendingFeedback}
          onCheck={() => {
            const opt = findOption(
              contract.familiarScenario.noticeOptions,
              state.noticeChoiceId
            );
            if (opt) showFeedback(opt);
          }}
          checkDisabled={!state.noticeChoiceId}
          onContinue={() => {
            if (!pendingFeedback) return;
            commit(
              {
                noticeChoiceId: state.noticeChoiceId,
                noticeFeedbackSeen: true,
                definitionSeen: true,
              },
              { advanceTo: nextStepAfter("notice") }
            );
          }}
          continueDisabled={!pendingFeedback}
        />
      ) : null}

      {state.currentStep === "name_boundary" ? (
        <ChoiceStep
          testId="vocab-step-boundary"
          bridge={contract.definition.bridge}
          definition={{
            name: contract.studentFacingName,
            academic: contract.definition.academic,
            plain: contract.definition.plainLanguage,
          }}
          prompt={contract.boundary.prompt}
          options={contract.boundary.options}
          groupName={`vocab-boundary-${termId}`}
          selectedId={state.boundaryChoiceId}
          onSelect={(id) => {
            setPendingFeedback(null);
            patchState({
              boundaryChoiceId: id,
              exampleNonexampleChoiceId: id,
              definitionSeen: true,
            });
          }}
          pendingFeedback={pendingFeedback}
          onCheck={() => {
            const opt = findOption(contract.boundary.options, state.boundaryChoiceId);
            if (opt) showFeedback(opt);
          }}
          checkDisabled={!state.boundaryChoiceId}
          onContinue={() => {
            if (!pendingFeedback) return;
            commit(
              {
                boundaryChoiceId: state.boundaryChoiceId,
                exampleNonexampleChoiceId: state.boundaryChoiceId,
                boundaryFeedbackSeen: true,
                exampleNonexampleFeedbackSeen: true,
                definitionSeen: true,
              },
              { advanceTo: nextStepAfter("name_boundary") }
            );
          }}
          continueDisabled={!pendingFeedback}
          onBack={() => commit({}, { advanceTo: prevStepBefore("name_boundary") })}
        />
      ) : null}

      {state.currentStep === "audience_effect" && contract.audienceEffect ? (
        <ChoiceStep
          testId="vocab-step-audience"
          audienceLine={contract.audienceEffect.namedAudience}
          contextLine={contract.audienceEffect.audienceContext}
          prompt={contract.audienceEffect.prompt}
          hint={contract.audienceEffect.uncertaintyCue}
          options={contract.audienceEffect.options}
          groupName={`vocab-audience-${termId}`}
          selectedId={state.audienceEffectChoiceId}
          onSelect={(id) => {
            setPendingFeedback(null);
            patchState({ audienceEffectChoiceId: id });
          }}
          pendingFeedback={pendingFeedback}
          onCheck={() => {
            const opt = findOption(
              contract.audienceEffect.options,
              state.audienceEffectChoiceId
            );
            if (opt) showFeedback(opt);
          }}
          checkDisabled={!state.audienceEffectChoiceId}
          onContinue={() => {
            if (!pendingFeedback) return;
            commit(
              {
                audienceEffectChoiceId: state.audienceEffectChoiceId,
                audienceEffectFeedbackSeen: true,
              },
              { advanceTo: nextStepAfter("audience_effect") }
            );
          }}
          continueDisabled={!pendingFeedback}
          onBack={() =>
            commit({}, { advanceTo: prevStepBefore("audience_effect") })
          }
        />
      ) : null}

      {state.currentStep === "purpose" && contract.purposeConnection ? (
        <ChoiceStep
          testId="vocab-step-purpose"
          purposeLine={contract.purposeConnection.communicatorPurpose}
          anchorPreview={{
            choice: contract.familiarScenario.communicationChoice,
            effect:
              findOption(
                contract.audienceEffect?.options,
                state.audienceEffectChoiceId
              )?.label || "Audience effect",
          }}
          prompt={contract.purposeConnection.prompt}
          options={contract.purposeConnection.options}
          groupName={`vocab-purpose-${termId}`}
          selectedId={state.purposeChoiceId}
          onSelect={(id) => {
            setPendingFeedback(null);
            patchState({ purposeChoiceId: id });
          }}
          pendingFeedback={pendingFeedback}
          onCheck={() => {
            const opt = findOption(
              contract.purposeConnection.options,
              state.purposeChoiceId
            );
            if (opt) showFeedback(opt);
          }}
          checkDisabled={!state.purposeChoiceId}
          onContinue={() => {
            if (!pendingFeedback) return;
            commit(
              {
                purposeChoiceId: state.purposeChoiceId,
                purposeFeedbackSeen: true,
              },
              { advanceTo: nextStepAfter("purpose") }
            );
          }}
          continueDisabled={!pendingFeedback}
          onBack={() => commit({}, { advanceTo: prevStepBefore("purpose") })}
        />
      ) : null}

      {state.currentStep === "audience_fit" && contract.audienceFit ? (
        <ChoiceStep
          testId="vocab-step-audience-fit"
          prompt={contract.audienceFit.prompt}
          options={contract.audienceFit.options}
          groupName={`vocab-fit-${termId}`}
          selectedId={state.audienceFitChoiceId}
          onSelect={(id) => {
            setPendingFeedback(null);
            patchState({ audienceFitChoiceId: id });
          }}
          pendingFeedback={pendingFeedback}
          onCheck={() => {
            const opt = findOption(
              contract.audienceFit.options,
              state.audienceFitChoiceId
            );
            if (opt) showFeedback(opt);
          }}
          checkDisabled={!state.audienceFitChoiceId}
          onContinue={() => {
            if (!pendingFeedback) return;
            commit(
              {
                audienceFitChoiceId: state.audienceFitChoiceId,
                audienceFitFeedbackSeen: true,
              },
              { advanceTo: nextStepAfter("audience_fit") }
            );
          }}
          continueDisabled={!pendingFeedback}
          onBack={() =>
            commit({}, { advanceTo: prevStepBefore("audience_fit") })
          }
        />
      ) : null}

      {state.currentStep === "purpose_result" && contract.purposeResult ? (
        <ChoiceStep
          testId="vocab-step-purpose-result"
          prompt={contract.purposeResult.prompt}
          options={contract.purposeResult.options}
          groupName={`vocab-result-${termId}`}
          selectedId={state.purposeResultChoiceId}
          onSelect={(id) => {
            setPendingFeedback(null);
            patchState({ purposeResultChoiceId: id });
          }}
          pendingFeedback={pendingFeedback}
          onCheck={() => {
            const opt = findOption(
              contract.purposeResult.options,
              state.purposeResultChoiceId
            );
            if (opt) showFeedback(opt);
          }}
          checkDisabled={!state.purposeResultChoiceId}
          onContinue={() => {
            if (!pendingFeedback) return;
            commit(
              {
                purposeResultChoiceId: state.purposeResultChoiceId,
                purposeResultFeedbackSeen: true,
              },
              { advanceTo: nextStepAfter("purpose_result") }
            );
          }}
          continueDisabled={!pendingFeedback}
          onBack={() =>
            commit({}, { advanceTo: prevStepBefore("purpose_result") })
          }
        />
      ) : null}

      {state.currentStep === "king_apply" ? (
        <div className="space-y-3" data-testid="vocab-step-king">
          <figure className="rounded-lg border border-border-soft/70 bg-white/90 px-4 py-3">
            <blockquote
              className="text-sm font-medium leading-relaxed text-text-primary"
              data-testid="vocab-king-passage"
            >
              “{contract.kingPassage.quotation}”
            </blockquote>
            <figcaption className="mt-2 text-xs text-text-muted">
              Source: {contract.kingPassage.sourceId} (
              {contract.kingPassage.guidedPassageId}) ·{" "}
              {contract.kingPassage.passageLocator}
            </figcaption>
          </figure>
          <p className="text-sm font-semibold text-text-primary">
            {contract.kingApplication.prompt}
          </p>
          <RadioGroup
            name={`vocab-king-${termId}`}
            options={contract.kingApplication.options}
            selectedId={state.kingChoiceId}
            onSelect={(id) => {
              setPendingFeedback(null);
              patchState({ kingChoiceId: id });
            }}
          />
          <label className="block text-sm text-text-primary">
            {contract.kingApplication.followUpStem}
            <textarea
              className="mt-2 min-h-[72px] w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
              value={state.kingFollowUpText}
              placeholder={contract.kingApplication.followUpPlaceholder}
              onChange={(e) =>
                patchState({ kingFollowUpText: e.target.value })
              }
              data-testid="vocab-king-followup"
            />
          </label>
          {pendingFeedback ? <FeedbackBlock feedback={pendingFeedback} /> : null}
          <PrimaryRow
            onCheck={() => {
              const opt = findOption(
                contract.kingApplication.options,
                state.kingChoiceId
              );
              if (opt) showFeedback(opt);
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
                { advanceTo: nextStepAfter("king_apply") }
              );
            }}
            continueDisabled={!pendingFeedback}
            onBack={() => commit({}, { advanceTo: prevStepBefore("king_apply") })}
          />
        </div>
      ) : null}

      {state.currentStep === "assignment_transfer" ? (
        <div className="space-y-3" data-testid="vocab-step-transfer">
          <div
            className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-4 py-3"
            data-testid="vocab-assignment-desk"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
              {carryForward.label}
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-text-primary">
              {carryForward.text}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {carryForward.isFallback
                ? "Assignment wording (fallback)"
                : "Your saved wording"}
            </p>
          </div>
          {Array.isArray(contract.conceptMap) && contract.conceptMap.length > 0 ? (
            <div
              className="rounded-lg border border-theme-blue/25 bg-white/90 px-4 py-3"
              data-testid="vocab-concept-map"
            >
              <p className="text-sm font-semibold text-text-primary">
                Your six-term lens
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-text-muted">
                {contract.conceptMap.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </div>
          ) : null}
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
              const preview = normalizeTermTransferState(termId, {
                ...state,
                assignmentTransferSeen: true,
                completed: true,
              });
              const readiness = evaluateTermTransferReadiness(termId, preview);
              if (!readiness.ready) {
                // Do not leave students on a dead-end confirm when earlier
                // decisions were skipped or not saved. Return to the first gap.
                const missing = readiness.missing[0];
                const stepForMissing =
                  missing === "notice"
                    ? "notice"
                    : missing === "boundary"
                      ? "name_boundary"
                      : missing === "audience_effect"
                        ? "audience_effect"
                        : missing === "purpose"
                          ? "purpose"
                          : missing === "audience_fit"
                            ? "audience_fit"
                            : missing === "purpose_result"
                              ? "purpose_result"
                              : missing === "king_apply"
                                ? "king_apply"
                                : null;
                if (stepForMissing) {
                  commit({}, { advanceTo: stepForMissing });
                  return;
                }
              }
              commit(
                {
                  assignmentTransferSeen: true,
                  promptInterpretationNeedsReview: false,
                },
                { complete: true }
              );
            }}
            continueDisabled={false}
            onBack={() =>
              commit({}, { advanceTo: prevStepBefore("assignment_transfer") })
            }
          />
        </div>
      ) : null}

      {shelfParaphrase}
    </section>
  );
}

function ChoiceStep({
  testId,
  title,
  body,
  bridge,
  definition,
  audienceLine,
  contextLine,
  purposeLine,
  anchorPreview,
  prompt,
  hint,
  options,
  groupName,
  selectedId,
  onSelect,
  pendingFeedback,
  onCheck,
  checkDisabled,
  onContinue,
  continueDisabled,
  onBack,
}) {
  return (
    <div className="space-y-3" data-testid={testId}>
      {title ? (
        <p className="text-sm font-medium text-text-primary">{title}</p>
      ) : null}
      {body ? (
        <p className="text-sm leading-relaxed text-text-primary">{body}</p>
      ) : null}
      {bridge ? (
        <p className="text-sm leading-relaxed text-text-primary">{bridge}</p>
      ) : null}
      {definition ? (
        <div className="rounded-lg border border-border-soft/70 bg-white/90 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
            {definition.name}
          </p>
          <p className="mt-2 text-base font-semibold text-text-primary">
            {definition.academic}
          </p>
          <p className="mt-2 text-sm text-text-muted">{definition.plain}</p>
        </div>
      ) : null}
      {audienceLine ? (
        <p className="text-sm text-text-muted">
          Audience:{" "}
          <strong className="text-text-primary">{audienceLine}</strong>
        </p>
      ) : null}
      {contextLine ? (
        <p className="text-sm text-text-muted">{contextLine}</p>
      ) : null}
      {purposeLine ? (
        <p className="text-sm text-text-muted">
          Purpose:{" "}
          <strong className="text-text-primary">{purposeLine}</strong>
        </p>
      ) : null}
      {anchorPreview ? (
        <div
          className="rounded-lg border border-theme-blue/25 bg-white/80 px-3 py-2 text-sm"
          data-testid="vocab-anchor-complete"
        >
          <p className="font-medium text-text-primary">Your three-part lens so far</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-text-muted">
            <li>{anchorPreview.choice}</li>
            <li>{anchorPreview.effect}</li>
            <li>How that response supports the purpose (choose below)</li>
          </ol>
        </div>
      ) : null}
      {prompt ? (
        <p className="text-sm font-semibold text-text-primary">{prompt}</p>
      ) : null}
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
      <RadioGroup
        name={groupName}
        options={options}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      {pendingFeedback ? <FeedbackBlock feedback={pendingFeedback} /> : null}
      <PrimaryRow
        onCheck={onCheck}
        checkDisabled={checkDisabled}
        onContinue={onContinue}
        continueDisabled={continueDisabled}
        onBack={onBack}
      />
    </div>
  );
}

function RadioGroup({ name, options, selectedId, onSelect }) {
  return (
    <div className="space-y-2" role="radiogroup">
      {(options || []).map((opt) => (
        <label
          key={opt.id}
          className="flex cursor-pointer gap-3 rounded-lg border border-border-soft/70 bg-white/90 px-3 py-3 text-sm"
        >
          <input
            type="radio"
            name={name}
            className="mt-1"
            checked={selectedId === opt.id}
            onChange={() => onSelect(opt.id)}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function FeedbackBlock({ feedback }) {
  return (
    <div
      className="rounded-lg border border-border-soft/70 bg-white px-4 py-3"
      role="status"
      aria-live="polite"
      data-testid="vocabulary-transfer-feedback"
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
          data-testid="vocabulary-transfer-back"
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
          data-testid="vocabulary-transfer-check"
        >
          {checkLabel}
        </button>
      ) : null}
      <button
        type="button"
        className="min-h-[44px] rounded-md bg-theme-blue px-4 text-sm font-semibold text-white disabled:opacity-50"
        disabled={continueDisabled}
        onClick={onContinue}
        data-testid="vocabulary-transfer-continue"
      >
        {continueLabel}
      </button>
    </div>
  );
}
