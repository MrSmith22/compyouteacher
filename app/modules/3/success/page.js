"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";

export default function Module3Success() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.email) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: 3,
    }).catch(() => {});
  }, [session?.user?.email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-theme-green">
          Module 3 complete!
        </h1>

        <p className="text-lg text-theme-dark">
          You grouped your evidence, developed a claim, and turned it into a thesis with proof
          directions. That argument is ready to become paragraph plans—not a fresh start.
        </p>

        <p className="text-sm text-theme-dark/80">
          In Module 4, you will plan each body paragraph one at a time: main idea, evidence,
          and reasoning tied to the thesis you already built.
        </p>

        <Link
          href="/modules/4"
          className="inline-block bg-theme-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition"
        >
          Continue to Module 4 — plan your paragraphs
        </Link>
      </div>
    </div>
  );
}
