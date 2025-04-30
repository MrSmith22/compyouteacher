// JavaScript source code
// components/ModuleFour.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "next-auth/react";

export default function ModuleFour() {
  const { data: session } = useSession();
  const [analysis, setAnalysis] = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [newBucketName, setNewBucketName] = useState("");
  const [reflection, setReflection] = useState("");
  const [filter, setFilter] = useState({ strategy: "", source: "" });

  // 📌 Load analysis + buckets + reflection
useEffect(() => {
  const fetchData = async () => {
    const email = session?.user?.email;
    if (!email) return;

    // Load analysis
    const { data: analysisData, error: analysisError } = await supabase
      .from("tchart_entries")
      .select("*")
      .eq("user_email", email);

    if (analysisError) {
      console.error("Error fetching analysis:", analysisError);
    } else {
      setAnalysis(analysisData);
    }

    // Load buckets + reflection
    const { data: saved, error: loadError } = await supabase
      .from("bucket_groups")
      .select("*")
      .eq("user_email", email);

    if (loadError) {
      console.warn("Error loading buckets/reflection:", loadError);
    } else if (saved?.length > 0) {
      setBuckets(saved[0].buckets || []);
      setReflection(saved[0].reflection || "");
    }
  };

  fetchData();
}, [session]);


  // 📌 Save when buckets or reflection change
  useEffect(() => {
    const saveBuckets = async () => {
      const email = session?.user?.email;
     if (!email) return;
if (buckets.length === 0 && reflection.trim() === "") return;


     console.log("Saving for:", email);


     console.log("Submitting payload:", JSON.stringify({
  user_email: email,
  buckets,
  reflection,
  updated_at: new Date().toISOString(),
}, null, 2));


const { error } = await supabase
  .from("bucket_groups")
  .upsert(
    {
      user_email: email,
      buckets,
      reflection,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_email" }
  );



      if (error) {
        console.error("Error saving buckets & reflection:", error);
      }
    };

    saveBuckets();
  }, [buckets, reflection, session]);




  const addBucket = () => {
    if (!newBucketName) return;
    setBuckets([...buckets, { name: newBucketName, items: [] }]);
    setNewBucketName("");
  };

  const addToBucket = (bucketIndex, item) => {
    const updated = [...buckets];
    updated[bucketIndex].items.push(item);
    setBuckets(updated);
  };

  const filteredAnalysis = analysis.flatMap((entry) => {
  const entries = [];

  if (
    (!filter.strategy || entry.category === filter.strategy) &&
    (!filter.source || filter.source === "speech")
  ) {
    entries.push({
      category: entry.category,
      source: "speech",
      observation: entry.speech_note,
      quote: (entry.speech_quotes || []).join("; "),
    });
  }

  if (
    (!filter.strategy || entry.category === filter.strategy) &&
    (!filter.source || filter.source === "letter")
  ) {
    entries.push({
      category: entry.category,
      source: "letter",
      observation: entry.letter_note,
      quote: (entry.letter_quotes || []).join("; "),
    });
  }

  return entries;
});


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧠 Group Your Ideas into Buckets</h1>

      <p className="mb-4 text-gray-700">
        Use the filters to explore your analysis entries. Then create buckets (like paragraph ideas)
        and add entries into them. These groupings will help you plan your outline in the next module.
      </p>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          className="border p-2 rounded"
          value={filter.strategy}
          onChange={(e) => setFilter({ ...filter, strategy: e.target.value })}
        >
          <option value="">Filter by Strategy</option>
          <option value="ethos">Ethos</option>
          <option value="pathos">Pathos</option>
          <option value="logos">Logos</option>
          <option value="audience">Audience</option>
          <option value="purpose">Purpose</option>
        </select>

        <select
          className="border p-2 rounded"
          value={filter.source}
          onChange={(e) => setFilter({ ...filter, source: e.target.value })}
        >
          <option value="">Filter by Source</option>
          <option value="speech">I Have a Dream</option>
          <option value="letter">Letter from Birmingham Jail</option>
        </select>
      </div>

      {/* Analysis Entries */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Your Analysis Entries</h2>
        <ul className="space-y-2">
          {filteredAnalysis.map((entry, i) => (
            <li key={i} className="border p-3 rounded bg-gray-50">
              <p><strong>Category:</strong> {entry.category}</p>
              <p><strong>Source:</strong> {entry.source}</p>
              <p><strong>Observation:</strong> {entry.observation}</p>
              <p><strong>Quote:</strong> {entry.quote || <em>None yet</em>}</p>
              {buckets.length > 0 && (
                <div className="mt-2">
                  <label className="mr-2">Add to bucket:</label>
                  <select
                    onChange={(e) => addToBucket(parseInt(e.target.value), entry)}
                    defaultValue=""
                    className="border p-1 rounded"
                  >
                    <option value="">Select bucket</option>
                    {buckets.map((b, index) => (
                      <option key={index} value={index}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

           {/* Bucket Creator */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Create Buckets</h2>
        <div className="flex gap-2">
          <input
            className="border p-2 rounded w-full"
            placeholder="New bucket name..."
            value={newBucketName}
            onChange={(e) => setNewBucketName(e.target.value)}
          />
          <button
            onClick={addBucket}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* Buckets */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Your Buckets</h2>
        {buckets.map((bucket, i) => (
          <div key={i} className="mb-4 border p-4 rounded bg-white shadow">
            <h3 className="font-bold text-blue-600 mb-2">{bucket.name}</h3>
            <ul className="list-disc list-inside">
              {bucket.items.map((item, j) => (
                <li key={j}>
                  <span className="font-medium">{item.category}:</span> {item.observation}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Final Reflection */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-2">💬 Reflection</h2>
        <p className="text-sm text-gray-600 mb-2">
          Why did you group your observations this way? Which patterns or key ideas do you think are
          important enough to include in your essay?
        </p>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          className="w-full border rounded p-3 min-h-[120px]"
          placeholder="Write your thoughts here..."
        />
      </div>
    </div>
  );
}
