"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Keys must match what T-Charts reads
const KEYS = {
  letterUrl: "mlk_letter_url",
  letterText: "mlk_letter_text",
};

function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ModuleTwoChooseLetter() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [urlOk, setUrlOk] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const openedSearchRef = useRef(false);

  // Prefill from any existing saved values (in case the user navigates back)
  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem(KEYS.letterUrl) || "";
      const savedTxt = localStorage.getItem(KEYS.letterText) || "";
      if (savedUrl) {
        setUrl(savedUrl);
        setUrlOk(isValidHttpUrl(savedUrl));
      }
      if (savedTxt) setText(savedTxt);
    } catch {}
  }, []);

  // Fire the Google search tab once, in the background (don’t steal focus)
  useEffect(() => {
    if (openedSearchRef.current) return;
    openedSearchRef.current = true;
    try {
      const q = encodeURIComponent("full text Letter from Birmingham Jail");
      window.open(`https://www.google.com/search?q=${q}`, "_blank", "noopener");
      // Keep focus on our app
      setTimeout(() => window.focus(), 30);
    } catch {}
  }, []);

  // Validate as the user types (no extra click needed)
  useEffect(() => {
    setUrlOk(isValidHttpUrl(url.trim()));
  }, [url]);

  const urlHelp = useMemo(() => {
    if (!url) return "";
    return urlOk ? "Looks good!" : "Please enter a valid http(s) URL.";
  }, [url, urlOk]);

  async function handleSave(e) {
    e.preventDefault();
    if (!urlOk || text.trim().length === 0) return;
    try {
      setSaving(true);
      localStorage.setItem(KEYS.letterUrl, url.trim());
      localStorage.setItem(KEYS.letterText, text.trim());
      // small delay purely for UX feedback
      setTimeout(() => router.push("/modules/2/tcharts"), 150);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-extrabold mb-2">
          Module 2 — Choose Your <em>Letter from Birmingham Jail</em> Text
        </h1>

        <p className="text-sm text-gray-700 mb-4">
          I opened a new browser tab with a Google search for{" "}
          <span className="font-semibold">“full text Letter from Birmingham Jail”</span>. Pick a full
          transcript from a reputable site (ideally <code>.edu</code> or <code>.gov</code>). Copy the page’s
          URL and paste it below. Then paste the full letter text (no titles, headers, or page numbers).
        </p>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm text-gray-800">
            <strong>Start / End markers:</strong> The letter should begin with something like:
          </p>
          <blockquote className="italic text-gray-700 mt-2">
            “WHILE confined here in the Birmingham city jail…”
          </blockquote>

          <p className="text-sm text-gray-800 mt-4">and end with:</p>
          <blockquote className="italic text-gray-700 mt-2">
            “Yours for the cause of Peace and Brotherhood, MARTIN LUTHER KING, JR.”
          </blockquote>

          <p className="text-xs text-gray-600 mt-4">
            Attribution: Martin Luther King, Jr., “Letter from Birmingham Jail,” April 1963. (Widely
            reproduced for educational use; verify the full, unabridged text on a reputable source.)
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Paste the URL of the letter transcript you will use
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.edu/letter-from-birmingham-jail-transcript"
              className={`w-full border rounded px-3 py-2 ${
                url.length === 0 ? "" : urlOk ? "border-green-400" : "border-red-500"
              }`}
              required
            />
            {url.length > 0 && (
              <p className={`text-xs mt-1 ${urlOk ? "text-green-600" : "text-red-600"}`}>
                {urlHelp}
              </p>
            )}
          </div>

          {urlOk && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Paste the full letter text (from first word to last — no titles, headers, or page numbers)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full border rounded px-3 py-2 h-64"
                placeholder="Paste the full letter here…"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Minor textual variations are fine. Ensure it’s a complete, reputable transcript.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!urlOk || text.trim().length === 0 || saving}
              className="bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}