"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { logActivity } from "@/lib/logActivity";
import Panel from "@/components/ui/Panel";
import ProgressDots from "@/components/ui/ProgressDots";
import ModulePageShell from "@/components/layout/ModulePageShell";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import {
  ReferenceSection,
  WorkingSetSection,
} from "@/components/module3/ModuleThreeDeskFrame";
import { MLK_ASSIGNMENT_NAME, mlkAssignmentDefinition } from "@/lib/assignments";
import {
  evaluatePersistedLetter,
  evaluatePersistedSpeech,
  fetchModule2SourcesFromApi,
  getPersistedLetterText,
  getPersistedSpeechText,
  hasPersistedLetter,
  hasPersistedSpeech,
  isModule2SourcePreparationComplete,
} from "@/lib/module2/module2SourceReadiness";

const WIZARD_STEPS = [
  { stage: 0, label: "Get ready" },
  { stage: 1, label: "Can we trust these sources?" },
  { stage: 2, label: "Save the speech" },
  { stage: 3, label: "Save the letter" },
  { stage: 4, label: "Evidence notebook complete" },
  { stage: 6, label: "Begin reading like a writer" },
];

function wizardStepNumber(stage) {
  if (stage === 5) return 6;
  const index = WIZARD_STEPS.findIndex((step) => step.stage === stage);
  return index >= 0 ? index + 1 : 1;
}

