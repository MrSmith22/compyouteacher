"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";

const categories = ["ethos", "pathos", "logos", "audience", "purpose"];

export default function ModuleTwo() {
  const { data: session } = useSession();

  const [entries, setEntries] = useState(() =>
    categories.reduce((acc, key) => {
      acc[key] = {
        speech_note: "",
        letter_note: "",
        speech_quote: "",
        letter_quotes: "",
        letter_url: "",
      };
      return acc;
    }, {})
  );

  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.email) return;

      const { data, error } = await supabase
        .from("tchart_entries")
        .select("*")
        .eq("user_email", session.user.email);

      if (error) {
        console.error("Error fetching data:", error.message);
        return;
      }

      const newEntries = { ...entries };
      data.forEach((row) => {
        if (newEntries[row.category]) {
          newEntries[row.category] = {
            speech_note: row.speech_note || "",
            letter_note: row.letter_note || "",
            speech_quote: row.speech_quote || "",
            letter_quotes: row.letter_quotes || "",
            letter_url: row.letter_url || "",
          };
        }
      });
      setEntries(newEntries);
    };

    fetchData();
  }, [session]);

  const handleChange = (cat, field) => (e) => {
    setEntries((prev) => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [field]: e.target.value,
      },
    }));
  };

  const handleSave = async () => {
  if (!session?.user?.email) return;

  setStatus("Saving...");

  const updates = await Promise.all(
    categories.map(async (cat) => {
      const entry = entries[cat];
      const { error } = await supabase.from("tchart_entries").upsert({
        user_email: session.user.email,
        category: cat,
        speech_note: entry.speech_note,
        letter_note: entry.letter_note,
        speech_quote: entry.speech_quote,
        letter_quotes: entry.letter_quotes,
        letter_url: entry.letter_url,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`❌ Error saving ${cat}:`, error.message);
      }

      return error;
    })
  );

  const anyError = updates.some((e) => e);
  setStatus(anyError ? "❌ Error saving one or more entries." : "✅ Saved!");
};


  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold">Module 2: MLK Speech vs. Letter Analysis</h2>

      <p>
        Use this chart to compare the rhetorical strategies used in Dr. King's{" "}
        <em>I Have a Dream</em> speech and{" "}
        <em>Letter from a Birmingham Jail</em> across five categories.
      </p>

      {categories.map((cat) => (
        <div key={cat} className="border-t pt-6">
          <h3 className="text-xl font-semibold capitalize mb-2">{cat}</h3>
          <textarea
            className="w-full border p-2 rounded mb-2"
            rows={2}
            placeholder="Observation from the speech"
            value={entries[cat].speech_note}
            onChange={handleChange(cat, "speech_note")}
          />
          <textarea
            className="w-full border p-2 rounded mb-2"
            rows={2}
            placeholder="Observation from the letter"
            value={entries[cat].letter_note}
            onChange={handleChange(cat, "letter_note")}
          />
          <textarea
            className="w-full border p-2 rounded mb-2"
            rows={2}
            placeholder="Quote from the speech"
            value={entries[cat].speech_quote}
            onChange={handleChange(cat, "speech_quote")}
          />
          <textarea
            className="w-full border p-2 rounded mb-2"
            rows={2}
            placeholder="Quote from the letter"
            value={entries[cat].letter_quotes}
            onChange={handleChange(cat, "letter_quotes")}
          />
          <input
            type="text"
            className="w-full border p-2 rounded mb-4"
            placeholder="URL (optional)"
            value={entries[cat].letter_url}
            onChange={handleChange(cat, "letter_url")}
          />
        </div>
      ))}

      <button
        onClick={handleSave}
        className="bg-theme-blue text-white px-4 py-2 rounded shadow"
      >
        Save My Work
      </button>

      {status && <p className="text-sm text-gray-600 mt-2">{status}</p>}
    </div>
  );
}
