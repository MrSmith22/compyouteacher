"use client";

import { useEffect, useMemo, useState } from "react";
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
  getModule1WelcomeCacheKey,
} from "@/lib/storage/studentCache";
import {
  PARAPHRASE_MIN_LENGTH,
  PARAPHRASE_STEP,
  PROMPT_MC,
  PROMPT_STEP_COUNT,
  PROMPT_STEP_KEYS,
  advancePromptStep,
  buildPromptPersistencePayload,
  canAdvanceFromStep,
  getPromptStepStatusLabel,
  getResumeStepIndex,
  hydratePromptAnswers,
  isPromptBreakdownComplete,
  nudge,
} from "@/lib/module1/promptBreakdownHelpers";
import {
  MODULE1_AFTER_PROMPT_COPY,
  PROMPT_ASSIGNMENT_CARD_COPY,
  applyWelcomeCompletion,
  buildWelcomeCompletionRecord,
  getAssignmentWelcomePresentation,
  hydrateWelcomeRecord,
  resolveAssignmentWelcomeDisplay,
} from "@/lib/module1/assignmentWelcomeHelpers";
import ModuleOneWritingPath from "@/components/module1/ModuleOneWritingPath";

const MODULE1_NEED_HELP_ID = "module-1-need-help";

function MultipleChoice({ name, value, choices, onChange, labelledBy }) {
  return (
    <div
      className="space-y-2 mt-1"
      role="radiogroup"
      aria-labelledby={labelledBy}
    >
      {choices.map((choice) => (
        <label
          key={choice}
          className="flex items-start gap-2 cursor-pointer text-theme-dark min-h-[44px]"
        >
          <input
            type="radio"
            name={name}
            value={choice}
            checked={value === choice}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1"
          />
          <span>{choice}</span>
        </label>
      ))}
    </div>
  );
}

function scrollToNeedHelp(event) {
  event.preventDefault();
  const el = document.getElementById(MODULE1_NEED_HELP_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function NeedHelpJumpLink() {
  return (
    <a
      href={`#${MODULE1_NEED_HELP_ID}`}
      onClick={scrollToNeedHelp}
      className="inline-flex items-center gap-2 rounded-lg border-2 border-theme-orange/40 bg-theme-orange/10 px-3.5 py-2 text-sm font-semibold text-theme-orange shadow-soft transition hover:bg-theme-orange/15 focus:outline-none focus:ring-2 focus:ring-theme-orange/30"
    >
      Need Help
      <span className="text-xs font-medium text-theme-orange/80">
        ↓ assignment & tips
      </span>
    </a>
  );
}

function readWelcomeRaw(email) {
  if (typeof window === "undefined" || !email) return null;
  try {
    return window.localStorage.getItem(getModule1WelcomeCacheKey(email));
  } catch {
    return null;
  }
}

function writeWelcomeComplete(email) {
  if (typeof window === "undefined" || !email) return;
  try {
    window.localStorage.setItem(
      getModule1WelcomeCacheKey(email),
      JSON.stringify(buildWelcomeCompletionRecord())
    );
  } catch {
    /* ignore quota */
  }
}

function AssignmentWelcomeView({
  mode,
  onPrimary,
  returnStepIndex,
}) {
  const presentation = getAssignmentWelcomePresentation({
    mode,
    returnStepIndex,
  });

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
                data-testid="welcome-where"
              >
                {presentation.whereYouAre}
              </p>
            </div>
          </aside>
        </WorkspaceSidebar>

        <WorkspaceCenter className="min-w-0 order-1 lg:order-2 overflow-x-hidden">
          <div
            className="space-y-6 md:space-y-7 max-w-full"
            data-testid="assignment-welcome"
            data-welcome-mode={presentation.mode}
          >
            <header className="space-y-3 py-1 text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                {presentation.eyebrow}
              </p>
              <p
                className="text-sm font-medium text-theme-blue"
                data-testid="welcome-welcoming-line"
              >
                {presentation.welcomingLine}
              </p>
              <h1
                className="max-w-3xl text-[1.55rem] font-bold leading-[1.15] tracking-tight text-text-primary md:text-[2rem]"
                data-testid="welcome-dominant-heading"
              >
                {presentation.dominantHeading}
              </h1>
              {presentation.introParagraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base"
                >
                  {paragraph}
                </p>
              ))}
            </header>

            <ModuleOneWritingPath
              steps={presentation.processPreview}
              currentIndex={presentation.pathCurrentIndex}
              destinationLabel={presentation.destinationLabel}
            />

            <div
              className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15"
              data-testid="welcome-immediate-task"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                {presentation.immediateTaskLabel}
              </p>
              <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
                {presentation.immediateTask}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {presentation.immediateSupport}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-text-muted">
              {presentation.savingReassurance}
            </p>

            <p className="text-sm text-text-muted">
              <span className="font-medium text-text-primary">
                Where this is going:{" "}
              </span>
              {presentation.whereThisIsGoing}
            </p>

            <button
              type="button"
              onClick={onPrimary}
              data-testid="welcome-primary-action"
              aria-label={presentation.primaryActionLabel}
              className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded bg-theme-blue text-white focus:outline-none focus:ring-2 focus:ring-theme-blue/40"
            >
              {presentation.primaryActionLabel}
            </button>
          </div>
        </WorkspaceCenter>

        <WorkspaceGuide className="opacity-90 order-3">
          <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-5 py-5 text-left">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                From your teacher
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                {presentation.teacherGuidance}
              </p>
            </div>
          </aside>
        </WorkspaceGuide>
      </WorkspaceColumns>
    </ModulePageShell>
  );
}

