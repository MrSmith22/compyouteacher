"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { logActivity } from "@/lib/logActivity";
import Panel from "@/components/ui/Panel";
import ProgressDots from "@/components/ui/ProgressDots";

const STAGE_LABELS = [
  "Welcome",
  "Why these sources",
  "Get the speech",
  "Get the letter",
  "Check your texts",
  "Use your texts",
  "Begin analysis",
];

const SPEECH_URL =
  "https://www.archives.gov/files/social-media/transcripts/transcript-march-pt3-of-3-2602934.pdf";
const LETTER_URL =
  "https://www.africa.upenn.edu/Articles_Gen/Letter_Birmingham.html";

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
        <p className="text-sm text-theme-dark/80">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold text-theme-dark mb-2">
          Module 2: Gather Your Source Texts
        </h1>

        <ProgressDots
          total={7}
          activeStep={stage + 1}
          label={STAGE_LABELS[stage]}
          onStepClick={goToStep}
        />

        {/* Stage 0: Welcome */}
        {stage === 0 && (
          <Panel className="space-y-4">
            <h2 className="text-xl font-bold text-theme-dark">
              Welcome to Module 2
            </h2>
            <div className="text-left space-y-3 text-theme-dark/90">
              <p>
                In this module, you will gather accurate copies of the two texts
                you will study throughout the essay process.
              </p>
              <p>
                Before strong analysis can happen, researchers need trustworthy
                versions of the documents they are reading.
              </p>
              <p>Today you will:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Learn why these sources are trustworthy</li>
                <li>Save your own working copy of the speech and the letter</li>
                <li>
                  Use those saved copies throughout the rest of the assignment
                </li>
              </ol>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStage(1)}
                className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium"
              >
                Continue
              </button>
            </div>
          </Panel>
        )}

        {/* Stage 1: Why these are trustworthy */}
        {stage === 1 && (
          <Panel className="space-y-4">
            <h2 className="text-xl font-bold text-theme-dark">
              Why these are trustworthy sources
            </h2>
            <div className="text-left space-y-3 text-theme-dark/90">
              <p>
                When researchers study important historical documents, they try
                to obtain the text from a reliable and authoritative source.
              </p>
              <p>
                Reliable sources are often maintained by universities, research
                institutes, museums, or government archives. These organizations
                carefully preserve historical documents and make sure that the
                text is accurate.
              </p>
              <p>In this assignment, we will use two trusted archives:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  The National Archives, which preserves important documents from
                  United States history
                </li>
                <li>
                  The Martin Luther King Jr. Research and Education Institute at
                  Stanford University, which maintains scholarly editions of Dr.
                  King&apos;s writings
                </li>
              </ul>
              <p>
                Using trusted sources helps researchers make sure they are
                analyzing the correct and complete version of a document.
              </p>
            </div>

            <div className="rounded-lg border border-border-soft bg-surface p-4 space-y-3">
              <p className="text-sm font-medium text-theme-dark">
                Why are these sources trustworthy?
              </p>
              <p className="text-xs text-theme-dark/70">
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
                Submit Answer
              </button>
              {knowledgeCheckSubmitted && (
                <p className="text-sm text-theme-green pt-1">
                  These sources are trustworthy because they come from respected
                  archival and educational institutions.
                </p>
              )}
            </div>
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
            <h2 className="text-xl font-bold text-theme-dark">
              Get the speech
            </h2>
            <p className="text-left text-theme-dark/90">
              First, open the official transcript of &ldquo;I Have a Dream&rdquo;
              from the National Archives.
            </p>
            <p className="text-left text-theme-dark/90">
              Then copy the full text and paste it into the boxes below.
            </p>
            <div className="rounded-lg border border-border-soft bg-surface-soft p-3 text-sm text-theme-dark/90 space-y-2">
              <p className="font-medium">How to copy the source:</p>
              <ol className="list-decimal list-inside space-y-1 ml-1">
                <li>Open the source in a new tab.</li>
                <li>Click inside the page or PDF.</li>
                <li>Press Command + A on a Mac or Control + A on Windows to select all.</li>
                <li>Copy with Command + C or Control + C.</li>
                <li>Return to this app and paste with Command + V or Control + V.</li>
              </ol>
              <p className="text-theme-dark/70 pt-1">
                You may also right click and copy or paste with your mouse.
              </p>
            </div>
            <p className="text-sm text-theme-dark/80">
              This official National Archives transcript is accurate, but it is
              not formatted like a classroom edition of the speech. It includes
              some surrounding event transcript, such as speaker labels,
              applause, singing, and narrator lines. As you work later in the
              assignment, focus mainly on the words spoken by Dr. Martin Luther
              King Jr.
            </p>
            <p className="text-sm text-theme-dark/80">
              For this assignment, copy the full source exactly as it appears.
            </p>
            <a
              href={SPEECH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
            >
              Open Official Speech Source
            </a>

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
                placeholder="Paste the full transcript here…"
                rows={14}
                className="w-full border border-border-soft rounded-lg px-3 py-2 bg-white text-theme-dark font-sans text-sm"
              />
              <p className="text-xs text-theme-dark/60 mt-1">
                Copy the full text, not just an excerpt. You will use this
                throughout the assignment.
              </p>
            </div>
            <p className="text-xs text-theme-dark/60">
              Source text accessed through the National Archives.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={saveSpeech}
                disabled={savingSpeech}
                className="bg-theme-green text-white px-4 py-2 rounded-lg font-medium disabled:opacity-60"
              >
                {savingSpeech ? "Saving…" : "Save Speech"}
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
            <h2 className="text-xl font-bold text-theme-dark">
              Get the letter
            </h2>
            <p className="text-left text-theme-dark/90">
              Now, open the official text of &ldquo;Letter from Birmingham
              Jail&rdquo; from the University of Pennsylvania Africa Studies Center.
            </p>
            <p className="text-left text-theme-dark/90">
              Then copy the full text and paste it into the boxes below.
            </p>
            <p className="text-sm text-theme-dark/80">
              This transcript is hosted by the University of Pennsylvania Africa
              Studies Center, which provides historical documents for academic
              study.
            </p>
            <div className="rounded-lg border border-border-soft bg-surface-soft p-3 text-sm text-theme-dark/90 space-y-2">
              <p className="font-medium">How to copy the source:</p>
              <ol className="list-decimal list-inside space-y-1 ml-1">
                <li>Open the source in a new tab.</li>
                <li>Click inside the page or PDF.</li>
                <li>Press Command + A on a Mac or Control + A on Windows to select all.</li>
                <li>Copy with Command + C or Control + C.</li>
                <li>Return to this app and paste with Command + V or Control + V.</li>
              </ol>
              <p className="text-theme-dark/70 pt-1">
                You may also right click and copy or paste with your mouse.
              </p>
            </div>
            <a
              href={LETTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
            >
              Open Official Letter Source
            </a>

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
                placeholder="Paste the full letter here…"
                rows={14}
                className="w-full border border-border-soft rounded-lg px-3 py-2 bg-white text-theme-dark font-sans text-sm"
              />
              <p className="text-xs text-theme-dark/60 mt-1">
                Copy the full text, not just an excerpt. You will use this
                throughout the assignment.
              </p>
            </div>
            <p className="text-xs text-theme-dark/60">
              Source text accessed through the University of Pennsylvania Africa
              Studies Center.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={saveLetter}
                disabled={savingLetter}
                className="bg-theme-green text-white px-4 py-2 rounded-lg font-medium disabled:opacity-60"
              >
                {savingLetter ? "Saving…" : "Save Letter"}
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
            <h2 className="text-xl font-bold text-theme-dark">
              Check your saved texts
            </h2>
            <div className="grid gap-4">
              <div className="rounded-lg border border-border-soft bg-surface-soft p-4 space-y-1">
                <p className="font-semibold text-theme-dark">
                  {sources?.speech_source_title || "I Have a Dream"}
                </p>
                <p className="text-sm text-theme-dark/80">
                  {sources?.speech_site_name || "National Archives"}
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
                  <p className="text-sm text-theme-green pt-1">
                    Your saved copies look complete enough to continue.
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
                  {sources?.letter_source_title || "Letter from Birmingham Jail"}
                </p>
                <p className="text-sm text-theme-dark/80">
                  {sources?.letter_site_name || "University of Pennsylvania Africa Studies Center"}
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
                  <p className="text-sm text-theme-green pt-1">
                    Your saved copies look complete enough to continue.
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
                Continue to Reading Tools
              </button>
            </div>
          </Panel>
        )}

        {/* Stage 5: Use your texts while you work */}
        {stage === 5 && (
          <Panel className="space-y-4">
            <h2 className="text-xl font-bold text-theme-dark">
              Use your texts while you work
            </h2>
            <p className="text-left text-theme-dark/90">
              From this point forward, you should work from the saved copies of
              the speech and the letter, not from memory.
            </p>
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
            <p className="text-sm text-theme-dark/70">
              If you are working on one screen, opening the text in another tab
              can make it much easier to copy quotes and stay grounded in the
              document.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStage(6)}
                className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium"
              >
                Continue to Analysis
              </button>
            </div>
          </Panel>
        )}

        {/* Stage 6: Begin rhetorical analysis */}
        {stage === 6 && (
          <Panel className="space-y-4">
            <h2 className="text-xl font-bold text-theme-dark">
              Begin rhetorical analysis
            </h2>
            <p className="text-left text-theme-dark/90">
              Now that you have accurate copies of both texts, you are ready to
              begin rhetorical analysis.
            </p>
            <p className="text-left text-theme-dark/90">
              In the next part of the assignment, you will look for how King uses
              rhetorical strategies in each text and how those choices connect
              to audience and purpose.
            </p>
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
                          assignment_name: "MLK Essay Assignment",
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
                Continue to Module 2 Analysis
              </button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
