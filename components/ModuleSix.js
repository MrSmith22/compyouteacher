"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { logActivity } from "../lib/logActivity";
import { getStudentAssignment } from "@/lib/supabase/helpers/studentAssignments";

export default function ModuleSix() {
  const { data: session } = useSession();
  const router = useRouter();

  const [outline, setOutline] = useState(null);
  const [observations, setObservations] = useState([]);
  const [draft, setDraft] = useState([]);
  const [locked, setLocked] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  const hasLoggedStartRef = useRef(false);

  // Zero indexed roman helper: 0 → I, 1 → II, etc.
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

      // Gate: require current_module >= 6 (read-only check on student_assignments)
      const { data: assignment, error: assignmentError } = await getStudentAssignment({
        userEmail: email,
        assignmentName: "MLK Essay Assignment",
      });
      if (assignmentError) {
        console.error("Error loading assignment for Module 6:", assignmentError);
      }
      const currentModule = assignment?.current_module;
      if (currentModule == null || currentModule < 6) {
        alert("Finish Module 5 before starting Module 6.");
        return;
      }

      // Load outline from Module 5 (for display only; no finalized gate)
      const { data: outlineRow, error: outlineError } = await supabase
        .from("student_outlines")
        .select("outline")
        .eq("user_email", email)
        .eq("module", 5)
        .single();

      if (outlineError && outlineError.code !== "PGRST116") {
        console.error("Error loading outline for Module 6:", outlineError);
      }

      setOutline(outlineRow?.outline ?? null);

      // Log module start once
      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        logActivity(email, "module_started", { module: 6, hasOutline: true });
      }

      // Load T chart observations
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
        // Intro plus one per body bucket plus conclusion
        const emptySections = [
          "",
          ...(outlineRow?.outline?.body || []).map(() => ""),
          "",
        ];
        setDraft(emptySections);
        setLocked(false);
      }
    };

    loadData();
  }, [session]);

  // Debounced autosave plus activity log
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

  if (!outline) {
    return (
      <div className="min-h-screen bg-theme-light flex items-center justify-center">
        <p className="text-theme-dark">Loading…</p>
      </div>
    );
  }

  // Common props to make textareas feel like Google Docs lite
  const wp = {
    spellCheck: true,
    autoCorrect: "on",
    autoCapitalize: "sentences",
    lang: "en",
    enterKeyHint: "enter",
    className:
      "w-full border border-gray-200 rounded-md p-3 min-h-[140px] leading-7 focus:outline-none focus:ring-2 focus:ring-theme-blue/60",
  };

  return (
    <div className="min-h-screen bg-theme-light">
      <div className="max-w-6xl mx-auto flex">
        {/* MAIN COLUMN */}
        <main className="flex-1 p-6 space-y-6">
          {/* Header card */}
          <header className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 mb-2">
            <h1 className="text-3xl font-extrabold text-theme-blue mb-1">
              ✍️ Module 6: Turn Your Outline Into a Draft
            </h1>
            <p className="text-gray-700 text-sm md:text-base">
              In Modules 3, 4, and 5 you did the hard thinking work. You chose a
              thesis, grouped ideas into buckets, and turned those buckets into
              an outline. Now you will turn that plan into full paragraphs.
            </p>

            <div className="mt-3 grid gap-2 md:grid-cols-3 text-xs md:text-sm text-gray-700">
              <div className="bg-theme-light/60 border border-theme-blue/20 rounded-lg px-3 py-2">
                <p className="font-semibold text-theme-blue">
                  Step 1: Follow the outline
                </p>
                <p>
                  Each big Roman numeral below matches a section in your outline.
                  Stay in the same order so your essay is easy to follow.
                </p>
              </div>
              <div className="bg-theme-light/60 border border-theme-green/20 rounded-lg px-3 py-2">
                <p className="font-semibold text-theme-green">
                  Step 2: Use your buckets
                </p>
                <p>
                  Use the bucket name as the main idea for that paragraph and
                  use the bullet points as your evidence and explanation.
                </p>
              </div>
              <div className="bg-theme-light/60 border border-theme-orange/20 rounded-lg px-3 py-2">
                <p className="font-semibold text-theme-orange">
                  Step 3: Bring in appeals
                </p>
                <p>
                  Make sure you explain how ethos, pathos, and logos connect to
                  audience and purpose in each text, not just what happens.
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs md:text-sm text-gray-700">
              You can always open the <span className="font-semibold">Outline / Notes</span>{" "}
              panel in the bottom corner to see your outline and T chart
              observations while you write.
            </p>
          </header>

          {/* Introduction */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4">
            <h2 className="text-xl font-bold mb-2 text-theme-dark">
              {roman(0)}. Introduction
            </h2>
            <p className="text-sm text-gray-700 mb-2">
              This paragraph sets up the whole essay. Aim for four to six
              sentences that:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 mb-3 space-y-1">
              <li>Briefly introduce Dr. King and the two works you are comparing.</li>
              <li>
                Give a little context for each text, such as when and where it
                was delivered or written.
              </li>
              <li>
                End with your compare and contrast thesis from Module 3, adjusted
                if you improved it in Module 5.
              </li>
            </ul>
            <textarea
              {...wp}
              value={draft[0] || ""}
              onChange={(e) => updateSection(0, e.target.value)}
              disabled={locked}
            />
          </section>

          {/* Body paragraphs */}
          {outline.body.map((b, i) => (
            <section
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4"
            >
              <h2 className="text-xl font-bold mb-2 text-theme-dark">
                {roman(i + 1)}. {b.bucket}
              </h2>
              <p className="text-sm text-gray-700 mb-2">
                This section should grow out of the bucket you created in Module
                4 and the outline point you built in Module 5. Use the{" "}
                <span className="font-semibold">Outline</span> panel to see the
                bullet points you wrote for this bucket.
              </p>
              <div className="mb-3 text-xs text-gray-700 bg-theme-light/60 border border-gray-200 rounded-lg px-3 py-2">
                <p className="font-semibold mb-1">
                  A strong body paragraph for this bucket usually includes:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    A topic sentence that clearly connects this idea to your
                    thesis.
                  </li>
                  <li>
                    Specific observations from both the speech and the letter
                    that fit this bucket.
                  </li>
                  <li>
                    Explanation of how King is using{" "}
                    <span className="italic">ethos, pathos, or logos</span> for
                    this idea and how that connects to audience and purpose.
                  </li>
                  <li>
                    A closing sentence that reminds the reader why this
                    comparison or contrast matters.
                  </li>
                </ul>
              </div>
              <textarea
                {...wp}
                value={draft[i + 1] || ""}
                onChange={(e) => updateSection(i + 1, e.target.value)}
                disabled={locked}
              />
            </section>
          ))}

          {/* Conclusion */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4">
            <h2 className="text-xl font-bold mb-2 text-theme-dark">
              {roman(outline.body.length + 1)}. Conclusion
            </h2>
            <p className="text-sm text-gray-700 mb-2">
              The conclusion should leave the reader with a clear final picture
              of your argument, not just repeat the introduction. Aim for three
              to five sentences that:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 mb-3 space-y-1">
              <li>Restate your thesis in new words.</li>
              <li>
                Remind the reader of the most important similarity or difference
                you explained in the body paragraphs.
              </li>
              <li>
                End with a final insight about why King&apos;s message and his
                use of appeals still matters for readers today.
              </li>
            </ul>
            <textarea
              {...wp}
              value={draft.at(-1) || ""}
              onChange={(e) => updateSection(draft.length - 1, e.target.value)}
              disabled={locked}
            />
          </section>

          {/* Action row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
            <div className="text-xs text-gray-600">
              Your work saves automatically as you type. When you feel this draft
              matches your outline, click the button to move on.
            </div>
            <button
              onClick={markComplete}
              disabled={locked}
              className={`bg-theme-orange text-white px-5 py-2.5 rounded-lg shadow-md text-sm font-semibold transition ${
                locked
                  ? "opacity-50 pointer-events-none"
                  : "hover:brightness-105"
              }`}
            >
              ✅ Mark Draft Complete & Continue
            </button>
          </div>
        </main>

        {/* SLIDE OUT OUTLINE / NOTES PANEL */}
        <aside
          className={`fixed right-0 top-0 h-full w-[320px] bg-theme-light border-l border-gray-200 shadow-xl z-20 p-4 overflow-y-auto transition-transform duration-300 ${
            sideOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button
            onClick={() => setSideOpen(false)}
            className="absolute top-3 right-3 text-lg text-gray-500 hover:text-theme-dark"
          >
            ✖
          </button>

          <div className="mb-4 rounded-lg bg-white border border-gray-200 px-4 py-3 shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-theme-blue flex items-center gap-2">
              <span role="img" aria-label="outline">
                📑
              </span>
              Outline
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              These are the buckets you built in Module 4 and shaped into an
              outline in Module 5. Use them as a checklist while you draft.
            </p>
            <div className="text-sm space-y-1">
              <div className="font-semibold">I. Introduction</div>

              {outline.body.map((b, i) => (
                <div key={i}>
                  <div className="font-semibold">
                    {roman(i + 1)}. {b.bucket}
                  </div>
                  <ul className="pl-4 list-disc list-inside text-xs text-gray-700">
                    {b.points.map((pt, j) => (
                      <li key={j}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="font-semibold">
                {roman(outline.body.length + 1)}. Conclusion
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white border border-gray-200 px-4 py-3 shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-theme-dark flex items-center gap-2">
              <span role="img" aria-label="observations">
                🔍
              </span>
              Observations
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              These notes came from your T chart work. Use them when you need a
              quick reminder of what you noticed in the speech or the letter.
            </p>
            <ul className="text-xs space-y-1 max-h-[50vh] overflow-y-auto pr-1">
              {observations.map((o) => (
                <li key={o.id} className="border-b border-gray-100 pb-1">
                  <strong className="text-theme-blue">
                    {o.category.toUpperCase()}
                  </strong>{" "}
                  {`— `}
                  {o.observation || o.speech_note || o.letter_note}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <button
          onClick={() => setSideOpen((s) => !s)}
          className="fixed right-3 bottom-3 z-10 bg-theme-blue text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold hover:brightness-110"
        >
          {sideOpen ? "➡ Close Notes" : "⬅ Outline / Notes"}
        </button>
      </div>
    </div>
  );
}