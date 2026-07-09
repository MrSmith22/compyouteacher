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
import { outlineBodyFromStudentBuckets } from "@/lib/module4/mapStudentBucketsToOutline";
import { getParagraphPlanRow } from "@/lib/artifacts/readArtifactsClient";

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
      out += `${roman(idx)}. ${b.bucket || "Body paragraph"}\n`;
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

      // 3) If no body yet, seed from Module 4 (paragraph plans API, then legacy bucket_groups)
      if (!savedRow?.outline?.body?.length) {
        const m4Result = await getParagraphPlanRow();

        if (!m4Result.ok) {
          console.error("student_buckets fetch error:", m4Result.error);
        }

        if (Array.isArray(m4Result.data?.buckets) && m4Result.data.buckets.length) {
          const { data: tchartData } = await supabase
            .from("tchart_entries")
            .select("*")
            .eq("user_email", email);

          const body = outlineBodyFromStudentBuckets(
            m4Result.data.buckets,
            tchartData || []
          );
          if (body.length) setOutline(body);
        } else {
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
        bucket: "New paragraph plan",
        points: ["Add a supporting detail from your evidence"],
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
        "This will replace your current outline with your latest paragraph plans from Module 4. Continue?"
      );
      if (!ok) return;
    }

    setIsImportingBuckets(true);
    try {
      const m4Result = await getParagraphPlanRow();

      if (!m4Result.ok) {
        console.error("Could not load Module 4 student_buckets:", m4Result.error?.message);
      }

      let body = [];

      if (Array.isArray(m4Result.data?.buckets) && m4Result.data.buckets.length) {
        const { data: tchartData } = await supabase
          .from("tchart_entries")
          .select("*")
          .eq("user_email", email);
        body = outlineBodyFromStudentBuckets(m4Result.data.buckets, tchartData || []);
      }

      if (!body.length) {
        const { data: bucketsData, error } = await supabase
          .from("bucket_groups")
          .select("buckets, updated_at")
          .eq("user_email", email)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Could not load buckets from Module 4:", error.message);
          alert(
            "We could not load your paragraph plans from Module 4. Try again in a moment."
          );
          return;
        }

        if (!bucketsData?.buckets?.length) {
          alert(
            "No paragraph plans found in Module 4 yet. Finish planning your paragraphs there, then return here—or add cards manually."
          );
          return;
        }

        body = bucketsData.buckets.map((b) => {
          const points = (b.items || [])
            .map((i) => {
              const obs = i.observation?.trim() || "";
              const quote = i.quote?.trim() || "";
              return `${obs}${quote ? ` — "${quote}"` : ""}`.trim();
            })
            .filter(Boolean);
          return {
            bucket: b.name || "New paragraph plan",
            points: points.length ? points : [""],
          };
        });
      }

      if (!body.length) {
        alert("No paragraph plans found in Module 4 yet.");
        return;
      }

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
          "We could not save your outline. Please try again. " +
            (json?.error || res.statusText || "")
        );
        setLocked(false);
        return;
      }
    } catch (err) {
      alert(
        "We could not save your outline. Check your connection and try again."
      );
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
          {locked ? (
            <div className="rounded-lg border border-theme-green/30 bg-theme-green/5 px-4 py-3 text-sm text-theme-dark">
              Your outline is complete. You can review it here, then continue to Module 6 when
              you are ready to draft.
            </div>
          ) : null}
          {/* Intro / teaching card */}
          <div className="rounded-xl border border-theme-blue/30 bg-white p-4 space-y-3">
            <h1 className="text-3xl font-extrabold text-theme-blue">
              How will you organize your thinking into an outline?
            </h1>
            <p className="text-sm text-theme-dark/80">
              You already built a <strong>thesis</strong> and <strong>paragraph plans</strong> in
              Modules 3 and 4. Now you are arranging that work so a reader can follow your
              argument—not starting over.
            </p>
            <p className="text-sm font-medium text-theme-dark">
              Your job in this module: put your paragraph plans in order and shape them into an
              outline you can draft from.
            </p>
            <ol className="list-decimal list-inside text-sm text-theme-dark/80 space-y-1">
              <li>
                <strong>Confirm your thesis.</strong> Keep the sentence you sharpened in Module 3,
                or revise it lightly so it still matches your paragraph plans.
              </li>
              <li>
                <strong>Organize your paragraph plans.</strong> Each card below grew from a
                paragraph plan you built in Module 4. Name it, polish the supporting details, and
                put the paragraphs in an order that makes sense.
              </li>
              <li>
                <strong>Plan your conclusion.</strong> Decide how you will close the essay and
                leave the reader with something to think about.
              </li>
            </ol>
            <p className="text-xs text-theme-dark/70">
              On your desk: the outline section you are shaping right now. On the shelf:
              your saved thesis and paragraph plans—you can glance back without rebuilding
              them.
            </p>
            <p className="text-[11px] text-theme-dark/60">
              Your outline saves as you work.
            </p>
          </div>

          {/* Thesis section */}
          <div className="mb-2 bg-white rounded-xl border border-theme-green/40 p-4 space-y-3">
            <h2 className="text-lg font-semibold text-theme-green">
              1. Confirm your thesis
            </h2>
            <p className="text-xs text-theme-dark/70">
              On your desk: the thesis that will anchor this outline. You are not writing a new
              thesis—you are checking that the one you already built still fits.
            </p>

            {originalThesis && (
              <div className="text-xs bg-theme-light rounded p-2 mb-2 text-theme-dark">
                <p className="font-semibold mb-1">
                  On the shelf — thesis from <span className="italic">Module 3</span>:
                </p>
                <p className="mb-1">{originalThesis}</p>
                <p className="text-[11px] text-theme-dark/70 mt-1">
                  You can keep this wording or revise it so it still matches the paragraph plans
                  below. It should stay the clear main sentence your evidence can prove.
                </p>
              </div>
            )}

            <label className="block font-semibold text-theme-dark mb-1">
              Thesis for this outline:
            </label>
            <textarea
              className="w-full border rounded p-2 min-h-[80px]"
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              disabled={locked}
            />
          </div>

          {/* Paragraph plans / body paragraphs */}
          <div className="bg-white rounded-xl border border-theme-orange/40 p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-lg font-semibold text-theme-orange">
                  2. Organize your paragraph plans
                </h2>
                <p className="text-xs text-theme-dark/70 mt-1 max-w-xl">
                  On your desk: the body paragraphs you are arranging. Each card began as a{" "}
                  <strong>paragraph plan</strong> from Module 4. Name the main idea, polish the
                  supporting details, and drag cards to put your argument in the best order.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => importBucketsFromModule4()}
                  disabled={locked || isImportingBuckets}
                  className="text-sm text-theme-blue border border-theme-blue/40 rounded px-3 py-1.5 hover:bg-theme-blue/10 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isImportingBuckets
                    ? "Loading paragraph plans…"
                    : "↺ Load paragraph plans from Module 4"}
                </button>
                <button
                  onClick={addBucket}
                  className="bg-theme-green text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                >
                  Add paragraph plan
                </button>
              </div>
            </div>

            {outline.length === 0 && (
              <p className="text-xs text-theme-dark/70 mb-3">
                If you do not see your paragraph plans yet, finish Module 4 first, then return
                here—or use the button above to load them.
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
                      title="Remove this paragraph plan"
                    >
                      🗑️
                    </button>
                  </div>

                  {section.points.map((point, j) => (
                    <div key={j} className="flex items-center gap-2 mb-2 relative z-10">
                      <input
                        type="text"
                        className="w-full border p-2 rounded relative z-10 text-sm"
                        placeholder={`Supporting detail ${j + 1}`}
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
                    Add supporting detail
                  </button>
                </div>
              </SortableItem>
            ))}
          </div>

          {/* Conclusion */}
          <div className="mb-4 bg-white rounded-xl border border-theme-blue/40 p-4 space-y-3">
            <h2 className="text-lg font-semibold text-theme-blue">
              3. Plan your conclusion
            </h2>
            <p className="text-xs text-theme-dark/70">
              On your desk: how you will close the essay. You are not drafting yet—you are deciding
              what the ending needs to do.
            </p>
            <label className="block text-sm font-medium text-theme-dark">
              How will you remind the reader of your main point?
            </label>
            <textarea
              className="w-full border rounded p-2 mb-2 text-sm"
              placeholder="A sentence that brings your argument together—not a copy-paste of your thesis."
              value={conclusion.summary}
              onChange={(e) => setConclusion({ ...conclusion, summary: e.target.value })}
              disabled={locked}
            />
            <label className="block text-sm font-medium text-theme-dark">
              What do you want the reader to think about last?
            </label>
            <textarea
              className="w-full border rounded p-2 text-sm"
              placeholder="A final thought that feels earned by the argument you built."
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
            Finish outline and continue
          </button>

          {previewText && (
            <div className="mt-8 border-t pt-4">
              <h2 className="text-lg font-semibold mb-2 text-theme-dark">
                Outline preview
              </h2>
              <p className="text-xs text-theme-dark/70 mb-2">
                On the shelf — how your organized thinking looks on paper before you draft.
              </p>
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