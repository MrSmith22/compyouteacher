"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { logActivity } from "../lib/logActivity";

export default function ModuleEight() {
  const { data: session } = useSession();
  const router = useRouter();

  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);
  const email = session?.user?.email ?? null;

  const hasLoggedStartRef = useRef(false);

  const getTextMetrics = (value) => {
    const raw = typeof value === "string" ? value : text;
    const words = raw
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return {
      wordCount: words,
      charCount: raw.length,
    };
  };

  useEffect(() => {
    const load = async () => {
      if (!email) return;

      // 1) Read from Module 7 (where the “final text” lives after revise)
      const { data: m7, error: m7err } = await supabase
        .from("student_drafts")
        .select("full_text, final_text, final_ready")
        .eq("user_email", email)
        .eq("module", 7)
        .maybeSingle();

      if (m7err) console.error("Module 7 fetch error:", m7err);

      // Prefer module 7's final_text; fallback to full_text
      const draft = m7?.final_text || m7?.full_text || "";
      setText(draft);

      // 2) Also check if Module 8 already locked
      const { data: m8, error: m8err } = await supabase
        .from("student_drafts")
        .select("final_ready, final_text")
        .eq("user_email", email)
        .eq("module", 8)
        .maybeSingle();

      if (m8err) console.error("Module 8 fetch error:", m8err);

      if (m8?.final_ready) {
        setLocked(true);
        // If Module 8 is already locked, show its saved text
        if (m8?.final_text) setText(m8.final_text);
      }

      // Log module_started once per visit (after we know what text they see)
      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        if (email) {
          const metrics = getTextMetrics(draft || m8?.final_text || "");
          logActivity(email, "module_started", {
            module: 8,
            from_module7_final: !!m7?.final_text,
            module8_already_locked: !!m8?.final_ready,
            ...metrics,
          });
        }
      }
    };

    load();
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveAndLock = async () => {
    if (!email) return;

    // Write a row specifically for Module 8 and lock it
    const { error } = await supabase.from("student_drafts").upsert({
      user_email: email,
      module: 8,
      full_text: text, // keep a copy
      final_text: text, // lock this as final for M8
      revised: false,
      final_ready: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Module 8 save error:", error);
      alert("Save failed.");
      return;
    }

    setLocked(true);

    // Log completion with word / character counts
    const metrics = getTextMetrics();
    await logActivity(email, "module_completed", {
      module: 8,
      ...metrics,
    });

    router.push("/modules/8/success");
  };

  if (!session) {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Please sign in</h1>
        <a
          className="inline-block bg-theme-blue text-white px-4 py-2 rounded"
          href="/api/auth/signin"
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-theme-blue">
        📝 Module 8: Final Polish
      </h1>

      <p className="text-md text-gray-700 mb-4">
        Make last tweaks before formatting and exporting. When ready, lock this
        module.
      </p>

      <textarea
        className="w-full min-h-[300px] border p-4 rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={locked}
      />

      {!locked ? (
        <button
          onClick={saveAndLock}
          className="bg-theme-blue hover:bg-blue-800 text-white px-6 py-3 rounded shadow"
        >
          ✅ Lock Module 8 & Continue
        </button>
      ) : (
        <div className="text-theme-green font-semibold">
          ✅ Module 8 locked and ready for APA formatting.
        </div>
      )}
    </div>
  );
}