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
        observation: "",
        quote: "",
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
        if (newEntries[row.type]) {
          newEntries[row.type] = {
            observation: row.observation || "",
            quote: row.quote || "",
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
          type: cat,
          observation: entry.observation,
          quote: entry.quote,
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
      <h2 className="text-2xl font-bold text-theme-green">
        Module 2: MLK Speech vs. Letter Analysis
      </h2>

      <p className="text-theme-dark">
        Use this chart to compare the rhetorical strategies used in Dr. King's{" "}
        <em>I Have a Dream</em> speech and{" "}
        <em>Letter from a Birmingham Jail</em>.
      </p>

      {categories.map((cat) => (
        <div key={cat} className="space-y-2">
          <h3 className="font-semibold">{cat}</h3>

          <input
            type="text"
            placeholder="Observation"
            value={entries[cat].observation}
            onChange={handleChange(cat, "observation")}
            className="border rounded p-2 w-full"
          />

          <input
            type="text"
            placeholder="Quote"
            value={entries[cat].quote}
            onChange={handleChange(cat, "quote")}
            className="border rounded p-2 w-full"
          />

          <input
            type="text"
            placeholder="Letter URL"
            value={entries[cat].letter_url}
            onChange={handleChange(cat, "letter_url")}
            className="border rounded p-2 w-full"
          />
        </div>
      ))}

      <button
        onClick={handleSave}
        className="bg-theme-green text-white px-4 py-2 rounded"
      >
        Save
      </button>

      <div>{status}</div>
    </div>
  );
}