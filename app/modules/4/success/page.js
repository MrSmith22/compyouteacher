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
        <h1 className="text-3xl font-extrabold text-theme-green">
          Module 4 complete!
        </h1>

        <p className="text-lg text-theme-dark">
          You turned your thesis and evidence into paragraph plans—each with a main idea,
          supporting quotes, and reasoning that connects back to your argument.
        </p>

        <p className="text-sm text-theme-dark/80">
          In Module 5, you will arrange those paragraph plans into a full outline and plan
          your conclusion—the map you will draft from in Module 6.
        </p>

        <Link
          href="/modules/5"
          className="inline-block bg-theme-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition"
        >
          Continue to Module 5 — organize your outline
        </Link>
      </div>
    </div>
  );
}
