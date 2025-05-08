"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";

export default function ModuleEight() {
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const fetchText = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const { data, error } = await supabase
        .from("student_drafts")
        .select("full_text, final_text, final_ready")
        .eq("user_email", email)
        .eq("module", 6)
        .single();

      console.log("Module 8 loaded:", data);

      if (data?.final_text) {
        setText(data.final_text);
      } else if (data?.full_text) {
        setText(data.full_text); // ✅ fallback path
      }

      if (data?.final_ready) setLocked(true);
    };

    fetchText();
  }, [session]);

  const saveFinalText = async () => {
    await supabase
      .from("student_drafts")
      .upsert({
        user_email: session.user.email,
        module: 6,
        final_text: text,
        final_ready: true,
        updated_at: new Date().toISOString(),
      });

    setLocked(true);
  };

  if (!session) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📝 Module 8: Final Polish</h1>
      <p className="text-sm text-gray-600 mb-4">
        This is your last chance to make final edits before formatting your essay in APA and exporting. Focus on clarity, grammar, and flow.
      </p>

      <textarea
        className="w-full min-h-[300px] border p-4 rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={locked}
      />

      {!locked ? (
        <button
          onClick={saveFinalText}
          className="bg-blue-700 text-white px-6 py-3 rounded shadow"
        >
          ✅ I'm Done Polishing – Lock and Continue
        </button>
      ) : (
        <div className="text-green-700 font-semibold">
          ✅ Final draft locked and ready for APA formatting.
        </div>
      )}
    </div>
  );
}
