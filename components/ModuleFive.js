// components/ModuleFive.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { logActivity } from "../lib/logActivity";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";

const roman = (n) =>
  ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] ||
  `(${n + 1})`;

export default function ModuleFive() {
  const { data: session } = useSession();
  const router = useRouter();

  const [thesis, setThesis] = useState("");
  const [originalThesis, setOriginalThesis] = useState("");
  const [outline, setOutline] = useState([]);
  const [conclusion, setConclusion] = useState({
    summary: "",
    finalThought: "",
  });
  const [previewText, setPreviewText] = useState("");
  const [locked, setLocked] = useState(false);
  const [isImportingBuckets, setIsImportingBuckets] = useState(false);

  const readonly = locked ? "pointer-events-none opacity-60" : "";

  const sensors = useSensors(useSensor(PointerSensor));

  // prevent duplicate module_started logs per visit
  const hasLoggedStartRef = useRef(false);

  const buildOutlineText = () => {
    let out = `${roman(0)}. Introduction\n`;
    if (thesis.trim()) {
      out += `   THESIS: ${thesis.trim()}\n`;
    }
    out += "\n";

    outline.forEach((b, i) => {
      const idx = i + 1;
      out += `${roman(idx)}. ${b.bucket || "Main Idea"}\n`;
      b.points.forEach((pt, j) => {
        if (!pt.trim()) return;
        const letter = String.fromCharCode(65 + j);
        out += `   ${letter}. ${pt.trim()}\n`;
      });
      out += "\n";
    });

    const conclNum = roman(outline.length + 1);
    out += `${conclNum}. CONCLUSION — Restates Thesis\n`;
    if (thesis.trim()) out += `   THESIS: ${thesis.trim()}\n`;
    if (conclusion.summary.trim()) out += `   • ${conclusion.summary.trim()}\n`;
    if (conclusion.finalThought.trim())
      out += `   • ${conclusion.finalThought.trim()}\n`;

    return out;
  };

  // helper for metrics used in logs
  const getOutlineMetrics = () => {
    const bucketCount = outline.length;
    const totalPoints = outline.reduce(
      (sum, b) => sum + (Array.isArray(b.points) ? b.points.length : 0),
      0
    );
    return {
      bucketCount,
      totalPoints,
      thesisLength: thesis.trim().length,
      conclusionLength:
        conclusion.summary.trim().length +
        conclusion.finalThought.trim().length,
    };
  };

  // load existing outline, module 3 thesis and buckets
  useEffect(() => {
    const loadData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      // log module_started once
      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        logActivity(email, "module_started", { module: 5 });
      }

      // 1) Load existing outline via API (NO email param)
      let savedRow = null;
      try {
        const res = await fetch("/api/outlines?module=5");
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.ok) {
          savedRow = json.data ?? null;
        }
      } catch {
        // Network or parse error; skip outline load, do not crash
      }

      if (savedRow?.outline) {
        setThesis(savedRow.outline.thesis || "");
        setOutline(savedRow.outline.body || []);
        setConclusion(
          savedRow.outline.conclusion || { summary: "", finalThought: "" }
        );
        if (savedRow.finalized) {
          setLocked(true);
        }
      }

      // 2) Always grab the latest thesis from Module 3 as a reminder
      const { data: mod3 } = await supabase
        .from("module3_responses")
        .select("thesis")
        .eq("user_email", email)
        .order("created_at", { ascending: false })
        .limit(1);

      if (mod3?.length && mod3[0]?.thesis) {
        const latestThesis = mod3[0].thesis;
        setOriginalThesis(latestThesis);

        // If no thesis saved in outline yet, prefill from Module 3
        if (!savedRow?.outline?.thesis) {
          setThesis(latestThesis);
        }
      }

      // 3) If no body yet, seed from Module 4 buckets
      if (!savedRow?.outline?.body?.length) {
        const { data: bucketsRows, error: bucketsErr } = await supabase
          .from("bucket_groups")
          .select("buckets, updated_at")
          .eq("user_email", email)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (bucketsErr) {
          console.error("Bucket groups fetch error:", {
            message: bucketsErr.message,
            code: bucketsErr.code,
            details: bucketsErr.details,
            hint: bucketsErr.hint,
          });
        }

        const bucketsData = bucketsRows?.[0] ?? null;

        if (bucketsData?.buckets?.length) {
          const body = bucketsData.buckets.map((b) => ({
            bucket: b.name,
            points: (b.items || []).map((i) => {
              const obs = i.observation?.trim() || "";
              const quote = i.quote?.trim() || "";
              return `${obs}${quote ? ` — “${quote}”` : ""}`;
            }),
          }));
          setOutline(body);
        }
      }
    };

    loadData();
  }, [session]);

  // auto save on changes
  useEffect(() => {
    if (!session?.user?.email) return;

    const id = setTimeout(async () => {
      const email = session.user.email;

      const outlineData = {
        thesis,
        body: outline,
        conclusion,
      };

      try {
        const res = await fetch("/api/outlines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ module: 5, outline: outlineData }),
        });

        const json = await res.json().catch(() => ({}));

        if (res.ok && json?.ok) {
          const metrics = getOutlineMetrics();
          logActivity(email, "outline_autosaved", {
            module: 5,
            ...metrics,
          });
        } else {
          console.warn("Outline autosave failed:", json);
        }
      } catch {
        // Network error; do not crash UI
      }
    }, 800);

    return () => clearTimeout(id);
  }, [thesis, outline, conclusion, session]);

  const updatePoint = (bucketIndex, pointIndex, value) => {
    if (locked) return;
    setOutline((prev) =>
      prev.map((b, bi) => {
        if (bi !== bucketIndex) return b;
        const points = [...b.points];
        points[pointIndex] = value;
        return { ...b, points };
      })
    );
  };

  const updateBucketName = (bucketIndex, name) => {
    if (locked) return;
    setOutline((prev) =>
      prev.map((b, bi) => (bi === bucketIndex ? { ...b, bucket: name } : b))
    );
  };

  const removePoint = (bucketIndex, pointIndex) => {
    if (locked) return;
    setOutline((prev) =>
      prev.map((b, i) =>
        i === bucketIndex
          ? { ...b, points: b.points.filter((_, j) => j !== pointIndex) }
          : b
      )
    );
  };

  const deleteBucket = (bucketIndex) => {
    if (locked) return;
    setOutline((prev) => prev.filter((_, i) => i !== bucketIndex));
  };

  const addBucket = () => {
    if (locked) return;
    setOutline((prev) => [
      ...prev,
      {
        bucket: "New paragraph idea",
        points: ["Add a supporting detail (observation + evidence)"],
      },
    ]);
  };

  const addPoint = (bucketIndex) => {
    if (locked) return;
    setOutline((prev) =>
      prev.map((b, i) =>
        i === bucketIndex ? { ...b, points: [...b.points, ""] } : b
      )
    );
  };

  const importBucketsFromModule4 = async ({ force = false } = {}) => {
    const email = session?.user?.email;
    if (locked || !email) return;

    if (outline.length > 0 && !force) {
      const ok = window.confirm(
        "This will replace your current paragraph cards with the latest buckets from Module 4. Continue?"
      );
      if (!ok) return;
    }

    setIsImportingBuckets(true);
    try {
      const { data: bucketsData, error } = await supabase
        .from("bucket_groups")
        .select("buckets, updated_at")
        .eq("user_email", email)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Could not load buckets from Module 4:", error.message);
        alert("Could not load buckets from Module 4.");
        return;
      }

      if (!bucketsData?.buckets?.length) {
        alert("No buckets found in Module 4 yet.");
        return;
      }

      const body = bucketsData.buckets.map((b) => {
        const points = (b.items || [])
          .map((i) => {
            const obs = i.observation?.trim() || "";
            const quote = i.quote?.trim() || "";
            return `${obs}${quote ? ` — "${quote}"` : ""}`.trim();
          })
          .filter(Boolean);
        return {
          bucket: b.name || "New paragraph idea",
          points: points.length ? points : [""],
        };
      });

      setOutline(body);
      logActivity(email, "outline_reimported_from_module4", {
        module: 5,
        bucketCount: body.length,
      });
    } finally {
      setIsImportingBuckets(false);
    }
  };

  useEffect(() => {
    setPreviewText(buildOutlineText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thesis, outline, conclusion, locked]);

  const finalizeOutline = async () => {
    setLocked(true);

    const email = session?.user?.email;
    if (!email) {
      setLocked(false);
      return;
    }

    const outlinePayload = {
      thesis,
      body: outline,
      conclusion,
    };

    try {
      const res = await fetch("/api/outlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: 5,
          outline: outlinePayload,
          finalized: true,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        alert(
          "Error saving outline: " +
            (json?.error || res.statusText || "Request failed")
        );
        setLocked(false);
        return;
      }
    } catch (err) {
      alert("Error saving outline: " + (err?.message || "Network error"));
      setLocked(false);
      return;
    }

    const metrics = getOutlineMetrics();
    await logActivity(email, "module_completed", {
      module: 5,
      finalized: true,
      ...metrics,
    });

    router.push("/modules/5/success");
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = parseInt(active.id, 10);
    const newIndex = parseInt(over.id, 10);
    setOutline((items) => arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={outline.map((_, i) => i.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`p-6 max-w-4xl mx-auto bg-theme-light rounded shadow space-y-6 ${readonly}`}
        >
          {/* Intro / teaching card */}
          <div className="rounded-xl border border-theme-blue/30 bg-white p-4 space-y-3">
            <h1 className="text-3xl font-extrabold text-theme-blue">
              🧩 Build Your Outline
            </h1>
            <p className="text-sm text-theme-dark/80">
              In this step you turn your thinking from <strong>Modules 3 and 4</strong>{" "}
              into a classic essay outline.
            </p>
            <ol className="list-decimal list-inside text-sm text-theme-dark/80 space-y-1">
              <li>
                <strong>Start with your thesis.</strong> This is your big claim
                comparing the speech and the letter.
              </li>
              <li>
                <strong>Each bucket becomes a body paragraph.</strong> Rename each
                bucket so it sounds like a paragraph idea that supports your thesis.
              </li>
              <li>
                <strong>Each point is a smaller “bubble.”</strong> Use your grouped
                observations and quotes from the buckets as A, B, C details inside each
                paragraph.
              </li>
            </ol>
            <p className="text-xs text-theme-dark/70">
              You can drag buckets up or down to change the order of your body
              paragraphs.
            </p>
          </div>

          {/* Thesis section */}
          <div className="mb-2 bg-white rounded-xl border border-theme-green/40 p-4 space-y-3">
            <h2 className="text-lg font-semibold text-theme-green">
              1. Thesis Check-in
            </h2>

            {originalThesis && (
              <div className="text-xs bg-theme-light rounded p-2 mb-2 text-theme-dark">
                <p className="font-semibold mb-1">
                  Thesis you wrote in <span className="italic">Module 3</span>:
                </p>
                <p className="mb-1">{originalThesis}</p>
                <p className="text-[11px] text-theme-dark/70 mt-1">
                  You can keep this thesis, tweak the wording, or revise it to better
                  match the paragraph ideas you are planning below. Just make sure it
                  still compares the speech and letter and mentions audience, purpose,
                  and or appeals (ethos, pathos, logos).
                </p>
              </div>
            )}

            <label className="block font-semibold text-theme-dark mb-1">
              Your thesis for this essay:
            </label>
            <textarea
              className="w-full border rounded p-2 min-h-[80px]"
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              disabled={locked}
            />
          </div>

          {/* Buckets / body paragraphs */}
          <div className="bg-white rounded-xl border border-theme-orange/40 p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-lg font-semibold text-theme-orange">
                  2. Turn Buckets into Body Paragraphs
                </h2>
                <p className="text-xs text-theme-dark/70 mt-1 max-w-xl">
                  Each card below started as a <strong>bucket in Module 4</strong>. Rename the
                  bucket to sound like a paragraph idea, then polish the supporting points
                  underneath.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => importBucketsFromModule4()}
                  disabled={locked || isImportingBuckets}
                  className="text-sm text-theme-blue border border-theme-blue/40 rounded px-3 py-1.5 hover:bg-theme-blue/10 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isImportingBuckets ? "Importing…" : "↺ Re import from Module 4"}
                </button>
                <button
                  onClick={addBucket}
                  className="bg-theme-green text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                >
                  ➕ Add New Paragraph Idea
                </button>
              </div>
            </div>

            {outline.length === 0 && (
              <p className="text-xs text-theme-dark/70 mb-3">
                If you do not see any buckets yet, go back to Module 4 to group your ideas,
                then return here.
              </p>
            )}

            {outline.map((section, i) => (
              <SortableItem key={i.toString()} id={i.toString()}>
                <div className="mb-4 border rounded p-4 bg-white shadow relative z-10">
                  <div className="flex justify-between items-center mb-1">
                    <input
                      type="text"
                      className="font-bold text-theme-blue text-lg border-b flex-grow mr-2 relative z-10"
                      value={section.bucket}
                      onChange={(e) => updateBucketName(i, e.target.value)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      draggable={false}
                    />
                    <button
                      onClick={() => deleteBucket(i)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="text-theme-red font-bold text-sm"
                      title="Delete this paragraph idea"
                    >
                      🗑️
                    </button>
                  </div>

                  {section.points.map((point, j) => (
                    <div key={j} className="flex items-center gap-2 mb-2 relative z-10">
                      <input
                        type="text"
                        className="w-full border p-2 rounded relative z-10 text-sm"
                        placeholder={`Supporting detail ${j + 1} (observation + evidence)`}
                        value={point || ""}
                        onChange={(e) => updatePoint(i, j, e.target.value)}
                        onPointerDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        draggable={false}
                      />
                      <button
                        onClick={() => removePoint(i, j)}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="text-theme-red text-sm"
                        title="Remove point"
                      >
                        ❌
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addPoint(i)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="text-xs text-theme-blue mt-1 hover:underline relative z-10"
                  >
                    ➕ Add another supporting detail
                  </button>
                </div>
              </SortableItem>
            ))}
          </div>

          {/* Conclusion */}
          <div className="mb-4 bg-white rounded-xl border border-theme-blue/40 p-4">
            <h2 className="text-lg font-semibold mb-2 text-theme-blue">
              3. Plan Your Conclusion
            </h2>
            <textarea
              className="w-full border rounded p-2 mb-2 text-sm"
              placeholder="Restate thesis or summarize your key comparison points..."
              value={conclusion.summary}
              onChange={(e) => setConclusion({ ...conclusion, summary: e.target.value })}
              disabled={locked}
            />
            <textarea
              className="w-full border rounded p-2 text-sm"
              placeholder="Final thought or call to action for the reader..."
              value={conclusion.finalThought}
              onChange={(e) =>
                setConclusion({
                  ...conclusion,
                  finalThought: e.target.value,
                })
              }
              disabled={locked}
            />
          </div>

          {/* Finalize + preview */}
          <button
            onClick={finalizeOutline}
            className={`mt-2 bg-theme-orange text-white px-4 py-2 rounded shadow hover:opacity-90 ${
              locked ? "opacity-50 pointer-events-none" : ""
            }`}
            disabled={locked}
          >
            ✅ Finalize Outline & Continue
          </button>

          {previewText && (
            <div className="mt-8 border-t pt-4">
              <h2 className="text-lg font-semibold mb-2 text-theme-dark">
                🖨️ Outline Preview (What your outline looks like on paper)
              </h2>
              <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded border text-sm">
                {previewText}
              </pre>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}