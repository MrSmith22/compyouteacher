"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

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
  ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] || `(${n + 1})`;

export default function ModuleFive() {
  const { data: session } = useSession();
  const router = useRouter();

  const [thesis, setThesis] = useState("");
  const [outline, setOutline] = useState([]);
  const [conclusion, setConclusion] = useState({ summary: "", finalThought: "" });
  const [previewText, setPreviewText] = useState("");
  const [locked, setLocked] = useState(false);

  const readonly = locked ? "pointer-events-none opacity-60" : "";

  const sensors = useSensors(useSensor(PointerSensor));

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
    if (conclusion.finalThought.trim()) out += `   • ${conclusion.finalThought.trim()}\n`;

    return out;
  };

  useEffect(() => {
    const loadData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const { data, error } = await supabase
        .from("student_outlines")
        .select("outline")
        .eq("user_email", email)
        .eq("module", 5)
        .single();

      if (data?.outline) {
        setThesis(data.outline.thesis || "");
        setOutline(data.outline.body || []);
        setConclusion(data.outline.conclusion || { summary: "", finalThought: "" });
      }

      if (!data?.outline?.thesis) {
        const { data: mod3 } = await supabase
          .from("module3_responses")
          .select("thesis")
          .eq("user_email", email)
          .order("created_at", { ascending: false })
          .limit(1);

        if (mod3?.length && mod3[0]?.thesis) {
          setThesis(mod3[0].thesis);
        }
      }

      if (!data?.outline?.body?.length) {
        const { data: bucketsData } = await supabase
          .from("bucket_groups")
          .select("buckets")
          .eq("user_email", email)
          .single();

        if (bucketsData?.buckets?.length) {
          const body = bucketsData.buckets.map((b) => ({
            bucket: b.name,
            points: b.items.map((i) => {
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
        const { error } = await supabase
          .from("student_outlines")
          .upsert({
            user_email: email,
            module: 5,
            outline: outlineData,
            updated_at: new Date().toISOString(),
          });

        if (error) console.error("Auto-save failed:", error);
      } catch (err) {
        console.error("Auto-save failed:", err);
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
    setOutline((prev) => [...prev, { bucket: "New Bucket", points: [""] }]);
  };

  const addPoint = (bucketIndex) => {
    if (locked) return;
    setOutline((prev) =>
      prev.map((b, i) =>
        i === bucketIndex ? { ...b, points: [...b.points, ""] } : b
      )
    );
  };

  useEffect(() => {
    setPreviewText(buildOutlineText());
  }, [thesis, outline, conclusion, locked]);

  const finalizeOutline = async () => {
    setLocked(true);

    const email = session?.user?.email;
    if (!email) return;

    await supabase.from("student_outlines").upsert({
      user_email: email,
      module: 5,
      outline: {
        thesis,
        body: outline,
        conclusion,
      },
      finalized: true,
      updated_at: new Date().toISOString(),
    });

    router.push("/modules/5/success");
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = parseInt(active.id);
    const newIndex = parseInt(over.id);
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
          <h1 className="text-3xl font-extrabold text-theme-blue mb-4">
            🧩 Build Your Outline
          </h1>

          <div className="mb-6">
            <label className="block font-semibold text-theme-dark mb-2">
              Thesis Statement
            </label>
            <textarea
              className="w-full border rounded p-2"
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              disabled={locked}
            />
          </div>

          <button
            onClick={addBucket}
            className="mb-4 bg-theme-green text-white px-4 py-2 rounded hover:bg-green-700"
          >
            ➕ Add New Bucket
          </button>

          {outline.map((section, i) => (
            <SortableItem key={i.toString()} id={i.toString()}>
              <div className="mb-4 border rounded p-4 bg-white shadow relative z-10">
                <div className="flex justify-between items-center mb-2">
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
                    className="text-theme-red font-bold"
                    title="Delete Bucket"
                  >
                    🗑️
                  </button>
                </div>

                {section.points.map((point, j) => (
                  <div key={j} className="flex items-center gap-2 mb-2 relative z-10">
                    <input
                      type="text"
                      className="w-full border p-2 rounded relative z-10"
                      placeholder={`Supporting Detail ${j + 1}`}
                      value={point || ""}
                      onChange={(e) => updatePoint(i, j, e.target.value)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      draggable={false}
                    />
                    <button
                      onClick={() => removePoint(i, j)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="text-theme-red"
                      title="Remove point"
                    >
                      ❌
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addPoint(i)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-sm text-theme-blue mt-2 hover:underline relative z-10"
                >
                  ➕ Add Point
                </button>
              </div>
            </SortableItem>
          ))}

          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-2 text-theme-dark">
              📝 Conclusion
            </h2>
            <textarea
              className="w-full border rounded p-2 mb-2"
              placeholder="Restate thesis or summarize key ideas..."
              value={conclusion.summary}
              onChange={(e) =>
                setConclusion({ ...conclusion, summary: e.target.value })
              }
              disabled={locked}
            />
            <textarea
              className="w-full border rounded p-2"
              placeholder="Final thought or call to action..."
              value={conclusion.finalThought}
              onChange={(e) =>
                setConclusion({ ...conclusion, finalThought: e.target.value })
              }
              disabled={locked}
            />
          </div>

          <button
            onClick={finalizeOutline}
            className={`mt-6 bg-theme-orange text-white px-4 py-2 rounded shadow hover:opacity-90 ${
              locked ? "opacity-50 pointer-events-none" : ""
            }`}
            disabled={locked}
          >
            ✅ Finalize Outline & Continue
          </button>

          {previewText && (
            <div className="mt-10 border-t pt-6">
              <h2 className="text-lg font-semibold mb-2 text-theme-dark">
                🖨️ Outline Preview
              </h2>
              <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                {previewText}
              </pre>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}