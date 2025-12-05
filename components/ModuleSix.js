"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { logActivity } from "../lib/logActivity";

export default function ModuleSix() {
  const { data: session } = useSession();
  const router = useRouter();

  const [outline, setOutline] = useState(null);
  const [observations, setObservations] = useState([]);
  const [draft, setDraft] = useState([]);
  const [locked, setLocked] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  // prevent duplicate "module_started" logs per visit
  const hasLoggedStartRef = useRef(false);

  const roman = (n) =>
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] ||
    `${n + 1}`;

  const getDraftMetrics = () => {
    const sectionCount = draft.length;
    const sectionWordCounts = draft.map((s) =>
      (s || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    );
    const totalWords = sectionWordCounts.reduce((a, b) => a + b, 0);
    return { sectionCount, sectionWordCounts, totalWords };
  };

  useEffect(() => {
    const loadData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      // Load finalized outline from Module 5
      const { data: outlineRow, error: outlineError } = await supabase
        .from("student_outlines")
        .select("outline,finalized")
        .eq("user_email", email)
        .eq("module", 5)
        .single();

      if (outlineError && outlineError.code !== "PGRST116") {
        console.error("Error loading outline for Module 6:", outlineError);
      }

      if (!outlineRow?.finalized) {
        alert("Finish Module 5 before starting Module 6.");
        return;
      }

      setOutline(outlineRow.outline);

      // Log module_started once per visit
      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        logActivity(email, "module_started", { module: 6, hasOutline: true });
      }

      // Load T-chart observations
      const { data: obs, error: obsError } = await supabase
        .from("tchart_entries")
        .select("*")
        .eq("user_email", email);

      if (obsError) {
        console.error("Error loading observations for Module 6:", obsError);
      }
      setObservations(obs || []);

      // Load existing draft
      const { data: draftRow, error: draftError } = await supabase
        .from("student_drafts")
        .select("sections,locked")
        .eq("user_email", email)
        .eq("module", 6)
        .single();

      if (draftError && draftError.code !== "PGRST116") {
        console.error("Error loading draft for Module 6:", draftError);
      }

      if (draftRow?.sections?.length) {
        setDraft(draftRow.sections);
        setLocked(draftRow.locked === true);
      } else {
        // Intro + one per body bucket + conclusion
        const emptySections = [
          "",
          ...(outlineRow.outline.body || []).map(() => ""),
          "",
        ];
        setDraft(emptySections);
        setLocked(false);
      }
    };

    loadData();
  }, [session]);

  // Debounced autosave + activity log
  useEffect(() => {
    if (!session?.user?.email || draft.length === 0) return;

    const id = setTimeout(async () => {
      const email = session.user.email;

      const payload = {
        user_email: email,
        module: 6,
        sections: draft,
        full_text: draft.join("\n\n"),
        locked,
        updated_at: new Date().toISOString(),
      };

      try {
        const { error } = await supabase.from("student_drafts").upsert(payload);

        if (error) {
          console.error("Module 6 autosave error:", error);
        } else {
          const metrics = getDraftMetrics();
          logActivity(email, "draft_autosaved", {
            module: 6,
            locked,
            ...metrics,
          });
        }
      } catch (err) {
        console.error("Module 6 autosave failed:", err);
      }
    }, 800);

    return () => clearTimeout(id);
  }, [draft, locked, session]);

  const updateSection = (i, val) => {
    if (locked) return;
    setDraft((prev) => {
      const copy = [...prev];
      copy[i] = val;
      return copy;
    });
  };

  const markComplete = async () => {
    const email = session?.user?.email;
    if (!email) return;

    setLocked(true);

    const payload = {
      user_email: email,
      module: 6,
      sections: draft,
      full_text: draft.join("\n\n"),
      locked: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("student_drafts").upsert(payload);

    if (error) {
      alert("Error saving draft: " + error.message);
      setLocked(false);
      return;
    }

    const metrics = getDraftMetrics();
    await logActivity(email, "module_completed", {
      module: 6,
      locked: true,
      ...metrics,
    });

    router.push("/modules/6/success");
  };

  if (!outline) return <p className="p-6">Loading…</p>;

  // Common props to make textareas feel like Google Docs-lite
  const wp = {
    spellCheck: true,
    autoCorrect: "on",
    autoCapitalize: "sentences",
    lang: "en",
    enterKeyHint: "enter",
    className: "w-full border rounded p-3 min-h-[140px] leading-7",
  };

  return (
    <div className="flex">
      <main className="flex-1 p-6 space-y-8">
        <h1 className="text-2xl font-bold text-theme-dark mb-2">
          ✍️ Draft Your Essay
        </h1>

        <p className="text-gray-700">
          Use your outline and observations to write your draft. Start with an
          introduction, develop the body paragraphs, and finish with a
          conclusion. When you’re ready, mark your draft complete.
        </p>

        {/* Introduction */}
        <section>
          <h2 className="text-xl font-bold mb-2">{roman(1)}. Introduction</h2>
          <textarea
            {...wp}
            value={draft[0] || ""}
            onChange={(e) => updateSection(0, e.target.value)}
            disabled={locked}
          />
        </section>

        {/* Body paragraphs */}
        {outline.body.map((b, i) => (
          <section key={i}>
            <h2 className="text-xl font-bold mb-2">
              {roman(i + 2)}. {b.bucket}
            </h2>
            <textarea
              {...wp}
              value={draft[i + 1] || ""}
              onChange={(e) => updateSection(i + 1, e.target.value)}
              disabled={locked}
            />
          </section>
        ))}

        {/* Conclusion */}
        <section>
          <h2 className="text-xl font-bold mb-2">
            {roman(outline.body.length + 2)}. Conclusion
          </h2>
          <textarea
            {...wp}
            value={draft.at(-1) || ""}
            onChange={(e) => updateSection(draft.length - 1, e.target.value)}
            disabled={locked}
          />
        </section>

        <button
          onClick={markComplete}
          disabled={locked}
          className={`mt-6 bg-theme-orange text-white px-4 py-2 rounded shadow ${
            locked ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          ✅ Mark Draft Complete & Continue
        </button>
      </main>

      {/* Slide-out panel */}
      <aside
        className={`fixed right-0 top-0 h-full w-[320px] bg-white border-l shadow-lg z-10 p-4 overflow-y-auto transition-transform duration-300 ${
          sideOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={() => setSideOpen(false)}
          className="absolute top-2 right-3 text-xl"
        >
          ✖
        </button>

        <h3 className="text-lg font-semibold mb-3">📑 Outline</h3>
        <div className="text-sm mb-4 space-y-1">
          <div>I. Introduction</div>
          {outline.body.map((b, i) => (
            <div key={i}>
              <div className="font-semibold">
                {roman(i + 2)}. {b.bucket}
              </div>
              <ul className="pl-4 list-disc list-inside text-xs">
                {b.points.map((pt, j) => (
                  <li key={j}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}
          <div>{roman(outline.body.length + 2)}. Conclusion</div>
        </div>

        <h3 className="text-lg font-semibold mb-2">🔍 Observations</h3>
        <ul className="text-xs space-y-1">
          {observations.map((o) => (
            <li key={o.id} className="border-b pb-1">
              <strong>{o.category.toUpperCase()}</strong> —{" "}
              {o.observation || o.speech_note || o.letter_note}
            </li>
          ))}
        </ul>
      </aside>

      <button
        onClick={() => setSideOpen((s) => !s)}
        className="fixed right-3 bottom-3 z-10 bg-theme-blue text-white p-3 rounded-full shadow-lg"
      >
        {sideOpen ? "➡" : "⬅"} Outline / Notes
      </button>
    </div>
  );
}