"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";

export default function Module1Success() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const scoreParam = params.get("score");
  const score = scoreParam && scoreParam !== "-" ? scoreParam : null;

  useEffect(() => {
    if (!session?.user?.email) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: 1,
    }).catch(() => {});
  }, [session?.user?.email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-theme-green">
          Module 1 complete!
        </h1>

        <p className="text-lg text-theme-dark">
          You explained what the essay is asking you to do and checked your understanding of
          ethos, pathos, and logos—the vocabulary you will use when you analyze King&apos;s
          speech and letter.
        </p>

        <p className="text-sm text-theme-dark/80">
          In Module 2, you will save working copies of both texts and collect evidence you can
          build on—not start over.
        </p>

        {score ? (
          <p className="text-sm text-theme-dark">
            Quiz score:{" "}
            <span className="font-bold text-theme-blue">{score}%</span>
          </p>
        ) : null}

        <Link
          href="/modules/2"
          className="inline-block bg-theme-blue hover:bg-blue-800 text-white px-6 py-2 rounded shadow transition"
        >
          Continue to Module 2 — save your source texts
        </Link>
      </div>
    </div>
  );
}
