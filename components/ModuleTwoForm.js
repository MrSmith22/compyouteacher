"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "next-auth/react";

const categories = ["ethos", "pathos", "logos", "audience", "purpose"];

export default function ModuleTwoForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const email = session?.user?.email || "";

  /* ---------- state ---------- */
  const blank = Object.fromEntries(
    categories.map((c) => [c, { speech: "", letter: "", sQuote: "", lQuote: "" }])
  );
  const [data, setData] = useState(blank);
  const [letterURL, setLetterURL] = useState("");
  const [loaded, setLoaded] = useState(false);

  /* ---------- load existing ---------- */
  useEffect(() => {
    if (!email) return;
    (async () => {
      const { data: rows } = await supabase
        .from("tchart_entries")
        .select("*")
        .eq("user_email", email);

      if (rows?.length) {
        const tmp = { ...blank };
        rows.forEach((r) => {
          tmp[r.category] = {
            speech: r.speech_note || "",
            letter: r.letter_note || "",
            sQuote: r.speech_quotes?.[0] || "",
            lQuote: r.letter_quotes?.[0] || "",
          };
          if (r.letter_url) setLetterURL(r.letter_url);
        });
        setData(tmp);
      }
      setLoaded(true);
    })();
  }, [email]);

  /* ---------- helpers ---------- */
  const update = (cat, key, val) =>
    setData((d) => ({ ...d, [cat]: { ...d[cat], [key]: val } }));

  const readyToSave =
    letterURL.startsWith("https://") &&
    categories.every(
      (c) =>
        data[c].speech &&
        data[c].letter &&
        data[c].sQuote &&
        data[c].lQuote
    );

  /* ---------- save ---------- */
  const handleSave = async () => {
    const rows = categories.map((c) => ({
      user_email: email,
      category: c,
      speech_note: data[c].speech,
      letter_note: data[c].letter,
      speech_quotes: [data[c].sQuote],
      letter_quotes: [data[c].lQuote],
      letter_url: letterURL,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("tchart_entries").upsert(rows);
    if (error) return alert(error.message);
    router.push("/modules/2/success");
  };

  if (!loaded) return <p className="p-6">Loading…</p>;

  /* ---------- UI ---------- */
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Intro & Speech video */}
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">
          Module 2 — Analyze the Speech & Letter
        </h1>
        <ol className="list-decimal list-inside space-y-1 text-gray-700">
          <li>Watch Dr. King’s <em>I Have a Dream</em> speech below.</li>
          <li>
            In a new tab, search&nbsp;
            <code>"Letter from Birmingham Jail" full text</code> and choose a
            reputable .edu or .gov site.
          </li>
          <li>Paste that page’s URL in the box provided.</li>
          <li>
            Fill in the T-Charts and add at least one direct quote for every
            observation.
          </li>
        </ol>

        <div className="mt-4">
          <video width="100%" controls>
            <source src="/videos/IHaveADreamSpeech.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      {/* URL capture */}
      <section className="border p-4 rounded bg-gray-50">
        <label className="font-semibold block mb-1">
          Paste the URL of the Letter you found:
        </label>
        <input
          type="url"
          value={letterURL}
          onChange={(e) => setLetterURL(e.target.value)}
          placeholder="https://www.example.edu/letter.html"
          className="w-full border rounded px-2 py-1"
        />
        {!letterURL.startsWith("https://") && letterURL && (
          <p className="text-xs text-red-600 mt-1">
            URL must start with&nbsp;https://
          </p>
        )}
      </section>

      {/* T-Chart panels */}
      {categories.map((cat) => (
        <details key={cat} className="border rounded" open>
          <summary className="bg-gray-100 px-4 py-2 font-semibold capitalize cursor-pointer">
            {cat}
          </summary>
          <div className="grid grid-cols-2 gap-4 p-4">
            {/* Speech column */}
            <div>
              <label className="font-semibold">Speech observation</label>
              <textarea
                className="w-full border rounded p-2 mb-2"
                value={data[cat].speech}
                onChange={(e) => update(cat, "speech", e.target.value)}
              />
              <label className="font-semibold">Supporting quote</label>
              <textarea
                className="w-full border rounded p-2"
                value={data[cat].sQuote}
                onChange={(e) => update(cat, "sQuote", e.target.value)}
              />
            </div>

            {/* Letter column */}
            <div>
              <label className="font-semibold">Letter observation</label>
              <textarea
                className="w-full border rounded p-2 mb-2"
                value={data[cat].letter}
                onChange={(e) => update(cat, "letter", e.target.value)}
              />
              <label className="font-semibold">Supporting quote</label>
              <textarea
                className="w-full border rounded p-2"
                value={data[cat].lQuote}
                onChange={(e) => update(cat, "lQuote", e.target.value)}
              />
            </div>
          </div>
        </details>
      ))}

      {/* Save / Next */}
      <button
        disabled={!readyToSave}
        onClick={handleSave}
        className="px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {readyToSave ? "Save & Continue" : "Complete all fields to continue"}
      </button>
    </div>
  );
}
