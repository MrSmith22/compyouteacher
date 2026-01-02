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

      setEthosSpeechQuote(
        localStorage.getItem(TCHART_KEYS.ethosSpeechQuote) || ""
      );
      setEthosSpeechNote(
        localStorage.getItem(TCHART_KEYS.ethosSpeechNote) || ""
      );
      setEthosLetterQuote(
        localStorage.getItem(TCHART_KEYS.ethosLetterQuote) || ""
      );
      setEthosLetterNote(
        localStorage.getItem(TCHART_KEYS.ethosLetterNote) || ""
      );

      setPathosSpeechQuote(
        localStorage.getItem(TCHART_KEYS.pathosSpeechQuote) || ""
      );
      setPathosSpeechNote(
        localStorage.getItem(TCHART_KEYS.pathosSpeechNote) || ""
      );
      setPathosLetterQuote(
        localStorage.getItem(TCHART_KEYS.pathosLetterQuote) || ""
      );
      setPathosLetterNote(
        localStorage.getItem(TCHART_KEYS.pathosLetterNote) || ""
      );

      setLogosSpeechQuote(
        localStorage.getItem(TCHART_KEYS.logosSpeechQuote) || ""
      );
      setLogosSpeechNote(
        localStorage.getItem(TCHART_KEYS.logosSpeechNote) || ""
      );
      setLogosLetterQuote(
        localStorage.getItem(TCHART_KEYS.logosLetterQuote) || ""
      );
      setLogosLetterNote(
        localStorage.getItem(TCHART_KEYS.logosLetterNote) || ""
      );
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const openSourceTab = (url) => {
    if (!url) return;
    try {
      window.open(url, "_blank", "noopener"); // open without stealing focus
      setToast("Source tab opened");
      setTimeout(() => setToast(""), 1600);
      setTimeout(() => window.focus(), 50); // nudge focus back
    } catch {
      // ignore
    }
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

  // 1) Save locally
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Module objective card (red) */}
        <div className="rounded-xl border border-theme-red/40 bg-theme-red/5 p-4 shadow-sm">
          <h1 className="text-2xl font-extrabold mb-1 text-theme-red">
            Module 2: Analyze the speech and the letter
          </h1>
          <p className="text-sm text-theme-dark/80">
            In this step you will use a T-Chart to compare how{" "}
            <em>I Have a Dream</em> and <em>Letter from Birmingham Jail</em>{" "}
            use the three rhetorical appeals: Ethos, Pathos, and Logos.
          </p>
        </div>

        {/* Instructions card (orange) */}
        <div className="rounded-xl border border-theme-orange/40 bg-theme-orange/5 p-4 shadow-sm">
          <h2 className="text-lg font-bold text-theme-orange mb-1">
            What to do on this page
          </h2>
          <p className="text-sm text-theme-dark/80">
            For each rhetorical appeal—<strong>Ethos</strong>,{" "}
            <strong>Pathos</strong>, and <strong>Logos</strong>—complete all
            four boxes:
          </p>
          <ol className="list-decimal list-inside mt-2 text-sm text-theme-dark/90 space-y-1">
            <li>
              <strong>Speech Quote</strong> — a short quote from{" "}
              <em>I Have a Dream</em> that shows the appeal.
            </li>
            <li>
              <strong>Speech Explanation</strong> — how the quote demonstrates
              the appeal in the Speech.
            </li>
            <li>
              <strong>Letter Quote</strong> — a short quote from{" "}
              <em>Letter from Birmingham Jail</em> that shows the same appeal.
            </li>
            <li>
              <strong>Letter Explanation</strong> — how the quote demonstrates
              the appeal in the Letter.
            </li>
          </ol>
          <p className="mt-2 text-sm text-theme-dark/80">
            Finish <strong>Ethos</strong> first, then repeat for{" "}
            <strong>Pathos</strong> and <strong>Logos</strong>.
            <span className="block text-xs text-theme-dark/60 mt-1">
              Tip: keep quotes short (one sentence or less) so your explanations
              show your thinking.
            </span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              showSpeech
                ? "bg-theme-blue text-white"
                : "bg-theme-blue/10 text-theme-blue"
            }`}
            onClick={() => setShowSpeech((v) => !v)}
          >
            {showSpeech ? "Close Speech Panel" : "Open Speech Panel"}
          </button>

          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              showLetter
                ? "bg-theme-orange text-white"
                : "bg-theme-orange/10 text-theme-orange"
            }`}
            onClick={() => setShowLetter((v) => !v)}
          >
            {showLetter ? "Close Letter Panel" : "Open Letter Panel"}
          </button>

          <p className="text-xs text-theme-dark/60 mt-2">
            On large screens, Speech (blue), Letter (orange), and T-Chart
            (green) can appear side-by-side. On smaller screens they stack.
          </p>
        </div>

        {/* Responsive area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Speech panel (blue) */}
          {showSpeech && (
            <section
              className={`${getTranscriptColClass(
                "speech"
              )} bg-theme-blue/5 border border-theme-blue/30 rounded-2xl p-4 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-theme-blue">Speech transcript</h2>
                <button
                  className="text-xs underline text-theme-blue"
                  onClick={() => openSourceTab(speechUrl)}
                  disabled={!speechUrl}
                  title={speechUrl || "No URL saved"}
                >
                  Open source page
                </button>
              </div>

              {speechText ? (
                <div className="whitespace-pre-wrap text-xs sm:text-sm leading-6 max-h-[70vh] overflow-auto bg-white border border-theme-blue/10 rounded-lg p-3">
                  {speechText}
                </div>
              ) : (
                <p className="text-sm text-theme-blue/80">
                  No transcript saved. Go back to{" "}
                  <em>“Build an APA source for the speech”</em> to add it.
                </p>
              )}
            </section>
          )}

          {/* Letter panel (orange) */}
          {showLetter && (
            <section
              className={`${getTranscriptColClass(
                "letter"
              )} bg-theme-orange/5 border border-theme-orange/30 rounded-2xl p-4 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-theme-orange">
                  Letter transcript
                </h2>
                <button
                  className="text-xs underline text-theme-orange"
                  onClick={() => openSourceTab(letterUrl)}
                  disabled={!letterUrl}
                  title={letterUrl || "No URL saved"}
                >
                  Open source page
                </button>
              </div>

              {letterText ? (
                <div className="whitespace-pre-wrap text-xs sm:text-sm leading-6 max-h-[70vh] overflow-auto bg-white border border-theme-orange/10 rounded-lg p-3">
                  {letterText}
                </div>
              ) : (
                <p className="text-sm text-theme-orange/80">
                  No transcript saved. Go back to{" "}
                  <em>“Build an APA source for the letter”</em> to add it.
                </p>
              )}
            </section>
          )}

          {/* T-Chart panel (green container, white cards) */}
          <section
            className={`${getTChartColClass()} bg-theme-green/5 border border-theme-green/30 rounded-2xl p-4 shadow-sm space-y-6`}
          >
            <h2 className="font-bold text-theme-green mb-1">
              T-Chart — quote and explanation
            </h2>

            {/* ETHOS card */}
            <div className="rounded-xl bg-white border border-theme-green/30 p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-theme-dark mb-1">
                Ethos
              </h3>
              <p className="text-sm text-theme-dark/80 mb-3">
                <strong>Credibility:</strong> What does Dr. King say or do that
                makes the audience trust him?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Ethos — Speech quote
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={ethosSpeechQuote}
                    onChange={(e) => setEthosSpeechQuote(e.target.value)}
                    placeholder="Short quote from the Speech that shows Ethos"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Ethos — Speech explanation
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={ethosSpeechNote}
                    onChange={(e) => setEthosSpeechNote(e.target.value)}
                    placeholder="Explain how the Speech quote demonstrates Ethos"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Ethos — Letter quote
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={ethosLetterQuote}
                    onChange={(e) => setEthosLetterQuote(e.target.value)}
                    placeholder="Short quote from the Letter that shows Ethos"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Ethos — Letter explanation
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={ethosLetterNote}
                    onChange={(e) => setEthosLetterNote(e.target.value)}
                    placeholder="Explain how the Letter quote demonstrates Ethos"
                  />
                </div>
              </div>
            </div>

            {/* PATHOS card */}
            <div className="rounded-xl bg-white border border-theme-green/30 p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-theme-dark mb-1">
                Pathos
              </h3>
              <p className="text-sm text-theme-dark/80 mb-3">
                <strong>Emotion:</strong> What language stirs feelings to
                persuade the audience?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Pathos — Speech quote
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={pathosSpeechQuote}
                    onChange={(e) => setPathosSpeechQuote(e.target.value)}
                    placeholder="Short quote from the Speech that shows Pathos"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Pathos — Speech explanation
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={pathosSpeechNote}
                    onChange={(e) => setPathosSpeechNote(e.target.value)}
                    placeholder="Explain how the Speech quote demonstrates Pathos"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Pathos — Letter quote
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={pathosLetterQuote}
                    onChange={(e) => setPathosLetterQuote(e.target.value)}
                    placeholder="Short quote from the Letter that shows Pathos"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Pathos — Letter explanation
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={pathosLetterNote}
                    onChange={(e) => setPathosLetterNote(e.target.value)}
                    placeholder="Explain how the Letter quote demonstrates Pathos"
                  />
                </div>
              </div>
            </div>

            {/* LOGOS card */}
            <div className="rounded-xl bg-white border border-theme-green/30 p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-theme-dark mb-1">
                Logos
              </h3>
              <p className="text-sm text-theme-dark/80 mb-3">
                <strong>Logic and evidence:</strong> What facts, reasons, or
                examples support the point?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Logos — Speech quote
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={logosSpeechQuote}
                    onChange={(e) => setLogosSpeechQuote(e.target.value)}
                    placeholder="Short quote from the Speech that shows Logos"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Logos — Speech explanation
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={logosSpeechNote}
                    onChange={(e) => setLogosSpeechNote(e.target.value)}
                    placeholder="Explain how the Speech quote demonstrates Logos"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Logos — Letter quote
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={logosLetterQuote}
                    onChange={(e) => setLogosLetterQuote(e.target.value)}
                    placeholder="Short quote from the Letter that shows Logos"
                  />
                </div>
                <div>
                  <label className="text-xs text-theme-dark/80 block mb-1">
                    Logos — Letter explanation
                  </label>
                  <textarea
                    className="w-full h-24 border border-theme-dark/10 rounded-lg p-2 text-sm bg-white"
                    value={logosLetterNote}
                    onChange={(e) => setLogosLetterNote(e.target.value)}
                    placeholder="Explain how the Letter quote demonstrates Logos"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                onClick={saveLocalOnly}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-theme-dark/5 text-theme-dark hover:bg-theme-dark/10"
              >
                Save locally
              </button>

              <button
                onClick={saveToSupabase}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-theme-green text-white hover:opacity-90"
              >
                Save and submit
              </button>
            </div>
          </section>
        </div>

        {/* tiny toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-theme-dark text-white text-sm px-3 py-2 rounded shadow">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}