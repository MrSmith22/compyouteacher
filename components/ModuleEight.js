// components/ModuleEight.js
"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { logActivity } from "../lib/logActivity";

export default function ModuleEight() {
  const { data: session } = useSession();
  const router = useRouter();

  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);
  const email = session?.user?.email ?? null;

  const hasLoggedStartRef = useRef(false);

  const getTextMetrics = (value) => {
    const raw = typeof value === "string" ? value : text;
    const words = raw
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return {
      wordCount: words,
      charCount: raw.length,
    };
  };

  useEffect(() => {
    const load = async () => {
      if (!email) return;

      // 1) Read from Module 7 (where the “final text” lives after revise)
      const { data: m7, error: m7err } = await supabase
        .from("student_drafts")
        .select("full_text, final_text, final_ready")
        .eq("user_email", email)
        .eq("module", 7)
        .maybeSingle();

      if (m7err) console.error("Module 7 fetch error:", m7err);

      // Prefer Module 7 final_text, fallback to full_text
      const draft = m7?.final_text || m7?.full_text || "";
      setText(draft);

      // 2) Also check if Module 8 is already locked
      const { data: m8, error: m8err } = await supabase
        .from("student_drafts")
        .select("final_ready, final_text")
        .eq("user_email", email)
        .eq("module", 8)
        .maybeSingle();

      if (m8err) console.error("Module 8 fetch error:", m8err);

      if (m8?.final_ready) {
        setLocked(true);
        // If Module 8 is already locked, show its saved text
        if (m8?.final_text) setText(m8.final_text);
      }

      // Log module_started once per visit, after we know what text they see
      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;

        const metrics = getTextMetrics(m8?.final_text || draft || "");

        await logActivity(email, "module_started", {
          module: 8,
          from_module7_final: !!m7?.final_text,
          module8_already_locked: !!m8?.final_ready,
          ...metrics,
        });
      }
    };

    load();
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveAndLock = async () => {
    if (!email) return;

    // Write a row specifically for Module 8 and lock it
    const { error } = await supabase.from("student_drafts").upsert({
      user_email: email,
      module: 8,
      full_text: text, // keep a copy
      final_text: text, // lock this as final for M8
      revised: false,
      final_ready: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Module 8 save error:", error);
      alert("Save failed.");
      return;
    }

    setLocked(true);

    // Log completion with word and character counts
    const metrics = getTextMetrics();
    await logActivity(email, "module_completed", {
      module: 8,
      ...metrics,
    });

    router.push("/modules/8/success");
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-theme-light flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5 max-w-md w-full">
          <h1 className="text-2xl font-semibold text-theme-dark mb-2">
            Please sign in
          </h1>
          <p className="text-sm text-gray-700 mb-4">
            You need to be signed in to finish Module 8 and lock your final
            draft.
          </p>
          <Link
            href="/api/auth/signin"
            className="inline-block bg-theme-blue text-white px-4 py-2 rounded font-semibold text-sm"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const { wordCount, charCount } = getTextMetrics(text);

  return (
    <div className="min-h-screen bg-theme-light">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header and explanation card */}
        <header className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5 space-y-3">
          <h1 className="text-3xl font-extrabold text-theme-blue">
            📝 Module 8: Final Polish
          </h1>

          <p className="text-gray-700 text-sm md:text-base">
            In Module 7 you revised and recorded your essay. In Module 8 you
            give the writing itself one last careful read. Think of this as the
            final content and sentence level edit before you move on to APA
            formatting in Module 9.
          </p>

          <div className="grid gap-3 md:grid-cols-3 text-xs md:text-sm">
            <div className="bg-theme-light/60 border border-theme-blue/20 rounded-lg px-3 py-2">
              <p className="font-semibold text-theme-blue">1. Global check</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Does your thesis clearly match what you actually wrote?</li>
                <li>Does each body paragraph connect back to the thesis?</li>
              </ul>
            </div>
            <div className="bg-theme-light/60 border border-theme-green/20 rounded-lg px-3 py-2">
              <p className="font-semibold text-theme-green">2. Paragraph check</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Does each paragraph focus on one main idea or comparison?</li>
                <li>
                  Do you explain how ethos, pathos, and logos connect to audience
                  and purpose instead of only retelling the texts?
                </li>
              </ul>
            </div>
            <div className="bg-theme-light/60 border border-theme-orange/20 rounded-lg px-3 py-2">
              <p className="font-semibold text-theme-orange">3. Sentence check</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Fix confusing or extra long sentences.</li>
                <li>Check basic spelling, punctuation, and capitalization.</li>
              </ul>
            </div>
          </div>

          <p className="text-xs md:text-sm text-gray-700">
            When you click{" "}
            <span className="font-semibold">Lock Module 8</span> the version on
            this screen becomes your official final draft for content and
            wording. You will still adjust formatting and APA style in the next
            module, but you will not come back here to change this text.
          </p>
        </header>

        {/* Metrics strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm text-gray-700">
          <div className="flex flex-wrap gap-4">
            <span>
              <span className="font-semibold text-theme-blue">Word count:</span>{" "}
              {wordCount}
            </span>
            <span>
              <span className="font-semibold text-theme-blue">
                Character count:
              </span>{" "}
              {charCount}
            </span>
          </div>
          {!locked && (
            <span className="text-gray-500">
              Tip: Read your essay out loud once more before locking.
            </span>
          )}
        </div>

        {/* Main editing area */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4">
          <h2 className="text-xl font-bold text-theme-dark mb-2">
            Final draft text
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            Scroll through the whole essay and make any last changes to clarity,
            wording, and flow. You already did the big structure decisions in
            Modules 5 and 6. Here you focus on making your ideas sound clear and
            polished for a reader.
          </p>
          <textarea
            className="w-full min-h-[320px] border border-gray-200 p-4 rounded-md leading-7 focus:outline-none focus:ring-2 focus:ring-theme-blue/60"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={locked}
          />
        </section>

        {/* Lock state and action */}
        {!locked ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-xs md:text-sm text-gray-600">
              When you feel confident that your essay is ready, click the button
              below to lock this version and move on to APA formatting.
            </p>
            <button
              onClick={saveAndLock}
              className="bg-theme-blue hover:brightness-110 text-white px-6 py-3 rounded-lg shadow-md text-sm font-semibold"
            >
              ✅ Lock Module 8 and continue
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-green-200 px-5 py-4 text-theme-green text-sm md:text-base font-semibold">
            ✅ Module 8 is locked. This is your final draft for content and
            wording. Next you will focus on APA formatting and presentation.
          </div>
        )}
      </div>
    </div>
  );
}