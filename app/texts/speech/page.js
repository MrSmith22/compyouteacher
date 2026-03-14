"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Panel from "@/components/ui/Panel";

// Archival header lines to remove from display only (not from stored text)
const ARCHIVAL_HEADER_PATTERNS = [
  "video transcript for archival research catalog",
  "arc identifier",
  "national archives and records administration",
  "www.archives.gov",
];

function isArchivalHeaderLine(line) {
  const lower = line.trim().toLowerCase();
  return ARCHIVAL_HEADER_PATTERNS.some((p) => lower.includes(p));
}

function isStageDirectionLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^\[.+\]$/.test(t)) return true;
  if (/^[^.\n]{1,60}:\s*$/.test(t)) return true;
  return false;
}

/** Build display-only lines from raw text; does not modify stored source */
function buildDisplayLines(rawText) {
  if (!rawText || typeof rawText !== "string") return [];
  const lines = rawText.split(/\n/);
  const filtered = lines.filter((line) => !isArchivalHeaderLine(line));
  const rejoined = filtered.join("\n");
  const paragraphs = rejoined.split(/\n\n+/);
  const result = [];
  for (const block of paragraphs) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const blockLines = trimmed.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (blockLines.length === 1 && isStageDirectionLine(blockLines[0])) {
      result.push({ type: "stage", text: blockLines[0] });
    } else if (blockLines.length >= 1 && isStageDirectionLine(blockLines[0])) {
      result.push({ type: "stage", text: blockLines[0] });
      result.push({ type: "content", text: blockLines.slice(1).join("\n") });
    } else {
      result.push({ type: "content", text: trimmed });
    }
  }
  return result;
}

const SPEECH_START_PHRASE = "i am happy to join with you today";
const SPEECH_END_PHRASE = "free at last! free at last! thank god almighty, we are free at last.";

function contentContains(text, phrase) {
  const normalized = (text || "").toLowerCase().replace(/\s+/g, " ").trim();
  return normalized.includes(phrase.toLowerCase().replace(/\s+/g, " "));
}

export default function MyCopySpeechPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
      return;
    }
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/module2/sources")
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          let msg = "Could not load your saved source.";
          try {
            const j = await res.json();
            if (j && typeof j.error === "string") msg = j.error;
          } catch (_) {}
          setError(msg);
          return;
        }
        try {
          const parsed = await res.json();
          if (!cancelled) setData(parsed);
        } catch (e) {
          console.error("Failed to parse module2 sources response:", e);
          if (!cancelled) setError("Invalid response from server.");
        }
      })
      .catch((err) => {
        console.error("Failed to load module2 sources:", err);
        if (!cancelled) setError("Something went wrong. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email, status, router]);

  const text = data?.speech_full_text || "";
  const sourceUrl = data?.speech_source_url || "";
  const displayLines = useMemo(() => buildDisplayLines(text), [text]);
  const hasSpeech = data != null && typeof data.speech_full_text === "string" && data.speech_full_text.trim().length > 0;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6">
        <div className="max-w-3xl mx-auto">
          <Panel className="space-y-4">
            <h1 className="text-xl font-bold text-theme-dark">
              Could not load your saved source
            </h1>
            <p className="text-theme-dark/90">{error}</p>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-theme-blue font-medium underline"
            >
              Back
            </button>
          </Panel>
        </div>
      </div>
    );
  }

  if (!hasSpeech) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6">
        <div className="max-w-3xl mx-auto">
          <Panel className="space-y-4">
            <h1 className="text-xl font-bold text-theme-dark">
              No saved speech found yet.
            </h1>
            <p className="text-theme-dark/90">
              Complete Module 2 to gather and save your speech source.
            </p>
            <button
              type="button"
              onClick={() => router.push("/modules/2")}
              className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium"
            >
              Back to Module 2
            </button>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-theme-blue font-medium underline"
          >
            Back
          </button>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-theme-blue text-white px-3 py-1.5 rounded-lg text-sm font-medium inline-block"
            >
              Open Original Source
            </a>
          ) : null}
        </div>
        {sourceUrl && (
          <p className="text-xs text-theme-dark/70 mb-4">
            You may read and copy quotes either from this saved copy or from the
            original source in another tab.
          </p>
        )}

        <Panel className="space-y-4">
          <h1 className="text-xl font-bold text-theme-dark">
            My Copy of &ldquo;I Have a Dream&rdquo;
          </h1>
          {sourceUrl ? (
            <p className="text-sm text-theme-dark/70">
              Source:{" "}
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-theme-blue underline"
              >
                {sourceUrl}
              </a>
            </p>
          ) : null}
          {hasSpeech ? (
            <>
              <div className="rounded-xl border-2 border-theme-blue/30 bg-theme-blue/5 p-4 space-y-3 text-left">
                <h2 className="text-base font-bold text-theme-dark">
                  How to read this transcript
                </h2>
                <p className="text-sm text-theme-dark/90">
                  This is your saved working copy of the official National
                  Archives transcript. Because it is a transcript of a live
                  event, it includes some lines that were not spoken by Dr.
                  Martin Luther King Jr., such as speaker labels, applause,
                  singing, and narrator comments.
                </p>
                <p className="text-sm text-theme-dark/90 font-medium">
                  For this assignment, focus mainly on Dr. King&apos;s speech.
                </p>
                <p className="text-sm text-theme-dark/90">
                  Dr. King&apos;s speech begins with:
                  <br />
                  &ldquo;I am happy to join with you today...&rdquo;
                </p>
                <p className="text-sm text-theme-dark/90">
                  Dr. King&apos;s speech ends with:
                  <br />
                  &ldquo;Free at last! Free at last! Thank God Almighty, we are
                  free at last.&rdquo;
                </p>
                <p className="text-sm text-theme-dark/90">
                  Anything after that belongs to the surrounding event
                  transcript, not the speech itself.
                </p>
                <p className="text-sm text-theme-dark/90 font-medium">
                  When you take notes or choose quotes, try to pull them from
                  the section between those opening and closing lines.
                </p>
              </div>
              <div className="prose prose-lg max-w-none text-left text-theme-dark">
                {displayLines.map((item, i) => {
                  if (item.type === "stage") {
                    return (
                      <div
                        key={i}
                        className="text-theme-dark/60 text-sm italic my-2 pl-2 border-l-2 border-border-soft"
                      >
                        {item.text}
                      </div>
                    );
                  }
                  const isStart = contentContains(item.text, SPEECH_START_PHRASE);
                  const isEnd = contentContains(item.text, SPEECH_END_PHRASE);
                  return (
                    <div key={i}>
                      {isStart && (
                        <p className="text-xs font-medium text-theme-blue mt-4 mb-1 uppercase tracking-wide">
                          Start of Dr. King&apos;s speech
                        </p>
                      )}
                      <p className="mb-4 last:mb-0">
                        {item.text}
                      </p>
                      {isEnd && (
                        <p className="text-xs font-medium text-theme-blue mt-1 mb-4 uppercase tracking-wide">
                          End of Dr. King&apos;s speech
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
