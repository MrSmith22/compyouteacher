"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ObservationsPage({ step, category, title, instructions, nextStep }) {
  const { data: session } = useSession();
  const email = session?.user?.email;
  const router = useRouter();

  const [speechURL, setSpeechURL] = useState("");
  const [letterURL, setLetterURL] = useState("");
  const [observations, setObservations] = useState([{ note: "", quote: "" }]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!email) return;

    const fetchData = async () => {
      setLoading(true);

      const { data: resourceData, error: resourceError } = await supabase
        .from("user_resources")
        .select("*")
        .eq("user_email", email)
        .single();

      if (resourceError) console.error("Error fetching user_resources:", resourceError);

      if (resourceData) {
        if (resourceData.speech_url) setSpeechURL(resourceData.speech_url);
        if (resourceData.letter_url) setLetterURL(resourceData.letter_url);
      }

      const { data: tchartData, error: tchartError } = await supabase
        .from("tchart_entries")
        .select("*")
        .eq("user_email", email)
        .eq("category", category)
        .eq("type", "speech"); // we assume same number of speech & letter entries for now

      if (tchartError) console.error("Error fetching tchart_entries:", tchartError);

      if (tchartData?.length) {
        const loaded = tchartData.map(row => ({
          note: row.observation || "",
          quote: row.quote || ""
        }));
        setObservations(loaded);
      }

      setLoading(false);
    };

    fetchData();
  }, [email, category]);

  const handleAddObservation = () => {
    setObservations([...observations, { note: "", quote: "" }]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...observations];
    updated[index][field] = value;
    setObservations(updated);
  };

  const handleSave = async () => {
    if (!email) return;

    setStatus("Saving…");

    const entries = observations
      .filter(o => o.note.trim() && o.quote.trim())
      .flatMap(o => [
        {
          user_email: email,
          category,
          type: "speech",
          observation: o.note,
          quote: o.quote,
          letter_url: letterURL,
          updated_at: new Date().toISOString()
        },
        {
          user_email: email,
          category,
          type: "letter",
          observation: o.note,
          quote: o.quote,
          letter_url: letterURL,
          updated_at: new Date().toISOString()
        }
      ]);

    if (!entries.length) {
      setStatus("❌ Please add at least one observation and quote.");
      return;
    }

    const { error } = await supabase.from("tchart_entries").upsert(entries);

    if (error) {
      console.error("Error saving:", error.message);
      setStatus("❌ Error saving");
    } else {
      setStatus("✅ Saved!");
      setTimeout(() => {
        router.push(nextStep);
      }, 1000);
    }
  };

  if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white shadow rounded">
      <h1 className="text-3xl font-bold text-theme-green mb-4">
        Module 2 — Step {step}: {title}
      </h1>

      <p className="text-theme-dark mb-4">
        {instructions}
      </p>

      <div className="flex space-x-4 mt-4">
        <button
          disabled={!speechURL}
          onClick={() => window.open(speechURL, "_blank")}
          className={`px-4 py-2 rounded text-white ${
            speechURL ? "bg-theme-blue hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          View Speech
        </button>

        <button
          disabled={!letterURL}
          onClick={() => window.open(letterURL, "_blank")}
          className={`px-4 py-2 rounded text-white ${
            letterURL ? "bg-theme-blue hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          View Letter
        </button>
      </div>

      <div className="space-y-4 mt-6">
        {observations.map((obs, index) => (
          <div
            key={index}
            className="border rounded p-4 bg-gray-50 space-y-2 shadow"
          >
            <h3 className="font-semibold text-theme-dark">
              Observation {index + 1}
            </h3>

            <div>
              <label className="block font-medium mb-1">Your Observation</label>
              <textarea
                value={obs.note}
                onChange={(e) => handleChange(index, "note", e.target.value)}
                className="w-full border rounded p-2"
                rows={3}
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Supporting Quote</label>
              <textarea
                value={obs.quote}
                onChange={(e) => handleChange(index, "quote", e.target.value)}
                className="w-full border rounded p-2"
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="text-center space-y-4 mt-6">
        <button
          onClick={handleAddObservation}
          className="bg-theme-blue hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          + Add Another Observation
        </button>

        <div>
          <button
            onClick={handleSave}
            className="bg-theme-green hover:bg-green-700 text-white px-6 py-3 rounded shadow"
          >
            Save & Continue
          </button>
        </div>

        <div>{status}</div>
      </div>
    </div>
  );
}
