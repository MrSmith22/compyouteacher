"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import ModuleOne from "@/components/ModuleOne"; // ✅ correct path
import { logActivity } from "@/lib/logActivity";

export default function ModuleOnePage() {
  const { data: session, status } = useSession();

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

  if (status === "loading") {
    return <p className="p-6">Loading…</p>;
  }

  // Render your existing Module 1 UI
  return <ModuleOne />;
}