// app/modules/6/success/page.js
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";

export default function ModuleSixSuccess() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: 6,
    }).catch(() => {});
  }, [session?.user?.email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <h1 className="text-2xl font-bold text-theme-green">Module 6 complete</h1>

        <p className="text-lg text-theme-dark">
          You turned your outline into a first draft. In Module 7, you will
          revise and strengthen that prose—not start over.
        </p>

        <Link
          href="/modules/7"
          className="inline-block bg-theme-blue text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Start Module 7 — revise your draft
        </Link>
      </div>
    </div>
  );
}