function WizardProgressList({ stage }) {
  const currentIdx = WIZARD_STEPS.findIndex((step) => step.stage === stage);
  return (
    <ol className="space-y-1.5">
      {WIZARD_STEPS.map((step, index) => {
        const isCompleted = index < currentIdx;
        const isCurrent = index === currentIdx;
        return (
          <li
            key={step.label}
            className={`flex items-start gap-2 text-xs leading-snug ${
              isCurrent
                ? "font-semibold text-theme-blue"
                : isCompleted
                  ? "text-theme-green"
                  : "text-text-muted"
            }`}
          >
            <span className="mt-0.5 w-4 shrink-0 tabular-nums">
              {isCompleted ? "✓" : index + 1}
            </span>
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

const MODULE2_SOURCES = mlkAssignmentDefinition.sources;
const SPEECH_SOURCE = MODULE2_SOURCES.speech;
const LETTER_SOURCE = MODULE2_SOURCES.letter;
const SPEECH_URL = SPEECH_SOURCE.officialSourceUrl;
const LETTER_URL = LETTER_SOURCE.officialSourceUrl;

export default function ModuleTwoSourcePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stage, setStage] = useState(0);
  const [sources, setSources] = useState(null);
  const [loading, setLoading] = useState(true);

  // Knowledge check stage 1
  const [knowledgeCheckAnswers, setKnowledgeCheckAnswers] = useState([]);
  const [knowledgeCheckSubmitted, setKnowledgeCheckSubmitted] = useState(false);

  // Stage 2: speech
  const [speechSourceUrl, setSpeechSourceUrl] = useState(SPEECH_URL);
  const [speechFullText, setSpeechFullText] = useState("");
  const [savingSpeech, setSavingSpeech] = useState(false);
  const [speechSavedOk, setSpeechSavedOk] = useState(false);
  const [speechSaveError, setSpeechSaveError] = useState(null);

  // Stage 3: letter
  const [letterSourceUrl, setLetterSourceUrl] = useState(LETTER_URL);
  const [letterFullText, setLetterFullText] = useState("");
  const [savingLetter, setSavingLetter] = useState(false);
  const [letterSavedOk, setLetterSavedOk] = useState(false);
  const [letterSaveError, setLetterSaveError] = useState(null);

  const applyLoadedSources = useCallback((data) => {
    setSources(data);
    if (data?.speech_full_text) setSpeechFullText(data.speech_full_text);
    if (data?.speech_source_url) setSpeechSourceUrl(data.speech_source_url);
    if (data?.letter_full_text) setLetterFullText(data.letter_full_text);
    if (data?.letter_source_url) setLetterSourceUrl(data.letter_source_url);
    setSpeechSavedOk(hasPersistedSpeech(data));
    setLetterSavedOk(hasPersistedLetter(data));
  }, []);

  const fetchSources = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchModule2SourcesFromApi();
      if (data) applyLoadedSources(data);
    } catch (err) {
      console.error("Error loading module2 sources:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [applyLoadedSources]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchSources();
    } else {
      setLoading(false);
    }
  }, [session?.user?.email, fetchSources]);

  useEffect(() => {
    if (!session?.user?.email) return;
    logActivity(session.user.email, "module_started", { module: 2 });
  }, [session]);

  const canReachStage = (targetStage) => {
    if (targetStage <= 0) return true;
    if (targetStage === 1) return true;
    if (targetStage === 2) return knowledgeCheckSubmitted;
    if (targetStage === 3) return hasPersistedSpeech(sources);
    if (targetStage === 4) {
      return hasPersistedSpeech(sources) && hasPersistedLetter(sources);
    }
    if (targetStage >= 5) return isModule2SourcePreparationComplete(sources);
    return false;
  };

  const goToStep = (stepNum) => {
    const step = WIZARD_STEPS[stepNum - 1];
    if (!step || !canReachStage(step.stage)) return;
    setStage(step.stage);
  };

  useEffect(() => {
    if (stage === 5) {
      setStage(6);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 4 && session?.user?.email) {
      fetchSources({ silent: true });
    }
  }, [stage, session?.user?.email, fetchSources]);

  const saveSpeech = async () => {
    if (!session?.user?.email) return false;
    setSavingSpeech(true);
    setSpeechSaveError(null);
    setSpeechSavedOk(false);
    try {
      const res = await fetch("/api/module2/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speech_source_url: speechSourceUrl.trim(),
          speech_full_text: speechFullText.trim(),
        }),
      });
      if (!res.ok) {
        setSpeechSaveError("Could not save your speech copy. Please try again.");
        return false;
      }

      const verified = await fetchModule2SourcesFromApi();
      if (!verified || !hasPersistedSpeech(verified)) {
        setSpeechSaveError(
          "Your speech copy did not save correctly. Please try again."
        );
        return false;
      }

      applyLoadedSources(verified);
      setSpeechSavedOk(true);
      return true;
    } catch (err) {
      console.error("Error saving speech:", err);
      setSpeechSaveError("Could not save your speech copy. Please try again.");
      return false;
    } finally {
      setSavingSpeech(false);
    }
  };

  const saveLetter = async () => {
    if (!session?.user?.email) return false;
    setSavingLetter(true);
    setLetterSaveError(null);
    setLetterSavedOk(false);
    try {
      const res = await fetch("/api/module2/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letter_source_url: letterSourceUrl.trim(),
          letter_full_text: letterFullText.trim(),
        }),
      });
      if (!res.ok) {
        setLetterSaveError("Could not save your letter copy. Please try again.");
        return false;
      }

      const verified = await fetchModule2SourcesFromApi();
      if (!verified || !hasPersistedLetter(verified)) {
        setLetterSaveError(
          "Your letter copy did not save correctly. Please try again."
        );
        return false;
      }

      applyLoadedSources(verified);
      setLetterSavedOk(true);
      return true;
    } catch (err) {
      console.error("Error saving letter:", err);
      setLetterSaveError("Could not save your letter copy. Please try again.");
      return false;
    } finally {
      setSavingLetter(false);
    }
  };

  const canContinueFromStage2 =
    speechSavedOk && hasPersistedSpeech(sources);
  const canContinueFromStage3 =
    letterSavedOk && hasPersistedLetter(sources);

  const toggleKnowledgeAnswer = (key) => {
    setKnowledgeCheckAnswers((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const speechChecks = evaluatePersistedSpeech(sources);
  const letterChecks = evaluatePersistedLetter(sources);
  const speechAllPass = speechChecks.complete;
  const letterAllPass = letterChecks.complete;
  const persistedSpeechText = getPersistedSpeechText(sources);
  const persistedLetterText = getPersistedLetterText(sources);
  const stage4BothPersisted = isModule2SourcePreparationComplete(sources);
  const canContinueFromStage4 = stage4BothPersisted;
  const canContinueFromStage6 = isModule2SourcePreparationComplete(sources);

  if (status === "loading" || loading) {
    return (
      <ModulePageShell>
        <p className="p-2 text-text-muted">Loading your source texts…</p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell>
      {stage === 0 ? (
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
                  Get ready · First screen
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  You are starting an evidence notebook, not writing the essay
                  yet.
                </p>
              </div>
              <div className="border-t border-border-soft/60 pt-4">
                <ProgressDots
                  total={WIZARD_STEPS.length}
                  activeStep={wizardStepNumber(stage)}
                  label={
                    WIZARD_STEPS[wizardStepNumber(stage) - 1]?.label ||
                    "Get ready"
                  }
                  onStepClick={goToStep}
                />
              </div>
            </aside>
          </WorkspaceSidebar>

          <WorkspaceCenter className="min-w-0">
            <div className="space-y-6 md:space-y-8">
              <header className="space-y-3 py-1 text-left md:py-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                  Start here
                </p>
                <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
                  You&apos;re not reading randomly. You&apos;re starting your
                  evidence notebook.
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
                  Save clean working copies of the two King texts. These become
                  the notebook you will keep using across The Writing Processor.
                </p>
              </header>

              <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                  Your job right now
                </p>
                <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
                  Begin your personal evidence notebook by saving the speech and
                  the letter.
                </p>
                <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-text-primary md:text-base">
                  <li>Check that the sources come from trusted archives.</li>
                  <li>Save your own copy of the speech.</li>
                  <li>Save your own copy of the letter.</li>
                </ol>
                <p className="mt-4 text-sm font-medium leading-relaxed text-text-primary">
                  You are building a notebook you will return to—not writing the
                  essay yet.
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-border-soft/70 bg-white/80 px-4 py-5 shadow-soft sm:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
                  Workspace
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  When you&apos;re ready, begin the short source-preparation
                  steps.
                </p>
                <button
                  type="button"
                  onClick={() => setStage(1)}
                  className="rounded-lg bg-theme-blue px-4 py-2 font-medium text-white"
                >
                  Let&apos;s begin
                </button>
              </div>

              <section
                id="module-2-need-help"
                className="scroll-mt-24 space-y-4 rounded-xl border-2 border-theme-orange/25 bg-theme-orange/[0.04] px-4 py-5 md:px-5"
                aria-labelledby="module-2-need-help-heading"
              >
                <div className="space-y-1 text-left">
                  <p
                    id="module-2-need-help-heading"
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange"
                  >
                    Need Help
                  </p>
                  <p className="text-sm leading-relaxed text-text-muted">
                    Extra coaching lives here if you want it—then come back to
                    Let&apos;s begin.
                  </p>
                </div>

                <details className="rounded-lg border border-border-soft/60 bg-white/70 px-4 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    Why these sources matter
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    These are not texts to read once and leave behind. They
                    become the core of your evidence notebook—the working copies
                    you will reopen when you collect quotes, explain appeals, and
                    later group evidence in Module 3.
                  </p>
                </details>

                <details className="rounded-lg border border-border-soft/60 bg-white/70 px-4 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    What you are looking for
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    Right now you are not hunting for quotes yet. You are setting
                    up accurate notebook copies of the speech and the letter so
                    later evidence work stays grounded in the real documents.
                  </p>
                </details>

                <details className="rounded-lg border border-border-soft/60 bg-white/70 px-4 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    Self-check before you continue
                  </summary>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
                    <li>
                      You know you are starting an evidence notebook, not just
                      finishing a reading.
                    </li>
                    <li>You are not writing the essay on this screen.</li>
                    <li>
                      You are ready to check the archives and save both texts.
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
                  Writers keep an evidence notebook nearby. They do not invent
                  quotes from memory—they return to the same working texts again
                  and again.
                </p>
              </div>

              <div className="space-y-2 border-t border-border-soft/60 pt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  What comes next
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  Next you will save both texts into your notebook, then add one
                  useful example at a time. Later modules—including Module
                  3—will keep using that same notebook to group evidence,
                  sharpen a thesis, and plan the essay.
                </p>
              </div>
            </aside>
          </WorkspaceGuide>
        </WorkspaceColumns>
      ) : stage === 2 ? (
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
                  Save the speech
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  First page of your evidence notebook.
                </p>
              </div>
              <div className="space-y-3 border-t border-border-soft/60 pt-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                    Progress
                  </p>
                  <p className="text-sm font-semibold text-text-primary">
                    Step {wizardStepNumber(2)} of {WIZARD_STEPS.length}
                  </p>
                  <p className="text-sm leading-relaxed text-text-muted">
                    Save the speech
                  </p>
                </div>
                <WizardProgressList stage={2} />
              </div>
            </aside>
          </WorkspaceSidebar>

          <WorkspaceCenter className="min-w-0">
            <div className="space-y-5 md:space-y-6">
              <header className="space-y-2 text-left">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                  Start here
                </p>
                <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
                  Add the speech to your evidence notebook.
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
                  Paste the full speech into the notebook below. This is the
                  first text you will keep using across The Writing Processor.
                </p>
              </header>

              <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-4 shadow-soft ring-1 ring-theme-orange/15 md:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                  Your job right now
                </p>
                <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
                  Open the speech, copy the full text, paste it into your
                  notebook, and save.
                </p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-primary md:text-base">
                  <li>Open the official speech source under Need Help.</li>
                  <li>Copy the full speech (not just a short excerpt).</li>
                  <li>Paste it into the notebook page below and click Save.</li>
                </ol>
              </div>

              {/* Evidence notebook document — dominant desk surface, not a form card */}
              <section
                aria-labelledby="module-2-speech-notebook-heading"
                className="min-w-0"
              >
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
                      Evidence notebook
                    </p>
                    <h2
                      id="module-2-speech-notebook-heading"
                      className="text-lg font-semibold text-text-primary"
                    >
                      Speech
                    </h2>
                  </div>
                  {speechSavedOk ? (
                    <span className="text-sm font-semibold text-theme-green">
                      ✓ Saved to your evidence notebook
                    </span>
                  ) : (
                    <span className="text-sm text-text-muted">
                      Not saved yet
                    </span>
                  )}
                </div>

                <textarea
                  id="module2-speech-full-text"
                  value={speechFullText}
                  onChange={(e) => {
                    setSpeechFullText(e.target.value);
                    setSpeechSavedOk(false);
                    setSpeechSaveError(null);
                  }}
                  placeholder={SPEECH_SOURCE.transcriptTextPlaceholder}
                  rows={18}
                  className="min-h-[min(480px,58vh)] w-full resize-y rounded-xl border-2 border-theme-dark/20 bg-white px-4 py-4 text-base leading-7 text-text-primary shadow-soft focus:border-theme-blue/50 focus:outline-none focus:ring-2 focus:ring-theme-blue/20 md:px-6 md:py-5"
                />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={saveSpeech}
                    disabled={
                      savingSpeech ||
                      !speechSourceUrl.trim() ||
                      !speechFullText.trim()
                    }
                    className="rounded-lg bg-theme-green px-5 py-2.5 text-base font-semibold text-white disabled:opacity-60"
                  >
                    {savingSpeech ? "Saving…" : "Save my speech copy"}
                  </button>
                  {speechSaveError ? (
                    <span className="text-sm text-theme-red">
                      {speechSaveError}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 border-t border-border-soft/60 pt-4">
                  <button
                    type="button"
                    onClick={() => setStage(3)}
                    disabled={!canContinueFromStage2}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      canContinueFromStage2
                        ? "bg-theme-blue text-white"
                        : "cursor-not-allowed bg-gray-300 text-gray-500"
                    }`}
                  >
                    Continue
                  </button>
                  {!canContinueFromStage2 ? (
                    <p className="mt-2 text-xs text-text-muted">
                      Save your speech copy before continuing.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-text-muted">
                      Speech saved. Continue to add the letter to your notebook.
                    </p>
                  )}
                </div>
              </section>

              <section
                id="module-2-speech-need-help"
                className="scroll-mt-24 space-y-3 rounded-xl border border-theme-orange/20 bg-theme-orange/[0.03] px-4 py-4 md:px-5"
                aria-labelledby="module-2-speech-need-help-heading"
              >
                <div className="space-y-1 text-left">
                  <p
                    id="module-2-speech-need-help-heading"
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange"
                  >
                    Need Help
                  </p>
                  <p className="text-sm leading-relaxed text-text-muted">
                    Supporting tools only. The notebook above is where your work
                    lives.
                  </p>
                </div>

                <div className="space-y-3 rounded-lg bg-white/60 px-3 py-3">
                  <a
                    href={SPEECH_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-theme-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Open the official speech source
                  </a>
                  <p className="text-sm leading-relaxed text-text-muted">
                    Source text accessed through the{" "}
                    {SPEECH_SOURCE.officialSiteName}.
                  </p>
                </div>

                <details className="rounded-lg bg-white/60 px-3 py-2.5" open>
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    How to copy (quick steps)
                  </summary>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
                    <li>Open the source in a new tab.</li>
                    <li>Select all (Command + A / Control + A).</li>
                    <li>Copy (Command + C / Control + C).</li>
                    <li>Come back here and paste into your notebook.</li>
                  </ol>
                </details>

                <details className="rounded-lg bg-white/60 px-3 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    A note about formatting
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    The official transcript may include extra lines (applause,
                    labels, etc.). That is okay—save it exactly as it appears.
                  </p>
                </details>

                <details className="rounded-lg bg-white/60 px-3 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    Advanced: speech source URL
                  </summary>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm leading-relaxed text-text-muted">
                      This is usually already filled in. Only change it if your
                      teacher asks you to.
                    </p>
                    <input
                      id="module2-speech-source-url"
                      type="url"
                      value={speechSourceUrl}
                      onChange={(e) => {
                        setSpeechSourceUrl(e.target.value);
                        setSpeechSavedOk(false);
                        setSpeechSaveError(null);
                      }}
                      className="w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-text-primary"
                    />
                  </div>
                </details>

                <details className="rounded-lg bg-white/60 px-3 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    Self-check before you continue
                  </summary>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
                    <li>You pasted the full speech, not a short excerpt.</li>
                    <li>You clicked Save and see the saved confirmation.</li>
                    <li>
                      Next you will add the letter as the second notebook page.
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
                  This notebook page is yours. You will come back to this same
                  speech whenever you need a quote or want to check the real
                  words.
                </p>
              </div>

              <div className="space-y-2 border-t border-border-soft/60 pt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  What comes next
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  After you save the speech, you will add the letter the same
                  way. Together they become the source pair for your evidence
                  notebook.
                </p>
              </div>
            </aside>
          </WorkspaceGuide>
        </WorkspaceColumns>
      ) : stage === 3 ? (
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
                  Save the letter
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  Second page of your evidence notebook. The speech is already
                  saved.
                </p>
              </div>
              <div className="space-y-3 border-t border-border-soft/60 pt-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                    Progress
                  </p>
                  <p className="text-sm font-semibold text-text-primary">
                    Step {wizardStepNumber(3)} of {WIZARD_STEPS.length}
                  </p>
                  <p className="text-sm leading-relaxed text-text-muted">
                    Save the letter
                  </p>
                </div>
                <WizardProgressList stage={3} />
              </div>
            </aside>
          </WorkspaceSidebar>

          <WorkspaceCenter className="min-w-0">
            <div className="space-y-5 md:space-y-6">
              <header className="space-y-2 text-left">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                  Start here
                </p>
                <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
                  Add the letter to your evidence notebook.
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
                  Paste the full letter into the notebook below. This is the
                  second text you will keep using across The Writing Processor.
                </p>
              </header>

              <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-4 shadow-soft ring-1 ring-theme-orange/15 md:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                  Your job right now
                </p>
                <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
                  Open the letter, copy the full text, paste it into your
                  notebook, and save.
                </p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-primary md:text-base">
                  <li>Open the official letter source under Need Help.</li>
                  <li>Copy the full letter (not just a short excerpt).</li>
                  <li>Paste it into the notebook page below and click Save.</li>
                </ol>
              </div>

              {/* Evidence notebook document — same desk surface as Stage 2 */}
              <section
                aria-labelledby="module-2-letter-notebook-heading"
                className="min-w-0"
              >
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
                      Evidence notebook
                    </p>
                    <h2
                      id="module-2-letter-notebook-heading"
                      className="text-lg font-semibold text-text-primary"
                    >
                      Letter
                    </h2>
                  </div>
                  {letterSavedOk ? (
                    <span className="text-sm font-semibold text-theme-green">
                      ✓ Saved to your evidence notebook
                    </span>
                  ) : (
                    <span className="text-sm text-text-muted">
                      Not saved yet
                    </span>
                  )}
                </div>

                <textarea
                  id="module2-letter-full-text"
                  value={letterFullText}
                  onChange={(e) => {
                    setLetterFullText(e.target.value);
                    setLetterSavedOk(false);
                    setLetterSaveError(null);
                  }}
                  placeholder={LETTER_SOURCE.transcriptTextPlaceholder}
                  rows={18}
                  className="min-h-[min(480px,58vh)] w-full resize-y rounded-xl border-2 border-theme-dark/20 bg-white px-4 py-4 text-base leading-7 text-text-primary shadow-soft focus:border-theme-blue/50 focus:outline-none focus:ring-2 focus:ring-theme-blue/20 md:px-6 md:py-5"
                />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={saveLetter}
                    disabled={
                      savingLetter ||
                      !letterSourceUrl.trim() ||
                      !letterFullText.trim()
                    }
                    className="rounded-lg bg-theme-green px-5 py-2.5 text-base font-semibold text-white disabled:opacity-60"
                  >
                    {savingLetter ? "Saving…" : "Save my letter copy"}
                  </button>
                  {letterSaveError ? (
                    <span className="text-sm text-theme-red">
                      {letterSaveError}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 border-t border-border-soft/60 pt-4">
                  <button
                    type="button"
                    onClick={() => setStage(4)}
                    disabled={!canContinueFromStage3}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      canContinueFromStage3
                        ? "bg-theme-blue text-white"
                        : "cursor-not-allowed bg-gray-300 text-gray-500"
                    }`}
                  >
                    Continue
                  </button>
                  {!canContinueFromStage3 ? (
                    <p className="mt-2 text-xs text-text-muted">
                      Save your letter copy before continuing.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-text-muted">
                      Letter saved. Continue to check that both texts look
                      complete.
                    </p>
                  )}
                </div>
              </section>

              <section
                id="module-2-letter-need-help"
                className="scroll-mt-24 space-y-3 rounded-xl border border-theme-orange/20 bg-theme-orange/[0.03] px-4 py-4 md:px-5"
                aria-labelledby="module-2-letter-need-help-heading"
              >
                <div className="space-y-1 text-left">
                  <p
                    id="module-2-letter-need-help-heading"
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange"
                  >
                    Need Help
                  </p>
                  <p className="text-sm leading-relaxed text-text-muted">
                    Supporting tools only. The notebook above is where your work
                    lives.
                  </p>
                </div>

                <div className="space-y-3 rounded-lg bg-white/60 px-3 py-3">
                  <a
                    href={LETTER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-theme-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Open the official letter source
                  </a>
                  <p className="text-sm leading-relaxed text-text-muted">
                    This text is hosted by the {LETTER_SOURCE.officialSiteName},
                    which provides historical documents for academic study.
                  </p>
                </div>

                <details className="rounded-lg bg-white/60 px-3 py-2.5" open>
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    How to copy (quick steps)
                  </summary>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
                    <li>Open the source in a new tab.</li>
                    <li>Select all (Command + A / Control + A).</li>
                    <li>Copy (Command + C / Control + C).</li>
                    <li>Come back here and paste into your notebook.</li>
                  </ol>
                </details>

                <details className="rounded-lg bg-white/60 px-3 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    A note about formatting
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    The official page may include extra lines or labels. That is
                    okay—save it exactly as it appears.
                  </p>
                </details>

                <details className="rounded-lg bg-white/60 px-3 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    Advanced: letter source URL
                  </summary>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm leading-relaxed text-text-muted">
                      This is usually already filled in. Only change it if your
                      teacher asks you to.
                    </p>
                    <input
                      id="module2-letter-source-url"
                      type="url"
                      value={letterSourceUrl}
                      onChange={(e) => {
                        setLetterSourceUrl(e.target.value);
                        setLetterSavedOk(false);
                        setLetterSaveError(null);
                      }}
                      className="w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-text-primary"
                    />
                  </div>
                </details>

                <details className="rounded-lg bg-white/60 px-3 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    Self-check before you continue
                  </summary>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
                    <li>You pasted the full letter, not a short excerpt.</li>
                    <li>You clicked Save and see the saved confirmation.</li>
                    <li>
                      Your notebook will then have both the speech and the
                      letter.
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
                  This notebook page is yours. You will come back to this same
                  letter whenever you need a quote or want to check the real
                  words.
                </p>
              </div>

              <div className="space-y-2 border-t border-border-soft/60 pt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  What comes next
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  After you save the letter, you will quickly check that both
                  notebook copies look complete. Together they become the source
                  pair for your evidence notebook.
                </p>
              </div>
            </aside>
          </WorkspaceGuide>
        </WorkspaceColumns>
      ) : stage === 4 ? (
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
                  Evidence notebook complete
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  Both texts are saved. Open them and keep them nearby.
                </p>
              </div>
              <div className="space-y-3 border-t border-border-soft/60 pt-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                    Progress
                  </p>
                  <p className="text-sm font-semibold text-text-primary">
                    Step {wizardStepNumber(4)} of {WIZARD_STEPS.length}
                  </p>
                  <p className="text-sm leading-relaxed text-text-muted">
                    Evidence notebook complete
                  </p>
                </div>
                <WizardProgressList stage={4} />
              </div>
            </aside>
          </WorkspaceSidebar>

          <WorkspaceCenter className="min-w-0">
            <div className="space-y-5 md:space-y-6">
              <header className="space-y-2 text-left">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                  Start here
                </p>
                <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
                  Your evidence notebook is complete.
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
                  Both King texts are saved. These are the pages you will keep
                  returning to while you find evidence and write your essay.
                </p>
              </header>

              <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-4 shadow-soft ring-1 ring-theme-orange/15 md:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                  Your job right now
                </p>
                <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
                  Open both saved texts and keep them open while you work.
                </p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-primary md:text-base">
                  <li>Open your saved speech.</li>
                  <li>Open your saved letter.</li>
                  <li>
                    Leave both open so you can look at the real words instead of
                    guessing from memory.
                  </li>
                </ol>
              </div>

              <section
                aria-labelledby="module-2-notebook-complete-heading"
                className="min-w-0 space-y-4"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
                    Evidence notebook
                  </p>
                  <h2
                    id="module-2-notebook-complete-heading"
                    className="text-lg font-semibold text-text-primary"
                  >
                    Open your saved pages
                  </h2>
                </div>

                <div className="space-y-3">
                  {!hasPersistedSpeech(sources) ? (
                    <div className="rounded-xl border-2 border-theme-red/30 bg-theme-red/5 px-5 py-5">
                      <p className="text-base font-semibold text-text-primary">
                        {SPEECH_SOURCE.title} — not saved yet
                      </p>
                      <p className="mt-2 text-sm text-text-muted">
                        Go back and save your speech copy before continuing.
                      </p>
                      <button
                        type="button"
                        onClick={() => setStage(2)}
                        className="mt-3 text-sm font-semibold text-theme-blue underline"
                      >
                        Return to save the speech
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-theme-dark/15 bg-white px-5 py-5 shadow-soft md:px-6 md:py-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-text-primary md:text-lg">
                            ✓ {sources?.speech_source_title || SPEECH_SOURCE.title}
                          </p>
                          <p className="mt-1 text-sm font-medium text-theme-green">
                            saved
                          </p>
                          <p className="mt-2 text-xs text-text-muted">
                            {persistedSpeechText.length} characters
                            {!speechAllPass
                              ? " · This may not be the full text—double-check if needed."
                              : ""}
                          </p>
                        </div>
                        <a
                          href="/texts/speech"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-theme-blue/30 bg-theme-blue/10 px-3 py-1.5 text-sm font-semibold text-theme-blue"
                        >
                          Open my saved speech
                        </a>
                      </div>
                    </div>
                  )}

                  {!hasPersistedLetter(sources) ? (
                    <div className="rounded-xl border-2 border-theme-red/30 bg-theme-red/5 px-5 py-5">
                      <p className="text-base font-semibold text-text-primary">
                        {LETTER_SOURCE.title} — not saved yet
                      </p>
                      <p className="mt-2 text-sm text-text-muted">
                        Go back and save your letter copy before continuing.
                      </p>
                      <button
                        type="button"
                        onClick={() => setStage(3)}
                        className="mt-3 text-sm font-semibold text-theme-blue underline"
                      >
                        Return to save the letter
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-theme-dark/15 bg-white px-5 py-5 shadow-soft md:px-6 md:py-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-text-primary md:text-lg">
                            ✓ {sources?.letter_source_title || LETTER_SOURCE.title}
                          </p>
                          <p className="mt-1 text-sm font-medium text-theme-green">
                            saved
                          </p>
                          <p className="mt-2 text-xs text-text-muted">
                            {persistedLetterText.length} characters
                            {!letterAllPass
                              ? " · This may not be the full text—double-check if needed."
                              : ""}
                          </p>
                        </div>
                        <a
                          href="/texts/letter"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-theme-blue/30 bg-theme-blue/10 px-3 py-1.5 text-sm font-semibold text-theme-blue"
                        >
                          Open my saved letter
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border-soft/70 bg-surface-soft/50 px-4 py-4 md:px-5">
                  <p className="text-sm font-semibold text-text-primary">
                    Keep both texts open
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    You will keep referring to these pages while you notice
                    examples of ethos, pathos, and logos. Accurate quotes come
                    from looking at the real words—not from memory.
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setStage(6)}
                    disabled={!canContinueFromStage4}
                    className={`rounded-lg px-5 py-2.5 text-base font-semibold ${
                      canContinueFromStage4
                        ? "bg-theme-blue text-white"
                        : "cursor-not-allowed bg-gray-300 text-gray-500"
                    }`}
                  >
                    Continue
                  </button>
                  {!canContinueFromStage4 ? (
                    <p className="mt-2 text-xs text-text-muted">
                      Both source texts must be saved before you can continue.
                    </p>
                  ) : null}
                </div>
              </section>

              <section
                id="module-2-notebook-complete-need-help"
                className="scroll-mt-24 space-y-3 rounded-xl border border-theme-orange/20 bg-theme-orange/[0.03] px-4 py-4 md:px-5"
                aria-labelledby="module-2-notebook-complete-need-help-heading"
              >
                <div className="space-y-1 text-left">
                  <p
                    id="module-2-notebook-complete-need-help-heading"
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange"
                  >
                    Need Help
                  </p>
                </div>

                <details className="rounded-lg bg-white/60 px-3 py-2.5" open>
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    Why keep referring to these texts?
                  </summary>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-text-muted">
                    <p>
                      Your essay will be built from evidence you find in these
                      two documents. Keeping them open makes it easier to find
                      strong examples and copy quotes accurately.
                    </p>
                    <p>
                      If a text looks too short or incomplete, go back to Save
                      the speech or Save the letter, paste again, and save.
                    </p>
                  </div>
                </details>

                <details className="rounded-lg bg-white/60 px-3 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    What if I accidentally close one?
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    No problem. Come back to this page and open it again. Your
                    saved notebook copy is still here.
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
                  Collecting the documents is done. Next you shift from saving
                  texts to reading them like a writer.
                </p>
              </div>

              <div className="space-y-2 border-t border-border-soft/60 pt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  What comes next
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  You&apos;ll begin noticing examples of ethos, pathos, and logos
                  in these texts. Those observations become grouped evidence and
                  eventually your essay.
                </p>
              </div>
            </aside>
          </WorkspaceGuide>
        </WorkspaceColumns>
      ) : stage === 6 ? (
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
                  Begin reading like a writer
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  Document collecting is finished. Analysis begins next.
                </p>
              </div>
              <div className="space-y-3 border-t border-border-soft/60 pt-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                    Progress
                  </p>
                  <p className="text-sm font-semibold text-text-primary">
                    Step {wizardStepNumber(6)} of {WIZARD_STEPS.length}
                  </p>
                  <p className="text-sm leading-relaxed text-text-muted">
                    Begin reading like a writer
                  </p>
                </div>
                <WizardProgressList stage={6} />
              </div>
            </aside>
          </WorkspaceSidebar>

          <WorkspaceCenter className="min-w-0">
            <div className="space-y-5 md:space-y-6">
              <header className="space-y-2 text-left">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                  Start here
                </p>
                <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
                  You are no longer collecting documents.
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
                  You are now reading like a writer—looking for the moves King
                  makes so you can use them as evidence later.
                </p>
              </header>

              <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-4 py-4 shadow-soft ring-1 ring-theme-orange/15 md:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                  Your job right now
                </p>
                <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
                  Shift your mindset from saving texts to noticing how they work.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-text-primary md:text-base">
                  With your notebook open, you will begin spotting examples of
                  ethos, pathos, and logos. You are not writing the essay yet—you
                  are gathering the observations that will become it.
                </p>
              </div>

              <section
                aria-labelledby="module-2-reading-like-writer-heading"
                className="min-w-0 space-y-4"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-blue">
                    How this connects
                  </p>
                  <h2
                    id="module-2-reading-like-writer-heading"
                    className="text-lg font-semibold text-text-primary"
                  >
                    From observations to essay
                  </h2>
                </div>

                <ol className="space-y-3">
                  <li className="rounded-xl border border-border-soft/70 bg-white px-4 py-4 shadow-soft md:px-5">
                    <p className="text-sm font-semibold text-text-primary">
                      1. Notice
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">
                      Find places where King builds trust (ethos), stirs feeling
                      (pathos), or uses reasoning (logos).
                    </p>
                  </li>
                  <li className="rounded-xl border border-border-soft/70 bg-white px-4 py-4 shadow-soft md:px-5">
                    <p className="text-sm font-semibold text-text-primary">
                      2. Group
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">
                      Later, those observations become grouped evidence you can
                      organize and compare.
                    </p>
                  </li>
                  <li className="rounded-xl border border-border-soft/70 bg-white px-4 py-4 shadow-soft md:px-5">
                    <p className="text-sm font-semibold text-text-primary">
                      3. Write
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">
                      That grouped evidence becomes the foundation of your essay.
                    </p>
                  </li>
                </ol>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      const verified = await fetchModule2SourcesFromApi();
                      if (!isModule2SourcePreparationComplete(verified)) {
                        if (verified) applyLoadedSources(verified);
                        setStage(4);
                        return;
                      }
                      applyLoadedSources(verified);
                      if (session?.user?.email) {
                        try {
                          await fetch("/api/assignments/resume", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              assignment_name: MLK_ASSIGNMENT_NAME,
                              resume_path: "/modules/2/tcharts",
                            }),
                          });
                        } catch (err) {
                          console.error("Resume path update failed:", err);
                        }
                      }
                      router.push("/modules/2/tcharts");
                    }}
                    disabled={!canContinueFromStage6}
                    className={`rounded-lg px-5 py-2.5 text-base font-semibold ${
                      canContinueFromStage6
                        ? "bg-theme-blue text-white"
                        : "cursor-not-allowed bg-gray-300 text-gray-500"
                    }`}
                  >
                    Continue
                  </button>
                  {!canContinueFromStage6 ? (
                    <p className="mt-2 text-xs text-text-muted">
                      Both source texts must be saved before beginning analysis.
                    </p>
                  ) : null}
                </div>
              </section>

              <section
                id="module-2-reading-need-help"
                className="scroll-mt-24 space-y-3 rounded-xl border border-theme-orange/20 bg-theme-orange/[0.03] px-4 py-4 md:px-5"
                aria-labelledby="module-2-reading-need-help-heading"
              >
                <div className="space-y-1 text-left">
                  <p
                    id="module-2-reading-need-help-heading"
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange"
                  >
                    Need Help
                  </p>
                </div>

                <details className="rounded-lg bg-white/60 px-3 py-2.5" open>
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    What does “reading like a writer” mean?
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    It means paying attention to how the writing works—not just
                    what it says. You look for choices that persuade, then save
                    those moments as evidence.
                  </p>
                </details>

                <details className="rounded-lg bg-white/60 px-3 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                    Do I write my essay on the next page?
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    No. Next you begin collecting observations. The essay comes
                    after you have grouped evidence and built a plan.
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
                  Saving texts was preparation. From here on, every observation
                  you make is material for your essay.
                </p>
              </div>

              <div className="space-y-2 border-t border-border-soft/60 pt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  What comes next
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  You&apos;ll enter analysis with your notebook open and begin
                  noticing rhetorical strategies in the speech and letter.
                </p>
              </div>
            </aside>
          </WorkspaceGuide>
        </WorkspaceColumns>
      ) : (
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="mb-1 text-2xl font-extrabold text-theme-dark">
            Module 2: Your source texts
          </h1>
          <p className="mb-4 text-sm text-theme-dark/70">
            I’ll help you save clean copies of the two texts we’ll study.
          </p>

          <ProgressDots
            total={WIZARD_STEPS.length}
            activeStep={wizardStepNumber(stage)}
            label={
              WIZARD_STEPS[wizardStepNumber(stage) - 1]?.label ||
              "Can we trust these sources?"
            }
            onStepClick={goToStep}
          />

        {/* Stage 1: Why these are trustworthy */}
        {stage === 1 && (
          <Panel className="space-y-4">
            <div className="text-left space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/60">
                Today’s question
              </p>
              <h2 className="text-2xl font-extrabold text-theme-dark leading-snug">
                Can we trust these sources?
              </h2>
              <p className="text-sm text-theme-dark/75">
                We’re going to use official archives so the text is accurate.
              </p>
            </div>

            <ReferenceSection
              label="Where these texts come from"
              description="Helpful background. You can skim."
            >
              <div className="space-y-2 text-theme-dark/80">
                <p className="text-sm">
                  We’ll use two trusted archives:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    {SPEECH_SOURCE.trustedArchiveName},{" "}
                    {SPEECH_SOURCE.trustedArchiveDescription}
                  </li>
                  <li>
                    {LETTER_SOURCE.trustedArchiveName},{" "}
                    {LETTER_SOURCE.trustedArchiveDescription}
                  </li>
                </ul>
              </div>
            </ReferenceSection>

            <WorkingSetSection
              label="Quick check"
              description="There isn’t one trick here. Just choose what sounds true."
            >
              <p className="text-sm text-theme-dark/75">
                Select all that apply.
              </p>
              <div className="space-y-2">
                {[
                  {
                    key: "A",
                    text: "They are maintained by respected institutions.",
                    correct: true,
                  },
                  {
                    key: "B",
                    text: "Anyone on the internet can edit them.",
                    correct: false,
                  },
                  {
                    key: "C",
                    text: "They come from historical archives.",
                    correct: true,
                  },
                  {
                    key: "D",
                    text: "They were created by random websites.",
                    correct: false,
                  },
                ].map(({ key, text, correct }) => (
                  <label
                    key={key}
                    className="flex items-start gap-2 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={knowledgeCheckAnswers.includes(key)}
                      onChange={() => toggleKnowledgeAnswer(key)}
                      className="mt-0.5"
                    />
                    <span>
                      <strong>{key}.</strong> {text}
                    </span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setKnowledgeCheckSubmitted(true)}
                className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium text-sm"
              >
                Check my thinking
              </button>
              {knowledgeCheckSubmitted && (
                <p className="text-sm text-theme-dark/80 pt-1">
                  Exactly. Trusted archives and institutions work to preserve accurate texts.
                </p>
              )}
            </WorkingSetSection>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStage(2)}
                disabled={!knowledgeCheckSubmitted}
                className={`px-4 py-2 rounded-lg font-medium ${
                  knowledgeCheckSubmitted
                    ? "bg-theme-blue text-white"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
              >
                Continue
              </button>
            </div>
          </Panel>
        )}
        </div>
      )}

    </ModulePageShell>
  );
}
