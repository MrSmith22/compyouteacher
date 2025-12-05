"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { logActivity } from "../lib/logActivity";

export default function ModuleFour() {
  const { data: session } = useSession();
  const router = useRouter();

  const [analysis, setAnalysis] = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [newBucketName, setNewBucketName] = useState("");
  const [reflection, setReflection] = useState("");
  const [filter, setFilter] = useState({ strategy: "", source: "" });

  // guard so we only log module_started once per visit
  const hasLoggedStartRef = useRef(false);

  // 📌 Load analysis + buckets + reflection
  useEffect(() => {
    const fetchData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      // Log module start once per visit
      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        logActivity(email, "module_started", { module: 4 });
      }

      // Load analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from("tchart_entries")
        .select("*")
        .eq("user_email", email);

      if (analysisError) {
        console.error("Error fetching analysis:", analysisError);
      } else {
        setAnalysis(analysisData || []);
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

  // helper to summarize bucket state for logs
  const getBucketMetrics = () => {
    const bucketCount = buckets.length;
    const totalItems = buckets.reduce(
      (sum, b) => sum + (Array.isArray(b.items) ? b.items.length : 0),
      0
    );
    const reflectionLength = reflection.trim().length;
    return { bucketCount, totalItems, reflectionLength };
  };

  // 📌 Save when buckets or reflection change (auto-save)
  useEffect(() => {
    const saveBuckets = async () => {
      const email = session?.user?.email;
      if (!email) return;
      if (buckets.length === 0 && reflection.trim() === "") return;

      const nowIso = new Date().toISOString();

      const { error } = await supabase
        .from("bucket_groups")
        .upsert(
          {
            user_email: email,
            buckets,
            reflection,
            updated_at: nowIso,
          },
          { onConflict: "user_email" }
        );

      if (error) {
        console.error("Error saving buckets & reflection:", error);
      } else {
        const metrics = getBucketMetrics();
        // fire and forget is fine here
        logActivity(email, "buckets_autosaved", {
          module: 4,
          ...metrics,
        });
      }
    };

    saveBuckets();
  }, [buckets, reflection, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const addBucket = async () => {
    if (!newBucketName.trim()) return;

    const email = session?.user?.email;
    const trimmed = newBucketName.trim();

    const updated = [...buckets, { name: trimmed, items: [] }];
    setBuckets(updated);
    setNewBucketName("");

    if (email) {
      const metrics = {
        bucketCount: updated.length,
        totalItems: updated.reduce(
          (sum, b) => sum + (Array.isArray(b.items) ? b.items.length : 0),
          0
        ),
      };

      await logActivity(email, "bucket_created", {
        module: 4,
        bucketName: trimmed,
        ...metrics,
      });
    }
  };

  const addToBucket = async (bucketIndex, item) => {
    if (bucketIndex < 0 || bucketIndex >= buckets.length) return;

    const email = session?.user?.email;

    const updated = [...buckets];
    const targetBucket = updated[bucketIndex];

    targetBucket.items = Array.isArray(targetBucket.items)
      ? [...targetBucket.items, item]
      : [item];

    updated[bucketIndex] = targetBucket;
    setBuckets(updated);

    if (email) {
      await logActivity(email, "bucket_item_added", {
        module: 4,
        bucketName: targetBucket.name,
        bucketIndex,
        entryId: item.id ?? null,
        category: item.category,
        type: item.type,
      });
    }
  };

  // ✅ Filter & map analysis
  const filteredAnalysis = analysis.filter((entry) => {
    return (
      (!filter.strategy || entry.category === filter.strategy) &&
      (!filter.source || entry.type === filter.source)
    );
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-theme-dark">
        🧠 Group Your Ideas into Buckets
      </h1>

      <p className="mb-4 text-gray-700">
        Use the filters to explore your analysis entries. Then create buckets
        (like paragraph ideas) and add entries into them. These groupings will
        help you plan your outline in the next module.
      </p>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          className="border p-2 rounded"
          value={filter.strategy}
          onChange={(e) =>
            setFilter({ ...filter, strategy: e.target.value })
          }
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
          onChange={(e) =>
            setFilter({ ...filter, source: e.target.value })
          }
        >
          <option value="">Filter by Source</option>
          <option value="speech">I Have a Dream</option>
          <option value="letter">Letter from Birmingham Jail</option>
        </select>
      </div>

      {/* Analysis Entries */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-theme-dark">
          Your Analysis Entries
        </h2>
        <ul className="space-y-2">
          {filteredAnalysis.map((entry, i) => (
            <li key={entry.id ?? i} className="border p-3 rounded bg-gray-50">
              <p>
                <strong>Category:</strong> {entry.category}
              </p>
              <p>
                <strong>Source:</strong> {entry.type}
              </p>
              <p>
                <strong>Observation:</strong> {entry.observation}
              </p>
              <p>
                <strong>Quote:</strong>{" "}
                {entry.quote || <em>None yet</em>}
              </p>
              {buckets.length > 0 && (
                <div className="mt-2">
                  <label className="mr-2">Add to bucket:</label>
                  <select
                    onChange={(e) => {
                      const idx = parseInt(e.target.value, 10);
                      if (!Number.isNaN(idx)) {
                        addToBucket(idx, entry);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    className="border p-1 rounded"
                  >
                    <option value="">Select bucket</option>
                    {buckets.map((b, index) => (
                      <option key={index} value={index}>
                        {b.name}
                      </option>
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
        <h2 className="text-lg font-semibold mb-2 text-theme-dark">
          Create Buckets
        </h2>
        <div className="flex gap-2">
          <input
            className="border p-2 rounded w-full"
            placeholder="New bucket name..."
            value={newBucketName}
            onChange={(e) => setNewBucketName(e.target.value)}
          />
          <button
            onClick={addBucket}
            className="bg-theme-blue text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* Buckets */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-theme-dark">
          Your Buckets
        </h2>
        {buckets.map((bucket, i) => (
          <div
            key={i}
            className="mb-4 border p-4 rounded bg-white shadow"
          >
            <h3 className="font-bold text-theme-blue mb-2">
              {bucket.name}
            </h3>
            <ul className="list-disc list-inside">
              {(bucket.items || []).map((item, j) => (
                <li key={j}>
                  <strong>
                    {item.category} ({item.type})
                  </strong>
                  {item.quote && (
                    <span className="italic"> “{item.quote}”</span>
                  )}
                  {item.observation && <> — {item.observation}</>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Final Reflection */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-2 text-theme-dark">
          💬 Reflection
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          Why did you group your observations this way? Which patterns or key
          ideas do you think are important enough to include in your essay?
        </p>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          className="w-full border rounded p-3 min-h-[120px]"
          placeholder="Write your thoughts here..."
        />
      </div>

      {/* Save & Continue Button */}
      <div className="text-center mt-6">
        <button
          onClick={async () => {
            const email = session?.user?.email;
            if (!email) return;

            const nowIso = new Date().toISOString();

            const { error } = await supabase.from("bucket_groups").upsert(
              {
                user_email: email,
                buckets,
                reflection,
                updated_at: nowIso,
              },
              { onConflict: "user_email" }
            );

            if (error) {
              alert("Error saving: " + error.message);
            } else {
              const metrics = getBucketMetrics();
              await logActivity(email, "module_completed", {
                module: 4,
                ...metrics,
              });
              router.push("/modules/4/success");
            }
          }}
          className="px-6 py-3 bg-theme-blue text-white rounded shadow hover:bg-blue-700"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}