export default function ModuleOnePromptPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { prompt } = mlkAssignmentDefinition;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeReference, setWelcomeReference] = useState(false);
  const [returnStepIndex, setReturnStepIndex] = useState(0);

  const [answers, setAnswers] = useState(() => hydratePromptAnswers(null));

  const stepKey = PROMPT_STEP_KEYS[stepIndex];
  const stepValue = answers[stepKey] || "";
  const stepNudge = nudge(stepKey, stepValue);
  const canAdvance = canAdvanceFromStep(answers, stepIndex);
  const isLastStep = stepIndex === PROMPT_STEP_COUNT - 1;
  const canSave = isPromptBreakdownComplete(answers);

  const statusLabel = useMemo(
    () => getPromptStepStatusLabel(stepIndex),
    [stepIndex]
  );

  useEffect(() => {
    async function load() {
      if (!session?.user?.email) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/module1/prompt");
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Could not load your saved work.");
          setLoading(false);
          return;
        }

        const hydratedAnswers = hydratePromptAnswers(data);
        const welcomeRaw = readWelcomeRaw(session.user.email);
        const welcomeRecord = hydrateWelcomeRecord(welcomeRaw);
        const decision = resolveAssignmentWelcomeDisplay({
          welcomeRecord,
          promptAnswers: hydratedAnswers,
          promptComplete: isPromptBreakdownComplete(hydratedAnswers),
        });

        setAnswers(hydratedAnswers);
        setStepIndex(getResumeStepIndex(hydratedAnswers));
        setShowWelcome(decision.showWelcome);
        setWelcomeReference(false);
        setHydrated(true);
      } catch (e) {
        setError("Could not load your saved work.");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") load();
  }, [session, status]);

  const setField = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartAssignment = () => {
    const email = session?.user?.email;
    if (!email) return;
    const before = { ...answers };
    writeWelcomeComplete(email);
    const result = applyWelcomeCompletion({
      answers: before,
      welcomeCompleted: true,
    });
    setAnswers(result.answers);
    setShowWelcome(false);
    setWelcomeReference(false);
    setStepIndex(getResumeStepIndex(result.answers));
  };

  const handleOpenWelcomeReference = () => {
    setReturnStepIndex(stepIndex);
    setWelcomeReference(true);
  };

  const handleReturnToQuestion = () => {
    setWelcomeReference(false);
    setStepIndex(returnStepIndex);
  };

  const handleBack = () => {
    setStepIndex((prev) => advancePromptStep(prev, "back"));
  };

  const handleNext = () => {
    if (!canAdvance) return;
    setStepIndex((prev) => advancePromptStep(prev, "next"));
  };

  const handleSave = async () => {
    if (!session?.user?.email || !canSave) return;

    setSaving(true);
    setError(null);

    try {
      const payload = buildPromptPersistencePayload(answers);
      const res = await fetch("/api/module1/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Could not save your work.");
        setSaving(false);
        return;
      }

      try {
        await logActivity(session.user.email, "module1_prompt_saved", {
          module: 1,
        });
      } catch {}

      router.push("/modules/1");
    } catch (e) {
      setError("Could not save your work.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <ModulePageShell>
        <p className="p-2 text-text-muted" data-testid="prompt-loading">
          Loading your assignment…
        </p>
      </ModulePageShell>
    );
  }

  if (!session?.user?.email) {
    return (
      <ModulePageShell>
        <p className="p-2 text-text-muted">Please sign in.</p>
      </ModulePageShell>
    );
  }

  if (showWelcome || welcomeReference) {
    return (
      <AssignmentWelcomeView
        mode={welcomeReference ? "reference" : "first_visit"}
        returnStepIndex={returnStepIndex}
        onPrimary={
          welcomeReference ? handleReturnToQuestion : handleStartAssignment
        }
      />
    );
  }

  const mc = PROMPT_MC[stepKey];
  const questionId = `prompt-step-${stepKey}-label`;

  return (
    <ModulePageShell>
      <WorkspaceColumns variant="drafting" className="gap-5 xl:gap-8">
        <WorkspaceSidebar className="opacity-80 lg:col-span-1">
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
              <p className="text-sm leading-relaxed text-text-primary">
                Step 1 of 2 · Break down the prompt
              </p>
              <p
                className="text-sm leading-relaxed text-text-primary"
                aria-live="polite"
                data-testid="prompt-step-status"
              >
                {statusLabel}
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                {MODULE1_AFTER_PROMPT_COPY.sidebarNext}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenWelcomeReference}
              className="text-left text-xs font-medium text-text-muted underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-theme-blue/30 rounded"
              data-testid="reopen-welcome-control"
            >
              How this writing process works
            </button>
          </aside>
        </WorkspaceSidebar>

        <WorkspaceCenter className="min-w-0 overflow-x-hidden">
          <div className="space-y-6 md:space-y-8 max-w-full">
            <header className="space-y-3 py-1 text-left md:py-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                Start here
              </p>
              <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
                Break down what this essay is asking you to do.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
                Answer one question at a time. This is a quick pre-writing
                check, not a graded quiz.
              </p>
              <div className="pt-1">
                <NeedHelpJumpLink />
              </div>
            </header>

            <section
              className="rounded-xl border-2 border-theme-blue/45 bg-white px-4 py-5 shadow-soft ring-1 ring-theme-blue/15 sm:px-5"
              aria-labelledby="module-1-prompt-context-heading"
              data-testid="teacher-assignment-card"
            >
              <h2
                id="module-1-prompt-context-heading"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue"
              >
                {PROMPT_ASSIGNMENT_CARD_COPY.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {PROMPT_ASSIGNMENT_CARD_COPY.introduction}
              </p>
              <blockquote
                className="mt-4 rounded-lg border-l-4 border-theme-blue/60 bg-surface-soft/50 px-4 py-3 text-sm leading-relaxed text-text-primary whitespace-pre-line"
                data-testid="exact-assignment-prompt"
              >
                {prompt}
              </blockquote>
            </section>

            <div className="rounded-xl border-2 border-theme-blue/35 bg-theme-blue/5 px-5 py-5 shadow-soft ring-1 ring-theme-blue/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
                Your job right now
              </p>
              <p
                id={questionId}
                className="mt-2 text-base font-semibold leading-snug text-text-primary"
              >
                {mc ? mc.label : PARAPHRASE_STEP.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {mc ? mc.help : PARAPHRASE_STEP.help}
              </p>

              <div className="mt-4" data-testid="prompt-active-step">
                {mc ? (
                  <MultipleChoice
                    name={stepKey}
                    value={stepValue}
                    choices={mc.choices}
                    onChange={(value) => setField(stepKey, value)}
                    labelledBy={questionId}
                  />
                ) : (
                  <>
                    <p className="text-sm text-theme-dark/70">
                      Write one or two sentences in your own words. There is no
                      single right phrasing—describe what you think the essay is
                      asking you to do.
                    </p>
                    <textarea
                      value={stepValue}
                      onChange={(e) => setField(stepKey, e.target.value)}
                      aria-labelledby={questionId}
                      className="mt-2 min-h-[7rem] w-full max-w-full resize-y rounded-xl border-2 border-theme-dark/20 bg-white px-4 py-3 text-base leading-7 text-text-primary shadow-soft focus:border-theme-blue/50 focus:outline-none focus:ring-2 focus:ring-theme-blue/20"
                      rows={4}
                      placeholder="Write one or two sentences."
                    />
                    <p className="mt-1 text-xs text-text-muted">
                      At least {PARAPHRASE_MIN_LENGTH} characters.
                    </p>
                  </>
                )}
                {stepNudge && (
                  <p
                    className="text-sm text-red-600 mt-2"
                    role="status"
                    data-testid="prompt-step-nudge"
                  >
                    {stepNudge}
                  </p>
                )}
              </div>

              {error && (
                <p className="mt-3 text-red-600 font-semibold" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={stepIndex === 0}
                  aria-label="Go back to previous prompt question"
                  className={`min-h-[44px] px-4 py-2 rounded border-2 text-theme-dark ${
                    stepIndex === 0
                      ? "border-gray-200 bg-gray-100 text-gray-400"
                      : "border-border-soft bg-white hover:bg-surface-soft"
                  }`}
                >
                  Back
                </button>

                {!isLastStep ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canAdvance}
                    aria-label="Continue to next prompt question"
                    className={`min-h-[44px] px-4 py-2 rounded text-white ${
                      !canAdvance ? "bg-gray-400" : "bg-theme-blue"
                    }`}
                  >
                    Next question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    aria-label={MODULE1_AFTER_PROMPT_COPY.saveContinueAria}
                    className={`min-h-[44px] w-full sm:w-auto px-4 py-2 rounded text-white ${
                      !canSave || saving ? "bg-gray-400" : "bg-theme-blue"
                    }`}
                  >
                    {saving
                      ? "Saving…"
                      : MODULE1_AFTER_PROMPT_COPY.saveContinueLabel}
                  </button>
                )}
              </div>

              {hydrated ? (
                <p className="sr-only" data-testid="prompt-hydrated">
                  Saved answers restored
                </p>
              ) : null}
            </div>

            <section
              id={MODULE1_NEED_HELP_ID}
              className="scroll-mt-24 space-y-4 rounded-xl border-2 border-theme-orange/25 bg-theme-orange/[0.04] px-4 py-5 md:px-5"
              aria-labelledby="module-1-need-help-heading"
            >
              <div className="space-y-1 text-left">
                <p
                  id="module-1-need-help-heading"
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange"
                >
                  Need Help
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  Extra coaching lives here. The full assignment stays visible
                  above while you answer.
                </p>
              </div>

              <details className="rounded-lg border border-border-soft/60 bg-white/70 px-4 py-2.5">
                <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                  Why this matters
                </summary>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-text-muted">
                  <p>
                    Strong writers pause, read carefully, and translate the
                    prompt into a simple plan before they learn new vocabulary.
                  </p>
                  <p>{MODULE1_AFTER_PROMPT_COPY.needHelpVocabNote}</p>
                </div>
              </details>

              <details className="rounded-lg border border-border-soft/60 bg-white/70 px-4 py-2.5">
                <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                  Self-check before you continue
                </summary>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
                  <li>You can name the main action the assignment asks for.</li>
                  <li>You know what kind of writing you are producing.</li>
                  <li>
                    Your paraphrase says the task in your own words in one or
                    two sentences.
                  </li>
                </ul>
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
                {PROMPT_ASSIGNMENT_CARD_COPY.teacherGuidance}
              </p>
            </div>

            <div className="space-y-2 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                What comes next
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                {MODULE1_AFTER_PROMPT_COPY.guideNext}
              </p>
            </div>
          </aside>
        </WorkspaceGuide>
      </WorkspaceColumns>
    </ModulePageShell>
  );
}
