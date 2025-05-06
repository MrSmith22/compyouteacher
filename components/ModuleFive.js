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
import { useRouter } from "next/navigation";


/* ───────── helpers  (inserted after imports) ───────── */

// Convert 0 → I, 1 → II, … 9 → X   (fallback `${n+1}` if > 9)
const roman = (n) =>
  ["I","II","III","IV","V","VI","VII","VIII","IX","X"][n] || `(${n + 1})`;

// We’ll set this right after we declare `locked`
let readonly = "";   // becomes "pointer-events-none opacity-60" when locked
/* ───────────────────────────────────────────────────── */


export default function ModuleFive() {
  const { data: session } = useSession();
  const router = useRouter(); 
  const [thesis, setThesis] = useState("");
  const [outline, setOutline] = useState([]);
  const [conclusion, setConclusion] = useState({ summary: "", finalThought: "" });
  const [previewText, setPreviewText] = useState("");   // formatted outline
  const [locked, setLocked] = useState(false);          // true after finalize
  readonly = locked ? "pointer-events-none opacity-60" : "";


  // ── helper: build nicely‑formatted outline text ─────────────
const buildOutlineText = () => {
  const roman = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];

  let out = "";

  /* I. Introduction + thesis */
  out += `${roman[0]}. Introduction\n`;
  if (thesis.trim()) {
    out += `   THESIS: ${thesis.trim()}\n`;
  }
  out += "\n";

  /* Body buckets start at roman[1] (II.) */
  outline.forEach((b, i) => {
    const idx = i + 1;               // skip Introduction slot
    out += `${roman[idx] || `(${idx})`}. ${b.bucket || "Main Idea"}\n`;

    b.points.forEach((pt, j) => {
      if (!pt.trim()) return;
      const letter = String.fromCharCode(65 + j);   // A, B, C…
      out += `   ${letter}. ${pt.trim()}\n`;
    });
    out += "\n";
  });

  /* Conclusion gets the next numeral */
  const conclNum = roman[outline.length + 1] || `(${outline.length + 1})`;
  out += `${conclNum}. CONCLUSION — Restates Thesis\n`;
  if (thesis.trim())   out += `   THESIS: ${thesis.trim()}\n`;
  if (conclusion.summary.trim())      out += `   • ${conclusion.summary.trim()}\n`;
  if (conclusion.finalThought.trim()) out += `   • ${conclusion.finalThought.trim()}\n`;

  return out;
};


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

  // ─────────────────────────── debounced auto‑save (800 ms)
useEffect(() => {
  // If nothing to save yet (e.g., on initial load), skip
  if (!session?.user?.email) return;

  // Small debounce: wait 800 ms after the last keystroke
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

  if (error) console.error("Auto‑save failed:", error);
} catch (err) {
  console.error("Auto‑save failed:", err);
}
  }, 800);

  // 🧹 clear the timer if the user types again before 800 ms
  return () => clearTimeout(id);
}, [thesis, outline, conclusion, session]);
// ─────────────────────────── end debounced auto‑save


/* ── mutator helpers ───────────────────────────────────────── */

const updatePoint = (bucketIndex, pointIndex, value) => {
  if (locked) return;                             // ⛔ no edits after finalise
  setOutline(prev => {
    const copy = [...prev];
    copy[bucketIndex].points[pointIndex] = value;
    return copy;
  });
};

const updateBucketName = (bucketIndex, name) => {
  if (locked) return;
  setOutline(prev => {
    const copy = [...prev];
    copy[bucketIndex].bucket = name;
    return copy;
  });
};

// ❌ remove a supporting‑detail field
const removePoint = (bucketIndex, pointIndex) => {
  if (locked) return;
  setOutline(prev =>
    prev.map((b, i) =>
      i === bucketIndex
        ? { ...b, points: b.points.filter((_, j) => j !== pointIndex) }
        : b
    )
  );
};

// 🗑 delete an entire bucket
const deleteBucket = (bucketIndex) => {
  if (locked) return;
  setOutline(prev => prev.filter((_, i) => i !== bucketIndex));
};

// ➕ add a new empty bucket
const addBucket = () => {
  if (locked) return;
  setOutline(prev => [...prev, { bucket: "New Bucket", points: [""] }]);
};

// ➕ add a blank supporting‑detail field
const addPoint = (bucketIndex) => {
  if (locked) return;
  setOutline(prev =>
    prev.map((b, i) =>
      i === bucketIndex ? { ...b, points: [...b.points, ""] } : b
    )
  );
};
/* ─────────────────────────────────────────────────────────── */

