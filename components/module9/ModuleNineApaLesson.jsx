"use client";

import { useEffect, useId, useRef } from "react";
import ModuleNineApaVisual from "@/components/module9/ModuleNineApaVisual";
import ModuleNineApaQuickGuide from "@/components/module9/ModuleNineApaQuickGuide";
import {
  MODULE9_APA_CONCEPTS,
  MODULE9_APA_ENTRY,
  MODULE9_APA_HANDOFF,
  advanceApaConcept,
  canContinueApaConcept,
  evaluateApaResponse,
  recordApaAttempt,
  retreatApaConcept,
  summarizeApaLesson,
} from "@/lib/module9/module9ApaLearning";

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2";

/**
 * One-concept Teach → Show → Try → Explain → Continue lesson.
 */
export default function ModuleNineApaLesson({
  lessonState,
  onLessonStateChange,
  onComplete,
  alreadyPersisted = false,
}) {
  const headingRef = useRef(null);
  const feedbackId = useId();
  const concepts = MODULE9_APA_CONCEPTS;
  const concept = concepts[lessonState.conceptIndex];
  const response = lessonState.responses[concept.id] || {};
  const evaluation = evaluateApaResponse(concept, response.selectedOptionId);
  const canContinue = canContinueApaConcept(lessonState, concept.id);
  const progressLabel = `APA move ${lessonState.conceptIndex + 1} of ${concepts.length}`;

  useEffect(() => {
    if (!headingRef.current) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    headingRef.current.focus({ preventScroll: Boolean(reduceMotion) });
    if (!reduceMotion) {
      headingRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [lessonState.conceptIndex, lessonState.completed]);

  if (alreadyPersisted || lessonState.completed) {
    return (
      <section
        className="space-y-4 overflow-x-hidden rounded-xl border border-theme-green/30 bg-theme-green/5 px-4 py-5 shadow-soft md:px-6"
        data-testid="module9-apa-lesson-complete"
      >
        <h2 className="text-xl font-bold text-text-primary">{MODULE9_APA_HANDOFF.title}</h2>
        <p className="text-sm leading-relaxed text-text-primary">
          {MODULE9_APA_HANDOFF.body}
        </p>
        <ModuleNineApaQuickGuide defaultOpen compact={false} />
        {!alreadyPersisted ? (
          <button
            type="button"
            onClick={() => onComplete?.(summarizeApaLesson(lessonState, concepts))}
            className={`min-h-[44px] rounded-lg bg-theme-blue px-4 py-2 text-sm font-semibold text-white shadow-soft ${FOCUS_RING}`}
            data-testid="module9-apa-continue-to-doc"
          >
            Continue to open your Google Doc
          </button>
        ) : null}
      </section>
    );
  }

  const onSelect = (optionId) => {
    onLessonStateChange?.(recordApaAttempt(lessonState, concept.id, optionId));
  };

  const onBack = () => {
    onLessonStateChange?.(retreatApaConcept(lessonState));
  };

  const onContinue = () => {
    if (!canContinue) return;
    if (lessonState.conceptIndex >= concepts.length - 1) {
      const next = { ...lessonState, completed: true };
      onLessonStateChange?.(next);
      return;
    }
    onLessonStateChange?.(advanceApaConcept(lessonState, concepts));
  };

  return (
    <div className="space-y-4 overflow-x-hidden" data-testid="module9-apa-lesson">
      <section className="rounded-xl border border-border-soft bg-white px-4 py-4 shadow-soft md:px-6">
        <h2 className="text-xl font-bold text-text-primary md:text-2xl">
          {MODULE9_APA_ENTRY.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-primary">
          {MODULE9_APA_ENTRY.lead}
        </p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-text-primary">
          {MODULE9_APA_ENTRY.framing}
        </p>
      </section>

      <ModuleNineApaQuickGuide
        highlightConceptId={concept.id}
        defaultOpen={false}
      />

      <section
        className="space-y-4 rounded-xl border-2 border-theme-orange/35 bg-theme-orange/[0.06] px-4 py-5 shadow-soft md:px-6"
        data-testid="module9-apa-concept"
        data-concept-id={concept.id}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-theme-orange"
          data-testid="module9-apa-progress"
        >
          {progressLabel}
        </p>
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold leading-snug text-text-primary md:text-xl"
          data-testid="module9-apa-concept-heading"
        >
          {concept.title}
        </h3>

        <div className="space-y-2" data-testid="module9-apa-teaching">
          <p className="text-sm leading-relaxed text-text-primary">
            <span className="font-semibold">What to do: </span>
            {concept.whatToDo}
          </p>
          <p className="text-sm leading-relaxed text-text-primary">
            <span className="font-semibold">Why it matters: </span>
            {concept.whyItMatters}
          </p>
          <p
            className="rounded-lg border border-border-soft/70 bg-white/90 px-3 py-2 text-sm leading-relaxed text-text-primary"
            data-testid="module9-apa-assignment-rule"
          >
            <span className="font-semibold">For this assignment: </span>
            {concept.assignmentRule}
          </p>
        </div>

        <ModuleNineApaVisual
          visualId={concept.visualId}
          caption={concept.visualCaption}
          alt={concept.visualAlt}
        />

        <fieldset className="space-y-2" data-testid="module9-apa-try-it">
          <legend className="text-base font-bold text-text-primary">
            Try it
          </legend>
          <p className="text-sm leading-relaxed text-text-primary" id={`${feedbackId}-prompt`}>
            {concept.practicePrompt}
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`${feedbackId}-prompt`}
            className="space-y-2"
          >
            {concept.options.map((option) => {
              const checked = response.selectedOptionId === option.id;
              const showState = response.feedbackSeen && checked;
              return (
                <label
                  key={option.id}
                  className={[
                    "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm leading-snug transition",
                    "focus-within:outline-none focus-within:ring-2 focus-within:ring-theme-dark focus-within:ring-offset-2",
                    checked
                      ? "border-theme-blue bg-white shadow-soft ring-1 ring-theme-blue/25"
                      : "border-border-soft bg-white/80 hover:bg-white",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name={`module9-apa-${concept.id}`}
                    value={option.id}
                    checked={checked}
                    className="mt-1 h-4 w-4 shrink-0 accent-theme-blue"
                    onChange={() => onSelect(option.id)}
                  />
                  <span className="flex-1 text-text-primary">
                    {option.label}
                    {showState ? (
                      <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        {option.correct ? "Matches the target" : "Needs a closer look"}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {response.feedbackSeen && evaluation.feedback ? (
          <div
            id={feedbackId}
            role="status"
            aria-live="polite"
            className="rounded-lg border border-border-soft bg-white px-3 py-3 text-sm leading-relaxed text-text-primary"
            data-testid="module9-apa-feedback"
            data-feedback-correct={evaluation.correct ? "true" : "false"}
          >
            <p className="font-semibold">
              {evaluation.correct ? "That works." : "Let’s look closer."}
            </p>
            <p className="mt-1">{evaluation.feedback}</p>
          </div>
        ) : (
          <p className="text-sm text-text-muted" role="status" aria-live="polite">
            Choose one answer to see teaching feedback. You can continue after you
            learn from it—even if your first try was not the target answer.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft/60 pt-3">
          <button
            type="button"
            onClick={onBack}
            disabled={lessonState.conceptIndex === 0}
            className={`min-h-[44px] rounded-lg bg-surface-soft px-4 py-2 text-sm font-medium text-text-primary disabled:opacity-50 ${FOCUS_RING}`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            aria-disabled={!canContinue}
            className={`min-h-[44px] rounded-lg bg-theme-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${FOCUS_RING}`}
            data-testid="module9-apa-continue"
          >
            {lessonState.conceptIndex >= concepts.length - 1
              ? "Finish these APA moves"
              : "Continue"}
          </button>
        </div>
      </section>
    </div>
  );
}
