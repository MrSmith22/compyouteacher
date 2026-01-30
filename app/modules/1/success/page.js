"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";

export default function Module1Success() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const score = params.get("score") ?? "-";

  useEffect(() => {
    if (!session?.user?.email) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: 1,
    }).catch(() => {});
  }, [session?.user?.email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow rounded-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-theme-green">
          Module 1 Complete!
        </h1>

        <p className="text-lg text-theme-dark">
          Your quiz score:{" "}
          <span className="font-bold text-theme-blue">{score}%</span>
        </p>

        <Link
          href="/modules/2"
          className="inline-block bg-theme-blue hover:bg-blue-800 text-white px-6 py-2 rounded shadow transition"
        >
          Start Module 2 →
        </Link>
      </div>
    </div>
  );
}