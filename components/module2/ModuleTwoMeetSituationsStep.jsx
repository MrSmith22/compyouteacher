"use client";

import { useEffect, useRef, useState } from "react";
import RhetoricalSituationGuide from "@/components/shared/RhetoricalSituationGuide";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import {
  LESSON_PHASES,
  advanceAfterFeedback,
  advanceLessonPhase,
  applyAnswer,
  createInitialLessonState,
  getActiveQuestion,
  getLessonContinueHint,
  getLessonPrimaryAction,
  isLessonComplete,
  retryCurrentQuestion,
  evaluateAnswer,
} from "@/lib/module2/rhetoricalSituationLesson";

function WizardProgressList({
  steps,
  stage,
  lessonSatisfied = false,
  sourcesReady = false,
  onLockedSelect,
}) {
  const currentIdx = steps.findIndex((step) => step.stage === stage);
  return (
    <ol className="space-y-1.5">
      {steps.map((step, index) => {
        const isCompleted = index < currentIdx;
        const isCurrent = index === currentIdx;
        const stage6Locked =
          step.stage === 6 && sourcesReady && !lessonSatisfied;
        return (
          <li key={step.label}>
            <button
              type="button"
              onClick={() => {
                if (stage6Locked) {
                  onLockedSelect?.(
                    "Complete “Meet the two situations” before you begin finding evidence."
                  );
                }
              }}
              className={`flex w-full items-start gap-2 rounded-md px-1 py-0.5 text-left text-xs leading-snug ${
                isCurrent
                  ? "font-semibold text-theme-blue"
                  : isCompleted
                    ? "text-theme-green"
                    : "text-text-muted"
              }`}
              aria-current={isCurrent ? "step" : undefined}
              aria-disabled={stage6Locked ? "true" : undefined}
            >
              <span className="mt-0.5 w-4 shrink-0 tabular-nums" aria-hidden="true">
                {isCompleted ? "✓" : stage6Locked ? "○" : index + 1}
              </span>
              <span>
                {step.label}
                {isCurrent ? (
                  <span className="mt-0.5 block font-normal text-text-muted">
                    Current
                  </span>
                ) : null}
                {stage6Locked ? (
                  <span className="mt-0.5 block font-normal text-text-muted">
                    Locked — finish Meet the two situations first
                  </span>
                ) : null}
                {isCompleted && !isCurrent ? (
                  <span className="mt-0.5 block font-normal text-text-muted">
                    Completed
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export default function ModuleTwoMeetSituationsStep({
  wizardSteps = [],
  wizardStepNumber = 6,
  assignmentSources = null,
  situationComparison = null,
  initialComplete = false,
  returnFromProtectedRoute = false,
  onContinue,
  onBack,
  onLessonComplete,
}) {
  const [lessonState, setLessonState] = useState(() => {
    if (initialComplete) {
      return {
        ...createInitialLessonState(),
        phase: LESSON_PHASES.COMPLETE,
      };
    }
    return createInitialLessonState();
  });
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [durableComplete, setDurableComplete] = useState(initialComplete);
  const [lockedNextMessage, setLockedNextMessage] = useState("");
  const phaseAnchorRef = useRef(null);
  const complete = isLessonComplete(lessonState) || durableComplete;
  const activeQuestion = getActiveQuestion(lessonState);
  const primaryAction = getLessonPrimaryAction(
    durableComplete
      ? { ...lessonState, phase: LESSON_PHASES.COMPLETE }
      : lessonState
  );
  const continueHint = getLessonContinueHint(lessonState);

  useEffect(() => {
    if (initialComplete) {
      setDurableComplete(true);
      setLockedNextMessage("");
      setLessonState((prev) => ({
        ...prev,
        phase: LESSON_PHASES.COMPLETE,
      }));
    }
  }, [initialComplete]);

  useEffect(() => {
    if (durableComplete) setLockedNextMessage("");
  }, [durableComplete]);

  useEffect(() => {
    phaseAnchorRef.current?.focus?.({ preventScroll: false });
  }, [lessonState.phase, lessonState.activeQuestionIndex, durableComplete]);

  const persistCompletion = async () => {
    setSavingCompletion(true);
    setCompletionError("");
    try {
      const result = await onLessonComplete?.();
      if (result === false) {
        setCompletionError(
          "We couldn’t save your progress. Please try again. If this keeps happening, ask your teacher for help."
        );
        return false;
      }
      setDurableComplete(true);
      return true;
    } catch {
      setCompletionError(
        "We couldn’t save your progress. Please try again. If this keeps happening, ask your teacher for help."
      );
      return false;
    } finally {
      setSavingCompletion(false);
    }
  };

  const handlePrimary = async () => {
    if (primaryAction.kind === "advance") {
      setLessonState((prev) => advanceLessonPhase(prev, primaryAction.nextPhase));
      return;
    }
    if (primaryAction.kind === "retry") {
      setLessonState((prev) => retryCurrentQuestion(prev));
      return;
    }
    if (primaryAction.kind === "next_question") {
      const next = advanceAfterFeedback(lessonState);
      setLessonState(next);
      if (isLessonComplete(next) && !durableComplete) {
        await persistCompletion();
      }
      return;
    }
    if (primaryAction.kind === "continue") {
      if (!durableComplete) {
        const saved = await persistCompletion();
        if (!saved) return;
      }
      onContinue?.();
    }
  };

  const answerEvaluation =
    lessonState.feedbackVisible && activeQuestion
      ? evaluateAnswer(
          activeQuestion.id,
          lessonState.answers[activeQuestion.id]
        )
      : null;

  return (
    <WorkspaceColumns variant="drafting" className="gap-5 xl:gap-8">
      <WorkspaceSidebar className="opacity-80 lg:col-span-1">
        <aside className="space-y-4 rounded-xl bg-surface-soft/70 px-4 py-5 text-left">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              Module 2
            </p>
            <p className="text-sm font-semibold text-text-primary">
              Prepare and read the sources
            </p>
          </div>
          <div className="space-y-1 border-t border-border-soft/60 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              Where you are
            </p>
            <p className="text-sm leading-relaxed text-text-primary">
              Meet the two situations
            </p>
            <p className="text-sm leading-relaxed text-text-muted">
              Learn who King was addressing and what he was trying to accomplish.
            </p>
          </div>
          <div className="space-y-3 border-t border-border-soft/60 pt-4">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                Progress
              </p>
              <p className="text-sm font-semibold text-text-primary">
                Step {wizardStepNumber} of {wizardSteps.length}
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                Meet the two situations
              </p>
            </div>
            <WizardProgressList
              steps={wizardSteps}
              stage={5}
              sourcesReady
              lessonSatisfied={durableComplete}
              onLockedSelect={setLockedNextMessage}
            />
            {lockedNextMessage ? (
              <p
                role="status"
                aria-live="polite"
                className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-xs leading-relaxed text-text-primary"
              >
                {lockedNextMessage}
              </p>
            ) : null}
          </div>
        </aside>
      </WorkspaceSidebar>

      <WorkspaceCenter className="min-w-0">
        <div className="space-y-5 md:space-y-6">
          <header className="space-y-3 text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Start here
            </p>
            <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
              Meet the two situations.
            </h1>
            {returnFromProtectedRoute ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-3 text-sm leading-relaxed text-text-primary"
              >
                You’re almost ready to begin gathering evidence. First, finish learning how
                the Speech and Letter have different audiences and purposes.
              </div>
            ) : null}
            <p className="max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
              You saved two works by Dr. King. He created them in the same year—but for
              different audiences, in different situations.
            </p>
            <p className="max-w-3xl text-sm leading-relaxed text-text-primary md:text-base">
              Understanding those situations is the key to comparing why he uses rhetoric
              differently in the speech and the letter.
            </p>
          </header>

          <section
            aria-labelledby="meet-why-heading"
            className="rounded-xl border border-theme-dark/15 bg-surface-soft/50 px-4 py-4 md:px-5"
          >
            <h2
              id="meet-why-heading"
              className="text-base font-semibold text-text-primary"
            >
              Why this matters
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-primary">
              A work can have more than one audience. The primary audience is who King
              directly addressed. The broader audience is everyone else he could reasonably
              expect the work to reach.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-primary">
              A purpose can also have layers. King may be trying to help an audience think,
              feel, understand, or do more than one thing.
            </p>
          </section>

          {lessonState.phase === LESSON_PHASES.SPEECH ? (
            <section
              aria-labelledby="meet-speech-heading"
              className="space-y-4"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
                  Phase 1 of 3
                </p>
                <h2
                  id="meet-speech-heading"
                  tabIndex={-1}
                  ref={phaseAnchorRef}
                  className="mt-1 text-lg font-semibold text-text-primary outline-none"
                >
                  Meet the speech situation
                </h2>
              </div>
              <RhetoricalSituationGuide
                mode="speech"
                sources={assignmentSources}
              />
            </section>
          ) : null}

          {lessonState.phase === LESSON_PHASES.LETTER ? (
            <section
              aria-labelledby="meet-letter-heading"
              className="space-y-4"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                  Phase 2 of 3
                </p>
                <h2
                  id="meet-letter-heading"
                  tabIndex={-1}
                  ref={phaseAnchorRef}
                  className="mt-1 text-lg font-semibold text-text-primary outline-none"
                >
                  Meet the letter situation
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  You already reviewed the Speech situation. Now meet the Letter.
                </p>
              </div>
              <RhetoricalSituationGuide
                mode="letter"
                sources={assignmentSources}
              />
            </section>
          ) : null}

          {lessonState.phase === LESSON_PHASES.COMPARE ||
          lessonState.phase === LESSON_PHASES.CHECK ||
          complete ? (
            <section
              aria-labelledby="meet-compare-heading"
              className="space-y-4"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                  Phase 3 of 3
                </p>
                <h2
                  id="meet-compare-heading"
                  tabIndex={
                    lessonState.phase === LESSON_PHASES.COMPARE ? -1 : undefined
                  }
                  ref={
                    lessonState.phase === LESSON_PHASES.COMPARE
                      ? phaseAnchorRef
                      : undefined
                  }
                  className="mt-1 text-lg font-semibold text-text-primary outline-none"
                >
                  Compare the two situations
                </h2>
              </div>
              <RhetoricalSituationGuide
                mode="compare"
                sources={assignmentSources}
                comparison={situationComparison}
              />
              <div className="rounded-xl border-2 border-theme-orange/35 bg-theme-orange/10 px-4 py-4">
                <p className="text-base font-semibold text-text-primary">
                  Why might King use rhetorical appeals differently in these two
                  situations?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-primary">
                  The speech’s audience and the letter’s readers did not begin in the same
                  place. King may need to build trust, stir feeling, or use reasoning
                  differently with each group.
                </p>
              </div>
            </section>
          ) : null}

          {lessonState.phase === LESSON_PHASES.CHECK && activeQuestion ? (
            <section
              aria-labelledby="meet-check-heading"
              className="space-y-4 rounded-xl border-2 border-theme-blue/30 bg-theme-blue/[0.05] px-4 py-5 md:px-5"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
                  Quick coached check
                </p>
                <h2
                  id="meet-check-heading"
                  tabIndex={-1}
                  ref={phaseAnchorRef}
                  className="mt-1 text-lg font-semibold text-text-primary outline-none"
                >
                  Question {(lessonState.activeQuestionIndex || 0) + 1} of 5
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Choose the best answer. This helps you check understanding—it is not a
                  grade.
                </p>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-base font-semibold text-text-primary">
                  {activeQuestion.prompt}
                </legend>
                <div className="grid gap-2">
                  {activeQuestion.choices.map((choice) => {
                    const selected =
                      lessonState.answers[activeQuestion.id] === choice.id;
                    return (
                      <label
                        key={choice.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-left ${
                          selected
                            ? "border-theme-blue/40 bg-white"
                            : "border-border-soft/80 bg-white hover:border-theme-blue/20"
                        } ${lessonState.feedbackVisible ? "pointer-events-none" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`lesson-${activeQuestion.id}`}
                          className="mt-1 accent-theme-blue"
                          checked={selected}
                          disabled={lessonState.feedbackVisible}
                          onChange={() =>
                            setLessonState((prev) => applyAnswer(prev, choice.id))
                          }
                        />
                        <span className="text-sm leading-relaxed text-text-primary">
                          {choice.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {answerEvaluation ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
                    answerEvaluation.correct
                      ? "border-theme-green/35 bg-theme-green/10 text-text-primary"
                      : "border-theme-orange/40 bg-theme-orange/10 text-text-primary"
                  }`}
                >
                  {answerEvaluation.feedback}
                </div>
              ) : null}
            </section>
          ) : null}

          {complete ? (
            <section
              aria-labelledby="meet-ready-heading"
              className="rounded-xl border-2 border-theme-green/35 bg-theme-green/10 px-4 py-5 md:px-5"
            >
              <h2
                id="meet-ready-heading"
                tabIndex={-1}
                ref={phaseAnchorRef}
                className="text-lg font-semibold text-text-primary outline-none"
              >
                You’re ready to read like a writer.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-primary">
                You now know that King was not speaking and writing to the same audience in
                the same situation. As you find ethos, pathos, and logos, keep asking why each
                choice fits that particular audience and purpose.
              </p>
              <p
                role="status"
                aria-live="polite"
                className="mt-3 rounded-lg border border-theme-green/30 bg-white/70 px-3 py-2 text-sm font-medium text-text-primary"
              >
                Next: Begin reading like a writer — then start gathering evidence.
              </p>
              {completionError ? (
                <div
                  role="alert"
                  className="mt-3 space-y-3 rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-3"
                >
                  <p className="text-sm leading-relaxed text-text-primary">
                    {completionError}
                  </p>
                  <button
                    type="button"
                    onClick={handlePrimary}
                    disabled={savingCompletion}
                    className="rounded-lg bg-theme-blue px-5 py-2.5 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-theme-blue/30"
                  >
                    {savingCompletion ? "Saving your progress…" : "Try saving again"}
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-border-soft bg-white px-4 py-2.5 text-sm font-medium text-text-primary"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handlePrimary}
              disabled={primaryAction.kind === "waiting" || savingCompletion}
              aria-disabled={
                primaryAction.kind === "waiting" || savingCompletion
                  ? "true"
                  : undefined
              }
              className={`rounded-lg px-5 py-2.5 text-base font-semibold ${
                primaryAction.kind === "waiting" || savingCompletion
                  ? "cursor-not-allowed bg-gray-300 text-gray-500"
                  : "bg-theme-blue text-white"
              }`}
            >
              {savingCompletion ? "Saving your progress…" : primaryAction.label}
            </button>
            {!complete && continueHint ? (
              <p
                role="status"
                aria-live="polite"
                className="text-sm leading-relaxed text-text-muted sm:max-w-sm"
              >
                {continueHint}
              </p>
            ) : null}
          </div>
          {!complete && primaryAction.kind === "waiting" ? (
            <p className="text-xs leading-relaxed text-text-muted">
              Finish the current step above. Completing this lesson unlocks Begin
              reading like a writer.
            </p>
          ) : null}

          <section
            id="module-2-meet-need-help"
            className="scroll-mt-24 space-y-3 rounded-xl border border-theme-orange/20 bg-theme-orange/[0.03] px-4 py-4 md:px-5"
            aria-labelledby="module-2-meet-need-help-heading"
          >
            <p
              id="module-2-meet-need-help-heading"
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange"
            >
              Need Help
            </p>
            <details className="rounded-lg bg-white/60 px-3 py-2.5">
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                What is a primary audience?
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                The primary audience is who King directly addressed—the people present or
                named in the work.
              </p>
            </details>
            <details className="rounded-lg bg-white/60 px-3 py-2.5">
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                What is a broader audience?
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                The broader audience is everyone else King could reasonably expect the work to
                reach—like a national television audience or readers of a published letter.
              </p>
            </details>
            <details className="rounded-lg bg-white/60 px-3 py-2.5">
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                Do I need to memorize every detail?
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                No. Remember the big picture: different audiences and situations help explain
                why King may use ethos, pathos, and logos differently.
              </p>
            </details>
          </section>
        </div>
      </WorkspaceCenter>

      <WorkspaceGuide className="opacity-90">
        <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-5 py-5 text-left">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              From your teacher
            </p>
            <p className="text-sm leading-relaxed text-text-primary">
              Learn each situation on its own before you compare them. Comparison is clearer
              when you already know who King was talking to.
            </p>
          </div>
          <div className="space-y-2 border-t border-border-soft/60 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
              What comes next
            </p>
            <p className="text-sm leading-relaxed text-text-muted">
              After this lesson, you will begin reading like a writer—looking for ethos,
              pathos, and logos with these audiences and purposes in mind.
            </p>
          </div>
        </aside>
      </WorkspaceGuide>
    </WorkspaceColumns>
  );
}
