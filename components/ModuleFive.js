// components/ModuleFive.js
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";

// ⬇️ DnD Kit imports
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
  const [thesis, setThesis] = useState("");
  const [outline, setOutline] = useState([]);
  const [conclusion, setConclusion] = useState({ summary: "", finalThought: "" });

  const sensors = useSensors(useSensor(PointerSensor));

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
            points: b.items.map((i) => i.observation),
          }));
          setOutline(body);
        }
      }
    };

    loadData();
  }, [session]);

  useEffect(() => {
    const saveData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const outlineData = {
        thesis,
        body: outline,
        conclusion,
      };

      await supabase.from("student_outlines").upsert({
        user_email: email,
        module: 5,
        outline: outlineData,
        updated_at: new Date().toISOString(),
      });
    };

    saveData();
  }, [thesis, outline, conclusion, session]);

  const updatePoint = (i, j, value) => {
    const updated = [...outline];
    updated[i].points[j] = value;
    setOutline(updated);
  };

  const updateBucketName = (i, name) => {
    const updated = [...outline];
    updated[i].bucket = name;
    setOutline(updated);
  };

  const removePoint = (i, j) => {
    const updated = [...outline];
    updated[i].points.splice(j, 1);
    setOutline(updated);
  };

  const deleteBucket = (i) => {
    const updated = [...outline];
    updated.splice(i, 1);
    setOutline(updated);
  };

  const addBucket = () => {
    setOutline([...outline, { bucket: "New Bucket", points: [""] }]);
  };

  const addPoint = (i) => {
    const updated = [...outline];
    updated[i].points.push("");
    setOutline(updated);
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
          <h1 className="text-2xl font-bold mb-4">🧩 Build Your Outline</h1>

          <div className="mb-6">
            <label className="block font-semibold mb-2">Thesis Statement</label>
            <textarea
              className="w-full border rounded p-2"
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
            />
          </div>

          <button
            onClick={addBucket}
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
                  />
                  <button
                    onClick={() => deleteBucket(i)}
                    className="text-red-600 font-bold"
                    title="Delete Bucket"
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
                    />
                    <button
                      onClick={() => removePoint(i, j)}
                      className="text-red-500"
                      title="Remove point"
                    >
                      ❌
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addPoint(i)}
                  className="text-sm text-blue-600 mt-2"
                >
                  ➕ Add Point
                </button>
              </div>
            </SortableItem>
          ))}

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">📝 Conclusion</h2>
            <textarea
              className="w-full border rounded p-2 mb-2"
              placeholder="Restate thesis or summarize key ideas..."
              value={conclusion.summary}
              onChange={(e) =>
                setConclusion({ ...conclusion, summary: e.target.value })
              }
            />
            <textarea
              className="w-full border rounded p-2"
              placeholder="Final thought or call to action..."
              value={conclusion.finalThought}
              onChange={(e) =>
                setConclusion({ ...conclusion, finalThought: e.target.value })
              }
            />
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
} // <-- ✅ THIS is the missing closing brace that caused your error

