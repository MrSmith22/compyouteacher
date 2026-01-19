"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getModule2Sources,
  upsertModule2LetterSource,
} from "@/lib/supabase/helpers/module2Sources";

const KEYS = {
  letterUrl: "mlk_letter_url",
  letterText: "mlk_letter_text",
  letterSiteName: "mlk_letter_site_name",
  letterYear: "mlk_letter_year",
  letterCitation: "mlk_letter_citation",
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
  const { data: session } = useSession();

  const [url, setUrl] = useState("");
  const [urlOk, setUrlOk] = useState(false);
  const [touched, setTouched] = useState(false);

  const [text, setText] = useState("");
  const [siteName, setSiteName] = useState("");
  const [year, setYear] = useState("");
  const [citation, setCitation] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const openedSearchRef = useRef(false);

  // Prefill from existing saved values (Supabase first, then localStorage)
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const email = session?.user?.email || null;

        if (email) {
          const { data, error } = await getModule2Sources({ userEmail: email });

          if (
            error &&
            typeof error.code === "string" &&
            error.code !== "PGRST116"
          ) {
            console.warn(
              "Error loading letter source from module2_sources:",
              error
            );
          }

          if (data) {
            const savedUrl = data.lfbj_url || "";
            const savedTxt = data.lfbj_text || "";
            const savedSite = data.lfbj_site_name || "";
            const savedYear = data.lfbj_transcript_year || "";
            const savedCitation = data.lfbj_citation || "";

            if (savedUrl) {
              setUrl(savedUrl);
              setUrlOk(isValidHttpUrl(savedUrl));
            }
            if (savedTxt) setText(savedTxt);
            if (savedSite) setSiteName(savedSite);
            if (savedYear) setYear(savedYear);
            if (savedCitation) setCitation(savedCitation);

            setLoading(false);
            return;
          }
        }

        // Fallback to localStorage
        try {
          const savedUrl = localStorage.getItem(KEYS.letterUrl) || "";
          const savedTxt = localStorage.getItem(KEYS.letterText) || "";
          const savedSite = localStorage.getItem(KEYS.letterSiteName) || "";
          const savedYear = localStorage.getItem(KEYS.letterYear) || "";
          const savedCitation = localStorage.getItem(KEYS.letterCitation) || "";

          if (savedUrl) {
            setUrl(savedUrl);
            setUrlOk(isValidHttpUrl(savedUrl));
          }
          if (savedTxt) setText(savedTxt);
          if (savedSite) setSiteName(savedSite);
          if (savedYear) setYear(savedYear);
          if (savedCitation) setCitation(savedCitation);
        } catch (err) {
          console.error("Error reading Module 2 letter localStorage:", err);
        }
      } catch (err) {
        console.error("Unexpected error loading Module 2 letter:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSaved();
  }, [session]);

  // Open Google search tab once, in the background
  useEffect(() => {
    if (openedSearchRef.current) return;
    openedSearchRef.current = true;
    try {
      const q = encodeURIComponent("full text Letter from Birmingham Jail");
      window.open(
        `https://www.google.com/search?q=${q}`,
        "_blank",
        "noopener"
      );
      setTimeout(() => window.focus(), 30);
    } catch {
      // ignore
    }
  }, []);

  // Derived error text for the URL (match speech page behavior)
  const urlError = useMemo(() => {
    if (!touched) return "";
    if (!url) return "Please enter a URL.";
    if (!isValidHttpUrl(url)) return "Please enter a valid http or https URL.";
    return "";
  }, [url, touched]);

  const onUrlChange = (v) => {
    setUrl(v);
    setUrlOk(isValidHttpUrl(v));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setTouched(true);

    const trimmedUrl = url.trim();
    const trimmedText = text.trim();
    const trimmedSiteName = siteName.trim();
    const trimmedYear = year.trim();
    const trimmedCitation = citation.trim();

    const hasUrlAndText =
      isValidHttpUrl(trimmedUrl) && trimmedText.length > 0;
    const hasCitation = trimmedCitation.length > 0;

    if (!hasUrlAndText || !hasCitation) {
      return;
    }

    try {
      setSaving(true);

      // Save to localStorage
      try {
        localStorage.setItem(KEYS.letterUrl, trimmedUrl);
        localStorage.setItem(KEYS.letterText, trimmedText);
        localStorage.setItem(KEYS.letterSiteName, trimmedSiteName);
        localStorage.setItem(KEYS.letterYear, trimmedYear);
        localStorage.setItem(KEYS.letterCitation, trimmedCitation);
      } catch (err) {
        console.warn("Could not write Module 2 letter localStorage:", err);
      }

      const userEmail = session?.user?.email || null;

      if (userEmail) {
        // Read existing speech fields so we do not lose them
        const { data: existing, error: loadErr } = await getModule2Sources({
          userEmail,
        });

        if (
          loadErr &&
          typeof loadErr.code === "string" &&
          loadErr.code !== "PGRST116"
        ) {
          console.warn(
            "Error loading existing speech data from module2_sources:",
            loadErr
          );
        }

        const { error: upsertErr } = await upsertModule2LetterSource({
          userEmail,
          letterUrl: trimmedUrl,
          letterText: trimmedText,
          letterSiteName: trimmedSiteName || null,
          letterTranscriptYear: trimmedYear || null,
          letterCitation: trimmedCitation,
          speechUrl: existing?.mlk_url || null,
          speechText: existing?.mlk_text || null,
          speechSiteName: existing?.mlk_site_name || null,
          speechTranscriptYear: existing?.mlk_transcript_year || null,
          speechCitation: existing?.mlk_citation || null,
        });

        if (upsertErr) {
          console.error(
            "Error saving letter to module2_sources:",
            upsertErr
          );
        }
      }

      router.push("/modules/2/tcharts");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">Loading your saved work...</p>
      </div>
    );
  }

  const canSubmit =
    urlOk &&
    text.trim().length > 0 &&
    citation.trim().length > 0 &&
    !saving;

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <form
        onSubmit={handleSave}
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-6"
      >
        {/* Module objective card (red) */}
        <div className="rounded-xl border border-theme-red/40 bg-theme-red/5 p-4 shadow-sm">
          <h1 className="text-2xl font-extrabold mb-1 text-theme-red">
            Module 2: Build an APA source for the letter
          </h1>
          <p className="text-sm text-theme-dark/80">
            In this step you will choose an online transcript of{" "}
            <em>Letter from Birmingham Jail</em> and turn it into a complete APA
            reference. You are practicing the same structure you used for the
            speech so that you can transfer your skills to a new text.
          </p>
        </div>

        {/* Step 1 card (orange) */}
        <div className="rounded-xl border border-theme-orange/40 bg-theme-orange/5 p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-theme-orange">
            Step 1: Choose a full letter transcript
          </h2>
          <p className="text-sm text-theme-dark/80">
            A new tab was opened that searched for{" "}
            <span className="font-semibold">
              full text Letter from Birmingham Jail
            </span>
            . You should select a page that reprints the original letter as a
            primary document, not the Atlantic magazine version.
          </p>
          <ul className="list-disc list-inside text-sm text-theme-dark/80 space-y-1">
            <li>
              Look for a complete text that starts with Dr. King being confined
              in the Birmingham city jail.
            </li>
            <li>
              Prefer educational sites, archives, or university collections such
              as the University of Pennsylvania African Studies Center.
            </li>
            <li>Avoid the Atlantic magazine article for this assignment.</li>
          </ul>

          <div className="mt-3">
            <label className="block text-sm font-medium mb-1 text-theme-dark">
              Paste the URL of the letter transcript you will use
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="https://example.edu/letter-from-birmingham-jail-transcript"
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white ${
                urlError ? "border-theme-red" : "border-theme-dark/10"
              }`}
              required
            />
            {urlError && (
              <p className="text-theme-red text-xs mt-1">{urlError}</p>
            )}
          </div>
        </div>

        {/* Step 2 card (green) */}
        {urlOk && (
          <div className="rounded-xl border border-theme-green/40 bg-theme-green/5 p-4 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-theme-green">
              Step 2: Paste the full letter text
            </h2>
            <p className="text-sm text-theme-dark/80">
              Copy the letter text only. Do not include titles, headers, or page
              numbers. Your text should begin and end like this:
            </p>

            <div className="bg-white rounded-lg border border-theme-green/30 p-3 text-xs text-theme-dark space-y-2">
              <div>
                <span className="font-semibold">Start example:</span>
                <blockquote className="italic mt-1">
                  While confined here in the Birmingham city jail...
                </blockquote>
              </div>
              <div>
                <span className="font-semibold">End example:</span>
                <blockquote className="italic mt-1">
                  Yours for the cause of Peace and Brotherhood, Martin Luther
                  King, Jr.
                </blockquote>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 h-64 text-sm font-mono border-theme-green/40 bg-white"
              placeholder="Paste the full letter here..."
              required
            />
            <p className="text-xs text-theme-dark/60">
              Minor differences across sites are fine as long as the letter is
              complete and from a reputable source.
            </p>
          </div>
        )}

        {/* Step 3 card (blue) */}
        {urlOk && (
          <div className="rounded-xl border border-theme-blue/40 bg-theme-blue/5 p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-theme-blue">
              Step 3: Collect the APA elements
            </h2>
            <p className="text-sm text-theme-dark/80">
              Just like with the speech, APA asks for the same core elements in
              a set order. The only difference is the descriptor. Now you are
              working with a letter transcript.
            </p>

            {/* Author card */}
            <div className="bg-white rounded-lg border border-theme-blue/40 p-3 shadow-sm">
              <h3 className="text-sm font-semibold mb-1 text-theme-dark">
                Author
              </h3>
              <p className="text-xs text-theme-dark/80 mb-2">
                The author of the letter is also Dr. Martin Luther King Jr. APA
                uses last name and initials. For this assignment, the author is:
              </p>
              <p className="text-xs font-mono bg-theme-light rounded px-2 py-1 inline-block text-theme-dark">
                King, M. L., Jr.
              </p>
              <p className="text-xs text-theme-dark/60 mt-2">
                You will type this inside your final reference. You do not need
                a separate field for it.
              </p>
            </div>

            {/* Year and site cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg border border-theme-blue/40 p-3 shadow-sm">
                <h3 className="text-sm font-semibold mb-1 text-theme-dark">
                  Year of transcript
                </h3>
                <p className="text-xs text-theme-dark/80 mb-2">
                  Look for a year on the page you selected. It may appear in a
                  header, footer, or copyright statement. This is when this
                  online version was posted, not when the letter was written.
                </p>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="For example: 2002 or n.d."
                  className="w-full border rounded px-2 py-1 text-sm border-theme-blue/40 bg-white"
                />
                <p className="text-xs text-theme-dark/60 mt-1">
                  If you cannot find a year, write{" "}
                  <span className="italic">n.d.</span> for no date.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-theme-blue/40 p-3 shadow-sm">
                <h3 className="text-sm font-semibold mb-1 text-theme-dark">
                  Website or organization name
                </h3>
                <p className="text-xs text-theme-dark/80 mb-2">
                  This is the name of the site hosting the letter. For example:
                  University of Pennsylvania African Studies Center or a similar
                  archive.
                </p>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="For example: University of Pennsylvania African Studies Center"
                  className="w-full border rounded px-2 py-1 text-sm border-theme-blue/40 bg-white"
                />
                <p className="text-xs text-theme-dark/60 mt-1">
                  This name appears after the descriptor in your reference.
                </p>
              </div>
            </div>

            {/* Descriptor and original work year */}
            <div className="bg-white rounded-lg border border-theme-blue/40 p-3 shadow-sm">
              <h3 className="text-sm font-semibold mb-1 text-theme-dark">
                Descriptor and original work year
              </h3>
              <p className="text-xs text-theme-dark/80 mb-1">
                In this case you are using a written letter that has been
                reprinted online. Your descriptor is:
              </p>
              <p className="text-xs font-mono bg-theme-light rounded px-2 py-1 inline-block text-theme-dark">
                [Letter transcript]
              </p>
              <p className="text-xs text-theme-dark/80 mt-2">
                At the very end of the reference you record the year the letter
                was originally written:
              </p>
              <p className="text-xs font-mono bg-theme-light rounded px-2 py-1 inline-block text-theme-dark">
                (Original work published 1963).
              </p>
            </div>

            {/* Step 4 card (red) inside the flow */}
            <div className="bg-white rounded-lg border border-theme-red/40 p-3 shadow-sm space-y-2">
              <h3 className="text-sm font-semibold text-theme-red">
                Step 4: Type your full APA reference
              </h3>
              <p className="text-xs text-theme-dark/80">
                Now put everything together in one reference. Follow the same
                pattern you used for the speech and replace the year, site name,
                and URL with the details from your letter page.
              </p>
              <p className="text-xs font-mono bg-theme-light rounded px-2 py-1 text-theme-dark">
                King, M. L., Jr. (Year). <em>Letter from Birmingham jail</em>{" "}
                [Letter transcript]. Site Name. URL (Original work published
                1963).
              </p>
              <textarea
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                className="w-full border rounded px-3 py-2 h-24 text-sm border-theme-red/40 bg-white"
                placeholder="Example: King, M. L., Jr. (n.d.). Letter from Birmingham jail [Letter transcript]. University of Pennsylvania African Studies Center. https://www.africa.upenn.edu/... (Original work published 1963)."
                required
              />
              <p className="text-xs text-theme-dark/60">
                This reference will join your speech reference in your final
                list of sources later in the writing process.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-5 py-2 rounded-lg text-sm font-semibold text-white ${
              canSubmit
                ? "bg-theme-green hover:opacity-90"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? "Saving..." : "Save letter source and go to T Charts"}
          </button>
        </div>
      </form>
    </div>
  );
}