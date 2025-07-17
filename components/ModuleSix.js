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

      const { data: obs } = await supabase
        .from("tchart_entries")
        .select("*")
        .eq("user_email", email);
      setObservations(obs || []);

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

  const unlockDraft = async () => {
    setLocked(false);
    await supabase.from("student_drafts").upsert({
      user_email: session.user.email,
      module: 6,
      sections: draft,
      full_text: draft.join("\n\n"),
      locked: false,
      updated_at: new Date().toISOString()
    });
  };

  if (!outline) return <p className="p-6">Loading…</p>;

  return (
    <div className="flex">
      <main className="flex-1 p-6 space-y-8">
        <h1 className="text-2xl font-bold text-theme-dark mb-2">✍️ Draft Your Essay</h1>

        <div className="text-gray-700 space-y-2">
          <p>
            <strong>Now it’s time to write your draft!</strong>
            <br />
            Below, you’ll see each section of your paper already set up for you: the introduction, one paragraph for each group of ideas (or <em>bucket</em>) you created in your outline, and the conclusion.
          </p>
          <p>
            Your job now is to use the outline you built in Module 5 and the observations and quotes you collected earlier to fully write out each section as a complete paragraph.
          </p>
        </div>

        <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
          <li>Start with a clear topic sentence that connects to your thesis.</li>
          <li>Add details and evidence from your observations and quotes to support your point.</li>
          <li>Explain how your evidence relates back to your thesis.</li>
        </ul>

        <p className="text-gray-700 mt-2">
          The <strong>Introduction</strong> should include your thesis and give the reader an idea of what’s coming.  
          Each <strong>body paragraph</strong> (one for each bucket) should focus on one main idea from your outline and develop it fully.  
          The <strong>Conclusion</strong> should restate your thesis in a fresh way and leave the reader with a final thought.
        </p>

        <p className="text-gray-700 mt-2">
          📌 You can also open the <strong>Outline / Notes</strong> panel on the right to review your buckets and observations while you write.
        </p>

        <section>
          <h2 className="text-xl font-bold mb-2">{roman(0)}. Introduction</h2>
          <textarea
            className="w-full border rounded p-3 min-h-[120px]"
            value={draft[0] || ""}
            onChange={(e) => updateSection(0, e.target.value)}
            disabled={locked}
          />
        </section>

        {outline.body.map((b, i) => (
          <section key={i}>
            <h2 className="text-xl font-bold mb-2">
              {roman(i + 1)}. {b.bucket}
            </h2>
            <textarea
              className="w-full border rounded p-3 min-h-[160px]"
              value={draft[i + 1] || ""}
              onChange={(e) => updateSection(i + 1, e.target.value)}
              disabled={locked}
            />
          </section>
        ))}

        <section>
          <h2 className="text-xl font-bold mb-2">
            {roman(outline.body.length + 1)}. Conclusion
          </h2>
          <textarea
            className="w-full border rounded p-3 min-h-[120px]"
            value={draft.at(-1) || ""}
            onChange={(e) => updateSection(draft.length - 1, e.target.value)}
            disabled={locked}
          />
        </section>

        <div className="space-x-4 mt-6">
          <button
            onClick={markComplete}
            disabled={locked}
            className={`bg-theme-orange text-white px-4 py-2 rounded shadow ${
              locked ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            ✅ Mark Draft Complete & Continue
          </button>

          <button
            onClick={unlockDraft}
            className="bg-theme-blue text-white px-4 py-2 rounded shadow"
          >
            🔓 Unlock Draft for Editing
          </button>
        </div>
      </main>

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
                {roman(i + 1)}. {b.bucket}
              </div>
              <ul className="pl-4 list-disc list-inside text-xs">
                {b.points.map((pt, j) => (
                  <li key={j}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}
          <div>{roman(outline.body.length + 1)}. Conclusion</div>
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
