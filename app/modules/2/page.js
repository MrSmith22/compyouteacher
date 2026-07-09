"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { logActivity } from "@/lib/logActivity";
import Panel from "@/components/ui/Panel";
import ProgressDots from "@/components/ui/ProgressDots";
import {
  ReferenceSection,
  WorkingSetSection,
} from "@/components/module3/ModuleThreeDeskFrame";
import { MLK_ASSIGNMENT_NAME, mlkAssignmentDefinition } from "@/lib/assignments";

const STAGE_LABELS = [
  "Get ready",
  "Can we trust these sources?",
  "Save the speech",
  "Save the letter",
  "Check: do they look complete?",
  "Use your saved copies",
  "Ready to begin analysis",
];

const MODULE2_SOURCES = mlkAssignmentDefinition.sources;
const SPEECH_SOURCE = MODULE2_SOURCES.speech;
const LETTER_SOURCE = MODULE2_SOURCES.letter;
const SPEECH_URL = SPEECH_SOURCE.officialSourceUrl;
const LETTER_URL = LETTER_SOURCE.officialSourceUrl;

const SPEECH_MIN_LENGTH = 500;
const LETTER_MIN_LENGTH = 1000;
const SPEECH_PHRASES = [
  "five score years ago",
  "i have a dream",
  "let freedom ring",
  "free at last! free at last!",
];
const LETTER_PHRASES = [
  "my dear fellow clergymen",
  "injustice anywhere is a threat to justice everywhere",
  "justice too long delayed is justice denied",
  "wait has almost always meant never",
];

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

  // Stage 3: letter
  const [letterSourceUrl, setLetterSourceUrl] = useState(LETTER_URL);
  const [letterFullText, setLetterFullText] = useState("");
  const [savingLetter, setSavingLetter] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/module2/sources");
      if (res.ok) {
        const data = await res.json();
        setSources(data);
        if (data?.speech_full_text) setSpeechFullText(data.speech_full_text);
        if (data?.speech_source_url) setSpeechSourceUrl(data.speech_source_url);
        if (data?.letter_full_text) setLetterFullText(data.letter_full_text);
        if (data?.letter_source_url) setLetterSourceUrl(data.letter_source_url);
      }
    } catch (err) {
      console.error("Error loading module2 sources:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const goToStep = (stepNum) => {
    setStage(Math.max(0, Math.min(6, stepNum - 1)));
  };

  const saveSpeech = async () => {
    if (!session?.user?.email) return;
    setSavingSpeech(true);
    try {
      const res = await fetch("/api/module2/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speech_source_url: speechSourceUrl.trim(),
          speech_full_text: speechFullText.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (err) {
      console.error("Error saving speech:", err);
    } finally {
      setSavingSpeech(false);
    }
  };

  const saveLetter = async () => {
    if (!session?.user?.email) return;
    setSavingLetter(true);
    try {
      const res = await fetch("/api/module2/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letter_source_url: letterSourceUrl.trim(),
          letter_full_text: letterFullText.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (err) {
      console.error("Error saving letter:", err);
    } finally {
      setSavingLetter(false);
    }
  };

  const canContinueFromStage2 =
    speechSourceUrl.trim() !== "" && speechFullText.trim() !== "";
  const canContinueFromStage3 =
    letterSourceUrl.trim() !== "" && letterFullText.trim() !== "";

  const toggleKnowledgeAnswer = (key) => {
    setKnowledgeCheckAnswers((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const speechChecks = (() => {
    const text = (sources?.speech_full_text || speechFullText || "").trim().toLowerCase();
    const allPhrasesFound = SPEECH_PHRASES.every((phrase) => text.includes(phrase));
    return {
      lengthOk: text.length >= SPEECH_MIN_LENGTH,
      allPhrasesFound,
    };
  })();

  const letterChecks = (() => {
    const text = (sources?.letter_full_text || letterFullText || "").trim().toLowerCase();
    const phraseCount = LETTER_PHRASES.filter((phrase) => text.includes(phrase)).length;
    const atLeastTwoPhrases = phraseCount >= 2;
    return {
      lengthOk: text.length >= LETTER_MIN_LENGTH,
      allPhrasesFound: atLeastTwoPhrases,
    };
  })();

  const speechAllPass =
    speechChecks.lengthOk && speechChecks.allPhrasesFound;
  const letterAllPass =
    letterChecks.lengthOk && letterChecks.allPhrasesFound;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">Loading your source texts…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold text-theme-dark mb-1">
          Module 2: Your source texts
        </h1>
        <p className="text-sm text-theme-dark/70 mb-4">
          I’ll help you save clean copies of the two texts we’ll study.
        </p>

        <ProgressDots
          total={7}
          activeStep={stage + 1}
          label={STAGE_LABELS[stage]}
          onStepClick={goToStep}
        />

        {/* Stage 0: Welcome */}
        {stage === 0 && (
          <Panel className="space-y-4">
            <div className="text-left space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/60">
                Today’s question
              </p>
              <h2 className="text-2xl font-extrabold text-theme-dark leading-snug">
                What texts are we going to study?
              </h2>
              <p className="text-sm text-theme-dark/75">
                Before we analyze anything, we need accurate copies of the texts.
              </p>
            </div>

            <WorkingSetSection
              label="What you’ll do"
              description="One small step at a time. You don’t need to rush."
            >
              <div className="space-y-3 text-theme-dark/85">
                <div>
                  <p className="text-sm font-semibold text-theme-dark">
                    Why are we doing this?
                  </p>
                  <p className="text-sm text-theme-dark/75">
                    Strong analysis starts with a trustworthy, complete text.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-theme-dark">
                    What should I do?
                  </p>
                  <ul className="mt-1 list-disc list-inside space-y-1 text-sm text-theme-dark/75">
                    <li>Check that our sources are trustworthy</li>
                    <li>Save your own copy of the speech</li>
                    <li>Save your own copy of the letter</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-theme-dark">
                    How will I know I’m finished?
                  </p>
                  <p className="text-sm text-theme-dark/75">
                    You’ll have two saved texts you can open anytime while you work.
                  </p>
                </div>
              </div>
            </WorkingSetSection>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStage(1)}
                className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium"
              >
                Let’s begin
              </button>
            </div>
          </Panel>
        )}

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

        {/* Stage 2: Get the speech */}
        {stage === 2 && (
          <Panel className="space-y-4">
            <div className="text-left space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/60">
                Today’s question
              </p>
              <h2 className="text-2xl font-extrabold text-theme-dark leading-snug">
                What important information should we save before we start reading?
              </h2>
              <p className="text-sm text-theme-dark/75">
                We’re going to save your own working copy of the speech.
              </p>
            </div>

            <ReferenceSection
              label="Official source (reference)"
              description="Open it, look first, then come back to paste."
            >
              <div className="space-y-2">
                <a
                  href={SPEECH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
                >
                  Open the official speech source
                </a>
                <details className="rounded-lg border border-theme-dark/10 bg-white px-4 py-3">
                  <summary className="cursor-pointer select-none text-sm font-medium text-theme-dark/80">
                    How to copy (quick steps)
                  </summary>
                  <ol className="mt-3 list-decimal list-inside space-y-1 text-sm text-theme-dark/75">
                    <li>Open the source in a new tab.</li>
                    <li>Select all (Command + A / Control + A).</li>
                    <li>Copy (Command + C / Control + C).</li>
                    <li>Come back here and paste (Command + V / Control + V).</li>
                  </ol>
                </details>
                <details className="rounded-lg border border-theme-dark/10 bg-white px-4 py-3">
                  <summary className="cursor-pointer select-none text-sm font-medium text-theme-dark/80">
                    A note about formatting
                  </summary>
                  <p className="mt-3 text-sm text-theme-dark/75">
                    The official transcript may include extra lines (applause, labels, etc.).
                    That’s okay—save it exactly as it appears.
                  </p>
                </details>
              </div>
            </ReferenceSection>

            <WorkingSetSection
              label="Your saved copy (working set)"
              description="Paste the full speech here so you can use it later."
            >
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-theme-dark">
                    What should I do?
                  </p>
                  <p className="text-sm text-theme-dark/75">
                    Copy the full speech from the official source, then paste it below.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-dark mb-1">
                    Speech source URL
                  </label>
                  <input
                    type="url"
                    value={speechSourceUrl}
                    onChange={(e) => setSpeechSourceUrl(e.target.value)}
                    className="w-full border border-border-soft rounded-lg px-3 py-2 bg-white text-theme-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-dark mb-1">
                    Speech full text
                  </label>
                  <textarea
                    value={speechFullText}
                    onChange={(e) => setSpeechFullText(e.target.value)}
                    placeholder={SPEECH_SOURCE.transcriptTextPlaceholder}
                    rows={14}
                    className="w-full border border-border-soft rounded-lg px-3 py-2 bg-white text-theme-dark font-sans text-sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-theme-dark">
                    How will I know I’m finished?
                  </p>
                  <p className="text-sm text-theme-dark/75">
                    You pasted the full text (not just an excerpt) and clicked save.
                  </p>
                  <p className="text-xs text-theme-dark/60 mt-1">
                    Source text accessed through the {SPEECH_SOURCE.officialSiteName}.
                  </p>
                </div>
              </div>
            </WorkingSetSection>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={saveSpeech}
                disabled={savingSpeech}
                className="bg-theme-green text-white px-4 py-2 rounded-lg font-medium disabled:opacity-60"
              >
                {savingSpeech ? "Saving…" : "Save my speech copy"}
              </button>
              <button
                type="button"
                onClick={() => setStage(3)}
                disabled={!canContinueFromStage2}
                className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </Panel>
        )}

        {/* Stage 3: Get the letter */}
        {stage === 3 && (
          <Panel className="space-y-4">
            <div className="text-left space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/60">
                Today’s question
              </p>
              <h2 className="text-2xl font-extrabold text-theme-dark leading-snug">
                Where did this letter come from, and how do we save it?
              </h2>
              <p className="text-sm text-theme-dark/75">
                Now we’ll save your working copy of the letter.
              </p>
            </div>

            <ReferenceSection
              label="Official source (reference)"
              description="Open it, look first, then come back to paste."
            >
              <div className="space-y-2">
                <p className="text-sm text-theme-dark/75">
                  This text is hosted by the {LETTER_SOURCE.officialSiteName}, which provides
                  historical documents for academic study.
                </p>
                <a
                  href={LETTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
                >
                  Open the official letter source
                </a>
                <details className="rounded-lg border border-theme-dark/10 bg-white px-4 py-3">
                  <summary className="cursor-pointer select-none text-sm font-medium text-theme-dark/80">
                    How to copy (quick steps)
                  </summary>
                  <ol className="mt-3 list-decimal list-inside space-y-1 text-sm text-theme-dark/75">
                    <li>Open the source in a new tab.</li>
                    <li>Select all (Command + A / Control + A).</li>
                    <li>Copy (Command + C / Control + C).</li>
                    <li>Come back here and paste (Command + V / Control + V).</li>
                  </ol>
                </details>
              </div>
            </ReferenceSection>

            <WorkingSetSection
              label="Your saved copy (working set)"
              description="Paste the full letter here so you can use it later."
            >
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-theme-dark">
                    What should I do?
                  </p>
                  <p className="text-sm text-theme-dark/75">
                    Copy the full letter from the official source, then paste it below.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-dark mb-1">
                    Letter source URL
                  </label>
                  <input
                    type="url"
                    value={letterSourceUrl}
                    onChange={(e) => setLetterSourceUrl(e.target.value)}
                    className="w-full border border-border-soft rounded-lg px-3 py-2 bg-white text-theme-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-dark mb-1">
                    Letter full text
                  </label>
                  <textarea
                    value={letterFullText}
                    onChange={(e) => setLetterFullText(e.target.value)}
                    placeholder={LETTER_SOURCE.transcriptTextPlaceholder}
                    rows={14}
                    className="w-full border border-border-soft rounded-lg px-3 py-2 bg-white text-theme-dark font-sans text-sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-theme-dark">
                    How will I know I’m finished?
                  </p>
                  <p className="text-sm text-theme-dark/75">
                    You pasted the full text (not just an excerpt) and clicked save.
                  </p>
                  <p className="text-xs text-theme-dark/60 mt-1">
                    Source text accessed through the {LETTER_SOURCE.officialSiteName}.
                  </p>
                </div>
              </div>
            </WorkingSetSection>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={saveLetter}
                disabled={savingLetter}
                className="bg-theme-green text-white px-4 py-2 rounded-lg font-medium disabled:opacity-60"
              >
                {savingLetter ? "Saving…" : "Save my letter copy"}
              </button>
              <button
                type="button"
                onClick={() => setStage(4)}
                disabled={!canContinueFromStage3}
                className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </Panel>
        )}

        {/* Stage 4: Check your saved texts */}
        {stage === 4 && (
          <Panel className="space-y-6">
            <div className="text-left space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/60">
                Today’s question
              </p>
              <h2 className="text-2xl font-extrabold text-theme-dark leading-snug">
                Do your saved texts look complete?
              </h2>
              <p className="text-sm text-theme-dark/75">
                Take a quick look. If something seems off, go back and copy again.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-lg border border-border-soft bg-surface-soft p-4 space-y-1">
                <p className="font-semibold text-theme-dark">
                  {sources?.speech_source_title || SPEECH_SOURCE.title}
                </p>
                <p className="text-sm text-theme-dark/80">
                  {sources?.speech_site_name || SPEECH_SOURCE.officialSiteName}
                </p>
                <a
                  href={sources?.speech_source_url || SPEECH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-blue underline block truncate"
                >
                  {sources?.speech_source_url || SPEECH_URL}
                </a>
                <p className="text-xs text-theme-dark/60">
                  {(sources?.speech_full_text || speechFullText || "").length}{" "}
                  characters
                </p>
                {speechAllPass ? (
                  <p className="text-sm text-theme-dark/75 pt-1">
                    This looks complete enough to continue.
                  </p>
                ) : (
                  <p className="text-xs text-theme-dark/60 pt-1">
                    This may not be the full text. Please double-check that you
                    copied the complete document from the official source.
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-border-soft bg-surface-soft p-4 space-y-1">
                <p className="font-semibold text-theme-dark">
                  {sources?.letter_source_title || LETTER_SOURCE.title}
                </p>
                <p className="text-sm text-theme-dark/80">
                  {sources?.letter_site_name || LETTER_SOURCE.officialSiteName}
                </p>
                <a
                  href={sources?.letter_source_url || LETTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-blue underline block truncate"
                >
                  {sources?.letter_source_url || LETTER_URL}
                </a>
                <p className="text-xs text-theme-dark/60">
                  {(sources?.letter_full_text || letterFullText || "").length}{" "}
                  characters
                </p>
                {letterAllPass ? (
                  <p className="text-sm text-theme-dark/75 pt-1">
                    This looks complete enough to continue.
                  </p>
                ) : (
                  <p className="text-xs text-theme-dark/60 pt-1">
                    This may not be the full text. Please double-check that you
                    copied the complete document from the official source.
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStage(3)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStage(5)}
                className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium"
              >
                Continue
              </button>
            </div>
          </Panel>
        )}

        {/* Stage 5: Use your texts while you work */}
        {stage === 5 && (
          <Panel className="space-y-4">
            <div className="text-left space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/60">
                Today’s question
              </p>
              <h2 className="text-2xl font-extrabold text-theme-dark leading-snug">
                How should you use these texts while you work?
              </h2>
              <p className="text-sm text-theme-dark/75">
                Keep your saved copies open while you read and collect evidence.
              </p>
            </div>
            <WorkingSetSection
              label="Your reading copies (working set)"
              description="Open these in a new tab so you can look first, then write."
            >
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href="/texts/speech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium text-center hover:opacity-90"
              >
                Open My Copy of the Speech
              </a>
              <a
                href="/texts/letter"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium text-center hover:opacity-90"
              >
                Open My Copy of the Letter
              </a>
            </div>
            </WorkingSetSection>
            <ReferenceSection
              label="A quick tip"
              description="This makes later steps easier."
            >
              <p className="text-sm text-theme-dark/75">
                If you keep the text open in another tab, it’s easier to copy
                quotes and stay grounded in the document.
              </p>
            </ReferenceSection>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStage(6)}
                className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium"
              >
                Continue
              </button>
            </div>
          </Panel>
        )}

        {/* Stage 6: Begin rhetorical analysis */}
        {stage === 6 && (
          <Panel className="space-y-4">
            <div className="text-left space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark/60">
                Today’s question
              </p>
              <h2 className="text-2xl font-extrabold text-theme-dark leading-snug">
                Are you ready to begin analysis?
              </h2>
              <p className="text-sm text-theme-dark/75">
                You’ve saved both texts. Next, you’ll start noticing rhetorical choices.
              </p>
            </div>
            <ReferenceSection
              label="What’s next (reference)"
              description="Just so you know what you’re walking into."
            >
              <p className="text-sm text-theme-dark/75">
                You’ll look for how King uses rhetorical strategies and how those
                choices connect to audience and purpose.
              </p>
            </ReferenceSection>
            <div className="pt-2">
              <button
                type="button"
                onClick={async () => {
                  // Record resume path so progression treats /modules/2/analysis as valid for Module 2
                  if (session?.user?.email) {
                    try {
                      await fetch("/api/assignments/resume", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          assignment_name: MLK_ASSIGNMENT_NAME,
                          resume_path: "/modules/2/analysis",
                        }),
                      });
                    } catch (err) {
                      console.error("Resume path update failed:", err);
                    }
                  }
                  router.push("/modules/2/analysis");
                }}
                className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium"
              >
                Continue
              </button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
