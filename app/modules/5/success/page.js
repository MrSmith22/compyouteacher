"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";

export default function ModuleFiveSuccess() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: 5,
    }).catch(() => {});
  }, [session?.user?.email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <div className="text-5xl">🎉</div>

        <h1 className="text-3xl font-bold text-theme-green">
          Module 5 Complete!
        </h1>

        <p className="text-lg text-theme-dark">
          Great work finalizing your outline! You’re ready to start drafting your essay.
        </p>

        <Link
          href="/modules/6"
          className="inline-block bg-theme-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition"
        >
          Start Module 6 →
        </Link>
      </div>
    </div>
  );
}