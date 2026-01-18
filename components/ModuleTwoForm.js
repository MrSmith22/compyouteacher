"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "next-auth/react";

const categories = ["ethos", "pathos", "logos", "audience", "purpose"];

function buildBlank() {
  return Object.fromEntries(
    categories.map((c) => [
      c,
      {
        speech: [{ note: "", quote: "" }],
        letter: [{ note: "", quote: "" }],
      },
    ])
  );
}

export default function ModuleTwoForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const email = session?.user?.email || "";

  const blank = useMemo(() => buildBlank(), []);
  const [data, setData] = useState(blank);
  const [letterURL, setLetterURL] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!email) return;

    (async () => {
      setLoaded(false);

      const { data: rows, error } = await supabase
        .from("tchart_entries")
        .select("*")
        .eq("user_email", email);

      if (error) {
        console.error("Load error:", error);
        setLoaded(true);
        return;
      }

      if (!rows?.length) {
        setData(blank);
        setLetterURL("");
        setLoaded(true);
        return;
      }

      const tmp = buildBlank();

      // letter_url can be stored on each row, so pick the first non empty one
      const firstUrl = rows.find((r) => r.letter_url)?.letter_url;
      if (firstUrl) setLetterURL(firstUrl);

      // Group rows into arrays by category and type using entry_index
      for (const r of rows) {
        if (!r.category || !r.type) continue;
        const cat = r.category;
        const type = r.type;

        if (!tmp[cat]) continue;
        if (type !== "speech" && type !== "letter") continue;

        const idx = Number.isInteger(r.entry_index) ? r.entry_index : 0;

        while (tmp[cat][type].length <= idx) {
          tmp[cat][type].push({ note: "", quote: "" });
        }

        tmp[cat][type][idx] = {
          note: r.observation || "",
          quote: r.quote || "",
        };
      }

      // Clean up any fully empty trailing rows, but always keep at least 1
      for (const cat of categories) {
        for (const type of ["speech", "letter"]) {
          const arr = tmp[cat][type];
          while (arr.length > 1) {
            const last = arr[arr.length - 1];
            if ((last.note || "").trim() || (last.quote || "").trim()) break;
            arr.pop();
          }
        }
      }

      setData(tmp);
      setLoaded(true);
    })();
  }, [email, blank]);

  const updateCategoryArray = (cat, type, newArray) => {
    setData((prev) => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [type]: newArray,
      },
    }));
  };

  // For now we keep your strict gating.
  // Later we can loosen this so it auto saves partial work.
  const readyToSave =
    letterURL.startsWith("https://") &&
    categories.every((c) => {
      const speechEntries = data[c].speech;
      const letterEntries = data[c].letter;

      const speechFilled =
        speechEntries.length > 0 &&
        speechEntries.every((entry) => entry.note && entry.quote);

      const letterFilled =
        letterEntries.length > 0 &&
        letterEntries.every((entry) => entry.note && entry.quote);

      return speechFilled && letterFilled;
    });

  const handleSave = async () => {
    if (!email) return;

    setSaving(true);

    try {
      const entries = [];

      for (const category of categories) {
        const observations = data[category];

        observations.speech.forEach((entry, index) => {
          entries.push({
            user_email: email,
            category,
            type: "speech",
            entry_index: index,
            observation: entry.note,
            quote: entry.quote,
            letter_url: letterURL,
            updated_at: new Date().toISOString(),
          });
        });

        observations.letter.forEach((entry, index) => {
          entries.push({
            user_email: email,
            category,
            type: "letter",
            entry_index: index,
            observation: entry.note,
            quote: entry.quote,
            letter_url: letterURL,
            updated_at: new Date().toISOString(),
          });
        });
      }

      const { error } = await supabase.from("tchart_entries").upsert(entries, {
        onConflict: "user_email,category,type,entry_index",
      });

      if (error) {
        alert("Error saving data: " + error.message);
        return;
      }

      router.push("/modules/2/success");
    } finally {
      setSaving(false);
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
          <li>Watch Dr. King’s I Have a Dream speech below.</li>
          <li>
            In a new tab, search{" "}
            <code>"Letter from Birmingham Jail" full text</code> and choose a
            reputable .edu or .gov site.
          </li>
          <li>Paste that page’s URL in the box provided.</li>
          <li>
            Fill in the T-Charts and add at least one direct quote for every
            observation.
          </li>
        </ol>
      </section>

      <section>
        <div className="rounded shadow overflow-hidden">
          <video width="100%" controls>
            <source src="/videos/IHaveADreamSpeech.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      <section className="bg-white border p-4 rounded">
        <label className="font-semibold text-theme-dark block mb-1">
          Paste the URL of the Letter you found:
        </label>
        <input
          type="url"
          value={letterURL}
          onChange={(e) => setLetterURL(e.target.value)}
          placeholder="https://www.example.edu/letter.html"
          className="w-full border rounded px-3 py-2"
        />
        {!letterURL.startsWith("https://") && letterURL && (
          <p className="text-xs text-theme-red mt-1">URL must start with https://</p>
        )}
      </section>

      {categories.map((cat) => (
        <details key={cat} className="bg-white border rounded" open>
          <summary className="bg-gray-100 px-4 py-2 font-semibold capitalize cursor-pointer text-theme-dark">
            {cat}
          </summary>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4">
            <div>
              <h4 className="font-bold mb-2 text-theme-blue">Speech Observations</h4>

              {data[cat].speech.map((entry, index) => (
                <div key={index} className="mb-4 border-b pb-4">
                  <label className="block font-semibold mb-1">
                    Observation {index + 1}
                  </label>
                  <textarea
                    className="w-full border rounded p-2 mb-2"
                    value={entry.note}
                    onChange={(e) => {
                      const updated = [...data[cat].speech];
                      updated[index] = { ...updated[index], note: e.target.value };
                      updateCategoryArray(cat, "speech", updated);
                    }}
                  />
                  <label className="block font-semibold mb-1">Supporting Quote</label>
                  <textarea
                    className="w-full border rounded p-2"
                    value={entry.quote}
                    onChange={(e) => {
                      const updated = [...data[cat].speech];
                      updated[index] = { ...updated[index], quote: e.target.value };
                      updateCategoryArray(cat, "speech", updated);
                    }}
                  />
                </div>
              ))}

              <button
                type="button"
                className="text-sm text-theme-blue hover:underline"
                onClick={() =>
                  updateCategoryArray(cat, "speech", [
                    ...data[cat].speech,
                    { note: "", quote: "" },
                  ])
                }
              >
                + Add Another Speech Observation
              </button>
            </div>

            <div>
              <h4 className="font-bold mb-2 text-theme-green">Letter Observations</h4>

              {data[cat].letter.map((entry, index) => (
                <div key={index} className="mb-4 border-b pb-4">
                  <label className="block font-semibold mb-1">
                    Observation {index + 1}
                  </label>
                  <textarea
                    className="w-full border rounded p-2 mb-2"
                    value={entry.note}
                    onChange={(e) => {
                      const updated = [...data[cat].letter];
                      updated[index] = { ...updated[index], note: e.target.value };
                      updateCategoryArray(cat, "letter", updated);
                    }}
                  />
                  <label className="block font-semibold mb-1">Supporting Quote</label>
                  <textarea
                    className="w-full border rounded p-2"
                    value={entry.quote}
                    onChange={(e) => {
                      const updated = [...data[cat].letter];
                      updated[index] = { ...updated[index], quote: e.target.value };
                      updateCategoryArray(cat, "letter", updated);
                    }}
                  />
                </div>
              ))}

              <button
                type="button"
                className="text-sm text-theme-green hover:underline"
                onClick={() =>
                  updateCategoryArray(cat, "letter", [
                    ...data[cat].letter,
                    { note: "", quote: "" },
                  ])
                }
              >
                + Add Another Letter Observation
              </button>
            </div>
          </div>
        </details>
      ))}

      <div className="text-center">
        <button
          disabled={!readyToSave || saving}
          onClick={handleSave}
          className={`px-6 py-3 text-white rounded shadow transition ${
            readyToSave && !saving
              ? "bg-theme-blue hover:bg-blue-800"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {saving
            ? "Saving..."
            : readyToSave
            ? "Save & Continue"
            : "Complete all fields to continue"}
        </button>
      </div>
    </div>
  );
}