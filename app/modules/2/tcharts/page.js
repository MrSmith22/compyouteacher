"use client";

import { useEffect, useState } from "react";

const KEYS = {
  speechUrl: "mlk_speech_url",
  speechText: "mlk_speech_text",
  letterUrl: "mlk_letter_url",
  letterText: "mlk_letter_text",
};

export default function ModuleTwoTCharts() {
  const [speechUrl, setSpeechUrl] = useState("");
  const [speechText, setSpeechText] = useState("");
  const [letterUrl, setLetterUrl] = useState("");
  const [letterText, setLetterText] = useState("");

  const [showSpeech, setShowSpeech] = useState(false);
  const [showLetter, setShowLetter] = useState(false);

  // Toast indicator when we open a source in a background tab
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      setSpeechUrl(localStorage.getItem(KEYS.speechUrl) || "");
      setSpeechText(localStorage.getItem(KEYS.speechText) || "");
      setLetterUrl(localStorage.getItem(KEYS.letterUrl) || "");
      setLetterText(localStorage.getItem(KEYS.letterText) || "");
    } catch {}
  }, []);

  const openSourceTab = (url) => {
    if (!url) return;
    try {
      window.open(url, "_blank", "noopener"); // open but don’t steal focus
      setToast("Source tab opened");
      setTimeout(() => setToast(""), 1600);
      setTimeout(() => window.focus(), 50); // nudge focus back to app
    } catch {}
  };

  // layout: if one panel open → 2/3 width, if both → each 1/3
  const getColClass = (panel) => {
    const both = showSpeech && showLetter;
    if (both) return "w-full lg:w-1/3";
    const thisOpen = panel === "speech" ? showSpeech : showLetter;
    return thisOpen ? "w-full lg:w-2/3" : "w-full lg:w-1/3";
  };

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-4">
          Module 2 — Analyze the Speech & Letter
        </h1>

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
          On large screens, Speech (blue), Letter (orange), and T-Chart (green) will sit side-by-side.
          On smaller screens they stack — you may need to scroll to see both transcripts when open.
        </p>

        {/* Responsive 3-column area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Speech panel */}
          {showSpeech && (
            <section
              className={`${getColClass("speech")} bg-blue-50 border border-blue-200 rounded p-4`}
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
              className={`${getColClass("letter")} bg-orange-50 border border-orange-200 rounded p-4`}
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
          <section className="w-full lg:w-1/3 bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-bold text-green-900 mb-2">T-Chart — Quote & Comment</h2>

            {/* Example boxes — wire to your existing state/save logic */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600">Ethos — Quote</label>
                <textarea className="w-full h-24 border rounded p-2"></textarea>
              </div>
              <div>
                <label className="text-xs text-gray-600">Ethos — Comment</label>
                <textarea className="w-full h-24 border rounded p-2"></textarea>
              </div>

              <div>
                <label className="text-xs text-gray-600">Pathos — Quote</label>
                <textarea className="w-full h-24 border rounded p-2"></textarea>
              </div>
              <div>
                <label className="text-xs text-gray-600">Pathos — Comment</label>
                <textarea className="w-full h-24 border rounded p-2"></textarea>
              </div>

              <div>
                <label className="text-xs text-gray-600">Logos — Quote</label>
                <textarea className="w-full h-24 border rounded p-2"></textarea>
              </div>
              <div>
                <label className="text-xs text-gray-600">Logos — Comment</label>
                <textarea className="w-full h-24 border rounded p-2"></textarea>
              </div>
            </div>

            <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded">
              Save T-Charts
            </button>
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