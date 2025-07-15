"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

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

export default function ModuleFive() {
  const { data: session } = useSession();
  const router = useRouter();

  const [thesis, setThesis] = useState("");
  const [outline, setOutline] = useState([]);
  const [conclusion, setConclusion] = useState({ summary: "", finalThought: "" });
  const [previewText, setPreviewText] = useState("");
  const [locked, setLocked] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const buildOutlineText = () => {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    let out = `${roman[0]}. Introduction\n`;
    if (thesis.trim()) out += `   THESIS: ${thesis.trim()}\n\n`;
    outline.forEach((b, i) => {
      const idx = i + 1;
      out += `${roman[idx] || `(${idx})`}. ${b.bucket || "Main Idea"}\n`;
      b.points.forEach((pt, j) => {
        if (!pt.trim()) return;
        const letter = String.fromCharCode(65 + j);
        out += `   ${letter}. ${pt.trim()}\n`;
      });
      out += "\n";
    });
    const conclNum = roman[outline.length + 1] || `(${outline.length + 1})`;
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

      const { data } = await supabase
        .from("student_outlines")
        .select("outline, finalized")
        .eq("user_email", email)
        .eq("module", 5)
        .single();

      if (data?.outline) {
        setThesis(data.outline.thesis || "");
        setOutline(data.outline.body || []);
        setConclusion(data.outline.conclusion || { summary: "", finalThought: "" });
        setLocked(!!data.finalized);
      }

      if (!data?.outline?.thesis) {
        const { data: mod3 } = await supabase
          .from("module3_responses")
          .select("thesis")
          .eq("user_email", email)
          .order("created_at", { ascending: false })
          .limit(1);
        if (mod3?.length && mod3[0]?.thesis) setThesis(mod3[0].thesis);
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
            points: b.items.map((i) => i.observation),
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

      const hasContent =
        thesis.trim() ||
        outline.some((b) => b.bucket.trim() || b.points.some((p) => p.trim())) ||
        conclusion.summary.trim() ||
        conclusion.finalThought.trim();

      if (!hasContent) {
        console.log("Skipping save — no content yet.");
        return;
      }

      const outlineData = { thesis, body: outline, conclusion };
      const { error } = await supabase.from("student_outlines").upsert({
        user_email: email,
        module: 5,
        outline: outlineData,
        updated_at: new Date().toISOString(),
        finalized: locked,
      });
      if (error) console.error("Auto-save failed:", error);
    }, 800);

    return () => clearTimeout(id);
  }, [thesis, outline, conclusion, locked, session]);

  useEffect(() => {
    setPreviewText(buildOutlineText());
  }, [thesis, outline, conclusion]);

  const finalizeOutline = async () => {
    const email = session?.user?.email;
    if (!email) return;
    setLocked(true);
    await supabase.from("student_outlines").upsert({
      user_email: email,
      module: 5,
      outline: { thesis, body: outline, conclusion },
      finalized: true,
      updated_at: new Date().toISOString(),
    });
    router.push("/modules/5/success");
  };

  const unlockOutline = async () => {
    const email = session?.user?.email;
    if (!email) return;
    setLocked(false);
    await supabase.from("student_outlines").upsert({
      user_email: email,
      module: 5,
      outline: { thesis, body: outline, conclusion },
      finalized: false,
      updated_at: new Date().toISOString(),
    });
  };

  const updatePoint = (bucketIndex, pointIndex, value) => {
    setOutline((prev) => {
      const copy = [...prev];
      copy[bucketIndex].points[pointIndex] = value;
      return copy;
    });
  };

  const updateBucketName = (bucketIndex, name) => {
    setOutline((prev) => {
      const copy = [...prev];
      copy[bucketIndex].bucket = name;
      return copy;
    });
  };

  const removePoint = (bucketIndex, pointIndex) => {
    setOutline((prev) =>
      prev.map((b, i) =>
        i === bucketIndex
          ? { ...b, points: b.points.filter((_, j) => j !== pointIndex) }
          : b
      )
    );
  };

  const deleteBucket = (bucketIndex) => {
    setOutline((prev) => prev.filter((_, i) => i !== bucketIndex));
  };

  const addBucket = () => {
    setOutline((prev) => [...prev, { bucket: "New Bucket", points: [""] }]);
  };

  const addPoint = (bucketIndex) => {
    setOutline((prev) =>
      prev.map((b, i) =>
        i === bucketIndex ? { ...b, points: [...b.points, ""] } : b
      )
    );
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = parseInt(active.id);
    const newIndex = parseInt(over.id);
    setOutline((items) => arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={outline.map((_, i) => i.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-theme-blue mb-4">🧩 Build Your Outline</h1>

          <label className="block font-semibold mb-2">Thesis Statement</label>
          <textarea
            className="w-full border rounded p-2 mb-6"
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            disabled={locked}
          />

          <button
            onClick={addBucket}
            disabled={locked}
            className="mb-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            ➕ Add New Bucket
          </button>

          {outline.map((section, i) => (
            <SortableItem key={i.toString()} id={i.toString()}>
              <div className="mb-4 border rounded p-4 bg-white shadow">
                <div className="flex justify-between items-center mb-2">
                  <input
                    type="text"
                    className="font-bold text-blue-700 text-lg border-b flex-grow mr-2"
                    value={section.bucket}
                    onChange={(e) => updateBucketName(i, e.target.value)}
                    disabled={locked}
                  />
                  <button
                    onClick={() => deleteBucket(i)}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={locked}
                    className="text-red-600 font-bold"
                  >
                    🗑️
                  </button>
                </div>

                {section.points.map((point, j) => (
                  <div key={j} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      placeholder={`Supporting Detail ${j + 1}`}
                      value={point}
                      onChange={(e) => updatePoint(i, j, e.target.value)}
                      disabled={locked}
                    />
                    <button
                      onClick={() => removePoint(i, j)}
                      onPointerDown={(e) => e.stopPropagation()}
                      disabled={locked}
                      className="text-red-500"
                    >
                      ❌
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addPoint(i)}
                  onPointerDown={(e) => e.stopPropagation()}
                  disabled={locked}
                  className="text-sm text-blue-600 mt-2"
                >
                  ➕ Add Point
                </button>
              </div>
            </SortableItem>
          ))}

          <div className="mt-6 flex gap-4">
            <button
              onClick={finalizeOutline}
              disabled={locked}
              className={`bg-theme-orange text-white px-4 py-2 rounded shadow ${
                locked ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              ✅ Finalize & Continue
            </button>

            <button
              onClick={unlockOutline}
              className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600"
            >
              🔓 Unlock & Revise
            </button>
          </div>

          {previewText && (
            <div className="mt-10 border-t pt-6">
              <h2 className="text-lg font-semibold mb-2">🖨️ Outline Preview</h2>
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
