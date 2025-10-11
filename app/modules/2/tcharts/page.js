"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Existing transcript keys */
const KEYS = {
  speechUrl: "mlk_speech_url",
  speechText: "mlk_speech_text",
  letterUrl: "mlk_letter_url",
  letterText: "mlk_letter_text",
};

/** T-Chart field keys (localStorage) */
const TCHART_KEYS = {
  // Ethos
  ethosSpeechQuote: "tchart_ethos_speech_quote",
  ethosSpeechNote: "tchart_ethos_speech_note",
  ethosLetterQuote: "tchart_ethos_letter_quote",
  ethosLetterNote: "tchart_ethos_letter_note",
  // Pathos
  pathosSpeechQuote: "tchart_pathos_speech_quote",
  pathosSpeechNote: "tchart_pathos_speech_note",
  pathosLetterQuote: "tchart_pathos_letter_quote",
  pathosLetterNote: "tchart_pathos_letter_note",
  // Logos
  logosSpeechQuote: "tchart_logos_speech_quote",
  logosSpeechNote: "tchart_logos_speech_note",
  logosLetterQuote: "tchart_logos_letter_quote",
  logosLetterNote: "tchart_logos_letter_note",
};

export default function ModuleTwoTCharts() {
  const router = useRouter();

  // transcripts/URLs
  const [speechUrl, setSpeechUrl] = useState("");
  const [speechText, setSpeechText] = useState("");
  const [letterUrl, setLetterUrl] = useState("");
  const [letterText, setLetterText] = useState("");

  // panel show/hide
  const [showSpeech, setShowSpeech] = useState(false);
  const [showLetter, setShowLetter] = useState(false);

  // toast
  const [toast, setToast] = useState("");

  // T-Chart state (12 fields)
  const [ethosSpeechQuote, setEthosSpeechQuote] = useState("");
  const [ethosSpeechNote, setEthosSpeechNote] = useState("");
  const [ethosLetterQuote, setEthosLetterQuote] = useState("");
  const [ethosLetterNote, setEthosLetterNote] = useState("");

  const [pathosSpeechQuote, setPathosSpeechQuote] = useState("");
  const [pathosSpeechNote, setPathosSpeechNote] = useState("");
  const [pathosLetterQuote, setPathosLetterQuote] = useState("");
  const [pathosLetterNote, setPathosLetterNote] = useState("");

  const [logosSpeechQuote, setLogosSpeechQuote] = useState("");
  const [logosSpeechNote, setLogosSpeechNote] = useState("");
  const [logosLetterQuote, setLogosLetterQuote] = useState("");
  const [logosLetterNote, setLogosLetterNote] = useState("");

  // load persisted data
  useEffect(() => {
    try {
      setSpeechUrl(localStorage.getItem(KEYS.speechUrl) || "");
      setSpeechText(localStorage.getItem(KEYS.speechText) || "");
      setLetterUrl(localStorage.getItem(KEYS.letterUrl) || "");
      setLetterText(localStorage.getItem(KEYS.letterText) || "");

      setEthosSpeechQuote(localStorage.getItem(TCHART_KEYS.ethosSpeechQuote) || "");
      setEthosSpeechNote(localStorage.getItem(TCHART_KEYS.ethosSpeechNote) || "");
      setEthosLetterQuote(localStorage.getItem(TCHART_KEYS.ethosLetterQuote) || "");
      setEthosLetterNote(localStorage.getItem(TCHART_KEYS.ethosLetterNote) || "");

      setPathosSpeechQuote(localStorage.getItem(TCHART_KEYS.pathosSpeechQuote) || "");
      setPathosSpeechNote(localStorage.getItem(TCHART_KEYS.pathosSpeechNote) || "");
      setPathosLetterQuote(localStorage.getItem(TCHART_KEYS.pathosLetterQuote) || "");
      setPathosLetterNote(localStorage.getItem(TCHART_KEYS.pathosLetterNote) || "");

      setLogosSpeechQuote(localStorage.getItem(TCHART_KEYS.logosSpeechQuote) || "");
      setLogosSpeechNote(localStorage.getItem(TCHART_KEYS.logosSpeechNote) || "");
      setLogosLetterQuote(localStorage.getItem(TCHART_KEYS.logosLetterQuote) || "");
      setLogosLetterNote(localStorage.getItem(TCHART_KEYS.logosLetterNote) || "");
    } catch {}
  }, []);

  const openSourceTab = (url) => {
    if (!url) return;
    try {
      window.open(url, "_blank", "noopener"); // open without stealing focus
      setToast("Source tab opened");
      setTimeout(() => setToast(""), 1600);
      setTimeout(() => window.focus(), 50); // nudge focus back
    } catch {}
  };

  // layout widths
  const getTranscriptColClass = (panel) => {
    const both = showSpeech && showLetter;
    if (both) return "w-full lg:w-1/3";
    const thisOpen = panel === "speech" ? showSpeech : showLetter;
    return thisOpen ? "w-full lg:w-2/3" : "hidden";
  };

  const getTChartColClass = () => {
    const both = showSpeech && showLetter;
    if (!showSpeech && !showLetter) return "w-full";
    return both ? "w-full lg:w-1/3" : "w-full lg:w-1/3";
  };

  // --- saving helpers ---

  // 1) Save locally (unchanged behavior)
  const saveLocalOnly = () => {
    try {
      localStorage.setItem(TCHART_KEYS.ethosSpeechQuote, ethosSpeechQuote);
      localStorage.setItem(TCHART_KEYS.ethosSpeechNote, ethosSpeechNote);
      localStorage.setItem(TCHART_KEYS.ethosLetterQuote, ethosLetterQuote);
      localStorage.setItem(TCHART_KEYS.ethosLetterNote, ethosLetterNote);

      localStorage.setItem(TCHART_KEYS.pathosSpeechQuote, pathosSpeechQuote);
      localStorage.setItem(TCHART_KEYS.pathosSpeechNote, pathosSpeechNote);
      localStorage.setItem(TCHART_KEYS.pathosLetterQuote, pathosLetterQuote);
      localStorage.setItem(TCHART_KEYS.pathosLetterNote, pathosLetterNote);

      localStorage.setItem(TCHART_KEYS.logosSpeechQuote, logosSpeechQuote);
      localStorage.setItem(TCHART_KEYS.logosSpeechNote, logosSpeechNote);
      localStorage.setItem(TCHART_KEYS.logosLetterQuote, logosLetterQuote);
      localStorage.setItem(TCHART_KEYS.logosLetterNote, logosLetterNote);

      setToast("Saved locally");
      setTimeout(() => setToast(""), 1200);
    } catch {
      setToast("Local save failed");
      setTimeout(() => setToast(""), 1500);
    }
  };

  // 2) Build payload rows for Supabase
  const buildEntries = () => {
    const row = (category, type, quote, observation) => ({
      category,
      type,
      quote: quote || "",
      observation: observation || "",
      letter_url: letterUrl || null,
    });
    return [
      row("ethos", "speech", ethosSpeechQuote, ethosSpeechNote),
      row("ethos", "letter", ethosLetterQuote, ethosLetterNote),
      row("pathos", "speech", pathosSpeechQuote, pathosSpeechNote),
      row("pathos", "letter", pathosLetterQuote, pathosLetterNote),
      row("logos", "speech", logosSpeechQuote, logosSpeechNote),
      row("logos", "letter", logosLetterQuote, logosLetterNote),
    ];
  };

  // 3) Save to Supabase via our API route
  const saveToSupabase = async () => {
    try {
      // Always keep a local copy first
      saveLocalOnly();

      const res = await fetch("/api/tchart/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: buildEntries() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        setToast(`Server save failed: ${msg}`);
        setTimeout(() => setToast(""), 2000);
        return;
      }

      setToast("Saved to Supabase");
      setTimeout(() => {
        setToast("");
        router.push("/modules/2/success");
      }, 500);
    } catch (err) {
      setToast(`Network error: ${String(err)}`);
      setTimeout(() => setToast(""), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-3">
          Module 2 — Analyze the Speech & Letter
        </h1>

        {/* Instructions */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
          <p className="text-gray-800">
            For each rhetorical appeal—<strong>Ethos</strong>, <strong>Pathos</strong>,{" "}
            and <strong>Logos</strong>—complete all four boxes:
          </p>
          <ol className="list-decimal list-inside mt-2 text-gray-800 space-y-1">
            <li><strong>Speech Quote</strong> — a short quote from <em>I Have a Dream</em> that shows the appeal.</li>
            <li><strong>Speech Explanation</strong> — how the quote demonstrates the appeal in the Speech.</li>
            <li><strong>Letter Quote</strong> — a short quote from <em>Letter from Birmingham Jail</em> that shows the same appeal.</li>
            <li><strong>Letter Explanation</strong> — how the quote demonstrates the appeal in the Letter.</li>
          </ol>
          <p className="mt-2 text-gray-800">
            Finish <strong>Ethos</strong> first, then repeat for <strong>Pathos</strong> and <strong>Logos</strong>.
            <span className="block text-sm text-gray-600 mt-1">
              Tip: keep quotes short (one sentence or less) so your explanations show your thinking.
            </span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-3">
          <button
            className={`px-4 py-2 rounded font-semibold ${
              showSpeech ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-900"
            }`}
            onClick={() => setShowSpeech((v) => !v)}
          >
            {showSpeech ? "Close Speech Panel" : "Open Speech Panel"}
          </button>

          <button
            className={`px-4 py-2 rounded font-semibold ${
              showLetter ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-900"
            }`}
            onClick={() => setShowLetter((v) => !v)}
          >
            {showLetter ? "Close Letter Panel" : "Open Letter Panel"}
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          On large screens, Speech (blue), Letter (orange), and T-Chart (green) sit side-by-side.
          On smaller screens they stack.
        </p>

        {/* Responsive area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Speech panel */}
          {showSpeech && (
            <section
              className={`${getTranscriptColClass("speech")} bg-blue-50 border border-blue-200 rounded p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-blue-900">Speech Transcript</h2>
                <button
                  className="text-sm underline text-blue-700"
                  onClick={() => openSourceTab(speechUrl)}
                  disabled={!speechUrl}
                  title={speechUrl || "No URL saved"}
                >
                  Open Source Page
                </button>
              </div>

              {speechText ? (
                <div className="whitespace-pre-wrap text-sm leading-6 max-h-[70vh] overflow-auto">
                  {speechText}
                </div>
              ) : (
                <p className="text-sm text-blue-900/80">
                  No transcript saved. Go back to <em>“Choose Your Speech Text”</em> to add it.
                </p>
              )}
            </section>
          )}

          {/* Letter panel */}
          {showLetter && (
            <section
              className={`${getTranscriptColClass("letter")} bg-orange-50 border border-orange-200 rounded p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-orange-900">Letter Transcript</h2>
                <button
                  className="text-sm underline text-orange-700"
                  onClick={() => openSourceTab(letterUrl)}
                  disabled={!letterUrl}
                  title={letterUrl || "No URL saved"}
                >
                  Open Source Page
                </button>
              </div>

              {letterText ? (
                <div className="whitespace-pre-wrap text-sm leading-6 max-h-[70vh] overflow-auto">
                  {letterText}
                </div>
              ) : (
                <p className="text-sm text-orange-900/80">
                  No transcript saved. Go back to <em>“Choose Your Letter Text”</em> to add it.
                </p>
              )}
            </section>
          )}

          {/* T-Chart panel */}
          <section className={`${getTChartColClass()} bg-green-50 border border-green-200 rounded p-4`}>
            <h2 className="font-bold text-green-900 mb-2">T-Chart — Quote & Explanation</h2>

            {/* ETHOS */}
            <fieldset className="mb-6">
              <legend className="text-lg font-semibold text-gray-900 mb-1">Ethos</legend>
              <p className="text-sm text-gray-700 mb-3">
                Credibility: What does Dr. King say or do that makes the audience trust him?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-700">Ethos — Speech Quote</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={ethosSpeechQuote}
                    onChange={(e) => setEthosSpeechQuote(e.target.value)}
                    placeholder="Short quote from the Speech that shows Ethos"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Ethos — Speech Explanation</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={ethosSpeechNote}
                    onChange={(e) => setEthosSpeechNote(e.target.value)}
                    placeholder="Explain how the Speech quote demonstrates Ethos"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Ethos — Letter Quote</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={ethosLetterQuote}
                    onChange={(e) => setEthosLetterQuote(e.target.value)}
                    placeholder="Short quote from the Letter that shows Ethos"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Ethos — Letter Explanation</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={ethosLetterNote}
                    onChange={(e) => setEthosLetterNote(e.target.value)}
                    placeholder="Explain how the Letter quote demonstrates Ethos"
                  />
                </div>
              </div>
            </fieldset>

            {/* PATHOS */}
            <fieldset className="mb-6">
              <legend className="text-lg font-semibold text-gray-900 mb-1">Pathos</legend>
              <p className="text-sm text-gray-700 mb-3">
                Emotion: What language stirs feelings to persuade the audience?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-700">Pathos — Speech Quote</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={pathosSpeechQuote}
                    onChange={(e) => setPathosSpeechQuote(e.target.value)}
                    placeholder="Short quote from the Speech that shows Pathos"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Pathos — Speech Explanation</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={pathosSpeechNote}
                    onChange={(e) => setPathosSpeechNote(e.target.value)}
                    placeholder="Explain how the Speech quote demonstrates Pathos"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Pathos — Letter Quote</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={pathosLetterQuote}
                    onChange={(e) => setPathosLetterQuote(e.target.value)}
                    placeholder="Short quote from the Letter that shows Pathos"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Pathos — Letter Explanation</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={pathosLetterNote}
                    onChange={(e) => setPathosLetterNote(e.target.value)}
                    placeholder="Explain how the Letter quote demonstrates Pathos"
                  />
                </div>
              </div>
            </fieldset>

            {/* LOGOS */}
            <fieldset>
              <legend className="text-lg font-semibold text-gray-900 mb-1">Logos</legend>
              <p className="text-sm text-gray-700 mb-3">
                Logic & Evidence: What facts, reasons, or examples support the point?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-700">Logos — Speech Quote</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={logosSpeechQuote}
                    onChange={(e) => setLogosSpeechQuote(e.target.value)}
                    placeholder="Short quote from the Speech that shows Logos"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Logos — Speech Explanation</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={logosSpeechNote}
                    onChange={(e) => setLogosSpeechNote(e.target.value)}
                    placeholder="Explain how the Speech quote demonstrates Logos"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Logos — Letter Quote</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={logosLetterQuote}
                    onChange={(e) => setLogosLetterQuote(e.target.value)}
                    placeholder="Short quote from the Letter that shows Logos"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700">Logos — Letter Explanation</label>
                  <textarea
                    className="w-full h-24 border rounded p-2"
                    value={logosLetterNote}
                    onChange={(e) => setLogosLetterNote(e.target.value)}
                    placeholder="Explain how the Letter quote demonstrates Logos"
                  />
                </div>
              </div>
            </fieldset>

            <div className="mt-4 flex gap-3">
              <button
                onClick={saveLocalOnly}
                className="bg-gray-200 text-gray-900 px-4 py-2 rounded hover:bg-gray-300"
              >
                Save Locally
              </button>

              <button
                onClick={saveToSupabase}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Save & Submit
              </button>
            </div>
          </section>
        </div>

        {/* tiny toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded shadow">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}