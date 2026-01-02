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

  // Module 3 “big picture” recap
  const [thesis, setThesis] = useState("");
  const [audPurpose, setAudPurpose] = useState(null);

  // draft text for “extra ideas” inside each bucket (2nd-ring bubbles)
  const [extraIdeaDrafts, setExtraIdeaDrafts] = useState([]);

  // guard so we only log module_started once per visit
  const hasLoggedStartRef = useRef(false);

  // 📌 Load analysis + buckets + reflection + module 3 recap
  useEffect(() => {
    const fetchData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      // Log module start once per visit
      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        logActivity(email, "module_started", { module: 4 });
      }

      // Load analysis from T-Charts (Module 2)
      const { data: analysisData, error: analysisError } = await supabase
        .from("tchart_entries")
        .select("*")
        .eq("user_email", email);

      if (analysisError) {
        console.error("Error fetching analysis:", analysisError);
      } else {
        setAnalysis(analysisData || []);
      }

      // Load buckets + reflection (existing work in Module 4)
      const { data: saved, error: loadError } = await supabase
        .from("bucket_groups")
        .select("*")
        .eq("user_email", email);

      if (loadError) {
        console.warn("Error loading buckets/reflection:", loadError);
      } else if (saved?.length > 0) {
        const existingBuckets = (saved[0].buckets || []).map((b) => ({
          ...b,
          // make sure extraIdeas is always an array so UI is easier
          extraIdeas: Array.isArray(b.extraIdeas) ? b.extraIdeas : [],
        }));
        setBuckets(existingBuckets);
        setReflection(saved[0].reflection || "");
      }

      // Load Module 3 recap: audience, purpose, thesis
      const { data: m3, error: m3Error } = await supabase
        .from("module3_responses")
        .select("responses, thesis")
        .eq("user_email", email)
        .maybeSingle();

      if (m3Error) {
        console.warn("Error loading module3 recap:", m3Error);
      } else if (m3) {
        if (Array.isArray(m3.responses) && m3.responses.length >= 4) {
          const [speechAudience, speechPurpose, letterAudience, letterPurpose] =
            m3.responses;
          setAudPurpose({
            speechAudience: speechAudience || "",
            speechPurpose: speechPurpose || "",
            letterAudience: letterAudience || "",
            letterPurpose: letterPurpose || "",
          });
        }
        if (m3.thesis) setThesis(m3.thesis);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buckets, reflection, session]);

  const addBucket = async () => {
    if (!newBucketName.trim()) return;

    const email = session?.user?.email;
    const trimmed = newBucketName.trim();

    const updated = [...buckets, { name: trimmed, items: [], extraIdeas: [] }];
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
    const targetBucket = { ...updated[bucketIndex] };

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

  const addExtraIdeaToBucket = async (bucketIndex) => {
    const email = session?.user?.email;
    const draft = extraIdeaDrafts[bucketIndex] || "";
    const trimmed = draft.trim();
    if (!trimmed) return;

    const updated = [...buckets];
    const targetBucket = { ...updated[bucketIndex] };
    const existingExtras = Array.isArray(targetBucket.extraIdeas)
      ? targetBucket.extraIdeas
      : [];
    targetBucket.extraIdeas = [...existingExtras, trimmed];
    updated[bucketIndex] = targetBucket;
    setBuckets(updated);

    const newDrafts = [...extraIdeaDrafts];
    newDrafts[bucketIndex] = "";
    setExtraIdeaDrafts(newDrafts);

    if (email) {
      await logActivity(email, "bucket_extra_idea_added", {
        module: 4,
        bucketName: targetBucket.name,
      });
    }
  };

  // Helper: is an analysis entry already inside any bucket?
  const isEntryInAnyBucket = (entry) => {
    const makeKey = (e) =>
      `${e.category ?? ""}|${e.type ?? ""}|${e.observation ?? ""}|${
        e.quote ?? ""
      }`;

    return buckets.some((b) =>
      (b.items || []).some((item) => {
        if (entry.id && item.id) {
          return item.id === entry.id;
        }
        return makeKey(item) === makeKey(entry);
      })
    );
  };

  // ✅ Filter & map analysis, hiding ones that have already been bucketed
  const filteredAnalysis = analysis.filter((entry) => {
    // If the entry is already in some bucket, hide it from the list
    if (isEntryInAnyBucket(entry)) return false;

    return (
      (!filter.strategy || entry.category === filter.strategy) &&
      (!filter.source || entry.type === filter.source)
    );
  });

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Title card */}
        <div className="rounded-2xl border border-theme-blue/30 bg-white shadow p-5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-theme-blue mb-2">
            🧠 Module 4: Group Your Ideas into Buckets
          </h1>
          <p className="text-sm md:text-base text-theme-dark/80">
            In this module, you turn all of your earlier work into{" "}
            <strong>big ideas for body paragraphs</strong>. You will:
          </p>
          <ul className="mt-2 text-sm md:text-base text-theme-dark/80 list-disc list-inside space-y-1">
            <li>
              Review the <strong>audience</strong>, <strong>purpose</strong>, and{" "}
              <strong>rhetorical appeals (ethos, pathos, logos)</strong> you
              already identified.
            </li>
            <li>
              Create <strong>buckets</strong> that act like centers of a{" "}
              bubble map or mind web.
            </li>
            <li>
              Add specific observations and new details around each bucket so you
              have two levels of ideas ready for your outline.
            </li>
          </ul>
        </div>

        {/* Big picture recap from Module 3 */}
        {(audPurpose || thesis) && (
          <div className="rounded-2xl border border-theme-green/40 bg-theme-green/5 p-4 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-theme-green">
              Step 1: Remember Your Big Picture
            </h2>
            <p className="text-sm text-theme-dark/80">
              These are the choices you already made about{" "}
              <strong>audience</strong>, <strong>purpose</strong>, and your{" "}
              <strong>thesis</strong>. Your buckets should help you argue for
              this thesis.
            </p>

            {audPurpose && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg border border-theme-green/30 p-3">
                  <h3 className="font-semibold mb-1 text-theme-dark">
                    Speech: <em>I Have a Dream</em>
                  </h3>
                  <p>
                    <span className="font-semibold">Audience: </span>
                    {audPurpose.speechAudience || <em>Not answered yet</em>}
                  </p>
                  <p>
                    <span className="font-semibold">Purpose: </span>
                    {audPurpose.speechPurpose || <em>Not answered yet</em>}
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-theme-green/30 p-3">
                  <h3 className="font-semibold mb-1 text-theme-dark">
                    Letter: <em>Letter from Birmingham Jail</em>
                  </h3>
                  <p>
                    <span className="font-semibold">Audience: </span>
                    {audPurpose.letterAudience || <em>Not answered yet</em>}
                  </p>
                  <p>
                    <span className="font-semibold">Purpose: </span>
                    {audPurpose.letterPurpose || <em>Not answered yet</em>}
                  </p>
                </div>
              </div>
            )}

            {thesis && (
              <div className="bg-white rounded-lg border border-theme-green/30 p-3 text-sm">
                <h3 className="font-semibold mb-1 text-theme-dark">
                  Your Working Thesis
                </h3>
                <p className="text-theme-dark/80 whitespace-pre-wrap">
                  {thesis}
                </p>
                <p className="text-xs text-theme-dark/60 mt-2">
                  As you create buckets, ask:{" "}
                  <em>
                    Does this bucket help me prove something in this thesis?
                  </em>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions for buckets / bubble map */}
        <div className="rounded-2xl border border-theme-orange/40 bg-theme-orange/5 p-4 shadow-sm space-y-2">
          <h2 className="text-lg font-bold text-theme-orange">
            Step 2: Turn Your Appeals into Bucket Ideas
          </h2>
          <p className="text-sm text-theme-dark/80">
            You already collected evidence using{" "}
            <strong>rhetorical appeals</strong>:
            <span className="font-semibold"> Ethos</span> (credibility),
            <span className="font-semibold"> Pathos</span> (emotion), and
            <span className="font-semibold"> Logos</span> (logic and evidence),
            for both the speech and the letter.
          </p>
          <p className="text-sm text-theme-dark/80">
            Now you will:
          </p>
          <ol className="list-decimal list-inside text-sm text-theme-dark/80 space-y-1">
            <li>
              Use the filters to look at <strong>one type of evidence</strong>{" "}
              at a time (for example, all ethos moves in the letter).
            </li>
            <li>
              Create a <strong>bucket</strong> when you notice a pattern, such
              as “Both texts show King&apos;s moral authority as a minister” or
              “The speech uses hopeful images of the future.”
            </li>
            <li>
              Add related analysis entries into that bucket. These are like
              <strong> first-ring bubbles</strong> around your main idea.
            </li>
            <li>
              Then type extra supporting ideas for that bucket in your own
              words. These become the <strong>second-ring bubbles</strong> that
              will later turn into sentences in your outline.
            </li>
          </ol>
        </div>

        {/* Filters + Analysis entries */}
        <div className="rounded-2xl border border-theme-blue/30 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-theme-blue">
            Your Analysis Entries (from Modules 2 &amp; 3)
          </h2>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <select
              className="border border-theme-dark/10 p-2 rounded-lg text-sm"
              value={filter.strategy}
              onChange={(e) =>
                setFilter({ ...filter, strategy: e.target.value })
              }
            >
              <option value="">Filter by Appeal / Strategy</option>
              <option value="ethos">Ethos (credibility)</option>
              <option value="pathos">Pathos (emotion)</option>
              <option value="logos">Logos (logic &amp; evidence)</option>
              <option value="audience">Audience</option>
              <option value="purpose">Purpose</option>
            </select>

            <select
              className="border border-theme-dark/10 p-2 rounded-lg text-sm"
              value={filter.source}
              onChange={(e) =>
                setFilter({ ...filter, source: e.target.value })
              }
            >
              <option value="">Filter by Source</option>
              <option value="speech">Speech – I Have a Dream</option>
              <option value="letter">Letter – Letter from Birmingham Jail</option>
            </select>
          </div>

          {/* Analysis list */}
          <ul className="space-y-2">
            {filteredAnalysis.length === 0 && (
              <li className="text-sm text-theme-dark/70">
                No entries match this filter, or you have already sorted all of
                them into buckets. Try changing the filters or review your
                buckets below.
              </li>
            )}

            {filteredAnalysis.map((entry, i) => (
              <li
                key={entry.id ?? i}
                className="border border-theme-dark/10 p-3 rounded-xl bg-theme-light"
              >
                <p className="text-xs uppercase tracking-wide text-theme-dark/70 mb-1">
                  {entry.category} •{" "}
                  {entry.type === "speech" ? "Speech" : "Letter"}
                </p>
                <p className="text-sm">
                  <strong>Observation:</strong>{" "}
                  {entry.observation || <em>No observation yet</em>}
                </p>
                <p className="text-sm mt-1">
                  <strong>Quote:</strong>{" "}
                  {entry.quote ? (
                    <span className="italic">“{entry.quote}”</span>
                  ) : (
                    <em>None yet</em>
                  )}
                </p>

                {buckets.length > 0 && (
                  <div className="mt-2">
                    <label className="mr-2 text-sm text-theme-dark/80">
                      Add to bucket:
                    </label>
                    <select
                      onChange={(e) => {
                        const idx = parseInt(e.target.value, 10);
                        if (!Number.isNaN(idx)) {
                          addToBucket(idx, entry);
                          e.target.value = "";
                        }
                      }}
                      defaultValue=""
                      className="border border-theme-dark/10 p-1 rounded text-sm"
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
        <div className="rounded-2xl border border-theme-orange/30 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-theme-orange">
            Create Buckets (Main Ideas for Body Paragraphs)
          </h2>
          <p className="text-sm text-theme-dark/80 mb-2">
            Name each bucket after a <strong>big idea</strong> you might turn
            into a paragraph. Examples:
            <span className="block text-xs text-theme-dark/70 mt-1">
              “Both texts build King&apos;s moral authority,” “The speech uses
              hopeful future images,” “The letter confronts white moderates,”
              etc.
            </span>
          </p>
          <div className="flex gap-2">
            <input
              className="border border-theme-dark/10 p-2 rounded-lg w-full text-sm"
              placeholder="New bucket name (big idea for a paragraph)..."
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value)}
            />
            <button
              onClick={addBucket}
              className="bg-theme-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>

        {/* Buckets */}
        <div className="rounded-2xl border border-theme-blue/20 bg-theme-blue/5 p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-theme-blue">
            Your Buckets as a Two-Level Bubble Map
          </h2>
          <p className="text-sm text-theme-dark/80 mb-4">
            Think of each bucket title as the <strong>center bubble</strong>.
            The analysis entries you add are the <strong>first ring</strong>.
            The extra ideas you type are the <strong>second ring</strong> that
            will become sentences in your outline.
          </p>

          {buckets.length === 0 && (
            <p className="text-sm text-theme-dark/70">
              You do not have any buckets yet. Create a bucket above, then start
              adding entries and extra ideas.
            </p>
          )}

          {buckets.map((bucket, i) => {
            const draft = extraIdeaDrafts[i] || "";
            return (
              <div
                key={i}
                className="mb-4 border border-theme-dark/10 p-4 rounded-2xl bg-white shadow-sm"
              >
                <h3 className="font-bold text-theme-blue mb-2">
                  {bucket.name}
                </h3>

                {/* First ring: analysis items */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-theme-dark/70 mb-1">
                    First ring: linked to specific appeals and sources
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {(bucket.items || []).map((item, j) => (
                      <li key={j}>
                        <strong>
                          {item.category} (
                          {item.type === "speech" ? "speech" : "letter"})
                        </strong>
                        {item.quote && (
                          <span className="italic"> “{item.quote}”</span>
                        )}
                        {item.observation && <> — {item.observation}</>}
                      </li>
                    ))}
                    {(!bucket.items || bucket.items.length === 0) && (
                      <li className="text-sm text-theme-dark/60">
                        No analysis entries added yet. Use the list above to add
                        quotes and observations into this bucket.
                      </li>
                    )}
                  </ul>
                </div>

                {/* Second ring: extra ideas */}
                <div className="mb-2">
                  <p className="text-xs font-semibold text-theme-dark/70 mb-1">
                    Second ring: extra supporting ideas in your own words
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 mb-2">
                    {(bucket.extraIdeas || []).map((idea, k) => (
                      <li key={k}>{idea}</li>
                    ))}
                    {(!bucket.extraIdeas || bucket.extraIdeas.length === 0) && (
                      <li className="text-sm text-theme-dark/60">
                        No extra ideas yet. Add at least 2–3 to show how this
                        bucket could become a full paragraph.
                      </li>
                    )}
                  </ul>

                  <div className="flex gap-2">
                    <input
                      className="border border-theme-dark/10 p-2 rounded-lg w-full text-sm"
                      placeholder="New idea that fits this bucket (second-ring bubble)..."
                      value={draft}
                      onChange={(e) => {
                        const copy = [...extraIdeaDrafts];
                        copy[i] = e.target.value;
                        setExtraIdeaDrafts(copy);
                      }}
                    />
                    <button
                      onClick={() => addExtraIdeaToBucket(i)}
                      className="bg-theme-green text-white px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                    >
                      Add Idea
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Reflection */}
        <div className="rounded-2xl border border-theme-red/30 bg-white p-4 shadow-sm mb-4">
          <h2 className="text-lg font-semibold mb-2 text-theme-red">
            💬 Reflection
          </h2>
          <p className="text-sm text-theme-dark/80 mb-2">
            Explain how your buckets connect back to your thesis. Which buckets
            feel strongest? Which ones might become full body paragraphs, and in
            what order?
          </p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="w-full border border-theme-dark/10 rounded-lg p-3 min-h-[120px] text-sm"
            placeholder="Write your thoughts here..."
          />
        </div>

        {/* Save & Continue Button */}
        <div className="text-center mt-2 pb-4">
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
            className="px-6 py-3 bg-theme-blue text-white rounded-lg shadow font-semibold hover:opacity-90"
          >
            Save & Continue to Module 5
          </button>
        </div>
      </div>
    </div>
  );
}