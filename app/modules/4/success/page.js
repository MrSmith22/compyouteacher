"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";

export default function Module4Success() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: 4,
    }).catch(() => {});
  }, [session?.user?.email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-theme-green">Module 4 Complete!</h1>

        <p className="text-lg text-theme-dark">
          Great job organizing your observations into buckets. You’re ready to move on.
        </p>

        <Link
          href="/modules/5"
          className="inline-block bg-theme-blue text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Start Module 5 →
        </Link>
      </div>
    </div>
  );
}