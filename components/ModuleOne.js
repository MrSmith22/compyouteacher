"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ModulePageShell from "@/components/layout/ModulePageShell";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import { mlkAssignmentDefinition } from "@/lib/assignments";
import { logActivity } from "@/lib/logActivity";
import {
  clearModule1Step2Draft,
  makeStudentKey,
} from "@/lib/storage/studentCache";
import {
  advanceQuizIndex,
  allQuizItemsAnswered,
  canAdvanceQuizItem,
  canSubmitQuiz,
  getActiveQuiz,
  getQuizStatusLabel,
  normalizeQuizAnswers,
  QUIZ_CONTENT_VERSION,
  resolveQuizVersionMigration,
} from "@/lib/module1/quizHelpers";
import {
  advanceStep2FromLearn,
  advanceStep2FromTransition,
  canFinishVocabulary,
  formatEssayUseLine,
  getStep2PresentationModel,
  hydrateStep2Draft,
  retreatStep2,
  STEP2_STAGES,
} from "@/lib/module1/step2MicrostageHelpers";
import ModuleOneVocabularyVisual from "@/components/module1/ModuleOneVocabularyVisual";

const VIDEO_SRC = "/videos/Ethos Pathos and Logos Explained.mp4";

function readStep2Draft(email) {
  if (typeof window === "undefined" || !email) return null;
  try {
    const raw = window.localStorage.getItem(
      makeStudentKey(email, ["module1", "step2"])
    );
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStep2Draft(email, draft) {
  if (typeof window === "undefined" || !email) return;
  try {
    window.localStorage.setItem(
      makeStudentKey(email, ["module1", "step2"]),
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })
    );
  } catch {
    /* ignore quota */
  }
}

