// app/modules/7/success/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";

export default function ModuleSevenSuccess() {
  const { data: session } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!session?.user?.email) return;
      try {
        await advanceCurrentModuleOnSuccess({
          userEmail: session.user.email,
          completedModuleNumber: 7,
        });
        setReady(true);
      } catch {
        setReady(true);
      }
    };
    run();
  }, [session?.user?.email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-theme-green">
          Module 7 complete!
        </h1>

        <p className="text-lg text-theme-dark">
          You finished writing your essay—reading it aloud, revising every section,
          and polishing your wording. Your writing is complete.
        </p>

        <p className="text-sm text-theme-dark/80">
          In Module 8, you will prepare your essay for submission—creating your
          Google Doc and formatting your paper for your reader.
        </p>

        {!ready ? (
          <p className="text-sm text-gray-600">Saving your progress…</p>
        ) : null}

        {ready ? (
          <Link
            href="/modules/8"
            className="inline-block bg-theme-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition"
          >
            Continue to Module 8 — prepare your essay for submission
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-block bg-gray-300 text-gray-600 px-6 py-2 rounded shadow cursor-not-allowed"
          >
            Continue to Module 8 — prepare your essay for submission
          </button>
        )}
      </div>
    </div>
  );
}
