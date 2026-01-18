"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import ModuleOne from "@/components/ModuleOne"; // ✅ correct path
import { logActivity } from "@/lib/logActivity";
import { supabase } from "@/lib/supabaseClient";

export default function ModuleOnePage() {
  const { data: session, status } = useSession();
  const didInitRef = useRef(false);

  useEffect(() => {
    // Log that the student started Module 1
    async function logStart() {
      if (!session?.user?.email) return;

      try {
        await logActivity(session.user.email, "module_started", {
          module: 1,
        });
      } catch (err) {
        console.error("Error logging module 1 start:", err);
      }
    }

    logStart();
  }, [session]);

  useEffect(() => {
    // Initialize assignment record for progress tracking (runs once per student)
    async function initAssignment() {
      if (!session?.user?.email || didInitRef.current) return;
      didInitRef.current = true;

      try {
        const { data: existing, error } = await supabase
          .from("student_assignments")
          .select("id")
          .eq("user_email", session.user.email)
          .eq("assignment_name", "mlk_rhetorical_analysis")
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.warn("Error checking assignment row:", error);
          return;
        }

        if (existing?.id) return;

        await fetch("/api/assignments/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignment_name: "mlk_rhetorical_analysis",
            resume_path: "/modules/1",
          }),
        });
      } catch {
        // Fail silently if anything goes wrong
      }
    }

    initAssignment();
  }, [session]);

  if (status === "loading") {
    return <p className="p-6">Loading…</p>;
  }

  // Render your existing Module 1 UI
  return <ModuleOne />;
}