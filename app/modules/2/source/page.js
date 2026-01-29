"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { logActivity } from "@/lib/logActivity";
import { makeStudentKey } from "@/lib/storage/studentCache";
import {
  getModule2Sources,
  upsertModule2SpeechSource,
} from "@/lib/supabase/helpers/module2Sources";

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
  const [siteName, setSiteName] = useState("");
  const [year, setYear] = useState("");
  const [citation, setCitation] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved data: Supabase first, then localStorage as a fallback
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const email = session?.user?.email || null;

        if (email) {
          const { data, error } = await getModule2Sources({ userEmail: email });

          if (error && error.code !== "PGRST116") {
            console.error("Error loading module2_sources:", error);
          }

          if (data) {
            const savedUrl = data.mlk_url || "";
            const savedText = data.mlk_text || "";
            const savedSite = data.mlk_site_name || "";
            const savedYear = data.mlk_transcript_year || "";
            const savedCitation = data.mlk_citation || "";

            if (savedUrl) {
              setUrl(savedUrl);
              setUrlOk(isValidHttpUrl(savedUrl));
            }
            if (savedText) setText(savedText);
            if (savedSite) setSiteName(savedSite);
            if (savedYear) setYear(savedYear);
            if (savedCitation) setCitation(savedCitation);

            setLoading(false);
            return;
          }
        }

        // Fallback to user-scoped localStorage only when we have email
        if (email) {
          try {
            const u =
              localStorage.getItem(
                makeStudentKey(email, ["mlk", "module2", "speechUrl"])
              ) || "";
            const t =
              localStorage.getItem(
                makeStudentKey(email, ["mlk", "module2", "speechText"])
              ) || "";
            const s =
              localStorage.getItem(
                makeStudentKey(email, ["mlk", "module2", "speechSiteName"])
              ) || "";
            const y =
              localStorage.getItem(
                makeStudentKey(email, ["mlk", "module2", "speechYear"])
              ) || "";
            const c =
              localStorage.getItem(
                makeStudentKey(email, ["mlk", "module2", "speechCitation"])
              ) || "";

            if (u) {
              setUrl(u);
              setUrlOk(isValidHttpUrl(u));
            }
            if (t) setText(t);
            if (s) setSiteName(s);
            if (y) setYear(y);
            if (c) setCitation(c);
          } catch (err) {
            console.error("Error reading Module 2 localStorage:", err);
          }
        }
      } catch (err) {
        console.error("Unexpected error loading Module 2 speech:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSaved();
  }, [session]);

  // Derived error text for the URL
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    const trimmedUrl = url.trim();
    const trimmedText = text.trim();
    const trimmedSite = siteName.trim();
    const trimmedYear = year.trim();
    const trimmedCitation = citation.trim();
    const hasUrlAndText = isValidHttpUrl(trimmedUrl) && trimmedText.length > 0;
    const hasCitation = trimmedCitation.length > 0;

    if (!hasUrlAndText || !hasCitation) return;

    setSaving(true);
    const userEmail = session?.user?.email || null;

    try {
      // Save to user-scoped localStorage only when we have email
      if (userEmail) {
        try {
          localStorage.setItem(
            makeStudentKey(userEmail, ["mlk", "module2", "speechUrl"]),
            trimmedUrl
          );
          localStorage.setItem(
            makeStudentKey(userEmail, ["mlk", "module2", "speechText"]),
            trimmedText
          );
          localStorage.setItem(
            makeStudentKey(userEmail, ["mlk", "module2", "speechSiteName"]),
            trimmedSite
          );
          localStorage.setItem(
            makeStudentKey(userEmail, ["mlk", "module2", "speechYear"]),
            trimmedYear
          );
          localStorage.setItem(
            makeStudentKey(userEmail, ["mlk", "module2", "speechCitation"]),
            trimmedCitation
          );
        } catch (err) {
          console.warn("Could not write Module 2 localStorage:", err);
        }
      }

      // Save to Supabase so the data follows the student
      if (userEmail) {
        const { error: upsertErr } = await upsertModule2SpeechSource({
          userEmail,
          speechUrl: trimmedUrl,
          speechText: trimmedText,
          speechSiteName: trimmedSite || null,
          speechTranscriptYear: trimmedYear || null,
          speechCitation: trimmedCitation,
        });

        if (upsertErr) {
          console.error("Error saving module2_sources:", upsertErr);
        }
      }

      // Log activity if we know who this is
      if (userEmail) {
        try {
          await logActivity(userEmail, "speech_source_saved", {
            module: 2,
            item: "i_have_a_dream",
            url: trimmedUrl,
            siteName: trimmedSite,
            transcriptYear: trimmedYear,
          });

          await logActivity(userEmail, "speech_transcript_saved", {
            module: 2,
            item: "i_have_a_dream",
            textLength: trimmedText.length,
            sample: trimmedText.slice(0, 120),
          });

          await logActivity(userEmail, "speech_citation_saved", {
            module: 2,
            item: "i_have_a_dream",
            citation: trimmedCitation,
          });
        } catch (err) {
          console.error("Error logging Module 2 speech selection:", err);
        }
      }

      // Open search for the Letter in a background tab
      try {
        const q = encodeURIComponent("full text Letter from Birmingham Jail");
        window.open(
          `https://www.google.com/search?q=${q}`,
          "_blank",
          "noopener"
        );
        setTimeout(() => window.focus(), 100);
      } catch (err) {
        console.warn("Could not open search tab:", err);
      }

      router.push("/modules/2/letter");
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
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-6"
      >
        {/* Module objective card (red) */}
        <div className="rounded-xl border border-theme-red/40 bg-theme-red/5 p-4 shadow-sm">
          <h1 className="text-2xl font-extrabold mb-1 text-theme-red">
            Module 2: Build an APA source for the speech
          </h1>
          <p className="text-sm text-theme-dark/80">
            In this step you will choose a full transcript of Dr. King&apos;s{" "}
            <em>I Have a Dream</em> speech from a website and turn it into a
            complete APA reference. You are practicing how to locate a
            trustworthy source and how to follow the APA pattern exactly.
          </p>
        </div>

        {/* Step 1 card (orange) */}
        <div className="rounded-xl border border-theme-orange/40 bg-theme-orange/5 p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-theme-orange">
            Step 1: Confirm your speech transcript source
          </h2>
          <p className="text-sm text-theme-dark/80">
            You should have a tab open that searched for{" "}
            <span className="font-semibold">
              full text I Have a Dream speech
            </span>
            . Choose a page that contains the complete speech, not a summary.
            Educational sites, government sites, and archives are usually the
            best choices.
          </p>
          <ul className="list-disc list-inside text-sm text-theme-dark/80 space-y-1">
            <li>The page must show the full text from the first word to the last.</li>
            <li>Avoid pages that only summarize or comment on the speech.</li>
            <li>Prefer sites that look like schools, libraries, museums, or news archives.</li>
          </ul>

          <div className="mt-3">
            <label className="block text-sm font-medium mb-1 text-theme-dark">
              Paste the URL of the speech transcript you will use
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="https://example.edu/i-have-a-dream-transcript"
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
              Step 2: Paste the full speech transcript
            </h2>
            <p className="text-sm text-theme-dark/80">
              Copy the speech text only. Do not include titles, page numbers, or
              commentary. Your text should begin and end like this:
            </p>
            <div className="bg-white rounded-lg border border-theme-green/30 p-3 text-xs text-theme-dark space-y-2">
              <div>
                <span className="font-semibold">Start example:</span>
                <blockquote className="italic mt-1">
                  I am happy to join with you today in what will go down in
                  history as the greatest demonstration for freedom in the
                  history of our nation.
                </blockquote>
              </div>
              <div>
                <span className="font-semibold">End example:</span>
                <blockquote className="italic mt-1">
                  Free at last, free at last. Thank God Almighty, we are free
                  at last.
                </blockquote>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 h-56 text-sm font-mono border-theme-green/40 bg-white"
              placeholder="Paste the full transcript here..."
              required
            />
            <p className="text-xs text-theme-dark/60">
              Minor wording differences across sites are fine. We will use this
              saved text later when you analyze and write.
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
              APA asks you to record certain pieces of information in a specific
              order so that any reader can find your exact source. Use the cards
              below to think through each element.
            </p>

            {/* Author card */}
            <div className="bg-white rounded-lg border border-theme-blue/40 p-3 shadow-sm">
              <h3 className="text-sm font-semibold mb-1 text-theme-dark">
                Author
              </h3>
              <p className="text-xs text-theme-dark/80 mb-2">
                The author of the speech is Dr. Martin Luther King Jr. APA uses
                last name followed by initials. For this assignment, the author
                is always:
              </p>
              <p className="text-xs font-mono bg-theme-light rounded px-2 py-1 inline-block text-theme-dark">
                King, M. L., Jr.
              </p>
              <p className="text-xs text-theme-dark/60 mt-2">
                You do not need to type this in a separate field. You will
                include it in the final reference below.
              </p>
            </div>

            {/* Year and site cards side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg border border-theme-blue/40 p-3 shadow-sm">
                <h3 className="text-sm font-semibold mb-1 text-theme-dark">
                  Year of transcript
                </h3>
                <p className="text-xs text-theme-dark/80 mb-2">
                  Look on the page you chose for a year. It might appear near
                  the top, near the bottom, or in a copyright line. This is the
                  year the transcript was posted on the website, not 1963.
                </p>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="For example: 2010 or n.d."
                  className="w-full border rounded px-2 py-1 text-sm border-theme-blue/40 bg-white"
                />
                <p className="text-xs text-theme-dark/60 mt-1">
                  If you cannot find a year, use <span className="italic">n.d.</span> which means no date.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-theme-blue/40 p-3 shadow-sm">
                <h3 className="text-sm font-semibold mb-1 text-theme-dark">
                  Website or organization name
                </h3>
                <p className="text-xs text-theme-dark/80 mb-2">
                  This is the name of the site that is hosting the transcript.
                  For example: NPR, American Rhetoric, or U.S. National Archives.
                </p>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="For example: NPR"
                  className="w-full border rounded px-2 py-1 text-sm border-theme-blue/40 bg-white"
                />
                <p className="text-xs text-theme-dark/60 mt-1">
                  This name appears after the descriptor in your reference.
                </p>
              </div>
            </div>

            {/* Descriptor and original work note card */}
            <div className="bg-white rounded-lg border border-theme-blue/40 p-3 shadow-sm">
              <h3 className="text-sm font-semibold mb-1 text-theme-dark">
                Descriptor and original work year
              </h3>
              <p className="text-xs text-theme-dark/80 mb-1">
                In APA you add a short description in square brackets. For this
                source, the descriptor is:
              </p>
              <p className="text-xs font-mono bg-theme-light rounded px-2 py-1 inline-block text-theme-dark">
                [Speech transcript]
              </p>
              <p className="text-xs text-theme-dark/80 mt-2">
                At the end of the reference you remind the reader when the
                speech was originally delivered:
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
                Now put everything together in one reference. Follow this
                pattern and replace the year, site name, and URL with the
                details from your page.
              </p>
              <p className="text-xs font-mono bg-theme-light rounded px-2 py-1 text-theme-dark">
                King, M. L., Jr. (Year). <em>I have a dream</em> [Speech
                transcript]. Site Name. URL (Original work published 1963).
              </p>
              <textarea
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                className="w-full border rounded px-3 py-2 h-24 text-sm border-theme-red/40 bg-white"
                placeholder='Example: King, M. L., Jr. (2010). I have a dream [Speech transcript]. NPR. https://www.npr.org/... (Original work published 1963).'
                required
              />
              <p className="text-xs text-theme-dark/60">
                You are creating an official record of this source that you will
                reuse later in your essay reference list.
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
            {saving ? "Saving..." : "Save speech source and go to the letter"}
          </button>
        </div>
      </form>
    </div>
  );
}