"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function ModuleSix() {
  const { data: session } = useSession();
  const router = useRouter();

  const [outline, setOutline] = useState(null);
  const [observations, setObservations] = useState([]);
  const [draft, setDraft] = useState([]);
  const [locked, setLocked] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  const roman = (n) =>
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] || `${n + 1}`;

  useEffect(() => {
    const loadData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      // 📝 Load finalized outline
      const { data: outlineRow } = await supabase
        .from("student_outlines")
        .select("outline,finalized")
        .eq("user_email", email)
        .eq("module", 5)
        .single();

      if (!outlineRow?.finalized) {
        alert("Finish Module 5 before starting Module 6.");
        return;
      }

      setOutline(outlineRow.outline);

      // 📝 Load T‑chart observations
      const { data: obs } = await supabase
        .from("tchart_entries")
        .select("*")
        .eq("user_email", email);
      setObservations(obs || []);

      // 📝 Load draft
      const { data: draftRow } = await supabase
        .from("student_drafts")
        .select("sections,locked")
        .eq("user_email", email)
        .eq("module", 6)
        .single();

      if (draftRow?.sections?.length) {
        setDraft(draftRow.sections);
        setLocked(draftRow.locked === true);
      } else {
        const emptySections = [
          "",
          ...(outlineRow.outline.body || []).map(() => ""),
          ""
        ];
        setDraft(emptySections);
        setLocked(false);
      }
    };

    loadData();
  }, [session]);

  // 📝 Debounced autosave
  useEffect(() => {
    if (!session?.user?.email || draft.length === 0) return;

    const id = setTimeout(async () => {
      await supabase.from("student_drafts").upsert({
        user_email: session.user.email,
        module: 6,
        sections: draft,
        full_text: draft.join("\n\n"),
        locked,
        updated_at: new Date().toISOString()
      });
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
    setLocked(true);
    await supabase.from("student_drafts").upsert({
      user_email: session.user.email,
      module: 6,
      sections: draft,
      full_text: draft.join("\n\n"),
      locked: true,
      updated_at: new Date().toISOString()
    });
    router.push("/modules/6/success");
  };

  if (!outline) return <p className="p-6">Loading…</p>;

  return (
    <div className="flex">
      <main className="flex-1 p-6 space-y-8">
        <h1 className="text-2xl font-bold text-theme-dark mb-2">✍️ Draft Your Essay</h1>

        <p className="text-gray-700">
          Use your outline and observations to write your draft. Start with an introduction, develop
          the body paragraphs, and finish with a conclusion. When you’re ready, mark your draft complete.
        </p>

        {/* Introduction */}
        <section>
          <h2 className="text-xl font-bold mb-2">{roman(1)}. Introduction</h2>
          <textarea
            className="w-full border rounded p-3 min-h-[120px]"
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
              className="w-full border rounded p-3 min-h-[160px]"
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
            className="w-full border rounded p-3 min-h-[120px]"
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