// 🔄 rebuild preview whenever outline changes
useEffect(() => {
  setPreviewText(buildOutlineText());
}, [thesis, outline, conclusion]);
/* ── FINALIZE: lock UI & save flag ───────────────────────── */
const finalizeOutline = async () => {
  // 1️⃣  freeze editing for this session
  setLocked(true);

  // 2️⃣  persist as “finalized” in Supabase
  const email = session?.user?.email;
  if (!email) return;

  await supabase
    .from("student_outlines")
    .upsert({
      user_email: email,
      module: 5,
      outline: {
        thesis,
        body: outline,
        conclusion,
      },
      finalized: true,                     // 👈 new flag
      updated_at: new Date().toISOString(),
    });
router.push("/modules/5/success");
};
/* ────────────────────────────────────────────────────────── */


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
        <div className={`p-6 max-w-4xl mx-auto ${readonly}`}>
          <h1 className="text-2xl font-bold mb-4">🧩 Build Your Outline</h1>

       {/* ── thesis ─────────────────────────────── */}
<div className="mb-6">
  <label className="block font-semibold mb-2">Thesis Statement</label>
  <textarea
    className="w-full border rounded p-2"
    value={thesis}
    onChange={(e) => setThesis(e.target.value)}
    disabled={locked}
  />
  {/* the textarea becomes read‑only after “Finalize” */}
</div>



          {/* ── add bucket ─────────────────────────── */}
          <button
            onClick={addBucket}
            className="mb-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            ➕ Add New Bucket
          </button>

          {/* ── body buckets ───────────────────────── */}
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

                  {/* 🗑 delete bucket */}
                  <button
                    onClick={() => deleteBucket(i)}
                    onPointerDown={(e) => e.stopPropagation()} // stop drag
                    className="text-red-600 font-bold"
                    title="Delete Bucket"
                  >
                    🗑️
                  </button>
                </div>

                {/* supporting details */}
                {section.points.map((point, j) => (
                  <div key={j} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      placeholder={`Supporting Detail ${j + 1}`}
                      value={point}
                      onChange={(e) => updatePoint(i, j, e.target.value)}
                    />
                    {/* ❌ remove point */}
                    <button
                      onClick={() => removePoint(i, j)}
                      onPointerDown={(e) => e.stopPropagation()} // stop drag
                      className="text-red-500"
                      title="Remove point"
                    >
                      ❌
                    </button>
                  </div>
                ))}

                {/* ➕ add point */}
                <button
                  onClick={() => addPoint(i)}
                  onPointerDown={(e) => e.stopPropagation()} // stop drag
                  className="text-sm text-blue-600 mt-2"
                >
                  ➕ Add Point
                </button>
              </div>
            </SortableItem>
          ))}
{/* ── conclusion ─────────────────────────── */}
<div className="mb-10">
  <h2 className="text-lg font-semibold mb-2">📝 Conclusion</h2>

  {/* summary */}
  <textarea
    className="w-full border rounded p-2 mb-2"
    placeholder="Restate thesis or summarize key ideas..."
    value={conclusion.summary}
    onChange={(e) =>
      setConclusion({ ...conclusion, summary: e.target.value })
    }
    disabled={locked}             /* read‑only after Finalize */
  />

  {/* final thought */}
  <textarea
    className="w-full border rounded p-2"
    placeholder="Final thought or call to action..."
    value={conclusion.finalThought}
    onChange={(e) =>
      setConclusion({ ...conclusion, finalThought: e.target.value })
    }
    disabled={locked}             /* read‑only after Finalize */
  />
</div>

{/* ── finalize button ─────────────────────── */}
<button
  onClick={finalizeOutline}
  className={`mt-6 bg-purple-700 text-white px-4 py-2 rounded ${
    locked ? "opacity-50 pointer-events-none" : ""
  }`}
  disabled={locked}
>
  ✅ Finalize Outline & Continue
</button>

{/* ── live preview ────────────────────────── */}
{previewText && (
  <div className="mt-10 border-t pt-6">
    <h2 className="text-lg font-semibold mb-2">🖨️ Outline Preview</h2>
    <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded border">
      {previewText}
    </pre>
  </div>
)}
</div>        {/* closes the p‑6 container */}
</SortableContext>
</DndContext>
);
}
