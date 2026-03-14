"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Panel from "@/components/ui/Panel";

export default function MyCopyLetterPage() {
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

  const text = data?.letter_full_text || "";
  const sourceUrl = data?.letter_source_url || "";
  const hasLetter = data != null && typeof data.letter_full_text === "string" && data.letter_full_text.trim().length > 0;

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

  if (!hasLetter) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6">
        <div className="max-w-3xl mx-auto">
          <Panel className="space-y-4">
            <h1 className="text-xl font-bold text-theme-dark">
              No saved letter found yet.
            </h1>
            <p className="text-theme-dark/90">
              Complete Module 2 to gather and save your letter source.
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
            My Copy of &ldquo;Letter from Birmingham Jail&rdquo;
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
          {hasLetter ? (
            <div className="prose prose-lg max-w-none text-left text-theme-dark">
              {text.split(/\n\n+/).map((para, i) => (
                <p key={i} className="mb-4 last:mb-0">
                  {para.trim()}
                </p>
              ))}
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