export default function ModuleOne({ savedStudentParaphrase = "" }) {
  const { prompt } = mlkAssignmentDefinition;
  const quiz = getActiveQuiz();
  const router = useRouter();
  const { data: session } = useSession();
  const email = session?.user?.email ?? "";
  const hydratedRef = useRef(false);

  const [stage, setStage] = useState(STEP2_STAGES.TRANSITION);
  const [termIndex, setTermIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(() =>
    normalizeQuizAnswers([], quiz.length)
  );
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizSaveError, setQuizSaveError] = useState("");
  const [itemFeedback, setItemFeedback] = useState(null);
  const [sayAnotherWayOpen, setSayAnotherWayOpen] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  // Resume Step 2 draft on ordinary revisit / reload
  useEffect(() => {
    if (!email || hydratedRef.current) return;
    hydratedRef.current = true;
    const raw = readStep2Draft(email);
    const draft = hydrateStep2Draft(raw, {
      quizLength: quiz.length,
      currentQuizVersion: QUIZ_CONTENT_VERSION,
    });
    const migration = resolveQuizVersionMigration({
      draftAnswers: draft.quizAnswers,
      draftVersion: draft.quizVersion,
      currentVersion: QUIZ_CONTENT_VERSION,
    });

    setStage(draft.stage);
    setTermIndex(draft.termIndex);
    if (draft.stage === STEP2_STAGES.QUIZ) {
      setUserAnswers(migration.answers);
      setQuizIndex(migration.resumeIndex);
    } else {
      setUserAnswers(normalizeQuizAnswers(draft.quizAnswers, quiz.length));
      setQuizIndex(draft.quizIndex);
    }
    setDraftReady(true);
  }, [email, quiz.length]);

  // Persist draft for reload (ordinary revisit)
  useEffect(() => {
    if (!email || !draftReady || quizSubmitted) return;
    writeStep2Draft(email, {
      stage,
      termIndex,
      quizIndex,
      quizAnswers: userAnswers,
      quizVersion: QUIZ_CONTENT_VERSION,
    });
  }, [
    email,
    draftReady,
    stage,
    termIndex,
    quizIndex,
    userAnswers,
    quizSubmitted,
  ]);

  const presentation = getStep2PresentationModel({
    stage,
    termIndex,
    quizIndex,
    quizLength: quiz.length,
    paraphrase: savedStudentParaphrase,
  });

  const activeQuestion = quiz[quizIndex];
  const isLastQuizItem = quizIndex === quiz.length - 1;
  const canAdvanceItem = canAdvanceQuizItem(userAnswers, quizIndex);
  const canFinalize = canSubmitQuiz(userAnswers, { quizSubmitted });

  const handleAnswerChange = (index, value) => {
    setUserAnswers((prev) => {
      const updatedAnswers = normalizeQuizAnswers(prev, quiz.length);
      updatedAnswers[index] = value;
      return updatedAnswers;
    });
    const expected = String(quiz[index]?.answer || "").toLowerCase();
    setItemFeedback(
      value && value.toLowerCase() === expected ? "correct" : "incorrect"
    );
  };

  const isQuizCorrect = (index) =>
    Boolean(
      userAnswers[index] &&
        userAnswers[index].toLowerCase() ===
          String(quiz[index]?.answer || "").toLowerCase()
    );

  const getScoreData = () => {
    const total = quiz.length;
    const correct = quiz.reduce(
      (acc, _q, i) => acc + (isQuizCorrect(i) ? 1 : 0),
      0
    );
    return {
      correct,
      total,
      percent: Math.round((correct / total) * 100),
    };
  };

  const handlePrimaryContinue = () => {
    if (stage === STEP2_STAGES.TRANSITION) {
      const next = advanceStep2FromTransition();
      setStage(next.stage);
      setTermIndex(next.termIndex);
      setSayAnotherWayOpen(false);
      return;
    }
    if (stage === STEP2_STAGES.LEARN) {
      const next = advanceStep2FromLearn(termIndex);
      setStage(next.stage);
      setTermIndex(next.termIndex);
      if (next.quizIndex != null) setQuizIndex(next.quizIndex);
      setSayAnotherWayOpen(false);
      setItemFeedback(null);
    }
  };

  const handleBack = () => {
    if (stage === STEP2_STAGES.QUIZ) {
      if (quizIndex > 0) {
        setQuizIndex((prev) => {
          const next = advanceQuizIndex(prev, "back", quiz.length);
          const answer = userAnswers[next];
          if (answer) {
            const expected = String(quiz[next]?.answer || "").toLowerCase();
            setItemFeedback(
              answer.toLowerCase() === expected ? "correct" : "incorrect"
            );
          } else {
            setItemFeedback(null);
          }
          return next;
        });
        return;
      }
    }
    const next = retreatStep2({ stage, termIndex, quizIndex });
    setStage(next.stage);
    setTermIndex(next.termIndex ?? 0);
    if (next.quizIndex != null) setQuizIndex(next.quizIndex);
    setSayAnotherWayOpen(false);
    setItemFeedback(null);
  };

  const handleQuizNext = () => {
    if (!canAdvanceItem) return;
    setQuizIndex((prev) => {
      const next = advanceQuizIndex(prev, "next", quiz.length);
      const answer = userAnswers[next];
      if (answer) {
        const expected = String(quiz[next]?.answer || "").toLowerCase();
        setItemFeedback(
          answer.toLowerCase() === expected ? "correct" : "incorrect"
        );
      } else {
        setItemFeedback(null);
      }
      return next;
    });
  };

  const handleSubmitQuiz = async () => {
    if (quizSubmitted || quizSaving) return;
    if (!allQuizItemsAnswered(userAnswers)) {
      setQuizSaveError("Answer every quiz question before submitting.");
      return;
    }
    if (!session?.user?.email) {
      setQuizSaveError("You must be signed in to submit the quiz.");
      return;
    }

    const userEmail = session.user.email;
    setQuizSaving(true);
    setQuizSaveError("");

    try {
      const response = await fetch("/api/module1/quiz-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: userAnswers,
          // Client score is ignored by the server; included only as a non-authority field.
          score: 9999,
        }),
      });
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || !payload?.ok) {
        setQuizSaving(false);
        setQuizSaveError(
          payload?.error?.message ||
            "Could not save your quiz. Your answers are still here — try again."
        );
        return;
      }

      const percent =
        typeof payload.percent === "number"
          ? payload.percent
          : Math.round(
              (Number(payload.score) / Number(payload.total || quiz.length)) *
                100
            );

      try {
        await logActivity(userEmail, "quiz_submitted", 1, {
          quiz: "rhetoric_module1",
          quiz_version: payload.quizVersion ?? QUIZ_CONTENT_VERSION,
          correct: payload.score,
          total: payload.total,
          percent,
          attemptId: payload.attemptId ?? null,
        });
      } catch (err) {
        console.error("Error logging quiz_submitted for Module 1:", err);
      }

      try {
        await logActivity(userEmail, "module_completed", 1, {
          quiz: "rhetoric_module1",
          quiz_version: payload.quizVersion ?? QUIZ_CONTENT_VERSION,
          correct: payload.score,
          total: payload.total,
          percent,
        });
      } catch (err) {
        console.error("Error logging module_completed for Module 1:", err);
      }

      clearModule1Step2Draft(userEmail);
      setQuizSubmitted(true);
      setQuizSaving(false);
      router.push(`/modules/1/success?score=${percent}`);
    } catch (err) {
      console.error("Unexpected error saving Module 1 quiz result:", err);
      setQuizSaving(false);
      setQuizSaveError(
        "Could not save your quiz. Your answers are still here — try again."
      );
    }
  };

  const term = presentation.activeTerm;
  const showBack = stage !== STEP2_STAGES.TRANSITION;

  return (
    <ModulePageShell>
      <WorkspaceColumns
        variant="drafting"
        className="gap-5 xl:gap-8 overflow-x-hidden"
      >
        <WorkspaceSidebar className="opacity-80 lg:col-span-1 order-2 lg:order-1">
          <aside className="space-y-4 rounded-xl bg-surface-soft/70 px-4 py-5 text-left">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                Module 1
              </p>
              <p className="text-sm font-semibold text-text-primary">
                Understand the Assignment
              </p>
            </div>
            <div className="space-y-1 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                Where you are
              </p>
              <p
                className="text-sm leading-relaxed text-text-primary"
                data-testid="step2-where"
              >
                {presentation.whereYouAre}
              </p>
              {presentation.progressLabel ? (
                <p
                  className="text-sm leading-relaxed text-text-muted"
                  aria-live="polite"
                  data-testid="step2-progress"
                >
                  {presentation.progressLabel}
                </p>
              ) : null}
            </div>

            {presentation.paraphrase ? (
              <details className="border-t border-border-soft/60 pt-4">
                <summary className="cursor-pointer list-none text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  Your prompt paraphrase (reference)
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-text-primary whitespace-pre-line">
                  {presentation.paraphrase}
                </p>
              </details>
            ) : null}
          </aside>
        </WorkspaceSidebar>

        <WorkspaceCenter className="min-w-0 order-1 lg:order-2">
          <div
            className="space-y-5 md:space-y-6 overflow-x-hidden"
            data-testid="step2-active-task"
            data-stage={stage}
          >
            <header className="space-y-3 py-1 text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                Your question
              </p>
              <h1
                className="max-w-3xl text-[1.55rem] font-bold leading-[1.15] tracking-tight text-text-primary md:text-[2rem]"
                data-testid="step2-dominant-question"
              >
                {presentation.dominantQuestion}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
                {presentation.strategyExplanation}
              </p>
            </header>

            {presentation.requiredContext && stage === STEP2_STAGES.TRANSITION ? (
              <div className="rounded-xl border border-border-soft/70 bg-surface-soft/40 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                  Context
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-primary">
                  {presentation.requiredContext}
                </p>
              </div>
            ) : null}

            {stage === STEP2_STAGES.LEARN && term ? (
              <section
                className="space-y-4 rounded-xl border-2 border-theme-blue/35 bg-theme-blue/5 px-4 py-5 shadow-soft sm:px-5"
                aria-labelledby="vocab-definition-heading"
                data-testid="step2-vocab-term"
                data-term-id={term.id}
              >
                <div className="space-y-2">
                  <p
                    id="vocab-definition-heading"
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue"
                  >
                    Definition
                  </p>
                  <p className="text-base font-semibold leading-snug text-text-primary">
                    {term.definition}
                  </p>
                  <p className="text-sm leading-relaxed text-text-muted">
                    {term.plainLanguage}
                  </p>
                </div>

                <ModuleOneVocabularyVisual visual={term.visual} />

                <div className="rounded-lg border border-border-soft/70 bg-white/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                    King example
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-text-primary">
                    {term.example}
                  </p>
                </div>

                <div
                  className="rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-4 py-3"
                  data-testid="vocab-essay-use"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                    {formatEssayUseLine(term).label}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-text-primary">
                    {formatEssayUseLine(term).action}
                  </p>
                </div>

                <details
                  open={sayAnotherWayOpen}
                  onToggle={(e) =>
                    setSayAnotherWayOpen(e.currentTarget.open)
                  }
                  className="rounded-lg border border-border-soft/60 bg-white/70 px-4 py-2"
                >
                  <summary className="cursor-pointer list-none text-sm font-medium text-text-muted">
                    Optional: say it another way
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {term.sayAnotherWay}
                  </p>
                </details>
              </section>
            ) : null}

            {stage === STEP2_STAGES.QUIZ && activeQuestion ? (
              <section
                className="space-y-4 rounded-xl border-2 border-theme-blue/35 bg-theme-blue/5 px-4 py-5 shadow-soft overflow-x-hidden"
                aria-labelledby="module-1-quiz-heading"
                data-testid="quiz-active-item"
              >
                <div className="space-y-2">
                  <h2
                    id="module-1-quiz-heading"
                    className="text-lg font-semibold text-text-primary"
                  >
                    Check your understanding
                  </h2>
                  <p
                    className="text-sm font-medium text-text-primary"
                    data-testid="quiz-step-status"
                  >
                    {getQuizStatusLabel(quizIndex, quiz.length)}
                  </p>
                </div>

                <div className="max-w-full">
                  <p
                    id={`quiz-q-${quizIndex}-label`}
                    className="font-medium text-theme-dark"
                  >
                    {activeQuestion.question}
                  </p>
                  <select
                    value={userAnswers[quizIndex] || ""}
                    onChange={(e) =>
                      handleAnswerChange(quizIndex, e.target.value)
                    }
                    aria-labelledby={`quiz-q-${quizIndex}-label`}
                    aria-label={`Quiz question ${quizIndex + 1} answer`}
                    className="mt-3 w-full max-w-full min-h-[44px] rounded-lg border border-border-soft p-2 focus:outline-none focus:ring-2 focus:ring-theme-blue/40"
                    disabled={quizSubmitted}
                  >
                    <option value="">Select an answer</option>
                    {activeQuestion.options.map((option, i) => (
                      <option key={i} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {(itemFeedback || quizSubmitted) && (
                    <p
                      className={`mt-2 text-sm font-semibold ${
                        isQuizCorrect(quizIndex)
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                      role="status"
                      data-testid="quiz-item-feedback"
                    >
                      {isQuizCorrect(quizIndex) ? "Correct" : "Incorrect"}
                    </p>
                  )}
                </div>
              </section>
            ) : null}

            <details className="rounded-xl border border-border-soft/70 bg-white/80 px-4 py-3 shadow-soft">
              <summary className="cursor-pointer list-none text-sm font-medium text-text-muted">
                Optional: watch the rhetoric video
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Optional reference only. Every quiz question can be answered from
                the on-screen vocabulary terms.
              </p>
              <div className="mt-3">
                <video
                  width="100%"
                  height="315"
                  controls
                  className="rounded-xl max-w-full"
                >
                  <source src={VIDEO_SRC} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </details>

            <p className="text-sm text-text-muted">
              <span className="font-medium text-text-primary">What comes next: </span>
              {presentation.whatComesNext}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {showBack ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={quizSubmitted}
                  aria-label="Go back"
                  className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded border-2 border-border-soft bg-white text-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-blue/40"
                >
                  Back
                </button>
              ) : null}

              {stage === STEP2_STAGES.QUIZ ? (
                !isLastQuizItem ? (
                  <button
                    type="button"
                    onClick={handleQuizNext}
                    disabled={!canAdvanceItem || quizSubmitted}
                    aria-label="Continue to next quiz question"
                    className={`min-h-[44px] w-full sm:w-auto px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-theme-blue/40 ${
                      !canAdvanceItem || quizSubmitted
                        ? "bg-gray-400"
                        : "bg-theme-blue"
                    }`}
                  >
                    Next question
                  </button>
                ) : (
                  !quizSubmitted && (
                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      disabled={!canFinalize || quizSaving}
                      aria-label="Submit vocabulary quiz"
                      data-testid="module1-quiz-submit"
                      className={`min-h-[44px] w-full sm:w-auto px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-theme-blue/40 ${
                        !canFinalize || quizSaving
                          ? "bg-gray-400"
                          : "bg-theme-blue"
                      }`}
                    >
                      {quizSaving ? "Saving your quiz…" : "Finish"}
                    </button>
                  )
                )
              ) : (
                <button
                  type="button"
                  onClick={handlePrimaryContinue}
                  aria-label={presentation.primaryActionLabel}
                  data-testid="step2-primary-action"
                  className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded bg-theme-blue text-white focus:outline-none focus:ring-2 focus:ring-theme-blue/40"
                >
                  {stage === STEP2_STAGES.LEARN && canFinishVocabulary(termIndex)
                    ? "Check my understanding"
                    : presentation.primaryActionLabel}
                </button>
              )}
            </div>

            {stage === STEP2_STAGES.QUIZ &&
            !allQuizItemsAnswered(userAnswers) &&
            isLastQuizItem ? (
              <p
                className="text-sm text-red-600"
                role="status"
                data-testid="quiz-incomplete-gate"
              >
                Answer every quiz question before submitting.
              </p>
            ) : null}

            {stage === STEP2_STAGES.QUIZ && quizSaving ? (
              <p
                className="text-sm text-text-muted"
                aria-live="polite"
                data-testid="module1-quiz-saving"
              >
                Saving your quiz…
              </p>
            ) : null}

            {stage === STEP2_STAGES.QUIZ && quizSaveError ? (
              <div className="space-y-2" data-testid="module1-quiz-save-error">
                <p role="alert" className="text-sm text-red-600">
                  {quizSaveError}
                </p>
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={quizSaving || !canFinalize}
                  data-testid="module1-quiz-retry"
                  className="min-h-[44px] px-4 py-2 rounded bg-theme-blue text-white disabled:bg-gray-400"
                >
                  Try saving again
                </button>
              </div>
            ) : null}
          </div>
        </WorkspaceCenter>

        <WorkspaceGuide className="opacity-90 order-3">
          <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-5 py-5 text-left">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                From your teacher
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                Precise words help you say big ideas in fewer words. Learn them
                now so later modules feel clearer when you analyze evidence.
              </p>
            </div>

            <div className="space-y-2 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                What comes next
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                After this step, you move to Module 2 to gather the two King
                source texts you will analyze with these words.
              </p>
            </div>

            <details className="rounded-lg border border-border-soft/60 bg-white/60 px-4 py-2.5">
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                Essay assignment (reference)
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-text-muted whitespace-pre-line">
                {prompt}
              </p>
            </details>
          </aside>
        </WorkspaceGuide>
      </WorkspaceColumns>
    </ModulePageShell>
  );
}
