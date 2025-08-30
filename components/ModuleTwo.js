"use client";

import { useEffect, useMemo, useState } from "react";

const SEARCH_URL =
  "https://www.google.com/search?q=full+text+I+Have+a+Dream+speech";

const URL_KEY = "m2_speech_url";
const TEXT_KEY = "m2_speech_text";

export default function ModuleTwo() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(null); // null | { words: number, anchors: number }

  // hydrate from localStorage once
  useEffect(() => {
    try {
      const u = localStorage.getItem(URL_KEY) || "";
      const t = localStorage.getItem(TEXT_KEY) || "";
      if (u) setUrl(u);
      if (t) setText(t);
    } catch {}
  }, []);

  const canContinueFrom1 = true;
  const canContinueFrom2 = !!url;
  const canContinueFrom3 = !!text;

  const handleNextFrom1 = () => {
    // open search in a new tab, move to step 2
    window.open(SEARCH_URL, "_blank", "noopener,noreferrer");
    setStep(2);
  };

  const saveUrl = () => {
    localStorage.setItem(URL_KEY, url.trim());
  };

  const saveText = () => {
    localStorage.setItem(TEXT_KEY, text.trim());
  };

  // super-light “did you paste the transcript?” sanity check
  const checkPaste = () => {
    const cleaned = text
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    const words = cleaned.split(" ").filter(Boolean).length;

    const anchors = ["i have a dream", "one hundred years later"].reduce(
      (acc, a) => acc + (cleaned.includes(a) ? 1 : 0),
      0
    );

    setChecked({ words, anchors });
  };

  const openSavedTranscript = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow p-6 rounded space-y-6">
      <h1 className="text-3xl font-extrabold">Module 2 — Analyze the Speech</h1>

      {/* Step indicator */}
      <div className="text-sm text-gray-600">Step {step} of 3</div>

      {/* STEP 1: Watch video */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-gray-700">
            1) Watch Dr. King’s <em>I Have a Dream</em> speech below. When
            you’re done, click <strong>Next</strong>.
          </p>

          <div className="aspect-video">
            <iframe
              src="https://www.youtube.com/embed/vP4iY1TtS3s"
              title="I Have a Dream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded"
            />
          </div>

          <div className="flex justify-end">
            <button
              className="bg-theme-blue text-white px-4 py-2 rounded"
              onClick={handleNextFrom1}
              disabled={!canContinueFrom1}
            >
              Next: find the full transcript
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Google search + URL input */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-gray-700">
            A new tab with a Google search for{" "}
            <strong>“full text I Have a Dream speech”</strong> has been opened.
            Choose a reliable source (ideally a <code>.edu</code> or{" "}
            <code>.gov</code> site) that contains the <strong>full transcript</strong> (no
            summaries). Paste the URL of the page you picked below, then click{" "}
            <strong>Save URL</strong>.
          </p>

          <div className="flex gap-2">
            <input
              type="url"
              className="flex-1 border p-2 rounded"
              placeholder="https://example.edu/speech/full-transcript"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              className="bg-theme-green text-white px-4 py-2 rounded"
              onClick={saveUrl}
              disabled={!url}
            >
              Save URL
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="text-theme-blue underline"
              onClick={() =>
                window.open(SEARCH_URL, "_blank", "noopener,noreferrer")
              }
            >
              Re-open Google search
            </button>

            <button
              className="ml-auto bg-theme-blue text-white px-4 py-2 rounded"
              onClick={() => setStep(3)}
              disabled={!canContinueFrom2}
            >
              Next: paste transcript
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Paste transcript + quick check */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-gray-700">
            Paste the <strong>entire transcript text only</strong> (no title,
            page numbers, notes, or commentary). Start from the first word of
            the speech and end with the last word.
          </p>

          <textarea
            className="w-full h-64 border p-2 rounded font-mono"
            placeholder="Paste the full transcript here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              className="bg-theme-green text-white px-4 py-2 rounded"
              onClick={saveText}
              disabled={!text}
            >
              Save text
            </button>
            <button
              className="bg-theme-blue text-white px-4 py-2 rounded"
              onClick={checkPaste}
              disabled={!text}
            >
              Check my paste
            </button>
            <button
              className="ml-auto bg-gray-700 text-white px-4 py-2 rounded"
              onClick={openSavedTranscript}
              disabled={!text}
            >
              Open my saved transcript
            </button>
          </div>

          {checked && (
            <div className="text-sm text-gray-700 bg-gray-50 border rounded p-3">
              <div>
                <strong>Words detected:</strong> {checked.words}
              </div>
              <div>
                <strong>Anchor phrases found:</strong> {checked.anchors} / 2
                (looking for parts of “I have a dream”, “One hundred years
                later”)
              </div>
              <div className="text-gray-600 mt-1">
                This is a quick sanity check, not a grade. We’ll run a more
                flexible comparison later to account for small variations.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}