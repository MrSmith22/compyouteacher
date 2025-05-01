// components/ModuleFive.js
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";

export default function ModuleFive() {
  const { data: session } = useSession();
  const [thesis, setThesis] = useState("");
  const [outline, setOutline] = useState([]);
  const [conclusion, setConclusion] = useState({ summary: "", finalThought: "" });

  useEffect(() => {
    const loadData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      // Load saved outline
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

      // Load thesis from module 3 if no outline yet
if (!data?.outline?.thesis) {
  const { data: mod3, error: mod3error } = await supabase
    .from("module3_responses")
    .select("thesis")
    .eq("user_email", email)
    .order("created_at", { ascending: false })
    .limit(1);

  if (mod3?.length && mod3[0]?.thesis) {
    setThesis(mod3[0].thesis);
  }
}


      // Load buckets from Module 4 if no body yet
      if (!data?.outline?.body?.length) {
        const { data: bucketsData, error: bucketError } = await supabase
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

  // Auto-save
  useEffect(() => {
    const saveData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const outlineData = {
        thesis,
        body: outline,
        conclusion,
      };

      const { error } = await supabase.from("student_outlines").upsert({
        user_email: email,
        module: 5,
        outline: outlineData,
        updated_at: new Date().toISOString(),
      });

      if (error) console.error("Error saving outline:", error);
    };

    saveData();
  }, [thesis, outline, conclusion, session]);

  const updatePoint = (i, j, value) => {
    const updated = [...outline];
    updated[i].points[j] = value;
    setOutline(updated);
  };

  return (
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

      {outline.map((section, i) => (
        <div key={i} className="mb-4 border rounded p-4 bg-white shadow">
          <h2 className="font-bold text-blue-700 mb-2">
            {`Body Paragraph ${i + 1}: ${section.bucket}`}
          </h2>
          {section.points.map((point, j) => (
            <input
              key={j}
              type="text"
              className="w-full mb-2 border p-2 rounded"
              placeholder={`Supporting Detail ${j + 1}`}
              value={point}
              onChange={(e) => updatePoint(i, j, e.target.value)}
            />
          ))}
        </div>
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
  );
}
