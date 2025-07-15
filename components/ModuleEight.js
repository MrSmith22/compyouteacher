"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function ModuleEight() {
  const { data: session } = useSession();
  const router = useRouter();

  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const fetchText = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const { data } = await supabase
        .from("student_drafts")
        .select("full_text, final_text, final_ready, locked")
        .eq("user_email", email)
        .eq("module", 6)
        .single();

      if (data?.final_text) {
        setText(data.final_text);
      } else if (data?.full_text) {
        setText(data.full_text);
      }

      if (data?.final_ready || data?.locked) setLocked(true);
    };

    fetchText();
  }, [session]);

  const saveDraft = async ({ finalized = false } = {}) => {
    const email = session?.user?.email;
    if (!email) return;

    await supabase.from("student_drafts").upsert({
      user_email: email,
      module: 6,
      full_text: text,
      final_text: finalized ? text : null,
      final_ready: finalized,
      locked: finalized,
      updated_at: new Date().toISOString()
    });

    if (finalized) {
      setLocked(true);
      router.push("/modules/8/success");
    } else {
      alert("Draft saved. You can continue editing or finalize.");
    }
  };

  const unlockDraft = async () => {
    const email = session?.user?.email;
    if (!email) return;

    await supabase.from("student_drafts").upsert({
      user_email: email,
      module: 6,
      full_text: text,
      final_text: null,
      final_ready: false,
      locked: false,
      updated_at: new Date().toISOString()
    });

    setLocked(false);
  };

  if (!session) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-theme-blue">📝 Module 8: Final Polish</h1>

      <p className="text-md text-gray-700 mb-4">
        This is your last chance to make final edits before formatting your essay in APA and exporting.
        Focus on clarity, grammar, and flow.
      </p>

      <textarea
        className="w-full min-h-[300px] border p-4 rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={locked}
      />

      <div className="flex flex-wrap gap-4 mt-6">
        <button
          onClick={() => saveDraft()}
          disabled={locked}
          className={`bg-theme-blue hover:bg-blue-800 text-white px-6 py-3 rounded shadow ${
            locked ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          💾 Save Draft
        </button>

        <button
          onClick={() => saveDraft({ finalized: true })}
          disabled={locked}
          className={`bg-theme-orange text-white px-6 py-3 rounded shadow ${
            locked ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          🚀 Finalize & Continue
        </button>

        <button
          onClick={unlockDraft}
          className="bg-theme-green text-white px-6 py-3 rounded shadow"
        >
          🔓 Unlock Draft for Editing
        </button>
      </div>

      {locked && (
        <div className="text-theme-green font-semibold mt-4">
          ✅ Final draft locked. You can unlock to make changes.
        </div>
      )}
    </div>
  );
}