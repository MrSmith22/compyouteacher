"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ModuleOne from "@/components/ModuleOne";
import { logActivity } from "@/lib/logActivity";

export default function ModuleOnePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
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
    async function checkPromptDone() {
      if (!session?.user?.email) return;

      setChecking(true);

      try {
        const res = await fetch("/api/module1/prompt");
        const data = await res.json();

        if (!res.ok) {
          setChecking(false);
          return;
        }

        const hasParaphrase = !!data?.student_paraphrase?.trim();
        if (!hasParaphrase) {
          router.replace("/modules/1/prompt");
          return;
        }

        setChecking(false);
      } catch {
        setChecking(false);
      }
    }

    if (status === "authenticated") checkPromptDone();
  }, [session, status, router]);

  if (status === "loading" || checking) {
    return <p className="p-6">Loading…</p>;
  }

  return <ModuleOne />;
}