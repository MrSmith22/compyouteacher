"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { logActivity } from "@/lib/logActivity";

const KEYS = {
  speechUrl: "mlk_speech_url",
  speechText: "mlk_speech_text",
};

function isValidHttpUrl(v) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ModuleTwo_ChooseSpeech() {
  const router = useRouter();
  const { data: session } = useSession();

  const [url, setUrl] = useState("");
  const [urlOk, setUrlOk] = useState(false);
  const [touched, setTouched] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  // preload any previously-saved values
  useEffect(() => {
    try {
      const u = localStorage.getItem(KEYS.speechUrl) || "";
      const t = localStorage.getItem(KEYS.speechText) || "";
      if (u) {
        setUrl(u);
        setUrlOk(isValidHttpUrl(u));
      }
      if (t) setText(t);
    } catch {}
  }, []);

  // derived error text (prevents brief “red error” flash)
  const urlError = useMemo(() => {
    if (!touched) return "";
    if (!url) return "Please enter a URL.";
    if (!isValidHttpUrl(url)) return "Please enter a valid http(s) URL.";
    return "";
  }, [url, touched]);

  const onUrlChange = (v) => {
    setUrl(v);
    setUrlOk(isValidHttpUrl(v));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    const ok = isValidHttpUrl(url) && text.trim().length > 0;
    if (!ok) return;

    setSaving(true);
    const trimmedUrl = url.trim();
    const trimmedText = text.trim();
    const userEmail = session?.user?.email || null;

    try {
      // Save to localStorage so the student can come back later.
      localStorage.setItem(KEYS.speechUrl, trimmedUrl);
      localStorage.setItem(KEYS.speechText, trimmedText);
    } catch {}

    // Log activity if we know who this is
    if (userEmail) {
      try {
        // A) they chose a source URL
        await logActivity(userEmail, "speech_url_saved", {
          module: 2,
          item: "i_have_a_dream",
          url: trimmedUrl,
        });

        // B) they pasted the full transcript
        await logActivity(userEmail, "speech_transcript_saved", {
          module: 2,
          item: "i_have_a_dream",
          textLength: trimmedText.length,
          // tiny sample so you can eyeball which version they used
          sample: trimmedText.slice(0, 120),
        });
      } catch (err) {
        console.error("Error logging Module 2 speech selection:", err);
      }
    }

    // Open Google search for the Letter in a background tab,
    // then immediately bring focus back to this app tab.
    try {
      const q = encodeURIComponent("full text Letter from Birmingham Jail");
      window.open(`https://www.google.com/search?q=${q}`, "_blank", "noopener");
      setTimeout(() => window.focus(), 100);
    } catch {}

    // Go to the Letter selection step
    router.push("/modules/2/letter");
  };

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-extrabold mb-2">
          Module 2 — Choose Your <span className="italic">I Have a Dream</span> Speech Text
        </h1>

        <p className="text-sm text-gray-700 mb-4">
          We’re practicing careful research in small steps. Pick a full transcript from a reputable
          site (prefer <code>.edu</code> or <code>.gov</code>). Copy that page’s URL and paste it below,
          then paste the full transcript text.
        </p>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm text-gray-800">
            <strong>Check the beginning and ending:</strong>
          </p>
          <blockquote className="italic text-gray-700 mt-2">
            “I am happy to join with you today in what will go down in history as the greatest
            demonstration for freedom in the history of our nation.”
          </blockquote>
          <p className="text-sm text-gray-800 mt-3">and ends with:</p>
          <blockquote className="italic text-gray-700 mt-2">
            “Free at last, free at last. Thank God Almighty, we are free at last.”
          </blockquote>
          <p className="text-xs text-gray-600 mt-4">
            Source attribution: Martin Luther King, Jr., “I Have a Dream,” delivered 28 Aug 1963,
            at the Lincoln Memorial, Washington, D.C. (public domain).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Paste the URL of the speech transcript you will use
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="https://example.edu/i-have-a-dream-transcript"
              className={`w-full border rounded px-3 py-2 ${
                urlError ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {urlError && (
              <p className="text-red-600 text-sm mt-1">
                {urlError}
              </p>
            )}
          </div>

          {urlOk && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Paste the full speech text (from the very first word to the last—no titles or page numbers)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full border rounded px-3 py-2 h-56"
                placeholder="Paste the full transcript here…"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Minor variations are okay; choose a clean, complete transcript.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!urlOk || text.trim().length === 0 || saving}
            className="bg-theme-blue text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}