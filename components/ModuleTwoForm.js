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

  const blank = Object.fromEntries(
    categories.map(c => [
      c,
      {
        speech: [{ note: "", quote: "" }],
        letter: [{ note: "", quote: "" }]
      }
    ])
  );

  const [data, setData] = useState(blank);
  const [letterURL, setLetterURL] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!email) return;

    (async () => {
      const { data: rows, error } = await supabase
        .from("tchart_entries")
        .select("*")
        .eq("user_email", email);

      if (error) console.error(error);

      const tmp = { ...blank };

      if (rows?.length) {
        for (const row of rows) {
          const entry = {
            note: row.observation || row.speech_note || row.letter_note || "",
            quote: row.quote || row.speech_quotes?.[0] || row.letter_quotes?.[0] || ""
          };

          if (!tmp[row.category]) continue;

          if (row.type === "speech") {
            tmp[row.category].speech = [entry];
          } else if (row.type === "letter") {
            tmp[row.category].letter = [entry];
          }

          if (row.letter_url) setLetterURL(row.letter_url);
        }
      }

      setData(tmp);
      setLoaded(true);
    })();
  }, [email]);

  const update = (cat, key, val) =>
    setData(d => ({ ...d, [cat]: { ...d[cat], [key]: val } }));

  const readyToSave =
    letterURL.startsWith("https://") &&
    categories.every(c => {
      const s = data[c].speech;
      const l = data[c].letter;
      const sValid = s.length > 0 && s.every(e => e.note && e.quote);
      const lValid = l.length > 0 && l.every(e => e.note && e.quote);
      return sValid && lValid;
    });

  const handleSave = async () => {
    const entries = [];

    for (const category of categories) {
      const observations = data[category];

      for (const entry of observations.speech) {
        entries.push({
          user_email: email,
          category,
          type: "speech",
          observation: entry.note,
          quote: entry.quote,
          letter_url: letterURL,
          updated_at: new Date().toISOString()
        });
      }

      for (const entry of observations.letter) {
        entries.push({
          user_email: email,
          category,
          type: "letter",
          observation: entry.note,
          quote: entry.quote,
          letter_url: letterURL,
          updated_at: new Date().toISOString()
        });
      }
    }

    const { error } = await supabase.from("tchart_entries").upsert(entries);

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      router.push("/modules/2/success");
    }
  };

  if (!loaded) return <p className="p-6">Loading…</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-10 bg-theme-light rounded shadow space-y-8">
      <section className="text-center">
        <h1 className="text-3xl font-extrabold text-theme-green mb-4">
          Module 2 — Analyze the Speech & Letter
        </h1>
        <ol className="list-decimal list-inside space-y-1 text-theme-dark">
          <li>Watch Dr. King’s <em>I Have a Dream</em> speech below.</li>
          <li>
            In a new tab, search <code>"Letter from Birmingham Jail" full text</code> and choose a .edu or .gov site.
          </li>
          <li>Paste that page’s URL in the box provided.</li>
          <li>Fill in the T‑Charts and add at least one direct quote for every observation.</li>
        </ol>
      </section>

      <section>
        <video width="100%" controls className="rounded shadow">
          <source src="/videos/IHaveADreamSpeech.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </section>

      <section className="bg-white border p-4 rounded">
        <label className="font-semibold text-theme-dark block mb-1">
          Paste the URL of the Letter you found:
        </label>
        <input
          type="url"
          value={letterURL}
          onChange={e => setLetterURL(e.target.value)}
          placeholder="https://www.example.edu/letter.html"
          className="w-full border rounded px-3 py-2"
        />
        {!letterURL.startsWith("https://") && letterURL && (
          <p className="text-xs text-theme-red mt-1">URL must start with https://</p>
        )}
      </section>

      {categories.map(cat => (
        <details key={cat} className="bg-white border rounded" open>
          <summary className="bg-gray-100 px-4 py-2 font-semibold capitalize cursor-pointer text-theme-dark">
            {cat}
          </summary>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4">
            <div>
              <h4 className="font-bold mb-2 text-theme-blue">Speech Observations</h4>
              {data[cat].speech.map((entry, index) => (
                <div key={index} className="mb-4 border-b pb-4">
                  <label className="block font-semibold mb-1">Observation {index + 1}</label>
                  <textarea
                    className="w-full border rounded p-2 mb-2"
                    value={entry.note}
                    onChange={e => {
                      const updated = [...data[cat].speech];
                      updated[index].note = e.target.value;
                      update(cat, "speech", updated);
                    }}
                  />
                  <label className="block font-semibold mb-1">Supporting Quote</label>
                  <textarea
                    className="w-full border rounded p-2"
                    value={entry.quote}
                    onChange={e => {
                      const updated = [...data[cat].speech];
                      updated[index].quote = e.target.value;
                      update(cat, "speech", updated);
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-theme-blue hover:underline"
                onClick={() => update(cat, "speech", [...data[cat].speech, { note: "", quote: "" }])}
              >
                + Add Another Speech Observation
              </button>
            </div>

            <div>
              <h4 className="font-bold mb-2 text-theme-green">Letter Observations</h4>
              {data[cat].letter.map((entry, index) => (
                <div key={index} className="mb-4 border-b pb-4">
                  <label className="block font-semibold mb-1">Observation {index + 1}</label>
                  <textarea
                    className="w-full border rounded p-2 mb-2"
                    value={entry.note}
                    onChange={e => {
                      const updated = [...data[cat].letter];
                      updated[index].note = e.target.value;
                      update(cat, "letter", updated);
                    }}
                  />
                  <label className="block font-semibold mb-1">Supporting Quote</label>
                  <textarea
                    className="w-full border rounded p-2"
                    value={entry.quote}
                    onChange={e => {
                      const updated = [...data[cat].letter];
                      updated[index].quote = e.target.value;
                      update(cat, "letter", updated);
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-theme-green hover:underline"
                onClick={() => update(cat, "letter", [...data[cat].letter, { note: "", quote: "" }])}
              >
                + Add Another Letter Observation
              </button>
            </div>
          </div>
        </details>
      ))}

      <div className="text-center">
        <button
          disabled={!readyToSave}
          onClick={handleSave}
          className={`px-6 py-3 text-white rounded shadow transition ${
            readyToSave ? "bg-theme-blue hover:bg-blue-800" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {readyToSave ? "Save & Continue" : "Complete all fields to continue"}
        </button>
      </div>
    </div>
  );
}
